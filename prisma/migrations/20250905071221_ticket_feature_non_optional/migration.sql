/*
  Warnings:

  - Made the column `featureId` on table `Ticket` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."Ticket" DROP CONSTRAINT "Ticket_featureId_fkey";

-- DropIndex
DROP INDEX "public"."Feature_projectId_key";

-- DropIndex
DROP INDEX "public"."Feature_title_key";

-- AlterTable
ALTER TABLE "public"."Ticket" ALTER COLUMN "featureId" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."Token" ALTER COLUMN "expiresAt" SET DEFAULT (NOW() AT TIME ZONE 'UTC') + INTERVAL '5 minutes';

-- AddForeignKey
ALTER TABLE "public"."Ticket" ADD CONSTRAINT "Ticket_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES "public"."Feature"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
