import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';
import {
  ChannelType,
  createMaintenanceWindow,
  createNotificationChannel,
  createMonitor,
  deleteMaintenanceWindow,
  deleteNotificationChannel,
  deleteMonitor,
  fetchChecks,
  fetchIncidents,
  fetchUptimeReport,
  fetchMaintenanceWindows,
  fetchMonitors,
  fetchNotificationChannels,
  Check,
  Incident,
  MaintenanceWindow,
  MaintenanceWindowInput,
  Monitor,
  MonitorInput,
  MonitorStatus,
  NotificationChannel,
  NotificationChannelInput,
  UptimeReport,
  updateMaintenanceWindow,
  updateNotificationChannel,
  updateMonitor,
} from '../lib/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import UptimeChart from '../components/UptimeChart';

const emptyForm: MonitorInput = {
  name: '',
  type: 'HTTP',
  url: '',
  host: '',
  port: undefined,
  isActive: true,
};

export default function MonitorsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [showMaintenance, setShowMaintenance] = useState(false);
  const [showChannels, setShowChannels] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [editing, setEditing] = useState<Monitor | null>(null);
  const [form, setForm] = useState<MonitorInput>(emptyForm);
  const [maintenanceFor, setMaintenanceFor] = useState<Monitor | null>(null);
  const [editingMaintenance, setEditingMaintenance] =
    useState<MaintenanceWindow | null>(null);
  const [maintenanceForm, setMaintenanceForm] = useState<MaintenanceWindowInput>(
    {
      monitorId: '',
      startAt: '',
      endAt: '',
      note: '',
    },
  );
  const [channelsFor, setChannelsFor] = useState<Monitor | null>(null);
  const [editingChannel, setEditingChannel] =
    useState<NotificationChannel | null>(null);
  const [channelForm, setChannelForm] = useState<NotificationChannelInput>({
    monitorId: '',
    type: 'TELEGRAM',
    isEnabled: true,
    telegramChatId: '',
    telegramThreadId: undefined,
    telegramBotToken: '',
  });
  const [reportFor, setReportFor] = useState<Monitor | null>(null);
  const [reportDays, setReportDays] = useState(7);
  const [historyFor, setHistoryFor] = useState<Monitor | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['monitors'],
    queryFn: fetchMonitors,
  });

  const maintenanceQuery = useQuery({
    queryKey: ['maintenance', maintenanceFor?.id],
    queryFn: () =>
      maintenanceFor ? fetchMaintenanceWindows(maintenanceFor.id) : Promise.resolve([]),
    enabled: Boolean(maintenanceFor),
  });

  const channelsQuery = useQuery({
    queryKey: ['channels', channelsFor?.id],
    queryFn: () =>
      channelsFor ? fetchNotificationChannels(channelsFor.id) : Promise.resolve([]),
    enabled: Boolean(channelsFor),
  });

  const reportQuery = useQuery<UptimeReport>({
    queryKey: ['uptime-report', reportFor?.id, reportDays],
    queryFn: () =>
      reportFor ? fetchUptimeReport(reportFor.id, reportDays) : Promise.resolve(null as never),
    enabled: Boolean(reportFor),
  });

  const checksQuery = useQuery<Check[]>({
    queryKey: ['checks', historyFor?.id],
    queryFn: () =>
      historyFor ? fetchChecks(historyFor.id) : Promise.resolve([]),
    enabled: Boolean(historyFor),
  });

  const incidentsQuery = useQuery<Incident[]>({
    queryKey: ['incidents', historyFor?.id],
    queryFn: () =>
      historyFor ? fetchIncidents(historyFor.id) : Promise.resolve([]),
    enabled: Boolean(historyFor),
  });

  const createMutation = useMutation({
    mutationFn: createMonitor,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['monitors'] });
      setShowForm(false);
      setForm(emptyForm);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<MonitorInput> }) =>
      updateMonitor(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['monitors'] });
      setEditing(null);
      setShowForm(false);
      setForm(emptyForm);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMonitor,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['monitors'] });
    },
  });

  const createMaintenanceMutation = useMutation({
    mutationFn: createMaintenanceWindow,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['maintenance', maintenanceFor?.id],
      });
      setEditingMaintenance(null);
      setMaintenanceForm({
        monitorId: maintenanceFor?.id ?? '',
        startAt: '',
        endAt: '',
        note: '',
      });
    },
  });

  const updateMaintenanceMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<MaintenanceWindowInput> }) =>
      updateMaintenanceWindow(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['maintenance', maintenanceFor?.id],
      });
      setEditingMaintenance(null);
    },
  });

  const deleteMaintenanceMutation = useMutation({
    mutationFn: deleteMaintenanceWindow,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['maintenance', maintenanceFor?.id],
      });
    },
  });

  const createChannelMutation = useMutation({
    mutationFn: createNotificationChannel,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['channels', channelsFor?.id],
      });
      setEditingChannel(null);
      setChannelForm({
        monitorId: channelsFor?.id ?? '',
        type: 'TELEGRAM',
        isEnabled: true,
        telegramChatId: '',
        telegramThreadId: undefined,
        telegramBotToken: '',
      });
    },
  });

  const updateChannelMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<NotificationChannelInput> }) =>
      updateNotificationChannel(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['channels', channelsFor?.id],
      });
      setEditingChannel(null);
    },
  });

  const deleteChannelMutation = useMutation({
    mutationFn: deleteNotificationChannel,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['channels', channelsFor?.id],
      });
    },
  });

  const monitors = useMemo(() => data ?? [], [data]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (form.type === 'HTTP' && !form.url) {
      alert('URL wajib diisi untuk monitor HTTP.');
      return;
    }
    if (form.type === 'TCP' && (!form.host || !form.port)) {
      alert('Host dan port wajib diisi untuk monitor TCP.');
      return;
    }

    if (editing) {
      updateMutation.mutate({ id: editing.id, payload: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (monitor: Monitor) => {
    setEditing(monitor);
    setForm({
      name: monitor.name,
      type: monitor.type,
      url: monitor.url ?? '',
      host: monitor.host ?? '',
      port: monitor.port ?? undefined,
      isActive: monitor.isActive,
    });
    setShowForm(true);
  };

  const openMaintenance = (monitor: Monitor) => {
    setMaintenanceFor(monitor);
    setMaintenanceForm({
      monitorId: monitor.id,
      startAt: '',
      endAt: '',
      note: '',
    });
    setEditingMaintenance(null);
    setShowMaintenance(true);
  };

  const openChannels = (monitor: Monitor) => {
    setChannelsFor(monitor);
    setChannelForm({
      monitorId: monitor.id,
      type: 'TELEGRAM',
      isEnabled: true,
      telegramChatId: '',
      telegramThreadId: undefined,
      telegramBotToken: '',
    });
    setEditingChannel(null);
    setShowChannels(true);
  };

  const openReport = (monitor: Monitor) => {
    setReportFor(monitor);
    setReportDays(7);
    setShowReport(true);
  };

  const openHistory = (monitor: Monitor) => {
    setHistoryFor(monitor);
    setShowHistory(true);
  };

  const statusLabel = (status: MonitorStatus) => {
    if (status === 'UP') return 'UP';
    if (status === 'DOWN') return 'DOWN';
    return 'UNKNOWN';
  };

  const formatDate = (value?: string | null) => {
    if (!value) return '-';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString();
  };

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

  const handleMaintenanceSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!maintenanceFor) return;
    if (!maintenanceForm.startAt || !maintenanceForm.endAt) {
      alert('Start dan end wajib diisi.');
      return;
    }
    if (new Date(maintenanceForm.startAt) >= new Date(maintenanceForm.endAt)) {
      alert('End harus lebih besar dari start.');
      return;
    }
    const payload: MaintenanceWindowInput = {
      monitorId: maintenanceFor.id,
      startAt: fromDatetimeLocal(maintenanceForm.startAt),
      endAt: fromDatetimeLocal(maintenanceForm.endAt),
      note: maintenanceForm.note,
    };

    if (editingMaintenance) {
      updateMaintenanceMutation.mutate({ id: editingMaintenance.id, payload });
    } else {
      createMaintenanceMutation.mutate(payload);
    }
  };

  const handleChannelSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!channelsFor) return;
    if (channelForm.type === 'TELEGRAM' && !channelForm.telegramChatId) {
      alert('Telegram chat id wajib diisi.');
      return;
    }

    const payload: NotificationChannelInput = {
      monitorId: channelsFor.id,
      type: channelForm.type,
      isEnabled: channelForm.isEnabled,
      telegramChatId: channelForm.telegramChatId || undefined,
      telegramThreadId: channelForm.telegramThreadId,
      telegramBotToken: channelForm.telegramBotToken || undefined,
    };

    if (editingChannel) {
      updateChannelMutation.mutate({ id: editingChannel.id, payload });
    } else {
      createChannelMutation.mutate(payload);
    }
  };

  return (
    <div className="page">
      <header className="header">
        <span className="badge">Live Monitoring</span>
        <h1>Monitors</h1>
        <p>Manage HTTP/TCP monitors and track latest status.</p>
      </header>

      <div className="toolbar">
        <button className="button" onClick={openCreate}>
          Add Monitor
        </button>
        <button
          className="button secondary"
          onClick={() => queryClient.invalidateQueries({ queryKey: ['monitors'] })}
        >
          Refresh
        </button>
      </div>

      <section className="card">
        {isLoading && <div className="empty">Loading monitors...</div>}
        {error && (
          <div className="empty">
            {(error as Error).message || 'Failed to load monitors'}
          </div>
        )}
        {!isLoading && !error && monitors.length === 0 && (
          <div className="empty">No monitors yet. Add one to get started.</div>
        )}
        {!isLoading && !error && monitors.length > 0 && (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Status</th>
                <th>Last Checked</th>
                <th>Latency</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {monitors.map((monitor) => (
                <tr key={monitor.id}>
                  <td>
                    <div>{monitor.name}</div>
                    <div className="mono">
                      {monitor.type === 'HTTP'
                        ? monitor.url ?? '-'
                        : `${monitor.host ?? '-'}${monitor.port ? `:${monitor.port}` : ''}`}
                    </div>
                  </td>
                  <td>{monitor.type}</td>
                  <td>
                    <span
                      className={`status ${monitor.lastStatus.toLowerCase()}`}
                    >
                      <span className="status-dot" />
                      {statusLabel(monitor.lastStatus)}
                    </span>
                  </td>
                  <td>{formatDate(monitor.lastCheckedAt)}</td>
                  <td>{monitor.lastLatencyMs ? `${monitor.lastLatencyMs} ms` : '-'}</td>
                  <td>
                    <div className="toolbar">
                      <button className="button ghost" onClick={() => openEdit(monitor)}>
                        Edit
                      </button>
                      <button
                        className="button ghost"
                        onClick={() => openMaintenance(monitor)}
                      >
                        Maintenance
                      </button>
                      <button className="button ghost" onClick={() => openChannels(monitor)}>
                        Channels
                      </button>
                      <button className="button ghost" onClick={() => openReport(monitor)}>
                        Report
                      </button>
                      <button className="button ghost" onClick={() => openHistory(monitor)}>
                        History
                      </button>
                      <button
                        className="button secondary"
                        onClick={() => {
                          if (confirm('Delete this monitor?')) {
                            deleteMutation.mutate(monitor.id);
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
      </section>

      {showForm && (
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <h2>{editing ? 'Edit Monitor' : 'Add Monitor'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <label>
                  Name
                  <input
                    value={form.name}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, name: event.target.value }))
                    }
                    required
                  />
                </label>
                <label>
                  Type
                  <select
                    value={form.type}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        type: event.target.value as MonitorInput['type'],
                      }))
                    }
                  >
                    <option value="HTTP">HTTP</option>
                    <option value="TCP">TCP</option>
                  </select>
                </label>
                {form.type === 'HTTP' ? (
                  <label>
                    URL
                    <input
                      value={form.url}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, url: event.target.value }))
                      }
                      required
                    />
                  </label>
                ) : (
                  <>
                    <label>
                      Host
                      <input
                        value={form.host}
                        onChange={(event) =>
                          setForm((prev) => ({ ...prev, host: event.target.value }))
                        }
                        required
                      />
                    </label>
                    <label>
                      Port
                      <input
                        type="number"
                        value={form.port ?? ''}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            port: event.target.value ? Number(event.target.value) : undefined,
                          }))
                        }
                        required
                      />
                    </label>
                  </>
                )}
                <label>
                  Active
                  <select
                    value={form.isActive ? 'true' : 'false'}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        isActive: event.target.value === 'true',
                      }))
                    }
                  >
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </label>
              </div>
              <div className="footer-actions">
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
                <button className="button" type="submit">
                  {editing ? 'Save' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showMaintenance && maintenanceFor && (
        <div className="modal-backdrop" onClick={() => setShowMaintenance(false)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <h2>Maintenance: {maintenanceFor.name}</h2>
            <form onSubmit={handleMaintenanceSubmit}>
              <div className="form-grid">
                <label>
                  Start
                  <input
                    type="datetime-local"
                    value={maintenanceForm.startAt}
                    onChange={(event) =>
                      setMaintenanceForm((prev) => ({
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
                    value={maintenanceForm.endAt}
                    onChange={(event) =>
                      setMaintenanceForm((prev) => ({
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
                    value={maintenanceForm.note ?? ''}
                    onChange={(event) =>
                      setMaintenanceForm((prev) => ({
                        ...prev,
                        note: event.target.value,
                      }))
                    }
                  />
                </label>
              </div>
              <div className="footer-actions">
                {editingMaintenance && (
                  <button
                    type="button"
                    className="button secondary"
                    onClick={() => {
                      setEditingMaintenance(null);
                      setMaintenanceForm({
                        monitorId: maintenanceFor.id,
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
                  {editingMaintenance ? 'Update' : 'Add'} Window
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
                                  setEditingMaintenance(window);
                                  setMaintenanceForm({
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
                                    deleteMaintenanceMutation.mutate(window.id);
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
        </div>
      )}

      {showChannels && channelsFor && (
        <div className="modal-backdrop" onClick={() => setShowChannels(false)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <h2>Channels: {channelsFor.name}</h2>
            <form onSubmit={handleChannelSubmit}>
              <div className="form-grid">
                <label>
                  Type
                  <select
                    value={channelForm.type}
                    onChange={(event) =>
                      setChannelForm((prev) => ({
                        ...prev,
                        type: event.target.value as ChannelType,
                      }))
                    }
                  >
                    <option value="TELEGRAM">TELEGRAM</option>
                  </select>
                </label>
                <label>
                  Enabled
                  <select
                    value={channelForm.isEnabled ? 'true' : 'false'}
                    onChange={(event) =>
                      setChannelForm((prev) => ({
                        ...prev,
                        isEnabled: event.target.value === 'true',
                      }))
                    }
                  >
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </label>
                <label>
                  Telegram Chat ID
                  <input
                    value={channelForm.telegramChatId ?? ''}
                    onChange={(event) =>
                      setChannelForm((prev) => ({
                        ...prev,
                        telegramChatId: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label>
                  Telegram Thread ID
                  <input
                    type="number"
                    value={channelForm.telegramThreadId ?? ''}
                    onChange={(event) =>
                      setChannelForm((prev) => ({
                        ...prev,
                        telegramThreadId: event.target.value
                          ? Number(event.target.value)
                          : undefined,
                      }))
                    }
                  />
                </label>
                <label>
                  Telegram Bot Token (optional)
                  <input
                    value={channelForm.telegramBotToken ?? ''}
                    onChange={(event) =>
                      setChannelForm((prev) => ({
                        ...prev,
                        telegramBotToken: event.target.value,
                      }))
                    }
                  />
                </label>
              </div>
              <div className="footer-actions">
                {editingChannel && (
                  <button
                    type="button"
                    className="button secondary"
                    onClick={() => {
                      setEditingChannel(null);
                      setChannelForm({
                        monitorId: channelsFor.id,
                        type: 'TELEGRAM',
                        isEnabled: true,
                        telegramChatId: '',
                        telegramThreadId: undefined,
                        telegramBotToken: '',
                      });
                    }}
                  >
                    Cancel Edit
                  </button>
                )}
                <button className="button" type="submit">
                  {editingChannel ? 'Update' : 'Add'} Channel
                </button>
              </div>
            </form>

            <div style={{ marginTop: 16 }}>
              {channelsQuery.isLoading && (
                <div className="empty">Loading channels...</div>
              )}
              {channelsQuery.error && (
                <div className="empty">
                  {(channelsQuery.error as Error).message ||
                    'Failed to load channels'}
                </div>
              )}
              {!channelsQuery.isLoading &&
                !channelsQuery.error &&
                (channelsQuery.data?.length ?? 0) === 0 && (
                  <div className="empty">No channels yet.</div>
                )}
              {!channelsQuery.isLoading &&
                !channelsQuery.error &&
                (channelsQuery.data?.length ?? 0) > 0 && (
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>Chat ID</th>
                        <th>Enabled</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(channelsQuery.data ?? []).map((channel) => (
                        <tr key={channel.id}>
                          <td>{channel.type}</td>
                          <td className="mono">{channel.telegramChatId ?? '-'}</td>
                          <td>{channel.isEnabled ? 'Yes' : 'No'}</td>
                          <td>
                            <div className="toolbar">
                              <button
                                className="button ghost"
                                onClick={() => {
                                  setEditingChannel(channel);
                                  setChannelForm({
                                    monitorId: channel.monitorId,
                                    type: channel.type,
                                    isEnabled: channel.isEnabled,
                                    telegramChatId: channel.telegramChatId ?? '',
                                    telegramThreadId: channel.telegramThreadId ?? undefined,
                                    telegramBotToken: channel.telegramBotToken ?? '',
                                  });
                                }}
                              >
                                Edit
                              </button>
                              <button
                                className="button secondary"
                                onClick={() => {
                                  if (confirm('Delete this channel?')) {
                                    deleteChannelMutation.mutate(channel.id);
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
        </div>
      )}

      {showReport && reportFor && (
        <div className="modal-backdrop" onClick={() => setShowReport(false)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <h2>Uptime Report: {reportFor.name}</h2>
            <div className="toolbar">
              <button
                className={`button ${reportDays === 7 ? '' : 'secondary'}`}
                onClick={() => setReportDays(7)}
              >
                7 days
              </button>
              <button
                className={`button ${reportDays === 30 ? '' : 'secondary'}`}
                onClick={() => setReportDays(30)}
              >
                30 days
              </button>
            </div>
            {reportQuery.isLoading && <div className="empty">Loading report...</div>}
            {reportQuery.error && (
              <div className="empty">
                {(reportQuery.error as Error).message || 'Failed to load report'}
              </div>
            )}
            {reportQuery.data && (
              <div>
                <p className="mono">
                  Uptime: {reportQuery.data.uptimePercent}% ({reportQuery.data.upChecks}/
                  {reportQuery.data.totalChecks})
                </p>
                <UptimeChart points={reportQuery.data.series} />
              </div>
            )}
          </div>
        </div>
      )}

      {showHistory && historyFor && (
        <div className="modal-backdrop" onClick={() => setShowHistory(false)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <h2>Status History: {historyFor.name}</h2>
            <div style={{ marginTop: 12 }}>
              <h3>Recent Checks</h3>
              {checksQuery.isLoading && <div className="empty">Loading checks...</div>}
              {checksQuery.error && (
                <div className="empty">
                  {(checksQuery.error as Error).message || 'Failed to load checks'}
                </div>
              )}
              {!checksQuery.isLoading &&
                !checksQuery.error &&
                (checksQuery.data?.length ?? 0) === 0 && (
                  <div className="empty">No checks yet.</div>
                )}
              {!checksQuery.isLoading &&
                !checksQuery.error &&
                (checksQuery.data?.length ?? 0) > 0 && (
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
              {!incidentsQuery.isLoading &&
                !incidentsQuery.error &&
                (incidentsQuery.data?.length ?? 0) === 0 && (
                  <div className="empty">No incidents yet.</div>
                )}
              {!incidentsQuery.isLoading &&
                !incidentsQuery.error &&
                (incidentsQuery.data?.length ?? 0) > 0 && (
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
        </div>
      )}
    </div>
  );
}
