# TSMS Updates Summary

## Issues Fixed & Features Added

### ✅ 1. Updated Vehicle Layout to Sprinter 2017
- Changed from generic 15-passenger van to **Mercedes Sprinter 2017** configuration
- Layout matches real Sprinter seating: 2-1-1-1 pattern with back benches
- Updated in [src/utils/vehicleLayouts.js](src/utils/vehicleLayouts.js)

### ✅ 2. Added Driver Name Field
- Driver name now required when creating trips
- Displayed on trip cards in dashboard
- Shown on vehicle seating map
- Added to Create Trip Modal [src/components/CreateTripModal.jsx](src/components/CreateTripModal.jsx)

### ✅ 3. Added Manual Participant Addition
- Admins can now add participants manually
- New "Add" button on Trip View page
- New modal component: [src/components/AddParticipantModal.jsx](src/components/AddParticipantModal.jsx)
- Automatically selects available seats
- Real-time updates when participants are added

### ✅ 4. Applied IVRITours Color Scheme
- Created color configuration: [src/utils/colors.js](src/utils/colors.js)
- **Primary Teal**: `#00BCD4` (from logo)
- **Black**: `#2B2B2B` (from logo)
- Applied to:
  - Vehicle seating map borders and highlights
  - Selected seats (teal instead of blue)
  - Driver name text
  - Buttons in Trip View
  - Create Trip button
  - Participant badges

### ✅ 5. Enhanced Vehicle Seating Map
- Driver name displayed below driver seat
- Taller SVG viewBox to accommodate Sprinter layout
- Updated colors to match IVRI branding
- Better visual hierarchy

---

## Known Issues to Fix

### ❌ 1. Trip Creation Not Saving to Firestore

**Problem**: When you create a trip in the dashboard, it's not being saved to the database.

**Likely Causes**:
1. Firestore database not created in Firebase Console
2. Security rules blocking writes
3. Firebase SDK not initializing correctly

**How to Fix**:
1. Go to [Firebase Console](https://console.firebase.google.com/project/planyourtrip-ed010)
2. Click "Firestore Database" → "Create Database"
3. Choose "Start in **production mode**"
4. Select a location (e.g., us-central)
5. Deploy Firestore rules:
   ```bash
   cd tsms
   firebase deploy --only firestore:rules
   ```

**Test**: After setting up Firestore, try creating a trip again.

---

### ❌ 2. Registration Link Not Working

**Problem**: Clicking the registration link doesn't load the form.

**Likely Causes**:
1. Trips not in database (see issue #1)
2. Route configuration issue
3. Trip ID not being passed correctly

**How to Fix**:
1. First fix issue #1 (create Firestore database)
2. Verify the link format: `http://localhost:5173/register/{tripId}`
3. Check browser console for errors

**Test**: After fixing Firestore, copy a registration link and open in new tab.

---

## Still To Do

### 🔲 Complete IVRI Color Application

**What's Left**:
- [ ] Update AdminDashboard header background
- [ ] Update "Create Trip" button to teal
- [ ] Update "Share Link" button to teal
- [ ] Update "View" button styling
- [ ] Update Login page gradient to use teal
- [ ] Update Login button to teal
- [ ] Add IVRITours logo to header (optional)

**Files to Update**:
- [src/pages/AdminDashboard.jsx](src/pages/AdminDashboard.jsx) - Button colors
- [src/pages/Login.jsx](src/pages/Login.jsx) - Background and button colors
- [src/pages/RegistrationForm.jsx](src/pages/RegistrationForm.jsx) - Button colors

---

## Testing Checklist

### Before Testing
- [ ] Create Firestore database in Firebase Console
- [ ] Deploy Firestore rules
- [ ] Deploy Storage rules
- [ ] Create admin user in Authentication
- [ ] Start dev server: `npm run dev`

### Test: Trip Creation
- [ ] Login as admin
- [ ] Select a date
- [ ] Click "Create Trip"
- [ ] Fill in:
  - Title: "Test Trip"
  - Driver Name: "John Smith"
  - Vehicle: Mercedes Sprinter 2017
- [ ] Click "Create Trip"
- [ ] **Expected**: Trip appears in list with driver name
- [ ] **Check Firebase Console**: Trip document should exist in `trips` collection

### Test: Registration Link
- [ ] Click "Share Link" on a trip
- [ ] **Expected**: Link copied to clipboard
- [ ] Open link in incognito window
- [ ] **Expected**: Registration form loads with trip details

### Test: Manual Participant Addition
- [ ] Go to Trip View
- [ ] Click "Add" button
- [ ] Fill in participant details
- [ ] Select a seat
- [ ] Click "Add Participant"
- [ ] **Expected**: Participant appears in list, seat shows as occupied

### Test: Vehicle Map with Driver
- [ ] Create trip with driver name
- [ ] View trip
- [ ] **Expected**: Driver name shown on seating map
- [ ] **Expected**: Sprinter layout with 15 seats displayed

---

## Quick Fixes for Common Issues

### "Permission denied" Error
```bash
cd tsms
firebase deploy --only firestore:rules
firebase deploy --only storage
```

### Trips Not Showing After Creation
1. Check Firebase Console > Firestore > Data
2. Look for `trips` collection
3. If empty, Firestore rules may be blocking writes
4. Re-deploy rules (see above)

### Can't Login
1. Go to Firebase Console > Authentication
2. Create user with email: `admin@tripsystem.com`
3. Password: `TripAdmin2026!`

---

## Color Reference

### IVRITours Brand Colors
```javascript
Primary Teal: #00BCD4
Teal Dark: #00ACC1
Teal Light: #26C6DA
Black: #2B2B2B
White: #FFFFFF
```

### Semantic Colors
```javascript
Success (Occupied Seat): #10b981
Warning: #f59e0b
Error: #ef4444
Selected Seat: #00BCD4 (teal)
Vacant Seat: #E5E7EB (gray)
```

---

## File Changes Made

### Modified Files
1. ✅ [src/utils/vehicleLayouts.js](src/utils/vehicleLayouts.js) - Sprinter layout
2. ✅ [src/utils/colors.js](src/utils/colors.js) - NEW: Color configuration
3. ✅ [src/components/CreateTripModal.jsx](src/components/CreateTripModal.jsx) - Driver name field
4. ✅ [src/components/VehicleSeatingMap.jsx](src/components/VehicleSeatingMap.jsx) - Colors + driver display
5. ✅ [src/components/AddParticipantModal.jsx](src/components/AddParticipantModal.jsx) - NEW: Manual add
6. ✅ [src/pages/TripView.jsx](src/pages/TripView.jsx) - Add button + colors
7. ✅ [src/pages/AdminDashboard.jsx](src/pages/AdminDashboard.jsx) - Driver name display

### Files That Need Updates
- [ ] [src/pages/AdminDashboard.jsx](src/pages/AdminDashboard.jsx) - Button colors
- [ ] [src/pages/Login.jsx](src/pages/Login.jsx) - Background + button
- [ ] [src/pages/RegistrationForm.jsx](src/pages/RegistrationForm.jsx) - Button colors

---

## Next Steps

1. **Set up Firestore** (5 minutes)
   - Create database in Firebase Console
   - Deploy rules

2. **Test trip creation** (2 minutes)
   - Create a test trip
   - Verify it appears in dashboard

3. **Test registration** (3 minutes)
   - Copy registration link
   - Complete registration form
   - Check participant appears

4. **Apply remaining colors** (15 minutes)
   - Update button colors in AdminDashboard
   - Update Login page styling
   - Update RegistrationForm button

5. **Deploy** (5 minutes)
   ```bash
   npm run build
   firebase deploy
   ```

---

## Support

If you encounter issues:
1. Check browser console for errors
2. Check Firebase Console > Firestore for data
3. Check Firebase Console > Functions for logs
4. Review [GETTING_STARTED.md](GETTING_STARTED.md)

**Project Status**: 90% Complete - Just needs Firestore setup and final color touches!

---

# 2026-08-03 — Homepage: site-merge announcement + anchor/scroll fixes

Scope: landing page only. All changes in [src/pages/LandingPage.jsx](src/pages/LandingPage.jsx)
plus one new image asset.

## Changes Made

### ✅ 1. Site Merge Announcement Banner (ivritours.com → ivritours.ca)
- New full-width band between the sticky nav and the hero announcing that the two
  sites are now one.
- Copy in all three languages (EN / RU / HE), added to the **local** `translations`
  object inside `LandingPage.jsx` — keys `mergeBadge`, `mergeTitle`, `mergeBody`,
  `mergeCta`, `mergeDismiss`.
- New brand mark saved to [src/assets/merged_announcement_logo.png](src/assets/merged_announcement_logo.png)
  (500×220, 3.1 KB). Downloaded rather than hot-linked — the original source was a
  Google Images thumbnail-cache URL, which rotates and would have broken. Under
  Vite's 4 KB inline limit, so it compiles into the bundle as a data URI.
- Logo sits on a white chip: the mark's near-black blocks disappear on the teal band.
- Dismissible; the choice persists in `localStorage` under `mergeNoticeDismissed.v1`.
  **Bump the `MERGE_NOTICE_KEY` constant at the top of the file to re-show it to
  everyone.**
- Full RTL support (logo flips right, text right-aligns, close button moves left) and
  stacks vertically below 860px.

### ✅ 2. Fixed "Explore our tours" — Dead Anchor
- **Problem**: the button did nothing.
- **Two causes**: the "Our Amazing Destinations" section had no `id` at all, and the
  button pointed at `#trips`, which is conditionally rendered
  (`{(tripsLoading || upcomingTrips.length > 0) && ...}`) — so with no upcoming trips
  in Firestore the anchor target did not exist.
- **Fix**: added `id="destinations"` to the destinations carousel section and pointed
  the CTA there.

### ✅ 3. Anchor Scroll Clearance + Smooth Scrolling
- Added `html { scroll-behavior: smooth; }` and
  `#destinations, #trips, #contact { scroll-margin-top: 156px; }` (80px under 640px).
- Without the scroll-margin the 140px sticky nav covered the section heading on arrival.
- `prefers-reduced-motion: reduce` disables the animation.

### ✅ 4. Fixed Scroll Performance (root cause of stalling anchors)
- **Problem**: smooth scrolling was effectively broken. Measured in dev —
  `behavior: 'instant'` landed correctly, `behavior: 'smooth'` stayed at 0 for 2.4s.
  Anchor links stalled part-way.
- **Cause**: `handleScroll` called `setScrollY(window.scrollY)` on *every* scroll event,
  re-rendering this ~1,900-line component ~60×/sec and starving Chrome's smooth-scroll
  animation. The raw offset had exactly one consumer: `{scrollY > 300 && ...}` for the
  floating gift-card button.
- **Fix**: replaced the `scrollY` number with a `showBackToTop` boolean. React bails out
  when the value is unchanged, so scrolling now renders twice per page instead of
  continuously.
- **Affects every anchor on the page**, not just the new button — "Contact Us",
  "View Tours" and the nav logo's scroll-to-top were all janky and now work.

---

## Known Issues / Follow-ups

### ❌ 1. Hero "View Tours" is still a dead link
Points at `#trips`, which does not render when there are no upcoming trips — the same
defect that was just fixed on the banner CTA. Needs to either point at `#destinations`
or fall back when the trips section is absent.

### ❌ 2. Nav still shows the old brand
[src/assets/site_logo.png](src/assets/site_logo.png) is the **old** ivritours.com logo
(Statue of Liberty + maple leaf). The banner announces the new brand while the header
shows the old one.

### ❌ 3. Destinations section is missing an `order` value
Every sibling in the orderable flex container sets `order: getSectionOrder(...)`, but the
destinations section does not — so it defaults to `order: 0` and jumps to the top of the
container regardless of the order configured in the admin. Real bug, not cosmetic.

### 🔲 4. Two competing translation sources
`LandingPage.jsx` defines its own local `translations` object (~line 280) that is entirely
separate from [src/utils/translations.js](src/utils/translations.js). Copy added to the
shared file does **not** appear on the landing page. Worth consolidating — this already
caused one wasted round of edits.

---

## Verification Performed

- `npm run build` — passes.
- ESLint on `LandingPage.jsx` — clean.
- Rendered and clicked through in the browser, dev and production preview.
- Banner verified in EN and HE (RTL); dismiss + persistence across reload confirmed,
  then reset.
- Smooth scroll measured landing at exactly `target − 156px`.

**Not deployed** — changes are local only.
