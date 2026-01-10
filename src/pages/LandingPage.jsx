import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { Facebook, Instagram, MapPin, Clock, Users } from 'lucide-react';
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
      heroTitle: "Explore North America with IVRI Tours",
      heroSubtitle: "Professional guided tours in English, Hebrew, and Russian",
      destinationsTitle: "Our Amazing Destinations",
      multiLang: "Multi-language Tours",
      duration: "Duration",
      groupSize: "Group Size",
      highlights: "Highlights",
      testimonialsTitle: "What People Say About Us",
      socialTitle: "Follow Our Adventures",
      socialDesc: "Stay connected with our latest tours, photos, and travel tips on social media!",
      visitFacebook: "Visit Facebook",
      visitInstagram: "Visit Instagram",
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
          desc: "Explore Canada's largest and most diverse city! Experience the iconic CN Tower with breathtaking 360° views, stroll along the beautiful harbourfront, discover the historic Distillery District, visit the Royal Ontario Museum, and immerse yourself in vibrant multicultural neighborhoods like Kensington Market and Chinatown.",
          duration: "8-10 hours",
          groupSize: "12-20 people",
          highlights: ["CN Tower & Views", "Harbourfront Walk", "Distillery District", "ROM Museum", "Kensington Market"]
        },
        niagara: {
          title: "Niagara Falls",
          desc: "Witness the raw power and beauty of one of the world's most spectacular natural wonders! Get up close with the Hornblower boat tour, walk behind the falls at Journey Behind the Falls, enjoy panoramic views from Skylon Tower, explore the charming town of Niagara-on-the-Lake, and taste world-class wines at local vineyards.",
          duration: "Full Day (10-12 hours)",
          groupSize: "15-25 people",
          highlights: ["Hornblower Boat Tour", "Journey Behind Falls", "Skylon Tower", "Niagara-on-the-Lake", "Wine Tasting"]
        },
        tremblant: {
          title: "mont-tremblant",
          desc: "Discover Quebec's premier four-season resort destination! Experience world-class skiing and snowboarding in winter, enjoy scenic gondola rides with stunning Laurentian views, explore the charming European-style pedestrian village, try exciting outdoor activities like hiking and zip-lining, and relax in the beautiful natural surroundings.",
          duration: "2-3 Days",
          groupSize: "10-18 people",
          highlights: ["Skiing & Snowboarding", "Scenic Gondola", "Village Pedestrian", "Outdoor Activities", "Spa & Relaxation"]
        },
        quebec: {
          title: "Quebec City",
          desc: "Step into Europe without leaving North America! Wander through the UNESCO World Heritage Old Quebec with its cobblestone streets, visit the majestic Château Frontenac, explore the historic Citadelle fortification, discover the charming Quartier Petit Champlain, and savor authentic French-Canadian cuisine and culture.",
          duration: "2-3 Days",
          groupSize: "12-20 people",
          highlights: ["Old Quebec UNESCO Site", "Château Frontenac", "Citadelle Tour", "Petit Champlain", "French Cuisine"]
        },
        barrie: {
          title: "Barrie & Lake Simcoe",
          desc: "Experience Ontario's beautiful lakeside gem! Enjoy stunning waterfront parks and beaches along Lake Simcoe, explore the historic downtown with unique shops and restaurants, visit Spirit Catcher sculpture and Centennial Park, experience seasonal activities like swimming in summer or ice fishing in winter.",
          duration: "6-8 hours",
          groupSize: "10-15 people",
          highlights: ["Lake Simcoe Beach", "Waterfront Parks", "Downtown Shopping", "Spirit Catcher", "Seasonal Activities"]
        },
        detroit: {
          title: "Detroit",
          desc: "Discover the Motor City's incredible transformation! Visit the Henry Ford Museum and Greenfield Village, explore the stunning Detroit Institute of Arts, walk along the beautiful RiverWalk, tour the historic Fox Theatre, experience the vibrant Eastern Market, and learn about Motown's musical legacy.",
          duration: "Full Day (10-12 hours)",
          groupSize: "15-20 people",
          highlights: ["Henry Ford Museum", "DIA Art Museum", "Detroit RiverWalk", "Motown Museum", "Eastern Market"]
        },
        chicago: {
          title: "Chicago",
          desc: "Experience the magnificent Windy City! Marvel at world-famous architecture on a river cruise, visit Millennium Park and the iconic Cloud Gate (Bean), explore Navy Pier and Lake Michigan shoreline, enjoy deep-dish pizza, discover Art Institute treasures, and take in breathtaking views from Willis Tower Skydeck.",
          duration: "2-3 Days",
          groupSize: "15-25 people",
          highlights: ["Architecture River Cruise", "Cloud Gate (Bean)", "Navy Pier", "Willis Tower Skydeck", "Deep-Dish Pizza"]
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
      heroTitle: "חקרו את צפון אמריקה עם IVRI Tours",
      heroSubtitle: "סיורים מודרכים מקצועיים באנגלית, עברית ורוסית",
      destinationsTitle: "היעדים המדהימים שלנו",
      multiLang: "סיורים בריבוי שפות",
      duration: "משך",
      groupSize: "גודל קבוצה",
      highlights: "דגשים",
      testimonialsTitle: "מה אומרים עלינו",
      socialTitle: "עקבו אחרי ההרפתקאות שלנו",
      socialDesc: "הישארו מחוברים עם הטיולים האחרונים, תמונות וטיפים ברשתות החברתיות!",
      visitFacebook: "בקרו בפייסבוק",
      visitInstagram: "בקרו באינסטגרם",
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
          desc: "חקרו את העיר הגדולה והמגוונת ביותר בקנדה! חוו את מגדל CN האיקוני עם נוף 360° עוצר נשימה, טיילו לאורך הנמל היפהפה, גלו את רובע הזיקוק ההיסטורי, בקרו במוזיאון המלכותי של אונטריו והיטמעו בשכונות רב-תרבותיות תוססות.",
          duration: "8-10 שעות",
          groupSize: "12-20 אנשים",
          highlights: ["מגדל CN ונופים", "טיול בנמל", "רובע הזיקוק", "מוזיאון ROM", "שוק קנסינגטון"]
        },
        niagara: {
          title: "מפלי ניאגרה",
          desc: "היו עדים לעוצמה ויופי של אחד מפלאי הטבע המרהיבים בעולם! התקרבו עם סיור הסירה Hornblower, הליכה מאחורי המפלים, תהנו מנוף פנורמי ממגדל Skylon, חקרו את העיר המקסימה Niagara-on-the-Lake וטעמו יינות ברמה עולמית.",
          duration: "יום מלא (10-12 שעות)",
          groupSize: "15-25 אנשים",
          highlights: ["סיור סירת Hornblower", "מסע מאחורי המפלים", "מגדל Skylon", "Niagara-on-the-Lake", "טעימות יין"]
        },
        tremblant: {
          title: "מון טרמבלן",
          desc: "גלו את אתר הנופש המוביל בקוויבק לכל עונות השנה! חוו סקי וסנובורד ברמה עולמית בחורף, תהנו מנסיעות רכבל נופיות עם נופי הלורנשיינס המדהימים, חקרו את הכפר ההולכי רגל בסגנון אירופאי ונסו פעילויות חוצות מרגשות.",
          duration: "2-3 ימים",
          groupSize: "10-18 אנשים",
          highlights: ["סקי וסנובורד", "רכבל נופי", "כפר הולכי רגל", "פעילויות חוצות", "ספא והרפיה"]
        },
        quebec: {
          title: "קוויבק סיטי",
          desc: "היכנסו לאירופה מבלי לעזוב את צפון אמריקה! טיילו בעיר העתיקה של קוויבק המוכרת על ידי אונסק\"ו עם רחובות מרוצפים, בקרו בשאטו פרונטנק המלכותי, חקרו את הציטדל ההיסטורי וטעמו מטבח צרפתי-קנדי אותנטי.",
          duration: "2-3 ימים",
          groupSize: "12-20 אנשים",
          highlights: ["העיר העתיקה אונסק״ו", "שאטו פרונטנק", "סיור בציטדל", "פטי שמפליין", "מטבח צרפתי"]
        },
        barrie: {
          title: "בארי ואגם סימקו",
          desc: "חוו את פנינת אונטריו שליד האגם! תהנו מפארקי חוף וחופים מדהימים לאורך אגם סימקו, חקרו את מרכז העיר ההיסטורי עם חנויות ומסעדות ייחודיות, בקרו בפסל Spirit Catcher ובפארק Centennial.",
          duration: "6-8 שעות",
          groupSize: "10-15 אנשים",
          highlights: ["חוף אגם סימקו", "פארקי חוף", "קניות במרכז", "Spirit Catcher", "פעילויות עונתיות"]
        },
        detroit: {
          title: "דטרויט",
          desc: "גלו את השינוי המדהים של עיר המוטורים! בקרו במוזיאון הנרי פורד, חקרו את מכון האמנות של דטרויט המדהים, טיילו לאורך ה-RiverWalk היפהפה, בקרו בתיאטרון Fox ההיסטורי ולמדו על מורשת המוטאון המוזיקלית.",
          duration: "יום מלא (10-12 שעות)",
          groupSize: "15-20 אנשים",
          highlights: ["מוזיאון הנרי פורד", "מוזיאון DIA", "Detroit RiverWalk", "מוזיאון מוטאון", "Eastern Market"]
        },
        chicago: {
          title: "שיקגו",
          desc: "חוו את העיר הסוערת המרהיבה! התפעלו מהאדריכלות המפורסמת בשיט בנהר, בקרו בפארק המילניום וב-Cloud Gate האיקוני, חקרו את Navy Pier וחוף אגם מישיגן, תהנו מפיצה עמוקה וקחו נופים עוצרי נשימה ממגדל Willis.",
          duration: "2-3 ימים",
          groupSize: "15-25 אנשים",
          highlights: ["שיט אדריכלות בנהר", "Cloud Gate (Bean)", "Navy Pier", "Willis Tower Skydeck", "פיצה עמוקה"]
        }
      },
      testimonials: [
        { text: "חוויה מדהימה! המדריך היה בעל ידע וידידותי. לראות את מפלי ניאגרה היה חלום שהתגשם!", author: "שרה מ." },
        { text: "התמיכה הרב-לשונית הפכה הכל לנוח כל כך עבור המשפחה שלנו. ממליץ בחום על IVRI Tours!", author: "דוד ל." },
        { text: "סיור קוויבק סיטי היה קסום! המדריך שלנו שיתף סיפורים מרתקים וטיפים פנימיים. החופשה הכי טובה אי פעם!", author: "רחל כ." },
        { text: "מקצועי, מאורגן ומהנה! סיור האדריכלות בשיקגו עלה על כל הציפיות. תודה IVRI Tours!", author: "מיכאל ר." }
      ]
    },
    ru: {
      welcome: "Добро пожаловать в IVRI Tours!",
      welcomeMsg: "Откройте для себя захватывающие дух направления с опытными гидами на нескольких языках. Ваше приключение начинается здесь!",
      getStarted: "Начать",
      heroTitle: "Исследуйте Северную Америку с IVRI Tours",
      heroSubtitle: "Профессиональные экскурсии на английском, иврите и русском языках",
      destinationsTitle: "Наши удивительные направления",
      multiLang: "Многоязычные туры",
      duration: "Продолжительность",
      groupSize: "Размер группы",
      highlights: "Основные моменты",
      testimonialsTitle: "Что говорят о нас",
      socialTitle: "Следите за нашими приключениями",
      socialDesc: "Будьте в курсе наших последних туров, фотографий и советов в социальных сетях!",
      visitFacebook: "Посетите Facebook",
      visitInstagram: "Посетите Instagram",
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
          desc: "Исследуйте самый большой и разнообразный город Канады! Посетите культовую башню CN с захватывающим видом на 360°, прогуляйтесь по красивой набережной, откройте для себя исторический район Distillery, посетите Королевский музей Онтарио и погрузитесь в яркие мультикультурные районы.",
          duration: "8-10 часов",
          groupSize: "12-20 человек",
          highlights: ["Башня CN и виды", "Прогулка по набережной", "Район Distillery", "Музей ROM", "Рынок Кенсингтон"]
        },
        niagara: {
          title: "Ниагарский водопад",
          desc: "Станьте свидетелем мощи и красоты одного из самых впечатляющих чудес природы! Приблизьтесь на лодочном туре Hornblower, пройдите за водопадами в Journey Behind the Falls, насладитесь панорамным видом с башни Skylon, исследуйте очаровательный город Ниагара-он-те-Лейк и попробуйте вина мирового класса.",
          duration: "Полный день (10-12 часов)",
          groupSize: "15-25 человек",
          highlights: ["Лодочный тур Hornblower", "За водопадами", "Башня Skylon", "Ниагара-он-те-Лейк", "Дегустация вин"]
        },
        tremblant: {
          title: "Мон-Трамблан",
          desc: "Откройте для себя главный всесезонный курорт Квебека! Попробуйте лыжи и сноуборд мирового класса зимой, насладитесь живописными поездками на гондоле с потрясающими видами на Лаврентиды, исследуйте очаровательную пешеходную деревню в европейском стиле и попробуйте увлекательные мероприятия на свежем воздухе.",
          duration: "2-3 дня",
          groupSize: "10-18 человек",
          highlights: ["Лыжи и сноуборд", "Живописная гондола", "Пешеходная деревня", "Активный отдых", "Спа и релаксация"]
        },
        quebec: {
          title: "Квебек-Сити",
          desc: "Шагните в Европу, не покидая Северную Америку! Прогуляйтесь по Старому Квебеку, внесенному в список ЮНЕСКО, с его мощеными улицами, посетите величественный Шато Фронтенак, исследуйте историческую Цитадель, откройте для себя очаровательный квартал Пети-Шамплен и насладитесь аутентичной франко-канадской кухней.",
          duration: "2-3 дня",
          groupSize: "12-20 человек",
          highlights: ["Старый Квебек ЮНЕСКО", "Шато Фронтенак", "Тур по Цитадели", "Пети-Шамплен", "Французская кухня"]
        },
        barrie: {
          title: "Барри и озеро Симко",
          desc: "Познакомьтесь с прекрасной жемчужиной Онтарио у озера! Наслаждайтесь потрясающими прибрежными парками и пляжами вдоль озера Симко, исследуйте исторический центр города с уникальными магазинами и ресторанами, посетите скульптуру Spirit Catcher и парк Centennial.",
          duration: "6-8 часов",
          groupSize: "10-15 человек",
          highlights: ["Пляж озера Симко", "Прибрежные парки", "Шопинг в центре", "Spirit Catcher", "Сезонные мероприятия"]
        },
        detroit: {
          title: "Детройт",
          desc: "Откройте для себя невероятную трансформацию Мотор-Сити! Посетите музей Генри Форда и Гринфилд-Виллидж, исследуйте потрясающий Детройтский институт искусств, прогуляйтесь по красивой набережной RiverWalk, совершите экскурсию по историческому театру Fox и узнайте о музыкальном наследии Motown.",
          duration: "Полный день (10-12 часов)",
          groupSize: "15-20 человек",
          highlights: ["Музей Генри Форда", "Художественный музей DIA", "Detroit RiverWalk", "Музей Motown", "Eastern Market"]
        },
        chicago: {
          title: "Чикаго",
          desc: "Испытайте великолепный Город ветров! Полюбуйтесь всемирно известной архитектурой во время речного круиза, посетите Миллениум-парк и культовый Cloud Gate (Bean), исследуйте Navy Pier и береговую линию озера Мичиган, попробуйте глубокую пиццу и насладитесь захватывающими видами с Willis Tower Skydeck.",
          duration: "2-3 дня",
          groupSize: "15-25 человек",
          highlights: ["Архитектурный круиз", "Cloud Gate (Bean)", "Navy Pier", "Willis Tower Skydeck", "Глубокая пицца"]
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

  // Real sightseeing photos of the actual landmarks
  const destinations = [
    { key: 'toronto', image: 'https://images.unsplash.com/photo-1517935706615-2717063c2225?w=800&q=80' }, // CN Tower
    { key: 'niagara', image: 'https://images.unsplash.com/photo-1489447068241-b3490214e879?w=800&q=80' }, // Niagara Falls
    { key: 'mont-tremblant', image: 'https://images.unsplash.com/photo-1729477458908-0a59d8026ed8?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' }, // Mont Tremblant village
    { key: 'quebec', image: 'https://images.unsplash.com/photo-1519451241324-20b4ea2c4220?w=800&q=80' }, // Quebec City
    { key: 'barrie', image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80' }, // Lake waterfront
    { key: 'detroit', image: 'https://images.unsplash.com/photo-1590859808308-3d2d9c515b1a?w=800&q=80' }, // Detroit skyline
    { key: 'chicago', image: 'https://images.unsplash.com/photo-1494522358652-f30e61a60313?w=800&q=80' } // Chicago Cloud Gate
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
                <p className="text-gray-600 leading-relaxed mb-4 text-sm">{t.destinations[dest.key].desc}</p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Clock className="w-4 h-4" style={{ color: colors.primary.teal }} />
                    <span className="font-semibold">{t.duration}:</span> {t.destinations[dest.key].duration}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Users className="w-4 h-4" style={{ color: colors.primary.teal }} />
                    <span className="font-semibold">{t.groupSize}:</span> {t.destinations[dest.key].groupSize}
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-xs font-semibold text-gray-700 mb-2">{t.highlights}:</p>
                  <div className="flex flex-wrap gap-1">
                    {t.destinations[dest.key].highlights.map((highlight, idx) => (
                      <span key={idx} className="inline-block px-2 py-1 rounded-full text-white text-xs" style={{ backgroundColor: colors.primary.teal }}>
                        {highlight}
                      </span>
                    ))}
                  </div>
                </div>

                <span className="inline-block px-4 py-2 rounded-full text-white text-sm font-medium mt-2" style={{ backgroundColor: colors.primary.teal }}>🗣️ {t.multiLang}</span>
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
          <h2 className="text-4xl font-bold mb-4" style={{ color: colors.primary.teal }}>{t.socialTitle}</h2>
          <p className="text-xl text-gray-600 mb-8">{t.socialDesc}</p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <a
              href="https://www.facebook.com/Ivritours/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 text-white text-lg font-bold rounded-lg hover:opacity-90 transition-opacity shadow-lg"
              style={{ backgroundColor: '#1877F2' }}
            >
              <Facebook className="w-6 h-6" />
              {t.visitFacebook}
            </a>
            <a
              href="https://www.instagram.com/ivritours_ca/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 text-white text-lg font-bold rounded-lg hover:opacity-90 transition-opacity shadow-lg"
              style={{ background: 'linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)' }}
            >
              <Instagram className="w-6 h-6" />
              {t.visitInstagram}
            </a>
          </div>

          <div className="bg-gray-50 rounded-xl p-8 shadow-inner">
            <div className="text-gray-500 mb-6">
              <p className="text-lg font-semibold mb-2">Connect with us:</p>
              <p className="mb-1">Facebook: @Ivritours</p>
              <p>Instagram: @ivritours_ca</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-white rounded-lg p-4 shadow">
                <div className="text-3xl font-bold" style={{ color: colors.primary.teal }}>1000+</div>
                <div className="text-sm text-gray-600">Happy Travelers</div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow">
                <div className="text-3xl font-bold" style={{ color: colors.primary.teal }}>100+</div>
                <div className="text-sm text-gray-600">Tours Completed</div>
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
