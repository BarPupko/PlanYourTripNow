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
    status: trip.status || 'planned'
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
    <div className="fixed inset-0 bg-black bg-opacity-15 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border-4 border-teal-400" onClick={(e) => e.stopPropagation()} style={{ borderColor: colors.primary.teal }}>
        <div className="bg-gradient-to-r from-teal-500 to-teal-600 text-white px-6 py-4 rounded-t-xl flex justify-between items-center">
          <h2 className="text-xl font-bold">Edit Trip</h2>
          <button
            onClick={onClose}
            className="hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Trip Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Beach Trip, Museum Visit"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => {
                  const newStartDate = e.target.value;
                  // If new start date is after end date, update end date too
                  const endDate = new Date(newStartDate) > new Date(formData.endDate) ? newStartDate : formData.endDate;
                  setFormData({ ...formData, date: newStartDate, endDate });
                }}
                className="w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-[#00BCD4] focus:border-transparent hover:border-[#00BCD4] transition-colors"
                style={{ borderColor: colors.primary.teal }}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) =>
                  setFormData({ ...formData, endDate: e.target.value })
                }
                min={formData.date}
                className="w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-[#00BCD4] focus:border-transparent hover:border-[#00BCD4] transition-colors"
                style={{ borderColor: colors.primary.teal }}
                required
              />
            </div>
          </div>

          {/* Trip Duration Display */}
          <div className="bg-teal-50 border-2 border-teal-200 rounded-lg p-3">
            <p className="text-sm text-gray-700">
              <span className="font-semibold" style={{ color: colors.primary.teal }}>
                Trip Duration:
              </span>{' '}
              <span className="font-medium">
                {getTripDuration()} {getTripDuration() === 1 ? 'day' : 'days'}
              </span>
              {getTripDuration() === 1 && (
                <span className="text-xs text-gray-600 ml-2">(Single-day trip)</span>
              )}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Driver Name
            </label>
            <input
              type="text"
              value={formData.driverName}
              onChange={(e) =>
                setFormData({ ...formData, driverName: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00BCD4] focus:border-transparent"
              placeholder="e.g., John Smith"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vehicle Type
            </label>
            <select
              value={formData.vehicleLayout}
              onChange={(e) =>
                setFormData({ ...formData, vehicleLayout: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00BCD4] focus:border-transparent"
            >
              <option value="sprinter_15">Mercedes Sprinter Black (14 Seats)</option>
              <option value="bus_30">Mercedes Sprinter White (11 Seats)</option>
              <option value="highlander_7">Toyota Highlander (7 Seats)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              WhatsApp Group Link (Optional)
            </label>
            <input
              type="url"
              value={formData.whatsappGroupLink}
              onChange={(e) =>
                setFormData({ ...formData, whatsappGroupLink: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00BCD4] focus:border-transparent"
              placeholder="https://chat.whatsapp.com/..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Add a WhatsApp group link for trip participants to join
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Trip Status
            </label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00BCD4] focus:border-transparent"
            >
              <option value="planned">Planned (Yellow)</option>
              <option value="scheduled">Scheduled (Purple)</option>
              <option value="done">Done (Green)</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{ backgroundColor: colors.primary.teal }}
              className="flex-1 px-4 py-2 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Updating...' : 'Update Trip'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTripModal;
