CREATE TABLE `report_overrides` (
	`report_id` text PRIMARY KEY NOT NULL,
	`status` text,
	`deleted` integer DEFAULT 0 NOT NULL
);
