import React, { createContext, useContext, useState } from 'react';
import clsx from 'clsx';

interface TabsContextType {
  active: string;
  setActive: (tab: string) => void;
}

const TabsContext = createContext<TabsContextType>({ active: '', setActive: () => {} });

interface TabsProps {
  defaultTab: string;
  children: React.ReactNode;
  className?: string;
}

export function Tabs({ defaultTab, children, className }: TabsProps) {
  const [active, setActive] = useState(defaultTab);
  return (
    <TabsContext.Provider value={{ active, setActive }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

interface TabListProps {
  children: React.ReactNode;
  className?: string;
}

export function TabList({ children, className }: TabListProps) {
  return (
    <div className={clsx('flex gap-1 border-b border-gray-200', className)}>
      {children}
    </div>
  );
}

interface TabProps {
  value: string;
  children: React.ReactNode;
}

export function Tab({ value, children }: TabProps) {
  const { active, setActive } = useContext(TabsContext);
  return (
    <button
      onClick={() => setActive(value)}
      className={clsx(
        'px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px',
        active === value
          ? 'border-blue-800 text-blue-800'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
      )}
    >
      {children}
    </button>
  );
}

interface TabPanelProps {
  value: string;
  children: React.ReactNode;
}

export function TabPanel({ value, children }: TabPanelProps) {
  const { active } = useContext(TabsContext);
  if (active !== value) return null;
  return <div>{children}</div>;
}
