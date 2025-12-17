import prisma from '../../database/prisma';
import openai from '../../config/openai';

export class AnalyticsService {

    static async askManager(query: string) {
        try {
            // 1. Gather Metrics (Real-time)
            const today = new Date();
            const startOfDay = new Date(today.setHours(0, 0, 0, 0));

            const appointmentsToday = await prisma.appointment.count({
                where: { startTime: { gte: startOfDay } }
            });

            const newPatientsToday = await prisma.patient.count({
                where: { createdAt: { gte: startOfDay } }
            });

            const totalInteractions = await prisma.interaction.count({
                where: { createdAt: { gte: startOfDay } }
            });

            // We can add more complex queries here or read from Materialized Views (if created)

            const contextData = {
                date: new Date().toISOString(),
                metrics: {
                    appointmentsToday,
                    newPatientsToday,
                    totalInteractionsToday: totalInteractions
                }
            };

            // 2. LLM Call
            const systemPrompt = `
Eres el "Manager AI" de Dr. Sonrisa.
Tu trabajo es responder preguntas de negocio a los dueños de la clínica basándote en los datos.
Responde de forma ejecutiva, breve y clara.
Datos actuales: ${JSON.stringify(contextData)}
      `;

            const completion = await openai.chat.completions.create({
                model: 'gpt-4o', // Or gpt-3.5-turbo
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: query }
                ]
            });

            return completion.choices[0].message?.content;
        } catch (error) {
            console.error('Error in Manager AI:', error);
            throw new Error('Could not process analytics query');
        }
    }
}
