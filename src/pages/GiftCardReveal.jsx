import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Gift, DollarSign, Calendar, User, PartyPopper, Sparkles } from 'lucide-react';
import Barcode from 'react-barcode';
import colors from '../utils/colors';
import './GiftCardReveal.css';

const GiftCardReveal = () => {
  const { giftCardId } = useParams();
  const [giftCard, setGiftCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    const fetchGiftCard = async () => {
      try {
        const giftCardRef = doc(db, 'giftCards', giftCardId);
        const giftCardSnap = await getDoc(giftCardRef);

        if (giftCardSnap.exists()) {
          setGiftCard({ id: giftCardSnap.id, ...giftCardSnap.data() });
        } else {
          setError('Gift card not found');
        }
      } catch (err) {
        console.error('Error fetching gift card:', err);
        setError('Failed to load gift card');
      } finally {
        setLoading(false);
      }
    };

    fetchGiftCard();
  }, [giftCardId]);

  const handleReveal = async () => {
    setIsRevealed(true);
    setShowConfetti(true);

    // Mark as redeemed if not already
    if (giftCard && !giftCard.redeemed) {
      try {
        const giftCardRef = doc(db, 'giftCards', giftCardId);
        await updateDoc(giftCardRef, {
          redeemed: true,
          redeemedAt: Timestamp.now()
        });
        setGiftCard(prev => ({ ...prev, redeemed: true, redeemedAt: new Date() }));
      } catch (err) {
        console.error('Error marking gift card as redeemed:', err);
      }
    }

    // Hide confetti after animation
    setTimeout(() => setShowConfetti(false), 5000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <Gift className="w-16 h-16 mx-auto mb-4 text-purple-600 animate-pulse" />
          <p className="text-xl text-gray-700">Loading your gift...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Gift className="w-10 h-10 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Oops!</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  const expiryDate = giftCard.expiryDate?.toDate?.() || new Date(giftCard.expiryDate);
  const isExpired = expiryDate < new Date();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Confetti Animation */}
      {showConfetti && (
        <div className="confetti-container">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="confetti"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                backgroundColor: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'][Math.floor(Math.random() * 5)]
              }}
            />
          ))}
        </div>
      )}

      {!isRevealed ? (
        /* Gift Box - Before Reveal */
        <div className="text-center">
          <div className="gift-box-container mb-8" onClick={handleReveal}>
            <div className="gift-box">
              <div className="gift-box-lid">
                <div className="gift-ribbon-horizontal"></div>
              </div>
              <div className="gift-box-body">
                <div className="gift-ribbon-vertical"></div>
              </div>
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-3">
            <Sparkles className="w-8 h-8 text-yellow-500" />
            You've Got a Gift!
            <Sparkles className="w-8 h-8 text-yellow-500" />
          </h1>
          <p className="text-xl text-gray-700 mb-8">
            Click the gift box to reveal your surprise
          </p>
          <div className="animate-bounce">
            <Gift className="w-12 h-12 mx-auto text-purple-600" />
          </div>
        </div>
      ) : (
        /* Gift Card - After Reveal */
        <div className="gift-card-reveal max-w-2xl w-full">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            {/* Header with celebratory banner */}
            <div
              className="p-8 text-white text-center relative overflow-hidden"
              style={{ backgroundColor: colors.primary.teal }}
            >
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0 bg-gradient-to-br from-white to-transparent"></div>
              </div>
              <div className="relative z-10">
                <PartyPopper className="w-16 h-16 mx-auto mb-4" />
                <h1 className="text-4xl font-bold mb-2">Congratulations!</h1>
                <p className="text-xl opacity-90">You've received a gift card</p>
              </div>
            </div>

            {/* Gift Card Content */}
            <div className="p-8">
              {/* Recipient and Amount */}
              <div className="text-center mb-8">
                <p className="text-gray-600 mb-2">Dear</p>
                <h2 className="text-3xl font-bold text-gray-900 mb-6">
                  {giftCard.recipientName}
                </h2>
                <div
                  className="inline-block px-8 py-4 rounded-2xl text-white mb-6"
                  style={{ backgroundColor: colors.primary.teal }}
                >
                  <DollarSign className="w-8 h-8 inline-block mb-1" />
                  <span className="text-5xl font-bold">{giftCard.amount}</span>
                </div>
              </div>

              {/* Personal Message */}
              {giftCard.message && (
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 mb-8">
                  <p className="text-gray-700 text-lg italic text-center leading-relaxed">
                    "{giftCard.message}"
                  </p>
                  <p className="text-gray-600 text-right mt-4">
                    - {giftCard.senderName}
                  </p>
                </div>
              )}

              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">From</p>
                    <p className="font-semibold text-gray-900">{giftCard.senderName}</p>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Expires</p>
                    <p className="font-semibold text-gray-900">
                      {expiryDate.toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Barcode */}
              <div className="bg-white border-2 border-dashed border-gray-300 rounded-2xl p-6 text-center">
                <p className="text-sm text-gray-600 mb-4">Gift Card Code</p>
                <div className="flex justify-center">
                  <Barcode
                    value={giftCard.barcodeId}
                    width={2}
                    height={60}
                    fontSize={14}
                    background="transparent"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-4">
                  Present this code when booking your trip
                </p>
              </div>

              {/* Status Messages */}
              {isExpired && (
                <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                  <p className="text-red-700 font-medium">
                    This gift card has expired
                  </p>
                </div>
              )}

              {giftCard.redeemed && !isExpired && (
                <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                  <p className="text-green-700 font-medium">
                    Gift card revealed! Contact us to redeem.
                  </p>
                </div>
              )}

              {!isExpired && !giftCard.redeemed && (
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                  <p className="text-blue-700 font-medium">
                    Ready to use! Contact us to book your amazing trip.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GiftCardReveal;
