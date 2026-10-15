/**
 * ============================================================================
 * ARCHIVO: components/BaileysQrModal/BaileysQrModal.js
 * DESCRIPCIÓN: Modal interactivo para vincular WhatsApp escaneando el código QR
 *              multi-dispositivo generado por Baileys.
 * PRINCIPIO SOLID: Single Responsibility Principle (SRP)
 * REGLA ESTRICTA: Sin emojis. Solo vectores SVG limpios de Lucide.
 * ============================================================================
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  QrCode,
  Smartphone,
  CheckCircle2,
  RefreshCw,
  Power,
  Loader2,
  Send,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { PhoneFormatter } from '@/src/services/PhoneFormatter';

export default function BaileysQrModal({ isOpen, onClose, onConnectionChanged }) {
  const [statusData, setStatusData] = useState({
    gatewayOnline: false,
    isConnected: false,
    hasQr: false,
    qrDataUrl: null,
    user: null,
    status: 'checking'
  });

  const [isLoading, setIsLoading] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState('¡Hola! Mensaje de prueba desde la Secretaría del Reinado del Río 2026.');
  const [testFeedback, setTestFeedback] = useState(null);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const pollTimerRef = useRef(null);

  // Consulta el estado del Gateway de Baileys
  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/baileys/status');
      const data = await res.json();
      setStatusData(data);
      if (onConnectionChanged) {
        onConnectionChanged(data);
      }
    } catch (err) {
      console.warn('[BaileysQrModal] Error consultando estado:', err);
    }
  };

  // Iniciar sondeo periódico cada 2.5s mientras el modal esté abierto
  useEffect(() => {
    if (isOpen) {
      fetchStatus();
      pollTimerRef.current = setInterval(fetchStatus, 2500);
    } else {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    }
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Iniciar la conexión y solicitar el código QR
  const handleConnect = async () => {
    setIsLoading(true);
    setTestFeedback(null);
    try {
      const res = await fetch('/api/baileys/connect', { method: 'POST' });
      await res.json();
      await fetchStatus();
    } catch (err) {
      console.error('[BaileysQrModal] Error al conectar:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Desconectar la sesión activa
  const handleDisconnect = async () => {
    if (!confirm('¿Deseas desconectar la sesión de WhatsApp vinculada?')) return;
    setIsLoading(true);
    try {
      await fetch('/api/baileys/disconnect', { method: 'POST' });
      await fetchStatus();
    } catch (err) {
      console.error('[BaileysQrModal] Error al desconectar:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Enviar mensaje de prueba para verificar la vinculación
  const handleSendTest = async (e) => {
    e.preventDefault();
    if (!testPhone.trim() || !testMessage.trim()) return;

    setIsSendingTest(true);
    setTestFeedback(null);

    try {
      const res = await fetch('/api/baileys/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: testPhone.trim(), message: testMessage.trim() })
      });
      const data = await res.json();

      if (data.success) {
        setTestFeedback({ success: true, message: 'Mensaje de prueba despachado con éxito por Baileys.' });
      } else {
        setTestFeedback({ success: false, message: data.error || 'Error al enviar mensaje.' });
      }
    } catch (err) {
      setTestFeedback({ success: false, message: 'Error de comunicación al enviar.' });
    } finally {
      setIsSendingTest(false);
    }
  };

  const isConnected = statusData.isConnected === true;
  const isQrReady = statusData.hasQr && Boolean(statusData.qrDataUrl);
  const isGatewayOnline = statusData.gatewayOnline === true;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0,0,0,0.8)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 220,
      padding: 16
    }}>
      <div style={{
        width: '100%',
        maxWidth: 620,
        maxHeight: '92vh',
        overflowY: 'auto',
        backgroundColor: 'var(--wa-bg-panel)',
        border: '1px solid var(--wa-border)',
        borderRadius: 12,
        padding: 26,
        boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: 20
      }}>
        {/* Cabecera del modal */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--wa-border)', paddingBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              backgroundColor: isConnected ? 'rgba(0, 168, 132, 0.15)' : 'rgba(255, 255, 255, 0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isConnected ? '#00a884' : '#ffffff'
            }}>
              <QrCode size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff' }}>
                Conectar WhatsApp mediante Código QR (Baileys)
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--wa-text-secondary)' }}>
                Vinculación multi-dispositivo sin depender de Meta Cloud API de pago.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--wa-text-muted)',
              cursor: 'pointer',
              padding: 4
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* CASO 1: CONECTADO EXITOSAMENTE */}
        {isConnected ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '24px 16px',
            backgroundColor: 'rgba(0, 168, 132, 0.08)',
            border: '1px solid rgba(0, 168, 132, 0.3)',
            borderRadius: 10,
            textAlign: 'center'
          }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              backgroundColor: 'rgba(0, 168, 132, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 12
            }}>
              <CheckCircle2 size={32} color="#00a884" />
            </div>

            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', marginBottom: 4 }}>
              ¡WhatsApp Conectado y Activo!
            </h4>
            <p style={{ fontSize: '0.84rem', color: 'var(--wa-text-secondary)', marginBottom: 16 }}>
              La plataforma está sincronizada para enviar y recibir mensajes directamente desde este número.
            </p>

            <div style={{
              display: 'flex',
              gap: 20,
              backgroundColor: 'var(--wa-bg-deep)',
              padding: '12px 24px',
              borderRadius: 8,
              border: '1px solid var(--wa-border)',
              marginBottom: 20,
              fontSize: '0.84rem'
            }}>
              <div>
                <span style={{ color: 'var(--wa-text-muted)', display: 'block', fontSize: '0.72rem' }}>Número Vinculado</span>
                <strong style={{ color: '#00a884' }}>
                  {statusData.user?.phone ? PhoneFormatter.formatDisplay(statusData.user.phone) : 'Número detectado'}
                </strong>
              </div>
              <div>
                <span style={{ color: 'var(--wa-text-muted)', display: 'block', fontSize: '0.72rem' }}>Nombre en WhatsApp</span>
                <strong style={{ color: '#ffffff' }}>
                  {statusData.user?.name || 'Operador Oficial'}
                </strong>
              </div>
            </div>

            {/* Formulario de prueba de envío */}
            <form onSubmit={handleSendTest} style={{ width: '100%', maxWidth: 440, display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'left', borderTop: '1px solid var(--wa-border)', paddingTop: 16 }}>
              <label style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--wa-text-secondary)' }}>
                Enviar mensaje de prueba para verificar:
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  placeholder="Ej: 3001234567"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  style={{
                    flex: 1,
                    backgroundColor: 'var(--wa-bg-input)',
                    border: '1px solid var(--wa-border)',
                    borderRadius: 6,
                    padding: '8px 12px',
                    color: '#ffffff',
                    fontSize: '0.82rem'
                  }}
                />
                <button
                  type="submit"
                  disabled={isSendingTest || !testPhone.trim()}
                  style={{
                    backgroundColor: '#00a884',
                    border: 'none',
                    borderRadius: 6,
                    padding: '8px 16px',
                    color: '#111b21',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: isSendingTest ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  {isSendingTest ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                  <span>Probar</span>
                </button>
              </div>

              {testFeedback && (
                <div style={{
                  padding: '8px 12px',
                  borderRadius: 6,
                  backgroundColor: testFeedback.success ? 'rgba(0, 168, 132, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                  color: testFeedback.success ? '#00a884' : '#f87171',
                  fontSize: '0.76rem'
                }}>
                  {testFeedback.message}
                </div>
              )}
            </form>

            <button
              type="button"
              onClick={handleDisconnect}
              disabled={isLoading}
              style={{
                marginTop: 20,
                backgroundColor: 'transparent',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: 6,
                padding: '6px 16px',
                color: '#f87171',
                fontSize: '0.78rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <Power size={13} />
              <span>Desvincular y Cerrar Sesión</span>
            </button>
          </div>
        ) : isQrReady ? (
          /* CASO 2: CÓDIGO QR LISTO PARA ESCANEAR */
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
            <div style={{
              padding: 12,
              backgroundColor: '#ffffff',
              borderRadius: 12,
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {/* Imagen QR generada por Baileys */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={statusData.qrDataUrl}
                alt="Código QR de WhatsApp"
                style={{ width: 240, height: 240, display: 'block' }}
              />
            </div>

            {/* Instrucciones de vinculación */}
            <div style={{
              width: '100%',
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--wa-border)',
              borderRadius: 8,
              padding: 16,
              fontSize: '0.82rem',
              color: 'var(--wa-text-secondary)',
              lineHeight: 1.6
            }}>
              <p style={{ fontWeight: 600, color: 'var(--wa-text-primary)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Smartphone size={16} color="#00a884" />
                <span>Instrucciones para escanear desde tu teléfono:</span>
              </p>
              <ol style={{ paddingLeft: 20, margin: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <li>Abre <strong>WhatsApp</strong> en tu teléfono móvil.</li>
                <li>Toca <strong>Menú ⋮</strong> (en Android) o <strong>Configuración ⚙</strong> (en iPhone).</li>
                <li>Selecciona <strong>Dispositivos vinculados</strong> y toca <strong>Vincular un dispositivo</strong>.</li>
                <li>Apunta la cámara de tu celular hacia este código QR para sincronizar.</li>
              </ol>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                type="button"
                onClick={handleConnect}
                disabled={isLoading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  backgroundColor: 'var(--wa-bg-hover)',
                  border: '1px solid var(--wa-border)',
                  color: 'var(--wa-text-primary)',
                  padding: '6px 14px',
                  borderRadius: 6,
                  fontSize: '0.78rem',
                  cursor: 'pointer'
                }}
              >
                <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
                <span>Regenerar Código QR</span>
              </button>
            </div>
          </div>
        ) : (
          /* CASO 3: GATEWAY APAGADO O ESPERANDO INICIO */
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '24px 16px',
            textAlign: 'center',
            gap: 14
          }}>
            <div style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              backgroundColor: 'rgba(251, 191, 36, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <QrCode size={28} color="#fbbf24" />
            </div>

            <div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff', marginBottom: 6 }}>
                Iniciar Sesión de WhatsApp Web
              </h4>
              <p style={{ fontSize: '0.82rem', color: 'var(--wa-text-secondary)', maxWidth: 440, lineHeight: 1.5 }}>
                Al hacer clic en el botón abajo se activará el servicio de Baileys para generar el código QR de vinculación.
              </p>
            </div>

            <button
              type="button"
              onClick={handleConnect}
              disabled={isLoading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                backgroundColor: '#00a884',
                border: 'none',
                borderRadius: 8,
                padding: '10px 22px',
                color: '#111b21',
                fontSize: '0.86rem',
                fontWeight: 700,
                cursor: isLoading ? 'wait' : 'pointer',
                marginTop: 6
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Iniciando servicio y generando QR...</span>
                </>
              ) : (
                <>
                  <QrCode size={16} strokeWidth={2.5} />
                  <span>Generar Código QR de WhatsApp</span>
                </>
              )}
            </button>

            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--wa-border)',
              borderRadius: 8,
              padding: '10px 14px',
              fontSize: '0.74rem',
              color: 'var(--wa-text-muted)',
              maxWidth: 440,
              marginTop: 10
            }}>
              <span>También puedes iniciar el servicio manualmente desde tu terminal con:</span>
              <code style={{ display: 'block', color: '#a78bfa', marginTop: 4, fontFamily: 'monospace' }}>
                npm run gateway
              </code>
            </div>
          </div>
        )}

        {/* Pie del modal */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--wa-border)', paddingTop: 14 }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              backgroundColor: 'var(--wa-bg-hover)',
              border: '1px solid var(--wa-border)',
              borderRadius: 6,
              padding: '7px 18px',
              color: 'var(--wa-text-primary)',
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
