import { useState } from 'react';
import { X, CheckCircle2, XCircle, CreditCard, Banknote, Edit2, Trash2 } from 'lucide-react';
import { updateRegistration, deleteRegistration } from '../utils/firestoreUtils';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../utils/translations';
import colors from '../utils/colors';

const ParticipantDetailsModal = ({ participant, onClose, onUpdate }) => {
  const { language } = useLanguage();
  const t = translations[language];
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({
    firstName: participant.firstName,
    lastName: participant.lastName,
    email: participant.email,
    phone: participant.phone
  });
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSaveEdit = async () => {
    setLoading(true);
    try {
      await updateRegistration(participant.id, editFormData);
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error('Error updating participant:', error);
      alert('Failed to update participant. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePaid = async () => {
    setLoading(true);
    try {
      await updateRegistration(participant.id, { paid: !participant.paid });
      onUpdate();
    } catch (error) {
      console.error('Error updating payment status:', error);
      alert(t.failedToUpdatePayment);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this participant? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);
    try {
      await deleteRegistration(participant.id);
      onClose();
      onUpdate();
    } catch (error) {
      console.error('Error deleting participant:', error);
      alert('Failed to delete participant. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-[60]"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border-4"
        onClick={(e) => e.stopPropagation()}
        style={{ borderColor: colors.primary.teal }}
      >
        {/* Header */}
        <div
          className="bg-gradient-to-r from-teal-500 to-teal-600 text-white px-6 py-4 rounded-t-xl flex justify-between items-center sticky top-0 z-10"
        >
          <div>
            <h2 className="text-xl font-bold">Participant Details</h2>
            <p className="text-sm text-teal-100">Seat {participant.seatNumber}</p>
          </div>
          <button
            onClick={onClose}
            className="hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {isEditing ? (
            /* Edit Mode */
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={editFormData.firstName}
                    onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00BCD4] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={editFormData.lastName}
                    onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00BCD4] focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00BCD4] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00BCD4] focus:border-transparent"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleSaveEdit}
                  disabled={loading}
                  style={{ backgroundColor: colors.success }}
                  className="flex-1 px-4 py-2 text-white rounded-lg hover:opacity-90 transition-opacity font-medium disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            /* View Mode */
            <>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
                <p className="text-lg font-semibold text-gray-900">
                  {participant.firstName} {participant.lastName}
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
                <p className="text-sm text-gray-900">{participant.email}</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">{t.phone}</label>
                <p className="text-sm text-gray-900">{participant.phone}</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Seat Number</label>
                <p className="text-sm text-gray-900">Seat {participant.seatNumber}</p>
              </div>

              {participant.isMultiSeat && participant.seatCount && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    <strong>Multi-Seat Booking:</strong> This person has booked {participant.seatCount} seats
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">{t.paymentMethod}</label>
                <div className="flex items-center gap-2 mt-1">
                  {participant.paymentMethod === 'card' ? (
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

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">{t.paymentStatus}</label>
                <div className="flex items-center gap-2 mt-1">
                  {participant.paid ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                      <span className="text-sm font-semibold text-green-700">{t.paid}</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 text-red-500" />
                      <span className="text-sm font-semibold text-red-700">{t.notPaid}</span>
                    </>
                  )}
                </div>
              </div>

              {participant.registrationDate && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">{t.registered}</label>
                  <p className="text-sm text-gray-900">
                    {new Date(participant.registrationDate).toLocaleDateString()}
                  </p>
                </div>
              )}

              {(participant.agreedToCancellationPolicy || participant.agreedToWaiver) && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">{t.signedAgreements}</label>
                  <div className="space-y-1 mt-1">
                    {participant.agreedToCancellationPolicy && (
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                        <span className="text-xs text-gray-700">{t.cancellationPolicy}</span>
                      </div>
                    )}
                    {participant.agreedToWaiver && (
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                        <span className="text-xs text-gray-700">{t.liabilityWaiver}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  onClick={handleTogglePaid}
                  disabled={loading}
                  style={{ backgroundColor: participant.paid ? colors.button.danger : colors.success }}
                  className="w-full px-4 py-3 text-white rounded-lg hover:opacity-90 transition-opacity font-medium disabled:opacity-50"
                >
                  {loading ? 'Updating...' : participant.paid ? t.markAsNotPaid : t.markAsPaidBtn}
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={() => setIsEditing(true)}
                    style={{ backgroundColor: colors.primary.teal }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    style={{ backgroundColor: colors.button.danger }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-white rounded-lg hover:opacity-90 transition-opacity font-medium disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>{deleting ? 'Deleting...' : 'Delete'}</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ParticipantDetailsModal;
