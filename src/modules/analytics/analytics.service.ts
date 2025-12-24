import prisma from '../../database/prisma';

export class AnalyticsService {

    /**
     * 📊 TORRE DE CONTROL - Get business metrics with comparisons
     */
    static async getMetrics() {
        try {
            const now = new Date();
            const today = new Date(now.setHours(0, 0, 0, 0));
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);

            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

            // TODAY
            const appointmentsToday = await prisma.appointment.count({
                where: {
                    startTime: { gte: today },
                    status: { not: 'cancelled' }
                }
            });

            const leadsToday = await prisma.patient.count({
                where: { createdAt: { gte: today } }
            });

            // YESTERDAY
            const appointmentsYesterday = await prisma.appointment.count({
                where: {
                    startTime: { gte: yesterday, lt: today },
                    status: { not: 'cancelled' }
                }
            });

            const leadsYesterday = await prisma.patient.count({
                where: {
                    createdAt: { gte: yesterday, lt: today }
                }
            });

            // THIS MONTH
            const appointmentsThisMonth = await prisma.appointment.count({
                where: {
                    startTime: { gte: startOfMonth },
                    status: { not: 'cancelled' }
                }
            });

            const leadsThisMonth = await prisma.patient.count({
                where: { createdAt: { gte: startOfMonth } }
            });

            // LAST MONTH
            const appointmentsLastMonth = await prisma.appointment.count({
                where: {
                    startTime: { gte: startOfLastMonth, lte: endOfLastMonth },
                    status: { not: 'cancelled' }
                }
            });

            const leadsLastMonth = await prisma.patient.count({
                where: {
                    createdAt: { gte: startOfLastMonth, lte: endOfLastMonth }
                }
            });

            return {
                today: {
                    appointments: appointmentsToday,
                    leads: leadsToday
                },
                yesterday: {
                    appointments: appointmentsYesterday,
                    leads: leadsYesterday
                },
                thisMonth: {
                    appointments: appointmentsThisMonth,
                    leads: leadsThisMonth
                },
                lastMonth: {
                    appointments: appointmentsLastMonth,
                    leads: leadsLastMonth
                }
            };

        } catch (error) {
            console.error('[Analytics] Error getting metrics:', error);
            throw error;
        }
    }

    /**
     * 🔍 BUSCADOR CRM - Search patients by name or phone
     */
    static async searchPatient(query: string) {
        try {
            const patients = await prisma.patient.findMany({
                where: {
                    OR: [
                        { phone: { contains: query } },
                        { name: { contains: query, mode: 'insensitive' } }
                    ]
                },
                include: {
                    interactions: {
                        orderBy: { createdAt: 'desc' },
                        take: 1
                    },
                    appointments: {
                        where: {
                            startTime: { gte: new Date() },
                            status: { not: 'cancelled' }
                        },
                        orderBy: { startTime: 'asc' },
                        take: 1
                    }
                },
                take: 5
            });

            return patients.map(p => ({
                id: p.id,
                name: p.name || 'Sin nombre',
                phone: p.phone,
                status: p.status,
                followUpCount: p.followUpCount,
                lastInteraction: p.interactions[0]?.createdAt || p.createdAt,
                lastMessage: p.interactions[0]?.content?.substring(0, 50) || 'N/A',
                nextAppointment: p.appointments[0]?.startTime || null
            }));

        } catch (error) {
            console.error('[Analytics] Error searching patient:', error);
            throw error;
        }
    }

    /**
     * 📅 GESTIÓN DE TIEMPO - Get upcoming appointments
     */
    static async getUpcomingAppointments(days: number = 7) {
        try {
            const now = new Date();
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + days);

            const appointments = await prisma.appointment.findMany({
                where: {
                    startTime: { gte: now, lte: futureDate },
                    status: { not: 'cancelled' }
                },
                include: {
                    patient: {
                        select: {
                            name: true,
                            phone: true
                        }
                    }
                },
                orderBy: { startTime: 'asc' },
                take: 20
            });

            return appointments.map(apt => ({
                id: apt.id,
                startTime: apt.startTime,
                patientName: apt.patient.name || 'Sin nombre',
                patientPhone: apt.patient.phone,
                status: apt.status
            }));

        } catch (error) {
            console.error('[Analytics] Error getting appointments:', error);
            throw error;
        }
    }

    /**
     * 🎯 RADAR DE ACTIVIDAD - Get recent interactions
     */
    static async getRecentActivity(limit: number = 10) {
        try {
            const interactions = await prisma.interaction.findMany({
                where: {
                    role: 'user' // Only user messages
                },
                include: {
                    patient: {
                        select: {
                            name: true,
                            phone: true,
                            status: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                take: limit
            });

            return interactions.map(i => ({
                patientName: i.patient.name || 'Sin nombre',
                patientPhone: i.patient.phone,
                patientStatus: i.patient.status,
                message: i.content.substring(0, 60),
                timestamp: i.createdAt
            }));

        } catch (error) {
            console.error('[Analytics] Error getting recent activity:', error);
            throw error;
        }
    }

    /**
     * ✅ GESTIÓN DE CITAS - Update appointment status
     */
    static async updateAppointmentStatus(appointmentId: string, status: string) {
        try {
            const appointment = await prisma.appointment.update({
                where: { id: appointmentId },
                data: { status },
                include: { patient: true }
            });

            // If completed, update patient status to 'patient' (loyalty)
            if (status === 'completed' && appointment.patient.status === 'lead') {
                await prisma.patient.update({
                    where: { id: appointment.patientId },
                    data: { status: 'patient' }
                });
            }

            return appointment;
        } catch (error) {
            console.error('[Analytics] Error updating appointment status:', error);
            throw error;
        }
    }

    /**
     * 🔎 SEARCH - Find latest appointment for a patient name
     */
    static async findLatestAppointmentByPatient(nameOrPhone: string) {
        try {
            const patient = await prisma.patient.findFirst({
                where: {
                    OR: [
                        { name: { contains: nameOrPhone, mode: 'insensitive' } },
                        { phone: { contains: nameOrPhone } }
                    ]
                },
                include: {
                    appointments: {
                        orderBy: { startTime: 'desc' },
                        take: 1
                    }
                }
            });

            if (!patient || patient.appointments.length === 0) return null;
            return {
                appointment: patient.appointments[0],
                patient: { name: patient.name, phone: patient.phone, id: patient.id }
            };
        } catch (error) {
            console.error('[Analytics] Error finding latest appointment:', error);
            throw error;
        }
    }
}
