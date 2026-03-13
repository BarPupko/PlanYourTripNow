// Mock data that mimics the exact shape of Firestore documents.
// Schedule items are offset from NOW so you always see all three
// states (past / current / future) regardless of when you open the app.

export const DEMO_TOKEN = 'demo-token-abc123xyz';

export function getMockData() {
  const now = new Date();

  const mockParticipant = {
    id: 'participant_001',
    name: 'Sarah Johnson',
    tripId: 'trip_001',
    magicToken: DEMO_TOKEN,
  };

  const mockTrip = {
    id: 'trip_001',
    name: 'Jordan & Petra Explorer',
    startDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // started 2 days ago
    endDate:   new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), // ends in 5 days
  };

  // Helper: offset from now in minutes
  const t = (minuteOffset) => new Date(now.getTime() + minuteOffset * 60 * 1000);

  const mockScheduleItems = [
    {
      id: 'item_001',
      tripId: 'trip_001',
      title: 'Hotel Breakfast',
      description: 'Full buffet breakfast at the hotel restaurant. Please meet in the lobby at 7:45 AM sharp.',
      location: 'Kempinski Hotel — Ground Floor Restaurant',
      startTime: t(-180),  // 3 h ago
      endTime:   t(-120),  // 2 h ago  → PAST
    },
    {
      id: 'item_002',
      tripId: 'trip_001',
      title: 'Morning City Walking Tour',
      description: 'Guided walking tour through the old city with local historian Ahmed Al-Rashid. Comfortable shoes and water are essential. Entry fees included.',
      location: 'Old City Entrance Gate, Downtown Amman',
      startTime: t(-45),   // 45 min ago
      endTime:   t(+45),   // 45 min from now  → CURRENT ✓
    },
    {
      id: 'item_003',
      tripId: 'trip_001',
      title: 'Lunch at Sufra Restaurant',
      description: 'Traditional Jordanian mezze and grills. Vegetarian options are available — notify your guide in advance for dietary requirements.',
      location: 'Sufra Restaurant, Rainbow Street, Jabal Amman',
      startTime: t(+90),   // 1.5 h from now
      endTime:   t(+150),  // 2.5 h from now   → FUTURE
    },
    {
      id: 'item_004',
      tripId: 'trip_001',
      title: 'Citadel & Archaeological Museum',
      description: "Explore Jabal al-Qal'a — the ancient Amman Citadel — and walk through the Jordan Archaeological Museum. Entry tickets are included in your tour package.",
      location: 'Amman Citadel, Ras Al-Ain',
      startTime: t(+180),  // 3 h from now
      endTime:   t(+270),  // 4.5 h from now   → FUTURE
    },
    {
      id: 'item_005',
      tripId: 'trip_001',
      title: 'Free Time & Souq Exploration',
      description: 'Free time to explore the local souq and bazaars at your own pace. Your guide will be near the main souq entrance if you need help.',
      location: 'Downtown Amman Souq',
      startTime: t(+300),  // 5 h from now
      endTime:   t(+360),  // 6 h from now     → FUTURE
    },
    {
      id: 'item_006',
      tripId: 'trip_001',
      title: 'Group Dinner & Cultural Show',
      description: 'Welcome dinner on the rooftop with traditional live music and dabke folk dancing. Smart casual dress recommended. Transportation departs from hotel lobby at 7:15 PM.',
      location: 'Cantaloupe Rooftop Restaurant, 1st Circle',
      startTime: t(+420),  // 7 h from now
      endTime:   t(+540),  // 9 h from now     → FUTURE
    },
  ];

  return { mockParticipant, mockTrip, mockScheduleItems };
}
