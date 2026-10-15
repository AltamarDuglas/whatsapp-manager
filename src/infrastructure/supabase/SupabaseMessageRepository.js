/**
 * ============================================================================
 * ARCHIVO: src/infrastructure/supabase/SupabaseMessageRepository.js
 * DESCRIPCIÓN: Repositorio de persistencia de mensajes para Supabase PostgreSQL.
 * PRINCIPIO SOLID: Single Responsibility Principle (SRP) & Liskov Substitution (LSP)
 *   - Responsabilidad única: Consultar y persistir mensajes aplicando la regla
 *     de negocio de listar ÚNICAMENTE números autorizados en la base de datos.
 * ============================================================================
 */

import { IMessageRepository } from '../../domain/interfaces/IMessageRepository';
import { Message } from '../../domain/entities/Message';
import { getSupabaseClient } from './supabaseClient';

export class SupabaseMessageRepository extends IMessageRepository {
  /**
   * Constructor del repositorio de mensajes.
   * @param {import('@supabase/supabase-js').SupabaseClient} [client]
   */
  constructor(client = null) {
    super();
    this.client = client || getSupabaseClient();
  }

  /**
   * Obtiene la cronología completa de mensajes de un chat específico.
   * @param {string} phone
   * @returns {Promise<Array<Message>>}
   */
  async findByPhone(phone) {
    if (!this.client) throw new Error('Cliente Supabase no disponible.');
    const cleanPhone = String(phone).replace(/\D/g, '');

    const { data, error } = await this.client
      .from('messages')
      .select('*')
      .eq('phone', cleanPhone)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[SupabaseMessageRepository] Error en findByPhone:', error);
      throw error;
    }

    return (data || []).map(
      (m) =>
        new Message({
          id: m.id,
          contactId: m.contact_id,
          phone: m.phone,
          direction: m.direction,
          content: m.content,
          status: m.status,
          senderName: m.sender_name,
          repliedBy: m.replied_by,
          metadata: m.metadata,
          createdAt: m.created_at
        })
    );
  }

  /**
   * Obtiene el listado de hilos de chat recientes EXCLUSIVAMENTE para los números
   * registrados en la base de datos (Regla solicitada por el usuario).
   * 
   * @param {Array<string>} allowedPhones - Lista blanca de teléfonos registrados en contacts.
   * @returns {Promise<Array<Object>>}
   */
  async findRecentChatsForAllowedPhones(allowedPhones = []) {
    if (!this.client) throw new Error('Cliente Supabase no disponible.');

    // Si la lista de teléfonos autorizados está vacía, no devolvemos chats (regla estricta)
    if (!allowedPhones || allowedPhones.length === 0) {
      return [];
    }

    // Consultamos los mensajes recientes restringidos únicamente a la lista blanca
    const { data, error } = await this.client
      .from('messages')
      .select('*')
      .in('phone', allowedPhones)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[SupabaseMessageRepository] Error en findRecentChatsForAllowedPhones:', error);
      throw error;
    }

    // Agrupamos en memoria para obtener el último mensaje y el conteo de no leídos por cada teléfono
    const chatsMap = new Map();

    for (const msg of data || []) {
      if (!chatsMap.has(msg.phone)) {
        chatsMap.set(msg.phone, {
          phone: msg.phone,
          contactId: msg.contact_id,
          lastMessage: msg.content,
          lastMessageDirection: msg.direction,
          lastMessageAt: msg.created_at,
          lastStatus: msg.status,
          unreadCount: 0
        });
      }

      // Si es un mensaje entrante que no ha sido leído, incrementamos el contador
      if (msg.direction === 'inbound' && msg.status !== 'read') {
        const chat = chatsMap.get(msg.phone);
        chat.unreadCount += 1;
      }
    }

    return Array.from(chatsMap.values());
  }

  /**
   * Guarda un nuevo mensaje (inbound recibido u outbound enviado por el operador).
   * @param {Message} message
   * @returns {Promise<Message>}
   */
  async save(message) {
    if (!this.client) throw new Error('Cliente Supabase no disponible.');

    const payload = {
      contact_id: message.contactId,
      phone: message.phone,
      direction: message.direction,
      content: message.content,
      status: message.status || 'delivered',
      sender_name: message.senderName || '',
      replied_by: message.repliedBy || null,
      metadata: message.metadata || {}
    };

    const { data, error } = await this.client
      .from('messages')
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error('[SupabaseMessageRepository] Error al guardar mensaje:', error);
      throw error;
    }

    return new Message({
      id: data.id,
      contactId: data.contact_id,
      phone: data.phone,
      direction: data.direction,
      content: data.content,
      status: data.status,
      senderName: data.sender_name,
      repliedBy: data.replied_by,
      metadata: data.metadata,
      createdAt: data.created_at
    });
  }

  /**
   * Marca los mensajes de un número como leídos.
   * @param {string} phone
   * @returns {Promise<number>}
   */
  async markAsRead(phone) {
    if (!this.client) throw new Error('Cliente Supabase no disponible.');
    const cleanPhone = String(phone).replace(/\D/g, '');

    const { data, error } = await this.client
      .from('messages')
      .update({ status: 'read' })
      .eq('phone', cleanPhone)
      .eq('direction', 'inbound')
      .select('id');

    if (error) {
      console.error('[SupabaseMessageRepository] Error en markAsRead:', error);
      return 0;
    }

    return data?.length || 0;
  }
}
