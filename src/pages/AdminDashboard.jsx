import { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { Plus, Copy, Check, Trash2, Edit, MessageCircle, FileText } from 'lucide-react';
import { getAllTrips, createTrip, deleteTrip, updateTrip } from '../utils/firestoreUtils';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import CreateTripModal from '../components/CreateTripModal';
import BulkInvoicesModal from '../components/BulkInvoicesModal';
import MigrationModal from '../components/MigrationModal';
import EditTripModal from '../components/EditTripModal';
import TripViewModal from '../components/TripViewModal';
import Header from '../components/Header';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../utils/translations';
import colors from '../utils/colors';
import { hasSeenTour, startTour } from '../utils/tour';

const AdminDashboard = () => {
  const { language } = useLanguage();
  const t = translations[language];
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

  useEffect(() => {
    loadTrips();
  }, [selectedDate, viewFilter]);

  useEffect(() => {
    if (!hasSeenTour()) {
      const timer = setTimeout(() => startTour(t), 800);
      return () => clearTimeout(timer);
    }
  }, []);

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

  const getFilteredTrips = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let filtered = allTrips;

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
      <Header onOpenMigration={() => setShowMigration(true)} />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Side - Trip List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div className="flex-1">
                <div className="flex justify-between items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-gray-500 mb-1">
                      {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
                      {viewFilter === 'date' ? `${t.tripsOn || 'Trips on'} ${selectedDate.toLocaleDateString()}` :
                       viewFilter === 'all' ? t.allTrips :
                       viewFilter === 'upcoming' ? t.currentTrips :
                       t.oldTrips}
                    </h2>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => setShowBulkInvoices(true)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg border-2 text-sm font-semibold hover:bg-teal-50 transition-colors whitespace-nowrap"
                      style={{ borderColor: colors.primary.teal, color: colors.primary.teal }}
                      title="Download all invoices"
                    >
                      <FileText className="w-4 h-4" />
                      <span className="hidden sm:inline">Invoices</span>
                    </button>
                    <button
                      id="tour-create-trip"
                      onClick={() => setShowCreateModal(true)}
                      style={{ backgroundColor: colors.primary.teal }}
                      className="flex items-center gap-1.5 px-3 py-2 text-white rounded-lg hover:opacity-90 transition-opacity text-sm whitespace-nowrap"
                      title={t.createNewTrip}
                    >
                      <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="hidden sm:inline">{t.createTrip}</span>
                      <span className="sm:hidden">New</span>
                    </button>
                  </div>
                </div>
                {/* View segmented control */}
                <div id="tour-view-filters" className="flex mt-3 bg-gray-200 rounded-lg p-0.5">
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
      </div>

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
    </div>
  );
};

export default AdminDashboard;
