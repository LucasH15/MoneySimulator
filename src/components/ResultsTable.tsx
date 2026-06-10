import type { SimulationResult } from '../lib/simulator';
import { exportToPDF } from '../lib/pdfExport';

interface Props {
  result: SimulationResult;
  viewMode: 'monthly' | 'yearly';
  onViewModeChange: (m: 'monthly' | 'yearly') => void;
}

const fmt = (v: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(v);

export default function ResultsTable({ result, viewMode, onViewModeChange }: Props) {
  const rows = viewMode === 'monthly' ? result.monthRows : result.yearRows;
  const totalContribs  = rows.reduce((s, r) => s + r.contributions, 0);
  const totalInterest  = rows.reduce((s, r) => s + r.interestEarned, 0);

  return (
    <div className="results-section">
      <div className="results-header">
        <h2 className="panel-title">Growth Projection</h2>
        <div className="results-controls">
          <div className="toggle-group">
            <button
              className={`toggle-btn${viewMode === 'monthly' ? ' active' : ''}`}
              onClick={() => onViewModeChange('monthly')}
            >
              Monthly
            </button>
            <button
              className={`toggle-btn${viewMode === 'yearly' ? ' active' : ''}`}
              onClick={() => onViewModeChange('yearly')}
            >
              Yearly
            </button>
          </div>
          <button className="export-btn" onClick={() => exportToPDF(result, viewMode)}>
            <span className="export-icon">↓</span>
            Export PDF
          </button>
        </div>
      </div>

      <div className="card table-wrapper">
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Period</th>
                <th>Start Balance</th>
                <th>Contributions</th>
                <th>Interest Earned</th>
                <th>End Balance</th>
                <th>Total Contributed</th>
                <th>Total Interest</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td>{r.period}</td>
                  <td>{fmt(r.startBalance)}</td>
                  <td className={r.contributions > 0 ? 'col-contrib' : 'col-empty'}>
                    {r.contributions > 0 ? fmt(r.contributions) : '—'}
                  </td>
                  <td className="col-interest">{fmt(r.interestEarned)}</td>
                  <td className="col-balance">{fmt(r.endBalance)}</td>
                  <td>{fmt(r.totalContributed)}</td>
                  <td>{fmt(r.totalInterest)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="totals-row">
                <td>Totals</td>
                <td>—</td>
                <td className="col-contrib">{fmt(totalContribs)}</td>
                <td className="col-interest">{fmt(totalInterest)}</td>
                <td className="col-balance">{fmt(result.finalBalance)}</td>
                <td>{fmt(result.totalContributed)}</td>
                <td>{fmt(result.totalInterest)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
