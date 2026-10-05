ALTER TABLE "tasks" ADD COLUMN "planned_start" date;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "planned_end" date;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "actual_start" date;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "actual_end" date;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "assignee" text;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "status" text DEFAULT 'todo' NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "estimate_hours" double precision;