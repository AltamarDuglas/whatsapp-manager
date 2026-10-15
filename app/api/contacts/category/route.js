/**
 * ============================================================================
 * ARCHIVO: app/api/contacts/category/route.js
 * DESCRIPCIÓN: Endpoint para asignación masiva de categorías ("Reinas", "VIP", etc.).
 * PRINCIPIO SOLID: Single Responsibility Principle (SRP)
 * ============================================================================
 */

import { NextResponse } from 'next/server';
import { ContactService } from '@/src/services/ContactService';

export async function PATCH(request) {
  try {
    const body = await request.json();
    const { phones, category } = body;

    if (!Array.isArray(phones) || phones.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Debe proporcionar un arreglo de teléfonos.' },
        { status: 400 }
      );
    }

    if (!category || !String(category).trim()) {
      return NextResponse.json(
        { success: false, error: 'Debe especificar una categoría válida.' },
        { status: 400 }
      );
    }

    const contactService = new ContactService();
    const result = await contactService.batchAssignCategory(phones, category);

    return NextResponse.json({
      success: true,
      message: `Se actualizaron ${result.count} contactos a la categoría "${category}".`,
      data: result
    });
  } catch (error) {
    console.error('[API /api/contacts/category PATCH] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error al actualizar categorías.' },
      { status: 500 }
    );
  }
}
