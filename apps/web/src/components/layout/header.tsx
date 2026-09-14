'use client';
import { Bell, Search, Sun, Moon, User } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';

export function Header() {
  const { theme, toggle } = useTheme();
  return (
    <header className="bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 px-6 py-3 flex items-center justify-between">
      <div className="relative w-72">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input placeholder="Buscar ocorrência, cliente, placa..." className="input pl-9 py-2 text-sm" />
      </div>
      <div className="flex items-center gap-2">
        <button onClick={toggle} className="btn-ghost p-2">
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
        <button className="btn-ghost p-2 relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>
        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center ml-1">
          <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        </div>
      </div>
    </header>
  );
}
