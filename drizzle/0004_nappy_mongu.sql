CREATE TABLE `hydration_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workerId` varchar(64) NOT NULL,
	`date` date NOT NULL,
	`waterIntake` int NOT NULL,
	`glassesConsumed` int NOT NULL,
	`dailyGoal` int NOT NULL,
	`weight` int,
	`height` int,
	`workType` varchar(20),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `hydration_records_id` PRIMARY KEY(`id`)
);
