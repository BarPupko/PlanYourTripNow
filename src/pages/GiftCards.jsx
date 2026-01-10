import { useState, useEffect } from 'react';
import { Plus, Copy, Check, ExternalLink, Trash2, Gift, Calendar, DollarSign, User, CreditCard } from 'lucide-react';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import CreateGiftCardModal from '../components/CreateGiftCardModal';
import UseGiftCardModal from '../components/UseGiftCardModal';
import Header from '../components/Header';
import colors from '../utils/colors';

const GiftCards = () => {
  const [giftCards, setGiftCards] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUseModal, setShowUseModal] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'redeemed', 'expired', 'used'

  useEffect(() => {
    // Subscribe to real-time gift cards updates
    const q = query(collection(db, 'giftCards'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const cards = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setGiftCards(cards);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleCopyLink = (giftCardId) => {
    const link = `${window.location.origin}/PlanYourTripNow/gift/${giftCardId}`;
    navigator.clipboard.writeText(link);
    setCopiedId(giftCardId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDeleteGiftCard = async (giftCardId) => {
    if (!confirm('Are you sure you want to delete this gift card? This action cannot be undone.')) {
      return;
    }

    setDeletingId(giftCardId);
    try {
      await deleteDoc(doc(db, 'giftCards', giftCardId));
    } catch (error) {
      console.error('Error deleting gift card:', error);
      alert('Failed to delete gift card. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const getFilteredGiftCards = () => {
    const now = new Date();

    if (statusFilter === 'all') return giftCards;

    return giftCards.filter(card => {
      const expiryDate = card.expiryDate?.toDate?.() || new Date(card.expiryDate);
      const remainingBalance = card.remainingBalance !== undefined ? card.remainingBalance : card.amount;
      const isFullyRedeemed = card.redeemed || remainingBalance === 0;
      const hasBeenUsed = card.usageHistory && card.usageHistory.length > 0;

      if (statusFilter === 'redeemed') return isFullyRedeemed;
      if (statusFilter === 'used') return hasBeenUsed && !isFullyRedeemed;
      if (statusFilter === 'expired') return !isFullyRedeemed && expiryDate < now;
      if (statusFilter === 'active') return !isFullyRedeemed && expiryDate >= now && !hasBeenUsed;

      return true;
    });
  };

  const filteredCards = getFilteredGiftCards();

  const getStatusBadge = (card) => {
    const remainingBalance = card.remainingBalance !== undefined ? card.remainingBalance : card.amount;
    const isFullyRedeemed = card.redeemed || remainingBalance === 0;
    const hasBeenUsed = card.usageHistory && card.usageHistory.length > 0;

    if (isFullyRedeemed) {
      return { bg: '#D1FAE5', text: '#065F46', label: 'Fully Used' };
    }

    if (hasBeenUsed) {
      return { bg: '#FEF3C7', text: '#92400E', label: 'Partially Used' };
    }

    const expiryDate = card.expiryDate?.toDate?.() || new Date(card.expiryDate);
    const now = new Date();

    if (expiryDate < now) {
      return { bg: '#FEE2E2', text: '#991B1B', label: 'Expired' };
    }

    return { bg: '#DBEAFE', text: '#1E40AF', label: 'Active' };
  };

  const handleUseCard = (card) => {
    setSelectedCard(card);
    setShowUseModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Gift className="w-8 h-8" style={{ color: colors.primary.teal }} />
              Gift Cards
            </h1>
            <p className="text-gray-600 mt-1">Create and manage gift cards for your trips</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{ backgroundColor: colors.primary.teal }}
            className="flex items-center gap-2 px-6 py-3 text-white rounded-lg hover:opacity-90 transition-opacity shadow-lg"
          >
            <Plus className="w-5 h-5" />
            <span>Create Gift Card</span>
          </button>
        </div>

        {/* Status Filter */}
        <div className="mb-6 flex gap-2 flex-wrap">
          {['all', 'active', 'used', 'redeemed', 'expired'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === status
                  ? 'text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
              style={statusFilter === status ? { backgroundColor: colors.primary.teal } : {}}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-500">Loading gift cards...</div>
          </div>
        ) : filteredCards.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Gift className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500 text-lg mb-4">
              {statusFilter === 'all'
                ? 'No gift cards created yet'
                : `No ${statusFilter} gift cards found`}
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Create your first gift card
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCards.map((card) => {
              const status = getStatusBadge(card);
              return (
                <div
                  key={card.id}
                  className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow border-2"
                  style={{ borderColor: colors.primary.teal }}
                >
                  {/* Header with Status */}
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-gray-900 flex-1">
                      {card.recipientName}
                    </h3>
                    <span
                      className="px-3 py-1 rounded-full text-xs font-semibold"
                      style={{
                        backgroundColor: status.bg,
                        color: status.text
                      }}
                    >
                      {status.label}
                    </span>
                  </div>

                  {/* Message Preview */}
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {card.message}
                  </p>

                  {/* Card Details */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-700">
                        {card.remainingBalance !== undefined && card.remainingBalance !== card.amount ? (
                          <>
                            <span className="font-semibold" style={{ color: colors.primary.teal }}>${card.remainingBalance.toFixed(2)}</span>
                            <span className="text-gray-500"> / ${card.amount}</span>
                            <span className="text-xs ml-1">(remaining)</span>
                          </>
                        ) : (
                          <>
                            <span className="font-semibold">${card.amount}</span> value
                          </>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-700">
                        Expires: {card.expiryDate?.toDate?.().toLocaleDateString() || new Date(card.expiryDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-700">
                        From: {card.senderName}
                      </span>
                    </div>
                  </div>

                  {card.redeemed && (
                    <div className="mb-4 p-2 bg-green-50 rounded-lg">
                      <p className="text-xs text-green-700">
                        Fully used on {card.redeemedAt?.toDate?.().toLocaleDateString() || new Date(card.redeemedAt).toLocaleDateString()}
                      </p>
                    </div>
                  )}

                  {card.usageHistory && card.usageHistory.length > 0 && (
                    <div className="mb-4 p-2 bg-yellow-50 rounded-lg">
                      <p className="text-xs text-yellow-800 font-medium">
                        Used {card.usageHistory.length} time{card.usageHistory.length > 1 ? 's' : ''}
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 flex-wrap">
                    {!card.redeemed && (card.remainingBalance === undefined || card.remainingBalance > 0) && (
                      <button
                        onClick={() => handleUseCard(card)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-white rounded-lg hover:opacity-90 transition-opacity text-sm"
                        style={{ backgroundColor: colors.primary.teal }}
                      >
                        <CreditCard className="w-4 h-4" />
                        <span>Use</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleCopyLink(card.id)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-white rounded-lg hover:opacity-90 transition-opacity text-sm"
                      style={{ backgroundColor: copiedId === card.id ? colors.success : colors.primary.teal }}
                    >
                      {copiedId === card.id ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>Share</span>
                        </>
                      )}
                    </button>

                    <a
                      href={`/PlanYourTripNow/gift/${card.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ backgroundColor: colors.primary.black }}
                      className="flex items-center justify-center gap-2 px-3 py-2 text-white rounded-lg hover:opacity-90 transition-opacity text-sm"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>View</span>
                    </a>

                    <button
                      onClick={() => handleDeleteGiftCard(card.id)}
                      disabled={deletingId === card.id}
                      style={{ backgroundColor: colors.button.danger }}
                      className="flex items-center justify-center px-3 py-2 text-white rounded-lg hover:opacity-90 transition-opacity text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Gift Card Modal */}
      {showCreateModal && (
        <CreateGiftCardModal
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {/* Use Gift Card Modal */}
      {showUseModal && selectedCard && (
        <UseGiftCardModal
          giftCard={selectedCard}
          onClose={() => {
            setShowUseModal(false);
            setSelectedCard(null);
          }}
          onUpdate={() => {
            // Modal will close automatically, data will update via onSnapshot
          }}
        />
      )}
    </div>
  );
};

export default GiftCards;
