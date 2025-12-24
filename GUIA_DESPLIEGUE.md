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
create table patients (...);
create table interactions (...);
create table appointments (...);
create table promotions (...);
create table clinic_alerts (...);
create table system_settings (...);
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
OWNER_WHATSAPP_NUMBER=18090000000 (Teléfono del Doctor)
ADMIN_WHATSAPP_NUMBER=18090000000 (Teléfono del Doctor o Gerente)
NOTIFICATION_PHONES="18090000000,18290000000" (Lista para reportes)

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

4. **Configurar Nombre del Doctor/Clínica (NUEVO RECOMENDADO):**
   > "Configura la info del doctor: Somos la Clínica Estética 'Dra. Piel', especialista en dermatología."

---

## 🔍 Checklist de Verificación

- [ ] ¿El bot responde al "Hola"?
- [ ] ¿Manager AI reconoce al número Admin?
- [ ] ¿El reporte nocturno llega a los teléfonos configurados?
- [ ] ¿La base de datos está guardando las interacciones?

## 🆘 Solución de Problemas

**El bot usa mi nombre personal:**
- Cambia el `pushName` (Nombre visible) en el WhatsApp del cliente.

**El bot alucina promociones:**
- Verifica que no haya promociones viejas con "Diana, listar promociones".

**No llegan los mensajes:**
- Revisa los logs de Evolution API y que la URL del Webhook sea HTTPS.
