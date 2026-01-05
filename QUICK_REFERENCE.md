# TSMS Quick Reference Guide

## Common Commands

### Development
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Deployment
```bash
# Deploy everything
npm run deploy

# Deploy only hosting
npm run deploy:hosting

# Deploy only functions
npm run deploy:functions

# Deploy only rules
npm run deploy:rules
```

### Firebase Functions
```bash
# Install functions dependencies
npm run functions:install

# View function logs
npm run functions:logs

# View specific function logs
firebase functions:log --only onRegistrationCreated
```

### Firebase Configuration
```bash
# View current config
firebase functions:config:get

# Set email config
firebase functions:config:set email.user="user@gmail.com" email.pass="password"

# Unset config
firebase functions:config:unset email.user
```

## Project Structure

```
tsms/
├── src/
│   ├── components/          # Reusable React components
│   │   ├── CreateTripModal.jsx
│   │   ├── PrivateRoute.jsx
│   │   └── VehicleSeatingMap.jsx
│   ├── pages/              # Page components
│   │   ├── AdminDashboard.jsx
│   │   ├── Login.jsx
│   │   ├── RegistrationForm.jsx
│   │   └── TripView.jsx
│   ├── utils/              # Utility functions
│   │   ├── firestoreUtils.js
│   │   └── vehicleLayouts.js
│   ├── firebase.js         # Firebase configuration
│   ├── App.jsx            # Main app component
│   └── main.jsx           # Entry point
├── functions/             # Cloud Functions
│   ├── index.js          # Functions code
│   └── package.json      # Functions dependencies
├── firebase.json         # Firebase configuration
├── firestore.rules       # Firestore security rules
├── storage.rules        # Storage security rules
└── firestore.indexes.json # Firestore indexes
```

## File Purposes

| File | Purpose |
|------|---------|
| [src/firebase.js](src/firebase.js) | Firebase SDK initialization |
| [src/App.jsx](src/App.jsx) | Main app routing |
| [src/utils/firestoreUtils.js](src/utils/firestoreUtils.js) | Database operations |
| [src/utils/vehicleLayouts.js](src/utils/vehicleLayouts.js) | Vehicle seating configurations |
| [functions/index.js](functions/index.js) | Cloud Functions for PDF & email |
| [firestore.rules](firestore.rules) | Database security rules |
| [storage.rules](storage.rules) | Storage security rules |

## Routes

| Route | Component | Auth Required | Description |
|-------|-----------|---------------|-------------|
| `/login` | Login | No | Admin login page |
| `/` | AdminDashboard | Yes | Main dashboard |
| `/trip/:tripId` | TripView | Yes | Live trip view |
| `/register/:tripId` | RegistrationForm | No | Public registration |

## Firestore Collections

### trips
```javascript
{
  id: string,
  title: string,
  date: Timestamp,
  vehicleLayout: "van_15" | "bus_30",
  createdAt: Timestamp
}
```

### registrations
```javascript
{
  id: string,
  tripId: string,
  firstName: string,
  lastName: string,
  email: string,
  phone: string,
  seatNumber: number,
  signatureUrl: string,
  pdfUrl: string,
  agreedToCancellationPolicy: boolean,
  agreedToWaiver: boolean,
  timestamp: Timestamp
}
```

## Cloud Functions

### onRegistrationCreated
- **Trigger**: Firestore onCreate
- **Path**: `registrations/{registrationId}`
- **Actions**:
  1. Generate PDF waiver
  2. Upload to Storage
  3. Send email to participant
  4. Send email to admin

### resendConfirmationEmail
- **Type**: Callable function
- **Auth**: Required
- **Purpose**: Resend confirmation email

## Environment Setup

### Required
- Node.js v18+
- Firebase CLI
- Gmail account (for emails)

### Firebase Services
- Firestore Database
- Firebase Storage
- Firebase Authentication
- Firebase Cloud Functions
- Firebase Hosting

## Key Dependencies

### Frontend
- `react` - UI framework
- `react-router-dom` - Routing
- `firebase` - Firebase SDK
- `react-calendar` - Calendar component
- `react-signature-canvas` - Signature pad
- `lucide-react` - Icons
- `tailwindcss` - Styling

### Functions
- `firebase-admin` - Admin SDK
- `firebase-functions` - Functions SDK
- `pdfkit` - PDF generation
- `nodemailer` - Email sending

## Configuration Files

### firebase.json
```json
{
  "firestore": { "rules": "firestore.rules" },
  "functions": { "source": "functions" },
  "hosting": { "public": "dist" },
  "storage": { "rules": "storage.rules" }
}
```

### tailwind.config.js
Configures Tailwind CSS scanning paths

### vite.config.js
Vite build configuration

## Common Tasks

### Add a New Vehicle Layout
1. Edit [src/utils/vehicleLayouts.js](src/utils/vehicleLayouts.js)
2. Add new layout object
3. Update CreateTripModal dropdown

### Customize Email Template
1. Edit [functions/index.js](functions/index.js)
2. Find `transporter.sendMail()`
3. Modify HTML template
4. Deploy functions

### Change Waiver Text
1. Edit [src/pages/RegistrationForm.jsx](src/pages/RegistrationForm.jsx)
2. Modify `WAIVER_TEXT` constant
3. Edit [functions/index.js](functions/index.js)
4. Update PDF generation text
5. Deploy both

### Add Admin User
```bash
# Via Firebase Console
# Authentication > Users > Add User
```

### View Logs
```bash
# All logs
firebase functions:log

# Specific function
firebase functions:log --only onRegistrationCreated

# Live logs
firebase functions:log --follow
```

## Troubleshooting

### Function Not Triggering
```bash
# Check deployment
firebase functions:list

# Check logs
npm run functions:logs
```

### Email Not Sending
```bash
# Verify config
firebase functions:config:get

# Check logs
firebase functions:log --only onRegistrationCreated
```

### Permission Denied
```bash
# Redeploy rules
npm run deploy:rules

# Check rules in console
# Firebase Console > Firestore > Rules
```

### Build Errors
```bash
# Clear cache
rm -rf node_modules
npm install

# Clear Vite cache
rm -rf dist
npm run build
```

## Security Rules Quick Reference

### Firestore
- trips: read=public, write=authenticated
- registrations: create=public, read/update/delete=authenticated

### Storage
- signatures/: write=public, read=authenticated
- waivers/: write=functions, read=authenticated

## URLs

### Development
- Local: http://localhost:5173

### Production
- App: https://planyourtrip-ed010.web.app
- Functions: https://us-central1-planyourtrip-ed010.cloudfunctions.net

### Firebase Console
- Project: https://console.firebase.google.com/project/planyourtrip-ed010

## Support Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Vite Documentation](https://vitejs.dev)

## Useful Firebase CLI Commands

```bash
# Initialize project
firebase init

# Login
firebase login

# Logout
firebase logout

# List projects
firebase projects:list

# Switch project
firebase use planyourtrip-ed010

# Open Firebase console
firebase open

# Check deployment status
firebase deploy --only hosting --dry-run
```
