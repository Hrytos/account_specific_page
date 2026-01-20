-- Migration: Fix unique constraint after renaming subdomain to seller_domain
-- The old constraint still references 'subdomain' column which no longer exists

-- Drop the old constraint
ALTER TABLE landing_pages 
DROP CONSTRAINT IF EXISTS idx_landing_pages_subdomain_published;

-- Create new constraint with seller_domain
-- Note: We're allowing duplicate seller_domains since multiple buyers can use same seller
-- The uniqueness should be on (buyer_id, seller_domain) combination or page_url_key
ALTER TABLE landing_pages 
ADD CONSTRAINT idx_landing_pages_page_url_key_unique 
UNIQUE (page_url_key);

-- Add index for faster lookups by seller_domain and buyer_id
CREATE INDEX IF NOT EXISTS idx_landing_pages_domain_lookup 
ON landing_pages(seller_domain, buyer_id);
