import cron from 'node-cron';
import prisma from '../../database/prisma';
import { OutputService } from '../output/output.service';
import openai from '../../config/openai';

export class ReactivationService {

    static init() {
        console.log('[Reactivation] Initializing lead follow-up system...');

        // Daily sweep at 10:00 AM (Santo Domingo time)
        cron.schedule('0 10 * * *', async () => {
            console.log('[Reactivation] Running daily sweep at 10:00 AM...');
            await this.runDailySweep();
        }, {
            timezone: 'America/Santo_Domingo'
        });

        console.log('[Reactivation] Cron job scheduled for 10:00 AM daily (America/Santo_Domingo)');
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
                .slice(0, 2)
                .map((i: any) => `${i.role}: ${i.content}`)
                .join('\n');

            const prompt = `
Eres Diana, coordinadora de la Clínica Dental Dra. Yasmin Pacheco.

CONTEXTO:
- Paciente: ${patientName}
- Intento de seguimiento: ${attemptNumber} de 2
- Últimas interacciones:
${recentMessages || 'Primera interacción'}

TAREA:
Escribe un mensaje de seguimiento breve, amable y NO insistente para retomar la conversación.

REGLAS:
- Máximo 2 oraciones
- Menciona algo específico de su conversación previa (si existe)
- ${attemptNumber === 1 ? 'Pregunta si sigue interesado' : 'Última oportunidad, ofrece horario específico'}
- NO uses "Hola" si ya conversaron antes
- Usa emojis sutiles (máximo 2)

Responde SOLO con el mensaje, sin comillas ni explicaciones.
`;

            const completion = await openai.chat.completions.create({
                model: 'gpt-3.5-turbo',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.8,
                max_tokens: 100
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
    private static async sendOwnerSummary(contactedLeads: any[]) {
        try {
            const ownerPhone = process.env.OWNER_WHATSAPP_NUMBER;

            if (!ownerPhone) {
                console.warn('[Reactivation] OWNER_WHATSAPP_NUMBER not configured');
                return;
            }

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

            await OutputService.sendMessage(ownerPhone, message);
            console.log('[Reactivation] Executive summary sent to owner');

        } catch (error) {
            console.error('[Reactivation] Error sending owner summary:', error);
        }
    }
}
