/**
 * ============================================================================
 * ARCHIVO: components/WhatsAppRail.js
 * DESCRIPCIÓN: Riel vertical izquierdo idéntico a WhatsApp Desktop (Modo Oscuro).
 * PRINCIPIO SOLID: Single Responsibility Principle (SRP)
 * REGLA ESTRICTA: Sin emojis. Solo vectores SVG limpios de alta fidelidad.
 * ============================================================================
 */

'use client';

import React from 'react';
import {
  MessageSquare,
  Phone,
  CircleDot,
  Radio,
  Users,
  Sparkles,
  Database,
  Send,
  Settings,
  ShieldCheck
} from 'lucide-react';

export default function WhatsAppRail({ activeTab, setActiveTab, unreadTotal = 0, reinasCount = 0 }) {
  return (
    <nav
      aria-label="Barra de Navegación WhatsApp"
      style={{
        width: 64,
        minWidth: 64,
        height: '100vh',
        backgroundColor: 'var(--wa-bg-rail)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 0',
        borderRight: '1px solid var(--wa-border)'
      }}
    >
      {/* Grupo Superior de Iconos */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        {/* Chats (Pestaña principal de la Bandeja de entrada) */}
        <button
          type="button"
          onClick={() => setActiveTab('chats')}
          title="Bandeja de Chats (Filtrado por BD)"
          style={{
            position: 'relative',
            width: 44,
            height: 44,
            borderRadius: '10px',
            backgroundColor: activeTab === 'chats' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
            color: activeTab === 'chats' ? '#ffffff' : 'var(--wa-text-secondary)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'background 0.15s ease'
          }}
        >
          <MessageSquare size={22} strokeWidth={activeTab === 'chats' ? 2.3 : 1.8} />
          {unreadTotal > 0 && (
            <span
              style={{
                position: 'absolute',
                top: 4,
                right: 4,
                backgroundColor: '#25d366',
                color: '#111b21',
                fontSize: '0.66rem',
                fontWeight: 700,
                padding: '1px 5px',
                borderRadius: '9999px',
                lineHeight: 1.2
              }}
            >
              {unreadTotal}
            </span>
          )}
        </button>

        {/* Directorio de Contactos / Base de Datos */}
        <button
          type="button"
          onClick={() => setActiveTab('contacts')}
          title="Directorio Maestro de Números (Base de Datos & Excel)"
          style={{
            position: 'relative',
            width: 44,
            height: 44,
            borderRadius: '10px',
            backgroundColor: activeTab === 'contacts' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
            color: activeTab === 'contacts' ? '#ffffff' : 'var(--wa-text-secondary)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'background 0.15s ease'
          }}
        >
          <Database size={21} strokeWidth={activeTab === 'contacts' ? 2.3 : 1.8} />
          {reinasCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: 4,
                right: 4,
                backgroundColor: '#ec4899',
                color: '#ffffff',
                fontSize: '0.62rem',
                fontWeight: 700,
                padding: '1px 4px',
                borderRadius: '9999px',
                lineHeight: 1.2
              }}
            >
              {reinasCount}
            </span>
          )}
        </button>

        {/* Envíos Masivos (Campañas) */}
        <button
          type="button"
          onClick={() => setActiveTab('campaigns')}
          title="Campañas Masivas con Anti-Baneo"
          style={{
            width: 44,
            height: 44,
            borderRadius: '10px',
            backgroundColor: activeTab === 'campaigns' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
            color: activeTab === 'campaigns' ? '#ffffff' : 'var(--wa-text-secondary)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'background 0.15s ease'
          }}
        >
          <Send size={21} strokeWidth={activeTab === 'campaigns' ? 2.3 : 1.8} />
        </button>

        {/* Estados / Historias */}
        <button
          type="button"
          title="Estados"
          style={{
            width: 44,
            height: 44,
            borderRadius: '10px',
            backgroundColor: 'transparent',
            color: 'var(--wa-text-secondary)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <CircleDot size={21} strokeWidth={1.8} />
        </button>

        {/* Canales */}
        <button
          type="button"
          title="Canales"
          style={{
            width: 44,
            height: 44,
            borderRadius: '10px',
            backgroundColor: 'transparent',
            color: 'var(--wa-text-secondary)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <Radio size={21} strokeWidth={1.8} />
        </button>

        {/* Comunidades */}
        <button
          type="button"
          title="Comunidades"
          style={{
            width: 44,
            height: 44,
            borderRadius: '10px',
            backgroundColor: 'transparent',
            color: 'var(--wa-text-secondary)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <Users size={21} strokeWidth={1.8} />
        </button>

        {/* Meta AI / Asistente IA */}
        <button
          type="button"
          title="Asistente IA"
          style={{
            width: 44,
            height: 44,
            borderRadius: '10px',
            backgroundColor: 'transparent',
            color: '#a78bfa',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <Sparkles size={20} strokeWidth={1.8} />
        </button>
      </div>

      {/* Grupo Inferior de Iconos */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        <button
          type="button"
          title="Ajustes y Configuración"
          style={{
            width: 44,
            height: 44,
            borderRadius: '10px',
            backgroundColor: 'transparent',
            color: 'var(--wa-text-secondary)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <Settings size={21} strokeWidth={1.8} />
        </button>

        {/* Avatar de Perfil de la Secretaría */}
        <div
          title="Secretaría Institucional"
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #00a884, #005c4b)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: '0.82rem',
            border: '1px solid rgba(255,255,255,0.1)'
          }}
        >
          S
        </div>
      </div>
    </nav>
  );
}
