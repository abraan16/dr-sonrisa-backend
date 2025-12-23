# 📘 Manual de Usuario - Dr. Sonrisa AI
## Sistema Inteligente de Gestión de Pacientes para Clínica Dental Dra. Yasmin Pacheco

**Versión:** 1.0  
**Última actualización:** 21 de diciembre de 2025  
**Desarrollado para:** Clínica Dental Dra. Yasmin Pacheco

---

## 📋 Índice

1. [Descripción General](#descripción-general)
2. [Funcionalidades Principales](#funcionalidades-principales)
3. [Diana - Asistente de Ventas](#diana---asistente-de-ventas)
4. [Manager AI - Asistente Gerencial](#manager-ai---asistente-gerencial)
5. [Sistema de Reactivación de Leads](#sistema-de-reactivación-de-leads)
6. [Sistema de Handoff (Control Manual)](#sistema-de-handoff-control-manual)
7. [Configuración y Variables de Entorno](#configuración-y-variables-de-entorno)
8. [Casos de Uso Prácticos](#casos-de-uso-prácticos)
9. [Solución de Problemas](#solución-de-problemas)
10. [Registro de Cambios](#registro-de-cambios)

---

## 🎯 Descripción General

**Dr. Sonrisa AI** es un sistema automatizado de gestión de pacientes que opera a través de WhatsApp. El sistema cuenta con dos cerebros de inteligencia artificial:

- **Diana**: Asistente de ventas que atiende a pacientes/leads 24/7
- **Manager AI**: Asistente gerencial para consultas administrativas

El sistema está conectado a:
- **WhatsApp** (vía Evolution API)
- **Base de datos Supabase** (PostgreSQL)
- **OpenAI GPT** (para inteligencia artificial)
- **OpenAI Whisper** (para transcripción de audios)

---

## ⚡ Funcionalidades Principales

### 1. Atención Automatizada 24/7
- Responde automáticamente a mensajes de WhatsApp
- Procesa mensajes de texto y audio
- Mantiene contexto de conversaciones
- Estilo conversacional natural (no robótico)

### 2. Gestión Inteligente de Citas
- Consulta disponibilidad en tiempo real
- Agenda citas automáticamente
- Verifica conflictos de horario
- Horario: Lunes a Viernes, 9 AM - 7 PM

### 3. Información de Servicios
- Precios de tratamientos
- Descripción de servicios
- Ubicación de la clínica
- Horarios de atención

### 4. Seguimiento Automático de Leads
- Reactivación automática de leads fríos
- Mensajes personalizados por IA
- Máximo 2 intentos de contacto
- Resumen diario al propietario

### 5. Control Manual (Handoff)
- Detección automática de intervención humana
- Pausa automática del bot
- Reactivación por timeout (2 horas)

### 6. Analytics y Reportes
- Métricas del día/mes
- Búsqueda de pacientes
- Agenda próxima
- Actividad reciente

---

## 👩‍💼 Diana - Asistente de Ventas

### Descripción
Diana es la Coordinadora de Pacientes virtual. Su objetivo es **vender el valor del servicio y agendar citas**.

### Características de Personalidad

**Estilo de Comunicación:**
- ✅ Natural y conversacional
- ✅ Usa saltos de línea entre ideas
- ✅ Emojis funcionales (🦷, ✨, 🗓️)
- ✅ Frases cortas y directas
- ❌ NO usa listas numeradas
- ❌ NO usa asteriscos para negritas
- ❌ NO termina con "si necesitas ayuda solo dime"

**Ejemplo de Respuesta:**
```
Hola María! 👋

La limpieza dental cuesta RD$800 e incluye:
- Remoción de sarro
- Pulido
- Fluorización

Tenemos espacio mañana a las 3 PM o el jueves a las 10 AM...
¿Cuál te queda mejor?
```

### Capacidades

#### 1. Procesamiento de Audio
- **Qué hace:** Transcribe mensajes de voz automáticamente
- **Cómo funciona:** Usa OpenAI Whisper para convertir audio a texto
- **Uso:** El paciente envía un audio, Diana lo transcribe y responde

#### 2. Consulta de Disponibilidad
- **Qué hace:** Verifica horarios disponibles en la agenda
- **Cómo funciona:** Consulta la base de datos de citas
- **Ejemplo de uso:**
  ```
  Paciente: "Quiero una cita para mañana"
  Diana: "Mañana tengo disponible a las 10 AM, 2 PM o 5 PM. ¿Cuál prefieres?"
  ```

#### 3. Agendamiento de Citas
- **Qué hace:** Crea citas en la base de datos
- **Validaciones:**
  - Horario dentro de 9 AM - 7 PM
  - Lunes a Viernes
  - No hay conflictos con otras citas
  - Duración: 1 hora por cita
- **Ejemplo de uso:**
  ```
  Paciente: "Me anoto para mañana a las 3 PM"
  Diana: "✅ Perfecto! Te agendé para mañana 22 de diciembre a las 3:00 PM.
  
  Te espero en Av. Winston Churchill #123, Torre Empresarial.
  
  ¿Necesitas que te envíe la ubicación?"
  ```

#### 4. Información de Servicios

**Precios Disponibles:**
- Consulta General: RD$500
- Limpieza Dental: RD$800
- Blanqueamiento: RD$2,500
- Ortodoncia (mensual): RD$3,000
- Implante Dental: RD$15,000

**Ubicación:**
Av. Winston Churchill #123, Torre Empresarial, Piso 5, Santo Domingo

**Horario:**
Lunes a Viernes, 9:00 AM - 7:00 PM

### Reglas de Oro de Diana

1. **Siempre cierra con pregunta** - Nunca termina afirmando, siempre invita a la acción
2. **Anti-robot** - Escribe como persona real, no como chatbot
3. **Saltos de línea** - Separa ideas para facilitar lectura
4. **Variación de lenguaje** - No empieza siempre igual
5. **Opciones dobles** - Da dos alternativas para facilitar decisión

---

## 📊 Manager AI - Asistente Gerencial

### Descripción
Asistente ejecutivo para el propietario/administrador. Proporciona datos duros y análisis en tiempo real.

### Acceso
Solo el número configurado como `ADMIN_WHATSAPP_NUMBER` puede usar Manager AI.

### Características de Personalidad

**Estilo de Comunicación:**
- Ejecutivo, conciso, directo
- ❌ PROHIBIDO: Saludos ("Hola", "Buenas")
- ❌ PROHIBIDO: Preguntas de cortesía ("¿Algo más?")
- ✅ OBLIGATORIO: Datos duros, formato limpio
- ✅ Usa emojis funcionales (📊, ✅, 📅, 🔍)
- ✅ Máximo 3 líneas por sección

### Herramientas Disponibles

#### 1. Métricas del Día/Mes
**Comando:** Escribe "Métricas" o "Resumen"

**Qué muestra:**
- Citas del día (comparado con ayer)
- Leads del día (comparado con ayer)
- Citas del mes (comparado con mes pasado)
- Leads del mes (comparado con mes pasado)

**Ejemplo de respuesta:**
```
📊 Métricas del Día

✅ Citas: 5 (ayer: 3, +2)
📞 Leads: 12 (ayer: 8, +4)

📈 Este Mes
Citas: 87 (mes pasado: 65, +22)
Leads: 234 (mes pasado: 189, +45)
```

#### 2. Búsqueda de Pacientes
**Comando:** Escribe "Busca [nombre o teléfono]"

**Qué muestra:**
- Nombre y teléfono
- Status (lead/patient/stopped)
- Intentos de seguimiento
- Última interacción
- Próxima cita (si existe)

**Ejemplo de uso:**
```
Tú: "Busca Juan"

Manager AI:
🔍 Resultados para "Juan"

1. Juan Pérez - 8095551234
   Status: lead | Seguimiento: 1/2
   Última interacción: hace 2 horas
   📅 Próxima cita: 23 dic, 3:00 PM
```

#### 3. Agenda Próxima
**Comando:** Escribe "Agenda" o "Citas próximas"

**Qué muestra:**
- Próximas citas (7 días por defecto)
- Fecha y hora
- Nombre y teléfono del paciente

**Ejemplo de respuesta:**
```
📅 Próximas Citas

1. Lun, 22 dic, 10:00 AM
   María López - 8095559999

2. Lun, 22 dic, 3:00 PM
   Juan Pérez - 8095551234

3. Mar, 23 dic, 2:00 PM
   Ana García - 8095557777
```

#### 4. Actividad Reciente
**Comando:** Escribe "Actividad" o "Últimas interacciones"

**Qué muestra:**
- Últimas 10 interacciones
- Nombre del paciente
- Status (lead/patient)
- Mensaje (primeras palabras)
- Tiempo transcurrido

**Ejemplo de respuesta:**
```
🎯 Actividad Reciente

1. María López (lead)
   "Hola, quiero información sobre..."
   hace 5 minutos

2. Juan Pérez (patient)
   "Gracias, nos vemos mañana"
   hace 1 hora
```

---

## 🔄 Sistema de Reactivación de Leads

### Descripción
Sistema automático que contacta leads fríos para intentar convertirlos en pacientes.

### Funcionamiento

#### Horario de Ejecución
- **Todos los días a las 10:00 AM** (hora de Santo Domingo)
- Ejecuta automáticamente sin intervención manual

#### Criterios de Selección
Un lead es contactado si cumple TODOS estos requisitos:

1. **Status:** `lead` (no es paciente ni está detenido)
2. **Follow-up Status:** `pending` (no ha completado seguimiento)
3. **Intentos:** Menos de 2 intentos previos
4. **Tiempo desde última interacción:**
   - Primer intento: 24 horas sin contacto
   - Segundo intento: 48 horas desde primer intento
5. **Sin citas:** No tiene citas agendadas

#### Proceso de Contacto

**Paso 1: Selección**
- El sistema busca hasta 20 leads que cumplan los criterios
- Prioriza leads más antiguos

**Paso 2: Generación de Mensaje**
- Usa OpenAI para crear mensaje personalizado
- Considera:
  - Nombre del lead
  - Número de intento (1 o 2)
  - Contexto de conversaciones previas

**Paso 3: Envío**
- Envía mensaje vía WhatsApp
- Actualiza contador de intentos
- Registra timestamp de contacto

**Paso 4: Resumen al Propietario**
- Envía reporte ejecutivo al `OWNER_WHATSAPP_NUMBER`
- Incluye lista de leads contactados
- Indica número de intento por cada uno

### Ejemplo de Mensaje de Reactivación

**Primer Intento (24h después):**
```
Hola María! 👋

Vi que estabas interesada en el blanqueamiento dental...

¿Sigues interesada? Tengo espacios esta semana 😊
```

**Segundo Intento (48h después del primero):**
```
Hola de nuevo María!

Solo quería recordarte que tenemos una promoción especial en blanqueamiento este mes.

¿Te gustaría que te cuente los detalles?
```

### Resumen Diario al Propietario

**Formato:**
```
📊 Resumen Ejecutivo de Seguimiento

📅 Lunes, 22 de diciembre de 2025

✅ Leads contactados hoy: 5

1. María López - 8095551234
   📍 Intento #1

2. Juan Pérez - 8095559999
   📍 Intento #2

3. Ana García - 8095557777
   📍 Intento #1

🔄 Próximo seguimiento: Mañana a las 10:00 AM
```

### Estados de Follow-up

| Estado | Descripción |
|--------|-------------|
| `pending` | Lead pendiente de contacto |
| `completed` | Ya se contactó 2 veces (máximo alcanzado) |
| `stopped` | Lead pidió no ser contactado |

---

## 🤝 Sistema de Handoff (Control Manual)

### Descripción
Sistema que detecta automáticamente cuando la recepcionista interviene manualmente y pausa a Diana.

### Funcionamiento Automático

#### Detección de Intervención Humana

**Cómo detecta:**
- Cuando la recepcionista responde desde WhatsApp Web/Mobile
- El sistema detecta el flag `fromMe: true` en el webhook
- Automáticamente pausa a Diana para ese lead específico

**Ejemplo de flujo:**
```
1. Lead: "Hola, quiero información"
2. Diana: "Hola! Te cuento sobre nuestros servicios..."
3. [Recepcionista escribe manualmente desde WhatsApp]
4. Sistema: Detecta intervención humana
5. Sistema: Pausa a Diana automáticamente
6. Recepcionista: "Hola, soy Carmen de la clínica..."
7. Diana: [NO responde, está pausada]
```

#### Logs del Sistema

**Cuando detecta intervención:**
```
[Input] Human response detected for 18095551234. Pausing bot.
```

**Cuando un lead escribe y el bot está pausado:**
```
[Input] Bot is paused for 18095551234. Skipping AI response.
```

### Reactivación Automática (Timeout)

**Tiempo de espera:** 2 horas sin actividad humana

**Proceso:**
1. Pasan 2 horas sin que la recepcionista escriba
2. Sistema detecta inactividad
3. Diana se reactiva automáticamente
4. Vuelve a responder mensajes del lead

**Monitoreo:**
- Cron job cada 30 minutos
- Revisa conversaciones pausadas
- Reactiva las que superaron 2 horas de inactividad

**Log de reactivación:**
```
[Handoff] Auto-resumed bot for patient abc123 (timeout)
```

### Estados del Bot

| Estado | Descripción | Acción de Diana |
|--------|-------------|-----------------|
| `active` | Bot activo | Responde normalmente |
| `paused` | Humano tomó control | NO responde |

### Campos en Base de Datos

**Tabla `patients`:**
- `botStatus`: Estado actual (`active` o `paused`)
- `handoffAt`: Timestamp de cuándo el humano tomó control
- `lastHumanResponseAt`: Última vez que el humano escribió

---

## 🏷️ Gestión Dinámica de Promociones (¡NUEVO!)

### Descripción
Ahora el administrador puede gestionar las promociones que Diana menciona a los pacientes directamente desde WhatsApp, sin tocar código ni hacer redeploys.

### Cómo agregar una promoción
El administrador solo debe escribir al WhatsApp con el mensaje de la promoción.

**Ejemplos de comandos:**
- "Agrega promoción: 10% de descuento en limpiezas desde hoy hasta el 31 de diciembre"
- "Nueva promo: 20% OFF en blanqueamiento durante todo enero"
- "Promo activa: 2x1 en consulta inicial para nuevos pacientes hasta el viernes"

**Manager AI se encargará de:**
1. Entender qué servicio es (limpieza, blanqueamiento, etc.)
2. Extraer el descuento y la fecha de vencimiento.
3. Guardarlo en la base de datos.
4. Confirmarte: "✅ Promoción Guardada".

### Cómo Diana usa las promociones
Una vez guardada, Diana **automáticamente** empezará a mencionarla cuando un paciente pregunte por ese servicio.

**Reglas de Diana:**
- ✅ Solo menciona promociones que estén en su lista activa.
- ✅ Verifica la fecha: si ya venció, deja de mencionarla sola.
- ❌ **PROHIBIDO INVENTAR:** Si no hay promo para un servicio, Diana no inventará nada.

### Comandos de Gestión

| Acción | Envía este mensaje |
|--------|---------------------|
| Listar promociones | "Ver promociones activas" o "Qué promociones hay" |
| Desactivar promo | "Desactiva promoción de blanqueamiento" |
| Desactivar promo | "Desactiva promoción de blanqueamiento" |

---

## 🔔 Gestión de Avisos Operativos (Feriados, Cierres, Noticias)

### Descripción
Este sistema permite al administrador informar a Diana sobre cierres de la clínica (vacaciones, feriados) o avisos importantes (remodelaciones, fallas técnicas) para que **ella maneje las citas correctamente**.

### Tipos de Avisos

1. **🔴 CIERRE (Block Dates):**
   - **Efecto:** Diana sabe que la clínica está CERRADA. **Rechaza cualquier solicitud de cita en esas fechas** y ofrece fechas posteriores.
   - **Ejemplo:** "Estaremos cerrados por vacaciones del 24 al 26 de diciembre".

2. **🟡 ADVERTENCIA (Warning):**
   - **Efecto:** Diana acepta citas pero **menciona el aviso** antes de confirmar.
   - **Ejemplo:** "El parqueo está en remodelación esta semana".

3. **🔵 INFORMACIÓN (Info):**
   - **Efecto:** Diana lo tiene en su conocimiento general.

### Cómo usarlo (Comandos)

**Agregar Aviso:**
- "Avisa que la clínica estará cerrada el viernes por inventario"
- "Agrega un cierre por vacaciones del 24 de diciembre al 2 de enero"
- "Pon una advertencia: No tendremos luz mañana de 2 a 4 PM"

Manager AI detectará automáticamente si es un Cierre o una Advertencia basándose en tu mensaje.

**Listar Avisos Activos:**
- "Ver avisos activos"
- "¿Qué cierres tenemos programados?"

**Eliminar Aviso:**
- "Borra el aviso del inventario"
- "Desactiva la alerta de vacaciones"

---

## ⚙️ Configuración y Variables de Entorno

### Variables Requeridas

#### Servidor
```bash
PORT=3000
```

#### Base de Datos (Supabase)
```bash
DATABASE_URL=postgresql://user:password@host:port/database?pgbouncer=true
```

#### OpenAI
```bash
OPENAI_API_KEY=sk-...
OPENAI_BASE_URL=https://openrouter.ai/api/v1  # Para usar OpenRouter
```

#### Evolution API (WhatsApp)
```bash
EVOLUTION_API_URL=https://tu-evolution-api.com
EVOLUTION_API_KEY=tu-api-key
EVOLUTION_INSTANCE_NAME=nombre-instancia
```

#### Sistema de Seguimiento
```bash
OWNER_WHATSAPP_NUMBER=18098828129  # Recibe resúmenes diarios
```

#### Manager AI
```bash
ADMIN_WHATSAPP_NUMBER=18098828129  # Acceso a Manager AI
```

#### Seguridad
```bash
JWT_SECRET=tu_secret_jwt_super_seguro
```

### Configuración de Horarios

**Zona Horaria:** America/Santo_Domingo

**Horario de Atención:**
- Lunes a Viernes
- 9:00 AM - 7:00 PM

**Cron Jobs:**
- Reactivación de Leads: 10:00 AM diario
- Timeout de Handoff: Cada 30 minutos

---

## 💡 Casos de Uso Prácticos

### Caso 1: Lead Nuevo Solicita Información

**Escenario:**
Un nuevo lead escribe por primera vez preguntando por blanqueamiento dental.

**Flujo:**
1. Lead: "Hola, cuánto cuesta el blanqueamiento?"
2. Sistema crea registro en BD (status: `lead`)
3. Diana responde con precio y detalles
4. Diana ofrece agendar cita
5. Si el lead no agenda, entra al sistema de reactivación

**Resultado:**
- Lead registrado en sistema
- Información proporcionada
- Intento de conversión inmediato

---

### Caso 2: Recepcionista Necesita Intervenir

**Escenario:**
Un lead tiene una consulta compleja que requiere atención humana.

**Flujo:**
1. Lead: "Tengo una emergencia dental, me duele mucho"
2. Diana: "Entiendo que es urgente. Te cuento nuestras opciones..."
3. Recepcionista ve el mensaje y decide intervenir
4. Recepcionista escribe desde WhatsApp Web
5. Sistema detecta `fromMe: true`
6. Diana se pausa automáticamente
7. Recepcionista: "Hola, soy Carmen. Déjame ayudarte de inmediato..."
8. Lead y recepcionista conversan
9. Después de 2 horas sin actividad, Diana se reactiva

**Resultado:**
- Atención personalizada cuando se necesita
- Sin interferencia del bot
- Reactivación automática para no perder automatización

---

### Caso 3: Propietario Consulta Métricas

**Escenario:**
El propietario quiere saber cómo va el día.

**Flujo:**
1. Propietario (desde su WhatsApp): "Métricas"
2. Sistema detecta `ADMIN_WHATSAPP_NUMBER`
3. Ruta a Manager AI
4. Manager AI ejecuta herramienta `get_metrics`
5. Formatea respuesta concisa
6. Envía reporte ejecutivo

**Resultado:**
- Datos en tiempo real
- Sin necesidad de abrir dashboard
- Respuesta en segundos

---

### Caso 4: Lead Frío es Reactivado

**Escenario:**
Un lead preguntó hace 2 días pero no agendó cita.

**Flujo:**
1. **Día 1, 2:00 PM:** Lead pregunta por limpieza, no agenda
2. **Día 2, 10:00 AM:** Sistema de reactivación ejecuta
3. Sistema identifica al lead (24h sin contacto, 0 intentos)
4. OpenAI genera mensaje personalizado
5. Diana envía: "Hola María! Vi que te interesaba la limpieza..."
6. Sistema actualiza: `followUpCount = 1`
7. **Día 3, 10:00 AM:** Si no responde, segundo intento
8. Si responde, sale del ciclo de reactivación

**Resultado:**
- Lead reactivado automáticamente
- Mensaje personalizado (no genérico)
- Máximo 2 intentos (no spam)

---

### Caso 5: Lead Envía Audio

**Escenario:**
Un lead prefiere enviar mensaje de voz en lugar de escribir.

**Flujo:**
1. Lead envía audio: "Hola, quiero saber si hacen ortodoncia"
2. Sistema detecta `messageType: audioMessage`
3. AudioService descarga el audio
4. OpenAI Whisper transcribe: "Hola, quiero saber si hacen ortodoncia"
5. Diana procesa el texto transcrito
6. Diana responde normalmente

**Resultado:**
- Audio procesado automáticamente
- Respuesta precisa al contenido
- Sin fricción para el usuario

---

## 🔧 Solución de Problemas

### Problema: Diana no responde mensajes

**Posibles causas:**

1. **Bot está pausado para ese lead**
   - **Verificar:** Revisar logs: `[Input] Bot is paused for...`
   - **Solución:** Esperar 2 horas o verificar si hubo intervención manual

2. **Webhook no llega al servidor**
   - **Verificar:** Logs no muestran `Webhook Received`
   - **Solución:** Verificar configuración de Evolution API

3. **Error en OpenAI API**
   - **Verificar:** Logs muestran error de OpenAI
   - **Solución:** Verificar `OPENAI_API_KEY` y créditos

---

### Problema: Audios no se transcriben

**Posibles causas:**

1. **OpenRouter no soporta Whisper**
   - **Verificar:** Error 405 en logs
   - **Solución:** Ya implementado - usa OpenAI directo

2. **Audio no tiene URL**
   - **Verificar:** Logs muestran `[AUDIO NO URL]`
   - **Solución:** Problema de Evolution API

---

### Problema: Sistema de reactivación no ejecuta

**Posibles causas:**

1. **Cron job no inicializado**
   - **Verificar:** Logs no muestran `[Reactivation] Initializing...`
   - **Solución:** Verificar que `ReactivationService.init()` se llama en `server.ts`

2. **Zona horaria incorrecta**
   - **Verificar:** Ejecuta a hora incorrecta
   - **Solución:** Verificar timezone en cron: `America/Santo_Domingo`

---

### Problema: Manager AI no responde

**Posibles causas:**

1. **Número no configurado como admin**
   - **Verificar:** Logs muestran routing a Diana en lugar de Manager
   - **Solución:** Verificar `ADMIN_WHATSAPP_NUMBER` en `.env`

2. **Herramienta no reconocida**
   - **Verificar:** Logs muestran `Herramienta no reconocida`
   - **Solución:** Usar comandos válidos: "Métricas", "Busca", "Agenda", "Actividad"

---

## 📝 Registro de Cambios

### Versión 1.0 (21 de diciembre de 2025)

**Funcionalidades Implementadas:**

1. **Diana - Asistente de Ventas**
   - Sistema prompt personalizado con personalidad de ventas
   - Procesamiento de texto y audio (Whisper)
   - Consulta de disponibilidad
   - Agendamiento de citas
   - Información de servicios y precios
   - Estilo conversacional natural (anti-robot)

2. **Manager AI - Asistente Gerencial**
   - 4 herramientas analíticas:
     - Métricas del día/mes
     - Búsqueda de pacientes
     - Agenda próxima
     - Actividad reciente
   - Routing automático por número de admin
   - Formato ejecutivo conciso

3. **Sistema de Reactivación de Leads**
   - Cron job diario (10 AM)
   - Selección inteligente de leads
   - Mensajes personalizados por IA
   - Máximo 2 intentos
   - Resumen diario al propietario

4. **Sistema de Handoff**
   - Detección automática de intervención humana
   - Pausa automática del bot
   - Timeout de 2 horas
   - Reactivación automática

5. **Infraestructura**
   - Base de datos Supabase (PostgreSQL)
   - Evolution API (WhatsApp)
   - OpenAI GPT-3.5/4 (conversación)
   - OpenAI Whisper (transcripción)
   - Deployment en Coolify

**Campos de Base de Datos:**

**Tabla `patients`:**
- `status`: lead | patient | stopped
- `followUpStatus`: pending | completed | stopped
- `followUpCount`: Número de intentos de reactivación
- `lastInteractionAt`: Última interacción
- `botStatus`: active | paused
- `handoffAt`: Timestamp de handoff
- `lastHumanResponseAt`: Última respuesta humana

---

## 📞 Soporte y Contacto

**Desarrollador:** Gemini AI Assistant  
**Cliente:** Clínica Dental Dra. Yasmin Pacheco  
**Propietario:** Abraham  

**Repositorio GitHub:** abraan16/dr-sonrisa-backend  
**Deployment:** Coolify (VPS)  
**Base de Datos:** Supabase  

---

## 🔮 Funcionalidades Futuras (Roadmap)

### En Consideración:

1. **Dashboard Web**
   - Visualización de conversaciones en tiempo real
   - Control manual de bot por conversación
   - Métricas visuales

2. **Analytics Avanzado**
   - Reportes semanales/mensuales
   - Tasas de conversión
   - Análisis de mensajes más comunes

3. **Integraciones**
   - Google Calendar (sincronización bidireccional)
   - Sistema de pagos
   - Recordatorios automáticos de citas

4. **Mejoras de Diana**
   - Respuestas con audio (Text-to-Speech)
   - Detección de intención más precisa
   - Manejo de objeciones mejorado

---

**Fin del Manual - Versión 1.0**

*Este documento se actualiza automáticamente con cada nueva funcionalidad implementada.*
