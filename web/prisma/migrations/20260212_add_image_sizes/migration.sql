-- Migration: Add new image sizes to media table
-- Created for Payload CMS image optimization feature
-- Run this against your PostgreSQL database

-- Add techBox size columns
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_tech_box_url VARCHAR(255);
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_tech_box_width INTEGER;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_tech_box_height INTEGER;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_tech_box_mime_type VARCHAR(100);
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_tech_box_filesize INTEGER;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_tech_box_filename VARCHAR(255);

-- Add gallery size columns
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_gallery_url VARCHAR(255);
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_gallery_width INTEGER;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_gallery_height INTEGER;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_gallery_mime_type VARCHAR(100);
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_gallery_filesize INTEGER;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_gallery_filename VARCHAR(255);

-- Add hero size columns
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_hero_url VARCHAR(255);
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_hero_width INTEGER;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_hero_height INTEGER;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_hero_mime_type VARCHAR(100);
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_hero_filesize INTEGER;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_hero_filename VARCHAR(255);

-- Add og (Open Graph) size columns
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_og_url VARCHAR(255);
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_og_width INTEGER;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_og_height INTEGER;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_og_mime_type VARCHAR(100);
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_og_filesize INTEGER;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_og_filename VARCHAR(255);

-- Note: After running this migration, you may want to regenerate image sizes
-- for existing media by re-uploading them through the CMS or using a script.
