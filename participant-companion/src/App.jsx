import { useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import ScheduleList from './components/ScheduleList';
import { getMockData, DEMO_TOKEN } from './data/mockData';

// ─── Toggle ───────────────────────────────────────────────────────────────────
// true  → use mock data (works offline, always shows past/current/future)
// false → query real Firestore; uses the 'registrations' collection
const USE_MOCK_DATA = true;
// ─────────────────────────────────────────────────────────────────────────────

export default function App() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [state, setState] = useState({ status: 'loading', participant: null, trip: null, scheduleItems: [] });

  useEffect(() => {
    if (!token) { setState(s => ({ ...s, status: 'no_token' })); return; }

    if (USE_MOCK_DATA) {
      const timer = setTimeout(() => {
        if (token === DEMO_TOKEN || token === 'demo') {
          const { mockParticipant, mockTrip, mockScheduleItems } = getMockData();
          setState({ status: 'ok', participant: mockParticipant, trip: mockTrip, scheduleItems: mockScheduleItems });
        } else {
          setState(s => ({ ...s, status: 'invalid_token' }));
        }
      }, 600);
      return () => clearTimeout(timer);
    }

    // ── Live Firestore ────────────────────────────────────────────────────────
    // The participant-companion queries the SAME 'registrations' collection
    // already used by the admin app. Each registration doc gets a
    // 'companionToken' field (UUID) generated on first use via the admin UI.
    //
    // import { collection, query, where, limit, getDocs, doc, getDoc } from 'firebase/firestore';
    // import { db } from './firebase';
    //
    // (async () => {
    //   try {
    //     // 1. Look up registration by companionToken
    //     const regSnap = await getDocs(
    //       query(collection(db, 'registrations'), where('companionToken', '==', token), limit(1))
    //     );
    //     if (regSnap.empty) { setState(s => ({ ...s, status: 'invalid_token' })); return; }
    //
    //     const regDoc  = regSnap.docs[0];
    //     const reg     = { id: regDoc.id, ...regDoc.data() };
    //     const participant = {
    //       id:        reg.id,
    //       firstName: reg.firstName,
    //       lastName:  reg.lastName,
    //       name:      `${reg.firstName} ${reg.lastName}`,
    //     };
    //
    //     // 2. Fetch trip + schedule items in parallel
    //     const [tripSnap, schedSnap] = await Promise.all([
    //       getDoc(doc(db, 'trips', reg.tripId)),
    //       getDocs(query(collection(db, 'schedule_items'), where('tripId', '==', reg.tripId))),
    //     ]);
    //
    //     if (!tripSnap.exists()) { setState(s => ({ ...s, status: 'error' })); return; }
    //
    //     const tripData = tripSnap.data();
    //     const trip = {
    //       id:        tripSnap.id,
    //       name:      tripData.title || tripData.name,
    //       startDate: tripData.startDate?.toDate?.() ?? tripData.date?.toDate?.() ?? new Date(),
    //       endDate:   tripData.endDate?.toDate?.()   ?? new Date(),
    //     };
    //
    //     const scheduleItems = schedSnap.docs.map(d => ({
    //       id: d.id, ...d.data(),
    //       startTime: d.data().startTime.toDate(),
    //       endTime:   d.data().endTime.toDate(),
    //     }));
    //
    //     setState({ status: 'ok', participant, trip, scheduleItems });
    //   } catch (err) {
    //     console.error(err);
    //     setState(s => ({ ...s, status: 'error' }));
    //   }
    // })();
    // ─────────────────────────────────────────────────────────────────────────
  }, [token]);

  if (state.status === 'loading') return <LoadingScreen />;
  if (state.status === 'no_token')
    return <ErrorScreen title="No access link provided."
      hint="Open this page using the personal link sent to you by your tour coordinator." />;
  if (state.status === 'invalid_token')
    return <ErrorScreen title="Invalid or expired link."
      hint="Please contact your tour coordinator for a new personalised link." />;
  if (state.status === 'error')
    return <ErrorScreen title="Could not load your itinerary."
      hint="Check your internet connection and reload the page." />;

  return (
    <ScheduleList
      items={state.scheduleItems}
      participant={state.participant}
      trip={state.trip}
    />
  );
}

const TEAL = '#00BCD4';

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-2"
        style={{ background: `linear-gradient(135deg, ${TEAL} 0%, #26C6DA 100%)` }}
      >
        <div className="text-center text-white leading-none">
          <div className="text-[11px] font-black tracking-widest">IVRI</div>
          <div className="text-[8px] tracking-widest opacity-90">TOURS</div>
        </div>
      </div>
      <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: `${TEAL}`, borderTopColor: 'transparent' }} />
      <p className="text-gray-500 text-sm">Loading your itinerary…</p>
    </div>
  );
}

function ErrorScreen({ title, hint }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-3 px-8 text-center">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-2"
        style={{ background: `linear-gradient(135deg, ${TEAL} 0%, #26C6DA 100%)` }}
      >
        <div className="text-center text-white leading-none">
          <div className="text-[11px] font-black tracking-widest">IVRI</div>
          <div className="text-[8px] tracking-widest opacity-90">TOURS</div>
        </div>
      </div>
      <h2 className="font-bold text-lg" style={{ color: '#2B2B2B' }}>{title}</h2>
      <p className="text-gray-500 text-sm leading-relaxed">{hint}</p>
    </div>
  );
}
