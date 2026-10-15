/**
 * ============================================================================
 * ARCHIVO: app/api/baileys/status/route.js
 * DESCRIPCIÓN: Endpoint para consultar el estado de conexión de Baileys y el código QR.
 *              Compatible con Vercel Serverless mediante detección dinámica de entorno.
 * PRINCIPIO SOLID: Single Responsibility Principle (SRP)
 * ============================================================================
 */

import { NextResponse } from 'next/server';
import { BaileysGatewayResolver } from '@/src/services/BaileysGatewayResolver';

export async function GET(request) {
  // Resuelve la URL del Gateway considerando Vercel, cookies, cabeceras y variables de entorno
  const resolution = BaileysGatewayResolver.resolve(request);
  const { url: gatewayUrl, isVercel, isLocalhost, isInvalidVercelLocalhost } = resolution;

  // Si estamos en Vercel y la URL sigue apuntando a localhost, informamos al cliente de inmediato
  if (isInvalidVercelLocalhost) {
    return NextResponse.json({
      success: true,
      gatewayOnline: false,
      isConnected: false,
      hasQr: false,
      qrDataUrl: null,
      user: null,
      status: 'vercel_requires_public_gateway',
      gatewayUrl,
      isVercel: true,
      isLocalhost: true,
      requiresPublicUrl: true,
      message: 'La aplicación está ejecutándose en Vercel (Serverless). Para conectar Baileys debes ingresar la URL pública de tu Gateway (Render, Railway o túnel Ngrok/Localtunnel).'
    });
  }

  try {
    const res = await fetch(`${gatewayUrl}/api/whatsapp/status`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(3500)
    });

    if (!res.ok) {
      throw new Error(`Respuesta HTTP no exitosa del gateway (${res.status})`);
    }

    const data = await res.json();
    return NextResponse.json({
      success: true,
      gatewayOnline: true,
      gatewayUrl,
      isVercel,
      isLocalhost,
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
      isVercel,
      isLocalhost,
      message: `No se pudo conectar con el Gateway de Baileys en ${gatewayUrl}: ${err.message}`
    });
  }
}
