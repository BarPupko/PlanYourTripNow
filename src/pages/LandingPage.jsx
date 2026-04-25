import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { Facebook, Instagram, MapPin, Clock, Users, Gift, X, Cookie, Eye, ZoomIn, Type, CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, MessageCircle, BookOpen, ChevronDown } from 'lucide-react';
import colors from '../utils/colors';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import LanguageSelector from '../components/LanguageSelector';
import ChatWidget from '../components/ChatWidget';
import WeatherWidget from '../components/WeatherWidget';
import BlogPostModal from '../components/BlogPostModal';
import { createQuestion, getWebsiteFeedbacks, getSiteSettings, getPublishedBlogPosts, getPartners, getDrivers, getCustomDestinations } from '../utils/firestoreUtils';
import siteLogo from '../assets/site_logo.png';

const LandingPage = () => {
  const navigate = useNavigate();
  const { language, setLanguage } = useLanguage();
  const [showWelcome, setShowWelcome] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [showCookieConsent, setShowCookieConsent] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
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
  const [expandedItinerary, setExpandedItinerary] = useState(new Set());
  // Carousel state
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [itemsPerView, setItemsPerView] = useState(3);
  const carouselPausedRef = useRef(false);
  // Question modal state
  const [questionDest, setQuestionDest] = useState(null); // { key, title }
  const [questionForm, setQuestionForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [questionSubmitting, setQuestionSubmitting] = useState(false);
  const [questionSuccess, setQuestionSuccess] = useState(false);
  // CMS data
  const [people, setPeople] = useState([]);
  const [siteSettings, setSiteSettings] = useState({});
  // Blog
  const [blogPosts, setBlogPosts] = useState([]);
  const [selectedBlogPost, setSelectedBlogPost] = useState(null);
  const [showBlogMenu, setShowBlogMenu] = useState(false);
  // Partners, drivers, custom destinations
  const [partners, setPartners] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [customDestinations, setCustomDestinations] = useState([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState(null);
  const [contactOpen, setContactOpen] = useState(true);
  const [reviewsIdx, setReviewsIdx] = useState(0);
  const [destFilter, setDestFilter] = useState('all');
  const [siteStats, setSiteStats] = useState({ travelers: 0, toursCompleted: 0 });

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

        // Compute live stats from all trips + all registrations
        const allTripsData = tripsSnap.docs.map(d => d.data());
        const toursCompleted = allTripsData.filter(t => t.status === 'done').length + 500;
        const allRegistrations = await getDocs(collection(db, 'registrations')) ;
        const totalTravelers = allRegistrations.docs.filter(d => d.data().status !== 'pending').length + 1000;
        setSiteStats({ travelers: totalTravelers, toursCompleted });
      } catch (err) {
        console.error('Error fetching trips:', err);
      } finally {
        setTripsLoading(false);
      }
    };
    fetchUpcomingTrips();
    getWebsiteFeedbacks().then(setPeople).catch(() => {});
    getSiteSettings().then(setSiteSettings).catch(() => {});
    getPublishedBlogPosts().then(setBlogPosts).catch(() => {});
    getPartners().then(setPartners).catch(() => {});
    getDrivers().then(setDrivers).catch(() => {});
    getCustomDestinations().then(setCustomDestinations).catch(() => {});
  }, []);

  // Carousel: responsive items-per-view
  useEffect(() => {
    const update = () => {
      if (window.innerWidth < 640) setItemsPerView(1);
      else if (window.innerWidth < 1024) setItemsPerView(2);
      else setItemsPerView(3);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // Carousel: auto-scroll every 4s
  useEffect(() => {
    const interval = setInterval(() => {
      if (carouselPausedRef.current) return;
      setCarouselIndex(prev => {
        const fLen = destFilter === 'all' ? destinations.length : destinations.filter(d => d.durationCategory === destFilter).length;
        const maxIndex = Math.max(0, fLen - itemsPerView);
        return prev >= maxIndex ? 0 : prev + 1;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [itemsPerView, destFilter]);

  useEffect(() => { setCarouselIndex(0); }, [destFilter]);

  const handleQuestionSubmit = async (e) => {
    e.preventDefault();
    setQuestionSubmitting(true);
    try {
      await createQuestion({
        destination: questionDest.title,
        name: questionForm.name,
        email: questionForm.email,
        phone: questionForm.phone,
        message: questionForm.message,
        language,
      });
      setQuestionSuccess(true);
      setTimeout(() => {
        setQuestionDest(null);
        setQuestionSuccess(false);
        setQuestionForm({ name: '', email: '', phone: '', message: '' });
      }, 3000);
    } catch (err) {
      console.error('Error submitting question:', err);
    } finally {
      setQuestionSubmitting(false);
    }
  };

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
    const hasVisited = localStorage.getItem('hasVisitedLanding');
    if (!hasVisited) {
      setTimeout(() => setShowWelcome(true), 100);
      localStorage.setItem('hasVisitedLanding', 'true');
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
      welcome: "Welcome to IVRITours!",
      welcomeMsg: "Discover breathtaking destinations with expert tour guides in multiple languages. Your adventure begins here!",
      getStarted: "Get Started",
      heroTitle: "Explore North America with IVRITours",
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
      askQuestion: "Ask a Question",
      questionModalTitle: "Ask About",
      questionName: "Your Name",
      questionEmail: "Your Email",
      questionPhone: "Phone (optional)",
      questionMessage: "Your Question",
      questionSend: "Send Question",
      questionSuccessMsg: "Your question has been sent! We'll get back to you soon.",
      testimonials: [
        { text: "Amazing experience! The tour guide was knowledgeable and friendly. Seeing Niagara Falls was a dream come true!", author: "Sarah M.", trip: "Niagara Falls, 2024" },
        { text: "The multi-language support made everything so comfortable for our family. Highly recommend IVRITours!", author: "David L.", trip: "Toronto Downtown, 2024" },
        { text: "Quebec City tour was magical! Our guide shared fascinating stories and insider tips. Best vacation ever!", author: "Rachel K.", trip: "Old Québec, 2024" }
      ]
    },
    he: {
      welcome: "ברוכים הבאים ל-IVRITours!",
      welcomeMsg: "גלו יעדים עוצרי נשימה עם מדריכי טיולים מומחים במספר שפות. ההרפתקה שלכם מתחילה כאן!",
      getStarted: "בואו נתחיל",
      heroTitle: "חקרו את צפון אמריקה עם IVRITours",
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
      askQuestion: "שאל שאלה",
      questionModalTitle: "שאל על",
      questionName: "שמך",
      questionEmail: "האימייל שלך",
      questionPhone: "טלפון (אופציונלי)",
      questionMessage: "השאלה שלך",
      questionSend: "שלח שאלה",
      questionSuccessMsg: "השאלה שלך נשלחה! נחזור אליך בקרוב.",
      testimonials: [
        { text: "חוויה מדהימה! המדריך היה בעל ידע וידידותי. לראות את מפלי ניאגרה היה חלום שהתגשם!", author: "שרה מ.", trip: "מפלי ניאגרה, 2024" },
        { text: "התמיכה הרב-לשונית הפכה הכל לנוח כל כך עבור המשפחה שלנו. ממליץ בחום על IVRITours!", author: "דוד ל.", trip: "טורונטו, 2024" },
        { text: "סיור קוויבק סיטי היה קסום! המדריך שלנו שיתף סיפורים מרתקים וטיפים פנימיים. החופשה הכי טובה אי פעם!", author: "רחל כ.", trip: "קוויבק העתיקה, 2024" }
      ]
    },
    ru: {
      welcome: "Добро пожаловать в IVRITours!",
      welcomeMsg: "Откройте для себя захватывающие дух направления с опытными гидами на нескольких языках. Ваше приключение начинается здесь!",
      getStarted: "Начать",
      heroTitle: "Исследуйте Северную Америку с IVRITours",
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
      askQuestion: "Задать вопрос",
      questionModalTitle: "Спросить о",
      questionName: "Ваше имя",
      questionEmail: "Ваш email",
      questionPhone: "Телефон (необязательно)",
      questionMessage: "Ваш вопрос",
      questionSend: "Отправить вопрос",
      questionSuccessMsg: "Ваш вопрос отправлен! Мы свяжемся с вами в ближайшее время.",
      testimonials: [
        { text: "Потрясающий опыт! Гид был знающим и дружелюбным. Увидеть Ниагарский водопад было сбывшейся мечтой!", author: "Сара М.", trip: "Ниагарский водопад, 2024" },
        { text: "Многоязычная поддержка сделала все таким комфортным для нашей семьи. Настоятельно рекомендую IVRITours!", author: "Давид Л.", trip: "Торонто, 2024" },
        { text: "Тур по Квебеку был волшебным! Наш гид делился захватывающими историями и инсайдерскими советами. Лучший отпуск в истории!", author: "Рахиль К.", trip: "Старый Квебек, 2024" }
      ]
    }
  };

  const t = translations[language];

  const giftCardTranslations = {
    en: {
      giftCardTitle: "Give the Gift of Travel",
      giftCardDesc: "Share unforgettable experiences with IVRITours gift cards",
      purchaseGiftCard: "Purchase Gift Card"
    },
    he: {
      giftCardTitle: "תנו את המתנה של טיול",
      giftCardDesc: "שתפו חוויות בלתי נשכחות עם כרטיסי מתנה של IVRITours",
      purchaseGiftCard: "קנה כרטיס מתנה"
    },
    ru: {
      giftCardTitle: "Подарите путешествие",
      giftCardDesc: "Поделитесь незабываемыми впечатлениями с подарочными картами IVRITours",
      purchaseGiftCard: "Купить подарочную карту"
    }
  };

  const tGift = giftCardTranslations[language];

  const getDisplayTestimonials = () => {
    const custom = siteSettings.customTestimonials;
    if (custom?.length) return custom.filter(c => c.text && c.author);
    return t.testimonials;
  };

  // Section ordering — index in array becomes the CSS `order` value
  const DEFAULT_SECTION_ORDER = ['trips', 'partners', 'drivers', 'reviews', 'social', 'blog', 'contact'];
  const activeSectionOrder = siteSettings.sectionOrder?.length
    ? siteSettings.sectionOrder
    : DEFAULT_SECTION_ORDER;
  const getSectionOrder = (key) => {
    const idx = activeSectionOrder.indexOf(key);
    return idx >= 0 ? idx : 99;
  };

  const hiddenDestinations = siteSettings.hiddenDestinations || [];
  const staticDestinations = [
    { key: 'toronto',   image: 'https://images.unsplash.com/photo-1517935706615-2717063c2225?w=800&q=80',  durationCategory: 'day',   country: 'ca' },
    { key: 'niagara',   image: 'https://images.unsplash.com/photo-1489447068241-b3490214e879?w=800&q=80',  durationCategory: 'day',   country: 'ca' },
    { key: 'tremblant', image: 'https://images.unsplash.com/photo-1729477458908-0a59d8026ed8?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', durationCategory: 'multi', country: 'ca' },
    { key: 'quebec',    image: 'https://images.unsplash.com/photo-1519451241324-20b4ea2c4220?w=800&q=80',  durationCategory: 'multi', country: 'ca' },
    { key: 'barrie',    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',  durationCategory: 'hours', country: 'ca' },
    { key: 'detroit',   image: 'https://images.unsplash.com/photo-1590859808308-3d2d9c515b1a?w=800&q=80',  durationCategory: 'day',   country: 'us' },
    { key: 'chicago',   image: 'https://images.unsplash.com/photo-1494522358652-f30e61a60313?w=800&q=80',  durationCategory: 'multi', country: 'us' },
  ].filter(d => !hiddenDestinations.includes(d.key));

  const destinations = [
    ...staticDestinations,
    ...customDestinations.filter(d => d.visible !== false).map(d => ({ ...d, type: 'custom' })),
  ];

  const NumOfDestination = destinations.length+70;

  const filteredDestinations = destFilter === 'all'
    ? destinations
    : destinations.filter(d => d.durationCategory === destFilter);

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
    <div className="min-h-screen" style={{ background: '#EAF6F8', color: '#0A2A33' }} dir={language === 'he' ? 'rtl' : 'ltr'}>

      {showWelcome && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 px-4 animate-fadeIn">
          <div className="rounded-2xl p-8 max-w-lg w-full text-center shadow-2xl animate-slideDown" style={{ background: '#F5FBFC' }}>
            <div className="text-6xl mb-4">🌍</div>
            <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: '"Fraunces", Georgia, serif', color: '#073944' }}>{t.welcome}</h2>
            <p className="text-lg mb-6" style={{ color: '#3E5F68' }}>{t.welcomeMsg}</p>
            <button onClick={() => setShowWelcome(false)} className="px-8 py-3 text-white rounded-lg text-lg font-semibold hover:opacity-90 transition-opacity" style={{ backgroundColor: colors.primary.teal }}>{t.getStarted}</button>
          </div>
        </div>
      )}

      

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


      {/* Ask a Question Modal */}
      {questionDest && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-5">
              <div>
                <h3 className="text-xl font-bold" style={{ color: colors.primary.teal }}>
                  {t.questionModalTitle}: {questionDest.title}
                </h3>
              </div>
              <button onClick={() => setQuestionDest(null)} className="text-gray-400 hover:text-gray-600 ml-4 flex-shrink-0">
                <X className="w-6 h-6" />
              </button>
            </div>

            {questionSuccess ? (
              <div className="text-center py-8">
                <CheckCircle2 className="w-16 h-16 mx-auto mb-4" style={{ color: colors.success }} />
                <p className="text-gray-700 font-medium">{t.questionSuccessMsg}</p>
              </div>
            ) : (
              <form onSubmit={handleQuestionSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">{t.questionName} *</label>
                  <input
                    type="text" required
                    value={questionForm.name}
                    onChange={e => setQuestionForm({ ...questionForm, name: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-[#00BCD4] focus:outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">{t.questionEmail} *</label>
                  <input
                    type="email" required
                    value={questionForm.email}
                    onChange={e => setQuestionForm({ ...questionForm, email: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-[#00BCD4] focus:outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">{t.questionPhone}</label>
                  <input
                    type="tel"
                    value={questionForm.phone}
                    onChange={e => setQuestionForm({ ...questionForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-[#00BCD4] focus:outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">{t.questionMessage} *</label>
                  <textarea
                    required rows={4}
                    value={questionForm.message}
                    onChange={e => setQuestionForm({ ...questionForm, message: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-[#00BCD4] focus:outline-none text-sm resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={questionSubmitting}
                  className="w-full py-3 text-white font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                  style={{ backgroundColor: colors.primary.teal }}
                >
                  {questionSubmitting ? '...' : t.questionSend}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── TOP BAR — language picker, scrolls away naturally ──── */}
      <div style={{ background: '#0A2A33', height: 36, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.5rem' }}>
        <a href="tel:6473026846" style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, textDecoration: 'none', letterSpacing: '0.02em' }}>
          📞 647-302-6846
        </a>
        <div style={{ display: 'flex', gap: 2 }}>
          {[
            { code: 'en', flag: '🇨🇦', label: 'EN' },
            { code: 'he', flag: '🇮🇱', label: 'HE' },
            { code: 'ru', flag: '🇷🇺', label: 'RU' },
          ].map(l => (
            <button
              key={l.code}
              onClick={() => setLanguage(l.code)}
              style={{
                background: language === l.code ? '#00BCD4' : 'transparent',
                color: language === l.code ? 'white' : 'rgba(255,255,255,0.45)',
                border: 'none',
                borderRadius: 5,
                padding: '3px 9px',
                fontSize: 11,
                fontWeight: language === l.code ? 700 : 400,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                transition: 'all 0.15s',
              }}
            >
              {l.flag} {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── NAV — minimal, sticky ────────────────────────────── */}
      <style>{`
        @media (max-width: 640px) {
          .nav-logo { height: 50px !important; }
          .nav-inner { height: 64px !important; }
        }
      `}</style>
      <nav style={{ position: 'sticky', top: 0, zIndex: 40, background: 'rgba(234,246,248,0.92)', backdropFilter: 'blur(14px) saturate(140%)', borderBottom: '1px solid #C6DFE4' }}>
        <div className="nav-inner" style={{ maxWidth: 1280, margin: '0 auto', padding: '0 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 140 }}>
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{ display: 'block', lineHeight: 0, background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
            <img src={siteLogo} alt="IVRITours" className="nav-logo" style={{ height: 125, width: 'auto', display: 'block' }} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <WeatherWidget compact={true} />
            <div className="relative">
              <button
                onClick={() => setShowBlogMenu(p => !p)}
                onBlur={() => setTimeout(() => setShowBlogMenu(false), 150)}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 8, color: '#3E5F68', fontSize: 13, fontWeight: 500, background: 'transparent', border: 'none', cursor: 'pointer' }}
              >
                <BookOpen className="w-4 h-4" />
                <span className="hidden sm:inline">Blog</span>
                <ChevronDown className="w-3 h-3" />
              </button>
              {showBlogMenu && blogPosts.length > 0 && (
                <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 8, width: 256, background: 'white', borderRadius: 12, boxShadow: '0 10px 40px rgba(0,0,0,0.12)', border: '1px solid #D9EBEE', padding: '4px 0', zIndex: 50 }}>
                  {blogPosts.map(post => (
                    <button key={post.id} onMouseDown={() => { setSelectedBlogPost(post); setShowBlogMenu(false); }}
                      style={{ width: '100%', textAlign: 'left', padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer' }} className="hover:bg-gray-50">
                      <p style={{ fontSize: 14, fontWeight: 500, color: '#0A2A33' }} className="truncate">{post.title}</p>
                      {post.excerpt && <p style={{ fontSize: 12, color: '#78959D', marginTop: 2 }} className="truncate">{post.excerpt}</p>}
                    </button>
                  ))}
                </div>
              )}
              {showBlogMenu && blogPosts.length === 0 && (
                <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 8, width: 192, background: 'white', borderRadius: 12, boxShadow: '0 10px 40px rgba(0,0,0,0.12)', border: '1px solid #D9EBEE', padding: 12, zIndex: 50, textAlign: 'center', fontSize: 14, color: '#78959D' }}>
                  No posts yet
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="hero-section" style={{ background: '#EAF6F8', padding: '5rem 1.5rem 4rem' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div className="hero-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center' }}>
            <div className="hero-content">
              <p style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#78959D', marginBottom: 16 }}>
                {language === 'ru' ? '— Туристическое агентство' : language === 'he' ? '— סוכנות טיולים' : '— Travel Studio'}
              </p>
              <h1 style={{ fontFamily: '"Fraunces", Georgia, serif', fontWeight: 350, fontSize: 'clamp(2.2rem, 6vw, 4.5rem)', lineHeight: 1.05, letterSpacing: '-0.022em', color: '#073944', marginBottom: 24 }}>
                {language === 'he' ? <>חקרו את <em style={{ color: colors.primary.teal, fontStyle: 'italic' }}>צפון אמריקה</em></> : language === 'ru' ? <>Исследуйте <em style={{ color: colors.primary.teal, fontStyle: 'italic' }}>Северную Америку</em></> : <>Explore <em style={{ color: colors.primary.teal, fontStyle: 'italic' }}>North America</em></>}
              </h1>
              <p style={{ fontSize: 17, lineHeight: 1.65, color: '#3E5F68', marginBottom: 32, maxWidth: '40ch' }}>{t.heroSubtitle}</p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <a href="#trips" style={{ display: 'inline-block', padding: '12px 28px', background: colors.primary.teal, color: 'white', borderRadius: 8, fontWeight: 600, textDecoration: 'none', fontSize: 15 }}>
                  {language === 'ru' ? 'Туры' : language === 'he' ? 'טיולים' : 'View Tours'}
                </a>
                <a href="#contact" style={{ display: 'inline-block', padding: '12px 28px', background: 'transparent', border: '1.5px solid #C6DFE4', color: '#0A2A33', borderRadius: 8, fontWeight: 600, textDecoration: 'none', fontSize: 15 }}>
                  {language === 'ru' ? 'Связаться' : language === 'he' ? 'צרו קשר' : 'Contact Us'}
                </a>
              </div>
            </div>
            <div className="hero-image-wrap" style={{ borderRadius: 16, overflow: 'hidden', aspectRatio: '4/3', boxShadow: '0 20px 60px rgba(7,57,68,0.15)' }}>
              <img src="https://images.unsplash.com/photo-1517935706615-2717063c2225?w=1200&q=80" alt="CN Tower Toronto" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          </div>
        </div>
      </section>

     

      {/* ── Orderable sections ─────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>

      {/* TRIPS */}
      {(tripsLoading || upcomingTrips.length > 0) && siteSettings.showDestinations !== false && (
        <section id="trips" style={{ order: getSectionOrder('trips'), padding: '5rem 1.5rem', background: '#F5FBFC' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto' }}>
            <div style={{ marginBottom: 48 }}>
              <p style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#78959D', marginBottom: 8 }}>
                {language === 'ru' ? '01 — ТУРЫ' : language === 'he' ? '01 — טיולים' : '01 — TOURS'}
              </p>
              <h2 style={{ fontFamily: '"Fraunces", Georgia, serif', fontWeight: 350, fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.02em', color: '#073944' }}>
                {language === 'ru' ? 'Ближайшие туры' : language === 'he' ? 'טיולים קרובים' : 'Upcoming Trips'}
              </h2>
            </div>
            {tripsLoading ? (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <div className="inline-block w-10 h-10 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${colors.primary.teal} transparent ${colors.primary.teal} ${colors.primary.teal}` }} />
              </div>
            ) : upcomingTrips.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#78959D', padding: '3rem', fontSize: 17 }}>
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
                    <div key={trip.id} className="hover:-translate-y-1" style={{ background: 'white', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 20px rgba(7,57,68,0.08)', border: '1px solid #D9EBEE', display: 'flex', flexDirection: 'column', transition: 'all 0.3s' }}>
                      <div style={{ padding: '20px 20px 12px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                        <h3 style={{ fontFamily: '"Fraunces", Georgia, serif', fontSize: 20, fontWeight: 500, color: '#073944' }}>{trip.title}</h3>
                        {trip.price && <span style={{ flexShrink: 0, background: colors.primary.teal, color: 'white', fontWeight: 700, fontSize: 13, padding: '4px 12px', borderRadius: 100 }}>C${trip.price}</span>}
                      </div>
                      <div style={{ margin: '0 20px', borderRadius: 12, height: 192, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative', overflow: 'hidden', backgroundImage: `url(${trip.websiteImage || getImageForTrip(trip.title)})` }}>
                        {available === 0 && (
                          <div style={{ position: 'absolute', inset: 0, background: 'rgba(153,27,27,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ color: 'white', fontWeight: 900, fontSize: 22, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '8px 20px', border: '4px solid white', borderRadius: 8, transform: 'rotate(-8deg)', display: 'inline-block' }}>
                              {language === 'ru' ? 'Мест нет' : language === 'he' ? 'אין מקומות' : 'Sold Out'}
                            </span>
                          </div>
                        )}
                      </div>
                      <div style={{ padding: '12px 20px 20px', display: 'flex', flexDirection: 'column', flex: 1, gap: 12 }}>
                        {tripDate && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#78959D' }}>
                            <CalendarDays style={{ width: 14, height: 14, flexShrink: 0, color: colors.primary.teal }} />
                            {tripDate.toLocaleDateString(language === 'ru' ? 'ru-RU' : language === 'he' ? 'he-IL' : 'en-CA', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </div>
                        )}
                        {trip.websiteDescription && <p style={{ color: '#3E5F68', fontSize: 14, lineHeight: 1.6 }} className="line-clamp-3">{trip.websiteDescription}</p>}
                        {trip.itinerary && (
                          <div>
                            <button
                              onClick={() => setExpandedItinerary(prev => { const next = new Set(prev); next.has(trip.id) ? next.delete(trip.id) : next.add(trip.id); return next; })}
                              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500, color: colors.primary.teal, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                            >
                              <span>📋</span>
                              <span>{expandedItinerary.has(trip.id) ? (language === 'ru' ? 'Скрыть маршрут' : language === 'he' ? 'הסתר מסלול' : 'Hide Itinerary') : (language === 'ru' ? 'Посмотреть маршрут' : language === 'he' ? 'הצג מסלול' : 'View Itinerary')}</span>
                              <span style={{ fontSize: 11 }}>{expandedItinerary.has(trip.id) ? '▲' : '▼'}</span>
                            </button>
                            {expandedItinerary.has(trip.id) && (
                              <div style={{ marginTop: 8, padding: 12, background: '#EAF6F8', borderRadius: 8, border: '1px solid #C6DFE4' }}>
                                <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12, color: '#3E5F68', fontFamily: 'sans-serif', lineHeight: 1.5, margin: 0 }}>{trip.itinerary}</pre>
                              </div>
                            )}
                          </div>
                        )}
                        {trip.showRegistrationCount && capacity > 0 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ flex: 1, background: '#D9EBEE', borderRadius: 100, height: 6 }}>
                              <div style={{ height: 6, borderRadius: 100, width: `${Math.min(100, (taken / capacity) * 100)}%`, backgroundColor: taken >= capacity ? '#dc2626' : colors.primary.teal }} />
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#0A2A33', flexShrink: 0 }}>{taken}/{capacity}</span>
                          </div>
                        )}
                        <button
                          onClick={() => available > 0 && openRegisterModal(trip)}
                          disabled={available === 0}
                          style={{ marginTop: 'auto', width: '100%', padding: '10px', color: 'white', fontWeight: 600, borderRadius: 8, background: available === 0 ? '#dc2626' : colors.primary.teal, border: 'none', cursor: available === 0 ? 'not-allowed' : 'pointer', fontSize: 14 }}
                        >
                          {available === 0 ? (language === 'ru' ? 'Мест нет' : language === 'he' ? 'אין מקומות' : 'Sold Out') : (language === 'ru' ? 'Записаться' : language === 'he' ? 'הירשם' : 'Register Now')}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}
      {/* DESTINATIONS CAROUSEL */}
      {siteSettings.showDestinations !== false && (
        <section style={{ padding: '5rem 1.5rem', background: '#EAF6F8' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto' }}>
            <div style={{ marginBottom: 32 }}>
              <p style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#78959D', marginBottom: 8 }}>
                {language === 'ru' ? '02 — НАПРАВЛЕНИЯ' : language === 'he' ? '02 — יעדים' : '02 — DESTINATIONS'}
              </p>
              <h2 style={{ fontFamily: '"Fraunces", Georgia, serif', fontWeight: 350, fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.02em', color: '#073944' }}>{t.destinationsTitle}</h2>
            </div>
            {/* Duration filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 36, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#78959D', marginRight: 4 }}>
                {language === 'ru' ? 'ДЛИТЕЛЬНОСТЬ:' : language === 'he' ? 'משך:' : 'DURATION:'}
              </span>
              {[
                { key: 'all',   en: 'All',        he: 'הכל',         ru: 'Все' },
                { key: 'hours', en: 'Few Hours',   he: 'כמה שעות',    ru: 'Несколько ч.' },
                { key: 'day',   en: 'Day',         he: 'יום',         ru: 'День' },
                { key: 'multi', en: 'Two Days+',   he: 'יומיים+',     ru: '2+ дня' },
              ].map(({ key, en, he, ru }) => (
                <button
                  key={key}
                  onClick={() => { setDestFilter(key); setCarouselIndex(0); }}
                  style={{
                    padding: '5px 14px', borderRadius: 100, fontSize: 12, fontWeight: 600,
                    cursor: 'pointer', border: `1.5px solid ${destFilter === key ? colors.primary.teal : '#C6DFE4'}`,
                    background: destFilter === key ? colors.primary.teal : 'transparent',
                    color: destFilter === key ? 'white' : '#3E5F68',
                    transition: 'all 0.2s',
                  }}
                >
                  {language === 'he' ? he : language === 'ru' ? ru : en}
                </button>
              ))}
            </div>
            <div className="relative" onMouseEnter={() => { carouselPausedRef.current = true; }} onMouseLeave={() => { carouselPausedRef.current = false; }}>
              <button
                onClick={() => setCarouselIndex(prev => Math.max(0, prev - 1))}
                disabled={carouselIndex === 0}
                className="disabled:opacity-30"
                style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%) translateX(-16px)', zIndex: 10, width: 40, height: 40, borderRadius: '50%', background: 'white', border: '1px solid #C6DFE4', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
              >
                <ChevronLeft style={{ width: 20, height: 20, color: '#0A2A33' }} />
              </button>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ display: 'flex', transition: 'transform 0.5s ease', transform: `translateX(-${carouselIndex * (100 / itemsPerView)}%)` }}>
                  {filteredDestinations.length === 0 ? (
                    <div style={{ minWidth: '100%', padding: '3rem', textAlign: 'center', color: '#78959D', fontSize: 16 }}>
                      {language === 'ru' ? 'Нет направлений в этой категории' : language === 'he' ? 'אין יעדים בקטגוריה זו' : 'No destinations in this category'}
                    </div>
                  ) : filteredDestinations.map((dest) => {
                    const isCustom = dest.type === 'custom';
                    const destTitle = isCustom ? dest.title : t.destinations[dest.key]?.title;
                    const destDesc = isCustom ? dest.description : t.destinations[dest.key]?.desc;
                    const destDuration = isCustom ? dest.duration : t.destinations[dest.key]?.duration;
                    const destGroupSize = isCustom ? dest.groupSize : t.destinations[dest.key]?.groupSize;
                    const destHighlights = isCustom ? (dest.highlights || []) : (t.destinations[dest.key]?.highlights || []);
                    const destCardKey = isCustom ? dest.id : dest.key;
                    return (
                    <div key={destCardKey} style={{ flexShrink: 0, padding: '0 12px', width: `${100 / itemsPerView}%` }}>
                      <div className="hover:-translate-y-2" style={{ background: 'white', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 20px rgba(7,57,68,0.08)', border: '1px solid #D9EBEE', display: 'flex', flexDirection: 'column', height: '100%', transition: 'all 0.3s' }}>
                        <div style={{ height: 220, backgroundSize: 'cover', backgroundPosition: 'center', backgroundImage: `url(${dest.image})`, position: 'relative' }}>
                          <div style={{ position: 'absolute', top: 10, left: 10 }}>
                            <span style={{ fontSize: 22, lineHeight: 1, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))' }}>{dest.country === 'ca' ? '🇨🇦' : dest.country === 'us' ? '🇺🇸' : '🌍'}</span>
                          </div>
                        </div>
                        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', flex: 1 }}>
                          <h3 style={{ fontFamily: '"Fraunces", Georgia, serif', fontSize: 20, fontWeight: 500, color: '#073944', marginBottom: 8 }}>{destTitle}</h3>
                          <p style={{ color: '#3E5F68', fontSize: 14, lineHeight: 1.6, marginBottom: 12 }} className="line-clamp-3">{destDesc}</p>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                            {destDuration && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#3E5F68' }}>
                                <Clock style={{ width: 13, height: 13, color: colors.primary.teal }} />
                                <span style={{ fontWeight: 600 }}>{t.duration}:</span> {destDuration}
                              </div>
                            )}
                            {destGroupSize && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#3E5F68' }}>
                                <Users style={{ width: 13, height: 13, color: colors.primary.teal }} />
                                <span style={{ fontWeight: 600 }}>{t.groupSize}:</span> {destGroupSize}
                              </div>
                            )}
                          </div>
                          {destHighlights.length > 0 && (
                            <div style={{ marginBottom: 12 }}>
                              <p style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10, fontWeight: 600, color: '#0A2A33', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t.highlights}</p>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                {destHighlights.map((h, i) => (
                                  <span key={i} style={{ background: '#EAF6F8', color: '#3E5F68', fontSize: 11, padding: '3px 10px', borderRadius: 100, border: '1px solid #C6DFE4' }}>{h}</span>
                                ))}
                              </div>
                            </div>
                          )}
                          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <span style={{ background: colors.primary.teal, color: 'white', fontSize: 11, padding: '4px 12px', borderRadius: 100, alignSelf: 'flex-start' }}>🗣️ {t.multiLang}</span>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button
                                onClick={() => { setQuestionDest({ key: destCardKey, title: destTitle }); setQuestionForm({ name: '', email: '', phone: '', message: '' }); setQuestionSuccess(false); }}
                                className="hover:bg-[#00BCD4] hover:text-white transition-colors"
                                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px', borderRadius: 8, border: `2px solid ${colors.primary.teal}`, color: colors.primary.teal, background: 'transparent', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
                              >
                                <MessageCircle style={{ width: 14, height: 14 }} />
                                {t.askQuestion}
                              </button>
                              <a
                                href="tel:6473026846"
                                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px', borderRadius: 8, border: '2px solid #25D366', color: '#25D366', background: 'transparent', cursor: 'pointer', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}
                                className="hover:bg-[#25D366] hover:text-white transition-colors"
                              >
                                📞 Call us
                              </a>
                            </div>
                          </div>
                    </div>
                  </div>
                </div>
              );
            })}
            </div>
          </div>

              <button
                onClick={() => setCarouselIndex(prev => Math.min(filteredDestinations.length - itemsPerView, prev + 1))}
                disabled={carouselIndex >= filteredDestinations.length - itemsPerView}
                className="disabled:opacity-30"
                style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%) translateX(16px)', zIndex: 10, width: 40, height: 40, borderRadius: '50%', background: 'white', border: '1px solid #C6DFE4', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
              >
                <ChevronRight style={{ width: 20, height: 20, color: '#0A2A33' }} />
              </button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
              {Array.from({ length: Math.max(1, filteredDestinations.length - itemsPerView + 1) }).map((_, i) => (
                <button key={i} onClick={() => setCarouselIndex(i)} style={{ width: 10, height: 10, borderRadius: '50%', background: i === carouselIndex ? colors.primary.teal : '#C6DFE4', transform: i === carouselIndex ? 'scale(1.3)' : 'scale(1)', border: 'none', cursor: 'pointer', transition: 'all 0.2s', padding: 0 }} />
              ))}
            </div>
          </div>
        </section>
      )}
 {/* ── STATS ─────────────────────────────────────────────────── */}
      <section style={{ background: '#073944', padding: '3rem 1.5rem' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div className="hero-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
            {[
              { num: siteStats.travelers > 0 ? `${siteStats.travelers}+` : '1000+', label: t.stats.travelers },
              { num: siteStats.toursCompleted > 0 ? `${siteStats.toursCompleted}+` : '100+', label: t.stats.tours },
              { num: `${NumOfDestination}`, label: t.stats.destinations },
              { num: '3', label: t.stats.languages },
            ].map(({ num, label }, i, arr) => (
              <div key={label} style={{ padding: '28px 16px', textAlign: 'center', borderRight: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none' }}>
                <div style={{ fontFamily: '"Fraunces", Georgia, serif', fontSize: 38, fontWeight: 350, color: '#ffffff', lineHeight: 1 }}>{num}</div>
                <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', marginTop: 8 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* REVIEWS */}
      {(siteSettings.showTestimonials !== false || (people.length > 0 && siteSettings.showPeople !== false)) && (
        <section style={{ order: getSectionOrder('reviews'), padding: '5rem 1.5rem', background: '#F5FBFC' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto' }}>
            {/* Editorial header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 32, marginBottom: 48, borderBottom: '1px solid #D9EBEE', paddingBottom: 32, flexWrap: 'wrap' }}>
              <div>
                <p style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#78959D', marginBottom: 12 }}>
                  {language === 'ru' ? '03 / Голоса ОТ ГОСТЕЙ' : language === 'he' ? '03 / קולות מאורחים' : '03 / Voices FROM GUESTS'}
                </p>
                <h2 style={{ fontFamily: '"Fraunces", Georgia, serif', fontWeight: 350, fontSize: 'clamp(2rem, 4vw, 3.25rem)', letterSpacing: '-0.02em', color: '#073944', lineHeight: 1.1 }}>
                  {language === 'ru' ? <>Письма <em style={{ fontStyle: 'italic' }}>с дороги.</em></> : language === 'he' ? <>מכתבים <em style={{ fontStyle: 'italic' }}>מהדרך.</em></> : <>Letters from the <em style={{ fontStyle: 'italic' }}>road.</em></>}
                </h2>
              </div>
              <p style={{ color: '#3E5F68', fontSize: 14, lineHeight: 1.65, maxWidth: '30ch', textAlign: language === 'he' ? 'left' : 'right', flexShrink: 0 }} className="hidden sm:block">
                {language === 'ru' ? 'Мы отправляем открытку домой после каждой поездки. Вот что приходит в ответ.' : language === 'he' ? 'אנו שולחים גלויה כתובה ביד לכל טיול. הנה מה שחוזר.' : "We send a handwritten postcard home for every trip. Here's what comes back."}
              </p>
            </div>
            {/* Google Rating Badge */}
            {siteSettings.googleRating && (
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 48 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 16, background: 'white', borderRadius: 16, boxShadow: '0 4px 24px rgba(7,57,68,0.10)', border: '1px solid #D9EBEE', padding: '18px 28px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  {/* Google G logo */}
                  <svg width="32" height="32" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  {/* Stars + score */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                      {[1,2,3,4,5].map(i => {
                        const pct = Math.round(Math.min(100, Math.max(0, (siteSettings.googleRating - (i - 1)) * 100)));
                        return (
                          <svg key={i} width="20" height="20" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                            <defs>
                              <linearGradient id={`g-star-${i}`} x1="0" x2="1" y1="0" y2="0">
                                <stop offset={`${pct}%`} stopColor="#FBBC04"/>
                                <stop offset={`${pct}%`} stopColor="#D1D5DB"/>
                              </linearGradient>
                            </defs>
                            <path fill={`url(#g-star-${i})`} d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                          </svg>
                        );
                      })}
                      <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 16, fontWeight: 700, color: '#073944', marginLeft: 6 }}>
                        {Number(siteSettings.googleRating).toFixed(1)}
                      </span>
                    </div>
                    {siteSettings.googleReviewCount && (
                      <p style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11, color: '#78959D', letterSpacing: '0.04em' }}>
                        {siteSettings.googleReviewCount} {language === 'ru' ? 'отзывов на Google' : language === 'he' ? 'ביקורות ב-Google' : 'reviews on Google'}
                      </p>
                    )}
                  </div>
                  {/* Divider */}
                  <div style={{ width: 1, height: 40, background: '#D9EBEE', flexShrink: 0 }} />
                  {/* Review CTA */}
                  {siteSettings.googleReviewUrl ? (
                    <a
                      href={siteSettings.googleReviewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#073944', color: 'white', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap', transition: 'opacity 0.2s' }}
                      onMouseOver={e => e.currentTarget.style.opacity = '0.85'}
                      onMouseOut={e => e.currentTarget.style.opacity = '1'}
                    >
                      {language === 'ru' ? 'Оставить отзыв →' : language === 'he' ? 'כתוב ביקורת →' : 'Leave a review →'}
                    </a>
                  ) : (
                    <p style={{ fontSize: 13, color: '#3E5F68', fontWeight: 600 }}>
                      {language === 'ru' ? 'Оставьте отзыв на Google' : language === 'he' ? 'דרגו אותנו ב-Google' : 'Rate us on Google'}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Quote cards — carousel */}
            {(() => {
              const allCards = [
                ...(siteSettings.showTestimonials !== false ? getDisplayTestimonials() : []),
                ...(siteSettings.showPeople !== false ? people.map(fb => ({
                  text: fb.comment,
                  author: `${fb.firstName || ''} ${fb.lastName || ''}`.trim(),
                  trip: [fb.tripTitle, fb.submittedAt?.toDate?.().getFullYear()].filter(Boolean).join(', '),
                  initials: `${fb.firstName?.[0] || ''}${fb.lastName?.[0] || ''}`.toUpperCase(),
                })) : []),
              ].filter(c => c.text);
              if (!allCards.length) return null;
              const goBack = () => setReviewsIdx(i => (i > 0 ? i - 1 : allCards.length - 1));
              const goNext = () => setReviewsIdx(i => (i < allCards.length - 1 ? i + 1 : 0));
              const idx = reviewsIdx % allCards.length;
              return (
                <div style={{ position: 'relative', maxWidth: 780, margin: '0 auto' }}>
                  <div style={{ overflow: 'hidden', borderRadius: 20 }}>
                    <div style={{ display: 'flex', transition: 'transform 0.45s ease', transform: `translateX(-${idx * 100}%)` }}>
                      {allCards.map((c, i) => {
                        const inits = c.initials || (c.author || '').split(/\s+/).map(n => n[0]).slice(0, 2).join('').toUpperCase();
                        return (
                          <div key={i} style={{ minWidth: '100%', background: '#F5FBFC', border: '1px solid #D9EBEE', borderRadius: 20, padding: '44px 48px 40px', display: 'flex', flexDirection: 'column', gap: 24, boxSizing: 'border-box' }}>
                            <span style={{ fontFamily: '"Fraunces", Georgia, serif', fontSize: 60, lineHeight: 1, color: colors.primary.teal, opacity: 0.45, fontStyle: 'italic', marginTop: -12, display: 'block' }}>"</span>
                            <p style={{ color: '#0A2A33', fontSize: 17, lineHeight: 1.7, fontStyle: 'italic', textAlign: 'center' }}>{c.text}</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14, justifyContent: 'center' }}>
                              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#D9EBEE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 12, fontWeight: 600, color: '#3E5F68' }}>{inits || '✦'}</span>
                              </div>
                              <div>
                                <p style={{ fontWeight: 600, fontSize: 15, color: '#073944' }}>{c.author}</p>
                                {c.trip && <p style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11, color: '#78959D', marginTop: 2 }}>{c.trip}</p>}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  {allCards.length > 1 && (
                    <>
                      <button onClick={goBack} style={{ position: 'absolute', left: -24, top: '50%', transform: 'translateY(-50%)', width: 44, height: 44, borderRadius: '50%', background: 'white', border: '1px solid #C6DFE4', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', zIndex: 2 }}>
                        <ChevronLeft style={{ width: 20, height: 20, color: '#0A2A33' }} />
                      </button>
                      <button onClick={goNext} style={{ position: 'absolute', right: -24, top: '50%', transform: 'translateY(-50%)', width: 44, height: 44, borderRadius: '50%', background: 'white', border: '1px solid #C6DFE4', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', zIndex: 2 }}>
                        <ChevronRight style={{ width: 20, height: 20, color: '#0A2A33' }} />
                      </button>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: 7, marginTop: 28 }}>
                        {allCards.map((_, i) => (
                          <button key={i} onClick={() => setReviewsIdx(i)} style={{ width: 8, height: 8, borderRadius: '50%', background: i === idx ? colors.primary.teal : '#C6DFE4', border: 'none', cursor: 'pointer', transition: 'all 0.2s', padding: 0, transform: i === idx ? 'scale(1.35)' : 'scale(1)' }} />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })()}
          </div>
        </section>
      )}

      {/* SOCIAL */}
      {siteSettings.showSocial !== false && (
        <section style={{ order: getSectionOrder('social'), padding: '5rem 1.5rem', background: '#EAF6F8' }}>
          <div style={{ maxWidth: 960, margin: '0 auto', textAlign: 'center' }}>
            <div style={{ marginBottom: 40 }}>
              <p style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#78959D', marginBottom: 8 }}>
                {language === 'ru' ? '04 — СОЦСЕТИ' : language === 'he' ? '04 — רשתות' : '04 — SOCIAL'}
              </p>
              <h2 style={{ fontFamily: '"Fraunces", Georgia, serif', fontWeight: 350, fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.02em', color: '#073944', marginBottom: 12 }}>{t.socialTitle}</h2>
              <p style={{ color: '#3E5F68', fontSize: 16 }}>{t.socialDesc}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="https://www.facebook.com/Ivritours/" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', background: '#1877F2', color: 'white', borderRadius: 8, fontWeight: 700, fontSize: 15, textDecoration: 'none' }}>
                <Facebook style={{ width: 20, height: 20 }} />{t.visitFacebook}
              </a>
              <a href="https://www.instagram.com/ivritours_ca/" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', background: 'linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)', color: 'white', borderRadius: 8, fontWeight: 700, fontSize: 15, textDecoration: 'none' }}>
                <Instagram style={{ width: 20, height: 20 }} />{t.visitInstagram}
              </a>
            </div>
          </div>
        </section>
      )}

      {/* BLOG */}
      {blogPosts.length > 0 && siteSettings.showBlog !== false && (
        <section style={{ order: getSectionOrder('blog'), padding: '5rem 1.5rem', background: '#EAF6F8' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto' }}>
            {/* Editorial header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 24, marginBottom: 40, borderBottom: '1px solid #D9EBEE', paddingBottom: 32, flexWrap: 'wrap' }}>
              <div>
                <p style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#78959D', marginBottom: 12 }}>
                  {language === 'ru' ? '05 / Журнал ПОЛЕВЫЕ ЗАМЕТКИ' : language === 'he' ? '05 / יומן הערות שטח' : '05 / Journal FIELD NOTES'}
                </p>
                <h2 style={{ fontFamily: '"Fraunces", Georgia, serif', fontWeight: 350, fontSize: 'clamp(2rem, 4vw, 3.25rem)', letterSpacing: '-0.02em', color: '#073944', lineHeight: 1.1 }}>
                  {language === 'ru' ? <>Отправления <em style={{ fontStyle: 'italic' }}>из студии.</em></> : language === 'he' ? <>שגרים <em style={{ fontStyle: 'italic' }}>מהאולפן.</em></> : <>Dispatches from the <em style={{ fontStyle: 'italic' }}>studio.</em></>}
                </h2>
              </div>
              <button
                onClick={() => navigate('/blog')}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#0A2A33', fontSize: 14, fontWeight: 500, textDecoration: 'underline', textUnderlineOffset: 4, paddingBottom: 4, flexShrink: 0 }}
              >
                {language === 'ru' ? 'Все записи →' : language === 'he' ? 'כל הכתבות →' : 'Read all entries →'}
              </button>
            </div>
            {/* Cards — borderless editorial grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {blogPosts.slice(0, 3).map(post => {
                const category = post.category || 'Journal';
                const pubDate = post.publishedAt?.toDate?.();
                const dateStr = pubDate ? pubDate.toLocaleDateString('en-CA', { month: 'short', year: 'numeric' }) : '';
                const wordCount = (post.content || '').split(/\s+/).filter(Boolean).length;
                const readTime = Math.max(1, Math.ceil(wordCount / 200));
                return (
                  <div key={post.id} onClick={() => navigate(`/blog/${post.id}`)} className="group" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ borderRadius: 12, overflow: 'hidden', aspectRatio: '1/1', position: 'relative', marginBottom: 20 }}>
                      {post.images?.[0] ? (
                        <img src={post.images[0]} alt={post.title} className="group-hover:scale-105" style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', background: '#C6DFE4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <BookOpen style={{ width: 40, height: 40, color: '#78959D' }} />
                        </div>
                      )}
                      <div style={{ position: 'absolute', bottom: 12, left: 12 }}>
                        <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10, letterSpacing: '0.06em', color: 'rgba(255,255,255,0.92)', background: 'rgba(7,57,68,0.72)', borderRadius: 4, backdropFilter: 'blur(4px)', padding: '3px 8px', display: 'inline-block', textTransform: 'lowercase' }}>
                          journal · {category.toLowerCase()}
                        </span>
                      </div>
                    </div>
                    <p style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#78959D', marginBottom: 10 }}>
                      {category.toUpperCase()}{dateStr ? ` · ${dateStr}` : ''} · {readTime} min read
                    </p>
                    <h3 style={{ fontFamily: '"Fraunces", Georgia, serif', fontSize: 20, fontWeight: 500, color: '#073944', marginBottom: 8, lineHeight: 1.3 }} className="group-hover:underline">
                      {post.title}
                    </h3>
                    {post.excerpt && <p style={{ color: '#3E5F68', fontSize: 14, lineHeight: 1.6 }} className="line-clamp-2">{post.excerpt}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* PARTNERS — Who We Work With */}
      {siteSettings.showPartners !== false && partners.filter(p => p.visible !== false).length > 0 && (
        <section style={{ order: getSectionOrder('partners'), padding: '4rem 0', background: 'white' }}>
          <style>{`
            @keyframes marqueeRTL { from { transform: translateX(0) } to { transform: translateX(-50%) } }
            .partner-track { animation: marqueeRTL 28s linear infinite; will-change: transform; }
            .partner-track:hover { animation-play-state: paused; }
            @media (max-width: 640px) { .nav-logo { height: 60px !important; } }
          `}</style>
          <div style={{ maxWidth: 1280, margin: '0 auto', textAlign: 'center', padding: '0 1.5rem', marginBottom: 40 }}>
            <p style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#78959D', marginBottom: 8 }}>
              {language === 'ru' ? '— ПАРТНЁРЫ' : language === 'he' ? '— שותפים' : '— PARTNERS'}
            </p>
            <h2 style={{ fontFamily: '"Fraunces", Georgia, serif', fontWeight: 350, fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', letterSpacing: '-0.02em', color: '#073944' }}>
              {language === 'ru' ? 'С кем мы работаем' : language === 'he' ? 'עם מי אנו עובדים' : 'Who We Work With'}
            </h2>
          </div>
          <div style={{ overflow: 'hidden', maskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)', WebkitMaskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)' }}>
            <div className="partner-track" style={{ display: 'flex', alignItems: 'center', gap: 64, width: 'max-content', paddingLeft: 32 }}>
              {[...partners.filter(p => p.visible !== false), ...partners.filter(p => p.visible !== false)].map((p, idx) => {
                const isSelected = selectedPartnerId === p.id;
                return (
                  <div
                    key={`partner-${p.id}-${idx}`}
                    onClick={() => setSelectedPartnerId(isSelected ? null : p.id)}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                      cursor: 'pointer',
                      padding: '12px 20px',
                      borderRadius: 14,
                      border: isSelected ? '2px solid #00BCD4' : '2px solid transparent',
                      background: isSelected ? '#EAF6F8' : 'transparent',
                      boxShadow: isSelected ? '0 4px 16px rgba(0,188,212,0.22)' : 'none',
                      transition: 'border 0.2s, background 0.2s, box-shadow 0.2s',
                      flexShrink: 0,
                      textDecoration: 'none',
                    }}
                  >
                    {p.logoUrl ? (
                      <img
                        src={p.logoUrl}
                        alt={p.name}
                        style={{
                          height: 80,
                          maxWidth: 180,
                          objectFit: 'contain',
                          filter: isSelected ? 'none' : 'grayscale(50%) opacity(0.6)',
                          transition: 'filter 0.25s',
                          display: 'block',
                        }}
                      />
                    ) : (
                      <div style={{ height: 80, display: 'flex', alignItems: 'center', fontSize: 20, fontWeight: 700, color: isSelected ? '#00BCD4' : '#78959D', letterSpacing: '-0.02em', transition: 'color 0.2s' }}>
                        {p.name}
                      </div>
                    )}
                    <span style={{ fontSize: 11, fontWeight: 600, color: isSelected ? '#00BCD4' : '#78959D', transition: 'color 0.2s' }}>{p.name}</span>
                    {isSelected && p.website && (
                      <a href={p.website} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                        style={{ fontSize: 11, color: '#00BCD4', textDecoration: 'underline', marginTop: 2 }}>
                        Visit site →
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* STAFF — Our Staff */}
      {siteSettings.showDrivers !== false && drivers.filter(d => d.visible !== false).length > 0 && (
        <section style={{ order: getSectionOrder('drivers'), padding: '5rem 1.5rem', background: '#F5FBFC' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <p style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#78959D', marginBottom: 8 }}>
                {language === 'ru' ? '— КОМАНДА' : language === 'he' ? '— הצוות שלנו' : '— OUR TEAM'}
              </p>
              <h2 style={{ fontFamily: '"Fraunces", Georgia, serif', fontWeight: 350, fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', letterSpacing: '-0.02em', color: '#073944' }}>
                {language === 'ru' ? 'Наш персонал' : language === 'he' ? 'הצוות שלנו' : 'Our Staff'}
              </h2>
            </div>
            <style>{`
              .staff-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 20px; }
              @media (max-width: 640px) { .staff-grid { grid-template-columns: repeat(3, 1fr); gap: 10px; } }
              .staff-grid-single { display: grid; grid-template-columns: minmax(0, 280px); gap: 20px; margin: 0 auto; max-width: 280px; }
              @media (max-width: 640px) { .staff-grid-single { max-width: 140px; } }
            `}</style>
            {(() => {
              const visibleStaff = drivers.filter(d => d.visible !== false);
              const isSingle = visibleStaff.length === 1;
              return (
                <div className={isSingle ? 'staff-grid-single' : 'staff-grid'}>
                  {visibleStaff.map(d => (
                    <div key={d.id} style={{ background: 'white', borderRadius: 14, overflow: 'hidden', boxShadow: '0 4px 20px rgba(7,57,68,0.08)', border: '1px solid #D9EBEE' }}>
                      {d.photoUrl ? (
                        <img src={d.photoUrl} alt={d.name} style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', objectPosition: 'top', display: 'block' }} />
                      ) : (
                        <div style={{ aspectRatio: '1/1', background: '#EAF6F8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>👤</div>
                      )}
                      <div style={{ padding: '10px 12px 14px' }}>
                        <p style={{ fontFamily: '"Fraunces", Georgia, serif', fontSize: 15, fontWeight: 500, color: '#073944', marginBottom: 2 }}>{d.name}</p>
                        {d.since && <p style={{ fontSize: 10, color: colors.primary.teal, fontWeight: 600, marginBottom: 4 }}>Since {d.since}</p>}
                        {d.languages && <p style={{ fontSize: 10, color: '#78959D', marginBottom: 4 }}>🌐 {d.languages}</p>}
                        {d.bio && <p style={{ fontSize: 11, color: '#3E5F68', lineHeight: 1.5 }}>{d.bio}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </section>
      )}

      {/* CONTACT */}
      {siteSettings.showContact !== false && (
        <section id="contact" style={{ order: getSectionOrder('contact'), padding: '5rem 1.5rem', background: '#EAF6F8' }}>
          <div style={{ maxWidth: 768, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <p style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#78959D', marginBottom: 8 }}>
                {language === 'ru' ? '06 — КОНТАКТЫ' : language === 'he' ? '06 — יצירת קשר' : '06 — CONTACT'}
              </p>
              <h2 style={{ fontFamily: '"Fraunces", Georgia, serif', fontWeight: 350, fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.02em', color: '#073944' }}>{t.contactTitle}</h2>
              <button
                onClick={() => setContactOpen(p => !p)}
                style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: colors.primary.teal, color: 'white', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}
              >
                {contactOpen ? (language === 'ru' ? 'Скрыть форму' : language === 'he' ? 'הסתר טופס' : 'Hide Form') : (language === 'ru' ? 'Написать нам' : language === 'he' ? 'פתח טופס' : 'Show Form')}
                <ChevronDown style={{ width: 16, height: 16, transform: contactOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>
            </div>
            <div style={{ display: contactOpen ? 'block' : 'none' }}>
              <form onSubmit={handleSubmit} style={{ background: 'white', borderRadius: 16, boxShadow: '0 4px 20px rgba(7,57,68,0.08)', padding: 32, border: '1px solid #D9EBEE' }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6" style={{ marginBottom: 24 }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, color: '#0A2A33', marginBottom: 8, fontSize: 14 }}>{t.nameLabel} *</label>
                    <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="focus:border-[#00BCD4]" style={{ width: '100%', padding: '12px 16px', border: '2px solid #D9EBEE', borderRadius: 8, outline: 'none', fontSize: 14, boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, color: '#0A2A33', marginBottom: 8, fontSize: 14 }}>{t.emailLabel} *</label>
                    <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="focus:border-[#00BCD4]" style={{ width: '100%', padding: '12px 16px', border: '2px solid #D9EBEE', borderRadius: 8, outline: 'none', fontSize: 14, boxSizing: 'border-box' }} />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6" style={{ marginBottom: 24 }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, color: '#0A2A33', marginBottom: 8, fontSize: 14 }}>{t.phoneLabel}</label>
                    <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="focus:border-[#00BCD4]" style={{ width: '100%', padding: '12px 16px', border: '2px solid #D9EBEE', borderRadius: 8, outline: 'none', fontSize: 14, boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, color: '#0A2A33', marginBottom: 8, fontSize: 14 }}>{t.destinationLabel}</label>
                    <input type="text" value={formData.destination} onChange={(e) => setFormData({ ...formData, destination: e.target.value })} className="focus:border-[#00BCD4]" style={{ width: '100%', padding: '12px 16px', border: '2px solid #D9EBEE', borderRadius: 8, outline: 'none', fontSize: 14, boxSizing: 'border-box' }} />
                  </div>
                </div>
                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: 'block', fontWeight: 600, color: '#0A2A33', marginBottom: 8, fontSize: 14 }}>{t.messageLabel} *</label>
                  <textarea required rows={5} value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} className="focus:border-[#00BCD4]" style={{ width: '100%', padding: '12px 16px', border: '2px solid #D9EBEE', borderRadius: 8, outline: 'none', fontSize: 14, resize: 'vertical', boxSizing: 'border-box' }} />
                </div>
                <button type="submit" disabled={sending} style={{ width: '100%', padding: '14px', color: 'white', fontSize: 16, fontWeight: 700, borderRadius: 8, background: colors.primary.teal, border: 'none', cursor: sending ? 'not-allowed' : 'pointer', opacity: sending ? 0.5 : 1 }}>
                  {sending ? (language === 'ru' ? 'Отправка...' : language === 'he' ? 'שולח...' : 'Sending...') : t.submitBtn}
                </button>
              </form>
            </div>
          </div>
        </section>
      )}

      </div>
      {/* ── End orderable sections ──────────────────────────────── */}

      {/* FOOTER */}
      <footer style={{ background: '#073944', color: 'white', padding: '4rem 1.5rem 2rem' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ borderBottom: '1px solid rgba(198,223,228,0.15)', paddingBottom: '2rem', marginBottom: '2.5rem' }}>
            <div className="footer-wordmark" style={{ fontFamily: '"Fraunces", Georgia, serif', fontStyle: 'italic', fontWeight: 350, fontSize: 'clamp(1.5rem, 4vw, 3rem)', lineHeight: 0.85, color: '#EAF6F8', letterSpacing: '-0.03em', opacity: 0.88 }}>
              IVRITours
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8" style={{ marginBottom: '2.5rem' }}>
            <div>
              <p style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#78959D', marginBottom: 12 }}>Tours</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {destinations.slice(0, 4).map(d => <span key={d.type === 'custom' ? d.id : d.key} style={{ color: '#C6DFE4', fontSize: 14 }}>{d.type === 'custom' ? d.title : t.destinations[d.key]?.title}</span>)}
              </div>
            </div>
            <div>
              <p style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#78959D', marginBottom: 12 }}>{language === 'ru' ? 'Ещё' : language === 'he' ? 'עוד' : 'More'}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {destinations.slice(4).map(d => <span key={d.type === 'custom' ? d.id : d.key} style={{ color: '#C6DFE4', fontSize: 14 }}>{d.type === 'custom' ? d.title : t.destinations[d.key]?.title}</span>)}
              </div>
            </div>
            <div>
              <p style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#78959D', marginBottom: 12 }}>{language === 'ru' ? 'Соцсети' : language === 'he' ? 'עקבו' : 'Follow'}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <a href="https://www.facebook.com/Ivritours/" target="_blank" rel="noopener noreferrer" style={{ color: '#C6DFE4', fontSize: 14, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}><Facebook style={{ width: 14, height: 14 }} />Facebook</a>
                <a href="https://www.instagram.com/ivritours_ca/" target="_blank" rel="noopener noreferrer" style={{ color: '#C6DFE4', fontSize: 14, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}><Instagram style={{ width: 14, height: 14 }} />Instagram</a>
              </div>
            </div>
            <div>
              <p style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#78959D', marginBottom: 12 }}>{language === 'ru' ? 'Прочее' : language === 'he' ? 'כללי' : 'General'}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button onClick={() => navigate('/gift-card-purchase')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#C6DFE4', fontSize: 14, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8, padding: 0 }}>
                  <Gift style={{ width: 14, height: 14 }} />{tGift.purchaseGiftCard}
                </button>
                <button onClick={() => setShowTerms(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#C6DFE4', fontSize: 14, textAlign: 'left', padding: 0 }}>
                  {language === 'he' ? 'תנאי שימוש' : language === 'ru' ? 'Условия использования' : 'Terms of Use'}
                </button>
              </div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(198,223,228,0.15)', paddingTop: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <p style={{ color: '#78959D', fontSize: 13 }}>© 2026 IVRITours. {t.footerText}</p>
            <div className="[&_button]:!text-white [&_button]:!border-white/20 [&_button]:hover:!bg-white/10">
              <LanguageSelector />
            </div>
          </div>
        </div>
      </footer>

      {selectedBlogPost && <BlogPostModal post={selectedBlogPost} onClose={() => setSelectedBlogPost(null)} />}

      {/* Terms of Use lightbox */}
      {showTerms && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-[70] p-4"
          onClick={() => setShowTerms(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center px-6 py-4 border-b sticky top-0 bg-white rounded-t-2xl">
              <h2 className="text-lg font-bold text-gray-900">
                {language === 'he' ? 'תנאי שימוש' : language === 'ru' ? 'Условия использования' : 'Terms of Use'}
              </h2>
              <button onClick={() => setShowTerms(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-6 text-sm text-gray-700 leading-relaxed">

              {/* Cancellation Policy */}
              <div>
                <h3 className="text-base font-bold text-gray-900 mb-3" style={{ color: colors.primary.teal }}>Cancellation Policy</h3>
                <ol className="list-decimal list-inside space-y-2">
                  <li>Cancellations made <strong>7 days or more</strong> before the trip date will receive a full refund.</li>
                  <li>Cancellations made <strong>4 days</strong> before the trip date will receive a <strong>50% refund</strong>.</li>
                  <li>Cancellations made <strong>less than 3 days</strong> before the trip date are <strong>non-refundable</strong>.</li>
                  <li><strong>No-shows</strong> on the trip date are non-refundable.</li>
                  <li>Trip organizers reserve the right to cancel trips due to weather, safety concerns, or insufficient participation, in which case full refunds will be provided.</li>
                </ol>
              </div>

              <hr className="border-gray-100" />

              {/* Waiver */}
              <div>
                <h3 className="text-base font-bold text-gray-900 mb-3" style={{ color: colors.primary.teal }}>Waiver of Liability & Assumption of Risk</h3>
                <p className="mb-3">By participating in any IVRITours trip or activity, you acknowledge and agree to the following:</p>
                <ol className="list-decimal list-inside space-y-2">
                  <li>You are voluntarily participating and understand that participation involves inherent risks, including but not limited to personal injury, property damage, or death.</li>
                  <li>You <strong>waive, release, and discharge</strong> IVRITours, its officers, employees, and agents from any and all liability for any loss, damage, injury, or death that may occur during your participation.</li>
                  <li>You <strong>assume all risks</strong> associated with participation, whether known or unknown.</li>
                  <li>You agree to <strong>indemnify and hold harmless</strong> IVRITours from any claims, actions, or losses arising from your participation.</li>
                  <li>You <strong>consent</strong> to receive emergency medical treatment if necessary.</li>
                </ol>
              </div>

              <hr className="border-gray-100" />

              {/* General */}
              <div>
                <h3 className="text-base font-bold text-gray-900 mb-3" style={{ color: colors.primary.teal }}>General</h3>
                <p>These terms apply to all trips and activities organized by IVRITours. By registering for a trip you confirm that you have read, understood, and agree to these terms in full.</p>
                <p className="mt-2">For questions, contact us through the contact form on this website.</p>
              </div>
            </div>

            <div className="px-6 pb-5">
              <button
                onClick={() => setShowTerms(false)}
                className="w-full py-2.5 rounded-xl text-white font-semibold text-sm hover:opacity-90 transition-opacity"
                style={{ backgroundColor: colors.primary.teal }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {scrollY > 300 && (
        <button onClick={() => navigate('/gift-card-purchase')} className="animate-float" style={{ position: 'fixed', bottom: 32, left: 32, background: 'white', borderRadius: '50%', boxShadow: '0 10px 30px rgba(0,188,212,0.3)', padding: 16, border: 'none', cursor: 'pointer', zIndex: 50 }} title={language === 'ru' ? 'Купить подарочную карту' : language === 'he' ? 'קנה כרטיס מתנה' : 'Purchase Gift Card'}>
          <Gift style={{ width: 32, height: 32, color: colors.primary.teal }} />
        </button>
      )}

      <div style={{ position: 'fixed', top: 96, right: 16, zIndex: 50 }}>
        <button onClick={() => setShowAccessibility(!showAccessibility)} style={{ background: '#2563EB', color: 'white', borderRadius: '50%', padding: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', border: 'none', cursor: 'pointer' }} aria-label="Accessibility Menu">
          <Eye style={{ width: 24, height: 24 }} />
        </button>
        {showAccessibility && (
          <div style={{ position: 'absolute', top: 56, right: 0, background: 'white', borderRadius: 12, boxShadow: '0 20px 60px rgba(0,0,0,0.15)', padding: 16, width: 256, border: '2px solid #2563EB' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontWeight: 700, fontSize: 18 }}>{language === 'ru' ? 'Доступность' : language === 'he' ? 'נגישות' : 'Accessibility'}</h3>
              <button onClick={() => setShowAccessibility(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}><X style={{ width: 20, height: 20 }} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                  <Type style={{ width: 16, height: 16 }} />{language === 'ru' ? 'Размер шрифта' : language === 'he' ? 'גודל גופן' : 'Font Size'}
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button onClick={() => setAccessibilitySettings(prev => ({ ...prev, fontSize: Math.max(80, prev.fontSize - 10) }))} style={{ padding: '4px 12px', background: '#E5E7EB', borderRadius: 4, border: 'none', cursor: 'pointer' }}>A-</button>
                  <span style={{ fontSize: 14 }}>{accessibilitySettings.fontSize}%</span>
                  <button onClick={() => setAccessibilitySettings(prev => ({ ...prev, fontSize: Math.min(150, prev.fontSize + 10) }))} style={{ padding: '4px 12px', background: '#E5E7EB', borderRadius: 4, border: 'none', cursor: 'pointer' }}>A+</button>
                </div>
              </div>
              <button onClick={() => setAccessibilitySettings(prev => ({ ...prev, contrast: !prev.contrast }))} style={{ width: '100%', padding: 12, borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8, background: accessibilitySettings.contrast ? '#2563EB' : '#F3F4F6', color: accessibilitySettings.contrast ? 'white' : 'inherit', border: 'none', cursor: 'pointer' }}>
                <ZoomIn style={{ width: 20, height: 20 }} />{language === 'ru' ? 'Высокий контраст' : language === 'he' ? 'ניגודיות גבוהה' : 'High Contrast'}
              </button>
              <button onClick={() => setAccessibilitySettings(prev => ({ ...prev, grayScale: !prev.grayScale }))} style={{ width: '100%', padding: 12, borderRadius: 8, background: accessibilitySettings.grayScale ? '#1F2937' : '#F3F4F6', color: accessibilitySettings.grayScale ? 'white' : 'inherit', border: 'none', cursor: 'pointer' }}>
                {language === 'ru' ? 'Оттенки серого' : language === 'he' ? 'גווני אפור' : 'Grayscale'}
              </button>
              <button onClick={() => setAccessibilitySettings({ fontSize: 100, contrast: false, grayScale: false })} style={{ padding: 8, fontSize: 14, color: '#2563EB', background: 'none', border: 'none', cursor: 'pointer' }}>
                {language === 'ru' ? 'Сбросить' : language === 'he' ? 'איפוס' : 'Reset'}
              </button>
            </div>
          </div>
        )}
      </div>

      {showCookieConsent && (
        <div className="animate-slideUp" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'white', borderTop: '4px solid #2563EB', boxShadow: '0 -4px 20px rgba(0,0,0,0.1)', padding: 24, zIndex: 50 }}>
          <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flex: 1 }}>
              <Cookie style={{ width: 32, height: 32, flexShrink: 0, color: colors.primary.teal }} />
              <div>
                <h3 style={{ fontWeight: 700, fontSize: 17, marginBottom: 6 }}>{language === 'ru' ? 'Мы используем cookies' : language === 'he' ? 'אנו משתמשים בעוגיות' : 'We use cookies'}</h3>
                <p style={{ fontSize: 14, color: '#4B5563' }}>{language === 'ru' ? 'Этот сайт использует cookies для улучшения вашего опыта.' : language === 'he' ? 'אתר זה משתמש בעוגיות כדי לשפר את החוויה שלך.' : 'This website uses cookies to enhance your experience.'}</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={declineCookies} style={{ padding: '8px 20px', border: `2px solid ${colors.primary.teal}`, borderRadius: 8, color: colors.primary.teal, background: 'transparent', cursor: 'pointer' }}>{language === 'ru' ? 'Отклонить' : language === 'he' ? 'דחה' : 'Decline'}</button>
              <button onClick={acceptCookies} style={{ padding: '8px 20px', background: colors.primary.teal, color: 'white', borderRadius: 8, border: 'none', cursor: 'pointer' }}>{language === 'ru' ? 'Принять' : language === 'he' ? 'קבל' : 'Accept'}</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideDown { from { transform: translateY(-50px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } }
        @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        .animate-slideDown { animation: slideDown 0.5s ease-out; }
        .animate-float { animation: float 3s ease-in-out infinite; }
        .animate-slideUp { animation: slideUp 0.5s ease-out; }
        .high-contrast { filter: contrast(2); }
        .high-contrast * { border-color: #000 !important; }
        @media (max-width: 767px) {
          .hero-section { padding: 3rem 1rem 2.5rem !important; position: relative !important; overflow: hidden !important; }
          .hero-grid { grid-template-columns: 1fr !important; }
          .hero-image-wrap {
            position: absolute !important;
            top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important;
            border-radius: 0 !important;
            aspect-ratio: unset !important;
            box-shadow: none !important;
            z-index: 0 !important;
            opacity: 0.5 !important;
            filter: blur(1px) !important;
            overflow: hidden !important;
          }
          .hero-content { position: relative !important; z-index: 1 !important; }
          .hero-stats { grid-template-columns: repeat(2, 1fr) !important; }
          .section-pad { padding: 3rem 1rem !important; }
        }
        @media (max-width: 479px) {
          .footer-wordmark { font-size: clamp(1.2rem, 8vw, 2rem) !important; }
        }
      `}</style>

      <ChatWidget language={language} />
    </div>
  );
};

export default LandingPage;
