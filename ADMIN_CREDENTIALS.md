# Admin Credentials Setup

## Test Admin Account

For development and testing, use these credentials:

### Admin Login Details

**Email**: `admin@tripsystem.com`
**Password**: `TripAdmin2026!`

---

## How to Create the Admin User

### Option 1: Firebase Console (Recommended)

1. Go to [Firebase Console](https://console.firebase.google.com/project/planyourtrip-ed010)
2. Click **Authentication** in the left menu
3. Click **Users** tab
4. Click **Add User** button
5. Enter:
   - **Email**: `admin@tripsystem.com`
   - **Password**: `TripAdmin2026!`
6. Click **Add User**

### Option 2: Using Firebase CLI

```bash
# This will be automated via Cloud Functions in production
# For now, use the Firebase Console method above
```

---

## Login to Your App

Once the admin user is created:

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open http://localhost:5173 (or whatever port shown)

3. You'll be redirected to `/login`

4. Enter:
   - **Email**: `admin@tripsystem.com`
   - **Password**: `TripAdmin2026!`

5. Click **Sign In**

6. You'll be redirected to the Admin Dashboard!

---

## Production Setup

### For Production, Create a Secure Admin Account:

1. Use a strong, unique password (20+ characters)
2. Use a real email address you have access to
3. Enable 2-Factor Authentication (in Firebase Console)
4. Never commit passwords to version control

### Recommended Production Password Format:
- Minimum 16 characters
- Mix of uppercase, lowercase, numbers, symbols
- Example generator: `openssl rand -base64 24`

---

## Multiple Admins

To add more admin users, simply create additional users in Firebase Authentication with the same method above. All authenticated users have admin access to the dashboard.

### Future Enhancement (Optional)

You can add role-based access by:
1. Adding a `role` field to user documents in Firestore
2. Checking roles in the app before allowing certain actions
3. Updating security rules to check roles

---

## Security Notes

⚠️ **Important Security Practices:**

1. **Change Default Password**: If you use the test credentials above, change them before deploying to production
2. **Use Strong Passwords**: Production passwords should be 20+ characters
3. **Enable 2FA**: Enable two-factor authentication in Firebase Console
4. **Limit Admin Access**: Only create admin accounts for trusted individuals
5. **Monitor Activity**: Regularly check Firebase Console logs for suspicious activity

---

## Forgot Password?

If you forget your admin password:

1. Go to Firebase Console > Authentication > Users
2. Find the user
3. Click the three dots menu (⋮)
4. Click "Reset password"
5. Follow the instructions

Or use the password reset feature on the login page (if implemented).

---

## Test Account Summary

Use this for immediate testing:

| Field | Value |
|-------|-------|
| Email | `admin@tripsystem.com` |
| Password | `TripAdmin2026!` |
| Access Level | Full Admin |
| Purpose | Development & Testing |

**⚠️ Remember to change these credentials before deploying to production!**
