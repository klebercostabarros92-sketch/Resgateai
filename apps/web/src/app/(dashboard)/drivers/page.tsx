'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  UserCheck, Search, Filter, Plus, Star, Phone,
  Truck, Award, ShieldAlert, CheckCircle2, AlertTriangle,
  Clock, MapPin, MessageSquare, ArrowUpRight
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface DriverItem {
  id: string;
  name: string;
  phone: string;
  cnh: string;
  cnhCategory: string;
  cnhExpiry: string;
  cnhStatus: 'VALID' | 'WARNING' | 'EXPIRED';
  rating: number;
  totalServices: number;
  acceptanceRate: number;
  isOnline: boolean;
  status: 'AVAILABLE' | 'ON_WAY' | 'IN_SERVICE' | 'OFFLINE';
  vehiclePlate?: string;
  vehicleModel?: string;
  currentLocation: string;
}

const MOCK_DRIVERS: DriverItem[] = [
  {
    id: 'd-1',
    name: 'Carlos Eduardo Silva',
    phone: '(11) 98765-4321',
    cnh: '04829183741',
    cnhCategory: 'Cat. D / E (MOPP)',
    cnhExpiry: '18/11/2028',
    cnhStatus: 'VALID',
    rating: 4.96,
    totalServices: 432,
    acceptanceRate: 98.5,
    isOnline: true,
    status: 'AVAILABLE',
    vehiclePlate: 'BRA2E19',
    vehicleModel: 'Iveco Daily Plataforma',
    currentLocation: 'São Paulo - SP (Pinheiros)',
  },
  {
    id: 'd-2',
    name: 'João Marcos Santos',
    phone: '(11) 97654-3210',
    cnh: '01928471923',
    cnhCategory: 'Cat. D (Emergência)',
    cnhExpiry: '04/05/2027',
    cnhStatus: 'VALID',
    rating: 4.88,
    totalServices: 310,
    acceptanceRate: 96.0,
    isOnline: true,
    status: 'ON_WAY',
    vehiclePlate: 'RGA4H88',
    vehicleModel: 'Mercedes-Benz Accelo Asa Delta',
    currentLocation: 'São Paulo - SP (Av. Paulista)',
  },
  {
    id: 'd-3',
    name: 'Marcio Rogério Souza',
    phone: '(11) 95432-1098',
    cnh: '08374928174',
    cnhCategory: 'Cat. E (Cargas Especiais)',
    cnhExpiry: '12/10/2026',
    cnhStatus: 'WARNING', // Vencendo em breve
    rating: 5.0,
    totalServices: 620,
    acceptanceRate: 100.0,
    isOnline: true,
    status: 'AVAILABLE',
    vehiclePlate: 'PES9X99',
    vehicleModel: 'Scania P310 Extra-Pesado',
    currentLocation: 'Guarulhos - SP (Rod. Dutra)',
  },
  {
    id: 'd-4',
    name: 'Pedro Alcântara',
    phone: '(11) 96543-2109',
    cnh: '09483726154',
    cnhCategory: 'Cat. D',
    cnhExpiry: '22/01/2029',
    cnhStatus: 'VALID',
    rating: 4.75,
    totalServices: 195,
    acceptanceRate: 93.4,
    isOnline: true,
    status: 'IN_SERVICE',
    vehiclePlate: 'GU19P02',
    vehicleModel: 'VW Delivery 11.180',
    currentLocation: 'São Bernardo do Campo - SP',
  },
  {
    id: 'd-5',
    name: 'Lucas Ferreira Melo',
    phone: '(11) 94321-0987',
    cnh: '03748291038',
    cnhCategory: 'Cat. C',
    cnhExpiry: '30/09/2027',
    cnhStatus: 'VALID',
    rating: 4.60,
    totalServices: 88,
    acceptanceRate: 89.2,
    isOnline: false,
    status: 'OFFLINE',
    vehiclePlate: '—',
    vehicleModel: 'Reserva Técnica',
    currentLocation: 'Folga Escala Semanal',
  },
];

const STATUS_TAGS = {
  AVAILABLE: { label: 'Disponível', badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-500' },
  ON_WAY: { label: 'Em Deslocamento', badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20', dot: 'bg-amber-500' },
  IN_SERVICE: { label: 'Em Atendimento', badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20', dot: 'bg-blue-500' },
  OFFLINE: { label: 'Offline / Folga', badge: 'bg-slate-500/10 text-slate-400 border-slate-500/20', dot: 'bg-slate-500' },
};

export default function DriversPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'ONLINE' | 'AVAILABLE' | 'OFFLINE'>('ALL');

  const filtered = MOCK_DRIVERS.filter((d) => {
    const matchSearch =
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.phone.includes(searchTerm) ||
      (d.vehiclePlate && d.vehiclePlate.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchFilter =
      filter === 'ALL' ? true :
      filter === 'ONLINE' ? d.isOnline :
      filter === 'AVAILABLE' ? d.status === 'AVAILABLE' :
      !d.isOnline;

    return matchSearch && matchFilter;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <UserCheck className="w-8 h-8 text-blue-500" />
            Gestão de Motoristas & Socorristas
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Qualificação profissional, controle de CNH/MOPP, pontualidade de SLA e telemetria da equipe em campo.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-lg shadow-blue-600/20">
            <Plus className="w-4 h-4" /> Cadastrar Motorista
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl backdrop-blur-sm">
          <p className="text-xs font-medium text-slate-400">Total de Motoristas</p>
          <p className="text-2xl font-bold text-white mt-1">{MOCK_DRIVERS.length} ativos</p>
          <p className="text-xs text-slate-500 mt-2">100% CNHs auditadas</p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl backdrop-blur-sm">
          <p className="text-xs font-medium text-slate-400">Online & Conectados</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{MOCK_DRIVERS.filter(d => d.isOnline).length} motoristas</p>
          <p className="text-xs text-emerald-400/80 mt-2">Prontos p/ auto-dispatch</p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl backdrop-blur-sm">
          <p className="text-xs font-medium text-slate-400">Avaliação Média Geral</p>
          <p className="text-2xl font-bold text-amber-400 mt-1 flex items-center gap-1.5">
            4.88 <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
          </p>
          <p className="text-xs text-slate-500 mt-2">Baseado em 1.745 avaliações</p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl backdrop-blur-sm">
          <p className="text-xs font-medium text-slate-400">Taxa Média de Aceite</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">97.4%</p>
          <p className="text-xs text-slate-500 mt-2">Tempo médio de resposta: 18s</p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-slate-900/40 border border-slate-800/80 p-4 rounded-2xl backdrop-blur-sm flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nome, placa, telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950/70 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500 font-medium mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Visualizar:
          </span>
          {[
            { id: 'ALL', label: 'Todos' },
            { id: 'ONLINE', label: 'Online Agora' },
            { id: 'AVAILABLE', label: 'Disponíveis' },
            { id: 'OFFLINE', label: 'Offline / Folga' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={cn(
                'text-xs px-3 py-1.5 rounded-lg border font-medium transition-all',
                filter === tab.id
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-white'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Drivers Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((driver, idx) => {
          const st = STATUS_TAGS[driver.status];
          return (
            <motion.div
              key={driver.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-xl transition-all relative overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    {driver.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">{driver.phone}</p>
                </div>

                <span className={cn('text-xs px-2.5 py-1 rounded-full border font-semibold flex items-center gap-1.5', st.badge)}>
                  <span className={cn('w-2 h-2 rounded-full', st.dot, driver.isOnline && 'animate-pulse')} />
                  {st.label}
                </span>
              </div>

              {/* Badges / Rating / Stats */}
              <div className="mt-4 flex items-center gap-3">
                <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span className="text-xs font-bold text-amber-300">{driver.rating.toFixed(2)}</span>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-lg">
                  <span className="text-xs font-semibold text-blue-300">{driver.totalServices} serviços</span>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                  <span className="text-xs font-semibold text-emerald-300">{driver.acceptanceRate}% aceite</span>
                </div>
              </div>

              {/* Details */}
              <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-cyan-400" /> Veículo:
                  </span>
                  <span className="text-slate-200 font-mono font-medium">
                    {driver.vehiclePlate} ({driver.vehicleModel})
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-purple-400" /> Habilitação:
                  </span>
                  <span className="text-slate-200 font-medium">{driver.cnhCategory}</span>
                </div>

                <div className="flex items-center justify-between text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" /> Venc. CNH:
                  </span>
                  <span className={cn('font-mono', driver.cnhStatus === 'WARNING' ? 'text-amber-400 font-bold' : 'text-slate-300')}>
                    {driver.cnhExpiry} {driver.cnhStatus === 'WARNING' && '(Renovar)'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" /> Base / Posição:
                  </span>
                  <span className="text-slate-300">{driver.currentLocation}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-3 border-t border-slate-800/60 flex items-center gap-2">
                <a
                  href={`https://wa.me/55${driver.phone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-1.5 text-xs font-medium text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg transition-colors flex items-center justify-center gap-1"
                >
                  <MessageSquare className="w-3 h-3" /> WhatsApp
                </a>
                <button className="flex-1 py-1.5 text-xs font-medium text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-lg transition-colors flex items-center justify-center gap-1">
                  Escalar Guincho <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
