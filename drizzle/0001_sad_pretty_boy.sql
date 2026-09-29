CREATE TABLE `chat_message` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`role` text NOT NULL,
	`text` text NOT NULL,
	`status` text NOT NULL,
	`created_at` integer NOT NULL,
	CONSTRAINT "chat_message_role_check" CHECK("role" in ('farmer', 'assistant')),
	CONSTRAINT "chat_message_status_check" CHECK("status" in ('pending', 'answered', 'note'))
);
--> statement-breakpoint
CREATE INDEX `chat_message_owner_idx` ON `chat_message` (`owner_id`,`created_at`);