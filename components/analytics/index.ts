/**
 * Analytics Module Exports
 * 
 * Central export point for all analytics components and utilities.
 */

// Provider and hooks
export { 
  AnalyticsProvider, 
  usePostHogSafe, 
  usePostHog, 
  captureEvent 
} from './AnalyticsProvider';

// Context helpers (we'll add more exports as we build other modules)
export type { 
  TenantContext, 
  AnalyticsContext, 
  PageProps 
} from '../../lib/analytics/context';

export { 
  buildTenantContext, 
  extractTenantFromSlug, 
  isValidTenantContext, 
  sanitizeAnalyticsProps 
} from '../../lib/analytics/context';