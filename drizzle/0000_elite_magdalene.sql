CREATE TABLE `cards` (
	`id` text PRIMARY KEY NOT NULL,
	`full_name` text NOT NULL,
	`employee_id` text NOT NULL,
	`department` text NOT NULL,
	`role_title` text NOT NULL,
	`email` text NOT NULL,
	`phone` text NOT NULL,
	`blood_group` text,
	`issue_date` text NOT NULL,
	`expiry_date` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`accent_color` text DEFAULT '#0f766e' NOT NULL,
	`photo_key` text,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_cards_status` ON `cards` (`status`);--> statement-breakpoint
CREATE INDEX `idx_cards_department` ON `cards` (`department`);--> statement-breakpoint
CREATE INDEX `idx_cards_created_at` ON `cards` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_cards_employee_id` ON `cards` (`employee_id`);