CREATE TABLE `admin_notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` varchar(64) NOT NULL,
	`type` varchar(50) NOT NULL,
	`severity` varchar(20) NOT NULL DEFAULT 'normal',
	`message` text NOT NULL,
	`data` json,
	`isRead` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `admin_notifications_id` PRIMARY KEY(`id`)
);
