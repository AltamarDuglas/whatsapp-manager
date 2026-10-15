/**
 * ============================================================================
 * ARCHIVO: src/infrastructure/memory/MemoryMessageRepository.js
 * DESCRIPCIÓN: Repositorio en memoria con los mensajes del Reinado del Río 2026.
 * PRINCIPIO SOLID: Liskov Substitution Principle (LSP)
 * ============================================================================
 */

import { IMessageRepository } from '../../domain/interfaces/IMessageRepository';
import { Message } from '../../domain/entities/Message';

let memoryMessages = [];

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
