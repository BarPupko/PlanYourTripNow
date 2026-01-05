import { useState } from 'react';
import { X, UserPlus } from 'lucide-react';
import { createRegistration } from '../utils/firestoreUtils';
import colors from '../utils/colors';

const AddParticipantModal = ({ trip, registrations, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    seatNumber: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const occupiedSeats = registrations.map(r => r.seatNumber);
  const availableSeats = Array.from({ length: 15 }, (_, i) => i + 1)
    .filter(seat => !occupiedSeats.includes(seat));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.seatNumber) {
      setError('Please select a seat');
      return;
    }

    setLoading(true);

    try {
      await createRegistration({
        tripId: trip.id,
        ...formData,
        signatureUrl: '', // Admin-added participants don't have signatures
        pdfUrl: '',
        agreedToCancellationPolicy: true,
        agreedToWaiver: true,
        addedByAdmin: true
      });

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2">
            <UserPlus className="w-6 h-6" style={{ color: colors.primary.teal }} />
            <h2 className="text-xl font-bold" style={{ color: colors.primary.black }}>
              Add Participant
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
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
              Seat Number *
            </label>
            <select
              value={formData.seatNumber || ''}
              onChange={(e) => setFormData({ ...formData, seatNumber: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00BCD4] focus:border-transparent"
              required
            >
              <option value="">Select a seat</option>
              {availableSeats.map(seat => (
                <option key={seat} value={seat}>Seat {seat}</option>
              ))}
            </select>
            {availableSeats.length === 0 && (
              <p className="text-sm text-red-600 mt-1">No available seats</p>
            )}
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
