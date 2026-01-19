# PostHog Domain Authorization - Complete Solution & Troubleshooting Guide

**Date**: November 5, 2025  
**Status**: 🚀 **COMPREHENSIVE DEBUGGING TOOLS DEPLOYED**

---

## 🎯 **Problem Summary**

**Issue**: PostHog Web Analytics requires each URL to be individually authorized. When you authorize `http://localhost:3000/`, it does NOT automatically authorize sub-paths like `/p/aident-cyngn-1125-v4`.

**What We've Discovered**:
- ✅ Authorizing `http://localhost:3000/` → Only tracks homepage
- ✅ Authorizing `http://localhost:3000/p/specific-page` → Tracks that specific page
- ❌ PostHog does NOT support base URL wildcards automatically
- ⚠️ This means every landing page URL needs individual authorization

---

## 🛠️ **Solution Deployed**

We've built a comprehensive debugging and automation system:

### **1. Debug Interface** (`/debug-posthog`)
Interactive web interface for testing and managing PostHog authorization.

**Features**:
- View current authorized URLs from PostHog API
- Test if specific URLs are authorized
- Manually authorize individual URLs
- Bulk authorize all published landing pages
- Real-time activity logging
- Environment configuration status

### **2. API Endpoints**

**`/api/analytics/authorize`** - Main authorization API
- `GET` - Retrieve current authorized URLs
- `POST` - Authorize URLs with various actions

**`/api/analytics/bulk-authorize`** - Bulk operations
- `GET` - Preview what would be authorized
- `POST` - Bulk authorize all published landing pages

### **3. Enhanced Domain Manager**
Improved `lib/analytics/domainAuthorization.ts` with:
- Comprehensive logging
- Multiple API endpoint attempts
- Better error handling
- Detailed diagnostic information

---

## 📖 **How to Use**

### **Step 1: Initial Setup**

1. **Verify Environment Variables**:
   ```bash
   # Check .env.local has these values:
   NEXT_PUBLIC_POSTHOG_KEY=phc_jmuFyDM6jh2IZO37rvPa07tGkOrgoVIMmtfjcCEEGUw
   NEXT_PUBLIC_POSTHOG_HOST=https://us.posthog.com
   POSTHOG_PERSONAL_API_KEY=phx_NpJLSSHvl5exsiIgU4RGHN7vDmtOtEoynl5fXIQqOwSbe6N
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

2. **Restart Dev Server**:
   ```bash
   # Stop current server (Ctrl+C)
   npm run dev
   ```

### **Step 2: Access Debug Interface**

1. Navigate to: **http://localhost:3000/debug-posthog**

2. Check **Configuration Status** section:
   - Should show "API Key Configured: ✓ Yes"
   - Should show correct PostHog Host and Site URL

### **Step 3: Test API Connectivity**

1. Click **"Refresh Authorized URLs"**
   - This tests if we can connect to PostHog API
   - Check the Activity Log for results

2. **Expected Outcomes**:
   - ✅ **Success**: See list of currently authorized URLs
   - ⚠️ **No URLs Found**: API connected but no URLs authorized yet
   - ❌ **Error**: API endpoint not accessible (expected - may not be publicly available)

### **Step 4: Attempt Automated Authorization**

**Option A: Try Wildcard Patterns**
1. Click **"Try All Wildcard Patterns"**
2. This will attempt to authorize:
   - `http://localhost:3000`
   - `http://localhost:3000/`
   - `http://localhost:3000/p/*`
   - `http://localhost:3000/*`
3. Watch Activity Log for results

**Option B: Bulk Authorize All Pages**
1. Click **"Bulk Authorize All Pages"**
2. This will:
   - Fetch all published landing pages from database
   - Generate URLs for each page
   - Attempt to authorize them all via API
3. Watch Activity Log for success/failure

**Option C: Authorize Specific Landing Page**
1. Enter slug in "Landing Page Slug" field (e.g., `aident-cyngn-1125-v4`)
2. Click **"Authorize Landing Page"**
3. Watch Activity Log for results

### **Step 5: Interpret Results**

**Scenario 1: API Authorization Works** ✅
- Activity Log shows: "Successfully authorized URL"
- Refresh authorized URLs shows new URLs added
- **Action**: Your automation is working! Events should track automatically.

**Scenario 2: API Returns Errors** ⚠️
- Activity Log shows: "All update endpoints failed"
- This means PostHog API doesn't support programmatic authorization
- **Action**: Use manual dashboard authorization (see Step 6)

**Scenario 3: Wildcards Work** 🎉
- After authorizing `http://localhost:3000/*`, all sub-paths work
- **Action**: Problem solved! Just authorize base wildcard in production.

**Scenario 4: Wildcards Don't Work** 😞
- Each specific URL must be authorized individually
- **Action**: Need manual process or alternative solution (see Step 7)

---

## 🔧 **Step 6: Manual Dashboard Authorization (Fallback)**

If API automation doesn't work, use PostHog dashboard:

### **For Development**:
1. Go to PostHog Dashboard → Settings → Web Analytics
2. Find "Authorized URLs" section
3. Add these manually:
   ```
   http://localhost:3000
   http://localhost:3000/p/aident-cyngn-1125-v4
   http://localhost:3000/p/test-page-1
   http://localhost:3000/p/test-page-2
   ... (add each page individually)
   ```

### **For Production**:
1. Replace `localhost:3000` with your production domain
2. Add all production landing page URLs

**Drawback**: This doesn't scale - you'll need to add each new page manually.

---

## 🚀 **Step 7: Alternative Solutions**

If PostHog API authorization proves impossible:

### **Option A: Switch to Regular PostHog Events**

Modify `AnalyticsProvider.tsx` to disable Web Analytics mode:

```typescript
// In posthog.init() configuration:
posthog.init(posthogKey, {
  // ... other config
  capture_pageview: false,  // Disable Web Analytics auto-tracking
  capture_pageleave: false,
  // ... rest of config
});

// Then manually capture events (no domain authorization needed):
posthog.capture('landing_page_view', {
  url: window.location.href,
  // ... other properties
});
```

**Benefits**:
- ✅ No domain authorization required
- ✅ Full control over event properties
- ✅ Works immediately
- ✅ Scales infinitely

**Drawbacks**:
- ❌ Loses Web Analytics specific features
- ❌ Requires manual event tracking

### **Option B: Proxy Through Your API**

Create a server-side proxy that forwards events to PostHog:

```typescript
// app/api/analytics/track/route.ts
export async function POST(request: NextRequest) {
  const { event, properties } = await request.json();
  
  // Forward to PostHog from server (bypasses domain authorization)
  await fetch('https://us.posthog.com/capture/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      api_key: process.env.NEXT_PUBLIC_POSTHOG_KEY,
      event,
      properties,
    }),
  });
}
```

**Benefits**:
- ✅ No domain restrictions
- ✅ Server-side event validation
- ✅ Can add custom logic

**Drawbacks**:
- ❌ Extra API endpoint
- ❌ Loses some PostHog automatic features

### **Option C: Contact PostHog Support**

1. Reach out to PostHog support/community
2. Ask about:
   - Wildcard support for authorized URLs
   - API endpoint for managing authorized URLs
   - Best practices for multi-tenant applications
3. They may have solutions we haven't discovered

---

## 🧪 **Testing & Verification**

### **Test 1: Verify PostHog Events Are Sent**

1. Open your landing page: `http://localhost:3000/p/aident-cyngn-1125-v4`
2. Open Browser DevTools → Network tab
3. Filter by "posthog"
4. Look for POST requests to `us.posthog.com/batch/`
5. Check:
   - ✅ Request status: 200 OK
   - ✅ Request payload contains `$pageview` event
   - ✅ Properties include your custom context

**If you see 200 OK responses, events ARE being sent successfully!**

### **Test 2: Check PostHog Dashboard**

1. Go to PostHog → Live Events
2. Wait 1-5 minutes (processing delay)
3. Check if events appear

**Scenarios**:
- ✅ Events appear → Authorization is working!
- ❌ No events + 200 OK in network → URL not authorized
- ❌ No events + network errors → Different problem

### **Test 3: Verify Authorization**

Use the debug interface:

1. Go to `/debug-posthog`
2. Enter URL: `http://localhost:3000/p/aident-cyngn-1125-v4`
3. Click "Test If Authorized"
4. Check Activity Log for result

---

## 📊 **Expected Behavior**

### **Current Working Setup**:
```
✅ http://localhost:3000/ (base URL) → Authorized manually in dashboard
✅ http://localhost:3000/p/aident-cyngn-1125-v4 → Authorized manually in dashboard
✅ Events from these URLs → Appear in PostHog
```

### **What We're Trying to Achieve**:
```
🎯 Authorize once → All pages work automatically
🎯 New landing pages → Auto-authorized on publish
🎯 Zero manual intervention required
```

### **Current Challenge**:
```
⚠️ PostHog API for authorized URLs may not be publicly accessible
⚠️ Each URL must be authorized individually (no wildcards)
⚠️ Manual dashboard process doesn't scale for multi-tenant setup
```

---

## 🐛 **Troubleshooting**

### **Problem: "API Key Configured: ✗ No"**

**Solution**:
1. Check `.env.local` has `POSTHOG_PERSONAL_API_KEY`
2. Restart dev server: `Ctrl+C` then `npm run dev`
3. Refresh `/debug-posthog` page

### **Problem: "No authorized URLs found"**

**Possible Causes**:
1. API endpoint doesn't exist (PostHog limitation)
2. API key doesn't have required permissions
3. No URLs have been authorized yet

**Solution**:
- Try manual dashboard authorization first
- Verify events are sent (Network tab)
- If events sent but not in dashboard = authorization issue

### **Problem: "All update endpoints failed"**

**This is EXPECTED** - It means:
- PostHog's Web Analytics authorized URLs feature doesn't have a public API
- You must use dashboard manual authorization
- OR switch to regular PostHog events (no authorization needed)

**Solution**:
- Use manual dashboard process for now
- Consider switching to regular events (Option A in Step 7)

### **Problem: Events sent (200 OK) but not in dashboard**

**This confirms domain authorization is the issue**:

**Solution**:
1. Manually add URL to PostHog dashboard authorized URLs
2. Wait 1-2 minutes
3. Check Live Events again
4. If it works now, you've confirmed the issue

---

## 🎯 **Next Steps**

Based on your debug results, choose a path:

### **Path 1: API Works** (Ideal)
- Continue with automated authorization
- Integrate with publish workflow
- Monitor logs for failures

### **Path 2: API Doesn't Work** (Most Likely)
- Document manual authorization process
- Create admin interface for bulk manual adds
- Consider switching to regular PostHog events

### **Path 3: Wildcards Work** (Best Case)
- Authorize base wildcards only
- Problem solved with minimal config
- Document for production deployment

### **Path 4: Nothing Works** (Last Resort)
- Switch to regular PostHog events (no Web Analytics)
- Implement custom pageview tracking
- Full analytics without domain restrictions

---

## 📝 **Diagnostic Checklist**

Run through this checklist using `/debug-posthog`:

- [ ] Configuration Status shows API key configured
- [ ] Can fetch current authorized URLs (or get expected error)
- [ ] Try wildcard authorization - does it work?
- [ ] Try specific URL authorization - does it work?
- [ ] Check browser Network tab - events being sent?
- [ ] Check PostHog Live Events - do events appear?
- [ ] Manual dashboard authorization - does that work?
- [ ] After manual add, events appear in dashboard?

**Share your results from this checklist to determine next steps!**

---

## 🔗 **Useful Links**

- Debug Interface: `http://localhost:3000/debug-posthog`
- PostHog Dashboard: `https://us.posthog.com`
- PostHog Web Analytics Docs: `https://posthog.com/docs/web-analytics`
- PostHog API Docs: `https://posthog.com/docs/api`

---

## 💡 **Key Insights**

1. **PostHog Web Analytics ≠ Regular PostHog Events**
   - Web Analytics requires domain authorization
   - Regular events do not

2. **Domain Authorization is Path-Specific**
   - `/` ≠ `/p/anything`
   - Must authorize each path individually

3. **API May Not Exist**
   - Web Analytics authorized URLs might be dashboard-only
   - This is a PostHog platform limitation, not our code

4. **Multiple Solutions Available**
   - Don't get stuck on API automation
   - Regular events work just as well for analytics
   - Choose the solution that works for your use case

---

**Ready to debug? Start at `/debug-posthog` and follow Step 1-7 above!** 🚀
