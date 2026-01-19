'use client';

/**
 * Analytics Hooks for Public Page Instrumentation
 * 
 * Comprehensive behavioral tracking hooks for landing pages including
 * visits, scrolling, hovering, idle detection, and CTA click tracking.
 * All events automatically include tenant context from AnalyticsProvider.
 */

import { useEffect, useRef, useCallback } from 'react';
import { captureEvent } from '../../components/analytics/AnalyticsProvider';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface CtaClickParams {
  id: 'book_meeting' | 'read_case_study' | 'visit_website';
  location: 'hero' | 'proof_section' | 'seller_section' | 'footer' | 'social_list';
  href: string;
  linkType: 'external' | 'internal';
}

// ============================================================================
// VISIT/LEAVE TRACKING
// ============================================================================

/**
 * Track page visits and departures with time on page calculation
 */
export function useVisitLeave() {
  const visitStartTime = useRef<number | null>(null);
  const hasVisitFired = useRef(false);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    // Record visit start time and fire visit event
    visitStartTime.current = Date.now();
    
    if (!hasVisitFired.current) {
      console.log('[useVisitLeave] Firing visit events for landing page');
      
      // Send both our custom event AND PostHog's expected pageview
      captureEvent('$pageview', {
        $current_url: window.location.href,
        $title: document.title,
        referrer: document.referrer || undefined,
        user_agent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      });
      
      // Also send our custom landing_visit event
      captureEvent('landing_visit', {
        referrer: document.referrer || undefined,
        user_agent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      });
      hasVisitFired.current = true;
      console.log('[useVisitLeave] Visit events sent successfully');
    }

    // Handle page leave (unload, visibility change)
    const handleLeave = () => {
      if (visitStartTime.current) {
        const timeOnPage = Date.now() - visitStartTime.current;
        
        // Send both PostHog's expected event AND our custom event
        captureEvent('$pageleave', {
          $current_url: window.location.href,
          $title: document.title,
          time_on_page_ms: timeOnPage,
          timestamp: new Date().toISOString(),
        });
        
        captureEvent('landing_leave', {
          time_on_page_ms: timeOnPage,
          timestamp: new Date().toISOString(),
        });
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        handleLeave();
      }
    };

    // Event listeners for leave detection
    window.addEventListener('beforeunload', handleLeave);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleLeave);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      // Fire leave event on cleanup if we haven't already
      if (visitStartTime.current && document.visibilityState === 'visible') {
        handleLeave();
      }
    };
  }, []);
}

// ============================================================================
// SCROLL DEPTH TRACKING
// ============================================================================

/**
 * Track scroll depth at 25%, 50%, 75%, and 100% thresholds
 * Fires each threshold only once per page visit
 */
export function useScrollDepth() {
  const thresholdsFired = useRef(new Set<number>());
  const throttleTimer = useRef<NodeJS.Timeout | null>(null);

  const handleScroll = useCallback(() => {
    if (typeof window === 'undefined') return;

    // Throttle scroll events to every 100ms
    if (throttleTimer.current) return;
    
    throttleTimer.current = setTimeout(() => {
      throttleTimer.current = null;
      
      const scrollTop = window.scrollY;
      const documentHeight = document.documentElement.scrollHeight;
      const windowHeight = window.innerHeight;
      const maxScroll = documentHeight - windowHeight;
      
      if (maxScroll <= 0) return; // Handle edge case where content fits in viewport
      
      const scrollPercent = Math.min(100, (scrollTop / maxScroll) * 100);
      
      // Check thresholds: 25%, 50%, 75%, 100%
      const thresholds = [25, 50, 75, 100];
      
      for (const threshold of thresholds) {
        if (scrollPercent >= threshold && !thresholdsFired.current.has(threshold)) {
          thresholdsFired.current.add(threshold);
          
          captureEvent('scroll_depth', {
            depth_pct: threshold,
            depth_px: scrollTop,
            max_scroll_px: maxScroll,
            document_height: documentHeight,
            timestamp: new Date().toISOString(),
          });
        }
      }
    }, 100);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Fire initial scroll event in case user is already scrolled
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (throttleTimer.current) {
        clearTimeout(throttleTimer.current);
      }
    };
  }, [handleScroll]);
}

// ============================================================================
// HOVER TELEMETRY
// ============================================================================

/**
 * Track meaningful hover events on components (500ms+ duration)
 */
export function useHoverTelemetry(componentId: string, section: string, minHoverMs: number = 500) {
  const hoverStartTime = useRef<number | null>(null);
  const hoverTimer = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = useCallback(() => {
    hoverStartTime.current = Date.now();
    
    // Set timer for minimum hover duration
    hoverTimer.current = setTimeout(() => {
      if (hoverStartTime.current) {
        const hoverDuration = Date.now() - hoverStartTime.current;
        
        captureEvent('hover_component', {
          component_id: componentId,
          section: section,
          hover_ms: hoverDuration,
          timestamp: new Date().toISOString(),
        });
      }
    }, minHoverMs);
  }, [componentId, section, minHoverMs]);

  const handleMouseLeave = useCallback(() => {
    // Clear timer if user leaves before minimum duration
    if (hoverTimer.current) {
      clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
    hoverStartTime.current = null;
  }, []);

  // Return event handlers for components to use
  return {
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
  };
}

// ============================================================================
// IDLE DETECTION
// ============================================================================

/**
 * Track user idle periods (30s+ of inactivity)
 */
export function useIdle(timeoutMs: number = 30000) {
  const idleTimer = useRef<NodeJS.Timeout | null>(null);
  const idleStartTime = useRef<number | null>(null);
  const isIdle = useRef(false);

  const resetIdleTimer = useCallback(() => {
    // If we were idle, fire idle_end event
    if (isIdle.current && idleStartTime.current) {
      const idleDuration = Date.now() - idleStartTime.current;
      captureEvent('user_idle_end', {
        idle_ms: idleDuration,
        timestamp: new Date().toISOString(),
      });
      isIdle.current = false;
      idleStartTime.current = null;
    }

    // Clear existing timer
    if (idleTimer.current) {
      clearTimeout(idleTimer.current);
    }

    // Set new idle timer
    idleTimer.current = setTimeout(() => {
      if (!isIdle.current) {
        isIdle.current = true;
        idleStartTime.current = Date.now();
        
        captureEvent('user_idle_start', {
          timeout_ms: timeoutMs,
          timestamp: new Date().toISOString(),
        });
      }
    }, timeoutMs);
  }, [timeoutMs]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Events that indicate user activity
    const activityEvents = [
      'mousedown',
      'mousemove', 
      'keypress',
      'scroll',
      'touchstart',
      'click',
    ];

    // Add activity listeners
    activityEvents.forEach(event => {
      document.addEventListener(event, resetIdleTimer, { passive: true });
    });

    // Start the initial timer
    resetIdleTimer();

    return () => {
      // Clean up event listeners
      activityEvents.forEach(event => {
        document.removeEventListener(event, resetIdleTimer);
      });
      
      // Clear timer
      if (idleTimer.current) {
        clearTimeout(idleTimer.current);
      }
    };
  }, [resetIdleTimer]);
}

// ============================================================================
// CTA CLICK TRACKING
// ============================================================================

/**
 * Track CTA clicks with proper categorization and context
 */
export function trackCtaClick(params: CtaClickParams): void {
  captureEvent('cta_click', {
    cta_id: params.id,
    cta_location: params.location,
    href: params.href,
    link_type: params.linkType,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Hook version of CTA click tracking for components
 */
export function useCtaTracking() {
  return { trackCtaClick };
}

// ============================================================================
// VIDEO TRACKING (for future Vimeo integration)
// ============================================================================

/**
 * Track video interactions (play, pause, progress)
 * Currently a placeholder for future Vimeo integration
 */
export function trackVideoEvent(
  action: 'play' | 'pause' | 'progress',
  videoUrl: string,
  progressPct?: number
): void {
  const eventData: any = {
    video_provider: 'vimeo',
    video_url: videoUrl,
    timestamp: new Date().toISOString(),
  };

  if (action === 'progress' && progressPct !== undefined) {
    eventData.pct = progressPct;
  }

  captureEvent(`video_${action}`, eventData);
}

// ============================================================================
// ERROR TRACKING
// ============================================================================

/**
 * Track rendering errors and not found pages
 */
export function trackError(type: 'render_error' | 'not_found', details: Record<string, any>): void {
  captureEvent(type, {
    ...details,
    timestamp: new Date().toISOString(),
  });
}