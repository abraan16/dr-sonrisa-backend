import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database with initial organization...');

    // Create the first organization for the existing clinic
    const org = await prisma.organization.upsert({
        where: { slug: 'dra-yasmin-pacheco' },
        update: {},
        create: {
            name: 'Clínica Dental Dra. Yasmin Pacheco',
            slug: 'dra-yasmin-pacheco',
            plan: 'enterprise', // Give them enterprise for being the first!
            status: 'active',
            maxConversations: 999999,
            maxUsers: 10
        }
    });

    console.log(`✅ Organization created: ${org.name} (${org.id})`);

    // Map the existing Evolution instance to this organization
    const instanceName = process.env.EVOLUTION_INSTANCE_NAME || 'dr-sonrisa';

    const instance = await prisma.whatsappInstance.upsert({
        where: { instanceName },
        update: {},
        create: {
            organizationId: org.id,
            instanceName,
            isActive: true
        }
    });

    console.log(`✅ WhatsApp instance mapped: ${instance.instanceName}`);

    // OPTIONAL: Migrate existing data to this organization
    // This is safe because organizationId is optional
    const updatePatients = await prisma.patient.updateMany({
        where: { organizationId: null },
        data: { organizationId: org.id }
    });

    const updateAppointments = await prisma.appointment.updateMany({
        where: { organizationId: null },
        data: { organizationId: org.id }
    });

    const updateInteractions = await prisma.interaction.updateMany({
        where: { organizationId: null },
        data: { organizationId: org.id }
    });

    const updatePromotions = await prisma.promotion.updateMany({
        where: { organizationId: null },
        data: { organizationId: org.id }
    });

    const updateAlerts = await prisma.clinicAlert.updateMany({
        where: { organizationId: null },
        data: { organizationId: org.id }
    });

    const updateSettings = await prisma.systemSetting.updateMany({
        where: { organizationId: null },
        data: { organizationId: org.id }
    });

    console.log(`✅ Migrated existing data:`);
    console.log(`   - ${updatePatients.count} patients`);
    console.log(`   - ${updateAppointments.count} appointments`);
    console.log(`   - ${updateInteractions.count} interactions`);
    console.log(`   - ${updatePromotions.count} promotions`);
    console.log(`   - ${updateAlerts.count} alerts`);
    console.log(`   - ${updateSettings.count} settings`);

    console.log('\n🎉 Seed completed successfully!');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
