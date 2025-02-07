/*
  Warnings:

  - You are about to drop the column `dev_team_id` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the `DevTeam` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DevTeamMember` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "DevTeamMember" DROP CONSTRAINT "DevTeamMember_dev_team_id_fkey";

-- DropForeignKey
ALTER TABLE "DevTeamMember" DROP CONSTRAINT "DevTeamMember_user_id_fkey";

-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT "Project_dev_team_id_fkey";

-- AlterTable
ALTER TABLE "Project" DROP COLUMN "dev_team_id";

-- DropTable
DROP TABLE "DevTeam";

-- DropTable
DROP TABLE "DevTeamMember";

-- CreateTable
CREATE TABLE "DevMember" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DevMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectDev" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "dev_member_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectDev_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DevMember_email_key" ON "DevMember"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectDev_project_id_dev_member_id_key" ON "ProjectDev"("project_id", "dev_member_id");

-- AddForeignKey
ALTER TABLE "DevMember" ADD CONSTRAINT "DevMember_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectDev" ADD CONSTRAINT "ProjectDev_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectDev" ADD CONSTRAINT "ProjectDev_dev_member_id_fkey" FOREIGN KEY ("dev_member_id") REFERENCES "DevMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;
