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

function toActivities(description) {
  if (!description) return [];
  return description
    .split('\n')
    .map(l => l.replace(/^[\s•\-*]+/, '').trim())
    .filter(Boolean);
}

/* ── Logo ────────────────────────────────────────────────────────────────── */
function Logo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{
        width: 36, height: 36, background: T, borderRadius: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
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

  const stops = [...items]
    .sort((a, b) => a.startTime - b.startTime)
    .map(item => ({
      id:         item.id,
      type:       item.type || 'activity',
      emoji:      item.emoji || (item.type === 'drive' ? '🚐' : '📍'),
      time:       `${fmtTime(item.startTime)} – ${fmtTime(item.endTime)}`,
      duration:   fmtDur(item.startTime, item.endTime),
      name:       item.title || '',
      activities: toActivities(item.description),
      checkable:  (item.type || 'activity') !== 'drive',
    }));

  const checkable   = stops.filter(s => s.checkable);
  const doneCount   = checkable.filter(s => checked[s.id]).length;
  const progressPct = checkable.length ? Math.round((doneCount / checkable.length) * 100) : 0;
  const allDone     = checkable.length > 0 && doneCount === checkable.length;

  const tripStart  = trip?.startDate;
  const tripEnd    = trip?.endDate;
  const departTime = tripStart ? fmtTime(tripStart) : '—';
  const returnTime = tripEnd   ? fmtTime(tripEnd)   : '—';
  const totalHours = (tripStart && tripEnd)
    ? `${Math.round((tripEnd - tripStart) / 3_600_000 * 10) / 10}h`
    : '—';

  return (
    <div style={{ fontFamily: 'DM Sans, Segoe UI, system-ui, sans-serif', background: CREAM, color: INK, maxWidth: 420, margin: '0 auto', minHeight: '100vh' }}>

      {/* Font + animation injection */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&display=swap');
        @keyframes ivri-pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .ivri-pulse { animation: ivri-pulse 2s infinite; }
        .ivri-card:hover { border-color: rgba(0,188,212,0.4) !important; box-shadow: 0 4px 16px rgba(0,188,212,0.12) !important; }
      `}</style>

      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <div style={{ background: DARK, padding: '20px 24px 0', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at top right, rgba(0,188,212,0.22) 0%, transparent 60%)', pointerEvents: 'none' }} />

        {/* Logo + avatar row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, position: 'relative' }}>
          <Logo />
          <div style={{
            width: 38, height: 38, borderRadius: '50%',
            background: `linear-gradient(135deg, ${T}, #0097A7)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 500, fontSize: 14, color: 'white',
          }}>
            {initials}
          </div>
        </div>

        {/* Greeting */}
        <div style={{ position: 'relative' }}>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 300, letterSpacing: 0.5, margin: '0 0 4px' }}>
            Welcome back,
          </p>
          <h1 style={{ color: 'white', fontSize: 22, fontWeight: 500, margin: '0 0 2px' }}>
            {firstName} 👋
          </h1>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(0,188,212,0.2)', border: '1px solid rgba(0,188,212,0.35)',
            borderRadius: 20, padding: '4px 12px', margin: '10px 0 20px',
          }}>
            <div className="ivri-pulse" style={{ width: 6, height: 6, borderRadius: '50%', background: T }} />
            <span style={{ color: T_MID, fontSize: 12 }}>
              {trip?.name}
              {tripStart ? ` · ${tripStart.toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })}` : ''}
            </span>
          </div>
        </div>

        {/* Progress strip */}
        <div style={{
          background: 'rgba(255,255,255,0.06)', borderTop: '1px solid rgba(255,255,255,0.08)',
          padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 12,
          marginLeft: -24, marginRight: -24,
        }}>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 300, whiteSpace: 'nowrap' }}>
            Trip progress
          </span>
          <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', background: T, borderRadius: 2, width: `${progressPct}%`, transition: 'width 1.2s cubic-bezier(0.4,0,0.2,1)' }} />
          </div>
          <span style={{ color: T_MID, fontSize: 12, fontWeight: 500 }}>{progressPct}%</span>
        </div>
      </div>

      {/* ── HERO CARD ──────────────────────────────────────────────── */}
      <div style={{
        margin: '20px 20px 0', background: 'white', borderRadius: 20,
        overflow: 'hidden', border: `1px solid ${BORDER}`,
        boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
      }}>
        <div style={{
          height: 140,
          background: `linear-gradient(135deg, ${DARK} 0%, #103040 55%, ${T} 100%)`,
          position: 'relative', display: 'flex', alignItems: 'flex-end', padding: 16, overflow: 'hidden',
        }}>
          {/* Subtle pattern overlay */}
          <div style={{
            position: 'absolute', inset: 0, opacity: 0.07,
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Ctext y='40' font-size='36'%3E✈%3C/text%3E%3C/svg%3E\")",
          }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>
              {tripStart ? tripStart.toLocaleDateString('en-CA', { weekday: 'long', month: 'long', day: 'numeric' }) : ''}
            </div>
            <div style={{ color: 'white', fontSize: 20, fontWeight: 600, lineHeight: 1.2 }}>
              {trip?.name || 'Your Trip'}
            </div>
          </div>
        </div>
        <div style={{ padding: '14px 18px', display: 'flex' }}>
          {[
            { val: totalHours, lbl: 'Duration' },
            { val: departTime, lbl: 'Depart' },
            { val: returnTime, lbl: 'Return' },
            { val: stops.length, lbl: 'Stops' },
          ].map((s, i) => (
            <div key={i} style={{ flex: 1, textAlign: 'center', borderLeft: i > 0 ? '1px solid #F0EBE3' : 'none' }}>
              <div style={{ fontSize: 16, fontWeight: 500, color: INK }}>{s.val}</div>
              <div style={{ fontSize: 10, color: MUTED, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 }}>{s.lbl}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── ALL DONE BANNER ────────────────────────────────────────── */}
      {allDone && (
        <div style={{
          margin: '16px 20px 0', background: '#E8F5E9',
          border: '1px solid rgba(0,105,92,0.2)', borderRadius: 14,
          padding: '14px 18px', textAlign: 'center',
        }}>
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

      {/* ── TIMELINE or FALLBACK ───────────────────────────────────── */}
      <div style={{ padding: '0 20px 24px' }}>
        {stops.length === 0 ? (
          trip?.itinerary ? (
            <div style={{
              background: 'white', borderRadius: 16, border: `1px solid ${BORDER}`,
              padding: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
            }}>
              <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13, color: INK, fontFamily: 'inherit', lineHeight: 1.75, margin: 0 }}>
                {trip.itinerary}
              </pre>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <span style={{ fontSize: 48, display: 'block', marginBottom: 12 }}>📋</span>
              <p style={{ fontWeight: 500, fontSize: 16, margin: 0 }}>In planning</p>
              <p style={{ fontSize: 12, color: MUTED, marginTop: 4 }}>
                Your coordinator is putting the schedule together.
              </p>
            </div>
          )
        ) : (
          stops.map((stop, idx) => {
            const isDrive    = stop.type === 'drive';
            const isChecked  = !!checked[stop.id];
            const isExpanded = !!expanded[stop.id];
            const isLast     = idx === stops.length - 1;

            return (
              <div key={stop.id} style={{ display: 'flex', gap: 14, marginTop: idx === 0 ? 0 : 4 }}>

                {/* Left: dot + connector line */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, width: 40 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 12,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, position: 'relative', zIndex: 1, flexShrink: 0,
                    transition: 'all 0.2s',
                    background:   isChecked ? FOREST : isDrive ? '#F0F0F0' : T_LIGHT,
                    border:       `1.5px solid ${isChecked ? FOREST : isDrive ? '#E0E0E0' : 'rgba(0,188,212,0.25)'}`,
                    color:        isChecked ? 'white' : undefined,
                    fontWeight:   isChecked ? 700 : undefined,
                  }}>
                    {isChecked ? '✓' : stop.emoji}
                  </div>
                  {!isLast && (
                    <div style={{ flex: 1, width: 2, background: '#EEE8E0', margin: '2px 0', minHeight: 16 }} />
                  )}
                </div>

                {/* Card */}
                <div
                  className="ivri-card"
                  onClick={() => setExpanded(prev => ({ ...prev, [stop.id]: !prev[stop.id] }))}
                  style={{
                    flex: 1, background: isDrive ? '#FAFAFA' : 'white',
                    borderRadius: 16, padding: '14px 16px',
                    border: `1px solid ${BORDER}`, marginBottom: 8,
                    transition: 'all 0.25s', cursor: 'pointer',
                  }}
                >
                  {/* Time + duration row */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ fontSize: 10, color: MUTED, fontWeight: 400, letterSpacing: 0.3 }}>
                      {stop.time}
                      <span style={{
                        display: 'inline-block', marginLeft: 4, fontSize: 10,
                        transition: 'transform 0.2s',
                        transform: isExpanded ? 'rotate(180deg)' : 'none',
                      }}>▾</span>
                    </span>
                    <span style={{
                      fontSize: 10, padding: '2px 8px', borderRadius: 8,
                      whiteSpace: 'nowrap', flexShrink: 0,
                      color: isDrive ? MUTED : T,
                      background: isDrive ? '#F0F0F0' : T_LIGHT,
                    }}>
                      {stop.duration}
                    </span>
                  </div>

                  {/* Stop name */}
                  <div style={{
                    fontSize: isDrive ? 13 : 14,
                    fontWeight: isDrive ? 400 : 500,
                    color: isDrive ? MUTED : INK,
                    lineHeight: 1.3, margin: '4px 0 0',
                  }}>
                    {stop.name}
                  </div>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div style={{ borderTop: '1px solid #F5F0EA', paddingTop: 10, marginTop: 10 }}>
                      {stop.activities.length > 0 && (
                        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {stop.activities.map((a, i) => (
                            <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: '#4A4A4A', lineHeight: 1.5 }}>
                              <span style={{ width: 5, height: 5, borderRadius: '50%', background: T, flexShrink: 0, marginTop: 5 }} />
                              {a}
                            </li>
                          ))}
                        </ul>
                      )}

                      {/* Mark as visited */}
                      {stop.checkable && (
                        <div
                          style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            marginTop: stop.activities.length > 0 ? 12 : 0,
                            paddingTop: stop.activities.length > 0 ? 10 : 0,
                            borderTop: stop.activities.length > 0 ? '1px solid #F5F0EA' : 'none',
                          }}
                          onClick={e => {
                            e.stopPropagation();
                            setChecked(prev => ({ ...prev, [stop.id]: !prev[stop.id] }));
                          }}
                        >
                          <div style={{
                            width: 22, height: 22, borderRadius: '50%', cursor: 'pointer',
                            border: isChecked ? 'none' : '1.5px solid #D5C8BA',
                            background: isChecked ? FOREST : 'white',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0, transition: 'all 0.2s',
                            color: 'white', fontSize: 12, fontWeight: 700,
                          }}>
                            {isChecked && '✓'}
                          </div>
                          <span style={{ fontSize: 12, color: MUTED }}>
                            {isChecked ? 'Marked as visited' : 'Mark as visited'}
                          </span>
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
        <div style={{
          margin: '0 20px 20px',
          background: `linear-gradient(135deg, ${DARK} 0%, #103040 100%)`,
          borderRadius: 16, padding: '18px 20px', color: 'white',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', right: 16, top: 12, fontSize: 40, opacity: 0.18 }}>💡</div>
          <div style={{ fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', opacity: 0.65, marginBottom: 8 }}>
            Important Info
          </div>
          <div style={{ fontSize: 13, lineHeight: 1.65, opacity: 0.9, fontWeight: 300, whiteSpace: 'pre-wrap' }}>
            {trip.customInfo}
          </div>
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
