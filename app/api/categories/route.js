/**
 * ============================================================================
 * ARCHIVO: app/api/categories/route.js
 * DESCRIPCIÓN: Endpoint para obtener y crear clasificaciones de contactos.
 * PRINCIPIO SOLID: Single Responsibility Principle (SRP)
 * ============================================================================
 */

import { NextResponse } from 'next/server';
import { CategoryService } from '@/src/services/CategoryService';

export async function GET() {
  try {
    const categoryService = new CategoryService();
    const categories = await categoryService.getCategories();

    return NextResponse.json({
      success: true,
      data: categories.map((c) => c.toJSON())
    });
  } catch (error) {
    console.error('[API /api/categories GET] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error al obtener categorías.' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const categoryService = new CategoryService();
    const created = await categoryService.createCategory(body);

    return NextResponse.json({
      success: true,
      data: created.toJSON()
    });
  } catch (error) {
    console.error('[API /api/categories POST] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error al crear categoría.' },
      { status: 400 }
    );
  }
}
