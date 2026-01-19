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
 * Publish metadata for landing pages
 */
export interface PublishMeta {
  page_url_key: string;
  subdomain: string;
  campaign_id?: string | null;
  buyer_id: string;
  seller_id: string;
  mmyy: string;
}
