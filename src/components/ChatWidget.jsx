import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Bot, Phone } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../firebase';
import colors from '../utils/colors';

const PROMPT_DELAY_MS = 60_000;
const INACTIVITY_MSG_DELAY_MS = 60_000;

const SYSTEM_PROMPT = `You are Yefim, a warm and knowledgeable tour assistant for IVRITours — a Canadian tour company offering guided trips across North America (Toronto, Niagara Falls, Quebec City, Mont-Tremblant, Detroit, Chicago, Barrie, and more). Tours are conducted in English, Hebrew, and Russian.

IMPORTANT CONTACT INFORMATION:
- Phone: (647) 302-6846
- Email: ivristats@gmail.com
- Website: https://www.ivritours.ca/

When users ask how to reach the company or need contact information:
1. Always provide the PHONE NUMBER: (647) 302-6846
2. Mention that they can also call us directly or visit the website
3. Offer to gather their information if they prefer

Your role is to:
- Help with questions about destinations, tour schedules, pricing, what to bring, registration
- Answer questions related to IVRITours activities and services
- Collect contact information (name, email, phone) if the user wants the company to reach out
- Always respond in the same language the user writes in
- Be friendly, concise, and helpful
- If you don't know a specific price or date, direct them to call (647) 302-6846 or visit the website

If a user wants the company to contact them, ask for: name, phone number, email, and what they're interested in.`;

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
  en: "If you'd like us to reach out to you directly, please provide your contact information or call us at (647) 302-6846",
  he: "אם אתה מעדיף שנשמור אליך ישירות, אנא תן לנו את פרטי הקשר או התקשר אלינו בטלפון (647) 302-6846",
  ru: "Если вы хотите, чтобы мы связались с вами напрямую, пожалуйста, предоставьте вашу контактную информацию или позвоните нам по телефону (647) 302-6846"
};

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

  const handleContactSubmit = async () => {
    if (!contactForm.name || !contactForm.email || !contactForm.phone) {
      alert(language === 'en' ? 'Please fill in all fields' : language === 'he' ? 'אנא מלא את כל השדות' : 'Пожалуйста, заполните все поля');
      return;
    }
    setSubmittingContact(true);
    try {
      await addDoc(collection(db, 'contactRequests'), {
        name: contactForm.name,
        email: contactForm.email,
        phone: contactForm.phone,
        message: contactForm.message,
        createdAt: serverTimestamp(),
        source: 'chat_widget'
      });
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: language === 'en'
          ? 'Thank you! We received your information and will contact you soon at the phone number you provided.'
          : language === 'he'
          ? 'תודה! קיבלנו את המידע שלך וניצור איתך קשר בקרוב בטלפון שנתת.'
          : 'Спасибо! Мы получили вашу информацию и вскоре свяжемся с вами по номеру телефона, который вы предоставили.'
      }]);
      setShowContactForm(false);
      setContactForm({ name: '', email: '', phone: '', message: '' });
    } catch (err) {
      console.error('Contact submission error:', err);
      alert(language === 'en' ? 'Error sending information' : language === 'he' ? 'שגיאה בשליחת המידע' : 'Ошибка отправки информации');
    } finally {
      setSubmittingContact(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-2">
      {open && (
        <div
          className="mb-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
          style={{ maxHeight: '600px' }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 text-white" style={{ backgroundColor: colors.primary.teal }}>
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm leading-none">Yefim</p>
              <p className="text-xs opacity-80 mt-0.5">IVRITours Assistant</p>
            </div>
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
                  style={msg.role === 'user' ? { backgroundColor: colors.primary.teal } : {}}
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
                      <span>(647) 302-6846</span>
                    </div>
                    <button
                      onClick={() => setShowContactForm(true)}
                      className="w-full px-3 py-1.5 bg-blue-500 text-white rounded-lg text-xs font-semibold hover:bg-blue-600 transition-colors"
                    >
                      {language === 'en' ? 'Send Your Info' : language === 'he' ? 'שלח את הפרטים שלך' : 'Отправить вашу информацию'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {showContactForm && (
              <div className="flex justify-start">
                <div className="bg-white border-2 border-gray-200 px-3 py-3 rounded-2xl rounded-bl-sm text-sm w-full space-y-2">
                  <p className="font-semibold text-gray-900 mb-2">
                    {language === 'en' ? 'Your Information' : language === 'he' ? 'הפרטים שלך' : 'Ваша информация'}
                  </p>
                  <input type="text" placeholder={language === 'en' ? 'Name' : language === 'he' ? 'שם' : 'Имя'} value={contactForm.name} onChange={e => setContactForm(prev => ({ ...prev, name: e.target.value }))} className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:border-blue-500" />
                  <input type="email" placeholder={language === 'en' ? 'Email' : language === 'he' ? 'דוא"ל' : 'Почта'} value={contactForm.email} onChange={e => setContactForm(prev => ({ ...prev, email: e.target.value }))} className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:border-blue-500" />
                  <input type="tel" placeholder={language === 'en' ? 'Phone' : language === 'he' ? 'טלפון' : 'Телефон'} value={contactForm.phone} onChange={e => setContactForm(prev => ({ ...prev, phone: e.target.value }))} className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:border-blue-500" />
                  <textarea placeholder={language === 'en' ? 'Message (optional)' : language === 'he' ? 'הודעה (אופציונלי)' : 'Сообщение (опционально)'} rows={2} value={contactForm.message} onChange={e => setContactForm(prev => ({ ...prev, message: e.target.value }))} className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:border-blue-500 resize-none" />
                  <div className="flex gap-2">
                    <button onClick={() => setShowContactForm(false)} className="flex-1 px-2 py-1.5 text-gray-600 border border-gray-300 rounded-lg text-xs font-semibold hover:bg-gray-50">
                      {language === 'en' ? 'Cancel' : language === 'he' ? 'ביטול' : 'Отмена'}
                    </button>
                    <button onClick={handleContactSubmit} disabled={submittingContact} className="flex-1 px-2 py-1.5 bg-green-500 text-white rounded-lg text-xs font-semibold hover:bg-green-600 disabled:opacity-50">
                      {submittingContact ? (language === 'en' ? 'Sending…' : language === 'he' ? 'שולח…' : 'Отправка…') : (language === 'en' ? 'Send' : language === 'he' ? 'שלח' : 'Отправить')}
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
              className="flex-1 resize-none text-sm border-2 border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-[#00BCD4] transition-colors"
              style={{ maxHeight: '80px' }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="flex-shrink-0 w-9 h-9 rounded-xl text-white flex items-center justify-center hover:opacity-90 transition-all disabled:opacity-40"
              style={{ backgroundColor: colors.primary.teal }}
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
        style={{ backgroundColor: colors.primary.teal, boxShadow: '0 10px 30px rgba(0,188,212,0.4)' }}
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
