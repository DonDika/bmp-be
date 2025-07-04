/*
  Warnings:

  - A unique constraint covering the columns `[location,position]` on the table `Shelf` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Shelf_location_position_key" ON "Shelf"("location", "position");
