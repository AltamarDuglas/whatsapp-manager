/**
 * ============================================================================
 * ARCHIVO: app/api/baileys/disconnect/route.js
 * DESCRIPCIÓN: Desconecta la sesión activa de WhatsApp en Baileys y limpia auth.
 *              Soporta entornos locales y Vercel Serverless mediante BaileysGatewayResolver.
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
        error: 'En Vercel no es posible desconectar localhost. Se requiere la URL pública de tu Gateway.'
      },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(`${gatewayUrl}/api/whatsapp/disconnect`, {
      method: 'POST',
      signal: AbortSignal.timeout(6000)
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
