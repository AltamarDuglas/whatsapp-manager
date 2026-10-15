/**
 * ============================================================================
 * ARCHIVO: app/api/webhook/whatsapp/route.js
 * DESCRIPCIÓN: Webhook receptor de mensajes de WhatsApp (Meta Cloud API o Baileys Gateway).
 * PRINCIPIO SOLID: Single Responsibility Principle (SRP)
 *   - Recibe eventos de mensajes entrantes y aplica la regla de negocio de admitir
 *     únicamente mensajes de números que se encuentren en la base de datos de contactos.
 * ============================================================================
 */

import { NextResponse } from 'next/server';
import { getContactRepository, getMessageRepository } from '@/src/infrastructure/repositories';
import { Message } from '@/src/domain/entities/Message';
import { PhoneFormatter } from '@/src/services/PhoneFormatter';

// -------------------------------------------------------------
// 1. HANDSHAKE DE VERIFICACIÓN DE META (GET)
// -------------------------------------------------------------
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    const expectedToken = process.env.WHATSAPP_VERIFY_TOKEN || 'secretaria_whatsapp_webhook_token_seguro';

    if (mode === 'subscribe' && token === expectedToken) {
      console.log('[Webhook WhatsApp] Verificación exitosa de Meta.');
      return new Response(challenge, { status: 200 });
    }

    return new Response('Token de verificación inválido.', { status: 403 });
  } catch (error) {
    console.error('[Webhook WhatsApp GET] Error:', error);
    return new Response('Error en verificación', { status: 500 });
  }
}

// -------------------------------------------------------------
// 2. RECEPCIÓN DE MENSAJES ENTRANTES (POST)
// -------------------------------------------------------------
export async function POST(request) {
  try {
    const payload = await request.json();
    const contactRepo = getContactRepository();
    const messageRepo = getMessageRepository();

    // ---------------------------------------------------------
    // CASO A: Mensajes emitidos por Meta WhatsApp Cloud API
    // ---------------------------------------------------------
    if (payload.object === 'whatsapp_business_account' && payload.entry) {
      for (const entry of payload.entry) {
        for (const change of entry.changes || []) {
          const value = change.value;
          if (value?.messages) {
            for (const msg of value.messages) {
              const rawFrom = msg.from; // Número del remitente
              const cleanPhone = PhoneFormatter.normalize(rawFrom);
              let textContent = '';

              if (msg.type === 'text') {
                textContent = msg.text?.body || '';
              } else if (msg.type === 'image') {
                textContent = msg.image?.caption || '[Imagen recibida]';
              } else {
                textContent = `[Mensaje de tipo ${msg.type}]`;
              }

              // REGLA FUNDAMENTAL: Verificar si el número está en la base de datos
              const registeredContact = await contactRepo.findByPhone(cleanPhone);
              if (!registeredContact) {
                console.log(`[Webhook WhatsApp] Mensaje ignorado de número no registrado: ${cleanPhone}`);
                continue; // No procesar números no registrados
              }

              // Guardamos el mensaje entrante en la base de datos
              const incomingMsg = new Message({
                contactId: registeredContact.id,
                phone: cleanPhone,
                direction: 'inbound',
                content: textContent,
                status: 'received',
                senderName: registeredContact.name,
                metadata: {
                  provider: 'metacloud_webhook',
                  rawMessageId: msg.id
                }
              });

              await messageRepo.save(incomingMsg);
              console.log(`[Webhook WhatsApp] Mensaje guardado para ${registeredContact.name} (${cleanPhone})`);
            }
          }
        }
      }
      return NextResponse.json({ success: true, processed: 'meta' });
    }

    // ---------------------------------------------------------
    // CASO B: Mensaje entrante desde el gateway de Baileys
    // ---------------------------------------------------------
    if (payload.fromPhone && payload.text) {
      const cleanPhone = PhoneFormatter.normalize(payload.fromPhone);

      // Verificamos si el número está en la base de datos
      const registeredContact = await contactRepo.findByPhone(cleanPhone);
      if (!registeredContact) {
        return NextResponse.json({
          success: false,
          ignored: true,
          reason: 'El número no se encuentra registrado en la base de datos.'
        });
      }

      const incomingMsg = new Message({
        contactId: registeredContact.id,
        phone: cleanPhone,
        direction: 'inbound',
        content: payload.text,
        status: 'received',
        senderName: payload.senderName || registeredContact.name,
        metadata: {
          provider: 'baileys_gateway'
        }
      });

      const saved = await messageRepo.save(incomingMsg);
      return NextResponse.json({ success: true, data: saved.toJSON() });
    }

    return NextResponse.json({ success: true, notice: 'Sin mensajes reconocibles para procesar.' });
  } catch (error) {
    console.error('[Webhook WhatsApp POST] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
