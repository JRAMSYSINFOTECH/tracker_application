-- AlterTable
ALTER TABLE `dailyplan` ADD COLUMN `status` ENUM('generated', 'stale') NOT NULL DEFAULT 'generated';
