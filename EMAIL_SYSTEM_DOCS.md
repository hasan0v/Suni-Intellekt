# Email Verification & Password Reset System

## Overview
This system uses **Resend** for sending emails instead of Supabase's built-in email service, which allows handling high volumes of signups without hitting Supabase rate limits.

## Features
- ✅ Custom email verification flow
- ✅ Custom password reset flow
- ✅ Beautiful email templates in Azerbaijani
- ✅ Token-based security with expiration
- ✅ Samsung design language for all auth pages

## Setup

### 1. Environment Variables
Add these to your `.env.local`:

```env
# Resend API Key (get from https://resend.com)
RESEND_API_KEY=re_xxxxxxxxxxxxx

# Email sender address (must be verified in Resend)
EMAIL_FROM=onboarding@yourdomain.com
# Or use Resend's test email:
# EMAIL_FROM=onboarding@resend.dev

# Your app URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase Service Role Key (for admin operations)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 2. Database Migration
Run the migration to create the `verification_tokens` table:

```bash
# Apply the migration in Supabase Dashboard SQL Editor
# Or use the apply-migration script
node scripts/apply-migration.js database/migrations/add_verification_tokens.sql
```

### 3. Update Supabase Auth Settings
In Supabase Dashboard > Authentication > Settings:
- **Disable** "Enable email confirmations" (we handle this ourselves)
- **Disable** "Enable email change confirmations" (optional)

## How It Works

### Signup Flow
1. User fills out signup form
2. API creates user in Supabase with `email_confirm: false`
3. API generates verification token and stores in database
4. Email sent via Resend with verification link
5. User clicks link → token verified → email marked as confirmed

### Password Reset Flow
1. User requests password reset
2. API generates reset token (valid for 1 hour)
3. Email sent via Resend with reset link
4. User clicks link and sets new password
5. Token marked as used, password updated

## API Endpoints

### POST `/api/auth/signup`
Create new user account

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "fullName": "User Name"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Qeydiyyat uğurlu oldu! Email ünvanınızı yoxlayın."
}
```

### POST `/api/auth/verify-email`
Verify email address

**Request:**
```json
{
  "token": "abc123..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email uğurla təsdiqləndi! İndi daxil ola bilərsiniz."
}
```

### POST `/api/auth/forgot-password`
Request password reset

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Şifrə yeniləmə linki email ünvanınıza göndərildi."
}
```

### POST `/api/auth/reset-password`
Reset password with token

**Request:**
```json
{
  "token": "xyz789...",
  "newPassword": "NewSecurePass123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Şifrə uğurla yeniləndi! İndi daxil ola bilərsiniz."
}
```

## Pages

- `/auth/signup` - User registration
- `/auth/signin` - User login
- `/auth/verify-email?token=xxx` - Email verification
- `/auth/forgot-password` - Request password reset
- `/auth/reset-password?token=xxx` - Reset password

## Database Schema

### `verification_tokens` table
```sql
- id: UUID (primary key)
- user_id: UUID (references auth.users)
- token: TEXT (unique, indexed)
- token_type: 'email_verification' | 'password_reset'
- expires_at: TIMESTAMP
- used_at: TIMESTAMP (null until used)
- created_at: TIMESTAMP
```

### `user_profiles` table (updated)
- Added `email_verified: BOOLEAN` field

## Security Features

1. **Token Expiration**
   - Email verification: 24 hours
   - Password reset: 1 hour

2. **One-Time Use**
   - Tokens are marked as used after consumption
   - Cannot be reused

3. **Automatic Cleanup**
   - Expired tokens can be cleaned up with `cleanup_expired_tokens()` function

4. **Rate Limiting**
   - Consider implementing rate limiting on API routes for production

## Email Templates

Templates are located in `src/lib/email/templates.ts`:
- `getVerificationEmailHtml()` - HTML email for verification
- `getVerificationEmailText()` - Plain text fallback
- `getPasswordResetEmailHtml()` - HTML email for password reset
- `getPasswordResetEmailText()` - Plain text fallback

All templates use Samsung design language and are in Azerbaijani.

## Testing

### Test Email Sending
```bash
# Send test email
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

### Test Token Verification
```bash
# After receiving email, test verification
curl -X POST http://localhost:3000/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{"token":"YOUR_TOKEN_HERE"}'
```

## Troubleshooting

### Emails Not Sending
1. Check `RESEND_API_KEY` is correct
2. Verify `EMAIL_FROM` domain in Resend dashboard
3. Check Resend dashboard for delivery status
4. Look at server logs for errors

### Token Errors
1. Check token hasn't expired
2. Verify token hasn't been used already
3. Check database for token existence
4. Ensure migrations ran successfully

### User Already Exists
- The system prevents duplicate emails
- Clear existing user from Supabase Auth if needed

## Production Checklist

- [ ] Set up custom domain in Resend
- [ ] Configure DNS records for email domain
- [ ] Update `EMAIL_FROM` to use custom domain
- [ ] Set up monitoring for email delivery
- [ ] Implement rate limiting on API endpoints
- [ ] Set up automated cleanup of expired tokens
- [ ] Test all email flows end-to-end
- [ ] Configure proper error tracking

## Notes

- Resend has a free tier: 3,000 emails/month, 100 emails/day
- For production, consider upgrading Resend plan
- Monitor email delivery rates in Resend dashboard
- Keep `SUPABASE_SERVICE_ROLE_KEY` secure (never expose to client)
