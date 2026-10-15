/**
 * ============================================================================
 * ARCHIVO: components/BaileysQrModal/BaileysQrModal.js
 * DESCRIPCIÓN: Modal interactivo para vincular WhatsApp escaneando el código QR
 *              multi-dispositivo generado por Baileys.
 *              Totalmente compatible con Vercel Serverless mediante configuración
 *              de Gateway público (Render, Railway o túnel Ngrok / Localtunnel).
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
  Cloud,
  Globe,
  Terminal,
  Settings,
  Check,
  Copy,
  Server
} from 'lucide-react';
import { PhoneFormatter } from '@/src/services/PhoneFormatter';

export default function BaileysQrModal({ isOpen, onClose, onConnectionChanged }) {
  const [statusData, setStatusData] = useState({
    gatewayOnline: false,
    isConnected: false,
    hasQr: false,
    qrDataUrl: null,
    user: null,
    status: 'checking',
    isVercel: false,
    isLocalhost: true,
    gatewayUrl: 'http://localhost:3001'
  });

  const [isLoading, setIsLoading] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState('Mensaje de prueba oficial desde la Secretaría del Reinado del Río 2026.');
  const [testFeedback, setTestFeedback] = useState(null);
  const [isSendingTest, setIsSendingTest] = useState(false);

  // Estados de configuración de Gateway para Vercel
  const [showConfig, setShowConfig] = useState(false);
  const [customGatewayUrl, setCustomGatewayUrl] = useState('');
  const [configSaving, setConfigSaving] = useState(false);
  const [configFeedback, setConfigFeedback] = useState(null);
  const [copiedCommand, setCopiedCommand] = useState(null);

  const pollTimerRef = useRef(null);

  // Cargar URL guardada en localStorage al montar
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('baileys_custom_gateway_url');
      if (saved) {
        setCustomGatewayUrl(saved);
      }
    }
  }, []);

  // Construye las cabeceras personalizadas para peticiones al backend
  const getHeaders = () => {
    const headers = { 'Content-Type': 'application/json' };
    if (customGatewayUrl && customGatewayUrl.trim()) {
      headers['x-baileys-gateway-url'] = customGatewayUrl.trim();
    }
    return headers;
  };

  // Consulta el estado del Gateway de Baileys
  const fetchStatus = async () => {
    try {
      const headers = {};
      if (customGatewayUrl && customGatewayUrl.trim()) {
        headers['x-baileys-gateway-url'] = customGatewayUrl.trim();
      }

      const res = await fetch('/api/baileys/status', {
        headers,
        cache: 'no-store'
      });
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
  }, [isOpen, customGatewayUrl]);

  if (!isOpen) return null;

  // Iniciar la conexión y solicitar el código QR
  const handleConnect = async () => {
    // Si estamos en Vercel y no hay gateway público configurado, abrir configuración
    if (statusData.isVercel && (statusData.isLocalhost || !customGatewayUrl.trim())) {
      setShowConfig(true);
      setConfigFeedback({
        success: false,
        message: 'En Vercel se requiere la URL pública del Gateway de Baileys (Render, Railway o túnel con ngrok/localtunnel).'
      });
      return;
    }

    setIsLoading(true);
    setTestFeedback(null);
    try {
      const res = await fetch('/api/baileys/connect', {
        method: 'POST',
        headers: getHeaders()
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setTestFeedback({ success: false, message: data.error || 'Error solicitando conexión.' });
        if (data.isVercel && data.isLocalhost) {
          setShowConfig(true);
        }
      }
      await fetchStatus();
    } catch (err) {
      console.error('[BaileysQrModal] Error al conectar:', err);
      setTestFeedback({ success: false, message: 'No se pudo contactar el servidor de Baileys.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Desconectar la sesión activa
  const handleDisconnect = async () => {
    if (!confirm('¿Deseas desconectar la sesión de WhatsApp vinculada?')) return;
    setIsLoading(true);
    try {
      await fetch('/api/baileys/disconnect', {
        method: 'POST',
        headers: getHeaders()
      });
      await fetchStatus();
    } catch (err) {
      console.error('[BaileysQrModal] Error al desconectar:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Guardar URL de Gateway personalizada (para Vercel o túneles)
  const handleSaveGatewayUrl = async (e) => {
    e?.preventDefault();
    if (!customGatewayUrl.trim()) return;

    setConfigSaving(true);
    setConfigFeedback(null);

    try {
      const res = await fetch('/api/baileys/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gatewayUrl: customGatewayUrl.trim() })
      });
      const data = await res.json();

      if (data.success) {
        localStorage.setItem('baileys_custom_gateway_url', customGatewayUrl.trim());
        setConfigFeedback({
          success: true,
          message: data.pingSuccess
            ? 'Gateway verificado y conectado exitosamente.'
            : 'URL guardada. Conectando con el gateway...'
        });
        await fetchStatus();
        if (data.pingSuccess) {
          setShowConfig(false);
          await handleConnect();
        }
      } else {
        setConfigFeedback({ success: false, message: data.error || 'Error guardando URL.' });
      }
    } catch (err) {
      setConfigFeedback({ success: false, message: 'Error de comunicación con el backend.' });
    } finally {
      setConfigSaving(false);
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
        headers: getHeaders(),
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

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedCommand(key);
    setTimeout(() => setCopiedCommand(null), 2000);
  };

  const isConnected = statusData.isConnected === true;
  const isQrReady = statusData.hasQr && Boolean(statusData.qrDataUrl);
  const isVercelLocalhostIssue = statusData.isVercel && (statusData.isLocalhost || !statusData.gatewayOnline) && !isConnected;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0,0,0,0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 220,
      padding: 16
    }}>
      <div style={{
        width: '100%',
        maxWidth: 660,
        maxHeight: '92vh',
        overflowY: 'auto',
        backgroundColor: 'var(--wa-bg-panel)',
        border: '1px solid var(--wa-border)',
        borderRadius: 14,
        padding: 26,
        boxShadow: '0 24px 60px rgba(0,0,0,0.7)',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: 18
      }}>
        {/* Cabecera del modal */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--wa-border)', paddingBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 42,
              height: 42,
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff' }}>
                  Conectar WhatsApp (Baileys)
                </h3>
                {statusData.isVercel && (
                  <span style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 12,
                    backgroundColor: 'rgba(59, 130, 246, 0.18)',
                    color: '#60a5fa',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}>
                    <Cloud size={11} />
                    <span>Vercel Serverless</span>
                  </span>
                )}
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--wa-text-secondary)' }}>
                Vinculación multi-dispositivo sin costos por mensaje de Meta API.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              onClick={() => setShowConfig(!showConfig)}
              title="Configurar servidor Gateway de Baileys"
              style={{
                background: showConfig ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                border: '1px solid var(--wa-border)',
                borderRadius: 8,
                color: 'var(--wa-text-secondary)',
                cursor: 'pointer',
                padding: '6px 10px',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: '0.74rem'
              }}
            >
              <Settings size={14} />
              <span>Gateway</span>
            </button>
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
        </div>

        {/* PANEL DE CONFIGURACIÓN DEL GATEWAY (Para Vercel o servidores remotos) */}
        {showConfig && (
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(59, 130, 246, 0.35)',
            borderRadius: 10,
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 12
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#60a5fa' }}>
              <Server size={18} />
              <h4 style={{ fontSize: '0.92rem', fontWeight: 700, margin: 0 }}>
                Configuración del Microservicio Gateway de Baileys
              </h4>
            </div>

            <p style={{ fontSize: '0.78rem', color: 'var(--wa-text-secondary)', lineHeight: 1.5, margin: 0 }}>
              {statusData.isVercel
                ? 'Al estar en Vercel (servidores serverless en la nube), la aplicación no puede conectarse a "localhost". Debes indicarle la URL pública HTTPS de tu Gateway en Render, Railway o un túnel público.'
                : 'Define la URL del servidor Baileys si estás ejecutándolo en otra máquina o puerto.'}
            </p>

            {/* Formulario para guardar URL */}
            <form onSubmit={handleSaveGatewayUrl} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Globe size={15} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--wa-text-muted)' }} />
                  <input
                    type="url"
                    placeholder="https://mi-gateway.onrender.com o https://xyz.loca.lt"
                    value={customGatewayUrl}
                    onChange={(e) => setCustomGatewayUrl(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px 8px 32px',
                      backgroundColor: 'var(--wa-bg-input)',
                      border: '1px solid var(--wa-border)',
                      borderRadius: 6,
                      color: '#ffffff',
                      fontSize: '0.82rem',
                      fontFamily: 'monospace'
                    }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={configSaving || !customGatewayUrl.trim()}
                  style={{
                    backgroundColor: '#3b82f6',
                    border: 'none',
                    borderRadius: 6,
                    padding: '8px 16px',
                    color: '#ffffff',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: configSaving ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  {configSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  <span>Guardar y Probar</span>
                </button>
              </div>

              {configFeedback && (
                <div style={{
                  padding: '8px 12px',
                  borderRadius: 6,
                  backgroundColor: configFeedback.success ? 'rgba(0, 168, 132, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                  color: configFeedback.success ? '#00a884' : '#f87171',
                  fontSize: '0.76rem'
                }}>
                  {configFeedback.message}
                </div>
              )}
            </form>

            {/* Guía Rápida para Vercel */}
            <div style={{
              backgroundColor: 'var(--wa-bg-deep)',
              border: '1px solid var(--wa-border)',
              borderRadius: 8,
              padding: 12,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              fontSize: '0.76rem'
            }}>
              <span style={{ fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Terminal size={14} color="#60a5fa" />
                <span>¿Cómo generar tu URL pública en 1 minuto? (Opción Túnel Gratuito):</span>
              </span>
              <p style={{ margin: 0, color: 'var(--wa-text-secondary)' }}>
                1. Ejecuta el gateway en tu PC local:
              </p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#0d1117', padding: '6px 10px', borderRadius: 6, fontFamily: 'monospace', color: '#a78bfa' }}>
                <code>npm run gateway</code>
                <button
                  type="button"
                  onClick={() => copyToClipboard('npm run gateway', 'npm_run')}
                  style={{ background: 'none', border: 'none', color: 'var(--wa-text-muted)', cursor: 'pointer' }}
                >
                  {copiedCommand === 'npm_run' ? <Check size={13} color="#00a884" /> : <Copy size={13} />}
                </button>
              </div>

              <p style={{ margin: 0, color: 'var(--wa-text-secondary)' }}>
                2. En otra terminal, abre el túnel público gratuito:
              </p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#0d1117', padding: '6px 10px', borderRadius: 6, fontFamily: 'monospace', color: '#a78bfa' }}>
                <code>npx localtunnel --port 3001</code>
                <button
                  type="button"
                  onClick={() => copyToClipboard('npx localtunnel --port 3001', 'tunnel')}
                  style={{ background: 'none', border: 'none', color: 'var(--wa-text-muted)', cursor: 'pointer' }}
                >
                  {copiedCommand === 'tunnel' ? <Check size={13} color="#00a884" /> : <Copy size={13} />}
                </button>
              </div>

              <p style={{ margin: 0, color: 'var(--wa-text-secondary)' }}>
                3. Copia la URL pública generada (ej: <code>https://mi-servidor.loca.lt</code>) y pégala arriba.
              </p>
            </div>
          </div>
        )}

        {/* ALERTA VISUAL SI ESTÁ EN VERCEL Y TIENE EL ERROR DE LOCALHOST */}
        {isVercelLocalhostIssue && !showConfig && (
          <div style={{
            backgroundColor: 'rgba(59, 130, 246, 0.08)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: 10,
            padding: 14,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12
          }}>
            <Cloud size={20} color="#60a5fa" style={{ flexShrink: 0, marginTop: 2 }} />
            <div style={{ flex: 1 }}>
              <h4 style={{ fontSize: '0.86rem', fontWeight: 700, color: '#ffffff', margin: '0 0 4px 0' }}>
                Estás corriendo en Vercel (Serverless)
              </h4>
              <p style={{ fontSize: '0.78rem', color: 'var(--wa-text-secondary)', margin: '0 0 8px 0', lineHeight: 1.4 }}>
                Las funciones serverless de Vercel no tienen acceso a tu computadora local (<code style={{ color: '#93c5fd' }}>localhost:3001</code>). Para generar el QR necesitas enlazar un Gateway público o crear un túnel en 1 comando.
              </p>
              <button
                type="button"
                onClick={() => setShowConfig(true)}
                style={{
                  backgroundColor: '#3b82f6',
                  border: 'none',
                  borderRadius: 6,
                  padding: '6px 14px',
                  color: '#ffffff',
                  fontSize: '0.76rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <Settings size={13} />
                <span>Configurar URL del Gateway Ahora</span>
              </button>
            </div>
          </div>
        )}

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
              WhatsApp Conectado y Activo
            </h4>
            <p style={{ fontSize: '0.84rem', color: 'var(--wa-text-secondary)', marginBottom: 16 }}>
              La plataforma está sincronizada para enviar mensajes directamente desde este número.
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
                <li>Toca <strong>Menú ⋮</strong> (Android) o <strong>Configuración ⚙</strong> (iPhone).</li>
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
            padding: '20px 16px',
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
              <p style={{ fontSize: '0.82rem', color: 'var(--wa-text-secondary)', maxWidth: 460, lineHeight: 1.5 }}>
                Genera el código QR para vincular tu WhatsApp personal o institucional y comenzar a enviar y gestionar campañas masivas.
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
                padding: '11px 24px',
                color: '#111b21',
                fontSize: '0.88rem',
                fontWeight: 700,
                cursor: isLoading ? 'wait' : 'pointer',
                marginTop: 4,
                boxShadow: '0 4px 14px rgba(0, 168, 132, 0.3)'
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Conectando con Gateway y generando QR...</span>
                </>
              ) : (
                <>
                  <QrCode size={16} strokeWidth={2.5} />
                  <span>Generar Código QR de WhatsApp</span>
                </>
              )}
            </button>

            {testFeedback && (
              <div style={{
                padding: '8px 12px',
                borderRadius: 6,
                backgroundColor: testFeedback.success ? 'rgba(0, 168, 132, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                color: testFeedback.success ? '#00a884' : '#f87171',
                fontSize: '0.78rem',
                maxWidth: 480
              }}>
                {testFeedback.message}
              </div>
            )}

            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--wa-border)',
              borderRadius: 8,
              padding: '10px 14px',
              fontSize: '0.74rem',
              color: 'var(--wa-text-muted)',
              maxWidth: 460,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12
            }}>
              <span>Gateway actual: <code style={{ color: '#a78bfa' }}>{statusData.gatewayUrl || 'localhost:3001'}</code></span>
              <button
                type="button"
                onClick={() => setShowConfig(!showConfig)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#60a5fa',
                  fontSize: '0.74rem',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  padding: 0
                }}
              >
                Cambiar URL
              </button>
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
