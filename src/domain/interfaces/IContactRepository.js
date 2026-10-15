/**
 * ============================================================================
 * ARCHIVO: src/domain/interfaces/IContactRepository.js
 * DESCRIPCIÓN: Contrato de interfaz para repositorios de persistencia de contactos.
 * PRINCIPIO SOLID: Interface Segregation (ISP) & Dependency Inversion (DIP)
 *   - Define las operaciones indispensables para acceder y modificar contactos,
 *     desacoplando los servicios de si la persistencia es Supabase, PostgreSQL o Memoria.
 * ============================================================================
 */

export class IContactRepository {
  /**
   * Obtiene todos los contactos registrados en la base de datos.
   * @param {Object} [filters]
   * @param {string} [filters.category] - Filtrar por clasificación (ej. "Reinas").
   * @param {string} [filters.search] - Búsqueda por texto (nombre o teléfono).
   * @returns {Promise<Array<import('../entities/Contact').Contact>>}
   */
  async findAll(filters = {}) {
    throw new Error('Método findAll() no implementado.');
  }

  /**
   * Busca un contacto específico por su número telefónico.
   * @param {string} phone - Teléfono normalizado.
   * @returns {Promise<import('../entities/Contact').Contact|null>}
   */
  async findByPhone(phone) {
    throw new Error('Método findByPhone() no implementado.');
  }

  /**
   * Busca un contacto por su identificador UUID.
   * @param {string} id - UUID del contacto.
   * @returns {Promise<import('../entities/Contact').Contact|null>}
   */
  async findById(id) {
    throw new Error('Método findById() no implementado.');
  }

  /**
   * Guarda o actualiza un contacto en el almacén de datos.
   * @param {import('../entities/Contact').Contact} contact
   * @returns {Promise<import('../entities/Contact').Contact>}
   */
  async save(contact) {
    throw new Error('Método save() no implementado.');
  }

  /**
   * Inserta un lote de contactos (ej. provenientes de Excel).
   * @param {Array<import('../entities/Contact').Contact>} contacts
   * @returns {Promise<{ inserted: number, updated: number, total: number }>}
   */
  async saveBatch(contacts) {
    throw new Error('Método saveBatch() no implementado.');
  }

  /**
   * Actualiza masivamente la clasificación de una lista de teléfonos.
   * @param {Array<string>} phones - Lista de teléfonos a clasificar.
   * @param {string} category - Nueva categoría (ej. "Reinas").
   * @returns {Promise<{ count: number }>}
   */
  async updateCategoryBulk(phones, category) {
    throw new Error('Método updateCategoryBulk() no implementado.');
  }

  /**
   * Elimina un contacto por su ID.
   * @param {string} id
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    throw new Error('Método delete() no implementado.');
  }
}
