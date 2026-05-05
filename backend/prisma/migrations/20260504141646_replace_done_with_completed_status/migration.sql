/*
  Warnings:

  - The values [done] on the enum `DailyPlanItem_item_status` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `dailyplanitem` MODIFY `item_status` ENUM('scheduled', 'completed', 'skipped', 'moved') NOT NULL DEFAULT 'scheduled';
