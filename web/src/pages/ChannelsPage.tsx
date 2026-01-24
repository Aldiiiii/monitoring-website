import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ChannelType,
  createNotificationChannel,
  deleteNotificationChannel,
  fetchMonitors,
  fetchNotificationChannels,
  Monitor,
  NotificationChannel,
  NotificationChannelInput,
  updateNotificationChannel,
} from '../lib/api';

export default function ChannelsPage() {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState('');
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

  const monitorsQuery = useQuery({
    queryKey: ['monitors'],
    queryFn: fetchMonitors,
  });

  useEffect(() => {
    if (!selectedId && monitorsQuery.data && monitorsQuery.data.length > 0) {
      setSelectedId(monitorsQuery.data[0].id);
    }
  }, [selectedId, monitorsQuery.data]);

  const channelsQuery = useQuery({
    queryKey: ['channels', selectedId],
    queryFn: () => fetchNotificationChannels(selectedId),
    enabled: Boolean(selectedId),
  });

  const createChannelMutation = useMutation({
    mutationFn: createNotificationChannel,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['channels', selectedId] });
      setEditingChannel(null);
      setChannelForm({
        monitorId: selectedId,
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
      await queryClient.invalidateQueries({ queryKey: ['channels', selectedId] });
      setEditingChannel(null);
    },
  });

  const deleteChannelMutation = useMutation({
    mutationFn: deleteNotificationChannel,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['channels', selectedId] });
    },
  });

  const monitors = monitorsQuery.data ?? [];
  const selected = monitors.find((monitor) => monitor.id === selectedId) as
    | Monitor
    | undefined;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (channelForm.type === 'TELEGRAM' && !channelForm.telegramChatId) {
      alert('Telegram chat id wajib diisi.');
      return;
    }

    const payload: NotificationChannelInput = {
      monitorId: selectedId,
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
        <span className="badge">Alerts</span>
        <h1>Channels</h1>
        <p>Manage notification channels for each monitor.</p>
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
                        monitorId: selectedId,
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
              {channelsQuery.isLoading && <div className="empty">Loading channels...</div>}
              {channelsQuery.error && (
                <div className="empty">
                  {(channelsQuery.error as Error).message || 'Failed to load channels'}
                </div>
              )}
              {!channelsQuery.isLoading && (channelsQuery.data?.length ?? 0) === 0 && (
                <div className="empty">No channels yet.</div>
              )}
              {(channelsQuery.data?.length ?? 0) > 0 && (
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
        )}
      </section>
    </div>
  );
}
