/**
 * ============================================================================
 * ARCHIVO: app/api/baileys/connect/route.js
 * DESCRIPCIÓN: Inicia el proceso de conexión de Baileys y regeneración de QR.
 *              Si el gateway no está encendido en entorno local, intenta levantarlo.
 * PRINCIPIO SOLID: Single Responsibility Principle (SRP)
 * ============================================================================
 */

import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

export async function POST() {
  const gatewayUrl = (process.env.BAILEYS_GATEWAY_URL || 'http://localhost:3001').replace(/\/$/, '');

  try {
    // 1. Intentamos llamar al gateway si ya está corriendo
    const res = await fetch(`${gatewayUrl}/api/whatsapp/connect`, {
      method: 'POST',
      signal: AbortSignal.timeout(3000)
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json({
        success: true,
        message: 'Iniciando generación de código QR en el Gateway.',
        ...data
      });
    }
  } catch (err) {
    // Gateway no está corriendo todavía
  }

  // 2. Si estamos en entorno local de desarrollo, intentamos iniciar el script automáticamente
  try {
    const scriptPath = path.resolve(process.cwd(), 'scripts', 'baileys-gateway.cjs');
    const child = spawn(process.execPath, [scriptPath], {
      detached: true,
      stdio: 'ignore'
    });
    child.unref();

    // Damos un segundo de margen para el arranque del servidor HTTP
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Volvemos a solicitar la conexión
    try {
      const retryRes = await fetch(`${gatewayUrl}/api/whatsapp/connect`, {
        method: 'POST',
        signal: AbortSignal.timeout(4000)
      });
      if (retryRes.ok) {
        return NextResponse.json({
          success: true,
          message: 'Gateway de Baileys iniciado automáticamente. Generando código QR...'
        });
      }
    } catch (_) {}

    return NextResponse.json({
      success: true,
      message: 'Gateway iniciado. Por favor espera unos segundos mientras genera el código QR.'
    });
  } catch (error) {
    console.error('[API /api/baileys/connect POST] Error arrancando gateway:', error);
    return NextResponse.json(
      {
        success: false,
        error: `No se pudo conectar con el Gateway (${gatewayUrl}). Inícialo ejecutando "npm run gateway" en una terminal.`
      },
      { status: 500 }
    );
  }
}
