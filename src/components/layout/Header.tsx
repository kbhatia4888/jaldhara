import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Droplets, Menu, X,
  LayoutDashboard, Building2, ClipboardList, FileText,
  Users, BookOpen, Globe, Map, Bell, Settings, Leaf, Waves,
} from 'lucide-react';
import clsx from 'clsx';

const primaryNav = [
  { to: '/',        label: 'Dashboard',  icon: LayoutDashboard },
  { to: '/crm',     label: 'CRM',        icon: Building2 },
  { to: '/audits',  label: 'Audits',     icon: ClipboardList },
  { to: '/rwh',     label: 'Rainwater',  icon: Droplets },
  { to: '/trees',   label: 'Trees',      icon: Leaf },
  { to: '/lakes',   label: 'Lakes',      icon: Waves },
];

const moreNav = [
  { to: '/referrals', label: 'Referrals', icon: Users },
  { to: '/scripts',   label: 'Scripts',   icon: BookOpen },
  { to: '/geography', label: 'Geography', icon: Globe },
  { to: '/expansion', label: 'Expansion', icon: Map },
  { to: '/reports',   label: 'Reports',   icon: FileText },
  { to: '/reminders', label: 'Reminders', icon: Bell },
  { to: '/settings',  label: 'Settings',  icon: Settings },
];

const mobileNav = [
  { to: '/',        label: 'Dashboard', icon: LayoutDashboard },
  { to: '/crm',     label: 'CRM',       icon: Building2 },
  { to: '/audits',  label: 'Audits',    icon: ClipboardList },
  { to: '/trees',   label: 'Trees',     icon: Leaf },
  { to: '/lakes',   label: 'Lakes',     icon: Waves },
];

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <>
      {/* Main header */}
      <header className="bg-[#FDFAF4] border-b border-[#E2D5BE] sticky top-0 z-40">
        <div className="max-w-screen-2xl mx-auto px-6">
          <div className="flex items-center justify-between h-16 gap-6">

            {/* Logo */}
            <NavLink to="/" className="flex items-center gap-2.5 flex-shrink-0">
              <div className="w-8 h-8 rounded-xl bg-[#567C45] flex items-center justify-center">
                <Droplets size={16} className="text-white" />
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-semibold text-[#2C2820] text-sm tracking-tight">JalDhara</span>
                <span className="text-[9px] text-[#ADA082] font-medium tracking-widest uppercase mt-px">Water OS</span>
              </div>
            </NavLink>

            {/* Desktop — primary nav */}
            <nav className="hidden lg:flex items-center gap-1 flex-1">
              {primaryNav.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all',
                      isActive
                        ? 'bg-[#567C45]/10 text-[#567C45]'
                        : 'text-[#8C8062] hover:text-[#2C2820] hover:bg-[#EDE4D4]'
                    )
                  }
                >
                  <item.icon size={14} strokeWidth={2} />
                  {item.label}
                </NavLink>
              ))}
            </nav>

            {/* Desktop — secondary nav (icons + label on hover) */}
            <nav className="hidden lg:flex items-center gap-0.5">
              {moreNav.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  title={item.label}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-medium transition-all',
                      isActive
                        ? 'bg-[#567C45]/10 text-[#567C45]'
                        : 'text-[#ADA082] hover:text-[#5C5244] hover:bg-[#EDE4D4]'
                    )
                  }
                >
                  <item.icon size={15} strokeWidth={1.8} />
                  <span className="hidden xl:inline">{item.label}</span>
                </NavLink>
              ))}
            </nav>

            {/* Mobile menu button */}
            <button
              className="lg:hidden p-2 rounded-xl text-[#8C8062] hover:bg-[#EDE4D4] transition-colors"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          {/* Mobile dropdown */}
          {menuOpen && (
            <nav className="lg:hidden border-t border-[#EDE4D4] py-3 space-y-0.5">
              <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-[#ADA082]">Main</p>
              {primaryNav.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium rounded-xl transition-all',
                      isActive
                        ? 'bg-[#567C45]/10 text-[#567C45]'
                        : 'text-[#5C5244] hover:bg-[#F6F1EA] hover:text-[#2C2820]'
                    )
                  }
                >
                  <item.icon size={16} strokeWidth={1.8} />
                  {item.label}
                </NavLink>
              ))}
              <p className="px-3 py-1 mt-2 text-[10px] font-semibold uppercase tracking-widest text-[#ADA082]">More</p>
              {moreNav.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium rounded-xl transition-all',
                      isActive
                        ? 'bg-[#567C45]/10 text-[#567C45]'
                        : 'text-[#5C5244] hover:bg-[#F6F1EA] hover:text-[#2C2820]'
                    )
                  }
                >
                  <item.icon size={16} strokeWidth={1.8} />
                  {item.label}
                </NavLink>
              ))}
            </nav>
          )}
        </div>
      </header>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FDFAF4] border-t border-[#E2D5BE] flex">
        {mobileNav.map(item => {
          const isActive = item.to === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(item.to);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className="flex-1 flex flex-col items-center justify-center py-3 gap-1"
            >
              <item.icon
                size={19}
                strokeWidth={isActive ? 2.2 : 1.8}
                className={isActive ? 'text-[#567C45]' : 'text-[#ADA082]'}
              />
              <span className={clsx('text-[10px] font-medium', isActive ? 'text-[#567C45]' : 'text-[#ADA082]')}>
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </nav>
    </>
  );
}
