import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { StoreProvider, useStore } from './store/useStore';
import { Header } from './components/layout/Header';
import Onboarding from './components/Onboarding';
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
import RainwaterHarvesting from './pages/RainwaterHarvesting';
import UrbanTrees from './pages/UrbanTrees';
import Lakes from './pages/Lakes';
import Journal from './pages/Journal';

function AppInner() {
  const { state, isLoading } = useStore();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F6F1EA] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading your data…</p>
        </div>
      </div>
    );
  }

  if (!state.settings.onboardingComplete) {
    return <Onboarding />;
  }
  return (
    <div className="min-h-screen bg-[#F6F1EA]">
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
          <Route path="/rwh" element={<RainwaterHarvesting />} />
          <Route path="/trees" element={<UrbanTrees />} />
          <Route path="/lakes" element={<Lakes />} />
          <Route path="/journal" element={<Journal />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <BrowserRouter>
        <AppInner />
      </BrowserRouter>
    </StoreProvider>
  );
}
