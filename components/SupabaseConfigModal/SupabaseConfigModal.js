/**
 * ============================================================================
 * ARCHIVO: components/SupabaseConfigModal/SupabaseConfigModal.js
 * DESCRIPCIÓN: Modal interactivo con guía de despliegue en Vercel, vinculación
 *              a Supabase y botón para copiar el script SQL de creación de tablas.
 * PRINCIPIO SOLID: Single Responsibility Principle (SRP)
 * REGLA ESTRICTA: Sin emojis. Solo vectores SVG limpios de Lucide.
 * ============================================================================
 */

'use client';

import React, { useState } from 'react';
import { X, Database, Check, Copy, ExternalLink, Cloud, Shield } from 'lucide-react';

export default function SupabaseConfigModal({ isOpen, onClose, isConfigured }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopySql = () => {
    const sqlScript = `-- Esquema oficial para Supabase:
-- Pega esto en Supabase > SQL Editor > Run:
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
('Reinas', '#ec4899', 'Candidatas, soberanas y delegaciones de certámenes'),
('VIP', '#f59e0b', 'Autoridades e invitados especiales'),
('Secretaría', '#3b82f6', 'Equipo administrativo institucional'),
('Líderes', '#10b981', 'Líderes comunitarios y voceros'),
('General', '#6b7280', 'Ciudadanía en general')
ON CONFLICT (name) DO NOTHING;`;

    navigator.clipboard.writeText(sqlScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

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
        maxWidth: 640,
        maxHeight: '90vh',
        overflowY: 'auto',
        backgroundColor: 'var(--wa-bg-panel)',
        border: '1px solid var(--wa-border)',
        borderRadius: '12px',
        padding: 28,
        position: 'relative'
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
            cursor: 'pointer'
          }}
        >
          <X size={20} />
        </button>

        {/* Encabezado */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: '10px',
            backgroundColor: 'rgba(0, 168, 132, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Database size={24} color="#00a884" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ffffff' }}>
              Guía de Conexión: Supabase & Despliegue en Vercel
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--wa-text-secondary)' }}>
              Configuración para persistencia en nube y despliegue serverless.
            </p>
          </div>
        </div>

        {/* Estado actual */}
        <div style={{
          padding: '12px 16px',
          borderRadius: '8px',
          backgroundColor: isConfigured ? 'rgba(0, 168, 132, 0.12)' : 'rgba(251, 191, 36, 0.12)',
          border: isConfigured ? '1px solid rgba(0, 168, 132, 0.3)' : '1px solid rgba(251, 191, 36, 0.3)',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 10
        }}>
          <div style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            backgroundColor: isConfigured ? '#00a884' : '#fbbf24'
          }} />
          <div style={{ fontSize: '0.82rem' }}>
            <strong style={{ color: isConfigured ? '#00a884' : '#fbbf24' }}>
              {isConfigured ? 'Supabase Conectado y Operativo' : 'Modo Demo Activo (Almacenamiento Local)'}
            </strong>
            <p style={{ color: 'var(--wa-text-secondary)', marginTop: 2 }}>
              {isConfigured
                ? 'Los contactos, categorías y mensajes se sincronizan en tiempo real en la nube.'
                : 'La plataforma está lista para usar de inmediato en modo local. Agrega las credenciales para sincronizar con Supabase.'}
            </p>
          </div>
        </div>

        {/* Pasos */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, fontSize: '0.84rem' }}>
          {/* Paso 1: Supabase */}
          <div style={{ borderLeft: '3px solid #00a884', paddingLeft: 14 }}>
            <h4 style={{ fontWeight: 700, color: '#ffffff', marginBottom: 4 }}>
              Paso 1: Crear Base de Datos en Supabase
            </h4>
            <p style={{ color: 'var(--wa-text-secondary)', lineHeight: 1.45, marginBottom: 8 }}>
              Crea tu proyecto en <strong>supabase.com</strong>, abre el <strong>SQL Editor</strong> y pega el script con el botón abajo:
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
                fontSize: '0.78rem',
                cursor: 'pointer'
              }}
            >
              {copied ? <Check size={14} color="#00a884" /> : <Copy size={14} />}
              <span>{copied ? 'Script SQL Copiado al Portapapeles' : 'Copiar Script SQL para Supabase'}</span>
            </button>
          </div>

          {/* Paso 2: Variables de Entorno */}
          <div style={{ borderLeft: '3px solid #8b5cf6', paddingLeft: 14 }}>
            <h4 style={{ fontWeight: 700, color: '#ffffff', marginBottom: 4 }}>
              Paso 2: Configurar Variables de Entorno
            </h4>
            <p style={{ color: 'var(--wa-text-secondary)', lineHeight: 1.45, marginBottom: 8 }}>
              En Supabase ve a <strong>Project Settings &gt; API</strong> y copia las claves a <code style={{ color: '#a78bfa' }}>.env.local</code> o a las variables de entorno de Vercel:
            </p>
            <div style={{
              backgroundColor: '#0c1317',
              padding: '10px 14px',
              borderRadius: '6px',
              fontFamily: 'monospace',
              fontSize: '0.78rem',
              color: '#d1d5db',
              lineHeight: 1.5,
              border: '1px solid var(--wa-border)'
            }}>
              NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co<br />
              NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anon_publica
            </div>
          </div>

          {/* Paso 3: Vercel */}
          <div style={{ borderLeft: '3px solid #ec4899', paddingLeft: 14 }}>
            <h4 style={{ fontWeight: 700, color: '#ffffff', marginBottom: 4 }}>
              Paso 3: Despliegue en Vercel
            </h4>
            <p style={{ color: 'var(--wa-text-secondary)', lineHeight: 1.45 }}>
              1. Sube la carpeta <code style={{ color: '#ec4899' }}>whatsapp-next</code> a tu repositorio en GitHub.<br />
              2. En Vercel haz clic en <strong>Add New &gt; Project</strong> e importa el repositorio.<br />
              3. Agrega las variables de Supabase y haz clic en <strong>Deploy</strong>.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              backgroundColor: '#00a884',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 20px',
              color: '#111b21',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
