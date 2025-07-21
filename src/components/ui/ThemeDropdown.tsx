import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Monitor, Check, ChevronDown } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

interface ThemeOption {
  value: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const ThemeDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { theme, setTheme } = useTheme();

  const themes: ThemeOption[] = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor }
  ];

  const currentTheme = themes.find(t => t.value === theme) ?? themes[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        <div className="flex items-center space-x-3">
          {React.createElement(currentTheme.icon, { className: "w-4 h-4 text-neutral-600 dark:text-neutral-300" })}
          <span className="text-sm font-medium text-neutral-900 dark:text-white">
            {currentTheme.label}
          </span>
        </div>
        <ChevronDown 
          className={`w-4 h-4 text-neutral-500 dark:text-neutral-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 py-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg z-50">
          {themes.map((themeOption) => (
            <button
              key={themeOption.value}
              type="button"
              onClick={() => handleThemeChange(themeOption.value)}
              className="w-full flex items-center justify-between px-4 py-3 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors duration-150"
            >
              <div className="flex items-center space-x-3">
                {React.createElement(themeOption.icon, { className: "w-4 h-4" })}
                <span>{themeOption.label}</span>
              </div>
              {theme === themeOption.value && (
                <Check className="w-4 h-4 text-blue-500" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ThemeDropdown;
