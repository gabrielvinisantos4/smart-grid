import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { MotionConfig } from 'motion/react';
import { SiteDataProvider } from '@/hooks/useSiteData';
import { HomePage } from '@/pages/HomePage';
import { NotFoundPage } from '@/pages/NotFoundPage';

// O painel é carregado sob demanda: o bundle público não inclui código administrativo.
const AdminApp = lazy(() => import('@/admin/AdminApp'));

export function App() {
  return (
    <MotionConfig reducedMotion="user">
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <SiteDataProvider>
                <HomePage />
              </SiteDataProvider>
            }
          />
          <Route
            path="/admin/*"
            element={
              <Suspense fallback={<div className="min-h-svh bg-ink" />}>
                <AdminApp />
              </Suspense>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </MotionConfig>
  );
}
