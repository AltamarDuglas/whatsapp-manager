/**
 * ============================================================================
 * ARCHIVO: app/api/contacts/route.js
 * DESCRIPCIÓN: Endpoint API para listar y registrar contactos en Next.js.
 * PRINCIPIO SOLID: Single Responsibility Principle (SRP)
 * ============================================================================
 */

import { NextResponse } from 'next/server';
import { ContactService } from '@/src/services/ContactService';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || undefined;
    const search = searchParams.get('search') || undefined;

    const contactService = new ContactService();
    const contacts = await contactService.getContacts({ category, search });

    return NextResponse.json({
      success: true,
      count: contacts.length,
      data: contacts.map((c) => c.toJSON())
    });
  } catch (error) {
    console.error('[API /api/contacts GET] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error al obtener contactos.' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const contactService = new ContactService();
    const saved = await contactService.saveContact(body);

    return NextResponse.json({
      success: true,
      data: saved.toJSON()
    });
  } catch (error) {
    console.error('[API /api/contacts POST] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error al guardar contacto.' },
      { status: 400 }
    );
  }
}
