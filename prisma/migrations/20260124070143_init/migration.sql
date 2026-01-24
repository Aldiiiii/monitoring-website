-- CreateEnum
CREATE TYPE "MonitorType" AS ENUM ('HTTP', 'TCP');

-- CreateEnum
CREATE TYPE "MonitorStatus" AS ENUM ('UP', 'DOWN', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "CheckStatus" AS ENUM ('UP', 'DOWN');

-- CreateEnum
CREATE TYPE "ChannelType" AS ENUM ('TELEGRAM', 'EMAIL', 'WEBHOOK');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Monitor" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "MonitorType" NOT NULL,
    "url" TEXT,
    "host" TEXT,
    "port" INTEGER,
    "method" TEXT,
    "keyword" TEXT,
    "expectCode" INTEGER,
    "intervalSec" INTEGER NOT NULL DEFAULT 60,
    "timeoutMs" INTEGER NOT NULL DEFAULT 8000,
    "retries" INTEGER NOT NULL DEFAULT 2,
    "retryDelayMs" INTEGER NOT NULL DEFAULT 500,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastStatus" "MonitorStatus" NOT NULL DEFAULT 'UNKNOWN',
    "lastCheckedAt" TIMESTAMP(3),
    "lastLatencyMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Monitor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Check" (
    "id" TEXT NOT NULL,
    "monitorId" TEXT NOT NULL,
    "status" "CheckStatus" NOT NULL,
    "latencyMs" INTEGER,
    "statusCode" INTEGER,
    "error" TEXT,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Check_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Incident" (
    "id" TEXT NOT NULL,
    "monitorId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),
    "durationSec" INTEGER,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Incident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceWindow" (
    "id" TEXT NOT NULL,
    "monitorId" TEXT NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaintenanceWindow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationChannel" (
    "id" TEXT NOT NULL,
    "monitorId" TEXT NOT NULL,
    "type" "ChannelType" NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "telegramChatId" TEXT,
    "telegramThreadId" INTEGER,
    "telegramBotToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationChannel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_isActive_idx" ON "User"("isActive");

-- CreateIndex
CREATE INDEX "Monitor_userId_idx" ON "Monitor"("userId");

-- CreateIndex
CREATE INDEX "Monitor_isActive_idx" ON "Monitor"("isActive");

-- CreateIndex
CREATE INDEX "Monitor_type_idx" ON "Monitor"("type");

-- CreateIndex
CREATE INDEX "Check_monitorId_checkedAt_idx" ON "Check"("monitorId", "checkedAt");

-- CreateIndex
CREATE INDEX "Check_checkedAt_idx" ON "Check"("checkedAt");

-- CreateIndex
CREATE INDEX "Incident_monitorId_startedAt_idx" ON "Incident"("monitorId", "startedAt");

-- CreateIndex
CREATE INDEX "Incident_endedAt_idx" ON "Incident"("endedAt");

-- CreateIndex
CREATE INDEX "MaintenanceWindow_monitorId_startAt_endAt_idx" ON "MaintenanceWindow"("monitorId", "startAt", "endAt");

-- CreateIndex
CREATE INDEX "NotificationChannel_monitorId_idx" ON "NotificationChannel"("monitorId");

-- CreateIndex
CREATE INDEX "NotificationChannel_type_idx" ON "NotificationChannel"("type");

-- CreateIndex
CREATE INDEX "NotificationChannel_isEnabled_idx" ON "NotificationChannel"("isEnabled");

-- AddForeignKey
ALTER TABLE "Monitor" ADD CONSTRAINT "Monitor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Check" ADD CONSTRAINT "Check_monitorId_fkey" FOREIGN KEY ("monitorId") REFERENCES "Monitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_monitorId_fkey" FOREIGN KEY ("monitorId") REFERENCES "Monitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceWindow" ADD CONSTRAINT "MaintenanceWindow_monitorId_fkey" FOREIGN KEY ("monitorId") REFERENCES "Monitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationChannel" ADD CONSTRAINT "NotificationChannel_monitorId_fkey" FOREIGN KEY ("monitorId") REFERENCES "Monitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
