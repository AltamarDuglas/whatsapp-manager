/**
 * ============================================================================
 * ARCHIVO: src/services/ChatService.js
 * DESCRIPCIÓN: Servicio de atención de chats con filtrado exclusivo por base de datos,
 *              clasificación de contactos (ej: "Reinas") y respuesta por operadores.
 * PRINCIPIO SOLID: Single Responsibility (SRP) & Dependency Inversion (DIP)
 * ============================================================================
 */

import { Message } from '../domain/entities/Message';
import { getContactRepository, getMessageRepository } from '../infrastructure/repositories';
import { getMessagingProvider } from '../infrastructure/providers';

export class ChatService {
  /**
   * Constructor del servicio de chats.
   * @param {Object} [dependencies]
   * @param {import('../domain/interfaces/IContactRepository').IContactRepository} [dependencies.contactRepo]
   * @param {import('../domain/interfaces/IMessageRepository').IMessageRepository} [dependencies.messageRepo]
   */
  constructor({ contactRepo = null, messageRepo = null } = {}) {
    this.contactRepo = contactRepo || getContactRepository();
    this.messageRepo = messageRepo || getMessageRepository();
  }

  /**
   * REGLA DE NEGOCIO PRINCIPAL SOLICITADA:
   * Lista conversaciones EXCLUSIVAMENTE para los números que están registrados
   * en la base de datos de contactos, permitiendo filtrar por clasificación (ej. "Reinas").
   * 
   * @param {Object} [filters]
   * @param {string} [filters.category] - Filtrar por clasificación (ej: "Reinas", "VIP", "Todos").
   * @param {string} [filters.search] - Búsqueda por nombre o teléfono.
   * @returns {Promise<Array<Object>>} Lista enriquecida de conversaciones activas autorizadas.
   */
  async listFilteredChats(filters = {}) {
    // 1. Obtenemos los contactos autorizados que cumplen con el filtro de categoría y búsqueda
    const contacts = await this.contactRepo.findAll({
      category: filters.category,
      search: filters.search
    });

    // Si no hay contactos registrados que cumplan la condición, retornamos lista vacía
    if (!contacts || contacts.length === 0) {
      return [];
    }

    // Mapa de contactos indexado por teléfono para enriquecimiento instantáneo O(1)
    const contactsByPhone = new Map();
    const allowedPhones = [];

    for (const contact of contacts) {
      contactsByPhone.set(contact.phone, contact);
      allowedPhones.push(contact.phone);
    }

    // 2. Consultamos mensajes recientes ÚNICAMENTE para la lista de teléfonos autorizados
    const recentChatData = await this.messageRepo.findRecentChatsForAllowedPhones(allowedPhones);

    // Conjunto de teléfonos con mensajes registrados
    const phonesWithMessages = new Set();
    const chatList = [];

    for (const chatItem of recentChatData) {
      const contact = contactsByPhone.get(chatItem.phone);
      if (contact) {
        phonesWithMessages.add(chatItem.phone);
        chatList.push({
          phone: chatItem.phone,
          contactId: contact.id,
          name: contact.name,
          category: contact.category,
          notes: contact.notes,
          customFields: contact.customFields,
          lastMessage: chatItem.lastMessage,
          lastMessageDirection: chatItem.lastMessageDirection,
          lastMessageAt: chatItem.lastMessageAt,
          unreadCount: chatItem.unreadCount || 0
        });
      }
    }

    // 3. También incluimos los contactos registrados que aún no tienen mensajes previos
    // para que el operador pueda iniciarles conversación si lo desea, pero al final de la lista
    for (const contact of contacts) {
      if (!phonesWithMessages.has(contact.phone)) {
        chatList.push({
          phone: contact.phone,
          contactId: contact.id,
          name: contact.name,
          category: contact.category,
          notes: contact.notes,
          customFields: contact.customFields,
          lastMessage: 'Sin mensajes previos',
          lastMessageDirection: null,
          lastMessageAt: null,
          unreadCount: 0
        });
      }
    }

    // 4. Ordenamos: primero los chats con mensajes más recientes
    return chatList.sort((a, b) => {
      const timeA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const timeB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return timeB - timeA;
    });
  }

  /**
   * Obtiene la cronología completa de mensajes de un chat, validando que el número esté registrado.
   * Marca automáticamente los mensajes recibidos como leídos.
   * 
   * @param {string} phone - Teléfono del chat.
   * @returns {Promise<{ contact: Object, messages: Array<Object> }>}
   */
  async getChatHistory(phone) {
    const cleanPhone = String(phone).replace(/\D/g, '');

    // Verificamos que el número pertenezca a la base de datos de contactos
    const contact = await this.contactRepo.findByPhone(cleanPhone);
    if (!contact) {
      throw new Error(`El número ${cleanPhone} no está registrado en la base de datos institucional.`);
    }

    // Obtenemos los mensajes del hilo
    const messages = await this.messageRepo.findByPhone(cleanPhone);

    // Marcamos mensajes como leídos
    await this.messageRepo.markAsRead(cleanPhone);

    return {
      contact: contact.toJSON(),
      messages: messages.map((m) => m.toJSON())
    };
  }

  /**
   * Envía una respuesta al chat seleccionado y la almacena en la base de datos.
   * Permite que "alguien más los pueda responder" registrando el autor.
   * 
   * @param {Object} params
   * @param {string} params.phone - Teléfono del destinatario registrado.
   * @param {string} params.content - Texto de la respuesta.
   * @param {string} [params.repliedBy='Operador'] - Nombre de quien responde.
   * @param {string} [params.providerPreference='auto'] - Proveedor de envío.
   * @returns {Promise<Object>} Mensaje guardado y resultado del despacho.
   */
  async replyMessage({
    phone,
    content,
    repliedBy = 'Operador Secretaría',
    providerPreference = 'auto'
  }) {
    const cleanPhone = String(phone).replace(/\D/g, '');

    // 1. Verificamos que el destinatario esté en la base de datos
    const contact = await this.contactRepo.findByPhone(cleanPhone);
    if (!contact) {
      throw new Error(`No se puede responder: el número ${cleanPhone} no está registrado en la base de datos.`);
    }

    if (!content || !String(content).trim()) {
      throw new Error('El mensaje de respuesta no puede estar vacío.');
    }

    // 2. Despachamos el mensaje a través del proveedor de WhatsApp
    const provider = getMessagingProvider(providerPreference);
    const dispatchResult = await provider.sendMessage(cleanPhone, content);

    // 3. Persistimos el mensaje en la base de datos vinculado al contacto
    const message = new Message({
      contactId: contact.id,
      phone: cleanPhone,
      direction: 'outbound',
      content: content.trim(),
      status: dispatchResult.success ? 'delivered' : 'failed',
      senderName: repliedBy,
      repliedBy: repliedBy,
      metadata: {
        provider: provider.getName(),
        messageId: dispatchResult.messageId || null,
        error: dispatchResult.error || null
      }
    });

    const savedMessage = await this.messageRepo.save(message);

    return {
      message: savedMessage.toJSON(),
      dispatch: dispatchResult
    };
  }

  /**
   * Modifica y guarda la clasificación de un contacto (ej: cambiar a "Reinas").
   * 
   * @param {string} phone - Teléfono del contacto.
   * @param {string} category - Nueva clasificación (ej. "Reinas").
   * @returns {Promise<Object>} Contacto actualizado.
   */
  async updateContactCategory(phone, category) {
    const cleanPhone = String(phone).replace(/\D/g, '');
    const contact = await this.contactRepo.findByPhone(cleanPhone);
    if (!contact) {
      throw new Error(`Contacto con teléfono ${cleanPhone} no encontrado.`);
    }

    contact.setCategory(category);
    const updated = await this.contactRepo.save(contact);
    return updated.toJSON();
  }
}
