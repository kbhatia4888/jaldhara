import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Droplets, Menu, X, LayoutDashboard, Building2, ClipboardList, FileText, Users, BookOpen, Globe, Map, Bell, Settings } from 'lucide-react';
import clsx from 'clsx';

const primaryNav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/crm', label: 'CRM', icon: Building2 },
  { to: '/audits', label: 'Audits', icon: ClipboardList },
  { to: '/scripts', label: 'Scripts', icon: BookOpen },
  { to: '/geography', label: 'Geography', icon: Globe },
  { to: '/expansion', label: 'Expansion', icon: Map },
];

const secondaryNav = [
  { to: '/referrals', label: 'Referrals', icon: Users },
  { to: '/reports', label: 'Reports', icon: FileText },
  { to: '/reminders', label: 'Reminders', icon: Bell },
  { to: '/settings', label: 'Settings', icon: Settings },
];

const mobileNav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/crm', label: 'CRM', icon: Building2 },
  { to: '/audits', label: 'Audits', icon: ClipboardList },
  { to: '/referrals', label: 'Referrals', icon: Users },
  { to: '/geography', label: 'Geography', icon: Globe },
];

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const isCrisisMonth = new Date().getMonth() >= 3 && new Date().getMonth() <= 5; // April–June

  return (
    <>
      {/* Seasonal crisis banner */}
      {isCrisisMonth && (
        <div className="bg-red-600 text-white text-center text-sm font-semibold py-2 px-4 sticky top-0 z-50">
          🚨 Delhi water crisis season is active. Contact all Hot and Warm prospects NOW.
        </div>
      )}

      <header className="bg-[#0F6E56] text-white shadow-lg sticky top-0 z-40">
        <div className="max-w-screen-2xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <NavLink to="/" className="flex items-center gap-2 flex-shrink-0">
              <div className="bg-white/20 rounded-full p-1.5">
                <Droplets size={20} className="text-white" />
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-bold text-base tracking-tight">JalDhara</span>
                <span className="text-[9px] text-white/60 font-medium tracking-widest uppercase">Water Business OS</span>
              </div>
            </NavLink>

            {/* Desktop Nav — primary */}
            <nav className="hidden lg:flex items-center gap-0.5">
              {primaryNav.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'text-white/70 hover:bg-white/10 hover:text-white'
                    )
                  }
                >
                  <item.icon size={14} />
                  {item.label}
                </NavLink>
              ))}
              <div className="w-px h-5 bg-white/20 mx-1" />
              {secondaryNav.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'text-white/70 hover:bg-white/10 hover:text-white'
                    )
                  }
                >
                  <item.icon size={14} />
                  {item.label}
                </NavLink>
              ))}
            </nav>

            {/* Mobile menu button */}
            <button
              className="lg:hidden p-2 rounded-lg text-white/70 hover:bg-white/10 transition-colors"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>

          {/* Mobile dropdown menu */}
          {menuOpen && (
            <nav className="lg:hidden border-t border-white/20 py-2">
              <p className="px-4 py-1 text-[10px] font-semibold uppercase tracking-widest text-white/40">Main</p>
              {primaryNav.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors rounded-lg mx-1 mb-0.5',
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'text-white/70 hover:bg-white/10 hover:text-white'
                    )
                  }
                >
                  <item.icon size={16} />
                  {item.label}
                </NavLink>
              ))}
              <p className="px-4 py-1 mt-2 text-[10px] font-semibold uppercase tracking-widest text-white/40">More</p>
              {secondaryNav.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors rounded-lg mx-1 mb-0.5',
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'text-white/70 hover:bg-white/10 hover:text-white'
                    )
                  }
                >
                  <item.icon size={16} />
                  {item.label}
                </NavLink>
              ))}
            </nav>
          )}
        </div>
      </header>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 flex">
        {mobileNav.map(item => {
          const isActive = item.to === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(item.to);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5"
            >
              <item.icon
                size={20}
                className={isActive ? 'text-[#0F6E56]' : 'text-gray-400'}
              />
              <span className={clsx('text-[10px] font-medium', isActive ? 'text-[#0F6E56]' : 'text-gray-400')}>
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </nav>
    </>
  );
}
