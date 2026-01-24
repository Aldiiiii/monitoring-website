import type { UptimeSeriesPoint } from '../lib/api';

type UptimeChartProps = {
  points: UptimeSeriesPoint[];
};

export default function UptimeChart({ points }: UptimeChartProps) {
  if (points.length === 0) {
    return <div className="empty">No data</div>;
  }

  const width = 600;
  const height = 160;
  const padding = 20;
  const maxValue = 100;
  const minValue = 0;

  const coords = points.map((point, index) => {
    const x =
      padding + (index / Math.max(points.length - 1, 1)) * (width - padding * 2);
    const y =
      height -
      padding -
      ((point.uptimePercent - minValue) / (maxValue - minValue)) *
        (height - padding * 2);
    return `${x},${y}`;
  });

  const latest = points.at(-1);

  return (
    <div>
      <div className="chart-meta">
        <span className="mono">Latest: {latest?.uptimePercent ?? 0}%</span>
        <span className="mono">Range: 0 - 100%</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="chart">
        <defs>
          <linearGradient id="uptimeGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#2f8f5b" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#2f8f5b" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width={width} height={height} fill="#ffffff" rx="12" />
        <polyline
          fill="none"
          stroke="#2f8f5b"
          strokeWidth="3"
          points={coords.join(' ')}
        />
        <polygon
          points={`${coords.join(' ')} ${width - padding},${height - padding} ${padding},${height - padding}`}
          fill="url(#uptimeGradient)"
          opacity="0.7"
        />
      </svg>
    </div>
  );
}
