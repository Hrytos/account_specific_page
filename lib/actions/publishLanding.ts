/**
 * CONTEXT FOR COPILOT — PART B (Multi-Tenant)
 * - One repo + one Vercel project. Supabase stores published pages.
 * - Studio Publish is a server action: validate → normalize → compute contentSha → upsert → revalidate → return url.
 * - Idempotency: if same contentSha for the key, no write or revalidate.
 * - Security: secrets are server-only; revalidate requires a secret header.
 * - No versioning now; re-publish overwrites the slug. Rollback by re-publishing old JSON.
 */

'use server';

import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/db/supabase';
import { validateAndNormalize } from '@/lib/validate';
import { computeContentSha } from '@/lib/util/hash';
import { validatePublishMeta, type PublishMeta } from '@/lib/validate/publishMeta';
import { authorizeLandingPageUrl } from '@/lib/analytics/domainAuthorization';

/**
 * In-memory throttle to prevent rapid re-publishes of the same slug
 * Map: slug → timestamp of last publish
 * 
 * NOTE: In a multi-instance deployment (horizontal scaling), this throttle
 * is per-instance. For production, consider using Redis or similar.
 */
const publishThrottle = new Map<string, number>();
const THROTTLE_WINDOW_MS = 15_000; // 15 seconds
const THROTTLE_CLEANUP_MS = 60_000; // Clean up after 1 minute

// Clean up throttle map periodically to prevent memory leaks
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [slug, timestamp] of publishThrottle.entries()) {
      if (now - timestamp > THROTTLE_CLEANUP_MS) {
        publishThrottle.delete(slug);
      }
    }
  }, THROTTLE_CLEANUP_MS);
}

/**
 * Result of a publish operation
 */
export interface PublishResult {
  ok: boolean;
  url?: string;
  contentSha?: string;
  changed?: boolean;
  error?: string;
  validationErrors?: Array<{ path: string; message: string }>;
}

/**
 * Check if a slug is currently throttled
 */
function isThrottled(slug: string): boolean {
  const lastPublish = publishThrottle.get(slug);
  if (!lastPublish) return false;
  
  const elapsed = Date.now() - lastPublish;
  return elapsed < THROTTLE_WINDOW_MS;
}

/**
 * Update throttle timestamp for a slug
 */
function updateThrottle(slug: string): void {
  publishThrottle.set(slug, Date.now());
}

/**
 * Server action to publish a landing page
 * 
 * Flow:
 * 1. Validate STUDIO_PUBLISH_SECRET
 * 2. Validate publish metadata (slug, buyer_id, seller_id, mmyy)
 * 3. Validate and normalize raw JSON using Part A logic
 * 4. Compute content SHA-256 hash
 * 5. Check idempotency: if same contentSha exists, return early
 * 6. Upsert to Supabase landing_pages table
 * 7. Call /api/revalidate to invalidate cache
 * 8. Return live URL
 * 
 * @param rawJson - Raw landing page JSON to validate and publish
 * @param meta - Publish metadata (slug, buyer_id, seller_id, mmyy)
 * @param secret - Studio publish secret for authorization
 * @returns PublishResult with url, contentSha, and changed flag
 * 
 * @example
 * const result = await publishLanding(
 *   { hero: { headline: "...", ... }, ... },
 *   { page_url_key: "adient-cyngn-1025", buyer_id: "adient", seller_id: "cyngn", mmyy: "1025" },
 *   process.env.STUDIO_PUBLISH_SECRET
 * );
 */
export async function publishLanding(
  rawJson: unknown,
  meta: unknown,
  secret?: string
): Promise<PublishResult> {
  const startTime = Date.now();
  
  try {
    // Input validation: Check for null/undefined
    if (rawJson === null || rawJson === undefined) {
      return {
        ok: false,
        error: 'Content is required',
      };
    }
    
    if (meta === null || meta === undefined) {
      return {
        ok: false,
        error: 'Metadata is required',
      };
    }
    
    // 1. Validate secret
    const expectedSecret = process.env.STUDIO_PUBLISH_SECRET;
    if (!expectedSecret) {
      console.error('[publishLanding] STUDIO_PUBLISH_SECRET not configured');
      return {
        ok: false,
        error: 'Server configuration error: STUDIO_PUBLISH_SECRET not set',
      };
    }
    
    // Timing-safe secret comparison to prevent timing attacks
    if (!secret || secret.length !== expectedSecret.length) {
      console.warn('[publishLanding] Invalid secret provided');
      return {
        ok: false,
        error: 'Unauthorized: Invalid publish secret',
      };
    }
    
    // Use crypto.timingSafeEqual for constant-time comparison
    const secretBuffer = Buffer.from(secret);
    const expectedBuffer = Buffer.from(expectedSecret);
    
    let isSecretValid = false;
    try {
      isSecretValid = crypto.timingSafeEqual(secretBuffer, expectedBuffer);
    } catch {
      // Buffers of different lengths will throw
      isSecretValid = false;
    }
    
    if (!isSecretValid) {
      console.warn('[publishLanding] Invalid secret provided');
      return {
        ok: false,
        error: 'Unauthorized: Invalid publish secret',
      };
    }
    
    // 2. Validate metadata
    const metaResult = validatePublishMeta(meta);
    if (!metaResult.success) {
      console.warn('[publishLanding] Invalid metadata', {
        issues: metaResult.error.issues,
      });
      
      return {
        ok: false,
        error: 'Invalid publish metadata',
        validationErrors: metaResult.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      };
    }
    
    const validMeta = metaResult.data as PublishMeta;
    const slug = validMeta.page_url_key;
    
    // 3. Check throttle
    if (isThrottled(slug)) {
      const remaining = THROTTLE_WINDOW_MS - (Date.now() - (publishThrottle.get(slug) || 0));
      console.warn('[publishLanding] Throttled', { slug, remainingMs: remaining });
      
      return {
        ok: false,
        error: `Please wait ${Math.ceil(remaining / 1000)} seconds before publishing again`,
      };
    }
    
    // 4. Validate and normalize content using Part A logic
    const validationResult = await validateAndNormalize(rawJson);
    if (!validationResult.isValid || !validationResult.normalized) {
      console.warn('[publishLanding] Content validation failed', {
        slug,
        errors: validationResult.errors,
      });
      
      return {
        ok: false,
        error: 'Content validation failed',
        validationErrors: validationResult.errors?.map((err) => ({
          path: err.field || 'unknown',
          message: err.message,
        })),
      };
    }
    
    const normalized = validationResult.normalized;
    
    // 5. Compute content SHA
    const contentSha = computeContentSha(normalized);
    
    // 6. Check idempotency: query existing row
    const { data: existingRow, error: queryError } = await supabaseAdmin
      .from('landing_pages')
      .select('content_sha, published_at')
      .eq('page_url_key', slug)
      .eq('status', 'published')
      .maybeSingle();
    
    if (queryError) {
      console.error('[publishLanding] Database query error', {
        slug,
        error: queryError,
      });
      
      return {
        ok: false,
        error: 'Database error during idempotency check',
      };
    }
    
    // If same contentSha exists, return early (no-op)
    if (existingRow && existingRow.content_sha === contentSha) {
      const duration = Date.now() - startTime;
      console.info('[publishLanding] Idempotent publish (no changes)', {
        slug,
        contentSha,
        duration,
      });
      
      const url = `${process.env.NEXT_PUBLIC_SITE_URL}/p/${slug}`;
      return {
        ok: true,
        url,
        contentSha,
        changed: false,
      };
    }
    
    // 7. Upsert to landing_pages table
    const now = new Date().toISOString();
    const { error: upsertError } = await supabaseAdmin
      .from('landing_pages')
      .upsert(
        {
          page_url_key: slug,
          status: 'published',
          page_content: { normalized }, // Store under 'normalized' key
          content_sha: contentSha,
          buyer_id: validMeta.buyer_id,
          seller_id: validMeta.seller_id,
          mmyy: validMeta.mmyy,
          buyer_name: validMeta.buyer_name || validMeta.buyer_id,
          seller_name: validMeta.seller_name || validMeta.seller_id,
          published_at: now,
          version: 1, // Default version number
        },
        {
          onConflict: 'page_url_key',
        }
      );
    
    if (upsertError) {
      console.error('[publishLanding] Database upsert error', {
        slug,
        error: upsertError,
        errorMessage: upsertError.message,
        errorDetails: upsertError.details,
        errorHint: upsertError.hint,
        errorCode: upsertError.code,
      });
      
      return {
        ok: false,
        error: `Failed to save to database: ${upsertError.message}`,
      };
    }
    
    // 8. Call revalidate API to invalidate cache
    try {
      const revalidateSecret = process.env.REVALIDATE_SECRET;
      if (!revalidateSecret) {
        console.error('[publishLanding] REVALIDATE_SECRET not configured');
        // Don't fail publish, just log warning
        console.warn('[publishLanding] Skipping cache revalidation due to missing secret');
      } else {
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
        const revalidateUrl = `${baseUrl}/api/revalidate`;
        
        // Add timeout to prevent hanging
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        try {
          const response = await fetch(revalidateUrl, {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
              'x-revalidate-secret': revalidateSecret,
            },
            body: JSON.stringify({ slug }),
            signal: controller.signal,
          });
          
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error('[publishLanding] Revalidate API error', {
              slug,
              status: response.status,
              error: errorText,
            });
            
            // Don't fail the publish if revalidate fails
            // The page is published, just cache isn't invalidated
            console.warn('[publishLanding] Published but cache not invalidated', { slug });
          } else {
            console.info('[publishLanding] Cache revalidated', { slug });
          }
        } catch (fetchError) {
          clearTimeout(timeoutId);
          if ((fetchError as Error).name === 'AbortError') {
            console.warn('[publishLanding] Revalidate request timed out', { slug });
          } else {
            throw fetchError;
          }
        }
      }
    } catch (revalidateError) {
      console.error('[publishLanding] Revalidate request failed', {
        slug,
        error: revalidateError,
      });
      // Don't fail the publish
    }
    
    // 9. Update throttle and return success
    updateThrottle(slug);
    
    const duration = Date.now() - startTime;
    const url = `${process.env.NEXT_PUBLIC_SITE_URL}/p/${slug}`;
    
    // 10. Automatically authorize the published landing page URL for PostHog analytics
    try {
      const authorized = await authorizeLandingPageUrl(slug);
      if (authorized) {
        console.info('[publishLanding] Landing page URL authorized for analytics', { slug, url });
      } else {
        console.warn('[publishLanding] Failed to authorize landing page URL for analytics', { slug, url });
      }
    } catch (authError) {
      console.error('[publishLanding] Analytics domain authorization error', {
        slug,
        url,
        error: authError,
      });
      // Don't fail the publish for authorization errors
    }
    
    console.info('[publishLanding] Published successfully', {
      slug,
      contentSha,
      changed: true,
      duration,
    });
    
    return {
      ok: true,
      url,
      contentSha,
      changed: true,
    };
    
  } catch (error) {
    const duration = Date.now() - startTime;
    
    // Safe error logging - don't expose sensitive details to client
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorName = error instanceof Error ? error.name : 'Error';
    
    console.error('[publishLanding] Unexpected error', {
      errorName,
      errorMessage,
      duration,
      // Don't log the full error object in production (may contain sensitive data)
      stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined,
    });
    
    return {
      ok: false,
      error: process.env.NODE_ENV === 'development' 
        ? `Unexpected error: ${errorMessage}`
        : 'An unexpected error occurred during publish. Please try again.',
    };
  }
}
