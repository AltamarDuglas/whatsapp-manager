# ============================================================================
# ARCHIVO: Dockerfile
# DESCRIPCIÓN: Imagen Docker para ejecutar el Gateway de Baileys (WhatsApp Web)
#              en entornos persistentes (Render, Railway, Fly.io, VPS).
# ============================================================================

FROM node:20-alpine

# Instalar dependencias necesarias para compilar módulos nativos si se requieren
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias de producción
RUN npm ci --omit=dev

# Copiar el script del gateway y carpetas necesarias
COPY scripts/baileys-gateway.cjs ./scripts/
COPY data ./data

# Exponer el puerto del Gateway (3001)
EXPOSE 3001

# Variable de entorno del puerto
ENV PORT=3001
ENV NODE_ENV=production

# Ejecutar el gateway
CMD ["node", "scripts/baileys-gateway.cjs"]
