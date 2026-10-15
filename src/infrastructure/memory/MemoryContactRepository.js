/**
 * ============================================================================
 * ARCHIVO: src/infrastructure/memory/MemoryContactRepository.js
 * DESCRIPCIÓN: Repositorio en memoria con datos semilla precargados.
 * PRINCIPIO SOLID: Liskov Substitution Principle (LSP)
 *   - Permite que la plataforma funcione de inmediato en modo local/demo
 *     o cuando aún no se han configurado las claves de Supabase.
 * ============================================================================
 */

import { IContactRepository } from '../../domain/interfaces/IContactRepository';
import { Contact } from '../../domain/entities/Contact';

// Almacén en memoria global para el ciclo de vida del proceso
let memoryContacts = [
  new Contact({
    id: 'c1111111-1111-1111-1111-111111111111',
    phone: '573001234501',
    name: 'Valentina Gómez (Reina Central)',
    category: 'Reinas',
    notes: 'Reina del Certamen Departamental 2026. Requiere confirmación de agenda.',
    customFields: { cargo: 'Reina Central', municipio: 'Sede Principal' }
  }),
  new Contact({
    id: 'c2222222-2222-2222-2222-222222222222',
    phone: '573001234502',
    name: 'Camila Restrepo (Reina Cívica)',
    category: 'Reinas',
    notes: 'Candidata cívica. Solicitó vestuario para el desfile inaugural.',
    customFields: { cargo: 'Reina Cívica', municipio: 'Distrito Norte' }
  }),
  new Contact({
    id: 'c3333333-3333-3333-3333-333333333333',
    phone: '573001234503',
    name: 'Isabella Morales (Virreina)',
    category: 'Reinas',
    notes: 'Virreina del concurso. Atenta a itinerario de protocolo.',
    customFields: { cargo: 'Virreina', municipio: 'Distrito Sur' }
  }),
  new Contact({
    id: 'c4444444-4444-4444-4444-444444444444',
    phone: '573109876543',
    name: 'Dr. Carlos Mendoza (Secretario General)',
    category: 'VIP',
    notes: 'Secretario de Despacho. Coordinación de eventos masivos.',
    customFields: { cargo: 'Secretario General', dependencia: 'Despacho' }
  }),
  new Contact({
    id: 'c5555555-5555-5555-5555-555555555555',
    phone: '573155554433',
    name: 'Dra. María Fernanda López',
    category: 'Secretaría',
    notes: 'Coordinadora de comunicaciones institucionales.',
    customFields: { cargo: 'Coordinadora', dependencia: 'Prensa' }
  }),
  new Contact({
    id: 'c6666666-6666-6666-6666-666666666666',
    phone: '573204443322',
    name: 'Javier Peña (Líder Comuna 4)',
    category: 'Líderes',
    notes: 'Líder comunal. Seguimiento a proyecto deportivo.',
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

    return result.sort((a, b) => a.name.localeCompare(b.name));
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
      id: contact.id || `c-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
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
