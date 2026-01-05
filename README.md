# Trip & Seating Management System (TSMS)

A comprehensive trip management platform for organizers to handle digital waivers, real-time vehicle seating assignments, and participant tracking with a seamless mobile experience.

## Features

- **Admin Dashboard**: Calendar-based trip management with visual seating charts
- **Public Registration**: Mobile-responsive forms with digital signature capture
- **Real-time Updates**: Live seating map updates as participants register
- **Automated Workflows**: PDF generation and email notifications
- **Secure Authentication**: Firebase-based admin authentication

## Tech Stack

- **Frontend**: React (Vite) + Tailwind CSS + Lucide Icons
- **Backend/Database**: Firebase Firestore (NoSQL)
- **Storage**: Firebase Storage
- **Auth**: Firebase Authentication
- **Serverless**: Firebase Cloud Functions
- **PDF Generation**: PDFKit
- **Email**: Nodemailer

## Project Structure

```
tsms/
├── src/
│   ├── components/
│   │   ├── CreateTripModal.jsx
│   │   ├── PrivateRoute.jsx
│   │   └── VehicleSeatingMap.jsx
│   ├── pages/
│   │   ├── AdminDashboard.jsx
│   │   ├── Login.jsx
│   │   ├── RegistrationForm.jsx
│   │   └── TripView.jsx
│   ├── utils/
│   │   ├── firestoreUtils.js
│   │   └── vehicleLayouts.js
│   ├── firebase.js
│   ├── App.jsx
│   └── main.jsx
├── functions/
│   ├── index.js
│   └── package.json
├── firebase.json
├── firestore.rules
├── storage.rules
└── firestore.indexes.json
```

## Setup Instructions

### 1. Prerequisites

- Node.js (v18 or higher)
- Firebase CLI: `npm install -g firebase-tools`
- A Firebase project (already configured)

### 2. Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install Firebase Functions dependencies
cd functions
npm install
cd ..
```

### 3. Firebase Configuration

Your Firebase configuration is already set up in src/firebase.js with your project credentials.

### 4. Set Up Firebase Authentication

1. Go to Firebase Console > Authentication
2. Enable Email/Password sign-in method
3. Create an admin user:
   - Email: your-admin@email.com
   - Password: [secure password]

### 5. Configure Email for Cloud Functions

Set up email credentials for automated emails:

```bash
# Set email configuration
firebase functions:config:set email.user="your-email@gmail.com"
firebase functions:config:set email.pass="your-app-password"
firebase functions:config:set admin.email="admin@example.com"
```

For Gmail, you'll need to create an App Password:
1. Go to Google Account Settings
2. Security > 2-Step Verification
3. App passwords > Generate new app password
4. Use this password in the configuration above

### 6. Deploy Firestore Rules and Indexes

```bash
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
firebase deploy --only storage
```

### 7. Deploy Cloud Functions

```bash
firebase deploy --only functions
```

### 8. Run the Development Server

```bash
npm run dev
```

The application will open at `http://localhost:5173`

### 9. Build for Production

```bash
npm run build
firebase deploy --only hosting
```

## Usage Guide

### Admin Workflow

1. **Login**: Navigate to `/login` and sign in with admin credentials
2. **Create Trip**:
   - Select a date on the calendar
   - Click "Create Trip"
   - Enter trip details and vehicle type
3. **Share Registration Link**:
   - Click "Share Link" on any trip to copy the registration URL
   - Share with participants
4. **Monitor Registrations**:
   - Click "View" on any trip to see the live seating map
   - View participant list in real-time

### Participant Workflow

1. **Open Registration Link**: Click the link shared by the admin
2. **Fill Personal Information**: Enter name, email, and phone
3. **Select Seat**: Click on an available seat in the vehicle map
4. **Read & Agree**:
   - Read the cancellation policy
   - Review the waiver of liability
5. **Sign**: Draw signature using touch/mouse
6. **Submit**: Complete registration
7. **Confirmation**: Receive confirmation email with PDF waiver

## Database Schema

### Collections

#### trips
```javascript
{
  id: "auto-generated",
  title: "Beach Trip",
  date: Timestamp,
  vehicleLayout: "van_15" | "bus_30",
  createdAt: Timestamp
}
```

#### registrations
```javascript
{
  id: "auto-generated",
  tripId: "trip-id",
  firstName: "John",
  lastName: "Doe",
  email: "john@example.com",
  phone: "+1234567890",
  seatNumber: 1,
  signatureUrl: "storage-url",
  pdfUrl: "storage-url",
  agreedToCancellationPolicy: true,
  agreedToWaiver: true,
  timestamp: Timestamp
}
```

## Vehicle Layouts

### 15-Passenger Van
- Driver seat
- 14 passenger seats arranged in 5 rows
- Capacity: 15 total

### 30-Passenger Bus
- Driver seat
- 29 passenger seats arranged in 8 rows
- Capacity: 30 total

## Cloud Functions

### onRegistrationCreated
Automatically triggered when a new registration is created:
1. Fetches trip details
2. Generates PDF waiver with participant info
3. Uploads PDF to Firebase Storage
4. Sends confirmation email to participant with PDF
5. Sends notification email to admin

### resendConfirmationEmail
Callable function for admins to resend confirmation emails to participants.

## Security Rules

### Firestore Rules
- **trips**: Public read, admin-only write
- **registrations**: Public create, admin-only read/update/delete

### Storage Rules
- **signatures**: Public write (during registration), admin-only read
- **waivers**: Admin-only read, Cloud Functions-only write

## Customization

### Adding Vehicle Types

Edit src/utils/vehicleLayouts.js to add new vehicle configurations.

### Customizing Email Templates

Edit the email templates in functions/index.js.

### Modifying Waiver Text

Edit the waiver text in src/pages/RegistrationForm.jsx.

## Troubleshooting

### Email Not Sending
- Check Firebase Functions logs: `firebase functions:log`
- Verify email configuration: `firebase functions:config:get`
- Ensure App Password is correct for Gmail

### PDF Not Generating
- Check Cloud Functions deployment status
- Verify Storage rules allow writing
- Check Functions logs for errors

### Authentication Issues
- Ensure Email/Password authentication is enabled in Firebase Console
- Create an admin user in Firebase Console
- Check that firebase.js configuration is correct

### Firestore Permission Errors
- Deploy Firestore rules: `firebase deploy --only firestore:rules`
- Check rules in Firebase Console

## License

MIT License - feel free to use this project for your organization.
