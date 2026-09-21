import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header.jsx';
import Find from './pages/Find.jsx';
import ProProfile from './pages/ProProfile.jsx';
import Join from './pages/Join.jsx';
import Manage from './pages/Manage.jsx';
import Admin from './pages/Admin.jsx';
import Plans from './pages/Plans.jsx';
import DemoLogin from './pages/DemoLogin.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#ECEBE6]/60 flex justify-center selection:bg-[#FDB60C]/30 selection:text-[#072339]">
        <div className="app-container sm:border-x sm:border-[#E6E6E0]/80">
          <Header />
          <main className="flex-1 flex flex-col">
            <Routes>
              {/* Login Gatekeeper - Prerequisite for entering the application */}
              <Route path="/login" element={<DemoLogin />} />

              {/* Customer Only Routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute allowedRole="user">
                    <Find />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/pro/:id"
                element={
                  <ProtectedRoute allowedRole="user">
                    <ProProfile />
                  </ProtectedRoute>
                }
              />

              {/* Worker Only Routes: Join, Plans, Manage */}
              <Route
                path="/manage"
                element={
                  <ProtectedRoute allowedRole="worker">
                    <Manage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/plans"
                element={
                  <ProtectedRoute allowedRole="worker">
                    <Plans />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/join"
                element={
                  <ProtectedRoute allowedRole="worker">
                    <Join />
                  </ProtectedRoute>
                }
              />

              {/* Moderation Console: accessible by authenticated users with admin passcode */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <Admin />
                  </ProtectedRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}
