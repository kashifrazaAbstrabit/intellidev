-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('client', 'developer');

-- CreateEnum
CREATE TYPE "AuthType" AS ENUM ('email', 'google', 'github');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "country" TEXT,
    "reset_password_token" TEXT,
    "reset_password_token_expires" TIMESTAMP(3),
    "refreshtoken" TEXT,
    "verification_token" TEXT,
    "verification_token_expiry" TIMESTAMP(3),
    "user_type" "UserType" NOT NULL DEFAULT 'client',
    "auth_type" "AuthType" NOT NULL DEFAULT 'email',
    "last_login_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
