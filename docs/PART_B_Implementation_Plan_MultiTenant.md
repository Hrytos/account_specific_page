
# PART B — Publish & Go Live on Vercel (Multi‑Tenant Implementation Plan)

> **Scope:** Single‑click **Publish** from the Studio to make landing pages live for **many companies**, using **one repo** + **one Vercel project** + **Supabase** as the content store.  
> **Assumptions:** No versioning for now. Re‑publishing a slug overwrites that slug in place.  
> **Goal:** Scale to N companies without repo sprawl; revalidate only the page that changed.

---

## 0) Outcome (Definition of Done)
- From Studio, **Publish**:
  1) Re‑validates and **normalizes** JSON server‑side.
  2) **Upserts** one row in `landing_pages` (tenant-aware) with `status='published'`, `page_url_key`, `content_sha`, `page_content.normalized`, identifiers (`buyer_id`, `seller_id`, `mmyy`), and `published_at`.
  3) Calls a **revalidate API** to regenerate **only that page** on Vercel (On‑Demand ISR).
  4) Returns the **live URL** for that tenant/page.
- The public URL renders the exact snapshot that was published.
- Idempotency: publishing identical content (`content_sha` unchanged for that tenant+slug) is a no‑op.

---

## 1) Architecture Overview
- **Single Next.js app**, **single Vercel project**, **single GitHub repo**.
- **Supabase** is the source of truth for published pages (column `page_content.normalized`).  
- **On‑Demand ISR** revalidates per page (no full rebuild, no repo per page).
- **Multi‑tenant by URL scheme** (choose one below).

---

## 2) URL Scheme (choose now; can upgrade later)

### Option A — **Global Slugs** (fastest to ship — recommended now)
- **Public URL:** `/p/{page_url_key}` (e.g., `/p/adient-cyngn-1025`)
- **Uniqueness:** `page_url_key` is **globally unique**.
- **DB read:** by `page_url_key` where `status='published'`.
- **Revalidate tag:** `landing:{page_url_key}`.
- **Pros:** zero schema changes; simplest rollout.
- **Cons:** must keep slugs globally unique.

### Option B — **Namespaced Paths**
- **Public URL:** `/c/{buyer_id}/p/{slug}` (where `slug = page_url_key`).
- **Uniqueness:** unique per pair `(buyer_id, page_url_key)`.
- **DB read:** by `(buyer_id, page_url_key)` where `status='published'`.
- **Revalidate tag:** `landing:{buyer_id}:{page_url_key}`.
- **Pros:** clean per‑buyer namespace; avoid global slug collisions.
- **Cons:** enforce pair uniqueness (see indexes).

### Option C — **Wildcard Subdomains**
- **Public URL:** `https://{buyerSub}.site.com/p/{page_url_key}`.
- **Uniqueness:** unique per `(host, page_url_key)`.
- **DB read:** resolve `buyer_id` from host → lookup `(buyer_id, page_url_key)`.
- **Revalidate tag:** `landing:{host}:{page_url_key}`.
- **Pros:** brandable per company; feels native.
- **Cons:** requires wildcard domain on Vercel; a bit more setup.

> **Pick A now** (ship quickly), then migrate to B or C later without changing the Studio or validator contracts.

---

## 3) Database Usage (existing `landing_pages` — no schema change required)

**Fields used on publish:**
- `status = 'published'`
- `page_content = { normalized, original? }` (store at least `normalized`)
- `content_sha`
- `page_url_key` (acts as `slug`)
- `buyer_id`, `seller_id`, `mmyy`, `buyer_name`, `seller_name` (if provided)
- `published_at = now()`

**Uniqueness & Indexes (by scheme):**
- **Option A:** `UNIQUE(page_url_key)`
- **Option B:** `UNIQUE(buyer_id, page_url_key)`  *(no new column needed; treat `page_url_key` as the slug)*
- **Option C:** Either store `host` (computed from domain) or ensure `(buyer_id, page_url_key)` uniqueness as in B

**Helpful indexes:**
- `(status, page_url_key)` for fast lookups of published pages
- `(buyer_id, status, page_url_key)` if using B/C
- `(content_sha)` for idempotency checks

**Idempotency:** If an existing published row for the key (A: `page_url_key`; B: `(buyer_id, page_url_key)`) already has the same `content_sha`, skip DB write + skip revalidate; return current URL.

---

## 4) Public Routes & Data Reads

### 4.1 Route(s)
- **Option A:** `app/p/[slug]/page.tsx`
- **Option B:** `app/c/[buyer_id]/p/[slug]/page.tsx`
- **Option C:** `middleware.ts` inspects host → inject `buyer_id` in request context → route as B

### 4.2 Data source
- Fetch the **published** row using the key(s) above.
- Render using the **normalized contract** from Part A (same components).

### 4.3 Caching for ISR
- Wrap the DB fetch with a tag:
  - A: `landing:{page_url_key}`
  - B: `landing:{buyer_id}:{page_url_key}`
  - C: `landing:{host}:{page_url_key}`

---

## 5) Publish Flow (Server‑side, single click)

1) **Authenticate** (optional but recommended): check `STUDIO_PUBLISH_SECRET` or user session.
2) **Re‑validate** the raw JSON with Part‑A validator (defensive).
3) **Normalize** → compute deterministic `content_sha`.
4) **Upsert** into `landing_pages` with:
   - `status='published'`
   - `page_content.normalized`, `content_sha`
   - identifiers (`buyer_id`, `seller_id`, `mmyy`, names)
   - `published_at=now()`
   - **Key** = 
     - A: `page_url_key`
     - B/C: `(buyer_id, page_url_key)`
5) **Revalidate** the page via `POST /api/revalidate` with `{ slug, buyer_id?, host? }` and secret header.
6) **Return** `{ url, content_sha, status: 'published' }` where:
   - A: `url = https://site.com/p/{page_url_key}`
   - B: `url = https://site.com/c/{buyer_id}/p/{page_url_key}`
   - C: `url = https://{buyerSub}.site.com/p/{page_url_key}`

---

## 6) Revalidate API (`POST /api/revalidate`)
- **Auth:** `x-revalidate-secret = REVALIDATE_SECRET` (server‑only env).
- **Body:** 
  - A: `{ slug: string }`
  - B: `{ buyer_id: string, slug: string }`
  - C: `{ host: string, slug: string }`
- **Action:** 
  - Use `revalidateTag()` for the correct tag pattern above, **or** `revalidatePath()` with the full path.
- **Response:** `{ ok: true }` or `{ ok:false, error }`

---

## 7) Security
- All secrets (Supabase service key, revalidate secret, optional Studio publish secret) are **server‑only**.
- Validators run server‑side; client input is never trusted.
- Optional RLS on Supabase: server action uses service role; client never sees it.
- Rate‑limit publish per (tenant, slug) to prevent spam (e.g., 1 per 15s).

---

## 8) Observability & Audit
- Log publish attempts with `(buyer_id, page_url_key, content_sha)` and timings; no PII in logs.
- Store `published_at` and (optionally) `published_by` (user id/email) if auth exists.
- For production incidents, a “Revalidate Now” button (admin‑only) can call the API on demand.

---

## 9) Rollback (no versioning yet)
- Rollback = re‑publish old JSON to the same key.  
- Keep `page_content.original` (optional) so Studio can restore quickly.

---

## 10) Acceptance Criteria (Multi‑Tenant)
- Publish from Studio returns the **tenant‑specific live URL**.
- Visiting that URL shows the newly published content within seconds.
- Re‑publishing **unchanged** content is a no‑op (idempotent).
- Multiple companies/pages work simultaneously:
  - A: distinct `page_url_key`s
  - B: distinct `(buyer_id, page_url_key)` pairs
  - C: distinct `(host, page_url_key)` combos
- Security checks hold (revalidate requires secret; service key stays server‑only).

---

## 11) QA Matrix (Multi‑Tenant)
1) **Happy path (Company A)**: publish → A URL live.  
2) **Happy path (Company B)**: publish → B URL live.  
3) **Slug collision**: same `page_url_key` across companies  
   - A: blocked (must rename)
   - B/C: allowed (different buyer/host); enforce pair uniqueness
4) **Idempotency**: publish same content twice → second time is a no‑op.  
5) **Bad links**: invalid https URLs blocked server‑side with clear error.  
6) **Contrast/theme**: page renders; contrast auto‑fix handled by Part A; publish not blocked.  
7) **Security**: calling revalidate without secret → 401/403.  
8) **RLS on**: client cannot write; server action succeeds.

---

## 12) Work Breakdown (Phases)

### Phase B‑1 — Pick the URL Scheme
- Choose A (global slugs) for immediate launch. Document the slug convention (e.g., `buyer-seller-mmyy`).

**Done when:** Scheme is decided and written in README.

---

### Phase B‑2 — Public Route(s) & Data Fetch
- Implement route(s) per chosen scheme (A/B/C).
- Query Supabase for the published row using the key(s). 
- Render via existing normalized components; tag the fetch appropriately.

**Done when:** Test page renders for two different companies locally.

---

### Phase B‑3 — Revalidate API
- Build `POST /api/revalidate` with secret header, body shape based on scheme.
- Call `revalidateTag()` or `revalidatePath()` accordingly.

**Done when:** After editing a row locally, calling the API refreshes just that page.

---

### Phase B‑4 — Studio Publish (Server Action)
- Add Publish → server action: re‑validate, normalize, compute `content_sha`, upsert row (keyed by scheme), call revalidate, return URL.
- Add idempotency & basic rate‑limit.

**Done when:** Two companies can be published independently; each receives its own live URL.

---

### Phase B‑5 — Indexes & Docs
- Create the recommended unique index per chosen scheme.
- Add README for envs, routes, and troubleshooting.

**Done when:** New dev can deploy and publish pages for multiple companies without assistance.

---

## 13) Quick Decision Matrix (to help you choose A/B/C)

| Scheme | URL | Uniqueness | Setup Effort | Branding | Recommendation |
|---|---|---|---|---|---|
| A: Global Slugs | `/p/{page_url_key}` | Global | **Low** | Shared domain | **Start here** |
| B: Namespaced | `/c/{buyer_id}/p/{slug}` | `(buyer_id, slug)` | Medium | Shared domain, clear tenant path | Next step |
| C: Subdomains | `{buyer}.site.com/p/{slug}` | `(host, slug)` | Higher | Full per‑company brand | Future upgrade |
