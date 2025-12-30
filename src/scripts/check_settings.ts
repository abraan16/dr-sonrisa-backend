import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
    console.log('--- BUSCANDO CONFIGURACIÓN DE UBICACIÓN ---');

    const setting = await prisma.systemSetting.findFirst({
        where: { key: 'location' }
    });

    if (!setting) {
        console.log('No se encontró configuración de ubicación en la BD. Usando DEFAULTS.');
        return;
    }

    console.log('VALOR EN BD:');
    console.log(setting.value);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
