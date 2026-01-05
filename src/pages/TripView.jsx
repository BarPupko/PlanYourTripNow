import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, UserPlus } from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { getTrip } from '../utils/firestoreUtils';
import VehicleSeatingMap from '../components/VehicleSeatingMap';
import AddParticipantModal from '../components/AddParticipantModal';
import colors from '../utils/colors';

const TripView = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    loadTrip();
    subscribeToRegistrations();
  }, [tripId]);

  const loadTrip = async () => {
    try {
      const tripData = await getTrip(tripId);
      setTrip(tripData);
    } catch (error) {
      console.error('Error loading trip:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToRegistrations = () => {
    const q = query(
      collection(db, 'registrations'),
      where('tripId', '==', tripId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const regs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRegistrations(regs);
    });

    return () => unsubscribe();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading trip...</div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-gray-600 mb-4">Trip not found</p>
          <button
            onClick={() => navigate('/')}
            className="text-blue-600 hover:text-blue-700"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const sortedRegistrations = [...registrations].sort(
    (a, b) => a.seatNumber - b.seatNumber
  );

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{trip.title}</h1>
              <p className="text-sm text-gray-600">
                {trip.date?.toDate().toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Side - Seating Map */}
          <div className="lg:col-span-2">
            <VehicleSeatingMap
              vehicleType={trip.vehicleLayout}
              registrations={registrations}
              driverName={trip.driverName}
            />
          </div>

          {/* Right Side - Participant List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5" style={{ color: colors.primary.teal }} />
                  <h2 className="text-xl font-bold" style={{ color: colors.primary.black }}>
                    Participants ({registrations.length})
                  </h2>
                </div>
                <button
                  onClick={() => setShowAddModal(true)}
                  style={{ backgroundColor: colors.primary.teal }}
                  className="flex items-center gap-2 px-3 py-2 text-white rounded-lg hover:opacity-90 transition-opacity text-sm"
                >
                  <UserPlus className="w-4 h-4" />
                  Add
                </button>
              </div>

              {registrations.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No registrations yet
                </p>
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {sortedRegistrations.map((reg) => (
                    <div
                      key={reg.id}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex-shrink-0 w-8 h-8 text-white rounded-full flex items-center justify-center font-bold text-sm" style={{ backgroundColor: colors.seat.occupied }}>
                        {reg.seatNumber}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">
                          {reg.firstName} {reg.lastName}
                        </p>
                        <p className="text-sm text-gray-600 truncate">
                          {reg.email}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Participant Modal */}
      {showAddModal && (
        <AddParticipantModal
          trip={trip}
          registrations={registrations}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            // Modal will close automatically and real-time listener will update the list
          }}
        />
      )}
    </div>
  );
};

export default TripView;
