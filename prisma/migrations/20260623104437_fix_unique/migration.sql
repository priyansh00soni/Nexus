/*
  Warnings:

  - A unique constraint covering the columns `[key_hash]` on the table `ApiKey` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_key_hash_key" ON "ApiKey"("key_hash");
