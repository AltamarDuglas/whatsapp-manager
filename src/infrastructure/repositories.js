/**
 * ============================================================================
 * ARCHIVO: src/infrastructure/repositories.js
 * DESCRIPCIÓN: Factoría e inyección de dependencias para los repositorios.
 * PRINCIPIO SOLID: Dependency Inversion Principle (DIP) & Factory Pattern
 *   - Si Supabase está configurado (variables de entorno activas), inyecta
 *     los repositorios de Supabase; de lo contrario, inyecta la memoria simulada.
 * ============================================================================
 */

import { isSupabaseConfigured, getSupabaseClient } from './supabase/supabaseClient';
import { SupabaseContactRepository } from './supabase/SupabaseContactRepository';
import { SupabaseMessageRepository } from './supabase/SupabaseMessageRepository';
import { MemoryContactRepository } from './memory/MemoryContactRepository';
import { MemoryMessageRepository } from './memory/MemoryMessageRepository';

// Instancias compartidas
let contactRepoInstance = null;
let messageRepoInstance = null;

export function getContactRepository() {
  if (!contactRepoInstance) {
    if (isSupabaseConfigured()) {
      const client = getSupabaseClient();
      contactRepoInstance = new SupabaseContactRepository(client);
    } else {
      contactRepoInstance = new MemoryContactRepository();
    }
  }
  return contactRepoInstance;
}

export function getMessageRepository() {
  if (!messageRepoInstance) {
    if (isSupabaseConfigured()) {
      const client = getSupabaseClient();
      messageRepoInstance = new SupabaseMessageRepository(client);
    } else {
      messageRepoInstance = new MemoryMessageRepository();
    }
  }
  return messageRepoInstance;
}
