import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './components/auth/AuthProvider';
import { LoginPage } from './components/auth/LoginPage';
import Dashboard from './components/dashboard/Dashboard';
import { Profile } from './components/dashboard/Profile';
import { ProfileEdit } from './components/dashboard/ProfileEdit';
import ClientList from './components/crm/ClientList';
import UserManagement from './components/admin/UserManagement';
import ProjectsPage from './components/projects/ProjectsPage';
import ProjectExecutionPage from './pages/ProjectExecutionPage';
import CompanySettings from './components/settings/CompanySettings';
import UISettings from './components/settings/UISettings';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/clients"
            element={
              <ProtectedRoute>
                <ClientList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/edit"
            element={
              <ProtectedRoute>
                <ProfileEdit />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/edit/:userId"
            element={
              <ProtectedRoute>
                <ProfileEdit />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute>
                <UserManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/*"
            element={
              <ProtectedRoute>
                <ProjectsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/project-execution/:projectId"
            element={
              <ProtectedRoute>
                <ProjectExecutionPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/project-execution"
            element={
              <ProtectedRoute>
                <ProjectsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings/company"
            element={
              <ProtectedRoute>
                <CompanySettings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings/ui"
            element={
              <ProtectedRoute>
                <UISettings />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
