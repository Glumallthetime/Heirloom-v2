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
  const [assignments, setAssignments] = useState({});
  const [loading,     setLoading]     = useState(true);
  const [pdfLoading,  setPdfLoading]  = useState('');

  useEffect(() => { fetchData(); }, [id]);

  async function fetchData() {
    const [
      { data: estateData },
      { data: subsData },
      { data: itemsData },
      { data: assignData },
    ] = await Promise.all([
      supabase.from('estates').select('*').eq('id', id).single(),
      supabase.from('submissions').select('*, wishlist_items(*, items(*))').eq('estate_id', id).order('submitted_at'),
      supabase.from('items').select('*').eq('estate_id', id),
      supabase.from('assignments').select('*').eq('estate_id', id),
    ]);
    setEstate(estateData);
    setSubmissions(subsData || []);
    setItems(itemsData || []);
    const map = {};
    (assignData || []).forEach((a) => { map[a.item_id] = a; });
    setAssignments(map);
    setLoading(false);
  }

  const analysis = useMemo(() => analyzeConflicts(submissions, items), [submissions, items]);

  async function assignItem(itemId, itemName, personName) {
    const { error } = await supabase.from('assignments').upsert({
      estate_id: id, item_id: itemId, item_name: itemName, assigned_to: personName,
    }, { onConflict: 'estate_id,item_id' });
    if (!error) setAssignments((prev) => ({ ...prev, [itemId]: { item_id: itemId, item_name: itemName, assigned_to: personName } }));
  }

  async function removeAssignment(itemId) {
    await supabase.from('assignments').delete().eq('estate_id', id).eq('item_id', itemId);
    setAssignments((prev) => { const n = { ...prev }; delete n[itemId]; return n; });
  }

  function handleCSV() {
    const csv  = exportToCSV(analysis);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `heirloom-results-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handlePDF(type) {
    setPdfLoading(type);
    try {
      const { downloadAnalysisPDF, downloadAllocationPDF } = await import('../utils/HeirloomPDF.jsx');
      if (type === 'analysis') await downloadAnalysisPDF(estate, analysis, assignments);
      else await downloadAllocationPDF(estate, analysis, assignments);
    } catch (err) {
      console.error('PDF error:', err);
      alert('PDF generation failed. Please try again.');
    }
    setPdfLoading('');
  }

  if (loading) return <Loading />;

  const assignedCount  = Object.keys(assignments).length;
  const conflictCount  = analysis.hardConflicts.length + analysis.softConflicts.length;
  const resolvedCount  = [...analysis.hardConflicts, ...analysis.softConflicts].filter((i) => assignments[i.id]).length;

  return (
    <div className="min-h-screen bg-cream">
      <OwnerHeader title={`${estate?.name} — Results`} back={`/estate/${id}`} />

      <main className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8">

        {/* Header row */}
        <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="font-serif text-2xl font-semibold text-navy">Wishlist Results</h1>
            <p className="text-navy/50 text-base mt-1">{analysis.totalSubmissions} submission{analysis.totalSubmissions !== 1 ? 's' : ''} received</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={handleCSV} className="border border-cream-dark text-navy/60 px-4 py-2.5 rounded-xl font-semibold text-base hover:border-navy/30 transition-colors">
              Export CSV
            </button>
            <PDFButton label="Analysis Report" type="analysis" loading={pdfLoading === 'analysis'} disabled={analysis.totalSubmissions === 0} onClick={() => handlePDF('analysis')} />
            <PDFButton label="Final Allocation" type="allocation" loading={pdfLoading === 'allocation'} disabled={assignedCount === 0} onClick={() => handlePDF('allocation')} accent />
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <StatCard value={analysis.totalSubmissions}   label="Submissions"    color="navy"  />
          <StatCard value={analysis.hardConflicts.length} label="Hard Conflicts" color="red"   />
          <StatCard value={analysis.softConflicts.length} label="Soft Conflicts" color="amber" />
          <StatCard value={analysis.uncontested.length}   label="Uncontested"    color="green" />
        </div>

        {/* Progress bar */}
        {conflictCount > 0 && (
          <div className="bg-white rounded-2xl border border-cream-dark px-5 py-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-base font-semibold text-navy">Conflict resolution progress</p>
              <p className="text-sm text-navy/50">{resolvedCount} of {conflictCount} resolved</p>
            </div>
            <div className="w-full bg-cream-dark rounded-full h-2">
              <div
                className="bg-gold rounded-full h-2 transition-all"
                style={{ width: conflictCount === 0 ? '100%' : `${(resolvedCount / conflictCount) * 100}%` }}
              />
            </div>
          </div>
        )}

        {analysis.totalSubmissions === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-cream-dark">
            <p className="font-serif text-xl text-navy/40 mb-2">No submissions yet</p>
            <p className="text-navy/30 text-base mb-5">Share the family link to start collecting wishlists.</p>
            <Link to={`/estate/${id}`} className="text-navy font-semibold hover:underline">← Back to estate</Link>
          </div>
        ) : (
          <>
            {/* Hard conflicts */}
            <Section title="Hard Conflicts" count={analysis.hardConflicts.length} color="red" badge="Needs Resolution">
              {analysis.hardConflicts.map((item, i) => (
                <ConflictCard key={item.id} item={item} type="hard" assignment={assignments[item.id]} shaded={i % 2 === 0}
                  onAssign={(person) => assignItem(item.id, item.name, person)}
                  onClear={() => removeAssignment(item.id)} />
              ))}
            </Section>

            {/* Soft conflicts */}
            <Section title="Soft Conflicts" count={analysis.softConflicts.length} color="amber" badge="Suggestion Available">
              {analysis.softConflicts.map((item, i) => (
                <ConflictCard key={item.id} item={item} type="soft" assignment={assignments[item.id]} shaded={i % 2 === 0}
                  onAssign={(person) => assignItem(item.id, item.name, person)}
                  onClear={() => removeAssignment(item.id)} />
              ))}
            </Section>

            {/* Uncontested */}
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

            {/* Unclaimed */}
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

// ── Conflict card with assignment UI ─────────────────────────────────────────
function ConflictCard({ item, type, assignment, onAssign, onClear, shaded }) {
  const [showOther, setShowOther] = useState(false);
  const [otherName, setOtherName] = useState('');
  const isSoft = type === 'soft';
  const isAssigned = !!assignment;

  return (
    <div className={`rounded-xl border px-4 py-4 mb-3 ${isAssigned ? 'border-green-200 bg-green-50/30' : isSoft ? 'border-amber-200 bg-white' : 'border-red-200 bg-white'}`}>
      {/* Item info */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <p className="font-serif font-semibold text-base text-navy">{item.name}</p>
          <p className="text-sm text-navy/50">{[item.room, item.category].filter(Boolean).join(' · ')}</p>
        </div>
        {isAssigned ? (
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-sm font-semibold text-green-700 bg-green-100 px-3 py-1 rounded-full">→ {assignment.assigned_to}</span>
            <button onClick={onClear} className="text-xs text-navy/30 hover:text-red-400 transition-colors">✕</button>
          </div>
        ) : (
          !isSoft
            ? <span className="shrink-0 text-xs font-semibold bg-red-100 text-red-700 px-2.5 py-1 rounded-full">Tied at #1</span>
            : <span className="shrink-0 text-xs font-semibold bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full">Soft conflict</span>
        )}
      </div>

      {/* Claimants */}
      <div className="flex flex-wrap gap-2 mb-3">
        {item.claimants.map((c, i) => (
          <div key={i} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm ${isSoft && i === 0 ? 'bg-amber-50 text-amber-800 font-semibold' : 'bg-cream text-navy/70'}`}>
            <span className="w-5 h-5 rounded-full bg-navy text-white text-xs font-bold flex items-center justify-center shrink-0">{c.rank}</span>
            {c.personName}
          </div>
        ))}
      </div>

      {/* Assignment buttons */}
      {!isAssigned && (
        <div className="border-t border-cream-dark pt-3">
          <p className="text-xs font-semibold text-navy/40 uppercase tracking-wide mb-2">Assign to:</p>
          <div className="flex flex-wrap gap-2">
            {item.claimants.map((c, i) => (
              <button key={i} onClick={() => onAssign(c.personName)}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${isSoft && i === 0 ? 'bg-navy text-white hover:bg-navy-light' : 'border border-navy/20 text-navy hover:bg-navy hover:text-white'}`}>
                {c.personName}
                {isSoft && i === 0 && ' (suggested)'}
              </button>
            ))}
            <button onClick={() => setShowOther(!showOther)}
              className="px-3 py-1.5 rounded-lg text-sm border border-cream-dark text-navy/50 hover:border-navy/30 transition-colors">
              Other…
            </button>
          </div>
          {showOther && (
            <div className="flex gap-2 mt-2">
              <input type="text" value={otherName} onChange={(e) => setOtherName(e.target.value)} placeholder="Enter name"
                className="flex-1 px-3 py-2 border border-cream-dark rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold/50" />
              <button onClick={() => { if (otherName.trim()) { onAssign(otherName.trim()); setShowOther(false); setOtherName(''); } }}
                className="px-4 py-2 bg-navy text-white rounded-lg text-sm font-semibold hover:bg-navy-light transition-colors">
                Assign
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Shared sub-components ─────────────────────────────────────────────────────
function PDFButton({ label, loading, disabled, onClick, accent }) {
  return (
    <button onClick={onClick} disabled={loading || disabled}
      className={`px-4 py-2.5 rounded-xl font-semibold text-base transition-colors disabled:opacity-50 flex items-center gap-2 ${accent ? 'bg-gold text-navy hover:bg-gold-dark' : 'bg-navy text-white hover:bg-navy-light'}`}>
      {loading
        ? <><span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />Generating…</>
        : <><DownloadIcon />{label}</>}
    </button>
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

function Loading() {
  return <div className="min-h-screen bg-cream flex items-center justify-center"><div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" /></div>;
}

function DownloadIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16" />
    </svg>
  );
}
