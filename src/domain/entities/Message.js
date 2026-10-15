/**
 * ============================================================================
 * ARCHIVO: src/domain/entities/Message.js
 * DESCRIPCIÓN: Entidad de dominio que modela un mensaje de WhatsApp individual.
 * PRINCIPIO SOLID: Single Responsibility Principle (SRP)
 *   - Responsabilidad única: Encapsular el ciclo de vida, dirección, contenido
 *     y autoría de cada mensaje intercambiado (inbound u outbound).
 * ============================================================================
 */

export class Message {
  /**
   * Constructor de la entidad Mensaje.
   * @param {Object} params
   * @param {string} [params.id] - Identificador único UUID en Supabase.
   * @param {string} [params.contactId] - UUID foráneo del contacto registrado en la BD.
   * @param {string} params.phone - Teléfono del interlocutor.
   * @param {'inbound'|'outbound'} params.direction - 'inbound' (recibido) u 'outbound' (enviado).
   * @param {string} params.content - Texto del mensaje.
   * @param {string} [params.status] - Estado: 'received', 'sent', 'delivered', 'read', 'failed'.
   * @param {string} [params.senderName] - Nombre del remitente.
   * @param {string} [params.repliedBy] - Nombre del operador o agente que respondió.
   * @param {Object} [params.metadata] - Metadatos técnicos (messageId externo, tokens).
   * @param {string} [params.createdAt] - Marca de tiempo ISO.
   */
  constructor({
    id = null,
    contactId = null,
    phone,
    direction = 'inbound',
    content,
    status = 'delivered',
    senderName = '',
    repliedBy = null,
    metadata = {},
    createdAt = new Date().toISOString()
  }) {
    if (!phone) {
      throw new Error('El mensaje debe tener un número telefónico destinatario/origen.');
    }
    if (!content && content !== '') {
      throw new Error('El mensaje debe contener texto.');
    }

    this.id = id;
    this.contactId = contactId;
    this.phone = String(phone).replace(/\D/g, '');
    this.direction = direction === 'outbound' ? 'outbound' : 'inbound';
    this.content = String(content);
    this.status = status;
    this.senderName = senderName || '';
    this.repliedBy = repliedBy;
    this.metadata = metadata || {};
    this.createdAt = createdAt;
  }

  /**
   * Indica si el mensaje fue enviado por un operador o el sistema institucional.
   * @returns {boolean}
   */
  isOutbound() {
    return this.direction === 'outbound';
  }

  /**
   * Indica si el mensaje fue recibido de un ciudadano/contacto.
   * @returns {boolean}
   */
  isInbound() {
    return this.direction === 'inbound';
  }

  /**
   * Serializa la entidad a formato estándar para Supabase o respuestas JSON.
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      contact_id: this.contactId,
      phone: this.phone,
      direction: this.direction,
      content: this.content,
      status: this.status,
      sender_name: this.senderName,
      replied_by: this.repliedBy,
      metadata: this.metadata,
      created_at: this.createdAt
    };
  }
}
