/**
 * ============================================================================
 * ARCHIVO: src/services/AntiBanPacingService.js
 * DESCRIPCIÓN: Servicio de cálculo de cadencia humana y pausas anti-baneo.
 * PRINCIPIO SOLID: Single Responsibility Principle (SRP)
 * ============================================================================
 */

export class AntiBanPacingService {
  /**
   * Genera un retardo aleatorio entre un mínimo y un máximo (jitter humano).
   * @param {number} minMs - Mínimo en milisegundos (por defecto 4000ms = 4s).
   * @param {number} maxMs - Máximo en milisegundos (por defecto 8000ms = 8s).
   * @returns {number} Retardo aleatorio calculado.
   */
  static getRandomDelay(minMs = 4000, maxMs = 8000) {
    return Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  }

  /**
   * Determina si corresponde una pausa de descanso por lote.
   * Por ejemplo: cada 25 mensajes, pausar 20 segundos.
   * 
   * @param {number} currentMessageIndex - Índice del mensaje actual (1-based).
   * @param {number} [batchSize=25] - Tamaño del lote.
   * @returns {boolean}
   */
  static shouldCooldown(currentMessageIndex, batchSize = 25) {
    if (currentMessageIndex <= 0) return false;
    return currentMessageIndex % batchSize === 0;
  }

  /**
   * Pausa la ejecución asíncrona por un número determinado de milisegundos.
   * @param {number} ms
   * @returns {Promise<void>}
   */
  static sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
