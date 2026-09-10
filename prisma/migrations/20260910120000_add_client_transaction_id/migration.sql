-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "clientTransactionId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_clientTransactionId_key" ON "Transaction"("clientTransactionId");
