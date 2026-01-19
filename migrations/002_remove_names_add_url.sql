-- Migration: Remove buyer_name and seller_name, add page_url column
-- Date: 2026-01-19
-- Description: Clean up unnecessary name fields and add URL storage

-- Step 1: Add page_url column
ALTER TABLE landing_pages 
ADD COLUMN IF NOT EXISTS page_url TEXT;

-- Step 2: Drop buyer_name and seller_name columns
ALTER TABLE landing_pages 
DROP COLUMN IF EXISTS buyer_name,
DROP COLUMN IF EXISTS seller_name;

-- Step 3: Update existing rows with URLs (if any)
-- This is safe to run - it will only update rows that don't have page_url set
UPDATE landing_pages 
SET page_url = CONCAT('http://localhost:3000/p/', subdomain)
WHERE page_url IS NULL AND subdomain IS NOT NULL;

-- Verification queries
SELECT 
  COUNT(*) as total_pages,
  COUNT(page_url) as pages_with_url,
  COUNT(subdomain) as pages_with_subdomain
FROM landing_pages;
