/**
 * ============================================================================
 * ARCHIVO: app/api/baileys/status/route.js
 * DESCRIPCIÓN: Endpoint para consultar el estado de conexión de Baileys y el código QR.
 * PRINCIPIO SOLID: Single Responsibility Principle (SRP)
 * ============================================================================
 */

import { NextResponse } from 'next/server';

export async function GET() {
  const gatewayUrl = (process.env.BAILEYS_GATEWAY_URL || 'http://localhost:3001').replace(/\/$/, '');

  try {
    const res = await fetch(`${gatewayUrl}/api/whatsapp/status`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(2500)
    });

    if (!res.ok) {
      throw new Error(`Respuesta no exitosa del gateway (${res.status})`);
    }

    const data = await res.json();
    return NextResponse.json({
      success: true,
      gatewayOnline: true,
      gatewayUrl,
      ...data.data
    });
  } catch (err) {
    return NextResponse.json({
      success: true,
      gatewayOnline: false,
      isConnected: false,
      hasQr: false,
      qrDataUrl: null,
      user: null,
      status: 'offline',
      gatewayUrl,
      message: `El Gateway de Baileys no está en ejecución en ${gatewayUrl}.`
    });
  }
}
