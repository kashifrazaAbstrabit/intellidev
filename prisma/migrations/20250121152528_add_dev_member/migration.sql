/*
  Warnings:

  - You are about to drop the `Project` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProjectDev` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT "Project_user_id_fkey";

-- DropForeignKey
ALTER TABLE "ProjectDev" DROP CONSTRAINT "ProjectDev_dev_member_id_fkey";

-- DropForeignKey
ALTER TABLE "ProjectDev" DROP CONSTRAINT "ProjectDev_project_id_fkey";

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "first_name" DROP NOT NULL;

-- DropTable
DROP TABLE "Project";

-- DropTable
DROP TABLE "ProjectDev";
