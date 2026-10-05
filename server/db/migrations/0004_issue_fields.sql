ALTER TABLE "issues" ADD COLUMN "assignee" text;--> statement-breakpoint
ALTER TABLE "issues" ADD COLUMN "priority" text DEFAULT 'medium' NOT NULL;--> statement-breakpoint
ALTER TABLE "issues" ADD COLUMN "due_date" date;