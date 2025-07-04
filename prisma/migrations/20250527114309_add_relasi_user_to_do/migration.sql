-- CreateTable
CREATE TABLE "_DeliveryOrderApprovals" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_DeliveryOrderApprovals_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_DeliveryOrderApprovals_B_index" ON "_DeliveryOrderApprovals"("B");

-- AddForeignKey
ALTER TABLE "_DeliveryOrderApprovals" ADD CONSTRAINT "_DeliveryOrderApprovals_A_fkey" FOREIGN KEY ("A") REFERENCES "Delivery_Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DeliveryOrderApprovals" ADD CONSTRAINT "_DeliveryOrderApprovals_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
