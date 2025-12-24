# 🚀 Guía de Despliegue y Replicación (White Label)

Esta guía detalla los pasos técnicos para replicar el sistema de **Dr. Sonrisa AI** para nuevos clientes (ej. Clínicas Dentales, Estéticas, Consultorios).

## 📋 Requisitos Previos

- **Servidor VPS** (DigitalOcean, Hetzner, AWS) con **Coolify** instalado.
- **Cuenta de Supabase** (Base de datos PostgreSQL).
- **Instancia de Evolution API** (WhatsApp Gateway).
- **Cuenta de OpenAI** (API Key).

---

## 🏗️ Paso 1: Infraestructura (5 Minutos)

### 1. Base de Datos (Supabase)
1. Crea un **Nuevo Proyecto** en Supabase para el cliente.
2. Ve al **SQL Editor** y ejecuta el script de inicialización (ver `database/init.sql` o el esquema abajo).
3. **Importante:** Habilita la extensión `vector` si usas embeddings.

**Script SQL Mínimo Requerido:**
```sql
-- Habilitar Vector
create extension vector;

-- Tablas Principales
CREATE TABLE IF NOT EXISTS patients (...);
CREATE TABLE IF NOT EXISTS interactions (...);
CREATE TABLE IF NOT EXISTS appointments (...);
CREATE TABLE IF NOT EXISTS promotions (...);

-- Tablas de Configuración (CRÍTICO)
-- Usa siempre comillas dobles para columnas con mayúsculas
CREATE TABLE IF NOT EXISTS clinic_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR NOT NULL,
    message TEXT NOT NULL,
    "startDate" TIMESTAMP NOT NULL,
    "endDate" TIMESTAMP NOT NULL,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    "updatedAt" TIMESTAMP DEFAULT NOW()
);
```

### 2. WhatsApp (Evolution API)
1. Crea una nueva instancia en tu Evolution API:
   - Nombre: `cliente_nuevo`
   - Webhook URL: `https://api.tu-dominio.com/api/input/webhook`
   - Webhook Events: `MESSAGES_UPSERT`
2. Escanea el QR con el teléfono del cliente.

---

## 💻 Paso 2: Despliegue del Código

### Opción A: Coolify (Recomendada)
1. Crea un **Nuevo Servicio** -> **Git Repository**.
2. Selecciona este repositorio.
3. **Variables de Entorno (.env):**

```env
# Claves de IA
OPENAI_API_KEY=sk-...

# Base de Datos (Supabase de ESTE cliente)
DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres?pgbouncer=true"

# WhatsApp (Evolution API)
EVOLUTION_API_URL=https://wa.tu-api.com
EVOLUTION_API_KEY=global-api-key
INSTANCE_NAME=cliente_nuevo

# Configuración del Negocio (Dueño)
# Configuración del Negocio (Dueño)
OWNER_WHATSAPP_NUMBER=18090000000 (Teléfono del Doctor)
ADMIN_WHATSAPP_NUMBER=18090000000 (Teléfono del Doctor o Gerente)
NOTIFICATION_PHONES="18090000000,18290000000" (Lista para reportes)

# Alertas Críticas (Desarrollador)
TELEGRAM_BOT_TOKEN="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
TELEGRAM_CHAT_ID="123456789"

# Servidor
PORT=3000
NODE_ENV=production
```

4. **Desplegar**.

---

## ⚙️ Paso 3: Personalización "Zero-Code" (Post-Despliegue)

Una vez el bot esté activo, **NO necesitas tocar el código** para personalizarlo. El cliente lo hace por WhatsApp hablando con **Manager AI**.

Instruye al cliente para que envíe estos comandos al bot (desde su número de Admin):

1. **Configurar Precios:**
   > "Diana, actualiza los precios. La consulta cuesta $50 USD, Limpieza $80 USD..."

2. **Configurar Horarios:**
   > "Configura el horario: Lunes a Viernes de 8am a 5pm."

3. **Configurar Ubicación:**
   > "Estamos en Av. Principal #123, Ciudad de México."

4. **Configurar Nombre del Doctor/Clínica (NUEVO):**
   > "Configura la info del doctor: Somos la Clínica Estética 'Dra. Piel', especialista en dermatología."

5. **Configurar Estilo y Personalidad (NUEVO):**
   > "Cambia tu personalidad: Sé muy formal y usa 'Usted'. Cero emojis."
   
6. **Configurar Hora de Reporte (NUEVO):**
   > "Cambia la hora de notificación a las 20:00."

---

## 🔍 Checklist de Verificación

- [ ] ¿El bot responde al "Hola"?
- [ ] ¿Manager AI reconoce al número Admin?
- [ ] ¿El reporte nocturno llega a los teléfonos configurados (`NOTIFICATION_PHONES`)?
- [ ] ¿Las alertas de Telegram funcionan (usa `notifyDeployment` para probar)?
- [ ] **SQL Check:** ¿Las columnas `startDate` y `endDate` en `clinic_alerts` tienen la "D" mayúscula?

## 🆘 Solución de Problemas

**Error: Column 'startDate' does not exist**
- Ejecuta el script `database/fix_schema.sql` en Supabase para corregir las mayúsculas en los nombres de las columnas.

**El bot usa mi nombre personal:**
- Cambia el `pushName` (Nombre visible) en el WhatsApp del cliente.

**El bot alucina promociones:**
- Verifica que no haya promociones viejas con "Diana, listar promociones".

**No llegan los mensajes:**
- Revisa los logs de Evolution API y que la URL del Webhook sea HTTPS.
