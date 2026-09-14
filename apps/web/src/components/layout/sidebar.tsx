'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Radio, MapPin, Truck, Users, UserCheck,
  DollarSign, FileText, BarChart3, Settings, Zap, LogOut, ChevronLeft,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils/cn';

const navItems = [
  { href: '/', icon: LayoutDashboard, label: 'Dashboard', roles: ['ADMIN','MANAGER','OPERATOR'] },
  { href: '/occurrences', icon: Radio, label: 'Ocorrências', roles: ['ADMIN','MANAGER','OPERATOR'] },
  { href: '/dispatch', icon: Zap, label: 'Despacho', roles: ['ADMIN','MANAGER','OPERATOR'] },
  { href: '/monitoring', icon: MapPin, label: 'Torre de Controle', roles: ['ADMIN','MANAGER','OPERATOR'] },
  { href: '/vehicles', icon: Truck, label: 'Frota', roles: ['ADMIN','MANAGER'] },
  { href: '/drivers', icon: UserCheck, label: 'Motoristas', roles: ['ADMIN','MANAGER'] },
  { href: '/clients', icon: Users, label: 'Clientes', roles: ['ADMIN','MANAGER','OPERATOR'] },
  { href: '/financial', icon: DollarSign, label: 'Financeiro', roles: ['ADMIN','FINANCIAL'] },
  { href: '/reports', icon: BarChart3, label: 'Relatórios', roles: ['ADMIN','MANAGER','FINANCIAL'] },
  { href: '/settings', icon: Settings, label: 'Configurações', roles: ['ADMIN'] },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="bg-slate-900 dark:bg-slate-950 flex flex-col h-full relative overflow-hidden"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-800">
        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
          <Zap className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="font-display font-bold text-white text-lg"
          >
            RESGATE AI
          </motion.span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));
          return (
            <Link key={href} href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group',
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800',
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="text-sm font-medium">{label}</span>}
              {collapsed && (
                <div className="absolute left-16 bg-slate-800 text-white text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                  {label}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-slate-800 space-y-1">
        <button
          onClick={() => { localStorage.clear(); window.location.href = '/login'; }}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-all duration-200"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Sair</span>}
        </button>
      </div>

      {/* Collapse button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-8 w-6 h-6 bg-slate-700 hover:bg-slate-600 rounded-full flex items-center justify-center text-slate-300 transition-colors z-10"
      >
        <ChevronLeft className={cn('w-3 h-3 transition-transform', collapsed && 'rotate-180')} />
      </button>
    </motion.aside>
  );
}
