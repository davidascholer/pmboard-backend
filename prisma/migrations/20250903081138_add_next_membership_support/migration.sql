-- AlterTable
ALTER TABLE "public"."Token" ALTER COLUMN "expiresAt" SET DEFAULT (NOW() AT TIME ZONE 'UTC') + INTERVAL '5 minutes';

-- CreateTable
CREATE TABLE "public"."NextMembership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "public"."MembershipStatus" NOT NULL DEFAULT 'FREE',
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NextMembership_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NextMembership_userId_key" ON "public"."NextMembership"("userId");

-- AddForeignKey
ALTER TABLE "public"."NextMembership" ADD CONSTRAINT "NextMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
