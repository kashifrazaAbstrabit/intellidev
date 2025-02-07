-- CreateEnum
CREATE TYPE "Provider" AS ENUM ('google', 'github');

-- CreateTable
CREATE TABLE "UserOAuth" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "provider" "Provider" NOT NULL,
    "provider_user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserOAuth_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserOAuth_user_id_provider_key" ON "UserOAuth"("user_id", "provider");

-- AddForeignKey
ALTER TABLE "UserOAuth" ADD CONSTRAINT "UserOAuth_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
