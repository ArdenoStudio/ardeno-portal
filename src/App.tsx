import { Routes, Route, Navigate } from 'react-router-dom';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { ProtectedRoute, AdminRoute } from '@/components/layout/ProtectedRoute';
import { ToastProvider } from '@/context/ToastContext';
import LoginPage from '@/pages/LoginPage';
import AuthCallback from '@/pages/AuthCallback';
import DashboardPage from '@/pages/DashboardPage';
import ProjectDetailPage from '@/pages/ProjectDetailPage';
import NewProjectPage from '@/pages/NewProjectPage';
import AdminDashboardPage from '@/pages/AdminDashboardPage';

export default function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />

        <Route
          element={
            <ProtectedRoute>
              <PortalLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/projects" element={<Navigate to="/dashboard" replace />} />
          <Route path="/projects/new" element={<NewProjectPage />} />
          <Route path="/projects/:id" element={<ProjectDetailPage />} />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboardPage />
              </AdminRoute>
            }
          />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </ToastProvider>
  );
}
