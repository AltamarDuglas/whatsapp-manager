/**
 * ============================================================================
 * ARCHIVO: app/api/baileys/disconnect/route.js
 * DESCRIPCIÓN: Desconecta la sesión activa de WhatsApp en Baileys y limpia auth.
 * PRINCIPIO SOLID: Single Responsibility Principle (SRP)
 * ============================================================================
 */

import { NextResponse } from 'next/server';

export async function POST() {
  const gatewayUrl = (process.env.BAILEYS_GATEWAY_URL || 'http://localhost:3001').replace(/\/$/, '');

  try {
    const res = await fetch(`${gatewayUrl}/api/whatsapp/disconnect`, {
      method: 'POST',
      signal: AbortSignal.timeout(5000)
    });

    const data = await res.json();
    return NextResponse.json({
      success: true,
      ...data
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: `No se pudo comunicar con el Gateway de Baileys en ${gatewayUrl}: ${error.message}`
      },
      { status: 500 }
    );
  }
}
