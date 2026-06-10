import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { SimulationResult } from './simulator';

const fmt = (v: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(v);

const freqLabel: Record<string, string> = {
  weekly: 'Weekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
};

export function exportToPDF(result: SimulationResult, viewMode: 'monthly' | 'yearly') {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const { params } = result;
  const rows = viewMode === 'monthly' ? result.monthRows : result.yearRows;

  const freq =
    params.contributionFrequency === 'every-x-months'
      ? `Every ${params.contributionEveryX} months`
      : freqLabel[params.contributionFrequency];

  // Title
  doc.setFillColor(5, 9, 15);
  doc.rect(0, 0, 297, 297, 'F');

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(216, 234, 255);
  doc.text('Money Simulator — Growth Projection', 15, 18);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(94, 122, 158);

  const paramText = [
    [
      `Starting Amount: ${fmt(params.startingAmount)}`,
      `Contribution: ${fmt(params.contributionAmount)} ${freq}`,
      `Interest: ${params.interestRate}% ${params.interestRateType}`,
      `Period: ${params.years} years`,
      `View: ${viewMode}`,
    ].join('   ·   '),
    [
      `Final Balance: ${fmt(result.finalBalance)}`,
      `Total Contributed: ${fmt(result.totalContributed)}`,
      `Total Interest: ${fmt(result.totalInterest)}`,
      `Return: ${result.totalReturnPct.toFixed(1)}%`,
    ].join('   ·   '),
  ];

  let curY = 26;
  paramText.forEach(line => {
    doc.text(line, 15, curY);
    curY += 6;
  });

  autoTable(doc, {
    head: [['Period', 'Start Balance', 'Contributions', 'Interest Earned', 'End Balance', 'Total Contributed', 'Total Interest']],
    body: rows.map(r => [
      r.period,
      fmt(r.startBalance),
      r.contributions > 0 ? fmt(r.contributions) : '—',
      fmt(r.interestEarned),
      fmt(r.endBalance),
      fmt(r.totalContributed),
      fmt(r.totalInterest),
    ]),
    foot: [[
      'TOTAL',
      '—',
      fmt(rows.reduce((s, r) => s + r.contributions, 0)),
      fmt(rows.reduce((s, r) => s + r.interestEarned, 0)),
      fmt(result.finalBalance),
      fmt(result.totalContributed),
      fmt(result.totalInterest),
    ]],
    startY: curY + 2,
    styles: {
      fontSize: 7.5,
      cellPadding: 3,
      font: 'helvetica',
      textColor: [216, 234, 255],
      fillColor: [16, 30, 48],
      lineColor: [23, 40, 64],
      lineWidth: 0.3,
    },
    headStyles: {
      fillColor: [13, 25, 41],
      textColor: [94, 122, 158],
      fontStyle: 'bold',
      fontSize: 7,
    },
    footStyles: {
      fillColor: [13, 25, 41],
      textColor: [216, 234, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [12, 22, 38],
    },
    columnStyles: {
      0: { halign: 'left', textColor: [94, 122, 158] },
      1: { halign: 'right' },
      2: { halign: 'right', textColor: [91, 155, 255] },
      3: { halign: 'right', textColor: [0, 230, 118] },
      4: { halign: 'right', fontStyle: 'bold' },
      5: { halign: 'right' },
      6: { halign: 'right' },
    },
  });

  doc.save(
    `money-simulator-${viewMode}-${params.years}yr-${new Date().toISOString().slice(0, 10)}.pdf`,
  );
}
