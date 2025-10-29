# PART A — Landing Page Implementation Plan (Hrytos Landing Automation)

**Goal:** Build a polished, responsive landing page rendered entirely from a provided JSON, with a local Studio for paste→validate→normalize→preview. No deploys or Git activity happen in Part A (that’s Part B).

---

## 1) Definition of Done (DoD)
- Paste JSON in the Studio → validation and normalization succeed.
- The page renders **only** from the normalized content object (missing blocks are skipped without breaking the layout).
- Deterministic outputs are produced for Part B:
  - `normalized` content (canonical ordering),
  - `content_sha` (SHA256 of `normalized`),
  - suggested `page_url_key`.
- Optional: When saving drafts, a row is created/updated in the existing `landing_pages` table with `status = "draft"` or `status = "validated"` (no publish).

**Non‑goals in Part A:** Git commits, Vercel deploys, tokenized short links or version switching (all moved to Part B).

---

## 2) Inputs & Ownership
- **Raw JSON** (your sample is the reference). It is the sole content source.
- **Optional metadata** for DB: `buyer_id`, `buyer_name`, `seller_id`, `seller_name`, `mmyy`, optional `theme`.
- The **renderer only consumes the `normalized` object**. We still store `original` for traceability (if saving to DB).

---

## 3) Normalized Content Contract (what the renderer reads)
Required fields are marked ★. Missing optional blocks are silently skipped.

### 3.1 Page Meta
- ★ `title` ← `biggestBusinessBenefitBuyerStatement`
- `seo.description` ← `synopsisBusinessBenefit` (truncate to ~160 chars)
- `seo.ogImage` (optional, future)
- `brand` (see §6 Theming)

### 3.2 Hero
- ★ `hero.headline` ← `biggestBusinessBenefitBuyerStatement`
- `hero.subhead` ← `synopsisBusinessBenefit`
- `hero.cta.text` → default “Book a meeting” (overridable later)
- `hero.cta.href` ← `meetingSchedulerLink` → fallback to `sellerLinkWebsite`
- `hero.media.videoUrl` ← `quickDemoLinks` (Vimeo preferred; otherwise link-only button)

### 3.3 Sections (rendered in this order)
1) **Primary Benefits**
   - `benefits.title` ← `highestOperationalBenefit.highestOperationalBenefitStatement`
   - `benefits.items[]` from `highestOperationalBenefit.benefits[]`
     - `title` ← `statement`
     - `body`  ← `content`
2) **Options / Paths**
   - `options.cards[]` from `options[]` (title + description)
3) **Proof / Case Study**
   - `proof.title` ← `mostRelevantProof.title`
   - `proof.summaryTitle`, `proof.summaryBody`
   - `proof.quote.text`, `proof.quote.attribution` (name, role, company)
4) **Social Proofs**
   - `social.items[]` from `socialProofs[]` (type, description, link)
5) **Secondary Benefit**
   - `secondary.title` ← `secondHighestOperationalBenefitStatement`
   - `secondary.body`  ← `secondHighestOperationalBenefitDescription`
6) **Seller Info**
   - `seller.body` ← `sellerDescription`
   - `seller.links.primary` ← `sellerLinkWebsite`
   - `seller.links.more` ← `sellerLinkReadMore`

### 3.4 Footer
- `footer.cta` mirrors the hero CTA if present; otherwise omitted.

---

## 4) Raw→Normalized Mapping (quick lookup)
- `biggestBusinessBenefitBuyerStatement` → `title`, `hero.headline`
- `synopsisBusinessBenefit` → `seo.description` (trunc), `hero.subhead`
- `meetingSchedulerLink` → `hero.cta.href` (fallback `sellerLinkWebsite`)
- `quickDemoLinks` → `hero.media.videoUrl` (Vimeo best-effort)
- `highestOperationalBenefit.highestOperationalBenefitStatement` → `benefits.title`
- `highestOperationalBenefit.benefits[].statement/content` → `benefits.items[].title/body`
- `options[].title/description` → `options.cards[]`
- `mostRelevantProof.*` → `proof.*`
- `socialProofs[]` → `social.items[]`
- `secondHighestOperationalBenefitStatement/Description` → `secondary.title/body`
- `sellerDescription` → `seller.body`
- `sellerLinkWebsite` → `seller.links.primary` (also CTA fallback)
- `sellerLinkReadMore` → `seller.links.more`

---

## 5) Validation & Normalization Rules
### 5.1 Blocking Errors
- Missing ★ required fields:
  - `biggestBusinessBenefitBuyerStatement`
  - at least **one** of: `highestOperationalBenefit`, `options`, or `mostRelevantProof`
- Invalid URLs in:
  - `meetingSchedulerLink`, `sellerLinkWebsite`, `socialProofs[].link`, `quickDemoLinks` (must be `https://`).
- Text exceeds **hard caps** by >20% after normalization (see 5.3).

### 5.2 Warnings (Non‑blocking)
- Hero headline > 90 chars; subhead > 180 chars.
- Benefit item body > 400 chars.
- Quote > 300 chars.
- Unknown/non‑Vimeo `quickDemoLinks` (treated as link-only).
- Theme contrast below 4.5:1 (we auto-adjust text and warn).

### 5.3 Soft Length Caps (targets, not cuts)
- Headline ≤ 90 chars, subhead ≤ 180 chars.
- Benefit title ≤ 90, body ≤ 400.
- Quote ≤ 300.
- Meta description truncates to ~160 chars automatically.

### 5.4 Sanitization & Canonicalization
- Strip HTML from text fields; collapse whitespace; trim; standardize quotes.
- Canonical value forms (e.g., normalize URLs to lowercase host).
- Vimeo detection: extract ID; otherwise keep link-only.

### 5.5 Deterministic Hash
- `content_sha` = SHA256 of the **normalized** JSON stringified with **stable key ordering** (insensitive to raw key order and whitespace).

---

## 6) Theming (brand controls without code changes)
- **Theme object** (optional now; can be added later without schema change):
  - `brand.logoUrl` (optional)
  - `brand.colors.primary`, `accent`, `bg`, `text` (hex/rgb)
  - `brand.fonts.heading`, `brand.fonts.body` (optional; system fallback)
- **Contrast enforcement:** if contrast(`text` vs `bg`) < 4.5:1, auto-switch text to black/white and raise a warning.
- **Design tokens:** spacing scale (4, 8, 12, 16, 24), radii (8/16), shadow (sm/md), container width (max 1200px).

---

## 7) Rendering Specification (components & behavior)
- **Layout:** containerized, consistent paddings; simple header with optional logo.
- **Components:** `Hero`, `Benefits`, `Options`, `Proof`, `SocialProofs`, `SecondaryBenefit`, `SellerInfo`, `Footer`.
- **Behavior rules:**
  - Empty data → component is omitted (no visual gaps/empty headings).
  - External links: open in new tab + `rel="noopener noreferrer"`.
  - Video embeds only for Vimeo; otherwise render a “Watch demo” button.
  - Alt text defaults: card titles or descriptive fallbacks.

---

## 8) Studio Preview Flow (Part A scope)
1) Paste/upload JSON.
2) (Optional) Provide metadata for DB: `buyer_id`, `buyer_name`, `seller_id`, `seller_name`, `mmyy`.
3) **Validate** (apply §5 rules) → show errors/warnings panel.
4) **Normalize** → produce `normalized`, `content_sha`, and **suggested** `page_url_key`.
5) **Preview** → live renderer powered by `normalized` (no deploy).
6) **Save** (optional) → insert/update row in `landing_pages`:
   - `status="draft"` if errors; `status="validated"` if no errors.
   - `page_content.original`, `page_content.normalized`, `content_sha`
   - optional metadata; `page_url_key` (suggested); `version` (suggested)

### Suggested `page_url_key`
- Format: `{buyer}-{seller}-{mmyy}-v{version}`
- Slugify: lowercase, remove non‑alphanumerics except hyphen, single hyphens only.

---

## 9) Accessibility & SEO
- One H1 (hero), section H2s in order. No skipped heading levels.
- Visible focus states; full keyboard navigation support.
- Color contrast ≥ 4.5:1 (auto-correct if needed with warning).
- Meta title from `title`; meta description from normalized (truncated ~160).
- Lazy-load iframes/media; fixed aspect ratios to avoid layout shift.

---

## 10) Performance Targets
- CLS < 0.1, LCP < 2.5s (throttled 4G dev profile).
- Lazy-load video, defer non-critical assets.
- System font stack by default; only load brand fonts if provided and performant.

---

## 11) Database Usage (existing `landing_pages` table)
*(Optional in Part A; enable if you want drafts tracked now. No schema changes required.)*

Fields we write:
- `status`: `"draft"` or `"validated"`
- `page_content`: JSONB `{ original, normalized }`
- `content_sha`: text
- `buyer_id`, `seller_id`, `mmyy`, `buyer_name`, `seller_name` (if provided)
- `page_url_key`: suggested slug (unique-intent)
- `version`: suggested integer
- `published_at`: **null** in Part A
- `url_token`: **null** in Part A

**Soft constraints enforced in app for Part A:**
- `status="validated"` only when no blocking errors and normalized present.
- `page_url_key` matches regex `^[a-z0-9]+(?:-[a-z0-9]+)*$`.

---

## 12) Error & Warning Catalog (for consistent UX copy)

### Blocking Errors
- **E-HERO-REQ**: “Hero headline is required.”
- **E-MIN-SECTION**: “Provide at least one of Benefits, Options, or Proof.”
- **E-URL-SCHED**: “Meeting scheduler link must be a valid https URL.”
- **E-URL-SELLER**: “Seller website must be a valid https URL.”
- **E-URL-SOCIAL**: “One or more social proof links are not valid https URLs.”
- **E-URL-VIDEO**: “Demo link must be a valid https URL.”
- **E-TEXT-LIMIT**: “Text exceeds allowed length; please shorten.”
- **E-NORMALIZE**: “Could not normalize content. Check field names and structure.”

### Warnings (Non‑blocking)
- **W-HERO-LONG**: “Hero headline is quite long; consider ≤ 90 characters.”
- **W-SUBHEAD-LONG**: “Subhead is quite long; consider ≤ 180 characters.”
- **W-BENEFIT-LONG**: “One or more benefit descriptions are long; consider ≤ 400 characters.”
- **W-QUOTE-LONG**: “Quote is long; consider ≤ 300 characters.”
- **W-VIDEO-HOST**: “Video host not supported for embed; we’ll show a link.”
- **W-CONTRAST**: “Brand colors reduce text contrast; we’ve auto-adjusted text color.”

---

## 13) QA Test Matrix (Part A sign‑off)
1) **Happy path**: Sample JSON → validate OK → normalized → preview renders all sections.
2) **Missing optional sections**: Remove Options/Proof → still renders cleanly.
3) **Invalid URLs**: Surface blocking errors for scheduler/seller/social/video.
4) **Long text**: Warnings only; layout remains stable; meta description truncates.
5) **Non‑Vimeo video**: Show “Watch demo” button; no embed.
6) **Theme stress**: Dark bg + light text → auto contrast fix + warning.
7) **Deterministic hash**: Reordered raw keys → `content_sha` unchanged.

---

## 14) Outputs for Part B (handoff contract)
- `normalized` object (canonical order).
- `content_sha` (deterministic).
- **Suggested** `page_url_key` (slug).
- Optional validated draft row in `landing_pages` ready for publish logic.

---

## 15) Risks & Mitigations
- **Inconsistent seller JSONs** → strict validators + clear copy + provide example JSON template.
- **Theme hurting readability** → automatic contrast correction + warning.
- **Video host variance** → Vimeo first; pluggable adapters later.

---

## 16) Work Breakdown & Acceptance Criteria

### A) Contracts & Mapping
- Deliver normalized field glossary and mapping (this doc §3, §4).
- **Accept:** Sample JSON maps 1:1; all keys accounted for.

### B) Validators & Messages
- Implement rules & copies per §5 and §12.
- **Accept:** All QA cases produce intended errors/warnings.

### C) Studio Preview UX
- Paste/upload → Validate → Normalize → Preview; optional Save Draft/Validated.
- **Accept:** Preview matches normalized content; error panel anchors to sections.

### D) Renderer (Template)
- Components render only from normalized; empty blocks skipped.
- **Accept:** Visual spec holds across breakpoints; no empty headings/gaps.

### E) Theming
- Brand tokens applied; contrast guard active.
- **Accept:** Changing tokens updates preview; contrast warning triggers when needed.

### F) DB Hook (Optional in Part A)
- Create/Update rows with fields in §11; no publishing/deploys attempted.
- **Accept:** Rows reflect `draft/validated` accurately; `content_sha` and `page_url_key` persisted.

---

## Appendix A — Normalized JSON Skeleton (for reference)

```jsonc
{
  "title": "…",
  "seo": {
    "description": "…",
    "ogImage": null
  },
  "brand": {
    "logoUrl": null,
    "colors": { "primary": null, "accent": null, "bg": null, "text": null },
    "fonts": { "heading": null, "body": null }
  },
  "hero": {
    "headline": "…",
    "subhead": "…",
    "cta": { "text": "Book a meeting", "href": "https://…" },
    "media": { "videoUrl": "https://…" }
  },
  "benefits": {
    "title": "…",
    "items": [ { "title": "…", "body": "…" } ]
  },
  "options": {
    "cards": [ { "title": "…", "description": "…" } ]
  },
  "proof": {
    "title": "…",
    "summaryTitle": "…",
    "summaryBody": "…",
    "quote": { "text": "…", "attribution": { "name": "…", "role": "…", "company": "…" } }
  },
  "social": {
    "items": [ { "type": "Customer Story", "description": "…", "link": "https://…" } ]
  },
  "secondary": {
    "title": "…",
    "body": "…"
  },
  "seller": {
    "body": "…",
    "links": { "primary": "https://…", "more": "https://…" }
  },
  "footer": {
    "cta": { "text": "Book a meeting", "href": "https://…" }
  }
}
```

---

## Appendix B — Suggested Slug Rules
- **Format:** `{buyer}-{seller}-{mmyy}-v{version}`
- **Regex:** `^[a-z0-9]+(?:-[a-z0-9]+)*$`
- **Transform:** lowercase → trim → replace non‑alphanumeric with hyphen → collapse repeats → trim hyphens.

---

## Appendix C — Example Error Panel Copy
- **Errors (block publish):**
  - “Hero headline is required.”
  - “Provide at least one of Benefits, Options, or Proof.”
  - “Meeting scheduler link must be https.”
  - “One or more links are invalid; please fix and retry.”
- **Warnings (show but allow preview/save validated):**
  - “Hero headline is long; consider ≤ 90 characters.”
  - “We adjusted text color to maintain contrast.”

---

_End of PART A Implementation Plan. Use this file as context for Copilot to scaffold validators, normalizer, components, and the Studio preview._
