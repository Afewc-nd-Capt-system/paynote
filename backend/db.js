const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.join(__dirname, '.env'), override: false });

const USERS_FILE = path.join(__dirname, 'users.json');
const INVOICES_FILE = path.join(__dirname, 'invoices.json');
const LOGS_FILE = path.join(__dirname, 'logs.json');

function getEnvValue(name) {
  return String(process.env[name] || '').trim();
}

const SUPABASE_URL = getEnvValue('SUPABASE_URL');
const SUPABASE_KEY = getEnvValue('SUPABASE_KEY');
const hasSupabaseConfig = Boolean(SUPABASE_URL && SUPABASE_KEY);

let supabase = null;
let usingFallbackStorage = false;

if (hasSupabaseConfig) {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log('? Supabase client initialized from host environment.');
  } catch (error) {
    console.error('? Failed to initialize Supabase client:', error.message);
    console.warn('?? Falling back to local JSON storage because Supabase initialization failed.');
    usingFallbackStorage = true;
  }
} else {
  console.warn('?? Supabase URL or API key is not configured. Falling back to local JSON storage.');
  usingFallbackStorage = true;
}

async function readJsonFile(filePath) {
  try {
    const content = await fs.promises.readFile(filePath, 'utf8');
    return JSON.parse(content || '[]');
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

async function writeJsonFile(filePath, data) {
  await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2));
}

function normalizeUser(record = {}, metadata = {}) {
  return {
    id: record.id || record.user_id || null,
    email: record.email || null,
    name: record.name || record.full_name || null,
    password_hash: record.password_hash || record.passwordHash || null,
    created_at: record.created_at || record.createdAt || new Date().toISOString(),
    signup_ip: record.signup_ip || metadata.signup_ip || null,
    billing_status: record.billing_status || metadata.billing_status || 'trial_pending',
    billing_plan: record.billing_plan || metadata.billing_plan || 'free_trial',
    monthly_charge: Number(record.monthly_charge ?? metadata.monthly_charge ?? 3000),
    billing_currency: record.billing_currency || metadata.billing_currency || 'NGN',
    payment_provider: record.payment_provider || metadata.payment_provider || 'paystack',
    trial_ends_at: record.trial_ends_at || metadata.trial_ends_at || null,
    first_invoice_generated_at: record.first_invoice_generated_at || metadata.first_invoice_generated_at || null,
    billing_cycle_started_at: record.billing_cycle_started_at || metadata.billing_cycle_started_at || null,
    next_billing_due: record.next_billing_due || metadata.next_billing_due || null,
    updated_at: record.updated_at || record.updatedAt || new Date().toISOString()
  };
}

function normalizeInvoice(record = {}) {
  const amount = Number(record.amount ?? record.monthly_charge ?? 0);

  return {
    id: record.id || record.invoice_id || null,
    user_id: record.user_id || record.userId || null,
    user_email: record.user_email || record.userEmail || null,
    customer: record.customer || null,
    phone: record.phone || null,
    item: record.item || null,
    amount,
    status: record.status || 'unpaid',
    date: record.date || new Date().toISOString(),
    updated_at: record.updated_at || record.updatedAt || new Date().toISOString()
  };
}

async function fallbackGetUserByEmail(email) {
  const users = await readJsonFile(USERS_FILE);
  const normalizedUsers = users
    .map(user => normalizeUser(user))
    .filter(user => user.email === email.toLowerCase());

  return normalizedUsers[0] || null;
}

async function fallbackGetUserById(id) {
  const users = await readJsonFile(USERS_FILE);
  const normalizedUsers = users.map(user => normalizeUser(user));

  return normalizedUsers.find(user => user.id === id) || null;
}

async function fallbackCreateUser(id, email, name, passwordHash, metadata = {}) {
  const users = await readJsonFile(USERS_FILE);
  const newUser = normalizeUser({
    id,
    email,
    name,
    passwordHash,
    createdAt: new Date().toISOString(),
    ...metadata
  }, metadata);

  users.push({
    id: newUser.id,
    email: newUser.email,
    name: newUser.name,
    passwordHash: newUser.password_hash,
    createdAt: newUser.created_at,
    signup_ip: newUser.signup_ip,
    billing_status: newUser.billing_status,
    billing_plan: newUser.billing_plan,
    monthly_charge: newUser.monthly_charge,
    billing_currency: newUser.billing_currency,
    payment_provider: newUser.payment_provider,
    trial_ends_at: newUser.trial_ends_at,
    first_invoice_generated_at: newUser.first_invoice_generated_at,
    billing_cycle_started_at: newUser.billing_cycle_started_at,
    next_billing_due: newUser.next_billing_due,
    updatedAt: newUser.updated_at
  });

  await writeJsonFile(USERS_FILE, users);
  return newUser;
}

async function fallbackCountUsersByIp(ip) {
  const users = await readJsonFile(USERS_FILE);
  const normalizedUsers = users.map(user => normalizeUser(user));
  return normalizedUsers.filter(user => user.signup_ip === ip).length;
}

async function fallbackUpdateUserBillingState(userId, billingUpdates = {}) {
  const users = await readJsonFile(USERS_FILE);
  const normalizedUsers = users.map(user => normalizeUser(user));
  const index = normalizedUsers.findIndex(user => user.id === userId);

  if (index === -1) {
    return null;
  }

  const updatedUser = normalizeUser({
    ...normalizedUsers[index],
    ...billingUpdates
  }, billingUpdates);

  users[index] = {
    id: updatedUser.id,
    email: updatedUser.email,
    name: updatedUser.name,
    passwordHash: updatedUser.password_hash,
    createdAt: updatedUser.created_at,
    signup_ip: updatedUser.signup_ip,
    billing_status: updatedUser.billing_status,
    billing_plan: updatedUser.billing_plan,
    monthly_charge: updatedUser.monthly_charge,
    billing_currency: updatedUser.billing_currency,
    payment_provider: updatedUser.payment_provider,
    trial_ends_at: updatedUser.trial_ends_at,
    first_invoice_generated_at: updatedUser.first_invoice_generated_at,
    billing_cycle_started_at: updatedUser.billing_cycle_started_at,
    next_billing_due: updatedUser.next_billing_due,
    updatedAt: updatedUser.updated_at
  };

  await writeJsonFile(USERS_FILE, users);
  return updatedUser;
}

async function fallbackGetAllUsers() {
  const users = await readJsonFile(USERS_FILE);
  return users.map(user => normalizeUser(user)).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

async function fallbackCreateInvoice(id, userId, userEmail, customer, phone, item, amount) {
  const invoices = await readJsonFile(INVOICES_FILE);
  const newInvoice = normalizeInvoice({
    id,
    userId,
    userEmail,
    customer,
    phone,
    item,
    amount,
    status: 'unpaid',
    date: new Date().toISOString()
  });

  invoices.push({
    id: newInvoice.id,
    userId: newInvoice.user_id,
    userEmail: newInvoice.user_email,
    customer: newInvoice.customer,
    phone: newInvoice.phone,
    item: newInvoice.item,
    amount: newInvoice.amount,
    status: newInvoice.status,
    date: newInvoice.date,
    updatedAt: newInvoice.updated_at
  });

  await writeJsonFile(INVOICES_FILE, invoices);
  return newInvoice;
}

async function fallbackGetInvoicesByUserId(userId) {
  const invoices = await readJsonFile(INVOICES_FILE);
  return invoices
    .map(invoice => normalizeInvoice(invoice))
    .filter(invoice => invoice.user_id === userId);
}

async function fallbackGetInvoiceById(id) {
  const invoices = await readJsonFile(INVOICES_FILE);
  const normalizedInvoices = invoices.map(invoice => normalizeInvoice(invoice));
  return normalizedInvoices.find(invoice => invoice.id === id) || null;
}

async function fallbackUpdateInvoiceStatus(id, status) {
  const invoices = await readJsonFile(INVOICES_FILE);
  const index = invoices.findIndex(invoice => (invoice.id || invoice.invoice_id) === id);

  if (index === -1) {
    return null;
  }

  invoices[index] = {
    ...invoices[index],
    status,
    updatedAt: new Date().toISOString()
  };

  await writeJsonFile(INVOICES_FILE, invoices);
  return normalizeInvoice(invoices[index]);
}

async function fallbackDeleteInvoice(id) {
  const invoices = await readJsonFile(INVOICES_FILE);
  const filtered = invoices.filter(invoice => (invoice.id || invoice.invoice_id) !== id);
  await writeJsonFile(INVOICES_FILE, filtered);
}

async function fallbackGetAllInvoices() {
  const invoices = await readJsonFile(INVOICES_FILE);
  return invoices.map(invoice => normalizeInvoice(invoice)).sort((a, b) => new Date(b.date) - new Date(a.date));
}

async function fallbackLogActivity(id, action, details) {
  const logs = await readJsonFile(LOGS_FILE);
  logs.push({
    id,
    timestamp: new Date().toISOString(),
    action,
    details: details || {}
  });
  await writeJsonFile(LOGS_FILE, logs);
}

async function fallbackGetAllLogs() {
  const logs = await readJsonFile(LOGS_FILE);
  return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

async function fallbackGetLogsByAction(action, limit = 100) {
  const logs = await readJsonFile(LOGS_FILE);
  return logs.filter(log => log.action === action).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, limit);
}

async function fallbackGetInvoiceStats() {
  const invoices = await readJsonFile(INVOICES_FILE);
  const normalizedInvoices = invoices.map(invoice => normalizeInvoice(invoice));
  const paidInvoices = normalizedInvoices.filter(invoice => invoice.status === 'paid');
  const unpaidInvoices = normalizedInvoices.filter(invoice => invoice.status === 'unpaid');

  return {
    total: normalizedInvoices.length,
    paid: paidInvoices.length,
    unpaid: unpaidInvoices.length,
    totalRevenue: paidInvoices.reduce((sum, invoice) => sum + (invoice.amount || 0), 0).toFixed(2),
    unpaidRevenue: unpaidInvoices.reduce((sum, invoice) => sum + (invoice.amount || 0), 0).toFixed(2)
  };
}

async function fallbackGetUserCount() {
  const users = await readJsonFile(USERS_FILE);
  return users.length;
}

async function fallbackTestConnection() {
  await Promise.all([
    readJsonFile(USERS_FILE),
    readJsonFile(INVOICES_FILE),
    readJsonFile(LOGS_FILE)
  ]);

  console.log('? Local JSON storage is available.');
  return true;
}

async function getUserByEmail(email) {
  if (supabase) {
    const { data, error } = await supabase.from('users').select('*').eq('email', email).single();
    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  }

  return fallbackGetUserByEmail(email);
}

async function getUserById(id) {
  if (supabase) {
    const { data, error } = await supabase.from('users').select('*').eq('id', id).single();
    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  }

  return fallbackGetUserById(id);
}

async function createUser(id, email, name, passwordHash, metadata = {}) {
  if (supabase) {
    const { data, error } = await supabase.from('users').insert([{
      id,
      email,
      name,
      password_hash: passwordHash,
      created_at: new Date().toISOString(),
      ...metadata
    }]).select().single();

    if (error) throw error;
    return data;
  }

  return fallbackCreateUser(id, email, name, passwordHash, metadata);
}

async function countUsersByIp(ip) {
  if (supabase) {
    const { count, error } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('signup_ip', ip);
    if (error) throw error;
    return count || 0;
  }

  return fallbackCountUsersByIp(ip);
}

async function updateUserBillingState(userId, billingUpdates = {}) {
  if (supabase) {
    const { data, error } = await supabase.from('users').update({
      ...billingUpdates,
      updated_at: new Date().toISOString()
    }).eq('id', userId).select().single();

    if (error) throw error;
    return data;
  }

  return fallbackUpdateUserBillingState(userId, billingUpdates);
}

async function getAllUsers() {
  if (supabase) {
    const { data, error } = await supabase.from('users').select('id, email, name, signup_ip, billing_status, billing_plan, monthly_charge, billing_currency, payment_provider, trial_ends_at, first_invoice_generated_at, created_at').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  return fallbackGetAllUsers();
}

async function createInvoice(id, userId, userEmail, customer, phone, item, amount) {
  if (supabase) {
    const { data, error } = await supabase.from('invoices').insert([{
      id,
      user_id: userId,
      user_email: userEmail,
      customer,
      phone,
      item,
      amount: parseFloat(amount),
      status: 'unpaid',
      date: new Date().toISOString()
    }]).select().single();

    if (error) throw error;
    return data;
  }

  return fallbackCreateInvoice(id, userId, userEmail, customer, phone, item, amount);
}

async function getInvoicesByUserId(userId) {
  if (supabase) {
    const { data, error } = await supabase.from('invoices').select('*').eq('user_id', userId).order('date', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  return fallbackGetInvoicesByUserId(userId);
}

async function getInvoiceById(id) {
  if (supabase) {
    const { data, error } = await supabase.from('invoices').select('*').eq('id', id).single();
    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  }

  return fallbackGetInvoiceById(id);
}

async function updateInvoiceStatus(id, status) {
  if (supabase) {
    const { data, error } = await supabase.from('invoices').update({ status, updated_at: new Date().toISOString() }).eq('id', id).select().single();
    if (error) throw error;
    return data;
  }

  return fallbackUpdateInvoiceStatus(id, status);
}

async function deleteInvoice(id) {
  if (supabase) {
    const { error } = await supabase.from('invoices').delete().eq('id', id);
    if (error) throw error;
    return;
  }

  return fallbackDeleteInvoice(id);
}

async function getAllInvoices() {
  if (supabase) {
    const { data, error } = await supabase.from('invoices').select('*').order('date', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  return fallbackGetAllInvoices();
}

async function logActivity(id, action, details) {
  if (supabase) {
    const { error } = await supabase.from('activity_logs').insert([{
      id,
      timestamp: new Date().toISOString(),
      action,
      details: details || {}
    }]);

    if (error) throw error;
    return;
  }

  return fallbackLogActivity(id, action, details);
}

async function getAllLogs() {
  if (supabase) {
    const { data, error } = await supabase.from('activity_logs').select('*').order('timestamp', { ascending: false }).limit(50);
    if (error) throw error;
    return data || [];
  }

  return fallbackGetAllLogs();
}

async function getLogsByAction(action, limit = 100) {
  if (supabase) {
    const { data, error } = await supabase.from('activity_logs').select('*').eq('action', action).order('timestamp', { ascending: false }).limit(limit);
    if (error) throw error;
    return data || [];
  }

  return fallbackGetLogsByAction(action, limit);
}

async function getInvoiceStats() {
  if (supabase) {
    const { data, error } = await supabase.from('invoices').select('status, amount');
    if (error) throw error;

    const stats = {
      total: data.length,
      paid: data.filter(i => i.status === 'paid').length,
      unpaid: data.filter(i => i.status === 'unpaid').length,
      totalRevenue: data.filter(i => i.status === 'paid').reduce((sum, i) => sum + (i.amount || 0), 0).toFixed(2),
      unpaidRevenue: data.filter(i => i.status === 'unpaid').reduce((sum, i) => sum + (i.amount || 0), 0).toFixed(2)
    };
    return stats;
  }

  return fallbackGetInvoiceStats();
}

async function getUserCount() {
  if (supabase) {
    const { count, error } = await supabase.from('users').select('*', { count: 'exact', head: true });
    if (error) throw error;
    return count || 0;
  }

  return fallbackGetUserCount();
}

async function testConnection() {
  if (supabase) {
    try {
      const { error } = await supabase.from('users').select('id').limit(1);
      if (error) throw error;
      console.log('? Supabase connection successful!');
      return true;
    } catch (error) {
      console.error('? Supabase connection failed:', error.message);
      return false;
    }
  }

  return fallbackTestConnection();
}

// ==================== ADMIN CONTROL METHODS ====================

async function deleteUser(id) {
  try {
    // Check if Supabase is available
    if (supabase) {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Supabase delete error:', error);
        throw error;
      }
    } else {
      // Local JSON fallback
      let users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
      const originalLength = users.length;
      users = users.filter(u => u.id !== id);
      
      if (users.length === originalLength) {
        throw new Error('User not found');
      }
      
      fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
    }
  } catch (error) {
    console.error('deleteUser error:', error);
    throw error;
  }
}

async function updateUserStatus(id, status) {
  try {
    if (supabase) {
      const { error } = await supabase
        .from('users')
        .update({ billing_status: status })
        .eq('id', id);
      
      if (error) throw error;
    } else {
      let users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
      const index = users.findIndex(u => u.id === id);
      if (index !== -1) {
        users[index].billing_status = status;
        fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
      }
    }
  } catch (error) {
    console.error('updateUserStatus error:', error);
    throw error;
  }
}

module.exports = {
  supabase,
  getUserByEmail,
  getUserById,
  createUser,
  countUsersByIp,
  updateUserBillingState,
  getAllUsers,
  createInvoice,
  getInvoicesByUserId,
  getInvoiceById,
  updateInvoiceStatus,
  deleteInvoice,
  getAllInvoices,
  logActivity,
  getAllLogs,
  getLogsByAction,
  getInvoiceStats,
  getUserCount,
  deleteUser,
  testConnection,
  updateUserStatus
};
