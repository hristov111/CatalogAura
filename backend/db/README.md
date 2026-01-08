# Database Migrations

This directory contains SQL migration files for the CatalogAura database.

## Migration Files

### `schema.sql` (001)
Initial database schema with:
- `profiles` table - User accounts (guests and registered users)
- `chats` table - Conversation history
- RLS policies and triggers

### `002_personas_migration.sql`
Adds AI personas/models functionality:
- `personas` table - Stores AI character profiles (Elara, Seraphina, etc.)
- Supabase Storage bucket `persona-images` for profile pictures and gallery images
- RLS policies for public read access
- Indexes for performance

### `003_seed_elara.sql`
Seeds the database with Elara's complete personality profile including:
- Bio and extended bio
- Interests, passions, and values
- Testimonials and theme colors
- System prompt for AI chat behavior

### `004_seed_all_personas.sql`
Seeds all remaining AI personas (7 personas):
- Seraphina (Kyoto) - Zen & Mindfulness
- Isla (Sydney) - Adventure & Energy
- Lyra (Berlin) - Tech & Creativity
- Aria (Florence) - Culture & Sophistication
- Nova (New York) - Ambition & Wit
- Juniper (Portland) - Nature & Authenticity
- Sloane (London) - Power & Elegance

## How to Run Migrations

### Option 1: Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste each migration file in order
4. Click **Run** for each file

### Option 2: Supabase CLI
```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref YOUR_PROJECT_REF

# Run migrations
supabase db push
```

### Option 3: Node.js Script
```bash
cd backend
node runMigrations.js
```

## Storage Setup

After running migrations, the `persona-images` storage bucket will be created automatically.

### Folder Structure in Storage:
```
persona-images/
├── profiles/           # Main profile pictures
│   ├── elara.jpg
│   ├── seraphina.jpg
│   └── ...
└── galleries/          # Gallery images
    ├── elara/
    │   ├── 1.jpg
    │   ├── 2.jpg
    │   └── ...
    └── ...
```

### Upload Images via Supabase Dashboard:
1. Go to **Storage** in Supabase dashboard
2. Select `persona-images` bucket
3. Create folders: `profiles/` and `galleries/`
4. Upload images

### Upload Images via Code:
```javascript
const { data, error } = await supabase.storage
  .from('persona-images')
  .upload('profiles/elara.jpg', file, {
    contentType: 'image/jpeg',
    upsert: true
  });
```

## Notes

- All migrations use `ON CONFLICT` clauses to be idempotent (safe to run multiple times)
- The `personas` table is publicly readable but only writable via service role
- Storage bucket is public for read access (images are public URLs)
- Remember to update image URLs in the database after uploading to storage

