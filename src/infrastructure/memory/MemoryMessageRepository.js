/**
 * ============================================================================
 * ARCHIVO: src/infrastructure/memory/MemoryMessageRepository.js
 * DESCRIPCIÓN: Repositorio en memoria con los mensajes del Reinado del Río 2026.
 * PRINCIPIO SOLID: Liskov Substitution Principle (LSP)
 * ============================================================================
 */

import { IMessageRepository } from '../../domain/interfaces/IMessageRepository';
import { Message } from '../../domain/entities/Message';

let memoryMessages = [
  // Conversación con Laura Vanessa Reyes Guzmán (+57 301 3452961) - Reinas
  new Message({
    id: 'm-lv-1',
    contactId: 'c-reina-1',
    phone: '573013452961',
    direction: 'inbound',
    content: 'holaaa',
    status: 'read',
    senderName: 'Laura Vanessa Reyes Guzmán',
    createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString()
  }),
  new Message({
    id: 'm-lv-2',
    contactId: 'c-reina-1',
    phone: '573013452961',
    direction: 'outbound',
    content: 'Holis',
    status: 'delivered',
    senderName: 'Secretaría',
    repliedBy: 'Operador Secretaría',
    createdAt: new Date(Date.now() - 44 * 60 * 1000).toISOString()
  }),
  new Message({
    id: 'm-lv-3',
    contactId: 'c-reina-1',
    phone: '573013452961',
    direction: 'inbound',
    content: 'me puedes mandar lista de quienes respondieron que todo bien porfis',
    status: 'read',
    senderName: 'Laura Vanessa Reyes Guzmán',
    createdAt: new Date(Date.now() - 40 * 60 * 1000).toISOString()
  }),
  new Message({
    id: 'm-lv-4',
    contactId: 'c-reina-1',
    phone: '573013452961',
    direction: 'outbound',
    content: 'Okas, dejame termino de revisar',
    status: 'delivered',
    senderName: 'Secretaría',
    repliedBy: 'Operador Secretaría',
    createdAt: new Date(Date.now() - 35 * 60 * 1000).toISOString()
  }),
  new Message({
    id: 'm-lv-5',
    contactId: 'c-reina-1',
    phone: '573013452961',
    direction: 'inbound',
    content: 'Gracias',
    status: 'read',
    senderName: 'Laura Vanessa Reyes Guzmán',
    createdAt: new Date(Date.now() - 34 * 60 * 1000).toISOString()
  }),
  new Message({
    id: 'm-lv-6',
    contactId: 'c-reina-1',
    phone: '573013452961',
    direction: 'inbound',
    content: 'Buenas tardes.\nAgradezco enormemente que me hayan escogido para representar al barrio. Lamento informarles que por un inconveniente surgido con mi trabajo. Al estudiar y trabajar al mismo tiempo, no tengo la disponibilidad necesaria para participar.\nLes pido sinceras disculpas y muchas gracias por la oportunidad.',
    status: 'received',
    senderName: 'Laura Vanessa Reyes Guzmán',
    createdAt: new Date(Date.now() - 20 * 60 * 1000).toISOString()
  }),
  new Message({
    id: 'm-lv-7',
    contactId: 'c-reina-1',
    phone: '573013452961',
    direction: 'inbound',
    content: 'Las amarillas son las que han respondido, las rojas las que han dicho que no pueden',
    status: 'received',
    senderName: 'Laura Vanessa Reyes Guzmán',
    metadata: {
      hasAttachment: true,
      filename: 'INSCRIPCION_CANDIDATAS_REINADO_RIO_2026_FILTRADO_24.xlsx',
      filesize: '10 KB'
    },
    createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString()
  }),

  // Valentina Gómez (Reina Cívica)
  new Message({
    id: 'm-val-1',
    contactId: 'c-reina-2',
    phone: '573001234501',
    direction: 'inbound',
    content: '¡Hola Secretaría! Confirmada mi asistencia para la rueda de prensa inaugural.',
    status: 'received',
    senderName: 'Valentina Gómez',
    createdAt: new Date(Date.now() - 65 * 60 * 1000).toISOString()
  }),

  // Isabella Morales (Virreina)
  new Message({
    id: 'm-isa-1',
    contactId: 'c-reina-3',
    phone: '573001234503',
    direction: 'inbound',
    content: 'Hola equipo, tengo una duda sobre el vestuario para el desfile del río.',
    status: 'received',
    senderName: 'Isabella Morales',
    createdAt: new Date(Date.now() - 80 * 60 * 1000).toISOString()
  }),

  // Camila Restrepo
  new Message({
    id: 'm-cam-1',
    contactId: 'c-reina-4',
    phone: '573001234502',
    direction: 'inbound',
    content: 'Buenas tardes Secretaría, ¿nos compartirán el guión protocolario?',
    status: 'received',
    senderName: 'Camila Restrepo',
    createdAt: new Date(Date.now() - 95 * 60 * 1000).toISOString()
  }),

  // Dr. Carlos Mendoza (VIP)
  new Message({
    id: 'm-cm-1',
    contactId: 'c-vip-1',
    phone: '573109876543',
    direction: 'inbound',
    content: 'Estimado equipo, por favor confirmar el consolidado de inscripciones del reinado.',
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
      id: message.id || `m-${Date.now()}`
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
