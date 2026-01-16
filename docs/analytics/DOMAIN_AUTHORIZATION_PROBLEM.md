# PostHog Domain Authorization - Scaling Problem & Solutions

**Date**: November 5, 2025  
**Issue**: Manual URL Authorization Required for PostHog Web Analytics  
**Impact**: Operational overhead and scaling challenges

---

## 🚨 **The Problem**

### **Manual URL Management Required**
- PostHog Web Analytics requires each URL to be manually added to authorized list
- Currently added: `http://localhost:3000`
- **Problem**: This doesn't scale for production multi-tenant deployment

### **Scaling Challenges**

**Current Setup (Option A: Global Slugs)**
```
Production URLs that would need manual authorization:
✅ https://yourdomain.com (main domain)
❌ https://yourdomain.com/p/client-1-slug
❌ https://yourdomain.com/p/client-2-slug  
❌ https://yourdomain.com/p/client-N-slug
❌ Every new landing page URL...
```

**Custom Domain Setup (Option C)**
```
Each client domain would need manual authorization:
❌ https://client1-domain.com
❌ https://client2-domain.com
❌ https://every-client-domain.com
❌ Hundreds/thousands of domains...
```

---

## 🛠️ **Solution Options**

### **Option 1: PostHog API Automation** ⭐ **RECOMMENDED**

**Concept**: Automatically manage authorized URLs via PostHog API

**Implementation**:
```typescript
// lib/analytics/domainAuthorization.ts
import { PostHog } from 'posthog-node';

export async function authorizePostHogDomain(domain: string) {
  const posthog = new PostHog(
    process.env.POSTHOG_PERSONAL_API_KEY!,
    { host: 'https://us.posthog.com' }
  );

  try {
    // Add domain to authorized URLs via API
    await posthog.updateProjectSettings({
      authorized_urls: [...currentUrls, domain]
    });
    
    console.log(`Domain authorized: ${domain}`);
  } catch (error) {
    console.error('Failed to authorize domain:', error);
  }
}
```

**Trigger Points**:
- When Studio publishes new landing page
- When custom domain is configured for client
- Automated during deployment pipeline

**Benefits**:
- ✅ Fully automated domain management
- ✅ No manual PostHog dashboard intervention
- ✅ Scales to unlimited domains
- ✅ Integrates with existing publish workflow

**Drawbacks**:
- ⚠️ Requires PostHog Personal API Key management
- ⚠️ Additional API dependency

---

### **Option 2: Wildcard Domain Strategy** 

**Concept**: Use domain patterns that minimize authorization needs

**Current Approach**:
```
❌ Authorize every URL: /p/client-1, /p/client-2, etc.
```

**Optimized Approach**:
```typescript
// Only authorize base domains:
✅ https://yourdomain.com (covers all /p/* routes)
✅ https://*.yourdomain.com (if using subdomains)
```

**PostHog Configuration**:
- Check if PostHog supports wildcard patterns in authorized URLs
- If yes: `https://yourdomain.com/*` or similar patterns
- If no: Only authorize base domain, not full paths

**Investigation Needed**:
- Does PostHog Web Analytics support path wildcards?
- Does authorizing `https://yourdomain.com` cover all sub-routes?

---

### **Option 3: Custom Analytics Implementation**

**Concept**: Build custom analytics that doesn't require domain authorization

**Implementation**:
```typescript
// Custom analytics endpoint
// pages/api/analytics/track.ts
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { event, properties } = req.body;
  
  // Forward to PostHog without domain restrictions
  await fetch('https://us.posthog.com/batch/', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.POSTHOG_PERSONAL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      api_key: process.env.NEXT_PUBLIC_POSTHOG_KEY,
      events: [{
        event,
        properties: {
          ...properties,
          $current_url: req.headers.referer,
        }
      }]
    })
  });
  
  res.status(200).json({ success: true });
}
```

**Benefits**:
- ✅ No domain authorization required
- ✅ Full control over analytics flow
- ✅ Can add custom validation/filtering

**Drawbacks**:
- ❌ Loses PostHog's automatic features (session recording, etc.)
- ❌ More complex implementation
- ❌ Additional API endpoints to maintain

---

### **Option 4: PostHog Configuration Investigation**

**Research Tasks**:
1. **Test Base Domain Authorization**: Check if authorizing `https://yourdomain.com` covers all sub-routes automatically
2. **Wildcard Support**: Investigate if PostHog supports `*.domain.com` or `/path/*` patterns
3. **PostHog Documentation**: Review Web Analytics authorization documentation for best practices
4. **PostHog Support**: Contact PostHog support for multi-tenant domain management guidance

---

## 🎯 **Recommended Approach**

### **Phase 1: Immediate Solution (Current)**
- ✅ Manual authorization for development (`http://localhost:3000`)
- ✅ Manual authorization for production base domain
- ✅ Document the manual process for now

### **Phase 2: Automation Implementation**
1. **Implement PostHog API Integration** (Option 1)
2. **Add domain authorization to Studio publish workflow**
3. **Create admin interface for domain management**

### **Phase 3: Production Optimization**
1. **Test wildcard/pattern support** (Option 2)
2. **Optimize authorization strategy based on findings**
3. **Implement automated cleanup of unused domains**

---

## 📋 **Implementation Plan**

### **Immediate Actions** (This Session)
- [ ] Test if `https://yourdomain.com` authorization covers sub-routes
- [ ] Research PostHog wildcard/pattern support
- [ ] Implement basic PostHog API domain authorization function

### **Next Session Actions**
- [ ] Integrate domain authorization into Studio publish workflow
- [ ] Add environment variable for production domain management
- [ ] Create domain management admin interface

### **Future Considerations**
- [ ] Automated domain cleanup (remove unused domains)
- [ ] Domain authorization monitoring/alerting
- [ ] Multi-environment domain management (dev/staging/prod)

---

## 💡 **Key Insights**

### **The Core Issue**
PostHog Web Analytics domain authorization is designed for **single-domain applications**, not **multi-tenant systems** with dynamic URL generation.

### **Production Impact**
Without automation, every new:
- Landing page publication
- Custom domain setup  
- Environment deployment
- Client onboarding

Would require manual PostHog dashboard intervention - **not scalable**.

### **Solution Priority**
1. **Automate domain management** via PostHog API
2. **Optimize authorization patterns** to minimize API calls
3. **Build fallback strategies** for authorization failures

---

**Next Step**: Implement PostHog API domain authorization to solve the manual scaling problem.