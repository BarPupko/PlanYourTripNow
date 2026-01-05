import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { Plus, LogOut, Copy, Check, ExternalLink, Trash2, Calendar as CalendarIcon, Archive } from 'lucide-react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { getTripsByDate, createTrip, deleteTrip } from '../utils/firestoreUtils';
import CreateTripModal from '../components/CreateTripModal';
import IrviLogo from '../components/IrviLogo';
import colors from '../utils/colors';

const AdminDashboard = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [trips, setTrips] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [viewFilter, setViewFilter] = useState('all'); // 'all', 'upcoming', 'past'
  const [deletingId, setDeletingId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadTrips();
  }, [selectedDate]);

  const loadTrips = async () => {
    setLoading(true);
    try {
      const tripsData = await getTripsByDate(selectedDate);
      setTrips(tripsData);
    } catch (error) {
      console.error('Error loading trips:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTrip = async (tripData) => {
    try {
      await createTrip(tripData);
      setShowCreateModal(false);
      loadTrips();
    } catch (error) {
      console.error('Error creating trip:', error);
    }
  };

  const handleCopyLink = (tripId) => {
    const link = `${window.location.origin}/PlanYourTripNow/register/${tripId}`;
    navigator.clipboard.writeText(link);
    setCopiedId(tripId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleDeleteTrip = async (tripId) => {
    if (!confirm('Are you sure you want to delete this trip? This action cannot be undone.')) {
      return;
    }

    setDeletingId(tripId);
    try {
      await deleteTrip(tripId);
      loadTrips();
    } catch (error) {
      console.error('Error deleting trip:', error);
      alert('Failed to delete trip. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const getFilteredTrips = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (viewFilter === 'upcoming') {
      return trips.filter(trip => {
        const tripDate = trip.date?.toDate?.() || new Date(trip.date);
        tripDate.setHours(0, 0, 0, 0);
        return tripDate >= today;
      });
    } else if (viewFilter === 'past') {
      return trips.filter(trip => {
        const tripDate = trip.date?.toDate?.() || new Date(trip.date);
        tripDate.setHours(0, 0, 0, 0);
        return tripDate < today;
      });
    }
    return trips;
  };

  const filteredTrips = getFilteredTrips();

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <IrviLogo size="md" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Trip Management Dashboard
                </h1>
                <p className="text-sm text-gray-500 mt-1">IRVI Tours - Admin Portal</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Side - Trip List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Trips for {selectedDate.toLocaleDateString()}
                </h2>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => setViewFilter('all')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      viewFilter === 'all'
                        ? 'text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                    style={viewFilter === 'all' ? { backgroundColor: colors.primary.teal } : {}}
                  >
                    <CalendarIcon className="w-4 h-4" />
                    All Trips
                  </button>
                  <button
                    onClick={() => setViewFilter('upcoming')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      viewFilter === 'upcoming'
                        ? 'text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                    style={viewFilter === 'upcoming' ? { backgroundColor: colors.primary.teal } : {}}
                  >
                    <CalendarIcon className="w-4 h-4" />
                    Current Trips
                  </button>
                  <button
                    onClick={() => setViewFilter('past')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      viewFilter === 'past'
                        ? 'text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                    style={viewFilter === 'past' ? { backgroundColor: colors.primary.teal } : {}}
                  >
                    <Archive className="w-4 h-4" />
                    Old Trips
                  </button>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                style={{ backgroundColor: colors.primary.teal }}
                className="flex items-center gap-2 px-4 py-2 text-white rounded-lg hover:opacity-90 transition-opacity"
              >
                <Plus className="w-4 h-4" />
                Create Trip
              </button>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="text-gray-500">Loading trips...</div>
              </div>
            ) : filteredTrips.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <p className="text-gray-500">
                  {viewFilter === 'upcoming' && 'No upcoming trips scheduled.'}
                  {viewFilter === 'past' && 'No past trips found.'}
                  {viewFilter === 'all' && 'No trips scheduled for this date.'}
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
                >
                  Create your first trip
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTrips.map((trip) => (
                  <div
                    key={trip.id}
                    className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {trip.title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {trip.vehicleLayout === 'sprinter_15'
                            ? 'Mercedes Sprinter 2017 (15 Passenger)'
                            : trip.vehicleLayout === 'van_15'
                            ? '15-Passenger Van'
                            : '30-Passenger Bus'}
                        </p>
                        {trip.driverName && (
                          <p className="text-sm mt-1" style={{ color: '#00BCD4' }}>
                            Driver: {trip.driverName}
                          </p>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleCopyLink(trip.id)}
                          className="flex items-center gap-2 px-3 py-2 text-white rounded-lg hover:opacity-90 transition-opacity text-sm"
                          style={{ backgroundColor: copiedId === trip.id ? colors.success : colors.primary.teal }}
                        >
                          {copiedId === trip.id ? (
                            <>
                              <Check className="w-4 h-4" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              Share Link
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => navigate(`/trip/${trip.id}`)}
                          style={{ backgroundColor: colors.primary.black }}
                          className="flex items-center gap-2 px-3 py-2 text-white rounded-lg hover:opacity-90 transition-opacity text-sm"
                        >
                          <ExternalLink className="w-4 h-4" />
                          View
                        </button>

                        <button
                          onClick={() => handleDeleteTrip(trip.id)}
                          disabled={deletingId === trip.id}
                          style={{ backgroundColor: colors.button.danger }}
                          className="flex items-center gap-2 px-3 py-2 text-white rounded-lg hover:opacity-90 transition-opacity text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Delete trip"
                        >
                          <Trash2 className="w-4 h-4" />
                          {deletingId === trip.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Side - Calendar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-4 sticky top-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Calendar
              </h2>
              <Calendar
                onChange={setSelectedDate}
                value={selectedDate}
                className="border-0 w-full"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Create Trip Modal */}
      {showCreateModal && (
        <CreateTripModal
          selectedDate={selectedDate}
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateTrip}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
