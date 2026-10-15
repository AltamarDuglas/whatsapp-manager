/**
 * ============================================================================
 * ARCHIVO: app/layout.js
 * DESCRIPCIÓN: Layout raíz de la aplicación Next.js con metadatos SEO y tipografía.
 * ============================================================================
 */

import './globals.css';

export const metadata = {
  title: 'WhatsApp Hub Pro | Secretaría & Gestión de Reinas',
  description: 'Plataforma oficial de mensajería masiva y bandeja de chats exclusiva para números registrados en base de datos con categorización de Reinas, conexión a Supabase y despliegue en Vercel.',
  keywords: ['whatsapp', 'secretaria', 'reinas', 'supabase', 'nextjs', 'vercel', 'masivo']
};

export const viewport = {
  width: 'device-width',
  initialScale: 1
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body>{children}</body>
    </html>
  );
}
