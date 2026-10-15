/**
 * ============================================================================
 * ARCHIVO: src/services/ContactService.js
 * DESCRIPCIÓN: Servicio de dominio para gestión, importación de Excel y clasificación de contactos.
 * PRINCIPIO SOLID: Single Responsibility Principle (SRP) & Dependency Inversion (DIP)
 * ============================================================================
 */

import * as XLSX from 'xlsx';
import { Contact } from '../domain/entities/Contact';
import { PhoneFormatter } from './PhoneFormatter';
import { getContactRepository } from '../infrastructure/repositories';

export class ContactService {
  constructor(contactRepository = null) {
    this.contactRepository = contactRepository || getContactRepository();
  }

  /**
   * Obtiene todos los contactos filtrados por categoría (ej. "Reinas") o búsqueda.
   * @param {Object} filters
   * @returns {Promise<Array<Contact>>}
   */
  async getContacts(filters = {}) {
    return this.contactRepository.findAll(filters);
  }

  /**
   * Obtiene un contacto por su número telefónico.
   * @param {string} phone
   * @returns {Promise<Contact|null>}
   */
  async getByPhone(phone) {
    return this.contactRepository.findByPhone(phone);
  }

  /**
   * Guarda o actualiza un contacto individual.
   * @param {Object} data
   * @returns {Promise<Contact>}
   */
  async saveContact(data) {
    const normalizedPhone = PhoneFormatter.normalize(data.phone);
    if (!PhoneFormatter.isValid(normalizedPhone)) {
      throw new Error(`El número telefónico "${data.phone}" no es válido.`);
    }

    const contact = new Contact({
      id: data.id || null,
      phone: normalizedPhone,
      name: data.name,
      category: data.category || 'General',
      notes: data.notes || '',
      customFields: data.customFields || data.custom_fields || {}
    });

    return this.contactRepository.save(contact);
  }

  /**
   * Clasifica masivamente una lista de teléfonos asignándoles una categoría (ej: "Reinas").
   * @param {Array<string>} phones - Lista de números de teléfono.
   * @param {string} category - Nombre de la categoría a asignar.
   * @returns {Promise<{ count: number }>}
   */
  async batchAssignCategory(phones, category) {
    if (!category || !category.trim()) {
      throw new Error('Debe especificar una categoría válida.');
    }
    return this.contactRepository.updateCategoryBulk(phones, category.trim());
  }

  /**
   * Procesa un archivo Excel (.xlsx, .xls) o CSV recibido como ArrayBuffer o Buffer.
   * Detecta automáticamente columnas telefónicas, nombres y campos dinámicos.
   * 
   * @param {ArrayBuffer|Buffer} buffer - Contenido binario del archivo.
   * @param {string} [defaultCategory='General'] - Categoría a asignar si el archivo no la incluye.
   * @param {boolean} [overrideCategory=false] - Si es true, fuerza la categoría elegida a todas las filas del archivo.
   * @returns {{ contacts: Array<Contact>, invalidRows: Array<Object>, summary: Object }}
   */
  parseExcel(buffer, defaultCategory = 'General', overrideCategory = false) {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const firstSheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[firstSheetName];
    const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    if (!rawRows || rawRows.length === 0) {
      throw new Error('El archivo Excel está vacío o no contiene datos tabulares.');
    }

    const contacts = [];
    const invalidRows = [];
    const seenPhones = new Set();

    for (let i = 0; i < rawRows.length; i++) {
      const row = rawRows[i];
      let rawPhone = '';
      let rawName = '';
      let rawCategory = defaultCategory;
      let rawNotes = '';
      const customFields = {};

      // Detectamos dinámicamente las columnas inspeccionando las cabeceras
      for (const [key, value] of Object.entries(row)) {
        const lowerKey = key.toLowerCase().trim();

        if (
          lowerKey.includes('telefono') ||
          lowerKey.includes('teléfono') ||
          lowerKey.includes('celular') ||
          lowerKey.includes('movil') ||
          lowerKey.includes('móvil') ||
          lowerKey === 'phone' ||
          lowerKey === 'numero'
        ) {
          rawPhone = value;
        } else if (
          lowerKey.includes('nombre') ||
          lowerKey.includes('contacto') ||
          lowerKey.includes('destinatario') ||
          lowerKey === 'name'
        ) {
          rawName = value;
        } else if (
          !overrideCategory && (
            lowerKey.includes('categoria') ||
            lowerKey.includes('categoría') ||
            lowerKey.includes('clasificacion') ||
            lowerKey.includes('etiqueta')
          )
        ) {
          if (value && String(value).trim()) {
            rawCategory = String(value).trim();
          }
        } else if (lowerKey.includes('nota') || lowerKey.includes('observacion')) {
          rawNotes = String(value).trim();
        } else {
          // Todo lo demás se captura como variable personalizada (ej: {{radicado}}, {{cargo}}, etc.)
          customFields[key] = value;
        }
      }

      if (overrideCategory && defaultCategory) {
        rawCategory = defaultCategory;
      }

      const normalizedPhone = PhoneFormatter.normalize(rawPhone);

      // Si no es un número válido o está duplicado en el mismo archivo
      if (!PhoneFormatter.isValid(normalizedPhone)) {
        invalidRows.push({
          rowNumber: i + 2,
          rawPhone,
          rawName,
          reason: 'Número de teléfono inválido o incompleto'
        });
        continue;
      }

      if (seenPhones.has(normalizedPhone)) {
        invalidRows.push({
          rowNumber: i + 2,
          rawPhone,
          rawName,
          reason: 'Número telefónico duplicado dentro del mismo archivo'
        });
        continue;
      }

      seenPhones.add(normalizedPhone);

      contacts.push(
        new Contact({
          phone: normalizedPhone,
          name: rawName ? String(rawName).trim() : `Contacto (+${normalizedPhone})`,
          category: rawCategory,
          notes: rawNotes,
          customFields
        })
      );
    }

    return {
      contacts,
      invalidRows,
      summary: {
        totalRows: rawRows.length,
        validCount: contacts.length,
        invalidCount: invalidRows.length
      }
    };
  }

  /**
   * Guarda en base de datos una lista de contactos importados.
   * @param {Array<Contact>} contacts
   * @returns {Promise<{ inserted: number, total: number }>}
   */
  async saveBatch(contacts) {
    return this.contactRepository.saveBatch(contacts);
  }

  /**
   * Elimina un contacto por ID.
   * @param {string} id
   */
  async deleteContact(id) {
    return this.contactRepository.delete(id);
  }
}
