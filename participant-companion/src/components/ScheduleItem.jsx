import { useRef, useEffect } from 'react';

const TEAL = '#00BCD4';
const TEAL_DARK = '#00ACC1';
const BLACK = '#2B2B2B';

function formatTime(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDuration(startTime, endTime) {
  const mins = Math.round((endTime - startTime) / 60000);
  if (mins >= 60) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  return `${mins}m`;
}

function PinIcon({ color }) {
  return (
    <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke={color}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

export default function ScheduleItem({ item, status, isScrollTarget }) {
  const ref = useRef(null);

  useEffect(() => {
    if (isScrollTarget && ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isScrollTarget]);

  const isPast    = status === 'past';
  const isCurrent = status === 'current';

  if (isCurrent) {
    return (
      <div
        ref={ref}
        className="relative rounded-2xl mb-3 p-4 pt-6 shadow-lg"
        style={{ backgroundColor: TEAL, color: 'white' }}
      >
        {/* NOW badge */}
        <div className="absolute -top-3 left-4">
          <span className="inline-flex items-center gap-1.5 bg-white text-xs font-bold px-3 py-1 rounded-full"
            style={{ color: TEAL_DARK }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: TEAL_DARK }} />
            Happening Now
          </span>
        </div>

        <div className="flex items-start gap-3">
          {/* Time column */}
          <div className="flex flex-col items-center shrink-0 w-14">
            <span className="text-sm font-bold tabular-nums text-white/90">
              {formatTime(item.startTime)}
            </span>
            <div className="w-px grow min-h-[14px] my-1 bg-white/30" />
            <span className="text-xs tabular-nums text-white/60">
              {formatTime(item.endTime)}
            </span>
          </div>
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="font-bold text-base leading-snug text-white">
                {item.title}
              </h3>
              <span className="text-xs shrink-0 px-2 py-0.5 rounded-full mt-0.5 bg-white/20 text-white/80">
                {formatDuration(item.startTime, item.endTime)}
              </span>
            </div>
            {item.location && (
              <p className="text-xs flex items-center gap-1 mb-2 text-white/70">
                <PinIcon color="rgba(255,255,255,0.7)" />
                <span className="truncate">{item.location}</span>
              </p>
            )}
            {item.description && (
              <p className="text-sm leading-relaxed text-white/85">
                {item.description}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (isPast) {
    return (
      <div ref={ref} className="relative rounded-2xl mb-3 p-4 bg-gray-100 border border-gray-200 opacity-60">
        <div className="flex items-start gap-3">
          <div className="flex flex-col items-center shrink-0 w-14">
            <span className="text-sm font-semibold tabular-nums text-gray-400">
              {formatTime(item.startTime)}
            </span>
            <div className="w-px grow min-h-[14px] my-1 bg-gray-300" />
            <span className="text-xs tabular-nums text-gray-300">
              {formatTime(item.endTime)}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="font-semibold text-base leading-snug text-gray-400 line-through decoration-gray-300">
                {item.title}
              </h3>
              <span className="text-xs shrink-0 px-2 py-0.5 rounded-full mt-0.5 bg-gray-200 text-gray-400">
                Done
              </span>
            </div>
            {item.location && (
              <p className="text-xs flex items-center gap-1 text-gray-400">
                <PinIcon color="#9CA3AF" />
                <span className="truncate">{item.location}</span>
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Future
  return (
    <div
      ref={ref}
      className="relative rounded-2xl mb-3 p-4 bg-white border border-gray-200 shadow-sm"
      style={{ borderLeftWidth: '4px', borderLeftColor: TEAL }}
    >
      <div className="flex items-start gap-3">
        <div className="flex flex-col items-center shrink-0 w-14">
          <span className="text-sm font-semibold tabular-nums" style={{ color: TEAL_DARK }}>
            {formatTime(item.startTime)}
          </span>
          <div className="w-px grow min-h-[14px] my-1 bg-gray-200" />
          <span className="text-xs tabular-nums text-gray-400">
            {formatTime(item.endTime)}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-semibold text-base leading-snug" style={{ color: BLACK }}>
              {item.title}
            </h3>
            <span className="text-xs shrink-0 px-2 py-0.5 rounded-full mt-0.5 bg-gray-100 text-gray-500">
              {formatDuration(item.startTime, item.endTime)}
            </span>
          </div>
          {item.location && (
            <p className="text-xs flex items-center gap-1 mb-2 text-gray-500">
              <PinIcon color="#6B7280" />
              <span className="truncate">{item.location}</span>
            </p>
          )}
          {item.description && (
            <p className="text-sm leading-relaxed text-gray-600">
              {item.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
