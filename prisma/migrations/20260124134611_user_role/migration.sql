-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'VIEWER');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'ADMIN';

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");
