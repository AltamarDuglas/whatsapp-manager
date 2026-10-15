/**
 * ============================================================================
 * ARCHIVO: app/api/supabase/config/route.js
 * DESCRIPCIÓN: Guarda las credenciales de Supabase en .env.local para desarrollo local.
 * PRINCIPIO SOLID: Single Responsibility Principle (SRP)
 * ============================================================================
 */

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request) {
  try {
    const { supabaseUrl, supabaseAnonKey } = await request.json();

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { success: false, error: 'Debes proporcionar tanto la URL como la Anon Key de Supabase.' },
        { status: 400 }
      );
    }

    const trimmedUrl = String(supabaseUrl).trim();
    const trimmedKey = String(supabaseAnonKey).trim();

    if (!trimmedUrl.startsWith('http')) {
      return NextResponse.json(
        { success: false, error: 'La URL de Supabase debe comenzar con https://' },
        { status: 400 }
      );
    }

    // Actualizamos las variables de proceso en memoria de inmediato
    process.env.NEXT_PUBLIC_SUPABASE_URL = trimmedUrl;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = trimmedKey;

    // Actualizamos el archivo .env.local en el directorio raíz del proyecto
    const envPath = path.join(process.cwd(), '.env.local');
    let envContent = '';
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }

    const updateEnvVar = (content, key, val) => {
      const regex = new RegExp(`^${key}=.*$`, 'm');
      if (regex.test(content)) {
        return content.replace(regex, `${key}=${val}`);
      }
      return `${content}\n${key}=${val}`;
    };

    let updated = envContent;
    updated = updateEnvVar(updated, 'NEXT_PUBLIC_SUPABASE_URL', trimmedUrl);
    updated = updateEnvVar(updated, 'NEXT_PUBLIC_SUPABASE_ANON_KEY', trimmedKey);

    fs.writeFileSync(envPath, updated.trim() + '\n', 'utf8');

    return NextResponse.json({
      success: true,
      message: 'Credenciales de Supabase guardadas exitosamente en .env.local.',
      url: trimmedUrl
    });
  } catch (error) {
    console.error('[API /api/supabase/config POST] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error al guardar credenciales.' },
      { status: 500 }
    );
  }
}
