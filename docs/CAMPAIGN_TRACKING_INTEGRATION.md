# 🎯 Campaign Tracking Integration Guide

## Overview

This guide explains how to integrate email campaign tracking into the Landing Page Studio, merging the functionality from your separate `email-campaign-tracker` service into one unified system.

---

## 📊 Why Merge Into One System?

### Before (Two Separate Systems)
```
┌─────────────────────────────┐
│  email-campaign-tracker     │
│  tracker.vercel.app         │
│  - Separate Vercel deploy   │
│  - Separate Supabase DB     │
│  - /r/[token] redirect      │
│  - /api/events logging      │
└─────────────────────────────┘
           ↓ redirects to
┌─────────────────────────────┐
│  landing-page-studio        │
│  studio.vercel.app          │
│  - Separate Vercel deploy   │
│  - Separate Supabase DB     │
│  - /p/[slug] landing pages  │
│  - PostHog (anonymous)      │
└─────────────────────────────┘
```

**Problems:**
- ❌ Two Vercel projects to manage
- ❌ Two Supabase databases
- ❌ No person identification in PostHog
- ❌ Complex integration
- ❌ Higher costs

### After (Unified System)
```
┌─────────────────────────────────────────┐
│  landing-page-studio (UNIFIED)          │
│  studio.vercel.app                      │
│                                         │
│  ✅ ONE Vercel deployment               │
│  ✅ ONE Supabase database               │
│  ✅ /p/[slug] - landing pages           │
│  ✅ /r/[token] - email redirects        │
│  ✅ /api/events - event tracking        │
│  ✅ /studio - page builder              │
│  ✅ /studio/campaigns - campaign mgmt   │
│  ✅ PostHog with person identification  │
└─────────────────────────────────────────┘
```

**Benefits:**
- ✅ Simpler architecture
- ✅ Unified data model
- ✅ Full person identification
- ✅ Easier to develop & maintain
- ✅ Lower costs

---

## 🚀 Implementation Steps

### Step 1: Database Migration ✅ **DONE**

Run the migration to add campaign tracking tables:

```bash
# Apply migration to your Supabase database
# Go to Supabase SQL Editor and run:
migrations/002_Add_Campaign_Tracking.sql
```

**Tables Added:**
- `contacts` - Email campaign recipients (already exists)
- `sl_campaigns` - Campaign definitions (already exists)
- `landing_page_token` - Unique tracking tokens per contact
  - `token` - Short token (e.g., abc123_john)
  - `tracking_url` - Full URL (e.g., https://studio.vercel.app/r/abc123_john)
- `landing_page_visitors` - Visitor tracking
- `landing_page_events` - All visitor events
  - Includes denormalized `full_name` field from contacts for fast queries

**Views Created:**
- `campaign_performance` - Campaign metrics
- `contact_journey` - Per-contact engagement

### Step 2: Add Redirect Endpoint

Create `/r/[token]` route in your studio app:

**File:** `app/r/[token]/route.ts`

This endpoint:
1. Receives token from email link
2. Looks up contact, campaign, landing page
3. Generates visitor_id
4. Logs email_click event (with contact_id and full_name)
5. Redirects to landing page with tracking params

### Step 3: Add Event Logging API

Create `/api/events` endpoint:

**File:** `app/api/events/route.ts`

This endpoint:
1. Receives events from landing page JavaScript
2. Attributes events to contacts via visitor_id (includes full_name)
3. Logs to landing_page_events table
4. Updates visitor statistics

### Step 4: Update Analytics to Identify Persons

Modify `AnalyticsPageWrapper` to:
1. Extract token from URL parameter
2. Fetch contact data
3. Identify person in PostHog
4. Register tenant + contact context

### Step 5: Add Contact Selection to Landing Page Creation (Recommended)

Enhance landing page creation flow with contact assignment:

**Location:** Studio page builder (where you create/edit landing pages)

**New UI Components:**
1. **Campaign Dropdown** (already exists)
   - Select which campaign this landing page is for
   
2. **Contact Multi-Select** (NEW)
   - Searchable multi-select field
   - Type to search: name, email, or company
   - Shows: `John Doe (john@acme.com) - Acme Corp`
   - Real-time search results as you type
   - Select multiple contacts (chips/badges)
   - Powered by: `/api/contacts/search?q={query}&campaign_id={campaign_id}`

3. **Publish Button** (already exists - enhance)
   - Saves landing page content
   - Automatically generates tokens for ALL selected contacts
   - Shows success modal with generated links

**Workflow:**
```
Create/Edit Landing Page
    ↓
Design landing page content
    ↓
Select Campaign (dropdown)
    ↓
Search & Select Contacts (multi-select field)
    ↓
Click "Publish"
    ↓
System automatically generates unique token for EACH contact:
  - contact_id: John Doe UUID
  - contact_id: Jane Smith UUID  
  - contact_id: Bob Wilson UUID
  - campaign_id: Q1 Outreach UUID
  - landing_page_id: acme-demo UUID
    ↓
Shows success modal with all personalized links:
  📋 John Doe: https://studio.vercel.app/r/abc123_john
  📋 Jane Smith: https://studio.vercel.app/r/def456_jane
  📋 Bob Wilson: https://studio.vercel.app/r/ghi789_bob
    ↓
Copy links for email campaign tool (Smartlead, Instantly, etc.)
```

### Step 6: Create Contact Search API

**Create:** `app/api/contacts/search/route.ts`

This endpoint powers the searchable contact dropdown:

```typescript
// GET /api/contacts/search?q=john&campaign_id=uuid
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q') || '';
  const campaignId = searchParams.get('campaign_id');
  
  // Search contacts by name, email, or company
  const { data } = await supabaseAdmin
    .from('contacts')
    .select('id, email, first_name, last_name, full_name, company_name')
    .or(`email.ilike.%${query}%,full_name.ilike.%${query}%,company_name.ilike.%${query}%`)
    .limit(20);
  
  // Check which contacts already have tokens for this campaign
  const contactIds = data.map(c => c.id);
  const { data: existingTokens } = await supabaseAdmin
    .from('landing_page_token')
    .select('contact_id, token')
    .eq('campaign_id', campaignId)
    .in('contact_id', contactIds);
  
  // Merge data
  const results = data.map(contact => ({
    ...contact,
    hasToken: existingTokens?.some(t => t.contact_id === contact.id),
    existingToken: existingTokens?.find(t => t.contact_id === contact.id)?.token
  }));
  
  return Response.json(results);
}
```

**Also create:** `app/api/tokens/generate/route.ts`

This endpoint generates tokens in bulk when landing page is published:

**Important:** The endpoint saves both `token` (short) and `tracking_url` (full URL) to the database. This allows:
- Easy display in UI (no URL reconstruction needed)
- Environment-aware URLs (localhost, staging, production)
- Historical record (if base URL changes, old links preserved)
- Query convenience (SELECT tracking_url directly)

```typescript
// POST /api/tokens/generate
// Body: { contact_ids: [uuid1, uuid2, ...], campaign_id, landing_page_id }
export async function POST(req: Request) {
  const { contact_ids, campaign_id, landing_page_id } = await req.json();
  
  // Check which contacts already have tokens
  const { data: existingTokens } = await supabaseAdmin
    .from('landing_page_token')
    .select('contact_id, token')
    .eq('campaign_id', campaign_id)
    .eq('landing_page_id', landing_page_id)
    .in('contact_id', contact_ids);
  
  const existingContactIds = new Set(existingTokens?.map(t => t.contact_id) || []);
  const newContactIds = contact_ids.filter(id => !existingContactIds.has(id));
  
  // Generate tokens for new contacts
  const newTokens = [];
  for (const contact_id of newContactIds) {
    const token = generateUniqueToken(); // e.g., abc123_john
    const tracking_url = `${process.env.NEXT_PUBLIC_BASE_URL}/r/${token}`;
    
    newTokens.push({
      token,
      tracking_url,  // Full URL stored in DB
      contact_id,
      campaign_id,
      landing_page_id,
      expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days
    });
  }
  
  // Bulk insert
  if (newTokens.length > 0) {
    await supabaseAdmin
      .from('landing_page_token')
      .insert(newTokens);
  }
  
  // Fetch all tokens (existing + new) with contact details
  const { data: allTokens } = await supabaseAdmin
    .from('landing_page_token')
    .select(`
      token,
      tracking_url,
      contact:contacts(
        email,
        full_name,
        company_name
      )
    `)
    .eq('campaign_id', campaign_id)
    .eq('landing_page_id', landing_page_id)
    .in('contact_id', contact_ids);
  
  return Response.json({
    tokens: allTokens,  // Contains tracking_url for each contact
    newCount: newTokens.length,
    existingCount: existingTokens?.length || 0
  });
}
```

---

## 🔄 Complete User Flow

### 1. Seller Creates Personalized Landing Page

```
Studio UI (/studio) - Creating/Editing Landing Page
    ↓
Design landing page content (already works)
    ↓
Select Campaign: "Q1 Outreach" (dropdown)
    ↓
Search & Select Multiple Contacts:
  - Type "john" → shows John Doe, John Smith, etc.
  - Type "acme" → shows all Acme Corp contacts
  - Select: John Doe (john.doe@acme.com) - Acme Corp
  - Select: Jane Smith (jane.smith@acme.com) - Acme Corp
  - Select: Bob Wilson (bob@techcorp.com) - TechCorp
    ↓
Click "Publish" (saves page + generates tokens)
    ↓
System automatically generates unique token for EACH contact:
  Token: abc123_john
  URL: https://studio.vercel.app/r/abc123_john
  ↓
  Token: def456_jane
  URL: https://studio.vercel.app/r/def456_jane
  ↓
  Token: ghi789_bob
  URL: https://studio.vercel.app/r/ghi789_bob
  
  (All saved to landing_page_token table with full tracking_url)
    ↓
Success modal shows all personalized links (from database):
  ✅ Published! Generated 3 tracking links:
  
  📋 John Doe (Acme Corp)
     https://studio.vercel.app/r/abc123_john
     
  📋 Jane Smith (Acme Corp)
     https://studio.vercel.app/r/def456_jane
     
  📋 Bob Wilson (TechCorp)
     https://studio.vercel.app/r/ghi789_bob
  
  [Copy All Links] [Export CSV]
    ↓
Paste links into email campaign tool (Smartlead, Instantly, etc.)
```

### 2. John Clicks Email Link

```
Email: https://studio.vercel.app/r/abc123xyz789john
    ↓
Studio app receives request at /r/abc123xyz789john
    ↓
Looks up token in database:
  - contact: John Doe (john.doe@acme.com)
  - campaign: Q1 Outreach
  - landing_page: acme-demo (slug)
    ↓
Generates visitor_id: v_xyz789
Generates session_id: s_abc456
    ↓
Logs event to landing_page_events:
  - event_type: 'email_click'
  - visitor_id: 'v_xyz789'
  - contact_id: John's UUID
  - full_name: 'John Doe'
  - campaign_id: Q1 Outreach UUID
  - attribution_confidence: 1.0 (100%)
    ↓
Redirects to:
https://studio.vercel.app/p/acme-demo?r=abc123xyz789john&vid=v_xyz789&sid=s_abc456
```

### 3. Landing Page Loads with Tracking

```
Landing page at /p/acme-demo loads
    ↓
AnalyticsPageWrapper reads URL params:
  - r=abc123xyz789john (token)
  - vid=v_xyz789 (visitor_id)
  - sid=s_abc456 (session_id)
    ↓
Fetches contact data from token:
  - email: john.doe@acme.com
  - name: John Doe
  - company: Acme Corp
  - campaign: Q1 Outreach
    ↓
Identifies person in PostHog:
posthog.identify('v_xyz789', {
  email: 'john.doe@acme.com',
  name: 'John Doe',
  company: 'Acme Corp',
  contact_id: 'uuid-john',
  campaign_id: 'uuid-q1-outreach',
  campaign_name: 'Q1 Outreach'
})
    ↓
Registers tenant context:
{
  buyer_id: 'acme',
  seller_id: 'cyngn',
  page_url_key: 'acme-demo',
  contact_email: 'john.doe@acme.com',
  contact_company: 'Acme Corp',
  campaign_id: 'uuid-q1-outreach'
}
    ↓
All subsequent events tracked with full attribution
```

### 4. User Interacts with Page

```
John scrolls 50% down page
    ↓
useScrollDepth() hook fires
    ↓
Sends to PostHog:
  - event: 'scroll_depth'
  - properties: { depth_pct: 50, depth_px: 1200 }
  - person: John Doe (john.doe@acme.com)
  - company: Acme Corp
  - campaign: Q1 Outreach
    ↓
Also logs to custom DB:
POST /api/events
{
  event_type: 'scroll_depth',
  visitor_id: 'v_xyz789',
  session_id: 's_abc456',
  metadata: { depth_pct: 50, depth_px: 1200 }
}
    ↓
Backend attributes to contact:
  - Looks up visitor_id → finds contact from email_click
  - Logs to landing_page_events table with contact_id
```

### 5. John Clicks CTA Button

```
John clicks "Book Meeting" button
    ↓
trackCtaClick() fires
    ↓
Sends to PostHog:
  - event: 'cta_click'
  - properties: { cta_id: 'book_meeting', cta_location: 'hero' }
  - person: John Doe
    ↓
Also logs to custom DB:
POST /api/events
{
  event_type: 'cta_click',
  visitor_id: 'v_xyz789',
  metadata: { cta_id: 'book_meeting', cta_location: 'hero' }
}
    ↓
Backend logs with full attribution
```

---

## 📊 What You Can Track

### In PostHog Dashboard

**Person Profile: John Doe**
```
Email: john.doe@acme.com
Company: Acme Corp
Campaign: Q1 Outreach
First Seen: Jan 15, 2026 2:30 PM
Total Visits: 3
Total Time: 8m 45s

Timeline:
  Jan 15 14:30 - email_click (Q1 Outreach)
  Jan 15 14:30 - landing_visit (acme-demo)
  Jan 15 14:31 - scroll_depth (25%)
  Jan 15 14:32 - scroll_depth (50%)
  Jan 15 14:33 - hover_component (proof_section, 2.3s)
  Jan 15 14:35 - cta_click (book_meeting, hero)
  Jan 15 14:38 - landing_leave (8m 45s)
```

**Session Recording:**
- Watch video of John's session
- See exactly what he clicked
- Identify friction points

**Company View: Acme Corp**
```
Total Contacts: 5
  - John Doe (VP Engineering) - Clicked, Converted ✅
  - Jane Smith (CTO) - Clicked, Viewed
  - Bob Jones (Director) - Not opened yet
  - ...

Total Engagement: 25m 30s
Conversion Rate: 20% (1/5 booked)
```

### In Custom Database

**Query Campaign Performance:**
```sql
SELECT * FROM campaign_performance
WHERE name = 'Q1 Outreach';

-- Results:
total_recipients: 100
unique_clickers: 65 (65%)
total_clicks: 87
unique_viewers: 62 (95% of clickers)
unique_converters: 18 (29% conversion)
```

**Query Contact Journey:**
```sql
SELECT * FROM contact_journey
WHERE email = 'john.doe@acme.com';

-- Results:
campaign_name: Q1 Outreach
click_count: 1
first_clicked_at: Jan 15 14:30
page_views: 3
cta_clicks: 1
last_activity_at: Jan 18 10:15
```

---

## 🔧 Environment Variables Needed

Add to your `.env.local` and Vercel:

```bash
# Supabase (ONE database now)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE=your-service-role-key

# PostHog
NEXT_PUBLIC_POSTHOG_KEY=phc_your_key
NEXT_PUBLIC_POSTHOG_HOST=https://us.posthog.com

# Optional: Public URL for generating tracking links
NEXT_PUBLIC_BASE_URL=https://studio.vercel.app
```

---

## 💡 Key Differences from Separate System

### What Changes:
- ✅ **Database**: ONE Supabase instance (not two)
- ✅ **Deployment**: ONE Vercel project (not two)
- ✅ **Routes**: `/r/[token]` and `/api/events` now in studio app
- ✅ **PostHog**: Gets person identification automatically

### What Stays the Same:
- ✅ **Token generation logic**: Same algorithm
- ✅ **Redirect flow**: Same user experience
- ✅ **Event tracking**: Same events captured
- ✅ **Attribution**: Same confidence levels

### What's Better:
- ✅ **PostHog** now knows who each person is
- ✅ **Session recordings** linked to contacts
- ✅ **Simpler architecture** - one codebase
- ✅ **Unified analytics** - PostHog + custom DB
- ✅ **Lower costs** - one Vercel project

---

## 🚀 Next Steps

### Backend Implementation

1. **Run Database Migration** ✅
   - Execute `002_Add_Campaign_Tracking.sql` in Supabase

2. **Add Redirect Endpoint**
   - Create `/app/r/[token]/route.ts`
   - Port logic from email-campaign-tracker

3. **Add Event API**
   - Create `/app/api/events/route.ts`
   - Wire to Supabase client

4. **Add Token Lookup API**
   - Create `/app/api/token-contact/route.ts`
   - Used by AnalyticsPageWrapper

5. **Add Contact Search API**
   - Create `/app/api/contacts/search/route.ts`
   - Powers searchable contact multi-select

6. **Add Bulk Token Generation API**
   - Create `/app/api/tokens/generate/route.ts`
   - Generates tokens for multiple contacts on publish
   - Returns all tokens with contact details

7. **Update Analytics**
   - Modify AnalyticsPageWrapper for person identification

### Frontend Implementation (Studio UI)

8. **Add Contact Multi-Select Component**
   - Searchable multi-select field
   - Real-time search as you type
   - Shows: name, email, company
   - Selected contacts appear as chips/badges

9. **Enhance Publish Button**
   - Triggers landing page save
   - Automatically calls bulk token generation API
   - Passes all selected contact IDs

10. **Add Success Modal**
    - Shows all generated tracking links
    - Copy individual links
    - "Copy All" button (for pasting into docs)
    - "Export CSV" button (for email tools)

11. **Wire Up Page Builder**
    - Connect campaign dropdown → contact multi-select → publish
    - Save selected contacts with landing page
    - Load existing contacts when editing page

### Testing & Deployment

11. **Test Contact Multi-Select**
    - Type query → results appear
    - Select multiple contacts → chips appear
    - Remove contact → chip disappears

12. **Test Publish with Token Generation**
    - Select 3 contacts → click "Publish"
    - Modal shows 3 unique links
    - Re-publish with same contacts → reuses existing tokens (no duplicates)
    - Add 2 more contacts → publish → generates only 2 new tokens

13. **Test Complete Flow**
    - Create landing page
    - Select campaign + contact
    - Generate token
    - Click link → redirect works
    - Verify PostHog shows identified person

14. **Deploy & Cleanup**
    - Deploy to Vercel
    - Archive email-campaign-tracker folder

---

## 🎯 Success Criteria

You'll know it's working when:

✅ **Contact Selection**: Type in search → contacts appear → select works
✅ **Token Generation**: Click "Generate" → unique link created
✅ **Token Reuse**: Generate again → returns existing token (no duplicates)
✅ **Email Redirect**: Click link → redirects instantly to landing page
✅ **Person Identification**: PostHog shows person's name, email, company (not anonymous)
✅ **Session Recording**: Video playback linked to specific contact
✅ **Event Attribution**: All events in DB have contact_id + campaign_id
✅ **Campaign Metrics**: Performance views show click & conversion rates
✅ **Unified System**: All in ONE Vercel deployment, ONE database

---

## 📋 Completion Checklist

### Backend APIs
```
✅ Step 1: Database migration created & ready
⬜ Step 2: Create /app/r/[token]/route.ts (redirect endpoint)
⬜ Step 3: Create /app/api/events/route.ts (event logging)
⬜ Step 4: Create /app/api/token-contact/route.ts (token lookup)
⬜ Step 5: Create /app/api/contacts/search/route.ts (contact search)
⬜ Step 6: Create /app/api/tokens/generate/route.ts (token generation)
⬜ Step 7: Update components/analytics/AnalyticsPageWrapper.tsx
```

### Frontend Studio UI
```
⬜ Step 8: Add contact multi-select component (searchable)
⬜ Step 9: Enhance Publish button (trigger bulk token generation)
⬜ Step 10: Add success modal with all generated links
⬜ Step 11: Add "Copy All" and "Export CSV" functionality
⬜ Step 12: Wire campaign dropdown → contact multi-select → publish
⬜ Step 13: Save/load selected contacts with landing page
```

### Testing
```
⬜ Step 14: Run migration in Supabase
⬜ Step 15: Test contact multi-select (search, select multiple, remove)
⬜ Step 16: Test publish → token generation (creates for all selected)
⬜ Step 17: Test re-publish (reuses existing tokens, no duplicates)
⬜ Step 18: Test redirect flow (/r/token → /p/slug?r=token)
⬜ Step 19: Test PostHog person identification
⬜ Step 20: Verify events logged to database with attribution
⬜ Step 21: Archive email-campaign-tracker folder
```

---

**Ready to implement? Let's start with the backend APIs!** 🚀
