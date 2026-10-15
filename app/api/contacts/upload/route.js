/**
 * ============================================================================
 * ARCHIVO: app/api/contacts/upload/route.js
 * DESCRIPCIÓN: Endpoint para cargar y procesar archivos Excel (.xlsx/.xls) y CSV.
 * PRINCIPIO SOLID: Single Responsibility Principle (SRP)
 * ============================================================================
 */

import { NextResponse } from 'next/server';
import { ContactService } from '@/src/services/ContactService';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const defaultCategory = formData.get('defaultCategory') || 'General';
    const overrideCategory = formData.get('overrideCategory') === 'true' || formData.get('overrideCategory') === true;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No se envió ningún archivo.' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const contactService = new ContactService();
    // Procesamos el Excel con normalización y deduplicación
    const { contacts, invalidRows, summary } = contactService.parseExcel(buffer, defaultCategory, overrideCategory);

    // Guardamos los contactos válidos en la base de datos
    const saveResult = await contactService.saveBatch(contacts);

    return NextResponse.json({
      success: true,
      summary: {
        ...summary,
        savedInDb: saveResult.inserted
      },
      contacts: contacts.map((c) => c.toJSON()),
      invalidRows
    });
  } catch (error) {
    console.error('[API /api/contacts/upload POST] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error al procesar el archivo Excel.' },
      { status: 400 }
    );
  }
}
