'use client';
import { motion } from 'framer-motion';
import {
  Radio, Truck, TrendingUp, Clock, DollarSign,
  CheckCircle2, AlertCircle, BarChart3,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';

// ── KPI Card ─────────────────────────────────────────────────────────────
function KpiCard({
  icon: Icon, label, value, sub, color, delay = 0,
}: {
  icon: React.ElementType; label: string; value: string | number;
  sub?: string; color: string; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="kpi-card"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-slate-400 font-medium">{label}</p>
          <p className="text-3xl font-display font-bold text-gray-900 dark:text-white mt-1">
            {value}
          </p>
          {sub && <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">{sub}</p>}
        </div>
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </motion.div>
  );
}

// ── Status Dot ────────────────────────────────────────────────────────────
const statusDot = (status: string) => {
  const map: Record<string, string> = {
    AVAILABLE: 'bg-emerald-500', ON_WAY: 'bg-amber-500',
    IN_SERVICE: 'bg-red-500', OFFLINE: 'bg-gray-400',
  };
  return map[status] || 'bg-gray-400';
};

const mockChartData = [
  { name: 'Seg', atendimentos: 14, faturamento: 4200 },
  { name: 'Ter', atendimentos: 18, faturamento: 5400 },
  { name: 'Qua', atendimentos: 12, faturamento: 3600 },
  { name: 'Qui', atendimentos: 22, faturamento: 6600 },
  { name: 'Sex', atendimentos: 28, faturamento: 8400 },
  { name: 'Sab', atendimentos: 35, faturamento: 10500 },
  { name: 'Dom', atendimentos: 20, faturamento: 6000 },
];

const mockPieData = [
  { name: 'Pane Seca', value: 28, color: '#1A56DB' },
  { name: 'Elétrica',  value: 22, color: '#06B6D4' },
  { name: 'Guincho',   value: 32, color: '#10B981' },
  { name: 'Pneu',      value: 18, color: '#F59E0B' },
];

export default function DashboardPage() {
  const { data: kpis, isLoading } = useQuery({
    queryKey: ['dashboard-kpis'],
    queryFn: () => api.get('/occurrences/dashboard/kpis'),
    refetchInterval: 30_000,
  });

  const k = kpis?.data || {};

  const kpiCards = [
    { icon: Radio, label: 'Chamados Hoje', value: isLoading ? '—' : k.totalToday ?? 0, sub: 'Total do dia', color: 'bg-blue-500', delay: 0 },
    { icon: AlertCircle, label: 'Em Andamento', value: isLoading ? '—' : k.activeNow ?? 0, sub: 'Ocorrências ativas', color: 'bg-amber-500', delay: 0.05 },
    { icon: Truck, label: 'Veículos Livres', value: isLoading ? '—' : k.availableVehicles ?? 0, sub: `${k.busyVehicles ?? 0} em atendimento`, color: 'bg-emerald-500', delay: 0.1 },
    { icon: CheckCircle2, label: 'Índice SLA', value: isLoading ? '—' : `${k.slaIndex ?? 100}%`, sub: 'Mês atual', color: 'bg-violet-500', delay: 0.15 },
    { icon: DollarSign, label: 'Faturamento Hoje', value: isLoading ? '—' : `R$ ${Number(k.dailyRevenue ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, sub: 'Receita do dia', color: 'bg-teal-500', delay: 0.2 },
    { icon: TrendingUp, label: 'Faturamento Mês', value: isLoading ? '—' : `R$ ${Number(k.monthlyRevenue ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`, sub: 'Mês corrente', color: 'bg-indigo-500', delay: 0.25 },
    { icon: Clock, label: 'KM Médio/OS', value: isLoading ? '—' : `${Number(k.avgKmPerService ?? 0).toFixed(1)} km`, sub: 'Por atendimento', color: 'bg-pink-500', delay: 0.3 },
    { icon: BarChart3, label: 'Veículos Ocupados', value: isLoading ? '—' : k.busyVehicles ?? 0, sub: 'Em campo agora', color: 'bg-orange-500', delay: 0.35 },
  ];

  return (
    <div className="space-y-6 max-w-screen-2xl">
      <div>
        <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-500 dark:text-slate-400 text-sm mt-0.5">Visão geral da operação em tempo real</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpiCards.map((c) => <KpiCard key={c.label} {...c} />)}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Area chart — atendimentos */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          className="card col-span-2"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-gray-900 dark:text-white">Atendimentos × Faturamento (7 dias)</h3>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={mockChartData}>
              <defs>
                <linearGradient id="colorAtt" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1A56DB" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#1A56DB" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
              <Area type="monotone" dataKey="atendimentos" stroke="#1A56DB" strokeWidth={2} fill="url(#colorAtt)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Pie chart — tipos de ocorrência */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="card"
        >
          <h3 className="font-display font-semibold text-gray-900 dark:text-white mb-4">Tipos de Ocorrência</h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={mockPieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4} dataKey="value">
                {mockPieData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-1.5 mt-2">
            {mockPieData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-xs text-gray-500 dark:text-slate-400 truncate">{item.name}</span>
                <span className="text-xs font-semibold text-gray-700 dark:text-slate-300 ml-auto">{item.value}%</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Recent occurrences */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
        className="card"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold text-gray-900 dark:text-white">Ocorrências Recentes</h3>
          <a href="/occurrences" className="text-sm text-primary-600 hover:text-primary-700 font-medium">Ver todas →</a>
        </div>
        <div className="text-center py-8 text-gray-400 dark:text-slate-500 text-sm">
          Conecte ao backend para visualizar ocorrências em tempo real
        </div>
      </motion.div>
    </div>
  );
}
