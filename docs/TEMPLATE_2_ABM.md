# Template 2: ABM (Account-Based Marketing) Landing Page

## Overview
This is a specialized template for **B2B Account-Based Marketing** campaigns. It creates personalized landing pages for specific buyer-seller relationships, focusing on how a seller's solution addresses a specific buyer's business challenges.

## Template File
- **Location**: `public/template-2-abm-adient-cyngn.json`
- **Example**: Cyngn (seller) → Adient (buyer)
- **Use Case**: Industrial automation, manufacturing solutions

## Template Structure

### 1. **Company Information** (Required)
```json
{
  "BuyersName": "Adient",
  "SellersName": "Cyngn"
}
```
Used throughout the page for dynamic personalization.

### 2. **Hero Section** (Required)
- **biggestBusinessBenefitBuyerStatement**: Main headline - the #1 benefit for the buyer
- **synopsisBusinessBenefit**: Subheadline - problem statement (shows as subhead)
- **shortDescriptionBusinessBenefit**: Extended description paragraph
- **quickDemoLinks**: Video URL (Vimeo, YouTube, etc.)
- **meetingSchedulerLink**: Primary CTA link

**Renders as:**
- Large headline with buyer's name
- Problem statement subheading
- Detailed description
- Video embed
- CTA button: "Talk to {SellerName}"

### 3. **Benefits Section**
```json
{
  "highestOperationalBenefit": {
    "highestOperationalBenefitStatement": "Section title",
    "benefits": [
      {
        "statement": "Benefit headline",
        "content": "Detailed explanation..."
      }
    ]
  }
}
```
**Renders as:** 3-column grid of benefit cards with icon, title, and description.

### 4. **Options Section** 
```json
{
  "synopsisAutomationOptions": "Introduction paragraph",
  "options": [
    {
      "title": "Option 1 title",
      "description": "Details about this path..."
    }
  ]
}
```
**Auto-generates title**: "How can {Seller} help {Buyer} ?"
**Renders as:** Cards showing different implementation paths/pilots with CTA buttons.

### 5. **Proof Section** (Customer Story)
```json
{
  "mostRelevantProof": {
    "title": "Story headline",
    "summaryTitle": "Quick stat",
    "summaryContent": "Story summary...",
    "quoteContent": "Customer testimonial quote",
    "quoteAuthorFullname": "John Doe",
    "quoteAuthorDesignation": "VP Operations",
    "quoteAuthorCompany": "Acme Corp"
  }
}
```
**Renders as:** Full-width case study with stat, narrative, and testimonial quote.

### 6. **Social Proofs Section**
```json
{
  "socialProofs": [
    {
      "type": "Customer Story | Case Study | Press Release",
      "description": "Brief description",
      "link": "https://..."
    }
  ],
  "sellerLinkReadMore": "https://..."
}
```
**Auto-generates headline**: "More reasons why {Buyer} should partner with {Seller}"
**Renders as:** Grid of social proof cards with links + "Read more" CTA.

### 7. **Secondary Benefit Section**
```json
{
  "secondHighestOperationalBenefitStatement": "Benefit title",
  "secondHighestOperationalBenefitDescription": "Detailed explanation..."
}
```
**Renders as:** Full-width section with title, body text, and CTA button.

### 8. **Seller Info Section**
```json
{
  "sellerDescription": "About the company...",
  "sellerLinkWebsite": "https://company.com",
  "sellerLinkReadMore": "https://company.com/resources"
}
```
**Renders as:** Company description with links to website and resources.

### 9. **Footer**
- Auto-generates final CTA: "Book a meeting" linking to `meetingSchedulerLink`

## Key Features

### Dynamic Content Generation
- **Options title**: Auto-generates "How can {Seller} help {Buyer} ?"
- **Social proofs headline**: "More reasons why {Buyer} should partner with {Seller}"
- **CTA text**: "Talk to {SellerName}" throughout

### Required Fields
Only 3 fields are absolutely required:
1. `BuyersName`
2. `SellersName`
3. `biggestBusinessBenefitBuyerStatement`

All other fields are optional - sections won't render if data is missing.

### URL Fields
All links are validated:
- `quickDemoLinks` - Video (Vimeo recommended)
- `meetingSchedulerLink` - Meeting scheduler (HubSpot, Calendly, etc.)
- `sellerLinkWebsite` - Company website
- `sellerLinkReadMore` - Resources/case studies page
- `socialProofs[].link` - External proof links

### Text Length Limits
- Headline: ≤ 90 characters
- Subhead: ≤ 180 characters
- Benefit body: ≤ 400 characters
- Quote: ≤ 300 characters
- Meta description: ≤ 160 characters (auto-truncated)

## Design Philosophy

This template follows the **ABM landing page best practices**:

1. **Hyper-personalization**: Buyer and seller names appear throughout
2. **Problem → Solution flow**: Start with buyer's pain, show solution
3. **Social proof heavy**: Multiple proof points to build trust
4. **Multiple CTAs**: Meeting links at hero, options, secondary, footer
5. **Storytelling**: Customer success story as centerpiece
6. **Flexibility**: Options section shows multiple engagement paths

## Differences from Template 1 (Generic SaaS)

| Feature | Template 1 (SaaS) | Template 2 (ABM) |
|---------|------------------|------------------|
| **Audience** | General public | Specific company |
| **Tone** | Broad benefits | Personalized solutions |
| **Pricing** | Price tiers | No pricing (enterprise) |
| **CTA** | "Start Free Trial" | "Talk to {Seller}" |
| **Sections** | Features, pricing | Options, proof stories |
| **Company names** | Not mentioned | Throughout page |

## Usage Example

### Step 1: Copy template
```bash
cp public/template-2-abm-adient-cyngn.json public/my-abm-campaign.json
```

### Step 2: Customize
- Update `BuyersName` and `SellersName`
- Rewrite `biggestBusinessBenefitBuyerStatement` for your buyer
- Update all content to match your solution
- Add your video, meeting scheduler, and links

### Step 3: Test in Studio
1. Go to `/studio`
2. Paste your JSON
3. Validate and preview
4. Publish when ready

## Existing Templates

1. **template-1-saas**: `public/sample-landing-page.json` - Generic SaaS product
2. **template-2-abm**: `public/template-2-abm-adient-cyngn.json` - B2B ABM campaign (this one)
3. **template-2-abm-v1**: `public/adient-cyngn-sample.json` - Original version (same as above)

## Next Steps

To create more template variations:
1. Copy this template JSON
2. Customize for different industries (healthcare, finance, logistics, etc.)
3. Add industry-specific sections if needed
4. Update validation rules if new fields are added
