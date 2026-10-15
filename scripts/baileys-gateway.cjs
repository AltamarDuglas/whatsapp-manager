/**
 * ============================================================================
 * ARCHIVO: scripts/baileys-gateway.cjs
 * DESCRIPCIÓN: Microservicio Gateway ultra-robusto y de alta velocidad para Baileys.
 *              - Generación de código QR instantánea sin bloqueo de red.
 *              - Auto-recuperación automática ante timeouts (código 408) y desconexiones.
 *              - Prevención de terminación del proceso (inmune a caídas).
 * PUERTO: 3001 (configurable mediante variable PORT).
 * PRINCIPIO SOLID: Single Responsibility Principle (SRP)
 * ============================================================================
 */

const http = require('http');
const path = require('path');
const fs = require('fs');
const QRCode = require('qrcode');
const pino = require('pino');
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require('@whiskeysockets/baileys');

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
const SESSIONS_DIR = path.resolve(__dirname, '../data/baileys_auth');

// Versión estable de Baileys en caché para evitar demoras por peticiones HTTP externas
const DEFAULT_VERSION = [2, 3000, 1015901307];

let sock = null;
let isConnected = false;
let currentQrCode = null;
let currentQrDataUrl = null;
let currentQrTimestamp = 0;
let connectedUser = null;
let isInitializing = false;
let isManualDisconnect = false;
let reconnectTimer = null;
const qrListeners = [];

// Aseguramos que el directorio de sesiones exista
if (!fs.existsSync(SESSIONS_DIR)) {
  fs.mkdirSync(SESSIONS_DIR, { recursive: true });
}

// Limpieza de listeners de QR pendientes
function notifyQrListeners(qrDataUrl) {
  while (qrListeners.length > 0) {
    const callback = qrListeners.shift();
    try { callback(qrDataUrl); } catch (_) {}
  }
}

/**
 * Limpia los archivos temporales de sesión cuando una vinculación expira (código 408)
 * para evitar que Baileys intente reanudar credenciales inválidas.
 */
function cleanEphemeralAuth() {
  if (isConnected) return; // Nunca borrar si está conectado
  try {
    if (fs.existsSync(SESSIONS_DIR)) {
      const files = fs.readdirSync(SESSIONS_DIR);
      for (const file of files) {
        // Borramos claves temporales efímeras de pre-autenticación
        if (file.startsWith('pre-key-') || file.startsWith('session-') || file === 'creds.json') {
          try { fs.unlinkSync(path.join(SESSIONS_DIR, file)); } catch (_) {}
        }
      }
    }
  } catch (e) {
    console.warn('[BaileysGateway] Advertencia limpiando auth efímero:', e.message);
  }
}

/**
 * Inicializa Baileys y retorna una promesa que resuelve en cuanto el QR está disponible.
 * @param {boolean} [forceNew=false] Si es true, reinicia el socket aunque exista uno.
 */
function initBaileys(forceNew = false) {
  if (sock && isConnected && !forceNew) {
    return Promise.resolve({ isConnected: true, hasQr: false, user: connectedUser });
  }

  // Si ya tenemos un QR generado en los últimos 20 segundos y no es forzado, lo devolvemos
  const qrAgeMs = Date.now() - currentQrTimestamp;
  if (!forceNew && currentQrDataUrl && qrAgeMs < 20000) {
    return Promise.resolve({ isConnected: false, hasQr: true, qrDataUrl: currentQrDataUrl });
  }

  const qrPromise = new Promise((resolve) => {
    const timeout = setTimeout(() => {
      resolve({
        isConnected,
        hasQr: Boolean(currentQrDataUrl),
        qrDataUrl: currentQrDataUrl
      });
    }, 8000);

    qrListeners.push((dataUrl) => {
      clearTimeout(timeout);
      resolve({ isConnected: false, hasQr: Boolean(dataUrl), qrDataUrl: dataUrl });
    });
  });

  if (isInitializing && !forceNew) {
    return qrPromise;
  }

  isInitializing = true;
  isManualDisconnect = false;

  (async () => {
    try {
      if (sock) {
        try {
          sock.ev.removeAllListeners('connection.update');
          sock.ev.removeAllListeners('creds.update');
          sock.end(undefined);
        } catch (_) {}
        sock = null;
      }

      const { state, saveCreds } = await useMultiFileAuthState(SESSIONS_DIR);

      sock = makeWASocket({
        version: DEFAULT_VERSION,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false, // El frontend se encarga del render visual limpio
        auth: state,
        browser: ['Secretaría WhatsApp', 'Desktop', '1.0.0'],
        syncFullHistory: false,
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 60000,
        keepAliveIntervalMs: 25000
      });

      sock.ev.on('creds.update', saveCreds);

      sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        // Se generó un nuevo código QR
        if (qr) {
          currentQrCode = qr;
          currentQrTimestamp = Date.now();
          try {
            currentQrDataUrl = await QRCode.toDataURL(qr, {
              margin: 2,
              scale: 7,
              color: { dark: '#111b21', light: '#ffffff' }
            });
            isInitializing = false;
            console.log('[BaileysGateway] Código QR generado y listo para escanear.');
            notifyQrListeners(currentQrDataUrl);
          } catch (err) {
            console.error('[BaileysGateway] Error convirtiendo QR a DataURL:', err.message);
          }
        }

        // WhatsApp conectado exitosamente
        if (connection === 'open') {
          isConnected = true;
          currentQrCode = null;
          currentQrDataUrl = null;
          isInitializing = false;

          const rawId = sock.user?.id || '';
          const phone = rawId.split(':')[0] || rawId.split('@')[0];
          const name = sock.user?.name || 'Operador Secretaría';

          connectedUser = { id: rawId, phone, name };
          console.log(`========================================================`);
          console.log(`✓ WHATSAPP VINCULADO EXITOSAMENTE`);
          console.log(`📱 Número: +${phone} | Usuario: ${name}`);
          console.log(`========================================================`);
          notifyQrListeners(null);
        }

        // Conexión cerrada
        if (connection === 'close') {
          isConnected = false;
          isInitializing = false;

          const statusCode = lastDisconnect?.error?.output?.statusCode;
          const isTimedOut = statusCode === DisconnectReason.timedOut || statusCode === 408;
          const isLoggedOut = statusCode === DisconnectReason.loggedOut;
          const shouldReconnect = !isLoggedOut && !isManualDisconnect;

          console.log(`[BaileysGateway] Conexión cerrada (Código: ${statusCode || 'desconocido'}). Reconectar: ${shouldReconnect}`);

          if (isTimedOut) {
            // El QR anterior expiró sin escanear: limpiamos auth efímero y regeneramos de inmediato
            cleanEphemeralAuth();
          }

          if (shouldReconnect) {
            if (reconnectTimer) clearTimeout(reconnectTimer);
            reconnectTimer = setTimeout(() => {
              console.log('[BaileysGateway] Reconectando y solicitando nuevo código QR...');
              initBaileys(true);
            }, 1200);
          } else {
            currentQrCode = null;
            currentQrDataUrl = null;
            connectedUser = null;
            sock = null;
          }
        }
      });

      // Manejo de mensajes entrantes
      sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type === 'notify') {
          for (const msg of messages) {
            if (!msg.key.fromMe) {
              const sender = msg.key.remoteJid;
              const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
              console.log(`[BaileysGateway] Mensaje entrante de ${sender}: ${text}`);
            }
          }
        }
      });

    } catch (error) {
      console.error('[BaileysGateway] Error durante arranque de Baileys:', error.message);
      isInitializing = false;
      notifyQrListeners(null);
    }
  })();

  return qrPromise;
}

/**
 * Desconecta la sesión y resetea las credenciales en disco.
 */
async function disconnectBaileys() {
  isManualDisconnect = true;
  isConnected = false;
  currentQrCode = null;
  currentQrDataUrl = null;
  connectedUser = null;

  if (sock) {
    try {
      sock.ev.removeAllListeners('connection.update');
      sock.ev.removeAllListeners('creds.update');
      await sock.logout();
      sock.end(undefined);
    } catch (_) {}
    sock = null;
  }

  // Eliminar archivos de sesión
  try {
    if (fs.existsSync(SESSIONS_DIR)) {
      const files = fs.readdirSync(SESSIONS_DIR);
      for (const file of files) {
        fs.unlinkSync(path.join(SESSIONS_DIR, file));
      }
    }
  } catch (err) {
    console.warn('[BaileysGateway] Error limpiando credenciales:', err.message);
  }

  console.log('[BaileysGateway] Sesión desconectada y credenciales limpiadas.');
}

/**
 * Servidor HTTP REST para comunicar con Next.js (Local o Vercel)
 */
const server = http.createServer(async (req, res) => {
  // Configuración de cabeceras CORS permisivas para permitir llamadas remotas
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Cache-Control, x-baileys-gateway-url');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);

  // Endpoint: GET /api/whatsapp/status
  if (req.method === 'GET' && url.pathname === '/api/whatsapp/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      data: {
        provider: 'baileys',
        isConnected,
        hasQr: Boolean(currentQrDataUrl),
        qrDataUrl: currentQrDataUrl,
        qrAgeSeconds: currentQrTimestamp ? Math.round((Date.now() - currentQrTimestamp) / 1000) : 0,
        user: connectedUser,
        status: isConnected
          ? 'connected'
          : currentQrDataUrl
          ? 'qr_ready'
          : isInitializing
          ? 'initializing'
          : 'disconnected'
      }
    }));
    return;
  }

  // Endpoint: POST /api/whatsapp/connect
  if (req.method === 'POST' && url.pathname === '/api/whatsapp/connect') {
    const force = url.searchParams.get('force') === 'true';
    const result = await initBaileys(force);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      message: 'Proceso de conexión Baileys ejecutado.',
      data: {
        isConnected: result.isConnected,
        hasQr: result.hasQr,
        qrDataUrl: result.qrDataUrl,
        user: result.user || connectedUser
      }
    }));
    return;
  }

  // Endpoint: POST /api/whatsapp/disconnect
  if (req.method === 'POST' && url.pathname === '/api/whatsapp/disconnect') {
    await disconnectBaileys();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      message: 'Sesión de WhatsApp desconectada correctamente.'
    }));
    return;
  }

  // Endpoint: POST /api/whatsapp/send
  if (req.method === 'POST' && url.pathname === '/api/whatsapp/send') {
    if (!isConnected || !sock) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: 'WhatsApp no está vinculado. Escanea el código QR primero.'
      }));
      return;
    }

    let bodyStr = '';
    req.on('data', chunk => { bodyStr += chunk; });
    req.on('end', async () => {
      try {
        const { phone, message } = JSON.parse(bodyStr || '{}');

        if (!phone || !message) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Teléfono y mensaje son obligatorios.' }));
          return;
        }

        let cleanPhone = String(phone).replace(/\D/g, '');
        if (cleanPhone.length === 10 && cleanPhone.startsWith('3')) {
          cleanPhone = '57' + cleanPhone;
        }
        const jid = `${cleanPhone}@s.whatsapp.net`;

        const sent = await sock.sendMessage(jid, { text: message });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          messageId: sent.key.id,
          recipient: cleanPhone
        }));
      } catch (sendErr) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: `Error al despachar mensaje: ${sendErr.message}`
        }));
      }
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Ruta no encontrada en el gateway de Baileys' }));
});

// Protección contra caídas inesperadas
process.on('uncaughtException', (err) => {
  console.error('[BaileysGateway] Excepción no capturada (mantenimiento activo):', err.message);
});

process.on('unhandledRejection', (reason) => {
  console.error('[BaileysGateway] Rechazo no manejado (mantenimiento activo):', reason);
});

server.listen(PORT, () => {
  console.log(`========================================================`);
  console.log(`📡 BAILEYS GATEWAY ACTIVO EN EL PUERTO ${PORT}`);
  console.log(`🔗 Endpoint de Estado: http://localhost:${PORT}/api/whatsapp/status`);
  console.log(`========================================================`);

  // Pre-iniciar la conexión para tener el código QR listo de inmediato
  initBaileys();
});

process.on('SIGINT', async () => {
  console.log('\n[BaileysGateway] Apagando gateway...');
  if (sock) {
    try { sock.end(undefined); } catch (_) {}
  }
  process.exit(0);
});
