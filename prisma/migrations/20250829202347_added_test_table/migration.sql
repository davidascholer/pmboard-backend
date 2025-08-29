/*
  Warnings:

  - You are about to drop the column `severity` on the `Ticket` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Ticket" DROP COLUMN "severity",
ADD COLUMN     "priority" "public"."Priority" NOT NULL DEFAULT 'LOW';

-- CreateTable
CREATE TABLE "public"."Test" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,

    CONSTRAINT "Test_pkey" PRIMARY KEY ("id")
);
