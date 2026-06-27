const express = require('express');
const cors = require('cors');
const path = require('path');
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

const defaultFrontendOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://paynote-olive.vercel.app'
];

const allowedOrigins = (process.env.CORS_ORIGIN || process.env.CLIENT_URL || defaultFrontendOrigins.join(','))
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean)

const MAX_ACCOUNTS_PER_IP = 3
const BILLING_TRIAL_DAYS = 30
const MONTHLY_CHARGE_NAIRA = 3000
const PAYSTACK_PAYMENT_LINK_URL = 'https://paystack.shop/pay/34qumnk0dg'

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
app.use(express.json({
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf
  }
}));
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

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIp = req.headers['x-real-ip'];
  if (realIp) {
    return Array.isArray(realIp) ? realIp[0].trim() : String(realIp).trim();
  }

  return req.ip || req.socket?.remoteAddress || 'unknown';
}

function normalizeIp(ip) {
  const cleanIp = String(ip || 'unknown').trim();
  return cleanIp.replace(/^::ffff:/i, '');
}

async function logActivity(action, details) {
  try {
    await db.logActivity(Date.now().toString(), action, sanitizeDetails(details));
  } catch (error) {
    console.error('Failed to log activity:', error.message);
    // Don't throw - logging errors shouldn't break the app
  }
}

// ============ Authentication Middleware ============

function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No bearer token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
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

    const signupIp = normalizeIp(getClientIp(req));
    const accountCount = await db.countUsersByIp(signupIp);

    if (accountCount >= MAX_ACCOUNTS_PER_IP) {
      await logActivity('signup_limit_reached', {
        email,
        name,
        signupIp,
        accountCount,
        maxAllowed: MAX_ACCOUNTS_PER_IP
      });

      return res.status(429).json({
        error: `Maximum ${MAX_ACCOUNTS_PER_IP} accounts per IP address allowed. Contact support if you need more.`
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    const userId = Date.now().toString();
    const newUser = await db.createUser(userId, email, name, hashedPassword, {
      signup_ip: signupIp,
      billing_status: 'trial_pending',
      billing_plan: 'free_trial',
      monthly_charge: MONTHLY_CHARGE_NAIRA,
      billing_currency: 'NGN',
      payment_provider: 'paystack',
      first_invoice_generated_at: null,
      billing_cycle_started_at: null,
      trial_ends_at: null,
      next_billing_due: null
    });

    await logActivity('user_signup', {
      email,
      name,
      signupIp,
      accountCount: accountCount + 1,
      billingPlan: 'free_trial',
      billingStatus: 'trial_pending'
    });

    // Generate JWT token
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, name: newUser.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'User registered successfully',
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        billing: {
          status: newUser.billing_status,
          plan: newUser.billing_plan,
          monthlyChargeNaira: Number(newUser.monthly_charge || MONTHLY_CHARGE_NAIRA),
          currency: newUser.billing_currency || 'NGN',
          paymentProvider: newUser.payment_provider || 'paystack',
          trialEndsAt: newUser.trial_ends_at,
          nextBillingDue: newUser.next_billing_due,
          firstInvoiceGeneratedAt: newUser.first_invoice_generated_at
        }
      }
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

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        billing: {
          status: user.billing_status,
          plan: user.billing_plan,
          monthlyChargeNaira: Number(user.monthly_charge || MONTHLY_CHARGE_NAIRA),
          currency: user.billing_currency || 'NGN',
          paymentProvider: user.payment_provider || 'paystack',
          trialEndsAt: user.trial_ends_at,
          nextBillingDue: user.next_billing_due,
          firstInvoiceGeneratedAt: user.first_invoice_generated_at
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify Token
app.get('/auth/verify', verifyToken, async (req, res) => {
  try {
    const user = await db.getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ valid: false, error: 'User not found' });
    }

    res.json({
      valid: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        billing: {
          status: user.billing_status,
          plan: user.billing_plan,
          monthlyChargeNaira: Number(user.monthly_charge || MONTHLY_CHARGE_NAIRA),
          currency: user.billing_currency || 'NGN',
          paymentProvider: user.payment_provider || 'paystack',
          trialEndsAt: user.trial_ends_at,
          nextBillingDue: user.next_billing_due,
          firstInvoiceGeneratedAt: user.first_invoice_generated_at
        }
      }
    });
  } catch (error) {
    console.error('Verify token error:', error);
    res.status(500).json({ valid: false, error: 'Internal server error' });
  }
});

app.post('/auth/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

app.post('/billing/checkout', verifyToken, async (req, res) => {
  try {
    const user = await db.getUserById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const now = new Date();
    const trialEndsAt = user.trial_ends_at ? new Date(user.trial_ends_at) : null;
    const isInTrial = Boolean(
      user.first_invoice_generated_at &&
      trialEndsAt &&
      now < trialEndsAt &&
      user.billing_status !== 'active'
    );

    if (isInTrial) {
      return res.status(400).json({
        error: 'Your free trial is still active',
        status: 'trial',
        trialEndsAt: user.trial_ends_at,
        nextBillingDue: user.next_billing_due || user.trial_ends_at
      });
    }

    await db.updateUserBillingState(user.id, {
      billing_status: 'pending_payment',
      billing_plan: 'monthly_subscription',
      payment_provider: 'paystack',
      monthly_charge: MONTHLY_CHARGE_NAIRA,
      billing_currency: 'NGN'
    });

    await logActivity('billing_checkout_initialized', {
      userId: user.id,
      email: user.email,
      paymentLink: PAYSTACK_PAYMENT_LINK_URL,
      mode: 'external_link'
    });

    res.json({
      status: 'pending_payment',
      authorizationUrl: PAYSTACK_PAYMENT_LINK_URL,
      paymentLink: PAYSTACK_PAYMENT_LINK_URL,
      amount: Number(user.monthly_charge || MONTHLY_CHARGE_NAIRA),
      currency: 'NGN',
      provider: 'paystack'
    });
  } catch (error) {
    console.error('Billing checkout error:', error);
    res.status(500).json({ error: 'Failed to initialize payment' });
  }
});

app.post('/webhooks/paystack', async (req, res) => {
  try {
    const event = req.body;
    const eventType = event.event;
    const paymentData = event.data || {};
    const metadata = paymentData.metadata || {};
    const userId = metadata.userId || metadata.user_id;

    if (!userId) {
      return res.status(200).json({ status: 'ignored', reason: 'No user metadata found' });
    }

    const now = new Date();
    const nextDue = new Date(now.getTime() + BILLING_TRIAL_DAYS * 24 * 60 * 60 * 1000);

    if (eventType === 'charge.success') {
      await db.updateUserBillingState(userId, {
        billing_status: 'active',
        billing_plan: 'monthly_subscription',
        payment_provider: 'paystack',
        monthly_charge: MONTHLY_CHARGE_NAIRA,
        billing_currency: 'NGN',
        billing_cycle_started_at: now.toISOString(),
        next_billing_due: nextDue.toISOString(),
        trial_ends_at: null
      });

      await logActivity('paystack_payment_success', {
        userId,
        reference: paymentData.reference,
        status: paymentData.status,
        amount: paymentData.amount,
        gateway: 'paystack'
      });
    } else if (eventType === 'charge.failed') {
      await db.updateUserBillingState(userId, {
        billing_status: 'charge_due',
        billing_plan: 'monthly_subscription',
        payment_provider: 'paystack'
      });

      await logActivity('paystack_payment_failed', {
        userId,
        reference: paymentData.reference,
        status: paymentData.status,
        gateway: 'paystack'
      });
    }

    res.status(200).json({ status: 'success' });
  } catch (error) {
    console.error('Paystack webhook error:', error);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
});

// ============ Invoice Routes (Protected) ============

// Create Invoice
app.post('/invoice', verifyToken, [
  body('customer').trim().isLength({ min: 2, max: 100 }).customSanitizer(value => sanitizeString(value)),
  body('items').isArray({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { customer, items } = req.body;
    const userId = req.user.id;
    const userEmail = req.user.email;

    const userRecord = await db.getUserById(userId);
    if (!userRecord) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (userRecord.billing_status === 'pending_payment' || userRecord.billing_status === 'charge_due') {
      return res.status(402).json({
        error: 'Payment required to continue using Paynote. Complete your subscription to create new invoices.'
      });
    }

    const newInvoice = await db.createInvoice(
      userId,
      userEmail,
      customer,
      items
    );

    const now = new Date();
    const trialEndsAt = new Date(now.getTime() + BILLING_TRIAL_DAYS * 24 * 60 * 60 * 1000);
    const billingUpdates = {
      monthly_charge: MONTHLY_CHARGE_NAIRA,
      billing_currency: 'NGN',
      payment_provider: 'paystack',
      billing_plan: userRecord?.billing_plan || 'free_trial'
    };

    if (!userRecord?.first_invoice_generated_at) {
      billingUpdates.first_invoice_generated_at = now.toISOString();
      billingUpdates.billing_cycle_started_at = now.toISOString();
      billingUpdates.trial_ends_at = trialEndsAt.toISOString();
      billingUpdates.billing_status = 'trial';
      billingUpdates.next_billing_due = trialEndsAt.toISOString();
    } else if (userRecord.trial_ends_at && now > new Date(userRecord.trial_ends_at)) {
      billingUpdates.billing_status = 'charge_due';
      billingUpdates.next_billing_due = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
    } else {
      billingUpdates.billing_status = userRecord.billing_status || 'trial';
      billingUpdates.next_billing_due = userRecord.next_billing_due || trialEndsAt.toISOString();
    }

    const updatedUser = await db.updateUserBillingState(userId, billingUpdates);

    await logActivity('invoice_created', {
      invoiceId: newInvoice.id,
      userId: userId,
      amount: newInvoice.amount,
      billingStatus: updatedUser.billing_status,
      billingPlan: updatedUser.billing_plan,
      monthlyChargeNaira: Number(updatedUser.monthly_charge || MONTHLY_CHARGE_NAIRA),
      nextBillingDue: updatedUser.next_billing_due,
      trialEndsAt: updatedUser.trial_ends_at
    });

    res.json({
      ...newInvoice,
      billing: {
        status: updatedUser.billing_status,
        plan: updatedUser.billing_plan,
        monthlyChargeNaira: Number(updatedUser.monthly_charge || MONTHLY_CHARGE_NAIRA),
        currency: updatedUser.billing_currency || 'NGN',
        paymentProvider: updatedUser.payment_provider || 'paystack',
        trialEndsAt: updatedUser.trial_ends_at,
        nextBillingDue: updatedUser.next_billing_due,
        firstInvoiceGeneratedAt: updatedUser.first_invoice_generated_at
      }
    });
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

app.get('/billing/status', verifyToken, async (req, res) => {
  try {
    const user = await db.getUserById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const now = new Date();
    const trialEndsAt = user.trial_ends_at ? new Date(user.trial_ends_at) : null;
    const nextBillingDue = user.next_billing_due ? new Date(user.next_billing_due) : null;
    const isTrialActive = Boolean(user.first_invoice_generated_at && trialEndsAt && now < trialEndsAt && user.billing_status !== 'active');
    const isPaymentRequired = Boolean(
      user.billing_status === 'charge_due' ||
      user.billing_status === 'pending_payment' ||
      (user.first_invoice_generated_at && trialEndsAt && now >= trialEndsAt && user.billing_status !== 'active') ||
      (user.billing_status === 'active' && nextBillingDue && now > nextBillingDue)
    );
    const effectiveStatus = isTrialActive ? 'trial' : (user.billing_status || 'trial_pending');

    const accountsOnIp = user.signup_ip ? await db.countUsersByIp(user.signup_ip) : 0;

    res.json({
      email: user.email,
      signupIp: user.signup_ip,
      accountsOnIp,
      maxAccountsPerIp: MAX_ACCOUNTS_PER_IP,
      plan: user.billing_plan || 'free_trial',
      status: isPaymentRequired ? 'charge_due' : effectiveStatus,
      paymentRequired: isPaymentRequired,
      firstInvoiceGeneratedAt: user.first_invoice_generated_at,
      trialEndsAt: user.trial_ends_at,
      nextBillingDue: user.next_billing_due || user.trial_ends_at,
      monthlyChargeNaira: Number(user.monthly_charge || MONTHLY_CHARGE_NAIRA),
      currency: user.billing_currency || 'NGN',
      paymentProvider: user.payment_provider || 'paystack'
    });
  } catch (error) {
    console.error('Billing status error:', error);
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

    res.json({
      message: 'Admin login successful',
      token,
      user: { id: 'admin', email: email, role: 'admin' }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify Admin
function verifyAdmin(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No bearer token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized as admin' });
    }
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

app.get('/admin/verify', verifyAdmin, (req, res) => {
  res.json({ valid: true, user: req.user });
});

app.post('/admin/logout', (req, res) => {
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

// ==================== ABSOLUTE ADMIN CONTROL ====================

// Delete User
app.delete('/admin/user/:id', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await db.deleteUser(id);
    await logActivity('admin_deleted_user', { admin: req.user.email, userId: id });
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Update User Status (Mark as Paid, Suspend, etc.)
app.put('/admin/user/:id/status', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    await db.updateUserStatus(id, status);
    await logActivity('admin_updated_user_status', { admin: req.user.email, userId: id, status });
    res.json({ message: 'User status updated successfully' });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// Mark Invoice as Paid
app.put('/admin/invoice/:id/mark-paid', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await db.updateInvoiceStatus(id, 'paid');
    await logActivity('admin_marked_invoice_paid', { admin: req.user.email, invoiceId: id });
    res.json({ message: 'Invoice marked as paid' });
  } catch (error) {
    console.error('Mark paid error:', error);
    res.status(500).json({ error: 'Failed to update invoice' });
  }
});

// Delete Invoice
app.delete('/admin/invoice/:id', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await db.deleteInvoice(id);
    await logActivity('admin_deleted_invoice', { admin: req.user.email, invoiceId: id });
    res.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    console.error('Delete invoice error:', error);
    res.status(500).json({ error: 'Failed to delete invoice' });
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
// ==================== PASSWORD RESET ====================

const crypto = require('crypto');
const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);
const { supabase } = db;

// Forgot Password
app.post('/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if user exists
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email.toLowerCase())
      .single();

    if (error || !user) {
      // Don't reveal if user exists or not (security)
      return res.json({ message: 'If this email exists, a reset link has been sent' });
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Save token in database
    await supabase.from('password_reset_tokens').insert({
      user_id: user.id,
      token: token,
      expires_at: expiresAt.toISOString(),
      used: false
    });

    // Send email using Resend
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`;

    await resend.emails.send({
      from: 'PayNote <onboarding@resend.dev>', // Change this later to your domain
      to: user.email,
      subject: 'Reset Your PayNote Password',
      html: `
        <p>Hello,</p>
        <p>You requested to reset your password.</p>
        <p>Click the link below to reset it:</p>
        <a href="${resetLink}">${resetLink}</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `
    });

    res.json({ message: 'If this email exists, a reset link has been sent' });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// Reset Password
app.post('/auth/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Find valid token
    const { data: resetToken, error } = await supabase
      .from('password_reset_tokens')
      .select('*')
      .eq('token', token)
      .eq('used', false)
      .gte('expires_at', new Date().toISOString())
      .single();

    if (error || !resetToken) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    // Hash new password (you should use bcrypt)
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update user password
    await supabase
      .from('users')
      .update({ password_hash: hashedPassword })
      .eq('id', resetToken.user_id);

    // Mark token as used
    await supabase
      .from('password_reset_tokens')
      .update({ used: true })
      .eq('id', resetToken.id);

    res.json({ message: 'Password has been reset successfully' });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});
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
