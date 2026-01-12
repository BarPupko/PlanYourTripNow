# Trip Pricing Guide - Individual Pricing Setup

## Overview

The WhatsApp bot now displays **price per person** for each trip. This guide explains how to add this field to your trips.

## Adding Price Per Person to Trips

### Method 1: When Creating a New Trip (Recommended)

When you create a new trip in the admin dashboard, you should include a `pricePerPerson` field in your trip data:

```javascript
{
  title: "Masada Sunrise Hike",
  date: Timestamp,
  totalSeats: 40,
  occupiedSeats: 0,
  price: 4200,  // Total trip cost (40 people × ₪105)
  pricePerPerson: 105,  // ⭐ ADD THIS FIELD
  description: "Experience the breathtaking sunrise from Masada fortress",
  meetingPoint: "Jerusalem Central Bus Station"
}
```

### Method 2: Update Existing Trips via Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/project/planyourtrip-ed010/firestore)
2. Navigate to **Firestore Database**
3. Open the **trips** collection
4. For each trip:
   - Click on the trip document
   - Click **Add field**
   - Field name: `pricePerPerson`
   - Type: `number`
   - Value: The price per person (e.g., `105`)
   - Click **Update**

### Method 3: Update Existing Trips Programmatically

If you have many trips to update, you can use this Firebase Function or script:

```javascript
// Run this once to add pricePerPerson to existing trips
const admin = require('firebase-admin');

async function addPricePerPersonToTrips() {
  const tripsSnapshot = await admin.firestore().collection('trips').get();

  const batch = admin.firestore().batch();

  tripsSnapshot.forEach(doc => {
    const trip = doc.data();

    // Calculate price per person if not already set
    if (!trip.pricePerPerson && trip.price && trip.totalSeats) {
      const pricePerPerson = Math.round(trip.price / trip.totalSeats);
      batch.update(doc.ref, { pricePerPerson });
      console.log(`Updated ${trip.title}: ₪${pricePerPerson} per person`);
    }
  });

  await batch.commit();
  console.log('All trips updated with pricePerPerson field');
}
```

---

## How the Bot Uses Price Per Person

### Trip Listings
When users send `trips` or `поездки`, they'll see:

**English:**
```
📍 Masada Sunrise Hike
   Date: 1/15/2026
   Price per person: ₪105
   Total price: ₪4,200
   Available: 34/40 seats
```

**Russian:**
```
📍 Masada Sunrise Hike
   Дата: 15.01.2026
   Цена за человека: ₪105
   Общая цена: ₪4,200
   Доступно: 34/40 мест
```

### Detailed Trip Info
When users send `info` or `инфо`:

```
ℹ️ Trip Details

📍 Masada Sunrise Hike

📅 Date: 1/15/2026 at 04:00
💰 Price per person: ₪105
💰 Total price: ₪4,200
🚌 Total seats: 40
✅ Available seats: 34
👥 Registered: 6
💳 Paid: 4
💵 Total revenue: ₪420
```

---

## Fallback Behavior

**If `pricePerPerson` is not set:**
- The bot will use the `price` field as the price per person
- This ensures backward compatibility with existing trips
- But it's recommended to add the `pricePerPerson` field for clarity

**Example:**
```javascript
// Old trip format (still works)
{
  title: "Jerusalem Tour",
  price: 75,  // Will be shown as "Price per person: ₪75"
  totalSeats: 30
}

// New trip format (recommended)
{
  title: "Jerusalem Tour",
  price: 2250,  // Total: 30 × ₪75
  pricePerPerson: 75,  // ⭐ Explicitly shows per-person price
  totalSeats: 30
}
```

---

## Best Practices

### 1. Always Include Both Fields
```javascript
{
  price: totalSeats × pricePerPerson,  // Total trip cost
  pricePerPerson: 105  // Individual ticket price
}
```

### 2. Keep Them in Sync
When you update pricing, update both fields:
- Change `pricePerPerson` to new individual price
- Update `price` to `totalSeats × pricePerPerson`

### 3. Use Whole Numbers
Avoid decimals when possible:
- ✅ Good: `pricePerPerson: 105`
- ❌ Avoid: `pricePerPerson: 105.50`

### 4. Include Descriptions
The bot now shows trip descriptions, so add helpful details:
```javascript
{
  description: "Experience the breathtaking sunrise from Masada fortress. Includes guided tour and breakfast.",
  meetingPoint: "Jerusalem Central Bus Station, Platform 3"
}
```

---

## Testing Your Changes

After adding `pricePerPerson` to your trips:

1. **Test via WhatsApp**:
   - Send: `trips` or `поездки`
   - Verify: You see "Price per person: ₪XX"

2. **Test Detailed View**:
   - Send: `info` or `инфо`
   - Verify: Both total price and per-person price are shown

3. **Test Different Languages**:
   - Send: `trips` (English response)
   - Send: `поездки` (Russian response)
   - Verify: Pricing displays correctly in both

---

## Example Trip Data Structure

Here's a complete example of a well-structured trip:

```javascript
{
  // Required fields
  title: "Masada Sunrise Hike",
  date: Timestamp.fromDate(new Date('2026-01-15T04:00:00')),
  totalSeats: 40,
  occupiedSeats: 6,
  price: 4200,  // Total cost for all 40 seats
  pricePerPerson: 105,  // Cost per individual ticket

  // Recommended fields for WhatsApp bot
  description: "Experience the breathtaking sunrise from Masada fortress. Includes guided tour and breakfast buffet.",
  meetingPoint: "Jerusalem Central Bus Station, Platform 3",

  // Optional fields
  imageUrl: "https://...",
  cancellationPolicy: "Full refund if cancelled 30+ days before trip",
  includedItems: ["Transportation", "Breakfast", "Guided Tour", "Entry Tickets"],
  maxGroupSize: 40,
  minParticipants: 20
}
```

---

## Updating Your Admin Dashboard (Optional)

If you want to add a "Price Per Person" field to your trip creation form:

1. Open [src/pages/Trips.jsx](../src/pages/Trips.jsx)
2. Add a new input field in the trip form:

```javascript
<div>
  <label>Price Per Person (₪)</label>
  <input
    type="number"
    value={formData.pricePerPerson || ''}
    onChange={(e) => setFormData({
      ...formData,
      pricePerPerson: parseFloat(e.target.value)
    })}
    placeholder="e.g., 105"
    required
  />
</div>
```

3. Update the form submission to include `pricePerPerson` when creating/updating trips

---

## Summary

✅ Add `pricePerPerson` field to all new trips
✅ Update existing trips via Firebase Console or script
✅ Keep `price` and `pricePerPerson` in sync
✅ Test with WhatsApp bot commands
✅ Optionally update admin dashboard form

The WhatsApp bot will now clearly communicate individual pricing to your customers in both English and Russian!
