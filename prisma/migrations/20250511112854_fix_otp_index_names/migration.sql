-- CreateIndex
CREATE INDEX "otp_user_code_type_idx" ON "OTP"("user_id", "code", "type");

-- CreateIndex
CREATE INDEX "otp_is_used_idx" ON "OTP"("is_used");

-- RenameIndex
ALTER INDEX "OTP_code_idx" RENAME TO "otp_code_idx";

-- RenameIndex
ALTER INDEX "OTP_expires_at_idx" RENAME TO "otp_expires_at_idx";

-- RenameIndex
ALTER INDEX "OTP_user_id_idx" RENAME TO "otp_user_id_idx";
