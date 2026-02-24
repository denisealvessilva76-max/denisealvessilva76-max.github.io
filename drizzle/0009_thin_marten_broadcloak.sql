ALTER TABLE `employees` MODIFY COLUMN `cpf` varchar(11);--> statement-breakpoint
ALTER TABLE `employees` ADD `turno` enum('diurno','noturno');