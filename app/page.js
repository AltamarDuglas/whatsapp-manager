/**
 * ============================================================================
 * ARCHIVO: app/page.js
 * DESCRIPCIÓN: Ventana principal de WhatsApp Desktop (Dark Mode).
 * PRINCIPIO SOLID: Single Responsibility Principle (SRP)
 * REGLA ESTRICTA: Sin emojis. Solo vectores SVG limpios de Lucide.
 * ============================================================================
 */

'use client';

import React, { useState, useEffect } from 'react';
import WhatsAppRail from '@/components/WhatsAppRail';
import ChatInbox from '@/components/ChatInbox/ChatInbox';
import ContactManager from '@/components/ContactManager/ContactManager';
import MassCampaign from '@/components/MassCampaign/MassCampaign';
import SupabaseConfigModal from '@/components/SupabaseConfigModal/SupabaseConfigModal';
import { Minus, Square, X, MessageSquare, Database, ShieldCheck } from 'lucide-react';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('chats'); // 'chats' | 'contacts' | 'campaigns'
  const [contacts, setContacts] = useState([]);
  const [stats, setStats] = useState({ total: 0, reinas: 0 });
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [supabaseStatus, setSupabaseStatus] = useState({
    configured: false,
    connected: false,
    contactsCount: 0,
    loading: true
  });

  const loadContactsData = React.useCallback(async () => {
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
  }, []);

  const fetchSupabaseStatus = React.useCallback(async () => {
    try {
      const res = await fetch('/api/supabase/status');
      const data = await res.json();
      setSupabaseStatus(data);
    } catch (err) {
      console.warn('[HomePage] Error al consultar estado de Supabase:', err);
    }
  }, []);

  useEffect(() => {
    loadContactsData();
    fetchSupabaseStatus();
  }, [loadContactsData, fetchSupabaseStatus]);

  // Memoizar el manejador de estadísticas para evitar ciclos de renderizado
  const handleStatsUpdate = React.useCallback(({ total, reinas }) => {
    setStats((prev) => {
      if (prev.total === total && prev.reinas === reinas) return prev;
      return { total, reinas };
    });
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
      {/* Barra de Título Superior de WhatsApp Desktop */}
      <header style={{
        height: 38,
        minHeight: 38,
        backgroundColor: 'var(--wa-bg-deep)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        borderBottom: '1px solid var(--wa-border)',
        fontSize: '0.76rem',
        color: 'var(--wa-text-secondary)',
        userSelect: 'none',
        flexShrink: 0
      }}>
        {/* Logo WhatsApp + Título oficial */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 18,
            height: 18,
            borderRadius: '50%',
            backgroundColor: '#00a884',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#111b21'
          }}>
            <MessageSquare size={11} strokeWidth={3} />
          </div>
          <span style={{ fontWeight: 600, color: 'var(--wa-text-primary)', fontSize: '0.82rem' }}>
            WhatsApp
          </span>
          <span style={{ color: 'var(--wa-text-dim)' }}>|</span>
          <span style={{ color: 'var(--wa-text-muted)', fontSize: '0.76rem' }}>
            Secretaría &bull; Reinado del Río 2026
          </span>
        </div>

        {/* Estado Supabase y Controles de Ventana */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            type="button"
            onClick={() => setIsSupabaseModalOpen(true)}
            title="Haz clic para ver el estado de Supabase o ingresar credenciales"
            style={{
              background: supabaseStatus.connected
                ? 'rgba(0, 168, 132, 0.12)'
                : supabaseStatus.configured
                ? 'rgba(239, 68, 68, 0.12)'
                : 'rgba(251, 191, 36, 0.12)',
              border: supabaseStatus.connected
                ? '1px solid rgba(0, 168, 132, 0.3)'
                : supabaseStatus.configured
                ? '1px solid rgba(239, 68, 68, 0.3)'
                : '1px solid rgba(251, 191, 36, 0.3)',
              borderRadius: '6px',
              padding: '3px 10px',
              color: supabaseStatus.connected
                ? '#00a884'
                : supabaseStatus.configured
                ? '#f87171'
                : '#fbbf24',
              fontSize: '0.72rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <Database size={12} />
            <span>
              {supabaseStatus.connected
                ? `Supabase Conectado (${supabaseStatus.contactsCount} en BD)`
                : supabaseStatus.configured
                ? 'Error al Conectar Supabase'
                : 'Modo Local (Conectar Supabase)'}
            </span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 18, color: 'var(--wa-text-muted)' }}>
            <Minus size={13} style={{ cursor: 'pointer' }} />
            <Square size={11} style={{ cursor: 'pointer' }} />
            <X size={13} style={{ cursor: 'pointer' }} />
          </div>
        </div>
      </header>

      {/* Área de Trabajo de la Aplicación */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', height: 'calc(100vh - 38px)' }}>
        {/* Riel Lateral Izquierdo */}
        <WhatsAppRail
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          unreadTotal={contacts.length}
          reinasCount={stats.reinas}
        />

        {/* Panel Central */}
        <main style={{ flex: 1, height: '100%', overflow: 'hidden', display: 'flex' }}>
          {activeTab === 'chats' && (
            <ChatInbox onStatsUpdate={handleStatsUpdate} />
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

      {/* Modal de Supabase & Vercel */}
      <SupabaseConfigModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        onConfigSaved={() => {
          fetchSupabaseStatus();
          loadContactsData();
        }}
      />
    </div>
  );
}
