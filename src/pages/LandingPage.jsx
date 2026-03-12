import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { Facebook, Instagram, MapPin, Clock, Users, Gift, X, Cookie, Eye, ZoomIn, Type, CalendarDays, CheckCircle2 } from 'lucide-react';
import colors from '../utils/colors';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

const LandingPage = () => {
  const navigate = useNavigate();
  const { language, changeLanguage } = useLanguage();
  const [showWelcome, setShowWelcome] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [showCookieConsent, setShowCookieConsent] = useState(false);
  const [showAccessibility, setShowAccessibility] = useState(false);
  const [accessibilitySettings, setAccessibilitySettings] = useState({
    fontSize: 100,
    contrast: false,
    grayScale: false
  });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    destination: '',
    message: ''
  });
  const [sending, setSending] = useState(false);
  const [upcomingTrips, setUpcomingTrips] = useState([]);
  const [tripsLoading, setTripsLoading] = useState(true);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [regForm, setRegForm] = useState({ firstName: '', lastName: '', email: '', phone: '', pickupLocation: '' });
  const [regSubmitting, setRegSubmitting] = useState(false);
  const [regSuccess, setRegSuccess] = useState(false);
  const [tripRegistrationCounts, setTripRegistrationCounts] = useState({});

  useEffect(() => {
    const fetchUpcomingTrips = async () => {
      setTripsLoading(true);
      try {
        const tripsSnap = await getDocs(collection(db, 'trips'));
        const trips = [];
        const counts = {};
        for (const doc of tripsSnap.docs) {
          const data = doc.data();
          const tripDate = data.date?.toDate?.() || (data.date ? new Date(data.date) : null);
          if (tripDate && tripDate >= new Date() && data.status !== 'done' && data.showOnWebsite === true) {
            trips.push({ id: doc.id, ...data });
            // Count approved registrations (filter in JS to avoid needing a composite index)
            const regSnap = await getDocs(query(
              collection(db, 'registrations'),
              where('tripId', '==', doc.id)
            ));
            const approvedCount = regSnap.docs.filter(d => d.data().status !== 'pending').length;
            counts[doc.id] = approvedCount;
          }
        }
        trips.sort((a, b) => {
          const da = a.date?.toDate?.() || new Date(a.date);
          const db2 = b.date?.toDate?.() || new Date(b.date);
          return da - db2;
        });
        setUpcomingTrips(trips);
        setTripRegistrationCounts(counts);
      } catch (err) {
        console.error('Error fetching trips:', err);
      } finally {
        setTripsLoading(false);
      }
    };
    fetchUpcomingTrips();
  }, []);

  const getImageForTrip = (title) => {
    const t = (title || '').toLowerCase();
    if (t.includes('toronto')) return 'https://images.unsplash.com/photo-1517935706615-2717063c2225?w=800&q=80';
    if (t.includes('niagara')) return 'https://images.unsplash.com/photo-1489447068241-b3490214e879?w=800&q=80';
    if (t.includes('tremblant') || t.includes('трамблан') || t.includes('טרמבלן')) return 'https://images.unsplash.com/photo-1729477458908-0a59d8026ed8?q=80&w=800';
    if (t.includes('quebec') || t.includes('квебек') || t.includes('קוויבק')) return 'https://images.unsplash.com/photo-1519451241324-20b4ea2c4220?w=800&q=80';
    if (t.includes('barrie') || t.includes('simco') || t.includes('симко') || t.includes('ברי')) return 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80';
    if (t.includes('detroit') || t.includes('детройт') || t.includes('דטרויט')) return 'https://images.unsplash.com/photo-1590859808308-3d2d9c515b1a?w=800&q=80';
    if (t.includes('chicago') || t.includes('чикаго') || t.includes('שיקגו')) return 'https://images.unsplash.com/photo-1494522358652-f30e61a60313?w=800&q=80';
    if (t.includes('fish') || t.includes('рыб') || t.includes('דיג')) return 'https://images.unsplash.com/photo-1467809297455-d89a8a6fea83?w=800&q=80';
    if (t.includes('ski') || t.includes('snow') || t.includes('лыж') || t.includes('סקי')) return 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800&q=80';
    return 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80';
  };

  const getVehicleCapacity = (vehicleLayout) => {
    if (vehicleLayout === 'sprinter_15') return 14;
    if (vehicleLayout === 'bus_30') return 11;
    if (vehicleLayout === 'highlander_7') return 7;
    if (vehicleLayout?.startsWith('custom_')) {
      const cap = parseInt(vehicleLayout.split('_')[1]);
      return isNaN(cap) ? 0 : cap;
    }
    return 0;
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegSubmitting(true);
    try {
      await addDoc(collection(db, 'registrations'), {
        tripId: selectedTrip.id,
        tripTitle: selectedTrip.title,
        firstName: regForm.firstName,
        lastName: regForm.lastName,
        email: regForm.email,
        phone: regForm.phone,
        pickupLocation: regForm.pickupLocation,
        status: 'pending',
        paid: false,
        seatNumber: null,
        createdAt: serverTimestamp(),
      });
      setRegSuccess(true);
    } catch (err) {
      console.error('Error submitting registration:', err);
      alert(language === 'ru' ? 'Ошибка при регистрации. Попробуйте снова.' : language === 'he' ? 'שגיאה בהרשמה. נסה שוב.' : 'Registration failed. Please try again.');
    } finally {
      setRegSubmitting(false);
    }
  };

  const openRegisterModal = (trip) => {
    setSelectedTrip(trip);
    setRegForm({ firstName: '', lastName: '', email: '', phone: '', pickupLocation: '' });
    setRegSuccess(false);
  };

  const closeRegisterModal = () => {
    setSelectedTrip(null);
    setRegSuccess(false);
  };

  useEffect(() => {
    const hasVisited = sessionStorage.getItem('hasVisitedLanding');
    if (!hasVisited) {
      setTimeout(() => setShowWelcome(true), 100);
      sessionStorage.setItem('hasVisitedLanding', 'true');
    }

    const cookieConsent = localStorage.getItem('cookieConsent');
    if (!cookieConsent) {
      setTimeout(() => setShowCookieConsent(true), 2000);
    }

    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    document.documentElement.style.fontSize = `${accessibilitySettings.fontSize}%`;
    if (accessibilitySettings.contrast) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }
    if (accessibilitySettings.grayScale) {
      document.body.style.filter = 'grayscale(100%)';
    } else {
      document.body.style.filter = 'none';
    }
  }, [accessibilitySettings]);

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
      stats: {
        travelers: "Happy Travelers",
        tours: "Tours Completed",
        destinations: "Destinations",
        languages: "Languages"
      },
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
      stats: {
        travelers: "מטיילים מרוצים",
        tours: "טיולים שהושלמו",
        destinations: "יעדים",
        languages: "שפות"
      },
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
      stats: {
        travelers: "Довольных путешественников",
        tours: "Завершенных туров",
        destinations: "Направлений",
        languages: "Языков"
      },
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

  const giftCardTranslations = {
    en: {
      giftCardTitle: "Give the Gift of Travel",
      giftCardDesc: "Share unforgettable experiences with IVRI Tours gift cards",
      purchaseGiftCard: "Purchase Gift Card"
    },
    he: {
      giftCardTitle: "תנו את המתנה של טיול",
      giftCardDesc: "שתפו חוויות בלתי נשכחות עם כרטיסי מתנה של IVRI Tours",
      purchaseGiftCard: "קנה כרטיס מתנה"
    },
    ru: {
      giftCardTitle: "Подарите путешествие",
      giftCardDesc: "Поделитесь незабываемыми впечатлениями с подарочными картами IVRI Tours",
      purchaseGiftCard: "Купить подарочную карту"
    }
  };

  const tGift = giftCardTranslations[language];

  // Real sightseeing photos of the actual landmarks
  const destinations = [
    { key: 'toronto', image: 'https://images.unsplash.com/photo-1517935706615-2717063c2225?w=800&q=80' }, // CN Tower
    { key: 'niagara', image: 'https://images.unsplash.com/photo-1489447068241-b3490214e879?w=800&q=80' }, // Niagara Falls
    { key: 'tremblant', image: 'https://images.unsplash.com/photo-1729477458908-0a59d8026ed8?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' }, // Mont Tremblant village
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);

    try {
      const sendContactEmail = httpsCallable(functions, 'sendContactEmail');
      await sendContactEmail({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        destination: formData.destination,
        message: formData.message,
        toEmail: 'pupko@mail.com'
      });

      const messages = {
        en: 'Thank you for your message! We will contact you soon.',
        he: 'תודה על ההודעה! ניצור איתך קשר בקרוב.',
        ru: 'Спасибо за ваше сообщение! Мы скоро свяжемся с вами.'
      };
      alert(messages[language]);
      setFormData({ name: '', email: '', phone: '', destination: '', message: '' });
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessages = {
        en: 'Failed to send message. Please try again.',
        he: 'שליחת ההודעה נכשלה. אנא נסה שוב.',
        ru: 'Не удалось отправить сообщение. Пожалуйста, попробуйте снова.'
      };
      alert(errorMessages[language]);
    } finally {
      setSending(false);
    }
  };

  const acceptCookies = () => {
    localStorage.setItem('cookieConsent', 'accepted');
    setShowCookieConsent(false);
  };

  const declineCookies = () => {
    localStorage.setItem('cookieConsent', 'declined');
    setShowCookieConsent(false);
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
              <button
                onClick={() => navigate('/gift-card-purchase')}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium hover:opacity-90 transition-opacity"
                style={{ backgroundColor: colors.primary.teal }}
              >
                <Gift className="w-4 h-4" />
                <span className="hidden sm:inline">{tGift.purchaseGiftCard}</span>
                <span className="sm:hidden">Gift</span>
              </button>
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

      {/* Upcoming Trips Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4" style={{ color: colors.primary.teal }}>
            {language === 'ru' ? 'Ближайшие туры' : language === 'he' ? 'טיולים קרובים' : 'Upcoming Trips'}
          </h2>
          <p className="text-center text-gray-500 mb-12 text-lg">
            {language === 'ru' ? 'Зарегистрируйтесь на один из наших туров' : language === 'he' ? 'הירשמו לאחד הטיולים שלנו' : 'Register for one of our upcoming tours'}
          </p>
          {tripsLoading ? (
            <div className="text-center py-12">
              <div className="inline-block w-10 h-10 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${colors.primary.teal} transparent ${colors.primary.teal} ${colors.primary.teal}` }} />
            </div>
          ) : upcomingTrips.length === 0 ? (
            <p className="text-center text-gray-400 py-12 text-lg">
              {language === 'ru' ? 'Нет запланированных туров' : language === 'he' ? 'אין טיולים מתוכננים כרגע' : 'No upcoming trips at the moment'}
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {upcomingTrips.map((trip) => {
                const capacity = getVehicleCapacity(trip.vehicleLayout);
                const taken = tripRegistrationCounts[trip.id] || 0;
                const available = Math.max(0, capacity - taken);
                const tripDate = trip.date?.toDate?.() || (trip.date ? new Date(trip.date) : null);
                return (
                  <div key={trip.id} className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 flex flex-col">
                    {/* Header: Trip name + cost */}
                    <div className="px-5 pt-5 pb-3 flex items-start justify-between gap-3">
                      <h3 className="text-xl font-bold leading-snug" style={{ color: colors.primary.teal }}>{trip.title}</h3>
                      {trip.price && (
                        <span className="flex-shrink-0 text-white font-bold text-sm px-3 py-1.5 rounded-full shadow-sm" style={{ backgroundColor: colors.primary.teal }}>
                          C${trip.price}
                        </span>
                      )}
                    </div>

                    {/* Image */}
                    <div className="mx-5 rounded-xl h-48 bg-cover bg-center relative overflow-hidden" style={{ backgroundImage: `url(${trip.websiteImage || getImageForTrip(trip.title)})` }}>
                      {available === 0 && (
                        <div className="absolute inset-0 bg-red-900 bg-opacity-60 flex items-center justify-center">
                          <span className="text-white font-black text-2xl tracking-widest uppercase px-5 py-2 border-4 border-white rounded-lg rotate-[-8deg]">
                            {language === 'ru' ? 'Мест нет' : language === 'he' ? 'אין מקומות' : 'Sold Out'}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="px-5 pt-3 pb-5 flex flex-col flex-1 gap-3">
                      {/* Date */}
                      {tripDate && (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <CalendarDays className="w-4 h-4 flex-shrink-0" style={{ color: colors.primary.teal }} />
                          <span>{tripDate.toLocaleDateString(language === 'ru' ? 'ru-RU' : language === 'he' ? 'he-IL' : 'en-CA', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                        </div>
                      )}

                      {/* Description */}
                      {trip.websiteDescription && (
                        <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">{trip.websiteDescription}</p>
                      )}

                      {/* Registration count (only if showRegistrationCount is on) */}
                      {trip.showRegistrationCount && capacity > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div className="h-2 rounded-full transition-all" style={{ width: `${Math.min(100, (taken / capacity) * 100)}%`, backgroundColor: taken >= capacity ? colors.error : colors.primary.teal }} />
                          </div>
                          <span className="text-sm font-semibold text-gray-700 flex-shrink-0">
                            {taken}/{capacity}
                          </span>
                        </div>
                      )}

                      {/* Register button */}
                      <button
                        onClick={() => available > 0 && openRegisterModal(trip)}
                        disabled={available === 0}
                        className="mt-auto w-full py-2.5 text-white font-semibold rounded-lg transition-opacity disabled:cursor-not-allowed"
                        style={{ backgroundColor: available === 0 ? '#dc2626' : colors.primary.teal, opacity: available === 0 ? 1 : undefined }}
                      >
                        {available === 0
                          ? (language === 'ru' ? 'Мест нет' : language === 'he' ? 'אין מקומות' : 'Sold Out')
                          : (language === 'ru' ? 'Записаться' : language === 'he' ? 'הירשם' : 'Register Now')}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Registration Modal */}
      {selectedTrip && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold" style={{ color: colors.primary.teal }}>{selectedTrip.title}</h3>
                <div className="flex items-center gap-3 mt-1">
                  <p className="text-sm text-gray-500">
                    {language === 'ru' ? 'Заявка будет рассмотрена администратором' : language === 'he' ? 'הבקשה תאושר על ידי המנהל' : 'Your request will be reviewed by an admin'}
                  </p>
                  {selectedTrip.price && (
                    <span className="text-sm font-bold text-white px-2 py-0.5 rounded-full flex-shrink-0" style={{ backgroundColor: colors.primary.teal }}>C${selectedTrip.price}</span>
                  )}
                </div>
              </div>
              <button onClick={closeRegisterModal} className="text-gray-400 hover:text-gray-600 ml-4 flex-shrink-0">
                <X className="w-6 h-6" />
              </button>
            </div>

            {regSuccess ? (
              <div className="text-center py-8">
                <CheckCircle2 className="w-16 h-16 mx-auto mb-4" style={{ color: colors.success }} />
                <h4 className="text-xl font-bold text-gray-800 mb-2">
                  {language === 'ru' ? 'Заявка отправлена!' : language === 'he' ? 'הבקשה נשלחה!' : 'Request Submitted!'}
                </h4>
                <p className="text-gray-500 mb-6">
                  {language === 'ru' ? 'Мы свяжемся с вами после подтверждения.' : language === 'he' ? 'ניצור איתך קשר לאחר האישור.' : 'We will contact you once confirmed.'}
                </p>
                <button onClick={closeRegisterModal} className="px-6 py-2 text-white rounded-lg" style={{ backgroundColor: colors.primary.teal }}>
                  {language === 'ru' ? 'Закрыть' : language === 'he' ? 'סגור' : 'Close'}
                </button>
              </div>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      {language === 'ru' ? 'Имя *' : language === 'he' ? 'שם פרטי *' : 'First Name *'}
                    </label>
                    <input type="text" required value={regForm.firstName} onChange={(e) => setRegForm({ ...regForm, firstName: e.target.value })} className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-[#00BCD4] focus:outline-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      {language === 'ru' ? 'Фамилия *' : language === 'he' ? 'שם משפחה *' : 'Last Name *'}
                    </label>
                    <input type="text" required value={regForm.lastName} onChange={(e) => setRegForm({ ...regForm, lastName: e.target.value })} className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-[#00BCD4] focus:outline-none text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    {language === 'ru' ? 'Email *' : language === 'he' ? 'אימייל *' : 'Email *'}
                  </label>
                  <input type="email" required value={regForm.email} onChange={(e) => setRegForm({ ...regForm, email: e.target.value })} className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-[#00BCD4] focus:outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    {language === 'ru' ? 'Телефон *' : language === 'he' ? 'טלפון *' : 'Phone *'}
                  </label>
                  <input type="tel" required value={regForm.phone} onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })} className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-[#00BCD4] focus:outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    {language === 'ru' ? 'Место посадки' : language === 'he' ? 'נקודת איסוף' : 'Pickup Location'}
                  </label>
                  <input type="text" value={regForm.pickupLocation} onChange={(e) => setRegForm({ ...regForm, pickupLocation: e.target.value })} className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-[#00BCD4] focus:outline-none text-sm" placeholder={language === 'ru' ? 'Необязательно' : language === 'he' ? 'אופציונלי' : 'Optional'} />
                </div>
                <button type="submit" disabled={regSubmitting} className="w-full py-3 text-white font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50" style={{ backgroundColor: colors.primary.teal }}>
                  {regSubmitting
                    ? (language === 'ru' ? 'Отправка...' : language === 'he' ? 'שולח...' : 'Submitting...')
                    : (language === 'ru' ? 'Отправить заявку' : language === 'he' ? 'שלח בקשה' : 'Submit Request')}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

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
                <div className="text-sm text-gray-600">{t.stats.travelers}</div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow">
                <div className="text-3xl font-bold" style={{ color: colors.primary.teal }}>100+</div>
                <div className="text-sm text-gray-600">{t.stats.tours}</div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow">
                <div className="text-3xl font-bold" style={{ color: colors.primary.teal }}>7</div>
                <div className="text-sm text-gray-600">{t.stats.destinations}</div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow">
                <div className="text-3xl font-bold" style={{ color: colors.primary.teal }}>3</div>
                <div className="text-sm text-gray-600">{t.stats.languages}</div>
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
          <button
            type="submit"
            disabled={sending}
            className="w-full py-4 text-white text-lg font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: colors.primary.teal }}
          >
            {sending ? (language === 'ru' ? 'Отправка...' : language === 'he' ? 'שולח...' : 'Sending...') : t.submitBtn}
          </button>
        </form>
      </section>

      <footer className="bg-gray-900 text-white py-8 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="text-2xl font-bold mb-4" style={{ color: colors.primary.teal }}>IVRI Tours</div>
          <p className="text-gray-400 mb-4">© 2025 IVRI Tours. {t.footerText}</p>
          <button onClick={() => navigate('/login')} className="text-sm hover:underline" style={{ color: colors.primary.teal }}>{t.adminLogin}</button>
        </div>
      </footer>

      {/* Floating Gift Button on Scroll */}
      {scrollY > 300 && (
        <button
          onClick={() => navigate('/gift-card-purchase')}
          className="fixed bottom-8 left-8 bg-white rounded-full shadow-2xl p-4 hover:scale-110 transition-all duration-300 z-50 animate-float"
          style={{ boxShadow: '0 10px 30px rgba(0,188,212,0.3)' }}
          title={language === 'ru' ? 'Купить подарочную карту' : language === 'he' ? 'קנה כרטיס מתנה' : 'Purchase Gift Card'}
        >
          <Gift className="w-8 h-8" style={{ color: colors.primary.teal }} />
        </button>
      )}

      {/* Israeli Accessibility Widget */}
      <div className="fixed top-24 right-4 z-50">
        <button
          onClick={() => setShowAccessibility(!showAccessibility)}
          className="bg-blue-600 text-white rounded-full p-3 shadow-lg hover:bg-blue-700 transition-colors"
          title={language === 'ru' ? 'Доступность' : language === 'he' ? 'נגישות' : 'Accessibility'}
          aria-label="Accessibility Menu"
        >
          <Eye className="w-6 h-6" />
        </button>

        {showAccessibility && (
          <div className="absolute top-14 right-0 bg-white rounded-lg shadow-2xl p-4 w-64 border-2 border-blue-600">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">
                {language === 'ru' ? 'Доступность' : language === 'he' ? 'נגישות' : 'Accessibility'}
              </h3>
              <button onClick={() => setShowAccessibility(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Font Size */}
              <div>
                <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
                  <Type className="w-4 h-4" />
                  {language === 'ru' ? 'Размер шрифта' : language === 'he' ? 'גודל גופן' : 'Font Size'}
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setAccessibilitySettings(prev => ({ ...prev, fontSize: Math.max(80, prev.fontSize - 10) }))}
                    className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                  >
                    A-
                  </button>
                  <span className="text-sm">{accessibilitySettings.fontSize}%</span>
                  <button
                    onClick={() => setAccessibilitySettings(prev => ({ ...prev, fontSize: Math.min(150, prev.fontSize + 10) }))}
                    className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                  >
                    A+
                  </button>
                </div>
              </div>

              {/* High Contrast */}
              <div>
                <button
                  onClick={() => setAccessibilitySettings(prev => ({ ...prev, contrast: !prev.contrast }))}
                  className={`w-full p-3 rounded-lg flex items-center gap-2 ${accessibilitySettings.contrast ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                >
                  <ZoomIn className="w-5 h-5" />
                  {language === 'ru' ? 'Высокий контраст' : language === 'he' ? 'ניגודיות גבוהה' : 'High Contrast'}
                </button>
              </div>

              {/* Grayscale */}
              <div>
                <button
                  onClick={() => setAccessibilitySettings(prev => ({ ...prev, grayScale: !prev.grayScale }))}
                  className={`w-full p-3 rounded-lg ${accessibilitySettings.grayScale ? 'bg-gray-800 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                >
                  {language === 'ru' ? 'Оттенки серого' : language === 'he' ? 'גווני אפור' : 'Grayscale'}
                </button>
              </div>

              {/* Reset */}
              <button
                onClick={() => setAccessibilitySettings({ fontSize: 100, contrast: false, grayScale: false })}
                className="w-full py-2 text-sm text-blue-600 hover:underline"
              >
                {language === 'ru' ? 'Сбросить' : language === 'he' ? 'איפוס' : 'Reset'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Cookie Consent Banner */}
      {showCookieConsent && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t-4 border-blue-600 shadow-2xl p-6 z-50 animate-slideUp">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-start gap-4 flex-1">
              <Cookie className="w-8 h-8 flex-shrink-0" style={{ color: colors.primary.teal }} />
              <div>
                <h3 className="font-bold text-lg mb-2">
                  {language === 'ru' ? 'Мы используем cookies' : language === 'he' ? 'אנו משתמשים בעוגיות' : 'We use cookies'}
                </h3>
                <p className="text-sm text-gray-600">
                  {language === 'ru'
                    ? 'Этот сайт использует cookies для улучшения вашего опыта. Используя наш сайт, вы соглашаетесь с нашей политикой в отношении cookies.'
                    : language === 'he'
                    ? 'אתר זה משתמש בעוגיות כדי לשפר את החוויה שלך. על ידי שימוש באתר שלנו, אתה מסכים למדיניות העוגיות שלנו.'
                    : 'This website uses cookies to enhance your experience. By using our site, you agree to our cookie policy.'}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={declineCookies}
                className="px-6 py-2 border-2 rounded-lg hover:bg-gray-50 transition-colors"
                style={{ borderColor: colors.primary.teal, color: colors.primary.teal }}
              >
                {language === 'ru' ? 'Отклонить' : language === 'he' ? 'דחה' : 'Decline'}
              </button>
              <button
                onClick={acceptCookies}
                className="px-6 py-2 text-white rounded-lg hover:opacity-90 transition-opacity"
                style={{ backgroundColor: colors.primary.teal }}
              >
                {language === 'ru' ? 'Принять' : language === 'he' ? 'קבל' : 'Accept'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideDown { from { transform: translateY(-50px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        .animate-slideDown { animation: slideDown 0.5s ease-out; }
        .animate-float { animation: float 3s ease-in-out infinite; }
        .animate-slideUp { animation: slideUp 0.5s ease-out; }
        .high-contrast {
          filter: contrast(2);
        }
        .high-contrast * {
          border-color: #000 !important;
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
