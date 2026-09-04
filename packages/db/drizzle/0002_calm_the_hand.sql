CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"chat_id" bigint NOT NULL,
	"message" text NOT NULL,
	"parse_mode" text DEFAULT 'HTML',
	"sent" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
