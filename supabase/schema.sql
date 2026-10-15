-- ============================================================================
-- ARCHIVO: supabase/schema.sql
-- DESCRIPCIÓN: Esquema de base de datos relacional PostgreSQL para Supabase.
-- SISTEMA: Plataforma de Gestión y Mensajería de WhatsApp para Secretaría.
-- PRINCIPIOS: Normalización, Integridad Referencial, Índices de Alto Rendimiento,
--             Seguridad con RLS (Row Level Security) y Habilitación de Realtime.
-- ============================================================================

-- Habilitar extensión para generación de identificadores UUID v4
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------------------
-- 1. TABLA: categories (Categorías y Clasificaciones de Contactos)
-- Permite agrupar contactos bajo etiquetas personalizables (ej: "Reinas", "VIP")
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    color VARCHAR(50) DEFAULT '#8b5cf6',
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comentarios de documentación de tabla y columnas
COMMENT ON TABLE categories IS 'Catálogo de clasificaciones para contactos (ej. Reinas, Candidatas, VIP)';
COMMENT ON COLUMN categories.name IS 'Nombre único de la categoría';
COMMENT ON COLUMN categories.color IS 'Color hexadecimal representativo para badges e interfaz';

-- ----------------------------------------------------------------------------
-- 2. TABLA: contacts (Directorio Central de Números Registrados)
-- REGLA DE NEGOCIO: Solo los números registrados en esta tabla podrán
-- ser listados y atendidos en la bandeja de chats para respuestas de operadores.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) DEFAULT 'General' REFERENCES categories(name) ON UPDATE CASCADE ON DELETE SET DEFAULT,
    notes TEXT,
    custom_fields JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para optimizar búsquedas por número de teléfono y filtrado por categoría
CREATE INDEX IF NOT EXISTS idx_contacts_phone ON contacts(phone);
CREATE INDEX IF NOT EXISTS idx_contacts_category ON contacts(category);
CREATE INDEX IF NOT EXISTS idx_contacts_name ON contacts(name);

COMMENT ON TABLE contacts IS 'Directorio maestro de números autorizados para mensajería y filtrado de chats';
COMMENT ON COLUMN contacts.phone IS 'Número de teléfono normalizado con código de país (ej. 573001234567)';
COMMENT ON COLUMN contacts.category IS 'Clasificación asignada al contacto (ej. Reinas)';
COMMENT ON COLUMN contacts.custom_fields IS 'Metadatos adicionales del Excel como radicado, cargo o municipio';

-- ----------------------------------------------------------------------------
-- 3. TABLA: messages (Historial de Conversaciones Entrantes y Salientes)
-- Registra cada mensaje intercambiado. Se vincula al contacto para asegurar
-- que solo se listen chats de números previamente autorizados en la base de datos.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
    phone VARCHAR(50) NOT NULL,
    direction VARCHAR(20) NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    content TEXT NOT NULL,
    status VARCHAR(30) DEFAULT 'delivered' CHECK (status IN ('received', 'queued', 'sending', 'sent', 'delivered', 'read', 'failed')),
    sender_name VARCHAR(255),
    replied_by VARCHAR(255),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices de alto rendimiento para filtrado rápido de hilos de conversación y orden cronológico
CREATE INDEX IF NOT EXISTS idx_messages_contact_id ON messages(contact_id);
CREATE INDEX IF NOT EXISTS idx_messages_phone ON messages(phone);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_direction ON messages(direction);

COMMENT ON TABLE messages IS 'Almacén de mensajes entrantes (inbound) y salientes (outbound) de WhatsApp';
COMMENT ON COLUMN messages.direction IS 'Dirección: inbound (recibido del usuario) u outbound (enviado por operador/sistema)';
COMMENT ON COLUMN messages.replied_by IS 'Identificación de la persona u operador que redactó la respuesta';

-- ----------------------------------------------------------------------------
-- 4. TABLA: campaigns (Registro Histórico de Campañas Masivas)
-- Almacena las auditorías de envíos masivos ejecutados.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    template TEXT NOT NULL,
    target_category VARCHAR(100) DEFAULT 'Todos',
    total_contacts INT DEFAULT 0,
    sent_count INT DEFAULT 0,
    failed_count INT DEFAULT 0,
    status VARCHAR(50) DEFAULT 'completed',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE campaigns IS 'Historial de auditoría para campañas de envío masivo con protección anti-baneo';

-- ----------------------------------------------------------------------------
-- 5. TRIGGER: Actualización Automática de updated_at en contacts
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON contacts;
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON contacts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- 6. POLÍTICAS DE SEGURIDAD (Row Level Security - RLS)
-- Permite lectura y escritura tanto para el rol anon (clave pública de frontend)
-- como service_role para operaciones backend en Vercel.
-- ----------------------------------------------------------------------------
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- Políticas permisivas para desarrollo e integración directa con Supabase client
CREATE POLICY "Permitir lectura publica de categorias" ON categories FOR SELECT USING (true);
CREATE POLICY "Permitir insercion/edicion de categorias" ON categories FOR ALL USING (true);

CREATE POLICY "Permitir lectura de contactos" ON contacts FOR SELECT USING (true);
CREATE POLICY "Permitir insercion y actualizacion de contactos" ON contacts FOR ALL USING (true);

CREATE POLICY "Permitir lectura de mensajes" ON messages FOR SELECT USING (true);
CREATE POLICY "Permitir envio e insercion de mensajes" ON messages FOR ALL USING (true);

CREATE POLICY "Permitir gestion de campanas" ON campaigns FOR ALL USING (true);

-- ----------------------------------------------------------------------------
-- 7. HABILITACIÓN DE REALTIME PARA SUPABASE
-- Permite que la interfaz web reciba nuevos mensajes entrantes y actualizaciones
-- en tiempo real sin necesidad de recargar la página.
-- ----------------------------------------------------------------------------
DO $$
BEGIN
    -- Agregamos las tablas a la publicación de realtime si no están ya agregadas
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE messages;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'contacts'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE contacts;
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 8. DATOS SEMILLA (SEED DATA) DE PRUEBA
-- Incluye la categoría solicitada "Reinas", categorías adicionales de secretaría,
-- contactos de muestra clasificados y mensajes simulados para probar la bandeja.
-- ----------------------------------------------------------------------------

-- Insertar categorías estándar
INSERT INTO categories (name, color, description) VALUES
('Reinas', '#ec4899', 'Candidatas, soberanas y delegaciones de certámenes institucionales')
ON CONFLICT (name) DO NOTHING;

INSERT INTO categories (name, color, description) VALUES
('VIP', '#f59e0b', 'Autoridades, gabinete, concejales e invitados especiales')
ON CONFLICT (name) DO NOTHING;

INSERT INTO categories (name, color, description) VALUES
('Secretaría', '#3b82f6', 'Equipo interno administrativo y secretaría técnica')
ON CONFLICT (name) DO NOTHING;

INSERT INTO categories (name, color, description) VALUES
('Líderes', '#10b981', 'Líderes comunitarios, presidentes de JAC y voceros barriales')
ON CONFLICT (name) DO NOTHING;

INSERT INTO categories (name, color, description) VALUES
('General', '#6b7280', 'Ciudadanía en general y usuarios sin clasificación específica')
ON CONFLICT (name) DO NOTHING;

-- Insertar contactos de muestra (incluyendo candidatas de la categoría "Reinas")
INSERT INTO contacts (phone, name, category, notes, custom_fields) VALUES
('573001234501', 'Valentina Gómez (Reina Central)', 'Reinas', 'Reina del Certamen Departamental 2026. Requiere confirmación de agenda.', '{"cargo": "Reina Central", "municipio": "Sede Principal"}'),
('573001234502', 'Camila Restrepo (Reina Cívica)', 'Reinas', 'Candidata cívica. Solicitó vestuario para el desfile inaugural.', '{"cargo": "Reina Cívica", "municipio": "Distrito Norte"}'),
('573001234503', 'Isabella Morales (Virreina)', 'Reinas', 'Virreina del concurso. Atenta a itinerario de protocolo.', '{"cargo": "Virreina", "municipio": "Distrito Sur"}'),
('573109876543', 'Dr. Carlos Mendoza (Secretario General)', 'VIP', 'Secretario de Despacho. Coordinación de eventos masivos.', '{"cargo": "Secretario General", "dependencia": "Despacho"}'),
('573155554433', 'Dra. María Fernanda López', 'Secretaría', 'Coordinadora de comunicaciones institucionales.', '{"cargo": "Coordinadora", "dependencia": "Prensa"}'),
('573204443322', 'Javier Peña (Líder Comuna 4)', 'Líderes', 'Líder comunal. Seguimiento a proyecto deportivo.', '{"comuna": "Comuna 4", "sector": "El Triunfo"}')
ON CONFLICT (phone) DO UPDATE 
SET name = EXCLUDED.name, category = EXCLUDED.category, notes = EXCLUDED.notes;

-- Insertar mensajes iniciales en la base de datos para los contactos registrados
-- (Para demostrar cómo se listan los mensajes y cómo alguien más los puede responder)
WITH c1 AS (SELECT id FROM contacts WHERE phone = '573001234501' LIMIT 1),
     c2 AS (SELECT id FROM contacts WHERE phone = '573001234502' LIMIT 1),
     c3 AS (SELECT id FROM contacts WHERE phone = '573001234503' LIMIT 1),
     c4 AS (SELECT id FROM contacts WHERE phone = '573109876543' LIMIT 1)
INSERT INTO messages (contact_id, phone, direction, content, status, sender_name, replied_by, created_at)
SELECT c1.id, '573001234501', 'inbound', '¡Hola! Buenos días, ¿a qué hora debemos estar listas para la rueda de prensa de mañana?', 'received', 'Valentina Gómez', NULL, NOW() - INTERVAL '25 minutes' FROM c1
UNION ALL
SELECT c1.id, '573001234501', 'outbound', 'Hola Valentina, la cita es a las 8:30 AM en el auditorio principal del piso 3. ¡Te esperamos!', 'delivered', 'Operador Secretaría', 'Operador Secretaría', NOW() - INTERVAL '15 minutes' FROM c1
UNION ALL
SELECT c1.id, '573001234501', 'inbound', 'Perfecto, muchas gracias. Ya le aviso a las demás compañeras.', 'received', 'Valentina Gómez', NULL, NOW() - INTERVAL '4 minutes' FROM c1
UNION ALL
SELECT c2.id, '573001234502', 'inbound', 'Buenas tardes Secretaría, ¿nos compartirán el guión protocolario del desfile?', 'received', 'Camila Restrepo', NULL, NOW() - INTERVAL '1 hour' FROM c2
UNION ALL
SELECT c3.id, '573001234503', 'inbound', 'Hola equipo, tengo una duda sobre el transporte del viernes, ¿pasan por nosotras al hotel?', 'received', 'Isabella Morales', NULL, NOW() - INTERVAL '35 minutes' FROM c3
UNION ALL
SELECT c4.id, '573109876543', 'inbound', 'Estimado equipo, por favor confirmar el envío del informe de los 200 mensajes masivos.', 'received', 'Dr. Carlos Mendoza', NULL, NOW() - INTERVAL '2 hours' FROM c4
ON CONFLICT DO NOTHING;
