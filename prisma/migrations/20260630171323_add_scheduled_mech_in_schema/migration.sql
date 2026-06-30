-- AlterEnum
ALTER TYPE "NotificationStatus" ADD VALUE 'SCHEDULED';

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "scheduledFor" TEXT;
