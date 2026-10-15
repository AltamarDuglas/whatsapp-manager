/**
 * ============================================================================
 * ARCHIVO: src/domain/entities/Category.js
 * DESCRIPCIÓN: Entidad de dominio que representa una clasificación de contactos.
 * PRINCIPIO SOLID: Single Responsibility Principle (SRP)
 *   - Responsabilidad única: Modelar los atributos y estilo de una etiqueta/categoría (ej: "Reinas").
 * ============================================================================
 */

export class Category {
  /**
   * Constructor de la categoría.
   * @param {Object} params
   * @param {string} [params.id] - Identificador único UUID.
   * @param {string} params.name - Nombre único (ej. "Reinas", "VIP", "Secretaría").
   * @param {string} [params.color] - Color hexadecimal para badges.
   * @param {string} [params.description] - Descripción de uso institucional.
   * @param {string} [params.createdAt] - Marca de tiempo ISO.
   */
  constructor({
    id = null,
    name,
    color = '#8b5cf6',
    description = '',
    createdAt = new Date().toISOString()
  }) {
    if (!name || String(name).trim() === '') {
      throw new Error('El nombre de la categoría es obligatorio.');
    }

    this.id = id;
    this.name = String(name).trim();
    this.color = color || '#8b5cf6';
    this.description = description || '';
    this.createdAt = createdAt;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      color: this.color,
      description: this.description,
      created_at: this.createdAt
    };
  }
}
