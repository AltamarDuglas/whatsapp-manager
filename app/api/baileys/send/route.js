/**
 * ============================================================================
 * ARCHIVO: app/api/baileys/send/route.js
 * DESCRIPCIÓN: Despacha un mensaje de texto a través de la sesión activa de Baileys.
 * PRINCIPIO SOLID: Single Responsibility Principle (SRP)
 * ============================================================================
 */

import { NextResponse } from 'next/server';

export async function POST(request) {
  const gatewayUrl = (process.env.BAILEYS_GATEWAY_URL || 'http://localhost:3001').replace(/\/$/, '');

  try {
    const { phone, message } = await request.json();

    if (!phone || !message) {
      return NextResponse.json(
        { success: false, error: 'Se requiere teléfono y mensaje.' },
        { status: 400 }
      );
    }

    const res = await fetch(`${gatewayUrl}/api/whatsapp/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, message }),
      signal: AbortSignal.timeout(10000)
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Error al enviar mensaje vía Baileys.');
    }

    return NextResponse.json({
      success: true,
      ...data
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: `Error despachando mensaje por Baileys (${gatewayUrl}): ${error.message}`
      },
      { status: 500 }
    );
  }
}
