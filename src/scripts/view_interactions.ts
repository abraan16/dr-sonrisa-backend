import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
    console.log('--- BUSCANDO ÚLTIMAS CONVERSACIONES DE DIANA ---');

    const interactions = await prisma.interaction.findMany({
        take: 15,
        orderBy: {
            createdAt: 'desc'
        },
        include: {
            patient: true
        }
    });

    if (interactions.length === 0) {
        console.log('No se encontraron interacciones en la base de datos.');
        return;
    }

    // Group by patient to make it more readable if multiple messages from same patient
    const reversed = [...interactions].reverse();

    reversed.forEach(inter => {
        const date = new Date(inter.createdAt).toLocaleString('es-DO');
        const role = inter.role === 'user' ? '👤 PACIENTE' : '🤖 DIANA';
        const patientName = inter.patient.name || inter.patient.pushName || inter.patient.phone;

        console.log(`[${date}] ${role} (${patientName}):`);
        console.log(`${inter.content}`);
        console.log('--------------------------------------------------');
    });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
