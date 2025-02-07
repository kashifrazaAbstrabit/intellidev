/*
  Warnings:

  - A unique constraint covering the columns `[invitation_token]` on the table `InviteUser` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "InviteUser" ADD COLUMN     "invitation_expiry" TIMESTAMP(3),
ADD COLUMN     "invitation_token" TEXT;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "status" SET DEFAULT 'inactive';

-- CreateIndex
CREATE UNIQUE INDEX "InviteUser_invitation_token_key" ON "InviteUser"("invitation_token");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");
