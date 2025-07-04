-- CreateTable
CREATE TABLE "_PurchaseOrderApprovals" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_PurchaseOrderApprovals_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_PurchaseOrderApprovals_B_index" ON "_PurchaseOrderApprovals"("B");

-- AddForeignKey
ALTER TABLE "_PurchaseOrderApprovals" ADD CONSTRAINT "_PurchaseOrderApprovals_A_fkey" FOREIGN KEY ("A") REFERENCES "Purchase_Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PurchaseOrderApprovals" ADD CONSTRAINT "_PurchaseOrderApprovals_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
