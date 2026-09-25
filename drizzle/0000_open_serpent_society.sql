CREATE TABLE `crop` (
	`id` text PRIMARY KEY NOT NULL,
	`name_bis` text NOT NULL,
	`name_en` text NOT NULL,
	`icon` text NOT NULL,
	`shelf_life_days` integer NOT NULL,
	`default_unit` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT "crop_unit_check" CHECK("default_unit" in ('kg', 'sack', 'piece', 'bundle')),
	CONSTRAINT "crop_shelf_life_check" CHECK("shelf_life_days" > 0)
);
--> statement-breakpoint
CREATE TABLE `cycle` (
	`id` text PRIMARY KEY NOT NULL,
	`plot_id` text NOT NULL,
	`crop_id` text NOT NULL,
	`planted_on` text NOT NULL,
	`expected_harvest_on` text,
	`status` text DEFAULT 'growing' NOT NULL,
	`owner_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`plot_id`) REFERENCES `plot`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`crop_id`) REFERENCES `crop`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "cycle_status_check" CHECK("status" in ('growing', 'harvested', 'closed'))
);
--> statement-breakpoint
CREATE INDEX `cycle_plot_idx` ON `cycle` (`plot_id`);--> statement-breakpoint
CREATE INDEX `cycle_owner_status_idx` ON `cycle` (`owner_id`,`status`);--> statement-breakpoint
CREATE TABLE `expense` (
	`id` text PRIMARY KEY NOT NULL,
	`cycle_id` text NOT NULL,
	`category` text NOT NULL,
	`amount_centavos` integer NOT NULL,
	`spent_on` text NOT NULL,
	`note` text,
	`photo_uri` text,
	`owner_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`cycle_id`) REFERENCES `cycle`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "expense_category_check" CHECK("category" in ('seed', 'fertilizer', 'pesticide', 'labor', 'fuel', 'transport', 'rent', 'other')),
	CONSTRAINT "expense_amount_check" CHECK("amount_centavos" >= 0)
);
--> statement-breakpoint
CREATE INDEX `expense_cycle_idx` ON `expense` (`cycle_id`);--> statement-breakpoint
CREATE TABLE `harvest` (
	`id` text PRIMARY KEY NOT NULL,
	`cycle_id` text NOT NULL,
	`quantity_milli` integer NOT NULL,
	`unit` text NOT NULL,
	`harvested_on` text NOT NULL,
	`quality` text,
	`photo_uri` text,
	`owner_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`cycle_id`) REFERENCES `cycle`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "harvest_unit_check" CHECK("unit" in ('kg', 'sack', 'piece', 'bundle')),
	CONSTRAINT "harvest_quality_check" CHECK("quality" is null or "quality" in ('good', 'fair', 'poor')),
	CONSTRAINT "harvest_quantity_check" CHECK("quantity_milli" > 0)
);
--> statement-breakpoint
CREATE INDEX `harvest_cycle_idx` ON `harvest` (`cycle_id`);--> statement-breakpoint
CREATE TABLE `outbox` (
	`id` text PRIMARY KEY NOT NULL,
	`table_name` text NOT NULL,
	`row_id` text NOT NULL,
	`op` text NOT NULL,
	`payload` text NOT NULL,
	`created_at` integer NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`last_error` text,
	CONSTRAINT "outbox_op_check" CHECK("op" in ('insert', 'update', 'delete'))
);
--> statement-breakpoint
CREATE INDEX `outbox_created_idx` ON `outbox` (`created_at`);--> statement-breakpoint
CREATE TABLE `plot` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`area_sqm` integer,
	`photo_uri` text,
	`owner_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	CONSTRAINT "plot_area_check" CHECK("area_sqm" is null or "area_sqm" > 0)
);
--> statement-breakpoint
CREATE INDEX `plot_owner_idx` ON `plot` (`owner_id`);--> statement-breakpoint
CREATE TABLE `price_reference` (
	`id` text PRIMARY KEY NOT NULL,
	`crop_id` text NOT NULL,
	`area_code` text NOT NULL,
	`observed_on` text NOT NULL,
	`low_centavos` integer NOT NULL,
	`median_centavos` integer NOT NULL,
	`high_centavos` integer NOT NULL,
	`unit` text NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`crop_id`) REFERENCES `crop`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "price_reference_unit_check" CHECK("unit" in ('kg', 'sack', 'piece', 'bundle')),
	CONSTRAINT "price_reference_order_check" CHECK("low_centavos" <= "median_centavos" and "median_centavos" <= "high_centavos")
);
--> statement-breakpoint
CREATE INDEX `price_reference_crop_area_idx` ON `price_reference` (`crop_id`,`area_code`);--> statement-breakpoint
CREATE TABLE `sale` (
	`id` text PRIMARY KEY NOT NULL,
	`harvest_id` text NOT NULL,
	`channel` text NOT NULL,
	`buyer_name` text,
	`quantity_milli` integer NOT NULL,
	`unit_price_centavos` integer NOT NULL,
	`total_centavos` integer NOT NULL,
	`sold_on` text NOT NULL,
	`owner_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`harvest_id`) REFERENCES `harvest`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "sale_channel_check" CHECK("channel" in ('marketplace', 'middleman', 'direct')),
	CONSTRAINT "sale_quantity_check" CHECK("quantity_milli" > 0),
	CONSTRAINT "sale_amounts_check" CHECK("unit_price_centavos" >= 0 and "total_centavos" >= 0)
);
--> statement-breakpoint
CREATE INDEX `sale_harvest_idx` ON `sale` (`harvest_id`);--> statement-breakpoint
CREATE TABLE `sync_state` (
	`table_name` text PRIMARY KEY NOT NULL,
	`last_pulled_at` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE VIEW `cycle_pnl` AS 
  select
    c.id as cycle_id,
    c.owner_id as owner_id,
    coalesce(r.total, 0) as revenue_centavos,
    coalesce(x.total, 0) as expense_centavos,
    coalesce(r.total, 0) - coalesce(x.total, 0) as net_centavos
  from cycle c
  left join (
    select h.cycle_id, sum(s.total_centavos) as total
    from sale s
    join harvest h on h.id = s.harvest_id
    where s.deleted_at is null and h.deleted_at is null
    group by h.cycle_id
  ) r on r.cycle_id = c.id
  left join (
    select e.cycle_id, sum(e.amount_centavos) as total
    from expense e
    where e.deleted_at is null
    group by e.cycle_id
  ) x on x.cycle_id = c.id
;