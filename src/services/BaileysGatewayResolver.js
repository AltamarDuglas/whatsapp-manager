/**
 * ============================================================================
 * ARCHIVO: src/services/BaileysGatewayResolver.js
 * DESCRIPCIÓN: Servicio para resolver y validar la URL del microservicio Gateway
 *              de Baileys tanto en entornos locales como en despliegues en Vercel.
 * PRINCIPIO SOLID: Single Responsibility Principle (SRP)
 *                  Open/Closed Principle (OCP)
 * ============================================================================
 */

export class BaileysGatewayResolver {
  /**
   * Determina si la aplicación se está ejecutando dentro de la infraestructura
   * de Vercel (servidores serverless en la nube de AWS Lambda).
   * @returns {boolean}
   */
  static isVercel() {
    return process.env.VERCEL === '1' || Boolean(process.env.NEXT_PUBLIC_VERCEL_ENV);
  }

  /**
   * Determina si una URL apunta a una dirección de bucle local (localhost / 127.0.0.1).
   * @param {string} urlString
   * @returns {boolean}
   */
  static isLocalAddress(urlString) {
    if (!urlString) return true;
    try {
      const parsed = new URL(urlString.startsWith('http') ? urlString : `http://${urlString}`);
      return parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1' || parsed.hostname === '::1';
    } catch (_) {
      return urlString.includes('localhost') || urlString.includes('127.0.0.1');
    }
  }

  /**
   * Resuelve la URL del Gateway de Baileys según la siguiente jerarquía de precedencia:
   * 1. Cabecera HTTP personalizada 'x-baileys-gateway-url' (enviada desde el cliente frontend).
   * 2. Parámetro de búsqueda 'gatewayUrl' en la URL de la petición.
   * 3. Cookie de sesión 'baileys_gateway_url'.
   * 4. Variable de entorno del sistema 'BAILEYS_GATEWAY_URL'.
   * 5. Valor por defecto local 'http://localhost:3001'.
   *
   * @param {Request} [request] - Objeto Request de Next.js
   * @returns {{ url: string, isVercel: boolean, isLocalhost: boolean, isInvalidVercelLocalhost: boolean }}
   */
  static resolve(request) {
    const isVercel = this.isVercel();
    let url = null;

    if (request) {
      // 1. Cabecera HTTP enviada por el frontend
      const headerUrl = request.headers.get('x-baileys-gateway-url');
      if (headerUrl && headerUrl.trim()) {
        url = headerUrl.trim();
      }

      // 2. Query param en la URL
      if (!url) {
        try {
          const { searchParams } = new URL(request.url);
          const queryUrl = searchParams.get('gatewayUrl');
          if (queryUrl && queryUrl.trim()) {
            url = queryUrl.trim();
          }
        } catch (_) {}
      }

      // 3. Cookie de navegador
      if (!url && request.cookies) {
        const cookieUrl = request.cookies.get('baileys_gateway_url')?.value;
        if (cookieUrl && cookieUrl.trim()) {
          url = cookieUrl.trim();
        }
      }
    }

    // 4. Variable de entorno del servidor
    if (!url && process.env.BAILEYS_GATEWAY_URL && process.env.BAILEYS_GATEWAY_URL.trim()) {
      url = process.env.BAILEYS_GATEWAY_URL.trim();
    }

    // 5. Fallback por defecto
    if (!url) {
      url = 'http://localhost:3001';
    }

    // Limpieza de barras finales
    url = url.replace(/\/$/, '');

    const isLocalhost = this.isLocalAddress(url);
    // Es inválido si corre en Vercel y la URL sigue apuntando a localhost,
    // ya que los servidores de Vercel no tienen acceso a la máquina local del usuario.
    const isInvalidVercelLocalhost = isVercel && isLocalhost;

    return {
      url,
      isVercel,
      isLocalhost,
      isInvalidVercelLocalhost
    };
  }
}
