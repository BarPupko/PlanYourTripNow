import { useState } from 'react';
import { X, Gift, User, DollarSign, Calendar, MessageSquare, Loader } from 'lucide-react';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import colors from '../utils/colors';
import Barcode from 'react-barcode';

const CreateGiftCardModal = ({ onClose }) => {
  const [formData, setFormData] = useState({
    recipientName: '',
    senderName: '',
    amount: '',
    message: '',
    expiryDate: ''
  });
  const [creating, setCreating] = useState(false);
  const [showBarcode, setShowBarcode] = useState(false);
  const [generatedId, setGeneratedId] = useState('');

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const generateGiftCardId = () => {
    // Generate a unique 12-character alphanumeric ID for the barcode
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'GC';
    for (let i = 0; i < 10; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.recipientName || !formData.senderName || !formData.amount || !formData.expiryDate) {
      alert('Please fill in all required fields');
      return;
    }

    setCreating(true);

    try {
      const giftCardId = generateGiftCardId();

      const giftCardData = {
        recipientName: formData.recipientName,
        senderName: formData.senderName,
        amount: parseFloat(formData.amount),
        message: formData.message || 'Wishing you wonderful adventures!',
        expiryDate: Timestamp.fromDate(new Date(formData.expiryDate)),
        createdAt: Timestamp.now(),
        redeemed: false,
        barcodeId: giftCardId
      };

      await addDoc(collection(db, 'giftCards'), giftCardData);

      setGeneratedId(giftCardId);
      setShowBarcode(true);

      // Reset form after 3 seconds and close
      setTimeout(() => {
        onClose();
      }, 3000);
    } catch (error) {
      console.error('Error creating gift card:', error);
      alert('Failed to create gift card. Please try again.');
      setCreating(false);
    }
  };

  if (showBarcode) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Gift className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Gift Card Created!</h2>
            <p className="text-gray-600">Your gift card has been generated successfully</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 mb-4">
            <Barcode
              value={generatedId}
              width={2}
              height={80}
              fontSize={14}
              background="#F9FAFB"
            />
          </div>

          <p className="text-sm text-gray-500">
            Closing in a moment...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Gift className="w-6 h-6" style={{ color: colors.primary.teal }} />
            <h2 className="text-2xl font-bold text-gray-900">Create Gift Card</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {/* Recipient Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <User className="w-4 h-4" />
                Recipient Name *
              </label>
              <input
                type="text"
                value={formData.recipientName}
                onChange={(e) => handleChange('recipientName', e.target.value)}
                placeholder="Who is this gift card for?"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                required
              />
            </div>

            {/* Sender Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <User className="w-4 h-4" />
                Your Name (Sender) *
              </label>
              <input
                type="text"
                value={formData.senderName}
                onChange={(e) => handleChange('senderName', e.target.value)}
                placeholder="Your name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                required
              />
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Gift Card Amount *
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => handleChange('amount', e.target.value)}
                  placeholder="100.00"
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Personal Message (Optional)
              </label>
              <textarea
                value={formData.message}
                onChange={(e) => handleChange('message', e.target.value)}
                placeholder="Write a personalized message for the recipient..."
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Expiry Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Expiry Date *
              </label>
              <input
                type="date"
                value={formData.expiryDate}
                onChange={(e) => handleChange('expiryDate', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                required
              />
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> A unique barcode will be generated for this gift card.
                The recipient will receive a shareable link with a beautiful reveal animation.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-8">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              style={{ backgroundColor: colors.primary.teal }}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creating ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Gift className="w-5 h-5" />
                  <span>Create Gift Card</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGiftCardModal;
