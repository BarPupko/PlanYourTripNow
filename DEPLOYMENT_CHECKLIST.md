# Deployment Checklist

Use this checklist to ensure your TSMS application is properly deployed and configured.

## Pre-Deployment

### Firebase Project Setup
- [ ] Firebase project created (planyourtrip-ed010)
- [ ] Billing enabled (required for Cloud Functions)
- [ ] Firestore Database created
- [ ] Firebase Storage enabled
- [ ] Firebase Authentication enabled

### Authentication
- [ ] Email/Password authentication enabled
- [ ] Admin user created
- [ ] Admin credentials saved securely

### Email Configuration
- [ ] Email service account created
- [ ] App password generated (for Gmail)
- [ ] Firebase Functions config set:
  ```bash
  firebase functions:config:set email.user="your-email@gmail.com"
  firebase functions:config:set email.pass="your-app-password"
  firebase functions:config:set admin.email="admin@example.com"
  ```
- [ ] Email configuration verified:
  ```bash
  firebase functions:config:get
  ```

### Dependencies
- [ ] Frontend dependencies installed: `npm install`
- [ ] Functions dependencies installed: `npm run functions:install`

## Deployment Steps

### 1. Deploy Firestore Rules
```bash
firebase deploy --only firestore:rules
```
- [ ] Rules deployed successfully
- [ ] No errors in console

### 2. Deploy Firestore Indexes
```bash
firebase deploy --only firestore:indexes
```
- [ ] Indexes deployed successfully
- [ ] Indexes building (check Firebase Console)

### 3. Deploy Storage Rules
```bash
firebase deploy --only storage
```
- [ ] Storage rules deployed successfully
- [ ] No errors in console

### 4. Deploy Cloud Functions
```bash
npm run deploy:functions
```
- [ ] Functions deployed successfully
- [ ] `onRegistrationCreated` function active
- [ ] `resendConfirmationEmail` function active
- [ ] No errors in deployment logs

### 5. Build Frontend
```bash
npm run build
```
- [ ] Build completed successfully
- [ ] No TypeScript/ESLint errors
- [ ] Dist folder created

### 6. Deploy Hosting
```bash
firebase deploy --only hosting
```
- [ ] Hosting deployed successfully
- [ ] Application URL received
- [ ] URL accessible

## Post-Deployment Testing

### Admin Dashboard
- [ ] Navigate to your app URL
- [ ] Login page loads correctly
- [ ] Admin can login with credentials
- [ ] Dashboard loads with calendar
- [ ] Calendar is interactive
- [ ] Can create a trip
- [ ] Trip appears in list
- [ ] Can copy registration link
- [ ] Can view trip details
- [ ] Can logout

### Public Registration
- [ ] Open registration link in incognito
- [ ] Registration form loads
- [ ] All fields visible
- [ ] Seat map displays correctly
- [ ] Can select a seat
- [ ] Seat selection updates visually
- [ ] Can draw signature
- [ ] Can clear signature
- [ ] Form validation works
- [ ] Can submit registration
- [ ] Success message displays

### Cloud Functions & Automation
- [ ] Check participant email inbox
- [ ] Confirmation email received
- [ ] Email contains correct trip info
- [ ] PDF waiver attached to email
- [ ] PDF opens correctly
- [ ] Check admin email inbox
- [ ] Notification email received
- [ ] Notification contains participant info

### Real-time Updates
- [ ] Open trip view as admin
- [ ] Submit a registration
- [ ] Seating map updates automatically
- [ ] Participant appears in sidebar
- [ ] Seat shows as occupied

### Firebase Console Verification
- [ ] Firestore > trips collection has data
- [ ] Firestore > registrations collection has data
- [ ] Storage > signatures folder has files
- [ ] Storage > waivers folder has PDFs
- [ ] Authentication > Users shows registrations
- [ ] Functions > Logs show successful executions

## Security Verification

### Firestore Rules
- [ ] Unauthorized users cannot write to trips
- [ ] Anyone can create registrations
- [ ] Only admins can read registrations
- [ ] Test with unauthenticated requests

### Storage Rules
- [ ] Unauthorized users cannot read signatures
- [ ] Unauthorized users cannot read waivers
- [ ] Test file access without auth

### Authentication
- [ ] Cannot access admin pages without login
- [ ] Login redirects to dashboard
- [ ] Logout works correctly
- [ ] Session persists on refresh

## Performance Testing

### Load Testing
- [ ] Multiple simultaneous registrations work
- [ ] No conflicts in seat selection
- [ ] Real-time updates handle multiple users
- [ ] No slowdowns with 10+ trips

### Mobile Testing
- [ ] Registration form works on mobile
- [ ] Signature pad works on touchscreen
- [ ] All buttons accessible on mobile
- [ ] Responsive design looks good

## Monitoring Setup

### Firebase Console
- [ ] Enable Cloud Functions logs
- [ ] Set up error alerts
- [ ] Monitor function execution time
- [ ] Monitor database reads/writes

### Analytics (Optional)
- [ ] Google Analytics enabled
- [ ] Tracking code verified
- [ ] Events configured

## Backup Plan

### Data Backup
- [ ] Firestore backup configured
- [ ] Export procedures documented
- [ ] Recovery tested

### Rollback Plan
- [ ] Previous version tagged
- [ ] Rollback procedure documented
- [ ] Database migration plan

## Documentation

- [ ] README.md updated
- [ ] SETUP_GUIDE.md reviewed
- [ ] Admin credentials documented (securely)
- [ ] Support contact information added
- [ ] User guide created (optional)

## Final Checks

- [ ] All features working in production
- [ ] No console errors
- [ ] No Firebase errors
- [ ] Email delivery confirmed
- [ ] PDF generation confirmed
- [ ] Performance acceptable
- [ ] Security rules verified
- [ ] Mobile experience tested
- [ ] Stakeholders notified
- [ ] Training provided (if needed)

## Post-Launch

### Week 1
- [ ] Monitor function logs daily
- [ ] Check error rates
- [ ] Verify email delivery
- [ ] Collect user feedback

### Week 2-4
- [ ] Review usage patterns
- [ ] Optimize as needed
- [ ] Address any bugs
- [ ] Plan enhancements

## Troubleshooting Resources

If issues arise:

1. **Check Firebase Console Logs**:
   - Functions > Logs
   - Firestore > Usage
   - Storage > Files

2. **Check Browser Console**:
   - Look for JavaScript errors
   - Check network requests

3. **Verify Configuration**:
   ```bash
   firebase functions:config:get
   ```

4. **Check Function Logs**:
   ```bash
   npm run functions:logs
   ```

5. **Test Firestore Rules**:
   - Use Firebase Console Rules Playground

## Success Criteria

Deployment is successful when:
- ✅ Admin can login and manage trips
- ✅ Public can register for trips
- ✅ Emails are sent automatically
- ✅ PDFs are generated and stored
- ✅ Real-time updates work
- ✅ No critical errors in logs
- ✅ Mobile experience is smooth
- ✅ All security rules enforced

---

**Deployment Date**: _______________

**Deployed By**: _______________

**Production URL**: https://planyourtrip-ed010.web.app

**Notes**:
_______________________________________________
_______________________________________________
_______________________________________________
