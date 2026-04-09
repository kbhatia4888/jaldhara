import React from 'react';
import clsx from 'clsx';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
}

export function Select({ label, error, options, placeholder, className, id, ...props }: SelectProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-[#463F2E]">
          {label}
        </label>
      )}
      <select
        id={inputId}
        className={clsx(
          'w-full px-3 py-2 text-sm border rounded-lg outline-none transition-colors bg-[#FDFAF4] text-[#2C2820]',
          error
            ? 'border-[#CE7F4D] focus:border-[#A86030] focus:ring-1 focus:ring-[#A86030]/30'
            : 'border-[#D8CEBC] focus:border-[#567C45] focus:ring-1 focus:ring-[#567C45]/20',
          className
        )}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
