/*
  Warnings:

  - You are about to drop the `DevMember` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "DevMember" DROP CONSTRAINT "DevMember_user_id_fkey";

-- DropTable
DROP TABLE "DevMember";

-- CreateTable
CREATE TABLE "InviteUser" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InviteUser_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InviteUser_email_key" ON "InviteUser"("email");

-- AddForeignKey
ALTER TABLE "InviteUser" ADD CONSTRAINT "InviteUser_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
