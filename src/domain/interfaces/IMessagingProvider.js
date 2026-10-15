/**
 * ============================================================================
 * ARCHIVO: src/domain/interfaces/IMessagingProvider.js
 * DESCRIPCIÓN: Contrato de interfaz para proveedores de despacho de WhatsApp.
 * PRINCIPIO SOLID: Liskov Substitution Principle (LSP) & Open/Closed Principle (OCP)
 *   - Permite despachar mensajes mediante Meta Cloud API, Bridge a Baileys o Mock
 *     sin modificar la lógica de negocio ni la interfaz de usuario.
 * ============================================================================
 */

export class IMessagingProvider {
  /**
   * Retorna el identificador del proveedor.
   * @returns {string}
   */
  getName() {
    throw new Error('Método getName() no implementado.');
  }

  /**
   * Consulta el estado de conexión del proveedor.
   * @returns {Promise<{ isReady: boolean, provider: string, details?: Object }>}
   */
  async getStatus() {
    throw new Error('Método getStatus() no implementado.');
  }

  /**
   * Envía un mensaje a un número de WhatsApp.
   * @param {string} toPhone - Teléfono normalizado internacional.
   * @param {string} text - Contenido del mensaje de texto.
   * @param {Object} [options] - Opciones adicionales (plantilla, multimedia).
   * @returns {Promise<{ success: boolean, messageId?: string, error?: string }>}
   */
  async sendMessage(toPhone, text, options = {}) {
    throw new Error('Método sendMessage() no implementado.');
  }
}
