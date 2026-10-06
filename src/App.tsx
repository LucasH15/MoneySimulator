import { useState, useMemo } from 'react';
import { simulateInvestment } from './lib/simulator';
import type { SimulationParams } from './lib/simulator';
import InputPanel from './components/InputPanel';
import SummaryCards from './components/SummaryCards';
import GrowthChart from './components/GrowthChart';
import ResultsTable from './components/ResultsTable';
import './App.css';

const DEFAULT_PARAMS: SimulationParams = {
  startingAmount: 10_000,
  contributionAmount: 500,
  contributionFrequency: 'monthly',
  contributionEveryX: 3,
  interestRate: 7,
  interestRateType: 'yearly',
  taxRate: 0,
  years: 10,
};

export default function App() {
  const [params, setParams] = useState<SimulationParams>(DEFAULT_PARAMS);
  const [viewMode, setViewMode] = useState<'monthly' | 'yearly'>('yearly');

  const result = useMemo(() => simulateInvestment(params), [params]);

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="header-logo">$</div>
          <div>
            <h1 className="app-title">Money Simulator</h1>
            <p className="app-subtitle">Compound interest & investment growth calculator</p>
          </div>
        </div>
      </header>

      <main className="app-main">
        <InputPanel params={params} onChange={setParams} />
        <SummaryCards result={result} />
        <GrowthChart result={result} viewMode={viewMode} />
        <ResultsTable result={result} viewMode={viewMode} onViewModeChange={setViewMode} />
      </main>

      <footer className="app-footer">
        <p>Calculations are estimates only and do not constitute financial advice.</p>
      </footer>
    </div>
  );
}
