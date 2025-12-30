import cron from 'node-cron';
import prisma from '../../database/prisma';
import { OutputService } from '../output/output.service';
import openai from '../../config/openai';
import { SettingsService } from '../settings/settings.service';

export class ReactivationService {

    static init() {
        console.log('[Reactivation] Initializing lead follow-up system...');

        // Check every hour (at minute 0)
        cron.schedule('0 * * * *', async () => {
            const now = new Date();
            const currentHour = now.toLocaleString('es-DO', {
                timeZone: 'America/Santo_Domingo',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });

            // Get configured time or default to 10:00 (for sweep) or 22:00 (for report)
            // Ideally we separate sweep and report, but for now let's keep it simple:
            // The daily sweep sends the report at the end.
            const scheduledTime = await SettingsService.get('notification_time');

            // Check if current HH:MM matches scheduled HH:MM (ignoring small drifts)
            // Since cron runs at minute 0, we check if scheduledTime starts with currentHour's hour part
            // But better: strict match

            console.log(`[Reactivation] Hourly check. Current: ${currentHour}, Scheduled: ${scheduledTime}`);

            if (currentHour === scheduledTime) {
                console.log('[Reactivation] Time match! Running daily sweep...');
                await this.runDailySweep();
            }
        }, {
            timezone: 'America/Santo_Domingo'
        });

        console.log('[Reactivation] Dynamic Cron Job Scheduler initialized (Hourly Check)');
    }

    static async runDailySweep() {
        try {
            const contactedLeads: any[] = [];

            // 🎣 STEP 1: Select leads that need follow-up
            const leads = await this.selectLeadsForFollowUp();

            console.log(`[Reactivation] Found ${leads.length} leads for follow-up`);

            // 🔄 STEP 2: Process each lead
            for (const lead of leads) {
                try {
                    // 🛡️ Safety validations
                    if (!this.isValidForContact(lead)) {
                        console.log(`[Reactivation] Skipping lead ${lead.id} - failed validation`);
                        continue;
                    }

                    // 🤖 STEP 3: Generate personalized message with Diana
                    const message = await this.generateFollowUpMessage(lead);

                    if (!message) {
                        console.log(`[Reactivation] Failed to generate message for ${lead.id}`);
                        continue;
                    }

                    // 📤 STEP 4: Send message
                    await OutputService.sendMessage(lead.phone, message);

                    // 📝 STEP 5: Update patient record
                    await this.updateFollowUpStatus(lead.id);

                    contactedLeads.push({
                        name: lead.name || 'Sin nombre',
                        phone: lead.phone,
                        attempt: lead.followUpCount + 1
                    });

                    console.log(`[Reactivation] Successfully contacted lead: ${lead.name} (${lead.phone})`);

                } catch (error) {
                    console.error(`[Reactivation] Error processing lead ${lead.id}:`, error);
                }
            }

            // 📊 STEP 6: Send executive summary to owner
            await this.sendOwnerSummary(contactedLeads);

        } catch (error) {
            console.error('[Reactivation] Error in daily sweep:', error);
        }
    }

    /**
     * 🎣 SELECT LEADS FOR FOLLOW-UP
     * Criteria:
     * - Status = "lead" (not converted)
     * - followUpStatus = "pending" (not stopped)
     * - followUpCount < 2 (max 2 attempts)
     * - lastInteractionAt > 24h (1st attempt) or > 48h (2nd attempt)
     * - No appointments scheduled
     */
    private static async selectLeadsForFollowUp() {
        const now = new Date();
        const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

        // Get leads for 1st attempt (24h+)
        const firstAttemptLeads = await prisma.patient.findMany({
            where: {
                status: 'lead',
                followUpStatus: 'pending',
                followUpCount: 0,
                lastInteractionAt: { lt: twentyFourHoursAgo },
                appointments: { none: {} }
            },
            include: {
                interactions: {
                    orderBy: { createdAt: 'desc' },
                    take: 3
                }
            },
            take: 20 // Limit to prevent spam
        });

        // Get leads for 2nd attempt (48h+)
        const secondAttemptLeads = await prisma.patient.findMany({
            where: {
                status: 'lead',
                followUpStatus: 'pending',
                followUpCount: 1,
                lastInteractionAt: { lt: fortyEightHoursAgo },
                appointments: { none: {} }
            },
            include: {
                interactions: {
                    orderBy: { createdAt: 'desc' },
                    take: 3
                }
            },
            take: 20
        });

        return [...firstAttemptLeads, ...secondAttemptLeads];
    }

    /**
     * 🛡️ SAFETY VALIDATIONS
     */
    private static isValidForContact(lead: any): boolean {
        // Has valid phone
        if (!lead.phone || lead.phone.length < 10) {
            return false;
        }

        // Not stopped
        if (lead.followUpStatus === 'stopped') {
            return false;
        }

        // Doesn't have appointment (double-check)
        if (lead.appointments && lead.appointments.length > 0) {
            return false;
        }

        return true;
    }

    /**
     * 🤖 GENERATE PERSONALIZED MESSAGE WITH DIANA
     */
    private static async generateFollowUpMessage(lead: any): Promise<string | null> {
        try {
            const attemptNumber = lead.followUpCount + 1;
            const patientName = lead.name || 'amigo/a';

            // Get conversation context
            const recentMessages = lead.interactions
                .slice(0, 3) // Take 3 messages for better context
                .map((i: any) => `${i.role === 'user' ? 'Paciente' : 'Diana'}: ${i.content}`)
                .join('\n');

            const prompt = `
Eres Diana, la Coordinadora de Pacientes de la Clínica Dental Dra. Yasmin Pacheco. 
Tu objetivo es retomar el contacto con un paciente de forma EMPÁTICA y PERSUASIVA.

CONTEXTO:
- Paciente: ${patientName}
- Intento de seguimiento: ${attemptNumber} de 2
- Historial reciente:
${recentMessages || 'No hay mensajes previos, es un nuevo lead que no respondió al inicio.'}

INSTRUCCIONES DE TONO:
- Natural, corto (max 2-3 líneas), como un WhatsApp real.
- Usa "Usted" pero con calidez.
- ${attemptNumber === 1 ? 'Enfócate en romper el hielo. No preguntes solo "si sigue interesado", ofrece ayuda o recuerda un beneficio del tratamiento que buscaba.' : 'Enfócate en dar valor o urgencia suave. Por ejemplo, menciona que la agenda se llena o que la promo está activa.'}

REGLAS ESTRICTAS:
- NO saludes con "Hola" si ya hay historial previo.
- NO seas robótico preguntando "disponibilidad para cita" si aún no han confirmado interés.
- Si el historial menciona un tratamiento específico (ej: Brackets, Limpieza), MENCIONALO.
- Usa máximo 2 emojis sutiles.

Responde SOLO con el mensaje de WhatsApp.
`;

            const completion = await openai.chat.completions.create({
                model: 'gpt-3.5-turbo',
                messages: [{ role: 'system', content: 'Eres una experta en ventas dentales por WhatsApp, cercana y profesional.' }, { role: 'user', content: prompt }],
                temperature: 0.8,
                max_tokens: 150
            });

            return completion.choices[0].message?.content?.trim() || null;
        } catch (error) {
            console.error('[Reactivation] Error generating message:', error);
            return null;
        }
    }

    /**
     * 📝 UPDATE FOLLOW-UP STATUS
     */
    private static async updateFollowUpStatus(leadId: string) {
        const lead = await prisma.patient.findUnique({
            where: { id: leadId }
        });

        if (!lead) return;

        const newCount = lead.followUpCount + 1;
        const newStatus = newCount >= 2 ? 'stopped' : 'pending';

        await prisma.patient.update({
            where: { id: leadId },
            data: {
                followUpCount: newCount,
                followUpStatus: newStatus,
                lastInteractionAt: new Date()
            }
        });
    }

    /**
     * 📊 SEND EXECUTIVE SUMMARY TO OWNER
     */
    /**
     * 📊 SEND EXECUTIVE SUMMARY TO OWNER & STAFF
     */
    private static async sendOwnerSummary(contactedLeads: any[]) {
        try {
            const dateParams: Intl.DateTimeFormatOptions = {
                timeZone: 'America/Santo_Domingo',
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            };
            const currentDate = new Date().toLocaleString('es-DO', dateParams);

            let message = `📊 *Resumen Ejecutivo de Seguimiento*\n\n`;
            message += `📅 ${currentDate}\n\n`;
            message += `✅ *Leads contactados hoy*: ${contactedLeads.length}\n\n`;

            if (contactedLeads.length > 0) {
                message += `---\n`;
                contactedLeads.forEach((lead, index) => {
                    message += `${index + 1}. ${lead.name} - ${lead.phone}\n`;
                    message += `   📍 Intento #${lead.attempt}\n\n`;
                });
                message += `---\n\n`;
            }

            message += `🔄 *Próximo seguimiento*: Mañana a las 10:00 AM\n\n`;
            message += `💡 Los leads que no respondan después de 2 intentos serán marcados como "detenidos" para revisión manual.`;

            await OutputService.notifyAdmins(message);

            console.log('[Reactivation] Executive summary sent successfully via unified notification system.');

        } catch (error) {
            console.error('[Reactivation] Error sending owner summary:', error);
        }
    }
}
