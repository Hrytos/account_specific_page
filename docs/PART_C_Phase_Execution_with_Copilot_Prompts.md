
# PART C — Phase Execution Plan (PostHog Analytics, Multi‑Tenant) + Copilot Prompts

This document turns the Part C analytics scope into concrete phases with copy‑pasteable GitHub Copilot prompts. It aligns with Part A (normalized contract) and Part B (multi‑tenant publish, Option A: `/p/{page_url_key}`).

---

## Scope (what we’re adding)
- PostHog web analytics on public pages and Studio.
- Events: **visits, scroll depth, hovers, clicks (segmented), idle/pause**, optional Vimeo progress.
- **Session recording** with masking + sampling.
- **Tenant context** attached to every event: `buyer_id`, `seller_id`, `page_url_key`, `content_sha`, `host`, `route_scheme`.
- Server events for **Publish** lifecycle.

Non‑goals now: BigQuery exports, advanced attribution, ad pixels (can be added later).

---

## Phase C‑1 — Decisions & Environment

**Decide**
- PostHog region/host: default US (`https://app.posthog.com`) or EU (`https://eu.posthog.com`).
- Consent model: start tracking immediately vs. require consent (recommended: require consent on public pages).
- Session recording sampling: 25–50% on public pages; 100% or 0% on Studio (your call).

**Set envs (Vercel)**
- `NEXT_PUBLIC_POSTHOG_KEY`
- `NEXT_PUBLIC_POSTHOG_HOST` (optional; set if using EU)
- `POSTHOG_PERSONAL_API_KEY` (server only; optional, for Node SDK server events)

**Copilot Prompt**
```
You are GitHub Copilot. Create docs/analytics/DECISIONS.md summarizing:
- PostHog host/region
- Consent behavior
- Session recording sampling (public vs Studio)
- Tenant super properties and group analytics strategy
```

---

## Phase C‑2 — Analytics Provider (client‑side foundation)

**Deliverables**
- `components/analytics/AnalyticsProvider.tsx` (client component):
  - Initializes `posthog-js` with env keys.
  - Exposes `startTracking()` / `stopTracking()` for consent.
  - Enables session recording with `{ maskAllInputs: true }` (add stricter masks if needed).
  - Registers **super properties** and **group analytics** once page context is known.
  - No‑ops on server.

- `lib/analytics/context.ts`:
  - Helpers to build tenant context from page props: `{ buyer_id, seller_id, page_url_key, content_sha, host, route_scheme: "A" }`.

**Acceptance**
- Provider in `app/(public)/layout.tsx` renders without errors.
- Calling `posthog.capture('test')` works in DevTools with super props attached.

**Copilot Prompt**
```
You are GitHub Copilot. Implement a client AnalyticsProvider that:
- Imports and inits posthog-js using NEXT_PUBLIC_POSTHOG_KEY and NEXT_PUBLIC_POSTHOG_HOST.
- Configures autocapture: true, session_recording: { maskAllInputs: true }.
- Provides startTracking() / stopTracking() for consent flows.
- Exposes a registerContext(ctx) method to call posthog.register(ctx) and posthog.group('buyer', ctx.buyer_id) when available.
- Ensures safe no-ops on server; export usePostHogSafe() hook for guarded access.
```

---

## Phase C‑3 — Public Page Instrumentation (Option A: `/p/[slug]`)e

**Events & Properties**
- `landing_visit` (on mount): `{ referrer, user_agent? }`
- `landing_leave` (on unmount/visibility hidden): `{ time_on_page_ms }`
- `scroll_depth` (25/50/75/100 once): `{ depth_pct, depth_px }`
- `hover_component` (≥500ms): `{ component_id, section, hover_ms }`
- `user_idle_start` / `user_idle_end`: `{ idle_ms }` on end
- `cta_click`: `{ cta_id: 'book_meeting'|'read_case_study'|'visit_website', cta_location: 'hero'|'proof_section'|'seller_section'|'footer'|'social_list', href, link_type: 'external'|'internal' }`
- `video_play` / `video_pause` / `video_progress`: `{ video_provider: 'vimeo', video_url, pct }`

Attach **tenant context** to all of the above via `posthog.register()` (Phase C‑2).

**Implementation checklist**
- Add `AnalyticsProvider` to public layout and pass page context (slug → resolve tenant fields).
- Hooks/utilities:
  - `useVisitLeave()` — fire `landing_visit`/`landing_leave` and compute time on page.
  - `useScrollDepth()` — thresholds 25/50/75/100; fire once.
  - `useHoverTelemetry(componentId, section, minHoverMs=500)` — debounced hover capture.
  - `useIdle(timeoutMs=30000)` — idle start/end events.
  - `trackCtaClick({ id, location, href, linkType })` — single CTA util.
- Wire CTAs in Hero/Proof/Seller/Footer to `trackCtaClick` with correct `cta_id` and `cta_location`.

**Copilot Prompt (hooks)**
```
You are GitHub Copilot. Create client hooks in lib/analytics/hooks.ts:
- useVisitLeave(): on mount capture 'landing_visit'; on unmount or visibility hidden, capture 'landing_leave' with time_on_page_ms.
- useScrollDepth(): capture 'scroll_depth' at 25/50/75/100 thresholds once; include depth_px.
- useHoverTelemetry(componentId, section, minHoverMs=500): capture 'hover_component' when hover duration >= minHoverMs.
- useIdle(timeoutMs=30000): capture 'user_idle_start' after timeout with no events; on next activity capture 'user_idle_end' with idle_ms.
Export trackCtaClick({ id, location, href, linkType }) to capture 'cta_click' with the given properties.
All events must be merged with the global context registered in AnalyticsProvider.
```

**Copilot Prompt (wire CTAs)**
```
You are GitHub Copilot. In Hero/Proof/Seller/Footer components, wrap CTA elements to call trackCtaClick() with:
- id: 'book_meeting'|'read_case_study'|'visit_website'
- location: 'hero'|'proof_section'|'seller_section'|'footer'|'social_list'
- href: the outgoing URL
- linkType: 'external' or 'internal'
Do not change visual design; only add onClick handlers.
```

---

## Phase C‑4 — Studio & Server Events (posthog-node)

**Events**
- `page_publish_attempt` (when Publish is pressed)
- `page_published` (success)
- `page_publish_failed` (failure)

**Properties**: `{ slug: page_url_key, buyer_id, content_sha, changed }` (plus error_code on failure)

**Acceptance**
- Events appear with server-side distinct_id (user id if available or 'studio' fallback).
- Publish flow produces a clean timeline in PostHog.

**Copilot Prompt**
```
You are GitHub Copilot. Add a server-only module lib/analytics/server.ts that initializes posthog-node using POSTHOG_PERSONAL_API_KEY.
Export capturePublishEvent(kind, props) where kind ∈ ['page_publish_attempt','page_published','page_publish_failed'].
Use distinct_id from authenticated user if available, else 'studio'.
Ensure flush() is called before the server action returns.
```

---

## Phase C‑5 — Consent, Privacy, Recording

**Deliverables**
- Lightweight consent banner (public pages only) with Accept / Learn more.
- Session recording:
  - Public pages: 25–50% sampling, `maskAllInputs: true`.
  - Studio: choose sampling policy; at minimum mask inputs.
- Mask text or selectors for any sensitive fields if they exist.

**Copilot Prompt (consent)**
```
You are GitHub Copilot. Build a minimal ConsentBanner client component that:
- Reads consent from localStorage ('analytics-consent': 'accepted'|'rejected'|null).
- If null, shows a small banner with 'Accept' and 'No thanks'.
- On Accept: calls startTracking() from AnalyticsProvider and hides; on No thanks: hides and do not start tracking.
- Expose a link to a /privacy page (can be a placeholder for now).
```

---

## Phase C‑6 — Dashboards & QA

**Dashboards (PostHog UI)**
- **Tenant Landing Performance**: visits, unique users, CTRs for `book_meeting`, `read_case_study`, `visit_website`, segmented by `buyer_id` and `cta_location`.
- **Engagement**: scroll depth distribution (25/50/75/100), idle ratios.
- **Video**: play rate and quartile completion (if enabled).
- **Publish Reliability**: attempts vs success rate; median TTV from attempt to published.

**QA Script**
1) Publish two different slugs (Company A/B). Visit both pages.
2) Confirm `landing_visit`, `scroll_depth`, hover, idle, and at least one `cta_click` each.
3) Verify tenant context on events (buyer_id, page_url_key, content_sha).
4) Toggle consent and confirm events stop/start.
5) Check session recordings exist and inputs are masked.
6) In Studio, publish success and failure once to see server events.

---

## Event Taxonomy (pin for your team)

- Global super properties: `buyer_id`, `seller_id`, `page_url_key`, `content_sha`, `host`, `route_scheme`, `device_type`, `viewport_w`, `viewport_h`
- Lifecycle: `landing_visit`, `landing_leave`
- Engagement: `scroll_depth`, `hover_component`, `user_idle_start`, `user_idle_end`
- CTAs: `cta_click` with `cta_id` ∈ {`book_meeting`,`read_case_study`,`visit_website`} and `cta_location` ∈ {`hero`,`proof_section`,`seller_section`,`footer`,`social_list`}
- Media: `video_play`, `video_pause`, `video_progress` (25/50/75/100)
- Errors: `render_error`, `not_found`
- Studio/Server: `page_publish_attempt`, `page_published`, `page_publish_failed`

---

## Definition of Done (Part C)
- AnalyticsProvider loads; tenant context registers on public pages.
- All specified events fire with correct properties and masking.
- Session recordings sampled and privacy‑safe.
- Copilot‑scaffolded hooks and server module compile cleanly.
- Dashboards show data for at least two companies and multiple slugs.
