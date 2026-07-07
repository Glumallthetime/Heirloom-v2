export function analyzeConflicts(submissions, allItems = []) {
  const wishlists = submissions.map((sub) => ({
    personName:  sub.family_name,
    email:       sub.family_email || '',
    submittedAt: sub.submitted_at,
    items:       (sub.wishlist_items || []).map((wi) => ({
      id:       wi.item_id,
      name:     wi.items?.name     || '',
      category: wi.items?.category || '',
      room:     wi.items?.room     || '',
      rank:     wi.rank_position,
    })),
  }));

  const itemMap = {};
  wishlists.forEach((person) => {
    person.items.forEach((item) => {
      const key = item.id;
      if (!key) return;
      if (!itemMap[key]) {
        itemMap[key] = { id: item.id, name: item.name, category: item.category, room: item.room, claimants: [] };
      }
      itemMap[key].claimants.push({ personName: person.personName, rank: item.rank });
    });
  });

  const hardConflicts = [], softConflicts = [], uncontested = [];
  const byName = (a, b) => a.name.localeCompare(b.name);

  Object.values(itemMap).forEach((item) => {
    const sorted = [...item.claimants].sort((a, b) => a.rank - b.rank);
    if (sorted.length === 1) {
      uncontested.push({ ...item, claimants: sorted });
    } else {
      const topRank = sorted[0].rank;
      const topCount = sorted.filter((c) => c.rank === topRank).length;
      if (topCount > 1) {
        hardConflicts.push({ ...item, claimants: sorted });
      } else {
        softConflicts.push({ ...item, claimants: sorted, suggestedAssignee: sorted[0].personName });
      }
    }
  });

  hardConflicts.sort(byName);
  softConflicts.sort(byName);
  uncontested.sort(byName);

  const claimedIds = new Set(Object.keys(itemMap));
  const unclaimed  = allItems.filter((i) => !claimedIds.has(i.id)).sort(byName);

  return { hardConflicts, softConflicts, uncontested, unclaimed, wishlists, totalSubmissions: submissions.length };
}

export function exportToCSV(analysis) {
  const rows = [['Status', 'Item Name', 'Category', 'Room', 'Suggested Assignee', 'Claimants (name: rank)']];
  const add  = (items, status) => items.forEach((item) => rows.push([
    status, item.name, item.category, item.room,
    item.suggestedAssignee || item.claimants?.[0]?.personName || '—',
    (item.claimants || []).map((c) => `${c.personName}: #${c.rank}`).join(' | ') || '—',
  ]));
  add(analysis.hardConflicts, 'Hard Conflict');
  add(analysis.softConflicts, 'Soft Conflict');
  add(analysis.uncontested,   'Uncontested');
  add(analysis.unclaimed,     'Unclaimed');
  return rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
}
