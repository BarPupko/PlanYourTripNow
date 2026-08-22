import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Bot, Phone, Users } from 'lucide-react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';
import { createQuestion } from '../utils/firestoreUtils';
import brand from '../utils/brand';

const PROMPT_DELAY_MS = 60_000;
const INACTIVITY_MSG_DELAY_MS = 60_000;

// Yefim's persona lives server-side in the chatWithYefim function (functions/index.js)

const YEFIM_INTRO = {
  en: "Hello, my name is Yefim 👋 I would like to help you with anything you need related to our tours, please feel free to ask!",
  he: "שלום, שמי יפים 👋 אשמח לעזור לך בכל שאלה הקשורה לטיולים שלנו, אל תהסס לשאול!",
  ru: "Привет, меня зовут Ефим 👋 Я помогу вам с любым вопросом о наших турах, не стесняйтесь спрашивать!"
};

const PLACEHOLDER = {
  en: "Ask me anything about our tours…",
  he: "שאל אותי כל דבר על הטיולים שלנו…",
  ru: "Спросите меня о наших турах…"
};

const SEND_LABEL = { en: "Send", he: "שלח", ru: "Отправить" };
const ERROR_MSG = {
  en: "Sorry, I couldn't connect right now. Please try again.",
  he: "מצטער, לא הצלחתי להתחבר כרגע. נסה שוב.",
  ru: "Извините, не удалось подключиться. Попробуйте снова."
};

const INACTIVITY_MSG = {
  en: "If you'd like us to reach out to you directly, please provide your contact information or call us at (647) 302-6849",
  he: "אם אתה מעדיף שנשמור אליך ישירות, אנא תן לנו את פרטי הקשר או התקשר אלינו בטלפון (647) 302-6849",
  ru: "Если вы хотите, чтобы мы связались с вами напрямую, пожалуйста, предоставьте вашу контактную информацию или позвоните нам по телефону (647) 302-6849"
};

// Try to extract contact info from conversation messages
const extractContactInfo = (msgs) => {
  const allText = msgs.map(m => m.content).join('\n');
  const emailMatch = allText.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/);
  const phoneMatch = allText.match(/\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}\b/);
  // Look for AI addressing user by name e.g. "Thank you, Bar!"
  const aiNameMatch = msgs
    .filter(m => m.role === 'assistant')
    .map(m => m.content).join('\n')
    .match(/(?:Thank you,?\s+|Hello,?\s+|Hi,?\s+)([A-Z][a-zA-Z]+)/);
  const userNameMatch = allText.match(/(?:my name is|I'm|I am)\s+([A-Z][a-zA-Z]+)/i);
  return {
    name: (aiNameMatch?.[1] || userNameMatch?.[1] || '').trim(),
    email: emailMatch?.[0] || '',
    phone: phoneMatch?.[0] || '',
  };
};

const buildTranscript = (msgs) =>
  msgs
    .filter(m => m.content)
    .map(m => `${m.role === 'user' ? 'Visitor' : 'Yefim'}: ${m.content}`)
    .join('\n\n');

export default function ChatWidget({ language = 'en' }) {
  const [open, setOpen] = useState(false);
  const [prompted, setPrompted] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [showInactivityMsg, setShowInactivityMsg] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [submittingContact, setSubmittingContact] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const inactivityTimerRef = useRef(null);

  useEffect(() => {
    let timeoutId;
    if (!open && !prompted) {
      timeoutId = setTimeout(() => setPrompted(true), PROMPT_DELAY_MS);
    }
    return () => { if (timeoutId) clearTimeout(timeoutId); };
  }, [open, prompted]);

  const resetInactivityTimer = () => {
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    inactivityTimerRef.current = setTimeout(() => setShowInactivityMsg(true), INACTIVITY_MSG_DELAY_MS);
  };

  useEffect(() => {
    if (open) {
      setPrompted(false);
      if (messages.length === 0) {
        setMessages([{ role: 'assistant', content: YEFIM_INTRO[language] || YEFIM_INTRO.en }]);
      }
      setTimeout(() => inputRef.current?.focus(), 100);
      resetInactivityTimer();
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, showInactivityMsg]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    resetInactivityTimer();
    setShowInactivityMsg(false);
    const userMsg = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    try {
      const history = messages.slice(-10);

      // Always via the callable — the model API key stays server-side
      const chatWithYefim = httpsCallable(functions, 'chatWithYefim');
      const result = await chatWithYefim({ message: text, history, language });
      const reply = result.data.reply || '';

      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      console.error('Chat error:', err);
      setMessages(prev => [...prev, { role: 'assistant', content: ERROR_MSG[language] || ERROR_MSG.en }]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSendToTeam = () => {
    const extracted = extractContactInfo(messages);
    setContactForm(prev => ({
      name: extracted.name || prev.name,
      email: extracted.email || prev.email,
      phone: extracted.phone || prev.phone,
      message: prev.message,
    }));
    setShowContactForm(true);
    setShowInactivityMsg(false);
  };

  const handleContactSubmit = async () => {
    if (!contactForm.name.trim() || !contactForm.email.trim() || !contactForm.phone.trim()) {
      alert(language === 'en' ? 'Please fill in name, email, and phone' : language === 'he' ? 'אנא מלא שם, אימייל וטלפון' : 'Пожалуйста, заполните имя, email и телефон');
      return;
    }
    setSubmittingContact(true);

    const transcript = buildTranscript(messages);
    const fullMessage = contactForm.message.trim()
      ? `${contactForm.message.trim()}\n\n--- Chat Transcript ---\n${transcript}`
      : `--- Chat Transcript ---\n${transcript}`;

    try {
      // Save to questions (shows up in admin Questions panel)
      await createQuestion({
        name: contactForm.name.trim(),
        email: contactForm.email.trim(),
        phone: contactForm.phone.trim(),
        message: fullMessage,
        destination: 'Chat',
        language,
        source: 'chat_widget',
      });

      // Send email notification (non-blocking — don't fail the whole flow if email fails)
      try {
        const sendEmail = httpsCallable(functions, 'sendContactEmail');
        await sendEmail({
          name: contactForm.name.trim(),
          email: contactForm.email.trim(),
          phone: contactForm.phone.trim(),
          destination: 'Chat Inquiry via Yefim',
          message: fullMessage,
          toEmail: 'pupko@mail.com',
        });
      } catch (emailErr) {
        console.warn('Email notification failed (info still saved):', emailErr);
      }

      const confirmMsg = language === 'en'
        ? 'Thank you! Your information and our conversation have been sent to our team. We will contact you soon! 🎉'
        : language === 'he'
        ? 'תודה! המידע שלך ושיחתנו נשלחו לצוות. ניצור איתך קשר בקרוב! 🎉'
        : 'Спасибо! Ваша информация и наш разговор отправлены команде. Мы свяжемся с вами в ближайшее время! 🎉';

      setMessages(prev => [...prev, { role: 'assistant', content: confirmMsg }]);
      setShowContactForm(false);
      setSubmitted(true);
      setContactForm({ name: '', email: '', phone: '', message: '' });
    } catch (err) {
      console.error('Contact submission error:', err);
      alert(language === 'en' ? 'Error sending information. Please try again.' : language === 'he' ? 'שגיאה בשליחת המידע. אנא נסה שוב.' : 'Ошибка отправки. Попробуйте ещё раз.');
    } finally {
      setSubmittingContact(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const hasUserMessages = messages.some(m => m.role === 'user');

  return (
    <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-2">
      {open && (
        <div
          className="mb-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
          style={{ maxHeight: '600px' }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 text-white" style={{ backgroundColor: brand.blue }}>
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm leading-none">Yefim</p>
              <p className="text-xs opacity-80 mt-0.5">IVRITours Assistant</p>
            </div>

            {/* Send to Team button — visible once user has sent a message */}
            {hasUserMessages && !submitted && (
              <button
                onClick={handleOpenSendToTeam}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-semibold transition-colors"
                title={language === 'en' ? 'Send conversation to our team' : language === 'he' ? 'שלח שיחה לצוות' : 'Отправить команде'}
              >
                <Users className="w-3.5 h-3.5" />
                {language === 'en' ? 'Send to Team' : language === 'he' ? 'שלח לצוות' : 'Команде'}
              </button>
            )}

            <button onClick={() => setOpen(false)} className="hover:bg-white/20 rounded-full p-1 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-gray-50">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'text-white rounded-br-sm'
                      : 'bg-white text-gray-800 shadow-sm rounded-bl-sm'
                  }`}
                  style={msg.role === 'user' ? { backgroundColor: brand.blue } : {}}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white px-4 py-2 rounded-2xl rounded-bl-sm shadow-sm flex gap-1">
                  {[0, 1, 2].map(i => (
                    <span key={i} className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            )}

            {showInactivityMsg && !showContactForm && (
              <div className="flex justify-start">
                <div className="bg-blue-50 border border-blue-200 px-3 py-2 rounded-2xl rounded-bl-sm text-sm text-blue-900 shadow-sm">
                  <p className="mb-3">{INACTIVITY_MSG[language] || INACTIVITY_MSG.en}</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-blue-700 font-medium">
                      <Phone className="w-4 h-4" />
                      <span>(647) 302-6849</span>
                    </div>
                    <button
                      onClick={handleOpenSendToTeam}
                      className="w-full px-3 py-1.5 bg-blue-500 text-white rounded-lg text-xs font-semibold hover:bg-blue-600 transition-colors"
                    >
                      {language === 'en' ? 'Send Your Info' : language === 'he' ? 'שלח את הפרטים שלך' : 'Отправить вашу информацию'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {showContactForm && (
              <div className="flex justify-start w-full">
                <div className="bg-white border-2 border-gray-200 px-3 py-3 rounded-2xl rounded-bl-sm text-sm w-full space-y-2">
                  <p className="font-semibold text-gray-900 mb-2">
                    {language === 'en' ? 'Send Your Info to Our Team' : language === 'he' ? 'שלח פרטים לצוות' : 'Отправить информацию команде'}
                  </p>
                  <input
                    type="text"
                    placeholder={language === 'en' ? 'Name *' : language === 'he' ? 'שם *' : 'Имя *'}
                    value={contactForm.name}
                    onChange={e => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:border-[#1E396C]"
                  />
                  <input
                    type="email"
                    placeholder={language === 'en' ? 'Email *' : language === 'he' ? 'דוא"ל *' : 'Почта *'}
                    value={contactForm.email}
                    onChange={e => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:border-[#1E396C]"
                  />
                  <input
                    type="tel"
                    placeholder={language === 'en' ? 'Phone *' : language === 'he' ? 'טלפון *' : 'Телефон *'}
                    value={contactForm.phone}
                    onChange={e => setContactForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:border-[#1E396C]"
                  />
                  <textarea
                    placeholder={language === 'en' ? 'Additional notes (optional)' : language === 'he' ? 'הערות נוספות (אופציונלי)' : 'Доп. заметки (опционально)'}
                    rows={2}
                    value={contactForm.message}
                    onChange={e => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:border-[#1E396C] resize-none"
                  />
                  <p className="text-[10px] text-gray-400">
                    {language === 'en'
                      ? 'Your full conversation will be included so our team has all the context.'
                      : language === 'he'
                      ? 'השיחה המלאה תצורף כדי שהצוות יהיה עם כל ההקשר.'
                      : 'Полный разговор будет включён, чтобы у команды был весь контекст.'}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowContactForm(false)}
                      className="flex-1 px-2 py-1.5 text-gray-600 border border-gray-300 rounded-lg text-xs font-semibold hover:bg-gray-50"
                    >
                      {language === 'en' ? 'Cancel' : language === 'he' ? 'ביטול' : 'Отмена'}
                    </button>
                    <button
                      onClick={handleContactSubmit}
                      disabled={submittingContact}
                      className="flex-1 px-2 py-1.5 text-white rounded-lg text-xs font-semibold hover:opacity-90 disabled:opacity-50"
                      style={{ backgroundColor: brand.blue }}
                    >
                      {submittingContact
                        ? (language === 'en' ? 'Sending…' : language === 'he' ? 'שולח…' : 'Отправка…')
                        : (language === 'en' ? 'Send to Team' : language === 'he' ? 'שלח לצוות' : 'Отправить команде')}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-3 bg-white border-t border-gray-100 flex gap-2">
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={PLACEHOLDER[language] || PLACEHOLDER.en}
              className="flex-1 resize-none text-sm border-2 border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-[#1E396C] transition-colors"
              style={{ maxHeight: '80px' }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="flex-shrink-0 w-9 h-9 rounded-xl text-white flex items-center justify-center hover:opacity-90 transition-all disabled:opacity-40"
              style={{ backgroundColor: brand.blue }}
              title={SEND_LABEL[language]}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {prompted && !open && (
        <div className="mb-1 mr-1 max-w-xs bg-white rounded-2xl shadow-xl border border-gray-200 px-4 py-3 text-sm text-gray-800 leading-snug animate-bounce-in">
          <button onClick={() => setPrompted(false)} className="float-right ml-2 text-gray-400 hover:text-gray-600">
            <X className="w-3 h-3" />
          </button>
          {YEFIM_INTRO[language] || YEFIM_INTRO.en}
        </div>
      )}

      <button
        onClick={() => setOpen(prev => !prev)}
        className="w-14 h-14 rounded-full text-white shadow-2xl flex items-center justify-center hover:scale-110 transition-all duration-300 relative"
        style={{ backgroundColor: brand.blue, boxShadow: '0 10px 30px rgba(30,57,108,0.35)' }}
        title="Chat with Yefim"
        aria-label="Open chat"
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
        {prompted && !open && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse" />
        )}
      </button>

      <style>{`
        @keyframes bounce-in {
          0% { transform: scale(0.8) translateY(10px); opacity: 0; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        .animate-bounce-in { animation: bounce-in 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
}
