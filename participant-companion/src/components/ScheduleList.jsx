import { useState, useEffect } from 'react';
import ScheduleItem from './ScheduleItem';

const TEAL        = '#00BCD4';
const TEAL_DARK   = '#00ACC1';
const BLACK       = '#2B2B2B';

function getStatus(item, now) {
  if (now > item.endTime)    return 'past';
  if (now >= item.startTime) return 'current';
  return 'future';
}

function getTripDay(startDate, now) {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.floor((now - startDate) / msPerDay) + 1;
}

function getTripDuration(startDate, endDate) {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((endDate - startDate) / msPerDay) + 1;
}

// IVRI Tours wordmark inline — no image dependency
function IvriLogo() {
  return (
    <div className="flex items-center gap-2">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md"
        style={{ backgroundColor: 'rgba(255,255,255,0.25)' }}
      >
        <div className="text-center text-white leading-none">
          <div className="text-[10px] font-black tracking-widest">IVRI</div>
          <div className="text-[7px] tracking-widest opacity-90">TOURS</div>
        </div>
      </div>
    </div>
  );
}

export default function ScheduleList({ items, participant, trip }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const sorted      = [...items].sort((a, b) => a.startTime - b.startTime);
  const currentIdx  = sorted.findIndex(item => getStatus(item, now) === 'current');
  const nextFutIdx  = sorted.findIndex(item => getStatus(item, now) === 'future');
  const scrollIdx   = currentIdx !== -1 ? currentIdx : nextFutIdx;

  const day      = getTripDay(trip.startDate, now);
  const duration = getTripDuration(trip.startDate, trip.endDate);
  const dayLabel = day >= 1 && day <= duration ? `Day ${day} of ${duration}` : null;

  const progressPct    = Math.min(100, Math.max(0, ((now - trip.startDate) / (trip.endDate - trip.startDate)) * 100));
  const completedCount = sorted.filter(item => getStatus(item, now) === 'past').length;
  const hasCurrent     = currentIdx !== -1;
  const hasNext        = nextFutIdx !== -1;
  const firstName      = (participant.firstName || participant.name || '').split(' ')[0];

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Hero header with IVRI teal gradient ── */}
      <div
        className="px-4 pt-10 pb-6"
        style={{ background: `linear-gradient(135deg, ${TEAL} 0%, #26C6DA 100%)` }}
      >
        <div className="max-w-md mx-auto">
          {/* Top row: logo + day badge */}
          <div className="flex items-center justify-between mb-5">
            <IvriLogo />
            {dayLabel && (
              <span
                className="text-xs font-bold px-3 py-1.5 rounded-full"
                style={{ backgroundColor: 'rgba(255,255,255,0.25)', color: 'white' }}
              >
                {dayLabel}
              </span>
            )}
          </div>

          {/* Greeting */}
          <p className="text-white/80 text-sm mb-0.5">Welcome back,</p>
          <h1 className="text-3xl font-black text-white tracking-tight mb-1">
            {firstName} 👋
          </h1>
          <p className="text-white/70 text-sm mb-5">{trip.name || trip.title}</p>

          {/* Trip progress bar */}
          <div className="mb-4">
            <div className="flex justify-between text-white/70 text-xs mb-1.5">
              <span>Trip Progress</span>
              <span>{Math.round(progressPct)}%</span>
            </div>
            <div className="h-2 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.25)' }}>
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{ width: `${progressPct}%`, backgroundColor: 'white' }}
              />
            </div>
          </div>

          {/* Status chip */}
          <div
            className="inline-flex items-center gap-2 rounded-full px-3 py-1.5"
            style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
          >
            {hasCurrent ? (
              <>
                <span className="w-2 h-2 rounded-full bg-white animate-pulse shrink-0" />
                <span className="text-white text-sm font-semibold">Activity in progress</span>
              </>
            ) : hasNext ? (
              <>
                <span className="w-2 h-2 rounded-full bg-white/60 shrink-0" />
                <span className="text-white/90 text-sm">Next activity coming up</span>
              </>
            ) : (
              <span className="text-white/80 text-sm">All done for today 🎉</span>
            )}
            <span className="text-white/60 text-xs ml-1 tabular-nums">
              {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      </div>

      {/* ── Schedule list ── */}
      <div className="px-4 pt-5 pb-12 max-w-md mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">
            Today's Itinerary
          </h2>
          <span className="text-xs text-gray-400">
            {completedCount}/{sorted.length} completed
          </span>
        </div>

        {sorted.map((item, idx) => (
          <ScheduleItem
            key={item.id}
            item={item}
            status={getStatus(item, now)}
            isScrollTarget={idx === scrollIdx}
          />
        ))}
      </div>

      {/* ── Footer ── */}
      <div className="pb-8 text-center">
        <p className="text-xs text-gray-400">
          Powered by{' '}
          <span className="font-bold" style={{ color: TEAL_DARK }}>IVRI TOURS</span>
        </p>
      </div>
    </div>
  );
}
