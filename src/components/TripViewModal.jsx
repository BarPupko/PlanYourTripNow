import { useState, useEffect } from 'react';
import { X, Users, UserPlus, CheckCircle2, XCircle, CreditCard, Banknote, ChevronDown, ChevronUp, Edit2, Trash2, Copy, Check, MessageCircle } from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { getTrip, updateRegistration, deleteRegistration } from '../utils/firestoreUtils';
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
  const [preselectedSeat, setPreselectedSeat] = useState(null);
  const [expandedParticipant, setExpandedParticipant] = useState(null);
  const [editingParticipant, setEditingParticipant] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [deletingId, setDeletingId] = useState(null);
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);

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

  const handleTogglePaid = async (registrationId, currentStatus) => {
    try {
      await updateRegistration(registrationId, { paid: !currentStatus });
    } catch (error) {
      console.error('Error updating payment status:', error);
      alert(t.failedToUpdatePayment);
    }
  };

  const handleDeleteParticipant = async (registrationId) => {
    if (!confirm('Are you sure you want to delete this participant? This action cannot be undone.')) {
      return;
    }

    setDeletingId(registrationId);
    try {
      await deleteRegistration(registrationId);
      setExpandedParticipant(null);
    } catch (error) {
      console.error('Error deleting participant:', error);
      alert('Failed to delete participant. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditParticipant = (registration) => {
    setEditingParticipant(registration.id);
    setEditFormData({
      firstName: registration.firstName,
      lastName: registration.lastName,
      email: registration.email,
      phone: registration.phone
    });
  };

  const handleSaveEdit = async (registrationId) => {
    try {
      await updateRegistration(registrationId, editFormData);
      setEditingParticipant(null);
      setEditFormData({});
    } catch (error) {
      console.error('Error updating participant:', error);
      alert('Failed to update participant. Please try again.');
    }
  };

  const handleCancelEdit = () => {
    setEditingParticipant(null);
    setEditFormData({});
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-15 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
        <div className="bg-white rounded-lg p-8">
          <div className="text-lg">{t.loadingTripInfo}</div>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-15 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
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
    <div className="fixed inset-0 bg-black bg-opacity-15 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50" onClick={onClose}>
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
                onSeatClick={(seatNumber, occupant) => {
                  if (occupant) {
                    setExpandedParticipant(occupant.id);
                  } else {
                    setPreselectedSeat(seatNumber);
                    setShowAddModal(true);
                  }
                }}
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

                {/* WhatsApp Buttons */}
                {registrations.length > 0 && (
                  <div className="flex gap-2 mb-4">
                    <button
                      onClick={handleCopyForWhatsApp}
                      style={{ backgroundColor: copiedWhatsApp ? colors.success : '#25D366' }}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-white rounded-lg hover:opacity-90 transition-all font-medium"
                      title="Copy all participant details for WhatsApp"
                    >
                      {copiedWhatsApp ? (
                        <>
                          <Check className="w-5 h-5" />
                          <span className="hidden sm:inline">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-5 h-5" />
                          <span className="hidden sm:inline">Copy</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleSendToGroup}
                      style={{ backgroundColor: '#25D366' }}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-white rounded-lg hover:opacity-90 transition-all font-medium"
                      title="Send to WhatsApp group"
                    >
                      <MessageCircle className="w-5 h-5" />
                      <span className="hidden sm:inline">Send to Group</span>
                    </button>
                  </div>
                )}

                {registrations.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    {t.noRegistrations}
                  </p>
                ) : (
                  <div className="space-y-2 max-h-[600px] overflow-y-auto">
                    {sortedRegistrations.map((reg) => (
                      <div key={reg.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        {/* Collapsed View */}
                        <div
                          onClick={() => setExpandedParticipant(expandedParticipant === reg.id ? null : reg.id)}
                          className="flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors cursor-pointer"
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
                          <div className="flex-shrink-0 flex items-center gap-2">
                            {reg.paid ? (
                              <CheckCircle2 className="w-5 h-5 text-green-500" title={t.paid} />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-500" title={t.notPaid} />
                            )}
                            {expandedParticipant === reg.id ? (
                              <ChevronUp className="w-5 h-5 text-gray-400" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                        </div>

                        {/* Expanded Details */}
                        {expandedParticipant === reg.id && (
                          <div className="px-3 pb-3 border-t border-gray-200">
                            {editingParticipant === reg.id ? (
                              /* Edit Mode */
                              <div className="space-y-3 pt-3">
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="text-xs font-medium text-gray-500">First Name</label>
                                    <input
                                      type="text"
                                      value={editFormData.firstName}
                                      onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })}
                                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-xs font-medium text-gray-500">Last Name</label>
                                    <input
                                      type="text"
                                      value={editFormData.lastName}
                                      onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })}
                                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                    />
                                  </div>
                                </div>
                                <div>
                                  <label className="text-xs font-medium text-gray-500">Email</label>
                                  <input
                                    type="email"
                                    value={editFormData.email}
                                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs font-medium text-gray-500">Phone</label>
                                  <input
                                    type="tel"
                                    value={editFormData.phone}
                                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                  />
                                </div>
                                <div className="flex gap-2 pt-2">
                                  <button
                                    onClick={() => handleSaveEdit(reg.id)}
                                    style={{ backgroundColor: colors.success }}
                                    className="flex-1 px-3 py-2 text-white text-sm rounded-lg hover:opacity-90 transition-opacity font-medium"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={handleCancelEdit}
                                    className="flex-1 px-3 py-2 bg-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-400 transition-colors font-medium"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              /* View Mode */
                              <div className="space-y-3 pt-3">
                                {/* Phone */}
                                <div>
                                  <label className="text-xs font-medium text-gray-500">{t.phone}</label>
                                  <p className="text-sm text-gray-900">{reg.phone}</p>
                                </div>

                                {/* Payment Method */}
                                <div>
                                  <label className="text-xs font-medium text-gray-500">{t.paymentMethod}</label>
                                  <div className="flex items-center gap-2 mt-1">
                                    {reg.paymentMethod === 'card' ? (
                                      <>
                                        <CreditCard className="w-4 h-4 text-blue-600" />
                                        <span className="text-sm text-gray-900">{t.payWithCard}</span>
                                      </>
                                    ) : (
                                      <>
                                        <Banknote className="w-4 h-4 text-green-600" />
                                        <span className="text-sm text-gray-900">{t.payOnTrip}</span>
                                      </>
                                    )}
                                  </div>
                                </div>

                                {/* Payment Status */}
                                <div>
                                  <label className="text-xs font-medium text-gray-500">{t.paymentStatus}</label>
                                  <div className="flex items-center gap-2 mt-1">
                                    {reg.paid ? (
                                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                                    ) : (
                                      <XCircle className="w-4 h-4 text-red-500" />
                                    )}
                                    <span className="text-sm text-gray-900 font-semibold">
                                      {reg.paid ? t.paid : t.notPaid}
                                    </span>
                                  </div>
                                </div>

                                {/* Registration Date */}
                                {reg.registrationDate && (
                                  <div>
                                    <label className="text-xs font-medium text-gray-500">{t.registered}</label>
                                    <p className="text-sm text-gray-900">
                                      {new Date(reg.registrationDate).toLocaleDateString()}
                                    </p>
                                  </div>
                                )}

                                {/* Agreements */}
                                {(reg.agreedToCancellationPolicy || reg.agreedToWaiver) && (
                                  <div>
                                    <label className="text-xs font-medium text-gray-500">{t.signedAgreements}</label>
                                    <div className="space-y-1 mt-1">
                                      {reg.agreedToCancellationPolicy && (
                                        <div className="flex items-center gap-2">
                                          <CheckCircle2 className="w-3 h-3 text-green-500" />
                                          <span className="text-xs text-gray-700">{t.cancellationPolicy}</span>
                                        </div>
                                      )}
                                      {reg.agreedToWaiver && (
                                        <div className="flex items-center gap-2">
                                          <CheckCircle2 className="w-3 h-3 text-green-500" />
                                          <span className="text-xs text-gray-700">{t.liabilityWaiver}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* Action Buttons */}
                                <div className="space-y-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleTogglePaid(reg.id, reg.paid);
                                    }}
                                    style={{ backgroundColor: reg.paid ? colors.button.danger : colors.success }}
                                    className="w-full px-3 py-2 text-white text-sm rounded-lg hover:opacity-90 transition-opacity font-medium"
                                  >
                                    {reg.paid ? t.markAsNotPaid : t.markAsPaidBtn}
                                  </button>

                                  <div className="flex gap-2">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEditParticipant(reg);
                                      }}
                                      style={{ backgroundColor: colors.primary.teal }}
                                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-white text-sm rounded-lg hover:opacity-90 transition-opacity font-medium"
                                    >
                                      <Edit2 className="w-4 h-4" />
                                      <span>Edit</span>
                                    </button>

                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteParticipant(reg.id);
                                      }}
                                      disabled={deletingId === reg.id}
                                      style={{ backgroundColor: colors.button.danger }}
                                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-white text-sm rounded-lg hover:opacity-90 transition-opacity font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                      <span>{deletingId === reg.id ? 'Deleting...' : 'Delete'}</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
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
    </div>
  );
};

export default TripViewModal;
