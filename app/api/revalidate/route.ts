/**
 * CONTEXT FOR COPILOT — PART B (Multi-Tenant)
 * Revalidate API - On-Demand ISR endpoint
 * 
 * - Accepts POST requests to revalidate specific landing pages
 * - Requires secret header for security
 * - Uses revalidateTag() to invalidate only the changed page
 * - Returns { ok: true } on success, { ok: false, error } on failure
 * 
 * Security:
 * - REVALIDATE_SECRET must be present in environment variables
 * - Header 'x-revalidate-secret' must match the secret
 * - Returns 401 Unauthorized if secret is missing or incorrect
 * 
 * Usage:
 * POST /api/revalidate
 * Headers: { 'x-revalidate-secret': '<secret>', 'content-type': 'application/json' }
 * Body: { "slug": "adient-cyngn-1025" }
 */

import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getLandingCacheTag } from '@/lib/db/publishedLanding';

/**
 * Request body schema validation
 * Ensures slug is a non-empty string matching our slug pattern
 */
const RevalidateRequestSchema = z.object({
  slug: z
    .string()
    .min(1, 'Slug cannot be empty')
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Slug must contain only lowercase letters, numbers, and hyphens'
    )
    .max(100, 'Slug cannot exceed 100 characters'),
});

type RevalidateRequest = z.infer<typeof RevalidateRequestSchema>;

/**
 * POST /api/revalidate
 * Revalidates a specific landing page cache
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // 1. Validate secret header
    const secret = request.headers.get('x-revalidate-secret');
    const expectedSecret = process.env.REVALIDATE_SECRET;

    if (!expectedSecret) {
      console.error('[Revalidate API] REVALIDATE_SECRET not configured');
      return NextResponse.json(
        {
          ok: false,
          error: 'Server configuration error',
          message: 'Revalidation service is not properly configured',
        },
        { status: 500 }
      );
    }

    if (!secret) {
      console.warn('[Revalidate API] Missing secret header');
      return NextResponse.json(
        {
          ok: false,
          error: 'Unauthorized',
          message: 'Missing x-revalidate-secret header',
        },
        { status: 401 }
      );
    }

    if (secret !== expectedSecret) {
      console.warn('[Revalidate API] Invalid secret provided');
      return NextResponse.json(
        {
          ok: false,
          error: 'Unauthorized',
          message: 'Invalid revalidation secret',
        },
        { status: 401 }
      );
    }

    // 2. Parse and validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch (err) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Invalid JSON',
          message: 'Request body must be valid JSON',
        },
        { status: 400 }
      );
    }

    const validationResult = RevalidateRequestSchema.safeParse(body);
    
    if (!validationResult.success) {
      const errors = validationResult.error.issues
        .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
        .join(', ');
      
      return NextResponse.json(
        {
          ok: false,
          error: 'Validation failed',
          message: errors,
        },
        { status: 400 }
      );
    }

    const { slug } = validationResult.data;

    // 3. Revalidate the landing page path
    const pagePath = `/p/${slug}`;
    const cacheTag = getLandingCacheTag(slug);
    
    try {
      revalidatePath(pagePath);
      
      const duration = Date.now() - startTime;

      return NextResponse.json(
        {
          ok: true,
          slug,
          path: pagePath,
          cacheTag,
          message: `Successfully revalidated landing page: ${slug}`,
          duration: `${duration}ms`,
        },
        { status: 200 }
      );
    } catch (revalidateError) {
      console.error('[Revalidate API] Revalidation failed:', {
        slug,
        path: pagePath,
        cacheTag,
        error: revalidateError,
      });

      return NextResponse.json(
        {
          ok: false,
          error: 'Revalidation failed',
          message:
            revalidateError instanceof Error
              ? revalidateError.message
              : 'Unknown error during cache revalidation',
        },
        { status: 500 }
      );
    }
  } catch (err) {
    const duration = Date.now() - startTime;
    
    console.error('[Revalidate API] Unexpected error:', {
      error: err,
      duration: `${duration}ms`,
    });

    return NextResponse.json(
      {
        ok: false,
        error: 'Internal server error',
        message: 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/revalidate
 * Return API documentation
 */
export async function GET() {
  return NextResponse.json(
    {
      name: 'Revalidate API',
      description: 'On-Demand ISR endpoint for invalidating landing page caches',
      version: '1.0.0',
      usage: {
        method: 'POST',
        endpoint: '/api/revalidate',
        headers: {
          'content-type': 'application/json',
          'x-revalidate-secret': '<your-secret-from-env>',
        },
        body: {
          slug: 'adient-cyngn-1025',
        },
        example: {
          curl: `curl -X POST https://your-domain.com/api/revalidate \\
  -H "content-type: application/json" \\
  -H "x-revalidate-secret: your-secret" \\
  -d '{"slug":"adient-cyngn-1025"}'`,
        },
      },
      responses: {
        200: { ok: true, slug: 'adient-cyngn-1025', message: 'Success' },
        400: { ok: false, error: 'Validation failed', message: '...' },
        401: { ok: false, error: 'Unauthorized', message: '...' },
        500: { ok: false, error: 'Internal server error', message: '...' },
      },
    },
    { status: 200 }
  );
}

/**
 * OPTIONS /api/revalidate
 * CORS preflight support
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'content-type, x-revalidate-secret',
    },
  });
}
