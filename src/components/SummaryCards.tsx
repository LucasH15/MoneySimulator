import type { SimulationResult } from '../lib/simulator';

interface Props {
  result: SimulationResult;
}

function abbrev(v: number): string {
  const abs = Math.abs(v);
  if (abs >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(2)}B`;
  if (abs >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `$${(v / 1_000).toFixed(1)}K`;
  return `$${v.toFixed(2)}`;
}

export default function SummaryCards({ result }: Props) {
  const totalInvested = result.params.startingAmount + result.totalContributed;

  const cards = [
    { label: 'Final Balance',      value: abbrev(result.finalBalance),      icon: '◆', color: 'accent' },
    { label: 'Total Invested',     value: abbrev(totalInvested),            icon: '▲', color: 'blue' },
    { label: 'Total Interest',     value: abbrev(result.totalInterest),     icon: '●', color: 'cyan' },
    { label: 'Total Return',       value: `${result.totalReturnPct.toFixed(1)}%`, icon: '%', color: 'gold' },
  ] as const;

  return (
    <div className="summary-grid">
      {cards.map(c => (
        <div key={c.label} className={`summary-card card-${c.color}`}>
          <div className="summary-icon">{c.icon}</div>
          <div>
            <div className="summary-label">{c.label}</div>
            <div className="summary-value">{c.value}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
