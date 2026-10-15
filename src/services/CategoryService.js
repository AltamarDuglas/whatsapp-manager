/**
 * ============================================================================
 * ARCHIVO: src/services/CategoryService.js
 * DESCRIPCIÓN: Servicio para gestionar categorías de contactos ("Reinas", "VIP", etc.).
 * PRINCIPIO SOLID: Single Responsibility Principle (SRP)
 * ============================================================================
 */

import { Category } from '../domain/entities/Category';
import { isSupabaseConfigured, getSupabaseClient } from '../infrastructure/supabase/supabaseClient';

const defaultCategories = [
  new Category({ id: 'cat-1', name: 'Reinas', color: '#ec4899', description: 'Candidatas, soberanas y delegaciones de certámenes' }),
  new Category({ id: 'cat-2', name: 'VIP', color: '#f59e0b', description: 'Autoridades, gabinete e invitados especiales' }),
  new Category({ id: 'cat-3', name: 'Secretaría', color: '#3b82f6', description: 'Equipo administrativo y secretaría técnica' }),
  new Category({ id: 'cat-4', name: 'Líderes', color: '#10b981', description: 'Líderes comunitarios y voceros barriales' }),
  new Category({ id: 'cat-5', name: 'General', color: '#6b7280', description: 'Ciudadanía y contactos generales' })
];

export class CategoryService {
  /**
   * Obtiene la lista de categorías disponibles desde Supabase o lista predeterminada.
   * @returns {Promise<Array<Category>>}
   */
  async getCategories() {
    if (isSupabaseConfigured()) {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from('categories')
        .select('*')
        .order('name', { ascending: true });

      if (!error && data && data.length > 0) {
        return data.map(
          (c) =>
            new Category({
              id: c.id,
              name: c.name,
              color: c.color,
              description: c.description,
              createdAt: c.created_at
            })
        );
      }
    }

    return defaultCategories;
  }

  /**
   * Crea una nueva categoría.
   * @param {Object} params
   * @param {string} params.name
   * @param {string} [params.color]
   * @param {string} [params.description]
   * @returns {Promise<Category>}
   */
  async createCategory({ name, color = '#8b5cf6', description = '' }) {
    if (!name || !name.trim()) {
      throw new Error('El nombre de la categoría es requerido.');
    }

    const trimmed = name.trim();

    if (isSupabaseConfigured()) {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from('categories')
        .insert({ name: trimmed, color, description })
        .select()
        .single();

      if (error) throw error;
      return new Category({
        id: data.id,
        name: data.name,
        color: data.color,
        description: data.description,
        createdAt: data.created_at
      });
    }

    const newCat = new Category({
      id: `cat-${Date.now()}`,
      name: trimmed,
      color,
      description
    });
    defaultCategories.push(newCat);
    return newCat;
  }
}
