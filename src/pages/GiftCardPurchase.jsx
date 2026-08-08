import { useState } from 'react';
import { Gift, CreditCard, DollarSign, Globe, User, Mail, MessageSquare, Lock } from 'lucide-react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';
import colors from '../utils/colors';
import Header from '../components/Header';

// Must match GIFT_CARD_MIN / GIFT_CARD_MAX in functions/paypal.js — the server
// re-validates, so this is only here to fail fast before the redirect.
const MIN_AMOUNT = 25;
const MAX_AMOUNT = 2000;

const GiftCardPurchase = () => {
  // PayPal sends the buyer back here with ?cancelled=1 if they back out.
  const cancelled = new URLSearchParams(window.location.search).has('cancelled');
  const [language, setLanguage] = useState('en'); // 'en' or 'ru'
  const [step, setStep] = useState(1); // 1: Details, 2: Payment
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    amount: '100',
    recipientName: '',
    recipientEmail: '',
    senderName: '',
    senderEmail: '',
    message: ''
  });

  const translations = {
    en: {
      title: "Purchase Gift Card",
      subtitle: "Give the gift of amazing travel experiences",
      step1: "Gift Details",
      step2: "Payment",
      amount: "Gift Card Amount",
      recipientName: "Recipient's Name",
      recipientEmail: "Recipient's Email",
      senderName: "Your Name",
      senderEmail: "Your Email",
      message: "Personal Message (Optional)",
      messagePlaceholder: "Write a personal message for the recipient...",
      back: "Back",
      continue: "Continue",
      payNow: "Pay with PayPal or Card",
      processing: "Redirecting to PayPal...",
      customAmount: "Custom Amount",
      presetAmounts: "Preset Amounts",
      paypalInfo: "You'll be taken to PayPal to finish your purchase. You can pay with a credit or debit card there — a PayPal account isn't required.",
      orderSummary: "Order Summary",
      giftCardAmount: "Gift Card Amount",
      to: "To",
      from: "From",
      total: "Total",
      amountRange: `Amount must be between C$${MIN_AMOUNT} and C$${MAX_AMOUNT}`,
      genericError: "Something went wrong starting the payment. Please try again.",
      cancelled: "Your payment was cancelled. Nothing has been charged.",
      securePayment: "Payment processed securely by PayPal",
      terms: "By purchasing, you agree to our terms and conditions"
    },
    ru: {
      title: "Купить подарочную карту",
      subtitle: "Подарите незабываемые путешествия",
      step1: "Детали подарка",
      step2: "Оплата",
      amount: "Сумма подарочной карты",
      recipientName: "Имя получателя",
      recipientEmail: "Email получателя",
      senderName: "Ваше имя",
      senderEmail: "Ваш Email",
      message: "Личное сообщение (Необязательно)",
      messagePlaceholder: "Напишите личное сообщение для получателя...",
      back: "Назад",
      continue: "Продолжить",
      payNow: "Оплатить через PayPal или картой",
      processing: "Перенаправляем в PayPal...",
      customAmount: "Своя сумма",
      presetAmounts: "Готовые суммы",
      paypalInfo: "Вы перейдёте на сайт PayPal для завершения покупки. Там можно оплатить кредитной или дебетовой картой — аккаунт PayPal не требуется.",
      orderSummary: "Ваш заказ",
      giftCardAmount: "Сумма подарочной карты",
      to: "Кому",
      from: "От кого",
      total: "Итого",
      amountRange: `Сумма должна быть от C$${MIN_AMOUNT} до C$${MAX_AMOUNT}`,
      genericError: "Не удалось начать оплату. Пожалуйста, попробуйте ещё раз.",
      cancelled: "Оплата отменена. Деньги не списаны.",
      securePayment: "Безопасная обработка платежей через PayPal",
      terms: "Совершая покупку, вы соглашаетесь с нашими условиями"
    }
  };

  const t = translations[language];

  const presetAmounts = [50, 100, 150, 200, 300, 500];

  const handleSubmitDetails = (e) => {
    e.preventDefault();
    const amount = Number(formData.amount);
    if (!Number.isFinite(amount) || amount < MIN_AMOUNT || amount > MAX_AMOUNT) {
      setError(t.amountRange);
      return;
    }
    setError('');
    setStep(2);
  };

  const handlePurchase = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // The card itself is created server-side as 'pending' and only becomes a
      // real, readable gift card once PayPal confirms the payment.
      const createOrder = httpsCallable(functions, 'createGiftCardOrder');
      const { data } = await createOrder({
        amount: Number(formData.amount),
        recipientName: formData.recipientName,
        recipientEmail: formData.recipientEmail,
        senderName: formData.senderName,
        senderEmail: formData.senderEmail,
        message: formData.message,
        language
      });

      // Hand off to PayPal. The buyer comes back to /gift-card/complete.
      window.location.href = data.redirectUrl;
    } catch (err) {
      console.error('Error starting gift card payment:', err);
      setError(err.message || t.genericError);
      setLoading(false);
    }
    // No finally: on success the page is navigating away, and clearing the
    // spinner would flash the button back to life mid-redirect.
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100">
      <Header showBackButton={false} showLogout={false} />

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

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block p-4 bg-white rounded-full shadow-lg mb-4">
            <Gift className="w-16 h-16" style={{ color: colors.primary.teal }} />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{t.title}</h1>
          <p className="text-xl text-gray-600">{t.subtitle}</p>
        </div>

        {/* Came back from a cancelled PayPal checkout */}
        {cancelled && (
          <div className="max-w-xl mx-auto mb-8 bg-amber-50 border-2 border-amber-200 rounded-lg p-4 text-center">
            <p className="text-sm text-amber-800">{t.cancelled}</p>
          </div>
        )}

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-12">
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-6 py-3 rounded-lg ${step === 1 ? 'text-white' : 'bg-white text-gray-600'}`} style={step === 1 ? { backgroundColor: colors.primary.teal } : {}}>
              <span className="font-bold">1</span>
              <span>{t.step1}</span>
            </div>
            <div className="w-12 h-1 bg-gray-300 rounded"></div>
            <div className={`flex items-center gap-2 px-6 py-3 rounded-lg ${step === 2 ? 'text-white' : 'bg-white text-gray-600'}`} style={step === 2 ? { backgroundColor: colors.primary.teal } : {}}>
              <span className="font-bold">2</span>
              <span>{t.step2}</span>
            </div>
          </div>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {step === 1 ? (
            /* Step 1: Gift Details */
            <form onSubmit={handleSubmitDetails} className="p-8">
              <h2 className="text-2xl font-bold mb-6" style={{ color: colors.primary.teal }}>
                {t.step1}
              </h2>

              {/* Amount Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  {t.amount}
                </label>
                <p className="text-sm text-gray-600 mb-3">{t.presetAmounts}</p>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-4">
                  {presetAmounts.map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => setFormData({ ...formData, amount: amount.toString() })}
                      className={`py-3 px-4 rounded-lg font-semibold transition-all ${
                        formData.amount === amount.toString()
                          ? 'text-white shadow-lg'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      style={formData.amount === amount.toString() ? { backgroundColor: colors.primary.teal } : {}}
                    >
                      ${amount}
                    </button>
                  ))}
                </div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.customAmount}
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    min={MIN_AMOUNT}
                    max={MAX_AMOUNT}
                    step="1"
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00BCD4] focus:border-transparent text-lg font-semibold"
                    placeholder="Enter amount..."
                    required
                  />
                </div>
              </div>

              {/* Recipient Information */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recipient Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.recipientName}
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={formData.recipientName}
                        onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00BCD4] focus:border-transparent"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.recipientEmail}
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        value={formData.recipientEmail}
                        onChange={(e) => setFormData({ ...formData, recipientEmail: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00BCD4] focus:border-transparent"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Sender Information */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.senderName}
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={formData.senderName}
                        onChange={(e) => setFormData({ ...formData, senderName: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00BCD4] focus:border-transparent"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.senderEmail}
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        value={formData.senderEmail}
                        onChange={(e) => setFormData({ ...formData, senderEmail: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00BCD4] focus:border-transparent"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Personal Message */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.message}
                </label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows={4}
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00BCD4] focus:border-transparent resize-none"
                    placeholder={t.messagePlaceholder}
                  />
                </div>
              </div>

              {error && (
                <div className="mb-6 bg-red-50 border-2 border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Continue Button */}
              <button
                type="submit"
                className="w-full py-4 text-white rounded-lg font-semibold text-lg hover:opacity-90 transition-opacity"
                style={{ backgroundColor: colors.primary.teal }}
              >
                {t.continue}
              </button>
            </form>
          ) : (
            /* Step 2: Payment */
            <form onSubmit={handlePurchase} className="p-8">
              <h2 className="text-2xl font-bold mb-6" style={{ color: colors.primary.teal }}>
                {t.step2}
              </h2>

              {/* PayPal handoff — no card fields here on purpose. Card data is
                  entered on PayPal's own page, so it never touches this site. */}
              <div className="bg-gray-50 border-2 border-gray-300 rounded-xl p-8 text-center">
                <svg className="w-16 h-16 mx-auto mb-4" viewBox="0 0 24 24" fill="#00457C">
                  <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.24a.77.77 0 0 1 .758-.64h8.433c2.767 0 4.608.617 5.473 1.833.838 1.182.896 2.844.175 5.083-.841 2.622-2.354 4.327-4.502 5.073-1.015.352-2.27.545-3.735.575l-.813.01c-.672 0-.988.275-1.069.861l-.022.104-.675 4.28-.031.163a.37.37 0 0 1-.363.306zm7.723-10.07c.112-.726.184-1.204.216-1.434.165-1.194-.003-1.988-.495-2.361-.563-.426-1.549-.639-2.931-.639H8.858c-.341 0-.635.24-.692.565l-1.445 9.157h2.079c.672 0 .988-.275 1.069-.861l.022-.104.675-4.28.031-.163a.77.77 0 0 1 .758-.64h.477c1.971 0 3.444-.798 4.417-2.391.445-.728.729-1.545.85-2.449z" />
                </svg>
                <p className="text-lg text-gray-700">
                  {t.paypalInfo}
                </p>
                <div className="flex items-center justify-center gap-2 mt-4 text-sm text-gray-500">
                  <CreditCard className="w-4 h-4" />
                  <span>Visa • Mastercard • Amex</span>
                </div>
              </div>

              {/* Order Summary */}
              <div className="mt-8 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl p-6 border-2" style={{ borderColor: colors.primary.teal }}>
                <h3 className="font-bold text-lg mb-4">{t.orderSummary}</h3>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-700">{t.giftCardAmount}:</span>
                    <span className="font-semibold">C${formData.amount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">{t.to}:</span>
                    <span className="font-semibold">{formData.recipientName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">{t.from}:</span>
                    <span className="font-semibold">{formData.senderName}</span>
                  </div>
                </div>
                <div className="border-t-2 border-teal-200 pt-4 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold">{t.total}:</span>
                    <span className="text-3xl font-bold" style={{ color: colors.primary.teal }}>
                      C${formData.amount}
                    </span>
                  </div>
                </div>
              </div>

              {error && (
                <div className="mt-6 bg-red-50 border-2 border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-4 mt-8">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  disabled={loading}
                  className="flex-1 py-4 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold text-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  {t.back}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-4 text-white rounded-lg font-semibold text-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                  style={{ backgroundColor: colors.primary.teal }}
                >
                  {loading ? t.processing : t.payNow}
                </button>
              </div>

              {/* Security Note */}
              <p className="flex items-center justify-center gap-1.5 text-xs text-gray-500 text-center mt-6">
                <Lock className="w-3 h-3" />
                {t.securePayment} • {t.terms}
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default GiftCardPurchase;
