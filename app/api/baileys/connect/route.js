/**
 * ============================================================================
 * ARCHIVO: app/api/baileys/connect/route.js
 * DESCRIPCIÓN: Inicia el proceso de conexión de Baileys y regeneración de QR.
 *              Compatible con Vercel Serverless (evita spawn y delega al gateway remoto).
 * PRINCIPIO SOLID: Single Responsibility Principle (SRP)
 * ============================================================================
 */

import { NextResponse } from 'next/server';
import { BaileysGatewayResolver } from '@/src/services/BaileysGatewayResolver';
import { spawn } from 'child_process';
import path from 'path';

export async function POST(request) {
  const resolution = BaileysGatewayResolver.resolve(request);
  const { url: gatewayUrl, isVercel, isInvalidVercelLocalhost } = resolution;

  let force = false;
  try {
    const urlObj = new URL(request.url);
    force = urlObj.searchParams.get('force') === 'true';
  } catch (_) {}

  // 1. Caso especial: Despliegue en Vercel con URL en localhost
  if (isInvalidVercelLocalhost) {
    return NextResponse.json(
      {
        success: false,
        isVercel: true,
        isLocalhost: true,
        requiresPublicUrl: true,
        error: 'Estás ejecutando la aplicación en Vercel (servidores en la nube). Vercel no puede acceder a tu "localhost". Debes proporcionar la URL pública de tu Gateway (ej: Render, Railway o túnel con "npx localtunnel --port 3001").'
      },
      { status: 400 }
    );
  }

  // 2. Intentamos invocar el endpoint de conexión en el Gateway
  try {
    const targetUrl = `${gatewayUrl}/api/whatsapp/connect${force ? '?force=true' : ''}`;
    const res = await fetch(targetUrl, {
      method: 'POST',
      signal: AbortSignal.timeout(7000)
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json({
        success: true,
        gatewayUrl,
        message: 'Conexión solicitada exitosamente al Gateway de Baileys.',
        ...data
      });
    }
  } catch (err) {
    // Si estamos en Vercel y falló la llamada al gateway remoto:
    if (isVercel) {
      return NextResponse.json(
        {
          success: false,
          isVercel: true,
          gatewayUrl,
          error: `No fue posible contactar el Gateway en ${gatewayUrl}. Asegúrate de que el servicio esté activo y accesible públicamente.`
        },
        { status: 502 }
      );
    }
  }

  // 3. Si estamos en entorno local de desarrollo (fuera de Vercel), intentamos iniciar el script automáticamente
  try {
    const scriptPath = path.resolve(process.cwd(), 'scripts', 'baileys-gateway.cjs');
    const child = spawn(process.execPath, [scriptPath], {
      detached: true,
      stdio: 'ignore'
    });
    child.unref();

    // Damos un segundo de margen para el arranque del servidor HTTP local
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Volvemos a solicitar la conexión
    try {
      const retryRes = await fetch(`${gatewayUrl}/api/whatsapp/connect${force ? '?force=true' : ''}`, {
        method: 'POST',
        signal: AbortSignal.timeout(5000)
      });
      if (retryRes.ok) {
        return NextResponse.json({
          success: true,
          message: 'Gateway de Baileys iniciado automáticamente en local. Generando código QR...'
        });
      }
    } catch (_) {}

    return NextResponse.json({
      success: true,
      message: 'Gateway iniciado. Por favor espera unos segundos mientras genera el código QR.'
    });
  } catch (error) {
    console.error('[API /api/baileys/connect POST] Error arrancando gateway local:', error);
    return NextResponse.json(
      {
        success: false,
        error: `No se pudo conectar con el Gateway (${gatewayUrl}). Inícialo ejecutando "npm run gateway" en una terminal.`
      },
      { status: 500 }
    );
  }
}
