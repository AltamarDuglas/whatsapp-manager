/**
 * ============================================================================
 * ARCHIVO: src/infrastructure/supabase/SupabaseContactRepository.js
 * DESCRIPCIÓN: Implementación concreta de IContactRepository para Supabase PostgreSQL.
 * PRINCIPIO SOLID: Liskov Substitution Principle (LSP) & Single Responsibility (SRP)
 * ============================================================================
 */

import { IContactRepository } from '../../domain/interfaces/IContactRepository';
import { Contact } from '../../domain/entities/Contact';
import { getSupabaseClient } from './supabaseClient';

export class SupabaseContactRepository extends IContactRepository {
  /**
   * Constructor del repositorio.
   * @param {import('@supabase/supabase-js').SupabaseClient} [client]
   */
  constructor(client = null) {
    super();
    this.client = client || getSupabaseClient();
  }

  /**
   * Obtiene todos los contactos registrados con filtros opcionales.
   * @param {Object} [filters]
   * @param {string} [filters.category] - Filtrar por clasificación (ej. "Reinas").
   * @param {string} [filters.search] - Búsqueda por nombre o teléfono.
   * @returns {Promise<Array<Contact>>}
   */
  async findAll(filters = {}) {
    if (!this.client) throw new Error('Cliente Supabase no disponible.');

    let query = this.client
      .from('contacts')
      .select('*')
      .order('name', { ascending: true });

    // Filtro por clasificación (ej: "Reinas")
    if (filters.category && filters.category !== 'Todos') {
      query = query.eq('category', filters.category);
    }

    // Filtro por texto de búsqueda
    if (filters.search && filters.search.trim()) {
      const term = `%${filters.search.trim()}%`;
      query = query.or(`name.ilike.${term},phone.ilike.${term}`);
    }

    const { data, error } = await query;
    if (error) {
      console.error('[SupabaseContactRepository] Error en findAll:', error);
      throw error;
    }

    return (data || []).map(
      (item) =>
        new Contact({
          id: item.id,
          phone: item.phone,
          name: item.name,
          category: item.category,
          notes: item.notes,
          customFields: item.custom_fields,
          createdAt: item.created_at,
          updatedAt: item.updated_at
        })
    );
  }

  /**
   * Busca un contacto por número de teléfono.
   * @param {string} phone
   * @returns {Promise<Contact|null>}
   */
  async findByPhone(phone) {
    if (!this.client) throw new Error('Cliente Supabase no disponible.');
    const cleanPhone = String(phone).replace(/\D/g, '');

    const { data, error } = await this.client
      .from('contacts')
      .select('*')
      .eq('phone', cleanPhone)
      .maybeSingle();

    if (error) {
      console.error('[SupabaseContactRepository] Error en findByPhone:', error);
      throw error;
    }

    if (!data) return null;

    return new Contact({
      id: data.id,
      phone: data.phone,
      name: data.name,
      category: data.category,
      notes: data.notes,
      customFields: data.custom_fields,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    });
  }

  /**
   * Busca un contacto por UUID.
   * @param {string} id
   * @returns {Promise<Contact|null>}
   */
  async findById(id) {
    if (!this.client) throw new Error('Cliente Supabase no disponible.');

    const { data, error } = await this.client
      .from('contacts')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return new Contact({
      id: data.id,
      phone: data.phone,
      name: data.name,
      category: data.category,
      notes: data.notes,
      customFields: data.custom_fields,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    });
  }

  /**
   * Inserta o actualiza un contacto en Supabase.
   * @param {Contact} contact
   * @returns {Promise<Contact>}
   */
  async save(contact) {
    if (!this.client) throw new Error('Cliente Supabase no disponible.');

    const payload = {
      phone: contact.phone,
      name: contact.name,
      category: contact.category,
      notes: contact.notes,
      custom_fields: contact.customFields
    };

    const { data, error } = await this.client
      .from('contacts')
      .upsert(payload, { onConflict: 'phone' })
      .select()
      .single();

    if (error) {
      console.error('[SupabaseContactRepository] Error en save:', error);
      throw error;
    }

    return new Contact({
      id: data.id,
      phone: data.phone,
      name: data.name,
      category: data.category,
      notes: data.notes,
      customFields: data.custom_fields,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    });
  }

  /**
   * Guarda un lote masivo de contactos con deduplicación por teléfono.
   * @param {Array<Contact>} contacts
   * @returns {Promise<{ inserted: number, total: number }>}
   */
  async saveBatch(contacts) {
    if (!this.client) throw new Error('Cliente Supabase no disponible.');
    if (!contacts || contacts.length === 0) return { inserted: 0, total: 0 };

    const rows = contacts.map((c) => ({
      phone: c.phone,
      name: c.name,
      category: c.category || 'General',
      notes: c.notes || '',
      custom_fields: c.customFields || {}
    }));

    const { data, error } = await this.client
      .from('contacts')
      .upsert(rows, { onConflict: 'phone' })
      .select('id');

    if (error) {
      console.error('[SupabaseContactRepository] Error en saveBatch:', error);
      throw error;
    }

    return {
      inserted: data?.length || rows.length,
      total: rows.length
    };
  }

  /**
   * Actualiza en lote la clasificación de una lista de teléfonos.
   * @param {Array<string>} phones
   * @param {string} category
   * @returns {Promise<{ count: number }>}
   */
  async updateCategoryBulk(phones, category) {
    if (!this.client) throw new Error('Cliente Supabase no disponible.');
    const cleanPhones = phones.map((p) => String(p).replace(/\D/g, ''));

    const { data, error } = await this.client
      .from('contacts')
      .update({ category, updated_at: new Date().toISOString() })
      .in('phone', cleanPhones)
      .select('id');

    if (error) {
      console.error('[SupabaseContactRepository] Error en updateCategoryBulk:', error);
      throw error;
    }

    return { count: data?.length || cleanPhones.length };
  }

  /**
   * Elimina un contacto por ID.
   * @param {string} id
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    if (!this.client) throw new Error('Cliente Supabase no disponible.');

    const { error } = await this.client
      .from('contacts')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }
}
