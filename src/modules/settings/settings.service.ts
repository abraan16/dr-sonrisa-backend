import prisma from '../../database/prisma';

// Default Fallback Values
const DEFAULTS: Record<string, string> = {
    prices: `**PRECIOS OFICIALES (RD$)**
- Consulta General: RD$500
- Consulta Especializada: RD$1,000
- Limpieza Profunda: RD$3,000 (Incluye: eliminación de cálculos dentales/placa bacteriana calcificada "piedras", profilaxis limpieza de placa blanda, diagnóstico, radiografía panorámica, plan de tratamiento y orientación de productos).

*Nota: El pago de la consulta es abonado a su presupuesto si se realiza el procedimiento.*`,

    hours: `**HORARIOS**
- Lunes a Viernes: 9:00 AM - 7:00 PM
- Sábados: 9:00 AM - 2:00 PM
- Domingos: CERRADO`,

    location: `**UBICACIÓN**
Residencial Castillo, Av Olímpica esq. Rafael Tavares No. 1, Santiago.

📍 Google Maps: https://maps.app.goo.gl/X29KRDA2WSQwbcDv9`,

    doctor_info: `**INFORMACIÓN DEL DOCTOR/A Y CLÍNICA**
Clínica Dental Dra. Yasmin Pacheco.
Dra. Yasmin Pacheco: Odontóloga especialista en Ortodoncia y Estética Dental.`,

    payment_methods: `**MÉTODOS DE PAGO**
- Efectivo (Pesos y Dólares)
- Transferencia Bancaria
- Aceptamos Seguros: Humano, Palic, Universal (Previa autorización).`,

    notification_time: '22:00', // Default 10 PM

    marketing_style: `**ESTILO DE COMUNICACIÓN Y PERSONALIDAD**
- Tono: Profesional pero cercano y empático.
- Estilo: Persuasivo, enfocado en beneficios.
- Emojis: Usa emojis sutiles para dar calidez (🦷, ✨, 📅).
- Trato: Usa "Usted" por defecto, pero adapta si el usuario es muy informal.`,

    review_link: 'https://g.page/r/CXcY-voC2yBCEBM/review',

    objections: `**MANEJO DE OBJECIONES Y CIERRE**
- Si dicen que es caro: Explica el valor de la consulta inicial y que se abona al tratamiento.
- Si dicen que no tienen tiempo: Menciona la rapidez de la valoración y los horarios extendidos.
- Si dudan: Menciona que la agenda se llena rápido.`,

    instructions: `**INSTRUCCIONES Y FRASES ESPECÍFICAS**
(Ninguna configurada aún)`
};

export class SettingsService {

    /**
     * Get a setting by key, or return default if missing
     */
    static async get(key: string): Promise<string> {
        try {
            // Query by key only - existing data has organizationId = null
            const setting = await prisma.systemSetting.findFirst({
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
            // Find existing setting by key only
            const existing = await prisma.systemSetting.findFirst({
                where: { key }
            });

            if (existing) {
                return await prisma.systemSetting.update({
                    where: { id: existing.id },
                    data: { value, description }
                });
            } else {
                return await prisma.systemSetting.create({
                    data: { key, value, description }
                });
            }
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
        const doctorInfo = await this.get('doctor_info');
        const paymentMethods = await this.get('payment_methods');
        const marketingStyle = await this.get('marketing_style');
        const objections = await this.get('objections');
        const instructions = await this.get('instructions');

        return `
${prices}

${hours}

${location}

${doctorInfo}

${paymentMethods}

${marketingStyle}

${objections}

${instructions}
`.trim();
    }
}
