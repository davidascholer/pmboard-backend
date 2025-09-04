-- CreateEnum
CREATE TYPE "public"."MembershipStatus" AS ENUM ('FREE', 'STARTUP', 'TEAM', 'ENTERPRISE');

-- AlterTable
ALTER TABLE "public"."Token" ALTER COLUMN "expiresAt" SET DEFAULT (NOW() AT TIME ZONE 'UTC') + INTERVAL '5 minutes';

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "membership" "public"."MembershipStatus" NOT NULL DEFAULT 'FREE';
