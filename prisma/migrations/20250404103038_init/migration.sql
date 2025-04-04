-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "phone" VARCHAR(20),
    "password" VARCHAR(100) NOT NULL,
    "gender" VARCHAR(10),
    "id_type" VARCHAR(20),
    "id_number" VARCHAR(50),
    "prayer_in_room" BOOLEAN NOT NULL DEFAULT false,
    "no_alcohol" BOOLEAN NOT NULL DEFAULT true,
    "zabihah_only" BOOLEAN NOT NULL DEFAULT true,
    "special_requests" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_id_number_idx" ON "User"("id_number");
