/**
 * ============================================================================
 * ARCHIVO: src/infrastructure/providers/index.js
 * DESCRIPCIÓN: Factoría central para instanciar el proveedor de mensajería adecuado.
 * PRINCIPIO SOLID: Dependency Inversion (DIP) & Open/Closed (OCP)
 * ============================================================================
 */

import { MetaCloudProvider } from './MetaCloudProvider';
import { BaileysBridgeProvider } from './BaileysBridgeProvider';
import { MockProvider } from './MockProvider';

export function getMessagingProvider(preference = 'auto') {
  // Si se solicita explícitamente simulación
  if (preference === 'simulation') {
    return new MockProvider();
  }

  // Si se tienen credenciales de Meta WhatsApp Cloud API
  if (process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID) {
    return new MetaCloudProvider();
  }

  // Si se configuró la URL del puente de Baileys
  if (process.env.BAILEYS_GATEWAY_URL && preference === 'baileys') {
    return new BaileysBridgeProvider();
  }

  // Por defecto proveedor de simulación segura
  return new MockProvider();
}
