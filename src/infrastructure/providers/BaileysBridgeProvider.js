/**
 * ============================================================================
 * ARCHIVO: src/infrastructure/providers/BaileysBridgeProvider.js
 * DESCRIPCIÓN: Proveedor puente hacia un gateway local o remoto de Baileys.
 * PRINCIPIO SOLID: Liskov Substitution Principle (LSP)
 *   - Permite que la app en Vercel se comunique con una instancia de Baileys
 *     en ejecución para enviar mensajes mediante WhatsApp Web escaneado por QR.
 * ============================================================================
 */

import { IMessagingProvider } from '../../domain/interfaces/IMessagingProvider';

export class BaileysBridgeProvider extends IMessagingProvider {
  constructor({ gatewayUrl = process.env.BAILEYS_GATEWAY_URL || 'http://localhost:3001' } = {}) {
    super();
    this.gatewayUrl = gatewayUrl.replace(/\/$/, '');
    this.name = 'baileys_bridge';
  }

  getName() {
    return this.name;
  }

  async getStatus() {
    try {
      const res = await fetch(`${this.gatewayUrl}/api/whatsapp/status`, {
        signal: AbortSignal.timeout(3000)
      });
      if (!res.ok) throw new Error('Respuesta no exitosa del gateway');
      const data = await res.json();
      return {
        provider: this.name,
        isReady: data.data?.isConnected || false,
        details: data.data
      };
    } catch (err) {
      return {
        provider: this.name,
        isReady: false,
        details: { error: 'No se pudo contactar el servidor Baileys en ' + this.gatewayUrl }
      };
    }
  }

  async sendMessage(toPhone, text) {
    try {
      const cleanPhone = String(toPhone).replace(/\D/g, '');
      const res = await fetch(`${this.gatewayUrl}/api/whatsapp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone, message: text }),
        signal: AbortSignal.timeout(10000)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Error reportado por el gateway Baileys');
      }

      return {
        success: true,
        messageId: data.data?.messageId || `bridge_${Date.now()}`,
        recipient: cleanPhone
      };
    } catch (error) {
      console.warn('[BaileysBridgeProvider] Error despachando vía puente:', error.message);
      return {
        success: false,
        error: `Error de conexión con Baileys Gateway (${this.gatewayUrl}): ${error.message}`
      };
    }
  }
}
