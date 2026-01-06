import { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { Plus, Copy, Check, ExternalLink, Trash2, Calendar as CalendarIcon, Archive, Edit, MessageCircle, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { getAllTrips, getTripsByDate, createTrip, deleteTrip, updateTrip } from '../utils/firestoreUtils';
import CreateTripModal from '../components/CreateTripModal';
import EditTripModal from '../components/EditTripModal';
import TripViewModal from '../components/TripViewModal';
import Header from '../components/Header';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../utils/translations';
import colors from '../utils/colors';

const AdminDashboard = () => {
  const { language } = useLanguage();
  const t = translations[language];
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [allTrips, setAllTrips] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [viewFilter, setViewFilter] = useState('date'); // 'date', 'all', 'upcoming', 'past'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'planned', 'scheduled', 'done'
  const [deletingId, setDeletingId] = useState(null);
  const [editingTrip, setEditingTrip] = useState(null);
  const [viewingTripId, setViewingTripId] = useState(null);

  useEffect(() => {
    loadTrips();
  }, [selectedDate, viewFilter]);

  const loadTrips = async () => {
    setLoading(true);
    try {
      let tripsData;
      if (viewFilter === 'date') {
        tripsData = await getTripsByDate(selectedDate);
      } else {
        tripsData = await getAllTrips();
      }
      setAllTrips(tripsData);
    } catch (error) {
      console.error('Error loading trips:', error);
    } finally {
      setLoading(false);
    }
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

  const getFilteredTrips = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let filtered = allTrips;

    // Apply date/time filter
    if (viewFilter === 'date') {
      // Already filtered by date in loadTrips
      filtered = allTrips;
    } else if (viewFilter === 'upcoming') {
      filtered = allTrips.filter(trip => {
        const tripDate = trip.date?.toDate?.() || new Date(trip.date);
        tripDate.setHours(0, 0, 0, 0);
        return tripDate >= today;
      });
    } else if (viewFilter === 'past') {
      filtered = allTrips.filter(trip => {
        const tripDate = trip.date?.toDate?.() || new Date(trip.date);
        tripDate.setHours(0, 0, 0, 0);
        return tripDate < today;
      });
    }
    // 'all' filter - use all trips

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(trip => trip.status === statusFilter);
    }

    return filtered;
  };

  const filteredTrips = getFilteredTrips();

  const getStatusColor = (status) => {
    switch (status) {
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
      <Header />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Side - Trip List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {viewFilter === 'date' ? `${t.tripsFor} ${selectedDate.toLocaleDateString()}` :
                   viewFilter === 'all' ? t.allTrips :
                   viewFilter === 'upcoming' ? t.currentTrips :
                   t.oldTrips}
                </h2>
                <div className="flex gap-2 mt-3 flex-wrap">
                  <button
                    onClick={() => setViewFilter('date')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      viewFilter === 'date'
                        ? 'text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                    style={viewFilter === 'date' ? { backgroundColor: colors.primary.teal } : {}}
                    title={`${t.tripsFor} ${selectedDate.toLocaleDateString()}`}
                  >
                    <CalendarIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">{selectedDate.toLocaleDateString()}</span>
                  </button>
                  <button
                    onClick={() => setViewFilter('all')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      viewFilter === 'all'
                        ? 'text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                    style={viewFilter === 'all' ? { backgroundColor: colors.primary.teal } : {}}
                    title={t.showAllTrips}
                  >
                    <CalendarIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">{t.allTrips}</span>
                  </button>
                  <button
                    onClick={() => setViewFilter('upcoming')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      viewFilter === 'upcoming'
                        ? 'text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                    style={viewFilter === 'upcoming' ? { backgroundColor: colors.primary.teal } : {}}
                    title={t.showCurrentTrips}
                  >
                    <CalendarIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">{t.currentTrips}</span>
                  </button>
                  <button
                    onClick={() => setViewFilter('past')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      viewFilter === 'past'
                        ? 'text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                    style={viewFilter === 'past' ? { backgroundColor: colors.primary.teal } : {}}
                    title={t.showOldTrips}
                  >
                    <Archive className="w-4 h-4" />
                    <span className="hidden sm:inline">{t.oldTrips}</span>
                  </button>
                </div>

                {/* Status Filter Buttons */}
                <div className="flex gap-2 mt-3 flex-wrap">
                  <button
                    onClick={() => setStatusFilter('all')}
                    className={`flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      statusFilter === 'all'
                        ? 'text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                    style={statusFilter === 'all' ? { backgroundColor: colors.primary.teal } : {}}
                    title="Show all statuses"
                  >
                    <CalendarIcon className="w-4 h-4" />
                    <span className="sm:hidden">A</span>
                    <span className="hidden sm:inline">All Status</span>
                  </button>
                  <button
                    onClick={() => setStatusFilter('planned')}
                    className={`flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      statusFilter === 'planned'
                        ? 'text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                    style={statusFilter === 'planned' ? { backgroundColor: '#92400E' } : {}}
                    title="Show planned trips"
                  >
                    <Clock className="w-4 h-4" />
                    <span className="sm:hidden">P</span>
                    <span className="hidden sm:inline">Planned</span>
                  </button>
                  <button
                    onClick={() => setStatusFilter('scheduled')}
                    className={`flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      statusFilter === 'scheduled'
                        ? 'text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                    style={statusFilter === 'scheduled' ? { backgroundColor: '#6B21A8' } : {}}
                    title="Show scheduled trips"
                  >
                    <CalendarIcon className="w-4 h-4" />
                    <span className="sm:hidden">S</span>
                    <span className="hidden sm:inline">Scheduled</span>
                  </button>
                  <button
                    onClick={() => setStatusFilter('done')}
                    className={`flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      statusFilter === 'done'
                        ? 'text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                    style={statusFilter === 'done' ? { backgroundColor: '#065F46' } : {}}
                    title="Show completed trips"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="sm:hidden">D</span>
                    <span className="hidden sm:inline">Done</span>
                  </button>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                style={{ backgroundColor: colors.primary.teal }}
                className="flex items-center gap-2 px-4 py-2 text-white rounded-lg hover:opacity-90 transition-opacity"
                title={t.createNewTrip}
              >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">{t.createTrip}</span>
              </button>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="text-gray-500">{t.loadingTrips}</div>
              </div>
            ) : filteredTrips.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <p className="text-gray-500">
                  {viewFilter === 'date' && t.noTripsForDate}
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
              <div className="space-y-3">
                {filteredTrips.map((trip) => (
                  <div
                    key={trip.id}
                    className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {trip.title}
                          </h3>
                          <span
                            className="px-2 py-1 rounded-full text-xs font-semibold"
                            style={{
                              backgroundColor: getStatusColor(trip.status).bg,
                              color: getStatusColor(trip.status).text
                            }}
                          >
                            {getStatusColor(trip.status).label}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {trip.date?.toDate?.().toLocaleDateString() || new Date(trip.date).toLocaleDateString()} - {trip.vehicleLayout === 'sprinter_15'
                            ? t.mercedesSprinterBlack
                            : trip.vehicleLayout === 'bus_30'
                            ? t.mercedesSprinterWhite
                            : trip.vehicleLayout === 'highlander_7'
                            ? t.toyotaHighlander
                            : trip.vehicleLayout}
                        </p>
                        {trip.driverName && (
                          <p className="text-sm mt-1" style={{ color: '#00BCD4' }}>
                            {t.driver}: {trip.driverName}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {trip.whatsappGroupLink && (
                          <a
                            href={trip.whatsappGroupLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ backgroundColor: '#25D366' }}
                            className="flex items-center gap-2 px-3 py-2 text-white rounded-lg hover:opacity-90 transition-opacity text-sm"
                            title={t.joinWhatsappGroup}
                          >
                            <MessageCircle className="w-4 h-4" />
                            <span className="hidden sm:inline">{t.whatsapp}</span>
                          </a>
                        )}

                        <button
                          onClick={() => handleCopyLink(trip.id)}
                          className="flex items-center gap-2 px-3 py-2 text-white rounded-lg hover:opacity-90 transition-opacity text-sm"
                          style={{ backgroundColor: copiedId === trip.id ? colors.success : colors.primary.teal }}
                          title={copiedId === trip.id ? t.linkCopied : t.shareTripLink}
                        >
                          {copiedId === trip.id ? (
                            <>
                              <Check className="w-4 h-4" />
                              <span className="hidden sm:inline">{t.copied}</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              <span className="hidden sm:inline">{t.share}</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => setViewingTripId(trip.id)}
                          style={{ backgroundColor: colors.primary.black }}
                          className="flex items-center gap-2 px-3 py-2 text-white rounded-lg hover:opacity-90 transition-opacity text-sm"
                          title={t.viewTripDetails}
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span className="hidden sm:inline">{t.view}</span>
                        </button>

                        <button
                          onClick={() => setEditingTrip(trip)}
                          style={{ backgroundColor: colors.primary.teal }}
                          className="flex items-center gap-2 px-3 py-2 text-white rounded-lg hover:opacity-90 transition-opacity text-sm"
                          title={t.editTrip}
                        >
                          <Edit className="w-4 h-4" />
                          <span className="hidden sm:inline">{t.edit}</span>
                        </button>

                        <button
                          onClick={() => handleDeleteTrip(trip.id)}
                          disabled={deletingId === trip.id}
                          style={{ backgroundColor: colors.button.danger }}
                          className="flex items-center gap-2 px-3 py-2 text-white rounded-lg hover:opacity-90 transition-opacity text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          title={t.deleteTrip}
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="hidden sm:inline">{deletingId === trip.id ? t.deleting : t.delete}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Side - Calendar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-4 sticky top-4">
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
              />
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
    </div>
  );
};

export default AdminDashboard;
