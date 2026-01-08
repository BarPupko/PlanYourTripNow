import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Users, UserPlus, CheckCircle2, XCircle, CreditCard, Banknote, Copy, Check, MessageCircle } from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { getTrip, updateRegistration } from '../utils/firestoreUtils';
import VehicleSeatingMap from '../components/VehicleSeatingMap';
import AddParticipantModal from '../components/AddParticipantModal';
import Header from '../components/Header';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../utils/translations';
import colors from '../utils/colors';

const TripView = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = translations[language];
  const [trip, setTrip] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [preselectedSeat, setPreselectedSeat] = useState(null);
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);

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

  const handleTogglePaid = async (registrationId, currentStatus) => {
    try {
      await updateRegistration(registrationId, { paid: !currentStatus });
    } catch (error) {
      console.error('Error updating payment status:', error);
      alert('Failed to update payment status');
    }
  };

  const generateWhatsAppMessage = () => {
    if (!trip || registrations.length === 0) return '';

    // Create formatted message
    let message = `🚌 *${trip.title}*\n`;
    message += `📅 Date: ${trip.date?.toDate().toLocaleDateString()}\n`;
    if (trip.driverName) {
      message += `🚗 Driver: ${trip.driverName}\n`;
    }
    message += `\n👥 *Participants (${registrations.length})*\n`;
    message += `${'='.repeat(40)}\n\n`;

    // Sort by seat number
    const sorted = [...registrations].sort((a, b) => a.seatNumber - b.seatNumber);

    sorted.forEach((reg, index) => {
      message += `${index + 1}. *${reg.firstName} ${reg.lastName}*\n`;
      message += `   💺 Seat: ${reg.seatNumber}\n`;
      message += `   📧 ${reg.email}\n`;
      message += `   📱 ${reg.phone}\n`;
      message += `   💳 ${reg.paid ? '✅ Paid' : '❌ Not Paid'}\n`;
      message += `\n`;
    });

    message += `${'='.repeat(40)}\n`;
    message += `✨ Total Participants: ${registrations.length}\n`;
    message += `💰 Paid: ${registrations.filter(r => r.paid).length}\n`;
    message += `⏳ Pending: ${registrations.filter(r => !r.paid).length}\n`;

    return message;
  };

  const handleCopyForWhatsApp = () => {
    const message = generateWhatsAppMessage();
    if (!message) return;

    // Copy to clipboard
    navigator.clipboard.writeText(message).then(() => {
      setCopiedWhatsApp(true);
      setTimeout(() => setCopiedWhatsApp(false), 2000);
    }).catch(err => {
      console.error('Failed to copy:', err);
      alert('Failed to copy to clipboard');
    });
  };

  const handleSendToGroup = () => {
    const message = generateWhatsAppMessage();
    if (!message) return;

    // Extract group ID from WhatsApp group link if available
    if (trip.whatsappGroupLink) {
      // Open WhatsApp with the message pre-filled
      const encodedMessage = encodeURIComponent(message);
      window.open(`${trip.whatsappGroupLink}?text=${encodedMessage}`, '_blank');
    } else {
      // If no group link, just open WhatsApp with the message
      const encodedMessage = encodeURIComponent(message);
      window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">{t.loadingTrip}</div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-gray-600 mb-4">{t.tripNotFoundTitle}</p>
          <button
            onClick={() => navigate('/')}
            className="text-blue-600 hover:text-blue-700"
          >
            {t.returnToDashboard}
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
      <Header
        showBackButton={true}
        title={trip.title}
        subtitle={trip.date?.toDate().toLocaleDateString()}
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Side - Seating Map */}
          <div className="lg:col-span-2">
            <VehicleSeatingMap
              vehicleType={trip.vehicleLayout}
              registrations={registrations}
              driverName={trip.driverName}
              onSeatClick={(seatNumber, occupant) => {
                if (occupant) {
                  setSelectedParticipant(occupant);
                } else {
                  setPreselectedSeat(seatNumber);
                  setShowAddModal(true);
                }
              }}
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
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowAddModal(true)}
                    style={{ backgroundColor: colors.primary.teal }}
                    className="flex items-center gap-2 px-3 py-2 text-white rounded-lg hover:opacity-90 transition-opacity text-sm"
                    title="Add participant"
                  >
                    <UserPlus className="w-5 h-5" />
                    <span className="hidden sm:inline">Add</span>
                  </button>
                </div>
              </div>

              {/* WhatsApp Buttons */}
              {registrations.length > 0 && (
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={handleCopyForWhatsApp}
                    style={{ backgroundColor: copiedWhatsApp ? colors.success : '#25D366' }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-white rounded-lg hover:opacity-90 transition-all font-medium"
                    title={t.copyAllParticipantDetails}
                  >
                    {copiedWhatsApp ? (
                      <>
                        <Check className="w-5 h-5" />
                        <span className="hidden sm:inline">{t.copied}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-5 h-5" />
                        <span className="hidden sm:inline">{t.copyForWhatsApp}</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleSendToGroup}
                    style={{ backgroundColor: '#25D366' }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-white rounded-lg hover:opacity-90 transition-all font-medium"
                    title={t.sendToWhatsAppGroup}
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span className="hidden sm:inline">{t.sendToGroup}</span>
                  </button>
                </div>
              )}

              {registrations.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  {t.noRegistrationsYet}
                </p>
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {sortedRegistrations.map((reg) => (
                    <div
                      key={reg.id}
                      onClick={() => setSelectedParticipant(reg)}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
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
                          <CheckCircle2 className="w-5 h-5 text-green-500" title="Paid" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500" title="Not Paid" />
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

      {/* Add Participant Modal */}
      {showAddModal && (
        <AddParticipantModal
          trip={trip}
          registrations={registrations}
          preselectedSeat={preselectedSeat}
          onClose={() => {
            setShowAddModal(false);
            setPreselectedSeat(null);
          }}
          onSuccess={() => {
            setShowAddModal(false);
            setPreselectedSeat(null);
          }}
        />
      )}

      {/* Participant Details Modal */}
      {selectedParticipant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedParticipant(null)}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {t.participantDetailsTitle}
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
                  <label className="text-sm font-medium text-gray-500">{t.seatNumberLabel}</label>
                  <p className="text-gray-900">#{selectedParticipant.seatNumber}</p>
                </div>

                {/* Payment Info */}
                <div className="border-t pt-4">
                  <label className="text-sm font-medium text-gray-500">{t.paymentMethodLabel}</label>
                  <div className="flex items-center gap-2 mt-1">
                    {selectedParticipant.paymentMethod === 'card' ? (
                      <>
                        <CreditCard className="w-4 h-4 text-blue-600" />
                        <span className="text-gray-900">{t.cardPayment}</span>
                      </>
                    ) : (
                      <>
                        <Banknote className="w-4 h-4 text-green-600" />
                        <span className="text-gray-900">{t.payOnTripMethod}</span>
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

export default TripView;
