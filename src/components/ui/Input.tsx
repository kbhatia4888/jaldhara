import React from 'react';
import clsx from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helpText?: string;
}

export function Input({ label, error, helpText, className, id, ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-[#463F2E]">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={clsx(
          'w-full px-3 py-2 text-sm border rounded-lg outline-none transition-colors',
          'placeholder-[#BFB39E] bg-[#FDFAF4] text-[#2C2820]',
          error
            ? 'border-[#CE7F4D] focus:border-[#A86030] focus:ring-1 focus:ring-[#A86030]/30'
            : 'border-[#D8CEBC] focus:border-[#567C45] focus:ring-1 focus:ring-[#567C45]/20',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      {helpText && !error && <p className="text-xs text-[#8C8062]">{helpText}</p>}
    </div>
  );
}

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function TextArea({ label, error, className, id, ...props }: TextAreaProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-[#463F2E]">
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        className={clsx(
          'w-full px-3 py-2 text-sm border rounded-lg outline-none transition-colors resize-none',
          'placeholder-[#BFB39E] bg-[#FDFAF4] text-[#2C2820]',
          error
            ? 'border-[#CE7F4D] focus:border-[#A86030] focus:ring-1 focus:ring-[#A86030]/30'
            : 'border-[#D8CEBC] focus:border-[#567C45] focus:ring-1 focus:ring-[#567C45]/20',
          className
        )}
        rows={3}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
