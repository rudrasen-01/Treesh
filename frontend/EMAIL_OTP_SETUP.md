# 📧 Email OTP Verification - Complete Setup Guide

## ✅ What Has Been Configured

### Backend (Already Done)
1. ✅ SendGrid API Key added to `.env`
2. ✅ Email service (`emailService.js`) - fully functional
3. ✅ OTP Model with database schema
4. ✅ API endpoints: `/auth/send-otp` and `/auth/verify-otp`
5. ✅ Beautiful HTML email templates
6. ✅ Rate limiting (max 5 OTP requests per 15 minutes)
7. ✅ OTP expiry (10 minutes)

### Frontend (Just Updated)
1. ✅ `EnhancedAuthModal.tsx` - Connected to backend OTP API
2. ✅ Real OTP sending via email
3. ✅ OTP verification before registration
4. ✅ 60-second resend timer
5. ✅ Proper error handling

## 🚀 How It Works Now

### Registration Flow:
1. User enters email, username, password, etc.
2. User clicks **"Send OTP"** button
3. Backend generates 6-digit OTP code
4. SendGrid sends beautiful email with OTP
5. User enters OTP code
6. Backend verifies OTP
7. If valid, registration proceeds
8. If invalid, user gets error message

### Email Template Features:
- 🎨 Beautiful gradient design (purple theme)
- 📱 Mobile responsive
- ⏰ Shows "expires in 10 minutes"
- 🔒 Security warning
- ✉️ Professional branding

## 📋 Testing Checklist

### Step 1: Deploy Backend Changes
```bash
cd "/Users/anujmishra/Documents/trees new api updated complete/trees backend"

# Copy .env file to server
scp -i ~/Documents/trees-backend-key.pem .env ubuntu@51.20.41.208:~/trees-backend/

# SSH into server
ssh -i ~/Documents/trees-backend-key.pem ubuntu@51.20.41.208

# On server - restart backend
cd ~/trees-backend
pm2 restart all

# Check logs
pm2 logs
```

### Step 2: Test Email OTP

1. **Open your app** (https://treessocialmedia.vercel.app)
2. **Click "Sign Up"**
3. **Fill in registration form:**
   - Full Name: Your Name
   - Username: testuser123
   - Email: your-email@gmail.com
   - Password: Test@1234
   - Confirm Password: Test@1234
4. **Click "Send OTP"** button
5. **Check your email inbox** (also check spam folder)
6. **You should receive an email** with:
   - Subject: "Verify Your Email - Trees Social"
   - 6-digit code in large letters
   - Expires in 10 minutes message
7. **Enter the OTP code** in the app
8. **Click "Register"**
9. **Registration should complete successfully!**

## 🔧 Troubleshooting

### If Email Doesn't Arrive:

1. **Check Spam Folder**
   - SendGrid emails might land in spam initially

2. **Verify SendGrid Status**
   - Go to https://app.sendgrid.com
   - Check "Activity" to see if email was sent
   - Check for any API errors

3. **Check Backend Logs**
   ```bash
   pm2 logs
   ```
   Look for:
   - "✅ OTP email sent to..."
   - "❌ SendGrid Error:..."

4. **Verify Domain Sender Authentication** (Recommended)
   - In SendGrid dashboard, go to Settings → Sender Authentication
   - Verify your domain: inventurcubes.com
   - This improves email deliverability
   - You'll need to add DNS records (CNAME and TXT records)

### Common Errors:

**Error: "Failed to send OTP"**
- Solution: Check if SendGrid API key is correct
- Check if backend server restarted after adding API key

**Error: "Invalid OTP"**
- Solution: OTP expires in 10 minutes, request new one
- Check if you entered correct code (case-sensitive)

**Error: "Too many OTP requests"**
- Solution: Rate limit hit (5 requests per 15 min)
- Wait 15 minutes or use different email

## 📧 SendGrid Domain Authentication (Optional but Recommended)

To improve email deliverability and avoid spam folder:

1. **Go to SendGrid Dashboard**
   - https://app.sendgrid.com
   - Settings → Sender Authentication
   - Click "Authenticate Your Domain"

2. **Add DNS Records to Hostinger:**
   ```
   Type: CNAME
   Name: em1234.inventurcubes.com (provided by SendGrid)
   Value: u1234567.wl123.sendgrid.net (provided by SendGrid)

   Type: CNAME  
   Name: s1._domainkey.inventurcubes.com
   Value: s1.domainkey.u1234567.wl123.sendgrid.net

   Type: CNAME
   Name: s2._domainkey.inventurcubes.com  
   Value: s2.domainkey.u1234567.wl123.sendgrid.net
   ```
   *Note: Exact values will be provided by SendGrid*

3. **Verify in SendGrid**
   - After adding DNS records, click "Verify"
   - May take up to 48 hours for DNS propagation

## 🎨 Email Template Preview

The OTP email looks like this:
```
┌─────────────────────────────────┐
│   🌳 Welcome to Trees Social    │
│   (Purple gradient background)  │
├─────────────────────────────────┤
│                                 │
│ Hi there! 👋                    │
│                                 │
│ Thank you for signing up!       │
│                                 │
│ ┌─────────────────────────┐    │
│ │      1 2 3 4 5 6        │    │
│ │  (Large OTP Code)       │    │
│ │  Expires in 10 minutes  │    │
│ └─────────────────────────┘    │
│                                 │
│ ⚠️ Security Notice:             │
│ Never share this code           │
│                                 │
├─────────────────────────────────┤
│ Need help? Contact us at        │
│ support@treessocial.com         │
│ © 2025 Trees Social             │
└─────────────────────────────────┘
```

## 🔐 Security Features

1. ✅ **Rate Limiting**: Max 5 OTP per 15 minutes
2. ✅ **Expiry**: OTP valid for 10 minutes only
3. ✅ **One-time Use**: Can't use same OTP twice
4. ✅ **Max Attempts**: 5 wrong attempts = OTP blocked
5. ✅ **Unique Codes**: Each OTP is randomly generated
6. ✅ **Database Tracking**: All OTP attempts logged

## 📊 OTP Database Schema

```javascript
{
  identifier: "user@email.com",
  type: "email",
  purpose: "registration",
  code: "123456",
  attempts: 0,
  maxAttempts: 5,
  isUsed: false,
  isBlocked: false,
  expiresAt: "2025-11-05T12:30:00Z",
  createdAt: "2025-11-05T12:20:00Z"
}
```

## 🎯 Next Steps

1. **Deploy backend with SendGrid API key**
2. **Test OTP functionality**
3. **Verify email delivery**
4. **(Optional) Set up domain authentication**
5. **Monitor SendGrid activity dashboard**

## 💡 Tips

- **SendGrid Free Tier**: 100 emails/day (enough for testing)
- **Upgrade**: If you need more, upgrade to paid plan
- **Monitor**: Check SendGrid dashboard for delivery rates
- **Spam Score**: Domain authentication greatly improves this

---

## 🚨 Important Notes

- **Never commit `.env` file** to Git (it's in .gitignore)
- **Keep SendGrid API key secret**
- **Monitor your SendGrid quota**
- **Test with real email addresses** (not temporary emails)

---

**Status**: ✅ Email OTP system fully configured and ready to use!

Need help? Check:
- SendGrid Dashboard: https://app.sendgrid.com
- SendGrid Docs: https://docs.sendgrid.com
- Backend logs: `pm2 logs`
