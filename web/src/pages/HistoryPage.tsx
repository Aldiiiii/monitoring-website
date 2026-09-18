import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check, fetchChecks, fetchIncidents, fetchMonitors, Incident, Monitor } from '../lib/api';
import { useAuth } from '../lib/useAuth';

const PAGE_SIZE = 50;

export default function HistoryPage() {
  useAuth();
  const [selectedId, setSelectedId] = useState('');
  const [checksPage, setChecksPage] = useState(0);
  const [incidentsPage, setIncidentsPage] = useState(0);

  const monitorsQuery = useQuery({
    queryKey: ['monitors'],
    queryFn: fetchMonitors,
  });

  useEffect(() => {
    if (!selectedId && monitorsQuery.data && monitorsQuery.data.length > 0) {
      setSelectedId(monitorsQuery.data[0].id);
    }
  }, [selectedId, monitorsQuery.data]);

  useEffect(() => {
    setChecksPage(0);
    setIncidentsPage(0);
  }, [selectedId]);

  const checksQuery = useQuery({
    queryKey: ['checks', selectedId, checksPage],
    queryFn: () => fetchChecks(selectedId, checksPage * PAGE_SIZE, PAGE_SIZE),
    enabled: Boolean(selectedId),
  });

  const incidentsQuery = useQuery({
    queryKey: ['incidents', selectedId, incidentsPage],
    queryFn: () => fetchIncidents(selectedId, incidentsPage * PAGE_SIZE, PAGE_SIZE),
    enabled: Boolean(selectedId),
  });

  const monitors = monitorsQuery.data ?? [];
  const selected = monitors.find((monitor) => monitor.id === selectedId) as
    | Monitor
    | undefined;

  const checksData = checksQuery.data;
  const checks = checksData?.data ?? [];
  const checksTotal = checksData?.total ?? 0;
  const checksTotalPages = Math.max(1, Math.ceil(checksTotal / PAGE_SIZE));

  const incidentsData = incidentsQuery.data;
  const incidents = incidentsData?.data ?? [];
  const incidentsTotal = incidentsData?.total ?? 0;
  const incidentsTotalPages = Math.max(1, Math.ceil(incidentsTotal / PAGE_SIZE));

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
              {!checksQuery.isLoading && checks.length === 0 && (
                <div className="empty">No checks yet.</div>
              )}
              {checks.length > 0 && (
                <>
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
                      {checks.map((check) => (
                        <tr key={check.id}>
                          <td>{formatDate(check.checkedAt)}</td>
                          <td>{check.status}</td>
                          <td>{check.latencyMs ? `${check.latencyMs} ms` : '-'}</td>
                          <td className="mono">{check.error ?? '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="pagination">
                    <span className="pagination-info">
                      {checksTotal} result{checksTotal !== 1 ? 's' : ''}
                    </span>
                    <div className="pagination-controls">
                      <button
                        className="pagination-btn"
                        disabled={checksPage === 0}
                        onClick={() => setChecksPage((p) => p - 1)}
                      >
                        Prev
                      </button>
                      <span className="pagination-page">
                        {checksPage + 1} / {checksTotalPages}
                      </span>
                      <button
                        className="pagination-btn"
                        disabled={checksPage >= checksTotalPages - 1}
                        onClick={() => setChecksPage((p) => p + 1)}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </>
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
              {!incidentsQuery.isLoading && incidents.length === 0 && (
                <div className="empty">No incidents yet.</div>
              )}
              {incidents.length > 0 && (
                <>
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
                      {incidents.map((incident) => (
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
                  <div className="pagination">
                    <span className="pagination-info">
                      {incidentsTotal} result{incidentsTotal !== 1 ? 's' : ''}
                    </span>
                    <div className="pagination-controls">
                      <button
                        className="pagination-btn"
                        disabled={incidentsPage === 0}
                        onClick={() => setIncidentsPage((p) => p - 1)}
                      >
                        Prev
                      </button>
                      <span className="pagination-page">
                        {incidentsPage + 1} / {incidentsTotalPages}
                      </span>
                      <button
                        className="pagination-btn"
                        disabled={incidentsPage >= incidentsTotalPages - 1}
                        onClick={() => setIncidentsPage((p) => p + 1)}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
