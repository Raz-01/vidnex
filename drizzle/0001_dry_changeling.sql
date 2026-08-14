ALTER TYPE "public"."ledger_account_type" ADD VALUE 'void';--> statement-breakpoint
ALTER TYPE "public"."ledger_entry_type" ADD VALUE 'earn_emission' BEFORE 'support_out';--> statement-breakpoint
CREATE TABLE "access_unlocks" (
	"user_id" uuid NOT NULL,
	"video_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "access_unlocks_user_id_video_id_pk" PRIMARY KEY("user_id","video_id")
);
--> statement-breakpoint
ALTER TABLE "creators" ADD COLUMN "membership_price_tokens" integer;--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN "is_exclusive" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN "access_price_tokens" integer;--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN "boost_score" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "access_unlocks" ADD CONSTRAINT "access_unlocks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "access_unlocks" ADD CONSTRAINT "access_unlocks_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("id") ON DELETE cascade ON UPDATE no action;