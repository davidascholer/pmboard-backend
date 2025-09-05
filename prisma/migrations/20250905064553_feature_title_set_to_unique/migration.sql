/*
  Warnings:

  - A unique constraint covering the columns `[title]` on the table `Feature` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."Token" ALTER COLUMN "expiresAt" SET DEFAULT (NOW() AT TIME ZONE 'UTC') + INTERVAL '5 minutes';

-- CreateIndex
CREATE UNIQUE INDEX "Feature_title_key" ON "public"."Feature"("title");
