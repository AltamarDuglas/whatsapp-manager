/**
 * ============================================================================
 * ARCHIVO: src/domain/entities/Contact.js
 * DESCRIPCIÓN: Entidad de dominio que representa a un Contacto registrado.
 * PRINCIPIO SOLID: Single Responsibility Principle (SRP)
 *   - Responsabilidad única: Encapsular el estado, validación y normalización
 *     de los datos de un contacto (teléfono, nombre, categoría "Reinas", metadatos).
 * ============================================================================
 */

export class Contact {
  /**
   * Constructor de la entidad Contacto.
   * @param {Object} params
   * @param {string} [params.id] - Identificador único UUID en base de datos.
   * @param {string} params.phone - Teléfono normalizado con código de país (ej. "573001234567").
   * @param {string} params.name - Nombre completo del contacto.
   * @param {string} [params.category] - Clasificación (ej: "Reinas", "VIP", "Secretaría").
   * @param {string} [params.notes] - Observaciones o notas internas del contacto.
   * @param {Object} [params.customFields] - Variables dinámicas adicionales del Excel.
   * @param {string} [params.createdAt] - Fecha de creación ISO.
   * @param {string} [params.updatedAt] - Fecha de última actualización ISO.
   */
  constructor({
    id = null,
    phone,
    name,
    category = 'General',
    notes = '',
    customFields = {},
    createdAt = new Date().toISOString(),
    updatedAt = new Date().toISOString()
  }) {
    // Validamos que el teléfono exista y sea un valor tratable
    if (!phone || String(phone).trim() === '') {
      throw new Error('El contacto debe tener un número de teléfono obligatorio.');
    }

    // Normalizamos el teléfono eliminando caracteres no numéricos
    this.id = id;
    this.phone = String(phone).replace(/\D/g, '');
    this.name = (name && String(name).trim()) || `Contacto (+${this.phone})`;
    this.category = (category && String(category).trim()) || 'General';
    this.notes = notes || '';
    this.customFields = customFields || {};
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  /**
   * Determina si el contacto pertenece a una categoría dada (ej: "Reinas").
   * @param {string} targetCategory - Nombre de la categoría a consultar.
   * @returns {boolean}
   */
  hasCategory(targetCategory) {
    if (!targetCategory || targetCategory === 'Todos') return true;
    return this.category.toLowerCase() === targetCategory.toLowerCase();
  }

  /**
   * Actualiza la clasificación del contacto.
   * @param {string} newCategory - Nueva categoría asignada.
   */
  setCategory(newCategory) {
    this.category = (newCategory && String(newCategory).trim()) || 'General';
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Retorna una representación serializable a JSON o base de datos.
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      phone: this.phone,
      name: this.name,
      category: this.category,
      notes: this.notes,
      custom_fields: this.customFields,
      created_at: this.createdAt,
      updated_at: this.updatedAt
    };
  }
}
