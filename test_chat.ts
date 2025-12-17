import { InputService } from './src/modules/input/input.service';
import prisma from './src/database/prisma';

async function testConversation() {
    console.log('--- Iniciando Prueba de Conversación ---');

    // Data simulada (como si viniera de WhatsApp)
    const testData = {
        remoteJid: '5215512345678@s.whatsapp.net',
        pushName: 'Paciente Test',
        messageType: 'conversation',
        content: 'Hola, quisiera agendar una cita para mañana a las 10am'
    };

    try {
        console.log(`Mensaje entrante de: ${testData.pushName}`);
        console.log(`Contenido: "${testData.content}"`);

        // Procesar mensaje
        await InputService.processMessage(testData);

        // Esperar un poco para ver si se guardó la respuesta (la IA es async en el servicio pero esperamos la promesa)
        // En input.service.ts actual, processMessage no retorna la respuesta de la IA, solo dispara el proceso.
        // Vamos a consultar la DB para ver la respuesta.

        console.log('Waiting for AI response in DB...');
        await new Promise(r => setTimeout(r, 5000)); // Esperar 5 seg

        const patient = await prisma.patient.findFirst({
            where: { phone: '5215512345678' }
        });

        if (patient) {
            const interactions = await prisma.interaction.findMany({
                where: { patientId: patient.id },
                orderBy: { createdAt: 'desc' },
                take: 2
            });

            console.log('--- Últimas Interacciones ---');
            interactions.reverse().forEach((i: any) => {
                console.log(`[${i.role.toUpperCase()}]: ${i.content}`);
            });
        }

    } catch (error) {
        console.error('Error en la prueba:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testConversation();
