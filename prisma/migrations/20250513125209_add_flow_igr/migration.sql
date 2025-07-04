-- CreateTable
CREATE TABLE "Incoming_Good_Receipt" (
    "id" TEXT NOT NULL,
    "no_igr" TEXT NOT NULL,
    "received_date" TIMESTAMP(3) NOT NULL,
    "remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "purchase_order_id" TEXT NOT NULL,

    CONSTRAINT "Incoming_Good_Receipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Incoming_Good_Receipt_Item" (
    "id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "igr_id" TEXT NOT NULL,
    "purchase_order_item_id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "shelf_id" TEXT NOT NULL,

    CONSTRAINT "Incoming_Good_Receipt_Item_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Incoming_Good_Receipt_no_igr_key" ON "Incoming_Good_Receipt"("no_igr");

-- CreateIndex
CREATE UNIQUE INDEX "Incoming_Good_Receipt_purchase_order_id_key" ON "Incoming_Good_Receipt"("purchase_order_id");

-- CreateIndex
CREATE UNIQUE INDEX "Incoming_Good_Receipt_Item_purchase_order_item_id_key" ON "Incoming_Good_Receipt_Item"("purchase_order_item_id");

-- AddForeignKey
ALTER TABLE "Incoming_Good_Receipt" ADD CONSTRAINT "Incoming_Good_Receipt_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "Purchase_Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incoming_Good_Receipt_Item" ADD CONSTRAINT "Incoming_Good_Receipt_Item_igr_id_fkey" FOREIGN KEY ("igr_id") REFERENCES "Incoming_Good_Receipt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incoming_Good_Receipt_Item" ADD CONSTRAINT "Incoming_Good_Receipt_Item_purchase_order_item_id_fkey" FOREIGN KEY ("purchase_order_item_id") REFERENCES "Purchase_Order_Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incoming_Good_Receipt_Item" ADD CONSTRAINT "Incoming_Good_Receipt_Item_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incoming_Good_Receipt_Item" ADD CONSTRAINT "Incoming_Good_Receipt_Item_shelf_id_fkey" FOREIGN KEY ("shelf_id") REFERENCES "Shelf"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
