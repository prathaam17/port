import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';

// Layouts
import DashboardLayout from './layouts/DashboardLayout';

// Guards
import ProtectedRoute from './routes/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CargoInventory from './pages/CargoInventory';
import WarehouseManagement from './pages/WarehouseManagement';
import CustomsClearance from './pages/CustomsClearance';
import GateOperations from './pages/GateOperations';
import Billing from './pages/Billing';
import Reports from './pages/Reports';
import UserManagement from './pages/UserManagement';
import Settings from './pages/Settings';
import ShippingAgentPortal from './pages/ShippingAgentPortal';

function App() {
  return (
    <Router>
      <AuthProvider>
        <NotificationProvider>
          <Routes>
              
              {/* Authenticated portal entry */}
              <Route path="/login" element={<Login />} />

              {/* Secure Admin Dashboard Layout Wrapper */}
              <Route 
                path="/" 
                element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                {/* Central Dashboard */}
                <Route index element={<Dashboard />} />

                {/* Cargo Manifest management */}
                <Route 
                  path="cargo" 
                  element={
                    <ProtectedRoute allowedRoles={['Super Admin', 'Port Operations Officer', 'Warehouse Manager', 'Shipping Agent']}>
                      <CargoInventory />
                    </ProtectedRoute>
                  } 
                />

                {/* Warehousing space control */}
                <Route 
                  path="warehouse" 
                  element={
                    <ProtectedRoute allowedRoles={['Super Admin', 'Warehouse Manager']}>
                      <WarehouseManagement />
                    </ProtectedRoute>
                  } 
                />

                {/* Customs document review clearance */}
                <Route 
                  path="customs" 
                  element={
                    <ProtectedRoute allowedRoles={['Super Admin', 'Customs Officer', 'Shipping Agent']}>
                      <CustomsClearance />
                    </ProtectedRoute>
                  } 
                />

                {/* Gate entry-exit and truck logs */}
                <Route 
                  path="gate" 
                  element={
                    <ProtectedRoute allowedRoles={['Super Admin', 'Gate Officer', 'Shipping Agent']}>
                      <GateOperations />
                    </ProtectedRoute>
                  } 
                />

                {/* Invoicing, storage fee demurrage */}
                <Route 
                  path="billing" 
                  element={
                    <ProtectedRoute allowedRoles={['Super Admin', 'Finance', 'Shipping Agent']}>
                      <Billing />
                    </ProtectedRoute>
                  } 
                />

                {/* Analytical charts & audit checks */}
                <Route 
                  path="reports" 
                  element={
                    <ProtectedRoute allowedRoles={['Super Admin', 'Warehouse Manager', 'Customs Officer', 'Gate Officer', 'Finance', 'Shipping Agent']}>
                      <Reports />
                    </ProtectedRoute>
                  } 
                />

                {/* Admin users directory control */}
                <Route 
                  path="users" 
                  element={
                    <ProtectedRoute allowedRoles={['Super Admin']}>
                      <UserManagement />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Shipping Agent Portal */}
                <Route 
                  path="shipping-portal" 
                  element={
                    <ProtectedRoute allowedRoles={['Super Admin', 'Shipping Agent']}>
                      <ShippingAgentPortal />
                    </ProtectedRoute>
                  } 
                />

                {/* Settings Configurations */}
                <Route 
                  path="settings" 
                  element={
                    <ProtectedRoute allowedRoles={['Super Admin', 'Port Operations Officer', 'Warehouse Manager', 'Customs Officer', 'Gate Officer', 'Finance', 'Shipping Agent']}>
                      <Settings />
                    </ProtectedRoute>
                  } 
                />

              </Route>

              {/* Wildcard Fallbacks */}
              <Route path="*" element={<Navigate to="/" replace />} />

            </Routes>
        </NotificationProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
