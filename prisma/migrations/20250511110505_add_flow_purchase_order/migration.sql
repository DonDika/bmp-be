-- AlterTable
ALTER TABLE "Material_Request" ADD COLUMN     "purchase_order_id" TEXT;

-- CreateTable
CREATE TABLE "Purchase_Order" (
    "id" TEXT NOT NULL,
    "no_po" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" TEXT NOT NULL,

    CONSTRAINT "Purchase_Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Purchase_Order_Item" (
    "id" TEXT NOT NULL,
    "supplier" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "purchase_order_id" TEXT NOT NULL,
    "material_request_item_id" TEXT NOT NULL,

    CONSTRAINT "Purchase_Order_Item_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Purchase_Order_no_po_key" ON "Purchase_Order"("no_po");

-- CreateIndex
CREATE UNIQUE INDEX "Purchase_Order_Item_purchase_order_id_material_request_item_key" ON "Purchase_Order_Item"("purchase_order_id", "material_request_item_id");

-- AddForeignKey
ALTER TABLE "Material_Request" ADD CONSTRAINT "Material_Request_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "Purchase_Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purchase_Order" ADD CONSTRAINT "Purchase_Order_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purchase_Order_Item" ADD CONSTRAINT "Purchase_Order_Item_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "Purchase_Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purchase_Order_Item" ADD CONSTRAINT "Purchase_Order_Item_material_request_item_id_fkey" FOREIGN KEY ("material_request_item_id") REFERENCES "Material_Request_Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
