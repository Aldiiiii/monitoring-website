import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createMaintenanceWindow,
  deleteMaintenanceWindow,
  fetchMaintenanceWindows,
  fetchMonitors,
  MaintenanceWindow,
  MaintenanceWindowInput,
  Monitor,
  updateMaintenanceWindow,
} from '../lib/api';

export default function MaintenancePage() {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState('');
  const [editingWindow, setEditingWindow] = useState<MaintenanceWindow | null>(null);
  const [form, setForm] = useState<MaintenanceWindowInput>({
    monitorId: '',
    startAt: '',
    endAt: '',
    note: '',
  });

  const monitorsQuery = useQuery({
    queryKey: ['monitors'],
    queryFn: fetchMonitors,
  });

  useEffect(() => {
    if (!selectedId && monitorsQuery.data && monitorsQuery.data.length > 0) {
      setSelectedId(monitorsQuery.data[0].id);
    }
  }, [selectedId, monitorsQuery.data]);

  const maintenanceQuery = useQuery({
    queryKey: ['maintenance', selectedId],
    queryFn: () => fetchMaintenanceWindows(selectedId),
    enabled: Boolean(selectedId),
  });

  const createMutation = useMutation({
    mutationFn: createMaintenanceWindow,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['maintenance', selectedId] });
      setEditingWindow(null);
      setForm({
        monitorId: selectedId,
        startAt: '',
        endAt: '',
        note: '',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<MaintenanceWindowInput> }) =>
      updateMaintenanceWindow(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['maintenance', selectedId] });
      setEditingWindow(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMaintenanceWindow,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['maintenance', selectedId] });
    },
  });

  const monitors = monitorsQuery.data ?? [];
  const selected = monitors.find((monitor) => monitor.id === selectedId) as
    | Monitor
    | undefined;

  const toDatetimeLocal = (value?: string | null) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const pad = (num: number) => String(num).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
      date.getHours(),
    )}:${pad(date.getMinutes())}`;
  };

  const fromDatetimeLocal = (value: string) => new Date(value).toISOString();

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!selectedId) return;
    if (!form.startAt || !form.endAt) {
      alert('Start dan end wajib diisi.');
      return;
    }
    if (new Date(form.startAt) >= new Date(form.endAt)) {
      alert('End harus lebih besar dari start.');
      return;
    }

    const payload: MaintenanceWindowInput = {
      monitorId: selectedId,
      startAt: fromDatetimeLocal(form.startAt),
      endAt: fromDatetimeLocal(form.endAt),
      note: form.note,
    };

    if (editingWindow) {
      updateMutation.mutate({ id: editingWindow.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const formatDate = (value?: string | null) => {
    if (!value) return '-';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString();
  };

  return (
    <div className="page">
      <header className="header">
        <span className="badge">Downtime</span>
        <h1>Maintenance</h1>
        <p>Schedule maintenance windows for monitors.</p>
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
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <label>
                  Start
                  <input
                    type="datetime-local"
                    value={form.startAt}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        startAt: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label>
                  End
                  <input
                    type="datetime-local"
                    value={form.endAt}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        endAt: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label>
                  Note
                  <input
                    value={form.note ?? ''}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        note: event.target.value,
                      }))
                    }
                  />
                </label>
              </div>
              <div className="footer-actions">
                {editingWindow && (
                  <button
                    type="button"
                    className="button secondary"
                    onClick={() => {
                      setEditingWindow(null);
                      setForm({
                        monitorId: selectedId,
                        startAt: '',
                        endAt: '',
                        note: '',
                      });
                    }}
                  >
                    Cancel Edit
                  </button>
                )}
                <button className="button" type="submit">
                  {editingWindow ? 'Update' : 'Add'} Window
                </button>
              </div>
            </form>

            <div style={{ marginTop: 16 }}>
              {maintenanceQuery.isLoading && (
                <div className="empty">Loading maintenance windows...</div>
              )}
              {maintenanceQuery.error && (
                <div className="empty">
                  {(maintenanceQuery.error as Error).message ||
                    'Failed to load maintenance windows'}
                </div>
              )}
              {!maintenanceQuery.isLoading &&
                !maintenanceQuery.error &&
                (maintenanceQuery.data?.length ?? 0) === 0 && (
                  <div className="empty">No maintenance windows.</div>
                )}
              {!maintenanceQuery.isLoading &&
                !maintenanceQuery.error &&
                (maintenanceQuery.data?.length ?? 0) > 0 && (
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Start</th>
                        <th>End</th>
                        <th>Note</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(maintenanceQuery.data ?? []).map((window) => (
                        <tr key={window.id}>
                          <td>{formatDate(window.startAt)}</td>
                          <td>{formatDate(window.endAt)}</td>
                          <td>{window.note ?? '-'}</td>
                          <td>
                            <div className="toolbar">
                              <button
                                className="button ghost"
                                onClick={() => {
                                  setEditingWindow(window);
                                  setForm({
                                    monitorId: window.monitorId,
                                    startAt: toDatetimeLocal(window.startAt),
                                    endAt: toDatetimeLocal(window.endAt),
                                    note: window.note ?? '',
                                  });
                                }}
                              >
                                Edit
                              </button>
                              <button
                                className="button secondary"
                                onClick={() => {
                                  if (confirm('Delete this window?')) {
                                    deleteMutation.mutate(window.id);
                                  }
                                }}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
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
