/**
 * CONTEXT FOR COPILOT — PART B (Multi-Tenant)
 * - One repo + one Vercel project. Supabase stores published pages.
 * - Public route renders from page_content.normalized for a given key.
 * - We use On-Demand ISR: cache tags like `landing:${slug}` (or namespaced variants).
 * - Studio Publish is a server action: validate → normalize → compute contentSha → upsert → revalidate → return url.
 * - Idempotency: if same contentSha for the key, no write or revalidate.
 * - Security: secrets are server-only; revalidate requires a secret header.
 * - No versioning now; re-publish overwrites the slug. Rollback by re-publishing old JSON.
 */

import { createClient } from '@supabase/supabase-js';

/**
 * Server-side Supabase client with service role key
 * DO NOT expose this client to the browser
 * Used for:
 * - Publishing from Studio (server action)
 * - Fetching published pages (server component)
 * - Administrative operations
 */

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE;

if (!supabaseUrl) {
  throw new Error(
    'SUPABASE_URL is not defined. Add it to your .env.local or Vercel env vars.'
  );
}

if (!supabaseServiceRole) {
  throw new Error(
    'SUPABASE_SERVICE_ROLE is not defined. Add it to your .env.local or Vercel env vars.'
  );
}

/**
 * Supabase client with service role permissions
 * Bypasses Row Level Security (RLS) - use with caution
 */
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRole, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Type-safe database types for landing_pages table
 */
export interface LandingPageRow {
  id?: string;
  page_url_key: string;
  status: 'draft' | 'published' | 'archived';
  page_content: {
    normalized: any; // NormalizedContent from Part A
    original?: any; // Optional: store raw JSON for rollback
  };
  content_sha: string;
  buyer_id?: string;
  seller_id?: string;
  mmyy?: string;
  buyer_name?: string;
  seller_name?: string;
  version?: number; // Version number for tracking iterations
  published_at?: string; // ISO 8601 timestamp
  created_at?: string;
  updated_at?: string;
}

/**
 * Type guard to check if content has normalized structure
 */
export function hasNormalizedContent(
  content: any
): content is { normalized: any } {
  return (
    content &&
    typeof content === 'object' &&
    'normalized' in content &&
    content.normalized != null
  );
}
