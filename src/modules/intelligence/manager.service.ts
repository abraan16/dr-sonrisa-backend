import openai from '../../config/openai';
import { AnalyticsService } from '../analytics/analytics.service';
import { OutputService } from '../output/output.service';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export class ManagerService {

    static async handleAdminQuery(patient: any, query: string) {
        try {
            console.log(`[Manager] Processing admin query from ${patient.phone}: "${query}"`);

            // Define tools for Manager AI
            const tools: any[] = [
                {
                    type: 'function',
                    function: {
                        name: 'get_metrics',
                        description: 'Get business metrics (appointments, leads) with comparisons to yesterday and last month',
                        parameters: { type: 'object', properties: {} }
                    }
                },
                {
                    type: 'function',
                    function: {
                        name: 'search_patient',
                        description: 'Search for a patient by name or phone number',
                        parameters: {
                            type: 'object',
                            properties: {
                                query: { type: 'string', description: 'Name or phone to search' }
                            },
                            required: ['query']
                        }
                    }
                },
                {
                    type: 'function',
                    function: {
                        name: 'get_appointments',
                        description: 'Get upcoming appointments for the next N days',
                        parameters: {
                            type: 'object',
                            properties: {
                                days: { type: 'number', description: 'Number of days to look ahead (default: 7)' }
                            }
                        }
                    }
                },
                {
                    type: 'function',
                    function: {
                        name: 'get_recent_activity',
                        description: 'Get recent patient interactions/messages',
                        parameters: {
                            type: 'object',
                            properties: {
                                limit: { type: 'number', description: 'Number of interactions to retrieve (default: 10)' }
                            }
                        }
                    }
                }
            ];

            const systemPrompt = `
Eres el Asistente Gerencial de la Clínica Dental Dra. Yasmin Pacheco.

PERSONALIDAD:
- Ejecutivo, conciso, directo
- PROHIBIDO: Saludos ("Hola", "Buenas"), preguntas de cortesía ("¿Algo más?")
- OBLIGATORIO: Datos duros, formato limpio

FORMATO DE RESPUESTA:
- Usa emojis funcionales (📊, ✅, 📅, 🔍)
- Máximo 3 líneas por sección
- Si hay comparativas, muestra delta (+X, -X)

HERRAMIENTAS DISPONIBLES:
- get_metrics: Métricas del día/mes
- search_patient: Buscar paciente
- get_appointments: Agenda próxima
- get_recent_activity: Actividad reciente

Analiza la pregunta del admin y usa la herramienta apropiada.
`;

            // First LLM call to determine which tool to use
            const completion = await openai.chat.completions.create({
                model: 'gpt-3.5-turbo',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: query }
                ],
                tools: tools,
                tool_choice: 'auto'
            });

            const responseMessage = completion.choices[0].message;
            let finalResponse = '';

            // Handle tool calls
            if (responseMessage.tool_calls) {
                const toolCall = responseMessage.tool_calls[0];
                const toolCallAny = toolCall as any;
                const functionName = toolCallAny.function.name;
                const functionArgs = JSON.parse(toolCallAny.function.arguments || '{}');

                console.log(`[Manager] Calling tool: ${functionName}`, functionArgs);

                let toolResult: any;

                // Execute the appropriate tool
                switch (functionName) {
                    case 'get_metrics':
                        toolResult = await AnalyticsService.getMetrics();
                        finalResponse = this.formatMetrics(toolResult);
                        break;

                    case 'search_patient':
                        toolResult = await AnalyticsService.searchPatient(functionArgs.query);
                        finalResponse = this.formatPatientSearch(toolResult, functionArgs.query);
                        break;

                    case 'get_appointments':
                        toolResult = await AnalyticsService.getUpcomingAppointments(functionArgs.days || 7);
                        finalResponse = this.formatAppointments(toolResult);
                        break;

                    case 'get_recent_activity':
                        toolResult = await AnalyticsService.getRecentActivity(functionArgs.limit || 10);
                        finalResponse = this.formatRecentActivity(toolResult);
                        break;

                    default:
                        finalResponse = 'Herramienta no reconocida.';
                }

            } else {
                // No tool needed, direct response
                finalResponse = responseMessage.content || 'Sin respuesta.';
            }

            // Send response to admin
            await OutputService.sendMessage(patient.phone, finalResponse);

            return finalResponse;

        } catch (error) {
            console.error('[Manager] Error handling admin query:', error);
            await OutputService.sendMessage(patient.phone, '❌ Error procesando consulta.');
            return null;
        }
    }

    /**
     * FORMAT METRICS
     */
    private static formatMetrics(data: any): string {
        const deltaAppts = data.today.appointments - data.yesterday.appointments;
        const deltaLeads = data.today.leads - data.yesterday.leads;
        const deltaApptsMonth = data.thisMonth.appointments - data.lastMonth.appointments;
        const deltaLeadsMonth = data.thisMonth.leads - data.lastMonth.leads;

        let msg = `📊 *Métricas del Día*\n\n`;
        msg += `✅ Citas: ${data.today.appointments} (ayer: ${data.yesterday.appointments}, ${deltaAppts >= 0 ? '+' : ''}${deltaAppts})\n`;
        msg += `📞 Leads: ${data.today.leads} (ayer: ${data.yesterday.leads}, ${deltaLeads >= 0 ? '+' : ''}${deltaLeads})\n\n`;
        msg += `📈 *Este Mes*\n`;
        msg += `Citas: ${data.thisMonth.appointments} (mes pasado: ${data.lastMonth.appointments}, ${deltaApptsMonth >= 0 ? '+' : ''}${deltaApptsMonth})\n`;
        msg += `Leads: ${data.thisMonth.leads} (mes pasado: ${data.lastMonth.leads}, ${deltaLeadsMonth >= 0 ? '+' : ''}${deltaLeadsMonth})`;

        return msg;
    }

    /**
     * FORMAT PATIENT SEARCH
     */
    private static formatPatientSearch(patients: any[], query: string): string {
        if (patients.length === 0) {
            return `🔍 No se encontraron resultados para "${query}"`;
        }

        let msg = `🔍 *Resultados para "${query}"*\n\n`;

        patients.forEach((p, idx) => {
            const timeSince = formatDistanceToNow(new Date(p.lastInteraction), { addSuffix: true, locale: es });
            msg += `${idx + 1}. ${p.name} - ${p.phone}\n`;
            msg += `   Status: ${p.status} | Seguimiento: ${p.followUpCount}/2\n`;
            msg += `   Última interacción: ${timeSince}\n`;
            if (p.nextAppointment) {
                msg += `   📅 Próxima cita: ${new Date(p.nextAppointment).toLocaleString('es-DO', { timeZone: 'America/Santo_Domingo' })}\n`;
            }
            msg += `\n`;
        });

        return msg.trim();
    }

    /**
     * FORMAT APPOINTMENTS
     */
    private static formatAppointments(appointments: any[]): string {
        if (appointments.length === 0) {
            return `📅 No hay citas programadas próximamente.`;
        }

        let msg = `📅 *Próximas Citas*\n\n`;

        appointments.forEach((apt, idx) => {
            const dateStr = new Date(apt.startTime).toLocaleString('es-DO', {
                timeZone: 'America/Santo_Domingo',
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            msg += `${idx + 1}. ${dateStr}\n`;
            msg += `   ${apt.patientName} - ${apt.patientPhone}\n\n`;
        });

        return msg.trim();
    }

    /**
     * FORMAT RECENT ACTIVITY
     */
    private static formatRecentActivity(interactions: any[]): string {
        if (interactions.length === 0) {
            return `🎯 No hay actividad reciente.`;
        }

        let msg = `🎯 *Actividad Reciente*\n\n`;

        interactions.forEach((i, idx) => {
            const timeSince = formatDistanceToNow(new Date(i.timestamp), { addSuffix: true, locale: es });
            msg += `${idx + 1}. ${i.patientName} (${i.patientStatus})\n`;
            msg += `   "${i.message}..."\n`;
            msg += `   ${timeSince}\n\n`;
        });

        return msg.trim();
    }
}
