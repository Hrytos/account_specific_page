
# PART C — Product Analytics Implementation Plan (PostHog, Multi‑Tenant)

> **Module context:** Part A (authoring & preview) → Part B (publish & live) → **Part C (measure & learn)**.  
> **Objective:** Instrument tenant‑aware analytics on public landing pages and Studio with **PostHog**, tracking visits, scrolls, hovers, clicks (segmented by intent/location), idle/pause, optional media progress, and **session recording** — all without repo sprawl.

---

## 0) Outcomes (Definition of Done)
- Public pages (`/p/{page_url_key}` for Option A) emit curated PostHog events with tenant context: `buyer_id`, `seller_id`, `page_url_key`, `content_sha`, `host`, `route_scheme`.
- Primary CTAs are **separately measured**: `book_meeting`, `read_case_study`, `visit_website`, each with `cta_location` (hero/proof/seller/footer/social_list).
- Scroll depth (25/50/75/100), hovers (≥500ms), idle (≥30s), visit/leave timing captured per page.
- (Optional) Vimeo quartile progress (25/50/75/100) when player is present.
- **Session recording** enabled with masking and sampling policy.
- Studio emits server‑side publish lifecycle events: `page_publish_attempt`, `page_published`, `page_publish_failed`.
- Dashboards exist for tenant performance, engagement, CTA funnels, and publish reliability.

---

## 1) Scope & Non‑Goals
- **In scope:** Client analytics for public pages, minimal Studio telemetry, privacy & consent, dashboards, QA.
- **Out of scope (now):** Data warehouse export, cohort modeling, ad pixels, cross‑domain identity stitching. (Can be added later.)

---

## 2) Architecture & Responsibilities
- **Client (posthog‑js):**
  - Initialized in a **client AnalyticsProvider** used by public layout.
  - Registers **tenant super properties** and **group analytics** (`group('buyer', buyer_id)`).
  - Manages consent and **session recording** (masking/sampling).
  - Provides hooks/utilities to emit curated events (visit/leave, scroll, hover, idle, CTA, video).
- **Server (posthog‑node):**
  - Used only by **Studio** server actions to log publish lifecycle events.
  - Uses server secret; never exposed to client.
- **Routing compatibility:**
  - Default **Option A**: `/p/{page_url_key}`
  - Adaptable to **Option B** (`/c/{buyer_id}/p/{slug}`) or **Option C** (subdomains) by changing keys/tags only.

---

## 3) Tenant Context & Group Analytics
Attach these as **super properties** on initialization and refresh when route changes:
- `buyer_id` (string)
- `seller_id` (string, optional)
- `page_url_key` (string; the slug)
- `content_sha` (string; deterministic snapshot id from Part A)
- `host` (string; request host)
- `route_scheme` (enum `"A" | "B" | "C"`)

Also set **group analytics**:
- `group('buyer', buyer_id)` — enables per‑company dashboards/funnels.

---

## 4) Event Taxonomy (canonical names & properties)

### Lifecycle
- `landing_visit` → `{ referrer?, user_agent? }`
- `landing_leave` → `{ time_on_page_ms }`

### Engagement
- `scroll_depth` → `{ depth_pct: 25|50|75|100, depth_px }` (fire once per threshold)
- `hover_component` → `{ component_id, section, hover_ms }` (debounced ≥500ms)
- `user_idle_start`, `user_idle_end` → `user_idle_end` includes `{ idle_ms }`

### CTAs (segmented)
- `cta_click` →
  - `cta_id`: `"book_meeting" | "read_case_study" | "visit_website"`
  - `cta_location`: `"hero" | "proof_section" | "seller_section" | "footer" | "social_list"`
  - `href`: full URL
  - `link_type`: `"external" | "internal"`

### Media (optional)
- `video_play`, `video_pause`, `video_progress` → `{ video_provider: "vimeo", video_url, pct: 25|50|75|100 }`

### Errors
- `render_error` → `{ section, code, message_hash }`
- `not_found` → `{ slug }`

### Studio / Server‑side
- `page_publish_attempt` → `{ slug, buyer_id, content_sha }`
- `page_published` → `{ slug, buyer_id, content_sha, changed: boolean }`
- `page_publish_failed` → `{ slug, buyer_id, error_code }`

> **Rule:** All events must include tenant super properties; do not rely on ad‑hoc property injection.

---

## 5) Privacy, Consent & Recording
- **Consent (recommended):** Pause analytics until accepted on public pages.
- **Session recording:** Start with **25–50% sampling** on public pages; **maskAllInputs: true**; consider `maskTextSelector` allowlist if needed.
- **PII:** Do not send emails/phones as event props. Use PostHog’s person properties only if required later and compliant.
- **Bots:** Enable bot filtering in PostHog settings.

---

## 6) Environment Variables (Vercel)
- `NEXT_PUBLIC_POSTHOG_KEY` — client key
- `NEXT_PUBLIC_POSTHOG_HOST` — optional (EU cloud or self‑host)
- `POSTHOG_PERSONAL_API_KEY` — server only (Studio publish lifecycle)

> Keep server secrets **server‑only**. Client uses only `NEXT_PUBLIC_*` keys.

---

## 7) Instrumentation Surface (where we add code)

### Public pages (Option A; adjust keys for B/C)
- `app/(public)/layout.tsx`: wrap with `AnalyticsProvider` and pass route context (slug → resolve `buyer_id`, `content_sha`, etc.).
- `app/p/[slug]/page.tsx`:
  - Call hooks: `useVisitLeave()`, `useScrollDepth()`, `useIdle()`.
  - Wire hovers with `useHoverTelemetry(componentId, section)` on meaningful components: hero CTA block, proof card, seller block, footer links.
  - Wire **CTA clicks** in Hero/Proof/Seller/Footer using `trackCtaClick({ id, location, href, linkType })`.
  - If Vimeo is present, connect to `video_*` events.

### Studio
- On publish server action(s): call `capturePublishEvent(kind, props)` with node SDK.

---

## 8) Phased Implementation (what to build, in order)

### C‑1 — Decisions & Env
- Pick PostHog region/host, consent stance, sampling.
- Add envs to Vercel and `.env.example`.

### C‑2 — AnalyticsProvider & Context
- Implement client provider: init, consent control, session recording, `registerContext(ctx)` and group analytics.

### C‑3 — Hooks & Utilities
- `useVisitLeave`, `useScrollDepth`, `useHoverTelemetry`, `useIdle`, `trackCtaClick`.
- Add to public pages; verify events in PostHog live view.

### C‑4 — Node SDK for Studio
- Add `posthog-node` server module.
- Emit publish lifecycle events.

### C‑5 — Dashboards & QA
- Create dashboards: Tenant Performance, Engagement, CTA Funnels, Publish Reliability.
- Run QA matrix across two companies and multiple slugs.

### C‑6 — Privacy Hardening
- Verify masking; double‑check consent; document opt‑out.

---

## 9) Acceptance Criteria
- All specified event types appear in PostHog with tenant super properties and correct properties.
- Session recordings show masked inputs; sampling matches decision.
- CTA clicks are segmented by **intent** (`cta_id`) and **location** (`cta_location`).
- Two companies (A/B) with multiple slugs show separate funnels and analytics.
- Studio publish timeline visible (`attempt` → `published`), including failure cases.

---

## 10) QA Matrix
1) **Tenant context**: Every event includes `buyer_id`, `page_url_key`, `content_sha`.
2) **Scroll depth**: 25/50/75/100 fire once per visit.
3) **Hover**: No spam; only emits when ≥500ms on tracked components.
4) **Idle**: `user_idle_start` after 30s inactivity; `user_idle_end` with `idle_ms` upon activity.
5) **CTAs**: Click each type and location; verify segmentation.
6) **Consent**: Withhold events until accepted; resume after acceptance.
7) **Recording**: Sessions exist; inputs masked; sampling correct.
8) **Studio**: Publish success/failure events visible with proper props.

---

## 11) Risks & Mitigations
- **Over‑collection noise:** Use the curated taxonomy; disable relying on raw autocapture for dashboards.
- **PII leakage:** Mask inputs; avoid sending PII props; document policy.
- **Performance:** Debounce hover; throttle scroll listener; lazy‑init PostHog after first paint if needed.
- **Multi‑instance drift:** Ensure context registration runs on route change; test with two different slugs in one session.

---

## 12) Rollout Plan
- Enable Provider in **staging** first with 25% recording.
- Validate events & dashboards for two tenants.
- Enable production with the decided sampling & consent.
- Week‑1 review: tune tracked components and CTA locations as needed.

---

## 13) Future Enhancements
- **Option B/C routing support** with additional group keys.
- **Attribution** (UTM, referrer channel) enrichment; lead pipeline integration.
- **Warehouse export** for long‑term analysis.
- **Feature flags** to A/B test sections or CTA placement.

---

## 14) Quick Links (deliverables generated in this module)
- Phase execution + Copilot prompts: `PART_C_Phase_Execution_with_Copilot_Prompts.md`
- Env example: `.env.example.posthog`
- (Optional) Analytics dashboards screenshots (to be added after first data)

---

**That’s the Part C implementation plan.** It remains tenant‑aware, respects privacy, isolates curated events for clarity, and plugs directly into the public route defined in Part B.
