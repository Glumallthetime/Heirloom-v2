import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../supabase.js';
import OwnerHeader from '../components/shared/OwnerHeader.jsx';
import { analyzeConflicts, exportToCSV } from '../utils/analyzeConflicts.js';

export default function ResultsPage() {
  const { id } = useParams();
  const [estate,      setEstate]      = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [items,       setItems]       = useState([]);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => { fetchData(); }, [id]);

  async function fetchData() {
    const [{ data: estateData }, { data: subsData }, { data: itemsData }] = await Promise.all([
      supabase.from('estates').select('*').eq('id', id).single(),
      supabase.from('submissions').select('*, wishlist_items(*, items(*))').eq('estate_id', id).order('submitted_at'),
      supabase.from('items').select('*').eq('estate_id', id),
    ]);
    setEstate(estateData);
    setSubmissions(subsData || []);
    setItems(itemsData || []);
    setLoading(false);
  }

  const analysis = useMemo(() => analyzeConflicts(submissions, items), [submissions, items]);

  function handleExport() {
    const csv  = exportToCSV(analysis);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `heirloom-results-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return <Loading />;

  return (
    <div className="min-h-screen bg-cream">
      <OwnerHeader title={`${estate?.name} — Results`} back={`/estate/${id}`} />

      <main className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8">
        {/* Summary */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="font-serif text-2xl font-semibold text-navy">Wishlist Results</h1>
            <p className="text-navy/50 text-base mt-1">{analysis.totalSubmissions} submission{analysis.totalSubmissions !== 1 ? 's' : ''} received</p>
          </div>
          <button onClick={handleExport} className="bg-gold text-navy px-5 py-2.5 rounded-xl font-semibold text-base hover:bg-gold-dark transition-colors">
            Export CSV
          </button>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <StatCard value={analysis.totalSubmissions}     label="Submissions"    color="navy"  />
          <StatCard value={analysis.hardConflicts.length} label="Hard Conflicts" color="red"   />
          <StatCard value={analysis.softConflicts.length} label="Soft Conflicts" color="amber" />
          <StatCard value={analysis.uncontested.length}   label="Uncontested"    color="green" />
        </div>

        {analysis.totalSubmissions === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-cream-dark">
            <p className="font-serif text-xl text-navy/40 mb-2">No submissions yet</p>
            <p className="text-navy/30 text-base mb-5">Share the family link to start collecting wishlists.</p>
            <Link to={`/estate/${id}`} className="text-navy font-semibold hover:underline">← Back to estate</Link>
          </div>
        ) : (
          <>
            <Section title="Hard Conflicts" count={analysis.hardConflicts.length} color="red" badge="Needs Resolution">
              {analysis.hardConflicts.map((item) => <ConflictCard key={item.id} item={item} type="hard" />)}
            </Section>
            <Section title="Soft Conflicts" count={analysis.softConflicts.length} color="amber" badge="Suggestion Available">
              {analysis.softConflicts.map((item) => <ConflictCard key={item.id} item={item} type="soft" />)}
            </Section>
            <Section title="Uncontested" count={analysis.uncontested.length} color="green" badge="Ready to Assign">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {analysis.uncontested.map((item) => (
                  <div key={item.id} className="bg-white rounded-xl border border-cream-dark px-4 py-3">
                    <p className="font-semibold text-base text-navy">{item.name}</p>
                    <p className="text-sm text-navy/50 mb-2">{item.room} · {item.category}</p>
                    <p className="text-sm font-medium text-green-700">→ {item.claimants[0].personName}</p>
                  </div>
                ))}
              </div>
            </Section>
            <Section title="Unclaimed" count={analysis.unclaimed.length} color="gray" badge="No Interest">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {analysis.unclaimed.map((item) => (
                  <div key={item.id} className="bg-white rounded-xl border border-cream-dark px-4 py-3">
                    <p className="font-semibold text-base text-navy">{item.name}</p>
                    <p className="text-sm text-navy/50">{item.room} · {item.category}</p>
                  </div>
                ))}
              </div>
            </Section>
          </>
        )}
      </main>
    </div>
  );
}

function StatCard({ value, label, color }) {
  const colors = { navy: 'bg-navy text-white', red: 'bg-red-50 text-red-700', amber: 'bg-amber-50 text-amber-700', green: 'bg-green-50 text-green-700' };
  return (
    <div className={`rounded-2xl p-4 text-center ${colors[color]}`}>
      <p className="text-3xl font-bold font-serif mb-1">{value}</p>
      <p className="text-sm font-medium opacity-80">{label}</p>
    </div>
  );
}

function Section({ title, count, color, badge, children }) {
  const border = { red: 'border-red-200', amber: 'border-amber-200', green: 'border-green-200', gray: 'border-cream-dark' };
  const badgeC = { red: 'bg-red-100 text-red-700', amber: 'bg-amber-100 text-amber-700', green: 'bg-green-100 text-green-700', gray: 'bg-gray-100 text-gray-600' };
  return (
    <div className={`mb-6 border rounded-2xl overflow-hidden ${border[color]}`}>
      <div className="flex items-center gap-3 px-5 py-4 bg-white">
        <h2 className="font-serif text-lg font-semibold text-navy">{title}</h2>
        <span className="bg-navy text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">{count}</span>
        {badge && <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${badgeC[color]}`}>{badge}</span>}
      </div>
      <div className="px-5 py-4 bg-cream/40 border-t border-cream-dark">
        {count === 0 ? <p className="text-sm text-navy/40 italic">None</p> : children}
      </div>
    </div>
  );
}

function ConflictCard({ item, type }) {
  const isSoft = type === 'soft';
  return (
    <div className={`bg-white rounded-xl border px-4 py-4 mb-3 ${isSoft ? 'border-amber-200' : 'border-red-200'}`}>
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <p className="font-serif font-semibold text-base text-navy">{item.name}</p>
          <p className="text-sm text-navy/50">{item.room} · {item.category}</p>
        </div>
        {isSoft && item.suggestedAssignee && (
          <div className="text-right shrink-0">
            <p className="text-xs text-navy/40 font-medium uppercase tracking-wide">Suggested</p>
            <p className="text-sm font-semibold text-green-700">{item.suggestedAssignee}</p>
          </div>
        )}
        {!isSoft && <span className="shrink-0 text-xs font-semibold bg-red-100 text-red-700 px-2.5 py-1 rounded-full">Tied at #1</span>}
      </div>
      <div className="flex flex-wrap gap-2">
        {item.claimants.map((c, i) => (
          <div key={i} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm ${isSoft && i === 0 ? 'bg-green-50 text-green-700 font-semibold' : 'bg-cream text-navy/70'}`}>
            <span className="w-5 h-5 rounded-full bg-navy text-white text-xs font-bold flex items-center justify-center shrink-0">{c.rank}</span>
            {c.personName}
          </div>
        ))}
      </div>
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
