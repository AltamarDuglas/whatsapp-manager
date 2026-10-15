/**
 * ============================================================================
 * ARCHIVO: app/api/supabase/status/route.js
 * DESCRIPCIÓN: Endpoint de diagnóstico para verificar el estado de conexión a Supabase.
 * PRINCIPIO SOLID: Single Responsibility Principle (SRP)
 * ============================================================================
 */

import { NextResponse } from 'next/server';
import { isSupabaseConfigured, getSupabaseClient } from '@/src/infrastructure/supabase/supabaseClient';

export async function GET() {
  try {
    const configured = isSupabaseConfigured();
    const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const hasAnonKey = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length > 15);

    if (!configured) {
      return NextResponse.json({
        success: true,
        configured: false,
        connected: false,
        url: rawUrl || null,
        hasAnonKey,
        contactsCount: 0,
        message: 'Supabase no está configurado. Agrega NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY.'
      });
    }

    const client = getSupabaseClient();
    if (!client) {
      return NextResponse.json({
        success: true,
        configured: true,
        connected: false,
        contactsCount: 0,
        error: 'No se pudo instanciar el cliente de Supabase.'
      });
    }

    // Intentamos consultar la tabla de contactos
    const { count, error: contactsError } = await client
      .from('contacts')
      .select('*', { count: 'exact', head: true });

    if (contactsError) {
      let hint = 'Revisa los permisos y credenciales de Supabase.';
      if (contactsError.code === '42P01' || contactsError.message?.includes('does not exist')) {
        hint = 'La tabla "contacts" no existe. Debes ejecutar el archivo supabase/schema.sql en el SQL Editor de Supabase.';
      }

      return NextResponse.json({
        success: true,
        configured: true,
        connected: false,
        url: rawUrl,
        error: contactsError.message,
        code: contactsError.code,
        hint,
        contactsCount: 0
      });
    }

    // Intentamos consultar la tabla de categorías
    const { count: catCount } = await client
      .from('categories')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      success: true,
      configured: true,
      connected: true,
      url: rawUrl,
      contactsCount: count ?? 0,
      categoriesCount: catCount ?? 0,
      message: 'Conexión con Supabase verificada exitosamente.'
    });
  } catch (error) {
    console.error('[API /api/supabase/status GET] Error:', error);
    return NextResponse.json(
      {
        success: false,
        configured: false,
        connected: false,
        error: error.message || 'Error inesperado al verificar Supabase.'
      },
      { status: 500 }
    );
  }
}
