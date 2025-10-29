# PART A — Phase Execution Plan + GitHub Copilot Prompts

This plan turns the PART A spec into concrete phases you can execute with GitHub Copilot. It includes deliverables, steps, acceptance criteria, and **copy‑pasteable Copilot prompts** for each phase.

> Scope reminder: PART A covers JSON → validate/normalize → preview render (Studio). No Git commits or Vercel deploys here (that’s PART B).

---

## Phase 0 — Project Setup (Local, No Deploys)

**Deliverables**
- Next.js app (App Router) with TypeScript configured.
- Tailwind CSS (or your preferred utility CSS) and a basic layout shell.
- Folder placeholders for Studio, normalizer, validators, and components.
- `fixtures/` with your sample JSON for local testing (optional).

**Key files/folders (names suggestive)**
- `app/(studio)/studio/page.tsx` (Studio Preview screen)
- `lib/normalize/` (normalizer + helpers)
- `lib/validate/` (validators + error catalog)
- `components/landing/` (UI components)
- `fixtures/sample.json`

**Acceptance Criteria**
- App runs locally; Studio route loads.
- A simple input box exists for pasting JSON (no functionality yet).

**Copilot Prompt (setup)**
```
You are GitHub Copilot. Create a Next.js (App Router) TypeScript project skeleton for a landing-page Studio with TailwindCSS. 
Do not include any deployment or GitHub logic. 
Create empty folders: lib/normalize, lib/validate, components/landing, fixtures. 
Create a placeholder Studio page at app/(studio)/studio/page.tsx with a textarea and a Validate button (no logic yet).
```

---

## Phase 1 — Normalized Content Contract & Mapping

**Deliverables**
- Normalized content TypeScript types.
- Mapping utilities: raw JSON → normalized object (no validation yet).
- Stable stringify + deterministic `content_sha` (SHA256).

**Key files**
- `lib/normalize/normalized.types.ts`
- `lib/normalize/mapRawToNormalized.ts`
- `lib/normalize/stableStringify.ts`
- `lib/normalize/hash.ts`

**Acceptance Criteria**
- `mapRawToNormalized(raw)` returns the normalized skeleton per PART A §3, §4.
- `stableStringify(normalized)` yields canonical ordering.
- `hash(normalized)` → deterministic across raw-key reorders.

**Copilot Prompt (mapping)**
```
You are GitHub Copilot. Implement TypeScript types for the "normalized" landing structure from this spec:

- Page meta: title, seo.description, seo.ogImage? 
- brand: { logoUrl?, colors: { primary?, accent?, bg?, text? }, fonts: { heading?, body? } }
- hero: { headline, subhead?, cta: { text, href }, media: { videoUrl? } }
- benefits: { title?, items?: Array<{ title, body? }> }
- options: { cards?: Array<{ title, description? }> }
- proof: { title?, summaryTitle?, summaryBody?, quote?: { text?, attribution?: { name?, role?, company? } } }
- social: { items?: Array<{ type?, description?, link }> }
- secondary: { title?, body? }
- seller: { body?, links?: { primary?, more? } }
- footer: { cta?: { text, href } }

Implement mapRawToNormalized(raw) using the following field mapping:
- biggestBusinessBenefitBuyerStatement → title, hero.headline
- synopsisBusinessBenefit → seo.description, hero.subhead (meta description should be truncated at ≈160 chars later by validator)
- meetingSchedulerLink → hero.cta.href (fallback to sellerLinkWebsite)
- quickDemoLinks → hero.media.videoUrl (Vimeo preferred; else link-only later)
- highestOperationalBenefit.highestOperationalBenefitStatement → benefits.title
- highestOperationalBenefit.benefits[].statement/content → benefits.items[].title/body
- options[].title/description → options.cards[]
- mostRelevantProof.* → proof.*
- socialProofs[] → social.items[]
- secondHighestOperationalBenefitStatement/Description → secondary.title/body
- sellerDescription → seller.body
- sellerLinkWebsite → seller.links.primary
- sellerLinkReadMore → seller.links.more

Also add stableStringify(object) that orders keys lexicographically and hash(normalized) that returns a hex SHA256 digest over the stable string.
Export a computeContentSha(normalized) helper that composes both.
```

---

## Phase 2 — Validation Engine & Error Catalog

**Deliverables**
- Zod schemas for raw JSON and for normalized output where helpful.
- Validation rules (blocking errors vs warnings) from the plan.
- Error catalog with codes and human‑readable messages.
- A single function: `validateAndNormalize(raw): { normalized, contentSha, errors[], warnings[] }`

**Key files**
- `lib/validate/errors.ts` (codes + messages)
- `lib/validate/rules.ts` (length caps, URL checks, presence rules)
- `lib/validate/index.ts` (validateAndNormalize)
- `lib/normalize/vimeo.ts` (ID extraction helper)

**Acceptance Criteria**
- Blocking errors on missing requireds and invalid URLs.
- Warnings on long texts, unknown video host, contrast issues (contrast logic can be a stub here; full in Phase 3).
- Deterministic output: same normalized + contentSha for semantically same raw JSON with different key order.

**Copilot Prompt (validators)**
```
You are GitHub Copilot. Implement a validator for the landing JSON with this contract:
- Function: validateAndNormalize(raw) → { normalized, contentSha, errors: ErrorItem[], warnings: WarningItem[] }
- Use the mapping in mapRawToNormalized(raw) but run checks first; only return normalized if no blocking errors.
- Blocking errors:
  - Missing biggestBusinessBenefitBuyerStatement.
  - Missing all of { highestOperationalBenefit, options, mostRelevantProof }.
  - Invalid https URLs in meetingSchedulerLink, sellerLinkWebsite, socialProofs[].link, quickDemoLinks.
  - Text exceeding hard caps by >20%.
- Warnings:
  - Headline > 90, subhead > 180, benefit body > 400, quote > 300.
  - Non-Vimeo quickDemoLinks (treat as link-only later).
  - Theme contrast < 4.5:1 (use a helper, can be a stub here, real check in Phase 3).
- Provide error codes/message constants matching the catalog:
  - E-HERO-REQ, E-MIN-SECTION, E-URL-SCHED, E-URL-SELLER, E-URL-SOCIAL, E-URL-VIDEO, E-TEXT-LIMIT, E-NORMALIZE
  - W-HERO-LONG, W-SUBHEAD-LONG, W-BENEFIT-LONG, W-QUOTE-LONG, W-VIDEO-HOST, W-CONTRAST
- On success, normalize using mapRawToNormalized(raw), truncate meta description to ~160 chars, compute contentSha using computeContentSha(normalized) and return the bundle.
Also implement a vimeo utility: parseVimeoId(url) → string | null.
```

---

## Phase 3 — Utilities: Slug, URL, Contrast, Theme

**Deliverables**
- `slugify()` and `suggestPageUrlKey(buyer, seller, mmyy, version)` with the regex `^[a-z0-9]+(?:-[a-z0-9]+)*$`.
- URL guard `isHttpsUrl(url)`.
- WCAG contrast checker `getContrastRatio(foreground, background)` and `ensureReadableTextColor(bg, text)` returning adjusted text and a flag.

**Key files**
- `lib/util/slug.ts`
- `lib/util/url.ts`
- `lib/util/contrast.ts`
- `lib/theme/tokens.ts` (CSS variable names and defaults)

**Acceptance Criteria**
- Slug rules match the plan; illegal characters collapsed to a single hyphen.
- Contrast ratio computed; function returns whether auto‑adjustment is required.

**Copilot Prompt (utilities)**
```
You are GitHub Copilot. Implement the following utilities:
- slugify(s: string) → lowercased, non-alphanumerics to hyphen, collapse repeats, trim hyphens.
- suggestPageUrlKey(buyer, seller, mmyy, version) → `${buyer}-${seller}-${mmyy}-v${version}` with slugify on parts.
- isHttpsUrl(url): boolean, strict https only.
- getContrastRatio(fgHexOrRgb, bgHexOrRgb): number per WCAG.
- ensureReadableTextColor(bg, text) → { text: adjustedColor, adjusted: boolean } that flips to black/white if contrast < 4.5:1.
Provide unit tests for edge cases (very dark bg, special chars in slug input).
```

---

## Phase 4 — Renderer Components (Accessible, Skippable)

**Deliverables**
- Reusable, accessible components that accept only normalized props.
- Sections auto‑omit when data is empty.
- Responsive layout and spacing tokens.

**Key files**
- `components/landing/Hero.tsx`
- `components/landing/Benefits.tsx`
- `components/landing/Options.tsx`
- `components/landing/Proof.tsx`
- `components/landing/SocialProofs.tsx`
- `components/landing/SecondaryBenefit.tsx`
- `components/landing/SellerInfo.tsx`
- `components/landing/Footer.tsx`
- `app/preview/[slug]/page.tsx` (reads from in‑memory or local state — no DB needed)

**Acceptance Criteria**
- One H1 (hero), H2 for sections; keyboard/focus states visible.
- Vimeo embeds load lazily; non‑Vimeo shows “Watch demo” button.
- No empty headings or visual gaps when sections are missing.

**Copilot Prompt (components)**
```
You are GitHub Copilot. Create React components for a normalized landing page (props-only, no data fetching). 
Rules: 
- Accept only normalized props from the spec; skip rendering if props are empty. 
- Maintain accessibility: one H1 in Hero, H2 per section, focus-visible outlines, external links target=_blank + rel=noopener. 
- Lazy-load video if Vimeo; else show a button linking to the demo. 
- Use utility CSS classes for spacing, radius, and container width; be responsive (single column on mobile, grids on desktop).
Generate components: Hero, Benefits, Options, Proof, SocialProofs, SecondaryBenefit, SellerInfo, Footer.
```

---

## Phase 5 — Studio Preview UX

**Deliverables**
- Studio page to paste/upload JSON, run validation, show errors/warnings, and render live preview from `normalized` output.
- Optional: Save `draft/validated` into `landing_pages` (Part A allows enabling this; can be deferred).

**Key files**
- `app/(studio)/studio/page.tsx`
- (Optional) `app/api/drafts` server route to save to DB (service key; RLS-safe).

**Acceptance Criteria**
- Paste → Validate → Normalize → Preview loop works entirely locally.
- Error panel shows codes + human messages; clicking an error scrolls to related section.

**Copilot Prompt (Studio)**
```
You are GitHub Copilot. Implement a client-side Studio screen:
- Textarea for JSON paste (or file upload). 
- “Validate” button calls validateAndNormalize(raw) and shows a panel of errors/warnings with codes and friendly text. 
- If no blocking errors, render a live Preview using the normalized props and the components from Phase 4. 
- Provide fields to optionally enter buyer_id, buyer_name, seller_id, seller_name, mmyy for a suggested page_url_key. 
- Compute and display content_sha and the suggested slug.
- No GitHub or Vercel actions here.
```

---

## Phase 6 (Optional in Part A) — Draft Persistence in `landing_pages`

**Deliverables**
- Server route or server action that writes:
  - `status` = "draft" or "validated"
  - `page_content.original`, `page_content.normalized`
  - `content_sha`, metadata (`buyer_id`, `seller_id`, `mmyy`, etc.)
  - `page_url_key`, `version` (suggested)
- No publish/deploy fields (`url_token`, `published_at`) touched.

**Key files**
- `app/api/drafts/route.ts` (or a server action in the Studio page)
- `lib/db/supabase.ts` (client with service key on server only)

**Acceptance Criteria**
- Rows created/updated; RLS respected; sensitive keys never sent to client.

**Copilot Prompt (DB draft save)**
```
You are GitHub Copilot. Create a server route to save a draft to the existing "landing_pages" table with fields:
status ("draft"|"validated"), page_content { original, normalized }, content_sha, buyer_id, seller_id, mmyy, buyer_name, seller_name, page_url_key, version.
Do not set url_token or published_at. 
Use service-role key on the server only; do not expose it to the client. 
Return the saved row id and a summary to the client.
```

---

## Phase 7 — QA & Tests

**Deliverables**
- Unit tests for mapping, validators, utilities (slug, URL, contrast).
- Fixture-based tests using your sample and edge-case JSONs.
- Manual QA checklist run-through (from the plan).

**Key files**
- `__tests__/normalize.test.ts`
- `__tests__/validate.test.ts`
- `__tests__/util.test.ts`
- `fixtures/` multiple JSONs

**Acceptance Criteria**
- All tests pass; QA matrix scenarios behave as specified.

**Copilot Prompt (tests)**
```
You are GitHub Copilot. Write unit tests for:
- mapRawToNormalized: mapping fidelity using the sample JSON.
- validateAndNormalize: blocking errors and warnings per catalog; deterministic content_sha across key reorderings.
- slugify/suggestPageUrlKey: regex compliance, special char collapse.
- contrast utils: correct ratio and auto-adjust behavior.
Use the fixtures folder for sample inputs.
```

---

## Phase 8 — Docs & Handoff

**Deliverables**
- `README_PART_A.md` describing JSON contract, validators, Studio usage.
- Troubleshooting section for common validation failures.
- Clear “handoff to PART B” outputs: `normalized.json`, `content_sha`, suggested `page_url_key` and (if saved) draft row id.

**Acceptance Criteria**
- Any dev can run Studio, validate JSON, preview landing, and understand next steps without help.

**Copilot Prompt (docs)**
```
You are GitHub Copilot. Generate README_PART_A.md summarizing:
- What PART A does and doesn’t do.
- JSON → normalized contract (link to types).
- Validation rules and error codes.
- How to run the Studio, test with fixtures, and read outputs for PART B handoff.
Provide short troubleshooting tips for common errors.
```

---

## Global Copilot “Context Booster” Comment (paste at top of key files)
Copy this block into the top of your new files so Copilot stays aligned with the spec:

```ts
/**
 * CONTEXT FOR COPILOT — PART A (Landing Page)
 * - We render a landing page purely from a provided JSON.
 * - No deploy or GitHub writes in Part A.
 * - Use the normalized content contract defined in PART_A_Landing_Page_Implementation_Plan.md (sections: meta, hero, benefits, options, proof, social, secondary, seller, footer).
 * - Implement strict validation: required fields, URL hygiene (https only), length caps (headline ≤90, subhead ≤180, benefit body ≤400, quote ≤300).
 * - Produce deterministic content_sha: SHA256 over stable-stringified normalized JSON.
 * - Theme via tokens: colors (primary, accent, bg, text), fonts (heading, body), enforce 4.5:1 contrast (auto-adjust text + warning flag).
 * - Components accept normalized props only; skip empty sections without leaving gaps.
 * - Studio flow: Paste → Validate → Normalize → Preview (optional draft save to landing_pages with status draft/validated).
 */
```

---

## Definition of Ready (DoR) for PART B Handoff
- `normalized` object (canonical order) available.
- `content_sha` computed.
- Suggested `page_url_key` available.
- (Optional) Draft row created with `status="validated"` and above fields.
- QA matrix for PART A passed.

---

Use this file alongside the PART A spec as Copilot context to keep outputs consistent across files.
