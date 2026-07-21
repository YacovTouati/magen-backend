-- AlterTable
ALTER TABLE "User" ADD COLUMN     "passwordResetExpiresAt" TIMESTAMP(3),
ADD COLUMN     "passwordResetTokenHash" TEXT,
ADD COLUMN     "phone" TEXT;

-- CreateTable
CREATE TABLE "InvitedUser" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "invitedById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvitedUser_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InvitedUser_email_key" ON "InvitedUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "InvitedUser_tokenHash_key" ON "InvitedUser"("tokenHash");

-- CreateIndex
CREATE INDEX "InvitedUser_email_idx" ON "InvitedUser"("email");

-- CreateIndex
CREATE INDEX "InvitedUser_expiresAt_idx" ON "InvitedUser"("expiresAt");

-- AddForeignKey
ALTER TABLE "InvitedUser" ADD CONSTRAINT "InvitedUser_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
