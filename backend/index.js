const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const { body, validationResult, param } = require('express-validator');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();

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

// Security Middleware
app.use(helmet());
app.use(cors({
  origin: [
    process.env.CLIENT_URL,
    "http://10.162.26.235:5173"
  ],
  credentials: true
}))
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb' }));

// Helper function to parse CORS origins from comma-separated string
function parseCorsOrigin(corsString) {
  return corsString.split(',').map(origin => origin.trim());
}

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

// File paths
const DATA_FILE = path.join(__dirname, 'invoices.json');
const USERS_FILE = path.join(__dirname, 'users.json');
const LOGS_FILE = path.join(__dirname, 'logs.json');
const ADMIN_USER_EMAIL = process.env.ADMIN_EMAIL || (isDevelopment ? 'admin@paynote.com' : null);
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || (isDevelopment ? 'Admin@2024!' : null);

if (!ADMIN_USER_EMAIL || !ADMIN_PASSWORD) {
  console.error('❌ CRITICAL: ADMIN_EMAIL and ADMIN_PASSWORD must be set via environment variables in production');
  process.exit(1);
}

// Ensure data files exist
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify([]));
}
if (!fs.existsSync(USERS_FILE)) {
  fs.writeFileSync(USERS_FILE, JSON.stringify([]));
}
if (!fs.existsSync(LOGS_FILE)) {
  fs.writeFileSync(LOGS_FILE, JSON.stringify([]));
}

// ============ Helper Functions ============

function readUsers() {
  try {
    const data = fs.readFileSync(USERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

function writeUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function readInvoices() {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

function writeInvoices(invoices) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(invoices, null, 2));
}

function validatePasswordStrength(password) {
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter';
  if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter';
  if (!/[0-9]/.test(password)) return 'Password must contain at least one number';
  if (!/[!@#$%^&*]/.test(password)) return 'Password must contain at least one special character (!@#$%^&*)';
  return null;
}

function readLogs() {
  try {
    const data = fs.readFileSync(LOGS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

function writeLogs(logs) {
  fs.writeFileSync(LOGS_FILE, JSON.stringify(logs, null, 2));
}

function logActivity(action, details) {
  const logs = readLogs();
  logs.push({
    id: Date.now().toString(),
    timestamp: new Date().toISOString(),
    action,
    details
  });
  // Keep only last 1000 logs
  if (logs.length > 1000) {
    logs.shift();
  }
  writeLogs(logs);
}

// ============ Authentication Middleware ============

function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
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
  body('email').isEmail().normalizeEmail().toLowerCase(),
  body('password').isLength({ min: 8 }).trim(),
  body('name').trim().isLength({ min: 2, max: 100 })
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

    const users = readUsers();

    // Check if user already exists
    if (users.find(u => u.email === email)) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = {
      id: Date.now().toString(),
      email,
      name,
      passwordHash: hashedPassword,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    writeUsers(users);

    logActivity('user_signup', { email, name });

    // Generate JWT token
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, name: newUser.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'User registered successfully',
      token,
      user: { id: newUser.id, email: newUser.email, name: newUser.name }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login
app.post('/auth/login', loginLimiter, [
  body('email').isEmail().normalizeEmail().toLowerCase(),
  body('password').trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    const users = readUsers();

    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      logActivity('failed_login', { email });
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    logActivity('user_login', { email, userId: user.id });

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, email: user.email, name: user.name }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify Token
app.get('/auth/verify', verifyToken, (req, res) => {
  res.json({ valid: true, user: req.user });
});

// ============ Invoice Routes (Protected) ============

// Create Invoice
app.post('/invoice', verifyToken, [
  body('customer').trim().isLength({ min: 2, max: 100 }),
  body('phone').trim().matches(/^[0-9\-\+\s\(\)]+$/).isLength({ min: 5, max: 20 }),
  body('item').trim().isLength({ min: 1, max: 200 }),
  body('amount').isFloat({ min: 0.01 })
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { customer, phone, item, amount } = req.body;
    const userId = req.user.id;
    const userEmail = req.user.email;

    const invoices = readInvoices();
    const newInvoice = {
      id: Date.now().toString(),
      userId,
      userEmail,
      customer,
      phone,
      item,
      amount: parseFloat(amount),
      status: 'unpaid',
      date: new Date().toISOString()
    };

    invoices.push(newInvoice);
    writeInvoices(invoices);

    logActivity('invoice_created', {
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
app.get('/invoices', verifyToken, (req, res) => {
  try {
    const invoices = readInvoices();
    const userInvoices = invoices.filter(inv => inv.userId === req.user.id);
    res.json(userInvoices);
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark as Paid
app.post('/mark-paid', verifyToken, [
  body('id').trim()
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.body;
    const invoices = readInvoices();
    const invoice = invoices.find(inv => inv.id === id);

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Check if invoice belongs to user
    if (invoice.userId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    invoice.status = 'paid';
    writeInvoices(invoices);

    res.json(invoice);
  } catch (error) {
    console.error('Mark paid error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete Invoice
app.delete('/invoice/:id', verifyToken, [
  param('id').trim()
], (req, res) => {
  try {
    const { id } = req.params;
    let invoices = readInvoices();
    const invoice = invoices.find(inv => inv.id === id);

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    if (invoice.userId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    invoices = invoices.filter(inv => inv.id !== id);
    writeInvoices(invoices);

    res.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    console.error('Delete invoice error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============ Admin Routes ============

// Admin Login
app.post('/admin/login', loginLimiter, [
  body('email').isEmail().normalizeEmail().toLowerCase(),
  body('password').trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Simple admin check
    if (email !== ADMIN_USER_EMAIL || password !== ADMIN_PASSWORD) {
      logActivity('failed_admin_login', { email, ip: req.ip });
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    logActivity('admin_login', { email });

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
    return res.status(401).json({ error: 'No token provided' });
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

// Get Admin Dashboard Stats
app.get('/admin/stats', verifyAdmin, (req, res) => {
  try {
    const users = readUsers();
    const invoices = readInvoices();
    const logs = readLogs();

    const totalUsers = users.length;
    const totalInvoices = invoices.length;
    const totalRevenue = invoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + inv.amount, 0);
    const unpaidRevenue = invoices
      .filter(inv => inv.status === 'unpaid')
      .reduce((sum, inv) => sum + inv.amount, 0);

    const recentInvoices = invoices.slice(-10).reverse();
    const recentUsers = users.slice(-10).reverse();
    const recentLogs = logs.slice(-50).reverse();

    const loginAttempts = logs
      .filter(l => l.action === 'login' || l.action === 'failed_admin_login')
      .slice(-100);

    const invoicesByStatus = {
      paid: invoices.filter(i => i.status === 'paid').length,
      unpaid: invoices.filter(i => i.status === 'unpaid').length
    };

    res.json({
      stats: {
        totalUsers,
        totalInvoices,
        totalRevenue: totalRevenue.toFixed(2),
        unpaidRevenue: unpaidRevenue.toFixed(2),
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
app.get('/admin/users', verifyAdmin, (req, res) => {
  try {
    const users = readUsers();
    const sanitized = users.map(u => ({
      id: u.id,
      email: u.email,
      name: u.name,
      createdAt: u.createdAt
    }));
    res.json(sanitized);
  } catch (error) {
    console.error('Admin users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get All Invoices (Admin)
app.get('/admin/invoices', verifyAdmin, (req, res) => {
  try {
    const invoices = readInvoices();
    res.json(invoices);
  } catch (error) {
    console.error('Admin invoices error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get Activity Logs (Admin)
app.get('/admin/logs', verifyAdmin, (req, res) => {
  try {
    const logs = readLogs();
    res.json(logs.reverse());
  } catch (error) {
    console.error('Admin logs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============ Server ============

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Paynote server running on port ${PORT}`);
});
