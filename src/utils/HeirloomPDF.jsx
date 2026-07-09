import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer';

const NAVY  = '#1E3A4C';
const GOLD  = '#C9A84C';
const CREAM = '#F9F5EE';
const MUTED = '#8A7F72';
const LIGHT = '#EDE7DC';
const GREEN = '#1A5C2E';
const RED   = '#8B1A1A';
const WHITE = '#FFFFFF';

const S = StyleSheet.create({
  page: {
    backgroundColor: CREAM,
    paddingTop: 40,
    paddingBottom: 60,
    paddingHorizontal: 44,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: NAVY,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingBottom: 14,
    borderBottomWidth: 1.5,
    borderBottomColor: GOLD,
  },
  logoText:    { fontFamily: 'Times-Roman', fontSize: 22, color: NAVY },
  estateLabel: { fontSize: 11, color: GOLD, marginTop: 3 },
  dateText:    { fontSize: 9, color: MUTED, textAlign: 'right' },
  docTitle:    { fontSize: 9, color: MUTED, textAlign: 'right', marginTop: 2 },

  statsRow: { flexDirection: 'row', marginBottom: 20, gap: 10 },
  statBox: {
    flex: 1,
    backgroundColor: WHITE,
    borderWidth: 0.5,
    borderColor: LIGHT,
    borderRadius: 4,
    padding: 8,
    alignItems: 'center',
  },
  statValue: { fontFamily: 'Times-Roman', fontSize: 18, color: NAVY },
  statLabel: { fontSize: 7.5, color: MUTED, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },

  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 6,
    paddingBottom: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: LIGHT,
  },
  sectionDot:   { width: 7, height: 7, borderRadius: 3.5, marginRight: 6 },
  sectionTitle: { fontFamily: 'Helvetica-Bold', fontSize: 9.5, color: NAVY, textTransform: 'uppercase', letterSpacing: 0.7 },
  sectionCount: { fontSize: 9, color: MUTED, marginLeft: 5 },

  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: LIGHT,
  },
  rowAlt: { backgroundColor: WHITE },

  colLeft:   { width: '55%' },
  colRight:  { width: '45%', alignItems: 'flex-end' },
  itemName:  { fontFamily: 'Helvetica-Bold', fontSize: 10, color: NAVY },
  itemMeta:  { fontSize: 8.5, color: MUTED, marginTop: 2 },
  assigneeTxt: { fontFamily: 'Helvetica-Bold', fontSize: 10, color: GREEN },
  suggestTxt:  { fontSize: 9, color: GREEN, marginTop: 2 },
  claimantTxt: { fontSize: 8.5, color: MUTED, marginTop: 1.5 },
  conflictTag: {
    fontSize: 8, color: RED, fontFamily: 'Helvetica-Bold',
    backgroundColor: '#FDF0F0', paddingHorizontal: 5, paddingVertical: 2,
  },
  emptyTxt: { fontSize: 9, color: MUTED, fontStyle: 'italic', paddingVertical: 5, paddingHorizontal: 8 },

  footer: {
    position: 'absolute', bottom: 20, left: 44, right: 44,
    borderTopWidth: 0.5, borderTopColor: LIGHT,
    paddingTop: 7, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
  },
  footerBrand:   { fontFamily: 'Times-Roman', fontSize: 8, color: GOLD },
  footerDiscl:   { fontSize: 7, color: MUTED, fontStyle: 'italic', marginTop: 2 },
  footerPage:    { fontSize: 8, color: MUTED },
});

function Hdr({ estate, subtitle }) {
  const date = new Date().toLocaleDateString('en-CA', { month: 'long', day: 'numeric', year: 'numeric' });
  return (
    <View style={S.header}>
      <View>
        <Text style={S.logoText}>Heirloom</Text>
        <Text style={S.estateLabel}>{estate.name}</Text>
      </View>
      <View>
        <Text style={S.dateText}>Generated {date}</Text>
        <Text style={S.docTitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

function Sec({ title, count, dot, children }) {
  return (
    <View>
      <View style={S.sectionHead}>
        <View style={[S.sectionDot, { backgroundColor: dot }]} />
        <Text style={S.sectionTitle}>{title}</Text>
        <Text style={S.sectionCount}>({count})</Text>
      </View>
      {children}
    </View>
  );
}

function Ftr() {
  return (
    <View style={S.footer} fixed>
      <View>
        <Text style={S.footerBrand}>Heirloom — heirloom-app.ca</Text>
        <Text style={S.footerDiscl}>Decision-support summary only. Not a legal instrument. Distribution subject to the will, provincial law, and executor authority.</Text>
      </View>
      <Text style={S.footerPage} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
    </View>
  );
}

// ── Analysis Report PDF ───────────────────────────────────────────────────────
export function AnalysisPDF({ estate, analysis, assignments }) {
  const totalItems = analysis.hardConflicts.length + analysis.softConflicts.length + analysis.uncontested.length + analysis.unclaimed.length;
  const totalAssigned = Object.keys(assignments).length;

  return (
    <Document title={`Heirloom — ${estate.name} — Analysis Report`}>
      <Page size="A4" style={S.page}>
        <Hdr estate={estate} subtitle="Analysis Report" />

        <View style={S.statsRow}>
          {[
            { v: analysis.totalSubmissions, l: 'Submissions' },
            { v: totalItems, l: 'Total items' },
            { v: analysis.uncontested.length, l: 'Uncontested' },
            { v: analysis.hardConflicts.length + analysis.softConflicts.length, l: 'In conflict' },
            { v: totalAssigned, l: 'Assigned' },
          ].map((s) => (
            <View key={s.l} style={S.statBox}>
              <Text style={S.statValue}>{s.v}</Text>
              <Text style={S.statLabel}>{s.l}</Text>
            </View>
          ))}
        </View>

        {/* Uncontested */}
        <Sec title="Uncontested" count={analysis.uncontested.length} dot="#28A745">
          {analysis.uncontested.length === 0
            ? <Text style={S.emptyTxt}>None.</Text>
            : analysis.uncontested.map((item, i) => (
              <View key={item.id} style={[S.row, i % 2 === 0 ? S.rowAlt : {}]}>
                <View style={S.colLeft}>
                  <Text style={S.itemName}>{item.name}</Text>
                  <Text style={S.itemMeta}>{[item.room, item.category].filter(Boolean).join(' \u00B7 ')}</Text>
                </View>
                <View style={S.colRight}>
                  <Text style={S.assigneeTxt}>{'\u2192'} {assignments[item.id]?.assigned_to || item.claimants[0]?.personName}</Text>
                </View>
              </View>
            ))}
        </Sec>

        {/* Soft conflicts */}
        <Sec title="Soft Conflicts — Suggestion Available" count={analysis.softConflicts.length} dot={GOLD}>
          {analysis.softConflicts.length === 0
            ? <Text style={S.emptyTxt}>None.</Text>
            : analysis.softConflicts.map((item, i) => (
              <View key={item.id} style={[S.row, i % 2 === 0 ? S.rowAlt : {}]}>
                <View style={S.colLeft}>
                  <Text style={S.itemName}>{item.name}</Text>
                  <Text style={S.itemMeta}>{[item.room, item.category].filter(Boolean).join(' \u00B7 ')}</Text>
                  {item.claimants.slice(1).map((c, ci) => (
                    <Text key={ci} style={S.claimantTxt}>Also wanted by {c.personName} (#{c.rank})</Text>
                  ))}
                </View>
                <View style={S.colRight}>
                  {assignments[item.id]
                    ? <Text style={S.assigneeTxt}>{'\u2192'} {assignments[item.id].assigned_to}</Text>
                    : <Text style={S.suggestTxt}>Suggested: {item.suggestedAssignee}</Text>}
                </View>
              </View>
            ))}
        </Sec>

        {/* Hard conflicts */}
        <Sec title="Hard Conflicts — Requires Discussion" count={analysis.hardConflicts.length} dot={RED}>
          {analysis.hardConflicts.length === 0
            ? <Text style={S.emptyTxt}>None.</Text>
            : analysis.hardConflicts.map((item, i) => (
              <View key={item.id} style={[S.row, i % 2 === 0 ? S.rowAlt : {}]}>
                <View style={S.colLeft}>
                  <Text style={S.itemName}>{item.name}</Text>
                  <Text style={S.itemMeta}>{[item.room, item.category].filter(Boolean).join(' \u00B7 ')}</Text>
                  <Text style={S.claimantTxt}>Tied: {item.claimants.map((c) => c.personName).join(', ')}</Text>
                </View>
                <View style={S.colRight}>
                  {assignments[item.id]
                    ? <Text style={S.assigneeTxt}>{'\u2192'} {assignments[item.id].assigned_to}</Text>
                    : <Text style={S.conflictTag}>Unresolved</Text>}
                </View>
              </View>
            ))}
        </Sec>

        {/* Unclaimed */}
        <Sec title="Unclaimed" count={analysis.unclaimed.length} dot={MUTED}>
          {analysis.unclaimed.length === 0
            ? <Text style={S.emptyTxt}>Every item has at least one interested family member.</Text>
            : analysis.unclaimed.map((item, i) => (
              <View key={item.id} style={[S.row, i % 2 === 0 ? S.rowAlt : {}]}>
                <Text style={S.itemName}>{item.name}</Text>
                <Text style={S.itemMeta}>{[item.room, item.category].filter(Boolean).join(' \u00B7 ')}</Text>
              </View>
            ))}
        </Sec>

        <Ftr />
      </Page>
    </Document>
  );
}

// ── Final Allocation PDF ──────────────────────────────────────────────────────
export function AllocationPDF({ estate, analysis, assignments }) {
  // Build the complete allocation list
  const allocated = [];

  // Add explicitly assigned items first
  [...analysis.hardConflicts, ...analysis.softConflicts, ...analysis.uncontested].forEach((item) => {
    const a = assignments[item.id];
    if (a) {
      allocated.push({ id: item.id, name: item.name, room: item.room, category: item.category, assignedTo: a.assigned_to });
    } else if (analysis.uncontested.find((u) => u.id === item.id)) {
      // Auto-confirm uncontested if not explicitly assigned
      allocated.push({ id: item.id, name: item.name, room: item.room, category: item.category, assignedTo: item.claimants[0]?.personName });
    }
  });

  allocated.sort((a, b) => a.assignedTo.localeCompare(b.assignedTo) || a.name.localeCompare(b.name));

  // Group by person
  const byPerson = {};
  allocated.forEach((item) => {
    if (!byPerson[item.assignedTo]) byPerson[item.assignedTo] = [];
    byPerson[item.assignedTo].push(item);
  });

  const unresolved = [...analysis.hardConflicts, ...analysis.softConflicts].filter((item) => !assignments[item.id]);

  return (
    <Document title={`Heirloom — ${estate.name} — Final Allocation`}>
      <Page size="A4" style={S.page}>
        <Hdr estate={estate} subtitle="Final Allocation — Approved by Owner" />

        {allocated.length === 0 ? (
          <Text style={S.emptyTxt}>No assignments have been made yet. Use the Results page to assign items.</Text>
        ) : (
          Object.entries(byPerson).map(([person, items]) => (
            <Sec key={person} title={person} count={items.length} dot={NAVY}>
              {items.map((item, i) => (
                <View key={item.id} style={[S.row, i % 2 === 0 ? S.rowAlt : {}]}>
                  <View style={S.colLeft}>
                    <Text style={S.itemName}>{item.name}</Text>
                    <Text style={S.itemMeta}>{[item.room, item.category].filter(Boolean).join(' \u00B7 ')}</Text>
                  </View>
                  <View style={S.colRight}>
                    <Text style={S.assigneeTxt}>{'\u2713'} Assigned</Text>
                  </View>
                </View>
              ))}
            </Sec>
          ))
        )}

        {unresolved.length > 0 && (
          <Sec title="Unresolved Conflicts — Pending Decision" count={unresolved.length} dot={RED}>
            {unresolved.map((item, i) => (
              <View key={item.id} style={[S.row, i % 2 === 0 ? S.rowAlt : {}]}>
                <View style={S.colLeft}>
                  <Text style={S.itemName}>{item.name}</Text>
                  <Text style={S.itemMeta}>{[item.room, item.category].filter(Boolean).join(' \u00B7 ')}</Text>
                </View>
                <View style={S.colRight}>
                  <Text style={S.conflictTag}>Decision pending</Text>
                </View>
              </View>
            ))}
          </Sec>
        )}

        {analysis.unclaimed.length > 0 && (
          <Sec title="Unclaimed Items — For Separate Disposition" count={analysis.unclaimed.length} dot={MUTED}>
            {analysis.unclaimed.map((item, i) => (
              <View key={item.id} style={[S.row, i % 2 === 0 ? S.rowAlt : {}]}>
                <View style={S.colLeft}>
                  <Text style={S.itemName}>{item.name}</Text>
                  <Text style={S.itemMeta}>{[item.room, item.category].filter(Boolean).join(' \u00B7 ')}</Text>
                </View>
              </View>
            ))}
          </Sec>
        )}

        <Ftr />
      </Page>
    </Document>
  );
}

// ── Download helpers ──────────────────────────────────────────────────────────
export async function downloadAnalysisPDF(estate, analysis, assignments) {
  const blob = await pdf(<AnalysisPDF estate={estate} analysis={analysis} assignments={assignments} />).toBlob();
  triggerDownload(blob, `heirloom-${slug(estate.name)}-analysis.pdf`);
}

export async function downloadAllocationPDF(estate, analysis, assignments) {
  const blob = await pdf(<AllocationPDF estate={estate} analysis={analysis} assignments={assignments} />).toBlob();
  triggerDownload(blob, `heirloom-${slug(estate.name)}-allocation.pdf`);
}

function slug(name) {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href    = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
