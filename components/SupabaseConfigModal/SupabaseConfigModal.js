/**
 * ============================================================================
 * ARCHIVO: components/SupabaseConfigModal/SupabaseConfigModal.js
 * DESCRIPCIÓN: Modal interactivo con diagnóstico en vivo de Supabase, formulario
 *              para ingresar credenciales, botón para copiar el script SQL y
 *              guía para despliegue en Vercel.
 * PRINCIPIO SOLID: Single Responsibility Principle (SRP)
 * REGLA ESTRICTA: Sin emojis. Solo vectores SVG limpios de Lucide.
 * ============================================================================
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Database,
  Check,
  Copy,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Loader2,
  RefreshCw,
  Server
} from 'lucide-react';

export default function SupabaseConfigModal({ isOpen, onClose, onConfigSaved }) {
  const [copied, setCopied] = useState(false);
  const [liveStatus, setLiveStatus] = useState(null);
  const [isChecking, setIsChecking] = useState(false);

  // Formulario para guardar credenciales directamente
  const [inputUrl, setInputUrl] = useState('');
  const [inputKey, setInputKey] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState(null);

  // Consultar el estado real de Supabase desde la API
  const checkStatus = async () => {
    setIsChecking(true);
    try {
      const res = await fetch('/api/supabase/status');
      const data = await res.json();
      setLiveStatus(data);
      if (data.url && !inputUrl) {
        setInputUrl(data.url);
      }
    } catch (err) {
      setLiveStatus({
        configured: false,
        connected: false,
        error: 'Error de red al consultar el estado de Supabase.'
      });
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      checkStatus();
      setSaveFeedback(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Guardar credenciales en .env.local a través de la API
  const handleSaveCredentials = async (e) => {
    e.preventDefault();
    if (!inputUrl.trim() || !inputKey.trim()) {
      setSaveFeedback({ success: false, message: 'Ingresa tanto la URL como la Anon Key.' });
      return;
    }

    setIsSaving(true);
    setSaveFeedback(null);

    try {
      const res = await fetch('/api/supabase/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supabaseUrl: inputUrl.trim(),
          supabaseAnonKey: inputKey.trim()
        })
      });
      const data = await res.json();

      if (data.success) {
        setSaveFeedback({
          success: true,
          message: 'Credenciales guardadas con éxito. Verificando conexión...'
        });
        await checkStatus();
        if (onConfigSaved) onConfigSaved();
      } else {
        setSaveFeedback({ success: false, message: data.error || 'Error al guardar.' });
      }
    } catch (err) {
      setSaveFeedback({ success: false, message: 'Error de red al guardar las credenciales.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopySql = () => {
    const sqlScript = `-- ============================================================================
-- ESQUEMA OFICIAL PARA SUPABASE: SECRETARÍA & REINADO DEL RÍO 2026
-- Pega esto en Supabase > SQL Editor > Run
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    color VARCHAR(50) DEFAULT '#8b5cf6',
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) DEFAULT 'General',
    notes TEXT,
    custom_fields JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
    phone VARCHAR(50) NOT NULL,
    direction VARCHAR(20) NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    content TEXT NOT NULL,
    status VARCHAR(30) DEFAULT 'delivered',
    sender_name VARCHAR(255),
    replied_by VARCHAR(255),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir lectura publica de categorias" ON categories FOR ALL USING (true);
CREATE POLICY "Permitir lectura y edicion de contactos" ON contacts FOR ALL USING (true);
CREATE POLICY "Permitir lectura y envio de mensajes" ON messages FOR ALL USING (true);

INSERT INTO categories (name, color, description) VALUES
('Reinas', '#ec4899', 'Candidatas, soberanas y delegaciones del Reinado del Río 2026'),
('VIP', '#f59e0b', 'Autoridades, gabinete e invitados especiales'),
('Secretaría', '#3b82f6', 'Equipo administrativo institucional'),
('Líderes', '#10b981', 'Líderes comunitarios y voceros'),
('General', '#6b7280', 'Ciudadanía en general')
ON CONFLICT (name) DO NOTHING;`;

    navigator.clipboard.writeText(sqlScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const isConnected = liveStatus?.connected === true;
  const isConfigured = liveStatus?.configured === true;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0,0,0,0.75)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 200,
      padding: 20
    }}>
      <div style={{
        width: '100%',
        maxWidth: 680,
        maxHeight: '92vh',
        overflowY: 'auto',
        backgroundColor: 'var(--wa-bg-panel)',
        border: '1px solid var(--wa-border)',
        borderRadius: '12px',
        padding: 26,
        position: 'relative',
        boxShadow: '0 20px 50px rgba(0,0,0,0.6)'
      }}>
        {/* Botón cerrar */}
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 20,
            right: 20,
            background: 'none',
            border: 'none',
            color: 'var(--wa-text-secondary)',
            cursor: 'pointer',
            padding: 4
          }}
        >
          <X size={20} />
        </button>

        {/* Encabezado */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: '10px',
            backgroundColor: isConnected ? 'rgba(0, 168, 132, 0.15)' : 'rgba(251, 191, 36, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Database size={24} color={isConnected ? '#00a884' : '#fbbf24'} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ffffff' }}>
              Estado y Conexión de Supabase
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--wa-text-secondary)' }}>
              Solo se mostrarán y cargarán los datos reales alojados en tu base de datos de Supabase.
            </p>
          </div>
        </div>

        {/* Tarjeta de Diagnóstico en Tiempo Real */}
        <div style={{
          padding: '14px 18px',
          borderRadius: '8px',
          backgroundColor: isConnected
            ? 'rgba(0, 168, 132, 0.1)'
            : isConfigured
            ? 'rgba(239, 68, 68, 0.1)'
            : 'rgba(251, 191, 36, 0.1)',
          border: isConnected
            ? '1px solid rgba(0, 168, 132, 0.35)'
            : isConfigured
            ? '1px solid rgba(239, 68, 68, 0.35)'
            : '1px solid rgba(251, 191, 36, 0.35)',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 12
        }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              backgroundColor: isConnected ? '#00a884' : isConfigured ? '#ef4444' : '#fbbf24',
              marginTop: 4,
              flexShrink: 0
            }} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <strong style={{
                  color: isConnected ? '#00a884' : isConfigured ? '#ef4444' : '#fbbf24',
                  fontSize: '0.88rem'
                }}>
                  {isConnected
                    ? 'Supabase Conectado con Éxito'
                    : isConfigured
                    ? 'Error al Conectar con la Base de Datos'
                    : 'Supabase No Configurado (Sin Credenciales)'}
                </strong>
              </div>

              {isConnected && (
                <p style={{ color: 'var(--wa-text-primary)', fontSize: '0.8rem', marginTop: 4 }}>
                  Total en la base de datos: <strong>{liveStatus.contactsCount} contactos autorizados</strong> y <strong>{liveStatus.categoriesCount} categorías</strong>.
                  <br />
                  <span style={{ color: 'var(--wa-text-muted)', fontSize: '0.74rem' }}>
                    Proyecto: {liveStatus.url}
                  </span>
                </p>
              )}

              {!isConnected && isConfigured && (
                <div style={{ marginTop: 4 }}>
                  <p style={{ color: '#fca5a5', fontSize: '0.8rem' }}>
                    Error reportado: {liveStatus.error}
                  </p>
                  {liveStatus.hint && (
                    <p style={{ color: 'var(--wa-text-secondary)', fontSize: '0.76rem', marginTop: 3 }}>
                      Pista: {liveStatus.hint}
                    </p>
                  )}
                </div>
              )}

              {!isConfigured && (
                <p style={{ color: 'var(--wa-text-secondary)', fontSize: '0.8rem', marginTop: 4 }}>
                  No se han detectado las variables <code style={{ color: '#fbbf24' }}>NEXT_PUBLIC_SUPABASE_URL</code> y <code style={{ color: '#fbbf24' }}>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>.
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={checkStatus}
            disabled={isChecking}
            title="Revisar conexión ahora"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--wa-text-secondary)',
              cursor: isChecking ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: '0.76rem',
              padding: 4
            }}
          >
            <RefreshCw size={14} className={isChecking ? 'animate-spin' : ''} />
            <span>{isChecking ? 'Verificando...' : 'Reintentar'}</span>
          </button>
        </div>

        {/* Sección: Ingresar Credenciales Directamente */}
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid var(--wa-border)',
          borderRadius: '8px',
          padding: 16,
          marginBottom: 20
        }}>
          <h3 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#ffffff', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Server size={16} color="#00a884" />
            <span>Configurar Credenciales de Supabase</span>
          </h3>
          <p style={{ fontSize: '0.76rem', color: 'var(--wa-text-secondary)', marginBottom: 12 }}>
            Pega aquí los valores de tu proyecto en Supabase (obtenidos en <em>Project Settings &gt; API</em>) para guardarlos en tu entorno:
          </p>

          <form onSubmit={handleSaveCredentials} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--wa-text-secondary)', marginBottom: 4 }}>
                Project URL (NEXT_PUBLIC_SUPABASE_URL):
              </label>
              <input
                type="text"
                placeholder="https://xyzcompany.supabase.co"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                disabled={isSaving}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  backgroundColor: 'var(--wa-bg-input)',
                  border: '1px solid var(--wa-border)',
                  borderRadius: '6px',
                  color: '#ffffff',
                  fontSize: '0.8rem',
                  fontFamily: 'monospace'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--wa-text-secondary)', marginBottom: 4 }}>
                Project API Key / Anon Public (NEXT_PUBLIC_SUPABASE_ANON_KEY):
              </label>
              <input
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                disabled={isSaving}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  backgroundColor: 'var(--wa-bg-input)',
                  border: '1px solid var(--wa-border)',
                  borderRadius: '6px',
                  color: '#ffffff',
                  fontSize: '0.8rem',
                  fontFamily: 'monospace'
                }}
              />
            </div>

            {saveFeedback && (
              <div style={{
                padding: '8px 12px',
                borderRadius: '6px',
                backgroundColor: saveFeedback.success ? 'rgba(0, 168, 132, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                color: saveFeedback.success ? '#00a884' : '#f87171',
                fontSize: '0.76rem'
              }}>
                {saveFeedback.message}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
              <button
                type="submit"
                disabled={isSaving || !inputUrl.trim() || !inputKey.trim()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 16px',
                  borderRadius: '6px',
                  backgroundColor: '#00a884',
                  border: 'none',
                  color: '#111b21',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: isSaving ? 'wait' : 'pointer'
                }}
              >
                {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} strokeWidth={2.5} />}
                <span>Guardar y Probar Conexión</span>
              </button>
            </div>
          </form>
        </div>

        {/* Pasos de configuración */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontSize: '0.82rem' }}>
          <div style={{ borderLeft: '3px solid #00a884', paddingLeft: 12 }}>
            <h4 style={{ fontWeight: 700, color: '#ffffff', marginBottom: 4 }}>
              Paso 1: Crear Tablas en Supabase
            </h4>
            <p style={{ color: 'var(--wa-text-secondary)', lineHeight: 1.45, marginBottom: 8 }}>
              Abre tu proyecto en <strong>supabase.com</strong>, ingresa a la pestaña <strong>SQL Editor</strong>, pega el script oficial y presiona <strong>Run</strong>:
            </p>
            <button
              type="button"
              onClick={handleCopySql}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                backgroundColor: 'var(--wa-bg-hover)',
                color: 'var(--wa-text-primary)',
                border: '1px solid var(--wa-border)',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '0.76rem',
                cursor: 'pointer'
              }}
            >
              {copied ? <Check size={13} color="#00a884" /> : <Copy size={13} />}
              <span>{copied ? '¡Script SQL Copiado al Portapapeles!' : 'Copiar Script SQL para Supabase'}</span>
            </button>
          </div>

          <div style={{ borderLeft: '3px solid #3b82f6', paddingLeft: 12 }}>
            <h4 style={{ fontWeight: 700, color: '#ffffff', marginBottom: 4 }}>
              Paso 2: Variables en Vercel (Producción)
            </h4>
            <p style={{ color: 'var(--wa-text-secondary)', lineHeight: 1.45 }}>
              En tu dashboard de Vercel (<em>Project &gt; Settings &gt; Environment Variables</em>), añade:
              <br />
              &bull; <code style={{ color: '#60a5fa' }}>NEXT_PUBLIC_SUPABASE_URL</code>
              <br />
              &bull; <code style={{ color: '#60a5fa' }}>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>
            </p>
          </div>
        </div>

        {/* Botón de cierre */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              backgroundColor: 'var(--wa-bg-hover)',
              border: '1px solid var(--wa-border)',
              borderRadius: '6px',
              padding: '8px 20px',
              color: 'var(--wa-text-primary)',
              fontWeight: 600,
              fontSize: '0.82rem',
              cursor: 'pointer'
            }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
