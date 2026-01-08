# Supabase Authentication Setup Guide

This guide will walk you through configuring Supabase authentication for the CatalogAura application.

## Prerequisites

- A Supabase account (sign up at https://supabase.com)
- A Supabase project created

## Step 1: Run Database Migration

1. Navigate to your Supabase project dashboard
2. Go to **SQL Editor**
3. Run the following migrations in order:
   - `backend/db/schema.sql` - Base schema
   - `backend/db/005_auth_system_migration.sql` - Auth system updates

Alternatively, use the Supabase CLI:
```bash
supabase db push
```

## Step 2: Enable Email Authentication

1. In your Supabase dashboard, go to **Authentication** → **Providers**
2. Enable **Email** provider
3. Configure the following settings:
   - **Enable email confirmations**: ON (recommended)
   - **Secure email change**: ON (recommended)
   - **Secure password change**: ON (recommended)

## Step 3: Configure Email Templates

1. Go to **Authentication** → **Email Templates**
2. Customize the following templates:
   - **Confirm signup**: Welcome email with verification link
   - **Magic Link**: Login link email (if using)
   - **Change Email Address**: Email change confirmation
   - **Reset Password**: Password reset instructions

### Example Password Reset Template:
```html
<h2>Reset Your Password</h2>
<p>Click the link below to reset your password:</p>
<p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>
<p>This link expires in 24 hours.</p>
<p>If you didn't request this, please ignore this email.</p>
```

## Step 4: Enable Google OAuth (Optional)

1. Go to **Authentication** → **Providers**
2. Find **Google** in the list and click to configure
3. Enable the provider
4. Follow Supabase's instructions to set up Google OAuth:
   - Create a Google Cloud Project
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Add authorized redirect URIs:
     ```
     https://<your-project-ref>.supabase.co/auth/v1/callback
     ```
5. Copy the Client ID and Client Secret to Supabase
6. Update frontend redirect URL in `auth.service.ts` if needed

## Step 5: Enable GitHub OAuth (Optional)

1. Go to **Authentication** → **Providers**
2. Find **GitHub** in the list and click to configure
3. Enable the provider
4. Create a GitHub OAuth App:
   - Go to GitHub Settings → Developer settings → OAuth Apps
   - Click "New OAuth App"
   - Set Authorization callback URL:
     ```
     https://<your-project-ref>.supabase.co/auth/v1/callback
     ```
5. Copy the Client ID and Client Secret to Supabase

## Step 6: Configure Site URL and Redirect URLs

1. Go to **Authentication** → **URL Configuration**
2. Set **Site URL**:
   ```
   http://localhost:4200 (development)
   https://yourdomain.com (production)
   ```
3. Add **Redirect URLs**:
   ```
   http://localhost:4200/**
   https://yourdomain.com/**
   ```

## Step 7: Update Environment Variables

### Backend (.env)
Create or update `/backend/.env`:
```env
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key

PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:4200

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=5
SESSION_EXPIRY_DAYS=30
```

### Frontend
Update `/src/environments/environment.ts`:
```typescript
export const environment = {
  production: false,
  supabaseUrl: 'https://your-project-ref.supabase.co',
  supabaseAnonKey: 'your-anon-key',
  apiUrl: 'http://localhost:3000/api'
};
```

Update `/src/environments/environment.prod.ts` for production.

## Step 8: Configure Row Level Security (RLS)

The migration script already sets up RLS policies, but verify them:

1. Go to **Database** → **Tables**
2. For each table (`profiles`, `sessions`, `audit_logs`, `chats`):
   - Ensure RLS is enabled
   - Verify policies are in place
   - Test policies work as expected

## Step 9: Test Authentication Flows

After configuration, test these flows:

### Email/Password Registration
1. Navigate to `/auth/register`
2. Fill in the registration form
3. Check email for verification link
4. Click verification link
5. Log in with credentials

### Password Reset
1. Navigate to `/auth/forgot-password`
2. Enter email address
3. Check email for reset link
4. Click link and set new password
5. Log in with new password

### Social Login (if configured)
1. Click "Sign in with Google" or "Sign in with GitHub"
2. Authorize the application
3. Verify redirect back to app
4. Check that user is logged in

## Step 10: Security Best Practices

1. **Never commit secrets**: Don't commit `.env` files with real credentials
2. **Use service role key carefully**: Only use it in backend, never expose to frontend
3. **Enable MFA**: Configure in Supabase dashboard for admin accounts
4. **Monitor auth logs**: Regularly check Authentication logs for suspicious activity
5. **Rate limiting**: Already configured in backend middleware
6. **HTTPS in production**: Always use HTTPS for production deployments

## Troubleshooting

### Email not sending
- Check SMTP settings in Supabase dashboard
- Verify email templates are configured
- Check spam folder
- Enable custom SMTP (recommended for production)

### OAuth redirect errors
- Verify redirect URLs match exactly
- Check OAuth app configuration in provider dashboard
- Ensure Site URL is correct in Supabase

### Session issues
- Clear browser cookies/localStorage
- Check RLS policies on sessions table
- Verify JWT secret is set correctly

### Database errors
- Run migrations in correct order
- Check for naming conflicts
- Verify RLS policies allow intended operations

## Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Google OAuth Setup](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [GitHub OAuth Setup](https://supabase.com/docs/guides/auth/social-login/auth-github)
- [Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates)

## Support

For issues specific to this implementation:
1. Check the console for errors
2. Review Supabase logs in the dashboard
3. Verify all environment variables are set
4. Ensure backend server is running

For Supabase-specific issues:
- Visit [Supabase Support](https://supabase.com/support)
- Check [GitHub Issues](https://github.com/supabase/supabase/issues)


