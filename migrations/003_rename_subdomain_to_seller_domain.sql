-- Migration: Rename subdomain to seller_domain
-- Purpose: Store seller's domain (e.g., "cyngn.com") instead of buyer subdomain
-- URL Format: https://{buyer_id}.{seller_domain}

-- Rename column
ALTER TABLE landing_pages 
RENAME COLUMN subdomain TO seller_domain;

-- Update column description
COMMENT ON COLUMN landing_pages.seller_domain IS 'Seller domain for wildcard routing (e.g., cyngn.com, techflow.io)';

-- Update any existing data if needed (optional - depends on your data)
-- UPDATE landing_pages SET seller_domain = 'yourdefaultdomain.com' WHERE seller_domain IS NULL;
