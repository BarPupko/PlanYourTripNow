import { useState } from 'react';
import { X, DollarSign, Users, Calendar, MapPin } from 'lucide-react';
import { doc, updateDoc, Timestamp, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase';
import colors from '../utils/colors';

const UseGiftCardModal = ({ giftCard, onClose, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amountToUse: '',
    tripName: '',
    tripDate: new Date().toISOString().split('T')[0],
    numberOfPeople: '1',
    notes: ''
  });

  const currentBalance = giftCard.remainingBalance !== undefined
    ? giftCard.remainingBalance
    : giftCard.amount;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const amountToUse = parseFloat(formData.amountToUse);

      if (amountToUse <= 0 || amountToUse > currentBalance) {
        alert(`Invalid amount. Must be between $1 and $${currentBalance}`);
        setLoading(false);
        return;
      }

      const newBalance = currentBalance - amountToUse;
      const isFullyUsed = newBalance === 0;

      const usageRecord = {
        date: Timestamp.fromDate(new Date(formData.tripDate)),
        tripName: formData.tripName,
        numberOfPeople: parseInt(formData.numberOfPeople),
        amountUsed: amountToUse,
        remainingAfter: newBalance,
        notes: formData.notes,
        usedAt: Timestamp.now()
      };

      const giftCardRef = doc(db, 'giftCards', giftCard.id);
      await updateDoc(giftCardRef, {
        remainingBalance: newBalance,
        redeemed: isFullyUsed,
        redeemedAt: isFullyUsed ? Timestamp.now() : giftCard.redeemedAt,
        usageHistory: arrayUnion(usageRecord)
      });

      if (onUpdate) {
        onUpdate();
      }

      onClose();
      alert(`Gift card updated successfully! Remaining balance: $${newBalance.toFixed(2)}`);
    } catch (error) {
      console.error('Error updating gift card:', error);
      alert('Failed to update gift card. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div
          className="p-6 text-white relative"
          style={{ backgroundColor: colors.primary.teal }}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-2xl font-bold mb-2">Use Gift Card</h2>
          <p className="opacity-90">{giftCard.recipientName}</p>
        </div>

        {/* Balance Info */}
        <div className="p-6 bg-gray-50 border-b">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-white rounded-lg shadow">
              <p className="text-sm text-gray-600 mb-1">Original Amount</p>
              <p className="text-2xl font-bold" style={{ color: colors.primary.teal }}>
                ${giftCard.amount}
              </p>
            </div>
            <div className="text-center p-4 bg-white rounded-lg shadow">
              <p className="text-sm text-gray-600 mb-1">Current Balance</p>
              <p className="text-2xl font-bold" style={{ color: colors.primary.teal }}>
                ${currentBalance.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Amount to Use */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount to Use *
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="number"
                value={formData.amountToUse}
                onChange={(e) => setFormData({ ...formData, amountToUse: e.target.value })}
                min="0.01"
                max={currentBalance}
                step="0.01"
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00BCD4] focus:border-transparent"
                placeholder="Enter amount..."
                required
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Maximum: ${currentBalance.toFixed(2)}
            </p>
          </div>

          {/* Trip Name */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Trip Name *
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={formData.tripName}
                onChange={(e) => setFormData({ ...formData, tripName: e.target.value })}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00BCD4] focus:border-transparent"
                placeholder="e.g., Niagara Falls Tour"
                required
              />
            </div>
          </div>

          {/* Trip Date and Number of People */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trip Date *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="date"
                  value={formData.tripDate}
                  onChange={(e) => setFormData({ ...formData, tripDate: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00BCD4] focus:border-transparent"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of People *
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  value={formData.numberOfPeople}
                  onChange={(e) => setFormData({ ...formData, numberOfPeople: e.target.value })}
                  min="1"
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00BCD4] focus:border-transparent"
                  required
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows="3"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00BCD4] focus:border-transparent resize-vertical"
              placeholder="Any additional notes..."
            />
          </div>

          {/* Remaining Balance Preview */}
          {formData.amountToUse && !isNaN(parseFloat(formData.amountToUse)) && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-medium text-blue-900">
                After this transaction:
              </p>
              <p className="text-lg font-bold text-blue-700">
                Remaining Balance: ${(currentBalance - parseFloat(formData.amountToUse)).toFixed(2)}
              </p>
              {currentBalance - parseFloat(formData.amountToUse) === 0 && (
                <p className="text-sm text-blue-600 mt-2">
                  This will fully redeem the gift card.
                </p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: colors.primary.teal }}
            >
              {loading ? 'Processing...' : 'Use Gift Card'}
            </button>
          </div>
        </form>

        {/* Usage History */}
        {giftCard.usageHistory && giftCard.usageHistory.length > 0 && (
          <div className="p-6 border-t bg-gray-50">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Usage History</h3>
            <div className="space-y-3">
              {giftCard.usageHistory.map((usage, index) => (
                <div key={index} className="bg-white p-4 rounded-lg shadow-sm border">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-gray-900">{usage.tripName}</p>
                      <p className="text-sm text-gray-600">
                        {usage.date?.toDate?.().toLocaleDateString() || new Date(usage.date).toLocaleDateString()}
                        {' • '}
                        {usage.numberOfPeople} {usage.numberOfPeople === 1 ? 'person' : 'people'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-red-600">-${usage.amountUsed.toFixed(2)}</p>
                      <p className="text-xs text-gray-500">
                        Balance: ${usage.remainingAfter.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  {usage.notes && (
                    <p className="text-sm text-gray-600 mt-2 italic">{usage.notes}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UseGiftCardModal;
