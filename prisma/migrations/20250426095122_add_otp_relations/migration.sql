/*
  Warnings:

  - A unique constraint covering the columns `[resetPasswordToken]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "carrier" VARCHAR(20);

-- CreateTable
CREATE TABLE "OTP" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "is_used" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OTP_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FailedOtpAttempt" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "attempted_code" TEXT NOT NULL,
    "attempt_type" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FailedOtpAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OTP_user_id_idx" ON "OTP"("user_id");

-- CreateIndex
CREATE INDEX "OTP_code_idx" ON "OTP"("code");

-- CreateIndex
CREATE INDEX "OTP_expires_at_idx" ON "OTP"("expires_at");

-- CreateIndex
CREATE INDEX "FailedOtpAttempt_user_id_idx" ON "FailedOtpAttempt"("user_id");

-- CreateIndex
CREATE INDEX "FailedOtpAttempt_created_at_idx" ON "FailedOtpAttempt"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "User_resetPasswordToken_key" ON "User"("resetPasswordToken");

-- AddForeignKey
ALTER TABLE "OTP" ADD CONSTRAINT "OTP_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FailedOtpAttempt" ADD CONSTRAINT "FailedOtpAttempt_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
