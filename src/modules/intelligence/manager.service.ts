import openai from '../../config/openai';
import { AnalyticsService } from '../analytics/analytics.service';
import { OutputService } from '../output/output.service';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { PromotionService } from '../promotions/promotion.service';
import { AlertService } from '../alert/alert.service';
import { SettingsService } from '../settings/settings.service';
import { MetaService } from '../marketing/meta.service';
import { MemoryService } from './memory.service';
import prisma from '../../database/prisma';

export class ManagerService {

    static async handleAdminQuery(patient: any, query: string, instanceName?: string) {
        try {
            console.log(`[Manager] Processing admin query from ${patient.phone}: "${query}"`);

            // Load history for context
            const history = await MemoryService.getContext(patient.id, 10);

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
                },
                {
                    type: 'function',
                    function: {
                        name: 'manage_promotion',
                        description: 'Add, list, or deactivate dental promotions',
                        parameters: {
                            type: 'object',
                            properties: {
                                action: { type: 'string', enum: ['add', 'list', 'deactivate'], description: 'Action to perform' },
                                service: { type: 'string', description: 'Service name (e.g., blanqueamiento, limpieza)' },
                                description: { type: 'string', description: 'Detailed promotion text' },
                                discountText: { type: 'string', description: 'Short discount tag (e.g., 20% OFF)' },
                                validUntil: { type: 'string', description: 'Expiration date (ISO format or YYYY-MM-DD)' }
                            },
                            required: ['action']
                        }
                    }
                },
                {
                    type: 'function',
                    function: {
                        name: 'manage_alerts',
                        description: 'Manage clinic alerts (closures, warnings, info)',
                        parameters: {
                            type: 'object',
                            properties: {
                                action: { type: 'string', enum: ['add', 'list', 'deactivate'], description: 'Action to perform' },
                                type: { type: 'string', enum: ['closure', 'warning', 'info'], description: 'Type of alert' },
                                message: { type: 'string', description: 'Alert message' },
                                startDate: { type: 'string', description: 'Start date (ISO format or YYYY-MM-DD)' },
                                endDate: { type: 'string', description: 'End date (ISO format or YYYY-MM-DD)' }
                            },
                            required: ['action']
                        }
                    }
                },
                {
                    type: 'function',
                    function: {
                        name: 'manage_settings',
                        description: 'View or update clinic settings (prices, hours, location)',
                        parameters: {
                            type: 'object',
                            properties: {
                                action: { type: 'string', enum: ['get', 'update'], description: 'Action to perform' },
                                key: { type: 'string', enum: ['prices', 'hours', 'location', 'doctor_info', 'payment_methods', 'notification_time', 'marketing_style', 'review_link', 'objections', 'instructions'], description: 'Setting key to manage' },
                                value: { type: 'string', description: 'New text content for the setting' }
                            },
                            required: ['action', 'key']
                        }
                    }
                },
                {
                    type: 'function',
                    function: {
                        name: 'update_appointment_status',
                        description: 'Mark an appointment as completed, cancelled or scheduled',
                        parameters: {
                            type: 'object',
                            properties: {
                                query: { type: 'string', description: 'Name or phone of the patient' },
                                status: { type: 'string', enum: ['completed', 'cancelled', 'scheduled'], description: 'New status' }
                            },
                            required: ['query', 'status']
                        }
                    }
                },
                {
                    type: 'function',
                    function: {
                        name: 'edit_patient',
                        description: 'Edit patient information (name, phone, tags, status)',
                        parameters: {
                            type: 'object',
                            properties: {
                                patientId: { type: 'string', description: 'Patient ID to edit' },
                                name: { type: 'string', description: 'New name' },
                                phone: { type: 'string', description: 'New phone number' },
                                tags: { type: 'array', items: { type: 'string' }, description: 'Tags to add' },
                                status: { type: 'string', enum: ['lead', 'patient', 'stopped'], description: 'Patient status' }
                            },
                            required: ['patientId']
                        }
                    }
                },
                {
                    type: 'function',
                    function: {
                        name: 'edit_appointment',
                        description: 'Edit or cancel an appointment',
                        parameters: {
                            type: 'object',
                            properties: {
                                appointmentId: { type: 'string', description: 'Appointment ID' },
                                startTime: { type: 'string', description: 'New start time (ISO format)' },
                                status: { type: 'string', enum: ['scheduled', 'cancelled', 'completed'], description: 'Appointment status' }
                            },
                            required: ['appointmentId']
                        }
                    }
                },
                {
                    type: 'function',
                    function: {
                        name: 'execute_query',
                        description: 'Execute a custom database query for advanced operations (USE WITH CAUTION)',
                        parameters: {
                            type: 'object',
                            properties: {
                                operation: { type: 'string', enum: ['count', 'list', 'update', 'delete'], description: 'Type of operation' },
                                table: { type: 'string', enum: ['patients', 'appointments', 'interactions', 'promotions', 'clinic_alerts', 'system_settings'], description: 'Table to query' },
                                filters: { type: 'object', description: 'Filters to apply (e.g., {status: "lead"})' },
                                updates: { type: 'object', description: 'Fields to update (only for update operation)' }
                            },
                            required: ['operation', 'table']
                        }
                    }
                }
            ];

            const systemPrompt = `
Eres el Asistente Gerencial de la Clínica Dental Dra. Yasmin Pacheco.

PERSONALIDAD:
- Ejecutivo, conciso, directo
- PROHIBIDO: Saludos repetitivos ("Hola", "Buenas"), preguntas de cortesía innecesarias
- OBLIGATORIO: Datos duros, formato limpio, acción inmediata

CAPACIDADES COMPLETAS:
Tienes acceso TOTAL a la base de datos para:
- Ver y analizar métricas
- Buscar pacientes
- Gestionar citas (crear, modificar, cancelar, completar)
- Administrar promociones y alertas
- Configurar TODOS los settings de la clínica
- Actualizar cualquier información del sistema

FORMATO DE RESPUESTA:
- Usa emojis funcionales (📊, ✅, 📅, 🔍, ⚙️)
- Máximo 3 líneas por sección
- Si hay comparativas, muestra delta (+X, -X)
- Confirma acciones ejecutadas con mensaje claro

INTERPRETACIÓN INTELIGENTE:
- Si el admin pide "cambiar X", "actualizar Y", "modificar Z" → usa la herramienta correspondiente
- Si menciona precios, horarios, ubicación → es manage_settings
- Si habla de promociones, descuentos → es manage_promotion
- Si menciona cierres, vacaciones → es manage_alerts
- Si pide datos, métricas, reportes → usa get_metrics o search_patient

NO PIDAS CONFIRMACIÓN si la instrucción es clara. EJECUTA directamente.
`;

            // Main AI call
            const completion = await openai.chat.completions.create({
                model: 'gpt-4o-mini', // Upgraded from gpt-3.5-turbo for better understanding
                messages: [
                    { role: 'system', content: systemPrompt },
                    ...history,
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

                    case 'manage_promotion':
                        if (functionArgs.action === 'add') {
                            const promo = await PromotionService.upsertPromotion({
                                service: functionArgs.service,
                                description: functionArgs.description,
                                discountText: functionArgs.discountText,
                                validUntil: functionArgs.validUntil ? new Date(functionArgs.validUntil) : undefined
                            });
                            finalResponse = `✅ *Promoción Guardada*\n\nServicio: ${promo.service}\nDetalle: ${promo.description}\n${promo.validUntil ? `Vence: ${promo.validUntil.toLocaleDateString('es-DO')}` : ''}`;
                        } else if (functionArgs.action === 'list') {
                            const promos = await PromotionService.getActivePromotions();
                            finalResponse = this.formatPromotionsList(promos);
                        } else if (functionArgs.action === 'deactivate') {
                            await PromotionService.deactivatePromotion(functionArgs.service);
                            finalResponse = `✅ *Promoción Desactivada* para "${functionArgs.service}"`;
                        }
                        break;

                    case 'manage_alerts':
                        if (functionArgs.action === 'add') {
                            const alert = await AlertService.createAlert({
                                type: functionArgs.type || 'info',
                                message: functionArgs.message,
                                startDate: functionArgs.startDate ? new Date(functionArgs.startDate) : new Date(),
                                endDate: functionArgs.endDate ? new Date(functionArgs.endDate) : new Date(new Date().setHours(23, 59, 59, 999))
                            });
                            finalResponse = `✅ *Aviso Registrado*\n\nTipo: ${alert.type.toUpperCase()}\nMensaje: ${alert.message}\nDel: ${alert.startDate.toLocaleDateString('es-DO')}\nAl: ${alert.endDate.toLocaleDateString('es-DO')}`;
                        } else if (functionArgs.action === 'list') {
                            const alerts = await AlertService.getActiveAlerts();
                            finalResponse = this.formatAlertsList(alerts);
                        } else if (functionArgs.action === 'deactivate') {
                            await AlertService.deactivateAlert(functionArgs.message);
                            finalResponse = `✅ *Aviso Desactivado* (si se encontró coincidencia)`;
                        }
                        break;

                    case 'manage_settings':
                        if (functionArgs.action === 'get') {
                            const value = await SettingsService.get(functionArgs.key);
                            finalResponse = `⚙️ *Configuración Actual: ${functionArgs.key.toUpperCase()}*\n\n${value}`;
                        } else if (functionArgs.action === 'update') {
                            await SettingsService.set(functionArgs.key, functionArgs.value);
                            finalResponse = `✅ *Configuración Actualizada*\n\nSe ha guardado la nueva información para: ${functionArgs.key}`;
                        }
                        break;

                    case 'update_appointment_status':
                        const searchResult = await AnalyticsService.findLatestAppointmentByPatient(functionArgs.query);
                        if (!searchResult) {
                            finalResponse = `❌ No se encontró el paciente o no tiene citas registradas: "${functionArgs.query}"`;
                        } else {
                            const { appointment, patient: targetPatient } = searchResult;
                            await AnalyticsService.updateAppointmentStatus(appointment.id, functionArgs.status);

                            if (functionArgs.status === 'completed') {
                                const reviewLink = await SettingsService.get('review_link');
                                finalResponse = `✅ *Cita Completada*\n\nLa cita de *${targetPatient.name}* ha sido marcada como completada.\n\n🌟 *Sugerencia:* Copia y pega este link para pedirle una reseña:\n${reviewLink}`;

                                // Meta CAPI: Purchase/QualifiedLead
                                await MetaService.sendEvent('Purchase', targetPatient);
                            } else {
                                finalResponse = `✅ *Estado Actualizado*\n\nLa cita de *${targetPatient.name}* ahora está: *${functionArgs.status.toUpperCase()}*`;
                            }
                        }
                        break;

                    case 'edit_patient':
                        const updateData: any = {};
                        if (functionArgs.name) updateData.name = functionArgs.name;
                        if (functionArgs.phone) updateData.phone = functionArgs.phone;
                        if (functionArgs.tags) updateData.tags = functionArgs.tags;
                        if (functionArgs.status) updateData.status = functionArgs.status;

                        await prisma.patient.update({
                            where: { id: functionArgs.patientId },
                            data: updateData
                        });
                        finalResponse = `✅ *Paciente Actualizado*\n\nID: ${functionArgs.patientId}\nCambios aplicados exitosamente.`;
                        break;

                    case 'edit_appointment':
                        const apptUpdateData: any = {};
                        if (functionArgs.startTime) {
                            const newStart = new Date(functionArgs.startTime);
                            apptUpdateData.startTime = newStart;
                            apptUpdateData.endTime = new Date(newStart.getTime() + 60 * 60 * 1000); // +1 hour
                        }
                        if (functionArgs.status) apptUpdateData.status = functionArgs.status;

                        await prisma.appointment.update({
                            where: { id: functionArgs.appointmentId },
                            data: apptUpdateData
                        });
                        finalResponse = `✅ *Cita Actualizada*\n\nID: ${functionArgs.appointmentId}\nCambios aplicados exitosamente.`;
                        break;

                    case 'execute_query':
                        const { operation, table, filters, updates } = functionArgs;
                        let queryResult: any;

                        switch (operation) {
                            case 'count':
                                queryResult = await (prisma as any)[table].count({ where: filters || {} });
                                finalResponse = `📊 *Resultado*\n\nTabla: ${table}\nTotal: ${queryResult} registros`;
                                break;
                            case 'list':
                                queryResult = await (prisma as any)[table].findMany({
                                    where: filters || {},
                                    take: 10
                                });
                                finalResponse = `📋 *Primeros 10 registros de ${table}*\n\n${JSON.stringify(queryResult, null, 2).substring(0, 500)}...`;
                                break;
                            case 'update':
                                queryResult = await (prisma as any)[table].updateMany({
                                    where: filters || {},
                                    data: updates || {}
                                });
                                finalResponse = `✅ *Actualización Masiva*\n\nTabla: ${table}\nRegistros afectados: ${queryResult.count}`;
                                break;
                            case 'delete':
                                queryResult = await (prisma as any)[table].deleteMany({
                                    where: filters || {}
                                });
                                finalResponse = `⚠️ *Eliminación Ejecutada*\n\nTabla: ${table}\nRegistros eliminados: ${queryResult.count}`;
                                break;
                        }
                        break;

                    default:
                        finalResponse = 'Herramienta no reconocida.';
                }

            } else {
                // No tool needed, direct response
                finalResponse = responseMessage.content || 'Sin respuesta.';
            }

            // Save assistant response to DB
            await prisma.interaction.create({
                data: {
                    patientId: patient.id, // Using the admin's patient ID for history
                    role: 'assistant',
                    content: finalResponse
                }
            });

            // Send response to admin
            await OutputService.sendMessage(patient.phone, finalResponse, instanceName);

            return finalResponse;

        } catch (error: any) {
            console.error('[Manager] Error handling admin query:', error);
            const errorMsg = error.message || JSON.stringify(error);
            await OutputService.sendMessage(patient.phone, `❌ Error procesando consulta: ${errorMsg}`, instanceName);
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

    /**
     * FORMAT PROMOTIONS LIST
     */
    private static formatPromotionsList(promos: any[]): string {
        if (promos.length === 0) {
            return `🏷️ No hay promociones activas en este momento.`;
        }

        let msg = `🏷️ *Promociones Activas*\n\n`;

        promos.forEach((p, idx) => {
            msg += `${idx + 1}. *${p.service.toUpperCase()}*\n`;
            msg += `   ${p.description}\n`;
            if (p.discountText) msg += `   Tag: ${p.discountText}\n`;
            if (p.validUntil) {
                msg += `   Vence: ${new Date(p.validUntil).toLocaleDateString('es-DO')}\n`;
            }
            msg += `\n`;
        });

        return msg.trim();
    }

    /**
     * FORMAT ALERTS LIST
     */
    private static formatAlertsList(alerts: any[]): string {
        if (alerts.length === 0) {
            return `🔔 No hay avisos operativos activos.`;
        }

        let msg = `🔔 *Avisos Operativos Activos*\n\n`;

        alerts.forEach((a, idx) => {
            const icon = a.type === 'closure' ? '🔴' : a.type === 'warning' ? '🟡' : '🔵';
            msg += `${idx + 1}. ${icon} *${a.type.toUpperCase()}* - ${a.message}\n`;
            msg += `   📅 ${new Date(a.startDate).toLocaleDateString('es-DO')} al ${new Date(a.endDate).toLocaleDateString('es-DO')}\n\n`;
        });

        return msg.trim();
    }
}
