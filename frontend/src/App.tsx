import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';
import { SignupPage } from './pages/auth/SignupPage';
import { VerifyEmailPage } from './pages/auth/VerifyEmailPage';

// Main Pages
import { DashboardPage } from './pages/DashboardPage';
import { ContactsPage } from './pages/ContactsPage';
import { TagsPage } from './pages/TagsPage';
import { CampaignsPage } from './pages/CampaignsPage';
import { EnhancedCampaignBuilderPage } from './pages/EnhancedCampaignBuilderPage';
import { CampaignAnalyticsPage } from './pages/CampaignAnalyticsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';
import { AdminPage } from './pages/AdminPage';
import EmailTemplatesPage from './pages/EmailTemplatesPage';
import TemplateEditorPage from './pages/TemplateEditorPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          
          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/contacts"
            element={
              <ProtectedRoute>
                <ContactsPage />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/tags"
            element={
              <ProtectedRoute>
                <TagsPage />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/campaigns"
            element={
              <ProtectedRoute>
                <CampaignsPage />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/campaigns/new"
            element={
              <ProtectedRoute>
                <EnhancedCampaignBuilderPage />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/campaigns/:id/edit"
            element={
              <ProtectedRoute>
                <EnhancedCampaignBuilderPage />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/campaigns/:id/analytics"
            element={
              <ProtectedRoute>
                <CampaignAnalyticsPage />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <AnalyticsPage />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/templates"
            element={
              <ProtectedRoute>
                <EmailTemplatesPage />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/templates/new"
            element={
              <ProtectedRoute>
                <TemplateEditorPage />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/templates/:id/edit"
            element={
              <ProtectedRoute>
                <TemplateEditorPage />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin>
                <AdminPage />
              </ProtectedRoute>
            }
          />
          
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
