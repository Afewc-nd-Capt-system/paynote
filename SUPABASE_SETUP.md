# Supabase Setup Guide for Paynote

## Step 1: Create Supabase Account
1. Go to [https://supabase.com](https://supabase.com)
2. Sign up with your email or GitHub account
3. Verify your email

## Step 2: Create a New Project
1. Click "New Project"
2. Enter a project name (e.g., "paynote")
3. Set a strong database password (you'll need this)
4. Select a region closest to your users
5. Click "Create new project" and wait for it to initialize (~2 minutes)

## Step 3: Get Your Credentials
1. Go to Project Settings (bottom left gear icon)
2. Click "API" in the sidebar
3. Copy the following and add to your `.env` file:
   - **Project URL** → `SUPABASE_URL`
   - **anon key** (public) → `SUPABASE_KEY`

## Step 4: Create Database Tables
1. In Supabase dashboard, go to "SQL Editor"
2. Click "New Query"
3. Copy and paste the SQL script below
4. Click "Run"

```sql
-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_email VARCHAR(255) NOT NULL,
  customer VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  item VARCHAR(255) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'unpaid',
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create activity_logs table
CREATE TABLE IF NOT EXISTS activity_logs (
  id TEXT PRIMARY KEY,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  action VARCHAR(255) NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_invoices_user_id ON invoices(user_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_user_email ON invoices(user_email);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_activity_logs_action ON activity_logs(action);
```

## Step 5: Update Environment Variables
Add these to your `.env` file:

```
SUPABASE_URL=your_project_url_here
SUPABASE_KEY=your_anon_key_here
```

## Step 6: Enable Row Level Security (Optional but Recommended)
For enhanced security, you can enable RLS on your tables:

```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
```

## Step 7: Test Connection
After updating the backend code, run:
```bash
npm run dev
```

Check the console for connection confirmation message.

## Important Notes
- The `anon key` is safe to use in public code as it's meant for public access
- For sensitive operations, you may want to create additional API keys with specific permissions
- Supabase automatically handles backups and scaling
- No data loss on server restart anymore!
