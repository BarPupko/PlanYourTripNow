import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { Plus, LogOut, Copy, Check, ExternalLink } from 'lucide-react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { getTripsByDate, createTrip } from '../utils/firestoreUtils';
import CreateTripModal from '../components/CreateTripModal';
import colors from '../utils/colors';

const AdminDashboard = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [trips, setTrips] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [loading, setLoading] = useState(false);
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
    const link = `${window.location.origin}/register/${tripId}`;
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

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              Trip Management Dashboard
            </h1>
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
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">
                Trips for {selectedDate.toLocaleDateString()}
              </h2>
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
            ) : trips.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <p className="text-gray-500">
                  No trips scheduled for this date.
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
                {trips.map((trip) => (
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
