/**
 * ============================================================================
 * ARCHIVO: src/infrastructure/providers/MockProvider.js
 * DESCRIPCIÓN: Proveedor de simulación para pruebas seguras sin cargos ni baneos.
 * PRINCIPIO SOLID: Liskov Substitution Principle (LSP)
 * ============================================================================
 */

import { IMessagingProvider } from '../../domain/interfaces/IMessagingProvider';

export class MockProvider extends IMessagingProvider {
  constructor() {
    super();
    this.name = 'simulation';
  }

  getName() {
    return this.name;
  }

  async getStatus() {
    return {
      provider: this.name,
      isReady: true,
      details: { mode: 'Simulación Segura 100% activa' }
    };
  }

  async sendMessage(toPhone, text) {
    const cleanPhone = String(toPhone).replace(/\D/g, '');
    // Simulamos latencia de red realista de 200ms
    await new Promise((resolve) => setTimeout(resolve, 200));

    return {
      success: true,
      messageId: `sim_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      recipient: cleanPhone,
      simulated: true
    };
  }
}
