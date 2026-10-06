import type { SimulationParams } from '../lib/simulator';

interface Props {
  params: SimulationParams;
  onChange: (p: SimulationParams) => void;
}

export default function InputPanel({ params, onChange }: Props) {
  const set = (partial: Partial<SimulationParams>) => onChange({ ...params, ...partial });

  return (
    <div className="card input-panel">
      <h2 className="panel-title">Simulation Parameters</h2>

      <div className="input-grid">
        {/* Starting Amount */}
        <div className="input-group">
          <label className="input-label">Starting Amount</label>
          <div className="input-wrapper">
            <span className="input-adornment prefix">$</span>
            <input
              type="number"
              className="input-field"
              value={params.startingAmount}
              min={0}
              step={1000}
              onChange={e => set({ startingAmount: Math.max(0, parseFloat(e.target.value) || 0) })}
            />
          </div>
        </div>

        {/* Contribution Amount */}
        <div className="input-group">
          <label className="input-label">Contribution Amount</label>
          <div className="input-wrapper">
            <span className="input-adornment prefix">$</span>
            <input
              type="number"
              className="input-field"
              value={params.contributionAmount}
              min={0}
              step={100}
              onChange={e => set({ contributionAmount: Math.max(0, parseFloat(e.target.value) || 0) })}
            />
          </div>
        </div>

        {/* Frequency */}
        <div className="input-group">
          <label className="input-label">Frequency</label>
          <div className="freq-row">
            <div className="input-wrapper">
              <select
                className="input-field select-field"
                value={params.contributionFrequency}
                onChange={e =>
                  set({ contributionFrequency: e.target.value as SimulationParams['contributionFrequency'] })
                }
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="every-x-months">Every X months</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            {params.contributionFrequency === 'every-x-months' && (
              <div className="input-wrapper x-input">
                <span className="input-adornment prefix">x=</span>
                <input
                  type="number"
                  className="input-field"
                  value={params.contributionEveryX}
                  min={1}
                  max={24}
                  step={1}
                  onChange={e =>
                    set({ contributionEveryX: Math.max(1, parseInt(e.target.value) || 1) })
                  }
                />
              </div>
            )}
          </div>
        </div>

        {/* Interest Rate */}
        <div className="input-group">
          <label className="input-label">Interest Rate</label>
          <div className="input-wrapper">
            <input
              type="number"
              className="input-field"
              value={params.interestRate}
              min={0}
              max={1000}
              step={0.1}
              onChange={e => set({ interestRate: Math.max(0, parseFloat(e.target.value) || 0) })}
            />
            <span className="input-adornment suffix">%</span>
          </div>
        </div>

        {/* Rate Type */}
        <div className="input-group">
          <label className="input-label">Rate Period</label>
          <div className="toggle-group">
            <button
              className={`toggle-btn${params.interestRateType === 'monthly' ? ' active' : ''}`}
              onClick={() => set({ interestRateType: 'monthly' })}
            >
              Monthly
            </button>
            <button
              className={`toggle-btn${params.interestRateType === 'yearly' ? ' active' : ''}`}
              onClick={() => set({ interestRateType: 'yearly' })}
            >
              Yearly
            </button>
          </div>
        </div>

        {/* Tax Rate */}
        <div className="input-group">
          <label className="input-label">Tax on Interest</label>
          <div className="input-wrapper">
            <input
              type="number"
              className="input-field"
              value={params.taxRate}
              min={0}
              max={100}
              step={1}
              onChange={e =>
                set({ taxRate: Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)) })
              }
            />
            <span className="input-adornment suffix">%</span>
          </div>
        </div>

        {/* Years */}
        <div className="input-group">
          <label className="input-label">Years to Simulate</label>
          <div className="input-wrapper">
            <input
              type="number"
              className="input-field"
              value={params.years}
              min={1}
              max={100}
              step={1}
              onChange={e =>
                set({ years: Math.max(1, Math.min(100, parseInt(e.target.value) || 1)) })
              }
            />
            <span className="input-adornment suffix">yrs</span>
          </div>
        </div>
      </div>
    </div>
  );
}
