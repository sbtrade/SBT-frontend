import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';

import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import CheckoutSimulator from './pages/CheckoutSimulator';

import UserDashboard from './pages/UserDashboard';
import KycUpload from './pages/KycUpload';

import AdminDashboard from './pages/AdminDashboard';
import ManageUsers from './pages/ManageUsers';

import SuperAdminDashboard from './pages/SuperAdminDashboard';

import api from './utils/api';

// Reusable Layout Wrapper for dashboards
function DashboardLayout({ user, onLogout, title }) {
  return (
    <div className="flex min-h-screen bg-[#0b1120] text-slate-100 font-sans">
      <Sidebar user={user} onLogout={onLogout} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title={title} user={user} />
        <main className="p-8 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if session exists in localStorage
    const savedUser = localStorage.getItem('sbt_user');
    const token = localStorage.getItem('sbt_access_token');
    
    if (savedUser && token) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem('sbt_refresh_token');
    if (refreshToken) {
      try {
        await api.post('/auth/logout', { refreshToken });
      } catch (err) {
        console.error('Logout error:', err);
      }
    }
    localStorage.removeItem('sbt_access_token');
    localStorage.removeItem('sbt_refresh_token');
    localStorage.removeItem('sbt_user');
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b16] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/login" 
          element={
            user ? (
              <Navigate to={user.role === 'SUPER_ADMIN' ? '/superadmin' : user.role === 'ADMIN' ? '/admin' : '/user'} replace />
            ) : (
              <Login onLoginSuccess={handleLoginSuccess} />
            )
          } 
        />
        <Route 
          path="/register" 
          element={
            user ? (
              <Navigate to={user.role === 'SUPER_ADMIN' ? '/superadmin' : user.role === 'ADMIN' ? '/admin' : '/user'} replace />
            ) : (
              <Register />
            )
          } 
        />
        <Route 
          path="/forgot-password" 
          element={
            user ? (
              <Navigate to={user.role === 'SUPER_ADMIN' ? '/superadmin' : user.role === 'ADMIN' ? '/admin' : '/user'} replace />
            ) : (
              <ForgotPassword />
            )
          } 
        />

        {/* Public checkout simulator route (bypasses dashboard layouts) */}
        <Route path="/payment-checkout-simulator" element={<CheckoutSimulator />} />

        {/* Protected Customer User Routes */}
        <Route
          path="/user"
          element={
            user && user.role === 'USER' ? (
              <DashboardLayout user={user} onLogout={handleLogout} title="Customer Dashboard" />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        >
          <Route index element={<UserDashboard />} />
          <Route path="kyc" element={<KycUpload />} />
          <Route path="fund-request" element={<UserDashboard />} />
          <Route path="transfer" element={<UserDashboard />} />
          <Route path="withdraw" element={<UserDashboard />} />
          <Route path="*" element={<Navigate to="/user" replace />} />
        </Route>

        {/* Protected Admin Routes */}
        <Route
          path="/admin"
          element={
            user && user.role === 'ADMIN' ? (
              <DashboardLayout user={user} onLogout={handleLogout} title="Administrator Dashboard" />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<ManageUsers />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>

        {/* Protected Super Admin Routes */}
        <Route
          path="/superadmin"
          element={
            user && user.role === 'SUPER_ADMIN' ? (
              <DashboardLayout user={user} onLogout={handleLogout} title="Super Admin System Audit" />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        >
          <Route index element={<SuperAdminDashboard />} />
          <Route path="audit-logs" element={<SuperAdminDashboard />} />
          <Route path="security-events" element={<SuperAdminDashboard />} />
          <Route path="*" element={<Navigate to="/superadmin" replace />} />
        </Route>

        {/* Fallback Catch-All Redirect */}
        <Route 
          path="*" 
          element={
            <Navigate 
              to={
                user 
                  ? (user.role === 'SUPER_ADMIN' 
                      ? '/superadmin' 
                      : (user.role === 'ADMIN' ? '/admin' : '/user')) 
                  : '/login'
              } 
              replace 
            />
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}
