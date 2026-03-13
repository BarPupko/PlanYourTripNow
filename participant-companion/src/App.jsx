import { useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { collection, query, where, limit, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import ScheduleList from './components/ScheduleList';

export default function App() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [state, setState] = useState({ status: 'loading', participant: null, trip: null, scheduleItems: [] });

  useEffect(() => {
    if (!token) { setState(s => ({ ...s, status: 'no_token' })); return; }

    let cancelled = false;

    (async () => {
      try {
        // 1. Find the registration that holds this companionToken
        const regSnap = await getDocs(
          query(collection(db, 'registrations'), where('companionToken', '==', token), limit(1))
        );
        if (cancelled) return;

        if (regSnap.empty) { setState(s => ({ ...s, status: 'invalid_token' })); return; }

        const regDoc = regSnap.docs[0];
        const reg    = { id: regDoc.id, ...regDoc.data() };

        const participant = {
          id:        reg.id,
          firstName: reg.firstName,
          lastName:  reg.lastName,
          name:      `${reg.firstName} ${reg.lastName}`,
        };

        // 2. Fetch trip + schedule items in parallel
        const [tripSnap, schedSnap] = await Promise.all([
          getDoc(doc(db, 'trips', reg.tripId)),
          getDocs(query(collection(db, 'schedule_items'), where('tripId', '==', reg.tripId))),
        ]);

        if (cancelled) return;

        if (!tripSnap.exists()) { setState(s => ({ ...s, status: 'error' })); return; }

        const td = tripSnap.data();
        const trip = {
          id:        tripSnap.id,
          // Existing trips use 'title'; new ones may use 'name'
          name:      td.title || td.name || 'Your Trip',
          // Support both new startDate/endDate and legacy single 'date' field
          startDate: td.startDate?.toDate?.() ?? td.date?.toDate?.() ?? new Date(),
          endDate:   td.endDate?.toDate?.()   ?? td.date?.toDate?.() ?? new Date(),
          itinerary: td.itinerary || null,
        };

        const scheduleItems = schedSnap.docs.map(d => ({
          id: d.id,
          ...d.data(),
          startTime: d.data().startTime.toDate(),
          endTime:   d.data().endTime.toDate(),
        }));

        setState({ status: 'ok', participant, trip, scheduleItems });
      } catch (err) {
        console.error('Failed to load itinerary:', err);
        if (!cancelled) setState(s => ({ ...s, status: 'error' }));
      }
    })();

    return () => { cancelled = true; };
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
