const express = require('express');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const { body, validationResult, param } = require('express-validator');
const db = require('./db');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
app.set('trust proxy', 1);

// ============ Environment Variable Validation ============
const NODE_ENV = process.env.NODE_ENV || 'development';
const isDevelopment = NODE_ENV === 'development';

// Check for required environment variables
const requiredEnvVars = ['JWT_SECRET', 'ADMIN_EMAIL', 'ADMIN_PASSWORD', 'CORS_ORIGIN'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  const message = `Missing required environment variables: ${missingEnvVars.join(', ')}\n` +
    `Create a .env file in the backend directory using .env.example as a template.`;
  
  if (!isDevelopment) {
    console.error('❌ CRITICAL: ' + message);
    process.exit(1); // Exit in production
  } else {
    console.warn('⚠️  WARNING (Development): ' + message);
    console.warn('Using default values for development. DO NOT use defaults in production!');
  }
}

const allowedOrigins = (process.env.CORS_ORIGIN || process.env.CLIENT_URL || '')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean)

const CSRF_COOKIE_NAME = 'paynote_csrf_token'
const CSRF_HEADER_NAME = 'x-csrf-token'

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
    }
  },
  referrerPolicy: {
    policy: 'no-referrer'
  },
  crossOriginResourcePolicy: {
    policy: 'same-origin'
  }
}));
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true)
    }

    return callback(new Error('Not allowed by CORS'))
  },
  credentials: true
}))
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb' }));
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  res.setHeader('Pragma', 'no-cache')
  res.setHeader('Expires', '0')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')
  next()
})

// Rate limiting for login attempts (5 requests per 15 minutes)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// General API rate limiter (100 requests per 15 minutes)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(apiLimiter);

// ============ Environment Variables Setup ============
// JWT Secret validation - must be strong in production
const JWT_SECRET = process.env.JWT_SECRET || (isDevelopment ? 'dev-secret-key-not-for-production' : null);
if (!JWT_SECRET) {
  console.error('❌ CRITICAL: JWT_SECRET must be set via environment variable in production');
  process.exit(1);
}
if (!isDevelopment && JWT_SECRET.length < 32) {
  console.error('❌ CRITICAL: JWT_SECRET must be at least 32 characters in production');
  process.exit(1);
}

const ADMIN_USER_EMAIL = process.env.ADMIN_EMAIL || (isDevelopment ? 'admin@paynote.com' : null);
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || (isDevelopment ? 'Admin@2024!' : null);

if (!ADMIN_USER_EMAIL || !ADMIN_PASSWORD) {
  console.error('❌ CRITICAL: ADMIN_EMAIL and ADMIN_PASSWORD must be set via environment variables in production');
  process.exit(1);
}

// ============ Helper Functions ============

function sanitizeString(value) {
  if (typeof value !== 'string') return value;

  return value
    .replace(/<[^>]*>/g, '')
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function sanitizeDetails(value) {
  if (Array.isArray(value)) {
    return value.map(item => sanitizeDetails(item));
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, sanitizeDetails(entry)])
    );
  }

  if (typeof value === 'string') {
    return sanitizeString(value);
  }

  return value;
}

function validatePasswordStrength(password) {
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter';
  if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter';
  if (!/[0-9]/.test(password)) return 'Password must contain at least one number';
  if (!/[!@#$%^&*]/.test(password)) return 'Password must contain at least one special character (!@#$%^&*)';
  return null;
}

async function logActivity(action, details) {
  try {
    await db.logActivity(Date.now().toString(), action, sanitizeDetails(details));
  } catch (error) {
    console.error('Failed to log activity:', error.message);
    // Don't throw - logging errors shouldn't break the app
  }
}

function generateCsrfToken() {
  return crypto.randomBytes(32).toString('hex');
}

function setCsrfCookie(res, token) {
  const secure = !isDevelopment;
  const cookie = `${CSRF_COOKIE_NAME}=${token}; Path=/; HttpOnly; Max-Age=86400; SameSite=Lax${secure ? '; Secure' : ''}`;
  res.setHeader('Set-Cookie', cookie);
}

function verifyCsrfToken(req, res, next) {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    return next();
  }

  if (req.path === '/auth/csrf') {
    return next();
  }

  const cookieToken = getCookieValue(req, CSRF_COOKIE_NAME);
  const headerToken = req.get(CSRF_HEADER_NAME);

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }

  next();
}

app.use(verifyCsrfToken);

// ============ Authentication Middleware ============

function getCookieValue(req, cookieName) {
  if (!req.headers.cookie) {
    return null;
  }

  const cookies = req.headers.cookie.split(';').map(cookie => cookie.trim());
  const match = cookies.find(cookie => cookie.startsWith(`${cookieName}=`));

  return match ? decodeURIComponent(match.split('=').slice(1).join('=')) : null;
}

function setSecureCookie(res, cookieName, token, maxAgeMs = 7 * 24 * 60 * 60 * 1000) {
  const secure = !isDevelopment;
  const cookie = `${cookieName}=${token}; Path=/; HttpOnly; Max-Age=${Math.floor(maxAgeMs / 1000)}; SameSite=Lax${secure ? '; Secure' : ''}`;
  res.setHeader('Set-Cookie', cookie);
}

function clearCookie(res, cookieName) {
  const secure = !isDevelopment;
  const cookie = `${cookieName}=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax${secure ? '; Secure' : ''}`;
  res.setHeader('Set-Cookie', cookie);
}

function verifyToken(req, res, next) {
  const token = getCookieValue(req, 'paynote_session') || req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No session provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
}

// ============ Auth Routes ============

// Sign Up
app.post('/auth/signup', loginLimiter, [
  body('email').isEmail().trim().normalizeEmail().toLowerCase(),
  body('password').trim().isLength({ min: 8 }),
  body('name').trim().isLength({ min: 2, max: 100 }).customSanitizer(value => sanitizeString(value))
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, name } = req.body;

    // Validate password strength
    const passwordError = validatePasswordStrength(password);
    if (passwordError) {
      return res.status(400).json({ error: passwordError });
    }

    // Check if user already exists
    const existingUser = await db.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    const userId = Date.now().toString();
    const newUser = await db.createUser(userId, email, name, hashedPassword);

    await logActivity('user_signup', { email, name });

    // Generate JWT token
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, name: newUser.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    setSecureCookie(res, 'paynote_session', token);

    res.json({
      message: 'User registered successfully',
      user: { id: newUser.id, email: newUser.email, name: newUser.name }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login
app.post('/auth/login', loginLimiter, [
  body('email').isEmail().trim().normalizeEmail().toLowerCase().customSanitizer(value => sanitizeString(value)),
  body('password').trim().customSanitizer(value => sanitizeString(value))
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    
    const user = await db.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      await logActivity('failed_login', { email });
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    await logActivity('user_login', { email, userId: user.id });

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    setSecureCookie(res, 'paynote_session', token);

    res.json({
      message: 'Login successful',
      user: { id: user.id, email: user.email, name: user.name }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/auth/csrf', (req, res) => {
  const token = generateCsrfToken();
  setCsrfCookie(res, token);
  res.json({ csrfToken: token });
});

// Verify Token
app.get('/auth/verify', verifyToken, (req, res) => {
  res.json({ valid: true, user: req.user });
});

app.post('/auth/logout', (req, res) => {
  clearCookie(res, 'paynote_session');
  res.json({ message: 'Logged out successfully' });
});

// ============ Invoice Routes (Protected) ============

// Create Invoice
app.post('/invoice', verifyToken, [
  body('customer').trim().isLength({ min: 2, max: 100 }).customSanitizer(value => sanitizeString(value)),
  body('phone').trim().matches(/^[0-9\-\+\s\(\)]+$/).isLength({ min: 5, max: 20 }).customSanitizer(value => sanitizeString(value)),
  body('item').trim().isLength({ min: 1, max: 200 }).customSanitizer(value => sanitizeString(value)),
  body('amount').isFloat({ min: 0.01 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { customer, phone, item, amount } = req.body;
    const userId = req.user.id;
    const userEmail = req.user.email;

    const invoiceId = Date.now().toString();
    const newInvoice = await db.createInvoice(
      invoiceId,
      userId,
      userEmail,
      customer,
      phone,
      item,
      amount
    );

    await logActivity('invoice_created', {
      invoiceId: newInvoice.id,
      userId: userId,
      amount: newInvoice.amount
    });

    res.json(newInvoice);
  } catch (error) {
    console.error('Create invoice error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get User Invoices
app.get('/invoices', verifyToken, async (req, res) => {
  try {
    const userInvoices = await db.getInvoicesByUserId(req.user.id);
    res.json(userInvoices);
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark as Paid
app.post('/mark-paid', verifyToken, [
  body('id').trim().customSanitizer(value => sanitizeString(value))
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.body;
    const invoice = await db.getInvoiceById(id);

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Check if invoice belongs to user
    if (invoice.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const updatedInvoice = await db.updateInvoiceStatus(id, 'paid');

    res.json(updatedInvoice);
  } catch (error) {
    console.error('Mark paid error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete Invoice
app.delete('/invoice/:id', verifyToken, [
  param('id').trim().customSanitizer(value => sanitizeString(value))
], async (req, res) => {
  try {
    const { id } = req.params;
    const invoice = await db.getInvoiceById(id);

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    if (invoice.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await db.deleteInvoice(id);

    res.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    console.error('Delete invoice error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============ Admin Routes ============

// Admin Login
app.post('/admin/login', loginLimiter, [
  body('email').isEmail().trim().normalizeEmail().toLowerCase().customSanitizer(value => sanitizeString(value)),
  body('password').trim().customSanitizer(value => sanitizeString(value))
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Simple admin check
    if (email !== ADMIN_USER_EMAIL || password !== ADMIN_PASSWORD) {
      await logActivity('failed_admin_login', { email, ip: req.ip });
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    await logActivity('admin_login', { email });

    const token = jwt.sign(
      { id: 'admin', email: email, role: 'admin' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    setSecureCookie(res, 'paynote_admin_session', token);

    res.json({
      message: 'Admin login successful',
      user: { id: 'admin', email: email, role: 'admin' }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify Admin
function verifyAdmin(req, res, next) {
  const token = getCookieValue(req, 'paynote_admin_session') || req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No admin session provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized as admin' });
    }
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired admin session' });
  }
}

app.get('/admin/verify', verifyAdmin, (req, res) => {
  res.json({ valid: true, user: req.user });
});

app.post('/admin/logout', (req, res) => {
  clearCookie(res, 'paynote_admin_session');
  res.json({ message: 'Admin logged out successfully' });
});

// Get Admin Dashboard Stats
app.get('/admin/stats', verifyAdmin, async (req, res) => {
  try {
    const users = await db.getAllUsers();
    const invoices = await db.getAllInvoices();
    const logs = await db.getAllLogs();

    const totalUsers = users.length;
    const totalInvoices = invoices.length;
    const totalRevenue = invoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + inv.amount, 0)
      .toFixed(2);
    const unpaidRevenue = invoices
      .filter(inv => inv.status === 'unpaid')
      .reduce((sum, inv) => sum + inv.amount, 0)
      .toFixed(2);

    const recentInvoices = invoices.slice(0, 10);
    const recentUsers = users.slice(0, 10);
    const recentLogs = logs.slice(0, 50);

    const loginAttempts = logs
      .filter(l => l.action === 'user_login' || l.action === 'failed_admin_login')
      .slice(0, 100);

    const invoicesByStatus = {
      paid: invoices.filter(i => i.status === 'paid').length,
      unpaid: invoices.filter(i => i.status === 'unpaid').length
    };

    res.json({
      stats: {
        totalUsers,
        totalInvoices,
        totalRevenue,
        unpaidRevenue,
        invoicesByStatus
      },
      recentInvoices,
      recentUsers,
      recentLogs,
      loginAttempts
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get All Users (Admin)
app.get('/admin/users', verifyAdmin, async (req, res) => {
  try {
    const users = await db.getAllUsers();
    res.json(users);
  } catch (error) {
    console.error('Admin users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get All Invoices (Admin)
app.get('/admin/invoices', verifyAdmin, async (req, res) => {
  try {
    const invoices = await db.getAllInvoices();
    res.json(invoices);
  } catch (error) {
    console.error('Admin invoices error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get Activity Logs (Admin)
app.get('/admin/logs', verifyAdmin, async (req, res) => {
  try {
    const logs = await db.getAllLogs();
    res.json(logs.reverse());
  } catch (error) {
    console.error('Admin logs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============ Server ============

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Test database connection
    const connected = await db.testConnection();
    
    if (!connected) {
      console.error('❌ Failed to connect to Supabase. Check your SUPABASE_URL and SUPABASE_KEY.');
      console.error('📖 See SUPABASE_SETUP.md for configuration instructions.');
      process.exit(1);
    }

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Paynote server running on port ${PORT}`);
      console.log(`📊 Database: Supabase (persistent storage enabled)`);
    });
  } catch (error) {
    console.error('Server startup error:', error);
    process.exit(1);
  }
}

startServer();
