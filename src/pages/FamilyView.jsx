import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabase.js';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, TouchSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy, sortableKeyboardCoordinates, useSortable, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import LeafLogo from '../components/shared/LeafLogo.jsx';

const CATEGORIES = {
  Furniture:    { color: 'bg-amber-100 text-amber-800',   bg: '#7A5C3A' },
  Art:          { color: 'bg-teal-100 text-teal-800',     bg: '#2D6B7F' },
  Jewellery:    { color: 'bg-purple-100 text-purple-800', bg: '#6B4C8B' },
  Collectibles: { color: 'bg-green-100 text-green-800',   bg: '#3D6B4A' },
  Tools:        { color: 'bg-orange-100 text-orange-800', bg: '#8B5A2B' },
  Other:        { color: 'bg-gray-100 text-gray-700',     bg: '#8A7F72' },
};

export default function FamilyView() {
  const { shareToken } = useParams();
  const [estate,   setEstate]   = useState(null);
  const [items,    setItems]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [notFound, setNotFound] = useState(false);

  // UI state
  const [mobileTab,      setMobileTab]      = useState('gallery');
  const [selectedItem,   setSelectedItem]   = useState(null);
  const [showSubmit,     setShowSubmit]     = useState(false);
  const [submitted,      setSubmitted]      = useState(false);
  const [submittedData,  setSubmittedData]  = useState(null);
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  // Filters
  const [roomFilter, setRoomFilter]     = useState('All');
  const [catFilter,  setCatFilter]      = useState('All');

  // Wishlist (client-side)
  const [wishlist, setWishlist] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`hw-${shareToken}`) || '[]'); } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem(`hw-${shareToken}`, JSON.stringify(wishlist));
  }, [wishlist, shareToken]);

  useEffect(() => { fetchData(); }, [shareToken]);

  async function fetchData() {
    const { data: estateData } = await supabase
      .from('estates')
      .select('*')
      .eq('share_token', shareToken)
      .eq('status', 'active')
      .single();

    if (!estateData) { setNotFound(true); setLoading(false); return; }
    setEstate(estateData);

    const { data: itemsData } = await supabase
      .from('items')
      .select('*')
      .eq('estate_id', estateData.id)
      .order('display_order')
      .order('created_at');

    setItems(itemsData || []);
    setLoading(false);
  }

  function isInWishlist(id) { return wishlist.some((w) => w.id === id); }

  function addToWishlist(item) {
    if (isInWishlist(item.id)) return;
    setWishlist((prev) => [...prev, { id: item.id, name: item.name, category: item.category, room: item.room, photo_url: item.photo_url }]);
  }

  function removeFromWishlist(id) { setWishlist((prev) => prev.filter((w) => w.id !== id)); }

  function reorderWishlist(activeId, overId) {
    setWishlist((prev) => {
      const oldIdx = prev.findIndex((w) => w.id === activeId);
      const newIdx = prev.findIndex((w) => w.id === overId);
      return arrayMove(prev, oldIdx, newIdx);
    });
  }

  async function handleSubmit(name, email) {
    // Insert submission
    const { data: sub, error: subErr } = await supabase
      .from('submissions')
      .insert({ estate_id: estate.id, family_name: name, family_email: email || null })
      .select()
      .single();

    if (subErr || !sub) return false;

    // Insert wishlist items
    const wlRows = wishlist.map((item, idx) => ({
      submission_id: sub.id,
      item_id:       item.id,
      rank_position: idx + 1,
    }));

    const { error: wlErr } = await supabase.from('wishlist_items').insert(wlRows);
    if (wlErr) return false;

    setSubmittedData({ name, wishlist: [...wishlist] });
    setWishlist([]);
    localStorage.removeItem(`hw-${shareToken}`);
    setSubmitted(true);
    return true;
  }

  // Derived
  const rooms      = ['All', ...new Set(items.map((i) => i.room).filter(Boolean))];
  const categories = ['All', ...Object.keys(CATEGORIES)];
  const filtered   = items.filter((i) => {
    if (roomFilter !== 'All' && i.room !== roomFilter) return false;
    if (catFilter  !== 'All' && i.category !== catFilter) return false;
    return true;
  });

  if (loading) return <LoadingScreen />;
  if (notFound) return <NotFound />;
  if (submitted) return <SuccessScreen data={submittedData} />;

  return (
    <div className="min-h-screen flex flex-col bg-cream">
      {/* Header */}
      <header className="bg-navy text-white shadow-md sticky top-0 z-30">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <LeafLogo size={28} />
            <div>
              <p className="font-serif text-xl font-semibold leading-tight">Heirloom</p>
              <p className="text-gold text-sm font-medium opacity-90 leading-tight">{estate.name}</p>
            </div>
          </div>
          <div className="hidden lg:flex items-center gap-4">
            <button onClick={() => setShowHowItWorks(true)} className="text-white/60 hover:text-white text-sm font-medium flex items-center gap-1.5 transition-colors">
              <QuestionIcon /> How it works
            </button>
            <div className="flex items-center gap-2 text-base text-white/70">
              <span>Wishlist</span>
              {wishlist.length > 0 && (
                <span className="bg-gold text-navy text-sm font-bold rounded-full w-6 h-6 flex items-center justify-center">{wishlist.length}</span>
              )}
            </div>
          </div>
          <div className="flex lg:hidden items-center gap-2">
            <button onClick={() => setShowHowItWorks(true)} className="text-white/50 hover:text-white p-1"><QuestionIcon /></button>
            <div className="flex rounded-lg overflow-hidden border border-white/20">
              {['gallery', 'wishlist'].map((t) => (
                <button key={t} onClick={() => setMobileTab(t)}
                  className={`px-3 py-2 text-sm font-medium capitalize transition-colors ${mobileTab === t ? 'bg-gold text-navy' : 'text-white/80 hover:bg-white/10'}`}>
                  {t}{t === 'wishlist' && wishlist.length > 0 && ` (${wishlist.length})`}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Desktop layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Gallery */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-6">
            <p className="text-navy/70 text-base leading-relaxed mb-5 max-w-2xl">{estate.welcome_message}</p>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-4">
              <FilterPills label="Room" options={rooms} value={roomFilter} onChange={setRoomFilter} />
              <FilterPills label="Category" options={categories} value={catFilter} onChange={setCatFilter} />
            </div>
            <p className="text-sm text-navy/40 mb-4">{filtered.length} of {items.length} items</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  inWishlist={isInWishlist(item.id)}
                  onAdd={() => addToWishlist(item)}
                  onRemove={() => removeFromWishlist(item.id)}
                  onClick={() => setSelectedItem(item)}
                />
              ))}
            </div>
          </div>
        </main>

        {/* Wishlist panel — desktop */}
        <aside className="hidden lg:flex flex-col w-80 xl:w-96 border-l border-cream-dark bg-white overflow-hidden">
          <WishlistPanel
            wishlist={wishlist}
            onRemove={removeFromWishlist}
            onReorder={reorderWishlist}
            onSubmit={() => setShowSubmit(true)}
          />
        </aside>
      </div>

      {/* Mobile wishlist */}
      {mobileTab === 'wishlist' && (
        <div className="fixed inset-0 z-40 bg-white flex flex-col lg:hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-cream-dark">
            <h2 className="font-serif text-lg text-navy font-semibold">Your Wishlist</h2>
            <button onClick={() => setMobileTab('gallery')} className="text-navy/60 text-sm font-medium">← Gallery</button>
          </div>
          <div className="flex-1 overflow-hidden">
            <WishlistPanel wishlist={wishlist} onRemove={removeFromWishlist} onReorder={reorderWishlist} onSubmit={() => { setShowSubmit(true); setMobileTab('gallery'); }} />
          </div>
        </div>
      )}

      {/* Modals */}
      {selectedItem && (
        <ItemModal item={selectedItem} inWishlist={isInWishlist(selectedItem.id)} onAdd={() => addToWishlist(selectedItem)} onRemove={() => removeFromWishlist(selectedItem.id)} onClose={() => setSelectedItem(null)} />
      )}
      {showSubmit && (
        <SubmitModal wishlist={wishlist} onSubmit={handleSubmit} onClose={() => setShowSubmit(false)} />
      )}
      {showHowItWorks && <HowItWorksModal onClose={() => setShowHowItWorks(false)} />}
    </div>
  );
}

// ── Item Card ────────────────────────────────────────────────────────────────
function ItemCard({ item, inWishlist, onAdd, onRemove, onClick }) {
  const [imgError, setImgError] = useState(false);
  const cat = CATEGORIES[item.category] || CATEGORIES.Other;
  return (
    <div onClick={onClick} className="group bg-white rounded-xl shadow-card hover:shadow-md transition-shadow cursor-pointer overflow-hidden border border-cream-dark">
      <div className="relative aspect-[4/3] overflow-hidden">
        {item.photo_url && !imgError ? (
          <img src={item.photo_url} alt={item.name} onError={() => setImgError(true)} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: cat.bg }}>
            <span className="text-white/70 font-serif text-3xl font-semibold select-none">{item.name.slice(0, 2).toUpperCase()}</span>
          </div>
        )}
        <button onClick={(e) => { e.stopPropagation(); inWishlist ? onRemove() : onAdd(); }}
          className={`absolute top-2 right-2 w-10 h-10 rounded-full flex items-center justify-center shadow transition-all ${inWishlist ? 'bg-gold text-navy' : 'bg-white/90 text-navy/50 hover:bg-gold hover:text-navy'}`}>
          <HeartIcon filled={inWishlist} />
        </button>
      </div>
      <div className="p-4">
        <h3 className="font-serif text-base font-semibold text-navy leading-snug line-clamp-2 mb-2">{item.name}</h3>
        <div className="flex items-center justify-between gap-2">
          <span className={`text-sm font-medium px-2.5 py-1 rounded-full ${cat.color}`}>{item.category}</span>
          {item.room && <span className="text-sm text-navy/40 truncate">{item.room}</span>}
        </div>
        {item.estimated_value && <p className="text-sm text-navy/50 mt-2 font-medium">{item.estimated_value}</p>}
      </div>
    </div>
  );
}

// ── Item Modal ───────────────────────────────────────────────────────────────
function ItemModal({ item, inWishlist, onAdd, onRemove, onClose }) {
  const [imgError, setImgError] = useState(false);
  const cat = CATEGORIES[item.category] || CATEGORIES.Other;
  useEffect(() => {
    const h = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', h);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', h); document.body.style.overflow = ''; };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-modal max-w-lg w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="relative aspect-video bg-cream-dark">
          {item.photo_url && !imgError ? (
            <img src={item.photo_url} alt={item.name} onError={() => setImgError(true)} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: cat.bg }}>
              <span className="text-white/60 font-serif text-5xl font-semibold">{item.name.slice(0, 2).toUpperCase()}</span>
            </div>
          )}
          <button onClick={onClose} className="absolute top-3 right-3 bg-white/90 rounded-full w-10 h-10 flex items-center justify-center shadow text-navy/70">✕</button>
        </div>
        <div className="p-6">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <h2 className="font-serif text-2xl font-semibold text-navy mb-2">{item.name}</h2>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-sm font-medium px-3 py-1 rounded-full ${cat.color}`}>{item.category}</span>
                {item.room && <span className="text-sm text-navy/40">{item.room}</span>}
              </div>
            </div>
            {item.estimated_value && (
              <div className="text-right shrink-0">
                <p className="text-sm text-navy/40 font-medium uppercase tracking-wide">Est. Value</p>
                <p className="text-base font-semibold text-navy">{item.estimated_value}</p>
              </div>
            )}
          </div>
          {item.description && <p className="text-base text-navy/70 leading-relaxed mb-3">{item.description}</p>}
          {item.dimensions && (
            <div className="flex items-center gap-2 mb-4 px-3 py-2.5 bg-cream rounded-xl">
              <span className="text-xs font-semibold text-navy/50 uppercase tracking-wide">Dimensions</span>
              <span className="text-sm text-navy font-medium">{item.dimensions}</span>
            </div>
          )}
          <button onClick={inWishlist ? onRemove : onAdd}
            className={`w-full py-3 rounded-xl font-semibold text-base transition-all ${inWishlist ? 'bg-cream-dark text-navy border border-navy/20 hover:bg-red-50 hover:text-red-600' : 'bg-navy text-white hover:bg-navy-light'}`}>
            {inWishlist ? '✓ On Your Wishlist — Click to Remove' : '+ Add to Wishlist'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Wishlist Panel ───────────────────────────────────────────────────────────
function WishlistPanel({ wishlist, onRemove, onReorder, onSubmit }) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor,   { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  function handleDragEnd({ active, over }) {
    if (over && active.id !== over.id) onReorder(active.id, over.id);
  }
  return (
    <div className="flex flex-col h-full">
      <div className="px-5 py-4 border-b border-cream-dark">
        <h2 className="font-serif text-xl font-semibold text-navy">Your Wishlist</h2>
        <p className="text-sm text-navy/50 mt-0.5">{wishlist.length === 0 ? 'Add items from the gallery' : `${wishlist.length} item${wishlist.length !== 1 ? 's' : ''} — drag to rank`}</p>
      </div>
      <div className="flex-1 overflow-y-auto wishlist-scroll px-4 py-4">
        {wishlist.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-14 h-14 rounded-full bg-cream-dark flex items-center justify-center mb-4">
              <HeartIcon filled={false} size={24} color="#C9A84C" />
            </div>
            <p className="text-base font-serif font-semibold text-navy/60 mb-1">Nothing here yet</p>
            <p className="text-sm text-navy/40">Click the heart on any item to add it.</p>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={wishlist.map((w) => w.id)} strategy={verticalListSortingStrategy}>
              <div className="flex flex-col gap-3">
                {wishlist.map((item, idx) => <SortableWishlistItem key={item.id} item={item} rank={idx + 1} onRemove={onRemove} />)}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
      {wishlist.length > 1 && <p className="text-sm text-navy/40 text-center px-4 py-2 border-t border-cream-dark">Item #1 is your top priority.</p>}
      <div className="px-4 py-4 border-t border-cream-dark">
        <button onClick={onSubmit} disabled={wishlist.length === 0}
          className={`w-full py-3 rounded-xl font-semibold text-base transition-all ${wishlist.length === 0 ? 'bg-cream-dark text-navy/30 cursor-not-allowed' : 'bg-gold text-navy hover:bg-gold-dark shadow-sm'}`}>
          {wishlist.length === 0 ? 'Add items to submit' : `Submit Wishlist (${wishlist.length})`}
        </button>
      </div>
    </div>
  );
}

function SortableWishlistItem({ item, rank, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const cat   = CATEGORIES[item.category] || CATEGORIES.Other;
  return (
    <div ref={setNodeRef} style={style} className={`flex items-center gap-3 p-3 rounded-xl border transition-shadow ${isDragging ? 'border-gold bg-cream shadow-card z-10 opacity-90' : 'border-cream-dark bg-white hover:border-navy/20'}`}>
      <div className="w-7 h-7 rounded-full bg-navy text-white text-sm font-bold flex items-center justify-center shrink-0">{rank}</div>
      <button className="drag-handle text-navy/25 hover:text-navy/50 shrink-0" {...attributes} {...listeners}>
        <svg width="16" height="16" viewBox="0 0 14 14" fill="currentColor"><circle cx="5" cy="3" r="1.2"/><circle cx="5" cy="7" r="1.2"/><circle cx="5" cy="11" r="1.2"/><circle cx="9" cy="3" r="1.2"/><circle cx="9" cy="7" r="1.2"/><circle cx="9" cy="11" r="1.2"/></svg>
      </button>
      <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0">
        {item.photo_url ? <img src={item.photo_url} alt={item.name} className="w-full h-full object-cover" /> : (
          <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: cat.bg }}>
            <span className="text-white/70 text-xs font-bold">{item.name.slice(0, 2).toUpperCase()}</span>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-navy truncate">{item.name}</p>
        {item.room && <p className="text-sm text-navy/40 truncate">{item.room}</p>}
      </div>
      <button onClick={() => onRemove(item.id)} className="text-navy/30 hover:text-red-500 transition-colors shrink-0 p-1">✕</button>
    </div>
  );
}

// ── Submit Modal ─────────────────────────────────────────────────────────────
function SubmitModal({ wishlist, onSubmit, onClose }) {
  const [name,       setName]       = useState('');
  const [email,      setEmail]      = useState('');
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');

  useEffect(() => {
    const h = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', h);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', h); document.body.style.overflow = ''; };
  }, [onClose]);

  async function handleSubmit() {
    if (!name.trim()) { setError('Please enter your name.'); return; }
    setLoading(true); setError('');
    const ok = await onSubmit(name.trim(), email.trim());
    if (!ok) { setError('Something went wrong. Please try again.'); setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-modal max-w-md w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="bg-navy px-6 py-5">
          <h2 className="font-serif text-2xl font-semibold text-white">Almost done!</h2>
          <p className="text-white/60 text-base mt-1">Enter your details to submit your wishlist.</p>
        </div>
        <div className="px-6 py-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-navy/60 uppercase tracking-wide mb-1.5">Your name *</label>
            <input type="text" value={name} onChange={(e) => { setName(e.target.value); setError(''); }} placeholder="e.g. Sarah" onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              className="w-full px-4 py-3 border border-cream-dark rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-gold/50 placeholder-navy/30" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-navy/60 uppercase tracking-wide mb-1.5">Email <span className="normal-case font-normal text-navy/30">(optional)</span></label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="so we can follow up if needed"
              className="w-full px-4 py-3 border border-cream-dark rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-gold/50 placeholder-navy/30" />
          </div>
          <div>
            <p className="text-sm font-semibold text-navy/60 uppercase tracking-wide mb-2">Your top choices</p>
            {wishlist.slice(0, 3).map((item, i) => (
              <div key={item.id} className="flex items-center gap-2.5 mb-1.5">
                <span className="w-6 h-6 rounded-full bg-navy text-white text-sm font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                <span className="text-base text-navy font-medium truncate">{item.name}</span>
              </div>
            ))}
            {wishlist.length > 3 && <p className="text-sm text-navy/40 pl-9">+ {wishlist.length - 3} more</p>}
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-cream-dark text-base text-navy/60 font-medium hover:border-navy/30">Go back</button>
            <button onClick={handleSubmit} disabled={loading} className={`flex-1 py-3 rounded-xl text-base font-semibold transition-all ${loading ? 'bg-gold/50 text-navy/50 cursor-not-allowed' : 'bg-gold text-navy hover:bg-gold-dark'}`}>
              {loading ? 'Submitting…' : 'Submit'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Success Screen ───────────────────────────────────────────────────────────
function SuccessScreen({ data }) {
  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-4 py-12">
      <div className="w-20 h-20 rounded-full bg-navy flex items-center justify-center mb-6 shadow-card">
        <svg width="40" height="40" viewBox="0 0 32 32" fill="none"><path d="M16 5C16 5 8 9 8 17C8 21.4 11.6 25 16 25C20.4 25 24 21.4 24 17C24 9 16 5 16 5Z" fill="#C9A84C" opacity="0.8"/><path d="M11 17L14.5 20.5L21 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </div>
      <h1 className="font-serif text-4xl font-semibold text-navy mb-3 text-center">Thank you, {data.name}!</h1>
      <p className="text-navy/60 text-lg text-center max-w-sm mb-10 leading-relaxed">Your wishlist has been submitted. The family will review everyone's choices together.</p>
      {data.wishlist.length > 0 && (
        <div className="bg-white rounded-2xl shadow-card border border-cream-dark max-w-sm w-full p-6">
          <h2 className="font-serif text-xl font-semibold text-navy mb-4">Your submitted wishlist</h2>
          <ol className="space-y-3">
            {data.wishlist.map((item, i) => (
              <li key={item.id} className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-gold text-navy text-sm font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                <div><p className="text-base font-medium text-navy">{item.name}</p>{item.room && <p className="text-sm text-navy/40">{item.room}</p>}</div>
              </li>
            ))}
          </ol>
        </div>
      )}
      <p className="text-sm text-navy/30 mt-10">You can close this window now.</p>
    </div>
  );
}

// ── How It Works Modal ───────────────────────────────────────────────────────
function HowItWorksModal({ onClose }) {
  useEffect(() => {
    const h = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', h);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', h); document.body.style.overflow = ''; };
  }, [onClose]);

  const steps = [
    { n: '1', title: 'Browse the Collection', body: 'Take your time looking through all the items. Tap any photo to see more details including description and dimensions.' },
    { n: '2', title: 'Build Your Wishlist',   body: 'Tap the heart icon on any item you would like to keep. Your choices are completely private.' },
    { n: '3', title: 'Rank Your Selections',  body: 'Drag items into priority order with your most wanted item at the top.' },
    { n: '4', title: 'Submit Before the Deadline', body: 'Enter your name and optionally your email, then submit. Be honest — this process works best when everyone participates sincerely.' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-modal max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="bg-navy px-6 py-5 flex items-center justify-between">
          <div>
            <h2 className="font-serif text-2xl font-semibold text-white">How It Works</h2>
            <p className="text-white/60 text-sm mt-0.5">A simple, fair process for everyone</p>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white text-xl">✕</button>
        </div>
        <div className="px-6 py-6 space-y-5">
          {steps.map((s, i) => (
            <div key={s.n} className="flex gap-4">
              <div className="flex flex-col items-center shrink-0">
                <div className="w-10 h-10 rounded-full bg-navy text-white text-base font-bold flex items-center justify-center font-serif">{s.n}</div>
                {i < steps.length - 1 && <div className="w-0.5 flex-1 bg-cream-dark mt-2 min-h-4" />}
              </div>
              <div className="pb-4 flex-1">
                <h3 className="font-semibold text-base text-navy mb-1">{s.title}</h3>
                <p className="text-sm text-navy/70 leading-relaxed">{s.body}</p>
              </div>
            </div>
          ))}
          <div className="border-t border-cream-dark pt-4">
            <h3 className="font-serif text-lg font-semibold text-navy mb-3">What Happens After</h3>
            {[
              { dot: 'bg-green-500', title: 'Uncontested', body: 'Only one person wants it — goes to them.' },
              { dot: 'bg-amber-500', title: 'Conflict',    body: 'Multiple people want the same item — the estate owner reviews and resolves fairly.' },
              { dot: 'bg-gray-400',  title: 'Unclaimed',   body: 'Nobody wants it — handled separately by the estate.' },
            ].map((o) => (
              <div key={o.title} className="flex items-start gap-3 mb-2">
                <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${o.dot}`} />
                <p className="text-sm text-navy/70"><strong className="text-navy">{o.title}:</strong> {o.body}</p>
              </div>
            ))}
          </div>
          <div className="bg-cream rounded-xl px-4 py-3">
            <p className="text-sm text-navy/70"><strong className="text-navy">🔒 Your choices are private.</strong> Other family members cannot see your wishlist or rankings.</p>
          </div>
          <button onClick={onClose} className="w-full py-3 rounded-xl bg-gold text-navy font-semibold text-base hover:bg-gold-dark transition-colors">Got it — back to browsing</button>
        </div>
      </div>
    </div>
  );
}

// ── Utility screens ──────────────────────────────────────────────────────────
function FilterPills({ label, options, value, onChange }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm font-semibold text-navy/50 uppercase tracking-wide">{label}:</span>
      {options.map((o) => (
        <button key={o} onClick={() => onChange(o)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${value === o ? 'bg-navy text-white' : 'bg-white border border-cream-dark text-navy/60 hover:border-navy/30'}`}>
          {o}
        </button>
      ))}
    </div>
  );
}

function HeartIcon({ filled, size = 18, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : 'none'} stroke={color} strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z" />
    </svg>
  );
}

function QuestionIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10"/><path strokeLinecap="round" strokeLinejoin="round" d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  );
}

function LoadingScreen() {
  return <div className="min-h-screen bg-cream flex items-center justify-center"><div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" /></div>;
}

function NotFound() {
  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-4 text-center">
      <LeafLogo size={48} />
      <h1 className="font-serif text-3xl font-semibold text-navy mt-6 mb-3">Estate not found</h1>
      <p className="text-navy/50 text-lg max-w-sm">This link may have expired or the estate is no longer active. Please check with the person who shared it with you.</p>
    </div>
  );
}
