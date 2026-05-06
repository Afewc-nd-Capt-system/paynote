# Paynote - Authentication & Security Guide

## 🎯 Getting Started with Secure Authentication

Paynote now features a robust authentication system with enhanced security to protect your business data.

---

## 📝 Creating Your Account (Sign Up)

### Step 1: Navigate to Sign Up
- Click "Sign Up" link on the login page
- Or go to `/signup` path

### Step 2: Fill in Your Details
1. **Full Name**: Enter your full name (2-100 characters)
2. **Email**: Enter a valid email address (must be unique)
3. **Password**: Create a strong password

### Step 3: Password Requirements
Your password must contain ALL of the following:
- ✓ At least **8 characters**
- ✓ At least one **UPPERCASE** letter (A-Z)
- ✓ At least one **lowercase** letter (a-z)
- ✓ At least one **number** (0-9)
- ✓ At least one **special character** (!@#$%^&*)

### Example Strong Password
```
MyBusiness2024! ✓ Valid
SecurePass@123  ✓ Valid
password123     ✗ Invalid (no uppercase, no special char)
Pass@1          ✗ Invalid (too short)
```

### Step 4: Monitor Password Strength
- Real-time strength indicator shows as you type
- Color changes from red (weak) to green (strong)
- Button only enables when password meets all requirements

### Step 5: Submit
- Click "Sign Up" button
- Account will be created immediately
- You'll be logged in and redirected to Dashboard

---

## 🔑 Logging In

### Step 1: Enter Credentials
1. **Email**: Your registered email address
2. **Password**: Your password (case-sensitive)

### Step 2: Submit
- Click "Sign In" button
- System validates your credentials securely

### Step 3: Access Granted
- You'll be redirected to your Dashboard
- Your session is now active for 7 days

---

## ⚙️ Account Security

### Password Best Practices

1. **Use Unique Passwords**
   - Don't reuse passwords from other sites
   - Each account should have a unique password

2. **Store Safely**
   - Use a password manager (Bitwarden, 1Password, etc.)
   - Never share your password via email or chat
   - Never write passwords in plain text

3. **Regular Updates**
   - Consider changing password every 90 days
   - Change immediately if you suspect compromise

4. **Two-Factor Authentication** (Future Feature)
   - Enable when available for extra security
   - Use authenticator apps (Google Authenticator, Microsoft Authenticator)

### Account Security

- ✓ Your password is securely hashed and never stored in plain text
- ✓ All API communications are protected with JWT tokens
- ✓ Sessions expire after 7 days of inactivity
- ✓ Login attempts are rate-limited to prevent brute-force attacks
- ✓ Your data is isolated from other users

---

## 🔐 Session Management

### Active Session
- Your session starts when you log in
- Lasts for **7 days**
- Token stored in browser's localStorage

### Logout
- Click "Log Out" button in the sidebar
- Session immediately terminated
- All tokens cleared from your device
- You'll be redirected to login page

### Multiple Devices
- You can be logged in on multiple devices simultaneously
- Each device maintains its own independent session
- Logging out on one device doesn't affect others

---

## ⚠️ Security Features Protecting You

### 1. Rate Limiting
- Maximum 5 login attempts per 15 minutes
- Prevents attackers from guessing passwords
- Your account won't be locked permanently

### 2. Password Hashing
- Passwords hashed with bcryptjs (industry standard)
- Even our team can't see your passwords
- Rainbow table attacks are impossible

### 3. Authorization
- Users can only access their own invoices
- User A cannot see User B's data
- Backend validates every request

### 4. HTTPS (Production)
- All data encrypted in transit
- Prevents eavesdropping on networks
- Secure on public WiFi

### 5. Security Headers
- Protection against:
  - Clickjacking attacks
  - MIME sniffing
  - XSS injection
  - Other common web vulnerabilities

---

## 🆘 Troubleshooting

### "Invalid email or password"
- Check spelling of email address
- Passwords are case-sensitive
- Verify caps lock is off
- Ensure you registered this email first

### "Too many login attempts"
- You've exceeded 5 login attempts in 15 minutes
- Wait 15 minutes and try again
- Use correct password on next attempt

### "Password must contain..."
- Use the requirements checklist during signup
- Ensure ALL 5 requirements are met:
  - 8+ characters
  - Uppercase letter
  - Lowercase letter
  - Number
  - Special character (!@#$%^&*)

### "Email already registered"
- This email is already in use
- Try logging in instead
- Use "forgot password" (coming soon) if you forgot your password

### Session Expired
- Log in again after 7 days
- Your data and invoices are still safe
- No data is lost after logout

---

## 🔄 Future Security Enhancements

Planned improvements:
- [ ] Two-Factor Authentication (2FA)
- [ ] Social login (Google, GitHub)
- [ ] Password reset via email
- [ ] Email verification on signup
- [ ] Suspicious login alerts
- [ ] Session management dashboard
- [ ] IP-based security

---

## 📞 Support

For security concerns or issues:
1. Contact support immediately
2. Don't share passwords or sensitive data
3. Report vulnerabilities responsibly

---

**Remember**: Your security is our priority. Use strong, unique passwords and keep your login credentials safe!
