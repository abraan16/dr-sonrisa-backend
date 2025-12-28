-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'free',
    "status" TEXT NOT NULL DEFAULT 'active',
    "maxConversations" INTEGER NOT NULL DEFAULT 100,
    "maxUsers" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whatsapp_instances" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "instanceName" TEXT NOT NULL,
    "apiKey" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "whatsapp_instances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_users" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organization_users_pkey" PRIMARY KEY ("id")
);

-- AlterTable: Add optional organizationId to existing tables
ALTER TABLE "patients" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "interactions" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "appointments" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "promotions" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "clinic_alerts" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "system_settings" ADD COLUMN "organizationId" TEXT;

-- Drop old unique constraint on system_settings.key
ALTER TABLE "system_settings" DROP CONSTRAINT "system_settings_key_key";

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");
CREATE UNIQUE INDEX "whatsapp_instances_instanceName_key" ON "whatsapp_instances"("instanceName");
CREATE UNIQUE INDEX "organization_users_organizationId_email_key" ON "organization_users"("organizationId", "email");
CREATE UNIQUE INDEX "system_settings_key_organizationId_key" ON "system_settings"("key", "organizationId");

-- CreateIndex (for performance)
CREATE INDEX "patients_organizationId_idx" ON "patients"("organizationId");
CREATE INDEX "interactions_organizationId_idx" ON "interactions"("organizationId");
CREATE INDEX "appointments_organizationId_idx" ON "appointments"("organizationId");
CREATE INDEX "promotions_organizationId_idx" ON "promotions"("organizationId");
CREATE INDEX "clinic_alerts_organizationId_idx" ON "clinic_alerts"("organizationId");
CREATE INDEX "system_settings_organizationId_idx" ON "system_settings"("organizationId");
CREATE INDEX "whatsapp_instances_organizationId_idx" ON "whatsapp_instances"("organizationId");
CREATE INDEX "organization_users_organizationId_idx" ON "organization_users"("organizationId");

-- AddForeignKey
ALTER TABLE "patients" ADD CONSTRAINT "patients_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "interactions" ADD CONSTRAINT "interactions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "promotions" ADD CONSTRAINT "promotions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "clinic_alerts" ADD CONSTRAINT "clinic_alerts_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "system_settings" ADD CONSTRAINT "system_settings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "whatsapp_instances" ADD CONSTRAINT "whatsapp_instances_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "organization_users" ADD CONSTRAINT "organization_users_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
