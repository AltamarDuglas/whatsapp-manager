/**
 * ============================================================================
 * ARCHIVO: src/infrastructure/providers/MetaCloudProvider.js
 * DESCRIPCIÓN: Proveedor oficial de WhatsApp Cloud API (Graph API de Meta).
 * PRINCIPIO SOLID: Liskov Substitution Principle (LSP)
 *   - Ejecutable al 100% en funciones Serverless de Vercel sin WebSockets pesados.
 * ============================================================================
 */

import { IMessagingProvider } from '../../domain/interfaces/IMessagingProvider';

export class MetaCloudProvider extends IMessagingProvider {
  constructor({ token = process.env.WHATSAPP_TOKEN, phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID } = {}) {
    super();
    this.token = token;
    this.phoneNumberId = phoneNumberId;
    this.name = 'metacloud';
  }

  getName() {
    return this.name;
  }

  async getStatus() {
    const isReady = Boolean(this.token && this.phoneNumberId);
    return {
      provider: this.name,
      isReady,
      details: {
        hasToken: Boolean(this.token),
        phoneNumberId: this.phoneNumberId || 'No configurado'
      }
    };
  }

  async sendMessage(toPhone, text) {
    if (!this.token || !this.phoneNumberId) {
      return {
        success: false,
        error: 'Credenciales de WhatsApp Cloud API (Token o Phone Number ID) no configuradas en las variables de entorno de Vercel.'
      };
    }

    try {
      const cleanPhone = String(toPhone).replace(/\D/g, '');
      const url = `https://graph.facebook.com/v21.0/${this.phoneNumberId}/messages`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: cleanPhone,
          type: 'text',
          text: { preview_url: false, body: text }
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Error en petición Graph API');
      }

      return {
        success: true,
        messageId: data.messages?.[0]?.id || `wamid_${Date.now()}`,
        recipient: cleanPhone
      };
    } catch (error) {
      console.error('[MetaCloudProvider] Error enviando mensaje:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}
