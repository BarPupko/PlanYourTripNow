import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gift, CreditCard, DollarSign, User, Mail, MessageSquare, Lock } from 'lucide-react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';
import brand from '../utils/brand';
import siteLogo from '../assets/ivrytours-logo.png';
import siteLogoLight from '../assets/ivrytours-logo-light.png';

// Must match GIFT_CARD_MIN / GIFT_CARD_MAX in functions/paypal.js — the server
// re-validates, so this is only here to fail fast before the redirect.
const MIN_AMOUNT = 25;
const MAX_AMOUNT = 2000;

const GiftCardPurchase = () => {
  const navigate = useNavigate();
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
    <div style={{ minHeight: '100vh', background: brand.cream }}>
      <style>{`
        @media (max-width: 640px) {
          .gc-logo { height: 52px !important; }
          .gc-nav { height: 72px !important; }
        }
      `}</style>

      {/* Top utility bar — mirrors the landing page */}
      <div style={{ background: brand.ink, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.5rem' }}>
        <a href="tel:6473026849" style={{ color: 'rgba(247,248,243,0.5)', fontSize: 11, textDecoration: 'none', letterSpacing: '0.02em' }}>
          📞 647-302-6849
        </a>
        {/* This page keeps its own EN/RU toggle rather than the global language
            selector: the gift-card emails and PayPal handoff only exist in those two. */}
        <div style={{ display: 'flex', gap: 2 }}>
          {[{ code: 'en', flag: '🇨🇦', label: 'EN' }, { code: 'ru', flag: '🇷🇺', label: 'RU' }].map(l => (
            <button
              key={l.code}
              onClick={() => setLanguage(l.code)}
              style={{
                background: language === l.code ? brand.red : 'transparent',
                color: language === l.code ? brand.cream : 'rgba(247,248,243,0.5)',
                border: 'none', borderRadius: 5, padding: '3px 9px', fontSize: 11,
                fontWeight: language === l.code ? 700 : 400, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.15s',
              }}
            >
              {l.flag} {l.label}
            </button>
          ))}
        </div>
      </div>

      <nav style={{ position: 'sticky', top: 0, zIndex: 40, background: 'rgba(247,248,243,0.93)', backdropFilter: 'blur(14px) saturate(140%)', borderBottom: `1px solid ${brand.line}` }}>
        <div className="gc-nav" style={{ maxWidth: 1280, margin: '0 auto', padding: '0 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 124 }}>
          <button onClick={() => navigate('/')} style={{ display: 'block', lineHeight: 0, background: 'none', border: 'none', padding: 0, cursor: 'pointer' }} title="Go to home page">
            <img src={siteLogo} alt="IVRYTOURS INC" className="gc-logo" style={{ height: 100, width: 'auto', display: 'block' }} />
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block p-4 rounded-full mb-5" style={{ background: '#FFFFFF', border: `1px solid ${brand.line}`, boxShadow: '0 10px 28px -12px rgba(15,29,58,0.35)' }}>
            <Gift className="w-14 h-14" style={{ color: brand.red }} />
          </div>
          <p style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: brand.muted, marginBottom: 10 }}>
            {language === 'ru' ? '— ПОДАРОЧНЫЕ КАРТЫ' : '— GIFT CARDS'}
          </p>
          <h1 style={{ fontFamily: '"Fraunces", Georgia, serif', fontWeight: 350, fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.02em', color: brand.navy, marginBottom: 12 }}>
            {t.title}
          </h1>
          <p style={{ fontSize: 17, lineHeight: 1.6, color: brand.body }}>{t.subtitle}</p>
        </div>

        {/* Came back from a cancelled PayPal checkout */}
        {cancelled && (
          <div className="max-w-xl mx-auto mb-8 rounded-lg p-4 text-center" style={{ background: '#FFFFFF', border: `1px solid ${brand.red}`, borderLeft: `4px solid ${brand.red}` }}>
            <p className="text-sm" style={{ color: brand.navy }}>{t.cancelled}</p>
          </div>
        )}

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-12">
          <div className="flex items-center gap-4">
            {[{ n: 1, label: t.step1 }, { n: 2, label: t.step2 }].map(({ n, label }, i) => (
              <div key={n} className="flex items-center gap-4">
                {i > 0 && <div style={{ width: 48, height: 2, background: brand.line, borderRadius: 2 }} />}
                <div
                  className="flex items-center gap-2 px-6 py-3 rounded-lg"
                  style={step === n
                    ? { background: brand.blue, color: '#FFFFFF' }
                    : { background: '#FFFFFF', color: brand.body, border: `1px solid ${brand.line}` }}
                >
                  <span style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 700, fontSize: 13 }}>
                    {String(n).padStart(2, '0')}
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>{label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Form Container */}
        <div className="overflow-hidden" style={{ background: '#FFFFFF', borderRadius: 16, border: `1px solid ${brand.line}`, boxShadow: '0 4px 24px rgba(15,29,58,0.08)' }}>
          {step === 1 ? (
            /* Step 1: Gift Details */
            <form onSubmit={handleSubmitDetails} className="p-8">
              <h2 style={{ fontFamily: '"Fraunces", Georgia, serif', fontWeight: 500, fontSize: 24, color: brand.navy, marginBottom: 24 }}>
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
                      className="py-3 px-4 rounded-lg font-semibold transition-all"
                      style={formData.amount === amount.toString()
                        ? { background: brand.blue, color: '#FFFFFF', border: `1.5px solid ${brand.blue}` }
                        : { background: brand.creamAlt, color: brand.body, border: `1.5px solid ${brand.line}` }}
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
                    className="w-full pl-12 pr-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-[#1E396C] focus:border-transparent border-[#DCE0D4] text-lg font-semibold"
                    placeholder="Enter amount..."
                    required
                  />
                </div>
              </div>

              {/* Recipient Information */}
              <div className="mb-6">
                <h3 style={{ fontFamily: '"Fraunces", Georgia, serif', fontSize: 18, fontWeight: 500, color: brand.navy, marginBottom: 16 }}>
                  {language === 'ru' ? 'Данные получателя' : 'Recipient Information'}
                </h3>
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
                        className="w-full pl-10 pr-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-[#1E396C] focus:border-transparent border-[#DCE0D4]"
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
                        className="w-full pl-10 pr-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-[#1E396C] focus:border-transparent border-[#DCE0D4]"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Sender Information */}
              <div className="mb-6">
                <h3 style={{ fontFamily: '"Fraunces", Georgia, serif', fontSize: 18, fontWeight: 500, color: brand.navy, marginBottom: 16 }}>
                  {language === 'ru' ? 'Ваши данные' : 'Your Information'}
                </h3>
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
                        className="w-full pl-10 pr-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-[#1E396C] focus:border-transparent border-[#DCE0D4]"
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
                        className="w-full pl-10 pr-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-[#1E396C] focus:border-transparent border-[#DCE0D4]"
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
                    className="w-full pl-10 pr-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-[#1E396C] focus:border-transparent border-[#DCE0D4] resize-none"
                    placeholder={t.messagePlaceholder}
                  />
                </div>
              </div>

              {error && (
                <div className="mb-6 rounded-lg p-4 border-2 border-[#8E1F1B]/25 bg-[#8E1F1B]/5">
                  <p className="text-sm" style={{ color: brand.redMuted }}>{error}</p>
                </div>
              )}

              {/* Continue Button */}
              <button
                type="submit"
                className="w-full py-4 text-white rounded-lg font-semibold text-lg hover:opacity-90 transition-opacity"
                style={{ backgroundColor: brand.blue }}
              >
                {t.continue}
              </button>
            </form>
          ) : (
            /* Step 2: Payment */
            <form onSubmit={handlePurchase} className="p-8">
              <h2 style={{ fontFamily: '"Fraunces", Georgia, serif', fontWeight: 500, fontSize: 24, color: brand.navy, marginBottom: 24 }}>
                {t.step2}
              </h2>

              {/* PayPal handoff — no card fields here on purpose. Card data is
                  entered on PayPal's own page, so it never touches this site. */}
              <div className="rounded-xl p-8 text-center" style={{ background: brand.creamAlt, border: `1px solid ${brand.line}` }}>
                <svg className="w-16 h-16 mx-auto mb-4" viewBox="0 0 24 24" fill="#00457C">
                  <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.24a.77.77 0 0 1 .758-.64h8.433c2.767 0 4.608.617 5.473 1.833.838 1.182.896 2.844.175 5.083-.841 2.622-2.354 4.327-4.502 5.073-1.015.352-2.27.545-3.735.575l-.813.01c-.672 0-.988.275-1.069.861l-.022.104-.675 4.28-.031.163a.37.37 0 0 1-.363.306zm7.723-10.07c.112-.726.184-1.204.216-1.434.165-1.194-.003-1.988-.495-2.361-.563-.426-1.549-.639-2.931-.639H8.858c-.341 0-.635.24-.692.565l-1.445 9.157h2.079c.672 0 .988-.275 1.069-.861l.022-.104.675-4.28.031-.163a.77.77 0 0 1 .758-.64h.477c1.971 0 3.444-.798 4.417-2.391.445-.728.729-1.545.85-2.449z" />
                </svg>
                <p style={{ fontSize: 16, lineHeight: 1.6, color: brand.body }}>
                  {t.paypalInfo}
                </p>
                <div className="flex items-center justify-center gap-2 mt-4 text-sm" style={{ color: brand.muted }}>
                  <CreditCard className="w-4 h-4" />
                  <span>Visa • Mastercard • Amex</span>
                </div>
              </div>

              {/* Order Summary */}
              <div className="mt-8 rounded-xl p-6" style={{ background: brand.creamAlt, border: `1.5px solid ${brand.blue}` }}>
                <h3 style={{ fontFamily: '"Fraunces", Georgia, serif', fontSize: 18, fontWeight: 500, color: brand.navy, marginBottom: 16 }}>{t.orderSummary}</h3>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span style={{ color: brand.body }}>{t.giftCardAmount}:</span>
                    <span className="font-semibold">C${formData.amount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: brand.body }}>{t.to}:</span>
                    <span className="font-semibold">{formData.recipientName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: brand.body }}>{t.from}:</span>
                    <span className="font-semibold">{formData.senderName}</span>
                  </div>
                </div>
                <div className="pt-4 mt-4" style={{ borderTop: `1px solid ${brand.line}` }}>
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold">{t.total}:</span>
                    <span className="text-3xl font-bold" style={{ fontFamily: '"Fraunces", Georgia, serif', fontWeight: 500, color: brand.navy }}>
                      C${formData.amount}
                    </span>
                  </div>
                </div>
              </div>

              {error && (
                <div className="mt-6 rounded-lg p-4 border-2 border-[#8E1F1B]/25 bg-[#8E1F1B]/5">
                  <p className="text-sm" style={{ color: brand.redMuted }}>{error}</p>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-4 mt-8">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  disabled={loading}
                  className="flex-1 py-4 rounded-lg font-semibold text-lg transition-colors disabled:opacity-50"
                  style={{ border: `1.5px solid ${brand.lineStrong}`, color: brand.navy, background: 'transparent' }}
                >
                  {t.back}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-4 text-white rounded-lg font-semibold text-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                  style={{ backgroundColor: brand.blue }}
                >
                  {loading ? t.processing : t.payNow}
                </button>
              </div>

              {/* Security Note */}
              <p className="flex items-center justify-center gap-1.5 text-xs text-center mt-6" style={{ color: brand.muted }}>
                <Lock className="w-3 h-3" />
                {t.securePayment} • {t.terms}
              </p>
            </form>
          )}
        </div>
      </div>

      {/* Compact footer — enough to close the page in the brand without
          duplicating the landing page's full sitemap. */}
      <footer style={{ background: brand.navy, color: brand.cream, padding: '2.5rem 1.5rem 2rem', marginTop: '3rem' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
          <div style={{ fontFamily: '"Fraunces", Georgia, serif', fontStyle: 'italic', fontWeight: 350, fontSize: 'clamp(1.25rem, 3vw, 2rem)', lineHeight: 0.9, color: brand.cream, letterSpacing: '-0.03em', opacity: 0.9 }}>
            IVRYTOURS
          </div>
          <img src={siteLogoLight} alt="IVRYTOURS INC" style={{ height: 64, width: 'auto', display: 'block', opacity: 0.95 }} />
        </div>
        <div style={{ maxWidth: 1280, margin: '1.5rem auto 0', borderTop: '1px solid rgba(247,248,243,0.15)', paddingTop: '1.25rem' }}>
          <p style={{ color: brand.onDarkMuted, fontSize: 13 }}>
            © 2026 IVRYTOURS INC. {language === 'ru' ? 'Все права защищены.' : 'All rights reserved.'}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default GiftCardPurchase;
