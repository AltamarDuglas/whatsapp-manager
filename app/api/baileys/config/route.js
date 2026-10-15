/**
 * ============================================================================
 * ARCHIVO: app/api/baileys/config/route.js
 * DESCRIPCIÓN: Endpoint para consultar y configurar la URL remota del Gateway
 *              de Baileys, especialmente útil cuando la app se despliega en Vercel.
 * PRINCIPIO SOLID: Single Responsibility Principle (SRP)
 * ============================================================================
 */

import { NextResponse } from 'next/server';
import { BaileysGatewayResolver } from '@/src/services/BaileysGatewayResolver';

export async function GET(request) {
  const resolution = BaileysGatewayResolver.resolve(request);
  return NextResponse.json({
    success: true,
    ...resolution,
    configuredEnvUrl: process.env.BAILEYS_GATEWAY_URL || null
  });
}

export async function POST(request) {
  try {
    const { gatewayUrl } = await request.json();

    if (!gatewayUrl || typeof gatewayUrl !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Se requiere una URL válida para el gateway.' },
        { status: 400 }
      );
    }

    const cleanUrl = gatewayUrl.trim().replace(/\/$/, '');

    // Intentamos hacer ping al gateway ingresado para comprobar si está activo
    let pingSuccess = false;
    let pingDetails = null;

    try {
      const pingRes = await fetch(`${cleanUrl}/api/whatsapp/status`, {
        cache: 'no-store',
        signal: AbortSignal.timeout(4000)
      });
      if (pingRes.ok) {
        const pingData = await pingRes.json();
        pingSuccess = true;
        pingDetails = pingData.data;
      }
    } catch (pingErr) {
      pingSuccess = false;
      pingDetails = { error: pingErr.message };
    }

    // Guardamos la URL en la cookie de sesión del navegador
    const response = NextResponse.json({
      success: true,
      gatewayUrl: cleanUrl,
      pingSuccess,
      pingDetails,
      message: pingSuccess
        ? 'Gateway contactado exitosamente.'
        : `La URL se guardó, pero el gateway no respondió al test de ping (${pingDetails?.error || 'timeout'}). Asegúrate de que el proceso esté en ejecución.`
    });

    response.cookies.set('baileys_gateway_url', cleanUrl, {
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 días
      httpOnly: false,
      sameSite: 'lax'
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { success: false, error: `Error configurando gateway: ${error.message}` },
      { status: 500 }
    );
  }
}
