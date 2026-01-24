CREATE TABLE `challenge_notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int NOT NULL,
	`challengeId` varchar(100) NOT NULL,
	`notificationType` varchar(50) NOT NULL,
	`scheduledTime` timestamp NOT NULL,
	`sent` int DEFAULT 0,
	`sentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `challenge_notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `employees` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`workerId` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320),
	`department` varchar(100),
	`position` varchar(100),
	`weight` int,
	`height` int,
	`workType` varchar(20),
	`isActive` int DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `employees_id` PRIMARY KEY(`id`),
	CONSTRAINT `employees_workerId_unique` UNIQUE(`workerId`)
);
--> statement-breakpoint
CREATE TABLE `ergonomics_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int NOT NULL,
	`date` date NOT NULL,
	`pausesCompleted` int DEFAULT 0,
	`stretchesCompleted` int DEFAULT 0,
	`postureReminders` int DEFAULT 0,
	`totalPauseMinutes` int DEFAULT 0,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ergonomics_records_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mental_health_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int NOT NULL,
	`date` date NOT NULL,
	`breathingExercises` int DEFAULT 0,
	`meditationMinutes` int DEFAULT 0,
	`psychologistContacts` int DEFAULT 0,
	`moodScore` int,
	`stressLevel` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `mental_health_records_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `push_tokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int NOT NULL,
	`token` varchar(500) NOT NULL,
	`platform` varchar(20) NOT NULL,
	`isActive` int DEFAULT 1,
	`lastUsed` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `push_tokens_id` PRIMARY KEY(`id`)
);
