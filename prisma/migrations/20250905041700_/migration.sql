/*
  Warnings:

  - The values [TESTER,GUEST] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "public"."ProjectStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- AlterEnum
BEGIN;
CREATE TYPE "public"."Role_new" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');
ALTER TABLE "public"."ProjectMember" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "public"."ProjectMember" ALTER COLUMN "role" TYPE "public"."Role_new" USING ("role"::text::"public"."Role_new");
ALTER TYPE "public"."Role" RENAME TO "Role_old";
ALTER TYPE "public"."Role_new" RENAME TO "Role";
DROP TYPE "public"."Role_old";
ALTER TABLE "public"."ProjectMember" ALTER COLUMN "role" SET DEFAULT 'MEMBER';
COMMIT;

-- AlterTable
ALTER TABLE "public"."Project" ADD COLUMN     "status" "public"."ProjectStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "public"."Token" ALTER COLUMN "expiresAt" SET DEFAULT (NOW() AT TIME ZONE 'UTC') + INTERVAL '5 minutes';
