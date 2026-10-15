/**
 * ============================================================================
 * ARCHIVO: components/MassCampaign/MassCampaign.js
 * DESCRIPCIÓN: Módulo de envíos masivos con filtro de audiencia y protección anti-baneo.
 * PRINCIPIO SOLID: Single Responsibility Principle (SRP)
 * REGLA ESTRICTA: Sin emojis. Solo vectores SVG limpios de Lucide.
 * ============================================================================
 */

'use client';

import React, { useState } from 'react';
import { Send, ShieldAlert, Play, Eye, Crown, Star, Building2, Users, CheckCircle2 } from 'lucide-react';
import { TemplateEngine } from '@/src/services/TemplateEngine';

export default function MassCampaign({ contacts = [] }) {
  const [targetCategory, setTargetCategory] = useState('Reinas');
  const [campaignTitle, setCampaignTitle] = useState('Convocatoria Oficial Reinado del Río 2026');
  const [templateText, setTemplateText] = useState(
    'Estimada {{nombre}},\n\nDesde la Secretaría te extendemos la invitación oficial a la sesión preparatoria del Reinado del Río 2026. Favor confirmar asistencia.\n\nSecretaría General'
  );
  const [minDelay, setMinDelay] = useState(4);
  const [maxDelay, setMaxDelay] = useState(7);
  const [isSending, setIsSending] = useState(false);
  const [progress, setProgress] = useState(0);
  const [auditLogs, setAuditLogs] = useState([]);

  const targetAudience = targetCategory === 'Todos'
    ? contacts
    : contacts.filter((c) => c.category?.toLowerCase() === targetCategory.toLowerCase());

  const sampleContact = targetAudience[0] || {
    name: 'Valentina Gómez',
    phone: '573001234501',
    category: 'Reinas',
    custom_fields: { cargo: 'Reina Central' }
  };

  const previewRendered = TemplateEngine.render(templateText, {
    nombre: sampleContact.name,
    categoria: sampleContact.category,
    telefono: sampleContact.phone,
    ...(sampleContact.custom_fields || sampleContact.customFields || {})
  });

  const insertVariable = (variable) => {
    setTemplateText((prev) => `${prev} {{${variable}}}`);
  };

  const handleStartCampaign = async () => {
    if (targetAudience.length === 0) {
      alert(`No hay contactos registrados en la categoría "${targetCategory}".`);
      return;
    }

    setIsSending(true);
    setProgress(0);
    setAuditLogs([]);

    addLog(`Iniciando campaña "${campaignTitle}" para ${targetAudience.length} destinatarios (${targetCategory})...`, 'info');

    try {
      const res = await fetch('/api/campaigns/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: campaignTitle,
          template: templateText,
          category: targetCategory,
          minDelayMs: minDelay * 1000,
          maxDelayMs: maxDelay * 1000,
          providerPreference: 'simulation'
        })
      });

      const data = await res.json();

      if (data.success) {
        setProgress(100);
        for (const item of data.results || []) {
          addLog(`Enviado a ${item.name} (${item.phone}): "${item.preview.substring(0, 35)}..."`, 'success');
        }
        addLog(`Campaña finalizada con éxito: ${data.summary.sent} enviados.`, 'finish');
      } else {
        addLog(`Error en la campaña: ${data.error}`, 'error');
      }
    } catch (err) {
      addLog(`Error al ejecutar campaña: ${err.message}`, 'error');
    } finally {
      setIsSending(false);
    }
  };

  const addLog = (msg, type = 'info') => {
    const time = new Date().toLocaleTimeString();
    setAuditLogs((prev) => [...prev, { time, msg, type }]);
  };

  return (
    <div style={{
      flex: 1,
      height: '100%',
      overflowY: 'auto',
      backgroundColor: 'var(--wa-bg-panel)',
      padding: '24px 32px',
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
      gap: 24
    }}>
      {/* Columna Izquierda: Configuración */}
      <div style={{
        backgroundColor: 'var(--wa-bg-chat)',
        border: '1px solid var(--wa-border)',
        borderRadius: '10px',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16
      }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Send size={20} color="#00a884" />
            <span>Configurar Envío Masivo</span>
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--wa-text-secondary)', marginTop: 2 }}>
            Segmenta envíos por categoría institucional con protección anti-baneo.
          </p>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--wa-text-secondary)', marginBottom: 4 }}>
            Título de la Campaña
          </label>
          <input
            type="text"
            value={campaignTitle}
            onChange={(e) => setCampaignTitle(e.target.value)}
            style={{
              width: '100%',
              backgroundColor: 'var(--wa-bg-input)',
              border: '1px solid var(--wa-border)',
              borderRadius: '6px',
              padding: '8px 12px',
              color: 'var(--wa-text-primary)',
              fontSize: '0.86rem'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--wa-text-secondary)', marginBottom: 4 }}>
            Audiencia Objetivo (Clasificación en BD)
          </label>
          <select
            value={targetCategory}
            onChange={(e) => setTargetCategory(e.target.value)}
            style={{
              width: '100%',
              backgroundColor: 'var(--wa-bg-input)',
              border: '1px solid var(--wa-border)',
              borderRadius: '6px',
              padding: '8px 12px',
              color: 'var(--wa-text-primary)',
              fontSize: '0.86rem'
            }}
          >
            <option value="Reinas">Reinas ({contacts.filter(c => c.category?.toLowerCase() === 'reinas').length})</option>
            <option value="VIP">VIP</option>
            <option value="Secretaría">Secretaría</option>
            <option value="Líderes">Líderes</option>
            <option value="Todos">Todos los números registrados ({contacts.length})</option>
          </select>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <label style={{ fontSize: '0.78rem', color: 'var(--wa-text-secondary)' }}>
              Plantilla del Mensaje de WhatsApp
            </label>
            <span style={{ fontSize: '0.74rem', color: '#00a884', fontWeight: 600 }}>
              {targetAudience.length} destinatarios
            </span>
          </div>

          <textarea
            rows={5}
            value={templateText}
            onChange={(e) => setTemplateText(e.target.value)}
            style={{
              width: '100%',
              backgroundColor: 'var(--wa-bg-input)',
              border: '1px solid var(--wa-border)',
              borderRadius: '6px',
              padding: '10px 12px',
              color: 'var(--wa-text-primary)',
              fontSize: '0.86rem',
              lineHeight: 1.45,
              resize: 'vertical',
              fontFamily: 'inherit'
            }}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--wa-text-muted)' }}>Variables:</span>
            {['nombre', 'categoria', 'telefono', 'cargo'].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => insertVariable(v)}
                style={{
                  fontSize: '0.72rem',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  border: '1px solid var(--wa-border)',
                  backgroundColor: 'var(--wa-bg-hover)',
                  color: '#00a884',
                  cursor: 'pointer'
                }}
              >
                {`{{${v}}}`}
              </button>
            ))}
          </div>
        </div>

        {/* Protección Anti-Baneo */}
        <div style={{
          backgroundColor: 'rgba(0, 168, 132, 0.08)',
          border: '1px solid rgba(0, 168, 132, 0.25)',
          borderRadius: '8px',
          padding: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, fontSize: '0.8rem', color: '#00a884', fontWeight: 600 }}>
            <ShieldAlert size={15} />
            <span>Protección Anti-Baneo y Cadencia Aleatoria</span>
          </div>
          <div style={{ display: 'flex', gap: 14 }}>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--wa-text-muted)' }}>Mín: {minDelay}s</span>
              <input
                type="range"
                min="2"
                max="10"
                value={minDelay}
                onChange={(e) => setMinDelay(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#00a884' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--wa-text-muted)' }}>Máx: {maxDelay}s</span>
              <input
                type="range"
                min="5"
                max="15"
                value={maxDelay}
                onChange={(e) => setMaxDelay(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#00a884' }}
              />
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleStartCampaign}
          disabled={isSending || targetAudience.length === 0}
          style={{
            backgroundColor: '#00a884',
            color: '#111b21',
            border: 'none',
            borderRadius: '6px',
            padding: '12px',
            fontWeight: 700,
            fontSize: '0.88rem',
            cursor: isSending || targetAudience.length === 0 ? 'not-allowed' : 'pointer',
            opacity: isSending || targetAudience.length === 0 ? 0.6 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8
          }}
        >
          <Play size={16} fill="#111b21" />
          <span>{isSending ? 'Enviando Campaña...' : `Ejecutar Envío (${targetAudience.length} Contactos)`}</span>
        </button>
      </div>

      {/* Columna Derecha: Previsualización en Vivo y Terminal */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Previsualización en WhatsApp Desktop */}
        <div style={{
          backgroundColor: 'var(--wa-bg-chat)',
          border: '1px solid var(--wa-border)',
          borderRadius: '10px',
          padding: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, color: 'var(--wa-text-primary)' }}>
            <Eye size={16} color="#00a884" />
            <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>Previsualización en Vivo</span>
          </div>

          <div className="wa-chat-pattern" style={{ padding: '24px 16px', borderRadius: '8px', minHeight: 120 }}>
            <div className="wa-bubble-outgoing" style={{ padding: '8px 12px', maxWidth: '85%' }}>
              <div style={{ fontSize: '0.88rem', whiteSpace: 'pre-wrap', lineHeight: 1.45 }}>
                {previewRendered}
              </div>
              <div style={{ textAlign: 'right', fontSize: '0.66rem', color: 'var(--wa-text-muted)', marginTop: 4 }}>
                10:25 a. m.
              </div>
            </div>
          </div>
        </div>

        {/* Terminal de Auditoría */}
        <div style={{
          flex: 1,
          backgroundColor: 'var(--wa-bg-chat)',
          border: '1px solid var(--wa-border)',
          borderRadius: '10px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--wa-text-primary)', marginBottom: 8 }}>
            Terminal de Auditoría
          </span>

          <div style={{
            height: 6,
            backgroundColor: 'var(--wa-bg-hover)',
            borderRadius: 4,
            overflow: 'hidden',
            marginBottom: 12
          }}>
            <div style={{ width: `${progress}%`, height: '100%', backgroundColor: '#00a884', transition: 'width 0.3s' }} />
          </div>

          <div style={{
            flex: 1,
            minHeight: 180,
            backgroundColor: '#0c1317',
            borderRadius: '6px',
            padding: '12px',
            fontFamily: 'monospace',
            fontSize: '0.78rem',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 4
          }}>
            {auditLogs.length === 0 ? (
              <span style={{ color: 'var(--wa-text-dim)' }}>
                Esperando inicio de campaña...
              </span>
            ) : (
              auditLogs.map((log, i) => (
                <div key={i} style={{ color: log.type === 'success' ? '#00a884' : log.type === 'error' ? '#f87171' : '#e9edef' }}>
                  <span style={{ color: 'var(--wa-text-muted)', marginRight: 6 }}>[{log.time}]</span>
                  <span>{log.msg}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
