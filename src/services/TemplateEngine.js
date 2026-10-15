/**
 * ============================================================================
 * ARCHIVO: src/services/TemplateEngine.js
 * DESCRIPCIÓN: Motor de plantillas dinámicas con reemplazo de variables {{campo}}.
 * PRINCIPIO SOLID: Single Responsibility Principle (SRP)
 * ============================================================================
 */

export class TemplateEngine {
  /**
   * Reemplaza variables del tipo {{variable}} en una plantilla utilizando los datos del contacto.
   * 
   * @param {string} template - Texto con marcadores {{nombre}}, {{categoria}}, etc.
   * @param {Object} contactData - Objeto con datos del contacto.
   * @returns {string} Texto renderizado con las variables sustituidas.
   */
  static render(template, contactData = {}) {
    if (!template) return '';

    // Normalizamos claves a minúsculas para reemplazo tolerante a mayúsculas
    const context = {};
    for (const [key, value] of Object.entries(contactData)) {
      context[key.toLowerCase()] = value !== null && value !== undefined ? String(value) : '';
    }

    // Si tiene campos personalizados en customFields o custom_fields
    const extra = contactData.customFields || contactData.custom_fields || {};
    for (const [key, value] of Object.entries(extra)) {
      context[key.toLowerCase()] = value !== null && value !== undefined ? String(value) : '';
    }

    return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (match, paramName) => {
      const lowerParam = paramName.toLowerCase();
      if (context[lowerParam] !== undefined && context[lowerParam] !== '') {
        return context[lowerParam];
      }
      return match; // Si no existe el campo, se deja la etiqueta intacta
    });
  }

  /**
   * Extrae todas las etiquetas de variables presentes en el texto.
   * @param {string} template
   * @returns {Array<string>} Lista de nombres de variables (ej. ['nombre', 'cargo']).
   */
  static extractVariables(template) {
    if (!template) return [];
    const matches = template.matchAll(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g);
    const vars = new Set();
    for (const match of matches) {
      vars.add(match[1]);
    }
    return Array.from(vars);
  }
}
