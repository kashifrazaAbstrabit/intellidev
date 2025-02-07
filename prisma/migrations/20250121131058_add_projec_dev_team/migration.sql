-- CreateTable
CREATE TABLE "DevTeam" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DevTeam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DevTeamMember" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "dev_team_id" INTEGER NOT NULL,

    CONSTRAINT "DevTeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "user_id" INTEGER NOT NULL,
    "dev_team_id" INTEGER NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DevTeam_email_key" ON "DevTeam"("email");

-- CreateIndex
CREATE UNIQUE INDEX "DevTeamMember_user_id_dev_team_id_key" ON "DevTeamMember"("user_id", "dev_team_id");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "User"("status");

-- AddForeignKey
ALTER TABLE "DevTeamMember" ADD CONSTRAINT "DevTeamMember_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DevTeamMember" ADD CONSTRAINT "DevTeamMember_dev_team_id_fkey" FOREIGN KEY ("dev_team_id") REFERENCES "DevTeam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_dev_team_id_fkey" FOREIGN KEY ("dev_team_id") REFERENCES "DevTeam"("id") ON DELETE CASCADE ON UPDATE CASCADE;
