/*
  Warnings:

  - You are about to alter the column `token` on the `Token` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(6)`.

*/
-- AlterTable
ALTER TABLE "public"."Token" ALTER COLUMN "token" SET DEFAULT FLOOR(RANDOM() * 9000) + 100000,
ALTER COLUMN "token" SET DATA TYPE VARCHAR(6),
ALTER COLUMN "expiresAt" SET DEFAULT (NOW() AT TIME ZONE 'UTC') + INTERVAL '5 minutes';
