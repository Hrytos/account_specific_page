# Part C Analytics Decisions

**Date**: November 3, 2025  
**Phase**: C-1 Environment & Decisions  
**Status**: ✅ Configured

---

## PostHog Configuration

### **Region & Host**
- **Selected**: US Cloud (default)
- **PostHog Host**: `https://app.posthog.com` (omitting NEXT_PUBLIC_POSTHOG_HOST env var)
- **Rationale**: Most users are US-based; no specific GDPR requirements for EU hosting

### **Project Setup**
- **Project Name**: Landing Page Studio
- **Client Key**: `phc_jmuFyDM6jh2IZO37rvPa07tGkOrgoVIMmtfjcCEEGUw` ✅
- **Personal API Key**: Configured with Event/Person/Group Write scopes ✅

---

## Consent Strategy

### **Public Landing Pages (`/p/{slug}`)**
- **Model**: **Require explicit consent** before tracking
- **Implementation**: Lightweight consent banner with "Accept" / "No thanks"
- **Storage**: `localStorage('analytics-consent')` → `'accepted'|'rejected'|null`
- **Behavior**: 
  - `null` → Show banner, no tracking
  - `'accepted'` → Start tracking, hide banner
  - `'rejected'` → No tracking, hide banner

### **Studio Interface**
- **Model**: **No consent required** (internal tool)
- **Rationale**: Studio is for sellers creating content, not end-user facing

---

## Session Recording

### **Public Landing Pages**
- **Sampling Rate**: **35%** (balance between insights and performance)
- **Masking**: `maskAllInputs: true` (privacy-first)
- **Additional Masking**: None required (pages are mostly static content)

### **Studio Interface**
- **Sampling Rate**: **0%** (disabled)
- **Rationale**: Studio contains sensitive business data (JSON, secrets)

---

## Tenant Context Strategy

### **Super Properties** (attached to every event)
Every analytics event includes these properties for multi-tenant segmentation:

```typescript
{
  // Tenant Identification
  buyer_id: string,           // Company viewing the page
  seller_id: string,          // Vendor who created the page
  page_url_key: string,       // Specific page slug
  content_sha: string,        // Version fingerprint
  
  // Context
  host: string,               // Request hostname
  route_scheme: "A",          // URL scheme (currently Option A)
  
  // Device/Browser (auto-detected)
  device_type: string,        // mobile/desktop/tablet
  viewport_w: number,         // Viewport width
  viewport_h: number          // Viewport height
}
```

### **Group Analytics**
- **Primary Group**: `group('buyer', buyer_id)`
- **Purpose**: Enable per-company dashboards and funnels
- **Properties**: `{ buyer_name, industry?, company_size? }` (if available)

### **Context Resolution**
- **Source**: Page props from Part B database (`landing_pages` table)
- **Timing**: Registered immediately after PostHog initialization
- **Updates**: Re-register when navigating between pages in same session

---

## Event Taxonomy

### **Lifecycle Events**
- `landing_visit` → `{ referrer?, user_agent? }`
- `landing_leave` → `{ time_on_page_ms }`

### **Engagement Events**
- `scroll_depth` → `{ depth_pct: 25|50|75|100, depth_px }`
- `hover_component` → `{ component_id, section, hover_ms }` (≥500ms)
- `user_idle_start`, `user_idle_end` → `{ idle_ms }` (≥30s)

### **CTA Events** (Most Important)
- `cta_click` → `{`
  - `cta_id: "book_meeting" | "read_case_study" | "visit_website"`
  - `cta_location: "hero" | "proof_section" | "seller_section" | "footer" | "social_list"`
  - `href: string`
  - `link_type: "external" | "internal"`
- `}`

### **Media Events** (Optional)
- `video_play`, `video_pause`, `video_progress` → `{ video_provider: "vimeo", video_url, pct: 25|50|75|100 }`

### **Server Events** (Studio)
- `page_publish_attempt` → `{ slug, buyer_id, content_sha }`
- `page_published` → `{ slug, buyer_id, content_sha, changed: boolean }`
- `page_publish_failed` → `{ slug, buyer_id, error_code }`

---

## Privacy & Compliance

### **PII Protection**
- ❌ **Never send**: emails, phone numbers, names in event properties
- ✅ **OK to send**: company names, page slugs, anonymous behavior data

### **Data Retention**
- **PostHog Default**: 7 years (can be configured lower if needed)
- **Session Recordings**: 30 days (default)

### **Bot Filtering**
- ✅ Enable PostHog's built-in bot detection
- ✅ Filter common crawlers (Google, Bing, etc.)

---

## Implementation Phases

- ✅ **C-1**: Decisions & environment (this document)
- ✅ **C-2**: AnalyticsProvider & context management
- ⏳ **C-3**: Public page instrumentation & hooks
- ⏳ **C-4**: Studio server events (posthog-node)
- ⏳ **C-5**: Consent banner & privacy controls
- ⏳ **C-6**: Dashboards & QA validation

---

## Dependencies

### **Installed Packages** ✅
- `posthog-js@1.284.0` - Client-side analytics
- `posthog-node@5.11.0` - Server-side events

---

## Success Metrics

### **Technical KPIs**
- Event delivery rate > 98%
- Page load impact < 50ms
- Session recording storage < 1GB/month

### **Business KPIs**
- CTA click rates by intent & location
- Time-to-engagement (first scroll/hover)
- Page completion rates (75%+ scroll depth)
- Publish success/failure rates

---

## Environment Variables

### **Required** ✅
```bash
NEXT_PUBLIC_POSTHOG_KEY=phc_jmuFyDM6jh2IZO37rvPa07tGkOrgoVIMmtfjcCEEGUw  # ✅ Configured
POSTHOG_PERSONAL_API_KEY=phx_NpJLSSHvl5exsiIgU4RGHN7vDmtOtEoynl5fXIQqOwSbe6N  # ✅ Configured
```

### **Optional**
```bash
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com  # ✅ Set (US Cloud)
```

---

**Current Status**: Phase C-2 Complete ✅  
**Next Phase**: Implement public page instrumentation hooks (Phase C-3)