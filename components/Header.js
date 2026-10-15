/**
 * ============================================================================
 * ARCHIVO: components/Header.js
 * DESCRIPCIÓN: Cabecera superior con navegación por pestañas y monitores de estado.
 * PRINCIPIO SOLID: Single Responsibility Principle (SRP)
 * ============================================================================
 */

'use client';

import React from 'react';
import { MessageSquare, Users, Send, Database, Cloud, ShieldCheck, Sparkles } from 'lucide-react';

export default function Header({
  activeTab,
  setActiveTab,
  supabaseConfigured,
  onOpenSupabaseModal,
  contactCount = 0,
  reinasCount = 0
}) {
  return (
    <header style={{
      borderBottom: '1px solid var(--border-subtle)',
      backgroundColor: 'rgba(11, 15, 25, 0.85)',
      backdropFilter: 'var(--blur-glass)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      padding: '12px 24px'
    }}>
      <div style={{
        maxWidth: 1400,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16
      }}>
        {/* Identidad de Marca */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 42,
            height: 42,
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #10b981 0%, #8b5cf6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
          }}>
            <MessageSquare size={22} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h1 style={{ fontSize: '1.2rem', fontWeight: 700, letterSpacing: '-0.02em', color: '#ffffff' }}>
                WhatsApp Hub Pro
              </h1>
              <span style={{
                background: 'rgba(139, 92, 246, 0.2)',
                color: '#a78bfa',
                fontSize: '0.7rem',
                padding: '2px 8px',
                borderRadius: '6px',
                fontWeight: 600,
                border: '1px solid rgba(139, 92, 246, 0.3)'
              }}>
                SECRETARÍA
              </span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Gestión de Chats Filtrados &middot; Clasificación de Reinas &middot; Next.js + Supabase
            </p>
          </div>
        </div>

        {/* Pestañas de Navegación */}
        <nav style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: 'rgba(255, 255, 255, 0.04)',
          padding: '4px',
          borderRadius: '12px',
          border: '1px solid var(--border-subtle)'
        }}>
          <button
            onClick={() => setActiveTab('chats')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 16px',
              borderRadius: '9px',
              border: 'none',
              background: activeTab === 'chats' ? 'linear-gradient(135deg, #10b981, #059669)' : 'transparent',
              color: activeTab === 'chats' ? '#ffffff' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '0.86rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: activeTab === 'chats' ? '0 4px 12px rgba(16, 185, 129, 0.3)' : 'none'
            }}
          >
            <MessageSquare size={16} />
            <span>Bandeja de Chats</span>
            {reinasCount > 0 && (
              <span style={{
                background: activeTab === 'chats' ? 'rgba(0,0,0,0.25)' : 'rgba(236, 72, 153, 0.25)',
                color: activeTab === 'chats' ? '#ffffff' : '#f472b6',
                fontSize: '0.7rem',
                padding: '1px 6px',
                borderRadius: '9999px',
                fontWeight: 700
              }}>
                {reinasCount} Reinas
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('contacts')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 16px',
              borderRadius: '9px',
              border: 'none',
              background: activeTab === 'contacts' ? 'linear-gradient(135deg, #8b5cf6, #7c3aed)' : 'transparent',
              color: activeTab === 'contacts' ? '#ffffff' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '0.86rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: activeTab === 'contacts' ? '0 4px 12px rgba(139, 92, 246, 0.3)' : 'none'
            }}
          >
            <Users size={16} />
            <span>Directorio de Números</span>
            <span style={{
              background: 'rgba(255,255,255,0.15)',
              fontSize: '0.7rem',
              padding: '1px 6px',
              borderRadius: '9999px'
            }}>
              {contactCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('campaigns')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 16px',
              borderRadius: '9px',
              border: 'none',
              background: activeTab === 'campaigns' ? 'linear-gradient(135deg, #ec4899, #db2777)' : 'transparent',
              color: activeTab === 'campaigns' ? '#ffffff' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '0.86rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: activeTab === 'campaigns' ? '0 4px 12px rgba(236, 72, 153, 0.3)' : 'none'
            }}
          >
            <Send size={16} />
            <span>Envíos Masivos</span>
          </button>
        </nav>

        {/* Indicadores de Estado y Enlace Supabase */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={onOpenSupabaseModal}
            title="Ver configuración de Supabase y despliegue en Vercel"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 12px',
              borderRadius: '8px',
              border: supabaseConfigured
                ? '1px solid rgba(16, 185, 129, 0.4)'
                : '1px solid rgba(245, 158, 11, 0.4)',
              background: supabaseConfigured
                ? 'rgba(16, 185, 129, 0.1)'
                : 'rgba(245, 158, 11, 0.1)',
              color: supabaseConfigured ? '#34d399' : '#fbbf24',
              cursor: 'pointer',
              fontSize: '0.78rem',
              fontWeight: 600,
              transition: 'all 0.2s ease'
            }}
          >
            <Database size={14} />
            <span>{supabaseConfigured ? 'Supabase Conectado' : 'Modo Demo (Conectar Supabase)'}</span>
            <span style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: supabaseConfigured ? '#10b981' : '#f59e0b',
              boxShadow: `0 0 8px ${supabaseConfigured ? '#10b981' : '#f59e0b'}`
            }} />
          </button>

          <div
            title="Despliegue Serverless en Vercel"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 10px',
              borderRadius: '8px',
              border: '1px solid var(--border-subtle)',
              background: 'rgba(255, 255, 255, 0.04)',
              fontSize: '0.78rem',
              color: 'var(--text-muted)'
            }}
          >
            <Cloud size={14} color="#60a5fa" />
            <span>Listo para Vercel</span>
          </div>
        </div>
      </div>
    </header>
  );
}
