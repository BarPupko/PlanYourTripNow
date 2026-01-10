import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Gift, DollarSign, Calendar, User, PartyPopper, Sparkles, Globe } from 'lucide-react';
import colors from '../utils/colors';
import giftCardImage from '../assets/giftcardimage.png';
import './GiftCardReveal.css';

const GiftCardReveal = () => {
  const { giftCardId } = useParams();
  const [giftCard, setGiftCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [language, setLanguage] = useState('en'); // 'en' or 'ru'

  const translations = {
    en: {
      loadingGift: "Loading your gift...",
      oops: "Oops!",
      youGotGift: "You've Got a Gift!",
      clickToReveal: "Click the gift box to reveal your surprise",
      congratulations: "Congratulations!",
      receivedGiftCard: "You've received a gift card",
      dear: "Dear",
      from: "From",
      expires: "Expires",
      giftCardCode: "Gift Card Code",
      presentCode: "Present this code when booking your trip",
      expired: "This gift card has expired",
      revealed: "Gift card revealed! Contact us to redeem.",
      readyToUse: "Ready to use! Contact us to book your amazing trip.",
      contactInfo: "Contact: 647-302-6849 or visit www.ivritours.com"
    },
    ru: {
      loadingGift: "Загрузка вашего подарка...",
      oops: "Упс!",
      youGotGift: "У вас есть подарок!",
      clickToReveal: "Нажмите на подарочную коробку, чтобы открыть сюрприз",
      congratulations: "Поздравляем!",
      receivedGiftCard: "Вы получили подарочную карту",
      dear: "Дорогой",
      from: "От",
      expires: "Срок действия",
      giftCardCode: "Код подарочной карты",
      presentCode: "Предъявите этот код при бронировании вашей поездки",
      expired: "Срок действия этой подарочной карты истек",
      revealed: "Подарочная карта открыта! Свяжитесь с нами, чтобы использовать.",
      readyToUse: "Готово к использованию! Свяжитесь с нами, чтобы забронировать вашу удивительную поездку.",
      contactInfo: "Контакт: 647-302-6849 или посетите www.ivritours.com"
    }
  };

  const t = translations[language];

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
          <p className="text-xl text-gray-700">{t.loadingGift}</p>
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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t.oops}</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  const expiryDate = giftCard.expiryDate?.toDate?.() || new Date(giftCard.expiryDate);
  const isExpired = expiryDate < new Date();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Language Toggle */}
      <div className="absolute top-4 right-4 z-50">
        <button
          onClick={() => setLanguage(language === 'en' ? 'ru' : 'en')}
          className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-lg hover:shadow-xl transition-all"
          style={{ color: colors.primary.teal }}
        >
          <Globe className="w-5 h-5" />
          <span className="font-medium">{language === 'en' ? 'RU' : 'EN'}</span>
        </button>
      </div>

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
            {t.youGotGift}
            <Sparkles className="w-8 h-8 text-yellow-500" />
          </h1>
          <p className="text-xl text-gray-700 mb-8">
            {t.clickToReveal}
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
                <h1 className="text-4xl font-bold mb-2">{t.congratulations}</h1>
                <p className="text-xl opacity-90">{t.receivedGiftCard}</p>
              </div>
            </div>

            {/* Gift Card Content */}
            <div className="p-8">
              {/* Recipient and Amount */}
              <div className="text-center mb-8">
                <p className="text-gray-600 mb-2">{t.dear}</p>
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
                    <p className="text-xs text-gray-500">{t.from}</p>
                    <p className="font-semibold text-gray-900">{giftCard.senderName}</p>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">{t.expires}</p>
                    <p className="font-semibold text-gray-900">
                      {expiryDate.toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* IVRI Tours Promotional Image */}
              <div className="bg-white border-4 rounded-2xl p-4 mb-6" style={{ borderColor: colors.primary.teal }}>
                <img
                  src={giftCardImage}
                  alt="IVRI Tours - Best Tours in Canada"
                  className="w-full rounded-lg shadow-lg"
                />
              </div>

              {/* Gift Card Code */}
              <div className="bg-gradient-to-r from-teal-50 to-cyan-50 border-2 rounded-2xl p-6 text-center" style={{ borderColor: colors.primary.teal }}>
                <p className="text-sm font-medium text-gray-700 mb-2">{t.giftCardCode}</p>
                <p className="text-3xl font-bold tracking-wider mb-3" style={{ color: colors.primary.teal }}>
                  {giftCard.barcodeId}
                </p>
                <p className="text-xs text-gray-600">
                  {t.presentCode}
                </p>
              </div>

              {/* Contact Information */}
              <div className="mt-6 text-center">
                <p className="text-sm font-medium text-gray-700">
                  {t.contactInfo}
                </p>
              </div>

              {/* Status Messages */}
              {isExpired && (
                <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                  <p className="text-red-700 font-medium">
                    {t.expired}
                  </p>
                </div>
              )}

              {giftCard.redeemed && !isExpired && (
                <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                  <p className="text-green-700 font-medium">
                    {t.revealed}
                  </p>
                </div>
              )}

              {!isExpired && !giftCard.redeemed && (
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                  <p className="text-blue-700 font-medium">
                    {t.readyToUse}
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
