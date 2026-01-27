CREATE TABLE `challenge_photos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workerId` varchar(64) NOT NULL,
	`challengeId` varchar(100) NOT NULL,
	`challengeName` varchar(200) NOT NULL,
	`photoUrl` text NOT NULL,
	`category` varchar(50) NOT NULL,
	`description` text,
	`uploadedAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `challenge_photos_id` PRIMARY KEY(`id`)
);
