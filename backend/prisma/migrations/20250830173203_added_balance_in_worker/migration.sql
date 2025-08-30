/*
  Warnings:

  - You are about to drop the column `balance_Id` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `locked_amount` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `pending_amount` on the `User` table. All the data in the column will be lost.
  - Added the required column `locked_amount` to the `Worker` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pending_amount` to the `Worker` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "balance_Id",
DROP COLUMN "locked_amount",
DROP COLUMN "pending_amount";

-- AlterTable
ALTER TABLE "public"."Worker" ADD COLUMN     "locked_amount" INTEGER NOT NULL,
ADD COLUMN     "pending_amount" INTEGER NOT NULL;
