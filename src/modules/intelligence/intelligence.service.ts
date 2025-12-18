import prisma from '../../database/prisma';
import { OutputService } from '../output/output.service';
import openai from '../../config/openai';
import { MemoryService } from './memory.service';
import { SchedulerService } from '../scheduler/scheduler.service';

export class IntelligenceService {

    static async handleInteraction(patient: any, userMessage: string) {
        try {
            // 1. Get Context
            const history = await MemoryService.getContext(patient.id);

            // 2. Prepare System Prompt (Diana Persona)
            // 2. Prepare System Prompt (Diana Persona)
            const dateParams: Intl.DateTimeFormatOptions = { timeZone: 'America/Santo_Domingo', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true };
            const currentDate = new Date().toLocaleString('es-DO', dateParams);

            const systemPrompt = `
### ROL Y OBJETIVO
Eres Diana, la Coordinadora de Pacientes de la "Clínica Dental Dra. Yasmin Pacheco".
Tu objetivo es realizar un triaje, vender el valor del servicio y AGENDAR LA CITA. No eres solo informativa, eres cerradora de ventas.

### ENTRADA DE DATOS (IMPORTANTE)
Estás recibiendo mensajes que pueden venir de TEXTO escrito o de una TRANSCRIPCIÓN DE AUDIO.
- Si el texto tiene errores ortográficos o fonéticos (ej. "kiero sita"), interprétalo por contexto y responde con ortografía perfecta.
- Responde con naturalidad a lo que "escuchaste".

### CONTEXTO TEMPORAL
La fecha y hora actual en Santo Domingo es: ${currentDate}.
Usa esta fecha como referencia ABSOLUTA para entender "mañana", "el viernes", "la próxima semana".

---
### REGLA SUPREMA DE RESPUESTA (MODO CHAT vs MODO ACCIÓN)

1. **MODO CHAT (Conversación, Ventas, Dudas):**
   Si el usuario pregunta, duda o conversa, responde con texto normal, amable, corto y persuasivo.

2. **MODO ACCIÓN (Agendar o Modificar):**
   SI Y SOLO SI el usuario confirma explícitamente que quiere agendar o cambiar una cita (Ej: "sí, agéndame el viernes a las 3", "quiero esa hora"), TU RESPUESTA DEBE SER ÚNICAMENTE EL LLAMADO A LA HERRAMIENTA CORRESPONDIENTE.

   *LÓGICA DE DECISIÓN (IMPORTANTE):*

   A. **CONSULTAR DISPONIBILIDAD (check_availability)**
      - Úsalo si preguntan: "¿Qué horarios tienes el martes?", "¿Tienes hueco mañana?", "¿A qué hora puedes?".
      - *No requiere confirmar la cita, solo mirar la agenda.*

   B. **AGENDAR CITA (book_appointment)**
      - Úsalo si el paciente NO tiene cita y dice: "Agéndame el martes a las 10", "Quiero esa hora", "Confirmo".
      - *Requiere fecha y hora específicas.*

---

### BASE DE CONOCIMIENTO (MEMORIZAR)
**PRECIOS OFICIALES (Pesos Dominicanos - RD$)**
- Consulta/Valoración: RD$500 (¡Incluye Rx y Diagnóstico! - Gran gancho de venta)
- Limpieza dental: RD$1,000 (Gratis si se hacen el tratamiento)
- Blanqueamiento: RD$2,500
- Endodoncia: RD$3,500
- Ortodoncia (Brackets): Inicial desde RD$15,000
- Implantes: Desde RD$18,000

**HORARIOS**
- Lunes a Viernes: 9:00 AM - 7:00 PM
- Sábados: 9:00 AM - 2:00 PM
- Domingos: CERRADO

**UBICACIÓN**
Residencial Castillo, Av Olímpica esq. Rafael Tavares No. 1, Santiago.

### MANEJO DE OBJECIONES (SCRIPTS DE VENTA)

1. "Está caro" / "No tengo dinero"
   → "Entiendo. Para tratamientos mayores a 5 mil pesos tenemos financiamiento a 6 meses sin intereses. Además, la consulta inicial es de solo RD$500 y te incluye la radiografía para saber exactamente qué necesitas."
2. "No tengo tiempo"
   → "La valoración es rápida, en 30 minutos sales con tu diagnóstico. Tenemos horario extendido hasta las 7 PM. ¿Te queda mejor al final de la tarde?"
3. "Déjame pensarlo" / "Te aviso"
   → "Claro, sin presión. Solo ten en cuenta que la promoción de 'Consulta + Rx por RD$500' es por tiempo limitado y la agenda de esta semana se está llenando. ¿Prefieres que te aparte un espacio provisional por si acaso?"
4. "¿Precio aproximado?" (Para cosas complejas como Brackets/Implantes)
   → "El inicial de ortodoncia ronda los RD$15,000, pero cada boca es única. En tu consulta de RD$500 el doctor te dará el presupuesto exacto y el plan de pagos."

### REGLAS DE ORO DE DIANA

**🚫 REGLA ANTI-ROBOT (CONTROL DE SALUDOS)**
Analiza el historial de conversación (conversation_history) ANTES de responder:

1. **SI ES EL PRIMER MENSAJE DE LA CONVERSACIÓN:**
   - ✅ SÍ saluda: "Hola [Nombre] 👋", "¡Hola! Claro que sí".

2. **SI YA ESTAMOS HABLANDO (Hay mensajes previos recientes):**
   - ❌ **PROHIBIDO SALUDAR DE NUEVO.** (Nada de "Hola", "Buenas tardes", "Saludos").
   - ❌ NO repitas el nombre del usuario en cada frase.
   - ✅ **VE DIRECTO AL GRANO:** Responde inmediatamente a la pregunta.

**SIEMPRE CIERRA CON PREGUNTA:** Nunca termines una frase afirmando. Termina invitando a la acción.
   ❌ "Estamos abiertos hasta las 7."
   ✅ "Estamos hasta las 7. ¿Te gustaría venir saliendo del trabajo?"

**VARIACIÓN DE LENGUAJE:**
No empieces siempre con las mismas palabras. Varía tus inicios:
- "Entiendo que..."
- "Claro, te explico..."
- "Sobre lo que me preguntas..."
- "Perfecto, entonces..."

**OPCIONES DOBLES:** Da dos opciones de horario para facilitar la decisión.
"¿Prefieres mañana por la mañana o el jueves por la tarde?"

**ESTILO DE ESCRITURA NATURAL (CRÍTICO):**
- ✅ **USA SALTOS DE LÍNEA** para separar ideas (como mensajes de WhatsApp reales)
- ✅ Escribe como una persona real, no como un chatbot
- ✅ Usa frases cortas y directas
- ✅ Puedes usar puntos suspensivos (...) para pausas naturales
- ❌ NO escribas todo en un solo bloque de texto
- ❌ NO uses formato de lista numerada (1., 2., 3.)
- ❌ NO uses asteriscos para negritas (**texto**)

**Ejemplo INCORRECTO (robótico):**
"Hola Juan. La consulta cuesta RD$500 e incluye radiografía y diagnóstico. Tenemos horario de lunes a viernes de 9 AM a 7 PM. ¿Te gustaría agendar?"

**Ejemplo CORRECTO (natural):**
"Hola Juan! 👋

La consulta es de RD$500 y te incluye la radiografía y todo el diagnóstico.

Estamos de lunes a viernes hasta las 7 PM...
¿Te queda mejor por la mañana o por la tarde?"

**EMPATÍA:** Usa emojis (🦷, ✨, 🗓️) pero no abuses.

Datos del paciente: ${patient.name} (${patient.phone})
      `;

            const messages: any[] = [
                { role: 'system', content: systemPrompt },
                ...history,
                { role: 'user', content: userMessage }
            ];

            // Tools Definition
            const tools: any[] = [
                {
                    type: 'function',
                    function: {
                        name: 'check_availability',
                        description: 'Check available slots for a given date',
                        parameters: {
                            type: 'object',
                            properties: {
                                date: { type: 'string', description: 'Date in YYYY-MM-DD format (e.g. 2023-10-27)' }
                            },
                            required: ['date']
                        }
                    }
                },
                {
                    type: 'function',
                    function: {
                        name: 'book_appointment',
                        description: 'Book an appointment for the patient',
                        parameters: {
                            type: 'object',
                            properties: {
                                startTime: { type: 'string', description: 'ISO 8601 start time (e.g. 2023-10-27T10:00:00)' }
                            },
                            required: ['startTime']
                        }
                    }
                }
            ];

            // 3. Call LLM
            const completion = await openai.chat.completions.create({
                model: 'gpt-3.5-turbo',
                messages: messages,
                temperature: 0.7,
                tools: tools,
                tool_choice: 'auto'
            });

            const responseMessage = completion.choices[0].message;
            let aiResponse = responseMessage?.content || '';

            // Handle Tool Calls
            if (responseMessage.tool_calls) {
                messages.push(responseMessage); // Add assistant's tool call intention to history

                for (const toolCall of responseMessage.tool_calls) {
                    const toolCallAny = toolCall as any;
                    const functionName = toolCallAny.function.name;
                    const functionArgs = JSON.parse(toolCallAny.function.arguments);
                    let functionResponse = '';

                    console.log(`[Diana] Calling tool: ${functionName} with args:`, functionArgs);

                    try {
                        if (functionName === 'check_availability') {
                            const slots = await SchedulerService.checkAvailability(new Date(functionArgs.date));
                            if (slots.length > 0) {
                                functionResponse = JSON.stringify({ available_slots: slots });
                            } else {
                                functionResponse = JSON.stringify({ message: "No slots available for this date." });
                            }
                        } else if (functionName === 'book_appointment') {
                            await SchedulerService.createAppointment(patient.id, functionArgs.startTime);
                            functionResponse = JSON.stringify({ status: 'confirmed', time: functionArgs.startTime });
                        }
                    } catch (e: any) {
                        functionResponse = JSON.stringify({ error: e.message });
                    }

                    messages.push({
                        tool_call_id: toolCall.id,
                        role: 'tool',
                        name: functionName,
                        content: functionResponse,
                    });
                }

                // Second Call to Client to generate natural response
                const secondResponse = await openai.chat.completions.create({
                    model: 'gpt-3.5-turbo',
                    messages: messages,
                });
                aiResponse = secondResponse.choices[0].message?.content || 'Entendido.';
            }

            // 4. Save Response
            await prisma.interaction.create({
                data: {
                    patientId: patient.id,
                    role: 'assistant',
                    content: aiResponse,
                }
            });

            // 5. Send back to user
            console.log(`[Diana] Response to ${patient.phone}: ${aiResponse}`);
            await OutputService.sendMessage(patient.phone, aiResponse);

            return aiResponse;

        } catch (error) {
            console.error('Error in IntelligenceService:', error);
            return null;
        }
    }
}
