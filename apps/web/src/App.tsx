import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { Navbar, FarmerBottomNav } from './components/Navbar';

// Farmer Pages
import { LandingPage } from './pages/LandingPage';
import { RegisterPage } from './pages/RegisterPage';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { SellProducePage } from './pages/SellProducePage';
import { MyProducePage } from './pages/MyProducePage';
import { CollectionsPage } from './pages/CollectionsPage';
import { PaymentsPage } from './pages/PaymentsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { ProfilePage } from './pages/ProfilePage';
import { HelpPage } from './pages/HelpPage';

// Admin Pages
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminFarmersPage } from './pages/admin/AdminFarmersPage';
import { AdminProducePage } from './pages/admin/AdminProducePage';
import { AdminSourcingPage } from './pages/admin/AdminSourcingPage';
import { AdminDemandPage } from './pages/admin/AdminDemandPage';
import { AdminCollectionsPage } from './pages/admin/AdminCollectionsPage';
import { AdminLogisticsPage } from './pages/admin/AdminLogisticsPage';
import { AdminExceptionsPage } from './pages/admin/AdminExceptionsPage';
import { AdminAuditLogsPage } from './pages/admin/AdminAuditLogsPage';
import { AdminSmsLogsPage } from './pages/admin/AdminSmsLogsPage';
import { UssdSimulatorPage } from './pages/admin/UssdSimulatorPage';
import { IvrSimulatorPage } from './pages/admin/IvrSimulatorPage';

// Farmer Route Guard
const FarmerGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { farmer, loading } = useAuth();
  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Verifying session...</div>;
  }
  if (!farmer) {
    return <Navigate to="/farmer/login" replace />;
  }
  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <div className="app-container">
            <Navbar />
            <Routes>
              {/* Root redirect */}
              <Route path="/" element={<Navigate to="/farmer" replace />} />

              {/* Farmer Public Routes */}
              <Route path="/farmer" element={<LandingPage />} />
              <Route path="/farmer/register" element={<RegisterPage />} />
              <Route path="/farmer/login" element={<LoginPage />} />

              {/* Farmer Protected Routes */}
              <Route path="/farmer/dashboard" element={<FarmerGuard><DashboardPage /></FarmerGuard>} />
              <Route path="/farmer/sell" element={<FarmerGuard><SellProducePage /></FarmerGuard>} />
              <Route path="/farmer/produce" element={<FarmerGuard><MyProducePage /></FarmerGuard>} />
              <Route path="/farmer/collections" element={<FarmerGuard><CollectionsPage /></FarmerGuard>} />
              <Route path="/farmer/payments" element={<FarmerGuard><PaymentsPage /></FarmerGuard>} />
              <Route path="/farmer/notifications" element={<FarmerGuard><NotificationsPage /></FarmerGuard>} />
              <Route path="/farmer/profile" element={<FarmerGuard><ProfilePage /></FarmerGuard>} />
              <Route path="/farmer/help" element={<HelpPage />} />

              {/* Admin Routes */}
              <Route path="/admin/login" element={<AdminLoginPage />} />
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboardPage />} />
                <Route path="farmers" element={<AdminFarmersPage />} />
                <Route path="produce" element={<AdminProducePage />} />
                <Route path="sourcing" element={<AdminSourcingPage />} />
                <Route path="demand" element={<AdminDemandPage />} />
                <Route path="collections" element={<AdminCollectionsPage />} />
                <Route path="logistics" element={<AdminLogisticsPage />} />
                <Route path="exceptions" element={<AdminExceptionsPage />} />
                <Route path="ussd-simulator" element={<UssdSimulatorPage />} />
                <Route path="ivr-simulator" element={<IvrSimulatorPage />} />
                <Route path="audit-logs" element={<AdminAuditLogsPage />} />
                <Route path="sms-logs" element={<AdminSmsLogsPage />} />
              </Route>

              {/* 404 Fallback */}
              <Route path="*" element={<Navigate to="/farmer" replace />} />
            </Routes>
            <FarmerBottomNav />
          </div>
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  );
};
