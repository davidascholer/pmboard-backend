-- AlterTable
ALTER TABLE "public"."Feature" ALTER COLUMN "title" SET DEFAULT 'BASE';

-- AlterTable
ALTER TABLE "public"."Token" ALTER COLUMN "expiresAt" SET DEFAULT (NOW() AT TIME ZONE 'UTC') + INTERVAL '5 minutes';
