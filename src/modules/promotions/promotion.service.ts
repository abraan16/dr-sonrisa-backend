import prisma from '../../database/prisma';

export interface PromotionData {
    service: string;
    description: string;
    discountText?: string;
    validFrom?: Date;
    validUntil?: Date;
}

export class PromotionService {

    /**
     * Create or update a promotion for a specific service
     */
    static async upsertPromotion(data: PromotionData) {
        try {
            // Check if there's already an active promotion for this service
            const existing = await prisma.promotion.findFirst({
                where: {
                    service: data.service,
                    isActive: true
                }
            });

            if (existing) {
                // Update existing
                return await prisma.promotion.update({
                    where: { id: existing.id },
                    data: {
                        description: data.description,
                        discountText: data.discountText,
                        validFrom: data.validFrom,
                        validUntil: data.validUntil,
                        isActive: true
                    }
                });
            } else {
                // Create new
                return await prisma.promotion.create({
                    data: {
                        service: data.service,
                        description: data.description,
                        discountText: data.discountText,
                        validFrom: data.validFrom,
                        validUntil: data.validUntil,
                        isActive: true
                    }
                });
            }
        } catch (error) {
            console.error('[PromotionService] Error upserting promotion:', error);
            throw error;
        }
    }

    /**
     * Get all active promotions
     */
    static async getActivePromotions() {
        try {
            const now = new Date();
            return await prisma.promotion.findMany({
                where: {
                    isActive: true,
                    OR: [
                        { validUntil: null },
                        { validUntil: { gte: now } }
                    ]
                },
                orderBy: { createdAt: 'desc' }
            });
        } catch (error) {
            console.error('[PromotionService] Error getting active promotions:', error);
            return [];
        }
    }

    /**
     * Deactivate a promotion by service name
     */
    static async deactivatePromotion(service: string) {
        try {
            await prisma.promotion.updateMany({
                where: {
                    service: { contains: service, mode: 'insensitive' },
                    isActive: true
                },
                data: { isActive: false }
            });
            return true;
        } catch (error) {
            console.error('[PromotionService] Error deactivating promotion:', error);
            return false;
        }
    }

    /**
     * Deactivate expired promotions (Cron job)
     */
    static async deactivateExpired() {
        try {
            const now = new Date();
            const result = await prisma.promotion.updateMany({
                where: {
                    isActive: true,
                    validUntil: { lt: now }
                },
                data: { isActive: false }
            });
            if (result.count > 0) {
                console.log(`[PromotionService] Deactivated ${result.count} expired promotions.`);
            }
        } catch (error) {
            console.error('[PromotionService] Error deactivating expired promotions:', error);
        }
    }
}
