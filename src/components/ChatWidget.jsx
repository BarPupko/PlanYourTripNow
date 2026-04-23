import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Bot } from 'lucide-react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';
import colors from '../utils/colors';

const PROMPT_DELAY_MS = 60_000;

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

export default function ChatWidget({ language = 'en' }) {
  const [open, setOpen] = useState(false);
  const [prompted, setPrompted] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      setPrompted(prev => {
        if (!open) return true;
        return prev;
      });
    }, PROMPT_DELAY_MS);
    return () => clearTimeout(timerRef.current);
  }, []);

  useEffect(() => {
    if (open) {
      setPrompted(false);
      if (messages.length === 0) {
        setMessages([{ role: 'assistant', content: YEFIM_INTRO[language] || YEFIM_INTRO.en }]);
      }
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    const userMsg = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    try {
      const fn = httpsCallable(functions, 'chatWithYefim');
      const history = messages.slice(-10);
      const result = await fn({ message: text, history, language });
      setMessages(prev => [...prev, { role: 'assistant', content: result.data.reply }]);
    } catch (err) {
      console.error('chatWithYefim error:', err);
      setMessages(prev => [...prev, { role: 'assistant', content: ERROR_MSG[language] || ERROR_MSG.en }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-2">
      {/* Chat panel */}
      {open && (
        <div
          className="mb-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
          style={{ maxHeight: '480px' }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 text-white" style={{ backgroundColor: colors.primary.teal }}>
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm leading-none">Yefim</p>
              <p className="text-xs opacity-80 mt-0.5">IVRI Tours Assistant</p>
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

      {/* Prompt tooltip */}
      {prompted && !open && (
        <div className="mb-1 mr-1 max-w-xs bg-white rounded-2xl shadow-xl border border-gray-200 px-4 py-3 text-sm text-gray-800 leading-snug animate-bounce-in">
          <button
            onClick={() => setPrompted(false)}
            className="float-right ml-2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-3 h-3" />
          </button>
          {YEFIM_INTRO[language] || YEFIM_INTRO.en}
        </div>
      )}

      {/* Floating bubble */}
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
