import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header.jsx';
import Find from './pages/Find.jsx';
import ProProfile from './pages/ProProfile.jsx';
import Join from './pages/Join.jsx';
import Manage from './pages/Manage.jsx';
import Admin from './pages/Admin.jsx';
import Plans from './pages/Plans.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#ECEBE6]/60 flex justify-center selection:bg-[#FDB60C]/30 selection:text-[#072339]">
        <div className="app-container">
          <Header />
          <main className="flex-1 flex flex-col">
            <Routes>
              <Route path="/" element={<Find />} />
              <Route path="/pro/:id" element={<ProProfile />} />
              <Route path="/join" element={<Join />} />
              <Route path="/plans" element={<Plans />} />
              <Route path="/manage" element={<Manage />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}
