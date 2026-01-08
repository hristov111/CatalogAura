# 🚀 Run All Database Migrations

Quick guide to populate your database with all AI personas.

## 📋 Files to Run (In Order)

Run these SQL files in your Supabase Dashboard → **SQL Editor**:

### 1. Create Tables
```sql
-- File: 002_personas_migration.sql
-- Creates the personas table and storage bucket
```

### 2. Seed Elara (First Persona)
```sql
-- File: 003_seed_elara.sql
-- Adds Elara to the database
```

### 3. Seed All Other Personas
```sql
-- File: 004_seed_all_personas.sql
-- Adds all 7 remaining personas:
--   - Seraphina (Kyoto)
--   - Isla (Sydney)
--   - Lyra (Berlin)
--   - Aria (Florence)
--   - Nova (New York)
--   - Juniper (Portland)
--   - Sloane (London)
```

---

## 🎯 Quick Setup Steps

### Step 1: Open Supabase Dashboard
1. Go to https://app.supabase.com
2. Select your project
3. Click **SQL Editor** in the sidebar

### Step 2: Run Migration Files

#### First, run the table creation:
1. Open `backend/db/002_personas_migration.sql`
2. Copy all contents
3. Paste in SQL Editor
4. Click **Run** ▶️

#### Then, run the seed files:
1. Open `backend/db/003_seed_elara.sql`
2. Copy all contents
3. Paste in SQL Editor
4. Click **Run** ▶️

5. Open `backend/db/004_seed_all_personas.sql`
6. Copy all contents
7. Paste in SQL Editor
8. Click **Run** ▶️

### Step 3: Verify Data
1. Go to **Table Editor** in Supabase
2. Select `personas` table
3. You should see **8 rows** (all personas)

---

## ✅ What You Get

After running all migrations, your database will have:

| ID | Name | City | Theme Color |
|----|------|------|-------------|
| 1 | Elara | Paris | 🟠 Orange `#f59e0b` |
| 2 | Seraphina | Kyoto | 🔵 Cyan `#22d3ee` |
| 3 | Isla | Sydney | 🔴 Pink `#fb7185` |
| 4 | Lyra | Berlin | 🟣 Purple `#a78bfa` |
| 5 | Aria | Florence | ❤️ Rose `#fca5a5` |
| 6 | Nova | New York | 💙 Blue `#93c5fd` |
| 7 | Juniper | Portland | 🟢 Green `#4ade80` |
| 8 | Sloane | London | ⚪ Gray `#e5e7eb` |

Each persona includes:
- ✅ Full bio and extended bio
- ✅ Interests, passions, and values
- ✅ Testimonials and special offers
- ✅ Theme colors and styling
- ✅ AI system prompt for chat personality

---

## 🔄 Updating Existing Data

All seed scripts use `ON CONFLICT (name) DO UPDATE` which means:
- ✅ Safe to run multiple times
- ✅ Will update existing personas if they exist
- ✅ Won't create duplicates

---

## 🎨 Customizing Personas

After seeding, you can customize any persona in Supabase Dashboard:

1. Go to **Table Editor** → `personas`
2. Click on any persona row
3. Edit any field (bio, theme colors, etc.)
4. Click **Save**
5. Refresh your app to see changes ✨

---

## 🐛 Troubleshooting

### Error: "relation personas does not exist"
**Solution:** Run `002_personas_migration.sql` first

### Error: "duplicate key value"
**Solution:** This is fine! The script will update the existing persona

### No personas showing in app
**Solution:** Check Supabase Table Editor to verify data was inserted

---

## 🚀 Start Your App

After running migrations:

```bash
npm run dev
```

You should see all 8 personas on the homepage! 🎉

---

## 📝 Quick Command Summary

```bash
# 1. Make sure .env is synced
npm run sync-env

# 2. Run migrations in Supabase Dashboard (copy/paste SQL files)

# 3. Start app
npm run dev

# 4. Enjoy! 🎉
```

---

All done! Your database is now fully populated with all AI personas. 🌟








