-- DropIndex
DROP INDEX "public"."Project_ownerId_key";

-- AlterTable
ALTER TABLE "public"."Feature" ALTER COLUMN "description" SET DEFAULT '';

-- AlterTable
ALTER TABLE "public"."Project" ALTER COLUMN "description" SET DEFAULT '';

-- AlterTable
ALTER TABLE "public"."Ticket" ALTER COLUMN "description" SET DEFAULT '',
ALTER COLUMN "timeLog" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "public"."Token" ALTER COLUMN "expiresAt" SET DEFAULT (NOW() AT TIME ZONE 'UTC') + INTERVAL '5 minutes';
