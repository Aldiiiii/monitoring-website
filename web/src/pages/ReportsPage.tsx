import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchMonitors, fetchUptimeReport, Monitor } from '../lib/api';
import UptimeChart from '../components/UptimeChart';
import { useAuth } from '../lib/useAuth';

export default function ReportsPage() {
  useAuth();
  const [selectedId, setSelectedId] = useState('');
  const [days, setDays] = useState(7);

  const monitorsQuery = useQuery({
    queryKey: ['monitors'],
    queryFn: fetchMonitors,
  });

  useEffect(() => {
    if (!selectedId && monitorsQuery.data && monitorsQuery.data.length > 0) {
      setSelectedId(monitorsQuery.data[0].id);
    }
  }, [selectedId, monitorsQuery.data]);

  const reportQuery = useQuery({
    queryKey: ['uptime-report', selectedId, days],
    queryFn: () => fetchUptimeReport(selectedId, days),
    enabled: Boolean(selectedId),
  });

  const monitors = monitorsQuery.data ?? [];
  const selected = monitors.find((monitor) => monitor.id === selectedId) as
    | Monitor
    | undefined;

  return (
    <div className="page">
      <header className="header">
        <span className="badge">Uptime</span>
        <h1>Reports</h1>
        <p>Uptime summary for the last 7 or 30 days.</p>
      </header>

      <section className="card">
        <div className="toolbar">
          <label>
            Monitor
            <select
              value={selectedId}
              onChange={(event) => setSelectedId(event.target.value)}
            >
              {monitors.map((monitor) => (
                <option key={monitor.id} value={monitor.id}>
                  {monitor.name}
                </option>
              ))}
            </select>
          </label>
          <button
            className={`button ${days === 7 ? '' : 'secondary'}`}
            onClick={() => setDays(7)}
          >
            7 days
          </button>
          <button
            className={`button ${days === 30 ? '' : 'secondary'}`}
            onClick={() => setDays(30)}
          >
            30 days
          </button>
        </div>

        {monitorsQuery.isLoading && <div className="empty">Loading monitors...</div>}
        {monitorsQuery.error && (
          <div className="empty">
            {(monitorsQuery.error as Error).message || 'Failed to load monitors'}
          </div>
        )}
        {!monitorsQuery.isLoading && monitors.length === 0 && (
          <div className="empty">No monitors available.</div>
        )}

        {selected && reportQuery.data && (
          <div style={{ marginTop: 16 }}>
            <h2>{selected.name}</h2>
            <p className="mono">
              Uptime: {reportQuery.data.uptimePercent}% ({reportQuery.data.upChecks}/
              {reportQuery.data.totalChecks})
            </p>
            <UptimeChart points={reportQuery.data.series} />
          </div>
        )}
        {reportQuery.isLoading && <div className="empty">Loading report...</div>}
        {reportQuery.error && (
          <div className="empty">
            {(reportQuery.error as Error).message || 'Failed to load report'}
          </div>
        )}
      </section>
    </div>
  );
}
