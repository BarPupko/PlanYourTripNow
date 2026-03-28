import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { getTrip, getFeedbackByToken, createFeedback } from '../utils/firestoreUtils';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import colors from '../utils/colors';

const StarRow = ({ label, value, onChange, error }) => (
  <div className="space-y-1">
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className="text-3xl transition-transform hover:scale-110 focus:outline-none"
            style={{ color: n <= value ? '#f59e0b' : '#D1D5DB' }}
          >
            ★
          </button>
        ))}
      </div>
    </div>
    {error && <p className="text-red-500 text-xs text-right">{error}</p>}
  </div>
);

const FeedbackForm = () => {
  const { tripId, token } = useParams();

  const [trip, setTrip] = useState(null);
  const [registration, setRegistration] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(null); // holds existing feedback

  const [ratings, setRatings] = useState({ overall: 0, guide: 0, transport: 0, value: 0 });
  const [wouldRecommend, setWouldRecommend] = useState('');
  const [comment, setComment] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const load = async () => {
      try {
        const [tripData, existingFeedback] = await Promise.all([
          getTrip(tripId),
          getFeedbackByToken(token)
        ]);

        setTrip(tripData);

        if (existingFeedback) {
          setAlreadySubmitted(existingFeedback);
          setLoading(false);
          return;
        }

        // Look up registration by companionToken
        const snap = await getDocs(query(
          collection(db, 'registrations'),
          where('companionToken', '==', token)
        ));
        if (!snap.empty) {
          setRegistration({ id: snap.docs[0].id, ...snap.docs[0].data() });
        }
      } catch (err) {
        console.error('Error loading feedback page:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [tripId, token]);

  const validate = () => {
    const e = {};
    if (!ratings.overall) e.overall = 'Required';
    if (!ratings.guide)   e.guide   = 'Required';
    if (!ratings.transport) e.transport = 'Required';
    if (!ratings.value)   e.value   = 'Required';
    if (!wouldRecommend)  e.wouldRecommend = 'Please select an option';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await createFeedback({
        token,
        tripId,
        registrationId: registration.id,
        ratings,
        wouldRecommend,
        comment,
        firstName: registration.firstName,
        lastName: registration.lastName,
      });
      setSubmitted(true);
    } catch (err) {
      if (err.message === 'already_submitted') {
        const existing = await getFeedbackByToken(token);
        setAlreadySubmitted(existing);
      } else {
        setErrors({ submit: 'Failed to submit. Please try again.' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #E0F7FA 0%, #B2EBF2 100%)' }}>
        <div className="text-gray-500 text-lg">Loading…</div>
      </div>
    );
  }

  if (!trip || !registration) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #E0F7FA 0%, #B2EBF2 100%)' }}>
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="w-14 h-14 text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Invalid Link</h1>
          <p className="text-gray-500 text-sm">This feedback link is invalid or has expired. Please contact your trip organizer.</p>
        </div>
      </div>
    );
  }

  if (alreadySubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #E0F7FA 0%, #B2EBF2 100%)' }}>
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-5xl mb-4">⭐</div>
          <h1 className="text-xl font-bold text-gray-900 mb-1">Already Submitted</h1>
          <p className="text-gray-500 text-sm mb-6">You've already shared your feedback for <strong>{trip.title}</strong>. Thank you!</p>
          <div className="bg-amber-50 rounded-lg p-4">
            <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">Your overall rating</p>
            <div className="flex justify-center gap-1 text-3xl">
              {[1,2,3,4,5].map(n => (
                <span key={n} style={{ color: n <= alreadySubmitted.ratings?.overall ? '#f59e0b' : '#D1D5DB' }}>★</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #E0F7FA 0%, #B2EBF2 100%)' }}>
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <CheckCircle2 className="w-16 h-16 mx-auto mb-4" style={{ color: colors.primary.teal }} />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Thank You, {registration.firstName}! 🎉</h1>
          <p className="text-gray-500">Your feedback has been submitted. We truly appreciate your time and look forward to seeing you on a future trip!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10 px-4" style={{ background: 'linear-gradient(135deg, #E0F7FA 0%, #B2EBF2 100%)' }}>
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🌟</div>
          <h1 className="text-2xl font-bold text-gray-900">How was your trip?</h1>
          <p className="text-gray-600 mt-1 text-sm">
            Hi <strong>{registration.firstName}</strong> — thanks for joining <strong>{trip.title}</strong>!
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-6 space-y-6">

          {/* Star ratings */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Rate your experience</h2>
            <StarRow label="Overall Experience" value={ratings.overall}    onChange={v => setRatings(r => ({ ...r, overall:   v }))} error={errors.overall} />
            <StarRow label="Guide & Service"    value={ratings.guide}      onChange={v => setRatings(r => ({ ...r, guide:     v }))} error={errors.guide} />
            <StarRow label="Transport & Comfort" value={ratings.transport} onChange={v => setRatings(r => ({ ...r, transport: v }))} error={errors.transport} />
            <StarRow label="Value for Money"    value={ratings.value}      onChange={v => setRatings(r => ({ ...r, value:     v }))} error={errors.value} />
          </div>

          <div className="border-t border-gray-100 pt-4">
            {/* Would recommend */}
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Would you recommend us?</h2>
            <div className="flex gap-3">
              {[
                { value: 'yes',   label: '😍 Absolutely!' },
                { value: 'maybe', label: '🤔 Maybe' },
                { value: 'no',    label: '😕 Not really' },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setWouldRecommend(opt.value)}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border-2 transition-all ${
                    wouldRecommend === opt.value
                      ? 'border-transparent text-white'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                  style={wouldRecommend === opt.value ? { backgroundColor: colors.primary.teal } : {}}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {errors.wouldRecommend && <p className="text-red-500 text-xs mt-1">{errors.wouldRecommend}</p>}
          </div>

          {/* Comment */}
          <div className="border-t border-gray-100 pt-4">
            <label className="block text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Any comments? <span className="normal-case font-normal text-gray-400">(optional)</span>
            </label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={3}
              placeholder="Tell us what you loved or how we can improve…"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:border-transparent resize-none"
              style={{ '--tw-ring-color': colors.primary.teal }}
            />
          </div>

          {errors.submit && (
            <p className="text-red-500 text-sm text-center">{errors.submit}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl font-bold text-white text-base hover:opacity-90 transition-opacity disabled:opacity-50"
            style={{ backgroundColor: colors.primary.teal }}
          >
            {submitting ? 'Submitting…' : 'Submit Feedback ⭐'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-4">Your feedback is private and shared only with the IVRI Tours team.</p>
      </div>
    </div>
  );
};

export default FeedbackForm;
