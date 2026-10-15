/**
 * ============================================================================
 * ARCHIVO: components/ChatInbox/ChatWindow.js
 * DESCRIPCIÓN: Ventana activa de conversación idéntica a WhatsApp Desktop.
 * PRINCIPIO SOLID: Single Responsibility Principle (SRP)
 * REGLA ESTRICTA: Sin emojis. Solo vectores SVG limpios de alta fidelidad.
 * ============================================================================
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Video,
  Phone,
  Search,
  MoreVertical,
  Paperclip,
  Mic,
  Send,
  CheckCheck,
  FileSpreadsheet,
  Download,
  ExternalLink,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { PhoneFormatter } from '@/src/services/PhoneFormatter';
import CategoryBadge from './CategoryBadge';

export default function ChatWindow({
  activeChat,
  onSendMessage,
  onUpdateCategory,
  isSending = false
}) {
  const [replyText, setReplyText] = useState('');
  const [operatorName, setOperatorName] = useState('Secretaría General');
  const messagesEndRef = useRef(null);

  // Auto-scroll al último mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChat?.messages]);

  if (!activeChat || !activeChat.contact) {
    return (
      <div
        className="wa-chat-pattern"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 40,
          color: 'var(--wa-text-secondary)',
          textAlign: 'center'
        }}
      >
        <div style={{
          width: 72,
          height: 72,
          borderRadius: '50%',
          backgroundColor: 'var(--wa-bg-panel)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
          border: '1px solid var(--wa-border)'
        }}>
          <ShieldCheck size={36} color="#00a884" />
        </div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--wa-text-primary)', marginBottom: 8 }}>
          Bandeja de Chats Autorizados
        </h2>
        <p style={{ maxWidth: 440, fontSize: '0.86rem', lineHeight: 1.5, color: 'var(--wa-text-muted)' }}>
          Selecciona una conversación de la lista para visualizar los mensajes y responder.
          Esta plataforma filtra de forma estricta los números registrados en la base de datos institucional.
        </p>
      </div>
    );
  }

  const { contact, messages = [] } = activeChat;

  const handleSend = (e) => {
    e?.preventDefault();
    if (!replyText.trim() || isSending) return;
    onSendMessage({
      phone: contact.phone,
      content: replyText.trim(),
      repliedBy: operatorName
    });
    setReplyText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: 'var(--wa-bg-chat)'
    }}>
      {/* Cabecera idéntica a WhatsApp Desktop */}
      <header style={{
        height: 60,
        backgroundColor: 'var(--wa-bg-panel)',
        borderBottom: '1px solid var(--wa-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px'
      }}>
        {/* Contacto activo: Avatar + Nombre / Teléfono + Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            backgroundColor: '#1e3a5f',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '0.95rem'
          }}>
            {contact.name?.charAt(0) || 'M'}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '0.96rem', fontWeight: 600, color: '#ffffff' }}>
                {PhoneFormatter.formatDisplay(contact.phone)}
              </span>
              <CategoryBadge
                category={contact.category || 'General'}
                onCategoryChange={(newCategory) => onUpdateCategory(contact.phone, newCategory)}
                editable={true}
              />
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--wa-text-muted)' }}>
              {contact.name} {contact.notes ? `· ${contact.notes}` : ''}
            </div>
          </div>
        </div>

        {/* Acciones de la cabecera (Vectores SVG) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, color: 'var(--wa-text-secondary)' }}>
          <button type="button" title="Videollamada" style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>
            <Video size={19} />
          </button>
          <button type="button" title="Llamada de voz" style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>
            <Phone size={18} />
          </button>
          <button type="button" title="Buscar en el chat" style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>
            <Search size={18} />
          </button>
          <button type="button" title="Más opciones" style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>
            <MoreVertical size={19} />
          </button>
        </div>
      </header>

      {/* Cuerpo del Chat con Fondo Doodle y Mensajes */}
      <div
        className="wa-chat-pattern"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 60px',
          display: 'flex',
          flexDirection: 'column',
          gap: 6
        }}
      >
        {/* Tarjeta de Documento de Inscripción del Reinado del Río (fiel al caso de uso de la imagen) */}
        <div style={{
          alignSelf: 'center',
          backgroundColor: 'rgba(32, 44, 51, 0.9)',
          border: '1px solid var(--wa-border)',
          borderRadius: '8px',
          padding: '6px 14px',
          fontSize: '0.72rem',
          color: 'var(--wa-text-muted)',
          marginBottom: 8,
          textTransform: 'uppercase',
          letterSpacing: '0.04em'
        }}>
          Registro Oficial &middot; Reinado del Río 2026
        </div>

        {messages.map((msg, idx) => {
          const isOut = msg.direction === 'outbound';
          const timeFormatted = msg.createdAt
            ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : '';

          return (
            <div
              key={msg.id || idx}
              className={isOut ? 'wa-bubble-outgoing' : 'wa-bubble-incoming'}
              style={{ padding: '6px 9px 8px 9px', marginBottom: 2 }}
            >
              {/* Si es respuesta de un operador, mostramos la firma sutil con vector */}
              {isOut && msg.repliedBy && (
                <div style={{
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  color: '#6ee7b7',
                  marginBottom: 3,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}>
                  <UserCheck size={11} color="#6ee7b7" />
                  <span>{msg.repliedBy}</span>
                </div>
              )}

              {/* Contenido textual */}
              <div style={{
                fontSize: '0.88rem',
                lineHeight: 1.4,
                color: 'var(--wa-text-primary)',
                whiteSpace: 'pre-wrap',
                marginRight: 45
              }}>
                {msg.content}
              </div>

              {/* Tarjeta de Documento Excel idéntica a la captura de WhatsApp Desktop */}
              {(msg.metadata?.hasAttachment || msg.content.toLowerCase().includes('inscripcion') || msg.content.toLowerCase().includes('lista') || msg.content.toLowerCase().includes('amarillas')) ? (
                <div style={{
                  marginTop: 6,
                  backgroundColor: 'var(--wa-bubble-doc)',
                  borderRadius: '6px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  padding: '8px 10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 32,
                      height: 32,
                      borderRadius: '6px',
                      backgroundColor: '#107c41',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: '0.78rem'
                    }}>
                      X
                    </div>
                    <div>
                      <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#ffffff' }}>
                        INSCRIPCION_CANDIDATAS_REINADO_RIO_2026_FILTRADO_24.xlsx
                      </div>
                      <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.7)' }}>
                        XLSX &middot; 10 KB
                      </div>
                    </div>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    borderTop: '1px solid rgba(255,255,255,0.1)',
                    paddingTop: 4,
                    fontSize: '0.72rem'
                  }}>
                    <a
                      href="/base_muestra.xlsx"
                      download="INSCRIPCION_CANDIDATAS_REINADO_RIO_2026.xlsx"
                      style={{ color: '#53bdeb', textDecoration: 'none', fontWeight: 600 }}
                    >
                      Abrir
                    </a>
                    <a
                      href="/base_muestra.xlsx"
                      download="INSCRIPCION_CANDIDATAS_REINADO_RIO_2026.xlsx"
                      style={{ color: '#53bdeb', textDecoration: 'none', fontWeight: 600 }}
                    >
                      Guardar como...
                    </a>
                  </div>
                </div>
              ) : null}

              {/* Hora de envío y doble check */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: 4,
                marginTop: -4,
                float: 'right',
                marginLeft: 12,
                fontSize: '0.68rem',
                color: 'var(--wa-text-muted)'
              }}>
                <span>{timeFormatted}</span>
                {isOut && <CheckCheck size={14} color="#53bdeb" />}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Barra Inferior de Entrada idéntica a WhatsApp Desktop */}
      <footer style={{
        height: 62,
        backgroundColor: 'var(--wa-bg-panel)',
        padding: '0 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 12
      }}>
        {/* Clip de adjuntos (Vector) */}
        <button
          type="button"
          title="Adjuntar archivo o documento"
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--wa-text-secondary)',
            cursor: 'pointer',
            padding: 6,
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <Paperclip size={20} />
        </button>

        {/* Campo de texto de WhatsApp */}
        <form onSubmit={handleSend} style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
          <input
            type="text"
            className="wa-search-input"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe un mensaje"
            style={{
              height: 42,
              paddingLeft: 16,
              borderRadius: '8px',
              fontSize: '0.92rem'
            }}
          />
        </form>

        {/* Si hay texto escrito, botón de enviar verde; si no, micrófono */}
        {replyText.trim() ? (
          <button
            type="button"
            onClick={handleSend}
            disabled={isSending}
            title="Enviar respuesta"
            style={{
              background: 'none',
              border: 'none',
              color: '#00a884',
              cursor: 'pointer',
              padding: 6,
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <Send size={20} />
          </button>
        ) : (
          <button
            type="button"
            title="Mensaje de voz"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--wa-text-secondary)',
              cursor: 'pointer',
              padding: 6,
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <Mic size={20} />
          </button>
        )}
      </footer>
    </div>
  );
}
