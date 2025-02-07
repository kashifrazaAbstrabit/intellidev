-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('under_discuss', 'completed', 'suspended', 'maintenance');

-- CreateTable
CREATE TABLE "Project" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "ProjectStatus" NOT NULL DEFAULT 'under_discuss',
    "client_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssignedPeople" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "developer_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssignedPeople_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Project_status_idx" ON "Project"("status");

-- CreateIndex
CREATE UNIQUE INDEX "AssignedPeople_project_id_developer_id_key" ON "AssignedPeople"("project_id", "developer_id");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignedPeople" ADD CONSTRAINT "AssignedPeople_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignedPeople" ADD CONSTRAINT "AssignedPeople_developer_id_fkey" FOREIGN KEY ("developer_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
