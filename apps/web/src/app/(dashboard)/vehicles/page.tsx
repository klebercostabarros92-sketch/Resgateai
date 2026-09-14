'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Truck, Search, Filter, Plus, Wrench, CheckCircle2,
  AlertTriangle, Clock, MapPin, Gauge, MoreVertical, Fuel,
  ShieldCheck, ArrowUpRight
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

type VehicleType = 'FLATBED' | 'HEAVY' | 'WHEEL_LIFT' | 'LIGHT' | 'CRANE';
type VehicleStatus = 'AVAILABLE' | 'ON_WAY' | 'IN_SERVICE' | 'MAINTENANCE' | 'OFFLINE';

interface VehicleItem {
  id: string;
  plate: string;
  brand: string;
  model: string;
  year: number;
  type: VehicleType;
  typeLabel: string;
  capacityTons: number;
  status: VehicleStatus;
  driverName?: string;
  driverPhone?: string;
  odometer: number;
  fuelPercent: number;
  currentCity: string;
  lastMaintenance: string;
  nextMaintenanceKm: number;
}

const MOCK_VEHICLES: VehicleItem[] = [
  {
    id: 'v-1',
    plate: 'BRA2E19',
    brand: 'Iveco',
    model: 'Daily 70C17 Plataforma Hidráulica',
    year: 2023,
    type: 'FLATBED',
    typeLabel: 'Plataforma Hidráulica',
    capacityTons: 4.5,
    status: 'AVAILABLE',
    driverName: 'Carlos Eduardo Silva',
    driverPhone: '(11) 98765-4321',
    odometer: 48250,
    fuelPercent: 85,
    currentCity: 'São Paulo - SP (Pinheiros)',
    lastMaintenance: '10/08/2026',
    nextMaintenanceKm: 55000,
  },
  {
    id: 'v-2',
    plate: 'RGA4H88',
    brand: 'Mercedes-Benz',
    model: 'Accelo 815 Guincho Asa Delta',
    year: 2022,
    type: 'WHEEL_LIFT',
    typeLabel: 'Asa Delta + Plataforma',
    capacityTons: 5.0,
    status: 'ON_WAY',
    driverName: 'João Marcos Santos',
    driverPhone: '(11) 97654-3210',
    odometer: 92400,
    fuelPercent: 62,
    currentCity: 'São Paulo - SP (Av. Paulista)',
    lastMaintenance: '25/07/2026',
    nextMaintenanceKm: 100000,
  },
  {
    id: 'v-3',
    plate: 'GU19P02',
    brand: 'Volkswagen',
    model: 'Delivery 11.180 Plataforma Estendida',
    year: 2024,
    type: 'FLATBED',
    typeLabel: 'Plataforma Estendida',
    capacityTons: 6.2,
    status: 'IN_SERVICE',
    driverName: 'Pedro Alcântara',
    driverPhone: '(11) 96543-2109',
    odometer: 24100,
    fuelPercent: 45,
    currentCity: 'São Bernardo do Campo - SP',
    lastMaintenance: '15/08/2026',
    nextMaintenanceKm: 35000,
  },
  {
    id: 'v-4',
    plate: 'PES9X99',
    brand: 'Scania',
    model: 'P310 Lança Extra-Pesado 8x2',
    year: 2021,
    type: 'HEAVY',
    typeLabel: 'Pesado / Carreta & Ônibus',
    capacityTons: 35.0,
    status: 'AVAILABLE',
    driverName: 'Marcio Rogério Souza',
    driverPhone: '(11) 95432-1098',
    odometer: 184500,
    fuelPercent: 90,
    currentCity: 'Guarulhos - SP (Rod. Dutra)',
    lastMaintenance: '02/09/2026',
    nextMaintenanceKm: 200000,
  },
  {
    id: 'v-5',
    plate: 'MNK3B33',
    brand: 'Volvo',
    model: 'VM 270 Munck Articulado',
    year: 2020,
    type: 'CRANE',
    typeLabel: 'Guincho Munck / Içamento',
    capacityTons: 12.0,
    status: 'MAINTENANCE',
    driverName: 'Em Manutenção Preventiva',
    driverPhone: 'Oficina Central',
    odometer: 215000,
    fuelPercent: 30,
    currentCity: 'Base Central - Oficina',
    lastMaintenance: 'Hoje (Em revisão)',
    nextMaintenanceKm: 220000,
  },
  {
    id: 'v-6',
    plate: 'LGT1A11',
    brand: 'Ford',
    model: 'F-4000 Socorro Rápido',
    year: 2019,
    type: 'LIGHT',
    typeLabel: 'Socorro Rápido / Bateria / Pneu',
    capacityTons: 2.5,
    status: 'OFFLINE',
    driverName: 'Sem motorista escalado',
    driverPhone: '—',
    odometer: 142000,
    fuelPercent: 70,
    currentCity: 'Pátio Norte',
    lastMaintenance: '14/06/2026',
    nextMaintenanceKm: 150000,
  },
];

const STATUS_TAGS: Record<VehicleStatus, { label: string; color: string; badge: string }> = {
  AVAILABLE: { label: 'Disponível', color: 'bg-emerald-500', badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  ON_WAY: { label: 'Em Deslocamento', color: 'bg-amber-500', badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  IN_SERVICE: { label: 'Em Atendimento', color: 'bg-blue-500', badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  MAINTENANCE: { label: 'Manutenção', color: 'bg-rose-500', badge: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
  OFFLINE: { label: 'Pátio / Offline', color: 'bg-slate-400', badge: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
};

const TYPE_TAGS: Record<VehicleType, { badge: string }> = {
  FLATBED: { badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
  WHEEL_LIFT: { badge: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  HEAVY: { badge: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
  CRANE: { badge: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
  LIGHT: { badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
};

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<VehicleItem[]>(MOCK_VEHICLES);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<VehicleStatus | 'ALL'>('ALL');
  const [typeFilter, setTypeFilter] = useState<VehicleType | 'ALL'>('ALL');

  const filtered = vehicles.filter((v) => {
    const matchesSearch =
      v.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.driverName && v.driverName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || v.status === statusFilter;
    const matchesType = typeFilter === 'ALL' || v.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const stats = {
    total: vehicles.length,
    available: vehicles.filter((v) => v.status === 'AVAILABLE').length,
    active: vehicles.filter((v) => ['ON_WAY', 'IN_SERVICE'].includes(v.status)).length,
    maintenance: vehicles.filter((v) => v.status === 'MAINTENANCE').length,
    totalCapacity: vehicles.reduce((acc, v) => acc + v.capacityTons, 0),
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Truck className="w-8 h-8 text-blue-500" />
            Gestão de Frota & Guinchos
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Controle de implementos, capacidade de reboque, telemetria e manutenção preventiva.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-colors shadow-lg shadow-blue-600/20">
            <Plus className="w-4 h-4" />
            Cadastrar Guincho
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl backdrop-blur-sm">
          <p className="text-xs font-medium text-slate-400">Frota Total</p>
          <p className="text-2xl font-bold text-white mt-1">{stats.total} <span className="text-xs font-normal text-slate-400">veículos</span></p>
          <div className="flex items-center gap-1 text-xs text-emerald-400 mt-2">
            <ShieldCheck className="w-3.5 h-3.5" /> 100% monitorada
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl backdrop-blur-sm">
          <p className="text-xs font-medium text-slate-400">Prontos p/ Despacho</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{stats.available} <span className="text-xs font-normal text-slate-400">disponíveis</span></p>
          <p className="text-xs text-slate-400 mt-2">Prontos em sub-5 min</p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl backdrop-blur-sm">
          <p className="text-xs font-medium text-slate-400">Em Missão / Atendimento</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">{stats.active} <span className="text-xs font-normal text-slate-400">em trânsito</span></p>
          <p className="text-xs text-slate-400 mt-2">Operação em tempo real</p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl backdrop-blur-sm">
          <p className="text-xs font-medium text-slate-400">Capacidade Operacional</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">{stats.totalCapacity} <span className="text-xs font-normal text-slate-400">Tons</span></p>
          <p className="text-xs text-slate-400 mt-2">Leve, Médio e Extra-Pesado</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-slate-900/40 border border-slate-800/80 p-4 rounded-2xl backdrop-blur-sm flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por placa, modelo, motorista..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950/70 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Tags / Status Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500 font-medium mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Status:
          </span>
          {(['ALL', 'AVAILABLE', 'ON_WAY', 'IN_SERVICE', 'MAINTENANCE', 'OFFLINE'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={cn(
                'text-xs px-3 py-1.5 rounded-lg border font-medium transition-all',
                statusFilter === st
                  ? 'bg-blue-600 border-blue-500 text-white shadow-sm'
                  : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              )}
            >
              {st === 'ALL' ? 'Todos' : STATUS_TAGS[st].label}
            </button>
          ))}
        </div>
      </div>

      {/* Vehicle Grid / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((vehicle, idx) => {
          const st = STATUS_TAGS[vehicle.status];
          const tp = TYPE_TAGS[vehicle.type];

          return (
            <motion.div
              key={vehicle.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-xl transition-all group relative overflow-hidden"
            >
              {/* Status Glow bar */}
              <div className={cn('absolute top-0 left-0 right-0 h-1', st.color)} />

              {/* Card Header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-bold text-white bg-slate-950 px-2.5 py-0.5 rounded border border-slate-700 tracking-wider">
                      {vehicle.plate}
                    </span>
                    <span className={cn('text-xs px-2 py-0.5 rounded-full border font-medium', tp.badge)}>
                      {vehicle.typeLabel}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-200 mt-2">
                    {vehicle.brand} {vehicle.model}
                  </h3>
                  <p className="text-xs text-slate-500">Ano: {vehicle.year} • Cap: {vehicle.capacityTons} Toneladas</p>
                </div>

                <span className={cn('text-xs px-2.5 py-1 rounded-full border font-semibold flex items-center gap-1.5', st.badge)}>
                  <span className={cn('w-2 h-2 rounded-full animate-pulse', st.color)} />
                  {st.label}
                </span>
              </div>

              {/* Driver & Telemetry Details */}
              <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-400" />
                    Local Atual:
                  </span>
                  <span className="text-slate-300 font-medium">{vehicle.currentCity}</span>
                </div>

                <div className="flex items-center justify-between text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-cyan-400" />
                    Motorista:
                  </span>
                  <span className="text-slate-200 font-medium">{vehicle.driverName || 'Nenhum'}</span>
                </div>

                <div className="flex items-center justify-between text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Gauge className="w-3.5 h-3.5 text-indigo-400" />
                    Odômetro:
                  </span>
                  <span className="text-slate-300 font-mono">{vehicle.odometer.toLocaleString('pt-BR')} km</span>
                </div>

                <div className="flex items-center justify-between text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5 text-amber-400" />
                    Próx. Revisão:
                  </span>
                  <span className="text-amber-400 font-mono">{vehicle.nextMaintenanceKm.toLocaleString('pt-BR')} km</span>
                </div>
              </div>

              {/* Fuel Level Bar */}
              <div className="mt-4 pt-3 border-t border-slate-800/60">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-500 flex items-center gap-1">
                    <Fuel className="w-3 h-3 text-slate-400" /> Combustível:
                  </span>
                  <span className="text-slate-300 font-semibold">{vehicle.fuelPercent}%</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      vehicle.fuelPercent > 50 ? 'bg-emerald-500' : vehicle.fuelPercent > 25 ? 'bg-amber-500' : 'bg-rose-500'
                    )}
                    style={{ width: `${vehicle.fuelPercent}%` }}
                  />
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="mt-4 pt-3 flex items-center justify-between gap-2">
                <button className="flex-1 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 rounded-lg transition-colors text-center">
                  Telemetria
                </button>
                <button className="flex-1 py-1.5 text-xs font-medium text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-lg transition-colors text-center flex items-center justify-center gap-1">
                  Ver no Mapa <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
