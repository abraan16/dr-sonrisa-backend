import prisma from '../../database/prisma';

export class HandoffService {

    /**
     * Detecta si un mensaje fue enviado por la recepcionista (humano)
     * Evolution API marca los mensajes enviados manualmente con un flag especial
     */
    static isHumanResponse(webhookData: any): boolean {
        // Método 1: Verificar si el mensaje viene del "owner" de la instancia
        // (mensajes enviados manualmente desde WhatsApp Web/Mobile)
        if (webhookData.key?.fromMe === true) {
            return true;
        }

        // Método 2: Verificar si el mensaje NO tiene el flag de bot
        // (Evolution API puede marcar mensajes del bot)
        if (webhookData.messageSource === 'web' || webhookData.messageSource === 'mobile') {
            return true;
        }

        return false;
    }

    /**
     * Pausa el bot para un paciente cuando el humano interviene
     */
    static async pauseBotForPatient(patientId: string) {
        try {
            await prisma.patient.update({
                where: { id: patientId },
                data: {
                    botStatus: 'paused',
                    handoffAt: new Date(),
                    lastHumanResponseAt: new Date()
                }
            });

            console.log(`[Handoff] Bot paused for patient ${patientId} (human intervention detected)`);
        } catch (error) {
            console.error('[Handoff] Error pausing bot:', error);
        }
    }

    /**
     * Actualiza el timestamp de última respuesta humana
     */
    static async updateHumanActivity(patientId: string) {
        try {
            await prisma.patient.update({
                where: { id: patientId },
                data: {
                    lastHumanResponseAt: new Date()
                }
            });
        } catch (error) {
            console.error('[Handoff] Error updating human activity:', error);
        }
    }

    /**
     * Verifica si el bot debe permanecer pausado
     */
    static async shouldBotRemainPaused(patientId: string): Promise<boolean> {
        try {
            const patient = await prisma.patient.findUnique({
                where: { id: patientId }
            });

            if (!patient) return false;

            // Si el bot está activo, no está pausado
            if (patient.botStatus === 'active') {
                return false;
            }

            // Si está pausado, verificar timeout (2 horas sin actividad humana)
            if (patient.lastHumanResponseAt) {
                const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

                if (patient.lastHumanResponseAt < twoHoursAgo) {
                    // Han pasado más de 2 horas, reactivar bot
                    await this.resumeBot(patientId);
                    return false;
                }
            }

            return true; // Bot debe permanecer pausado
        } catch (error) {
            console.error('[Handoff] Error checking bot status:', error);
            return false;
        }
    }

    /**
     * Reactiva el bot automáticamente (timeout)
     */
    static async resumeBot(patientId: string) {
        try {
            await prisma.patient.update({
                where: { id: patientId },
                data: {
                    botStatus: 'active'
                }
            });

            console.log(`[Handoff] Bot auto-resumed for patient ${patientId} (timeout)`);
        } catch (error) {
            console.error('[Handoff] Error resuming bot:', error);
        }
    }

    /**
     * Cron job para revisar timeouts (ejecutar cada 30 minutos)
     */
    static async checkTimeouts() {
        try {
            const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

            const pausedPatients = await prisma.patient.findMany({
                where: {
                    botStatus: 'paused',
                    lastHumanResponseAt: { lt: twoHoursAgo }
                }
            });

            for (const patient of pausedPatients) {
                await this.resumeBot(patient.id);
            }

            if (pausedPatients.length > 0) {
                console.log(`[Handoff] Auto-resumed ${pausedPatients.length} conversations (timeout)`);
            }
        } catch (error) {
            console.error('[Handoff] Error in timeout check:', error);
        }
    }
}
