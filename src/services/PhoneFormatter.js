/**
 * ============================================================================
 * ARCHIVO: src/services/PhoneFormatter.js
 * DESCRIPCIÓN: Servicio de normalización, limpieza y validación de teléfonos.
 * PRINCIPIO SOLID: Single Responsibility Principle (SRP)
 *   - Responsabilidad única: Limpiar caracteres no numéricos y asegurar
 *     el prefijo de país internacional (código por defecto: 57 Colombia).
 * ============================================================================
 */

export class PhoneFormatter {
  /**
   * Limpia y normaliza un número de teléfono a formato internacional E.164 sin signo +.
   * 
   * @param {string|number} rawPhone - Número crudo (ej: "300 123 4567", "+57 300-1234567").
   * @param {string} [defaultCountryCode='57'] - Código de país por defecto.
   * @returns {string} Número normalizado (ej: "573001234567").
   */
  static normalize(rawPhone, defaultCountryCode = '57') {
    if (!rawPhone) return '';

    let cleaned = String(rawPhone).replace(/\D/g, '');

    // Si empieza con 00, eliminamos los dos ceros internacionales
    if (cleaned.startsWith('00')) {
      cleaned = cleaned.substring(2);
    }

    // Caso Colombia: números móviles de 10 dígitos que inician con 3 (ej. 3001234567)
    if (cleaned.length === 10 && cleaned.startsWith('3')) {
      cleaned = `${defaultCountryCode}${cleaned}`;
    }

    // Si tiene 7 u 8 dígitos (fijo local), agregamos código
    if (cleaned.length === 7 || cleaned.length === 8) {
      cleaned = `${defaultCountryCode}${cleaned}`;
    }

    return cleaned;
  }

  /**
   * Valida si un número telefónico cuenta con longitud y estructura internacional admisible.
   * @param {string} phone - Número normalizado.
   * @returns {boolean}
   */
  static isValid(phone) {
    if (!phone) return false;
    const digits = String(phone).replace(/\D/g, '');
    // Los números internacionales válidos para WhatsApp tienen entre 10 y 15 dígitos
    return digits.length >= 10 && digits.length <= 15;
  }

  /**
   * Formatea el número para visualización amigable en la interfaz de usuario.
   * @param {string} phone - Teléfono normalizado (ej. "573001234567").
   * @returns {string} Formato visual (ej. "+57 300 123 4567").
   */
  static formatDisplay(phone) {
    const clean = String(phone).replace(/\D/g, '');
    if (clean.length === 12 && clean.startsWith('57')) {
      return `+57 ${clean.substring(2, 5)} ${clean.substring(5, 8)} ${clean.substring(8)}`;
    }
    return `+${clean}`;
  }
}
