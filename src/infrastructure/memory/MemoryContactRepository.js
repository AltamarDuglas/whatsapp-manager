/**
 * ============================================================================
 * ARCHIVO: src/infrastructure/memory/MemoryContactRepository.js
 * DESCRIPCIÓN: Repositorio en memoria con contactos del Reinado del Río 2026.
 * PRINCIPIO SOLID: Liskov Substitution Principle (LSP)
 * ============================================================================
 */

import { IContactRepository } from '../../domain/interfaces/IContactRepository';
import { Contact } from '../../domain/entities/Contact';

let memoryContacts = [];

export class MemoryContactRepository extends IContactRepository {
  async findAll(filters = {}) {
    let result = [...memoryContacts];

    if (filters.category && filters.category !== 'Todos') {
      result = result.filter(
        (c) => c.category.toLowerCase() === filters.category.toLowerCase()
      );
    }

    if (filters.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      result = result.filter(
        (c) => c.name.toLowerCase().includes(q) || c.phone.includes(q)
      );
    }

    return result;
  }

  async findByPhone(phone) {
    const cleanPhone = String(phone).replace(/\D/g, '');
    return memoryContacts.find((c) => c.phone === cleanPhone) || null;
  }

  async findById(id) {
    return memoryContacts.find((c) => c.id === id) || null;
  }

  async save(contact) {
    const existingIndex = memoryContacts.findIndex((c) => c.phone === contact.phone);
    if (existingIndex >= 0) {
      memoryContacts[existingIndex] = contact;
      return contact;
    }
    const newContact = new Contact({
      ...contact.toJSON(),
      id: contact.id || `c-${Date.now()}`
    });
    memoryContacts.push(newContact);
    return newContact;
  }

  async saveBatch(contacts) {
    let count = 0;
    for (const c of contacts) {
      await this.save(c);
      count++;
    }
    return { inserted: count, total: contacts.length };
  }

  async updateCategoryBulk(phones, category) {
    const cleanPhones = phones.map((p) => String(p).replace(/\D/g, ''));
    let updated = 0;
    memoryContacts = memoryContacts.map((c) => {
      if (cleanPhones.includes(c.phone)) {
        c.setCategory(category);
        updated++;
      }
      return c;
    });
    return { count: updated };
  }

  async delete(id) {
    const initialLen = memoryContacts.length;
    memoryContacts = memoryContacts.filter((c) => c.id !== id);
    return memoryContacts.length < initialLen;
  }
}
