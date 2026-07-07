import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase.js';
import OwnerHeader from '../components/shared/OwnerHeader.jsx';

export default function OwnerDashboard() {
  const [estates, setEstates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { fetchEstates(); }, []);

  async function fetchEstates() {
    const { data } = await supabase
      .from('estates')
      .select('*, items(count)')
      .order('created_at', { ascending: false });
    setEstates(data || []);
    setLoading(false);
  }

  async function createEstate(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    const { data, error } = await supabase
      .from('estates')
      .insert({ name: newName.trim() })
      .select()
      .single();
    if (!error && data) {
      navigate(`/estate/${data.id}`);
    }
    setCreating(false);
  }

  return (
    <div className="min-h-screen bg-cream">
      <OwnerHeader />
      <main className="max-w-screen-lg mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-3xl font-semibold text-navy">Your Estates</h1>
            <p className="text-navy/50 text-base mt-1">Manage your estate collections</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-navy text-white px-5 py-2.5 rounded-xl font-semibold text-base hover:bg-navy-light transition-colors flex items-center gap-2"
          >
            <PlusIcon /> New Estate
          </button>
        </div>

        {/* New estate form */}
        {showForm && (
          <div className="bg-white rounded-2xl border border-cream-dark shadow-card p-5 mb-6">
            <h2 className="font-serif text-lg font-semibold text-navy mb-3">Name this estate</h2>
            <form onSubmit={createEstate} className="flex gap-3">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Marion's Collection"
                autoFocus
                className="flex-1 px-4 py-2.5 border border-cream-dark rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-gold/50 placeholder-navy/30"
              />
              <button
                type="submit"
                disabled={creating}
                className="bg-gold text-navy px-5 py-2.5 rounded-xl font-semibold text-base hover:bg-gold-dark transition-colors disabled:opacity-50"
              >
                {creating ? 'Creating…' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setNewName(''); }}
                className="px-4 py-2.5 border border-cream-dark rounded-xl text-navy/50 text-base hover:border-navy/30"
              >
                Cancel
              </button>
            </form>
          </div>
        )}

        {/* Estate list */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : estates.length === 0 ? (
          <div className="text-center py-20">
            <p className="font-serif text-xl text-navy/40 mb-2">No estates yet</p>
            <p className="text-navy/30 text-base">Create your first estate to get started.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {estates.map((estate) => (
              <Link
                key={estate.id}
                to={`/estate/${estate.id}`}
                className="bg-white rounded-2xl border border-cream-dark shadow-card p-5 hover:shadow-md transition-shadow group"
              >
                <div className="flex items-start justify-between mb-3">
                  <h2 className="font-serif text-lg font-semibold text-navy group-hover:text-navy-light transition-colors leading-snug">
                    {estate.name}
                  </h2>
                  <StatusBadge status={estate.status} />
                </div>
                <p className="text-sm text-navy/40">
                  {estate.items?.[0]?.count ?? 0} item{estate.items?.[0]?.count !== 1 ? 's' : ''}
                </p>
                <p className="text-xs text-navy/30 mt-1">
                  Created {new Date(estate.created_at).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    active: 'bg-green-100 text-green-700',
    draft:  'bg-gray-100 text-gray-600',
    closed: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${styles[status] || styles.draft}`}>
      {status}
    </span>
  );
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}
