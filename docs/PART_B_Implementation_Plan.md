# PART B — Publish & Go Live on Vercel (Detailed Implementation Plan)

> **Scope:** Single‑click **Publish** from the Studio to make the landing page live on Vercel.  
> **No versioning** for now; republish updates the same slug.  
> **No repo sprawl:** one GitHub repo + one Vercel project; content lives in **Supabase**; pages use **On‑Demand ISR**.

---

## 0) Outcome (Definition of Done)
- From Studio, clicking **Publish**:
  1) Re‑validates and **normalizes** the JSON server‑side.
  2) **Upserts** a row in `landing_pages` with `status='published'`, `page_url_key`, `content_sha`, `page_content.normalized`, identifiers, and `published_at`.
  3) Calls a **revalidate endpoint** to regenerate `/p/{page_url_key}` on Vercel.
  4) Returns the **live URL** `https://<domain>/p/{page_url_key}`.
- Visiting `/p/{page_url_key}` renders the exact snapshot that was published.
- If the **same** content is published again (`content_sha` unchanged), deployment is **idempotent** (no work).

---

## 1) Architecture (Why this path)
- **Single repo & project:** Avoids creating a repo per page. The Studio and public pages share one Next.js app.
- **Supabase as source of truth:** The published page is stored and served from your `landing_pages` table (column `page_content.normalized`).
- **On‑Demand ISR:** After upsert, we call a revalidate API to regenerate the static HTML for just that slug (no full rebuild).

> This keeps “one‑click publish”, zero repo sprawl, and fast go‑live times.

---

## 2) Routes & Responsibilities

### 2.1 Public Route — `/p/[slug]`
- **Purpose:** Serve the live landing page.
- **Data source:** Supabase row where `page_url_key = slug` and `status = 'published'`.
- **Rendering:** Uses the **normalized contract** from Part A (the same renderer/components).  
- **Caching:** Wrap the fetch with `next: { tags: ['landing:' + slug] }` (or `revalidatePath`), so we can revalidate it on publish.
- **SEO Meta:** Title & description from normalized content (Part A mapping).

### 2.2 Publish Server Action — `studio → publish()`
- **Purpose:** One‑click publish from Studio (no client secrets exposed).
- **Steps (server‑side only):**
  1) **Re‑validate** raw JSON with the same validator used in Studio (never trust client).
  2) **Normalize** → compute deterministic `content_sha`.
  3) **Upsert** into `landing_pages` by `page_url_key` (see §4):
     - set `status='published'`, `page_content.normalized`, `content_sha`, `buyer_id/seller_id/mmyy`, `published_at=now()`.
  4) **Revalidate** the page (see 2.3).
  5) Return `{ url: 'https://<domain>/p/{slug}', content_sha }`.

### 2.3 Revalidate API — `POST /api/revalidate`
- **Auth:** Secret header `x-revalidate-secret = REVALIDATE_SECRET`.
- **Body:** `{ "slug": "<page_url_key>" }`
- **Action:** Calls `revalidateTag('landing:'+slug)` **or** `revalidatePath('/p/'+slug)` to regenerate that single page.
- **Response:** `{ ok: true }` (or `{ ok:false, error }`).

---

## 3) Environment Variables (Vercel Project)
- `SUPABASE_URL` — project URL (server only)
- `SUPABASE_SERVICE_ROLE` — service role key (server only; never exposed)
- `REVALIDATE_SECRET` — shared secret for `/api/revalidate`
- `STUDIO_PUBLISH_SECRET` — (optional) second secret to protect the publish action
- `NEXT_PUBLIC_SITE_URL` — e.g. `https://plays.hrytos.com` (used for return links)

> Keep all **server‑only** secrets off the client. Use server actions or route handlers for calls that require them.

---

## 4) Database Usage (existing `landing_pages`)
**No schema changes required**. Recommended runtime behavior:

- **Upsert key:** `page_url_key` (treat as unique at app‑level for now).
- **Write set on publish:**
  - `status = 'published'`
  - `page_content = { normalized, original? (optional) }` (store at least the normalized block)
  - `content_sha = <hex>`
  - `buyer_id`, `seller_id`, `mmyy`, `buyer_name`, `seller_name` (if provided)
  - `published_at = now()`
- **Idempotency:** If an existing `published` row has the same `content_sha`, skip revalidate and just return the live URL.
- **Optionally add indexes (nice‑to‑have):**
  - unique index on `page_url_key`
  - index on `content_sha`

---

## 5) Publish Flow — End‑to‑End (Single Click)
1. **Studio**: user presses **Publish**.
2. **Server Action** (Studio):
   - Check `STUDIO_PUBLISH_SECRET` (optional, but recommended).
   - Run `validateAndNormalize(raw)`.
   - Compute `content_sha` deterministically.
   - Upsert **published** row into `landing_pages` (by `page_url_key`).
3. **Revalidate**:
   - POST `/api/revalidate` with `{ slug }` and `REVALIDATE_SECRET`.
   - The public page `/p/{slug}` is regenerated on Vercel.
4. **Respond** to Studio with:
   - `url = NEXT_PUBLIC_SITE_URL + '/p/' + slug`
   - `status = 'published'`
   - `content_sha` (echoed for transparency)

> Total time to live: seconds (no repo commit or full rebuild).

---

## 6) Concurrency, Idempotency & Rate Limits
- **Idempotent publish:** if the incoming `content_sha` equals the last published row’s `content_sha` for `page_url_key`, short‑circuit and return the current URL (no DB write, no revalidate).
- **Atomic upsert:** perform a single upsert; on conflict (by `page_url_key`) update the required columns.
- **Rate‑limit:** throttle Studio’s publish action (e.g., one publish per slug per 15s) to prevent button‑spamming.
- **Locking (optional):** Set a short‑lived “publishing” flag to avoid concurrent publishes on the same slug.

---

## 7) Security
- **Server‑only:** Supabase service key and revalidate secret never reach the browser.
- **Publish protection:** require a server‑side check (e.g., `STUDIO_PUBLISH_SECRET` or authenticated user).
- **Input hardening:** always run the same validators used in Part A on the server before writing.
- **Row‑level security:** if RLS is enabled in Supabase, perform writes via server action using service role key; the client never sees it.

---

## 8) Observability & Logging
- **Application logs:** log publish attempts with slug, success/failure, and timings (omit PII).
- **Error tracking:** enable Sentry (optional).
- **Audit fields:** persist `published_at`; optionally add `published_by` (user id/email) if auth exists.

---

## 9) Rollback (No Versioning)
- Since versioning is **out of scope right now**, rollback = **republish** with the prior JSON (you can copy it from the last known good row or a local export) and click Publish again.
- Optional: store `page_content.original` to make rollback easy by copying it back into Studio.

---

## 10) Acceptance Criteria (Go/No‑Go)
- **Publish** from Studio returns a 200 with the **live URL**.
- Visiting the URL immediately shows the newly published content (hard refresh within seconds).
- Re‑publishing **unchanged** content avoids revalidate and returns the same URL.
- Errors (invalid JSON, bad URLs, missing required fields) are blocked server‑side with descriptive messages.
- Secrets stay server‑only; no client bundle contains Supabase service key or secrets.

---

## 11) QA Matrix
1) **Happy path:** Valid JSON → publish → URL live.  
2) **Bad URLs:** Meeting/Seller/Social/Video URLs not https → blocked with clear error.  
3) **Long text:** Headline/subhead/quote beyond limits → warnings in Studio, but publish allowed (unless > hard cap).  
4) **Idempotency:** Publish same content twice → second publish is a no‑op (same `content_sha`).  
5) **Theme contrast:** Dark bg + light text → page renders (contrast fixed in Part A), no blocker to publish.  
6) **Missing blocks:** Optional sections removed → page renders with sections skipped gracefully.  
7) **Security:** Calling `/api/revalidate` without secret → 401/403.  
8) **RLS on:** Client cannot write directly; server action succeeds with service role only.

---

## 12) Future‑proofing (Optional Enhancements)
- **Short links** `/t/{token}` that redirect to the latest published slug (requires token encoder; defer for now).
- **Versioning:** add `version` and keep a publish history for easy rollbacks.
- **Approval workflow:** publish to “preview” first; auto‑promote to production on approval.
- **GitHub/Deploy‑hook mode:** switch to repo‑based content if you prefer commit‑based immutable builds later.

---

## 13) Work Breakdown (Phases)

### Phase B‑1 — Public Route & Data Read
- Implement `/p/[slug]` route that fetches **published** row by `page_url_key` from Supabase.
- Wire normalized content into the same components from Part A.
- Add cache tags (e.g., `landing:${slug}`) for revalidation.

**Done when:** Navigating to `/p/test-slug` renders a test row’s content locally.

---

### Phase B‑2 — Revalidate Endpoint
- Create `POST /api/revalidate` with `REVALIDATE_SECRET`.
- Implement `revalidateTag('landing:'+slug)` or `revalidatePath('/p/'+slug)`.

**Done when:** Hitting the endpoint after editing DB content refreshes the page output.

---

### Phase B‑3 — Publish Server Action
- In Studio, add **Publish** button → server action:
  - Server‑side re‑validate & normalize the raw JSON.
  - Compute `content_sha`.
  - Upsert `landing_pages` with `status='published'`, normalized content, identifiers, `published_at`.
  - Call revalidate endpoint.
  - Return live URL.

**Done when:** Clicking Publish makes the URL live in seconds.

---

### Phase B‑4 — Idempotency, Rate‑Limit, & Errors
- Short‑circuit on same `content_sha` for slug.
- Add a simple rate‑limit (e.g., in‑memory or Redis if available).
- Error messages mirror Part A’s catalog; client shows them clearly.

**Done when:** Double‑publish does nothing; spam is throttled; errors are descriptive.

---

### Phase B‑5 — Observability & Docs
- Minimal logging around publish attempts and revalidate calls.
- Update `README_PART_B.md` with usage, envs, and troubleshooting.
- (Optional) Sentry hook for server routes.

**Done when:** A new dev can configure envs and publish a page without help.

---

## 14) Handoff Check to “Live”
- `/p/[slug]` pulls normalized content from Supabase.
- `/api/revalidate` works with secret.
- Studio **Publish** performs upsert + revalidate and returns URL.
- QA matrix scenarios pass.
