CREATE TABLE `aggregated_health_data` (
	`id` int AUTO_INCREMENT NOT NULL,
	`date` date NOT NULL,
	`totalWorkers` int NOT NULL,
	`totalCheckIns` int NOT NULL,
	`checkInBem` int DEFAULT 0,
	`checkInDorLeve` int DEFAULT 0,
	`checkInDorForte` int DEFAULT 0,
	`avgPressureSystolic` decimal(5,2) DEFAULT '0',
	`avgPressureDiastolic` decimal(5,2) DEFAULT '0',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `aggregated_health_data_id` PRIMARY KEY(`id`),
	CONSTRAINT `aggregated_health_data_date_unique` UNIQUE(`date`)
);
--> statement-breakpoint
CREATE TABLE `health_data_sync` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workerId` varchar(64) NOT NULL,
	`timestamp` timestamp NOT NULL,
	`checkInStatus` varchar(20),
	`checkInDate` date,
	`pressureSystolic` int,
	`pressureDiastolic` int,
	`pressureDate` date,
	`symptoms` json,
	`symptomsDate` date,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `health_data_sync_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `monthly_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`month` int NOT NULL,
	`year` int NOT NULL,
	`startDate` date NOT NULL,
	`endDate` date NOT NULL,
	`totalWorkers` int NOT NULL,
	`totalCheckIns` int NOT NULL,
	`avgEngagement` decimal(5,2) DEFAULT '0',
	`avgPressureSystolic` decimal(5,2) DEFAULT '0',
	`avgPressureDiastolic` decimal(5,2) DEFAULT '0',
	`recommendations` json,
	`data` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `monthly_reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `weekly_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`week` int NOT NULL,
	`year` int NOT NULL,
	`startDate` date NOT NULL,
	`endDate` date NOT NULL,
	`totalWorkers` int NOT NULL,
	`totalCheckIns` int NOT NULL,
	`avgEngagement` decimal(5,2) DEFAULT '0',
	`avgPressureSystolic` decimal(5,2) DEFAULT '0',
	`avgPressureDiastolic` decimal(5,2) DEFAULT '0',
	`data` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `weekly_reports_id` PRIMARY KEY(`id`)
);
