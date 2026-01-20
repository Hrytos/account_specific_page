/**
 * Centralized type definitions
 */

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
 * Re-export PublishMeta from validation schema (single source of truth)
 */
export type { PublishMeta } from '@/lib/validation/publishMeta';
