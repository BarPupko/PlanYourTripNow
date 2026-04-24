import { useState, useRef, useCallback } from 'react';
import { X, Trash2, Loader2, ImagePlus, Link, Upload } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
import colors from '../utils/colors';

// Compress an image file to ~50% quality/size via Canvas
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
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Compression failed')), 'image/jpeg', 0.5);
    };
    img.onerror = reject;
    img.src = objectUrl;
  });

const BlogAdminModal = ({ post, onSave, onClose }) => {
  const [form, setForm] = useState({
    title: post?.title || '',
    excerpt: post?.excerpt || '',
    category: post?.category || '',
    content: post?.content || '',
    published: post?.published ?? false,
    images: post?.images || [],
  });
  const [imageTab, setImageTab] = useState('upload'); // 'upload' | 'link'
  const [urlInput, setUrlInput] = useState('');
  const [urlLabel, setUrlLabel] = useState('View photo');
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef(null);
  const contentRef = useRef(null);

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
        const url = await getDownloadURL(storageRef);
        urls.push(url);
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

  const handleDragOver = (e) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = () => setDragOver(false);

  const removeImage = (idx) =>
    setForm(p => ({ ...p, images: p.images.filter((_, i) => i !== idx) }));

  // Add URL to the gallery images array
  const addUrlToGallery = () => {
    const url = urlInput.trim();
    if (!url) return;
    setForm(p => ({ ...p, images: [...p.images, url] }));
    setUrlInput('');
  };

  // Insert an expandable image button marker into content at cursor position
  const insertImageButton = () => {
    const url = urlInput.trim();
    if (!url) return;
    const label = urlLabel.trim() || 'View photo';
    const marker = `[[IMG:${label}|${url}]]`;
    const ta = contentRef.current;
    if (ta) {
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const before = form.content.slice(0, start);
      const after = form.content.slice(end);
      const newContent = `${before}\n${marker}\n${after}`;
      setForm(p => ({ ...p, content: newContent }));
      // Restore focus after state update
      setTimeout(() => {
        ta.focus();
        ta.setSelectionRange(start + marker.length + 2, start + marker.length + 2);
      }, 0);
    } else {
      setForm(p => ({ ...p, content: p.content + `\n${marker}\n` }));
    }
    setUrlInput('');
    setUrlLabel('View photo');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(form);
    } catch (err) {
      console.error(err);
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
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

          {/* Excerpt */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Excerpt <span className="font-normal text-gray-400">(shown on blog card)</span>
            </label>
            <input
              type="text" value={form.excerpt}
              onChange={e => setForm(p => ({ ...p, excerpt: e.target.value }))}
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-[#00BCD4] focus:outline-none text-sm"
              placeholder="Short description for the blog card preview"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Category <span className="font-normal text-gray-400">(shown as badge on card)</span>
            </label>
            <select
              value={form.category}
              onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-[#00BCD4] focus:outline-none text-sm bg-white"
            >
              <option value="">Journal (default)</option>
              <option value="Field Notes">Field Notes</option>
              <option value="Guides">Guides</option>
              <option value="Craft">Craft</option>
              <option value="Stories">Stories</option>
            </select>
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Content *</label>
            <p className="text-xs text-gray-400 mb-1.5">
              Tip: Use the "Link" tab to insert expandable image buttons directly into the text.
            </p>
            <textarea
              ref={contentRef}
              required rows={8} value={form.content}
              onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-[#00BCD4] focus:outline-none text-sm font-mono resize-none"
              placeholder="Write your blog post content here…"
            />
          </div>

          {/* Images */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Images</label>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-3">
              {[
                { key: 'upload', label: 'Upload', icon: <Upload className="w-3.5 h-3.5" /> },
                { key: 'link',   label: 'Add by Link', icon: <Link className="w-3.5 h-3.5" /> },
              ].map(({ key, label, icon }) => (
                <button
                  key={key} type="button"
                  onClick={() => setImageTab(key)}
                  className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                    imageTab === key
                      ? 'border-[#00BCD4] text-[#00BCD4]'
                      : 'border-transparent text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {icon}{label}
                </button>
              ))}
            </div>

            {/* Upload tab */}
            {imageTab === 'upload' && (
              <>
                <div
                  onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                    dragOver ? 'border-[#00BCD4] bg-[#f0faf8]' : 'border-gray-200 hover:border-[#00BCD4] hover:bg-gray-50'
                  }`}
                >
                  <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden"
                    onChange={e => uploadImages(e.target.files)} />
                  {uploading ? (
                    <div className="flex flex-col items-center gap-2 text-gray-500">
                      <Loader2 className="w-8 h-8 animate-spin" style={{ color: colors.primary.teal }} />
                      <p className="text-sm">Uploading & compressing…</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <ImagePlus className="w-10 h-10" />
                      <p className="text-sm font-medium">Drag & drop images here, or click to browse</p>
                      <p className="text-xs">PNG, JPG, WebP · Auto-compressed to 50% size</p>
                    </div>
                  )}
                </div>
                {uploadError && <p className="mt-2 text-xs text-red-500">{uploadError}</p>}
              </>
            )}

            {/* Link tab */}
            {imageTab === 'link' && (
              <div className="space-y-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Image URL</label>
                  <input
                    type="url" value={urlInput}
                    onChange={e => setUrlInput(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-[#00BCD4] focus:outline-none text-sm"
                    placeholder="https://example.com/photo.jpg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Button label <span className="font-normal text-gray-400">(for inline content button)</span></label>
                  <input
                    type="text" value={urlLabel}
                    onChange={e => setUrlLabel(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-[#00BCD4] focus:outline-none text-sm"
                    placeholder="View photo"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button" onClick={addUrlToGallery} disabled={!urlInput.trim()}
                    className="flex-1 py-2 text-sm font-semibold border-2 rounded-lg transition-colors disabled:opacity-40"
                    style={{ borderColor: colors.primary.teal, color: colors.primary.teal }}
                  >
                    Add to gallery
                  </button>
                  <button
                    type="button" onClick={insertImageButton} disabled={!urlInput.trim()}
                    className="flex-1 py-2 text-sm font-semibold text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40"
                    style={{ backgroundColor: colors.primary.teal }}
                  >
                    Insert button in content
                  </button>
                </div>
                <p className="text-xs text-gray-400">
                  "Add to gallery" shows the image in the post header carousel.<br />
                  "Insert button" places a clickable expand button inside the text at your cursor.
                </p>
              </div>
            )}

            {/* Gallery thumbnails */}
            {form.images.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {form.images.map((url, i) => (
                  <div key={i} className="relative group rounded-lg overflow-hidden aspect-video bg-gray-100">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button" onClick={() => removeImage(i)}
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
              <p className="text-xs text-gray-400 mt-0.5">Published posts are visible on the public website</p>
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
    </div>
  );
};

export default BlogAdminModal;
