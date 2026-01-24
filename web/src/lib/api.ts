export type MonitorStatus = 'UP' | 'DOWN' | 'UNKNOWN';
export type MonitorType = 'HTTP' | 'TCP';

export type Monitor = {
  id: string;
  userId: string;
  name: string;
  type: MonitorType;
  url?: string | null;
  host?: string | null;
  port?: number | null;
  isActive: boolean;
  lastStatus: MonitorStatus;
  lastCheckedAt?: string | null;
  lastLatencyMs?: number | null;
};

export type MonitorInput = {
  name: string;
  type: MonitorType;
  url?: string;
  host?: string;
  port?: number;
  isActive?: boolean;
};

export type MaintenanceWindow = {
  id: string;
  monitorId: string;
  startAt: string;
  endAt: string;
  note?: string | null;
};

export type MaintenanceWindowInput = {
  monitorId: string;
  startAt: string;
  endAt: string;
  note?: string;
};

export type ChannelType = 'TELEGRAM' | 'EMAIL' | 'WEBHOOK';

export type NotificationChannel = {
  id: string;
  monitorId: string;
  type: ChannelType;
  isEnabled: boolean;
  telegramChatId?: string | null;
  telegramThreadId?: number | null;
  telegramBotToken?: string | null;
};

export type NotificationChannelInput = {
  monitorId: string;
  type: ChannelType;
  isEnabled?: boolean;
  telegramChatId?: string;
  telegramThreadId?: number;
  telegramBotToken?: string;
};

export type UptimeSeriesPoint = {
  date: string;
  up: number;
  total: number;
  uptimePercent: number;
};

export type UptimeReport = {
  monitorId: string;
  days: number;
  totalChecks: number;
  upChecks: number;
  uptimePercent: number;
  series: UptimeSeriesPoint[];
};

export type CheckStatus = 'UP' | 'DOWN';

export type Check = {
  id: string;
  monitorId: string;
  status: CheckStatus;
  latencyMs?: number | null;
  statusCode?: number | null;
  error?: string | null;
  checkedAt: string;
};

export type Incident = {
  id: string;
  monitorId: string;
  startedAt: string;
  endedAt?: string | null;
  durationSec?: number | null;
  reason?: string | null;
};

export type UserRole = 'ADMIN' | 'VIEWER';

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type UpdateUserInput = {
  name?: string;
  email?: string;
  role?: UserRole;
  password?: string;
};

export type CreateUserInput = {
  name: string;
  email: string;
  role?: UserRole;
  password: string;
};

import { getToken } from './auth';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    headers,
    ...options,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Request failed');
  }

  return response.json() as Promise<T>;
}

export function fetchMonitors(): Promise<Monitor[]> {
  return request<Monitor[]>('/monitors');
}

export function createMonitor(payload: MonitorInput): Promise<Monitor> {
  return request<Monitor>('/monitors', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateMonitor(id: string, payload: Partial<MonitorInput>): Promise<Monitor> {
  return request<Monitor>(`/monitors/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function deleteMonitor(id: string): Promise<void> {
  return request<void>(`/monitors/${id}`, { method: 'DELETE' });
}

export function fetchMaintenanceWindows(
  monitorId: string,
): Promise<MaintenanceWindow[]> {
  const query = new URLSearchParams({ monitorId });
  return request<MaintenanceWindow[]>(`/maintenance-windows?${query.toString()}`);
}

export function createMaintenanceWindow(
  payload: MaintenanceWindowInput,
): Promise<MaintenanceWindow> {
  return request<MaintenanceWindow>('/maintenance-windows', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateMaintenanceWindow(
  id: string,
  payload: Partial<MaintenanceWindowInput>,
): Promise<MaintenanceWindow> {
  return request<MaintenanceWindow>(`/maintenance-windows/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function deleteMaintenanceWindow(id: string): Promise<void> {
  return request<void>(`/maintenance-windows/${id}`, { method: 'DELETE' });
}

export function fetchNotificationChannels(
  monitorId: string,
): Promise<NotificationChannel[]> {
  const query = new URLSearchParams({ monitorId });
  return request<NotificationChannel[]>(`/notification-channels?${query.toString()}`);
}

export function createNotificationChannel(
  payload: NotificationChannelInput,
): Promise<NotificationChannel> {
  return request<NotificationChannel>('/notification-channels', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateNotificationChannel(
  id: string,
  payload: Partial<NotificationChannelInput>,
): Promise<NotificationChannel> {
  return request<NotificationChannel>(`/notification-channels/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function deleteNotificationChannel(id: string): Promise<void> {
  return request<void>(`/notification-channels/${id}`, { method: 'DELETE' });
}

export function fetchUptimeReport(monitorId: string, days: number): Promise<UptimeReport> {
  const query = new URLSearchParams({ monitorId, days: String(days) });
  return request<UptimeReport>(`/reports/uptime?${query.toString()}`);
}

export function fetchChecks(monitorId: string): Promise<Check[]> {
  const query = new URLSearchParams({ monitorId, take: '50' });
  return request<Check[]>(`/checks?${query.toString()}`);
}

export function fetchIncidents(monitorId: string): Promise<Incident[]> {
  const query = new URLSearchParams({ monitorId, take: '50' });
  return request<Incident[]>(`/incidents?${query.toString()}`);
}

export function fetchUsers(): Promise<User[]> {
  return request<User[]>('/users');
}

export function updateUser(id: string, payload: UpdateUserInput): Promise<User> {
  return request<User>(`/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function deactivateUser(id: string): Promise<User> {
  return request<User>(`/users/${id}/deactivate`, { method: 'PATCH' });
}

export function createUser(payload: CreateUserInput): Promise<User> {
  return request<User>('/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
