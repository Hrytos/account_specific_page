# 🚨 CRITICAL FIX REQUIRED - PostHog API Key Permissions

## Problem Identified ✅

Your PostHog Personal API Key **does NOT have the required permissions** to read or write project settings.

## Error Messages from Logs

```
API key missing required scope 'project:read'
API key missing required scope 'project:write'
```

This means your current API key (`phx_NpJLSSHvl5exsiIgU4RGHN7vDmtOtEoynl5fXIQqOwSbe6N`) was created **without the necessary scopes**.

---

## ✅ SOLUTION: Create New API Key with Proper Scopes

### Step 1: Go to PostHog Dashboard

https://us.posthog.com

### Step 2: Navigate to Personal API Keys

**Option A** (Recommended):
1. Click your profile icon (bottom left)
2. Select **"Personal API keys"**

**Option B**:
1. Go to **Project Settings**
2. Look for **"API"** or **"Access Tokens"** section

### Step 3: Create New API Key

1. Click **"Create personal API key"** or **"New access token"**

2. **Name it**: `Landing Page Domain Authorization`

3. **CRITICAL: Select These Scopes** ✅
   ```
   ✅ project:read    - Required to read authorized URLs
   ✅ project:write   - Required to update authorized URLs
   ✅ (Any other web_analytics:* scopes if available)
   ```

4. Click **"Create"** or **"Generate"**

5. **COPY THE KEY** - It will start with `phx_`

### Step 4: Update .env.local

Replace the old key:

```bash
# Open: .env.local
# Find this line:
POSTHOG_PERSONAL_API_KEY=phx_NpJLSSHvl5exsiIgU4RGHN7vDmtOtEoynl5fXIQqOwSbe6N

# Replace with your new key:
POSTHOG_PERSONAL_API_KEY=phx_YOUR_NEW_KEY_WITH_PROPER_SCOPES
```

### Step 5: Restart Dev Server

```powershell
# Stop the server (Ctrl+C in terminal)
npm run dev
```

### Step 6: Test Again

1. Go to: http://localhost:3000/debug-posthog
2. Click **"Refresh Authorized URLs"**
3. You should now see SUCCESS instead of 403 errors!

---

## 🎯 Expected Results After Fix

### BEFORE (Current - 403 Forbidden):
```
❌ Endpoint /api/projects/@current/ response: { status: 403, statusText: 'Forbidden' }
❌ API key missing required scope 'project:read'
```

### AFTER (With Proper Key - Success):
```
✅ Endpoint /api/projects/@current/ response: { status: 200, statusText: 'OK' }
✅ Retrieved X authorized URLs
✅ Successfully authorized URL: http://localhost:3000/p/...
```

---

## 🔍 How to Verify the New Key Works

After updating `.env.local` and restarting:

1. Go to debug interface: http://localhost:3000/debug-posthog

2. Click **"Refresh Authorized URLs"**

3. Check Activity Log:
   - ✅ Should say: "Retrieved X authorized URLs" (even if X = 0)
   - ❌ Should NOT say: "403 Forbidden" or "permission_denied"

4. Try **"Try All Wildcard Patterns"**:
   - ✅ Should attempt to authorize URLs
   - ✅ May succeed or fail, but NOT due to permissions

5. Try **"Authorize Landing Page"**:
   - ✅ Should show authorization attempt
   - ✅ Will tell you if API supports this or not

---

## 🚀 What Happens Next

### Scenario A: API Endpoints Exist ✅
- Your automation will work!
- Pages will auto-authorize on publish
- Problem fully solved!

### Scenario B: API Endpoints Don't Exist ⚠️
- At least we can READ the current authorized URLs
- We'll know the API limitations
- We'll implement alternative solution

Either way, **you need the proper API key scopes first!**

---

## 📋 Checklist

- [ ] Go to PostHog Dashboard
- [ ] Navigate to Personal API Keys or Project Settings → API
- [ ] Create new API key with `project:read` and `project:write` scopes
- [ ] Copy the new key (starts with `phx_`)
- [ ] Update `.env.local` with the new key
- [ ] Save the file
- [ ] Restart dev server
- [ ] Test at http://localhost:3000/debug-posthog
- [ ] Verify Activity Log shows success (not 403 errors)

---

## ⚠️ IMPORTANT NOTES

1. **Don't delete the old key yet** - Keep it as backup until new one works

2. **The key is sensitive** - Don't share it publicly

3. **Scopes are critical** - Make sure you select `project:read` AND `project:write`

4. **Restart is required** - Server must restart to load new env variable

5. **Test immediately** - Use the debug interface to verify it works

---

## 💬 After You Create the New Key

Come back and let me know:

1. ✅ Did you create a new API key with the required scopes?
2. ✅ Did you update `.env.local`?
3. ✅ Did you restart the dev server?
4. ✅ What does the Activity Log show now at `/debug-posthog`?

**This is the KEY (pun intended) to making everything work!** 🔑
