import { useState, useEffect, useRef } from 'react';
import { Globe, X } from 'lucide-react';
import colors from '../utils/colors';

// Singleton: the Google Translate script and element can only live once per page.
// We track global state outside the component so multiple mounts don't conflict.
let scriptLoaded = false;
let scriptLoading = false;
const pendingCallbacks = [];

function loadGoogleTranslateScript(onReady) {
  if (scriptLoaded && window.google?.translate?.TranslateElement) {
    onReady();
    return;
  }
  pendingCallbacks.push(onReady);
  if (scriptLoading) return;
  scriptLoading = true;

  window.googleTranslateElementInit = () => {
    scriptLoaded = true;
    scriptLoading = false;
    pendingCallbacks.forEach(cb => { try { cb(); } catch (_) {} });
    pendingCallbacks.length = 0;
  };

  const script = document.createElement('script');
  script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
  document.body.appendChild(script);
}

const TranslateButton = ({ compact = false, floating = false }) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const instanceId = useRef('gte_' + Math.random().toString(36).slice(2, 8));

  useEffect(() => {
    if (!open) return;

    const id = instanceId.current;

    const doInit = () => {
      const el = document.getElementById(id);
      if (!el || !window.google?.translate?.TranslateElement) return;
      el.innerHTML = '';
      try {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: 'auto',
            layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
            autoDisplay: false,
          },
          id
        );
      } catch (_) {}
    };

    loadGoogleTranslateScript(doInit);

    // If script already loaded before this mount, give React a tick to paint the div
    if (scriptLoaded) {
      setTimeout(doInit, 50);
    }
  }, [open]);

  const buttonStyle = floating
    ? {
        position: 'fixed', bottom: 24, right: 24, zIndex: 50,
        display: 'flex', alignItems: 'center', gap: 7,
        padding: '10px 18px',
        background: 'white',
        border: `2px solid ${colors.primary.teal}`,
        borderRadius: 50,
        color: colors.primary.teal,
        fontWeight: 700, fontSize: 13,
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
      }
    : {
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: compact ? '4px 10px' : '6px 14px',
        background: 'white',
        border: `1.5px solid ${colors.primary.teal}`,
        borderRadius: 50,
        color: colors.primary.teal,
        fontWeight: 700,
        fontSize: compact ? 11 : 13,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
      };

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: floating ? 'flex-end' : 'flex-start', gap: 8 }}>
      <button onClick={() => setOpen(v => !v)} style={buttonStyle}>
        <Globe style={{ width: compact ? 12 : 15, height: compact ? 12 : 15, flexShrink: 0 }} />
        {open ? 'Close' : 'Translate'}
        {open && !floating && <X style={{ width: 11, height: 11, marginLeft: 2 }} />}
      </button>

      {open && (
        <div
          style={{
            background: 'white',
            border: '1px solid #C6DFE4',
            borderRadius: 10,
            padding: '6px 10px',
            boxShadow: '0 6px 24px rgba(0,0,0,0.12)',
            minWidth: 180,
            ...(floating ? { position: 'fixed', bottom: 70, right: 24, zIndex: 50 } : {}),
          }}
        >
          <p style={{ fontSize: 11, color: '#78959D', marginBottom: 6, fontFamily: '"JetBrains Mono", monospace', letterSpacing: '0.06em' }}>
            SELECT LANGUAGE
          </p>
          <div id={instanceId.current} ref={containerRef} />
        </div>
      )}
    </div>
  );
};

export default TranslateButton;
