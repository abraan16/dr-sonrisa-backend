import prisma from '../../database/prisma';

export interface AlertData {
    type: 'closure' | 'warning' | 'info';
    message: string;
    startDate: Date;
    endDate: Date;
}

export class AlertService {

    /**
     * Create or update a clinic alert
     */
    static async createAlert(data: AlertData) {
        try {
            return await prisma.clinicAlert.create({
                data: {
                    type: data.type,
                    message: data.message,
                    startDate: data.startDate,
                    endDate: data.endDate,
                    isActive: true
                }
            });
        } catch (error) {
            console.error('[AlertService] Error creating alert:', error);
            throw error;
        }
    }

    /**
     * Get all active alerts for current context
     */
    static async getActiveAlerts() {
        try {
            const now = new Date();
            return await prisma.clinicAlert.findMany({
                where: {
                    isActive: true,
                    startDate: { lte: now },
                    endDate: { gte: now }
                },
                orderBy: { createdAt: 'desc' }
            });
        } catch (error) {
            console.error('[AlertService] Error getting active alerts:', error);
            return [];
        }
    }

    /**
     * Deactivate an alert by ID or content
     */
    static async deactivateAlert(messageSnippet: string) {
        try {
            await prisma.clinicAlert.updateMany({
                where: {
                    message: { contains: messageSnippet, mode: 'insensitive' },
                    isActive: true
                },
                data: { isActive: false }
            });
            return true;
        } catch (error) {
            console.error('[AlertService] Error deactivating alert:', error);
            return false;
        }
    }
}
