import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { AdminDashboard } from './pages/admin/Dashboard';
import { EnterpriseDashboard } from './pages/enterprise/Dashboard';
import PilotageDashboard from './pages/enterprise/PilotageDashboard';
import { ManagementDashboard } from './pages/enterprise/ManagementDashboard';
import ReportingDashboard from './pages/enterprise/ReportingDashboard';
import ProcessStepSectors from './pages/admin/ProcessStepSectors';
import ProcessStepStandards from './pages/admin/ProcessStepStandards';
import ProcessStepIssues from './pages/admin/ProcessStepIssues';
import ProcessStepCriteria from './pages/admin/ProcessStepCriteria';
import ProcessStepIndicators from './pages/admin/ProcessStepIndicators';
import ProcessStepCompany from './pages/admin/ProcessStepCompany';
import ProcessStepUsers from './pages/admin/ProcessStepUsers';
import { AppProvider } from './context/AppContext';
import { useAuthStore } from './store/authStore';
import { Loader } from 'lucide-react';
import { PrivateRoute } from './components/ui/PrivateRoute';
import SiteProcessesPage from './components/pilotage/SiteProcessesPage';
import { AdminClientPilotage } from './components/pilotage/AdminClientPilotage';

function App() {
  const { initializeSession, loading } = useAuthStore((state) => ({
    initializeSession: state.initializeSession,
    loading: state.loading
  }));

  useEffect(() => {
    initializeSession();
  }, [initializeSession]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <AppProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Routes Admin */}
          <Route 
            path="/admin/dashboard" 
            element={
              <PrivateRoute requiredRole="admin">
                <AdminDashboard />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/process/sectors" 
            element={
              <PrivateRoute requiredRole="admin">
                <ProcessStepSectors />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/process/standards" 
            element={
              <PrivateRoute requiredRole="admin">
                <ProcessStepStandards />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/process/issues" 
            element={
              <PrivateRoute requiredRole="admin">
                <ProcessStepIssues />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/process/criteria" 
            element={
              <PrivateRoute requiredRole="admin">
                <ProcessStepCriteria />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/process/indicators" 
            element={
              <PrivateRoute requiredRole="admin">
                <ProcessStepIndicators />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/process/company" 
            element={
              <PrivateRoute requiredRole="admin">
                <ProcessStepCompany />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/process/users" 
            element={
              <PrivateRoute requiredRole="admin">
                <ProcessStepUsers />
              </PrivateRoute>
            } 
          />

          {/* Routes Enterprise */}
          <Route 
            path="/enterprise/dashboard" 
            element={
              <PrivateRoute requiredRole="enterprise">
                <EnterpriseDashboard />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/enterprise/collection" 
            element={
              <PrivateRoute requiredRole="enterprise">
                <PilotageDashboard />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/enterprise/management" 
            element={
              <PrivateRoute requiredRole="enterprise">
                <ManagementDashboard />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/enterprise/reporting" 
            element={
              <PrivateRoute requiredRole="enterprise">
                <ReportingDashboard />
              </PrivateRoute>
            } 
          />

          {/* Nouvelle route pour le pilotage client */}
          <Route 
            path="/admin-client-pilotage" 
            element={
              <PrivateRoute requiredRole="enterprise">
                <AdminClientPilotage />
              </PrivateRoute>
            } 
          />

          {/* Route pour les détails d'un site */}
          <Route 
            path="/site/:siteName" 
            element={
              <PrivateRoute requiredRole="enterprise">
                <SiteProcessesPage />
              </PrivateRoute>
            } 
          />

          {/* Route pour les processus d'un site */}
          <Route 
            path="/site/:siteName/process/:processCode" 
            element={
              <PrivateRoute requiredRole="enterprise">
                <div>Page Processus - À implémenter</div>
              </PrivateRoute>
            } 
          />

          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AppProvider>
  );
}

export default App;