import { useState, useEffect } from 'react';
import { X, Printer, Users } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import colors from '../utils/colors';

const BulkInvoicesModal = ({ trips, initialTrip, onClose }) => {
  const [selectedTrip, setSelectedTrip] = useState(initialTrip || null);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedTrip) return;
    setLoading(true);
    getDocs(query(collection(db, 'registrations'), where('tripId', '==', selectedTrip.id)))
      .then(snap => {
        const confirmed = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(r => !['pending', 'form_sent'].includes(r.status));
        setRegistrations(confirmed);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedTrip]);

  const formatDate = (value) => {
    if (!value) return '—';
    try {
      const d = value?.toDate ? value.toDate() : new Date(value);
      return d.toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch { return '—'; }
  };

  const buildInvoiceHTML = (reg, trip) => {
    const tripDate = formatDate(trip?.date);
    const tripEnd  = trip?.endDate ? formatDate(trip.endDate) : null;
    const dateDisplay = tripEnd && tripEnd !== tripDate ? `${tripDate} – ${tripEnd}` : tripDate;
    const regDate = reg.registrationDate
      ? new Date(reg.registrationDate).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' })
      : '—';

    return `
      <div style="padding:28px 32px; font-family:Arial,sans-serif; page-break-after:always;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;">
          <div>
            <div style="font-size:26px;font-weight:900;color:#00BCD4;letter-spacing:-0.5px;">IVRITours</div>
            <div style="font-size:12px;color:#9CA3AF;">ivritours.ca</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#D1D5DB;">Invoice</div>
            <div style="font-size:13px;font-weight:600;color:#374151;">${regDate}</div>
          </div>
        </div>
        <hr style="border:none;border-top:2px solid #E5E7EB;margin:0 0 20px;">

        <div style="margin-bottom:20px;">
          <p style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#9CA3AF;margin:0 0 12px;">Trip Details</p>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px 28px;">
            <div><span style="font-size:9px;text-transform:uppercase;color:#9CA3AF;display:block;margin-bottom:2px;">Trip</span><strong style="font-size:14px;color:#111;">${trip?.title || '—'}</strong></div>
            <div><span style="font-size:9px;text-transform:uppercase;color:#9CA3AF;display:block;margin-bottom:2px;">Date</span><strong style="font-size:14px;color:#111;">${dateDisplay}</strong></div>
            ${trip?.price ? `<div><span style="font-size:9px;text-transform:uppercase;color:#9CA3AF;display:block;margin-bottom:2px;">Price</span><strong style="font-size:14px;color:#111;">C$${trip.price}</strong></div>` : ''}
            ${trip?.driverName ? `<div><span style="font-size:9px;text-transform:uppercase;color:#9CA3AF;display:block;margin-bottom:2px;">Driver</span><strong style="font-size:14px;color:#111;">${trip.driverName}</strong></div>` : ''}
          </div>
        </div>
        <hr style="border:none;border-top:1px solid #E5E7EB;margin:0 0 20px;">

        <div style="margin-bottom:20px;">
          <p style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#9CA3AF;margin:0 0 12px;">Passenger</p>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px 28px;">
            <div><span style="font-size:9px;text-transform:uppercase;color:#9CA3AF;display:block;margin-bottom:2px;">Name</span><strong style="font-size:14px;color:#111;">${reg.firstName} ${reg.lastName}</strong></div>
            <div><span style="font-size:9px;text-transform:uppercase;color:#9CA3AF;display:block;margin-bottom:2px;">Seat</span><span style="font-size:13px;color:#374151;">${reg.seatNumber ? `Seat ${reg.seatNumber}` : 'Assigned upon arrival'}</span></div>
            <div><span style="font-size:9px;text-transform:uppercase;color:#9CA3AF;display:block;margin-bottom:2px;">Email</span><span style="font-size:13px;color:#374151;">${reg.email || '—'}</span></div>
            <div><span style="font-size:9px;text-transform:uppercase;color:#9CA3AF;display:block;margin-bottom:2px;">Phone</span><span style="font-size:13px;color:#374151;">${reg.phone || '—'}</span></div>
            ${reg.preferredPickupPlace ? `<div><span style="font-size:9px;text-transform:uppercase;color:#9CA3AF;display:block;margin-bottom:2px;">Pickup</span><span style="font-size:13px;color:#374151;">${reg.preferredPickupPlace}</span></div>` : ''}
          </div>
        </div>
        <hr style="border:none;border-top:1px solid #E5E7EB;margin:0 0 20px;">

        <div style="margin-bottom:20px;">
          <p style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#9CA3AF;margin:0 0 12px;">Payment</p>
          <div style="display:flex;align-items:center;gap:32px;">
            <div><span style="font-size:9px;text-transform:uppercase;color:#9CA3AF;display:block;margin-bottom:2px;">Method</span><span style="font-size:13px;color:#374151;">${reg.paymentMethod === 'card' ? '💳 Card' : '💵 Pay on Trip'}</span></div>
            <div><span style="font-size:9px;text-transform:uppercase;color:#9CA3AF;display:block;margin-bottom:2px;">Status</span>
              <span style="display:inline-block;padding:3px 12px;border-radius:999px;font-size:12px;font-weight:700;${reg.paid ? 'background:#D1FAE5;color:#065F46;' : 'background:#FEE2E2;color:#991B1B;'}">${reg.paid ? '✓ Paid' : '✗ Not Paid'}</span>
            </div>
          </div>
        </div>

        ${trip?.customInfo ? `
          <hr style="border:none;border-top:1px solid #E5E7EB;margin:0 0 20px;">
          <div style="margin-bottom:20px;">
            <p style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#9CA3AF;margin:0 0 12px;">Trip Information</p>
            <div style="background:#FFFBEB;border:1px solid #FCD34D;border-radius:8px;padding:12px;white-space:pre-wrap;font-size:13px;color:#92400E;line-height:1.6;">${trip.customInfo}</div>
          </div>
        ` : ''}

        <hr style="border:none;border-top:1px solid #E5E7EB;margin:0 0 14px;">
        <p style="font-size:10px;text-align:center;color:#9CA3AF;margin:0;">IVRITours · This document serves as your official registration confirmation.</p>
      </div>`;
  };

  const handlePrintAll = () => {
    if (!selectedTrip || registrations.length === 0) return;
    const html = registrations.map(r => buildInvoiceHTML(r, selectedTrip)).join('');
    const win = window.open('', '_blank');
    win.document.write(`<!DOCTYPE html><html><head><title>All Invoices – ${selectedTrip.title}</title><style>body{margin:0;padding:0;}@media print{@page{margin:8mm;}}</style></head><body>${html}</body></html>`);
    win.document.close();
    win.focus();
    win.print();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-end sm:items-center justify-center z-[70]" onClick={onClose}>
      <div
        className="bg-white w-full sm:rounded-2xl sm:max-w-lg max-h-[90vh] sm:max-h-[85vh] overflow-hidden flex flex-col shadow-2xl"
        onClick={e => e.stopPropagation()}
        style={{ borderTop: `4px solid ${colors.primary.teal}` }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${colors.primary.teal}20` }}>
              <Users className="w-5 h-5" style={{ color: colors.primary.teal }} />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Download Invoices</h2>
              {selectedTrip && <p className="text-xs text-gray-500">{selectedTrip.title} · {registrations.length} participants</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintAll}
              disabled={!selectedTrip || loading || registrations.length === 0}
              className="flex items-center gap-2 px-4 py-2.5 text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ backgroundColor: colors.primary.teal }}
            >
              <Printer className="w-4 h-4" />
              <span>Print All</span>
            </button>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Trip selector */}
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Select Trip</label>
          <select
            value={selectedTrip?.id || ''}
            onChange={e => {
              const t = trips.find(t => t.id === e.target.value) || null;
              setSelectedTrip(t);
              setRegistrations([]);
            }}
            className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-medium focus:border-teal-400 focus:outline-none bg-white"
          >
            <option value="">— Choose a trip —</option>
            {trips.map(t => {
              const d = t.date?.toDate?.() || new Date(t.date);
              return (
                <option key={t.id} value={t.id}>
                  {t.title} — {d.toLocaleDateString('en-CA')}
                </option>
              );
            })}
          </select>
        </div>

        {/* Participants list */}
        <div className="overflow-y-auto flex-1 p-5">
          {!selectedTrip ? (
            <div className="text-center py-10 text-gray-400">
              <Printer className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Select a trip to view invoices</p>
            </div>
          ) : loading ? (
            <div className="text-center py-10">
              <div className="inline-block w-8 h-8 border-3 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${colors.primary.teal} transparent ${colors.primary.teal} ${colors.primary.teal}` }} />
            </div>
          ) : registrations.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <p className="font-medium">No confirmed participants</p>
              <p className="text-sm mt-1">Invoices are generated for confirmed participants only</p>
            </div>
          ) : (
            <div className="space-y-2">
              {registrations.map(reg => (
                <div key={reg.id} className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0" style={{ backgroundColor: colors.primary.teal }}>
                      {(reg.firstName?.[0] || '?').toUpperCase()}{(reg.lastName?.[0] || '').toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm leading-tight">{reg.firstName} {reg.lastName}</p>
                      <p className="text-xs text-gray-400">{reg.email}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${reg.paid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                    {reg.paid ? '✓ Paid' : '✗ Unpaid'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkInvoicesModal;
