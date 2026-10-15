/**
 * ============================================================================
 * ARCHIVO: app/api/chats/route.js
 * DESCRIPCIÓN: Endpoint para listar conversaciones activas EXCLUSIVAMENTE
 *              de números registrados en la base de datos, con filtro de categoría (ej: "Reinas").
 * PRINCIPIO SOLID: Single Responsibility Principle (SRP)
 * ============================================================================
 */

import { NextResponse } from 'next/server';
import { ChatService } from '@/src/services/ChatService';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || undefined;
    const search = searchParams.get('search') || undefined;

    const chatService = new ChatService();
    // Ejecutamos la regla de negocio: solo números presentes en la base de datos
    const chats = await chatService.listFilteredChats({ category, search });

    return NextResponse.json({
      success: true,
      count: chats.length,
      categoryFilter: category || 'Todos',
      data: chats
    });
  } catch (error) {
    console.error('[API /api/chats GET] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error al listar conversaciones.' },
      { status: 500 }
    );
  }
}
