'use client';

/**
 * PostHog Analytics Provider
 * 
 * Client component that initializes PostHog with environment configuration,
 * manages consent flows, and provides tenant context registration.
 * Safe for SSR with proper client-side guards.
 */

import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import posthog from 'posthog-js';
import type { AnalyticsContext } from '../../lib/analytics/context';

// PostHog instance interface
interface PostHogInstance {
  capture: (event: string, properties?: Record<string, any>) => void;
  register: (properties: Record<string, any>) => void;
  group: (groupType: string, groupKey: string, groupProperties?: Record<string, any>) => void;
  identify: (distinctId: string, properties?: Record<string, any>) => void;
  startSessionRecording: () => void;
  stopSessionRecording: () => void;
  opt_out_capturing: () => void;
  opt_in_capturing: () => void;
  has_opted_out_capturing: () => boolean;
}

// Analytics context interface
interface AnalyticsContextType {
  posthog: PostHogInstance | null;
  isInitialized: boolean;
  isTracking: boolean;
  startTracking: () => void;
  stopTracking: () => void;
  registerContext: (context: AnalyticsContext) => void;
}

// Create context with safe defaults
const AnalyticsContext = createContext<AnalyticsContextType>({
  posthog: null,
  isInitialized: false,
  isTracking: false,
  startTracking: () => {},
  stopTracking: () => {},
  registerContext: () => {},
});

// Provider props
interface AnalyticsProviderProps {
  children: ReactNode;
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const initializeRef = useRef(false);
  const currentContext = useRef<AnalyticsContext | null>(null);

  // Initialize PostHog on client-side mount
  useEffect(() => {
    // Prevent double initialization
    if (initializeRef.current || typeof window === 'undefined') return;
    initializeRef.current = true;

    const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;

    if (!posthogKey) {
      console.warn('NEXT_PUBLIC_POSTHOG_KEY not found. Analytics disabled.');
      return;
    }

    try {
      // Get current domain for multi-tenant support
      const currentDomain = window.location.hostname;
      const isDevelopment = currentDomain === 'localhost' || currentDomain.includes('localhost');
      
      console.log(`[Analytics] Initializing for domain: ${currentDomain} (dev: ${isDevelopment})`);

      // Initialize PostHog with explicit Web Analytics configuration
      posthog.init(posthogKey, {
        api_host: posthogHost || 'https://us.posthog.com',
        person_profiles: 'identified_only', // Required for newer versions
        autocapture: true,
        capture_pageview: true, // CRITICAL: Enable automatic $pageview events
        capture_pageleave: true, // CRITICAL: Enable automatic $pageleave events
        session_recording: {
          maskAllInputs: true,
        },
        disable_session_recording: false,
        // Multi-tenant domain tracking
        cross_subdomain_cookie: false, // Each domain gets separate tracking
        persistence: 'localStorage', // Use localStorage for multi-domain
        // Development settings
        loaded: (posthog) => {
          console.log(`[Analytics] PostHog loaded successfully for ${currentDomain}`);
          console.log(`[Analytics] PostHog distinct_id: ${posthog.get_distinct_id()}`);
          setIsInitialized(true);
          
          // Start tracking by default (can be changed for consent)
          setIsTracking(true);

          // Send initial test event to verify connection
          posthog.capture('analytics_provider_loaded', {
            domain: currentDomain,
            is_development: isDevelopment,
            loaded_at: new Date().toISOString()
          });
          
          // FORCE a pageview event for Web Analytics
          posthog.capture('$pageview', {
            $current_url: window.location.href,
            $title: document.title,
            domain: currentDomain,
            is_development: isDevelopment
          });
          
          console.log('[Analytics] Initial test event and pageview sent');
        },
      });

      // Set device and browser context
      if (typeof window !== 'undefined') {
        posthog.register({
          $current_url: window.location.href,
          $referrer: document.referrer,
          user_agent: navigator.userAgent,
        });
        
        // Make PostHog available on window for debugging
        (window as any).posthog = posthog;
        console.log('PostHog attached to window object');
      }

    } catch (error) {
      console.error('Failed to initialize PostHog:', error);
    }
  }, []);

  // Start tracking function
  const startTracking = () => {
    if (typeof window === 'undefined' || !isInitialized) return;
    
    try {
      posthog.opt_in_capturing();
      posthog.startSessionRecording();
      setIsTracking(true);
      console.log('Analytics tracking started');
    } catch (error) {
      console.error('Failed to start tracking:', error);
    }
  };

  // Stop tracking function
  const stopTracking = () => {
    if (typeof window === 'undefined' || !isInitialized) return;
    
    try {
      posthog.opt_out_capturing();
      posthog.stopSessionRecording();
      setIsTracking(false);
      console.log('Analytics tracking stopped');
    } catch (error) {
      console.error('Failed to stop tracking:', error);
    }
  };

  // Register tenant context and group analytics
  const registerContext = (context: AnalyticsContext) => {
    if (typeof window === 'undefined' || !isInitialized || !isTracking) return;
    
    try {
      // Store current context
      currentContext.current = context;
      
      // Register super properties (attached to all events)
      posthog.register({
        buyer_id: context.buyer_id,
        seller_id: context.seller_id,
        page_url_key: context.page_url_key,
        content_sha: context.content_sha,
        host: context.host,
        route_scheme: context.route_scheme,
        device_type: context.device_type,
        viewport_w: context.viewport_w,
        viewport_h: context.viewport_h,
      });

      // Set up group analytics for buyer segmentation
      if (context.buyer_id) {
        posthog.group('buyer', context.buyer_id, {
          buyer_id: context.buyer_id,
          // Add any buyer-specific properties here
        });
      }

      console.log('Analytics context registered:', context);
    } catch (error) {
      console.error('Failed to register analytics context:', error);
    }
  };

  // Context value
  const value: AnalyticsContextType = {
    posthog: typeof window !== 'undefined' && isInitialized ? posthog : null,
    isInitialized,
    isTracking,
    startTracking,
    stopTracking,
    registerContext,
  };

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
}

/**
 * Safe hook to access PostHog - returns null on server
 */
export function usePostHogSafe() {
  const context = useContext(AnalyticsContext);
  
  // Return safe no-op functions on server
  if (typeof window === 'undefined') {
    return {
      posthog: null,
      isInitialized: false,
      isTracking: false,
      startTracking: () => {},
      stopTracking: () => {},
      registerContext: () => {},
    };
  }
  
  return context;
}

/**
 * Hook for components that need PostHog access
 */
export function usePostHog() {
  const { posthog } = usePostHogSafe();
  return posthog;
}

/**
 * Utility to capture events safely
 */
export function captureEvent(event: string, properties?: Record<string, any>) {
  if (typeof window === 'undefined') return;
  
  try {
    posthog.capture(event, properties);
  } catch (error) {
    console.error('Failed to capture event:', error);
  }
}