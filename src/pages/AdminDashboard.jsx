import { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { Plus, Copy, Check, Trash2, Edit, MessageCircle, Send, Clock, Layout, ToggleLeft, ToggleRight, Users, BookOpen, CheckCheck, X, Eye, GripVertical, ChevronUp, ChevronDown, Share2, CornerDownRight, Lock } from 'lucide-react';
import { getAllTrips, createTrip, deleteTrip, updateTrip, publishTrip, toggleFeedbackWebsite, getSiteSettings, updateSiteSettings, getAllBlogPosts, createBlogPost, updateBlogPost, deleteBlogPost, getPendingBlogComments, approveBlogComment, deleteBlogComment, updateBlogComment, getPartners, createPartner, updatePartner, deletePartner, getDrivers, createDriver, updateDriver, deleteDriver, getCustomDestinations, createCustomDestination, updateCustomDestination, deleteCustomDestination } from '../utils/firestoreUtils';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import CreateTripModal from '../components/CreateTripModal';
import BlogAdminModal from '../components/BlogAdminModal';
import UsersModal from '../components/UsersModal';
import BlogPostModal from '../components/BlogPostModal';
import BulkInvoicesModal from '../components/BulkInvoicesModal';
import MigrationModal from '../components/MigrationModal';
import QuestionsModal from '../components/QuestionsModal';
import EditTripModal from '../components/EditTripModal';
import TripViewModal from '../components/TripViewModal';
import Header from '../components/Header';
import TypewriterGreeting from '../components/TypewriterGreeting';
import useAdmin from '../hooks/useAdmin';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../utils/translations';
import colors from '../utils/colors';
import { hasSeenTour, startTour } from '../utils/tour';

const AdminDashboard = () => {
  const { language } = useLanguage();
  const t = translations[language];
  const { isAdmin, adminData } = useAdmin();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [allTrips, setAllTrips] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [viewFilter, setViewFilter] = useState('upcoming'); // 'all', 'upcoming', 'past'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'planned', 'scheduled', 'done'
  const [deletingId, setDeletingId] = useState(null);
  const [editingTrip, setEditingTrip] = useState(null);
  const [viewingTripId, setViewingTripId] = useState(null);
  const [registrationCounts, setRegistrationCounts] = useState({}); // Map of tripId -> approved count
  const [pendingCounts, setPendingCounts] = useState({}); // Map of tripId -> pending count
  const [showBulkInvoices, setShowBulkInvoices] = useState(false);
  const [showMigration, setShowMigration] = useState(false);
  const [showQuestions, setShowQuestions] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);
  // Landing page tab
  const [activeTab, setActiveTab] = useState('trips');
  const [siteSettings, setSiteSettings] = useState({});
  const [settingsSaving, setSettingsSaving] = useState(false);
  const DEFAULT_SECTION_ORDER = ['trips', 'partners', 'drivers', 'reviews', 'social', 'blog', 'contact'];
  const [sectionOrder, setSectionOrder] = useState(DEFAULT_SECTION_ORDER);
  const [draggingSection, setDraggingSection] = useState(null);
  const [dragOverSection, setDragOverSection] = useState(null);
  const [allFeedbacks, setAllFeedbacks] = useState([]);
  const [feedbacksLoading, setFeedbacksLoading] = useState(false);
  const [togglingFeedback, setTogglingFeedback] = useState(null);
  // Testimonials editor (landing page)
  const DEFAULT_TESTIMONIALS = [
    { text: '', author: '', trip: '' },
    { text: '', author: '', trip: '' },
    { text: '', author: '', trip: '' },
  ];
  const [customTestimonials, setCustomTestimonials] = useState(DEFAULT_TESTIMONIALS);
  const [testimonialsSaving, setTestimonialsSaving] = useState(false);
  // Blog tab
  const [blogPosts, setBlogPosts] = useState([]);
  const [blogLoading, setBlogLoading] = useState(false);
  const [showBlogModal, setShowBlogModal] = useState(false);
  const [editingBlogPost, setEditingBlogPost] = useState(null);
  const [pendingComments, setPendingComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [togglingPost, setTogglingPost] = useState(null);
  const [deletingBlogId, setDeletingBlogId] = useState(null);
  const [previewBlogPost, setPreviewBlogPost] = useState(null);
  const [copiedBlogId, setCopiedBlogId] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [showUsersModal, setShowUsersModal] = useState(false);
  // Partners
  const [partners, setPartners] = useState([]);
  const [partnersLoading, setPartnersLoading] = useState(false);
  const [partnerForm, setPartnerForm] = useState(null); // null = closed, {} = new, {id,...} = editing
  // Drivers
  const [drivers, setDrivers] = useState([]);
  const [driversLoading, setDriversLoading] = useState(false);
  const [driverForm, setDriverForm] = useState(null);
  // Custom destinations
  const [customDests, setCustomDests] = useState([]);
  const [customDestsLoading, setCustomDestsLoading] = useState(false);
  const [destForm, setDestForm] = useState(null);
  // Static destination visibility (keys to hide)
  const STATIC_DESTS = [
    { key: 'toronto', label: 'Toronto' },
    { key: 'niagara', label: 'Niagara Falls' },
    { key: 'tremblant', label: 'Mont-Tremblant' },
    { key: 'quebec', label: 'Quebec City' },
    { key: 'barrie', label: 'Barrie' },
    { key: 'detroit', label: 'Detroit' },
    { key: 'chicago', label: 'Chicago' },
  ];

  useEffect(() => {
    loadTrips();
  }, [selectedDate, viewFilter]);

  useEffect(() => {
    if (!hasSeenTour()) {
      const timer = setTimeout(() => startTour(t), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  // Writers only see the Blog tab
  const isWriter = adminData?.role === 'writer';
  useEffect(() => {
    if (isWriter) setActiveTab('blog');
  }, [isWriter]);

  // Real-time listener for unread questions count
  useEffect(() => {
    const q = query(collection(db, 'questions'), where('read', '==', false));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setQuestionCount(snapshot.size);
    });
    return () => unsubscribe();
  }, []);

  // Landing page data
  useEffect(() => {
    getSiteSettings().then(settings => {
      setSiteSettings(settings);
      if (settings.sectionOrder?.length) setSectionOrder(settings.sectionOrder);
      if (settings.customTestimonials?.length) setCustomTestimonials(settings.customTestimonials);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (activeTab !== 'landing') return;
    setFeedbacksLoading(true);
    getDocs(collection(db, 'feedbacks'))
      .then(snap => setAllFeedbacks(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
      .catch(() => {})
      .finally(() => setFeedbacksLoading(false));
    setPartnersLoading(true);
    getPartners().then(setPartners).catch(() => {}).finally(() => setPartnersLoading(false));
    setDriversLoading(true);
    getDrivers().then(setDrivers).catch(() => {}).finally(() => setDriversLoading(false));
    setCustomDestsLoading(true);
    getCustomDestinations().then(setCustomDests).catch(() => {}).finally(() => setCustomDestsLoading(false));
  }, [activeTab]);

  const loadBlogData = () => {
    setBlogLoading(true);
    getAllBlogPosts().then(setBlogPosts).catch(() => {}).finally(() => setBlogLoading(false));
    setCommentsLoading(true);
    getPendingBlogComments().then(setPendingComments).catch(() => {}).finally(() => setCommentsLoading(false));
  };

  useEffect(() => {
    if (activeTab !== 'blog') return;
    loadBlogData();
  }, [activeTab]);

  const handleToggleSetting = async (key) => {
    const updated = { ...siteSettings, [key]: siteSettings[key] === false ? true : false };
    setSiteSettings(updated);
    setSettingsSaving(true);
    try { await updateSiteSettings(updated); } catch (e) { console.error(e); } finally { setSettingsSaving(false); }
  };

  // Section order & visibility — persisted in siteSettings.sectionOrder
  const SECTION_CONFIG = [
    { key: 'trips',    label: 'Upcoming Trips',         icon: '🗺️',  visKey: 'showDestinations' },
    { key: 'partners', label: 'Who We Work With',       icon: '🤝',  visKey: 'showPartners' },
    { key: 'drivers',  label: 'Our Staff',               icon: '👤',  visKey: 'showDrivers' },
    { key: 'reviews',  label: 'Reviews & Testimonials', icon: '⭐',  visKey: 'showTestimonials', alsoKey: 'showPeople' },
    { key: 'social',   label: 'Social Media',           icon: '📱',  visKey: 'showSocial' },
    { key: 'blog',     label: 'Blog Posts',             icon: '📝',  visKey: 'showBlog' },
    { key: 'contact',  label: 'Contact Form',           icon: '✉️',  visKey: 'showContact' },
  ];

  const handleToggleSectionVisibility = async (cfg) => {
    const on = siteSettings[cfg.visKey] !== false;
    const updates = { [cfg.visKey]: !on };
    if (cfg.alsoKey) updates[cfg.alsoKey] = !on;
    const updated = { ...siteSettings, ...updates };
    setSiteSettings(updated);
    setSettingsSaving(true);
    try { await updateSiteSettings(updated); } finally { setSettingsSaving(false); }
  };

  const persistOrder = async (newOrder) => {
    setSectionOrder(newOrder);
    setSettingsSaving(true);
    try { await updateSiteSettings({ sectionOrder: newOrder }); } finally { setSettingsSaving(false); }
  };

  const moveSectionInOrder = (idx, dir) => {
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= sectionOrder.length) return;
    const next = [...sectionOrder];
    [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
    persistOrder(next);
  };

  const handleSectionDragStart = (e, idx) => {
    e.dataTransfer.effectAllowed = 'move';
    setDraggingSection(idx);
  };
  const handleSectionDragOver = (e, idx) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverSection(idx);
  };
  const handleSectionDrop = (e, idx) => {
    e.preventDefault();
    const from = draggingSection;
    if (from === null || from === idx) return;
    const next = [...sectionOrder];
    const [moved] = next.splice(from, 1);
    next.splice(idx, 0, moved);
    setDraggingSection(null);
    setDragOverSection(null);
    persistOrder(next);
  };
  const handleSectionDragEnd = () => {
    setDraggingSection(null);
    setDragOverSection(null);
  };

  const handleSaveTestimonials = async () => {
    setTestimonialsSaving(true);
    try {
      await updateSiteSettings({ customTestimonials });
    } catch (e) { console.error(e); } finally { setTestimonialsSaving(false); }
  };

  // ── Partners ──────────────────────────────────────────────────────────────
  const handleSavePartner = async (form) => {
    if (form.id) await updatePartner(form.id, { name: form.name, logoUrl: form.logoUrl, website: form.website });
    else await createPartner({ name: form.name, logoUrl: form.logoUrl, website: form.website, visible: true });
    setPartnerForm(null);
    getPartners().then(setPartners).catch(() => {});
  };
  const handleTogglePartner = async (p) => {
    await updatePartner(p.id, { visible: !p.visible });
    setPartners(prev => prev.map(x => x.id === p.id ? { ...x, visible: !x.visible } : x));
  };
  const handleDeletePartner = async (id) => {
    if (!confirm('Delete this partner?')) return;
    await deletePartner(id);
    setPartners(prev => prev.filter(x => x.id !== id));
  };

  // ── Drivers ───────────────────────────────────────────────────────────────
  const handleSaveDriver = async (form) => {
    const data = { name: form.name, photoUrl: form.photoUrl, since: form.since, languages: form.languages, bio: form.bio };
    if (form.id) await updateDriver(form.id, data);
    else await createDriver({ ...data, visible: true });
    setDriverForm(null);
    getDrivers().then(setDrivers).catch(() => {});
  };
  const handleToggleDriver = async (d) => {
    await updateDriver(d.id, { visible: !d.visible });
    setDrivers(prev => prev.map(x => x.id === d.id ? { ...x, visible: !x.visible } : x));
  };
  const handleDeleteDriver = async (id) => {
    if (!confirm('Delete this driver?')) return;
    await deleteDriver(id);
    setDrivers(prev => prev.filter(x => x.id !== id));
  };

  // ── Custom Destinations ───────────────────────────────────────────────────
  const handleSaveCustomDest = async (form) => {
    const data = {
      title: form.title, description: form.description, image: form.image,
      duration: form.duration, groupSize: form.groupSize,
      highlights: form.highlights.split(',').map(h => h.trim()).filter(Boolean),
      durationCategory: form.durationCategory, country: form.country,
    };
    if (form.id) await updateCustomDestination(form.id, data);
    else await createCustomDestination({ ...data, visible: true });
    setDestForm(null);
    getCustomDestinations().then(setCustomDests).catch(() => {});
  };
  const handleToggleCustomDest = async (d) => {
    await updateCustomDestination(d.id, { visible: !d.visible });
    setCustomDests(prev => prev.map(x => x.id === d.id ? { ...x, visible: !x.visible } : x));
  };
  const handleDeleteCustomDest = async (id) => {
    if (!confirm('Delete this destination?')) return;
    await deleteCustomDestination(id);
    setCustomDests(prev => prev.filter(x => x.id !== id));
  };
  const handleToggleStaticDest = async (key) => {
    const hidden = siteSettings.hiddenDestinations || [];
    const next = hidden.includes(key) ? hidden.filter(k => k !== key) : [...hidden, key];
    const updated = { ...siteSettings, hiddenDestinations: next };
    setSiteSettings(updated);
    await updateSiteSettings({ hiddenDestinations: next });
  };

  const handleToggleFeedbackShow = async (fb) => {
    const next = !fb.showOnWebsite;
    setTogglingFeedback(fb.id);
    try {
      await toggleFeedbackWebsite(fb.id, next);
      setAllFeedbacks(prev => prev.map(f => f.id === fb.id ? { ...f, showOnWebsite: next } : f));
    } catch (e) { console.error(e); } finally { setTogglingFeedback(null); }
  };

  const handleSaveBlogPost = async (formData) => {
    if (editingBlogPost) {
      const updates = { ...formData };
      if (formData.published && !editingBlogPost.published) {
        updates.publishedAt = new Date();
      }
      await updateBlogPost(editingBlogPost.id, updates);
    } else {
      await createBlogPost(formData);
    }
    setShowBlogModal(false);
    setEditingBlogPost(null);
    loadBlogData();
  };

  const handleDeleteBlogPost = async (postId) => {
    if (!confirm('Delete this blog post? This cannot be undone.')) return;
    setDeletingBlogId(postId);
    try {
      await deleteBlogPost(postId);
      loadBlogData();
    } catch (e) { console.error(e); } finally { setDeletingBlogId(null); }
  };

  const handleToggleBlogPublish = async (post) => {
    setTogglingPost(post.id);
    const next = !post.published;
    try {
      await updateBlogPost(post.id, {
        published: next,
        publishedAt: next ? new Date() : null,
      });
      setBlogPosts(prev => prev.map(p => p.id === post.id ? { ...p, published: next } : p));
    } catch (e) { console.error(e); } finally { setTogglingPost(null); }
  };

  const handleCopyBlogLink = (postId) => {
    navigator.clipboard.writeText(`${window.location.origin}/blog/${postId}`);
    setCopiedBlogId(postId);
    setTimeout(() => setCopiedBlogId(null), 2000);
  };

  const handleApproveComment = async (commentId) => {
    await approveBlogComment(commentId);
    setPendingComments(prev => prev.filter(c => c.id !== commentId));
  };

  const handleDeleteComment = async (commentId) => {
    await deleteBlogComment(commentId);
    setPendingComments(prev => prev.filter(c => c.id !== commentId));
  };

  const handleSubmitReply = async (commentId) => {
    if (!replyText.trim()) return;
    const replyAuthor = adminData?.displayName || 'IVRITours';
    await updateBlogComment(commentId, { reply: replyText.trim(), replyAuthor });
    setPendingComments(prev => prev.map(c => c.id === commentId ? { ...c, reply: replyText.trim(), replyAuthor } : c));
    setReplyingTo(null);
    setReplyText('');
  };

  const loadTrips = async () => {
    setLoading(true);
    try {
      const tripsData = await getAllTrips();
      // Auto-update statuses for each trip
      await autoUpdateTripStatuses(tripsData);
      setAllTrips(tripsData);
    } catch (error) {
      console.error('Error loading trips:', error);
    } finally {
      setLoading(false);
    }
  };

  // Automatically update trip statuses based on participants and date
  const autoUpdateTripStatuses = async (trips) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const counts = {};
    const pending = {};

    for (const trip of trips) {
      // Skip draft trips — they should not be auto-promoted
      if (trip.status === 'draft') {
        counts[trip.id] = 0;
        pending[trip.id] = 0;
        continue;
      }

      let needsUpdate = false;
      let newStatus = trip.status || 'planned';

      // Get the end date (or use start date if no end date exists)
      const tripEndDate = trip.endDateTime?.toDate?.() || trip.endDate?.toDate?.() || trip.startDateTime?.toDate?.() || trip.date?.toDate?.() || new Date(trip.date);
      tripEndDate.setHours(0, 0, 0, 0);

      // Fetch registration count for this trip
      try {
        const registrationsRef = collection(db, 'registrations');
        const q = query(registrationsRef, where('tripId', '==', trip.id));
        const snapshot = await getDocs(q);
        const allRegs = snapshot.docs.map(d => d.data());
        const participantCount = allRegs.filter(r => r.status !== 'pending').length;
        const pendingCount = allRegs.filter(r => r.status === 'pending').length;
        counts[trip.id] = participantCount;
        pending[trip.id] = pendingCount;

        // Check if trip date has passed (check end date)
        if (tripEndDate < today && newStatus !== 'done') {
          newStatus = 'done';
          needsUpdate = true;
        }
        // Check if trip has 3+ participants and should be scheduled
        else if (tripEndDate >= today) {
          if (participantCount >= 3 && newStatus === 'planned') {
            newStatus = 'scheduled';
            needsUpdate = true;
          }
        }
      } catch (error) {
        console.error('Error checking participants for trip:', trip.id, error);
        counts[trip.id] = 0;
      }

      // Update the status if needed
      if (needsUpdate) {
        try {
          await updateTrip(trip.id, { status: newStatus });
          trip.status = newStatus; // Update local copy
        } catch (error) {
          console.error('Error updating trip status:', trip.id, error);
        }
      }
    }

    // Update registration counts state
    setRegistrationCounts(counts);
    setPendingCounts(pending);
  };

  const handleCreateTrip = async (tripData) => {
    try {
      await createTrip(tripData);
      setShowCreateModal(false);
      loadTrips();
    } catch (error) {
      console.error('Error creating trip:', error);
    }
  };

  const handleCopyLink = (tripId) => {
    const link = `${window.location.origin}/PlanYourTripNow/register/${tripId}`;
    navigator.clipboard.writeText(link);
    setCopiedId(tripId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDeleteTrip = async (tripId) => {
    if (!confirm(t.deleteConfirm)) {
      return;
    }

    setDeletingId(tripId);
    try {
      await deleteTrip(tripId);
      loadTrips();
    } catch (error) {
      console.error('Error deleting trip:', error);
      alert(t.failedToDelete);
    } finally {
      setDeletingId(null);
    }
  };

  const handleUpdateTrip = async (tripId, updates) => {
    try {
      await updateTrip(tripId, updates);
      setEditingTrip(null);
      loadTrips();
    } catch (error) {
      console.error('Error updating trip:', error);
      alert(t.failedToUpdate);
    }
  };

  const handlePublishTrip = async (tripId) => {
    try {
      await publishTrip(tripId);
      loadTrips();
    } catch (error) {
      console.error('Error publishing trip:', error);
    }
  };

  // Get vehicle capacity from layout
  const getVehicleCapacity = (vehicleLayout) => {
    if (vehicleLayout === 'sprinter_15') return 14;
    if (vehicleLayout === 'bus_30') return 11;
    if (vehicleLayout === 'highlander_7') return 7;
    if (vehicleLayout?.startsWith('custom_')) {
      const capacity = parseInt(vehicleLayout.split('_')[1]);
      return isNaN(capacity) ? 0 : capacity;
    }
    return 0;
  };

  const draftTrips = allTrips.filter(t => t.status === 'draft');

  const getFilteredTrips = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Exclude drafts from the main list — they appear in the Pending Review section
    let filtered = allTrips.filter(t => t.status !== 'draft');

    // Apply date/time filter
    if (viewFilter === 'date') {
      // Filter by specific selected date - includes trips within date range
      filtered = allTrips.filter(trip => {
        const tripStartDate = trip.startDateTime?.toDate?.() || trip.date?.toDate?.() || new Date(trip.date);
        tripStartDate.setHours(0, 0, 0, 0);

        const tripEndDate = trip.endDateTime?.toDate?.() || trip.endDate?.toDate?.()
          ? new Date(trip.endDateTime?.toDate?.() || trip.endDate.toDate())
          : new Date(tripStartDate);
        tripEndDate.setHours(0, 0, 0, 0);

        const selected = new Date(selectedDate);
        selected.setHours(0, 0, 0, 0);

        // Check if selected date falls within the trip's date range (inclusive)
        return selected >= tripStartDate && selected <= tripEndDate;
      });
    } else if (viewFilter === 'upcoming') {
      filtered = allTrips.filter(trip => {
        const tripDate = trip.startDateTime?.toDate?.() || trip.date?.toDate?.() || new Date(trip.date);
        tripDate.setHours(0, 0, 0, 0);
        return tripDate >= today;
      });
    } else if (viewFilter === 'past') {
      filtered = allTrips.filter(trip => {
        const tripDate = trip.startDateTime?.toDate?.() || trip.date?.toDate?.() || new Date(trip.date);
        tripDate.setHours(0, 0, 0, 0);
        return tripDate < today;
      });
    }
    // 'all' filter - use all trips

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(trip => {
        // Default to 'planned' if status is not set
        const tripStatus = trip.status || 'planned';
        return tripStatus === statusFilter;
      });
    }

    return filtered;
  };

  const filteredTrips = getFilteredTrips();

  const getStatusColor = (status) => {
    // Default to 'planned' if status is not set
    const tripStatus = status || 'planned';
    switch (tripStatus) {
      case 'planned':
        return { bg: '#FEF3C7', text: '#92400E', label: 'Planned' };
      case 'scheduled':
        return { bg: '#E9D5FF', text: '#6B21A8', label: 'Scheduled' };
      case 'done':
        return { bg: '#D1FAE5', text: '#065F46', label: 'Done' };
      default:
        return { bg: '#FEF3C7', text: '#92400E', label: 'Planned' };
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header
        onOpenMigration={isAdmin ? () => setShowMigration(true) : undefined}
        onDownloadInvoices={isAdmin ? () => setShowBulkInvoices(true) : undefined}
        questionCount={isAdmin ? questionCount : 0}
        onOpenQuestions={isAdmin ? () => setShowQuestions(true) : undefined}
        onOpenUsers={isAdmin ? () => setShowUsersModal(true) : undefined}
      />

      {/* Tab bar */}
      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-1">
          {[
            { key: 'trips',   label: 'Trips',        icon: <Clock className="w-4 h-4" />,    adminOnly: true },
            { key: 'landing', label: 'Landing Page',  icon: <Layout className="w-4 h-4" />,  adminOnly: true },
            { key: 'blog',    label: 'Blog',          icon: <BookOpen className="w-4 h-4" />, adminOnly: false },
          ].filter(tab => !tab.adminOnly || isAdmin).map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === key
                  ? 'border-[#00BCD4] text-[#00BCD4]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {icon}{label}
            </button>
          ))}
        </div>
      </div>

      {/* Landing Page Tab */}
      {activeTab === 'landing' && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

          {/* Section Manager */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
              <Layout className="w-5 h-5" style={{ color: colors.primary.teal }} />
              Section Order &amp; Visibility
            </h3>
            <p className="text-sm text-gray-500 mb-1">Drag rows or use arrows to reorder sections on the public website. Toggle the switch to show or hide each section.</p>
            <p className="text-xs text-gray-400 mb-5">Order is saved automatically and takes effect immediately.</p>
            {settingsSaving && <p className="text-xs font-medium mb-3" style={{ color: colors.primary.teal }}>Saving…</p>}

            <div className="space-y-2">
              {sectionOrder.map((key, idx) => {
                const cfg = SECTION_CONFIG.find(c => c.key === key);
                if (!cfg) return null;
                const on = siteSettings[cfg.visKey] !== false;
                const isDragging = draggingSection === idx;
                const isOver = dragOverSection === idx;
                const isLocked = key === 'partners';
                return (
                  <div
                    key={key}
                    draggable={!isLocked}
                    onDragStart={isLocked ? undefined : e => handleSectionDragStart(e, idx)}
                    onDragOver={isLocked ? undefined : e => handleSectionDragOver(e, idx)}
                    onDrop={isLocked ? undefined : e => handleSectionDrop(e, idx)}
                    onDragEnd={isLocked ? undefined : handleSectionDragEnd}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all select-none ${
                      isDragging ? 'opacity-40' : ''
                    } ${
                      isOver && !isDragging
                        ? 'border-[#00BCD4] bg-[#f0faf8]'
                        : on ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50'
                    }`}
                  >
                    {/* Drag handle — hidden/locked for partners */}
                    {isLocked
                      ? <Lock className="w-4 h-4 text-gray-300 flex-shrink-0" title="Position locked on desktop" />
                      : <GripVertical className="w-5 h-5 text-gray-300 cursor-grab flex-shrink-0" />
                    }

                    {/* Icon + label */}
                    <span className="text-xl flex-shrink-0">{cfg.icon}</span>
                    <span className={`text-sm font-medium flex-1 ${on ? 'text-gray-800' : 'text-gray-400'}`}>
                      {cfg.label}
                    </span>

                    {/* Position badge */}
                    <span className="text-xs text-gray-300 font-mono flex-shrink-0">#{idx + 1}</span>

                    {/* Up / Down arrows — hidden for locked rows */}
                    {!isLocked && (
                      <div className="flex flex-col gap-0.5 flex-shrink-0">
                        <button
                          onClick={() => moveSectionInOrder(idx, -1)}
                          disabled={idx === 0}
                          className="p-0.5 text-gray-400 hover:text-gray-700 disabled:opacity-20 transition-colors"
                          title="Move up"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => moveSectionInOrder(idx, 1)}
                          disabled={idx === sectionOrder.length - 1}
                          className="p-0.5 text-gray-400 hover:text-gray-700 disabled:opacity-20 transition-colors"
                          title="Move down"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    {/* Visibility toggle */}
                    <button
                      onClick={() => handleToggleSectionVisibility(cfg)}
                      className="flex-shrink-0"
                      title={on ? 'Hide section' : 'Show section'}
                    >
                      {on
                        ? <ToggleRight className="w-8 h-8" style={{ color: colors.primary.teal }} />
                        : <ToggleLeft className="w-8 h-8 text-gray-300" />}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
   {/* Stats row */}
        {!loading && allTrips.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Total Trips', value: allTrips.filter(t => t.status !== 'draft').length, icon: '🗺️', sub: 'all time' },
              { label: 'Completed', value: allTrips.filter(t => t.status === 'done').length, icon: '✅', sub: 'trips done' },
              { label: 'Total Travelers', value: Object.values(registrationCounts).reduce((s, c) => s + c, 0), icon: '👥', sub: 'confirmed regs' },
              { label: 'Destinations', value: [...new Set(allTrips.filter(t => t.status !== 'draft').map(t => (t.title || '').toLowerCase().split(/\s+/)[0]))].length, icon: '📍', sub: 'unique routes' },
            ].map(({ label, value, icon, sub }) => (
              <div key={label} className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3 flex items-center gap-3">
                <span className="text-2xl flex-shrink-0">{icon}</span>
                <div className="min-w-0">
                  <p className="text-xl font-bold text-gray-900 leading-none">{value}</p>
                  <p className="text-xs font-medium text-gray-600 mt-0.5">{label}</p>
                  <p className="text-[10px] text-gray-400">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        )}

          {/* ── DESTINATIONS MANAGER ──────────────────────────────── */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">🗺️ Destinations</h3>
                <p className="text-sm text-gray-500 mt-0.5">Toggle built-in destinations and add custom ones.</p>
              </div>
              <button onClick={() => setDestForm({ title: '', description: '', image: '', duration: '', groupSize: '', highlights: '', durationCategory: 'day', country: 'ca' })}
                className="flex items-center gap-1.5 px-3 py-2 text-white text-sm font-semibold rounded-lg hover:opacity-90"
                style={{ backgroundColor: colors.primary.teal }}>
                <Plus className="w-4 h-4" /> Add New
              </button>
            </div>

            {/* Static destinations toggle */}
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Built-in</p>
            <div className="space-y-1.5 mb-4">
              {STATIC_DESTS.map(d => {
                const hidden = (siteSettings.hiddenDestinations || []).includes(d.key);
                return (
                  <div key={d.key} className="flex items-center justify-between px-3 py-2 rounded-lg border border-gray-100 bg-gray-50">
                    <span className="text-sm text-gray-700 font-medium">{d.label}</span>
                    <button onClick={() => handleToggleStaticDest(d.key)} title={hidden ? 'Show' : 'Hide'}>
                      {hidden ? <ToggleLeft className="w-7 h-7 text-gray-300" /> : <ToggleRight className="w-7 h-7" style={{ color: colors.primary.teal }} />}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Custom destinations */}
            {customDestsLoading ? <p className="text-sm text-gray-400">Loading…</p> : customDests.length > 0 && (
              <>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Custom</p>
                <div className="space-y-1.5 mb-4">
                  {customDests.map(d => (
                    <div key={d.id} className="flex items-center gap-3 px-3 py-2 rounded-lg border border-gray-100 bg-gray-50">
                      {d.image && <img src={d.image} alt="" className="w-10 h-10 rounded object-cover flex-shrink-0" />}
                      <span className="flex-1 text-sm font-medium text-gray-700 truncate">{d.title}</span>
                      <button onClick={() => setDestForm({ ...d, highlights: (d.highlights || []).join(', ') })} className="p-1 text-gray-400 hover:text-gray-600"><Edit className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleToggleCustomDest(d)} title={d.visible ? 'Hide' : 'Show'}>
                        {d.visible !== false ? <ToggleRight className="w-7 h-7" style={{ color: colors.primary.teal }} /> : <ToggleLeft className="w-7 h-7 text-gray-300" />}
                      </button>
                      <button onClick={() => handleDeleteCustomDest(d.id)} className="p-1 text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Add/Edit custom destination form */}
            {destForm !== null && (
              <div className="border-2 border-[#00BCD4] rounded-xl p-4 space-y-3 bg-[#f0faf8]">
                <p className="text-sm font-bold text-gray-800">{destForm.id ? 'Edit Destination' : 'New Destination'}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="col-span-2"><label className="block text-xs font-semibold text-gray-600 mb-1">Title *</label>
                    <input value={destForm.title} onChange={e => setDestForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Ottawa" className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-[#00BCD4] focus:outline-none bg-white" /></div>
                  <div className="col-span-2"><label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
                    <textarea rows={2} value={destForm.description} onChange={e => setDestForm(p => ({ ...p, description: e.target.value }))} placeholder="Short description…" className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-[#00BCD4] focus:outline-none resize-none bg-white" /></div>
                  <div className="col-span-2"><label className="block text-xs font-semibold text-gray-600 mb-1">Image URL</label>
                    <input value={destForm.image} onChange={e => setDestForm(p => ({ ...p, image: e.target.value }))} placeholder="https://…" className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-[#00BCD4] focus:outline-none bg-white" /></div>
                  <div><label className="block text-xs font-semibold text-gray-600 mb-1">Duration</label>
                    <input value={destForm.duration} onChange={e => setDestForm(p => ({ ...p, duration: e.target.value }))} placeholder="e.g. Full day" className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-[#00BCD4] focus:outline-none bg-white" /></div>
                  <div><label className="block text-xs font-semibold text-gray-600 mb-1">Group Size</label>
                    <input value={destForm.groupSize} onChange={e => setDestForm(p => ({ ...p, groupSize: e.target.value }))} placeholder="e.g. 8–15" className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-[#00BCD4] focus:outline-none bg-white" /></div>
                  <div className="col-span-2"><label className="block text-xs font-semibold text-gray-600 mb-1">Highlights (comma-separated)</label>
                    <input value={destForm.highlights} onChange={e => setDestForm(p => ({ ...p, highlights: e.target.value }))} placeholder="e.g. Parliament Hill, Rideau Canal" className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-[#00BCD4] focus:outline-none bg-white" /></div>
                  <div><label className="block text-xs font-semibold text-gray-600 mb-1">Trip Length</label>
                    <select value={destForm.durationCategory} onChange={e => setDestForm(p => ({ ...p, durationCategory: e.target.value }))} className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-[#00BCD4] focus:outline-none bg-white">
                      <option value="hours">A few hours</option><option value="day">Full day</option><option value="multi">Multi-day</option>
                    </select></div>
                  <div><label className="block text-xs font-semibold text-gray-600 mb-1">Country</label>
                    <select value={destForm.country} onChange={e => setDestForm(p => ({ ...p, country: e.target.value }))} className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-[#00BCD4] focus:outline-none bg-white">
                      <option value="ca">🇨🇦 Canada</option><option value="us">🇺🇸 USA</option><option value="other">🌍 Other</option>
                    </select></div>
                </div>
                <div className="flex gap-2 pt-1">
                  <button onClick={() => setDestForm(null)} className="flex-1 py-2 border-2 border-gray-200 rounded-lg text-sm text-gray-600 font-semibold hover:bg-gray-50">Cancel</button>
                  <button onClick={() => handleSaveCustomDest(destForm)} disabled={!destForm.title.trim()} className="flex-1 py-2 text-white rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-40" style={{ backgroundColor: colors.primary.teal }}>Save</button>
                </div>
              </div>
            )}
          </div>

          {/* ── PARTNERS MANAGER ──────────────────────────────────── */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">🤝 Who We Work With</h3>
                <p className="text-sm text-gray-500 mt-0.5">Partner logos shown on the landing page.</p>
              </div>
              <button onClick={() => setPartnerForm({ name: '', logoUrl: '', website: '' })}
                className="flex items-center gap-1.5 px-3 py-2 text-white text-sm font-semibold rounded-lg hover:opacity-90"
                style={{ backgroundColor: colors.primary.teal }}>
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>
            {partnersLoading ? <p className="text-sm text-gray-400">Loading…</p> : partners.length === 0 && partnerForm === null ? (
              <p className="text-sm text-gray-400 text-center py-4">No partners yet.</p>
            ) : (
              <div className="space-y-2 mb-3">
                {partners.map(p => (
                  <div key={p.id} className="flex items-center gap-3 px-3 py-2 rounded-xl border border-gray-100 bg-gray-50">
                    {p.logoUrl ? <img src={p.logoUrl} alt={p.name} className="h-8 w-16 object-contain flex-shrink-0" /> : <span className="text-xs text-gray-400 w-16 flex-shrink-0">No logo</span>}
                    <span className="flex-1 text-sm font-medium text-gray-700 truncate">{p.name}</span>
                    <button onClick={() => setPartnerForm({ ...p })} className="p-1 text-gray-400 hover:text-gray-600"><Edit className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleTogglePartner(p)} title={p.visible ? 'Hide' : 'Show'}>
                      {p.visible !== false ? <ToggleRight className="w-7 h-7" style={{ color: colors.primary.teal }} /> : <ToggleLeft className="w-7 h-7 text-gray-300" />}
                    </button>
                    <button onClick={() => handleDeletePartner(p.id)} className="p-1 text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
              </div>
            )}
            {partnerForm !== null && (
              <div className="border-2 border-[#00BCD4] rounded-xl p-4 space-y-3 bg-[#f0faf8]">
                <p className="text-sm font-bold text-gray-800">{partnerForm.id ? 'Edit Partner' : 'Add Partner'}</p>
                <div><label className="block text-xs font-semibold text-gray-600 mb-1">Partner Name *</label>
                  <input value={partnerForm.name} onChange={e => setPartnerForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Fox Rent A Car" className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-[#00BCD4] focus:outline-none bg-white" /></div>
                <div><label className="block text-xs font-semibold text-gray-600 mb-1">Logo URL</label>
                  <input value={partnerForm.logoUrl} onChange={e => setPartnerForm(p => ({ ...p, logoUrl: e.target.value }))} placeholder="https://…" className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-[#00BCD4] focus:outline-none bg-white" />
                  {partnerForm.logoUrl && <img src={partnerForm.logoUrl} alt="" className="mt-2 h-10 object-contain" />}</div>
                <div><label className="block text-xs font-semibold text-gray-600 mb-1">Website (optional)</label>
                  <input value={partnerForm.website} onChange={e => setPartnerForm(p => ({ ...p, website: e.target.value }))} placeholder="https://…" className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-[#00BCD4] focus:outline-none bg-white" /></div>
                <div className="flex gap-2 pt-1">
                  <button onClick={() => setPartnerForm(null)} className="flex-1 py-2 border-2 border-gray-200 rounded-lg text-sm text-gray-600 font-semibold hover:bg-gray-50">Cancel</button>
                  <button onClick={() => handleSavePartner(partnerForm)} disabled={!partnerForm.name.trim()} className="flex-1 py-2 text-white rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-40" style={{ backgroundColor: colors.primary.teal }}>Save</button>
                </div>
              </div>
            )}
          </div>

          {/* ── STAFF MANAGER ─────────────────────────────────────── */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">👤 Our Staff</h3>
                <p className="text-sm text-gray-500 mt-0.5">Staff profiles shown on the landing page.</p>
              </div>
              <button onClick={() => setDriverForm({ name: '', photoUrl: '', since: '', languages: '', bio: '' })}
                className="flex items-center gap-1.5 px-3 py-2 text-white text-sm font-semibold rounded-lg hover:opacity-90"
                style={{ backgroundColor: colors.primary.teal }}>
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>
            {driversLoading ? <p className="text-sm text-gray-400">Loading…</p> : drivers.length === 0 && driverForm === null ? (
              <p className="text-sm text-gray-400 text-center py-4">No staff yet.</p>
            ) : (
              <div className="space-y-2 mb-3">
                {drivers.map(d => (
                  <div key={d.id} className="flex items-center gap-3 px-3 py-2 rounded-xl border border-gray-100 bg-gray-50">
                    {d.photoUrl ? <img src={d.photoUrl} alt={d.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" /> : <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-lg flex-shrink-0">👤</div>}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{d.name}</p>
                      {d.since && <p className="text-xs text-gray-400">Since {d.since}</p>}
                    </div>
                    <button onClick={() => setDriverForm({ ...d })} className="p-1 text-gray-400 hover:text-gray-600"><Edit className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleToggleDriver(d)} title={d.visible ? 'Hide' : 'Show'}>
                      {d.visible !== false ? <ToggleRight className="w-7 h-7" style={{ color: colors.primary.teal }} /> : <ToggleLeft className="w-7 h-7 text-gray-300" />}
                    </button>
                    <button onClick={() => handleDeleteDriver(d.id)} className="p-1 text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
              </div>
            )}
            {driverForm !== null && (
              <div className="border-2 border-[#00BCD4] rounded-xl p-4 space-y-3 bg-[#f0faf8]">
                <p className="text-sm font-bold text-gray-800">{driverForm.id ? 'Edit Staff Member' : 'Add Staff Member'}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div><label className="block text-xs font-semibold text-gray-600 mb-1">Full Name *</label>
                    <input value={driverForm.name} onChange={e => setDriverForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. David Levi" className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-[#00BCD4] focus:outline-none bg-white" /></div>
                  <div><label className="block text-xs font-semibold text-gray-600 mb-1">With Us Since</label>
                    <input value={driverForm.since} onChange={e => setDriverForm(p => ({ ...p, since: e.target.value }))} placeholder="e.g. 2019" className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-[#00BCD4] focus:outline-none bg-white" /></div>
                  <div className="col-span-2"><label className="block text-xs font-semibold text-gray-600 mb-1">Photo URL</label>
                    <input value={driverForm.photoUrl} onChange={e => setDriverForm(p => ({ ...p, photoUrl: e.target.value }))} placeholder="https://…" className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-[#00BCD4] focus:outline-none bg-white" />
                    {driverForm.photoUrl && <img src={driverForm.photoUrl} alt="" className="mt-2 w-16 h-16 rounded-full object-cover" />}</div>
                  <div><label className="block text-xs font-semibold text-gray-600 mb-1">Languages</label>
                    <input value={driverForm.languages} onChange={e => setDriverForm(p => ({ ...p, languages: e.target.value }))} placeholder="e.g. Hebrew, English" className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-[#00BCD4] focus:outline-none bg-white" /></div>
                  <div className="col-span-2"><label className="block text-xs font-semibold text-gray-600 mb-1">Short Bio</label>
                    <textarea rows={2} value={driverForm.bio} onChange={e => setDriverForm(p => ({ ...p, bio: e.target.value }))} placeholder="A few words about the team member…" className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-[#00BCD4] focus:outline-none resize-none bg-white" /></div>
                </div>
                <div className="flex gap-2 pt-1">
                  <button onClick={() => setDriverForm(null)} className="flex-1 py-2 border-2 border-gray-200 rounded-lg text-sm text-gray-600 font-semibold hover:bg-gray-50">Cancel</button>
                  <button onClick={() => handleSaveDriver(driverForm)} disabled={!driverForm.name.trim()} className="flex-1 py-2 text-white rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-40" style={{ backgroundColor: colors.primary.teal }}>Save</button>
                </div>
              </div>
            )}
          </div>

          {/* Testimonials Editor */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="mb-5">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <span>✍️</span> Testimonials
              </h3>
              <p className="text-sm text-gray-500 mt-0.5">
                Edit the quote cards shown in the "Letters from the road" section. Leave all fields blank to use the default quotes.
              </p>
            </div>
            <div className="space-y-4">
              {customTestimonials.map((t, idx) => (
                <div key={idx} className="p-4 rounded-xl border-2 border-gray-100 bg-gray-50 space-y-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Quote {idx + 1}</p>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Quote text</label>
                    <textarea
                      rows={2}
                      value={t.text}
                      onChange={e => setCustomTestimonials(prev => prev.map((item, i) => i === idx ? { ...item, text: e.target.value } : item))}
                      placeholder="The quote text that appears on the card…"
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-[#00BCD4] focus:outline-none text-sm resize-none bg-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Author name</label>
                      <input
                        type="text"
                        value={t.author}
                        onChange={e => setCustomTestimonials(prev => prev.map((item, i) => i === idx ? { ...item, author: e.target.value } : item))}
                        placeholder="e.g. Dana & Yoav K."
                        className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-[#00BCD4] focus:outline-none text-sm bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Trip &amp; year</label>
                      <input
                        type="text"
                        value={t.trip}
                        onChange={e => setCustomTestimonials(prev => prev.map((item, i) => i === idx ? { ...item, trip: e.target.value } : item))}
                        placeholder="e.g. Canadian Rockies, 2025"
                        className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-[#00BCD4] focus:outline-none text-sm bg-white"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between mt-4">
              <button
                onClick={() => setCustomTestimonials(prev => [...prev, { text: '', author: '', trip: '' }])}
                className="text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                + Add quote
              </button>
              <button
                onClick={handleSaveTestimonials}
                disabled={testimonialsSaving}
                className="px-4 py-2 text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                style={{ backgroundColor: colors.primary.teal }}
              >
                {testimonialsSaving ? 'Saving…' : 'Save Testimonials'}
              </button>
            </div>
          </div>

          {/* Feedback Showcase Picker */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5" style={{ color: colors.primary.teal }} />
                Feedback Showcase
              </h3>
              <p className="text-sm text-gray-500 mt-0.5">
                Toggle which participant reviews appear in the "What Our Travelers Say" section on the landing page.
              </p>
            </div>

            {feedbacksLoading ? (
              <div className="text-center py-8 text-gray-400 text-sm">Loading feedbacks…</div>
            ) : allFeedbacks.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No feedback responses yet.</p>
            ) : (
              <div className="space-y-2 max-h-[480px] overflow-y-auto">
                {[...allFeedbacks]
                  .sort((a, b) => (b.submittedAt?.seconds || 0) - (a.submittedAt?.seconds || 0))
                  .map(fb => {
                    const shown = !!fb.showOnWebsite;
                    const stars = fb.ratings?.overall || 0;
                    return (
                      <div
                        key={fb.id}
                        className={`flex items-start gap-3 p-3 rounded-xl border-2 transition-colors ${shown ? 'border-[#00BCD4] bg-[#f0faf8]' : 'border-gray-100 bg-white hover:bg-gray-50'}`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold text-gray-900">{fb.firstName} {fb.lastName}</p>
                            <span className="text-xs text-amber-500">{'★'.repeat(stars)}{'☆'.repeat(5 - stars)}</span>
                            {fb.submittedAt && (
                              <span className="text-xs text-gray-400">
                                {fb.submittedAt.toDate?.().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                              </span>
                            )}
                          </div>
                          {fb.comment && (
                            <p className="text-xs text-gray-500 mt-1 italic line-clamp-2">"{fb.comment}"</p>
                          )}
                          {fb.wouldRecommend === 'yes' && (
                            <span className="inline-block mt-1 text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">Would recommend</span>
                          )}
                        </div>
                        <button
                          onClick={() => handleToggleFeedbackShow(fb)}
                          disabled={togglingFeedback === fb.id}
                          className="flex-shrink-0 mt-0.5"
                          title={shown ? 'Hide from website' : 'Show on website'}
                        >
                          {shown
                            ? <ToggleRight className="w-8 h-8" style={{ color: colors.primary.teal }} />
                            : <ToggleLeft className="w-8 h-8 text-gray-300" />}
                        </button>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Blog Tab */}
      {activeTab === 'blog' && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

          {/* Blog Posts */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <BookOpen className="w-5 h-5" style={{ color: colors.primary.teal }} />
                  Blog Posts
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">Create and manage blog posts visible on the website.</p>
              </div>
              <button
                onClick={() => { setEditingBlogPost(null); setShowBlogModal(true); }}
                className="flex items-center gap-2 px-4 py-2 text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
                style={{ backgroundColor: colors.primary.teal }}
              >
                <Plus className="w-4 h-4" />
                New Post
              </button>
            </div>

            {blogLoading ? (
              <div className="text-center py-10 text-gray-400 text-sm">Loading posts…</div>
            ) : blogPosts.length === 0 ? (
              <div className="text-center py-10">
                <BookOpen className="w-10 h-10 mx-auto mb-3 text-gray-200" />
                <p className="text-gray-400 text-sm">No blog posts yet. Create your first one!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {blogPosts.map(post => (
                  <div
                    key={post.id}
                    className={`flex items-start gap-4 p-4 rounded-xl border-2 transition-colors ${post.published ? 'border-[#00BCD4] bg-[#f0faf8]' : 'border-gray-100 bg-white'}`}
                  >
                    {post.images?.[0] && (
                      <img
                        src={post.images[0]}
                        alt=""
                        className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-gray-900 truncate">{post.title}</p>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${post.published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                        >
                          {post.published ? 'Published' : 'Draft'}
                        </span>
                      </div>
                      {post.excerpt && (
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{post.excerpt}</p>
                      )}
                      {post.publishedAt && (
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          {post.publishedAt.toDate?.().toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      )}
                      {copiedBlogId === post.id && (
                        <p className="text-[11px] text-green-600 mt-1 font-mono break-all">
                          ✓ Copied: {window.location.origin}/blog/{post.id}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => handleToggleBlogPublish(post)}
                        disabled={togglingPost === post.id}
                        title={post.published ? 'Unpublish' : 'Publish'}
                        className="flex-shrink-0"
                      >
                        {post.published
                          ? <ToggleRight className="w-8 h-8" style={{ color: colors.primary.teal }} />
                          : <ToggleLeft className="w-8 h-8 text-gray-300" />}
                      </button>
                      <button
                        onClick={() => handleCopyBlogLink(post.id)}
                        className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Copy shareable link"
                      >
                        {copiedBlogId === post.id ? <Check className="w-4 h-4 text-green-500" /> : <Share2 className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => setPreviewBlogPost(post)}
                        className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Preview"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => { setEditingBlogPost(post); setShowBlogModal(true); }}
                        className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteBlogPost(post.id)}
                        disabled={deletingBlogId === post.id}
                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending Comments */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <MessageCircle className="w-5 h-5" style={{ color: colors.primary.teal }} />
                Pending Comments
                {pendingComments.length > 0 && (
                  <span className="ml-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {pendingComments.length}
                  </span>
                )}
              </h3>
              <p className="text-sm text-gray-500 mt-0.5">Review and approve or reject visitor comments.</p>
            </div>

            {commentsLoading ? (
              <div className="text-center py-8 text-gray-400 text-sm">Loading comments…</div>
            ) : pendingComments.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No pending comments — you're all caught up!</p>
            ) : (
              <div className="space-y-3">
                {pendingComments.map(c => {
                  const matchingPost = blogPosts.find(p => p.id === c.postId);
                  return (
                    <div key={c.id} className="flex items-start gap-3 p-4 rounded-xl border border-gray-100 bg-gray-50">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-sm font-semibold text-gray-900">{c.authorName}</span>
                          <span className="text-xs text-gray-400">{c.authorEmail}</span>
                          {c.createdAt && (
                            <span className="text-xs text-gray-400">
                              {c.createdAt.toDate?.().toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })}
                            </span>
                          )}
                        </div>
                        {matchingPost && (
                          <p className="text-[11px] text-gray-400 mb-1">On: <span className="font-medium">{matchingPost.title}</span></p>
                        )}
                        <p className="text-sm text-gray-700 leading-relaxed">{c.content}</p>
                        {c.reply && (
                          <div className="mt-2 pl-3 border-l-2 border-[#00BCD4]">
                            <p className="text-[11px] font-bold text-[#00BCD4] mb-0.5">Your reply</p>
                            <p className="text-xs text-gray-600">{c.reply}</p>
                          </div>
                        )}
                        {replyingTo === c.id && (
                          <div className="mt-3 flex gap-2 items-start">
                            <CornerDownRight className="w-4 h-4 text-gray-400 mt-2 flex-shrink-0" />
                            <textarea
                              rows={2}
                              autoFocus
                              value={replyText}
                              onChange={e => setReplyText(e.target.value)}
                              placeholder="Write your reply…"
                              className="flex-1 px-3 py-2 text-xs border-2 border-[#00BCD4] rounded-lg focus:outline-none resize-none"
                            />
                            <div className="flex flex-col gap-1 flex-shrink-0">
                              <button
                                onClick={() => handleSubmitReply(c.id)}
                                disabled={!replyText.trim()}
                                className="px-2.5 py-1.5 text-white rounded-lg text-xs font-semibold disabled:opacity-40 transition-opacity"
                                style={{ backgroundColor: colors.primary.teal }}
                              >
                                <Send className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => { setReplyingTo(null); setReplyText(''); }}
                                className="px-2.5 py-1.5 bg-gray-100 text-gray-500 rounded-lg text-xs hover:bg-gray-200 transition-colors"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-1.5 flex-shrink-0">
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => handleApproveComment(c.id)}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-semibold hover:bg-green-200 transition-colors"
                            title="Approve"
                          >
                            <CheckCheck className="w-3.5 h-3.5" />
                            Approve
                          </button>
                          <button
                            onClick={() => handleDeleteComment(c.id)}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-red-100 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-200 transition-colors"
                            title="Reject"
                          >
                            <X className="w-3.5 h-3.5" />
                            Reject
                          </button>
                        </div>
                        <button
                          onClick={() => { setReplyingTo(replyingTo === c.id ? null : c.id); setReplyText(c.reply || ''); }}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold hover:bg-blue-100 transition-colors"
                          title="Reply"
                        >
                          <CornerDownRight className="w-3.5 h-3.5" />
                          {c.reply ? 'Edit reply' : 'Reply'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Content (Trips tab) */}
      {activeTab === 'trips' && <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">




      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Side - Trip List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div className="flex-1">
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-500 mb-1">
                    {adminData?.displayName
                      ? <TypewriterGreeting name={adminData.displayName} />
                      : new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                    }
                  </div>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
                    {viewFilter === 'date' ? `${t.tripsOn || 'Trips on'} ${selectedDate.toLocaleDateString()}` :
                     viewFilter === 'all' ? t.allTrips :
                     viewFilter === 'upcoming' ? t.currentTrips :
                     t.oldTrips}
                  </h2>
                </div>
                {/* View segmented control + New button on the same row */}
                <div id="tour-view-filters" className="flex items-center gap-2 mt-3">
                  <div className="flex flex-1 bg-gray-200 rounded-lg p-0.5">
                  {[
                    { key: 'all', label: t.allTrips || 'All' },
                    { key: 'upcoming', label: t.currentTrips || 'Upcoming' },
                    { key: 'past', label: t.oldTrips || 'Past' },
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setViewFilter(key)}
                      className={`flex-1 px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                        viewFilter === key
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                  </div>
                  <button
                    id="tour-create-trip"
                    onClick={() => setShowCreateModal(true)}
                    style={{ backgroundColor: colors.primary.teal }}
                    className="flex items-center gap-1.5 px-3 py-2 text-white rounded-lg hover:opacity-90 transition-opacity text-sm whitespace-nowrap flex-shrink-0"
                    title={t.createNewTrip}
                  >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">{t.createTrip}</span>
                    <span className="sm:hidden">New</span>
                  </button>
                </div>

                {/* Status filter pills */}
                <div id="tour-status-filters" className="flex gap-1.5 mt-2 flex-wrap">
                  {[
                    { key: 'all',       label: 'All',       dot: colors.primary.teal, activeBg: colors.primary.teal, inactiveBg: '#E6F7F8', inactiveText: colors.primary.teal },
                    { key: 'planned',   label: 'Planned',   dot: '#F59E0B',            activeBg: '#92400E',           inactiveBg: '#FEF3C7', inactiveText: '#92400E' },
                    { key: 'scheduled', label: 'Scheduled', dot: '#7C3AED',            activeBg: '#6B21A8',           inactiveBg: '#E9D5FF', inactiveText: '#6B21A8' },
                    { key: 'done',      label: 'Done',      dot: '#10B981',            activeBg: '#065F46',           inactiveBg: '#D1FAE5', inactiveText: '#065F46' },
                  ].map(({ key, label, dot, activeBg, inactiveBg, inactiveText }) => (
                    <button
                      key={key}
                      onClick={() => setStatusFilter(key)}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all whitespace-nowrap"
                      style={statusFilter === key
                        ? { backgroundColor: activeBg, color: 'white' }
                        : { backgroundColor: inactiveBg, color: inactiveText }
                      }
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: statusFilter === key ? 'rgba(255,255,255,0.7)' : dot }}
                      />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Draft trips — created via WhatsApp bot, pending admin review */}
            {draftTrips.length > 0 && (
              <div className="mb-2">
                <h2 className="flex items-center gap-2 text-sm font-bold text-amber-700 mb-2">
                  <Clock className="w-4 h-4" /> Pending Review ({draftTrips.length})
                </h2>
                <div className="space-y-2">
                  {draftTrips.map(trip => {
                    const tripDate = trip.startDateTime?.toDate?.() || (trip.date ? new Date(trip.date) : null);
                    return (
                      <div key={trip.id} className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <div className="flex justify-between items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-sm font-semibold text-gray-900">{trip.title || 'Untitled Trip'}</h3>
                              {trip.source === 'whatsapp' && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-100 text-green-700">📢 WhatsApp</span>
                              )}
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-200 text-amber-800">Draft</span>
                            </div>
                            <p className="text-xs text-gray-600 mt-0.5">
                              {tripDate ? tripDate.toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' }) : 'No date'}
                              {trip.price ? ` · C$${trip.price}` : ''}
                              {trip.deposit ? ` (deposit C$${trip.deposit})` : ''}
                              {trip.childPrice ? ` · Children C$${trip.childPrice}` : ''}
                            </p>
                            {trip.websiteDescription && (
                              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{trip.websiteDescription}</p>
                            )}
                          </div>
                          <div className="flex gap-1.5 flex-shrink-0" onClick={e => e.stopPropagation()}>
                            <button
                              onClick={() => setEditingTrip(trip)}
                              className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-white rounded-lg hover:opacity-90 transition-opacity"
                              style={{ backgroundColor: colors.primary.teal }}
                              title="Edit draft"
                            >
                              <Edit className="w-3 h-3" />
                              <span className="hidden sm:inline">Edit</span>
                            </button>
                            <button
                              onClick={() => handlePublishTrip(trip.id)}
                              className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-white rounded-lg hover:opacity-90 transition-opacity bg-green-600"
                              title="Publish trip"
                            >
                              <Send className="w-3 h-3" />
                              <span className="hidden sm:inline">Publish</span>
                            </button>
                            <button
                              onClick={() => handleDeleteTrip(trip.id)}
                              disabled={deletingId === trip.id}
                              className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                              style={{ backgroundColor: colors.button.danger }}
                              title="Delete draft"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {loading ? (
              <div className="text-center py-12">
                <div className="text-gray-500">{t.loadingTrips}</div>
              </div>
            ) : filteredTrips.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <p className="text-gray-500">
                  {viewFilter === 'upcoming' && t.noUpcomingTrips}
                  {viewFilter === 'past' && t.noPastTrips}
                  {viewFilter === 'all' && 'No trips found'}
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
                >
                  {t.createFirstTrip}
                </button>
              </div>
            ) : (
              <div id="tour-trip-list" className="space-y-3">
                {filteredTrips.map((trip) => (
                  <div
                    key={trip.id}
                    onClick={() => setViewingTripId(trip.id)}
                    className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm sm:text-lg font-semibold text-gray-900">
                            {trip.title}
                          </h3>
                          <span
                            className="px-2 py-1 rounded-full text-[10px] sm:text-xs font-semibold"
                            style={{
                              backgroundColor: getStatusColor(trip.status).bg,
                              color: getStatusColor(trip.status).text
                            }}
                          >
                            {getStatusColor(trip.status).label}
                          </span>
                          {pendingCounts[trip.id] > 0 && (
                            <span className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] sm:text-xs font-semibold bg-yellow-100 text-yellow-800">
                              <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse inline-block" />
                              {pendingCounts[trip.id]} Pending
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] sm:text-sm text-gray-600 mt-1">
                          {(() => {
                            const startDate = trip.startDateTime?.toDate?.() || trip.date?.toDate?.() || new Date(trip.date);
                            const endDate = trip.endDateTime?.toDate?.() || trip.endDate?.toDate?.();
                            const dateStr = endDate && endDate.getTime() !== startDate.getTime()
                              ? `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`
                              : startDate.toLocaleDateString();
                            const timeStr = trip.startDateTime?.toDate?.().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) || '';

                            // Get vehicle name without seat count
                            let vehicleName = '';
                            if (trip.vehicleLayout === 'sprinter_15') {
                              vehicleName = 'Mercedes Sprinter Black';
                            } else if (trip.vehicleLayout === 'bus_30') {
                              vehicleName = 'Mercedes Sprinter White';
                            } else if (trip.vehicleLayout === 'highlander_7') {
                              vehicleName = 'Toyota Highlander';
                            } else {
                              vehicleName = trip.vehicleLayout;
                            }

                            // Get registration count and capacity
                            const registeredCount = registrationCounts[trip.id] || 0;
                            const capacity = getVehicleCapacity(trip.vehicleLayout);

                            return `${dateStr}${timeStr ? ` at ${timeStr}` : ''} - ${vehicleName} (${registeredCount}/${capacity} Seats)`;
                          })()}
                        </p>
                        {trip.driverName && (
                          <p className="text-[10px] sm:text-sm mt-1" style={{ color: '#00BCD4' }}>
                            {t.driver}: {trip.driverName}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col gap-1.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                        {/* Row 1: WhatsApp (optional) + Copy */}
                        <div className="flex gap-1.5">
                          {trip.whatsappGroupLink && (
                            <a
                              href={trip.whatsappGroupLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ backgroundColor: '#25D366' }}
                              className="flex items-center justify-center gap-1.5 px-3 py-2 text-white rounded-lg hover:opacity-90 transition-opacity text-sm min-w-[40px]"
                              title={t.joinWhatsappGroup}
                            >
                              <MessageCircle className="w-4 h-4" />
                              <span className="hidden sm:inline text-xs font-medium">{t.whatsapp}</span>
                            </a>
                          )}
                          <button
                            onClick={() => handleCopyLink(trip.id)}
                            className="flex items-center justify-center gap-1.5 px-3 py-2 text-white rounded-lg hover:opacity-90 transition-opacity text-sm min-w-[40px]"
                            style={{ backgroundColor: copiedId === trip.id ? colors.success : colors.primary.teal }}
                            title={copiedId === trip.id ? t.linkCopied : t.shareTripLink}
                          >
                            {copiedId === trip.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            <span className="hidden sm:inline text-xs font-medium">{copiedId === trip.id ? t.copied : t.share}</span>
                          </button>
                        </div>
                        {/* Row 2: Edit + Delete */}
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => setEditingTrip(trip)}
                            style={{ backgroundColor: colors.primary.teal }}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-white rounded-lg hover:opacity-90 transition-opacity text-sm"
                            title={t.editTrip}
                          >
                            <Edit className="w-4 h-4" />
                            <span className="hidden sm:inline text-xs font-medium">{t.edit}</span>
                          </button>
                          <button
                            onClick={() => handleDeleteTrip(trip.id)}
                            disabled={deletingId === trip.id}
                            style={{ backgroundColor: colors.button.danger }}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-white rounded-lg hover:opacity-90 transition-opacity text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            title={t.deleteTrip}
                          >
                            <Trash2 className="w-4 h-4" />
                            <span className="hidden sm:inline text-xs font-medium">{deletingId === trip.id ? t.deleting : t.delete}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Side - Calendar & Weather */}
          <div className="lg:col-span-1">
            <div className="space-y-4 sticky top-4">
              {/* Calendar */}
              <div id="tour-calendar" className="bg-white rounded-lg shadow p-4">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  {t.calendar}
                </h2>
                <Calendar
                  onChange={(date) => {
                    setSelectedDate(date);
                    setViewFilter('date');
                  }}
                  value={selectedDate}
                  className="border-0 w-full"
                  tileClassName={({ date, view }) => {
                    if (view === 'month') {
                      // Normalize the calendar date for comparison
                      const checkDate = new Date(date);
                      checkDate.setHours(0, 0, 0, 0);

                      // Find the first trip that includes this date (in order of the trips array)
                      const tripOnDate = allTrips.find(trip => {
                        const tripStartDate = trip.startDateTime?.toDate?.() || trip.date?.toDate?.() || new Date(trip.date);
                        tripStartDate.setHours(0, 0, 0, 0);

                        const tripEndDate = trip.endDateTime?.toDate?.() || trip.endDate?.toDate?.()
                          ? new Date(trip.endDateTime?.toDate?.() || trip.endDate.toDate())
                          : new Date(tripStartDate);
                        tripEndDate.setHours(0, 0, 0, 0);

                        // Check if checkDate falls within the trip's date range (inclusive)
                        return checkDate >= tripStartDate && checkDate <= tripEndDate;
                      });

                      if (tripOnDate) {
                        // Show the exact status color of this trip
                        const status = tripOnDate.status || 'planned';

                        if (status === 'done') {
                          return 'has-trip-done';
                        } else if (status === 'scheduled') {
                          return 'has-trip-scheduled';
                        } else if (status === 'planned') {
                          return 'has-trip-planned';
                        }
                      }
                    }
                    return null;
                  }}
                />
                <style>{`
                  /* Planned trips - Yellow/Orange */
                  .has-trip-planned {
                    background-color: #FEF3C7 !important;
                    color: #92400E !important;
                    font-weight: 600;
                  }
                  .has-trip-planned:hover {
                    background-color: #FDE68A !important;
                  }

                  /* Scheduled trips - Purple */
                  .has-trip-scheduled {
                    background-color: #E9D5FF !important;
                    color: #6B21A8 !important;
                    font-weight: 700;
                  }
                  .has-trip-scheduled:hover {
                    background-color: #DDD6FE !important;
                  }

                  /* Done trips - Green */
                  .has-trip-done {
                    background-color: #D1FAE5 !important;
                    color: #065F46 !important;
                    font-weight: 800;
                  }
                  .has-trip-done:hover {
                    background-color: #A7F3D0 !important;
                  }
                `}</style>
              </div>
            </div>
          </div>
        </div>
      </div>}

      {/* Create Trip Modal */}
      {showCreateModal && (
        <CreateTripModal
          selectedDate={selectedDate}
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateTrip}
        />
      )}

      {/* Edit Trip Modal */}
      {editingTrip && (
        <EditTripModal
          trip={editingTrip}
          onClose={() => setEditingTrip(null)}
          onUpdate={handleUpdateTrip}
        />
      )}

      {/* Trip View Modal */}
      {viewingTripId && (
        <TripViewModal
          tripId={viewingTripId}
          onClose={() => setViewingTripId(null)}
        />
      )}

      {/* Bulk Invoices Modal */}
      {showBulkInvoices && (
        <BulkInvoicesModal
          trips={allTrips}
          onClose={() => setShowBulkInvoices(false)}
        />
      )}

      {/* Migration Modal */}
      {showMigration && (
        <MigrationModal onClose={() => setShowMigration(false)} />
      )}

      {/* Questions Modal */}
      {showQuestions && (
        <QuestionsModal
          onClose={() => setShowQuestions(false)}
          onCountChange={(delta) => setQuestionCount(prev => Math.max(0, prev + delta))}
        />
      )}

      {/* Blog Post Create/Edit Modal */}
      {showBlogModal && (
        <BlogAdminModal
          post={editingBlogPost}
          authorName={adminData?.displayName || ''}
          onSave={handleSaveBlogPost}
          onClose={() => { setShowBlogModal(false); setEditingBlogPost(null); }}
        />
      )}

      {/* Blog Post Preview Modal */}
      {previewBlogPost && (
        <BlogPostModal
          post={previewBlogPost}
          previewMode={true}
          onClose={() => setPreviewBlogPost(null)}
        />
      )}

      {/* Users Modal */}
      {showUsersModal && <UsersModal onClose={() => setShowUsersModal(false)} />}
    </div>
  );
};

export default AdminDashboard;
