import { useState, useEffect } from 'react';
import { X, Users, UserPlus, CheckCircle2, XCircle, CreditCard, Banknote, ChevronDown, ChevronUp, Edit2, Trash2, Copy, Check, MessageCircle, Phone, FileText, Printer, Send } from 'lucide-react';
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { db, functions } from '../firebase';
import { httpsCallable } from 'firebase/functions';
import { getTrip, updateRegistration, deleteRegistration, ensureCompanionToken, updateTrip, getFeedbackByTrip } from '../utils/firestoreUtils';
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
  const [editingTime, setEditingTime] = useState(false);
  const [timeFormData, setTimeFormData] = useState({ startTime: '', endTime: '' });

  const [feedbacks, setFeedbacks] = useState([]);
  const [sendingReminder, setSendingReminder] = useState(false);
  const [reminderResult, setReminderResult] = useState(null); // { sent: number } | 'error'
  const [showGroupPanel, setShowGroupPanel] = useState(false);
  const [copiedGroupNumbers, setCopiedGroupNumbers] = useState(false);

  const handleSendReminder = async () => {
    setSendingReminder(true);
    setReminderResult(null);
    try {
      const fn = httpsCallable(functions, 'sendFeedbackReminder');
      const result = await fn({ tripId });
      setReminderResult({ sent: result.data.sent });
      // Refresh feedbacks after sending
      getFeedbackByTrip(tripId).then(setFeedbacks).catch(() => {});
    } catch (err) {
      console.error('sendFeedbackReminder error:', err);
      setReminderResult('error');
    } finally {
      setSendingReminder(false);
    }
  };

  useEffect(() => {
    loadTrip();
    const unsubscribe = subscribeToRegistrations();
    return () => unsubscribe && unsubscribe();
  }, [tripId]);

  useEffect(() => {
    if (trip?.status === 'done') {
      getFeedbackByTrip(trip.id).then(setFeedbacks).catch(() => {});
    }
  }, [trip]);

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

  const getGroupPhoneNumbers = () => {
    return confirmedRegistrations
      .filter(r => r.phone)
      .map(r => {
        const cleaned = r.phone.replace(/\D/g, '');
        return { name: `${r.firstName} ${r.lastName}`, phone: cleaned, raw: r.phone };
      });
  };

  const handleCopyGroupNumbers = () => {
    const numbers = getGroupPhoneNumbers().map(p => p.phone).join('\n');
    navigator.clipboard.writeText(numbers).then(() => {
      setCopiedGroupNumbers(true);
      setTimeout(() => setCopiedGroupNumbers(false), 2000);
    }).catch(() => alert('Failed to copy'));
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
      phone: registration.phone,
      seatNumber: registration.seatNumber ?? ''
    });
  };

  const handleSaveEdit = async (registrationId) => {
    try {
      const currentReg = registrations.find(r => r.id === registrationId);
      const newSeat = editFormData.seatNumber === '' ? null : Number(editFormData.seatNumber);
      const { seatNumber: _seat, ...contactFields } = editFormData;

      const occupant = newSeat
        ? registrations.find(r => r.seatNumber === newSeat && r.id !== registrationId)
        : null;

      if (occupant) {
        await Promise.all([
          updateRegistration(registrationId, { ...contactFields, seatNumber: newSeat }),
          updateRegistration(occupant.id, { seatNumber: currentReg?.seatNumber ?? null })
        ]);
      } else {
        await updateRegistration(registrationId, { ...contactFields, seatNumber: newSeat });
      }

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

  const handleOpenTimeEdit = () => {
    const getTime = (ts) => {
      if (!ts) return '';
      try {
        const d = ts?.toDate ? ts.toDate() : new Date(ts);
        return d.toTimeString().slice(0, 5);
      } catch { return ''; }
    };
    setTimeFormData({
      startTime: getTime(trip.startDateTime) || getTime(trip.date) || '08:00',
      endTime: getTime(trip.endDateTime) || '18:00'
    });
    setEditingTime(true);
  };

  const handleSaveTime = async () => {
    try {
      const baseDate = (trip.startDateTime || trip.date)?.toDate?.() ?? new Date();
      const [sh, sm] = timeFormData.startTime.split(':').map(Number);
      const [eh, em] = timeFormData.endTime.split(':').map(Number);
      const start = new Date(baseDate);
      start.setHours(sh, sm, 0, 0);
      const end = new Date(baseDate);
      end.setHours(eh, em, 0, 0);
      await updateTrip(tripId, {
        startDateTime: Timestamp.fromDate(start),
        endDateTime: Timestamp.fromDate(end)
      });
      await loadTrip();
      setEditingTime(false);
    } catch (error) {
      console.error('Error updating trip time:', error);
      alert('Failed to update time. Please try again.');
    }
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

  const COMPANION_BASE_URL = 'https://barpupko.github.io/PlanYourTripNow/companion/';

  const handleSendItineraryLink = async (e, reg) => {
    e.stopPropagation();
    setItineraryLoadingId(reg.id);
    try {
      const token = await ensureCompanionToken(reg.id);
      const url   = `${COMPANION_BASE_URL}?token=${token}`;
      const msg   = `Hi ${reg.firstName}! 👋\nHere is your personal IVRITours itinerary link:\n${url}\nOpen it on your phone to follow the live schedule. See you soon! 🚌`;
      await navigator.clipboard.writeText(msg);
      setItineraryLoadingId(null);
      setItineraryCopiedId(reg.id);
      setTimeout(() => setItineraryCopiedId(null), 3000);
    } catch (err) {
      console.error('Failed to generate itinerary link:', err);
      setItineraryLoadingId(null);
    }
  };

  const printAllInvoices = () => {
    if (!trip || confirmedRegistrations.length === 0) return;

    const fmt = (v) => {
      if (!v) return '-';
      try { const d = v?.toDate ? v.toDate() : new Date(v); return d.toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' }); }
      catch { return '-'; }
    };
    const tripDate = fmt(trip.date);
    const tripEnd  = trip.endDate ? fmt(trip.endDate) : null;
    const dateLine = tripEnd && tripEnd !== tripDate ? `${tripDate} – ${tripEnd}` : tripDate;

    const invoiceHTML = (reg) => {
      const regDate = reg.registrationDate
        ? new Date(reg.registrationDate).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' }) : '-';
      return `<div style="padding:28px 32px;font-family:Arial,sans-serif;page-break-after:always;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;">
          <div><div style="font-size:26px;font-weight:900;color:#00BCD4;">IVRITours</div><div style="font-size:12px;color:#9CA3AF;">ivritours.ca</div></div>
          <div style="text-align:right;"><div style="font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#D1D5DB;">Invoice</div><div style="font-size:13px;font-weight:600;color:#374151;">${regDate}</div></div>
        </div>
        <hr style="border:none;border-top:2px solid #E5E7EB;margin:0 0 18px;">
        <div style="margin-bottom:18px;"><p style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#9CA3AF;margin:0 0 10px;">Trip Details</p>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px 24px;">
            <div><span style="font-size:9px;text-transform:uppercase;color:#9CA3AF;display:block;margin-bottom:2px;">Trip</span><strong style="font-size:14px;color:#111;">${trip.title}</strong></div>
            <div><span style="font-size:9px;text-transform:uppercase;color:#9CA3AF;display:block;margin-bottom:2px;">Date</span><strong style="font-size:14px;color:#111;">${dateLine}</strong></div>
            ${trip.price ? `<div><span style="font-size:9px;text-transform:uppercase;color:#9CA3AF;display:block;margin-bottom:2px;">Price</span><strong style="font-size:14px;color:#111;">C$${trip.price}</strong></div>` : ''}
            ${trip.driverName ? `<div><span style="font-size:9px;text-transform:uppercase;color:#9CA3AF;display:block;margin-bottom:2px;">Driver</span><strong style="font-size:14px;color:#111;">${trip.driverName}</strong></div>` : ''}
          </div></div>
        <hr style="border:none;border-top:1px solid #E5E7EB;margin:0 0 18px;">
        <div style="margin-bottom:18px;"><p style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#9CA3AF;margin:0 0 10px;">Passenger</p>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px 24px;">
            <div><span style="font-size:9px;text-transform:uppercase;color:#9CA3AF;display:block;margin-bottom:2px;">Name</span><strong style="font-size:14px;color:#111;">${reg.firstName} ${reg.lastName}</strong></div>
            <div><span style="font-size:9px;text-transform:uppercase;color:#9CA3AF;display:block;margin-bottom:2px;">Seat</span><span style="font-size:13px;color:#374151;">${reg.seatNumber ? `Seat ${reg.seatNumber}` : 'Assigned upon arrival'}</span></div>
            <div><span style="font-size:9px;text-transform:uppercase;color:#9CA3AF;display:block;margin-bottom:2px;">Email</span><span style="font-size:13px;color:#374151;">${reg.email || '-'}</span></div>
            <div><span style="font-size:9px;text-transform:uppercase;color:#9CA3AF;display:block;margin-bottom:2px;">Phone</span><span style="font-size:13px;color:#374151;">${reg.phone || '-'}</span></div>
          </div></div>
        <hr style="border:none;border-top:1px solid #E5E7EB;margin:0 0 18px;">
        <div style="margin-bottom:18px;"><p style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#9CA3AF;margin:0 0 10px;">Payment</p>
          <div style="display:flex;gap:32px;">
            <div><span style="font-size:9px;text-transform:uppercase;color:#9CA3AF;display:block;margin-bottom:2px;">Method</span><span style="font-size:13px;color:#374151;">${reg.paymentMethod === 'card' ? '💳 Card' : '💵 Pay on Trip'}</span></div>
            <div><span style="font-size:9px;text-transform:uppercase;color:#9CA3AF;display:block;margin-bottom:2px;">Status</span><span style="display:inline-block;padding:3px 12px;border-radius:999px;font-size:12px;font-weight:700;${reg.paid ? 'background:#D1FAE5;color:#065F46;' : 'background:#FEE2E2;color:#991B1B;'}">${reg.paid ? '✓ Paid' : '✗ Not Paid'}</span></div>
          </div></div>
        <hr style="border:none;border-top:1px solid #E5E7EB;margin:0 0 12px;">
        <p style="font-size:10px;text-align:center;color:#9CA3AF;margin:0;">IVRITours · Official registration confirmation.</p>
      </div>`;
    };

    const html = confirmedRegistrations.map(invoiceHTML).join('');
    const win = window.open('', '_blank');
    win.document.write(`<!DOCTYPE html><html><head><title>All Invoices – ${trip.title}</title><style>body{margin:0;}@media print{@page{margin:8mm;}}</style></head><body>${html}</body></html>`);
    win.document.close();
    win.focus();
    win.print();
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
            {editingTime ? (
              <div className="flex items-center gap-2 mt-1" onClick={e => e.stopPropagation()}>
                <input
                  type="time"
                  value={timeFormData.startTime}
                  onChange={e => setTimeFormData(p => ({ ...p, startTime: e.target.value }))}
                  className="text-gray-800 text-sm rounded px-1 py-0.5"
                />
                <span className="text-teal-200 text-xs">–</span>
                <input
                  type="time"
                  value={timeFormData.endTime}
                  onChange={e => setTimeFormData(p => ({ ...p, endTime: e.target.value }))}
                  className="text-gray-800 text-sm rounded px-1 py-0.5"
                />
                <button onClick={handleSaveTime} className="text-xs bg-white text-teal-700 font-semibold px-2 py-0.5 rounded hover:bg-teal-50">Save</button>
                <button onClick={() => setEditingTime(false)} className="text-xs text-teal-200 hover:text-white">Cancel</button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <p className="text-sm text-teal-100">
                  {(() => {
                    const d = (trip.startDateTime || trip.date)?.toDate?.();
                    if (!d) return '';
                    const dateStr = d.toLocaleDateString();
                    const timeStr = trip.startDateTime
                      ? ` · ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}${trip.endDateTime ? ` – ${trip.endDateTime.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}`
                      : '';
                    return dateStr + timeStr;
                  })()}
                </p>
                <button
                  onClick={handleOpenTimeEdit}
                  className="p-0.5 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
                  title="Edit trip time"
                >
                  <Edit2 className="w-3.5 h-3.5 text-teal-200" />
                </button>
              </div>
            )}
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
                            title={reg.contacted ? 'Contacted - click to unmark' : 'Not contacted yet'}
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
                            title={reg.contacted ? 'Contacted - click to unmark' : 'Not contacted yet'}
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
                <div className="flex items-center justify-between mb-4 gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Users className="w-5 h-5 flex-shrink-0" style={{ color: colors.primary.teal }} />
                    <h3 className="text-base sm:text-xl font-bold truncate" style={{ color: colors.primary.black }}>
                      {t.participants} ({confirmedRegistrations.length})
                    </h3>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {confirmedRegistrations.length > 0 && (
                      <button
                        onClick={printAllInvoices}
                        className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg border-2 text-xs font-semibold hover:bg-purple-50 transition-colors"
                        style={{ borderColor: '#6366F1', color: '#6366F1' }}
                        title="Print all invoices"
                      >
                        <Printer className="w-4 h-4" />
                        <span className="hidden sm:inline">All Invoices</span>
                      </button>
                    )}
                    <button
                      onClick={() => setShowAddModal(true)}
                      style={{ backgroundColor: colors.primary.teal }}
                      className="flex items-center gap-1.5 px-2.5 py-2 text-white rounded-lg hover:opacity-90 transition-opacity text-xs sm:text-sm font-semibold"
                      title={t.addParticipant}
                    >
                      <UserPlus className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="hidden sm:inline">{t.add}</span>
                    </button>
                  </div>
                </div>

                {/* WhatsApp Buttons */}
                {registrations.length > 0 && (
                  <div className="mb-4 space-y-2">
                    <div className="flex gap-2">
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
                      <button
                        onClick={() => setShowGroupPanel(prev => !prev)}
                        style={{ backgroundColor: showGroupPanel ? '#128C7E' : '#075E54' }}
                        className="flex items-center justify-center gap-2 px-3 py-3 text-white rounded-lg hover:opacity-90 transition-all font-medium"
                        title="Create a new WhatsApp group with registered participants"
                      >
                        <Users className="w-5 h-5" />
                        <span className="hidden sm:inline text-sm">New Group</span>
                      </button>
                    </div>

                    {/* New Group Panel */}
                    {showGroupPanel && (() => {
                      const groupNumbers = getGroupPhoneNumbers();
                      return (
                        <div className="rounded-xl border-2 border-[#128C7E] bg-[#f0faf8] p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#128C7E' }}>
                                <Users className="w-4 h-4 text-white" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-gray-900">Create WhatsApp Group</p>
                                <p className="text-xs text-gray-500">{groupNumbers.length} registered participant{groupNumbers.length !== 1 ? 's' : ''}</p>
                              </div>
                            </div>
                            <button
                              onClick={handleCopyGroupNumbers}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-semibold hover:opacity-90 transition-all"
                              style={{ backgroundColor: copiedGroupNumbers ? colors.success : '#128C7E' }}
                            >
                              {copiedGroupNumbers ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                              {copiedGroupNumbers ? 'Copied!' : 'Copy Numbers'}
                            </button>
                          </div>

                          <div className="bg-white rounded-lg border border-[#25D366]/30 divide-y divide-gray-100 max-h-48 overflow-y-auto">
                            {groupNumbers.length === 0 ? (
                              <p className="text-xs text-gray-400 text-center py-3">No phone numbers available</p>
                            ) : groupNumbers.map((p, i) => (
                              <div key={i} className="flex items-center justify-between px-3 py-2">
                                <span className="text-sm font-medium text-gray-800">{p.name}</span>
                                <a
                                  href={`https://wa.me/${p.phone}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex items-center gap-1 text-xs font-mono text-[#128C7E] hover:underline"
                                >
                                  <Phone className="w-3 h-3" />
                                  {p.raw}
                                </a>
                              </div>
                            ))}
                          </div>

                          <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
                            <span className="text-yellow-500 text-base leading-none mt-0.5">ℹ️</span>
                            <p className="text-xs text-yellow-800">
                              Copy the numbers above, then open WhatsApp → <strong>New Group</strong> and add the contacts. WhatsApp does not support automatic group creation from the web.
                            </p>
                          </div>

                          <a
                            href="https://web.whatsapp.com"
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-white text-sm font-semibold hover:opacity-90 transition-all"
                            style={{ backgroundColor: '#25D366' }}
                          >
                            <MessageCircle className="w-4 h-4" />
                            Open WhatsApp Web
                          </a>
                        </div>
                      );
                    })()}
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
                                <div>
                                  <label className="text-xs font-medium text-gray-500">Seat Number</label>
                                  <select
                                    value={editFormData.seatNumber}
                                    onChange={(e) => setEditFormData({ ...editFormData, seatNumber: e.target.value })}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                  >
                                    <option value="">No Seat</option>
                                    {trip && Array.from({ length: getVehicleLayout(trip.vehicleLayout).totalSeats }, (_, i) => i + 1).map(n => {
                                      const occupant = registrations.find(r => r.seatNumber === n && r.id !== reg.id);
                                      return (
                                        <option key={n} value={n}>
                                          Seat {n}{occupant ? ` (swap with ${occupant.firstName} ${occupant.lastName})` : ''}
                                        </option>
                                      );
                                    })}
                                  </select>
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

              {/* Feedback Panel - visible only for completed trips */}
              {trip.status === 'done' && (
                <div className="bg-white rounded-xl border-2 p-4" style={{ borderColor: '#f59e0b' }}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                      ⭐ Feedback
                      <span className="text-xs font-normal text-gray-400">
                        ({feedbacks.length} response{feedbacks.length !== 1 ? 's' : ''})
                      </span>
                    </h3>
                    <button
                      onClick={handleSendReminder}
                      disabled={sendingReminder}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                      style={{ backgroundColor: colors.primary.teal }}
                      title="Send feedback reminder to participants who haven't responded"
                    >
                      <Send className="w-3 h-3" />
                      {sendingReminder ? 'Sending…' : 'Send Reminder'}
                    </button>
                  </div>

                  {reminderResult && (
                    <p className={`text-xs mb-3 px-3 py-2 rounded-lg ${reminderResult === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
                      {reminderResult === 'error'
                        ? 'Failed to send. Please try again.'
                        : reminderResult.sent === 0
                          ? 'Everyone has already submitted their feedback!'
                          : `Reminder sent to ${reminderResult.sent} participant${reminderResult.sent !== 1 ? 's' : ''}.`
                      }
                    </p>
                  )}

                  {feedbacks.length === 0 ? (
                    <p className="text-sm text-gray-400">No feedback received yet.</p>
                  ) : (
                    <>
                      {/* Averages per category */}
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        {[
                          { key: 'overall',   label: 'Overall' },
                          { key: 'guide',     label: 'Guide' },
                          { key: 'transport', label: 'Transport' },
                          { key: 'value',     label: 'Value' },
                        ].map(({ key, label }) => {
                          const avg = feedbacks.reduce((s, f) => s + (f.ratings?.[key] || 0), 0) / feedbacks.length;
                          return (
                            <div key={key} className="bg-amber-50 rounded-lg px-3 py-2 flex items-center justify-between">
                              <span className="text-xs text-gray-500">{label}</span>
                              <span className="text-sm font-bold text-amber-500">{avg.toFixed(1)} ★</span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Individual responses */}
                      <div className="space-y-2 max-h-52 overflow-y-auto">
                        {feedbacks.map(fb => (
                          <div key={fb.id} className="p-2 bg-gray-50 rounded-lg">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-gray-800">{fb.firstName} {fb.lastName}</span>
                              <span className="text-amber-400 text-xs">
                                {'★'.repeat(fb.ratings?.overall || 0)}{'☆'.repeat(5 - (fb.ratings?.overall || 0))}
                              </span>
                            </div>
                            {fb.wouldRecommend && (
                              <p className="text-xs text-gray-400 mt-0.5">
                                Recommends: {fb.wouldRecommend === 'yes' ? '😍 Yes' : fb.wouldRecommend === 'maybe' ? '🤔 Maybe' : '😕 No'}
                              </p>
                            )}
                            {fb.comment && (
                              <p className="text-xs text-gray-500 mt-1 italic">"{fb.comment}"</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

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
          registrations={registrations}
          totalSeats={trip ? getVehicleLayout(trip.vehicleLayout).totalSeats : 0}
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
