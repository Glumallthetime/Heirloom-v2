import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase.js';
import OwnerHeader from '../components/shared/OwnerHeader.jsx';

const CATEGORIES = ['Furniture', 'Art', 'Jewellery', 'Collectibles', 'Tools', 'Other'];

export default function EstateManagement() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [estate, setEstate]   = useState(null);
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied]   = useState(false);
  const [tab, setTab]         = useState('items'); // 'items' | 'settings'
  const [saving, setSaving]   = useState(false);

  useEffect(() => { fetchData(); }, [id]);

  async function fetchData() {
    const [{ data: estateData }, { data: itemsData }] = await Promise.all([
      supabase.from('estates').select('*').eq('id', id).single(),
      supabase.from('items').select('*').eq('estate_id', id).order('display_order').order('created_at'),
    ]);
    setEstate(estateData);
    setItems(itemsData || []);
    setLoading(false);
  }

  async function deleteItem(itemId) {
    if (!confirm('Delete this item? This cannot be undone.')) return;
    await supabase.from('items').delete().eq('id', itemId);
    setItems((prev) => prev.filter((i) => i.id !== itemId));
  }

  async function updateStatus(status) {
    setSaving(true);
    await supabase.from('estates').update({ status }).eq('id', id);
    setEstate((prev) => ({ ...prev, status }));
    setSaving(false);
  }

  async function saveSettings(e) {
    e.preventDefault();
    setSaving(true);
    await supabase.from('estates').update({
      name:            estate.name,
      welcome_message: estate.welcome_message,
    }).eq('id', id);
    setSaving(false);
    alert('Settings saved.');
  }

  function copyShareLink() {
    const url = `${window.location.origin}/e/${estate.share_token}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) return <Loading />;
  if (!estate) return <p className="p-8 text-navy/50">Estate not found.</p>;

  const shareUrl = `${window.location.origin}/e/${estate.share_token}`;

  return (
    <div className="min-h-screen bg-cream">
      <OwnerHeader title={estate.name} back="/dashboard" />

      <main className="max-w-screen-lg mx-auto px-4 sm:px-6 py-8">

        {/* Share link card */}
        <div className="bg-navy text-white rounded-2xl p-5 mb-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-white/60 text-sm font-semibold uppercase tracking-wide mb-1">Family share link</p>
              <p className="text-gold font-mono text-sm break-all">{shareUrl}</p>
              <p className="text-white/40 text-sm mt-1">Share this link with family members to let them browse and submit wishlists.</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={copyShareLink}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${copied ? 'bg-green-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
              >
                {copied ? '✓ Copied' : 'Copy link'}
              </button>
              <Link
                to={`/estate/${id}/results`}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-gold text-navy hover:bg-gold-dark transition-colors"
              >
                View results
              </Link>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white border border-cream-dark rounded-xl p-1 w-fit">
          {['items', 'settings'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-base font-medium capitalize transition-colors ${tab === t ? 'bg-navy text-white' : 'text-navy/50 hover:text-navy'}`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Items tab */}
        {tab === 'items' && (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-navy/50 text-base">{items.length} item{items.length !== 1 ? 's' : ''}</p>
              <Link
                to={`/estate/${id}/item/new`}
                className="bg-navy text-white px-4 py-2.5 rounded-xl font-semibold text-base hover:bg-navy-light transition-colors flex items-center gap-2"
              >
                <PlusIcon /> Add item
              </Link>
            </div>

            {items.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-cream-dark">
                <p className="font-serif text-xl text-navy/40 mb-2">No items yet</p>
                <p className="text-navy/30 text-base mb-5">Add your first item to get started.</p>
                <Link to={`/estate/${id}/item/new`} className="bg-navy text-white px-6 py-3 rounded-xl font-semibold text-base hover:bg-navy-light transition-colors">
                  Add first item
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="bg-white rounded-xl border border-cream-dark p-4 flex items-center gap-4">
                    {/* Thumbnail */}
                    <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-cream-dark">
                      {item.photo_url ? (
                        <img src={item.photo_url} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-navy/20 font-serif text-lg font-bold">{item.name.slice(0, 2).toUpperCase()}</span>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-base text-navy truncate">{item.name}</p>
                      <p className="text-sm text-navy/50">{item.category}{item.room ? ` · ${item.room}` : ''}</p>
                      {item.estimated_value && <p className="text-sm text-navy/40">{item.estimated_value}</p>}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 shrink-0">
                      <Link to={`/estate/${id}/item/${item.id}/edit`} className="px-3 py-1.5 border border-cream-dark text-navy/60 rounded-lg text-sm hover:border-navy/30 transition-colors">
                        Edit
                      </Link>
                      <button onClick={() => deleteItem(item.id)} className="px-3 py-1.5 border border-cream-dark text-red-400 rounded-lg text-sm hover:border-red-200 hover:text-red-500 transition-colors">
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Settings tab */}
        {tab === 'settings' && (
          <div className="bg-white rounded-2xl border border-cream-dark p-6 space-y-6">
            <form onSubmit={saveSettings} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-navy/60 uppercase tracking-wide mb-1.5">Estate name</label>
                <input
                  type="text"
                  value={estate.name}
                  onChange={(e) => setEstate((p) => ({ ...p, name: e.target.value }))}
                  className="w-full px-4 py-3 border border-cream-dark rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-gold/50"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-navy/60 uppercase tracking-wide mb-1.5">Welcome message</label>
                <textarea
                  value={estate.welcome_message}
                  onChange={(e) => setEstate((p) => ({ ...p, welcome_message: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-3 border border-cream-dark rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-gold/50 resize-none"
                />
              </div>
              <button type="submit" disabled={saving} className="bg-gold text-navy px-6 py-2.5 rounded-xl font-semibold text-base hover:bg-gold-dark transition-colors disabled:opacity-50">
                {saving ? 'Saving…' : 'Save settings'}
              </button>
            </form>

            <div className="border-t border-cream-dark pt-5">
              <p className="text-sm font-semibold text-navy/60 uppercase tracking-wide mb-3">Estate status</p>
              <div className="flex gap-2">
                {['draft', 'active', 'closed'].map((s) => (
                  <button
                    key={s}
                    onClick={() => updateStatus(s)}
                    disabled={saving}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-colors ${estate.status === s ? 'bg-navy text-white' : 'border border-cream-dark text-navy/50 hover:border-navy/30'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <p className="text-xs text-navy/40 mt-2">Only "active" estates can be accessed by family members via the share link.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function Loading() {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}
