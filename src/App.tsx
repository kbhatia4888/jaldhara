import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { StoreProvider } from './store/useStore';
import { Header } from './components/layout/Header';
import Dashboard from './pages/Dashboard';
import CRM from './pages/CRM';
import Audits from './pages/Audits';
import Referrals from './pages/Referrals';
import Reports from './pages/Reports';
import Scripts from './pages/Scripts';
import Geography from './pages/Geography';
import Expansion from './pages/Expansion';
import Reminders from './pages/Reminders';
import Settings from './pages/Settings';

export default function App() {
  return (
    <StoreProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-[#F9F9F7]">
          <Header />
          <main className="pb-20 md:pb-6">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/crm" element={<CRM />} />
              <Route path="/audits" element={<Audits />} />
              <Route path="/referrals" element={<Referrals />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/scripts" element={<Scripts />} />
              <Route path="/geography" element={<Geography />} />
              <Route path="/expansion" element={<Expansion />} />
              <Route path="/reminders" element={<Reminders />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </StoreProvider>
  );
}
