import { useState, useEffect } from 'react';
import { getDocs, collection } from 'firebase/firestore';
import { db } from '../firebase';
import { getAllTrips } from '../utils/firestoreUtils';
import Header from '../components/Header';
import colors from '../utils/colors';

const StarDisplay = ({ value, size = 'sm' }) => {
  const cls = size === 'lg' ? 'text-2xl' : 'text-sm';
  return (
    <span className={cls}>
      {[1,2,3,4,5].map(n => (
        <span key={n} style={{ color: n <= value ? '#f59e0b' : '#D1D5DB' }}>★</span>
      ))}
    </span>
  );
};

const CATEGORIES = [
  { key: 'overall',   label: 'Overall' },
  { key: 'guide',     label: 'Guide' },
  { key: 'transport', label: 'Transport' },
  { key: 'value',     label: 'Value' },
];

const FeedbacksDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [feedbacks, setFeedbacks] = useState([]);
  const [tripsMap, setTripsMap] = useState({});
  const [expandedTrip, setExpandedTrip] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [trips, fbSnap] = await Promise.all([
          getAllTrips(),
          getDocs(collection(db, 'feedbacks')),
        ]);

        const map = {};
        trips.forEach(t => { map[t.id] = t; });
        setTripsMap(map);

        const fbs = fbSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setFeedbacks(fbs);
      } catch (err) {
        console.error('Error loading feedbacks:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Group feedbacks by tripId
  const grouped = feedbacks.reduce((acc, fb) => {
    if (!acc[fb.tripId]) acc[fb.tripId] = [];
    acc[fb.tripId].push(fb);
    return acc;
  }, {});

  const tripIds = Object.keys(grouped).sort((a, b) => {
    // Sort by trip date descending
    const ta = tripsMap[a]?.startDateTime?.toDate?.() || 0;
    const tb = tripsMap[b]?.startDateTime?.toDate?.() || 0;
    return tb - ta;
  });

  const avgRating = (fbs, key) =>
    fbs.length ? (fbs.reduce((s, f) => s + (f.ratings?.[key] || 0), 0) / fbs.length).toFixed(1) : '–';

  const overallAvgAll = feedbacks.length
    ? (feedbacks.reduce((s, f) => s + (f.ratings?.overall || 0), 0) / feedbacks.length).toFixed(1)
    : '–';

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Summary bar */}
        <div className="bg-white rounded-xl shadow p-5 mb-6 flex flex-wrap gap-6 items-center">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-gray-900">Feedback Overview</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {feedbacks.length} response{feedbacks.length !== 1 ? 's' : ''} across {tripIds.length} trip{tripIds.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-3xl font-bold text-amber-500">{overallAvgAll}</span>
            <div>
              <StarDisplay value={Math.round(parseFloat(overallAvgAll))} size="lg" />
              <p className="text-xs text-gray-400 mt-0.5">overall average</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-400">Loading feedbacks…</div>
        ) : tripIds.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-10 text-center">
            <div className="text-5xl mb-3">⭐</div>
            <p className="text-gray-500">No feedback received yet.</p>
            <p className="text-sm text-gray-400 mt-1">Responses will appear here once participants submit their ratings.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tripIds.map(tripId => {
              const fbs = grouped[tripId];
              const trip = tripsMap[tripId];
              const isExpanded = expandedTrip === tripId;

              return (
                <div key={tripId} className="bg-white rounded-xl shadow overflow-hidden">
                  {/* Trip header row */}
                  <button
                    className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors text-left"
                    onClick={() => setExpandedTrip(isExpanded ? null : tripId)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">
                        {trip?.title || tripId}
                      </p>
                      {trip?.startDateTime && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {trip.startDateTime.toDate?.().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                      )}
                    </div>

                    {/* Mini averages */}
                    <div className="hidden sm:flex gap-3">
                      {CATEGORIES.map(({ key, label }) => (
                        <div key={key} className="text-center">
                          <p className="text-xs text-gray-400">{label}</p>
                          <p className="text-sm font-bold text-amber-500">{avgRating(fbs, key)} ★</p>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-gray-400">{fbs.length} response{fbs.length !== 1 ? 's' : ''}</span>
                      <span className="text-gray-400 text-lg">{isExpanded ? '▲' : '▽'}</span>
                    </div>
                  </button>

                  {/* Expanded individual responses */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 divide-y divide-gray-50">
                      {fbs.map(fb => (
                        <div key={fb.id} className="px-5 py-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900 text-sm">
                                {fb.firstName} {fb.lastName}
                              </p>
                              {fb.submittedAt && (
                                <p className="text-xs text-gray-400">
                                  {fb.submittedAt.toDate?.().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                </p>
                              )}
                            </div>
                            <div className="flex-shrink-0">
                              <StarDisplay value={fb.ratings?.overall || 0} />
                            </div>
                          </div>

                          {/* Category breakdown */}
                          <div className="grid grid-cols-4 gap-2 mt-3">
                            {CATEGORIES.map(({ key, label }) => (
                              <div key={key} className="bg-gray-50 rounded-lg px-2 py-1.5 text-center">
                                <p className="text-xs text-gray-400">{label}</p>
                                <p className="text-sm font-semibold text-amber-500">{fb.ratings?.[key] || 0} ★</p>
                              </div>
                            ))}
                          </div>

                          {/* Recommend + comment */}
                          {fb.wouldRecommend && (
                            <p className="text-xs text-gray-500 mt-2">
                              Would recommend:{' '}
                              <span className="font-medium">
                                {fb.wouldRecommend === 'yes' ? '😍 Absolutely!' : fb.wouldRecommend === 'maybe' ? '🤔 Maybe' : '😕 Not really'}
                              </span>
                            </p>
                          )}
                          {fb.comment && (
                            <p className="text-sm text-gray-600 mt-2 italic bg-amber-50 rounded-lg px-3 py-2">
                              "{fb.comment}"
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedbacksDashboard;
