# Environment Sync Setup ✅

Your Supabase credentials from `.env` are now automatically synced to Angular!

## ✅ What Just Happened

I created a script that reads your `.env` file and automatically updates the Angular environment files with your Supabase credentials.

Your credentials:
- **URL:** `https://wgigbvraeojprbndnrmt.supabase.co`
- **Anon Key:** ✅ Synced automatically

---

## 🔄 Automatic Sync

The sync happens **automatically** when you:

```bash
npm run dev        # Syncs before starting dev server
npm run build      # Syncs before building
npm run sync-env   # Manual sync anytime
```

### How it works:

1. Script reads `SUPABASE_URL` and `SUPABASE_ANON_KEY` from `.env`
2. Updates `src/environments/environment.ts` (development)
3. Updates `src/environments/environment.prod.ts` (production)

---

## 📁 File Structure

```
CatalogAura/
├── .env                              ← Your credentials (Git ignored)
│   ├── SUPABASE_URL
│   └── SUPABASE_ANON_KEY
│
├── scripts/
│   └── sync-env.cjs                  ← Auto-sync script
│
└── src/environments/
    ├── environment.ts                ← Auto-updated from .env
    └── environment.prod.ts           ← Auto-updated from .env
```

---

## 🔐 Security Notes

- `.env` file is **gitignored** (never committed)
- Environment files **are committed** but only contain the public anon key (safe)
- Service role key stays in `.env` (backend only, never exposed to frontend)

---

## 🚀 You're All Set!

Your app will now:
- ✅ Automatically use Supabase credentials from `.env`
- ✅ Fetch personas from the database
- ✅ Work on both web and mobile (Capacitor)
- ✅ Stay synced whenever you build or run dev

Just start your app:

```bash
npm run dev
```

---

## 🛠️ Manual Sync (if needed)

If you update `.env` while the app is running:

```bash
npm run sync-env
```

Then restart your dev server.

---

## ❓ Troubleshooting

### Script fails with "not found in .env"
Make sure your `.env` file contains:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
```

### Changes not reflecting
1. Stop the dev server
2. Run `npm run sync-env`
3. Start dev server again: `npm run dev`

---

## 🎯 Next Steps

1. **Run migrations** in Supabase Dashboard (see `backend/db/README.md`)
2. **Start the app:** `npm run dev`
3. **Enjoy!** Your personas will load from the database

All done! 🎉

