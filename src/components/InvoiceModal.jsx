import { useRef } from 'react';
import { X, Printer, CheckCircle2, XCircle } from 'lucide-react';
import colors from '../utils/colors';

const InvoiceModal = ({ registration, trip, onClose }) => {
  const invoiceRef = useRef(null);

  const formatDate = (value) => {
    if (!value) return '-';
    try {
      const d = value?.toDate ? value.toDate() : new Date(value);
      return d.toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch { return '-'; }
  };

  const handlePrint = () => {
    const styles = `
      body { font-family: Arial, sans-serif; margin: 0; padding: 24px; color: #111; }
      h1 { font-size: 28px; color: #00BCD4; margin: 0 0 4px; }
      .subtitle { color: #666; font-size: 13px; margin-bottom: 24px; }
      hr { border: none; border-top: 2px solid #E5E7EB; margin: 16px 0; }
      .section-title { font-size: 11px; font-weight: bold; text-transform: uppercase;
        letter-spacing: 1px; color: #6B7280; margin-bottom: 8px; }
      .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 24px; }
      .field label { font-size: 10px; color: #9CA3AF; text-transform: uppercase;
        letter-spacing: 0.5px; display: block; margin-bottom: 2px; }
      .field p { font-size: 14px; color: #111; margin: 0; font-weight: 500; }
      .badge { display: inline-block; padding: 2px 10px; border-radius: 999px;
        font-size: 12px; font-weight: bold; }
      .badge-paid { background: #D1FAE5; color: #065F46; }
      .badge-unpaid { background: #FEE2E2; color: #991B1B; }
      .info-box { background: #FFFBEB; border: 1px solid #FCD34D; border-radius: 8px;
        padding: 12px; white-space: pre-wrap; font-size: 13px; color: #92400E;
        line-height: 1.6; margin-bottom: 8px; }
      .agree-row { display: flex; align-items: center; gap: 8px; font-size: 13px;
        color: #374151; margin-bottom: 4px; }
      .agree-row .check { color: #10B981; font-weight: bold; font-size: 15px; }
      .agree-row .cross { color: #EF4444; font-weight: bold; font-size: 15px; }
      .sig-box { border: 1px solid #D1D5DB; border-radius: 8px; padding: 8px;
        background: #F9FAFB; max-width: 320px; }
      .sig-box img { max-width: 100%; max-height: 100px; display: block; }
      .footer { margin-top: 32px; font-size: 11px; color: #9CA3AF; text-align: center; }
      .header-logo { font-size: 22px; font-weight: 900; color: #00BCD4; }
    `;

    const content = invoiceRef.current.innerHTML;
    const win = window.open('', '_blank');
    win.document.write(`<!DOCTYPE html><html><head><title>Invoice – ${registration.firstName} ${registration.lastName}</title><style>${styles}</style></head><body>${content}</body></html>`);
    win.document.close();
    win.focus();
    win.print();
  };

  const tripDate = formatDate(trip?.date);
  const tripEndDate = trip?.endDate ? formatDate(trip.endDate) : null;
  const dateDisplay = tripEndDate && tripEndDate !== tripDate
    ? `${tripDate} – ${tripEndDate}`
    : tripDate;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[70]"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{ borderTop: `4px solid ${colors.primary.teal}` }}
      >
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Participant Invoice</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
              style={{ backgroundColor: colors.primary.teal }}
            >
              <Printer className="w-4 h-4" />
              Print / Save PDF
            </button>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Invoice content (scrollable) */}
        <div className="overflow-y-auto p-6" ref={invoiceRef}>
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="text-2xl font-black" style={{ color: colors.primary.teal }}>IVRITours</div>
              <div className="text-sm text-gray-500">ivritours.ca</div>
            </div>
            <div className="text-right">
              <div className="text-xs uppercase tracking-widest text-gray-400 mb-1">Invoice</div>
              <div className="text-sm font-semibold text-gray-700">
                {registration.registrationDate
                  ? new Date(registration.registrationDate).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' })
                  : '-'}
              </div>
            </div>
          </div>

          <hr className="border-gray-200 mb-5" />

          {/* Trip */}
          <div className="mb-5">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Trip Details</p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              <div>
                <label className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold block mb-0.5">Trip</label>
                <p className="text-sm font-semibold text-gray-900">{trip?.title || '-'}</p>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold block mb-0.5">Date</label>
                <p className="text-sm font-semibold text-gray-900">{dateDisplay}</p>
              </div>
              {trip?.price && (
                <div>
                  <label className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold block mb-0.5">Price per Person</label>
                  <p className="text-sm font-semibold text-gray-900">C${trip.price}</p>
                </div>
              )}
              {trip?.deposit && (
                <div>
                  <label className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold block mb-0.5">Deposit Required</label>
                  <p className="text-sm font-semibold text-gray-900">C${trip.deposit}</p>
                </div>
              )}
              {trip?.price && trip?.deposit && Number(trip.deposit) < Number(trip.price) && (
                <div>
                  <label className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold block mb-0.5">Balance Due on Trip</label>
                  <p className="text-sm font-semibold text-gray-900">C${Number(trip.price) - Number(trip.deposit)}</p>
                </div>
              )}
              {trip?.driverName && (
                <div>
                  <label className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold block mb-0.5">Driver</label>
                  <p className="text-sm font-semibold text-gray-900">{trip.driverName}</p>
                </div>
              )}
            </div>
          </div>

          <hr className="border-gray-200 mb-5" />

          {/* Passenger */}
          <div className="mb-5">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Passenger Information</p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              <div>
                <label className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold block mb-0.5">Name</label>
                <p className="text-sm font-semibold text-gray-900">{registration.firstName} {registration.lastName}</p>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold block mb-0.5">Seat</label>
                <p className="text-sm font-semibold text-gray-900">Will be assigned upon arrival</p>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold block mb-0.5">Email</label>
                <p className="text-sm text-gray-700">{registration.email || '-'}</p>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold block mb-0.5">Phone</label>
                <p className="text-sm text-gray-700">{registration.phone || '-'}</p>
              </div>
              {registration.preferredPickupPlace && (
                <div>
                  <label className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold block mb-0.5">Pickup</label>
                  <p className="text-sm text-gray-700">{registration.preferredPickupPlace}</p>
                </div>
              )}
            </div>
          </div>

          <hr className="border-gray-200 mb-5" />

          {/* Payment */}
          <div className="mb-5">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Payment</p>
            <div className="flex items-center gap-4">
              <div>
                <label className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold block mb-0.5">Method</label>
                <p className="text-sm text-gray-900">
                  {registration.paymentMethod === 'card' ? '💳 Pay with Card' : '💵 Pay on Trip'}
                </p>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold block mb-0.5">Status</label>
                <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${registration.paid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'}`}>
                  {registration.paid
                    ? <><CheckCircle2 className="w-3 h-3" /> Paid</>
                    : <><XCircle className="w-3 h-3" /> Not Paid</>
                  }
                </span>
              </div>
            </div>
          </div>

          {/* Custom Trip Info */}
          {trip?.customInfo && (
            <>
              <hr className="border-gray-200 mb-5" />
              <div className="mb-5">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Trip-Specific Information</p>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-3">
                  <pre className="whitespace-pre-wrap text-sm text-amber-900 font-sans leading-relaxed">{trip.customInfo}</pre>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  {registration.agreedToCustomInfo
                    ? <><CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" /><span className="text-green-700 font-medium">Participant agreed to trip-specific information</span></>
                    : <><XCircle className="w-4 h-4 text-gray-400 flex-shrink-0" /><span className="text-gray-500">Agreement not recorded</span></>
                  }
                </div>
              </div>
            </>
          )}

          <hr className="border-gray-200 mb-5" />

          {/* Agreements */}
          <div className="mb-5">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Agreements</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                {registration.agreedToCancellationPolicy
                  ? <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                  : <XCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />
                }
                <span className={registration.agreedToCancellationPolicy ? 'text-gray-800' : 'text-gray-400'}>
                  Cancellation Policy
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                {registration.agreedToWaiver
                  ? <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                  : <XCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />
                }
                <span className={registration.agreedToWaiver ? 'text-gray-800' : 'text-gray-400'}>
                  Waiver of Liability
                </span>
              </div>
            </div>
          </div>

          {/* Signature */}
          {registration.signatureData && (
            <>
              <hr className="border-gray-200 mb-5" />
              <div className="mb-4">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Digital Signature</p>
                <div className="border-2 border-gray-200 rounded-lg p-3 bg-gray-50 inline-block">
                  <img
                    src={registration.signatureData}
                    alt="Participant signature"
                    className="max-h-24 max-w-xs"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Signed: {registration.registrationDate
                    ? new Date(registration.registrationDate).toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })
                    : '-'}
                </p>
              </div>
            </>
          )}

          <hr className="border-gray-200 mb-4" />
          <p className="text-xs text-center text-gray-400">
            IVRITours · This document serves as your official registration confirmation.
          </p>
        </div>
      </div>
    </div>
  );
};

export default InvoiceModal;
