# Complete Setup Guide for TSMS

## Quick Start Checklist

- [ ] Node.js v18+ installed
- [ ] Firebase CLI installed
- [ ] Firebase project created
- [ ] Admin user created in Firebase
- [ ] Email credentials configured
- [ ] Firestore rules deployed
- [ ] Cloud Functions deployed
- [ ] Application tested locally

## Step-by-Step Setup

### Step 1: Install Firebase CLI

```bash
npm install -g firebase-tools
```

### Step 2: Login to Firebase

```bash
firebase login
```

### Step 3: Initialize Firebase (if needed)

```bash
firebase init
```

Select:
- Firestore
- Functions
- Hosting
- Storage

Use existing project: `planyourtrip-ed010`

### Step 4: Install Dependencies

```bash
# Root dependencies
npm install

# Functions dependencies
cd functions
npm install
cd ..
```

### Step 5: Enable Firebase Services

1. **Firestore Database**:
   - Go to Firebase Console
   - Navigate to Firestore Database
   - Click "Create Database"
   - Choose "Start in production mode"
   - Select a location

2. **Firebase Storage**:
   - Go to Firebase Console
   - Navigate to Storage
   - Click "Get Started"
   - Start in production mode

3. **Firebase Authentication**:
   - Go to Firebase Console
   - Navigate to Authentication
   - Click "Get Started"
   - Enable "Email/Password" sign-in method

### Step 6: Create Admin User

1. Go to Firebase Console > Authentication > Users
2. Click "Add User"
3. Enter:
   - Email: your-admin@email.com
   - Password: [create a secure password]
4. Save the user ID

### Step 7: Configure Email Service

#### Option A: Using Gmail

1. Enable 2-Factor Authentication on your Google Account
2. Generate App Password:
   - Google Account > Security > 2-Step Verification
   - Scroll down to "App passwords"
   - Select app: "Mail"
   - Select device: "Other (Custom name)"
   - Name it "TSMS"
   - Copy the 16-character password

3. Set Firebase config:
```bash
firebase functions:config:set email.user="your-email@gmail.com"
firebase functions:config:set email.pass="your-16-char-app-password"
firebase functions:config:set admin.email="admin@example.com"
```

#### Option B: Using Other Email Services

Edit `functions/index.js` and modify the transporter:

```javascript
const transporter = nodemailer.createTransport({
  host: 'smtp.example.com',
  port: 587,
  secure: false,
  auth: {
    user: functions.config().email?.user,
    pass: functions.config().email?.pass
  }
});
```

### Step 8: Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

### Step 9: Deploy Storage Rules

```bash
firebase deploy --only storage
```

### Step 10: Deploy Cloud Functions

```bash
firebase deploy --only functions
```

This may take several minutes. You'll see output like:
```
✔  functions[onRegistrationCreated(us-central1)] Successful create operation.
✔  functions[resendConfirmationEmail(us-central1)] Successful create operation.
```

### Step 11: Test Locally

```bash
npm run dev
```

Open browser to `http://localhost:5173`

### Step 12: Test the Application

1. **Test Admin Login**:
   - Go to `http://localhost:5173/login`
   - Login with admin credentials

2. **Test Trip Creation**:
   - Select a date on the calendar
   - Click "Create Trip"
   - Fill in trip details
   - Click "Create Trip"

3. **Test Registration**:
   - Copy the registration link for a trip
   - Open in incognito/private window
   - Fill out the registration form
   - Sign the waiver
   - Submit

4. **Verify Emails**:
   - Check participant email for confirmation
   - Check admin email for notification

5. **Verify PDF**:
   - Check Firebase Storage for the PDF waiver

### Step 13: Deploy to Production

```bash
# Build the application
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting
```

Your application will be available at:
`https://planyourtrip-ed010.web.app`

## Environment Variables (Optional)

For enhanced security, you can use environment variables:

Create `.env` file:
```
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

Update `src/firebase.js`:
```javascript
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  // ... etc
};
```

## Testing Checklist

### Admin Dashboard
- [ ] Admin can login
- [ ] Admin can create trips
- [ ] Admin can view trips by date
- [ ] Admin can copy registration links
- [ ] Admin can view live seating map
- [ ] Admin can see participant list
- [ ] Admin can logout

### Public Registration
- [ ] Registration form loads
- [ ] All fields validate correctly
- [ ] Seat selection works
- [ ] Signature pad works
- [ ] Clear signature works
- [ ] Form submission works
- [ ] Success message shows
- [ ] Duplicate seat registration prevented

### Cloud Functions
- [ ] PDF generates correctly
- [ ] Participant receives email
- [ ] Admin receives notification
- [ ] PDF attached to email
- [ ] PDF stored in Firebase Storage
- [ ] Registration updated with PDF URL

### Real-time Updates
- [ ] Seating map updates when someone registers
- [ ] Participant list updates in real-time
- [ ] Multiple admins see same data

## Troubleshooting

### Issue: Functions not deploying

**Solution**: Make sure you're in the root directory and run:
```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

### Issue: Email not sending

**Possible causes**:
1. App password incorrect
2. 2FA not enabled
3. Gmail blocking sign-in

**Solution**: Check Firebase Functions logs:
```bash
firebase functions:log
```

### Issue: PDF not generating

**Solution**: Check if pdfkit is installed in functions:
```bash
cd functions
npm install pdfkit
cd ..
firebase deploy --only functions
```

### Issue: Permission denied in Firestore

**Solution**: Deploy rules:
```bash
firebase deploy --only firestore:rules
```

### Issue: Storage upload fails

**Solution**: Deploy storage rules:
```bash
firebase deploy --only storage
```

## Next Steps

1. Customize the email templates
2. Add your organization's branding
3. Customize the waiver text
4. Add additional vehicle layouts
5. Set up custom domain
6. Enable Google Analytics
7. Set up monitoring and alerts

## Support

For issues or questions:
- Check Firebase Console for error logs
- Review Functions logs: `firebase functions:log`
- Check browser console for frontend errors
