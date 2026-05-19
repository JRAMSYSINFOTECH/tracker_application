/*
  Warnings:

  - A unique constraint covering the columns `[plan_id,task_id]` on the table `DailyPlanItem` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `confidence_score` to the `DailyPlanItem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `dailyplanitem` ADD COLUMN `confidence_score` DOUBLE NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `DailyPlanItem_plan_id_task_id_key` ON `DailyPlanItem`(`plan_id`, `task_id`);
