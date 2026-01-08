# Authentication System - Quick Start Guide

🚀 Get your authentication system up and running in minutes!

## Prerequisites Checklist

- [ ] Node.js and npm installed
- [ ] Supabase account and project created
- [ ] Angular CLI installed
- [ ] Git repository cloned

## Step-by-Step Setup

### 1. Install Dependencies (5 minutes)

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies (if not already installed)
cd ..
npm install
```

### 2. Database Setup (10 minutes)

**Option A: Using Supabase Dashboard (Recommended)**
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Create a new query and paste contents of `backend/db/005_auth_system_migration.sql`
4. Click **Run** to execute the migration

**Option B: Using Supabase CLI**
```bash
# Install Supabase CLI if you haven't
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Push database changes
supabase db push
```

### 3. Configure Supabase Authentication (5 minutes)

1. In Supabase Dashboard, go to **Authentication** → **Providers**
2. Enable **Email** provider
3. ✅ Turn on "Confirm email"
4. ✅ Turn on "Secure email change"
5. ✅ Turn on "Secure password change"
6. Click **Save**

### 4. Set Up Environment Variables (5 minutes)

**Backend Environment:**

Create `backend/.env`:
```env
# Get these from Supabase Dashboard → Settings → API
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
SUPABASE_ANON_KEY=your-anon-key-here

# Server Configuration
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:4200

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=5
SESSION_EXPIRY_DAYS=30
```

**Frontend Environment:**

Update `src/environments/environment.ts`:
```typescript
export const environment = {
  production: false,
  supabaseUrl: 'https://your-project-ref.supabase.co',
  supabaseAnonKey: 'your-anon-key-here',
  apiUrl: 'http://localhost:3000/api'
};
```

> 💡 **Tip:** Get your Supabase credentials from:  
> Dashboard → Settings → API

### 5. Start the Application (2 minutes)

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```

You should see:
```
🚀 Server is running on port 3000
📍 Environment: development
🔒 Security: Helmet enabled
⚡ Rate limiting: Active
```

**Terminal 2 - Frontend:**
```bash
# From project root
ng serve
```

Navigate to: `http://localhost:4200`

### 6. Verify Installation (3 minutes)

1. **Test Registration:**
   - Navigate to `/auth/register`
   - Create a test account
   - Check your email for verification link

2. **Test Login:**
   - Navigate to `/auth/login`
   - Log in with test account
   - Verify redirect to home page

3. **Test Profile:**
   - Navigate to `/user/profile`
   - Check that your information displays

4. **Test Settings:**
   - Navigate to `/user/settings`
   - Try updating your profile
   - Check the different tabs work

### 7. Configure Email Templates (Optional, 10 minutes)

For a better user experience:

1. Go to **Authentication** → **Email Templates**
2. Customize:
   - **Confirm signup** template
   - **Reset password** template
   - **Change email** template

Example reset password template:
```html
<h2>Reset Your Password</h2>
<p>Hi there,</p>
<p>Click the button below to reset your password:</p>
<p><a href="{{ .ConfirmationURL }}" style="background-color: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Reset Password</a></p>
<p>This link expires in 24 hours.</p>
<p>If you didn't request this, please ignore this email.</p>
<p>Thanks,<br>The CatalogAura Team</p>
```

### 8. Optional: Configure Social Login (20 minutes)

<details>
<summary><b>Google OAuth Setup</b></summary>

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI:
   ```
   https://your-project-ref.supabase.co/auth/v1/callback
   ```
6. Copy Client ID and Client Secret
7. In Supabase Dashboard → Authentication → Providers:
   - Enable Google
   - Paste credentials
   - Save

</details>

<details>
<summary><b>GitHub OAuth Setup</b></summary>

1. Go to GitHub Settings → Developer settings → OAuth Apps
2. Click "New OAuth App"
3. Fill in:
   - Application name: "CatalogAura"
   - Homepage URL: `http://localhost:4200`
   - Authorization callback URL:
     ```
     https://your-project-ref.supabase.co/auth/v1/callback
     ```
4. Copy Client ID and Client Secret
5. In Supabase Dashboard → Authentication → Providers:
   - Enable GitHub
   - Paste credentials
   - Save

</details>

## Troubleshooting

### Backend won't start
- ✅ Check `.env` file exists and has correct values
- ✅ Verify `node_modules` installed (`npm install`)
- ✅ Check port 3000 is not already in use

### Frontend won't start  
- ✅ Run `npm install` from project root
- ✅ Check Angular CLI is installed (`ng version`)
- ✅ Clear node_modules and reinstall if needed

### Can't register/login
- ✅ Verify backend is running
- ✅ Check browser console for errors
- ✅ Verify Supabase credentials are correct
- ✅ Check email provider is enabled in Supabase

### Emails not sending
- ✅ Check spam folder
- ✅ Verify email provider enabled in Supabase
- ✅ For production, set up custom SMTP

### Database errors
- ✅ Ensure migration ran successfully
- ✅ Check RLS policies are enabled
- ✅ Verify Supabase service role key is correct

## Testing Your Setup

Run through this quick test:

```bash
# 1. Register a new account
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#",
    "fullName": "Test User"
  }'

# 2. Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#"
  }'

# You should receive a session token
```

## What's Next?

### Development
- [ ] Customize UI colors and branding
- [ ] Add avatar upload functionality
- [ ] Implement additional profile fields
- [ ] Add two-factor authentication

### Testing
- [ ] Follow [`AUTH_TESTING_GUIDE.md`](AUTH_TESTING_GUIDE.md)
- [ ] Test all authentication flows
- [ ] Verify security features
- [ ] Test on multiple browsers/devices

### Production Deployment
- [ ] Set up custom domain
- [ ] Configure production environment variables
- [ ] Set up custom SMTP for emails
- [ ] Enable HTTPS
- [ ] Configure production Supabase project
- [ ] Set up monitoring and logging
- [ ] Perform security audit

## Useful Commands

```bash
# Backend
cd backend
npm start              # Start development server
npm run dev            # Start with nodemon (auto-reload)

# Frontend  
ng serve               # Start development server
ng build               # Build for production
ng test                # Run unit tests

# Database
supabase db reset      # Reset database
supabase db push       # Push migrations
supabase db pull       # Pull schema changes
```

## Documentation Reference

- 📖 [Full Implementation Summary](AUTH_IMPLEMENTATION_SUMMARY.md)
- 🔧 [Supabase Configuration Guide](SUPABASE_AUTH_SETUP.md)
- ✅ [Testing Guide](AUTH_TESTING_GUIDE.md)

## Getting Help

1. **Check the logs:**
   - Browser DevTools Console (F12)
   - Backend terminal output
   - Supabase Dashboard → Logs

2. **Common Issues:**
   - See Troubleshooting section above
   - Check [AUTH_IMPLEMENTATION_SUMMARY.md](AUTH_IMPLEMENTATION_SUMMARY.md)

3. **Still stuck?**
   - Review Supabase documentation
   - Check GitHub issues
   - Ask in community forums

## Success Checklist

Once you complete these, you're good to go! ✅

- [ ] Backend starts without errors
- [ ] Frontend loads successfully
- [ ] Can register new account
- [ ] Receive verification email
- [ ] Can login with credentials
- [ ] Can view profile page
- [ ] Can update profile in settings
- [ ] Can change password
- [ ] Sessions are tracked
- [ ] Audit logs are created
- [ ] Rate limiting works
- [ ] Can logout successfully

---

🎉 **Congratulations!** Your authentication system is now running!

Time to completion: ~30-40 minutes  
Last updated: January 4, 2026


