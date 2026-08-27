import { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Loader2, Copy, Check, Send, ExternalLink } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';
import { createTrip } from '../utils/firestoreUtils';
import colors from '../utils/colors';

const PRESET_PICKUP_LOCATIONS = [
  'Yummy Market North',
  'Bathurst/Centre - Walmart Store',
  'Bathurst/Steeles - Metro Plaza',
  'Bathurst/Finch - Shell Gas Station',
  'Bathurst/Sheppard - Metro Plaza',
  'Sheppard West',
];

const PLACEHOLDER = 'Paste a tour announcement here - Russian, English or Hebrew. The date, price, deposit and program are read automatically.';

// Firestore rejects undefined; the parser may omit fields
const num = (v) => (typeof v === 'number' && !isNaN(v) ? v : '');

const QuickTripChat = ({ onCreated }) => {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [parsing, setParsing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState(null);   // parsed + editable fields
  const [created, setCreated] = useState(null); // { id, title }
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (open && !draft && !created) textareaRef.current?.focus();
  }, [open, draft, created]);

  const registrationLink = created
    ? `${window.location.origin}/PlanYourTripNow/register/${created.id}`
    : '';

  const reset = () => {
    setText('');
    setDraft(null);
    setCreated(null);
    setError('');
    setCopied(false);
  };

  const handleParse = async () => {
    if (!text.trim()) return;
    setParsing(true);
    setError('');
    try {
      const parseTripFromText = httpsCallable(functions, 'parseTripFromText');
      const { data } = await parseTripFromText({ text });
      const trip = data?.trip || {};

      const description = [
        trip.description || '',
        ...(Array.isArray(trip.highlights) && trip.highlights.length
          ? ['', ...trip.highlights.map(h => `• ${h}`)]
          : []),
      ].join('\n').trim();

      setDraft({
        title: trip.title || '',
        date: trip.date || '',
        endDate: trip.endDate || trip.date || '',
        startTime: trip.startTime || '08:00',
        endTime: trip.endTime || '18:00',
        price: num(trip.price),
        deposit: num(trip.deposit),
        pickupPlace: trip.location || '',
        websiteDescription: description,
        showOnWebsite: true,
        pickupLocations: [],
      });
    } catch (e) {
      console.error('Error parsing trip text:', e);
      setError(e?.message || 'Could not read the tour details from that text.');
    } finally {
      setParsing(false);
    }
  };

  const handleCreate = async () => {
    if (!draft.title.trim() || !draft.date) {
      setError('A title and a date are required.');
      return;
    }
    setCreating(true);
    setError('');
    try {
      const [startHour, startMinute] = draft.startTime.split(':').map(Number);
      const [endHour, endMinute] = draft.endTime.split(':').map(Number);

      const startDateTime = new Date(`${draft.date}T00:00:00`);
      startDateTime.setHours(startHour, startMinute, 0, 0);

      const endDateTime = new Date(`${draft.endDate || draft.date}T00:00:00`);
      endDateTime.setHours(endHour, endMinute, 0, 0);

      const tripId = await createTrip({
        title: draft.title.trim(),
        vehicleLayout: 'sprinter_15',
        driverName: '',
        pickupPlace: draft.pickupPlace || '',
        whatsappGroupLink: '',
        status: 'planned',
        customSeats: [],
        startDateTime: Timestamp.fromDate(startDateTime),
        endDateTime: Timestamp.fromDate(endDateTime),
        startTimeStr: draft.startTime,
        endTimeStr: draft.endTime,
        price: draft.price === '' ? '' : Number(draft.price),
        deposit: draft.deposit === '' ? '' : Number(draft.deposit),
        showOnWebsite: draft.showOnWebsite,
        websiteImage: '',
        websiteDescription: draft.websiteDescription || '',
        showRegistrationCount: false,
        pickupLocations: draft.pickupLocations,
        source: 'admin_paste',
        sourceText: text.substring(0, 1000),
      });

      setCreated({ id: tripId, title: draft.title.trim() });
      setDraft(null);
      onCreated?.();
    } catch (e) {
      console.error('Error creating trip:', e);
      setError('Failed to create the trip. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(registrationLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const field = (key, value) => setDraft({ ...draft, [key]: value });

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-2 w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed text-left text-xs text-gray-500 hover:bg-teal-50 transition-colors"
        style={{ borderColor: colors.primary.teal }}
      >
        <Sparkles className="w-3.5 h-3.5 flex-shrink-0" style={{ color: colors.primary.teal }} />
        <span className="truncate">Paste a tour announcement to create a trip…</span>
      </button>
    );
  }

  return (
    <div className="mt-2 rounded-xl border bg-white shadow-sm overflow-hidden" style={{ borderColor: colors.primary.teal }}>
      <div className="flex items-center justify-between px-3 py-2" style={{ backgroundColor: '#E0F7FA' }}>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-700">
          <Sparkles className="w-3.5 h-3.5" style={{ color: colors.primary.teal }} />
          Quick trip from text
        </div>
        <div className="flex items-center gap-1">
          {(draft || created) && (
            <button
              type="button"
              onClick={reset}
              className="text-[11px] font-medium text-gray-500 hover:text-gray-700 px-1.5 py-0.5"
            >
              Start over
            </button>
          )}
          <button
            type="button"
            onClick={() => { reset(); setOpen(false); }}
            className="text-gray-400 hover:text-gray-600 p-0.5"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-3 space-y-3">
        {/* Step 1 - paste the text */}
        {!draft && !created && (
          <>
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  handleParse();
                }
              }}
              rows={6}
              placeholder={PLACEHOLDER}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-vertical focus:ring-2 focus:ring-[#00BCD4] focus:border-transparent"
            />
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] text-gray-400">Ctrl/⌘ + Enter</span>
              <button
                type="button"
                onClick={handleParse}
                disabled={parsing || !text.trim()}
                style={{ backgroundColor: colors.primary.teal }}
                className="flex items-center gap-1.5 px-3 py-2 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {parsing
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Reading…</>
                  : <><Send className="w-4 h-4" /> Read text</>}
              </button>
            </div>
          </>
        )}

        {/* Step 2 - review what was read, then create */}
        {draft && (
          <>
            <p className="text-[11px] text-gray-500">
              Read from your text - adjust anything, then create the trip.
            </p>
            <div>
              <label className="block text-[11px] font-medium text-gray-600 mb-1">Title</label>
              <input
                type="text"
                value={draft.title}
                onChange={(e) => field('title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#00BCD4] focus:border-transparent"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-medium text-gray-600 mb-1">Start date</label>
                <input
                  type="date"
                  value={draft.date}
                  onChange={(e) => field('date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#00BCD4] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-600 mb-1">End date</label>
                <input
                  type="date"
                  value={draft.endDate}
                  min={draft.date}
                  onChange={(e) => field('endDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#00BCD4] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-600 mb-1">Start time</label>
                <input
                  type="time"
                  value={draft.startTime}
                  onChange={(e) => field('startTime', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#00BCD4] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-600 mb-1">End time</label>
                <input
                  type="time"
                  value={draft.endTime}
                  onChange={(e) => field('endTime', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#00BCD4] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-600 mb-1">Price (C$)</label>
                <input
                  type="number"
                  min="0"
                  value={draft.price}
                  onChange={(e) => field('price', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#00BCD4] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-600 mb-1">Deposit (C$)</label>
                <input
                  type="number"
                  min="0"
                  value={draft.deposit}
                  onChange={(e) => field('deposit', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#00BCD4] focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-gray-600 mb-1">Location</label>
              <input
                type="text"
                value={draft.pickupPlace}
                onChange={(e) => field('pickupPlace', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#00BCD4] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-gray-600 mb-1">Website description</label>
              <textarea
                value={draft.websiteDescription}
                onChange={(e) => field('websiteDescription', e.target.value)}
                rows={5}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-vertical focus:ring-2 focus:ring-[#00BCD4] focus:border-transparent"
              />
            </div>

            {/* Pickup stops */}
            <div>
              <label className="block text-[11px] font-medium text-gray-600 mb-1">Pickup stops</label>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_PICKUP_LOCATIONS.map(loc => {
                  const checked = draft.pickupLocations.includes(loc);
                  return (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => field('pickupLocations', checked
                        ? draft.pickupLocations.filter(l => l !== loc)
                        : [...draft.pickupLocations, loc])}
                      className="px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors"
                      style={checked
                        ? { backgroundColor: '#E0F7FA', borderColor: colors.primary.teal, color: '#0E7490' }
                        : { backgroundColor: '#F9FAFB', borderColor: '#E5E7EB', color: '#6B7280' }}
                    >
                      {loc}
                    </button>
                  );
                })}
              </div>
              {draft.pickupLocations.length === 0 && (
                <p className="text-[11px] text-amber-600 mt-1.5">
                  No stops selected - participants won't see a pickup field when registering.
                </p>
              )}
            </div>

            <label className="flex items-center gap-2 text-xs text-gray-700">
              <input
                type="checkbox"
                checked={draft.showOnWebsite}
                onChange={(e) => field('showOnWebsite', e.target.checked)}
                className="w-4 h-4 rounded"
                style={{ accentColor: colors.primary.teal }}
              />
              Show on website
            </label>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setDraft(null)}
                className="px-3 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={creating}
                style={{ backgroundColor: colors.primary.teal }}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {creating
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</>
                  : <>Create trip</>}
              </button>
            </div>
          </>
        )}

        {/* Step 3 - the link */}
        {created && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-green-700 flex items-center gap-1.5">
              <Check className="w-4 h-4" /> Trip created - “{created.title}”
            </p>
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                readOnly
                value={registrationLink}
                onFocus={(e) => e.target.select()}
                className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-lg text-xs bg-gray-50 text-gray-600"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                style={{ backgroundColor: copied ? colors.success : colors.primary.teal }}
                className="flex items-center gap-1.5 px-3 py-2 text-white rounded-lg text-xs font-medium hover:opacity-90 transition-opacity flex-shrink-0"
                title="Copy registration link"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied' : 'Copy link'}
              </button>
              <a
                href={registrationLink}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-gray-400 hover:text-gray-600 flex-shrink-0"
                title="Open registration page"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
            <p className="text-[11px] text-gray-500">
              Add a driver or vehicle in <span className="font-medium">Edit</span> on the trip card below.
            </p>
          </div>
        )}

        {error && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
      </div>
    </div>
  );
};

export default QuickTripChat;
