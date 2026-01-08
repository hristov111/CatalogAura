# Authentication System Testing Guide

This guide outlines all authentication flows and security features that should be tested for the CatalogAura application.

## Prerequisites

Before testing:
1. ✅ Database migrations have been run
2. ✅ Supabase authentication is configured
3. ✅ Backend server is running (`npm start` in `/backend`)
4. ✅ Frontend dev server is running (`ng serve` in root)
5. ✅ Environment variables are set correctly

## Test Categories

## 1. Registration Flow

### Test Case 1.1: Successful Registration
**Steps:**
1. Navigate to `/auth/register`
2. Fill in all fields with valid data:
   - Full Name: "Test User"
   - Email: "test@example.com"
   - Password: "Test123!@#"
   - Confirm Password: "Test123!@#"
   - Check "I agree to terms"
3. Click "Create Account"

**Expected Result:**
- ✅ Success message appears
- ✅ Email verification sent
- ✅ User redirected to login after 3 seconds
- ✅ Audit log entry created for registration
- ✅ Profile record created in database

### Test Case 1.2: Password Strength Validation
**Steps:**
1. Navigate to `/auth/register`
2. Try passwords of varying strength:
   - "12345678" (weak)
   - "Password1" (fair)
   - "Password1!" (good)
   - "P@ssw0rd123!" (strong)

**Expected Result:**
- ✅ Password strength meter updates in real-time
- ✅ Weak passwords show red indicator
- ✅ Strong passwords show green indicator
- ✅ Submit disabled for weak passwords

### Test Case 1.3: Validation Errors
**Steps:**
Test each validation rule:
- Empty email field
- Invalid email format
- Password too short (< 8 chars)
- Passwords don't match
- Terms not accepted

**Expected Result:**
- ✅ Appropriate error messages displayed
- ✅ Submit button disabled or shows error
- ✅ Fields highlighted with validation state

### Test Case 1.4: Social Registration (Google)
**Steps:**
1. Click "Sign up with Google"
2. Complete Google OAuth flow

**Expected Result:**
- ✅ Redirect to Google OAuth
- ✅ After authorization, redirect back to app
- ✅ User logged in automatically
- ✅ Profile created with Google data

### Test Case 1.5: Social Registration (GitHub)
**Steps:**
1. Click "Sign up with GitHub"
2. Complete GitHub OAuth flow

**Expected Result:**
- ✅ Redirect to GitHub OAuth
- ✅ After authorization, redirect back to app
- ✅ User logged in automatically
- ✅ Profile created with GitHub data

## 2. Login Flow

### Test Case 2.1: Successful Login
**Steps:**
1. Navigate to `/auth/login`
2. Enter valid credentials
3. Click "Sign In"

**Expected Result:**
- ✅ User successfully logged in
- ✅ Redirected to home page (or returnUrl if set)
- ✅ Auth state updated
- ✅ Session created in database
- ✅ Audit log entry for successful login

### Test Case 2.2: Failed Login
**Steps:**
1. Navigate to `/auth/login`
2. Enter incorrect password
3. Click "Sign In"

**Expected Result:**
- ✅ Error message: "Invalid email or password"
- ✅ User not logged in
- ✅ Audit log entry for failed login attempt
- ✅ Rate limiting applies after multiple attempts

### Test Case 2.3: Rate Limiting
**Steps:**
1. Navigate to `/auth/login`
2. Attempt to login with wrong password 6 times

**Expected Result:**
- ✅ After 5 attempts, rate limit kicks in
- ✅ Error message: "Too many attempts..."
- ✅ User must wait 15 minutes before trying again
- ✅ Rate limit tracked by IP address

### Test Case 2.4: Social Login (Google)
**Steps:**
1. Click "Sign in with Google"
2. Complete OAuth flow

**Expected Result:**
- ✅ Successfully logged in
- ✅ Redirected back to app
- ✅ Session created

### Test Case 2.5: Social Login (GitHub)
**Steps:**
1. Click "Sign in with GitHub"
2. Complete OAuth flow

**Expected Result:**
- ✅ Successfully logged in
- ✅ Redirected back to app
- ✅ Session created

### Test Case 2.6: Return URL Preservation
**Steps:**
1. Navigate to `/user/settings` (protected route) without being logged in
2. Get redirected to `/auth/login?returnUrl=/user/settings`
3. Log in successfully

**Expected Result:**
- ✅ After login, redirected to `/user/settings`
- ✅ Original destination preserved

## 3. Password Reset Flow

### Test Case 3.1: Request Password Reset
**Steps:**
1. Navigate to `/auth/forgot-password`
2. Enter registered email address
3. Click "Send Reset Link"

**Expected Result:**
- ✅ Success message displayed (even if email doesn't exist)
- ✅ Email sent with reset link (if account exists)
- ✅ Audit log entry created
- ✅ Rate limiting applies (3 requests per hour)

### Test Case 3.2: Reset Password with Token
**Steps:**
1. Click reset link from email
2. Redirected to `/auth/reset-password` with token
3. Enter new password
4. Confirm new password
5. Click "Reset Password"

**Expected Result:**
- ✅ Password successfully updated
- ✅ Success message displayed
- ✅ Redirected to login page
- ✅ Can login with new password
- ✅ Old password no longer works
- ✅ Audit log entry created

### Test Case 3.3: Invalid/Expired Token
**Steps:**
1. Navigate to `/auth/reset-password` with invalid token
2. Try to reset password

**Expected Result:**
- ✅ Error message: "Invalid or expired reset token"
- ✅ Password not changed
- ✅ User prompted to request new reset link

## 4. Profile Management

### Test Case 4.1: View Profile
**Steps:**
1. Log in
2. Navigate to `/user/profile`

**Expected Result:**
- ✅ User information displayed (name, email, avatar)
- ✅ Stats displayed (messages, sessions, account age)
- ✅ Email verification status shown
- ✅ Member since and last login dates shown

### Test Case 4.2: Update Profile
**Steps:**
1. Navigate to `/user/settings`
2. Go to "Profile" tab
3. Update name, bio, avatar URL
4. Click "Save Changes"

**Expected Result:**
- ✅ Success message displayed
- ✅ Profile updated in database
- ✅ Changes reflected immediately
- ✅ Audit log entry created

### Test Case 4.3: Change Password (Settings)
**Steps:**
1. Navigate to `/user/settings`
2. Go to "Security" tab
3. Enter current password
4. Enter new password (with confirmation)
5. Click "Update Password"

**Expected Result:**
- ✅ Password successfully updated
- ✅ Success message displayed
- ✅ Can login with new password
- ✅ Audit log entry created
- ✅ All sessions remain active

## 5. Session Management

### Test Case 5.1: View Active Sessions
**Steps:**
1. Log in from multiple devices/browsers
2. Navigate to `/user/settings` → "Security" tab
3. View active sessions list

**Expected Result:**
- ✅ All active sessions listed
- ✅ Device info shown
- ✅ IP addresses displayed
- ✅ Last activity timestamps shown

### Test Case 5.2: Revoke Single Session
**Steps:**
1. View active sessions
2. Click "Revoke" on a specific session
3. Confirm action

**Expected Result:**
- ✅ Session removed from list
- ✅ That device/browser is logged out
- ✅ Current session remains active
- ✅ Audit log entry created

### Test Case 5.3: Logout All Devices
**Steps:**
1. Have multiple active sessions
2. Click "Logout All Devices"
3. Confirm action

**Expected Result:**
- ✅ All sessions terminated
- ✅ User logged out from current device
- ✅ Redirected to login page
- ✅ All other devices also logged out
- ✅ Audit log entry created

### Test Case 5.4: Session Auto-Update
**Steps:**
1. Log in
2. Navigate through the app
3. Check sessions table in database

**Expected Result:**
- ✅ Session `last_activity` updates on API calls
- ✅ Session tracked by device info
- ✅ IP address recorded

## 6. Audit Logging

### Test Case 6.1: View Audit Logs
**Steps:**
1. Log in
2. Navigate to `/user/settings` → "Activity" tab

**Expected Result:**
- ✅ List of recent security events displayed
- ✅ Events sorted by date (newest first)
- ✅ Each event shows: type, timestamp, IP, user agent
- ✅ Icons indicate event type

### Test Case 6.2: Audit Log Entries Created
**Verify logs are created for:**
- ✅ Registration
- ✅ Successful login
- ✅ Failed login
- ✅ Logout
- ✅ Logout all devices
- ✅ Password change
- ✅ Password reset request
- ✅ Password reset complete
- ✅ Profile update
- ✅ Session revocation

### Test Case 6.3: Audit Log Data Accuracy
**Steps:**
1. Perform various actions (login, profile update, etc.)
2. Check audit logs

**Expected Result:**
- ✅ Correct IP address logged
- ✅ User agent captured
- ✅ Timestamps accurate
- ✅ Metadata includes relevant details

## 7. Security Features

### Test Case 7.1: Auth Guard Protection
**Steps:**
1. Log out
2. Try to navigate to `/user/profile`
3. Try to navigate to `/user/settings`

**Expected Result:**
- ✅ Redirected to `/auth/login`
- ✅ Return URL preserved
- ✅ Cannot access protected routes

### Test Case 7.2: Guest Guard (Redirect Logged-in Users)
**Steps:**
1. Log in
2. Try to navigate to `/auth/login`
3. Try to navigate to `/auth/register`

**Expected Result:**
- ✅ Redirected to home page
- ✅ Cannot access auth pages when logged in

### Test Case 7.3: Input Sanitization
**Steps:**
1. Try to enter HTML/script tags in form fields
2. Submit forms with special characters

**Expected Result:**
- ✅ HTML tags stripped or encoded
- ✅ No XSS vulnerabilities
- ✅ Special characters handled safely

### Test Case 7.4: API Rate Limiting
**Steps:**
1. Make rapid API requests to:
   - `/api/auth/login` (5/15min limit)
   - `/api/auth/register` (3/hour limit)
   - `/api/auth/forgot-password` (3/hour limit)

**Expected Result:**
- ✅ Rate limits enforced
- ✅ Appropriate error messages
- ✅ HTTP 429 (Too Many Requests) returned
- ✅ Rate limit headers included

### Test Case 7.5: Token Validation
**Steps:**
1. Log in and get auth token
2. Modify token
3. Try to access protected API endpoints

**Expected Result:**
- ✅ Invalid token rejected
- ✅ HTTP 401 (Unauthorized) returned
- ✅ User not granted access

### Test Case 7.6: Email Verification Status
**Steps:**
1. Register new account
2. Check email verification status
3. Try to access certain features (if applicable)

**Expected Result:**
- ✅ Unverified status shown in UI
- ✅ Verification badge/indicator displayed
- ✅ Reminder to verify email (if applicable)

## 8. Edge Cases & Error Handling

### Test Case 8.1: Network Errors
**Steps:**
1. Disconnect network
2. Try to login/register

**Expected Result:**
- ✅ Appropriate error message
- ✅ User-friendly feedback
- ✅ App doesn't crash

### Test Case 8.2: Server Errors
**Steps:**
1. Stop backend server
2. Try to perform auth actions

**Expected Result:**
- ✅ Error message displayed
- ✅ Graceful degradation
- ✅ App remains functional

### Test Case 8.3: Expired Session
**Steps:**
1. Log in
2. Wait for session to expire (or manually expire)
3. Try to access protected routes

**Expected Result:**
- ✅ Session detected as expired
- ✅ User redirected to login
- ✅ Appropriate message shown

### Test Case 8.4: Concurrent Login Attempts
**Steps:**
1. Open multiple browser tabs
2. Login in one tab
3. Check other tabs

**Expected Result:**
- ✅ Auth state syncs across tabs
- ✅ All tabs reflect logged-in state
- ✅ No conflicts or errors

## 9. Browser Compatibility

Test in multiple browsers:
- ✅ Chrome/Chromium
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## 10. Responsive Design

Test all auth pages on:
- ✅ Desktop (1920x1080)
- ✅ Laptop (1366x768)
- ✅ Tablet (768x1024)
- ✅ Mobile (375x667)

## Test Results Template

Use this template to track your test results:

```
| Test Case | Status | Notes | Tested By | Date |
|-----------|--------|-------|-----------|------|
| 1.1 Successful Registration | ✅ PASS | | | |
| 1.2 Password Strength | ✅ PASS | | | |
| ... | | | | |
```

## Automated Testing (Future Enhancement)

For production deployment, consider implementing:
- Unit tests for services and components
- Integration tests for API endpoints
- E2E tests for critical user flows
- Performance tests for rate limiting
- Security penetration testing

## Reporting Issues

When reporting issues, include:
1. Test case number
2. Steps to reproduce
3. Expected vs actual behavior
4. Screenshots/videos
5. Browser/device info
6. Console errors
7. Network tab data

## Sign-off

Once all tests pass:
- [ ] All critical flows tested and working
- [ ] Security features validated
- [ ] Rate limiting functional
- [ ] Audit logging operational
- [ ] No major bugs identified
- [ ] Documentation updated
- [ ] Ready for deployment

**Tester Signature:** ________________  
**Date:** ________________


