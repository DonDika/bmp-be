-- CreateTable
CREATE TABLE "Material_Request" (
    "id" TEXT NOT NULL,
    "no_mr" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" TEXT NOT NULL,
    "location_id" TEXT NOT NULL,

    CONSTRAINT "Material_Request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Material_Request_Item" (
    "id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "material_request_id" TEXT NOT NULL,

    CONSTRAINT "Material_Request_Item_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Material_Request_no_mr_key" ON "Material_Request"("no_mr");

-- AddForeignKey
ALTER TABLE "Material_Request" ADD CONSTRAINT "Material_Request_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Material_Request" ADD CONSTRAINT "Material_Request_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Material_Request_Item" ADD CONSTRAINT "Material_Request_Item_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Material_Request_Item" ADD CONSTRAINT "Material_Request_Item_material_request_id_fkey" FOREIGN KEY ("material_request_id") REFERENCES "Material_Request"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
