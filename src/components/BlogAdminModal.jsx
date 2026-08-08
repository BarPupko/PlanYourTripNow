import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Trash2, Loader2, ImagePlus, Upload, Bold, Italic, Underline, Strikethrough, List, ListOrdered, Quote, Minus, Link2 } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
import colors from '../utils/colors';

const compressImage = (file) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const maxDim = 1200;
      let w = img.naturalWidth;
      let h = img.naturalHeight;
      if (w > maxDim || h > maxDim) {
        if (w > h) { h = Math.round(h * maxDim / w); w = maxDim; }
        else { w = Math.round(w * maxDim / h); h = maxDim; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Compression failed')), 'image/jpeg', 0.5);
    };
    img.onerror = reject;
    img.src = objectUrl;
  });

const CATEGORIES = [
  { value: '', label: 'Journal (default)' },
  { value: 'Field Notes', label: 'Field Notes' },
  { value: 'Guides', label: 'Guides' },
  { value: 'Craft', label: 'Craft' },
  { value: 'Stories', label: 'Stories' },
];

const LOCATIONS = [
  { value: '', label: 'None' },
  { value: 'toronto', label: 'Toronto, ON' },
  { value: 'niagara', label: 'Niagara Falls, ON' },
  { value: 'quebec', label: 'Quebec City, QC' },
  { value: 'mont-tremblant', label: 'Mont-Tremblant, QC' },
  { value: 'barrie', label: 'Barrie, ON' },
  { value: 'custom', label: '📍 Custom location…' },
];

const BlogAdminModal = ({ post, authorName = '', onSave, onClose }) => {
  const [form, setForm] = useState({
    title: post?.title || '',
    author: post?.author || authorName,
    excerpt: post?.excerpt || '',
    category: post?.category || '',
    location: post?.location || '',
    locationCustomName: post?.locationCustomName || '',
    locationLat: post?.locationLat ? String(post.locationLat) : '',
    locationLng: post?.locationLng ? String(post.locationLng) : '',
    content: post?.content || '',
    published: post?.published ?? false,
    images: post?.images || [],
  });
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const fileInputRef = useRef(null);
  const editorRef = useRef(null);
  const savedRangeRef = useRef(null);
  const customMapContainerRef = useRef(null);
  const customLeafletMapRef = useRef(null);
  const customMarkerRef = useRef(null);

  // Set initial HTML content once on mount — don't re-sync from state to avoid fighting contentEditable
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = post?.content || '';
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Custom location map — init/destroy when location type changes
  useEffect(() => {
    if (form.location !== 'custom') {
      if (customLeafletMapRef.current) {
        customLeafletMapRef.current.remove();
        customLeafletMapRef.current = null;
        customMarkerRef.current = null;
      }
      return;
    }

    const ensureLeaflet = (cb) => {
      if (!document.querySelector('#leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }
      if (window.L) { setTimeout(cb, 60); return; }
      if (!document.querySelector('#leaflet-js')) {
        const s = document.createElement('script');
        s.id = 'leaflet-js';
        s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        s.onload = () => setTimeout(cb, 60);
        document.body.appendChild(s);
      } else {
        const poll = setInterval(() => { if (window.L) { clearInterval(poll); setTimeout(cb, 60); } }, 100);
        return () => clearInterval(poll);
      }
    };

    ensureLeaflet(() => {
      if (!customMapContainerRef.current || customLeafletMapRef.current) return;
      const L = window.L;
      const lat0 = form.locationLat ? Number(form.locationLat) : 45.5;
      const lng0 = form.locationLng ? Number(form.locationLng) : -75.0;
      const zoom0 = form.locationLat && form.locationLng ? 11 : 5;

      const map = L.map(customMapContainerRef.current, { center: [lat0, lng0], zoom: zoom0, scrollWheelZoom: true });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(map);

      const addOrMoveMarker = (lat, lng) => {
        if (customMarkerRef.current) {
          customMarkerRef.current.setLatLng([lat, lng]);
        } else {
          customMarkerRef.current = L.marker([lat, lng], { draggable: true }).addTo(map);
          customMarkerRef.current.on('dragend', (e) => {
            const p = e.target.getLatLng();
            setForm(prev => ({ ...prev, locationLat: p.lat.toFixed(6), locationLng: p.lng.toFixed(6) }));
          });
        }
      };

      if (form.locationLat && form.locationLng) addOrMoveMarker(lat0, lng0);

      map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        addOrMoveMarker(lat, lng);
        setForm(prev => ({ ...prev, locationLat: lat.toFixed(6), locationLng: lng.toFixed(6) }));
      });

      customLeafletMapRef.current = map;
    });

    return () => {
      if (customLeafletMapRef.current) {
        customLeafletMapRef.current.remove();
        customLeafletMapRef.current = null;
        customMarkerRef.current = null;
      }
    };
  }, [form.location]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync marker when lat/lng inputs change manually
  useEffect(() => {
    if (form.location !== 'custom' || !customLeafletMapRef.current || !window.L) return;
    const lat = Number(form.locationLat);
    const lng = Number(form.locationLng);
    if (!lat || !lng || isNaN(lat) || isNaN(lng)) return;
    const L = window.L;
    const map = customLeafletMapRef.current;
    if (customMarkerRef.current) {
      customMarkerRef.current.setLatLng([lat, lng]);
    } else {
      customMarkerRef.current = L.marker([lat, lng], { draggable: true }).addTo(map);
      customMarkerRef.current.on('dragend', (e) => {
        const p = e.target.getLatLng();
        setForm(prev => ({ ...prev, locationLat: p.lat.toFixed(6), locationLng: p.lng.toFixed(6) }));
      });
    }
  }, [form.locationLat, form.locationLng, form.location]);

  const handleEditorInput = () => {
    if (editorRef.current) {
      setForm(p => ({ ...p, content: editorRef.current.innerHTML }));
    }
  };

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel?.rangeCount > 0) savedRangeRef.current = sel.getRangeAt(0).cloneRange();
  };

  const restoreSelection = () => {
    if (savedRangeRef.current && editorRef.current) {
      editorRef.current.focus();
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(savedRangeRef.current);
    }
  };

  const execCmd = (cmd, value = null) => {
    document.execCommand(cmd, false, value);
    if (editorRef.current) setForm(p => ({ ...p, content: editorRef.current.innerHTML }));
  };

  const handleInsertLink = () => {
    restoreSelection();
    const url = linkUrl.trim();
    if (!url) return;
    const text = linkText.trim();
    if (text) {
      document.execCommand('insertHTML', false, `<a href="${url}" target="_blank" rel="noopener noreferrer">${text}</a>`);
    } else {
      document.execCommand('createLink', false, url);
      editorRef.current?.querySelectorAll('a:not([target])').forEach(a => {
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
      });
    }
    if (editorRef.current) setForm(p => ({ ...p, content: editorRef.current.innerHTML }));
    setLinkUrl('');
    setLinkText('');
    setShowLinkInput(false);
  };

  const uploadImages = async (files) => {
    if (!files?.length) return;
    setUploading(true);
    setUploadError('');
    try {
      const urls = [];
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue;
        const compressed = await compressImage(file);
        const storageRef = ref(storage, `blog/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`);
        await uploadBytes(storageRef, compressed);
        urls.push(await getDownloadURL(storageRef));
      }
      setForm(p => ({ ...p, images: [...p.images, ...urls] }));
    } catch (err) {
      console.error('Upload error:', err);
      setUploadError('Upload failed. Check your connection and try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    uploadImages(e.dataTransfer.files);
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    const plainText = (editorRef.current?.innerHTML || form.content).replace(/<[^>]*>/g, '').trim();
    if (!plainText) {
      alert('Please write some content for the post before saving.');
      editorRef.current?.focus();
      return;
    }
    setSaving(true);
    try {
      await onSave(form);
    } catch (err) {
      console.error(err);
      setSaving(false);
    }
  };

  // Toolbar button — onMouseDown with preventDefault so editor doesn't lose focus/selection
  const ToolBtn = ({ cmd, value, title, children }) => (
    <button
      type="button"
      title={title}
      onMouseDown={e => { e.preventDefault(); execCmd(cmd, value); }}
      className="p-1.5 rounded-md text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition-colors select-none"
    >
      {children}
    </button>
  );

  const Divider = () => <span className="w-px h-5 bg-gray-300 mx-1 self-center" />;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">

        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b sticky top-0 bg-white rounded-t-2xl z-10">
          <h2 className="text-lg font-bold text-gray-900">{post ? 'Edit Post' : 'New Blog Post'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-5">

          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Title *</label>
            <input
              type="text" required value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-[#00BCD4] focus:outline-none text-sm"
              placeholder="Post title"
            />
          </div>

          {/* Author */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Author <span className="font-normal text-gray-400">(who wrote this article)</span>
            </label>
            <input
              type="text" value={form.author}
              onChange={e => setForm(p => ({ ...p, author: e.target.value }))}
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-[#00BCD4] focus:outline-none text-sm"
              placeholder="Author name"
            />
          </div>

          {/* Short description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Short description <span className="font-normal text-gray-400">(shown on the blog card)</span>
            </label>
            <input
              type="text" value={form.excerpt}
              onChange={e => setForm(p => ({ ...p, excerpt: e.target.value }))}
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-[#00BCD4] focus:outline-none text-sm"
              placeholder="A sentence or two about this post…"
            />
          </div>

          {/* Category + Location row */}
          <div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Category <span className="font-normal text-gray-400">(badge)</span>
                </label>
                <select
                  value={form.category}
                  onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-[#00BCD4] focus:outline-none text-sm bg-white"
                >
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Location <span className="font-normal text-gray-400">(pins on map)</span>
                </label>
                <select
                  value={form.location}
                  onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-[#00BCD4] focus:outline-none text-sm bg-white"
                >
                  {LOCATIONS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
              </div>
            </div>

            {/* Custom location panel */}
            {form.location === 'custom' && (
              <div style={{ marginTop: 12, padding: 14, background: '#f8fbfc', borderRadius: 12, border: '1.5px solid #C6DFE4' }}>
                <div className="mb-3">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Location name</label>
                  <input
                    type="text"
                    value={form.locationCustomName}
                    onChange={e => setForm(p => ({ ...p, locationCustomName: e.target.value }))}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-[#00BCD4] focus:outline-none text-sm"
                    placeholder="e.g. Algonquin Park"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Latitude</label>
                    <input
                      type="number" step="any"
                      value={form.locationLat}
                      onChange={e => setForm(p => ({ ...p, locationLat: e.target.value }))}
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-[#00BCD4] focus:outline-none text-sm"
                      placeholder="e.g. 45.5017"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Longitude</label>
                    <input
                      type="number" step="any"
                      value={form.locationLng}
                      onChange={e => setForm(p => ({ ...p, locationLng: e.target.value }))}
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-[#00BCD4] focus:outline-none text-sm"
                      placeholder="e.g. -73.5673"
                    />
                  </div>
                </div>
                <p style={{ fontSize: 11, color: '#78959D', marginBottom: 8, fontFamily: '"JetBrains Mono", monospace', letterSpacing: '0.06em' }}>
                  OR CLICK ON THE MAP TO DROP A PIN
                </p>
                <div
                  ref={customMapContainerRef}
                  style={{ height: 260, borderRadius: 8, overflow: 'hidden', border: '1px solid #C6DFE4' }}
                />
              </div>
            )}
          </div>

          {/* ── Rich text editor ── */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Content *</label>

            {/* Toolbar */}
            <div className="border-2 border-b-0 border-gray-200 rounded-t-xl bg-gray-50 px-2 py-1.5 flex flex-wrap items-center gap-0.5">

              {/* Paragraph style */}
              <button
                type="button" title="Normal paragraph"
                onMouseDown={e => { e.preventDefault(); execCmd('formatBlock', 'p'); }}
                className="px-2 py-1 rounded-md text-xs font-medium text-gray-600 hover:bg-gray-200 transition-colors select-none"
              >¶ Normal</button>
              <button
                type="button" title="Large heading"
                onMouseDown={e => { e.preventDefault(); execCmd('formatBlock', 'h2'); }}
                className="px-2 py-1 rounded-md text-sm font-bold text-gray-700 hover:bg-gray-200 transition-colors select-none"
              >H1</button>
              <button
                type="button" title="Small heading"
                onMouseDown={e => { e.preventDefault(); execCmd('formatBlock', 'h3'); }}
                className="px-2 py-1 rounded-md text-xs font-bold text-gray-700 hover:bg-gray-200 transition-colors select-none"
              >H2</button>

              <Divider />

              {/* Text style */}
              <ToolBtn cmd="bold" title="Bold (Ctrl+B)"><Bold className="w-4 h-4" /></ToolBtn>
              <ToolBtn cmd="italic" title="Italic (Ctrl+I)"><Italic className="w-4 h-4" /></ToolBtn>
              <ToolBtn cmd="underline" title="Underline (Ctrl+U)"><Underline className="w-4 h-4" /></ToolBtn>
              <ToolBtn cmd="strikeThrough" title="Strikethrough"><Strikethrough className="w-4 h-4" /></ToolBtn>

              <Divider />

              {/* Lists & quote */}
              <ToolBtn cmd="insertUnorderedList" title="Bullet list"><List className="w-4 h-4" /></ToolBtn>
              <ToolBtn cmd="insertOrderedList" title="Numbered list"><ListOrdered className="w-4 h-4" /></ToolBtn>
              <ToolBtn cmd="formatBlock" value="blockquote" title="Quote / highlight block"><Quote className="w-4 h-4" /></ToolBtn>

              <Divider />

              {/* Misc */}
              <ToolBtn cmd="insertHorizontalRule" title="Insert horizontal divider line"><Minus className="w-4 h-4" /></ToolBtn>
              <button
                type="button" title="Insert a hyperlink"
                onMouseDown={e => { e.preventDefault(); saveSelection(); setShowLinkInput(v => !v); }}
                className={`p-1.5 rounded-md transition-colors select-none ${showLinkInput ? 'bg-teal-100 text-teal-700' : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'}`}
              >
                <Link2 className="w-4 h-4" />
              </button>
            </div>

            {/* Link input panel */}
            {showLinkInput && (
              <div className="border-2 border-b-0 border-gray-200 bg-teal-50 px-3 py-2.5 flex flex-wrap gap-2 items-center">
                <input
                  type="text"
                  placeholder="Link text (leave blank to link selected text)"
                  value={linkText}
                  onChange={e => setLinkText(e.target.value)}
                  className="flex-1 min-w-36 px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#00BCD4] bg-white"
                />
                <input
                  type="url"
                  placeholder="https://…"
                  value={linkUrl}
                  onChange={e => setLinkUrl(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleInsertLink(); } }}
                  className="flex-1 min-w-36 px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#00BCD4] bg-white"
                />
                <button
                  type="button" onClick={handleInsertLink} disabled={!linkUrl.trim()}
                  className="px-3 py-1.5 text-xs font-semibold text-white rounded-lg disabled:opacity-40 transition-opacity"
                  style={{ backgroundColor: colors.primary.teal }}
                >Insert</button>
                <button type="button" onClick={() => setShowLinkInput(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* ContentEditable editor */}
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              onInput={handleEditorInput}
              className="rich-editor w-full min-h-[260px] px-4 py-3 border-2 border-gray-200 rounded-b-xl focus:border-[#00BCD4] focus:outline-none text-sm leading-relaxed"
              data-placeholder="Start writing your post here…"
            />

            <p className="mt-1.5 text-xs text-gray-400">
              Select text then click a button to format it. Ctrl+B = bold · Ctrl+I = italic · Ctrl+U = underline.
            </p>
          </div>

          {/* Images */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Post Photos <span className="font-normal text-gray-400">(shown at the top of the post)</span>
            </label>
            <div
              onDrop={handleDrop}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                dragOver ? 'border-[#00BCD4] bg-[#f0faf8]' : 'border-gray-200 hover:border-[#00BCD4] hover:bg-gray-50'
              }`}
            >
              <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden"
                onChange={e => uploadImages(e.target.files)} />
              {uploading ? (
                <div className="flex flex-col items-center gap-2 text-gray-500">
                  <Loader2 className="w-7 h-7 animate-spin" style={{ color: colors.primary.teal }} />
                  <p className="text-sm">Uploading & compressing…</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-gray-400">
                  <ImagePlus className="w-9 h-9" />
                  <p className="text-sm font-medium">Drag & drop photos here, or click to choose</p>
                  <p className="text-xs">PNG, JPG, WebP · Auto-compressed</p>
                </div>
              )}
            </div>
            {uploadError && <p className="mt-2 text-xs text-red-500">{uploadError}</p>}

            {form.images.length > 0 && (
              <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-2">
                {form.images.map((url, i) => (
                  <div key={i} className="relative group rounded-lg overflow-hidden aspect-video bg-gray-100">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    {i === 0 && (
                      <span className="absolute bottom-1 left-1 text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded-full font-semibold">Cover</span>
                    )}
                    <button
                      type="button" onClick={() => setForm(p => ({ ...p, images: p.images.filter((_, j) => j !== i) }))}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Publish toggle */}
          <div className="flex items-center justify-between py-3 border-t">
            <div>
              <p className="text-sm font-semibold text-gray-700">Published</p>
              <p className="text-xs text-gray-400 mt-0.5">Visible on the website when turned on</p>
            </div>
            <button
              type="button"
              onClick={() => setForm(p => ({ ...p, published: !p.published }))}
              className="relative w-12 h-6 rounded-full transition-colors flex-shrink-0"
              style={{ backgroundColor: form.published ? colors.primary.teal : '#D1D5DB' }}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.published ? 'translate-x-6' : ''}`} />
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 border-2 border-gray-200 rounded-xl text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving || uploading}
              className="flex-1 py-2.5 text-white rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
              style={{ backgroundColor: colors.primary.teal }}>
              {saving ? 'Saving…' : post ? 'Update Post' : 'Create Post'}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .rich-editor { color: #374151; }
        .rich-editor:empty::before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
          display: block;
        }
        .rich-editor h2 { font-size: 1.3rem; font-weight: 700; margin: 1rem 0 0.4rem; color: #111827; }
        .rich-editor h3 { font-size: 1.05rem; font-weight: 700; margin: 0.75rem 0 0.3rem; color: #111827; }
        .rich-editor p { margin: 0.3rem 0; }
        .rich-editor ul { list-style-type: disc; padding-left: 1.5rem; margin: 0.5rem 0; }
        .rich-editor ol { list-style-type: decimal; padding-left: 1.5rem; margin: 0.5rem 0; }
        .rich-editor li { margin: 0.15rem 0; }
        .rich-editor blockquote {
          border-left: 3px solid #00BCD4;
          padding-left: 1rem;
          margin: 0.75rem 0;
          color: #6b7280;
          font-style: italic;
          background: #f0faf8;
          border-radius: 0 6px 6px 0;
          padding-top: 0.4rem;
          padding-bottom: 0.4rem;
        }
        .rich-editor hr { border: none; border-top: 1px solid #e5e7eb; margin: 1rem 0; }
        .rich-editor a { color: #00BCD4; text-decoration: underline; }
        .rich-editor strong, .rich-editor b { font-weight: 700; }
        .rich-editor em, .rich-editor i { font-style: italic; }
        .rich-editor u { text-decoration: underline; }
        .rich-editor s, .rich-editor strike { text-decoration: line-through; }
      `}</style>
    </div>
  );
};

export default BlogAdminModal;
