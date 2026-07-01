/*
  Warnings:

  - The `scheduledFor` column on the `Notification` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "ApiKey" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ;

-- AlterTable
ALTER TABLE "DeliveryAttempt" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ;

-- AlterTable
ALTER TABLE "IdempotencyRecord" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ;

-- AlterTable
ALTER TABLE "Notification" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ,
DROP COLUMN "scheduledFor",
ADD COLUMN     "scheduledFor" TIMESTAMPTZ;

-- AlterTable
ALTER TABLE "Template" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ;

-- AlterTable
ALTER TABLE "Tenant" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ;
