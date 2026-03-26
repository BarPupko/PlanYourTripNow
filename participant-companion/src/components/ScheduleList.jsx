import { useState, useEffect } from 'react';

/* ── Colours ─────────────────────────────────────────────────────────────── */
const T       = '#00BCD4';
const T_LIGHT = '#E0F7FA';
const T_MID   = '#4DD0E1';
const FOREST  = '#00695C';
const DARK    = '#0D2026';
const CREAM   = '#F5FAFB';
const INK     = '#0D2026';
const MUTED   = '#6B8A8E';
const BORDER  = 'rgba(0,188,212,0.18)';

/* ── Helpers ─────────────────────────────────────────────────────────────── */
function fmtTime(d) {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}
function fmtDur(start, end) {
  const mins = Math.round((end - start) / 60_000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}
function toActivities(desc) {
  if (!desc) return [];
  return desc.split('\n').map(l => l.replace(/^[\s•\-*]+/, '').trim()).filter(Boolean);
}

/* ── Itinerary text parser ───────────────────────────────────────────────── */
const DRIVE_EMOJIS = new Set(['🚗','🚐','🚌','🚕','🚙','🏠','🛣️','🚎']);

function timeToDate(timeStr, baseDate) {
  if (!baseDate || !timeStr) return null;
  const [h, m] = timeStr.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return null;
  const d = new Date(baseDate);
  d.setHours(h, m, 0, 0);
  return d;
}

function extractEmoji(str) {
  try {
    const m = str.match(/^(\p{Extended_Pictographic})\s*/u);
    if (m) return { emoji: m[1], rest: str.slice(m[0].length).trim() };
  } catch (_) { /* unsupported engine */ }
  return { emoji: '📍', rest: str };
}

function parseItinerary(text, tripStartDate) {
  if (!text) return { header: '', blocks: [] };

  // Strip markdown bold markers and trim lines
  const lines = text.replace(/\*\*/g, '').split('\n').map(l => l.trim());
  const timeRe = /^(\d{1,2}:\d{2})\s*[–\-—]\s*(\d{1,2}:\d{2})/;

  const blocks = [];
  const headerLines = [];
  let cur = null;

  for (const line of lines) {
    if (!line) continue;
    const tm = line.match(timeRe);

    if (tm) {
      if (cur) blocks.push(cur);
      const [, s, e] = tm;
      const rest = line.replace(timeRe, '').replace(/^\s*\|?\s*/, '').trim();
      const { emoji, rest: name } = extractEmoji(rest);
      const type = DRIVE_EMOJIS.has(emoji) ? 'drive' : 'activity';

      cur = {
        id:         `${s}-${e}`,
        startTime:  timeToDate(s, tripStartDate),
        endTime:    timeToDate(e, tripStartDate),
        time:       `${s} – ${e}`,
        emoji,
        name,
        type,
        duration:   null,
        activities: [],
      };
    } else if (cur) {
      if (line.startsWith('•') || line.startsWith('-')) {
        cur.activities.push(line.replace(/^[•\-]\s*/, '').trim());
      } else if (!cur.duration && !cur.activities.length && line.includes(':')) {
        const afterColon = line.split(':').slice(1).join(':').trim();
        // Skip pure label lines like "Деятельности:" or "Activities:"
        if (afterColon && afterColon.length > 2) {
          cur.duration = afterColon.replace(/\.$/, '').trim();
        }
      }
      // Ignore standalone label lines (Деятельности:, Мероприятия:, etc.)
    } else {
      headerLines.push(line);
    }
  }

  if (cur) blocks.push(cur);
  return { header: headerLines.join('\n'), blocks };
}

/* ── Logo ────────────────────────────────────────────────────────────────── */
function Logo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ width: 36, height: 36, background: T, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <div style={{ textAlign: 'center', color: 'white', lineHeight: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: 2 }}>IVRI</div>
          <div style={{ fontSize: 7, letterSpacing: 3, opacity: 0.85 }}>TOURS</div>
        </div>
      </div>
      <div>
        <div style={{ fontFamily: 'Georgia, serif', fontSize: 15, fontWeight: 600, color: 'white', letterSpacing: 2 }}>IVRI</div>
        <div style={{ fontSize: 9, fontWeight: 300, color: T_MID, letterSpacing: 3, textTransform: 'uppercase' }}>Tours</div>
      </div>
    </div>
  );
}

/* ── Main ────────────────────────────────────────────────────────────────── */
export default function ScheduleList({ items, participant, trip }) {
  const [checked, setChecked]   = useState({});
  const [expanded, setExpanded] = useState({});
  const [now, setNow]           = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const firstName = (participant?.firstName || participant?.name || '').split(' ')[0] || 'there';
  const initials  = [participant?.firstName, participant?.lastName]
    .map(s => s?.[0] || '').join('').toUpperCase() || '?';

  /* ── Build display stops ─────────────────────────────────────────────── */
  let displayStops = [];
  let itineraryHeader = null;
  let textMode = false;

  const firestoreStops = [...items]
    .sort((a, b) => a.startTime - b.startTime)
    .map(item => ({
      id:         item.id,
      type:       item.type || 'activity',
      emoji:      item.emoji || (item.type === 'drive' ? '🚐' : '📍'),
      time:       `${fmtTime(item.startTime)} – ${fmtTime(item.endTime)}`,
      duration:   fmtDur(item.startTime, item.endTime),
      name:       item.title || '',
      activities: toActivities(item.description),
      checkable:  true,
      startTime:  item.startTime,
      endTime:    item.endTime,
    }));

  if (firestoreStops.length > 0) {
    displayStops = firestoreStops;
  } else if (trip?.itinerary) {
    const parsed = parseItinerary(trip.itinerary, trip.startDate);
    itineraryHeader = parsed.header;
    displayStops = parsed.blocks.map(b => ({ ...b, checkable: false }));
    textMode = true;
  }

  /* ── Progress (Firestore mode only) ─────────────────────────────────── */
  const checkable    = displayStops.filter(s => s.checkable);
  const doneCount    = checkable.filter(s => checked[s.id]).length;
  const progressPct  = checkable.length ? Math.round((doneCount / checkable.length) * 100) : 0;

  /* ── For text-mode: derive past/current from real time ───────────────── */
  function getStatus(stop) {
    if (!textMode) return null;
    if (!stop.startTime || !stop.endTime) return 'future';
    if (now >= stop.endTime) return 'past';
    if (now >= stop.startTime) return 'current';
    return 'future';
  }

  /* ── All-done for Firestore mode ─────────────────────────────────────── */
  const allDone = checkable.length > 0 && doneCount === checkable.length;

  const tripStart  = trip?.startDate;
  const tripEnd    = trip?.endDate;
  const departTime = tripStart ? fmtTime(tripStart) : '—';
  const returnTime = tripEnd   ? fmtTime(tripEnd)   : '—';
  const totalHours = (tripStart && tripEnd)
    ? `${Math.round((tripEnd - tripStart) / 3_600_000 * 10) / 10}h`
    : '—';

  return (
    <div style={{ fontFamily: 'DM Sans, Segoe UI, system-ui, sans-serif', background: CREAM, color: INK, maxWidth: 420, margin: '0 auto', minHeight: '100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&display=swap');
        @keyframes ivri-pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .ivri-pulse { animation: ivri-pulse 2s infinite; }
        .ivri-card:hover { border-color: rgba(0,188,212,0.4) !important; box-shadow: 0 4px 16px rgba(0,188,212,0.12) !important; }
        .ivri-card-past:hover { border-color: #E5E5E5 !important; box-shadow: none !important; }
      `}</style>

      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <div style={{ background: DARK, padding: '20px 24px 0', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at top right, rgba(0,188,212,0.22) 0%, transparent 60%)', pointerEvents: 'none' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, position: 'relative' }}>
          <Logo />
          <div style={{ width: 38, height: 38, borderRadius: '50%', background: `linear-gradient(135deg, ${T}, #0097A7)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 500, fontSize: 14, color: 'white' }}>
            {initials}
          </div>
        </div>
        <div style={{ position: 'relative' }}>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 300, letterSpacing: 0.5, margin: '0 0 4px' }}>Welcome back,</p>
          <h1 style={{ color: 'white', fontSize: 22, fontWeight: 500, margin: '0 0 2px' }}>{firstName} 👋</h1>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(0,188,212,0.2)', border: '1px solid rgba(0,188,212,0.35)', borderRadius: 20, padding: '4px 12px', margin: '10px 0 20px' }}>
            <div className="ivri-pulse" style={{ width: 6, height: 6, borderRadius: '50%', background: T }} />
            <span style={{ color: T_MID, fontSize: 12 }}>
              {trip?.name}{tripStart ? ` · ${tripStart.toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })}` : ''}
            </span>
          </div>
        </div>
        {/* Time-based progress strip — always shown when trip times are known */}
        {tripStart && tripEnd && (
          (() => {
            const total = tripEnd - tripStart;
            const elapsed = Math.min(Math.max(now - tripStart, 0), total);
            const timePct = total > 0 ? Math.round((elapsed / total) * 100) : 0;
            const startLabel = tripStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
            const endLabel   = tripEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
            return (
              <div style={{ background: 'rgba(255,255,255,0.06)', borderTop: '1px solid rgba(255,255,255,0.08)', padding: '12px 24px', marginLeft: -24, marginRight: -24 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10 }}>{startLabel}</span>
                  <span style={{ color: T_MID, fontSize: 11, fontWeight: 500 }}>Trip progress · {timePct}%</span>
                  <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10 }}>{endLabel}</span>
                </div>
                <div style={{ height: 5, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: `linear-gradient(90deg, ${T}, ${T_MID})`, borderRadius: 3, width: `${timePct}%`, transition: 'width 1.2s cubic-bezier(0.4,0,0.2,1)' }} />
                </div>
              </div>
            );
          })()
        )}
      </div>

      {/* ── HERO CARD ──────────────────────────────────────────────── */}
      <div style={{ margin: '20px 20px 0', background: 'white', borderRadius: 20, overflow: 'hidden', border: `1px solid ${BORDER}`, boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
        <div style={{ height: 140, background: `linear-gradient(135deg, ${DARK} 0%, #103040 55%, ${T} 100%)`, position: 'relative', display: 'flex', alignItems: 'flex-end', padding: 16, overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, opacity: 0.07, backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Ctext y='40' font-size='36'%3E✈%3C/text%3E%3C/svg%3E\")" }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>
              {tripStart ? tripStart.toLocaleDateString('en-CA', { weekday: 'long', month: 'long', day: 'numeric' }) : ''}
            </div>
            <div style={{ color: 'white', fontSize: 20, fontWeight: 600, lineHeight: 1.2 }}>{trip?.name || 'Your Trip'}</div>
          </div>
        </div>
        <div style={{ padding: '14px 18px', display: 'flex' }}>
          {[
            { val: totalHours, lbl: 'Duration' },
            { val: departTime, lbl: 'Depart' },
            { val: returnTime, lbl: 'Return' },
            { val: displayStops.length, lbl: 'Stops' },
          ].map((s, i) => (
            <div key={i} style={{ flex: 1, textAlign: 'center', borderLeft: i > 0 ? '1px solid #F0EBE3' : 'none' }}>
              <div style={{ fontSize: 16, fontWeight: 500, color: INK }}>{s.val}</div>
              <div style={{ fontSize: 10, color: MUTED, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 }}>{s.lbl}</div>
            </div>
          ))}
        </div>
        {participant?.pickupLocation && (
          <div style={{ margin: '0 18px 14px', background: T_LIGHT, borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16 }}>📍</span>
            <div>
              <div style={{ fontSize: 10, color: MUTED, textTransform: 'uppercase', letterSpacing: 0.5 }}>Your Pickup</div>
              <div style={{ fontSize: 13, fontWeight: 500, color: INK }}>{participant.pickupLocation}</div>
            </div>
          </div>
        )}
      </div>

      {/* ── ALL DONE BANNER ────────────────────────────────────────── */}
      {allDone && (
        <div style={{ margin: '16px 20px 0', background: '#E8F5E9', border: '1px solid rgba(0,105,92,0.2)', borderRadius: 14, padding: '14px 18px', textAlign: 'center' }}>
          <p style={{ fontSize: 14, color: FOREST, fontWeight: 500, margin: 0 }}>All done for today 🎉</p>
          <small style={{ fontSize: 12, color: '#2E7D6A' }}>What an incredible day — enjoy the ride home!</small>
        </div>
      )}

      {/* ── SECTION TITLE ──────────────────────────────────────────── */}
      <div style={{ padding: '24px 20px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontSize: 13, fontWeight: 500, color: MUTED, textTransform: 'uppercase', letterSpacing: 1, margin: 0 }}>
          Today's Itinerary
        </h2>
        {checkable.length > 0 && (
          <span style={{ fontSize: 11, color: T, background: T_LIGHT, padding: '2px 8px', borderRadius: 10 }}>
            {doneCount} / {checkable.length} done
          </span>
        )}
      </div>

      {/* ── TIMELINE ───────────────────────────────────────────────── */}
      <div style={{ padding: '0 20px 24px' }}>
        {displayStops.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <span style={{ fontSize: 48, display: 'block', marginBottom: 12 }}>📋</span>
            <p style={{ fontWeight: 500, fontSize: 16, margin: 0 }}>In planning</p>
            <p style={{ fontSize: 12, color: MUTED, marginTop: 4 }}>Your coordinator is putting the schedule together.</p>
          </div>
        ) : (
          displayStops.map((stop, idx) => {
            const isDrive    = stop.type === 'drive';
            const isChecked  = !!checked[stop.id];
            const isExpanded = !!expanded[stop.id];
            const isLast     = idx === displayStops.length - 1;
            const status     = getStatus(stop);
            const isPast     = status === 'past';
            const isCurrent  = status === 'current';

            // Dot colours
            const dotBg     = isChecked ? FOREST
              : isPast      ? '#E0E0E0'
              : isCurrent   ? T
              : isDrive     ? '#F0F0F0'
              : T_LIGHT;
            const dotBorder = isChecked ? FOREST
              : isPast      ? '#D0D0D0'
              : isCurrent   ? T
              : isDrive     ? '#E0E0E0'
              : 'rgba(0,188,212,0.25)';
            const dotColor  = (isChecked || isCurrent) ? 'white' : isPast ? '#ABABAB' : undefined;

            // Card colours
            const cardBg      = isPast ? '#F7F7F7' : isDrive ? '#FAFAFA' : 'white';
            const cardOpacity = isPast ? 0.7 : 1;
            const nameColor   = isPast ? '#ABABAB' : isDrive ? MUTED : INK;
            const timeColor   = isPast ? '#C0C0C0' : MUTED;

            return (
              <div key={stop.id} style={{ display: 'flex', gap: 14, marginTop: idx === 0 ? 0 : 4 }}>

                {/* Dot + connector */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, width: 36 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, zIndex: 1, flexShrink: 0, transition: 'all 0.2s',
                    background: dotBg, border: `1.5px solid ${dotBorder}`, color: dotColor,
                    fontWeight: (isChecked || isCurrent) ? 700 : undefined,
                    filter: isPast ? 'grayscale(1)' : undefined,
                  }}>
                    {isChecked ? '✓' : stop.emoji}
                  </div>
                  {!isLast && <div style={{ flex: 1, width: 2, background: isPast ? '#E8E8E8' : '#EEE8E0', margin: '2px 0', minHeight: 12 }} />}
                </div>

                {/* Card */}
                <div
                  className={`ivri-card${isPast ? ' ivri-card-past' : ''}`}
                  onClick={() => setExpanded(prev => ({ ...prev, [stop.id]: !prev[stop.id] }))}
                  style={{
                    flex: 1, background: cardBg, opacity: cardOpacity,
                    borderRadius: 14, padding: '12px 14px',
                    border: `1px solid ${isPast ? '#EBEBEB' : BORDER}`,
                    marginBottom: 8, transition: 'all 0.25s', cursor: 'pointer',
                  }}
                >
                  {/* Time + duration */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ fontSize: 10, color: timeColor, fontWeight: 400, letterSpacing: 0.3 }}>
                      {stop.time}
                      <span style={{ display: 'inline-block', marginLeft: 4, fontSize: 10, transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'none' }}>▾</span>
                    </span>
                    {stop.duration && (
                      <span style={{
                        fontSize: 10, padding: '2px 7px', borderRadius: 8, whiteSpace: 'nowrap', flexShrink: 0,
                        color: isPast ? '#ABABAB' : isDrive ? MUTED : T,
                        background: isPast ? '#F0F0F0' : isDrive ? '#F0F0F0' : T_LIGHT,
                      }}>
                        {stop.duration}
                      </span>
                    )}
                  </div>

                  {/* Name */}
                  <div style={{
                    fontSize: 13, fontWeight: isDrive ? 400 : 500,
                    color: nameColor, lineHeight: 1.3, margin: '3px 0 0',
                    textDecoration: isPast ? 'line-through' : 'none',
                    textDecorationColor: '#C0C0C0',
                  }}>
                    {stop.name}
                  </div>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div style={{ borderTop: `1px solid ${isPast ? '#EFEFEF' : '#F5F0EA'}`, paddingTop: 10, marginTop: 10 }}>
                      {stop.activities.length > 0 && (
                        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 5 }}>
                          {stop.activities.map((a, i) => (
                            <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: isPast ? '#ABABAB' : '#4A4A4A', lineHeight: 1.5 }}>
                              <span style={{ width: 5, height: 5, borderRadius: '50%', background: isPast ? '#C8C8C8' : T, flexShrink: 0, marginTop: 5 }} />
                              {a}
                            </li>
                          ))}
                        </ul>
                      )}

                      {/* Mark as visited — Firestore mode only */}
                      {stop.checkable && (
                        <div
                          style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: stop.activities.length > 0 ? 12 : 0, paddingTop: stop.activities.length > 0 ? 10 : 0, borderTop: stop.activities.length > 0 ? '1px solid #F5F0EA' : 'none' }}
                          onClick={e => { e.stopPropagation(); setChecked(prev => ({ ...prev, [stop.id]: !prev[stop.id] })); }}
                        >
                          <div style={{ width: 22, height: 22, borderRadius: '50%', cursor: 'pointer', border: isChecked ? 'none' : '1.5px solid #D5C8BA', background: isChecked ? FOREST : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s', color: 'white', fontSize: 12, fontWeight: 700 }}>
                            {isChecked && '✓'}
                          </div>
                          <span style={{ fontSize: 12, color: MUTED }}>{isChecked ? 'Marked as visited' : 'Mark as visited'}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── TIP / INFO CARD ────────────────────────────────────────── */}
      {trip?.customInfo && (
        <div style={{ margin: '0 20px 20px', background: `linear-gradient(135deg, ${DARK} 0%, #103040 100%)`, borderRadius: 16, padding: '18px 20px', color: 'white', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: 16, top: 12, fontSize: 40, opacity: 0.18 }}>💡</div>
          <div style={{ fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', opacity: 0.65, marginBottom: 8 }}>Important Info</div>
          <div style={{ fontSize: 13, lineHeight: 1.65, opacity: 0.9, fontWeight: 300, whiteSpace: 'pre-wrap' }}>{trip.customInfo}</div>
        </div>
      )}

      {/* ── FOOTER ─────────────────────────────────────────────────── */}
      <div style={{ padding: '16px 20px 32px', textAlign: 'center' }}>
        <p style={{ fontSize: 10, color: MUTED, letterSpacing: 2, textTransform: 'uppercase', margin: 0 }}>
          Powered by <span style={{ color: T, fontWeight: 500 }}>IVRI TOURS</span>
        </p>
      </div>
    </div>
  );
}
