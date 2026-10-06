import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { ToastProvider } from './components/Toast';
import { ConfirmProvider } from './components/ConfirmDialog';
import { AdminLayout } from './layout/AdminLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ServicesPage } from './pages/ServicesPage';
import { PricesPage } from './pages/PricesPage';
import { ImagesPage } from './pages/ImagesPage';
import { SettingsPage } from './pages/SettingsPage';
import { QuotesPage } from './pages/QuotesPage';

function Protected() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <span className="h-2 w-2 animate-pulse-dot rounded-full bg-bone" />
      </div>
    );
  }
  if (!user) return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  return <AdminLayout />;
}

export default function AdminApp() {
  return (
    <AuthProvider>
      <ToastProvider>
        <ConfirmProvider>
          <Routes>
            <Route path="login" element={<LoginPage />} />
            <Route element={<Protected />}>
              <Route index element={<DashboardPage />} />
              <Route path="servicos" element={<ServicesPage />} />
              <Route path="precos" element={<PricesPage />} />
              <Route path="imagens" element={<ImagesPage />} />
              <Route path="configuracoes" element={<SettingsPage />} />
              <Route path="orcamentos" element={<QuotesPage />} />
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </Route>
          </Routes>
        </ConfirmProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
