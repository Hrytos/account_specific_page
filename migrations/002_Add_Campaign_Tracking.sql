-- ============================================
-- Migration 002: Add Campaign Tracking Tables
-- ============================================
-- Purpose: Add token-based tracking for email campaigns
-- Integration: Works with existing contacts, sl_campaigns, and landing_pages tables
-- Date: January 31, 2026
-- ============================================

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PREREQUISITE CHECK: Verify required tables exist
-- ============================================
DO $$
BEGIN
    -- Check contacts table exists
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'contacts') THEN
        RAISE EXCEPTION 'contacts table does not exist. Required for campaign tracking.';
    END IF;
    
    -- Check sl_campaigns table exists
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'sl_campaigns') THEN
        RAISE EXCEPTION 'sl_campaigns table does not exist. Required for campaign tracking.';
    END IF;
    
    -- Check landing_pages table exists
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'landing_pages') THEN
        RAISE EXCEPTION 'landing_pages table does not exist. Required for campaign tracking.';
    END IF;
    
    RAISE NOTICE '✅ Prerequisites verified: contacts, sl_campaigns, and landing_pages tables exist';
END $$;

-- ============================================
-- SKIP: contacts and campaigns tables (already exist)
-- ============================================
-- Your existing tables:
-- - contacts: Already exists with rich LinkedIn data
-- - sl_campaigns: Already exists with Smartlead integration
-- - landing_pages: Already exists with campaign_id foreign key
-- ============================================

-- ============================================
-- TABLE 1: landing_page_token
-- ============================================
-- Purpose: Unique tracking tokens per contact per campaign
-- Used in email links: /r/{token}
-- Maps to: contact + campaign + landing page
CREATE TABLE IF NOT EXISTS landing_page_token (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token TEXT UNIQUE NOT NULL,
  tracking_url TEXT NOT NULL,  -- Full URL: https://studio.vercel.app/r/{token}
  
  -- Core relationships (using your existing tables)
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE NOT NULL,
  campaign_id UUID REFERENCES sl_campaigns(id) ON DELETE CASCADE NOT NULL,
  landing_page_id UUID REFERENCES landing_pages(id) ON DELETE SET NULL,
  
  -- Token lifecycle
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '90 days'),
  
  -- Click tracking
  click_count INTEGER DEFAULT 0,
  first_clicked_at TIMESTAMPTZ,
  last_clicked_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_tracking_url ON landing_page_token(tracking_url);
CREATE INDEX IF NOT EXISTS idx_tokens_tokens_token ON landing_page_token(token);
CREATE INDEX IF NOT EXISTS idx_tokens_contact ON landing_page_token(contact_id);
CREATE INDEX IF NOT EXISTS idx_tokens_campaign ON landing_page_token(campaign_id);
CREATE INDEX IF NOT EXISTS idx_tokens_landing_page ON landing_page_token(landing_page_id);
CREATE INDEX IF NOT EXISTS idx_tokens_expires ON landing_page_token(expires_at);

-- Prevent duplicate tokens per contact/campaign
CREATE UNIQUE INDEX IF NOT EXISTS idx_tokens_contact_campaign 
  ON landing_page_token(contact_id, campaign_id);

-- ============================================
-- TABLE 2: landing_page_visitors
-- ============================================
-- Purpose: Track unique visitors (identified and anonymous)
-- Links to contacts when attribution is known
CREATE TABLE IF NOT EXISTS landing_page_visitors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  visitor_id TEXT UNIQUE NOT NULL,  -- e.g., v_xyz789
  
  -- Contact attribution (set when identified via token)
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  
  -- Visitor metadata
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  total_page_views INTEGER DEFAULT 0,
  total_events INTEGER DEFAULT 0,
  
  -- Optional identification data
  email TEXT,
  name TEXT,
  company TEXT,
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_visitors_visitor_id ON landing_page_visitors(visitor_id);
CREATE INDEX IF NOT EXISTS idx_visitors_contact ON landing_page_visitors(contact_id);
CREATE INDEX IF NOT EXISTS idx_visitors_email ON landing_page_visitors(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_visitors_last_seen ON landing_page_visitors(last_seen_at DESC);

-- ============================================
-- TABLE 3: landing_page_events
-- ============================================
-- Purpose: Store ALL visitor events (clicks, views, scrolls, etc.)
-- Renamed to avoid confusion with other event tables
CREATE TABLE IF NOT EXISTS landing_page_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Event identification
  event_type TEXT NOT NULL,  -- email_click, page_view, cta_click, scroll_depth, etc.
  visitor_id TEXT NOT NULL,
  session_id TEXT,
  
  -- Contact attribution (if known)
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  full_name TEXT,  -- Denormalized from contacts table for query performance
  campaign_id UUID REFERENCES sl_campaigns(id) ON DELETE SET NULL,
  
  -- Landing page reference
  landing_page_id UUID REFERENCES landing_pages(id) ON DELETE SET NULL,
  landing_page_slug TEXT,  -- Denormalized for queries
  
  -- Attribution tracking
  attribution_source TEXT,  -- email_redirect, url_param, cookie, localStorage
  attribution_confidence DECIMAL(3,2),  -- 0.30 to 1.00
  
  -- Event metadata
  user_agent TEXT,
  screen_resolution TEXT,
  viewport_size TEXT,
  referrer TEXT,
  ip_subnet TEXT,  -- Only store subnet for privacy (e.g., 192.168.1.xxx)
  
  -- Event-specific data (flexible JSON)
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  event_timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for landing_page_events (CRITICAL for performance)
CREATE INDEX IF NOT EXISTS idx_tracking_events_visitor ON landing_page_events(visitor_id);
CREATE INDEX IF NOT EXISTS idx_tracking_events_contact ON landing_page_events(contact_id);
CREATE INDEX IF NOT EXISTS idx_tracking_events_full_name ON landing_page_events(full_name) WHERE full_name IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tracking_events_campaign ON landing_page_events(campaign_id);
CREATE INDEX IF NOT EXISTS idx_tracking_events_landing_page ON landing_page_events(landing_page_id);
CREATE INDEX IF NOT EXISTS idx_tracking_events_type ON landing_page_events(event_type);
CREATE INDEX IF NOT EXISTS idx_tracking_events_timestamp ON landing_page_events(event_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_tracking_events_session ON landing_page_events(session_id);

-- Composite index for common query: events by contact + campaign
CREATE INDEX IF NOT EXISTS idx_tracking_events_contact_campaign 
  ON landing_page_events(contact_id, campaign_id, event_timestamp DESC);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Note: update_updated_at_column() function already exists
-- Triggers for contacts and sl_campaigns already exist
-- No additional triggers needed for landing_page_token, landing_page_visitors, or landing_page_events

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE landing_page_token IS 'Unique tracking tokens for personalized landing page links (integrates with contacts, sl_campaigns, landing_pages)';
COMMENT ON TABLE landing_page_visitors IS 'Unique visitor tracking with optional contact attribution';
COMMENT ON TABLE landing_page_events IS 'All visitor events (page views, clicks, scrolls, etc.) with campaign attribution';

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

-- Verify tables exist
DO $$
DECLARE
    new_table_count INTEGER;
BEGIN
    -- Check new tables (landing_page_token, landing_page_visitors, landing_page_events)
    SELECT COUNT(*) INTO new_table_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN ('landing_page_token', 'landing_page_visitors', 'landing_page_events');
    
    IF new_table_count = 3 THEN
        RAISE NOTICE '✅ Migration 002 complete!';
        RAISE NOTICE '   - Created 3 new tables: landing_page_token, landing_page_visitors, landing_page_events';
        RAISE NOTICE '   - Integrated with existing: contacts, sl_campaigns, landing_pages';
    ELSE
        RAISE EXCEPTION '❌ Migration 002 incomplete: Found % tables', new_table_count;
    END IF;
END $$;
-- End of Migration 002