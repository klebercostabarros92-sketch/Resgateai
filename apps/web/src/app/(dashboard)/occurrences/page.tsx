'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Filter, Radio, Clock, User, Truck } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { api } from '@/lib/api/client';
import { cn } from '@/lib/utils/cn';

const STATUS_MAP: Record<string, { label: string; badge: string }> = {
  OPEN:            { label: 'Aberto',           badge: 'badge-blue' },
  DISPATCHING:     { label: 'Despachando',      badge: 'badge-yellow' },
  DRIVER_ASSIGNED: { label: 'Motorista Acionado', badge: 'badge-yellow' },
  EN_ROUTE:        { label: 'Em Rota',          badge: 'badge-yellow' },
  ARRIVED:         { label: 'Chegou',           badge: 'badge-blue' },
  IN_SERVICE:      { label: 'Em Atendimento',   badge: 'badge-red' },
  DONE:            { label: 'Finalizado',       badge: 'badge-green' },
  CANCELLED:       { label: 'Cancelado',        badge: 'badge-gray' },
};

const PROBLEM_MAP: Record<string, string> = {
  FLAT_TIRE: 'Pane Seca', DRY_FUEL: 'Sem Combustível',
  ELECTRICAL: 'Pane Elétrica', BATTERY: 'Bateria',
  LOCKOUT: 'Chave Trancada', TOWING_LIGHT: 'Guincho Leve',
  TOWING_HEAVY: 'Guincho Pesado', SPECIAL: 'Remoção Especial', OTHER: 'Outros',
};

export default function OccurrencesPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['occurrences', statusFilter],
    queryFn: () => api.get(`/occurrences?status=${statusFilter}&limit=30`),
    refetchInterval: 15_000,
  });

  const occurrences: unknown[] = (data as { data: { data: unknown[] } })?.data?.data || [];

  return (
    <div className="space-y-5 max-w-screen-xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">Central de Ocorrências</h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm mt-0.5">Gerencie e monitore todos os chamados</p>
        </div>
        <Link href="/occurrences/new" className="btn-primary">
          <Plus className="w-4 h-4" />
          Nova Ocorrência
        </Link>
      </div>

      {/* Status filter pills */}
      <div className="flex gap-2 flex-wrap">
        {[
          { value: '', label: 'Todos' },
          { value: 'OPEN', label: 'Abertos' },
          { value: 'EN_ROUTE', label: 'Em Rota' },
          { value: 'IN_SERVICE', label: 'Em Atendimento' },
          { value: 'DONE', label: 'Finalizados' },
        ].map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setStatusFilter(value)}
            className={cn(
              'px-4 py-1.5 rounded-full text-sm font-medium transition-all',
              statusFilter === value
                ? 'bg-primary-500 text-white shadow-sm'
                : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-700 hover:border-primary-300',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="card flex items-center gap-3 py-3">
        <Search className="w-4 h-4 text-gray-400 ml-1" />
        <input
          placeholder="Buscar por protocolo, cliente, placa..."
          className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 outline-none text-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="btn-ghost py-1.5 px-3 text-sm gap-1.5">
          <Filter className="w-3.5 h-3.5" />
          Filtros
        </button>
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50">
                {['Protocolo', 'Status', 'Cliente', 'Veículo', 'Tipo', 'Motorista', 'Horário', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-gray-100 dark:bg-slate-700 rounded" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : occurrences.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-400 dark:text-slate-500">
                    Nenhuma ocorrência encontrada
                  </td>
                </tr>
              ) : (
                (occurrences as Record<string, unknown>[]).map((occ) => {
                  const status = occ.status as string;
                  const cfg = STATUS_MAP[status] || { label: status, badge: 'badge-gray' };
                  return (
                    <motion.tr
                      key={occ.id as string}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-colors group"
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono font-semibold text-primary-600 dark:text-primary-400 text-xs">
                          {occ.protocol as string}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cfg.badge}>{cfg.label}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-gray-700 dark:text-slate-300">{(occ.client as { name: string })?.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-gray-600 dark:text-slate-400">{occ.clientVehiclePlate as string}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-slate-400">
                        {PROBLEM_MAP[occ.problemType as string] || occ.problemType as string}
                      </td>
                      <td className="px-4 py-3">
                        {occ.driver ? (
                          <div className="flex items-center gap-1.5">
                            <Truck className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-gray-600 dark:text-slate-400 text-xs">{((occ.driver as { user: { name: string } })?.user?.name)}</span>
                          </div>
                        ) : (
                          <span className="text-gray-300 dark:text-slate-600 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-gray-400 text-xs">
                          <Clock className="w-3 h-3" />
                          {new Date(occ.createdAt as string).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/occurrences/${occ.id}`} className="opacity-0 group-hover:opacity-100 text-xs text-primary-600 dark:text-primary-400 font-medium transition-opacity">
                          Ver →
                        </Link>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
