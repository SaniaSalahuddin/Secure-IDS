export function formatAttackLabel(type) {
  if (!type) return "Unknown";
  if (type === "normal") return "Normal";
  return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function buildAttackAnalytics(attacks = []) {
  const totalScans = attacks.length;
  const threats = attacks.filter((a) => a.attackType && a.attackType !== "normal");
  const safe = totalScans - threats.length;

  const typeCounts = {};
  attacks.forEach((a) => {
    const key = a.attackType || "unknown";
    typeCounts[key] = (typeCounts[key] || 0) + 1;
  });

  const byDate = {};
  attacks.forEach((a) => {
    const day = new Date(a.createdAt).toLocaleDateString();
    byDate[day] = (byDate[day] || 0) + 1;
  });

  const dateLabels = Object.keys(byDate).sort(
    (a, b) => new Date(a) - new Date(b)
  );
  const dateValues = dateLabels.map((d) => byDate[d]);

  const typeLabels = Object.keys(typeCounts).map(formatAttackLabel);
  const typeValues = Object.keys(typeCounts).map((k) => typeCounts[k]);
  const typeKeys = Object.keys(typeCounts);

  const confidences = attacks
    .map((a) => Number(a.confidence))
    .filter((c) => !Number.isNaN(c));
  const avgConfidence =
    confidences.length > 0
      ? confidences.reduce((s, c) => s + c, 0) / confidences.length
      : 0;

  return {
    totalScans,
    threats: threats.length,
    safe,
    avgConfidence,
    typeCounts,
    typeLabels,
    typeValues,
    typeKeys,
    dateLabels,
    dateValues,
  };
}
