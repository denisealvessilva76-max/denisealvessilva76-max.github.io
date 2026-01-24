CREATE TABLE `blood_pressure_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`date` date NOT NULL,
	`systolic` int NOT NULL,
	`diastolic` int NOT NULL,
	`notes` text,
	`classification` varchar(30),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `blood_pressure_records_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `challenge_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`challengeId` varchar(100) NOT NULL,
	`currentValue` int DEFAULT 0,
	`targetValue` int NOT NULL,
	`completed` int DEFAULT 0,
	`photoUri` text,
	`startDate` date NOT NULL,
	`endDate` date,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `challenge_progress_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `check_ins` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`date` date NOT NULL,
	`mood` varchar(20) NOT NULL,
	`symptoms` json,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `check_ins_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `complaints` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`date` date NOT NULL,
	`complaint` text NOT NULL,
	`severity` varchar(20) NOT NULL,
	`resolved` int DEFAULT 0,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `complaints_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `gamification_data` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`totalPoints` int DEFAULT 0,
	`currentStreak` int DEFAULT 0,
	`longestStreak` int DEFAULT 0,
	`lastCheckInDate` date,
	`achievements` json,
	`badges` json,
	`consistencyPoints` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `gamification_data_id` PRIMARY KEY(`id`),
	CONSTRAINT `gamification_data_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `user_hydration` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`date` date NOT NULL,
	`cupsConsumed` int DEFAULT 0,
	`totalMl` int DEFAULT 0,
	`goalMl` int NOT NULL,
	`weight` int,
	`height` int,
	`workType` varchar(20),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_hydration_id` PRIMARY KEY(`id`)
);
