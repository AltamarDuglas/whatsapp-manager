/**
 * ============================================================================
 * ARCHIVO: app/api/baileys/send/route.js
 * DESCRIPCIÓN: Despacha un mensaje de texto a través de la sesión activa de Baileys.
 *              Compatible con Vercel Serverless mediante resolución dinámica del Gateway.
 * PRINCIPIO SOLID: Single Responsibility Principle (SRP)
 * ============================================================================
 */

import { NextResponse } from 'next/server';
import { BaileysGatewayResolver } from '@/src/services/BaileysGatewayResolver';

export async function POST(request) {
  const resolution = BaileysGatewayResolver.resolve(request);
  const { url: gatewayUrl, isInvalidVercelLocalhost } = resolution;

  if (isInvalidVercelLocalhost) {
    return NextResponse.json(
      {
        success: false,
        error: 'En Vercel se requiere la URL pública del Gateway de Baileys para despachar mensajes.'
      },
      { status: 400 }
    );
  }

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
