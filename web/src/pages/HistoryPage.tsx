import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check, fetchChecks, fetchIncidents, fetchMonitors, Incident, Monitor } from '../lib/api';

export default function HistoryPage() {
  const [selectedId, setSelectedId] = useState('');

  const monitorsQuery = useQuery({
    queryKey: ['monitors'],
    queryFn: fetchMonitors,
  });

  useEffect(() => {
    if (!selectedId && monitorsQuery.data && monitorsQuery.data.length > 0) {
      setSelectedId(monitorsQuery.data[0].id);
    }
  }, [selectedId, monitorsQuery.data]);

  const checksQuery = useQuery<Check[]>({
    queryKey: ['checks', selectedId],
    queryFn: () => fetchChecks(selectedId),
    enabled: Boolean(selectedId),
  });

  const incidentsQuery = useQuery<Incident[]>({
    queryKey: ['incidents', selectedId],
    queryFn: () => fetchIncidents(selectedId),
    enabled: Boolean(selectedId),
  });

  const monitors = monitorsQuery.data ?? [];
  const selected = monitors.find((monitor) => monitor.id === selectedId) as
    | Monitor
    | undefined;

  const formatDate = (value?: string | null) => {
    if (!value) return '-';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString();
  };

  return (
    <div className="page">
      <header className="header">
        <span className="badge">Timeline</span>
        <h1>History</h1>
        <p>Recent checks and incidents for a monitor.</p>
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

        {selected && (
          <div style={{ marginTop: 16 }}>
            <h2>{selected.name}</h2>
            <div style={{ marginTop: 16 }}>
              <h3>Recent Checks</h3>
              {checksQuery.isLoading && <div className="empty">Loading checks...</div>}
              {checksQuery.error && (
                <div className="empty">
                  {(checksQuery.error as Error).message || 'Failed to load checks'}
                </div>
              )}
              {!checksQuery.isLoading && (checksQuery.data?.length ?? 0) === 0 && (
                <div className="empty">No checks yet.</div>
              )}
              {(checksQuery.data?.length ?? 0) > 0 && (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Status</th>
                      <th>Latency</th>
                      <th>Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(checksQuery.data ?? []).map((check) => (
                      <tr key={check.id}>
                        <td>{formatDate(check.checkedAt)}</td>
                        <td>{check.status}</td>
                        <td>{check.latencyMs ? `${check.latencyMs} ms` : '-'}</td>
                        <td className="mono">{check.error ?? '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div style={{ marginTop: 18 }}>
              <h3>Recent Incidents</h3>
              {incidentsQuery.isLoading && <div className="empty">Loading incidents...</div>}
              {incidentsQuery.error && (
                <div className="empty">
                  {(incidentsQuery.error as Error).message || 'Failed to load incidents'}
                </div>
              )}
              {!incidentsQuery.isLoading && (incidentsQuery.data?.length ?? 0) === 0 && (
                <div className="empty">No incidents yet.</div>
              )}
              {(incidentsQuery.data?.length ?? 0) > 0 && (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Start</th>
                      <th>End</th>
                      <th>Duration</th>
                      <th>Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(incidentsQuery.data ?? []).map((incident) => (
                      <tr key={incident.id}>
                        <td>{formatDate(incident.startedAt)}</td>
                        <td>{formatDate(incident.endedAt ?? undefined)}</td>
                        <td>
                          {incident.durationSec
                            ? `${Math.round(incident.durationSec / 60)} min`
                            : '-'}
                        </td>
                        <td className="mono">{incident.reason ?? '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
