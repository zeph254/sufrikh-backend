/*
  Warnings:

  - Added the required column `updated_at` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CUSTOMER', 'WORKER', 'ADMIN');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "department" VARCHAR(50),
ADD COLUMN     "is_verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "position" VARCHAR(50),
ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'CUSTOMER',
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");
