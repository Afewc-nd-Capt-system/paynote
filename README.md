# Paynote — Secure Invoicing Tool for Small Businesses

A clean, mobile-friendly full-stack invoicing application with **enterprise-grade security**.

## 🔐 Security First

Paynote now includes comprehensive security features to protect your business data:

- ✅ **Email & Password Authentication** - Secure user accounts with strong password requirements
- ✅ **JWT Token-Based Sessions** - 7-day encrypted session tokens
- ✅ **Password Hashing** - bcryptjs with 12 salt rounds (industry standard)
- ✅ **Rate Limiting** - Brute-force protection (max 5 login attempts per 15 min)
- ✅ **Input Validation** - SQL injection and XSS prevention
- ✅ **Authorization** - User isolation (users can only access their own data)
- ✅ **Security Headers** - Helmet.js protection against common web attacks
- ✅ **CORS Protection** - Restricted cross-origin requests

📖 **Read [SECURITY.md](./SECURITY.md) for detailed security documentation**

📖 **Read [AUTH_GUIDE.md](./AUTH_GUIDE.md) for authentication usage guide**

## 📁 Project Structure

```
paynote/
├── backend/
│   ├── package.json
│   ├── index.js (with security middleware)
│   ├── users.json (hashed passwords)
│   └── invoices.json
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── index.css
        ├── App.jsx
        ├── api.js (auth functions)
        ├── components/
        │   └── Sidebar.jsx
        └── pages/
            ├── Login.jsx (email + password)
            ├── Signup.jsx (NEW - create account)
            ├── Dashboard.jsx
            ├── CreateInvoice.jsx
            ├── Invoices.jsx
            └── Settings.jsx
├── SECURITY.md (NEW - security details)
└── AUTH_GUIDE.md (NEW - user guide)
```

## 🚀 Getting Started

### 1. Find Your Local IP

On your computer, find your local IP address:
- **Mac/Linux**: `ifconfig` or `ipconfig getifaddr en0`
- **Windows**: `ipconfig` (look for IPv4 Address)

### 2. Configure Environment Variables

Create a `.env` file in the `backend` directory:

```bash
cd paynote/backend
cp .env.example .env
```

Edit `.env` with your secure values:
```
JWT_SECRET=<strong-random-string-32+-chars>
ADMIN_EMAIL=your-email@example.com
ADMIN_PASSWORD=YourStrongPassword123!
CORS_ORIGIN=http://YOUR_LOCAL_IP:5173
NODE_ENV=development
PORT=5000
```

**⚠️ Important for Production:**
- `JWT_SECRET` must be at least 32 random characters
- Use strong, unique admin credentials
- Set `NODE_ENV=production` on the server
- Never commit `.env` file to git

### 2. Update API URL

Edit `frontend/src/api.js` and replace with your local IP:
```js
const API = "http://YOUR_LOCAL_IP:5000"
```

Example: `const API = "http://192.168.1.100:5000"`

### 3. Start Backend

```bash
cd paynote/backend
npm install
node index.js
```

Server runs on `http://0.0.0.0:5000`

The backend now includes:
- User authentication endpoints
- Password hashing with bcryptjs
- JWT token generation
- Rate limiting middleware
- Input validation
- Security headers (Helmet)
- **Environment variable validation** ✓

### 4. Start Frontend

Open a new terminal:
```bash
cd paynote/frontend
npm install
npm run dev
```

Frontend runs on `http://0.0.0.0:5173`

### 5. Create Your Account

1. Open `http://YOUR_LOCAL_IP:5173` on your browser
2. Click **"Sign Up"** to create a new account
3. Enter your full name, email, and a strong password
   - Password must contain: uppercase, lowercase, number, special character, 8+ characters
4. After signup, you're automatically logged in
5. Start creating invoices!

### 6. Access from Any Device

On the same WiFi network, open `http://YOUR_LOCAL_IP:5173` on any device.

## ✨ Features

### Authentication (NEW)
- 🔐 Email-based registration and login
- 📝 Strong password requirements enforced
- ⏱️ 7-day session tokens with JWT
- 🛡️ Password strength indicator during signup
- 🚪 Secure logout functionality

### Core Features
- Create invoices with customer details
- Track paid/unpaid status
- Dashboard with financial summary stats
- Copy invoice details to clipboard
- Share invoices via WhatsApp
- Mark invoices as paid
- Delete invoices
- Business settings
- Mobile-responsive design

### Security Features
- User data isolation (encrypted with bcryptjs)
- Rate-limited authentication endpoints
- Input validation and sanitization
- CORS protection
- Security headers
- Token-based authorization
- Secure logout

## 🛠 Tech Stack

- **Frontend**: React + Vite
- **Backend**: Node.js + Express
- **Authentication**: JWT + bcryptjs
- **Security**: Helmet + express-validator + express-rate-limit
- **Storage**: JSON file (SQLite/PostgreSQL recommended for production)
- **Styling**: Inline CSS (Apple-inspired design)

## 📦 Backend Dependencies

```json
{
  "express": "^4.18.2",
  "cors": "^2.8.5",
  "bcryptjs": "^2.4.3",
  "jsonwebtoken": "^9.0.0",
  "express-rate-limit": "^6.7.0",
  "helmet": "^7.0.0",
  "express-validator": "^7.0.0"
}
```

## 🔑 Authentication Endpoints

```
POST   /auth/signup      - Create new user account
POST   /auth/login       - Authenticate user
GET    /auth/verify      - Verify JWT token
POST   /invoice          - Create invoice (requires auth)
GET    /invoices         - Get user's invoices (requires auth)
POST   /mark-paid        - Mark invoice paid (requires auth)
DELETE /invoice/:id      - Delete invoice (requires auth)
```

## � Environment Variables & Production Setup

### Initial Setup (Development)

The backend includes `.env.example` as a template. To get started:

```bash
cd paynote/backend
cp .env.example .env
```

Then edit `.env` with your values (development defaults are used if not provided).

### Production Security Requirements

Before deploying to production, you **must** configure these environment variables:

```env
# Generate strong JWT secret (example using openssl):
# openssl rand -base64 32
JWT_SECRET=your-very-secure-random-secret-key-minimum-32-characters

# Admin credentials (use strong, unique credentials)
ADMIN_EMAIL=your-admin@company.com
ADMIN_PASSWORD=SecureAdminPassword123!

# CORS allowed origins (your production domain)
CORS_ORIGIN=https://yourdomain.com

# Environment
NODE_ENV=production
PORT=5000
```

### Validation

The backend validates environment variables at startup:
- ✅ In **development**: Warns about missing vars but uses defaults
- ✅ In **production**: **Exits with error** if required vars are missing
- ✅ JWT_SECRET must be at least 32 characters in production

### .gitignore Protection

The `.env` file is already in `.gitignore` to prevent accidental commits. Never commit secrets!

## 🧪 Testing Authentication

### Test Account Creation
1. Try signup with weak password (e.g., "123456")
   - Should be rejected with requirements message
2. Create account with strong password
   - e.g., `MyBusiness2024!`

### Test Login
1. Use registered email and password
2. Access dashboard after successful login

### Test Rate Limiting
1. Attempt login 6 times rapidly
2. 6th attempt should be blocked with "Too many attempts" message

### Test User Isolation
1. Create Invoice as User A
2. Each user can only see their own invoices
3. Cannot access other users' data

## 📈 Future Security Enhancements

- [ ] Two-Factor Authentication (2FA/TOTP)
- [ ] Email verification on signup
- [ ] Password reset via email
- [ ] Login attempt notifications
- [ ] Session management dashboard
- [ ] IP-based security
- [ ] Audit logging
- [ ] Database migration from JSON

## 🐛 Troubleshooting

### "Invalid email or password"
- Verify email address spelling
- Passwords are case-sensitive
- Ensure you created the account first

### "Too many login attempts"
- You've exceeded rate limit
- Wait 15 minutes and try again

### "Password must contain..."
- Check AUTH_GUIDE.md for requirements
- Ensure all requirements are met:
  - 8+ characters
  - Uppercase letter (A-Z)
  - Lowercase letter (a-z)
  - Number (0-9)
  - Special character (!@#$%^&*)

### Backend connection error
- Verify API URL in `frontend/src/api.js`
- Check if backend is running: `http://localhost:5000/auth/verify`
- Ensure correct local IP address

## 📞 Support & Security

For security vulnerabilities or concerns:
- Report responsibly without public disclosure
- Contact the development team immediately
- Include detailed reproduction steps

**Never** share passwords, tokens, or sensitive data in bug reports!

## 📄 License

Paynote is open source and available under MIT License.

---

**Version**: 2.0.0 (Security Edition)  
**Last Updated**: May 4, 2026
