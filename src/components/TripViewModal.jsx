import { useState, useEffect } from 'react';
import { X, Users, UserPlus, CheckCircle2, XCircle, CreditCard, Banknote, ChevronDown, ChevronUp, Edit2, Trash2, Copy, Check, MessageCircle, Phone, FileText } from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { getTrip, updateRegistration, deleteRegistration, ensureCompanionToken } from '../utils/firestoreUtils';
import { getVehicleLayout } from '../utils/vehicleLayouts';
import VehicleSeatingMap from './VehicleSeatingMap';
import AddParticipantModal from './AddParticipantModal';
import ParticipantDetailsModal from './ParticipantDetailsModal';
import InvoiceModal from './InvoiceModal';
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
  const [viewingParticipant, setViewingParticipant] = useState(null);
  const [confirmingReg, setConfirmingReg] = useState(null);
  const [confirmSeat, setConfirmSeat] = useState('');
  const [invoiceReg, setInvoiceReg] = useState(null);
  const [itineraryLoadingId, setItineraryLoadingId] = useState(null);
  const [itineraryCopiedId, setItineraryCopiedId]   = useState(null);

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

  const handleSendForm = async (reg) => {
    try {
      await updateRegistration(reg.id, { status: 'form_sent' });
    } catch (error) {
      console.error('Error sending form:', error);
      alert('Failed to send form');
    }
  };

  const handleRejectPending = async (reg) => {
    if (!window.confirm(`Reject registration for ${reg.firstName} ${reg.lastName}?`)) return;
    try {
      await deleteRegistration(reg.id);
    } catch (error) {
      console.error('Error rejecting registration:', error);
      alert('Failed to reject registration');
    }
  };

  const handleToggleContacted = async (regId, currentValue) => {
    try {
      await updateRegistration(regId, { contacted: !currentValue });
    } catch (error) {
      console.error('Error updating contacted status:', error);
    }
  };

  const COMPANION_BASE_URL = 'https://ivritours.github.io/participant-companion/';

  const handleSendItineraryLink = async (e, reg) => {
    e.stopPropagation();
    setItineraryLoadingId(reg.id);
    try {
      const token = await ensureCompanionToken(reg.id);
      const url   = `${COMPANION_BASE_URL}?token=${token}`;
      const msg   = `Hi ${reg.firstName}! 👋\nHere is your personal IVRI Tours itinerary link:\n${url}\nOpen it on your phone to follow the live schedule. See you soon! 🚌`;
      await navigator.clipboard.writeText(msg);
      setItineraryLoadingId(null);
      setItineraryCopiedId(reg.id);
      setTimeout(() => setItineraryCopiedId(null), 3000);
    } catch (err) {
      console.error('Failed to generate itinerary link:', err);
      setItineraryLoadingId(null);
    }
  };

  const handleConfirmManually = async () => {
    if (!confirmingReg || !confirmSeat) return;
    try {
      await updateRegistration(confirmingReg.id, { status: 'confirmed', seatNumber: Number(confirmSeat) });
      setConfirmingReg(null);
      setConfirmSeat('');
    } catch (error) {
      console.error('Error confirming registration:', error);
      alert('Failed to confirm registration');
    }
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

  const pendingRegistrations = registrations.filter(r => r.status === 'pending');
  const formSentRegistrations = registrations.filter(r => r.status === 'form_sent');
  const confirmedRegistrations = registrations.filter(r => !['pending', 'form_sent'].includes(r.status));
  const sortedRegistrations = [...confirmedRegistrations].sort(
    (a, b) => (a.seatNumber || 999) - (b.seatNumber || 999)
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
                    setViewingParticipant(occupant);
                  } else {
                    setPreselectedSeat(seatNumber);
                    setShowAddModal(true);
                  }
                }}
              />
            </div>

            {/* Right Side - Participant List + Pending/Awaiting */}
            <div className="lg:col-span-1 flex flex-col gap-4">

              {/* Pending Approvals Section */}
              {pendingRegistrations.length > 0 && (
                <div className="bg-white rounded-xl border-2 border-yellow-300 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 rounded-full bg-yellow-400 animate-pulse" />
                    <h3 className="text-base font-bold text-gray-900">
                      Pending Approvals ({pendingRegistrations.length})
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {pendingRegistrations.map((reg) => (
                      <div key={reg.id} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 text-sm">{reg.firstName} {reg.lastName}</p>
                            <p className="text-xs text-gray-500 truncate">{reg.email}</p>
                            {reg.pickupLocation && <p className="text-xs text-gray-400 mt-0.5">📍 {reg.pickupLocation}</p>}
                          </div>
                          <button
                            onClick={() => handleToggleContacted(reg.id, reg.contacted)}
                            title={reg.contacted ? 'Contacted — click to unmark' : 'Not contacted yet'}
                            className="flex-shrink-0 flex flex-col items-center gap-0.5 p-1.5 rounded-lg transition-all hover:bg-yellow-100"
                          >
                            <Phone className="w-4 h-4" style={{ color: reg.contacted ? colors.success : '#9CA3AF' }} />
                            <span className="text-[9px] font-medium" style={{ color: reg.contacted ? colors.success : '#9CA3AF' }}>
                              {reg.phone}
                            </span>
                          </button>
                        </div>
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => handleSendForm(reg)}
                            className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-white rounded-lg hover:opacity-90 text-xs font-semibold"
                            style={{ backgroundColor: colors.success }}
                          >
                            <CheckCircle2 className="w-3 h-3" /> Send Form
                          </button>
                          <button
                            onClick={() => handleRejectPending(reg)}
                            className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-white rounded-lg hover:opacity-90 text-xs font-semibold"
                            style={{ backgroundColor: colors.button.danger }}
                          >
                            <XCircle className="w-3 h-3" /> Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Awaiting Form Section */}
              {formSentRegistrations.length > 0 && (
                <div className="bg-white rounded-xl border-2 border-orange-300 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 rounded-full bg-orange-400" />
                    <h3 className="text-base font-bold text-gray-900">
                      Awaiting Form Completion ({formSentRegistrations.length})
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {formSentRegistrations.map((reg) => (
                      <div key={reg.id} className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 text-sm">{reg.firstName} {reg.lastName}</p>
                            <p className="text-xs text-gray-500 truncate">{reg.email}</p>
                          </div>
                          <button
                            onClick={() => handleToggleContacted(reg.id, reg.contacted)}
                            title={reg.contacted ? 'Contacted — click to unmark' : 'Not contacted yet'}
                            className="flex-shrink-0 flex flex-col items-center gap-0.5 p-1.5 rounded-lg transition-all hover:bg-orange-100"
                          >
                            <Phone className="w-4 h-4" style={{ color: reg.contacted ? colors.success : '#9CA3AF' }} />
                            <span className="text-[9px] font-medium" style={{ color: reg.contacted ? colors.success : '#9CA3AF' }}>
                              {reg.phone}
                            </span>
                          </button>
                        </div>
                        <button
                          onClick={() => { setConfirmingReg(reg); setConfirmSeat(''); }}
                          className="w-full mt-2 flex items-center justify-center gap-1 px-2 py-1.5 text-white rounded-lg hover:opacity-90 text-xs font-semibold"
                          style={{ backgroundColor: colors.primary.teal }}
                        >
                          <CheckCircle2 className="w-3 h-3" /> Confirm Manually
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-gray-50 rounded-lg shadow-lg p-4 sm:p-6 border-2 border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5" style={{ color: colors.primary.teal }} />
                    <h3 className="text-lg sm:text-xl font-bold" style={{ color: colors.primary.black }}>
                      {t.participants} ({confirmedRegistrations.length})
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

                                  <div className="grid grid-cols-2 gap-2">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEditParticipant(reg);
                                      }}
                                      style={{ backgroundColor: colors.primary.teal }}
                                      className="w-full flex items-center justify-center gap-2 px-3 py-2 text-white text-sm rounded-lg hover:opacity-90 transition-opacity font-medium"
                                    >
                                      <Edit2 className="w-4 h-4" />
                                      <span>Edit</span>
                                    </button>

                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setInvoiceReg(reg);
                                      }}
                                      className="w-full flex items-center justify-center gap-2 px-3 py-2 text-white text-sm rounded-lg hover:opacity-90 transition-opacity font-medium"
                                      style={{ backgroundColor: '#6366F1' }}
                                    >
                                      <FileText className="w-4 h-4" />
                                      <span>Invoice</span>
                                    </button>

                                    <button
                                      onClick={(e) => handleSendItineraryLink(e, reg)}
                                      disabled={itineraryLoadingId === reg.id}
                                      className="w-full flex items-center justify-center gap-1 px-3 py-2 text-white text-sm rounded-lg hover:opacity-90 transition-all font-medium disabled:opacity-50"
                                      style={{ backgroundColor: itineraryCopiedId === reg.id ? colors.success : '#F59E0B' }}
                                      title="Copy itinerary link for this participant"
                                    >
                                      {itineraryLoadingId === reg.id ? (
                                        <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                      ) : itineraryCopiedId === reg.id ? '✅' : '🗺️'}
                                      <span>{itineraryCopiedId === reg.id ? 'Copied!' : 'Itinerary'}</span>
                                    </button>

                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteParticipant(reg.id);
                                      }}
                                      disabled={deletingId === reg.id}
                                      style={{ backgroundColor: colors.button.danger }}
                                      className="w-full flex items-center justify-center gap-2 px-3 py-2 text-white text-sm rounded-lg hover:opacity-90 transition-opacity font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* Confirm Manually Modal */}
      {confirmingReg && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]" onClick={() => setConfirmingReg(null)}>
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Confirm Registration</h2>
            <p className="text-gray-500 text-sm mb-4">{confirmingReg.firstName} {confirmingReg.lastName}</p>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assign Seat</label>
            <select
              value={confirmSeat}
              onChange={(e) => setConfirmSeat(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-teal-400"
            >
              <option value="">Select a seat...</option>
              {trip && Array.from({ length: getVehicleLayout(trip.vehicleLayout).totalSeats }, (_, i) => i + 1)
                .filter(n => !registrations.find(r => r.seatNumber === n && r.id !== confirmingReg.id))
                .map(n => <option key={n} value={n}>Seat {n}</option>)
              }
            </select>
            <div className="flex gap-2">
              <button
                onClick={handleConfirmManually}
                disabled={!confirmSeat}
                className="flex-1 py-2 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40"
                style={{ backgroundColor: colors.success }}
              >
                Confirm
              </button>
              <button
                onClick={() => setConfirmingReg(null)}
                className="flex-1 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* Invoice Modal */}
      {invoiceReg && (
        <InvoiceModal
          registration={invoiceReg}
          trip={trip}
          onClose={() => setInvoiceReg(null)}
        />
      )}

      {/* Participant Details Modal */}
      {viewingParticipant && (
        <ParticipantDetailsModal
          participant={viewingParticipant}
          onClose={() => setViewingParticipant(null)}
          onUpdate={() => {
            // Refresh is handled by the real-time listener
            setViewingParticipant(null);
          }}
        />
      )}
    </div>
  );
};

export default TripViewModal;
