/**
 * ============================================================================
 * ARCHIVO: scripts/baileys-gateway.cjs
 * DESCRIPCIÓN: Microservicio Gateway de Baileys para conexión WhatsApp por QR.
 * PUERTO: 3001 (configurable con variable de entorno PORT).
 * PRINCIPIO SOLID: Single Responsibility Principle (SRP)
 *   - Responsabilidad única: Mantener el WebSocket de Baileys, generar y emitir
 *     el código QR en Base64, gestionar la sesión de WhatsApp y exponer una API REST.
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
  DisconnectReason,
  fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys');

// Puerto del Gateway
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
// Directorio de almacenamiento de credenciales de sesión
const SESSIONS_DIR = path.resolve(__dirname, '../data/baileys_auth');

// Variables de estado de la conexión
let sock = null;
let isConnected = false;
let currentQrCode = null;
let currentQrDataUrl = null;
let connectedUser = null;
let isInitializing = false;
let isManualDisconnect = false;

// Aseguramos que el directorio de sesiones exista
if (!fs.existsSync(SESSIONS_DIR)) {
  fs.mkdirSync(SESSIONS_DIR, { recursive: true });
}

/**
 * Inicializa la conexión con WhatsApp mediante Baileys.
 */
async function initBaileys() {
  if (isInitializing) {
    console.log('[BaileysGateway] Inicialización ya en curso...');
    return;
  }
  if (sock && isConnected) {
    console.log('[BaileysGateway] La sesión ya está conectada y activa.');
    return;
  }

  isInitializing = true;
  isManualDisconnect = false;
  console.log('[BaileysGateway] Iniciando conexión con WhatsApp Web...');

  try {
    const { state, saveCreds } = await useMultiFileAuthState(SESSIONS_DIR);
    let version = [2, 3000, 1015901307];
    try {
      const v = await fetchLatestBaileysVersion();
      version = v.version;
    } catch (e) {
      console.warn('[BaileysGateway] Usando versión Baileys de respaldo.');
    }

    sock = makeWASocket({
      version,
      logger: pino({ level: 'silent' }),
      printQRInTerminal: true,
      auth: state,
      browser: ['Secretaría WhatsApp', 'Desktop', '1.0.0'],
      syncFullHistory: false,
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 60000
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      // Código QR generado para escaneo
      if (qr) {
        currentQrCode = qr;
        try {
          currentQrDataUrl = await QRCode.toDataURL(qr, {
            margin: 2,
            scale: 7,
            color: { dark: '#111b21', light: '#ffffff' }
          });
          console.log('[BaileysGateway] Código QR generado y listo para escanear.');
        } catch (err) {
          console.error('[BaileysGateway] Error convirtiendo QR a imagen:', err);
        }
      }

      // Conexión exitosa
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
        console.log(`✓ WHATSAPP CONECTADO EXITOSAMENTE`);
        console.log(`📱 Número: +${phone} | Usuario: ${name}`);
        console.log(`========================================================`);
      }

      // Conexión cerrada
      if (connection === 'close') {
        isConnected = false;
        currentQrCode = null;
        currentQrDataUrl = null;
        isInitializing = false;

        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut && !isManualDisconnect;

        console.log(`[BaileysGateway] Conexión cerrada. Código: ${statusCode}, ¿Reconectar?: ${shouldReconnect}`);

        if (shouldReconnect) {
          setTimeout(() => initBaileys(), 3000);
        } else {
          connectedUser = null;
          sock = null;
        }
      }
    });

    // Escuchar mensajes entrantes
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
    console.error('[BaileysGateway] Error inicializando Baileys:', error);
    isInitializing = false;
  }
}

/**
 * Desconecta la sesión y limpia las credenciales.
 */
async function disconnectBaileys() {
  isManualDisconnect = true;
  isConnected = false;
  currentQrCode = null;
  currentQrDataUrl = null;
  connectedUser = null;

  if (sock) {
    try {
      await sock.logout();
    } catch (e) {
      try { sock.end(undefined); } catch (_) {}
    }
    sock = null;
  }

  // Limpiamos los archivos de autenticación para permitir un escaneo fresco
  try {
    if (fs.existsSync(SESSIONS_DIR)) {
      const files = fs.readdirSync(SESSIONS_DIR);
      for (const file of files) {
        fs.unlinkSync(path.join(SESSIONS_DIR, file));
      }
    }
  } catch (err) {
    console.warn('[BaileysGateway] Advertencia limpiando archivos de sesión:', err.message);
  }

  console.log('[BaileysGateway] Sesión desconectada y credenciales reseteadas.');
}

/**
 * Servidor HTTP ligero para exponer los endpoints del Gateway.
 */
const server = http.createServer(async (req, res) => {
  // Configuración de CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

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
    initBaileys();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      message: 'Iniciando proceso de conexión Baileys...'
    }));
    return;
  }

  // Endpoint: POST /api/whatsapp/disconnect
  if (req.method === 'POST' && url.pathname === '/api/whatsapp/disconnect') {
    await disconnectBaileys();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      message: 'Sesión de WhatsApp desconectada exitosamente.'
    }));
    return;
  }

  // Endpoint: POST /api/whatsapp/send-test o /api/whatsapp/send
  if (req.method === 'POST' && (url.pathname === '/api/whatsapp/send-test' || url.pathname === '/api/whatsapp/send')) {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const phone = String(payload.phone || payload.toPhone || '').replace(/\D/g, '');
        const message = String(payload.message || payload.text || '');

        if (!phone || !message) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Se requiere teléfono y mensaje.' }));
          return;
        }

        if (!sock || !isConnected) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'WhatsApp no está conectado. Escanea el código QR primero.' }));
          return;
        }

        const jid = `${phone}@s.whatsapp.net`;
        const result = await sock.sendMessage(jid, { text: message });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          data: {
            messageId: result.key.id,
            status: 'sent',
            recipient: phone
          }
        }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // Ruta no encontrada
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Ruta no encontrada en el gateway de Baileys' }));
});

// Iniciamos el Gateway
server.listen(PORT, () => {
  console.log(`========================================================`);
  console.log(`📡 BAILEYS GATEWAY ACTIVO EN EL PUERTO ${PORT}`);
  console.log(`🔗 Endpoint de Estado: http://localhost:${PORT}/api/whatsapp/status`);
  console.log(`========================================================`);
});

// Manejo de apagado controlado
process.on('SIGINT', async () => {
  console.log('\n[BaileysGateway] Apagando gateway...');
  if (sock) {
    try { sock.end(undefined); } catch (_) {}
  }
  process.exit(0);
});
