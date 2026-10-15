/**
 * ============================================================================
 * ARCHIVO: src/domain/interfaces/IMessageRepository.js
 * DESCRIPCIÓN: Contrato de interfaz para persistencia y consulta de mensajes.
 * PRINCIPIO SOLID: Interface Segregation (ISP) & Dependency Inversion (DIP)
 * ============================================================================
 */

export class IMessageRepository {
  /**
   * Obtiene todos los mensajes correspondientes a un teléfono o contacto.
   * @param {string} phone - Teléfono del interlocutor.
   * @returns {Promise<Array<import('../entities/Message').Message>>}
   */
  async findByPhone(phone) {
    throw new Error('Método findByPhone() no implementado.');
  }

  /**
   * Obtiene el último mensaje registrado de cada contacto para la lista de chats.
   * Solo incluye los mensajes cuyos números pertenezcan a la base de datos de contactos.
   * @param {Array<string>} [allowedPhones] - Lista blanca de números de la base de datos.
   * @returns {Promise<Array<Object>>}
   */
  async findRecentChatsForAllowedPhones(allowedPhones) {
    throw new Error('Método findRecentChatsForAllowedPhones() no implementado.');
  }

  /**
   * Guarda un nuevo mensaje entrante o saliente.
   * @param {import('../entities/Message').Message} message
   * @returns {Promise<import('../entities/Message').Message>}
   */
  async save(message) {
    throw new Error('Método save() no implementado.');
  }

  /**
   * Marca los mensajes recibidos de un teléfono como leídos.
   * @param {string} phone
   * @returns {Promise<number>}
   */
  async markAsRead(phone) {
    throw new Error('Método markAsRead() no implementado.');
  }
}
