import { useState } from 'react';
import { X, UserPlus } from 'lucide-react';
import { createRegistration } from '../utils/firestoreUtils';
import { getVehicleLayout } from '../utils/vehicleLayouts';
import colors from '../utils/colors';

const AddParticipantModal = ({ trip, registrations, preselectedSeat = null, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    seatNumber: preselectedSeat,
    seatCount: 1, // NEW: number of seats to book
    paymentMethod: 'on-trip',
    paid: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const vehicleLayout = getVehicleLayout(trip.vehicleLayout);
  const occupiedSeats = registrations.map(r => r.seatNumber);
  const availableSeats = Array.from({ length: vehicleLayout.totalSeats }, (_, i) => i + 1)
    .filter(seat => !occupiedSeats.includes(seat));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.seatNumber) {
      setError('Please select a seat');
      return;
    }

    // Check if enough consecutive seats are available
    if (formData.seatCount > 1) {
      const startSeat = formData.seatNumber;
      const seatsNeeded = [];
      for (let i = 0; i < formData.seatCount; i++) {
        seatsNeeded.push(startSeat + i);
      }

      const unavailableSeats = seatsNeeded.filter(seat =>
        occupiedSeats.includes(seat) || seat > vehicleLayout.totalSeats
      );

      if (unavailableSeats.length > 0) {
        setError(`Not enough consecutive seats available starting from seat ${startSeat}. Please select a different seat.`);
        return;
      }
    }

    setLoading(true);

    try {
      // Create registrations for all seats
      const startSeat = formData.seatNumber;
      const registrationPromises = [];

      for (let i = 0; i < formData.seatCount; i++) {
        const seatNumber = startSeat + i;
        registrationPromises.push(
          createRegistration({
            tripId: trip.id,
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            seatNumber: seatNumber,
            paymentMethod: formData.paymentMethod,
            paid: formData.paid,
            signatureUrl: '', // Admin-added participants don't have signatures
            pdfUrl: '',
            agreedToCancellationPolicy: true,
            agreedToWaiver: true,
            addedByAdmin: true,
            isMultiSeat: formData.seatCount > 1, // Flag to indicate multi-seat booking
            seatCount: formData.seatCount // Store total seats booked
          })
        );
      }

      await Promise.all(registrationPromises);

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error adding participant:', err);
      setError('Failed to add participant. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-15 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border-4 border-teal-400" onClick={(e) => e.stopPropagation()} style={{ borderColor: colors.primary.teal }}>
        <div className="bg-gradient-to-r from-teal-500 to-teal-600 text-white px-6 py-4 rounded-t-xl flex justify-between items-center sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <UserPlus className="w-6 h-6" />
            <h2 className="text-xl font-bold">
              Add Participant
            </h2>
          </div>
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
              First Name *
            </label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
              style={{ focusRing: colors.primary.teal }}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Last Name *
            </label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00BCD4] focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00BCD4] focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number *
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00BCD4] focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Number of Seats *
            </label>
            <select
              value={formData.seatCount}
              onChange={(e) => setFormData({ ...formData, seatCount: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00BCD4] focus:border-transparent"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(count => (
                <option key={count} value={count}>{count} {count === 1 ? 'Seat' : 'Seats'}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Select how many seats this person needs (consecutive seats starting from the selected seat)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Starting Seat Number *
            </label>
            <select
              value={formData.seatNumber || ''}
              onChange={(e) => setFormData({ ...formData, seatNumber: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00BCD4] focus:border-transparent"
              required
            >
              <option value="">Select starting seat</option>
              {availableSeats.map(seat => (
                <option key={seat} value={seat}>Seat {seat}</option>
              ))}
            </select>
            {availableSeats.length === 0 && (
              <p className="text-sm text-red-600 mt-1">No available seats</p>
            )}
            {formData.seatNumber && formData.seatCount > 1 && (
              <p className="text-xs text-blue-600 mt-1">
                Will book seats {formData.seatNumber} - {formData.seatNumber + formData.seatCount - 1}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Payment Method *
            </label>
            <div className="space-y-2">
              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors" style={{ borderColor: formData.paymentMethod === 'card' ? colors.primary.teal : '#D1D5DB' }}>
                <input
                  type="radio"
                  value="card"
                  checked={formData.paymentMethod === 'card'}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  className="mr-3"
                  style={{ accentColor: colors.primary.teal }}
                />
                <div>
                  <div className="font-medium text-gray-900">Pay with Card</div>
                  <div className="text-sm text-gray-500">Pay now using credit/debit card</div>
                </div>
              </label>
              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors" style={{ borderColor: formData.paymentMethod === 'on-trip' ? colors.primary.teal : '#D1D5DB' }}>
                <input
                  type="radio"
                  value="on-trip"
                  checked={formData.paymentMethod === 'on-trip'}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  className="mr-3"
                  style={{ accentColor: colors.primary.teal }}
                />
                <div>
                  <div className="font-medium text-gray-900">Pay on Trip</div>
                  <div className="text-sm text-gray-500">Pay cash/card on the day of the trip</div>
                </div>
              </label>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-3 cursor-pointer p-3 border rounded-lg hover:bg-gray-50 transition-colors" style={{ borderColor: formData.paid ? colors.primary.teal : '#D1D5DB' }}>
              <input
                type="checkbox"
                checked={formData.paid}
                onChange={(e) => setFormData({ ...formData, paid: e.target.checked })}
                className="w-5 h-5 rounded border-gray-300"
                style={{ accentColor: colors.primary.teal }}
              />
              <div>
                <div className="font-medium text-gray-900">Mark as Paid</div>
                <div className="text-sm text-gray-500">Check if participant has already paid</div>
              </div>
            </label>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

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
              disabled={loading || availableSeats.length === 0}
              style={{ backgroundColor: colors.primary.teal }}
              className="flex-1 px-4 py-2 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Adding...' : 'Add Participant'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddParticipantModal;
