/*
  Warnings:

  - Added the required column `status` to the `Incoming_Good_Receipt` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Incoming_Good_Receipt" ADD COLUMN     "status" TEXT NOT NULL;
