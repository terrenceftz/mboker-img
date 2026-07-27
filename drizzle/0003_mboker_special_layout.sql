ALTER TABLE `albums` ADD `is_special` integer DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE `albums` ADD `special_layout_json` text DEFAULT '{"version":1,"blocks":[]}' NOT NULL;
