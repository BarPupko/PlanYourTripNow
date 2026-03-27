import { useState, useRef } from 'react';
import { X, Upload, Download, Play, CheckCircle, AlertTriangle, Settings } from 'lucide-react';
import { collection, doc, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import colors from '../utils/colors';

// ── helpers ─────────────────────────────────────────────────────────────────

const parseFile = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try { resolve(JSON.parse(e.target.result)); }
      catch { reject(new Error('Invalid JSON file')); }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });

const downloadJSON = (data, filename) => {
  const json = JSON.stringify(data, firestoreReplacer, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 100);
};

// Recursively convert Firestore special types so JSON.stringify never chokes
const firestoreReplacer = (_key, value) => {
  if (value === null || value === undefined) return value;
  // Timestamp (has toDate method)
  if (typeof value?.toDate === 'function') return value.toDate().toISOString();
  // GeoPoint
  if (value?.constructor?.name === 'GeoPoint')
    return { _lat: value.latitude, _lng: value.longitude };
  // DocumentReference
  if (value?.constructor?.name === 'DocumentReference') return value.path;
  return value;
};

// ── component ────────────────────────────────────────────────────────────────

const MigrationModal = ({ onClose }) => {
  const [tab, setTab] = useState('export'); // 'export' | 'import'

  // shared checkbox state
  const [includeTrips, setIncludeTrips] = useState(true);
  const [includeRegistrations, setIncludeRegistrations] = useState(true);

  // import-only state
  const [tripsFile, setTripsFile] = useState(null);
  const [regsFile, setRegsFile] = useState(null);
  const [importMode, setImportMode] = useState('dry'); // 'dry' | 'live'
  const tripsInputRef = useRef();
  const regsInputRef = useRef();

  // shared running / results
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState(null);

  // ── Export ────────────────────────────────────────────────────────────────

  const runExport = async () => {
    setRunning(true);
    setResults(null);
    const log = [];
    let success = true;

    try {
      if (includeTrips) {
        const snap = await getDocs(collection(db, 'trips'));
        const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        const ts = new Date().toISOString().slice(0, 10);
        downloadJSON(docs, `trips_${ts}.json`);
        log.push(`✓ Exported ${docs.length} trip${docs.length !== 1 ? 's' : ''} → trips_${ts}.json`);
      }

      if (includeRegistrations) {
        const snap = await getDocs(collection(db, 'registrations'));
        const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        const ts = new Date().toISOString().slice(0, 10);
        downloadJSON(docs, `registrations_${ts}.json`);
        log.push(`✓ Exported ${docs.length} registration${docs.length !== 1 ? 's' : ''} → registrations_${ts}.json`);
      }

      if (log.length === 0) log.push('Nothing selected — enable at least one checkbox.');
    } catch (err) {
      log.push(`Error: ${err.message}`);
      success = false;
    }

    setResults({ success, log, action: 'export' });
    setRunning(false);
  };

  // ── Import ────────────────────────────────────────────────────────────────

  const importCollection = async (collectionName, file, isDry) => {
    const raw = await parseFile(file);
    const docs = Array.isArray(raw) ? raw : raw.docs ?? [];
    if (docs.length === 0) return { count: 0, warning: 'No documents found in file' };

    if (!isDry) {
      const chunkSize = 500;
      for (let i = 0; i < docs.length; i += chunkSize) {
        const batch = writeBatch(db);
        docs.slice(i, i + chunkSize).forEach((d) => {
          const { id, ...fields } = d;
          batch.set(doc(collection(db, collectionName), id), fields);
        });
        await batch.commit();
      }
    }

    return { count: docs.length };
  };

  const runImport = async () => {
    setRunning(true);
    setResults(null);
    const log = [];
    let success = true;
    const isDry = importMode === 'dry';

    try {
      if (includeTrips && tripsFile) {
        const res = await importCollection('trips', tripsFile, isDry);
        if (res.warning) log.push(`⚠ Trips: ${res.warning}`);
        else if (isDry) log.push(`[Dry Run] Would import ${res.count} trip${res.count !== 1 ? 's' : ''}`);
        else log.push(`✓ Imported ${res.count} trip${res.count !== 1 ? 's' : ''}`);
      }

      if (includeRegistrations && regsFile) {
        const res = await importCollection('registrations', regsFile, isDry);
        if (res.warning) log.push(`⚠ Registrations: ${res.warning}`);
        else if (isDry) log.push(`[Dry Run] Would import ${res.count} registration${res.count !== 1 ? 's' : ''}`);
        else log.push(`✓ Imported ${res.count} registration${res.count !== 1 ? 's' : ''}`);
      }

      if (log.length === 0) log.push('Nothing selected — enable checkboxes and choose files.');
    } catch (err) {
      log.push(`Error: ${err.message}`);
      success = false;
    }

    setResults({ success, log, action: isDry ? 'dry' : 'import' });
    setRunning(false);
  };

  // ── derived ───────────────────────────────────────────────────────────────

  const canExport = includeTrips || includeRegistrations;
  const canImport = (includeTrips && tripsFile) || (includeRegistrations && regsFile);

  const resetResults = () => setResults(null);

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Data Tools</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          {[
            { key: 'export', icon: Download, label: 'Export' },
            { key: 'import', icon: Upload,   label: 'Import' },
          ].map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => { setTab(key); resetResults(); }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === key
                  ? 'border-teal-500 text-teal-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        <div className="p-5 space-y-5">

          {/* ── Checkboxes (shared) ── */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              {tab === 'export' ? 'Select data to export' : 'Select data to import'}
            </h3>
            <div className="space-y-3">

              {/* Trips row */}
              <div className={`border rounded-xl p-4 transition-colors ${
                includeTrips ? 'border-teal-400 bg-teal-50' : 'border-gray-200 bg-gray-50'
              }`}>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeTrips}
                    onChange={(e) => { setIncludeTrips(e.target.checked); if (!e.target.checked) setTripsFile(null); }}
                    className="mt-0.5 w-4 h-4 rounded accent-teal-500"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-800">Trips</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {tab === 'export'
                        ? 'All trips from the trips collection'
                        : 'Firebase Console → Firestore → trips collection → Export'}
                    </div>
                  </div>
                </label>

                {/* File picker — import only */}
                {tab === 'import' && includeTrips && (
                  <div className="mt-3 flex items-center gap-2">
                    <input ref={tripsInputRef} type="file" accept=".json"
                      onChange={(e) => setTripsFile(e.target.files[0] || null)} className="hidden" />
                    <button
                      onClick={() => tripsInputRef.current.click()}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      {tripsFile ? tripsFile.name : 'No file chosen'}
                    </button>
                    {tripsFile && <span className="text-xs text-green-600 font-medium">✓ Ready</span>}
                  </div>
                )}
              </div>

              {/* Registrations row */}
              <div className={`border rounded-xl p-4 transition-colors ${
                includeRegistrations ? 'border-teal-400 bg-teal-50' : 'border-gray-200 bg-gray-50'
              }`}>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeRegistrations}
                    onChange={(e) => { setIncludeRegistrations(e.target.checked); if (!e.target.checked) setRegsFile(null); }}
                    className="mt-0.5 w-4 h-4 rounded accent-teal-500"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-800">Registrations</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {tab === 'export'
                        ? 'All registrations from the registrations collection'
                        : 'Optional — leave empty to import trips only.'}
                    </div>
                  </div>
                </label>

                {/* File picker — import only */}
                {tab === 'import' && includeRegistrations && (
                  <div className="mt-3 flex items-center gap-2">
                    <input ref={regsInputRef} type="file" accept=".json"
                      onChange={(e) => setRegsFile(e.target.files[0] || null)} className="hidden" />
                    <button
                      onClick={() => regsInputRef.current.click()}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      {regsFile ? regsFile.name : 'No file chosen'}
                    </button>
                    {regsFile && <span className="text-xs text-green-600 font-medium">✓ Ready</span>}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Import mode selector ── */}
          {tab === 'import' && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Mode</h3>
              <div className="flex gap-3">
                <label className={`flex-1 flex items-center gap-2 p-3 border rounded-xl cursor-pointer transition-colors ${
                  importMode === 'dry' ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                }`}>
                  <input type="radio" name="importMode" value="dry"
                    checked={importMode === 'dry'} onChange={() => setImportMode('dry')} className="accent-blue-500" />
                  <div>
                    <div className="text-sm font-medium text-gray-800">Dry Run</div>
                    <div className="text-xs text-gray-500">Preview only, no data will be written</div>
                  </div>
                </label>
                <label className={`flex-1 flex items-center gap-2 p-3 border rounded-xl cursor-pointer transition-colors ${
                  importMode === 'live' ? 'border-orange-400 bg-orange-50' : 'border-gray-200 hover:bg-gray-50'
                }`}>
                  <input type="radio" name="importMode" value="live"
                    checked={importMode === 'live'} onChange={() => setImportMode('live')} className="accent-orange-500" />
                  <div>
                    <div className="text-sm font-medium text-gray-800">Live Import</div>
                    <div className="text-xs text-gray-500">Write data to Firestore</div>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* ── Results ── */}
          {results && (
            <div className={`rounded-xl p-4 text-sm ${
              results.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              <div className="font-semibold mb-2 flex items-center gap-1.5">
                {results.success
                  ? <CheckCircle className="w-4 h-4 text-green-600" />
                  : <AlertTriangle className="w-4 h-4 text-red-600" />}
                {results.success
                  ? results.action === 'export' ? 'Export complete'
                    : results.action === 'dry' ? 'Dry run complete'
                    : 'Import complete'
                  : results.action === 'export' ? 'Export failed' : 'Import failed'}
              </div>
              <div className="space-y-0.5 text-gray-700">
                {results.log.map((line, i) => <div key={i}>{line}</div>)}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-5 border-t">
          <button onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            Close
          </button>

          {tab === 'export' ? (
            <button
              onClick={runExport}
              disabled={!canExport || running}
              className="flex items-center gap-2 px-5 py-2 text-sm text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: canExport && !running ? colors.primary.teal : '#9CA3AF' }}
            >
              <Download className="w-4 h-4" />
              {running ? 'Exporting…' : 'Export JSON'}
            </button>
          ) : (
            <button
              onClick={runImport}
              disabled={!canImport || running}
              className="flex items-center gap-2 px-5 py-2 text-sm text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: canImport && !running ? colors.primary.teal : '#9CA3AF' }}
            >
              <Play className="w-4 h-4" />
              {running ? 'Running…' : 'Run Migration'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MigrationModal;
