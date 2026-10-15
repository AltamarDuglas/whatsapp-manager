/**
 * ============================================================================
 * ARCHIVO: app/api/chats/[phone]/route.js
 * DESCRIPCIÓN: Endpoint dinámico para consultar historial, responder mensajes
 *              y actualizar la clasificación del contacto en tiempo real.
 * PRINCIPIO SOLID: Single Responsibility Principle (SRP)
 * ============================================================================
 */

import { NextResponse } from 'next/server';
import { ChatService } from '@/src/services/ChatService';

export async function GET(request, { params }) {
  try {
    const { phone } = await params;
    const chatService = new ChatService();
    const history = await chatService.getChatHistory(phone);

    return NextResponse.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error(`[API /api/chats/${params?.phone} GET] Error:`, error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error al obtener historial del chat.' },
      { status: 404 }
    );
  }
}

export async function POST(request, { params }) {
  try {
    const { phone } = await params;
    const body = await request.json();
    const { content, repliedBy = 'Operador Secretaría', providerPreference = 'auto' } = body;

    const chatService = new ChatService();
    // Enviamos el mensaje y lo almacenamos en base de datos con autoría
    const result = await chatService.replyMessage({
      phone,
      content,
      repliedBy,
      providerPreference
    });

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error(`[API /api/chats/${params?.phone} POST] Error:`, error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error al enviar respuesta al chat.' },
      { status: 400 }
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    const { phone } = await params;
    const body = await request.json();
    const { category } = body;

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Debe especificar una categoría.' },
        { status: 400 }
      );
    }

    const chatService = new ChatService();
    const updated = await chatService.updateContactCategory(phone, category);

    return NextResponse.json({
      success: true,
      data: updated
    });
  } catch (error) {
    console.error(`[API /api/chats/${params?.phone} PATCH] Error:`, error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error al actualizar categoría.' },
      { status: 400 }
    );
  }
}
