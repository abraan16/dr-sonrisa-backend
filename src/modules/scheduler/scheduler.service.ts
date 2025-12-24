import prisma from '../../database/prisma';
import { addHours, startOfDay, endOfDay, setHours, format } from 'date-fns';

export class SchedulerService {

    // Business Rules: Working hours 9 AM - 6 PM
    private static readonly WORK_START_HOUR = 9;
    private static readonly WORK_END_HOUR = 18;

    static async checkAvailability(date: Date) {
        try {
            // Holiday Guardrail: Closed until Jan 7, 2026
            const holidayStart = new Date('2025-12-24T00:00:00');
            const holidayEnd = new Date('2026-01-07T23:59:59');

            if (date >= holidayStart && date <= holidayEnd) {
                console.log(`[Scheduler] Date ${date.toISOString()} is within holiday range. Returning 0 slots.`);
                return [];
            }

            const start = setHours(startOfDay(date), this.WORK_START_HOUR);
            const end = setHours(startOfDay(date), this.WORK_END_HOUR);

            // Get all appointments for the day
            const existingAppointments = await prisma.appointment.findMany({
                where: {
                    startTime: {
                        gte: start,
                        lt: end
                    },
                    status: { not: 'cancelled' }
                }
            });

            // Generate all possible slots (e.g. hourly)
            const slots: string[] = [];
            let currentSlot = start;

            while (currentSlot < end) {
                // Check if this slot overlaps with any existing appointment
                const isBusy = existingAppointments.some(appt => {
                    const apptStart = new Date(appt.startTime);
                    const apptEnd = new Date(appt.endTime);
                    // Simple overlap check for hourly slots
                    return currentSlot.getTime() === apptStart.getTime();
                });

                if (!isBusy) {
                    slots.push(format(currentSlot, "yyyy-MM-dd'T'HH:mm:ss"));
                }

                currentSlot = addHours(currentSlot, 1);
            }

            return slots; // Returns list of AVAILABLE start times
        } catch (error) {
            console.error('Error in SchedulerService.checkAvailability:', error);
            return [];
        }
    }

    static async createAppointment(patientId: string, startTime: string) {
        try {
            const start = new Date(startTime);
            const end = addHours(start, 1); // 1 hour duration

            // Double check availability (concurrency)
            const conflict = await prisma.appointment.findFirst({
                where: {
                    startTime: { equals: start },
                    status: { not: 'cancelled' }
                }
            });

            if (conflict) {
                throw new Error('Slot already taken');
            }

            const patient = await prisma.patient.findUnique({ where: { id: patientId } });
            if (!patient) throw new Error('Patient not found');

            // Save to local DB ONLY
            const appointment = await prisma.appointment.create({
                data: {
                    patientId,
                    startTime: start,
                    endTime: end,
                    status: 'scheduled'
                }
            });

            return appointment;
        } catch (error) {
            console.error('Error scheduling appointment:', error);
            throw error;
        }
    }
}
