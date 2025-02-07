/*
  Warnings:

  - Added the required column `start_date` to the `Project` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "start_date" TIMESTAMP(3) NOT NULL;
