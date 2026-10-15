/**
 * ============================================================================
 * ARCHIVO: app/page.js
 * DESCRIPCIÓN: Vista principal de WhatsApp Desktop (Dark Mode).
 * PRINCIPIO SOLID: Single Responsibility Principle (SRP)
 * REGLA ESTRICTA: Sin emojis. Solo vectores SVG limpios.
 * ============================================================================
 */

'use client';

import React, { useState, useEffect } from 'react';
import WhatsAppRail from '@/components/WhatsAppRail';
import ChatInbox from '@/components/ChatInbox/ChatInbox';
import ContactManager from '@/components/ContactManager/ContactManager';
import MassCampaign from '@/components/MassCampaign/MassCampaign';
import SupabaseConfigModal from '@/components/SupabaseConfigModal/SupabaseConfigModal';
import { Minus, Square, X, MessageSquare, Database } from 'lucide-react';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('chats'); // 'chats' | 'contacts' | 'campaigns'
  const [contacts, setContacts] = useState([]);
  const [stats, setStats] = useState({ total: 0, reinas: 0 });
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [supabaseConfigured, setSupabaseConfigured] = useState(false);

  // Cargar contactos para estadísticas globales
  const loadContactsData = async () => {
    try {
      const res = await fetch('/api/contacts');
      const data = await res.json();
      if (data.success && data.data) {
        setContacts(data.data);
        const reinasCount = data.data.filter(
          (c) => c.category?.toLowerCase() === 'reinas'
        ).length;
        setStats({ total: data.data.length, reinas: reinasCount });
      }
    } catch (err) {
      console.warn('[HomePage] Error al cargar contactos:', err);
    }
  };

  useEffect(() => {
    loadContactsData();
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (url && url.startsWith('http') && key && key.length > 15) {
      setSupabaseConfigured(true);
    }
  }, []);

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: 'var(--wa-bg-deep)',
      overflow: 'hidden'
    }}>
      {/* Barra de Título Superior de WhatsApp Desktop (Estilo Windows App del screenshot) */}
      <div style={{
        height: 32,
        minHeight: 32,
        backgroundColor: 'var(--wa-bg-deep)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 12px',
        borderBottom: '1px solid rgba(134, 150, 160, 0.08)',
        fontSize: '0.74rem',
        color: 'var(--wa-text-secondary)',
        userSelect: 'none'
      }}>
        {/* Logo y título de WhatsApp */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 16,
            height: 16,
            borderRadius: '50%',
            backgroundColor: '#00a884',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#111b21'
          }}>
            <MessageSquare size={10} strokeWidth={3} />
          </div>
          <span style={{ fontWeight: 600, color: 'var(--wa-text-primary)' }}>
            WhatsApp
          </span>
          <span style={{ color: 'var(--wa-text-muted)' }}>&middot;</span>
          <span style={{ color: 'var(--wa-text-muted)' }}>
            Secretaría &bull; Gestión y Clasificación de Reinas
          </span>
        </div>

        {/* Botones de ventana de Windows (minimizar, maximizar, cerrar) + botón Supabase */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button
            type="button"
            onClick={() => setIsSupabaseModalOpen(true)}
            style={{
              background: 'none',
              border: 'none',
              color: supabaseConfigured ? '#00a884' : '#fbbf24',
              fontSize: '0.72rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 5
            }}
          >
            <Database size={12} />
            <span>{supabaseConfigured ? 'Supabase Conectado' : 'Modo Demo (Conectar Supabase)'}</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, color: 'var(--wa-text-muted)', marginLeft: 8 }}>
            <Minus size={12} />
            <Square size={10} />
            <X size={12} />
          </div>
        </div>
      </div>

      {/* Cuerpo Principal de la Aplicación: Riel Izquierdo + Área de Trabajo */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Riel Vertical Izquierdo de Iconos */}
        <WhatsAppRail
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          unreadTotal={contacts.length}
          reinasCount={stats.reinas}
        />

        {/* Panel Central Dinámico */}
        <main style={{ flex: 1, height: '100%', overflow: 'hidden', display: 'flex' }}>
          {activeTab === 'chats' && (
            <ChatInbox
              onStatsUpdate={({ total, reinas }) => {
                setStats({ total, reinas });
              }}
            />
          )}

          {activeTab === 'contacts' && (
            <ContactManager
              onRefreshNeeded={() => {
                loadContactsData();
              }}
            />
          )}

          {activeTab === 'campaigns' && (
            <MassCampaign
              contacts={contacts}
            />
          )}
        </main>
      </div>

      {/* Modal de Conexión de Supabase y Despliegue en Vercel */}
      <SupabaseConfigModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        isConfigured={supabaseConfigured}
      />
    </div>
  );
}
