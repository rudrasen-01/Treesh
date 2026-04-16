# 📧 Gmail SMTP Setup for OTP Emails

## ✅ What I've Done

1. **Switched from SendGrid to Nodemailer** - More reliable SMTP email
2. **Updated emailService.js** - Now uses Gmail SMTP
3. **Updated package.json** - Added nodemailer, removed SendGrid
4. **Updated server.js** - Fixed proxy trust for Nginx
5. **Ready to configure** - Just need your Gmail credentials

---

## 🔐 Step 1: Get Gmail App Password

**Important**: You CANNOT use your regular Gmail password. You must create an App Password.

### How to Create Gmail App Password:

1. **Go to your Google Account**: https://myaccount.google.com

2. **Enable 2-Step Verification** (if not already enabled):
   - Click "Security" in left sidebar
   - Find "2-Step Verification"
   - Click and follow setup

3. **Create App Password**:
   - Go to: https://myaccount.google.com/apppasswords
   - Or: Security → 2-Step Verification → App passwords
   - Select app: **Mail**
   - Select device: **Other (Custom name)** → Type: "Treesh Backend"
   - Click **Generate**
   - **Copy the 16-character password** (example: `abcd efgh ijkl mnop`)

---

## 📝 Step 2: Update .env File

Open: `/Users/anujmishra/Documents/trees new api updated complete/trees backend/.env`

Replace these lines:
```properties
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password-here
```

With your actual credentials:
```properties
EMAIL_USER=anuj@inventurcubes.com
EMAIL_PASS=your-16-char-app-password
```

**Example**:
```properties
EMAIL_USER=anuj@inventurcubes.com
EMAIL_PASS=abcdefghijklmnop
```

---

## 🚀 Step 3: Deploy to Server

Run these commands:

```bash
# 1. Go to backend directory
cd "/Users/anujmishra/Documents/trees new api updated complete/trees backend"

# 2. Install nodemailer on server
ssh -i ~/Documents/trees-backend-key.pem ubuntu@51.20.41.208 "cd ~/trees-backend && npm install nodemailer"

# 3. Copy updated files to server
scp -i ~/Documents/trees-backend-key.pem services/emailService.js ubuntu@51.20.41.208:~/trees-backend/services/
scp -i ~/Documents/trees-backend-key.pem server.js ubuntu@51.20.41.208:~/trees-backend/
scp -i ~/Documents/trees-backend-key.pem .env ubuntu@51.20.41.208:~/trees-backend/
scp -i ~/Documents/trees-backend-key.pem package.json ubuntu@51.20.41.208:~/trees-backend/

# 4. Restart server
ssh -i ~/Documents/trees-backend-key.pem ubuntu@51.20.41.208 "cd ~/trees-backend && pm2 restart all && pm2 logs --lines 20"
```

---

## 🧪 Step 4: Test OTP

1. Open: https://treessocialmedia.vercel.app
2. Click "Sign Up"
3. Fill in your details
4. Click "Send OTP"
5. **Check your email!** (Gmail inbox)

---

## 📊 Expected Logs

After restarting, you should see in logs:

```
✅ Email server is ready to send messages
✅ OTP email sent to user@email.com for registration
Message ID: <unique-message-id@gmail.com>
```

---

## 🔧 Troubleshooting

### Error: "Invalid login"
- Solution: Make sure you're using **App Password**, not regular password
- Check: 2-Step Verification is enabled

### Error: "self signed certificate"
- Solution: Already handled with `rejectUnauthorized: false`

### No email received
- Check spam folder
- Verify EMAIL_USER and EMAIL_PASS are correct in .env
- Check logs: `ssh -i ~/Documents/trees-backend-key.pem ubuntu@51.20.41.208 "pm2 logs"`

### Error: "Connection timeout"
- Check PORT is 587 (not 465 or 25)
- Verify EMAIL_HOST is smtp.gmail.com

---

## 📧 Email Configuration Details

```properties
Host: smtp.gmail.com
Port: 587
Secure: false (STARTTLS)
Auth Method: App Password
From: Your Gmail Address
```

---

## 🎯 Alternative: Use Different Email Provider

If Gmail doesn't work, you can use:

### Option 1: Outlook/Hotmail
```properties
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_USER=your-email@outlook.com
EMAIL_PASS=your-password
```

### Option 2: Yahoo
```properties
EMAIL_HOST=smtp.mail.yahoo.com
EMAIL_PORT=587
EMAIL_USER=your-email@yahoo.com
EMAIL_PASS=your-app-password
```

### Option 3: Custom Domain (Hostinger Email)
```properties
EMAIL_HOST=smtp.hostinger.com
EMAIL_PORT=587
EMAIL_USER=noreply@inventurcubes.com
EMAIL_PASS=your-email-password
```

---

## 📋 Quick Deploy Script

I'll create a deploy script for you after you provide:
1. Your Gmail address
2. Your Gmail App Password

---

## ⚠️ Security Notes

- **Never commit .env to Git** (it's in .gitignore)
- **Keep App Password secret**
- **Use App Password, not regular password**
- **Enable 2-Step Verification** for security

---

## ✅ Checklist

- [ ] 2-Step Verification enabled on Gmail
- [ ] App Password created
- [ ] .env file updated with EMAIL_USER and EMAIL_PASS
- [ ] Files deployed to server
- [ ] nodemailer installed on server
- [ ] Server restarted
- [ ] Test OTP sending
- [ ] Check email inbox (and spam)

---

**Ready?** Provide your Gmail address and App Password, and I'll update the .env file for you!
