# Landing Page Template Instructions for GitHub Copilot

**Version**: 2.0 (Multi-Company Template)  
**Last Updated**: October 29, 2025  
**Purpose**: Standardized template for rendering B2B landing pages from JSON input for multiple companies

---

## 🎯 Executive Summary

This template system transforms raw JSON input from sellers into professional, conversion-optimized B2B landing pages. The system is designed to serve **multiple companies** (buyers) with personalized content while maintaining consistent design patterns, accessibility standards, and validation rules.

### Key Design Principles
1. **JSON-Driven**: 100% content from structured JSON (no hardcoding)
2. **Validation-First**: Strict validation before normalization and rendering
3. **Accessibility**: WCAG AA compliance (4.5:1 contrast, semantic HTML)
4. **Mobile-First**: Responsive design for all screen sizes
5. **Performance**: Lazy-loading, optimized assets, minimal dependencies
6. **Consistency**: Standardized sections, predictable layouts
7. **Flexibility**: Auto-skip empty sections, optional fields

---

## 📋 JSON Schema Contract

### Input Format (Raw JSON)

```json
{
  // REQUIRED FIELD - Primary value proposition (becomes H1)
  "biggestBusinessBenefitBuyerStatement": "string",

  // HERO SECTION FIELDS
  "synopsisBusinessBenefit": "string (optional)",
  "quickDemoLinks": "https://vimeo.com/... (optional)",
  "meetingSchedulerLink": "https://... (optional, CTA)",
  "sellerLinkWebsite": "https://... (optional, fallback CTA)",

  // BENEFITS SECTION (3-column grid)
  "highestOperationalBenefit": {
    "highestOperationalBenefitStatement": "string (section title)",
    "benefits": [
      {
        "statement": "string (benefit title)",
        "content": "string (benefit body, optional)"
      }
    ]
  },

  // OPTIONS SECTION (Pilot paths, packages, tiers)
  "synopsisAutomationOptions": "string (section intro, optional)",
  "options": [
    {
      "title": "string (card title)",
      "description": "string (card body, optional)"
    }
  ],

  // PROOF SECTION (Case study + testimonial)
  "mostRelevantProof": {
    "title": "string (section headline, optional)",
    "summaryTitle": "string (case study title, optional)",
    "summaryContent": "string (case study body, optional)",
    "quoteContent": "string (testimonial text, optional)",
    "quoteAuthorFullname": "string (optional)",
    "quoteAuthorDesignation": "string (optional)",
    "quoteAuthorCompany": "string (optional)"
  },

  // SOCIAL PROOF SECTION (Awards, press, case studies)
  "socialProofs": [
    {
      "type": "string (e.g., 'Customer Story', 'Case Study', 'Press Release')",
      "description": "string (link text/description)",
      "link": "https://... (URL to resource)"
    }
  ],

  // SECONDARY BENEFIT SECTION (Additional value prop)
  "secondHighestOperationalBenefitStatement": "string (title, optional)",
  "secondHighestOperationalBenefitDescription": "string (body, optional)",

  // SELLER INFO SECTION (About vendor)
  "sellerDescription": "string (company description, optional)",
  "sellerLinkWebsite": "https://... (optional)",
  "sellerLinkReadMore": "https://... (optional, e.g., case studies page)",

  // THEME (Future enhancement, optional)
  "brand": {
    "logoUrl": "https://... (optional)",
    "colors": {
      "primary": "#hex (optional)",
      "accent": "#hex (optional)",
      "bg": "#hex (optional)",
      "text": "#hex (optional)"
    },
    "fonts": {
      "heading": "string (optional)",
      "body": "string (optional)"
    }
  }
}
```

### Normalized Output Format

```typescript
interface NormalizedContent {
  title: string; // From biggestBusinessBenefitBuyerStatement
  seo?: SeoMeta;
  brand?: Brand;
  hero: Hero; // REQUIRED
  benefits?: Benefits;
  options?: Options;
  proof?: Proof;
  social?: SocialProofs;
  secondary?: SecondaryBenefit;
  seller?: SellerInfo;
  footer?: Footer;
}
```

---

## 🏗️ Page Architecture & Section Order

### Canonical Section Order (Top to Bottom)

1. **Hero** (REQUIRED)
2. **Benefits** (Optional)
3. **Options** (Optional)
4. **Proof** (Optional)
5. **Social Proofs** (Optional)
6. **Secondary Benefit** (Optional)
6. **Seller Info** (Optional)
7. **Footer** (Always rendered)

### Auto-Skip Behavior
- Sections with no data return `null` (React component pattern)
- No visual gaps or spacing left behind
- Minimum 2 sections required (hero + at least 1 other)

---

## 🎨 Visual Design System

### Color Palette (Default Tailwind)
- **Primary CTA**: `bg-slate-700 hover:bg-slate-800`
- **Headings**: `text-gray-900`
- **Body Text**: `text-gray-600`
- **Background**: `bg-white` (sections), `bg-gray-50` (alternating optional)
- **Accent Icons**: `bg-blue-100`, `text-blue-500`
- **Borders**: `border-gray-200`

### Typography Scale
- **H1 (Hero Headline)**: `text-3xl md:text-4xl lg:text-5xl font-normal`
- **H2 (Section Titles)**: `text-3xl md:text-4xl font-normal`
- **H3 (Subsection Titles)**: `text-2xl font-semibold`
- **Body**: `text-base md:text-lg leading-relaxed`
- **Small Text**: `text-sm`

### Spacing System
- **Section Padding**: `py-12 md:py-20` (Hero), `py-16 md:py-24` (other sections)
- **Container**: `container mx-auto px-4 md:px-6 max-w-6xl` (standard), `max-w-7xl` (Hero)
- **Grid Gaps**: `gap-12 lg:gap-16` (Hero), `gap-12` (Benefits)

### Component Patterns

#### Icon Style (Benefits)
```tsx
<div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
  <svg className="w-8 h-8 text-blue-500" /* checkmark icon */>
</div>
```

#### Quote Style (Proof)
```tsx
<svg className="w-16 h-16 text-blue-200 mb-4" /* quotation mark */>
<blockquote>
  <p className="text-lg text-gray-700 leading-relaxed mb-6">{quote.text}</p>
  <footer>
    <cite className="block text-gray-900 font-semibold">{name}</cite>
    <p className="text-gray-600 text-sm">{role}, {company}</p>
  </footer>
</blockquote>
```

#### CTA Button Style
```tsx
<a
  href={href}
  target="_blank"
  rel="noopener noreferrer"
  className="inline-block px-10 py-3.5 bg-slate-700 hover:bg-slate-800 text-white font-medium text-base rounded-md transition-colors duration-200"
>
  {text}
</a>
```

#### Video Embed Style (Vimeo)
```tsx
<div className="relative w-full bg-gray-100 rounded-lg overflow-hidden shadow-md" style={{ paddingBottom: '56.25%' }}>
  <iframe
    src={getVimeoEmbedUrl(vimeoId)}
    className="absolute top-0 left-0 w-full h-full"
    frameBorder="0"
    allow="autoplay; fullscreen; picture-in-picture"
    allowFullScreen
    title="Product video"
    loading="lazy"
  />
</div>
```

---

## 📐 Section Specifications

### 1. Hero Section

**Purpose**: Grab attention, communicate core value, drive meeting booking

**Layout**: 2-column grid (text left, video right)

**Required Fields**:
- `headline` (from `biggestBusinessBenefitBuyerStatement`)

**Optional Fields**:
- `subhead` (from `synopsisBusinessBenefit`)
- `cta.href` (from `meetingSchedulerLink` or `sellerLinkWebsite`)
- `cta.text` (default: "Book a meeting")
- `media.videoUrl` (from `quickDemoLinks`)

**Rendering Rules**:
- H1 must be used for headline (only H1 on page)
- Subhead supports multi-paragraph (`\n\n` split)
- CTA only renders if `href` exists
- Video: If Vimeo URL, embed iframe; else show "Watch Video" link
- Video lazy-loads (`loading="lazy"`)

**Accessibility**:
- H1 for headline (semantic hierarchy)
- Links: `target="_blank"` + `rel="noopener noreferrer"`
- iframe: `title="Product video"`

**Example Mapping**:
```typescript
hero: {
  headline: raw.biggestBusinessBenefitBuyerStatement,
  subhead: raw.synopsisBusinessBenefit,
  cta: {
    text: 'Book a meeting',
    href: raw.meetingSchedulerLink || raw.sellerLinkWebsite,
  },
  media: {
    videoUrl: raw.quickDemoLinks,
  },
}
```

---

### 2. Benefits Section

**Purpose**: Highlight 3 key operational benefits

**Layout**: 3-column grid (1 column on mobile)

**Required Fields**:
- `benefits.items[]` (at least 1 item)
- `items[].title` (benefit statement)

**Optional Fields**:
- `benefits.title` (section headline, from `highestOperationalBenefitStatement`)
- `items[].body` (benefit explanation)

**Rendering Rules**:
- Centered layout
- Blue checkmark icons (circle bg)
- Auto-skip if `items` array is empty

**Visual Elements**:
- Icon: Blue checkmark in circular blue background
- Centered text alignment
- Equal-height cards

**Example Mapping**:
```typescript
benefits: {
  title: raw.highestOperationalBenefit.highestOperationalBenefitStatement,
  items: raw.highestOperationalBenefit.benefits.map(b => ({
    title: b.statement,
    body: b.content,
  })),
}
```

---

### 3. Options Section

**Purpose**: Present pilot paths, pricing tiers, or package options

**Layout**: Multi-column grid (2-3 columns based on count)

**Required Fields**:
- `options.cards[]` (at least 1 card)
- `cards[].title`

**Optional Fields**:
- `cards[].description`

**Rendering Rules**:
- Auto-skip if `cards` array is empty
- Equal-height cards with borders
- Centered text

**Visual Style**:
- White cards with subtle border
- Hover effects optional
- Clean, minimal design

**Example Mapping**:
```typescript
options: {
  cards: raw.options.map(opt => ({
    title: opt.title,
    description: opt.description,
  })),
}
```

---

### 4. Proof Section

**Purpose**: Build credibility with case study + testimonial

**Layout**: 2-column grid (summary left, quote right)

**Optional Fields** (all):
- `title` (section headline)
- `summaryTitle` (case study title)
- `summaryBody` (case study description)
- `quote.text` (testimonial)
- `quote.attribution.name`
- `quote.attribution.role`
- `quote.attribution.company`

**Rendering Rules**:
- Auto-skip if all fields empty
- Quote shows large quotation mark icon
- Attribution shown as: `{name}` on one line, `{role}, {company}` on next

**Visual Elements**:
- Large blue quotation mark (SVG)
- Blockquote semantic HTML
- `<cite>` for attribution

**Example Mapping**:
```typescript
proof: {
  title: raw.mostRelevantProof.title,
  summaryTitle: raw.mostRelevantProof.summaryTitle,
  summaryBody: raw.mostRelevantProof.summaryContent, // Note: summaryContent vs summaryBody
  quote: {
    text: raw.mostRelevantProof.quoteContent,
    attribution: {
      name: raw.mostRelevantProof.quoteAuthorFullname,
      role: raw.mostRelevantProof.quoteAuthorDesignation,
      company: raw.mostRelevantProof.quoteAuthorCompany,
    },
  },
}
```

---

### 5. Social Proofs Section

**Purpose**: Display awards, press mentions, case studies (links)

**Layout**: Grid of link cards (3 columns)

**Required Fields**:
- `social.items[]` (at least 1 item)
- `items[].link` (URL)

**Optional Fields**:
- `items[].type` (e.g., "Customer Story", "Press Release")
- `items[].description` (link text)

**Rendering Rules**:
- Auto-skip if `items` array empty
- All links open in new tab
- Links: `target="_blank"` + `rel="noopener noreferrer"`

**Visual Style**:
- Clean link cards with icon/badge
- Type displayed as badge or prefix
- Hover underline on description

**Example Mapping**:
```typescript
social: {
  items: raw.socialProofs.map(sp => ({
    type: sp.type,
    description: sp.description,
    link: sp.link,
  })),
}
```

---

### 6. Secondary Benefit Section

**Purpose**: Highlight one more key differentiator

**Layout**: Single-column centered text

**Optional Fields**:
- `title` (from `secondHighestOperationalBenefitStatement`)
- `body` (from `secondHighestOperationalBenefitDescription`)

**Rendering Rules**:
- Auto-skip if both fields empty
- Simpler layout than Benefits (no icons)

**Visual Style**:
- Centered layout
- Standard H2 + paragraph

**Example Mapping**:
```typescript
secondary: {
  title: raw.secondHighestOperationalBenefitStatement,
  body: raw.secondHighestOperationalBenefitDescription,
}
```

---

### 7. Seller Info Section

**Purpose**: Provide vendor background and links

**Optional Fields**:
- `body` (from `sellerDescription`)
- `links.primary` (from `sellerLinkWebsite`)
- `links.more` (from `sellerLinkReadMore`)

**Rendering Rules**:
- Auto-skip if all fields empty
- Links rendered as inline CTAs

**Visual Style**:
- Paragraph + link buttons
- Standard button styling

**Example Mapping**:
```typescript
seller: {
  body: raw.sellerDescription,
  links: {
    primary: raw.sellerLinkWebsite,
    more: raw.sellerLinkReadMore,
  },
}
```

---

### 8. Footer Section

**Purpose**: Final CTA and copyright

**Fields**:
- `cta` (mirrors hero CTA if available)
- `brandLogoUrl` (optional, from `brand.logoUrl`)

**Rendering Rules**:
- Always rendered (even if CTA empty)
- Auto-year for copyright
- Logo displayed if provided

**Visual Style**:
- Dark background or bordered section
- Centered CTA button

**Example Mapping**:
```typescript
footer: {
  cta: ctaHref ? {
    text: 'Book a meeting',
    href: ctaHref,
  } : null,
}
```

---

## ✅ Validation Rules

### Required Fields (Blocking Errors)
1. `biggestBusinessBenefitBuyerStatement` (E-HERO-REQ)
2. At least 2 sections with content (E-MIN-SECTION)
3. All URLs must be HTTPS (E-URL-HTTPS)
4. CTA requires both `text` and `href` (E-CTA-REQ)

### Text Length Limits

| Field | Soft Cap | Hard Limit | Error Code |
|-------|----------|------------|------------|
| `biggestBusinessBenefitBuyerStatement` | 90 chars | 108 chars | E-TEXT-LIMIT |
| `synopsisBusinessBenefit` | 220 chars | 264 chars | E-TEXT-LIMIT |
| Benefit `content` | 400 chars | 480 chars | E-TEXT-LIMIT |
| Quote `text` | 300 chars | 360 chars | E-TEXT-LIMIT |

**Note**: Exceeding soft cap → warning (W-HERO-LONG, etc.). Exceeding hard limit → blocking error.

### URL Validation
- All URLs must start with `https://`
- Vimeo URLs: `https://vimeo.com/{video_id}` or `https://player.vimeo.com/video/{video_id}`
- Malformed URLs → E-URL-INVALID

### Contrast Validation
- Text/background contrast must meet WCAG AA (4.5:1)
- If contrast fails → auto-adjust + W-CONTRAST warning

---

## 🔄 Normalization Process

### Flow
1. **Input**: Raw JSON (paste or file upload)
2. **Sanitize**: Trim whitespace, standardize quotes, collapse extra spaces
3. **Map**: Transform to normalized schema
4. **Validate**: Check required fields, limits, URLs
5. **Hash**: Generate SHA-256 of stable-stringified normalized JSON
6. **Slug**: Generate `page_url_key` (buyer-seller-mmyy-vN)
7. **Render**: Pass to component tree

### Sanitization Rules
```typescript
const sanitize = (text: string | undefined | null): string | null => {
  if (!text) return null;
  return text
    .trim()
    .replace(/\s+/g, ' ')      // Collapse whitespace
    .replace(/[""]/g, '"')     // Standardize quotes
    .replace(/['']/g, "'");
};
```

### CTA Fallback Logic
```typescript
const ctaHref = 
  raw.meetingSchedulerLink || 
  raw.sellerLinkWebsite || 
  '';
```

---

## 🎬 Vimeo Video Handling

### Vimeo URL Parsing
```typescript
function parseVimeoId(url: string): string | null {
  const match = url.match(/vimeo\.com\/(\d+)/);
  return match ? match[1] : null;
}

function getVimeoEmbedUrl(vimeoId: string): string {
  return `https://player.vimeo.com/video/${vimeoId}?title=0&byline=0&portrait=0`;
}
```

### Rendering Logic
- If Vimeo ID extracted → render iframe
- Else → render "Watch Video" link button
- Iframe uses 16:9 aspect ratio (`padding-bottom: 56.25%`)

---

## 🧪 Testing Strategy

### Test Cases (Minimum)
1. **Valid JSON with all sections** → renders all 8 sections
2. **Minimal JSON (hero only)** → renders hero + footer
3. **Missing required field** → validation error
4. **HTTP URL** → validation error (E-URL-HTTPS)
5. **Text over hard limit** → validation error (E-TEXT-LIMIT)
6. **Empty benefits array** → auto-skip Benefits section
7. **Vimeo URL** → iframe renders
8. **Non-Vimeo URL** → link button renders
9. **Multi-paragraph subhead** → splits on `\n\n`
10. **Quote with full attribution** → name + role + company

### Manual Visual Testing
- Open Studio at `/studio`
- Paste provided JSON
- Fill metadata: buyer_id, seller_id, mmyy
- Click "Validate & Normalize"
- Verify all sections render
- Check mobile responsiveness (375px, 768px, 1024px)

---

## 📱 Responsive Breakpoints

### Tailwind Breakpoints (Default)
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px

### Grid Behavior
- **Hero**: 1 column mobile, 2 columns lg+
- **Benefits**: 1 column mobile, 3 columns md+
- **Options**: 1 column mobile, 2-3 columns md+ (based on count)
- **Proof**: 1 column mobile, 2 columns md+
- **Social Proofs**: 1 column mobile, 2-3 columns md+

---

## 🚀 Performance Optimizations

1. **Lazy Loading**: iframe `loading="lazy"`
2. **External Links**: `rel="noopener noreferrer"` for security
3. **Minimal Dependencies**: No external libraries beyond Next.js
4. **Auto-skip Empty Sections**: No wasted DOM nodes
5. **Static Analysis**: TypeScript strict mode, 0 errors

---

## 🔐 Security & Accessibility

### Security
- All external links: `target="_blank"` + `rel="noopener noreferrer"`
- HTTPS-only URLs enforced
- No inline JavaScript in JSON
- No HTML rendering (text only, sanitized)

### Accessibility (WCAG AA)
- Semantic HTML (`<h1>`, `<h2>`, `<blockquote>`, `<cite>`)
- Color contrast 4.5:1 minimum
- Keyboard navigation support
- Screen reader friendly
- `alt` text for images (future)
- `title` for iframes

---

## 🎯 Multi-Company Template Strategy

### Personalization Points
1. **Content**: Fully dynamic from JSON (buyer name, seller name, benefits)
2. **Branding**: `brand.logoUrl`, `brand.colors`, `brand.fonts` (optional)
3. **CTAs**: Custom URLs (`meetingSchedulerLink`, `sellerLinkWebsite`)
4. **Proof**: Company-specific case studies, testimonials
5. **Social Proofs**: Relevant awards, press, case studies per seller

### Consistency Points
1. **Layout**: Standardized section order and grid systems
2. **Typography**: Consistent heading hierarchy
3. **Colors**: Default Tailwind palette (overridable via `brand.colors`)
4. **Validation**: Same rules for all companies
5. **Accessibility**: WCAG AA for all

### Future Enhancements
- [ ] A/B testing variants (CTA text, layouts)
- [ ] Analytics tracking (button clicks, scroll depth)
- [ ] OG image generation per page
- [ ] SEO meta tags (dynamic from JSON)
- [ ] Multi-language support
- [ ] Custom CSS overrides per company

---

## 📝 GitHub Copilot Prompts

### For Creating New Sections
```
Create a new landing page section component for [SECTION_NAME].
- Props: Accept normalized data from NormalizedContent.[SECTION_NAME]
- Layout: [describe layout]
- Auto-skip if data is empty (return null)
- Use Tailwind classes: [list key classes]
- Accessibility: [list requirements]
```

### For Updating Validation
```
Add validation rule for [FIELD_NAME]:
- Error code: E-[CODE]
- Condition: [describe condition]
- Message: "[user-facing message]"
- Blocking: yes/no
```

### For Mapping New Fields
```
Update mapRawToNormalized to map:
- Raw field: raw.[FIELD_PATH]
- Normalized field: normalized.[SECTION].[FIELD]
- Sanitization: yes/no
- Default value: [value if empty]
```

---

## 🔗 Reference Links

### Key Files
- `lib/normalize/normalized.types.ts` - TypeScript schema
- `lib/normalize/mapRawToNormalized.ts` - JSON transformation
- `lib/validate/rules.ts` - Validation rules
- `components/landing/*` - Section components
- `app/(studio)/studio/page.tsx` - Studio UI
- `docs/PART_A_COMPLETE.md` - Project summary

### External Resources
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [WCAG 2.0 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Vimeo Player API](https://developer.vimeo.com/player/sdk)

---

## ✨ Quick Start for New Company

1. **Gather Content**: Collect all JSON fields from seller
2. **Paste JSON**: Open `/studio`, paste JSON
3. **Add Metadata**: buyer_id, seller_id, mmyy, version
4. **Validate**: Click "Validate & Normalize"
5. **Review**: Check live preview on right side
6. **Deploy**: (Part B - coming soon)

---

**Template Version**: 2.0  
**Maintained by**: Hrytos Landing Page Studio Team  
**Last Review**: October 29, 2025
