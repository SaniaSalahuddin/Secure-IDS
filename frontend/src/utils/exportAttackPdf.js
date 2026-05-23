import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { formatAttackLabel, buildAttackAnalytics } from "./attackAnalytics";

export function exportAttacksPdf(attacks) {
  const analytics = buildAttackAnalytics(attacks);
  const doc = new jsPDF();
  const generated = new Date().toLocaleString();

  doc.setFontSize(18);
  doc.text("Intrusion Detection System — Attack Report", 14, 20);

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated: ${generated}`, 14, 28);

  doc.setTextColor(0);
  doc.setFontSize(12);
  doc.text("Summary", 14, 40);
  doc.setFontSize(10);
  doc.text(`Total scans: ${analytics.totalScans}`, 14, 48);
  doc.text(`Threats detected: ${analytics.threats}`, 14, 54);
  doc.text(`Normal traffic: ${analytics.safe}`, 14, 60);
  doc.text(`Average confidence: ${analytics.avgConfidence.toFixed(1)}%`, 14, 66);

  if (analytics.typeKeys.length > 0) {
    doc.text("Attack type breakdown:", 14, 76);
    let y = 82;
    analytics.typeKeys.forEach((key) => {
      doc.text(
        `  • ${formatAttackLabel(key)}: ${analytics.typeCounts[key]}`,
        14,
        y
      );
      y += 6;
    });
  }

  const tableStartY = Math.min(110, 82 + analytics.typeKeys.length * 6 + 10);

  autoTable(doc, {
    startY: tableStartY,
    head: [["Date", "Attack type", "Confidence", "Uploaded by"]],
    body: attacks.map((item) => [
      new Date(item.createdAt).toLocaleString(),
      formatAttackLabel(item.attackType),
      item.confidence != null ? `${Number(item.confidence).toFixed(1)}%` : "—",
      item.uploadedBy?.name || item.uploadedBy?.email || "—",
    ]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [6, 182, 212] },
  });

  doc.save(`IDS_Attack_Report_${Date.now()}.pdf`);
}
