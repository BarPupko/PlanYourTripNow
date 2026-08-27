import { useState, useEffect } from 'react';
import { X, Check, HelpCircle } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';
import colors from '../utils/colors';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../utils/translations';
import { hasSeenCreateTripTour, startCreateTripTour } from '../utils/tour';

const PRESET_PICKUP_LOCATIONS = [
  'Yummy Market North',
  'Bathurst/Centre - Walmart Store',
  'Bathurst/Steeles - Metro Plaza',
  'Bathurst/Finch - Shell Gas Station',
  'Bathurst/Sheppard - Metro Plaza',
  'Sheppard West',
];

const CreateTripModal = ({ selectedDate, onClose, onCreate }) => {
  const { language } = useLanguage();
  const t = translations[language];

  useEffect(() => {
    if (!hasSeenCreateTripTour()) {
      const timer = setTimeout(() => startCreateTripTour(t), 400);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [formData, setFormData] = useState({
    title: '',
    vehicleLayout: 'sprinter_15',
    driverName: '',
    pickupPlace: '',
    whatsappGroupLink: '',
    status: 'planned',
    date: selectedDate,
    endDate: selectedDate, // Add end date
    startTime: '08:00', // Default start time
    endTime: '18:00', // Default end time
    customSeats: [],
    showOnWebsite: false,
    websiteImage: '',
    websiteDescription: '',
    price: '',
    deposit: '',
    showRegistrationCount: false,
    pickupLocations: [],
  });
  const [loading, setLoading] = useState(false);
  const [showCustomSeats, setShowCustomSeats] = useState(false);
  const [customPickupInput, setCustomPickupInput] = useState('');

  // Generate seat options (1-50)
  const availableSeats = Array.from({ length: 50 }, (_, i) => i + 1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Combine date and time for start and end
      const [startHour, startMinute] = formData.startTime.split(':').map(Number);
      const [endHour, endMinute] = formData.endTime.split(':').map(Number);
      
      const startDateTime = new Date(formData.date);
      startDateTime.setHours(startHour, startMinute, 0, 0);
      
      const endDateTime = new Date(formData.endDate);
      endDateTime.setHours(endHour, endMinute, 0, 0);

      const tripData = {
        ...formData,
        startDateTime: Timestamp.fromDate(startDateTime),
        endDateTime: Timestamp.fromDate(endDateTime),
        startTimeStr: formData.startTime,  // raw "HH:MM" - timezone-safe for email display
        endTimeStr: formData.endTime,
      };

      // Remove the old date fields
      delete tripData.date;
      delete tripData.endDate;
      delete tripData.startTime;
      delete tripData.endTime;

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

  const handleStartDateChange = (e) => {
    const newDate = new Date(e.target.value);
    // If new start date is after end date, set end date to start date
    const endDate = newDate > formData.endDate ? newDate : formData.endDate;
    setFormData({ ...formData, date: newDate, endDate });
  };

  const handleEndDateChange = (e) => {
    const newEndDate = new Date(e.target.value);
    setFormData({ ...formData, endDate: newEndDate });
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
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => startCreateTripTour(t)}
              className="hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
              title="Take a tour"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div id="create-tour-basic">
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
                value={formatDateForInput(formData.date)}
                onChange={handleStartDateChange}
                className="w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-[#00BCD4] focus:border-transparent hover:border-[#00BCD4] transition-colors cursor-pointer"
                style={{ borderColor: colors.primary.teal }}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Time
              </label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-[#00BCD4] focus:border-transparent hover:border-[#00BCD4] transition-colors cursor-pointer"
                style={{ borderColor: colors.primary.teal }}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={formatDateForInput(formData.endDate)}
                onChange={handleEndDateChange}
                min={formatDateForInput(formData.date)}
                className="w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-[#00BCD4] focus:border-transparent hover:border-[#00BCD4] transition-colors cursor-pointer"
                style={{ borderColor: colors.primary.teal }}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Time
              </label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-[#00BCD4] focus:border-transparent hover:border-[#00BCD4] transition-colors cursor-pointer"
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

          <div id="create-tour-driver">
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
              Pickup Place
            </label>
            <input
              type="text"
              value={formData.pickupPlace}
              onChange={(e) =>
                setFormData({ ...formData, pickupPlace: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00BCD4] focus:border-transparent"
              placeholder="e.g., Central Station, Hotel Lobby"
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

          {/* Pickup Locations */}
          <div id="create-tour-pickup" className="border-2 rounded-lg p-4 space-y-3" style={{ borderColor: colors.primary.teal }}>
            <div className="flex items-center gap-2">
              <span className="text-lg">🚌</span>
              <div>
                <p className="font-semibold text-gray-800">Pickup Locations</p>
                <p className="text-xs text-gray-500">Select which stops are available for this trip. Participants must choose one when registering.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PRESET_PICKUP_LOCATIONS.map(loc => {
                const checked = formData.pickupLocations.includes(loc);
                return (
                  <label
                    key={loc}
                    className="flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors text-sm"
                    style={{ borderColor: checked ? colors.primary.teal : '#E5E7EB', backgroundColor: checked ? '#E0F7FA' : '#F9FAFB' }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        const next = checked
                          ? formData.pickupLocations.filter(l => l !== loc)
                          : [...formData.pickupLocations, loc];
                        setFormData({ ...formData, pickupLocations: next });
                      }}
                      className="w-4 h-4 rounded flex-shrink-0"
                      style={{ accentColor: colors.primary.teal }}
                    />
                    <span className={checked ? 'font-medium text-gray-900' : 'text-gray-600'}>{loc}</span>
                  </label>
                );
              })}
              {formData.pickupLocations.filter(l => !PRESET_PICKUP_LOCATIONS.includes(l)).map(loc => (
                <div
                  key={loc}
                  className="flex items-center justify-between gap-2 p-2.5 rounded-lg border text-sm"
                  style={{ borderColor: colors.primary.teal, backgroundColor: '#E0F7FA' }}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <input type="checkbox" checked readOnly className="w-4 h-4 rounded flex-shrink-0" style={{ accentColor: colors.primary.teal }} />
                    <span className="font-medium text-gray-900 truncate">{loc}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, pickupLocations: formData.pickupLocations.filter(l => l !== loc) })}
                    className="flex-shrink-0 text-gray-400 hover:text-red-500 transition-colors text-lg leading-none"
                  >×</button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={customPickupInput}
                onChange={e => setCustomPickupInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const val = customPickupInput.trim();
                    if (val && !formData.pickupLocations.includes(val)) {
                      setFormData({ ...formData, pickupLocations: [...formData.pickupLocations, val] });
                    }
                    setCustomPickupInput('');
                  }
                }}
                placeholder="Custom pickup place…"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#00BCD4] focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => {
                  const val = customPickupInput.trim();
                  if (val && !formData.pickupLocations.includes(val)) {
                    setFormData({ ...formData, pickupLocations: [...formData.pickupLocations, val] });
                  }
                  setCustomPickupInput('');
                }}
                className="px-4 py-2 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
                style={{ backgroundColor: colors.primary.teal }}
              >Add</button>
            </div>
            {formData.pickupLocations.length === 0 && (
              <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                ⚠️ No locations selected - participants won't see a pickup field during registration.
              </p>
            )}
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

          {/* Price & Deposit */}
          <div id="create-tour-pricing" className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Price per Person (C$)</label>
              <input
                type="number"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00BCD4] focus:border-transparent"
                placeholder="e.g. 120"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Deposit Amount (C$)</label>
              <input
                type="number"
                min="0"
                value={formData.deposit}
                onChange={(e) => setFormData({ ...formData, deposit: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00BCD4] focus:border-transparent"
                placeholder="e.g. 40"
              />
            </div>
          </div>
          {formData.price && formData.deposit && Number(formData.deposit) < Number(formData.price) && (
            <p className="text-xs text-teal-700 bg-teal-50 border border-teal-200 rounded-lg px-3 py-2">
              Deposit: C${formData.deposit} · Balance due on trip: C${Number(formData.price) - Number(formData.deposit)}
            </p>
          )}

          {/* Show on Website Toggle */}
          <div id="create-tour-website" className="border-2 rounded-lg overflow-hidden" style={{ borderColor: formData.showOnWebsite ? colors.primary.teal : '#E5E7EB' }}>
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

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              id="create-tour-submit"
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
