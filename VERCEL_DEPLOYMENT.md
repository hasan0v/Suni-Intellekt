# Vercel Production Deployment Guide

## Environment Variables Setup

You MUST add these environment variables in Vercel Dashboard:

### 1. Go to Vercel Dashboard
- Navigate to: https://vercel.com/ali-hasanovs-projects/alien/settings/environment-variables

### 2. Add These Variables:

#### Production URL (CRITICAL - prevents localhost links in emails)
```
NEXT_PUBLIC_APP_URL = https://your-production-domain.vercel.app
```
**Replace with your actual Vercel production URL!**

#### Supabase Configuration
```
NEXT_PUBLIC_SUPABASE_URL = https://dcsshjzqyysqpzhgewtx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjc3NoanpxeXlzcXB6aGdld3R4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5NjI4NDAsImV4cCI6MjA2ODUzODg0MH0.T6XENoNnc51FheYggYd213A1sfKH9yFoZv-uV_k-C38
SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjc3NoanpxeXlzcXB6aGdld3R4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mjk2Mjg0MCwiZXhwIjoyMDY4NTM4ODQwfQ.QNNcaaYWwg7gnJ-iM0tA2aW24KrM9JCpbTtKfRP0dZY
```

#### Email Configuration
```
RESEND_API_KEY = re_8KaFkhyA_AYE3X6KwhrasgnfAAPjsygVe
EMAIL_FROM = noreply@suni-intellekt.com
```

### 3. Apply to All Environments
- Make sure to select: **Production**, **Preview**, **Development**
- This ensures consistency across all deployments

---

## Fix Emails Going to Spam

### Step 1: Verify Domain in Resend (REQUIRED)

1. **Go to Resend Dashboard**: https://resend.com/domains
2. **Add your domain**: `suni-intellekt.com`
3. **Add DNS Records** to your domain registrar:

#### A. SPF Record
```
Type: TXT
Name: @ (or leave blank)
Value: v=spf1 include:_spf.resend.com ~all
```

#### B. DKIM Records (Resend will provide these)
```
Type: CNAME
Name: resend._domainkey
Value: [Resend will provide this value]
```

#### C. DMARC Record
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:dmarc@suni-intellekt.com
```

### Step 2: Wait for DNS Propagation
- DNS changes can take 5-60 minutes
- Check status in Resend dashboard
- Domain should show "Verified" ✅

### Step 3: Update Email Sender
Once domain is verified, emails will automatically use:
```
From: SÜNİ İNTELLEKT <noreply@suni-intellekt.com>
```

---

## Testing Email Deliverability

1. **Send test email** from production
2. **Check Gmail**:
   - Click "Show original"
   - Look for: `SPF: PASS`, `DKIM: PASS`, `DMARC: PASS`
3. **Use mail-tester.com**:
   - Send email to the address they provide
   - Should score 8/10 or higher

---

## Common Issues

### Issue: Emails still use localhost URLs
**Solution**: Make sure `NEXT_PUBLIC_APP_URL` is set in Vercel and redeploy

### Issue: Emails go to spam
**Solutions**:
1. ✅ Verify domain in Resend (most important)
2. ✅ Add SPF, DKIM, DMARC records
3. ✅ Use verified domain email (not onboarding@resend.dev)
4. ✅ Ask users to mark as "Not Spam" initially

### Issue: Domain not verifying
**Check**:
- DNS records are added correctly (no typos)
- Wait 10-30 minutes for propagation
- Use DNS checker: https://dnschecker.org

---

## Deployment Checklist

Before running `vercel --prod`:

- [ ] All environment variables added in Vercel Dashboard
- [ ] `NEXT_PUBLIC_APP_URL` set to production URL
- [ ] Domain verified in Resend
- [ ] DNS records (SPF, DKIM, DMARC) added
- [ ] Test email sent and checked
- [ ] Code builds successfully locally

## Deploy Command
```bash
vercel --prod
```

---

## Quick Fix for Current Deployment

**Immediate steps to fix localhost links:**

1. Go to Vercel Dashboard → Settings → Environment Variables
2. Add new variable:
   - Key: `NEXT_PUBLIC_APP_URL`
   - Value: `https://alien-bnrfxj029-ali-hasanovs-projects.vercel.app` (or your custom domain)
   - Environment: Production, Preview, Development
3. Redeploy:
   ```bash
   vercel --prod
   ```

**Email verification links will now use the production URL!**
