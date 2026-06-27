/*
  Warnings:

  - Added the required column `from_email` to the `Tenant` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "subject" TEXT;

-- AlterTable
ALTER TABLE "Template" ADD COLUMN     "subject" TEXT;

-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "from_email" TEXT NOT NULL;
