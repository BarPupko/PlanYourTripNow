# Deployment Notes - Recent Updates

## Changes Made

### 1. Language Support (English/Russian)
- Added language selector in the top right corner of all pages
- Full Russian translation for the entire application
- Language persists across page navigation
- Dropdown selector showing "English (CA)" and "Русский"

### 2. Mobile-Friendly UI Improvements
- All buttons now show only icons on mobile, full text on desktop
- Better touch targets for mobile users
- Responsive text sizes throughout
- Improved header layout for small screens

### 3. Vehicle Seating Maps - UPDATED
**IMPORTANT:** The vehicle layouts have been updated:
- **Mercedes Sprinter Black**: Now shows **13 seats** (was 15)
- **Mercedes Sprinter White**: Now shows **10 seats** (was 30)
- **Toyota Highlander**: New vehicle with **7 seats**

### 4. Add Participant Modal Enhanced
- Now includes payment method selection (Card/Pay on Trip)
- Added "Mark as Paid" checkbox
- Uses correct seat count based on vehicle type

## Why Vehicle Maps Might Not Show Updated Layouts

If you're still seeing old seat layouts, it's because:

1. **Old Trips**: Existing trips created BEFORE these changes will still use the old internal IDs (`sprinter_15`, `bus_30`)
   - The NAMES are updated everywhere
   - The SEAT COUNTS are correct in the code
   - But you need to CREATE NEW TRIPS to see the new layouts

2. **Browser Cache**: Your browser might be caching the old JavaScript files
   - Solution: Hard refresh (Ctrl+Shift+R on Windows, Cmd+Shift+R on Mac)
   - Or clear browser cache

## How to Deploy to GitHub Pages

1. **Commit all changes:**
   ```bash
   cd tsms
   git add .
   git commit -m "Add language support and mobile improvements"
   git push
   ```

2. **GitHub Actions will automatically:**
   - Build the project
   - Deploy to GitHub Pages
   - The site will be live at: https://barpupko.github.io/PlanYourTripNow/

3. **After deployment:**
   - Clear your browser cache or do a hard refresh
   - Create a NEW trip to test the updated vehicle layouts
   - Switch between English and Russian using the dropdown

## Testing the Vehicle Layouts

To verify the vehicle seating maps are working correctly:

1. Go to admin dashboard
2. Click "Create Trip"
3. Select **Mercedes Sprinter Black (13 Seats)**
4. Create the trip
5. View the trip - you should see exactly **13 seats** (not 15)
6. Try the same with White Sprinter (**10 seats**) and Highlander (**7 seats**)

## Files Changed

### New Files:
- `src/contexts/LanguageContext.jsx` - Language state management
- `src/utils/translations.js` - All English/Russian translations
- `src/components/LanguageSelector.jsx` - Language dropdown component

### Modified Files:
- `src/App.jsx` - Added LanguageProvider
- `src/pages/AdminDashboard.jsx` - Added language selector, translations
- `src/pages/TripView.jsx` - Mobile improvements
- `src/components/AddParticipantModal.jsx` - Payment fields, correct seat count
- `src/utils/vehicleLayouts.js` - Updated all 3 vehicle seat layouts

## Next Steps

After deploying, you should:

1. Test creating trips with all 3 vehicle types
2. Test the language switcher (English ↔ Russian)
3. Test on mobile devices to see icon-only buttons
4. Verify payment method options when adding participants

## Important Notes

- **Old trips** will keep their existing seat configurations
- **New trips** will use the updated 13/10/7 seat layouts
- Language preference is not saved (resets on page reload)
- If you want to persist language choice, we can add localStorage support
