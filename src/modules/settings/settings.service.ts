import prisma from '../../database/prisma';

// Default Fallback Values
const DEFAULTS: Record<string, string> = {
    prices: `**PRECIOS OFICIALES (Pesos Dominicanos - RD$)**
- Consulta/Valoración: RD$500 (¡Incluye Rx y Diagnóstico!)
- Limpieza dental: RD$1,000 (Gratis con tratamiento)
- Blanqueamiento: RD$2,500
- Endodoncia: RD$3,500
- Ortodoncia (Brackets): Inicial desde RD$15,000
- Implantes: Desde RD$18,000`,

    hours: `**HORARIOS**
- Lunes a Viernes: 9:00 AM - 7:00 PM
- Sábados: 9:00 AM - 2:00 PM
- Domingos: CERRADO`,

    location: `**UBICACIÓN**
Residencial Castillo, Av Olímpica esq. Rafael Tavares No. 1, Santiago.`
};

export class SettingsService {

    /**
     * Get a setting by key, or return default if missing
     */
    static async get(key: string): Promise<string> {
        try {
            const setting = await prisma.systemSetting.findUnique({
                where: { key }
            });
            return setting?.value || DEFAULTS[key] || '';
        } catch (error) {
            console.error(`[Settings] Error fetching ${key}:`, error);
            return DEFAULTS[key] || '';
        }
    }

    /**
     * Update or create a setting
     */
    static async set(key: string, value: string, description?: string) {
        try {
            return await prisma.systemSetting.upsert({
                where: { key },
                update: { value, description },
                create: { key, value, description }
            });
        } catch (error) {
            console.error(`[Settings] Error setting ${key}:`, error);
            throw error;
        }
    }

    /**
     * Get all active settings prompts combined
     */
    static async getFullSystemPromptSnippet(): Promise<string> {
        const prices = await this.get('prices');
        const hours = await this.get('hours');
        const location = await this.get('location');

        return `
${prices}

${hours}

${location}
`.trim();
    }
}
