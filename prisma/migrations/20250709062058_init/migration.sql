-- CreateEnum
CREATE TYPE "MemberStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'PENDING');

-- AlterTable
ALTER TABLE "ProjectMember" ADD COLUMN     "memberStatus" "MemberStatus" NOT NULL DEFAULT 'PENDING';
