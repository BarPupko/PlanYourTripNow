import { useState, useEffect } from 'react';
import { X, Users, UserPlus, CheckCircle2, XCircle, CreditCard, Banknote } from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { getTrip, updateRegistration } from '../utils/firestoreUtils';
import VehicleSeatingMap from './VehicleSeatingMap';
import AddParticipantModal from './AddParticipantModal';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../utils/translations';
import colors from '../utils/colors';

const TripViewModal = ({ tripId, onClose }) => {
  const { language } = useLanguage();
  const t = translations[language];
  const [trip, setTrip] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState(null);

  useEffect(() => {
    loadTrip();
    const unsubscribe = subscribeToRegistrations();
    return () => unsubscribe && unsubscribe();
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

    return unsubscribe;
  };

  const handleTogglePaid = async (registrationId, currentStatus) => {
    try {
      await updateRegistration(registrationId, { paid: !currentStatus });
    } catch (error) {
      console.error('Error updating payment status:', error);
      alert(t.failedToUpdatePayment);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={onClose}>
        <div className="bg-white rounded-lg p-8">
          <div className="text-lg">{t.loadingTripInfo}</div>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={onClose}>
        <div className="bg-white rounded-lg p-8 text-center">
          <p className="text-lg text-gray-600 mb-4">{t.tripNotFound}</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            {t.close}
          </button>
        </div>
      </div>
    );
  }

  const sortedRegistrations = [...registrations].sort(
    (a, b) => a.seatNumber - b.seatNumber
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-2 sm:p-4 z-50" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[95vh] overflow-hidden border-4 border-teal-400"
        onClick={(e) => e.stopPropagation()}
        style={{ borderColor: colors.primary.teal }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-500 to-teal-600 text-white px-4 sm:px-6 py-4 flex justify-between items-center">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold truncate">{trip.title}</h2>
            <p className="text-sm text-teal-100">
              {trip.date?.toDate().toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 ml-4 p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            title={t.close}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(95vh-80px)] p-4 sm:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
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
              <div className="bg-gray-50 rounded-lg shadow-lg p-4 sm:p-6 border-2 border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5" style={{ color: colors.primary.teal }} />
                    <h3 className="text-lg sm:text-xl font-bold" style={{ color: colors.primary.black }}>
                      {t.participants} ({registrations.length})
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowAddModal(true)}
                    style={{ backgroundColor: colors.primary.teal }}
                    className="flex items-center gap-2 px-3 py-2 text-white rounded-lg hover:opacity-90 transition-opacity text-sm"
                    title={t.addParticipant}
                  >
                    <UserPlus className="w-5 h-5" />
                    <span className="hidden sm:inline">{t.add}</span>
                  </button>
                </div>

                {registrations.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    {t.noRegistrations}
                  </p>
                ) : (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {sortedRegistrations.map((reg) => (
                      <div
                        key={reg.id}
                        onClick={() => setSelectedParticipant(reg)}
                        className="flex items-center gap-3 p-3 bg-white rounded-lg hover:bg-gray-100 transition-colors cursor-pointer border border-gray-200"
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
                        <div className="flex-shrink-0">
                          {reg.paid ? (
                            <CheckCircle2 className="w-5 h-5 text-green-500" title={t.paid} />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-500" title={t.notPaid} />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
          onSuccess={() => setShowAddModal(false)}
        />
      )}

      {/* Participant Details Modal */}
      {selectedParticipant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]" onClick={() => setSelectedParticipant(null)}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {t.participantDetails}
              </h2>

              <div className="space-y-4">
                {/* Basic Info */}
                <div>
                  <label className="text-sm font-medium text-gray-500">{t.name}</label>
                  <p className="text-lg font-semibold text-gray-900">
                    {selectedParticipant.firstName} {selectedParticipant.lastName}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">{t.email}</label>
                  <p className="text-gray-900">{selectedParticipant.email}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">{t.phone}</label>
                  <p className="text-gray-900">{selectedParticipant.phone}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">{t.seat}</label>
                  <p className="text-gray-900">#{selectedParticipant.seatNumber}</p>
                </div>

                {/* Payment Info */}
                <div className="border-t pt-4">
                  <label className="text-sm font-medium text-gray-500">{t.paymentMethod}</label>
                  <div className="flex items-center gap-2 mt-1">
                    {selectedParticipant.paymentMethod === 'card' ? (
                      <>
                        <CreditCard className="w-4 h-4 text-blue-600" />
                        <span className="text-gray-900">{t.payWithCard}</span>
                      </>
                    ) : (
                      <>
                        <Banknote className="w-4 h-4 text-green-600" />
                        <span className="text-gray-900">{t.payOnTrip}</span>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">{t.paymentStatus}</label>
                  <div className="flex items-center gap-2 mt-1">
                    {selectedParticipant.paid ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                    <span className="text-gray-900 font-semibold">
                      {selectedParticipant.paid ? t.paid : t.notPaid}
                    </span>
                  </div>
                </div>

                {/* Registration Status */}
                <div className="border-t pt-4">
                  <label className="text-sm font-medium text-gray-500">{t.registrationStatus}</label>
                  <div className="flex items-center gap-2 mt-1">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <span className="text-gray-900">{t.complete}</span>
                  </div>
                  {selectedParticipant.registrationDate && (
                    <p className="text-sm text-gray-500 mt-1">
                      {t.registered}: {new Date(selectedParticipant.registrationDate).toLocaleDateString()}
                    </p>
                  )}
                </div>

                {/* Agreements */}
                <div className="border-t pt-4">
                  <label className="text-sm font-medium text-gray-500">{t.signedAgreements}</label>
                  <div className="space-y-1 mt-2">
                    {selectedParticipant.agreedToCancellationPolicy && (
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        <span className="text-gray-700">{t.cancellationPolicy}</span>
                      </div>
                    )}
                    {selectedParticipant.agreedToWaiver && (
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        <span className="text-gray-700">{t.liabilityWaiver}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 space-y-3">
                <button
                  onClick={() => handleTogglePaid(selectedParticipant.id, selectedParticipant.paid)}
                  style={{ backgroundColor: selectedParticipant.paid ? colors.button.danger : colors.success }}
                  className="w-full px-4 py-3 text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
                >
                  {selectedParticipant.paid ? t.markAsNotPaid : t.markAsPaidBtn}
                </button>
                <button
                  onClick={() => setSelectedParticipant(null)}
                  className="w-full px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  {t.close}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TripViewModal;
