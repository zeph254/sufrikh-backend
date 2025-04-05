-- AlterTable
ALTER TABLE "User" ADD COLUMN     "invited_by_id" INTEGER,
ADD COLUMN     "is_super_admin" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "last_password_change" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "AdminAuditLog" (
    "id" SERIAL NOT NULL,
    "action" TEXT NOT NULL,
    "adminId" INTEGER NOT NULL,
    "targetId" INTEGER NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "User_invited_by_id_idx" ON "User"("invited_by_id");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_invited_by_id_fkey" FOREIGN KEY ("invited_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminAuditLog" ADD CONSTRAINT "AdminAuditLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminAuditLog" ADD CONSTRAINT "AdminAuditLog_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
