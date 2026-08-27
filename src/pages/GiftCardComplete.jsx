import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader, AlertCircle } from 'lucide-react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';
import colors from '../utils/colors';
import Header from '../components/Header';

/**
 * Where PayPal drops the buyer after they approve. PayPal appends
 * ?token=<orderId>, which we hand to captureGiftCardOrder to take the money
 * and issue the card.
 *
 * If this page never loads - the buyer closes the tab on PayPal's side - the
 * paypalWebhook function issues the card instead. This page is the fast path,
 * not the only path.
 */
const GiftCardComplete = () => {
  const navigate = useNavigate();
  // PayPal appends ?token=<orderId> to the return URL.
  const orderId = new URLSearchParams(window.location.search).get('token');

  const [status, setStatus] = useState(orderId ? 'working' : 'error');
  const [message, setMessage] = useState(
    orderId
      ? ''
      : 'This link is missing its payment reference. If you were charged, please contact us and we will send your gift card.'
  );
  // StrictMode double-mounts in dev; capturing twice is harmless server-side
  // but would show the buyer a spurious error, so only fire once.
  const started = useRef(false);

  useEffect(() => {
    if (!orderId || started.current) return;
    started.current = true;

    const capture = httpsCallable(functions, 'captureGiftCardOrder');
    capture({ orderId })
      .then(({ data }) => {
        navigate(`/gift/${data.giftCardId}`, { replace: true });
      })
      .catch((err) => {
        console.error('Error completing gift card payment:', err);
        setStatus('error');
        setMessage(
          err.message ||
          'We could not confirm your payment. If you were charged, your gift card will still be emailed to you shortly.'
        );
      });
  }, [orderId, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100">
      <Header showBackButton={false} showLogout={false} />

      <div className="max-w-xl mx-auto px-4 py-24">
        <div className="bg-white rounded-3xl shadow-2xl p-10 text-center">
          {status === 'working' ? (
            <>
              <Loader className="w-14 h-14 mx-auto mb-6 animate-spin" style={{ color: colors.primary.teal }} />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Confirming your payment</h1>
              <p className="text-gray-600">Please don't close this window.</p>
            </>
          ) : (
            <>
              <AlertCircle className="w-14 h-14 mx-auto mb-6 text-amber-500" />
              <h1 className="text-2xl font-bold text-gray-900 mb-3">We hit a snag</h1>
              <p className="text-gray-600 mb-8">{message}</p>
              <button
                onClick={() => navigate('/gift-card-purchase')}
                className="px-8 py-3 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
                style={{ backgroundColor: colors.primary.teal }}
              >
                Back to gift cards
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default GiftCardComplete;
