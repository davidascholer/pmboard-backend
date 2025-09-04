-- CreateEnum
CREATE TYPE "public"."Section" AS ENUM ('ACTIVE', 'ARCHIVED', 'BACKLOG');

-- CreateEnum
CREATE TYPE "public"."Status" AS ENUM ('UNASSIGNED', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED');

-- CreateEnum
CREATE TYPE "public"."ProjectType" AS ENUM ('WATERFALL', 'KANBAN', 'SCRUM');

-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('OWNER', 'ADMIN', 'MEMBER', 'TESTER', 'GUEST');

-- CreateEnum
CREATE TYPE "public"."Permissions" AS ENUM ('UPDATE_PROJECT', 'ADD_MEMBERS', 'UPDATE_MEMBERS', 'REMOVE_MEMBERS', 'CREATE_FEATURE', 'UPDATE_FEATURE', 'DELETE_FEATURE', 'CREATE_TICKET', 'UPDATE_TICKET', 'DELETE_TICKET', 'ASSIGN_TICKET_SELF', 'ASSIGN_TICKET_ALL', 'UNASSIGN_TICKET_SELF', 'UNASSIGN_TICKET_ALL', 'MOVE_TICKET_SECTION', 'CHANGE_TICKET_STATUS', 'CHANGE_TICKET_PRIORITY');

-- CreateEnum
CREATE TYPE "public"."Priority" AS ENUM ('NONE', 'LOW', 'MODERATE', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "public"."MemberStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'PENDING');

-- CreateTable
CREATE TABLE "public"."Test" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,

    CONSTRAINT "Test_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "settings" JSON NOT NULL DEFAULT '{"background": "default"}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Project" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ownerId" TEXT NOT NULL,
    "description" TEXT,
    "projectType" "public"."ProjectType" NOT NULL DEFAULT 'KANBAN',

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Feature" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "projectId" TEXT NOT NULL,

    CONSTRAINT "Feature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Ticket" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "section" "public"."Section" NOT NULL DEFAULT 'ACTIVE',
    "status" "public"."Status" NOT NULL DEFAULT 'UNASSIGNED',
    "priority" "public"."Priority" NOT NULL DEFAULT 'NONE',
    "timeLog" INTEGER,
    "featureId" INTEGER,

    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProjectMember" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "public"."Role" NOT NULL DEFAULT 'MEMBER',
    "memberStatus" "public"."MemberStatus" NOT NULL DEFAULT 'PENDING',
    "projectId" TEXT NOT NULL,

    CONSTRAINT "ProjectMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."_ProjectMemberToTicket" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ProjectMemberToTicket_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Project_ownerId_key" ON "public"."Project"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "Feature_projectId_key" ON "public"."Feature"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "Ticket_featureId_key" ON "public"."Ticket"("featureId");

-- CreateIndex
CREATE INDEX "_ProjectMemberToTicket_B_index" ON "public"."_ProjectMemberToTicket"("B");

-- AddForeignKey
ALTER TABLE "public"."Project" ADD CONSTRAINT "Project_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Feature" ADD CONSTRAINT "Feature_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Ticket" ADD CONSTRAINT "Ticket_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES "public"."Feature"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProjectMember" ADD CONSTRAINT "ProjectMember_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProjectMember" ADD CONSTRAINT "ProjectMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_ProjectMemberToTicket" ADD CONSTRAINT "_ProjectMemberToTicket_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."ProjectMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_ProjectMemberToTicket" ADD CONSTRAINT "_ProjectMemberToTicket_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
