import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { Facebook } from 'lucide-react';
import colors from '../utils/colors';

const LandingPage = () => {
  const navigate = useNavigate();
  const { language, changeLanguage } = useLanguage();
  const [showWelcome, setShowWelcome] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    destination: '',
    message: ''
  });

  useEffect(() => {
    const hasVisited = sessionStorage.getItem('hasVisitedLanding');
    if (!hasVisited) {
      setShowWelcome(true);
      sessionStorage.setItem('hasVisitedLanding', 'true');
    }
  }, []);

  const translations = {
    en: {
      welcome: "Welcome to IVRI Tours!",
      welcomeMsg: "Discover breathtaking destinations with expert tour guides in multiple languages. Your adventure begins here!",
      getStarted: "Get Started",
      heroTitle: "Explore the World with IVRI Tours",
      heroSubtitle: "Professional guided tours in English, Hebrew, and Russian",
      destinationsTitle: "Our Amazing Destinations",
      multiLang: "Multi-language Tours Available",
      testimonialsTitle: "What People Say About Us",
      facebookTitle: "Follow Us on Facebook",
      facebookDesc: "Stay connected with our latest tours, photos, and travel tips!",
      visitFacebook: "Visit Our Facebook Page",
      contactTitle: "Contact Us",
      nameLabel: "Name",
      emailLabel: "Email",
      phoneLabel: "Phone",
      destinationLabel: "Preferred Destination",
      messageLabel: "Message",
      submitBtn: "Send Message",
      footerText: "All rights reserved. Explore the world with us!",
      adminLogin: "Admin Login",
      destinations: {
        toronto: {
          title: "Toronto Downtown",
          desc: "Experience the vibrant heart of Canada's largest city. Explore the iconic CN Tower, bustling harbourfront, and diverse neighborhoods with our expert guides."
        },
        niagara: {
          title: "Niagara Falls",
          desc: "Witness the majestic power of one of the world's most famous waterfalls. Get up close with boat tours and enjoy breathtaking views from multiple vantage points."
        },
        tremblant: {
          title: "Mont Tremblant",
          desc: "Discover the charm of Quebec's premier resort village. Enjoy stunning mountain scenery, outdoor activities year-round, and European-style village atmosphere."
        },
        quebec: {
          title: "Quebec City",
          desc: "Step into a European fairytale in North America. Wander through cobblestone streets, visit historic fortifications, and immerse yourself in French Canadian culture."
        },
        barrie: {
          title: "Barrie",
          desc: "Explore this beautiful lakeside city on the shores of Lake Simcoe. Enjoy waterfront parks, beaches, and a charming downtown with rich local history."
        },
        detroit: {
          title: "Detroit",
          desc: "Discover the Motor City's rich automotive heritage and vibrant cultural renaissance. Visit world-class museums, stunning architecture, and thriving arts districts."
        },
        chicago: {
          title: "Chicago",
          desc: "Experience the Windy City's iconic skyline, world-renowned architecture, deep-dish pizza, and vibrant cultural scene along beautiful Lake Michigan."
        }
      },
      testimonials: [
        { text: "Amazing experience! The tour guide was knowledgeable and friendly. Seeing Niagara Falls was a dream come true!", author: "Sarah M." },
        { text: "The multi-language support made everything so comfortable for our family. Highly recommend IVRI Tours!", author: "David L." },
        { text: "Quebec City tour was magical! Our guide shared fascinating stories and insider tips. Best vacation ever!", author: "Rachel K." },
        { text: "Professional, organized, and fun! The Chicago architecture tour exceeded all expectations. Thank you IVRI Tours!", author: "Michael R." }
      ]
    },
    he: {
      welcome: "ברוכים הבאים ל-IVRI Tours!",
      welcomeMsg: "גלו יעדים עוצרי נשימה עם מדריכי טיולים מומחים במספר שפות. ההרפתקה שלכם מתחילה כאן!",
      getStarted: "בואו נתחיל",
      heroTitle: "חקרו את העולם עם IVRI Tours",
      heroSubtitle: "סיורים מודרכים מקצועיים באנגלית, עברית ורוסית",
      destinationsTitle: "היעדים המדהימים שלנו",
      multiLang: "סיורים בריבוי שפות זמינים",
      testimonialsTitle: "מה אומרים עלינו",
      facebookTitle: "עקבו אחרינו בפייסבוק",
      facebookDesc: "הישארו מחוברים עם הטיולים האחרונים שלנו, תמונות וטיפים לטיולים!",
      visitFacebook: "בקרו בדף הפייסבוק שלנו",
      contactTitle: "צרו קשר",
      nameLabel: "שם",
      emailLabel: "אימייל",
      phoneLabel: "טלפון",
      destinationLabel: "יעד מועדף",
      messageLabel: "הודעה",
      submitBtn: "שלח הודעה",
      footerText: "כל הזכויות שמורות. חקרו את העולם איתנו!",
      adminLogin: "כניסת מנהל",
      destinations: {
        toronto: {
          title: "מרכז טורונטו",
          desc: "חוו את הלב התוסס של העיר הגדולה ביותר בקנדה. חקרו את מגדל CN האיקוני, הנמל התוסס והשכונות המגוונות עם המדריכים המומחים שלנו."
        },
        niagara: {
          title: "מפלי ניאגרה",
          desc: "היו עדים לעוצמה המלכותית של אחד ממפלי המים המפורסמים בעולם. התקרבו עם סיורי סירה ותהנו מנופים עוצרי נשימה מנקודות תצפית מרובות."
        },
        tremblant: {
          title: "מון טרמבלן",
          desc: "גלו את הקסם של כפר הנופש המוביל בקוויבק. תהנו מנוף הרים מדהים, פעילויות חוצות כל השנה ואווירה בסגנון אירופאי."
        },
        quebec: {
          title: "קוויבק סיטי",
          desc: "היכנסו לאגדה אירופאית בצפון אמריקה. טיילו ברחובות מרוצפים, בקרו בביצורים היסטוריים והיטמעו בתרבות הקנדית-צרפתית."
        },
        barrie: {
          title: "בארי",
          desc: "חקרו את העיר היפה הזו על שפת אגם סימקו. תהנו מפארקי חוף, חופים ומרכז עיר מקסים עם היסטוריה מקומית עשירה."
        },
        detroit: {
          title: "דטרויט",
          desc: "גלו את המורשת הרכבית העשירה של עיר המוטורים ואת הרנסנס התרבותי התוסס. בקרו במוזיאונים ברמה עולמית, אדריכלות מדהימה ורובעי אמנות משגשגים."
        },
        chicago: {
          title: "שיקגו",
          desc: "חוו את קו הרקיע האיקוני של העיר הסוערת, אדריכלות בעלת שם עולמי, פיצה עמוקה וסצנה תרבותית תוססת לאורך אגם מישיגן היפהפה."
        }
      },
      testimonials: [
        { text: "חוויה מדהימה! המדריך היה בעל ידע ויוד ידידותי. לראות את מפלי ניאגרה היה חלום שהתגשם!", author: "שרה מ." },
        { text: "התמיכה הרב-לשונית הפכה הכל לנוח כל כך עבור המשפחה שלנו. ממליץ בחום על IVRI Tours!", author: "דוד ל." },
        { text: "סיור קוויבק סיטי היה קסום! המדריך שלנו שיתף סיפורים מרתקים וטיפים פנימיים. החופשה הכי טובה אי פעם!", author: "רחל כ." },
        { text: "מקצועי, מאורגן ומהנה! סיור האדריכלות בשיקגו עלה על כל הציפיות. תודה IVRI Tours!", author: "מיכאל ר." }
      ]
    },
    ru: {
      welcome: "Добро пожаловать в IVRI Tours!",
      welcomeMsg: "Откройте для себя захватывающие дух направления с опытными гидами на нескольких языках. Ваше приключение начинается здесь!",
      getStarted: "Начать",
      heroTitle: "Исследуйте мир с IVRI Tours",
      heroSubtitle: "Профессиональные экскурсии на английском, иврите и русском языках",
      destinationsTitle: "Наши удивительные направления",
      multiLang: "Туры на нескольких языках доступны",
      testimonialsTitle: "Что говорят о нас",
      facebookTitle: "Следите за нами в Facebook",
      facebookDesc: "Будьте в курсе наших последних туров, фотографий и советов путешественникам!",
      visitFacebook: "Посетите нашу страницу в Facebook",
      contactTitle: "Связаться с нами",
      nameLabel: "Имя",
      emailLabel: "Электронная почта",
      phoneLabel: "Телефон",
      destinationLabel: "Предпочитаемое направление",
      messageLabel: "Сообщение",
      submitBtn: "Отправить сообщение",
      footerText: "Все права защищены. Исследуйте мир вместе с нами!",
      adminLogin: "Вход администратора",
      destinations: {
        toronto: {
          title: "Центр Торонто",
          desc: "Испытайте живое сердце крупнейшего города Канады. Исследуйте культовую башню CN, оживленную набережную и разнообразные районы с нашими опытными гидами."
        },
        niagara: {
          title: "Ниагарский водопад",
          desc: "Станьте свидетелем величественной мощи одного из самых известных водопадов в мире. Приблизьтесь на лодочных турах и насладитесь захватывающими видами с нескольких точек обзора."
        },
        tremblant: {
          title: "Мон-Трамблан",
          desc: "Откройте для себя очарование главного курортного поселка Квебека. Наслаждайтесь потрясающими горными пейзажами, круглогодичными мероприятиями на свежем воздухе и атмосферой европейского стиля."
        },
        quebec: {
          title: "Квебек-Сити",
          desc: "Войдите в европейскую сказку в Северной Америке. Прогуляйтесь по мощеным улицам, посетите исторические укрепления и погрузитесь во франко-канадскую культуру."
        },
        barrie: {
          title: "Барри",
          desc: "Исследуйте этот красивый прибрежный город на берегу озера Симко. Наслаждайтесь набережными парками, пляжами и очаровательным центром города с богатой местной историей."
        },
        detroit: {
          title: "Детройт",
          desc: "Откройте для себя богатое автомобильное наследие Мотор-Сити и яркий культурный ренессанс. Посетите музеи мирового класса, потрясающую архитектуру и процветающие художественные районы."
        },
        chicago: {
          title: "Чикаго",
          desc: "Испытайте культовый горизонт Города ветров, всемирно известную архитектуру, глубокую пиццу и яркую культурную сцену вдоль красивого озера Мичиган."
        }
      },
      testimonials: [
        { text: "Потрясающий опыт! Гид был знающим и дружелюбным. Увидеть Ниагарский водопад было сбывшейся мечтой!", author: "Сара М." },
        { text: "Многоязычная поддержка сделала все таким комфортным для нашей семьи. Настоятельно рекомендую IVRI Tours!", author: "Давид Л." },
        { text: "Тур по Квебеку был волшебным! Наш гид делился захватывающими историями и инсайдерскими советами. Лучший отпуск в истории!", author: "Рахиль К." },
        { text: "Профессионально, организованно и весело! Архитектурный тур по Чикаго превзошел все ожидания. Спасибо IVRI Tours!", author: "Михаил Р." }
      ]
    }
  };

  const t = translations[language];

  const destinations = [
    { key: 'toronto', image: 'https://images.unsplash.com/photo-1517935706615-2717063c2225?w=800&q=80' }, // CN Tower
    { key: 'niagara', image: 'https://images.unsplash.com/photo-1489447068241-b3490214e879?w=800&q=80' }, // Niagara Falls close-up
    { key: 'tremblant', image: 'https://images.unsplash.com/photo-1551524164-687a55dd1126?w=800&q=80' }, // Mont Tremblant skiing
    { key: 'quebec', image: 'https://images.unsplash.com/photo-1608211838603-5c511cfaefd9?w=800&q=80' }, // Quebec City Old Town
    { key: 'barrie', image: 'https://images.unsplash.com/photo-1566837945700-30057527ade0?w=800&q=80' }, // Lake Simcoe waterfront
    { key: 'detroit', image: 'https://images.unsplash.com/photo-1590859808308-3d2d9c515b1a?w=800&q=80' }, // Detroit skyline
    { key: 'chicago', image: 'https://images.unsplash.com/photo-1494522358652-f30e61a60313?w=800&q=80' } // Chicago Bean/Cloud Gate
  ];

  const testimonialImages = [
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80'
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    const messages = {
      en: 'Thank you for your message! We will contact you soon.',
      he: 'תודה על ההודעה! ניצור איתך קשר בקרוב.',
      ru: 'Спасибо за ваше сообщение! Мы скоро свяжемся с вами.'
    };
    alert(messages[language]);
    setFormData({ name: '', email: '', phone: '', destination: '', message: '' });
  };

  return (
    <div className="min-h-screen bg-white" dir={language === 'he' ? 'rtl' : 'ltr'}>
      {showWelcome && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 px-4 animate-fadeIn">
          <div className="bg-white rounded-2xl p-8 max-w-lg w-full text-center shadow-2xl animate-slideDown">
            <div className="text-6xl mb-4">🌍</div>
            <h2 className="text-3xl font-bold mb-4" style={{ color: colors.primary.teal }}>{t.welcome}</h2>
            <p className="text-lg text-gray-600 mb-6">{t.welcomeMsg}</p>
            <button onClick={() => setShowWelcome(false)} className="px-8 py-3 text-white rounded-lg text-lg font-semibold hover:opacity-90 transition-opacity" style={{ backgroundColor: colors.primary.teal }}>{t.getStarted}</button>
          </div>
        </div>
      )}

      <nav className="bg-white shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="text-3xl font-bold" style={{ color: colors.primary.teal }}>IVRI Tours</div>
            <div className="flex items-center gap-3">
              <button onClick={() => changeLanguage('en')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${language === 'en' ? 'text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`} style={language === 'en' ? { backgroundColor: colors.primary.teal } : {}}>English</button>
              <button onClick={() => changeLanguage('he')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${language === 'he' ? 'text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`} style={language === 'he' ? { backgroundColor: colors.primary.teal } : {}}>עברית</button>
              <button onClick={() => changeLanguage('ru')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${language === 'ru' ? 'text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`} style={language === 'ru' ? { backgroundColor: colors.primary.teal } : {}}>Русский</button>
            </div>
          </div>
        </div>
      </nav>

      <section className="py-20 px-4 text-center text-white" style={{ background: `linear-gradient(135deg, ${colors.primary.teal} 0%, #0097A7 100%)` }}>
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6">{t.heroTitle}</h1>
          <p className="text-xl sm:text-2xl opacity-95">{t.heroSubtitle}</p>
        </div>
      </section>

      <section className="py-16 px-4 max-w-7xl mx-auto">
        <h2 className="text-4xl font-bold text-center mb-12" style={{ color: colors.primary.teal }}>{t.destinationsTitle}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {destinations.map((dest) => (
            <div key={dest.key} className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <div className="h-64 bg-cover bg-center" style={{ backgroundImage: `url(${dest.image})` }} />
              <div className="p-6">
                <h3 className="text-2xl font-bold mb-3" style={{ color: colors.primary.teal }}>{t.destinations[dest.key].title}</h3>
                <p className="text-gray-600 leading-relaxed mb-4">{t.destinations[dest.key].desc}</p>
                <span className="inline-block px-4 py-2 rounded-full text-white text-sm font-medium" style={{ backgroundColor: colors.primary.teal }}>🗣️ {t.multiLang}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12" style={{ color: colors.primary.teal }}>{t.testimonialsTitle}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {t.testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-lg text-center">
                <div className="w-20 h-20 rounded-full mx-auto mb-4 bg-cover bg-center" style={{ backgroundImage: `url(${testimonialImages[index]})`, border: `3px solid ${colors.primary.teal}` }} />
                <p className="text-gray-600 italic mb-4 leading-relaxed">"{testimonial.text}"</p>
                <h4 className="font-bold" style={{ color: colors.primary.teal }}>{testimonial.author}</h4>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <Facebook className="w-16 h-16 mx-auto mb-6" style={{ color: colors.primary.teal }} />
          <h2 className="text-4xl font-bold mb-4" style={{ color: colors.primary.teal }}>{t.facebookTitle}</h2>
          <p className="text-xl text-gray-600 mb-8">{t.facebookDesc}</p>
          <a
            href="https://www.facebook.com/ivritours"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-4 text-white text-lg font-bold rounded-lg hover:opacity-90 transition-opacity shadow-lg"
            style={{ backgroundColor: '#1877F2' }}
          >
            <Facebook className="w-6 h-6" />
            {t.visitFacebook}
          </a>
          <div className="mt-12 bg-gray-50 rounded-xl p-8 shadow-inner">
            <div className="text-gray-500 mb-4">
              <p className="text-lg font-semibold mb-2">Connect with us:</p>
              <p>@IVRITours</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-white rounded-lg p-4 shadow">
                <div className="text-3xl font-bold" style={{ color: colors.primary.teal }}>500+</div>
                <div className="text-sm text-gray-600">Happy Travelers</div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow">
                <div className="text-3xl font-bold" style={{ color: colors.primary.teal }}>50+</div>
                <div className="text-sm text-gray-600">Tours This Year</div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow">
                <div className="text-3xl font-bold" style={{ color: colors.primary.teal }}>7</div>
                <div className="text-sm text-gray-600">Destinations</div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow">
                <div className="text-3xl font-bold" style={{ color: colors.primary.teal }}>3</div>
                <div className="text-sm text-gray-600">Languages</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 max-w-4xl mx-auto">
        <h2 className="text-4xl font-bold text-center mb-12" style={{ color: colors.primary.teal }}>{t.contactTitle}</h2>
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-gray-700 font-semibold mb-2">{t.nameLabel} *</label>
              <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#00BCD4] focus:outline-none transition-colors" required />
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-2">{t.emailLabel} *</label>
              <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#00BCD4] focus:outline-none transition-colors" required />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-gray-700 font-semibold mb-2">{t.phoneLabel}</label>
              <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#00BCD4] focus:outline-none transition-colors" />
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-2">{t.destinationLabel}</label>
              <input type="text" value={formData.destination} onChange={(e) => setFormData({ ...formData, destination: e.target.value })} className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#00BCD4] focus:outline-none transition-colors" />
            </div>
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-2">{t.messageLabel} *</label>
            <textarea value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} rows="6" className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#00BCD4] focus:outline-none transition-colors resize-vertical" required />
          </div>
          <button type="submit" className="w-full py-4 text-white text-lg font-bold rounded-lg hover:opacity-90 transition-opacity" style={{ backgroundColor: colors.primary.teal }}>{t.submitBtn}</button>
        </form>
      </section>

      <footer className="bg-gray-900 text-white py-8 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="text-2xl font-bold mb-4" style={{ color: colors.primary.teal }}>IVRI Tours</div>
          <p className="text-gray-400 mb-4">© 2025 IVRI Tours. {t.footerText}</p>
          <button onClick={() => navigate('/login')} className="text-sm hover:underline" style={{ color: colors.primary.teal }}>{t.adminLogin}</button>
        </div>
      </footer>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideDown { from { transform: translateY(-50px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        .animate-slideDown { animation: slideDown 0.5s ease-out; }
      `}</style>
    </div>
  );
};

export default LandingPage;
