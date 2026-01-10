import { useState } from 'react';
import { X, Check } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';
import colors from '../utils/colors';

const CreateTripModal = ({ selectedDate, onClose, onCreate }) => {
  const [formData, setFormData] = useState({
    title: '',
    vehicleLayout: 'sprinter_15',
    driverName: '',
    whatsappGroupLink: '',
    status: 'planned',
    date: selectedDate,
    customSeats: []
  });
  const [loading, setLoading] = useState(false);
  const [showCustomSeats, setShowCustomSeats] = useState(false);

  // Generate seat options (1-50)
  const availableSeats = Array.from({ length: 50 }, (_, i) => i + 1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const tripData = {
        ...formData,
        date: Timestamp.fromDate(formData.date)
      };

      // If custom layout is selected, use customSeats
      if (formData.vehicleLayout === 'custom' && formData.customSeats.length > 0) {
        tripData.vehicleLayout = `custom_${formData.customSeats.length}`;
        tripData.customSeats = formData.customSeats;
      }

      await onCreate(tripData);
    } catch (error) {
      console.error('Error creating trip:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (e) => {
    const newDate = new Date(e.target.value);
    setFormData({ ...formData, date: newDate });
  };

  const formatDateForInput = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleVehicleChange = (e) => {
    const value = e.target.value;
    setFormData({ ...formData, vehicleLayout: value });
    setShowCustomSeats(value === 'custom');
  };

  const toggleSeat = (seatNumber) => {
    const currentSeats = [...formData.customSeats];
    const index = currentSeats.indexOf(seatNumber);

    if (index > -1) {
      // Remove seat
      currentSeats.splice(index, 1);
    } else {
      // Add seat and sort
      currentSeats.push(seatNumber);
      currentSeats.sort((a, b) => a - b);
    }

    setFormData({ ...formData, customSeats: currentSeats });
  };

  const selectAllSeats = () => {
    setFormData({ ...formData, customSeats: [...availableSeats] });
  };

  const clearAllSeats = () => {
    setFormData({ ...formData, customSeats: [] });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-15 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border-4 border-teal-400 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()} style={{ borderColor: colors.primary.teal }}>
        <div className="bg-gradient-to-r from-teal-500 to-teal-600 text-white px-6 py-4 rounded-t-xl flex justify-between items-center sticky top-0 z-10">
          <h2 className="text-xl font-bold">Create New Trip</h2>
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date
            </label>
            <input
              type="date"
              value={formatDateForInput(formData.date)}
              onChange={handleDateChange}
              className="w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-[#00BCD4] focus:border-transparent hover:border-[#00BCD4] transition-colors cursor-pointer"
              style={{ borderColor: colors.primary.teal }}
              required
            />
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
              onChange={handleVehicleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00BCD4] focus:border-transparent"
            >
              <option value="sprinter_15">Mercedes Sprinter Black (14 Seats)</option>
              <option value="bus_30">Mercedes Sprinter White (11 Seats)</option>
              <option value="highlander_7">Toyota Highlander (7 Seats)</option>
              <option value="custom">Custom Seat Selection</option>
            </select>
          </div>

          {/* Custom Seat Selection */}
          {showCustomSeats && (
            <div className="border-2 rounded-lg p-4" style={{ borderColor: colors.primary.teal }}>
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-medium text-gray-700">
                  Select Seats ({formData.customSeats.length} selected)
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={selectAllSeats}
                    className="text-xs px-3 py-1 rounded-lg text-white hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: colors.primary.teal }}
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={clearAllSeats}
                    className="text-xs px-3 py-1 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-10 gap-2 max-h-64 overflow-y-auto p-2 bg-gray-50 rounded">
                {availableSeats.map((seat) => {
                  const isSelected = formData.customSeats.includes(seat);
                  return (
                    <button
                      key={seat}
                      type="button"
                      onClick={() => toggleSeat(seat)}
                      className={`relative h-10 rounded-lg text-sm font-medium transition-all ${
                        isSelected
                          ? 'text-white shadow-md'
                          : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-teal-300'
                      }`}
                      style={isSelected ? { backgroundColor: colors.primary.teal } : {}}
                    >
                      {seat}
                      {isSelected && (
                        <Check className="w-3 h-3 absolute top-0.5 right-0.5" />
                      )}
                    </button>
                  );
                })}
              </div>

              {formData.customSeats.length === 0 && (
                <p className="text-xs text-red-600 mt-2">
                  Please select at least one seat
                </p>
              )}
            </div>
          )}

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
              disabled={loading || (showCustomSeats && formData.customSeats.length === 0)}
              style={{ backgroundColor: colors.primary.teal }}
              className="flex-1 px-4 py-2 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Trip'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTripModal;
