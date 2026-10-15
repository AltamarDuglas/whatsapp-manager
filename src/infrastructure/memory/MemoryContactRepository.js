/**
 * ============================================================================
 * ARCHIVO: src/infrastructure/memory/MemoryContactRepository.js
 * DESCRIPCIÓN: Repositorio en memoria con contactos del Reinado del Río 2026.
 * PRINCIPIO SOLID: Liskov Substitution Principle (LSP)
 * ============================================================================
 */

import { IContactRepository } from '../../domain/interfaces/IContactRepository';
import { Contact } from '../../domain/entities/Contact';

let memoryContacts = [
  new Contact({
    id: 'c-reina-1',
    phone: '573013452961',
    name: 'Laura Vanessa Reyes Guzmán (Reina Central)',
    category: 'Reinas',
    notes: 'Candidata oficial Reinado del Río 2026. Seguimiento a disponibilidad.',
    customFields: { cargo: 'Candidata Barrio El Río', estado: 'Inscrita' }
  }),
  new Contact({
    id: 'c-reina-2',
    phone: '573001234501',
    name: 'Valentina Gómez (Reina Cívica)',
    category: 'Reinas',
    notes: 'Reina Cívica 2026. Confirmación de rueda de prensa.',
    customFields: { cargo: 'Reina Cívica', sector: 'Distrito Norte' }
  }),
  new Contact({
    id: 'c-reina-3',
    phone: '573001234503',
    name: 'Isabella Morales (Virreina)',
    category: 'Reinas',
    notes: 'Virreina del concurso. Itinerario de protocolo y desfile.',
    customFields: { cargo: 'Virreina', sector: 'Distrito Sur' }
  }),
  new Contact({
    id: 'c-reina-4',
    phone: '573001234502',
    name: 'Camila Restrepo (Candidata)',
    category: 'Reinas',
    notes: 'Candidata barrial. Consulta sobre guión protocolario.',
    customFields: { cargo: 'Candidata', sector: 'La Granja' }
  }),
  new Contact({
    id: 'c-vip-1',
    phone: '573109876543',
    name: 'Dr. Carlos Mendoza (Secretario General)',
    category: 'VIP',
    notes: 'Secretario de Despacho. Coordinación de eventos masivos.',
    customFields: { cargo: 'Secretario General', dependencia: 'Despacho' }
  }),
  new Contact({
    id: 'c-sec-1',
    phone: '573155554433',
    name: 'Dra. María Fernanda López',
    category: 'Secretaría',
    notes: 'Coordinadora de comunicaciones institucionales.',
    customFields: { cargo: 'Coordinadora', dependencia: 'Prensa' }
  }),
  new Contact({
    id: 'c-lid-1',
    phone: '573204443322',
    name: 'Javier Peña (Líder Comuna 4)',
    category: 'Líderes',
    notes: 'Líder comunal. Seguimiento a proyecto del reinado.',
    customFields: { comuna: 'Comuna 4', sector: 'El Triunfo' }
  })
];

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
