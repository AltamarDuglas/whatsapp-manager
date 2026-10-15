# WhatsApp Manager | Plataforma Institucional Next.js + React + Supabase

> **Solución Web Profesional con Estética WhatsApp Desktop Dark Mode**  
> Diseñada bajo la metodología **SOLID**, con arquitectura modular, **filtrado estricto por base de datos**, **clasificación de contactos ("Reinas", "VIP", etc.)**, **despacho en Vercel** y sincronización en la nube con **Supabase PostgreSQL & Realtime**.

---

## Tabla de Contenidos

1. [Visión General del Proyecto](#-visión-general-del-proyecto)
2. [Funcionalidad Principal: Filtrado de Chats y Clasificación "Reinas"](#-funcionalidad-principal-filtrado-de-chats-y-clasificación-reinas)
3. [Estética e Interfaz de Usuario](#-estética-e-interfaz-de-usuario)
4. [Arquitectura y Principios SOLID Aplicados](#-arquitectura-y-principios-solid-aplicados)
5. [Estructura del Proyecto](#-estructura-del-proyecto)
6. [Configuración y Despliegue en Vercel](#-configuración-y-despliegue-en-vercel)
7. [Configuración de Supabase (Paso a Paso)](#-configuración-de-supabase-paso-a-paso)
8. [Variables de Entorno (.env)](#-variables-de-entorno-env)
9. [Instalación y Ejecución Local](#-instalación-y-ejecución-local)
10. [Referencia de Rutas API REST](#-referencia-de-rutas-api-rest)
11. [Control de Versiones y Subida a GitHub](#-control-de-versiones-y-subida-a-github)

---

## Visión General del Proyecto

Esta aplicación es una plataforma web desarrollada en **Next.js 16 + React** orientada a secretarías de despacho, alcaldías, gobernaciones y entidades organizadoras de eventos (como el **Reinado del Río 2026**).

Resuelve los siguientes retos esenciales de comunicación:
1. **Atención Centralizada y Colaborativa:** Permite que un equipo de operadores responda los mensajes de WhatsApp directamente desde el navegador web, registrando quién respondió cada mensaje.
2. **Filtrado Estricto por Base de Datos:** A diferencia de un WhatsApp convencional donde entran mensajes de cualquier desconocido, aquí **solo se listan y atienden los números registrados en la base de datos**.
3. **Clasificación y Segmentación de Contactos:** Permite categorizar contactos bajo etiquetas como **"Reinas"**, **"VIP"**, **"Secretaría"**, **"Líderes"** o **"General"**, filtrando la bandeja de chats para atender grupos específicos con un solo clic.
4. **Despliegue Serverless en Vercel:** Diseñada para operar en la infraestructura de Vercel con integración nativa a Supabase y WhatsApp Cloud API.

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

## Estructura del Proyecto

```text
whatsapp-next/
├── app/
│   ├── api/
│   │   ├── campaigns/send/route.js     # Endpoint de envíos masivos
│   │   ├── categories/route.js         # Endpoint de categorías ("Reinas", "VIP", etc.)
│   │   ├── chats/route.js              # Endpoint de chats filtrados por base de datos
│   │   ├── chats/[phone]/route.js      # Historial de conversación y respuesta de operador
│   │   ├── contacts/route.js           # Directorio de contactos autorizados
│   │   ├── contacts/category/route.js  # Clasificación masiva
│   │   ├── contacts/upload/route.js    # Carga y análisis de archivos Excel
│   │   └── webhook/whatsapp/route.js   # Webhook para recepción de mensajes WhatsApp
│   ├── favicon.ico
│   ├── globals.css                     # Estilos idénticos a WhatsApp Desktop Dark Mode
│   ├── layout.js                       # Layout raíz en Next.js
│   └── page.js                         # Página principal de WhatsApp Desktop
├── components/
│   ├── ChatInbox/
│   │   ├── CategoryBadge.js            # Selector de categorías sin emojis (con vectores)
│   │   ├── ChatInbox.js                # Contenedor maestro de la bandeja de chats
│   │   ├── ChatSidebar.js              # Lista de conversaciones de WhatsApp Desktop
│   │   └── ChatWindow.js               # Ventana activa de chat con globos y caja de respuesta
│   ├── ContactManager/
│   │   └── ContactManager.js           # Directorio maestro de números y carga de Excel
│   ├── MassCampaign/
│   │   └── MassCampaign.js             # Módulo de envíos masivos anti-baneo
│   ├── SupabaseConfigModal/
│   │   └── SupabaseConfigModal.js      # Guía de conexión Supabase y Vercel
│   └── WhatsAppRail.js                 # Riel vertical izquierdo de WhatsApp Desktop
├── public/
│   └── base_muestra.xlsx               # Archivo Excel de muestra para el Reinado
├── src/
│   ├── domain/
│   │   ├── entities/                   # Contact, Message, Category
│   │   └── interfaces/                 # IContactRepository, IMessageRepository, IMessagingProvider
│   ├── infrastructure/
│   │   ├── memory/                     # Repositorios en memoria para modo local/demo
│   │   ├── providers/                  # MetaCloudProvider, BaileysBridgeProvider, MockProvider
│   │   └── supabase/                   # Cliente Supabase y repositorios PostgreSQL
│   └── services/                       # ContactService, ChatService, TemplateEngine, AntiBanPacingService
├── supabase/
│   └── schema.sql                      # Script SQL de creación de tablas, índices y RLS
├── .env.example                        # Ejemplo de variables de entorno
├── .env.local                          # Variables locales de desarrollo
├── next.config.mjs                     # Configuración de Next.js
├── package.json                        # Dependencias del proyecto
├── vercel.json                         # Configuración de despliegue en Vercel
└── README.md                           # Documentación técnica completa
```

---

## Configuración y Despliegue en Vercel

Desplegar este proyecto en Vercel toma menos de 2 minutos:

1. **Subir el código a GitHub:**
   ```bash
   git init
   git add .
   git commit -m "feat: whatsapp manager con nextjs, supabase y estetica oficial"
   git branch -M main
   git remote add origin https://github.com/AltamarDuglas/whatsapp-manager.git
   git push -u origin main
   ```

2. **Importar el proyecto en Vercel:**
   - Inicia sesión en [vercel.com](https://vercel.com).
   - Haz clic en **Add New > Project** y selecciona el repositorio `whatsapp-manager`.
   - Vercel detectará automáticamente que es un proyecto **Next.js**.

3. **Configurar las Variables de Entorno en Vercel:**
   En la sección **Environment Variables**, agrega:
   - `NEXT_PUBLIC_SUPABASE_URL`: Tu URL del proyecto de Supabase.
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Tu clave pública `anon` de Supabase.
   - `WHATSAPP_TOKEN` (Opcional si usas Meta Cloud API).
   - `WHATSAPP_PHONE_NUMBER_ID` (Opcional si usas Meta Cloud API).
   - `WHATSAPP_VERIFY_TOKEN`: Token para verificar webhooks de Meta.

4. **Hacer clic en Deploy:**
   Vercel compilará la aplicación y generará la URL de producción accesible mundialmente.

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

# Enlace a servidor local Baileys (Modo Híbrido opcional)
BAILEYS_GATEWAY_URL=http://localhost:3000
```

---

## Instalación y Ejecución Local

Para ejecutar el proyecto en tu máquina de desarrollo:

```bash
# 1. Entrar a la carpeta del proyecto Next.js
cd whatsapp-next

# 2. Instalar dependencias
npm install

# 3. Iniciar el servidor de desarrollo
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
| `POST` | `/api/campaigns/send` | Ejecuta un envío masivo con plantilla dinámica y protección anti-baneo. |
| `GET/POST`| `/api/webhook/whatsapp` | Webhook para recibir mensajes entrantes de Meta WhatsApp o Gateway. |

---

## Control de Versiones y Subida a GitHub

Para subir únicamente el proyecto `whatsapp-next` al repositorio `whatsapp-manager`:

```bash
# Dentro de la carpeta whatsapp-next:
cd whatsapp-next

# Inicializar git
git init

# Agregar todos los archivos
git add .

# Crear commit inicial
git commit -m "feat: conversion a nextjs con supabase, filtro de bd y estetica whatsapp desktop"

# Configurar rama principal
git branch -M main

# Vincular repositorio remoto
git remote add origin https://github.com/AltamarDuglas/whatsapp-manager.git

# Enviar a GitHub
git push -u origin main
```

---

*Desarrollado para la Secretaría bajo arquitectura limpia y principios SOLID.*
