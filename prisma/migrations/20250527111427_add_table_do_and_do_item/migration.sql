-- CreateTable
CREATE TABLE "Delivery_Order" (
    "id" TEXT NOT NULL,
    "no_do" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "material_request_id" TEXT NOT NULL,

    CONSTRAINT "Delivery_Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Delivery_Order_Item" (
    "id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "delivery_order_id" TEXT NOT NULL,
    "material_request_item_id" TEXT NOT NULL,

    CONSTRAINT "Delivery_Order_Item_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Delivery_Order_no_do_key" ON "Delivery_Order"("no_do");

-- CreateIndex
CREATE UNIQUE INDEX "Delivery_Order_material_request_id_key" ON "Delivery_Order"("material_request_id");

-- AddForeignKey
ALTER TABLE "Delivery_Order" ADD CONSTRAINT "Delivery_Order_material_request_id_fkey" FOREIGN KEY ("material_request_id") REFERENCES "Material_Request"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Delivery_Order_Item" ADD CONSTRAINT "Delivery_Order_Item_delivery_order_id_fkey" FOREIGN KEY ("delivery_order_id") REFERENCES "Delivery_Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Delivery_Order_Item" ADD CONSTRAINT "Delivery_Order_Item_material_request_item_id_fkey" FOREIGN KEY ("material_request_item_id") REFERENCES "Material_Request_Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
