/**
 * ============================================================================
 * ARCHIVO: src/infrastructure/memory/MemoryMessageRepository.js
 * DESCRIPCIÓN: Repositorio en memoria para mensajes con datos de prueba.
 * PRINCIPIO SOLID: Liskov Substitution Principle (LSP)
 *   - Implementa IMessageRepository asegurando la regla de listar SOLO números
 *     que se encuentren en la lista blanca de la base de datos de contactos.
 * ============================================================================
 */

import { IMessageRepository } from '../../domain/interfaces/IMessageRepository';
import { Message } from '../../domain/entities/Message';

let memoryMessages = [
  new Message({
    id: 'm1',
    contactId: 'c1111111-1111-1111-1111-111111111111',
    phone: '573001234501',
    direction: 'inbound',
    content: '¡Hola! Buenos días, ¿a qué hora debemos estar listas para la rueda de prensa de mañana?',
    status: 'received',
    senderName: 'Valentina Gómez',
    createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString()
  }),
  new Message({
    id: 'm2',
    contactId: 'c1111111-1111-1111-1111-111111111111',
    phone: '573001234501',
    direction: 'outbound',
    content: 'Hola Valentina, la cita es a las 8:30 AM en el auditorio principal del piso 3. ¡Te esperamos!',
    status: 'delivered',
    senderName: 'Operador Secretaría',
    repliedBy: 'Operador Secretaría',
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString()
  }),
  new Message({
    id: 'm3',
    contactId: 'c1111111-1111-1111-1111-111111111111',
    phone: '573001234501',
    direction: 'inbound',
    content: 'Perfecto, muchas gracias. Ya le aviso a las demás compañeras.',
    status: 'received',
    senderName: 'Valentina Gómez',
    createdAt: new Date(Date.now() - 4 * 60 * 1000).toISOString()
  }),
  new Message({
    id: 'm4',
    contactId: 'c2222222-2222-2222-2222-222222222222',
    phone: '573001234502',
    direction: 'inbound',
    content: 'Buenas tardes Secretaría, ¿nos compartirán el guión protocolario del desfile?',
    status: 'received',
    senderName: 'Camila Restrepo',
    createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString()
  }),
  new Message({
    id: 'm5',
    contactId: 'c3333333-3333-3333-3333-333333333333',
    phone: '573001234503',
    direction: 'inbound',
    content: 'Hola equipo, tengo una duda sobre el transporte del viernes, ¿pasan por nosotras al hotel?',
    status: 'received',
    senderName: 'Isabella Morales',
    createdAt: new Date(Date.now() - 35 * 60 * 1000).toISOString()
  }),
  new Message({
    id: 'm6',
    contactId: 'c4444444-4444-4444-4444-444444444444',
    phone: '573109876543',
    direction: 'inbound',
    content: 'Estimado equipo, por favor confirmar el envío del informe de los 200 mensajes masivos.',
    status: 'received',
    senderName: 'Dr. Carlos Mendoza',
    createdAt: new Date(Date.now() - 120 * 60 * 1000).toISOString()
  })
];

export class MemoryMessageRepository extends IMessageRepository {
  async findByPhone(phone) {
    const cleanPhone = String(phone).replace(/\D/g, '');
    return memoryMessages
      .filter((m) => m.phone === cleanPhone)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  /**
   * Solo lista chats correspondientes a teléfonos en la lista blanca de la base de datos.
   */
  async findRecentChatsForAllowedPhones(allowedPhones = []) {
    if (!allowedPhones || allowedPhones.length === 0) return [];

    const allowedSet = new Set(allowedPhones.map((p) => String(p).replace(/\D/g, '')));
    const filteredMessages = memoryMessages
      .filter((m) => allowedSet.has(m.phone))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const chatsMap = new Map();

    for (const msg of filteredMessages) {
      if (!chatsMap.has(msg.phone)) {
        chatsMap.set(msg.phone, {
          phone: msg.phone,
          contactId: msg.contactId,
          lastMessage: msg.content,
          lastMessageDirection: msg.direction,
          lastMessageAt: msg.createdAt,
          lastStatus: msg.status,
          unreadCount: 0
        });
      }

      if (msg.direction === 'inbound' && msg.status !== 'read') {
        const item = chatsMap.get(msg.phone);
        item.unreadCount += 1;
      }
    }

    return Array.from(chatsMap.values());
  }

  async save(message) {
    const newMsg = new Message({
      ...message.toJSON(),
      id: message.id || `m-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
    });
    memoryMessages.push(newMsg);
    return newMsg;
  }

  async markAsRead(phone) {
    const cleanPhone = String(phone).replace(/\D/g, '');
    let count = 0;
    memoryMessages = memoryMessages.map((m) => {
      if (m.phone === cleanPhone && m.direction === 'inbound') {
        m.status = 'read';
        count++;
      }
      return m;
    });
    return count;
  }
}
