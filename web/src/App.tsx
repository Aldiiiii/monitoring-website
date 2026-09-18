import { Navigate, Route, Routes } from 'react-router-dom';
import SidebarLayout from './components/SidebarLayout';
import RequireAuth from './components/RequireAuth';
import AuthCallbackPage from './pages/AuthCallbackPage';
import ChannelsPage from './pages/ChannelsPage';
import HistoryPage from './pages/HistoryPage';
import LoginPage from './pages/LoginPage';
import MaintenancePage from './pages/MaintenancePage';
import MonitorsPage from './pages/MonitorsPage';
import RegisterPage from './pages/RegisterPage';
import ReportsPage from './pages/ReportsPage';
import UsersPage from './pages/UsersPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<SidebarLayout />}>
          <Route path="/" element={<MonitorsPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/channels" element={<ChannelsPage />} />
          <Route path="/maintenance" element={<MaintenancePage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}
