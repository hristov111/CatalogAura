# Supabase Setup Guide

Your app is now configured to fetch AI personas from Supabase! Follow these steps to complete the setup.

## 📋 Prerequisites

1. A Supabase account (free tier works great)
2. Database migrations run (see `backend/db/README.md`)

---

## 🔧 Step 1: Get Your Supabase Credentials

1. Go to https://app.supabase.com
2. Select your project (or create a new one)
3. Go to **Settings** → **API**
4. Copy these two values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public key** (long string starting with `eyJ...`)

---

## 🔑 Step 2: Update Environment Files

### Frontend Configuration

Edit both environment files and replace the placeholder values:

**`src/environments/environment.ts`** (development):
```typescript
export const environment = {
  production: false,
  supabase: {
    url: 'https://YOUR-PROJECT.supabase.co',  // ← Replace this
    anonKey: 'YOUR-ANON-KEY-HERE'              // ← Replace this
  }
};
```

**`src/environments/environment.prod.ts`** (production):
```typescript
export const environment = {
  production: true,
  supabase: {
    url: 'https://YOUR-PROJECT.supabase.co',  // ← Replace this
    anonKey: 'YOUR-ANON-KEY-HERE'              // ← Replace this
  }
};
```

### Backend Configuration

The backend already has Supabase configured in `backend/.env`. Make sure it has:

```env
SUPABASE_URL=https://YOUR-PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## 🗄️ Step 3: Run Database Migrations

### Option A: Supabase Dashboard (Easiest)

1. Go to your Supabase project dashboard
2. Click **SQL Editor** in the sidebar
3. Run these files in order:
   - Copy `backend/db/002_personas_migration.sql` → Paste → Run
   - Copy `backend/db/003_seed_elara.sql` → Paste → Run

### Option B: Node.js Script

```bash
cd backend
node runMigrations.js
```

---

## 📸 Step 4: Upload Images (Optional)

After running migrations, you'll have a `persona-images` storage bucket.

### Via Supabase Dashboard:
1. Go to **Storage** → `persona-images`
2. Create folders: `profiles/` and `galleries/`
3. Upload your images
4. Update the `image_url` and `gallery` fields in the `personas` table with the new URLs

### Get Public URLs:
```javascript
const { data } = supabase.storage
  .from('persona-images')
  .getPublicUrl('profiles/elara.jpg');

console.log(data.publicUrl); // Use this URL in your database
```

---

## ✅ Step 5: Test the Integration

1. Start your Angular app:
   ```bash
   npm run dev
   ```

2. Open http://localhost:3000

3. You should see:
   - Loading spinner while fetching
   - Personas loaded from Supabase database
   - If database is empty or fails, it falls back to mock data

---

## 🔍 Troubleshooting

### "Loading personas..." stuck forever
- Check browser console for errors
- Verify your Supabase URL and anon key are correct
- Make sure migrations were run successfully

### "Connection Error" message
- Check if Supabase project is active
- Verify RLS policies allow public read access to `personas` table
- Check browser network tab for failed requests

### No personas showing
- Run the seed script: `backend/db/003_seed_elara.sql`
- Check Supabase dashboard → Table Editor → `personas` table
- Should have at least Elara's data

### Images not loading
- Make sure `persona-images` storage bucket exists
- Verify bucket is set to **public**
- Check storage policies allow public read access

---

## 🎯 What's Working Now

✅ **Frontend** fetches personas from Supabase `personas` table  
✅ **Loading states** with spinner and error handling  
✅ **Fallback** to mock data if database fails  
✅ **Mobile ready** - Works with Capacitor apps  
✅ **Real-time ready** - Can add Supabase subscriptions later  

---

## 🚀 Next Steps

- Add more personas to the database
- Upload custom images to Supabase Storage
- Integrate AI chat with persona `system_prompt` field
- Add admin panel to manage personas
- Set up real-time updates with Supabase subscriptions

---

## 📚 Useful Commands

```bash
# Development
npm run dev

# Build for production
npm run build

# Build and sync to mobile
npm run build:mobile

# Refresh profiles from database
# (Call profileService.refreshProfiles() in your code)
```

---

Need help? Check the Supabase docs: https://supabase.com/docs

