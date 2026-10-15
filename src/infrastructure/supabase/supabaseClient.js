/**
 * ============================================================================
 * ARCHIVO: src/infrastructure/supabase/supabaseClient.js
 * DESCRIPCIÓN: Cliente centralizado de conexión a Supabase (PostgreSQL + Realtime).
 * PRINCIPIO SOLID: Single Responsibility Principle (SRP)
 *   - Responsabilidad única: Crear y gestionar la instancia única (Singleton)
 *     de comunicación con Supabase, detectando si las credenciales están activas.
 * ============================================================================
 */

import { createClient } from '@supabase/supabase-js';

// Obtenemos variables de entorno públicas
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Determinamos si Supabase está debidamente configurado con credenciales válidas
export const isSupabaseConfigured = () => {
  return (
    typeof supabaseUrl === 'string' &&
    supabaseUrl.trim().startsWith('http') &&
    typeof supabaseAnonKey === 'string' &&
    supabaseAnonKey.trim().length > 15
  );
};

// Variable para almacenar la instancia singleton
let supabaseInstance = null;

/**
 * Obtiene la instancia activa de Supabase.
 * @returns {import('@supabase/supabase-js').SupabaseClient | null}
 */
export function getSupabaseClient() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    });
  }

  return supabaseInstance;
}
