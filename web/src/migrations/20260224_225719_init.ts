import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_users_category" AS ENUM('leadership', 'specialist', 'collaborator');
  CREATE TYPE "public"."enum_users_education_status" AS ENUM('graduated', 'studying', 'titled', 'bachelor', 'masters', 'doctorate');
  CREATE TYPE "public"."enum_users_role" AS ENUM('admin', 'editor', 'author', 'viewer');
  CREATE TYPE "public"."enum_posts_status" AS ENUM('draft', 'published', 'archived');
  CREATE TYPE "public"."enum_services_category" AS ENUM('3d-printing', 'laser-cutting', 'cnc', 'electronics', 'design', 'training');
  CREATE TYPE "public"."enum_services_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_equipment_category" AS ENUM('3d-printer', 'laser-cutter', 'cnc', 'electronics', 'hand-tools', '3d-scanner', 'other');
  CREATE TYPE "public"."enum_equipment_status" AS ENUM('available', 'maintenance', 'out-of-service');
  CREATE TYPE "public"."enum_equipment_requests_status" AS ENUM('pending', 'approved', 'rejected');
  CREATE TYPE "public"."enum_equipment_usage_estimated_duration" AS ENUM('30min', '1h', '2h', '4h', '8h', '1d', '2d', '1w');
  CREATE TYPE "public"."enum_equipment_usage_status" AS ENUM('active', 'completed');
  CREATE TYPE "public"."enum_inventory_items_category" AS ENUM('consumable', 'material', 'component', 'tool', 'supply', 'other');
  CREATE TYPE "public"."enum_inventory_items_unit" AS ENUM('unit', 'kg', 'g', 'm', 'cm', 'l', 'ml', 'roll', 'sheet', 'pack');
  CREATE TYPE "public"."enum_inventory_items_status" AS ENUM('available', 'low-stock', 'out-of-stock');
  CREATE TYPE "public"."enum_team_members_category" AS ENUM('leadership', 'specialist', 'collaborator');
  CREATE TYPE "public"."enum_projects_category" AS ENUM('Hardware', 'Software', 'Diseño', 'IoT');
  CREATE TYPE "public"."enum_projects_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_events_type" AS ENUM('workshop', 'course', 'talk', 'hackathon', 'open-day', 'meetup');
  CREATE TYPE "public"."enum_events_status" AS ENUM('draft', 'published', 'cancelled', 'completed');
  CREATE TYPE "public"."enum_resources_type" AS ENUM('document', 'guide', 'tutorial', 'template', 'software', 'other');
  CREATE TYPE "public"."enum_resources_visibility" AS ENUM('public', 'authenticated', 'admin');
  CREATE TYPE "public"."enum_resources_status" AS ENUM('draft', 'published', 'archived');
  CREATE TYPE "public"."enum_gallery_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_faqs_category" AS ENUM('general', 'membership', 'services', 'equipment', 'events', 'schedule', 'payments');
  CREATE TYPE "public"."enum_contact_messages_estado" AS ENUM('nuevo', 'leido', 'progreso', 'resuelto');
  CREATE TYPE "public"."enum_site_settings_social_links_platform" AS ENUM('instagram', 'facebook', 'twitter', 'linkedin', 'youtube', 'tiktok', 'github', 'discord');
  CREATE TYPE "public"."enum_landing_config_cta_buttons_variant" AS ENUM('primary', 'secondary', 'outline');
  CREATE TYPE "public"."enum_equipo_page_hero_stats_icon" AS ENUM('award', 'users', 'sparkles', 'calendar', 'rocket');
  CREATE TABLE "users_achievements" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"achievement" varchar
  );
  
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"avatar_id" integer,
  	"image_position" varchar DEFAULT '50% 50%',
  	"bio" varchar,
  	"job_title" varchar,
  	"show_in_team" boolean DEFAULT false,
  	"category" "enum_users_category" DEFAULT 'specialist',
  	"experience" varchar,
  	"education_status" "enum_users_education_status" DEFAULT 'graduated',
  	"order" numeric DEFAULT 99,
  	"linkedin" varchar,
  	"github" varchar,
  	"role" "enum_users_role" DEFAULT 'viewer' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar NOT NULL,
  	"caption" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_thumbnail_url" varchar,
  	"sizes_thumbnail_width" numeric,
  	"sizes_thumbnail_height" numeric,
  	"sizes_thumbnail_mime_type" varchar,
  	"sizes_thumbnail_filesize" numeric,
  	"sizes_thumbnail_filename" varchar,
  	"sizes_tech_box_url" varchar,
  	"sizes_tech_box_width" numeric,
  	"sizes_tech_box_height" numeric,
  	"sizes_tech_box_mime_type" varchar,
  	"sizes_tech_box_filesize" numeric,
  	"sizes_tech_box_filename" varchar,
  	"sizes_card_url" varchar,
  	"sizes_card_width" numeric,
  	"sizes_card_height" numeric,
  	"sizes_card_mime_type" varchar,
  	"sizes_card_filesize" numeric,
  	"sizes_card_filename" varchar,
  	"sizes_gallery_url" varchar,
  	"sizes_gallery_width" numeric,
  	"sizes_gallery_height" numeric,
  	"sizes_gallery_mime_type" varchar,
  	"sizes_gallery_filesize" numeric,
  	"sizes_gallery_filename" varchar,
  	"sizes_tablet_url" varchar,
  	"sizes_tablet_width" numeric,
  	"sizes_tablet_height" numeric,
  	"sizes_tablet_mime_type" varchar,
  	"sizes_tablet_filesize" numeric,
  	"sizes_tablet_filename" varchar,
  	"sizes_hero_url" varchar,
  	"sizes_hero_width" numeric,
  	"sizes_hero_height" numeric,
  	"sizes_hero_mime_type" varchar,
  	"sizes_hero_filesize" numeric,
  	"sizes_hero_filename" varchar,
  	"sizes_og_url" varchar,
  	"sizes_og_width" numeric,
  	"sizes_og_height" numeric,
  	"sizes_og_mime_type" varchar,
  	"sizes_og_filesize" numeric,
  	"sizes_og_filename" varchar
  );
  
  CREATE TABLE "posts_tags" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"tag" varchar
  );
  
  CREATE TABLE "posts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"slug" varchar,
  	"excerpt" varchar,
  	"featured_image_id" integer,
  	"content" jsonb NOT NULL,
  	"author_id" integer,
  	"status" "enum_posts_status" DEFAULT 'draft' NOT NULL,
  	"published_at" timestamp(3) with time zone,
  	"views" numeric DEFAULT 0,
  	"seo_meta_title" varchar,
  	"seo_meta_description" varchar,
  	"seo_keywords" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "posts_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"categories_id" integer
  );
  
  CREATE TABLE "categories" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar,
  	"description" varchar,
  	"parent_id" integer,
  	"icon" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "services_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer NOT NULL,
  	"caption" varchar
  );
  
  CREATE TABLE "services_pricing" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"item" varchar NOT NULL,
  	"price" varchar NOT NULL,
  	"notes" varchar
  );
  
  CREATE TABLE "services_features" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"feature" varchar NOT NULL
  );
  
  CREATE TABLE "services" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"category" "enum_services_category" DEFAULT '3d-printing' NOT NULL,
  	"description" varchar NOT NULL,
  	"content" jsonb,
  	"icon" varchar,
  	"featured_image_id" integer,
  	"order" numeric DEFAULT 0,
  	"featured" boolean DEFAULT false,
  	"status" "enum_services_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "equipment_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer NOT NULL
  );
  
  CREATE TABLE "equipment_specifications" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"value" varchar NOT NULL
  );
  
  CREATE TABLE "equipment_materials" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"material" varchar NOT NULL
  );
  
  CREATE TABLE "equipment_manuals" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"file_id" integer,
  	"url" varchar
  );
  
  CREATE TABLE "equipment" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"category" "enum_equipment_category" DEFAULT '3d-printer' NOT NULL,
  	"brand" varchar,
  	"model" varchar,
  	"description" varchar NOT NULL,
  	"featured_image_id" integer,
  	"status" "enum_equipment_status" DEFAULT 'available',
  	"location" varchar,
  	"requires_training" boolean DEFAULT false,
  	"show_in_tecnologias" boolean DEFAULT true,
  	"order" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "equipment_requests" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"equipment_name" varchar NOT NULL,
  	"description" varchar,
  	"quantity" numeric DEFAULT 1 NOT NULL,
  	"justification" varchar NOT NULL,
  	"status" "enum_equipment_requests_status" DEFAULT 'pending' NOT NULL,
  	"requested_by_id" integer,
  	"reviewed_by_id" integer,
  	"review_notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "equipment_usage" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"equipment_id" varchar NOT NULL,
  	"equipment_name" varchar NOT NULL,
  	"user_id" integer NOT NULL,
  	"user_name" varchar,
  	"start_time" timestamp(3) with time zone NOT NULL,
  	"end_time" timestamp(3) with time zone,
  	"estimated_duration" "enum_equipment_usage_estimated_duration" DEFAULT '1h' NOT NULL,
  	"description" varchar,
  	"status" "enum_equipment_usage_status" DEFAULT 'active' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "inventory_items" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"sku" varchar,
  	"category" "enum_inventory_items_category" DEFAULT 'consumable' NOT NULL,
  	"description" varchar,
  	"image_id" integer,
  	"quantity" numeric DEFAULT 0 NOT NULL,
  	"unit" "enum_inventory_items_unit" DEFAULT 'unit',
  	"minimum_stock" numeric DEFAULT 0,
  	"location" varchar,
  	"supplier" varchar,
  	"unit_cost" numeric,
  	"status" "enum_inventory_items_status" DEFAULT 'available',
  	"notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "team_members_achievements" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"achievement" varchar
  );
  
  CREATE TABLE "team_members" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"role" varchar NOT NULL,
  	"category" "enum_team_members_category" DEFAULT 'specialist' NOT NULL,
  	"specialty" varchar,
  	"image_id" integer NOT NULL,
  	"bio" varchar,
  	"experience" varchar,
  	"social_email" varchar,
  	"social_linkedin" varchar,
  	"social_github" varchar,
  	"social_twitter" varchar,
  	"order" numeric,
  	"active" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "projects_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer NOT NULL
  );
  
  CREATE TABLE "projects_technologies" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL
  );
  
  CREATE TABLE "projects_creators" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"team_member_id" integer,
  	"external_name" varchar,
  	"role" varchar
  );
  
  CREATE TABLE "projects_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"url" varchar NOT NULL
  );
  
  CREATE TABLE "projects_practice_hours_specialists" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"first_name" varchar,
  	"paternal_last_name" varchar,
  	"maternal_last_name" varchar,
  	"rut" varchar
  );
  
  CREATE TABLE "projects_practice_hours_bidireccion_entries" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"tipo_beneficiario" varchar,
  	"rut" varchar,
  	"first_name" varchar,
  	"paternal_last_name" varchar,
  	"maternal_last_name" varchar,
  	"rol" varchar,
  	"horas_docente" numeric,
  	"horas_estudiante" numeric
  );
  
  CREATE TABLE "projects" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"category" "enum_projects_category" DEFAULT 'Hardware' NOT NULL,
  	"description" varchar NOT NULL,
  	"content" jsonb,
  	"featured_image_id" integer,
  	"practice_hours_enabled" boolean DEFAULT false,
  	"practice_hours_beneficiary_type" varchar,
  	"practice_hours_institution_name" varchar,
  	"practice_hours_institution_rut" varchar,
  	"practice_hours_email" varchar,
  	"practice_hours_phone" varchar,
  	"practice_hours_commune" varchar,
  	"practice_hours_referring_organization" varchar,
  	"year" numeric DEFAULT 2026,
  	"featured" boolean DEFAULT false,
  	"status" "enum_projects_status" DEFAULT 'draft',
  	"order" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "events_requirements" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"requirement" varchar NOT NULL
  );
  
  CREATE TABLE "events_materials" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"material" varchar NOT NULL
  );
  
  CREATE TABLE "events_tags" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"tag" varchar
  );
  
  CREATE TABLE "events" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"type" "enum_events_type" DEFAULT 'workshop' NOT NULL,
  	"description" varchar NOT NULL,
  	"content" jsonb,
  	"featured_image_id" integer,
  	"start_date" timestamp(3) with time zone NOT NULL,
  	"end_date" timestamp(3) with time zone,
  	"location" varchar,
  	"is_online" boolean DEFAULT false,
  	"instructor_id" integer,
  	"external_instructor" varchar,
  	"capacity" numeric,
  	"registration_url" varchar,
  	"price" varchar,
  	"featured" boolean DEFAULT false,
  	"status" "enum_events_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "resources_tags" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"tag" varchar
  );
  
  CREATE TABLE "resources" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"slug" varchar,
  	"description" varchar,
  	"type" "enum_resources_type" DEFAULT 'document' NOT NULL,
  	"file_id" integer,
  	"external_url" varchar,
  	"thumbnail_id" integer,
  	"folder" varchar,
  	"visibility" "enum_resources_visibility" DEFAULT 'public' NOT NULL,
  	"downloads" numeric DEFAULT 0,
  	"status" "enum_resources_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "gallery_tags" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"tag" varchar
  );
  
  CREATE TABLE "gallery" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"description" varchar,
  	"image_id" integer NOT NULL,
  	"album" varchar,
  	"date" timestamp(3) with time zone,
  	"featured" boolean DEFAULT false,
  	"status" "enum_gallery_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "faqs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"question" varchar NOT NULL,
  	"answer" jsonb NOT NULL,
  	"category" "enum_faqs_category" DEFAULT 'general' NOT NULL,
  	"order" numeric DEFAULT 0,
  	"published" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "testimonials" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"author" varchar NOT NULL,
  	"role" varchar,
  	"content" varchar NOT NULL,
  	"avatar_id" integer,
  	"rating" numeric DEFAULT 5,
  	"project_link_id" integer,
  	"featured" boolean DEFAULT false,
  	"published" boolean DEFAULT true,
  	"order" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "contact_messages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"nombre" varchar NOT NULL,
  	"email" varchar NOT NULL,
  	"telefono" varchar,
  	"asunto" varchar NOT NULL,
  	"mensaje" varchar NOT NULL,
  	"estado" "enum_contact_messages_estado" DEFAULT 'nuevo',
  	"respuesta" varchar,
  	"fecha_respuesta" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer,
  	"media_id" integer,
  	"posts_id" integer,
  	"categories_id" integer,
  	"services_id" integer,
  	"equipment_id" integer,
  	"equipment_requests_id" integer,
  	"equipment_usage_id" integer,
  	"inventory_items_id" integer,
  	"team_members_id" integer,
  	"projects_id" integer,
  	"events_id" integer,
  	"resources_id" integer,
  	"gallery_id" integer,
  	"faqs_id" integer,
  	"testimonials_id" integer,
  	"contact_messages_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "site_settings_social_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"platform" "enum_site_settings_social_links_platform" NOT NULL,
  	"url" varchar NOT NULL,
  	"label" varchar
  );
  
  CREATE TABLE "site_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"site_name" varchar DEFAULT 'FabLab INACAP Los Ángeles' NOT NULL,
  	"site_description" varchar,
  	"logo_id" integer,
  	"logo_alt_id" integer,
  	"favicon_id" integer,
  	"contact_email" varchar,
  	"contact_phone" varchar,
  	"whatsapp" varchar,
  	"address" varchar,
  	"google_maps_url" varchar,
  	"schedule" varchar,
  	"google_analytics_id" varchar,
  	"custom_scripts" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "landing_config_cta_buttons" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL,
  	"url" varchar NOT NULL,
  	"variant" "enum_landing_config_cta_buttons_variant" DEFAULT 'primary'
  );
  
  CREATE TABLE "landing_config_stats" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar,
  	"label" varchar,
  	"icon" varchar
  );
  
  CREATE TABLE "landing_config" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"hero_title" varchar DEFAULT 'FabLab INACAP',
  	"hero_subtitle" varchar,
  	"hero_image_id" integer,
  	"show_services" boolean DEFAULT true,
  	"show_projects" boolean DEFAULT true,
  	"projects_count" numeric DEFAULT 6,
  	"show_team" boolean DEFAULT true,
  	"show_testimonials" boolean DEFAULT true,
  	"show_events" boolean DEFAULT true,
  	"upcoming_events_count" numeric DEFAULT 3,
  	"show_stats" boolean DEFAULT true,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"og_image_id" integer,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "landing_config_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"services_id" integer
  );
  
  CREATE TABLE "equipo_page_hero_stats" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL,
  	"icon" "enum_equipo_page_hero_stats_icon" DEFAULT 'users'
  );
  
  CREATE TABLE "equipo_page" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"hero_title" varchar DEFAULT 'Las personas detrás de FabLab',
  	"hero_description" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "users_achievements" ADD CONSTRAINT "users_achievements_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users" ADD CONSTRAINT "users_avatar_id_media_id_fk" FOREIGN KEY ("avatar_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "posts_tags" ADD CONSTRAINT "posts_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "posts" ADD CONSTRAINT "posts_featured_image_id_media_id_fk" FOREIGN KEY ("featured_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "posts" ADD CONSTRAINT "posts_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "posts_rels" ADD CONSTRAINT "posts_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "posts_rels" ADD CONSTRAINT "posts_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "services_gallery" ADD CONSTRAINT "services_gallery_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "services_gallery" ADD CONSTRAINT "services_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_pricing" ADD CONSTRAINT "services_pricing_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_features" ADD CONSTRAINT "services_features_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services" ADD CONSTRAINT "services_featured_image_id_media_id_fk" FOREIGN KEY ("featured_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "equipment_gallery" ADD CONSTRAINT "equipment_gallery_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "equipment_gallery" ADD CONSTRAINT "equipment_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."equipment"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "equipment_specifications" ADD CONSTRAINT "equipment_specifications_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."equipment"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "equipment_materials" ADD CONSTRAINT "equipment_materials_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."equipment"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "equipment_manuals" ADD CONSTRAINT "equipment_manuals_file_id_media_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "equipment_manuals" ADD CONSTRAINT "equipment_manuals_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."equipment"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "equipment" ADD CONSTRAINT "equipment_featured_image_id_media_id_fk" FOREIGN KEY ("featured_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "equipment_requests" ADD CONSTRAINT "equipment_requests_requested_by_id_users_id_fk" FOREIGN KEY ("requested_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "equipment_requests" ADD CONSTRAINT "equipment_requests_reviewed_by_id_users_id_fk" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "equipment_usage" ADD CONSTRAINT "equipment_usage_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "team_members_achievements" ADD CONSTRAINT "team_members_achievements_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."team_members"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "team_members" ADD CONSTRAINT "team_members_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "projects_gallery" ADD CONSTRAINT "projects_gallery_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "projects_gallery" ADD CONSTRAINT "projects_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_technologies" ADD CONSTRAINT "projects_technologies_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_creators" ADD CONSTRAINT "projects_creators_team_member_id_users_id_fk" FOREIGN KEY ("team_member_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "projects_creators" ADD CONSTRAINT "projects_creators_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_links" ADD CONSTRAINT "projects_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_practice_hours_specialists" ADD CONSTRAINT "projects_practice_hours_specialists_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_practice_hours_bidireccion_entries" ADD CONSTRAINT "projects_practice_hours_bidireccion_entries_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects" ADD CONSTRAINT "projects_featured_image_id_media_id_fk" FOREIGN KEY ("featured_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "events_requirements" ADD CONSTRAINT "events_requirements_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_materials" ADD CONSTRAINT "events_materials_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_tags" ADD CONSTRAINT "events_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events" ADD CONSTRAINT "events_featured_image_id_media_id_fk" FOREIGN KEY ("featured_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "events" ADD CONSTRAINT "events_instructor_id_users_id_fk" FOREIGN KEY ("instructor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "resources_tags" ADD CONSTRAINT "resources_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."resources"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "resources" ADD CONSTRAINT "resources_file_id_media_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "resources" ADD CONSTRAINT "resources_thumbnail_id_media_id_fk" FOREIGN KEY ("thumbnail_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "gallery_tags" ADD CONSTRAINT "gallery_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."gallery"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "gallery" ADD CONSTRAINT "gallery_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "testimonials" ADD CONSTRAINT "testimonials_avatar_id_media_id_fk" FOREIGN KEY ("avatar_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "testimonials" ADD CONSTRAINT "testimonials_project_link_id_projects_id_fk" FOREIGN KEY ("project_link_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_services_fk" FOREIGN KEY ("services_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_equipment_fk" FOREIGN KEY ("equipment_id") REFERENCES "public"."equipment"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_equipment_requests_fk" FOREIGN KEY ("equipment_requests_id") REFERENCES "public"."equipment_requests"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_equipment_usage_fk" FOREIGN KEY ("equipment_usage_id") REFERENCES "public"."equipment_usage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_inventory_items_fk" FOREIGN KEY ("inventory_items_id") REFERENCES "public"."inventory_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_team_members_fk" FOREIGN KEY ("team_members_id") REFERENCES "public"."team_members"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_projects_fk" FOREIGN KEY ("projects_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_events_fk" FOREIGN KEY ("events_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_resources_fk" FOREIGN KEY ("resources_id") REFERENCES "public"."resources"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_gallery_fk" FOREIGN KEY ("gallery_id") REFERENCES "public"."gallery"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_faqs_fk" FOREIGN KEY ("faqs_id") REFERENCES "public"."faqs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_testimonials_fk" FOREIGN KEY ("testimonials_id") REFERENCES "public"."testimonials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_contact_messages_fk" FOREIGN KEY ("contact_messages_id") REFERENCES "public"."contact_messages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_social_links" ADD CONSTRAINT "site_settings_social_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_logo_alt_id_media_id_fk" FOREIGN KEY ("logo_alt_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_favicon_id_media_id_fk" FOREIGN KEY ("favicon_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "landing_config_cta_buttons" ADD CONSTRAINT "landing_config_cta_buttons_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."landing_config"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "landing_config_stats" ADD CONSTRAINT "landing_config_stats_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."landing_config"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "landing_config" ADD CONSTRAINT "landing_config_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "landing_config" ADD CONSTRAINT "landing_config_og_image_id_media_id_fk" FOREIGN KEY ("og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "landing_config_rels" ADD CONSTRAINT "landing_config_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."landing_config"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "landing_config_rels" ADD CONSTRAINT "landing_config_rels_services_fk" FOREIGN KEY ("services_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "equipo_page_hero_stats" ADD CONSTRAINT "equipo_page_hero_stats_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."equipo_page"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_achievements_order_idx" ON "users_achievements" USING btree ("_order");
  CREATE INDEX "users_achievements_parent_id_idx" ON "users_achievements" USING btree ("_parent_id");
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_avatar_idx" ON "users" USING btree ("avatar_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "media_sizes_thumbnail_sizes_thumbnail_filename_idx" ON "media" USING btree ("sizes_thumbnail_filename");
  CREATE INDEX "media_sizes_tech_box_sizes_tech_box_filename_idx" ON "media" USING btree ("sizes_tech_box_filename");
  CREATE INDEX "media_sizes_card_sizes_card_filename_idx" ON "media" USING btree ("sizes_card_filename");
  CREATE INDEX "media_sizes_gallery_sizes_gallery_filename_idx" ON "media" USING btree ("sizes_gallery_filename");
  CREATE INDEX "media_sizes_tablet_sizes_tablet_filename_idx" ON "media" USING btree ("sizes_tablet_filename");
  CREATE INDEX "media_sizes_hero_sizes_hero_filename_idx" ON "media" USING btree ("sizes_hero_filename");
  CREATE INDEX "media_sizes_og_sizes_og_filename_idx" ON "media" USING btree ("sizes_og_filename");
  CREATE INDEX "posts_tags_order_idx" ON "posts_tags" USING btree ("_order");
  CREATE INDEX "posts_tags_parent_id_idx" ON "posts_tags" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "posts_slug_idx" ON "posts" USING btree ("slug");
  CREATE INDEX "posts_featured_image_idx" ON "posts" USING btree ("featured_image_id");
  CREATE INDEX "posts_author_idx" ON "posts" USING btree ("author_id");
  CREATE INDEX "posts_updated_at_idx" ON "posts" USING btree ("updated_at");
  CREATE INDEX "posts_created_at_idx" ON "posts" USING btree ("created_at");
  CREATE INDEX "posts_rels_order_idx" ON "posts_rels" USING btree ("order");
  CREATE INDEX "posts_rels_parent_idx" ON "posts_rels" USING btree ("parent_id");
  CREATE INDEX "posts_rels_path_idx" ON "posts_rels" USING btree ("path");
  CREATE INDEX "posts_rels_categories_id_idx" ON "posts_rels" USING btree ("categories_id");
  CREATE UNIQUE INDEX "categories_slug_idx" ON "categories" USING btree ("slug");
  CREATE INDEX "categories_parent_idx" ON "categories" USING btree ("parent_id");
  CREATE INDEX "categories_updated_at_idx" ON "categories" USING btree ("updated_at");
  CREATE INDEX "categories_created_at_idx" ON "categories" USING btree ("created_at");
  CREATE INDEX "services_gallery_order_idx" ON "services_gallery" USING btree ("_order");
  CREATE INDEX "services_gallery_parent_id_idx" ON "services_gallery" USING btree ("_parent_id");
  CREATE INDEX "services_gallery_image_idx" ON "services_gallery" USING btree ("image_id");
  CREATE INDEX "services_pricing_order_idx" ON "services_pricing" USING btree ("_order");
  CREATE INDEX "services_pricing_parent_id_idx" ON "services_pricing" USING btree ("_parent_id");
  CREATE INDEX "services_features_order_idx" ON "services_features" USING btree ("_order");
  CREATE INDEX "services_features_parent_id_idx" ON "services_features" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "services_slug_idx" ON "services" USING btree ("slug");
  CREATE INDEX "services_featured_image_idx" ON "services" USING btree ("featured_image_id");
  CREATE INDEX "services_updated_at_idx" ON "services" USING btree ("updated_at");
  CREATE INDEX "services_created_at_idx" ON "services" USING btree ("created_at");
  CREATE INDEX "equipment_gallery_order_idx" ON "equipment_gallery" USING btree ("_order");
  CREATE INDEX "equipment_gallery_parent_id_idx" ON "equipment_gallery" USING btree ("_parent_id");
  CREATE INDEX "equipment_gallery_image_idx" ON "equipment_gallery" USING btree ("image_id");
  CREATE INDEX "equipment_specifications_order_idx" ON "equipment_specifications" USING btree ("_order");
  CREATE INDEX "equipment_specifications_parent_id_idx" ON "equipment_specifications" USING btree ("_parent_id");
  CREATE INDEX "equipment_materials_order_idx" ON "equipment_materials" USING btree ("_order");
  CREATE INDEX "equipment_materials_parent_id_idx" ON "equipment_materials" USING btree ("_parent_id");
  CREATE INDEX "equipment_manuals_order_idx" ON "equipment_manuals" USING btree ("_order");
  CREATE INDEX "equipment_manuals_parent_id_idx" ON "equipment_manuals" USING btree ("_parent_id");
  CREATE INDEX "equipment_manuals_file_idx" ON "equipment_manuals" USING btree ("file_id");
  CREATE UNIQUE INDEX "equipment_slug_idx" ON "equipment" USING btree ("slug");
  CREATE INDEX "equipment_featured_image_idx" ON "equipment" USING btree ("featured_image_id");
  CREATE INDEX "equipment_updated_at_idx" ON "equipment" USING btree ("updated_at");
  CREATE INDEX "equipment_created_at_idx" ON "equipment" USING btree ("created_at");
  CREATE INDEX "equipment_requests_requested_by_idx" ON "equipment_requests" USING btree ("requested_by_id");
  CREATE INDEX "equipment_requests_reviewed_by_idx" ON "equipment_requests" USING btree ("reviewed_by_id");
  CREATE INDEX "equipment_requests_updated_at_idx" ON "equipment_requests" USING btree ("updated_at");
  CREATE INDEX "equipment_requests_created_at_idx" ON "equipment_requests" USING btree ("created_at");
  CREATE INDEX "equipment_usage_equipment_id_idx" ON "equipment_usage" USING btree ("equipment_id");
  CREATE INDEX "equipment_usage_user_idx" ON "equipment_usage" USING btree ("user_id");
  CREATE INDEX "equipment_usage_status_idx" ON "equipment_usage" USING btree ("status");
  CREATE INDEX "equipment_usage_updated_at_idx" ON "equipment_usage" USING btree ("updated_at");
  CREATE INDEX "equipment_usage_created_at_idx" ON "equipment_usage" USING btree ("created_at");
  CREATE UNIQUE INDEX "inventory_items_sku_idx" ON "inventory_items" USING btree ("sku");
  CREATE INDEX "inventory_items_image_idx" ON "inventory_items" USING btree ("image_id");
  CREATE INDEX "inventory_items_updated_at_idx" ON "inventory_items" USING btree ("updated_at");
  CREATE INDEX "inventory_items_created_at_idx" ON "inventory_items" USING btree ("created_at");
  CREATE INDEX "team_members_achievements_order_idx" ON "team_members_achievements" USING btree ("_order");
  CREATE INDEX "team_members_achievements_parent_id_idx" ON "team_members_achievements" USING btree ("_parent_id");
  CREATE INDEX "team_members_image_idx" ON "team_members" USING btree ("image_id");
  CREATE INDEX "team_members_updated_at_idx" ON "team_members" USING btree ("updated_at");
  CREATE INDEX "team_members_created_at_idx" ON "team_members" USING btree ("created_at");
  CREATE INDEX "projects_gallery_order_idx" ON "projects_gallery" USING btree ("_order");
  CREATE INDEX "projects_gallery_parent_id_idx" ON "projects_gallery" USING btree ("_parent_id");
  CREATE INDEX "projects_gallery_image_idx" ON "projects_gallery" USING btree ("image_id");
  CREATE INDEX "projects_technologies_order_idx" ON "projects_technologies" USING btree ("_order");
  CREATE INDEX "projects_technologies_parent_id_idx" ON "projects_technologies" USING btree ("_parent_id");
  CREATE INDEX "projects_creators_order_idx" ON "projects_creators" USING btree ("_order");
  CREATE INDEX "projects_creators_parent_id_idx" ON "projects_creators" USING btree ("_parent_id");
  CREATE INDEX "projects_creators_team_member_idx" ON "projects_creators" USING btree ("team_member_id");
  CREATE INDEX "projects_links_order_idx" ON "projects_links" USING btree ("_order");
  CREATE INDEX "projects_links_parent_id_idx" ON "projects_links" USING btree ("_parent_id");
  CREATE INDEX "projects_practice_hours_specialists_order_idx" ON "projects_practice_hours_specialists" USING btree ("_order");
  CREATE INDEX "projects_practice_hours_specialists_parent_id_idx" ON "projects_practice_hours_specialists" USING btree ("_parent_id");
  CREATE INDEX "projects_practice_hours_bidireccion_entries_order_idx" ON "projects_practice_hours_bidireccion_entries" USING btree ("_order");
  CREATE INDEX "projects_practice_hours_bidireccion_entries_parent_id_idx" ON "projects_practice_hours_bidireccion_entries" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "projects_slug_idx" ON "projects" USING btree ("slug");
  CREATE INDEX "projects_featured_image_idx" ON "projects" USING btree ("featured_image_id");
  CREATE INDEX "projects_updated_at_idx" ON "projects" USING btree ("updated_at");
  CREATE INDEX "projects_created_at_idx" ON "projects" USING btree ("created_at");
  CREATE INDEX "events_requirements_order_idx" ON "events_requirements" USING btree ("_order");
  CREATE INDEX "events_requirements_parent_id_idx" ON "events_requirements" USING btree ("_parent_id");
  CREATE INDEX "events_materials_order_idx" ON "events_materials" USING btree ("_order");
  CREATE INDEX "events_materials_parent_id_idx" ON "events_materials" USING btree ("_parent_id");
  CREATE INDEX "events_tags_order_idx" ON "events_tags" USING btree ("_order");
  CREATE INDEX "events_tags_parent_id_idx" ON "events_tags" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "events_slug_idx" ON "events" USING btree ("slug");
  CREATE INDEX "events_featured_image_idx" ON "events" USING btree ("featured_image_id");
  CREATE INDEX "events_instructor_idx" ON "events" USING btree ("instructor_id");
  CREATE INDEX "events_updated_at_idx" ON "events" USING btree ("updated_at");
  CREATE INDEX "events_created_at_idx" ON "events" USING btree ("created_at");
  CREATE INDEX "resources_tags_order_idx" ON "resources_tags" USING btree ("_order");
  CREATE INDEX "resources_tags_parent_id_idx" ON "resources_tags" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "resources_slug_idx" ON "resources" USING btree ("slug");
  CREATE INDEX "resources_file_idx" ON "resources" USING btree ("file_id");
  CREATE INDEX "resources_thumbnail_idx" ON "resources" USING btree ("thumbnail_id");
  CREATE INDEX "resources_updated_at_idx" ON "resources" USING btree ("updated_at");
  CREATE INDEX "resources_created_at_idx" ON "resources" USING btree ("created_at");
  CREATE INDEX "gallery_tags_order_idx" ON "gallery_tags" USING btree ("_order");
  CREATE INDEX "gallery_tags_parent_id_idx" ON "gallery_tags" USING btree ("_parent_id");
  CREATE INDEX "gallery_image_idx" ON "gallery" USING btree ("image_id");
  CREATE INDEX "gallery_updated_at_idx" ON "gallery" USING btree ("updated_at");
  CREATE INDEX "gallery_created_at_idx" ON "gallery" USING btree ("created_at");
  CREATE INDEX "faqs_updated_at_idx" ON "faqs" USING btree ("updated_at");
  CREATE INDEX "faqs_created_at_idx" ON "faqs" USING btree ("created_at");
  CREATE INDEX "testimonials_avatar_idx" ON "testimonials" USING btree ("avatar_id");
  CREATE INDEX "testimonials_project_link_idx" ON "testimonials" USING btree ("project_link_id");
  CREATE INDEX "testimonials_updated_at_idx" ON "testimonials" USING btree ("updated_at");
  CREATE INDEX "testimonials_created_at_idx" ON "testimonials" USING btree ("created_at");
  CREATE INDEX "contact_messages_updated_at_idx" ON "contact_messages" USING btree ("updated_at");
  CREATE INDEX "contact_messages_created_at_idx" ON "contact_messages" USING btree ("created_at");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_posts_id_idx" ON "payload_locked_documents_rels" USING btree ("posts_id");
  CREATE INDEX "payload_locked_documents_rels_categories_id_idx" ON "payload_locked_documents_rels" USING btree ("categories_id");
  CREATE INDEX "payload_locked_documents_rels_services_id_idx" ON "payload_locked_documents_rels" USING btree ("services_id");
  CREATE INDEX "payload_locked_documents_rels_equipment_id_idx" ON "payload_locked_documents_rels" USING btree ("equipment_id");
  CREATE INDEX "payload_locked_documents_rels_equipment_requests_id_idx" ON "payload_locked_documents_rels" USING btree ("equipment_requests_id");
  CREATE INDEX "payload_locked_documents_rels_equipment_usage_id_idx" ON "payload_locked_documents_rels" USING btree ("equipment_usage_id");
  CREATE INDEX "payload_locked_documents_rels_inventory_items_id_idx" ON "payload_locked_documents_rels" USING btree ("inventory_items_id");
  CREATE INDEX "payload_locked_documents_rels_team_members_id_idx" ON "payload_locked_documents_rels" USING btree ("team_members_id");
  CREATE INDEX "payload_locked_documents_rels_projects_id_idx" ON "payload_locked_documents_rels" USING btree ("projects_id");
  CREATE INDEX "payload_locked_documents_rels_events_id_idx" ON "payload_locked_documents_rels" USING btree ("events_id");
  CREATE INDEX "payload_locked_documents_rels_resources_id_idx" ON "payload_locked_documents_rels" USING btree ("resources_id");
  CREATE INDEX "payload_locked_documents_rels_gallery_id_idx" ON "payload_locked_documents_rels" USING btree ("gallery_id");
  CREATE INDEX "payload_locked_documents_rels_faqs_id_idx" ON "payload_locked_documents_rels" USING btree ("faqs_id");
  CREATE INDEX "payload_locked_documents_rels_testimonials_id_idx" ON "payload_locked_documents_rels" USING btree ("testimonials_id");
  CREATE INDEX "payload_locked_documents_rels_contact_messages_id_idx" ON "payload_locked_documents_rels" USING btree ("contact_messages_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");
  CREATE INDEX "site_settings_social_links_order_idx" ON "site_settings_social_links" USING btree ("_order");
  CREATE INDEX "site_settings_social_links_parent_id_idx" ON "site_settings_social_links" USING btree ("_parent_id");
  CREATE INDEX "site_settings_logo_idx" ON "site_settings" USING btree ("logo_id");
  CREATE INDEX "site_settings_logo_alt_idx" ON "site_settings" USING btree ("logo_alt_id");
  CREATE INDEX "site_settings_favicon_idx" ON "site_settings" USING btree ("favicon_id");
  CREATE INDEX "landing_config_cta_buttons_order_idx" ON "landing_config_cta_buttons" USING btree ("_order");
  CREATE INDEX "landing_config_cta_buttons_parent_id_idx" ON "landing_config_cta_buttons" USING btree ("_parent_id");
  CREATE INDEX "landing_config_stats_order_idx" ON "landing_config_stats" USING btree ("_order");
  CREATE INDEX "landing_config_stats_parent_id_idx" ON "landing_config_stats" USING btree ("_parent_id");
  CREATE INDEX "landing_config_hero_image_idx" ON "landing_config" USING btree ("hero_image_id");
  CREATE INDEX "landing_config_og_image_idx" ON "landing_config" USING btree ("og_image_id");
  CREATE INDEX "landing_config_rels_order_idx" ON "landing_config_rels" USING btree ("order");
  CREATE INDEX "landing_config_rels_parent_idx" ON "landing_config_rels" USING btree ("parent_id");
  CREATE INDEX "landing_config_rels_path_idx" ON "landing_config_rels" USING btree ("path");
  CREATE INDEX "landing_config_rels_services_id_idx" ON "landing_config_rels" USING btree ("services_id");
  CREATE INDEX "equipo_page_hero_stats_order_idx" ON "equipo_page_hero_stats" USING btree ("_order");
  CREATE INDEX "equipo_page_hero_stats_parent_id_idx" ON "equipo_page_hero_stats" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "users_achievements" CASCADE;
  DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "posts_tags" CASCADE;
  DROP TABLE "posts" CASCADE;
  DROP TABLE "posts_rels" CASCADE;
  DROP TABLE "categories" CASCADE;
  DROP TABLE "services_gallery" CASCADE;
  DROP TABLE "services_pricing" CASCADE;
  DROP TABLE "services_features" CASCADE;
  DROP TABLE "services" CASCADE;
  DROP TABLE "equipment_gallery" CASCADE;
  DROP TABLE "equipment_specifications" CASCADE;
  DROP TABLE "equipment_materials" CASCADE;
  DROP TABLE "equipment_manuals" CASCADE;
  DROP TABLE "equipment" CASCADE;
  DROP TABLE "equipment_requests" CASCADE;
  DROP TABLE "equipment_usage" CASCADE;
  DROP TABLE "inventory_items" CASCADE;
  DROP TABLE "team_members_achievements" CASCADE;
  DROP TABLE "team_members" CASCADE;
  DROP TABLE "projects_gallery" CASCADE;
  DROP TABLE "projects_technologies" CASCADE;
  DROP TABLE "projects_creators" CASCADE;
  DROP TABLE "projects_links" CASCADE;
  DROP TABLE "projects_practice_hours_specialists" CASCADE;
  DROP TABLE "projects_practice_hours_bidireccion_entries" CASCADE;
  DROP TABLE "projects" CASCADE;
  DROP TABLE "events_requirements" CASCADE;
  DROP TABLE "events_materials" CASCADE;
  DROP TABLE "events_tags" CASCADE;
  DROP TABLE "events" CASCADE;
  DROP TABLE "resources_tags" CASCADE;
  DROP TABLE "resources" CASCADE;
  DROP TABLE "gallery_tags" CASCADE;
  DROP TABLE "gallery" CASCADE;
  DROP TABLE "faqs" CASCADE;
  DROP TABLE "testimonials" CASCADE;
  DROP TABLE "contact_messages" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TABLE "site_settings_social_links" CASCADE;
  DROP TABLE "site_settings" CASCADE;
  DROP TABLE "landing_config_cta_buttons" CASCADE;
  DROP TABLE "landing_config_stats" CASCADE;
  DROP TABLE "landing_config" CASCADE;
  DROP TABLE "landing_config_rels" CASCADE;
  DROP TABLE "equipo_page_hero_stats" CASCADE;
  DROP TABLE "equipo_page" CASCADE;
  DROP TYPE "public"."enum_users_category";
  DROP TYPE "public"."enum_users_education_status";
  DROP TYPE "public"."enum_users_role";
  DROP TYPE "public"."enum_posts_status";
  DROP TYPE "public"."enum_services_category";
  DROP TYPE "public"."enum_services_status";
  DROP TYPE "public"."enum_equipment_category";
  DROP TYPE "public"."enum_equipment_status";
  DROP TYPE "public"."enum_equipment_requests_status";
  DROP TYPE "public"."enum_equipment_usage_estimated_duration";
  DROP TYPE "public"."enum_equipment_usage_status";
  DROP TYPE "public"."enum_inventory_items_category";
  DROP TYPE "public"."enum_inventory_items_unit";
  DROP TYPE "public"."enum_inventory_items_status";
  DROP TYPE "public"."enum_team_members_category";
  DROP TYPE "public"."enum_projects_category";
  DROP TYPE "public"."enum_projects_status";
  DROP TYPE "public"."enum_events_type";
  DROP TYPE "public"."enum_events_status";
  DROP TYPE "public"."enum_resources_type";
  DROP TYPE "public"."enum_resources_visibility";
  DROP TYPE "public"."enum_resources_status";
  DROP TYPE "public"."enum_gallery_status";
  DROP TYPE "public"."enum_faqs_category";
  DROP TYPE "public"."enum_contact_messages_estado";
  DROP TYPE "public"."enum_site_settings_social_links_platform";
  DROP TYPE "public"."enum_landing_config_cta_buttons_variant";
  DROP TYPE "public"."enum_equipo_page_hero_stats_icon";`)
}
