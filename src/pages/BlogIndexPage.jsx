import { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, X, Clock, Map, LayoutGrid, BookOpen, MapPin } from 'lucide-react';
import { getPublishedBlogPosts } from '../utils/firestoreUtils';
import BlogPostModal from '../components/BlogPostModal';
import colors from '../utils/colors';
import siteLogo from '../assets/site_logo.png';

const TEAL = colors.primary.teal;
const DARK = '#073944';

const KNOWN_LOCATIONS = {
  toronto:       { name: 'Toronto',        lat: 43.6532, lng: -79.3832 },
  niagara:       { name: 'Niagara Falls',  lat: 43.0962, lng: -79.0377 },
  quebec:        { name: 'Quebec City',    lat: 46.8139, lng: -71.2082 },
  'mont-tremblant': { name: 'Mont-Tremblant', lat: 46.1186, lng: -74.5961 },
  barrie:        { name: 'Barrie',         lat: 44.3894, lng: -79.6903 },
};

function detectLocation(post) {
  if (post.location === 'custom' && post.locationLat && post.locationLng && post.locationCustomName) {
    return 'custom:' + post.locationCustomName;
  }
  if (post.location && KNOWN_LOCATIONS[post.location]) return post.location;
  return null;
}

function getReadTime(post) {
  const words = (post.content || '')
    .replace(/<[^>]+>/g, '')
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

const PAGE_SIZE = 12;

const BlogIndexPage = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [readTimeFilter, setReadTimeFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [page, setPage] = useState(1);
  const [selectedPost, setSelectedPost] = useState(null);

  const mapRef = useRef(null);
  const leafletMapRef = useRef(null);
  const clustersForMapRef = useRef({});
  const customLocationsRef = useRef({});

  useEffect(() => {
    getPublishedBlogPosts()
      .then(setPosts)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => {
    const cats = new Set(posts.map(p => p.category).filter(Boolean));
    return ['all', ...Array.from(cats).sort()];
  }, [posts]);

  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      if (search) {
        const q = search.toLowerCase();
        const hay = [post.title, post.excerpt, post.category, post.author].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (categoryFilter !== 'all' && post.category !== categoryFilter) return false;
      const rt = getReadTime(post);
      if (readTimeFilter === 'quick' && rt > 4) return false;
      if (readTimeFilter === 'medium' && (rt < 5 || rt > 10)) return false;
      if (readTimeFilter === 'long' && rt <= 10) return false;
      if (locationFilter && detectLocation(post) !== locationFilter) return false;
      return true;
    });
  }, [posts, search, categoryFilter, readTimeFilter, locationFilter]);

  const locationClusters = useMemo(() => {
    const clusters = {};
    Object.keys(KNOWN_LOCATIONS).forEach(k => { clusters[k] = []; });
    posts.forEach(post => {
      const loc = detectLocation(post);
      if (loc) {
        if (!clusters[loc]) clusters[loc] = [];
        clusters[loc].push(post);
      }
    });
    return clusters;
  }, [posts]);

  const customLocations = useMemo(() => {
    const result = {};
    posts.forEach(post => {
      if (post.location === 'custom' && post.locationLat && post.locationLng && post.locationCustomName) {
        const key = 'custom:' + post.locationCustomName;
        if (!result[key]) result[key] = { name: post.locationCustomName, lat: Number(post.locationLat), lng: Number(post.locationLng) };
      }
    });
    return result;
  }, [posts]);

  // Keep refs so Leaflet callbacks (which close over stale state) can read latest data
  useEffect(() => { clustersForMapRef.current = locationClusters; }, [locationClusters]);
  useEffect(() => { customLocationsRef.current = customLocations; }, [customLocations]);

  useEffect(() => { setPage(1); }, [search, categoryFilter, readTimeFilter, locationFilter]);

  const noFilters = !search && categoryFilter === 'all' && readTimeFilter === 'all' && !locationFilter;
  const showFeatured = noFilters && filteredPosts.length > 0;
  const featuredPost = showFeatured ? filteredPosts[0] : null;
  const gridPosts = showFeatured ? filteredPosts.slice(1) : filteredPosts;
  const pagedGrid = gridPosts.slice(0, page * PAGE_SIZE);
  const hasMore = pagedGrid.length < gridPosts.length;

  // ── Leaflet map ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (viewMode !== 'map') return;

    // Inject Leaflet CSS once
    if (!document.querySelector('#leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    const renderMap = () => {
      if (!mapRef.current || !window.L) return;
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }

      const L = window.L;
      const map = L.map(mapRef.current, {
        center: [44.5, -79.5],
        zoom: 6,
        scrollWheelZoom: false,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
      }).addTo(map);

      const clusters = clustersForMapRef.current;

      const addPin = (key, loc, clusterPosts) => {
        const hasPosts = clusterPosts.length > 0;
        const pinSize = hasPosts ? 32 : 22;
        const pinIcon = L.divIcon({
          html: `<span style="font-size:${pinSize}px;line-height:1;display:block;filter:${hasPosts ? 'none' : 'grayscale(1) opacity(0.45)'}">📍</span>`,
          className: '',
          iconSize: [pinSize, pinSize],
          iconAnchor: [pinSize / 2, pinSize],
          popupAnchor: [0, -pinSize],
        });
        const marker = L.marker([loc.lat, loc.lng], { icon: pinIcon }).addTo(map);
        const safeKey = key.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
        const popupContent = hasPosts
          ? `<div style="font-family:sans-serif;min-width:150px">
              <div style="font-weight:700;font-size:14px;color:${DARK};margin-bottom:4px">${loc.name}</div>
              <div style="font-size:12px;color:#555;margin-bottom:8px">${clusterPosts.length} post${clusterPosts.length !== 1 ? 's' : ''}</div>
              <button onclick="window.__blogMapClick&&window.__blogMapClick('${safeKey}')"
                style="background:${TEAL};color:white;border:none;padding:5px 14px;border-radius:6px;font-size:12px;cursor:pointer;font-weight:600;width:100%"
              >View posts →</button>
            </div>`
          : `<div style="font-family:sans-serif;min-width:150px">
              <div style="font-weight:700;font-size:14px;color:${DARK};margin-bottom:4px">${loc.name}</div>
              <div style="font-size:12px;color:#78959D">No blog posts yet for this destination</div>
            </div>`;
        marker.bindPopup(popupContent);
      };

      // Preset locations (all 7, always shown)
      Object.entries(KNOWN_LOCATIONS).forEach(([key, loc]) => {
        addPin(key, loc, clusters[key] || []);
      });

      // Custom locations (only when posts exist for them)
      Object.entries(customLocationsRef.current).forEach(([key, loc]) => {
        addPin(key, loc, clusters[key] || []);
      });

      leafletMapRef.current = map;
    };

    window.__blogMapClick = (locationKey) => {
      setLocationFilter(locationKey);
      setViewMode('grid');
    };

    if (window.L) {
      setTimeout(renderMap, 60);
    } else if (!document.querySelector('#leaflet-js')) {
      const script = document.createElement('script');
      script.id = 'leaflet-js';
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => setTimeout(renderMap, 60);
      document.body.appendChild(script);
    } else {
      const poll = setInterval(() => {
        if (window.L) { clearInterval(poll); setTimeout(renderMap, 60); }
      }, 100);
      return () => clearInterval(poll);
    }

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
      delete window.__blogMapClick;
    };
  }, [viewMode]);
  // ─────────────────────────────────────────────────────────────────────────

  const activeClusters = Object.entries(locationClusters).filter(([, p]) => p.length > 0);

  return (
    <div className="min-h-screen" style={{ background: '#EAF6F8' }}>

      {/* Top bar */}
      <div style={{ background: DARK, height: 40, display: 'flex', alignItems: 'center', padding: '0 1.5rem' }}>
        <Link
          to="/"
          style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 500, textDecoration: 'none' }}
        >
          <ArrowLeft style={{ width: 15, height: 15 }} />
          Back to IVRITours
        </Link>
      </div>

      {/* Logo bar */}
      <div style={{ background: 'white', borderBottom: '1px solid #C6DFE4', padding: '0 1.5rem' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link to="/" style={{ lineHeight: 0 }}>
            <img src={siteLogo} alt="IVRITours" style={{ height: 52, width: 'auto' }} />
          </Link>
          <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#78959D' }}>
            Field Notes / Blog
          </span>
        </div>
      </div>

      {/* Hero */}
      <div style={{ background: DARK, padding: '3.5rem 1.5rem 3rem' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <p style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 10 }}>
            Journal / Field Notes
          </p>
          <h1 style={{ fontFamily: '"Fraunces", Georgia, serif', fontWeight: 350, fontSize: 'clamp(2rem, 5vw, 3.5rem)', color: '#EAF6F8', letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: 10 }}>
            Dispatches from the <em style={{ fontStyle: 'italic' }}>road.</em>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15, maxWidth: '50ch' }}>
            Stories, tips &amp; guides from our tours across Canada.
            {posts.length > 0 && ` ${posts.length} entries and counting.`}
          </p>
        </div>
      </div>

      {/* ── Sticky controls ── */}
      <div style={{ background: 'white', borderBottom: '1px solid #D9EBEE', padding: '0.75rem 1.5rem', position: 'sticky', top: 0, zIndex: 30, boxShadow: '0 2px 8px rgba(7,57,68,0.06)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>

          {/* Search */}
          <div style={{ position: 'relative', flex: '1 1 180px', maxWidth: 320 }}>
            <Search style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: '#78959D' }} />
            <input
              type="text"
              placeholder="Search posts…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '7px 32px', border: '1.5px solid #C6DFE4', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box', color: DARK }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#78959D', padding: 0, display: 'flex' }}>
                <X style={{ width: 13, height: 13 }} />
              </button>
            )}
          </div>

          {/* Category pills */}
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', flex: '1 1 auto' }}>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                style={{
                  padding: '4px 12px', borderRadius: 100, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                  border: `1.5px solid ${categoryFilter === cat ? TEAL : '#C6DFE4'}`,
                  background: categoryFilter === cat ? TEAL : 'transparent',
                  color: categoryFilter === cat ? 'white' : '#3E5F68',
                  transition: 'all 0.15s',
                }}
              >
                {cat === 'all' ? 'All categories' : cat}
              </button>
            ))}
          </div>

          {/* Read time filter */}
          <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexShrink: 0 }}>
            <Clock style={{ width: 13, height: 13, color: '#78959D' }} />
            {[
              { key: 'all',    label: 'Any' },
              { key: 'quick',  label: '< 5 min' },
              { key: 'medium', label: '5–10 min' },
              { key: 'long',   label: '10+ min' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setReadTimeFilter(key)}
                style={{
                  padding: '4px 9px', borderRadius: 6, fontSize: 11, cursor: 'pointer',
                  border: `1.5px solid ${readTimeFilter === key ? TEAL : '#C6DFE4'}`,
                  background: readTimeFilter === key ? '#EAF6F8' : 'transparent',
                  color: readTimeFilter === key ? TEAL : '#78959D',
                  fontWeight: readTimeFilter === key ? 700 : 400,
                  transition: 'all 0.15s',
                  whiteSpace: 'nowrap',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* View toggle + location chip */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginLeft: 'auto', flexShrink: 0 }}>
            {locationFilter && (
              <button
                onClick={() => setLocationFilter(null)}
                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 6, fontSize: 11, background: '#EAF6F8', color: TEAL, border: `1.5px solid ${TEAL}`, cursor: 'pointer', fontWeight: 700 }}
              >
                <MapPin style={{ width: 11, height: 11 }} />
                {KNOWN_LOCATIONS[locationFilter]?.name ?? locationFilter.replace(/^custom:/, '')}
                <X style={{ width: 11, height: 11 }} />
              </button>
            )}
            <button
              onClick={() => setViewMode('grid')}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer', border: `1.5px solid ${viewMode === 'grid' ? TEAL : '#C6DFE4'}`, background: viewMode === 'grid' ? TEAL : 'white', color: viewMode === 'grid' ? 'white' : '#3E5F68', fontWeight: 600, transition: 'all 0.15s' }}
            >
              <LayoutGrid style={{ width: 13, height: 13 }} /> Grid
            </button>
            <button
              onClick={() => setViewMode('map')}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer', border: `1.5px solid ${viewMode === 'map' ? TEAL : '#C6DFE4'}`, background: viewMode === 'map' ? TEAL : 'white', color: viewMode === 'map' ? 'white' : '#3E5F68', fontWeight: 600, transition: 'all 0.15s' }}
            >
              <Map style={{ width: 13, height: 13 }} /> Map
            </button>
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '2.5rem 1.5rem 4rem' }}>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '5rem' }}>
            <div className="inline-block w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${TEAL} transparent ${TEAL} ${TEAL}` }} />
          </div>

        ) : viewMode === 'map' ? (
          /* ── MAP VIEW ── */
          <div>
            <div
              ref={mapRef}
              style={{ height: 480, borderRadius: 16, overflow: 'hidden', border: '1px solid #C6DFE4', boxShadow: '0 4px 24px rgba(7,57,68,0.10)' }}
            />
            <p style={{ textAlign: 'center', color: '#78959D', fontSize: 12, marginTop: 10, fontFamily: '"JetBrains Mono", monospace', letterSpacing: '0.04em' }}>
              Click a marker to browse posts by location
            </p>

            {activeClusters.length > 0 && (
              <div style={{ marginTop: 36 }}>
                <p style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#78959D', marginBottom: 16 }}>
                  Browse by destination
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {activeClusters.map(([key, clusterPosts]) => (
                    <button
                      key={key}
                      onClick={() => { setLocationFilter(key); setViewMode('grid'); }}
                      className="hover:-translate-y-1"
                      style={{ background: 'white', borderRadius: 14, padding: '18px 20px', border: `1.5px solid ${locationFilter === key ? TEAL : '#D9EBEE'}`, cursor: 'pointer', textAlign: 'left', boxShadow: '0 2px 8px rgba(7,57,68,0.06)', transition: 'all 0.2s' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: TEAL, flexShrink: 0 }} />
                        <span style={{ fontFamily: '"Fraunces", Georgia, serif', fontSize: 16, fontWeight: 500, color: DARK }}>{KNOWN_LOCATIONS[key]?.name ?? key.replace(/^custom:/, '')}</span>
                      </div>
                      <span style={{ fontSize: 12, color: '#78959D', fontFamily: '"JetBrains Mono", monospace' }}>
                        {clusterPosts.length} post{clusterPosts.length !== 1 ? 's' : ''}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

        ) : filteredPosts.length === 0 ? (
          /* ── EMPTY STATE ── */
          <div style={{ textAlign: 'center', padding: '5rem 1rem' }}>
            <BookOpen style={{ width: 44, height: 44, margin: '0 auto 16px', color: '#C6DFE4' }} />
            <p style={{ fontSize: 17, color: '#3E5F68', marginBottom: 8 }}>No posts match your filters.</p>
            <button
              onClick={() => { setSearch(''); setCategoryFilter('all'); setReadTimeFilter('all'); setLocationFilter(null); }}
              style={{ marginTop: 8, padding: '9px 22px', background: TEAL, color: 'white', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}
            >
              Clear all filters
            </button>
          </div>

        ) : (
          /* ── GRID VIEW ── */
          <div>
            {/* Featured post */}
            {featuredPost && (
              <div
                onClick={() => setSelectedPost(featuredPost)}
                className="group blog-featured-grid"
                style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: 'white', borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 28px rgba(7,57,68,0.09)', border: '1px solid #D9EBEE', marginBottom: 40, cursor: 'pointer' }}
              >
                <div style={{ overflow: 'hidden', minHeight: 280, position: 'relative' }}>
                  {featuredPost.images?.[0] ? (
                    <img
                      src={featuredPost.images[0]}
                      alt={featuredPost.title}
                      className="group-hover:scale-105"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.55s', display: 'block' }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', minHeight: 280, background: '#C6DFE4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <BookOpen style={{ width: 48, height: 48, color: '#78959D' }} />
                    </div>
                  )}
                  {featuredPost.category && (
                    <span style={{ position: 'absolute', top: 16, left: 16, background: TEAL, color: 'white', fontSize: 10, padding: '4px 12px', borderRadius: 100, fontWeight: 700, fontFamily: '"JetBrains Mono", monospace', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      {featuredPost.category}
                    </span>
                  )}
                </div>
                <div style={{ padding: '40px 40px 40px 36px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <p style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#78959D', marginBottom: 14 }}>
                    Latest entry
                  </p>
                  <h2
                    className="group-hover:underline"
                    style={{ fontFamily: '"Fraunces", Georgia, serif', fontWeight: 500, fontSize: 'clamp(1.4rem, 2.5vw, 2rem)', color: DARK, lineHeight: 1.2, marginBottom: 14 }}
                  >
                    {featuredPost.title}
                  </h2>
                  {featuredPost.excerpt && (
                    <p style={{ color: '#3E5F68', fontSize: 15, lineHeight: 1.65, marginBottom: 20 }}>
                      {featuredPost.excerpt}
                    </p>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 12, color: '#78959D', flexWrap: 'wrap' }}>
                    {featuredPost.author && <span style={{ fontWeight: 600, color: '#3E5F68' }}>By {featuredPost.author}</span>}
                    {featuredPost.publishedAt && (
                      <span>{featuredPost.publishedAt.toDate?.().toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    )}
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Clock style={{ width: 11, height: 11 }} /> {getReadTime(featuredPost)} min read
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Post grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
              {pagedGrid.map(post => {
                const rt = getReadTime(post);
                const pubDate = post.publishedAt?.toDate?.();
                const postLoc = detectLocation(post);
                return (
                  <div
                    key={post.id}
                    onClick={() => setSelectedPost(post)}
                    className="group hover:-translate-y-1"
                    style={{ background: 'white', borderRadius: 16, overflow: 'hidden', boxShadow: '0 3px 16px rgba(7,57,68,0.07)', border: '1px solid #D9EBEE', cursor: 'pointer', display: 'flex', flexDirection: 'column', transition: 'all 0.25s' }}
                  >
                    <div style={{ aspectRatio: '16/9', overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
                      {post.images?.[0] ? (
                        <img src={post.images[0]} alt={post.title} className="group-hover:scale-105" style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', background: '#EAF6F8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <BookOpen style={{ width: 28, height: 28, color: '#C6DFE4' }} />
                        </div>
                      )}
                    </div>
                    <div style={{ padding: '16px 18px 18px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 9, flexWrap: 'wrap' }}>
                        {post.category && (
                          <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: TEAL, fontWeight: 700 }}>
                            {post.category}
                          </span>
                        )}
                        <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 9, color: '#78959D', display: 'flex', alignItems: 'center', gap: 3 }}>
                          <Clock style={{ width: 9, height: 9 }} /> {rt} min read
                        </span>
                        {postLoc && (
                          <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 9, color: '#78959D', display: 'flex', alignItems: 'center', gap: 3 }}>
                            <MapPin style={{ width: 9, height: 9 }} /> {KNOWN_LOCATIONS[postLoc]?.name ?? postLoc.replace(/^custom:/, '')}
                          </span>
                        )}
                      </div>
                      <h3
                        className="group-hover:underline"
                        style={{ fontFamily: '"Fraunces", Georgia, serif', fontSize: 18, fontWeight: 500, color: DARK, lineHeight: 1.3, marginBottom: 8, flex: 1 }}
                      >
                        {post.title}
                      </h3>
                      {post.excerpt && (
                        <p style={{ color: '#3E5F68', fontSize: 13, lineHeight: 1.6, marginBottom: 12 }} className="line-clamp-2">
                          {post.excerpt}
                        </p>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 10, borderTop: '1px solid #EAF6F8', fontSize: 12, color: '#78959D' }}>
                        {post.author
                          ? <span style={{ fontWeight: 500, color: '#3E5F68' }}>By {post.author}</span>
                          : <span />
                        }
                        {pubDate && <span>{pubDate.toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Load more */}
            {hasMore && (
              <div style={{ textAlign: 'center', marginTop: 48 }}>
                <button
                  onClick={() => setPage(p => p + 1)}
                  style={{ padding: '11px 32px', background: 'white', border: `2px solid ${TEAL}`, color: TEAL, borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
                >
                  Load more ({gridPosts.length - pagedGrid.length} remaining)
                </button>
              </div>
            )}

            <p style={{ textAlign: 'center', marginTop: 20, color: '#78959D', fontSize: 12, fontFamily: '"JetBrains Mono", monospace', letterSpacing: '0.04em' }}>
              {filteredPosts.length} post{filteredPosts.length !== 1 ? 's' : ''} total
              {!noFilters && ' (filtered)'}
            </p>
          </div>
        )}
      </div>

      {selectedPost && <BlogPostModal post={selectedPost} onClose={() => setSelectedPost(null)} />}

      <style>{`
        @media (max-width: 640px) {
          .blog-featured-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};

export default BlogIndexPage;
