CREATE TABLE `admin_users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`username` varchar(100) NOT NULL,
	`passwordHash` varchar(255) NOT NULL,
	`email` varchar(320),
	`role` varchar(50) NOT NULL DEFAULT 'sesmt',
	`isActive` int DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `admin_users_id` PRIMARY KEY(`id`),
	CONSTRAINT `admin_users_username_unique` UNIQUE(`username`)
);
--> statement-breakpoint
CREATE TABLE `health_referrals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workerId` varchar(64) NOT NULL,
	`complaintType` varchar(50) NOT NULL,
	`description` text NOT NULL,
	`severity` varchar(20) NOT NULL,
	`status` varchar(20) NOT NULL DEFAULT 'pendente',
	`referredTo` varchar(100),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `health_referrals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `hydration_tracking` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workerId` varchar(64) NOT NULL,
	`date` date NOT NULL,
	`waterIntake` int DEFAULT 0,
	`glassesConsumed` int DEFAULT 0,
	`lastReminderTime` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `hydration_tracking_id` PRIMARY KEY(`id`)
);
