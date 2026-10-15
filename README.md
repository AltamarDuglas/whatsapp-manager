# WhatsApp Manager | Plataforma Institucional Next.js + React + Supabase

> **Solución Web Profesional con Estética WhatsApp Desktop Dark Mode**  
> Diseñada bajo la metodología **SOLID**, con arquitectura modular, **filtrado estricto por base de datos**, **clasificación de contactos ("Reinas", "VIP", etc.)**, **despacho en Vercel** y sincronización en la nube con **Supabase PostgreSQL & Realtime**.

---

## Tabla de Contenidos

1. [Visión General del Proyecto](#visión-general-del-proyecto)
2. [Funcionalidad Principal: Filtrado de Chats y Clasificación "Reinas"](#funcionalidad-principal-filtrado-de-chats-y-clasificación-reinas)
3. [Estética e Interfaz de Usuario](#estética-e-interfaz-de-usuario)
4. [Arquitectura y Principios SOLID Aplicados](#arquitectura-y-principios-solid-aplicados)
5. [Estructura del Proyecto](#estructura-del-proyecto)
6. [Configuración y Despliegue en Vercel](#configuración-y-despliegue-en-vercel)
7. [Arquitectura Baileys en Vercel (Serverless vs WebSocket)](#arquitectura-baileys-en-vercel-serverless-vs-websocket)
8. [Configuración de Supabase (Paso a Paso)](#configuración-de-supabase-paso-a-paso)
9. [Variables de Entorno (.env)](#variables-de-entorno-env)
10. [Instalación y Ejecución Local](#instalación-y-ejecución-local)
11. [Referencia de Rutas API REST](#referencia-de-rutas-api-rest)
12. [Control de Versiones y Subida a GitHub](#control-de-versiones-y-subida-a-github)

---

## Visión General del Proyecto

Esta aplicación es una plataforma web desarrollada en **Next.js 16 + React** orientada a secretarías de despacho, alcaldías, gobernaciones y entidades organizadoras de eventos (como el **Reinado del Río 2026**).

Resuelve los siguientes retos esenciales de comunicación:
1. **Atención Centralizada y Colaborativa:** Permite que un equipo de operadores responda los mensajes de WhatsApp directamente desde el navegador web, registrando quién respondió cada mensaje.
2. **Filtrado Estricto por Base de Datos:** A diferencia de un WhatsApp convencional donde entran mensajes de cualquier desconocido, aquí **solo se listan y atienden los números registrados en la base de datos**.
3. **Clasificación y Segmentación de Contactos:** Permite categorizar contactos bajo etiquetas como **"Reinas"**, **"VIP"**, **"Secretaría"**, **"Líderes"** o **"General"**, filtrando la bandeja de chats para atender grupos específicos con un solo clic.
4. **Despliegue Serverless en Vercel:** Diseñada para operar en la infraestructura de Vercel con integración nativa a Supabase y microservicio de Gateway para Baileys o Meta Cloud API.

---

## Funcionalidad Principal: Filtrado de Chats y Clasificación "Reinas"

### 1. ¿Cómo funciona el Filtrado Estricto?
- En el endpoint `/api/chats`, el servicio `ChatService` consulta primero la tabla de contactos (`contacts`).
- Extrae la lista blanca de números telefónicos autorizados.
- Realiza la consulta de mensajes en `messages` **únicamente sobre los números autorizados**.
- Cualquier mensaje o número externo que no esté en la base de datos es descartado automáticamente de la bandeja de entrada.

### 2. Clasificación "Reinas"
- Cada contacto puede ser clasificado de forma individual o masiva bajo la etiqueta **"Reinas"** (o cualquier otra categoría creada).
- En la barra lateral de la bandeja de entrada, el operador puede hacer clic en la pestaña **Reinas** para ver únicamente las conversaciones correspondientes a las candidatas/soberanas.
- El operador puede cambiar la clasificación de un contacto directamente desde la cabecera del chat activo o desde el directorio maestro, y el cambio se guarda inmediatamente en Supabase.

### 3. Respuesta Multiusuario ("Para que alguien más los pueda responder")
- La plataforma cuenta con una caja de respuesta integrada.
- El operador redacta la respuesta y presiona **Enter** o el botón de envío.
- El mensaje se despacha al WhatsApp del destinatario y queda guardado en la base de datos con la etiqueta:
  `Respondido por: [Nombre del Operador]`.

---

## Estética e Interfaz de Usuario

La interfaz fue diseñada siguiendo de manera rigurosa la estética oficial de **WhatsApp Desktop Dark Mode**:
- **Cero emojis:** Siguiendo las directrices del proyecto, no se utilizan emojis en botones, tabs ni interfaces; se utilizan exclusivamente **vectores SVG limpios** (Lucide React: `Crown`, `Star`, `Building2`, `Users`, `CheckCheck`, `Paperclip`, `Mic`, etc.).
- **Paleta de Colores WhatsApp Desktop:**
  - Fondo de la aplicación: `#0c1317`
  - Paneles y barras laterales: `#111b21` y `#202c33`
  - Fondo de conversación: `#0b141a` con textura doodle de WhatsApp.
  - Globos entrantes: Carbón `#202c33`.
  - Globos salientes: Verde WhatsApp `#005c4b`.
  - Acento verde WhatsApp: `#00a884`.
  - Doble check azul de confirmación: `#53bdeb`.
- **Riel Vertical Izquierdo:** Iconos para Chats, Directorio de Base de Datos, Envíos Masivos, Estados, Canales y Asistente.
- **Adjunto de Archivos Excel:** Soporte visual fidedigno para tarjetas de documentos Excel como `INSCRIPCION_CANDIDATAS_REINADO_RIO_2026.xlsx`.

---

## Arquitectura y Principios SOLID Aplicados

El proyecto fue desarrollado bajo principios **SOLID** para asegurar que el código sea testeable, mantenible y extensible:

### 1. S - Single Responsibility Principle (Responsabilidad Única)
- [`PhoneFormatter.js`](src/services/PhoneFormatter.js): Solo normaliza y valida números telefónicos internacionales.
- [`TemplateEngine.js`](src/services/TemplateEngine.js): Solo gestiona la sustitución de variables `{{nombre}}` en las plantillas.
- [`ContactService.js`](src/services/ContactService.js): Solo gestiona la lógica de negocio de contactos e importación de Excel.
- [`ChatService.js`](src/services/ChatService.js): Solo orquesta el filtrado de hilos por lista blanca de base de datos y respuestas de operadores.
- [`AntiBanPacingService.js`](src/services/AntiBanPacingService.js): Solo calcula pausas aleatorias (jitter) y descansos entre mensajes.
- [`BaileysGatewayResolver.js`](src/services/BaileysGatewayResolver.js): Solo resuelve y valida la conectividad del microservicio Baileys en entornos serverless y locales.

### 2. O - Open/Closed Principle (Abierto / Cerrado)
- Definición de contratos de interfaz: [`IMessagingProvider.js`](src/domain/interfaces/IMessagingProvider.js), [`IContactRepository.js`](src/domain/interfaces/IContactRepository.js) e [`IMessageRepository.js`](src/domain/interfaces/IMessageRepository.js).
- Para integrar un nuevo proveedor de mensajería (ej: Twilio o Gupshup), basta con implementar `IMessagingProvider` sin modificar la interfaz de usuario ni los controladores.

### 3. L - Liskov Substitution Principle (Sustitución de Liskov)
- Los proveedores de mensajería ([`MetaCloudProvider`](src/infrastructure/providers/MetaCloudProvider.js), [`BaileysBridgeProvider`](src/infrastructure/providers/BaileysBridgeProvider.js), [`MockProvider`](src/infrastructure/providers/MockProvider.js)) son 100% intercambiables en tiempo de ejecución.
- Si las claves de Supabase no están configuradas, el sistema conmuta automáticamente a los repositorios en memoria ([`MemoryContactRepository`](src/infrastructure/memory/MemoryContactRepository.js) y [`MemoryMessageRepository`](src/infrastructure/memory/MemoryMessageRepository.js)), permitiendo ejecutar la aplicación de inmediato sin fallos.

### 4. I - Interface Segregation Principle (Segregación de Interfaces)
- Cada contrato expone únicamente los métodos indispensables para su propósito, evitando dependencias innecesarias.

### 5. D - Dependency Inversion Principle (Inversión de Dependencias)
- Los servicios de alto nivel (`ChatService`, `ContactService`) no dependen de implementaciones concretas de base de datos ni de APIs externas, sino de las interfaces abstractas inyectadas por la factoría [`repositories.js`](src/infrastructure/repositories.js).

---

## Configuración y Despliegue en Vercel

1. **Importar el Repositorio en Vercel:**
   - Entra a [vercel.com](https://vercel.com) e inicia sesión con tu cuenta de GitHub.
   - Haz clic en **Add New... > Project**.
   - Selecciona el repositorio `whatsapp-manager`.

2. **Configurar el Root Directory:**
   - Si el repositorio contiene únicamente el contenido de `whatsapp-next`, déjalo en `./`.
   - Si está en una subcarpeta, selecciona `whatsapp-next`.

3. **Configurar Variables de Entorno en Vercel:**
   En la sección **Environment Variables** añade:
   - `NEXT_PUBLIC_SUPABASE_URL`: URL del proyecto en Supabase.
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Llave pública anónima de Supabase.
   - `BAILEYS_GATEWAY_URL`: URL pública de tu Gateway de Baileys (ej: `https://mi-gateway.onrender.com` o túnel `localtunnel`).
   - `WHATSAPP_TOKEN`: (Opcional) Si utilizas Meta WhatsApp Cloud API.
   - `WHATSAPP_PHONE_NUMBER_ID`: (Opcional) ID de teléfono de Meta Cloud.
   - `WHATSAPP_VERIFY_TOKEN`: (Opcional) Token para verificar webhooks de Meta.

4. **Hacer clic en Deploy:**
   Vercel compilará la aplicación y generará la URL de producción accesible mundialmente.

---

## Arquitectura Baileys en Vercel (Serverless vs WebSocket)

### ¿Por qué Vercel requiere un Gateway público para Baileys?

- **Vercel es Serverless (AWS Lambda):** Las rutas de API en Vercel se ejecutan como micro-contenedores efímeros que se congelan y destruyen en segundos tras responder cada petición HTTP.
- **Baileys requiere conexión persistente (TCP/WebSocket):** Para sincronizar WhatsApp Web con los servidores de WhatsApp (`web.whatsapp.com`), Baileys debe mantener un socket abierto 24/7 y almacenar las credenciales de sesión multi-dispositivo en disco.
- **¿Por qué `localhost:3001` no funciona en Vercel?:** Cuando la aplicación corre en `https://tu-app.vercel.app`, el servidor de Next.js está en la nube en Estados Unidos; por ende, no puede conectarse a `localhost` de tu computador.

### Soluciones Implementadas:

```
┌─────────────────────────────────┐        HTTPS        ┌───────────────────────────────────┐        WebSocket       ┌────────────────────────┐
│      Next.js en Vercel          │ ──────────────────> │      Gateway Baileys (Node.js)    │ ─────────────────────> │   WhatsApp Web Server  │
│  (Frontend + API Routes Server) │ <────────────────── │ (Render, Railway o Túnel Local)   │ <───────────────────── │  (web.whatsapp.com)   │
└─────────────────────────────────┘                     └───────────────────────────────────┘                        └────────────────────────┘
```

#### Opción A: Túnel Público Gratuito en 1 Minuto (Ideal para pruebas rápidas)
Si ejecutas el gateway en tu computadora y quieres controlarlo desde tu despliegue en Vercel:
1. En tu computadora ejecuta el gateway:
   ```bash
   npm run gateway
   ```
2. En otra terminal abre el túnel público:
   ```bash
   npx localtunnel --port 3001
   ```
   *(o si tienes ngrok: `ngrok http 3001`)*
3. Obtendrás una URL como `https://brave-frog-45.loca.lt`.
4. Abre tu app en Vercel, entra a la opción **Conectar WhatsApp (QR)**, pulsa **Gateway** y pega esa URL. ¡El código QR aparecerá al instante!

#### Opción B: Despliegue 24/7 en la Nube con Render (100% Gratuito y Permanente)
Hemos incluido en el proyecto el [`Dockerfile`](Dockerfile) y el archivo de despliegue automático [`render.yaml`](render.yaml):
1. Entra a [render.com](https://render.com) y crea una cuenta gratuita.
2. Crea un **New Web Service** conectado a tu repositorio de GitHub `whatsapp-manager`.
3. Render detectará automáticamente el archivo `render.yaml` o Dockerfile.
4. Render te asignará una URL pública HTTPS como `https://whatsapp-baileys-gateway.onrender.com`.
5. En Vercel, agrega la variable de entorno:
   ```env
   BAILEYS_GATEWAY_URL=https://whatsapp-baileys-gateway.onrender.com
   ```
   ¡Listo! Tu Gateway estará disponible en la nube de forma permanente sin que tengas que tener tu computador encendido.

#### Opción C: Meta WhatsApp Cloud API (100% Nativo en Vercel)
Si prefieres no gestionar servidores externos de Baileys, puedes utilizar la API Oficial de Meta Cloud configurando las credenciales en Vercel. La aplicación conmuta automáticamente al proveedor oficial sin requerir ningún microservicio.

---

## Configuración de Supabase (Paso a Paso)

1. Ingresa a [supabase.com](https://supabase.com) y crea un nuevo proyecto gratuito.
2. Una vez creado el proyecto, ve al menú izquierdo y entra al **SQL Editor**.
3. Abre el archivo [`supabase/schema.sql`](supabase/schema.sql) de este repositorio, copia todo su contenido y pégalo en el editor de Supabase.
4. Presiona el botón **Run** (Ejecutar).
   - El script creará automáticamente las tablas: `contacts`, `categories`, `messages` y `campaigns`.
   - Configurará los índices de búsqueda rápida por teléfono y categoría.
   - Establecerá las políticas de seguridad **RLS (Row Level Security)**.
   - Habilitará **Supabase Realtime** para sincronización en vivo.
   - Insertará las categorías por defecto (**Reinas**, **VIP**, **Secretaría**, **Líderes**, **General**) y contactos de muestra.
5. Ve a **Project Settings > API** y copia:
   - **Project URL** -> `NEXT_PUBLIC_SUPABASE_URL`
   - **Project API anon key** -> `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## Variables de Entorno (.env)

Crea o edita el archivo `.env.local`:

```env
# Conexión a Supabase (PostgreSQL en la nube)
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Despacho Serverless vía Meta WhatsApp Cloud API (Opcional)
WHATSAPP_TOKEN=EAAG...
WHATSAPP_PHONE_NUMBER_ID=123456789012345
WHATSAPP_VERIFY_TOKEN=secretaria_token_seguro

# Enlace al microservicio Gateway de Baileys (Para Vercel o local)
BAILEYS_GATEWAY_URL=http://localhost:3001
```

---

## Instalación y Ejecución Local

Para ejecutar el proyecto en tu máquina de desarrollo:

```bash
# 1. Entrar a la carpeta del proyecto Next.js
cd whatsapp-next

# 2. Instalar dependencias
npm install

# 3. Iniciar el Gateway de Baileys (en una terminal)
npm run gateway

# 4. Iniciar el servidor de desarrollo Next.js (en otra terminal)
npm run dev
```

Abre tu navegador en:  
[http://localhost:3000](http://localhost:3000)

---

## Referencia de Rutas API REST

| Método | Ruta | Descripción |
| :--- | :--- | :--- |
| `GET` | `/api/chats` | Lista conversaciones autorizadas (filtro exclusivo por BD y categorías como "Reinas"). |
| `GET` | `/api/chats/[phone]` | Retorna la cronología completa de mensajes del número indicado. |
| `POST` | `/api/chats/[phone]` | Envía una respuesta al contacto como operador y la almacena en la BD. |
| `PATCH` | `/api/chats/[phone]` | Modifica y guarda la clasificación de un contacto (ej. a "Reinas"). |
| `GET` | `/api/contacts` | Retorna los contactos registrados con filtros opcionales. |
| `POST` | `/api/contacts` | Registra o actualiza un contacto individual. |
| `POST` | `/api/contacts/upload` | Carga un archivo Excel (.xlsx/.xls) permitiendo elegir o crear una categoría y aplicarla masivamente. |
| `PATCH` | `/api/contacts/category` | Actualiza masivamente la clasificación de una lista de teléfonos. |
| `GET` | `/api/categories` | Retorna las categorías activas (Reinas, VIP, Secretaría, etc.). |
| `POST` | `/api/categories` | Crea una nueva categoría con nombre y color personalizado. |
| `GET` | `/api/supabase/status` | Diagnóstico en tiempo real: verifica si Supabase está conectado y cuenta los registros en BD. |
| `POST` | `/api/supabase/config` | Guarda credenciales de Supabase en .env.local para desarrollo local. |
| `GET` | `/api/baileys/status` | Consulta el estado de conexión de Baileys y obtiene el código QR en Base64. |
| `POST` | `/api/baileys/connect` | Inicializa la sesión de Baileys y solicita/regenera el código QR de vinculación. |
| `POST` | `/api/baileys/disconnect` | Desconecta la sesión activa de WhatsApp Web y limpia credenciales en disco. |
| `POST` | `/api/baileys/send` | Despacha un mensaje de WhatsApp a través del número vinculado por Baileys. |
| `GET/POST`| `/api/baileys/config` | Consulta o actualiza la URL remota del gateway de Baileys (persiste en cookie y prueba ping). |
| `POST` | `/api/campaigns/send` | Ejecuta un envío masivo con plantilla dinámica y protección anti-baneo. |
| `GET/POST`| `/api/webhook/whatsapp` | Webhook para recibir mensajes entrantes de Meta WhatsApp o Gateway. |

---

## Control de Versiones y Subida a GitHub

Para subir únicamente el proyecto `whatsapp-next` al repositorio `whatsapp-manager`:

```bash
# Dentro de la carpeta whatsapp-next:
cd whatsapp-next

# Agregar todos los cambios
git add .

# Crear commit explicativo
git commit -m "feat: arquitectura serverless para vercel con soporte de baileys gateway remoto"

# Enviar a la rama principal de GitHub
git push origin main
```

---

*Desarrollado para la Secretaría bajo arquitectura limpia y principios SOLID.*
