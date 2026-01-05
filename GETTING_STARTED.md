# Getting Started with TSMS

Welcome! Your Trip & Seating Management System is ready. Follow these simple steps to get it running.

## 5-Minute Quick Start

### Step 1: Test Locally (Right Now!)

```bash
cd tsms
npm run dev
```

Open your browser to **http://localhost:5173**

You'll see the login page. The app is working! 🎉

### Step 2: Set Up Firebase (15 minutes)

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com/project/planyourtrip-ed010

2. **Enable Firestore**
   - Click "Firestore Database" → "Create Database"
   - Choose "Production mode" → Select location → Done

3. **Enable Storage**
   - Click "Storage" → "Get Started"
   - Use production rules → Done

4. **Enable Authentication**
   - Click "Authentication" → "Get Started"
   - Click "Email/Password" → Enable → Save

5. **Create Admin User**
   - In Authentication → Users → "Add User"
   - **Email**: `admin@tripsystem.com`
   - **Password**: `TripAdmin2026!`
   - Click "Add User"

   > 💡 These are test credentials. See [ADMIN_CREDENTIALS.md](ADMIN_CREDENTIALS.md) for details.
   > ⚠️ Change these before deploying to production!

### Step 3: Configure Email (10 minutes)

**Using Gmail:**

1. Enable 2-Factor Auth on your Google Account
2. Generate App Password:
   - Google Account → Security → 2-Step Verification
   - Scroll to "App passwords"
   - Create new → Name it "TSMS" → Copy password

3. Set Firebase config:
```bash
firebase login
firebase functions:config:set email.user="your-email@gmail.com"
firebase functions:config:set email.pass="paste-16-char-password"
firebase functions:config:set admin.email="admin@example.com"
```

### Step 4: Install Functions Dependencies

```bash
cd functions
npm install
cd ..
```

### Step 5: Deploy Everything (5 minutes)

```bash
# Deploy security rules
firebase deploy --only firestore:rules,storage

# Deploy Cloud Functions
firebase deploy --only functions

# Build and deploy website
npm run build
firebase deploy --only hosting
```

## That's It! 🚀

Your app is now live at: **https://planyourtrip-ed010.web.app**

## Test It Out

### Test as Admin
1. Go to your deployed URL
2. Click "Login"
3. Use the admin credentials you created
4. Create a trip
5. Copy the registration link

### Test as Participant
1. Open registration link in incognito window
2. Fill out the form
3. Select a seat
4. Sign the waiver
5. Submit
6. Check your email for confirmation!

## Common Issues

### "Permission Denied" in Firestore
**Solution**: Deploy rules
```bash
firebase deploy --only firestore:rules
```

### Email Not Sending
**Solution**: Check config
```bash
firebase functions:config:get
```

### Can't Login
**Solution**: Make sure you created an admin user in Firebase Console

## Need Help?

1. **Quick Commands**: See [QUICK_REFERENCE.md](QUICK_REFERENCE.md)
2. **Detailed Setup**: See [SETUP_GUIDE.md](SETUP_GUIDE.md)
3. **Deployment**: See [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)
4. **Project Info**: See [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)

## Useful Commands

```bash
# Start development
npm run dev

# View function logs
npm run functions:logs

# Deploy everything
npm run deploy

# Deploy just website
npm run deploy:hosting

# Deploy just functions
npm run deploy:functions
```

## What's Next?

After your first successful deployment:

1. **Customize the app**:
   - Change waiver text
   - Add your organization's logo
   - Modify email templates
   - Add more vehicle layouts

2. **Invite users**:
   - Share registration links
   - Train admins on the dashboard
   - Set up monitoring

3. **Monitor**:
   - Check Firebase Console regularly
   - Review function logs
   - Monitor email delivery

## Project Structure at a Glance

```
tsms/
├── src/                    # React application
│   ├── components/        # Reusable components
│   ├── pages/            # Page components
│   ├── utils/            # Helper functions
│   └── firebase.js       # Firebase config (YOUR CREDENTIALS)
├── functions/             # Cloud Functions
│   └── index.js          # PDF & Email automation
├── firebase.json         # Firebase configuration
├── firestore.rules       # Database security
└── storage.rules         # Storage security
```

## Your Firebase Project

- **Project ID**: planyourtrip-ed010
- **Console**: https://console.firebase.google.com/project/planyourtrip-ed010
- **Deployed App**: https://planyourtrip-ed010.web.app

## Support

Everything is documented! Check the docs folder:

- 📖 **README.md** - Overview and features
- 🚀 **GETTING_STARTED.md** - This file
- 🔧 **SETUP_GUIDE.md** - Detailed instructions
- ✅ **DEPLOYMENT_CHECKLIST.md** - Step-by-step deployment
- 📚 **QUICK_REFERENCE.md** - Commands and API
- 📋 **PROJECT_SUMMARY.md** - Complete project info

---

**Ready to start?** Run `npm run dev` and let's go! 🎊
