/**
 * Analytics Module Exports
 * 
 * Central export point for all analytics functionality including
 * the provider, hooks, and context utilities.
 */

// Provider and core functionality
export { AnalyticsProvider, captureEvent, usePostHogSafe } from '../../components/analytics/AnalyticsProvider';

// Behavioral tracking hooks
export {
  useVisitLeave,
  useScrollDepth,
  useHoverTelemetry,
  useIdle,
  trackCtaClick,
  useCtaTracking,
  trackVideoEvent,
  trackError
} from './hooks';

// Context utilities
export {
  buildTenantContext,
  type TenantContext
} from './context';

// Page wrapper component
export { AnalyticsPageWrapper } from '../../components/analytics/AnalyticsPageWrapper';