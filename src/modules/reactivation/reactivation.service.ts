import cron from 'node-cron';
import prisma from '../../database/prisma';
import { InputService } from '../input/input.service'; // Start conversation again via output?
// For now, Reactivation just logs or sends template. 
// We don't have an OutputModule defined to SEND messages yet (Evolution API).
// I will implement a placeholder send.

export class ReactivationService {

    static init() {
        // Run every day at 10 AM
        cron.schedule('0 10 * * *', () => {
            console.log('Running daily reactivation sweep...');
            this.runDailySweep();
        });
    }

    static async runDailySweep() {
        try {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);

            // Find patients created > 24h ago with no appointments
            // This is a simplified logic
            const stalePatients = await prisma.patient.findMany({
                where: {
                    createdAt: { lt: yesterday },
                    appointments: { none: {} }
                },
                take: 5
            });

            for (const patient of stalePatients) {
                console.log(`Reactivating patient: ${patient.id} - ${patient.name}`);
                // Logic to send message:
                // OutputService.send(patient.phone, "Hola! ¿Sigues interesado?");
            }
        } catch (error) {
            console.error('Error in reactivation sweep:', error);
        }
    }
}
