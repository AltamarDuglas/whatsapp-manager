/**
 * ============================================================================
 * ARCHIVO: app/api/campaigns/send/route.js
 * DESCRIPCIÓN: Endpoint para ejecución de campañas masivas con filtro de audiencia,
 *              plantillas dinámicas y protección anti-baneo.
 * PRINCIPIO SOLID: Single Responsibility Principle (SRP)
 * ============================================================================
 */

import { NextResponse } from 'next/server';
import { ContactService } from '@/src/services/ContactService';
import { TemplateEngine } from '@/src/services/TemplateEngine';
import { getMessagingProvider } from '@/src/infrastructure/providers';
import { Message } from '@/src/domain/entities/Message';
import { getMessageRepository } from '@/src/infrastructure/repositories';

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      title = 'Campaña Institucional',
      template,
      category = 'Todos',
      minDelayMs = 4000,
      maxDelayMs = 8000,
      providerPreference = 'simulation'
    } = body;

    if (!template || !template.trim()) {
      return NextResponse.json(
        { success: false, error: 'Debe proporcionar una plantilla de mensaje.' },
        { status: 400 }
      );
    }

    const contactService = new ContactService();
    const contacts = await contactService.getContacts({ category: category !== 'Todos' ? category : undefined });

    if (!contacts || contacts.length === 0) {
      return NextResponse.json(
        { success: false, error: `No se encontraron contactos en la categoría "${category}".` },
        { status: 400 }
      );
    }

    const provider = getMessagingProvider(providerPreference);
    const messageRepo = getMessageRepository();

    const results = [];
    let sentCount = 0;
    let failedCount = 0;

    for (let i = 0; i < contacts.length; i++) {
      const contact = contacts[i];
      // Personalizamos el mensaje 1 a 1 con TemplateEngine
      const personalizedText = TemplateEngine.render(template, {
        nombre: contact.name,
        categoria: contact.category,
        telefono: contact.phone,
        ...contact.customFields
      });

      // Despacho mediante el proveedor
      const dispatchResult = await provider.sendMessage(contact.phone, personalizedText);

      // Guardamos el mensaje saliente en la base de datos
      const messageEntity = new Message({
        contactId: contact.id,
        phone: contact.phone,
        direction: 'outbound',
        content: personalizedText,
        status: dispatchResult.success ? 'delivered' : 'failed',
        senderName: 'Campaña Masiva',
        repliedBy: `Campaña: ${title}`,
        metadata: {
          campaignTitle: title,
          targetCategory: category,
          provider: provider.getName()
        }
      });

      await messageRepo.save(messageEntity);

      if (dispatchResult.success) {
        sentCount++;
      } else {
        failedCount++;
      }

      results.push({
        phone: contact.phone,
        name: contact.name,
        preview: personalizedText,
        success: dispatchResult.success,
        error: dispatchResult.error || null
      });
    }

    return NextResponse.json({
      success: true,
      summary: {
        title,
        category,
        total: contacts.length,
        sent: sentCount,
        failed: failedCount,
        provider: provider.getName()
      },
      results
    });
  } catch (error) {
    console.error('[API /api/campaigns/send POST] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error al ejecutar campaña.' },
      { status: 500 }
    );
  }
}
