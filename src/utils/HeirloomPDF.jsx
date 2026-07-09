import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer';

// ── Colours ──────────────────────────────────────────────────────────────────
const NAVY  = '#1E3A4C';
const GOLD  = '#C9A84C';
const CREAM = '#F9F5EE';
const MUTED = '#8A7F72';
const LIGHT = '#EDE7DC';

// ── Styles ───────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  page: {
    backgroundColor: CREAM,
    paddingTop: 40,
    paddingBottom: 50,
    paddingHorizontal: 44,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: NAVY,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1.5,
    borderBottomColor: GOLD,
  },
  logoText: {
    fontFamily: 'Times-Roman',
    fontSize: 22,
    color: NAVY,
    letterSpacing: 1,
  },
  estateLabel: {
    fontSize: 11,
    color: GOLD,
    marginTop: 3,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  dateText: {
    fontSize: 9,
    color: MUTED,
  },
  docTitle: {
    fontSize: 9,
    color: MUTED,
    marginTop: 2,
  },

  // Summary bar
  summaryBar: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 0.5,
    borderColor: LIGHT,
    borderRadius: 6,
    padding: 10,
    alignItems: 'center',
  },
  summaryValue: {
    fontFamily: 'Times-Roman',
    fontSize: 18,
    color: NAVY,
  },
  summaryLabel: {
    fontSize: 8,
    color: MUTED,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: LIGHT,
  },
  sectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 7,
  },
  sectionTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    color: NAVY,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  sectionCount: {
    fontSize: 9,
    color: MUTED,
    marginLeft: 6,
  },

  // Item rows
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: LIGHT,
  },
  itemRowShaded: {
    backgroundColor: '#FFFFFF',
  },
  itemName: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    color: NAVY,
    flex: 2,
  },
  itemMeta: {
    fontSize: 8.5,
    color: MUTED,
    marginTop: 1.5,
  },
  assignee: {
    fontSize: 10,
    color: '#1A5C2E',
    fontFamily: 'Helvetica-Bold',
    flex: 1,
    textAlign: 'right',
  },
  suggestion: {
    fontSize: 9,
    color: '#1A5C2E',
    marginTop: 2,
  },
  claimant: {
    fontSize: 9,
    color: MUTED,
    marginTop: 1.5,
  },
  conflictFlag: {
    fontSize: 8,
    color: '#8B1A1A',
    fontFamily: 'Helvetica-Bold',
    backgroundColor: '#FDF0F0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },

  // Empty state
  emptyText: {
    fontSize: 9,
    color: MUTED,
    fontStyle: 'italic',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 44,
    right: 44,
    borderTopWidth: 0.5,
    borderTopColor: LIGHT,
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLeft: {
    fontSize: 8,
    color: GOLD,
    fontFamily: 'Times-Roman',
  },
  footerRight: {
    fontSize: 8,
    color: MUTED,
  },
  disclaimer: {
    fontSize: 7.5,
    color: MUTED,
    marginTop: 4,
    fontStyle: 'italic',
  },
});

// ── Section component ─────────────────────────────────────────────────────────
function Section({ title, count, dotColor, children }) {
  return (
    <View>
      <View style={S.sectionHeader}>
        <View style={[S.sectionDot, { backgroundColor: dotColor }]} />
        <Text style={S.sectionTitle}>{title}</Text>
        <Text style={S.sectionCount}>({count})</Text>
      </View>
      {children}
    </View>
  );
}

// ── PDF Document ──────────────────────────────────────────────────────────────
export function HeirloomPDF({ estate, analysis }) {
  const date = new Date().toLocaleDateString('en-CA', {
    month: 'long', day: 'numeric', year: 'numeric',
  });

  const totalItems =
    analysis.hardConflicts.length +
    analysis.softConflicts.length +
    analysis.uncontested.length +
    analysis.unclaimed.length;

  return (
    <Document title={`Heirloom — ${estate.name} Distribution Summary`} author="Heirloom">
      <Page size="A4" style={S.page}>

        {/* Header */}
        <View style={S.header}>
          <View>
            <Text style={S.logoText}>Heirloom</Text>
            <Text style={S.estateLabel}>{estate.name}</Text>
          </View>
          <View style={S.headerRight}>
            <Text style={S.dateText}>Generated {date}</Text>
            <Text style={S.docTitle}>Distribution Summary</Text>
          </View>
        </View>

        {/* Summary bar */}
        <View style={S.summaryBar}>
          {[
            { value: analysis.totalSubmissions, label: 'Submissions' },
            { value: totalItems,                label: 'Total items' },
            { value: analysis.uncontested.length,   label: 'Uncontested' },
            { value: analysis.hardConflicts.length + analysis.softConflicts.length, label: 'In conflict' },
          ].map((s) => (
            <View key={s.label} style={S.summaryCard}>
              <Text style={S.summaryValue}>{s.value}</Text>
              <Text style={S.summaryLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Uncontested */}
        <Section title="Uncontested — Ready to Assign" count={analysis.uncontested.length} dotColor="#28A745">
          {analysis.uncontested.length === 0 ? (
            <Text style={S.emptyText}>No uncontested items.</Text>
          ) : analysis.uncontested.map((item, i) => (
            <View key={item.id} style={[S.itemRow, i % 2 === 0 ? S.itemRowShaded : {}]}>
              <View style={{ flex: 2 }}>
                <Text style={S.itemName}>{item.name}</Text>
                <Text style={S.itemMeta}>{[item.room, item.category].filter(Boolean).join(' · ')}</Text>
              </View>
              <Text style={S.assignee}>→ {item.claimants[0]?.personName}</Text>
            </View>
          ))}
        </Section>

        {/* Soft conflicts */}
        <Section title="Soft Conflicts — Suggestion Available" count={analysis.softConflicts.length} dotColor="#C9A84C">
          {analysis.softConflicts.length === 0 ? (
            <Text style={S.emptyText}>No soft conflicts.</Text>
          ) : analysis.softConflicts.map((item, i) => (
            <View key={item.id} style={[S.itemRow, i % 2 === 0 ? S.itemRowShaded : {}]}>
              <View style={{ flex: 1 }}>
                <Text style={S.itemName}>{item.name}</Text>
                <Text style={S.itemMeta}>{[item.room, item.category].filter(Boolean).join(' · ')}</Text>
                <Text style={S.suggestion}>Suggested: {item.suggestedAssignee}</Text>
                {item.claimants.slice(1).map((c, ci) => (
                  <Text key={ci} style={S.claimant}>Also wanted by {c.personName} (ranked #{c.rank})</Text>
                ))}
              </View>
            </View>
          ))}
        </Section>

        {/* Hard conflicts */}
        <Section title="Hard Conflicts — Requires Discussion" count={analysis.hardConflicts.length} dotColor="#DC3545">
          {analysis.hardConflicts.length === 0 ? (
            <Text style={S.emptyText}>No hard conflicts.</Text>
          ) : analysis.hardConflicts.map((item, i) => (
            <View key={item.id} style={[S.itemRow, i % 2 === 0 ? S.itemRowShaded : {}]}>
              <View style={{ flex: 1 }}>
                <Text style={S.itemName}>{item.name}</Text>
                <Text style={S.itemMeta}>{[item.room, item.category].filter(Boolean).join(' · ')}</Text>
                <Text style={S.claimant}>Tied at #1: {item.claimants.map((c) => c.personName).join(', ')}</Text>
              </View>
              <Text style={S.conflictFlag}>Needs resolution</Text>
            </View>
          ))}
        </Section>

        {/* Unclaimed */}
        <Section title="Unclaimed — No Interest" count={analysis.unclaimed.length} dotColor="#8A7F72">
          {analysis.unclaimed.length === 0 ? (
            <Text style={S.emptyText}>Every item has at least one interested family member.</Text>
          ) : analysis.unclaimed.map((item, i) => (
            <View key={item.id} style={[S.itemRow, i % 2 === 0 ? S.itemRowShaded : {}]}>
              <View>
                <Text style={S.itemName}>{item.name}</Text>
                <Text style={S.itemMeta}>{[item.room, item.category].filter(Boolean).join(' · ')}</Text>
              </View>
            </View>
          ))}
        </Section>

        {/* Submissions received */}
        <Section title="Submissions Received" count={analysis.totalSubmissions} dotColor={NAVY}>
          {analysis.wishlists.map((w, i) => (
            <View key={i} style={[S.itemRow, i % 2 === 0 ? S.itemRowShaded : {}]}>
              <Text style={S.itemName}>{w.personName}</Text>
              <Text style={S.itemMeta}>{w.items?.length ?? 0} item{w.items?.length !== 1 ? 's' : ''} ranked</Text>
            </View>
          ))}
        </Section>

        {/* Footer */}
        <View style={S.footer} fixed>
          <View>
            <Text style={S.footerLeft}>Heirloom — heirloom-app.ca</Text>
            <Text style={S.disclaimer}>
              This document is a decision-support summary only. It is not a legal instrument.{'\n'}
              Asset distribution is subject to the will, provincial law, and executor authority.
            </Text>
          </View>
          <Text style={S.footerRight} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>

      </Page>
    </Document>
  );
}

// ── Download helper ───────────────────────────────────────────────────────────
export async function downloadDistributionPDF(estate, analysis) {
  const doc   = <HeirloomPDF estate={estate} analysis={analysis} />;
  const blob  = await pdf(doc).toBlob();
  const url   = URL.createObjectURL(blob);
  const a     = document.createElement('a');
  const slug  = estate.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  a.href      = url;
  a.download  = `heirloom-${slug}-distribution.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
