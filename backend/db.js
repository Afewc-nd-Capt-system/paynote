const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Initialize Supabase client
const SUPABASE_URL = process.env.SUPABASE_URL;
console.log("SUPABASE_URL LOADED:", JSON.stringify(SUPABASE_URL));
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('⚠️  SUPABASE_URL or SUPABASE_KEY not set. Check your .env file.');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ============ User Operations ============

async function getUserByEmail(email) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
      throw error;
    }
    return data || null;
  } catch (error) {
    console.error('Error getting user by email:', error);
    throw error;
  }
}

async function getUserById(id) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    return data || null;
  } catch (error) {
    console.error('Error getting user by ID:', error);
    throw error;
  }
}

async function createUser(id, email, name, passwordHash) {
  try {
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          id,
          email,
          name,
          password_hash: passwordHash,
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

async function getAllUsers() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, name, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting all users:', error);
    throw error;
  }
}

// ============ Invoice Operations ============

async function createInvoice(id, userId, userEmail, customer, phone, item, amount) {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .insert([
        {
          id,
          user_id: userId,
          user_email: userEmail,
          customer,
          phone,
          item,
          amount: parseFloat(amount),
          status: 'unpaid',
          date: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating invoice:', error);
    throw error;
  }
}

async function getInvoicesByUserId(userId) {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting invoices by user ID:', error);
    throw error;
  }
}

async function getInvoiceById(id) {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    return data || null;
  } catch (error) {
    console.error('Error getting invoice by ID:', error);
    throw error;
  }
}

async function updateInvoiceStatus(id, status) {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating invoice status:', error);
    throw error;
  }
}

async function deleteInvoice(id) {
  try {
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting invoice:', error);
    throw error;
  }
}

async function getAllInvoices() {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .order('date', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting all invoices:', error);
    throw error;
  }
}

// ============ Activity Log Operations ============

async function logActivity(id, action, details) {
  try {
    const { error } = await supabase
      .from('activity_logs')
      .insert([
        {
          id,
          timestamp: new Date().toISOString(),
          action,
          details: details || {}
        }
      ]);

    if (error) throw error;
  } catch (error) {
    console.error('Error logging activity:', error);
    // Don't throw - logging errors shouldn't break the app
  }
}

async function getAllLogs() {
  try {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(50);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting activity logs:', error);
    throw error;
  }
}

async function getLogsByAction(action, limit = 100) {
  try {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('action', action)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting logs by action:', error);
    throw error;
  }
}

// ============ Analytics Operations ============

async function getInvoiceStats() {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select('status, amount');

    if (error) throw error;

    const stats = {
      total: data.length,
      paid: data.filter(i => i.status === 'paid').length,
      unpaid: data.filter(i => i.status === 'unpaid').length,
      totalRevenue: data
        .filter(i => i.status === 'paid')
        .reduce((sum, i) => sum + (i.amount || 0), 0)
        .toFixed(2),
      unpaidRevenue: data
        .filter(i => i.status === 'unpaid')
        .reduce((sum, i) => sum + (i.amount || 0), 0)
        .toFixed(2)
    };

    return stats;
  } catch (error) {
    console.error('Error getting invoice stats:', error);
    throw error;
  }
}

async function getUserCount() {
  try {
    const { count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Error getting user count:', error);
    throw error;
  }
}

// ============ Test Connection ============

async function testConnection() {
  try {
    const { error } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    if (error) throw error;

    console.log('✅ Supabase connection successful!');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection failed:', error.message);
    return false;
  }
}
module.exports = {
  supabase,
  // User operations
  getUserByEmail,
  getUserById,
  createUser,
  getAllUsers,
  // Invoice operations
  createInvoice,
  getInvoicesByUserId,
  getInvoiceById,
  updateInvoiceStatus,
  deleteInvoice,
  getAllInvoices,
  // Activity logs
  logActivity,
  getAllLogs,
  getLogsByAction,
  // Analytics
  getInvoiceStats,
  getUserCount,
  // Connection
  testConnection
};
