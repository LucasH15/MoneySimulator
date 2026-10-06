import { useEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent, KeyboardEvent as ReactKeyboardEvent } from 'react';
import type { SimulationResult } from '../lib/simulator';
import { abbrev, fmtCurrency, niceCeil } from '../lib/format';

interface Props {
  result: SimulationResult;
  viewMode: 'monthly' | 'yearly';
}

interface ChartPoint {
  label: string;
  principal: number;
  interest: number;
  total: number;
}

const VB_H = 320;
const MARGIN = { top: 20, right: 16, bottom: 28, left: 60 };
const GAP_PX = 2;

export default function GrowthChart({ result, viewMode }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [width, setWidth] = useState(640);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      const w = entries[0]?.contentRect.width;
      if (w) setWidth(Math.round(w));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const rows = viewMode === 'monthly' ? result.monthRows : result.yearRows;

  const points: ChartPoint[] = useMemo(() => {
    const start: ChartPoint = {
      label: 'Start',
      principal: result.params.startingAmount,
      interest: 0,
      total: result.params.startingAmount,
    };
    const rest = rows.map(r => ({
      label: r.period,
      principal: result.params.startingAmount + r.totalContributed,
      interest: r.totalInterest,
      total: r.endBalance,
    }));
    return [start, ...rest];
  }, [rows, result.params.startingAmount]);

  const n = points.length;
  const plotW = Math.max(1, width - MARGIN.left - MARGIN.right);
  const plotH = VB_H - MARGIN.top - MARGIN.bottom;

  const yMax = useMemo(() => {
    const max = points.reduce((m, p) => Math.max(m, p.total), 0);
    return niceCeil(max * 1.05 || 1);
  }, [points]);

  const xScale = (i: number) => MARGIN.left + (n <= 1 ? 0 : (i / (n - 1)) * plotW);
  const yScale = (v: number) => MARGIN.top + plotH * (1 - v / yMax);
  const baseline = yScale(0);

  const principalTop = (i: number) => yScale(points[i].principal);
  const totalTop = (i: number) => yScale(points[i].total);
  const interestBottom = (i: number) => principalTop(i) - GAP_PX;
  const interestTop = (i: number) => Math.min(totalTop(i), interestBottom(i));

  const areaPath = (topFn: (i: number) => number, bottomFn: (i: number) => number) => {
    const forward = points.map((_, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${topFn(i)}`);
    const backward = [...points.keys()].reverse().map(i => `L ${xScale(i)} ${bottomFn(i)}`);
    return `${forward.join(' ')} ${backward.join(' ')} Z`;
  };

  const linePath = (fn: (i: number) => number) =>
    points.map((_, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${fn(i)}`).join(' ');

  const principalAreaD = areaPath(principalTop, () => baseline);
  const interestAreaD = areaPath(interestTop, interestBottom);
  const principalLineD = linePath(principalTop);
  const totalLineD = linePath(totalTop);

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(f => yMax * f);

  const xTickCount = Math.max(2, Math.min(6, n, Math.floor(width / 100)));
  const xTickIndices = Array.from({ length: xTickCount }, (_, i) =>
    Math.round((i / (xTickCount - 1)) * (n - 1))
  ).filter((v, i, arr) => arr.indexOf(v) === i);

  const [hover, setHover] = useState<number | null>(null);

  const indexFromClientX = (clientX: number) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    const scaleX = width / rect.width;
    const vbX = (clientX - rect.left) * scaleX;
    const t = (vbX - MARGIN.left) / plotW;
    return Math.min(n - 1, Math.max(0, Math.round(t * (n - 1))));
  };

  const handlePointerMove = (e: ReactPointerEvent<SVGRectElement>) => {
    setHover(indexFromClientX(e.clientX));
  };

  const handleKeyDown = (e: ReactKeyboardEvent<SVGSVGElement>) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      setHover(h => Math.min(n - 1, (h ?? -1) + 1));
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setHover(h => Math.max(0, (h ?? n) - 1));
    } else if (e.key === 'Escape') {
      setHover(null);
    }
  };

  const hoverPoint = hover !== null ? points[hover] : null;
  const hoverX = hover !== null ? xScale(hover) : 0;
  const tooltipFlip = hover !== null && hoverX > MARGIN.left + plotW * 0.65;

  return (
    <div className="card chart-card">
      <div className="chart-header">
        <h2 className="panel-title">Balance Growth</h2>
        <div className="chart-legend">
          <span className="legend-item">
            <span className="legend-swatch" style={{ background: 'var(--chart-principal)' }} />
            Principal
          </span>
          <span className="legend-item">
            <span className="legend-swatch" style={{ background: 'var(--chart-interest)' }} />
            Interest
          </span>
        </div>
      </div>

      <div className="chart-wrap" ref={containerRef}>
        <svg
          ref={svgRef}
          className="chart-svg"
          viewBox={`0 0 ${width} ${VB_H}`}
          tabIndex={0}
          onKeyDown={handleKeyDown}
          role="img"
          aria-label={`Balance growth over time: principal and interest stacked, ending at ${fmtCurrency(points[n - 1].total)}`}
        >
          {yTicks.map((t, i) => (
            <g key={i}>
              <line
                x1={MARGIN.left}
                x2={width - MARGIN.right}
                y1={yScale(t)}
                y2={yScale(t)}
                className="chart-grid"
                vectorEffect="non-scaling-stroke"
              />
              <text
                x={MARGIN.left - 10}
                y={yScale(t)}
                textAnchor="end"
                dominantBaseline="middle"
                className="chart-axis-label"
              >
                {abbrev(t)}
              </text>
            </g>
          ))}

          {xTickIndices.map(i => (
            <text
              key={i}
              x={xScale(i)}
              y={VB_H - MARGIN.bottom + 20}
              textAnchor={i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}
              className="chart-axis-label"
            >
              {points[i].label}
            </text>
          ))}

          <path d={principalAreaD} className="chart-area chart-area-principal" />
          <path d={interestAreaD} className="chart-area chart-area-interest" />

          <path d={principalLineD} className="chart-line chart-line-principal" vectorEffect="non-scaling-stroke" />
          <path d={totalLineD} className="chart-line chart-line-total" vectorEffect="non-scaling-stroke" />

          <text
            x={xScale(n - 1) - 4}
            y={totalTop(n - 1) - 10}
            textAnchor="end"
            className="chart-end-label"
          >
            {abbrev(points[n - 1].total)}
          </text>

          {hover !== null && (
            <g>
              <line
                x1={hoverX}
                x2={hoverX}
                y1={MARGIN.top}
                y2={baseline}
                className="chart-crosshair"
                vectorEffect="non-scaling-stroke"
              />
              <circle
                cx={hoverX}
                cy={principalTop(hover)}
                r={4}
                className="chart-dot chart-dot-principal"
                vectorEffect="non-scaling-stroke"
              />
              <circle
                cx={hoverX}
                cy={totalTop(hover)}
                r={4}
                className="chart-dot chart-dot-total"
                vectorEffect="non-scaling-stroke"
              />
            </g>
          )}

          <rect
            x={MARGIN.left}
            y={MARGIN.top}
            width={plotW}
            height={plotH}
            fill="transparent"
            onPointerMove={handlePointerMove}
            onPointerDown={handlePointerMove}
            onPointerLeave={() => setHover(null)}
          />
        </svg>

        {hoverPoint && (
          <div
            className="chart-tooltip"
            style={{
              left: `${(hoverX / width) * 100}%`,
              top: `${(totalTop(hover!) / VB_H) * 100}%`,
              transform: tooltipFlip ? 'translate(-100%, -50%)' : 'translate(8px, -50%)',
            }}
          >
            <div className="chart-tooltip-period">{hoverPoint.label}</div>
            <div className="chart-tooltip-row">
              <span className="chart-tooltip-key" style={{ background: 'var(--chart-interest)' }} />
              <span className="chart-tooltip-label">Interest</span>
              <span className="chart-tooltip-value">{fmtCurrency(hoverPoint.interest)}</span>
            </div>
            <div className="chart-tooltip-row">
              <span className="chart-tooltip-key" style={{ background: 'var(--chart-principal)' }} />
              <span className="chart-tooltip-label">Principal</span>
              <span className="chart-tooltip-value">{fmtCurrency(hoverPoint.principal)}</span>
            </div>
            <div className="chart-tooltip-row chart-tooltip-total">
              <span className="chart-tooltip-label">Total</span>
              <span className="chart-tooltip-value">{fmtCurrency(hoverPoint.total)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
