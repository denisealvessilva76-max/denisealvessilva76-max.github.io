ALTER TABLE `employees` ADD `cpf` varchar(11) NOT NULL;--> statement-breakpoint
ALTER TABLE `employees` ADD `matricula` varchar(20) NOT NULL;--> statement-breakpoint
ALTER TABLE `employees` ADD `lastLogin` timestamp;--> statement-breakpoint
ALTER TABLE `employees` ADD CONSTRAINT `employees_cpf_unique` UNIQUE(`cpf`);--> statement-breakpoint
ALTER TABLE `employees` ADD CONSTRAINT `employees_matricula_unique` UNIQUE(`matricula`);