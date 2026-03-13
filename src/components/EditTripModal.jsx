import { useState } from 'react';
import { X } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';
import colors from '../utils/colors';

const EditTripModal = ({ trip, onClose, onUpdate }) => {
  // Convert Firestore Timestamp to date string for input
  const getTripDate = () => {
    if (trip.date?.toDate) {
      const date = trip.date.toDate();
      return date.toISOString().split('T')[0];
    }
    return new Date().toISOString().split('T')[0];
  };

  const getTripEndDate = () => {
    if (trip.endDate?.toDate) {
      const date = trip.endDate.toDate();
      return date.toISOString().split('T')[0];
    }
    // If no end date exists, use start date (backwards compatibility)
    return getTripDate();
  };

  const [formData, setFormData] = useState({
    title: trip.title || '',
    date: getTripDate(),
    endDate: getTripEndDate(),
    vehicleLayout: trip.vehicleLayout || 'sprinter_15',
    driverName: trip.driverName || '',
    whatsappGroupLink: trip.whatsappGroupLink || '',
    status: trip.status || 'planned',
    showOnWebsite: trip.showOnWebsite || false,
    websiteImage: trip.websiteImage || '',
    websiteDescription: trip.websiteDescription || '',
    price: trip.price || '',
    showRegistrationCount: trip.showRegistrationCount || false,
    customInfo: trip.customInfo || ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Convert date string to Firestore Timestamp
      const updatedData = {
        ...formData,
        date: Timestamp.fromDate(new Date(formData.date)),
        endDate: Timestamp.fromDate(new Date(formData.endDate))
      };
      await onUpdate(trip.id, updatedData);
    } catch (error) {
      console.error('Error updating trip:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTripDuration = () => {
    const start = new Date(formData.date);
    const end = new Date(formData.endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4 z-50" onClick={onClose}>
      <div
        className="bg-white w-full sm:rounded-2xl shadow-2xl sm:max-w-2xl lg:max-w-4xl border-0 sm:border-4 max-h-[92vh] sm:max-h-[90vh] overflow-y-auto rounded-t-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{ borderColor: colors.primary.teal }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-500 to-teal-600 text-white px-5 py-4 rounded-t-2xl flex justify-between items-center sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-bold">Edit Trip</h2>
            <p className="text-teal-100 text-sm truncate max-w-[220px] sm:max-w-none">{formData.title}</p>
          </div>
          <button onClick={onClose} className="hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 lg:p-6">
          {/* ── Desktop: 2-column grid  |  Mobile: single column ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 lg:gap-x-8 gap-y-4">

            {/* ── Left column ── */}
            <div className="space-y-4">
              {/* Trip Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Trip Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00BCD4] focus:border-transparent"
                  placeholder="e.g., Beach Trip, Museum Visit"
                  required
                />
              </div>

              {/* Start + End dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Start Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => {
                      const newStart = e.target.value;
                      const endDate = new Date(newStart) > new Date(formData.endDate) ? newStart : formData.endDate;
                      setFormData({ ...formData, date: newStart, endDate });
                    }}
                    className="w-full px-3 py-2.5 border-2 rounded-lg focus:ring-2 focus:ring-[#00BCD4] focus:border-transparent hover:border-[#00BCD4] transition-colors"
                    style={{ borderColor: colors.primary.teal }}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">End Date</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    min={formData.date}
                    className="w-full px-3 py-2.5 border-2 rounded-lg focus:ring-2 focus:ring-[#00BCD4] focus:border-transparent hover:border-[#00BCD4] transition-colors"
                    style={{ borderColor: colors.primary.teal }}
                    required
                  />
                </div>
              </div>

              {/* Duration badge */}
              <div className="bg-teal-50 border-2 border-teal-200 rounded-lg px-4 py-2.5">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold" style={{ color: colors.primary.teal }}>Trip Duration: </span>
                  <span className="font-medium">{getTripDuration()} {getTripDuration() === 1 ? 'day' : 'days'}</span>
                  {getTripDuration() === 1 && <span className="text-xs text-gray-500 ml-2">(Single-day trip)</span>}
                </p>
              </div>
            </div>

            {/* ── Right column ── */}
            <div className="space-y-4">
              {/* Driver Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Driver Name</label>
                <input
                  type="text"
                  value={formData.driverName}
                  onChange={(e) => setFormData({ ...formData, driverName: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00BCD4] focus:border-transparent"
                  placeholder="e.g., John Smith"
                  required
                />
              </div>

              {/* Vehicle Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Vehicle Type</label>
                <select
                  value={formData.vehicleLayout}
                  onChange={(e) => setFormData({ ...formData, vehicleLayout: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00BCD4] focus:border-transparent"
                >
                  <option value="sprinter_15">Mercedes Sprinter Black (14 Seats)</option>
                  <option value="bus_30">Mercedes Sprinter White (11 Seats)</option>
                  <option value="highlander_7">Toyota Highlander (7 Seats)</option>
                </select>
              </div>

              {/* WhatsApp Link */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">WhatsApp Group Link <span className="font-normal text-gray-400">(optional)</span></label>
                <input
                  type="url"
                  value={formData.whatsappGroupLink}
                  onChange={(e) => setFormData({ ...formData, whatsappGroupLink: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00BCD4] focus:border-transparent"
                  placeholder="https://chat.whatsapp.com/..."
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Trip Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00BCD4] focus:border-transparent"
                >
                  <option value="planned">Planned (Yellow)</option>
                  <option value="scheduled">Scheduled (Purple)</option>
                  <option value="done">Done (Green)</option>
                </select>
              </div>
            </div>
          </div>

          {/* ── Full-width sections ── */}
          <div className="mt-5 space-y-4">

          {/* Show on Website Toggle */}
          <div className="border-2 rounded-lg overflow-hidden" style={{ borderColor: formData.showOnWebsite ? colors.primary.teal : '#E5E7EB' }}>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, showOnWebsite: !formData.showOnWebsite })}
              className="w-full flex items-center justify-between px-4 py-3 transition-colors"
              style={{ backgroundColor: formData.showOnWebsite ? '#E0F7FA' : '#F9FAFB' }}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">🌐</span>
                <div className="text-left">
                  <p className="font-semibold text-gray-800">Show on Website</p>
                  <p className="text-xs text-gray-500">Let visitors see and register for this trip on the landing page</p>
                </div>
              </div>
              <div className={`w-12 h-6 rounded-full transition-colors flex items-center px-1 ${formData.showOnWebsite ? '' : 'bg-gray-300'}`}
                style={formData.showOnWebsite ? { backgroundColor: colors.primary.teal } : {}}>
                <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${formData.showOnWebsite ? 'translate-x-6' : 'translate-x-0'}`} />
              </div>
            </button>

            {formData.showOnWebsite && (
              <div className="px-4 pb-4 pt-2 space-y-3 border-t border-teal-100">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Trip Image URL</label>
                  <input
                    type="url"
                    value={formData.websiteImage}
                    onChange={(e) => setFormData({ ...formData, websiteImage: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00BCD4] focus:border-transparent text-sm"
                    placeholder="https://images.unsplash.com/..."
                  />
                  {formData.websiteImage && (
                    <div className="mt-2 h-24 rounded-lg bg-cover bg-center border border-gray-200" style={{ backgroundImage: `url(${formData.websiteImage})` }} />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Trip Description</label>
                  <textarea
                    value={formData.websiteDescription}
                    onChange={(e) => setFormData({ ...formData, websiteDescription: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00BCD4] focus:border-transparent text-sm resize-vertical"
                    placeholder="Describe this trip for website visitors..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price per Person (C$)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00BCD4] focus:border-transparent text-sm"
                    placeholder="e.g. 120"
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Show registration count</p>
                    <p className="text-xs text-gray-500">Display how many spots are filled (e.g. 9/14)</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, showRegistrationCount: !formData.showRegistrationCount })}
                    className={`w-10 h-5 rounded-full transition-colors flex items-center px-0.5 flex-shrink-0 ${formData.showRegistrationCount ? '' : 'bg-gray-300'}`}
                    style={formData.showRegistrationCount ? { backgroundColor: colors.primary.teal } : {}}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${formData.showRegistrationCount ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Custom Trip Information */}
          <div className="border-2 rounded-lg p-4 space-y-2" style={{ borderColor: colors.primary.teal }}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">📋</span>
              <div>
                <p className="font-semibold text-gray-800">Custom Trip Information</p>
                <p className="text-xs text-gray-500">Participants must read and agree to this before registering. Shown on the invoice.</p>
              </div>
            </div>
            <textarea
              value={formData.customInfo}
              onChange={(e) => setFormData({ ...formData, customInfo: e.target.value })}
              rows={5}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00BCD4] focus:border-transparent text-sm resize-vertical"
              placeholder="Enter any trip-specific requirements, important notices, or terms participants must agree to before registering…"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{ backgroundColor: colors.primary.teal }}
              className="flex-1 px-4 py-3 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Updating...' : 'Update Trip'}
            </button>
          </div>
        </div>{/* end full-width sections */}
        </form>
      </div>
    </div>
  );
};

export default EditTripModal;
