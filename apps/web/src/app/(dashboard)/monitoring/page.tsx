'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { io, Socket } from 'socket.io-client';
import {
  MapPin, Truck, Radio, User, Clock, Navigation,
  ChevronRight, Filter, Maximize2, RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

type VehicleStatus = 'AVAILABLE' | 'ON_WAY' | 'IN_SERVICE' | 'OFFLINE' | 'MAINTENANCE';
type VehicleMarker = {
  id: string; plate: string; driverName: string; vehicleType: string;
  status: VehicleStatus; lat: number; lng: number; speed?: number;
  currentOccurrence?: { id: string; protocol: string; address: string };
};

const STATUS_CONFIG: Record<VehicleStatus, { label: string; color: string; dot: string; mapColor: string }> = {
  AVAILABLE:   { label: 'Disponível',   color: 'badge-green',  dot: 'bg-emerald-500', mapColor: '#10B981' },
  ON_WAY:      { label: 'Em Rota',      color: 'badge-yellow', dot: 'bg-amber-500',   mapColor: '#F59E0B' },
  IN_SERVICE:  { label: 'Em Atendimento', color: 'badge-red', dot: 'bg-red-500',      mapColor: '#EF4444' },
  OFFLINE:     { label: 'Offline',      color: 'badge-gray',   dot: 'bg-gray-400',    mapColor: '#9CA3AF' },
  MAINTENANCE: { label: 'Manutenção',   color: 'badge-gray',   dot: 'bg-gray-400',    mapColor: '#9CA3AF' },
};

// Simulated vehicles for demo
const DEMO_VEHICLES: VehicleMarker[] = [
  { id: '1', plate: 'ABC-1234', driverName: 'Carlos Silva',   vehicleType: 'LIGHT',    status: 'AVAILABLE',  lat: -23.550, lng: -46.633 },
  { id: '2', plate: 'DEF-5678', driverName: 'João Santos',    vehicleType: 'HEAVY',    status: 'ON_WAY',     lat: -23.560, lng: -46.643, currentOccurrence: { id: 'oc1', protocol: 'OS-2026-000042', address: 'Av. Paulista, 1000' } },
  { id: '3', plate: 'GHI-9012', driverName: 'Pedro Oliveira', vehicleType: 'FLATBED',  status: 'IN_SERVICE', lat: -23.545, lng: -46.620, currentOccurrence: { id: 'oc2', protocol: 'OS-2026-000043', address: 'R. Augusta, 250' } },
  { id: '4', plate: 'JKL-3456', driverName: 'Marcos Lima',    vehicleType: 'LIGHT',    status: 'AVAILABLE',  lat: -23.570, lng: -46.650 },
  { id: '5', plate: 'MNO-7890', driverName: 'André Costa',    vehicleType: 'LIGHT',    status: 'OFFLINE',    lat: -23.535, lng: -46.610 },
];

export default function MonitoringPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [vehicles, setVehicles] = useState<VehicleMarker[]>(DEMO_VEHICLES);
  const [selected, setSelected] = useState<VehicleMarker | null>(null);
  const [filter, setFilter] = useState<VehicleStatus | 'ALL'>('ALL');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  // Counts
  const counts = {
    total: vehicles.length,
    available: vehicles.filter((v) => v.status === 'AVAILABLE').length,
    onWay: vehicles.filter((v) => v.status === 'ON_WAY').length,
    inService: vehicles.filter((v) => v.status === 'IN_SERVICE').length,
    offline: vehicles.filter((v) => v.status === 'OFFLINE').length,
  };

  // WebSocket connection
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const tenantId = localStorage.getItem('tenantId') || 'demo';
    if (!token) return;

    const s = io(process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3000', {
      auth: { token, tenantId, userId: 'me' },
      transports: ['websocket'],
    });

    s.on('connect', () => setConnected(true));
    s.on('disconnect', () => setConnected(false));
    s.on('gps:update', (data: { vehicleId: string; lat: number; lng: number; speed?: number }) => {
      setVehicles((prev) =>
        prev.map((v) =>
          v.id === data.vehicleId
            ? { ...v, lat: data.lat, lng: data.lng, speed: data.speed }
            : v,
        ),
      );
    });

    setSocket(s);
    return () => { s.disconnect(); };
  }, []);

  const filtered = filter === 'ALL' ? vehicles : vehicles.filter((v) => v.status === filter);

  return (
    <div className="h-full flex flex-col -m-6">
      {/* Top bar */}
      <div className="bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 px-6 py-3 flex items-center justify-between z-10">
        <div className="flex items-center gap-4">
          <h1 className="font-display font-bold text-gray-900 dark:text-white text-lg">Torre de Controle</h1>
          <div className={cn('flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full',
            connected ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                      : 'bg-gray-100 text-gray-500')}>
            <span className={cn('w-1.5 h-1.5 rounded-full', connected ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400')} />
            {connected ? 'Tempo real ativo' : 'Modo demonstração'}
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm">
          {[
            { label: 'Disponível', count: counts.available, color: 'text-emerald-600 dark:text-emerald-400' },
            { label: 'Em Rota',    count: counts.onWay,     color: 'text-amber-600 dark:text-amber-400' },
            { label: 'Atendendo', count: counts.inService, color: 'text-red-600 dark:text-red-400' },
            { label: 'Offline',   count: counts.offline,   color: 'text-gray-500' },
          ].map(({ label, count, color }) => (
            <div key={label} className="flex items-center gap-1.5">
              <span className={cn('font-display font-bold text-lg', color)}>{count}</span>
              <span className="text-gray-400 dark:text-slate-500">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Map placeholder */}
        <div ref={mapRef} className="flex-1 relative bg-slate-200 dark:bg-slate-800">
          {/* Real Google Maps integration via @vis.gl/react-google-maps */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <MapPin className="w-12 h-12 text-primary-400 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-slate-400 font-medium">Mapa Google Maps</p>
              <p className="text-gray-400 dark:text-slate-500 text-sm mt-1">
                Configure NEXT_PUBLIC_GOOGLE_MAPS_KEY para ativar
              </p>
              <p className="text-gray-400 dark:text-slate-500 text-xs mt-0.5">
                Use @vis.gl/react-google-maps com APIProvider + Map
              </p>
            </div>
          </div>

          {/* Simulated vehicle markers */}
          <div className="absolute inset-0 pointer-events-none">
            {filtered.map((v, i) => (
              <motion.button
                key={v.id}
                initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.05 }}
                style={{
                  position: 'absolute',
                  left: `${20 + i * 14}%`,
                  top: `${30 + (i % 3) * 15}%`,
                }}
                onClick={() => setSelected(v)}
                className="pointer-events-auto group flex flex-col items-center gap-1"
              >
                <div className={cn(
                  'w-10 h-10 rounded-full border-2 border-white shadow-lg flex items-center justify-center transition-transform group-hover:scale-110',
                  v.status === 'AVAILABLE' && 'bg-emerald-500',
                  v.status === 'ON_WAY' && 'bg-amber-500',
                  v.status === 'IN_SERVICE' && 'bg-red-500',
                  v.status === 'OFFLINE' && 'bg-gray-400',
                )}>
                  <Truck className="w-5 h-5 text-white" />
                </div>
                <div className="bg-white dark:bg-slate-800 text-xs font-semibold px-1.5 py-0.5 rounded shadow text-gray-700 dark:text-slate-300">
                  {v.plate}
                </div>
              </motion.button>
            ))}
          </div>

          {/* Filter pills */}
          <div className="absolute top-4 left-4 flex gap-2">
            {(['ALL', 'AVAILABLE', 'ON_WAY', 'IN_SERVICE', 'OFFLINE'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-medium transition-all shadow-sm',
                  filter === f
                    ? 'bg-primary-500 text-white shadow-primary-200'
                    : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:shadow-md',
                )}
              >
                {f === 'ALL' ? `Todos (${vehicles.length})` : STATUS_CONFIG[f].label}
              </button>
            ))}
          </div>
        </div>

        {/* Side panel — vehicle list */}
        <div className="w-80 bg-white dark:bg-slate-900 border-l border-gray-100 dark:border-slate-800 flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-800">
            <p className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide">
              Veículos em Campo ({filtered.length})
            </p>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-gray-50 dark:divide-slate-800">
            {filtered.map((v) => {
              const cfg = STATUS_CONFIG[v.status];
              return (
                <motion.button
                  key={v.id}
                  onClick={() => setSelected(selected?.id === v.id ? null : v)}
                  className={cn(
                    'w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors text-left',
                    selected?.id === v.id && 'bg-blue-50 dark:bg-blue-950/30',
                  )}
                >
                  <div className={cn('w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0', cfg.dot)} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-sm text-gray-800 dark:text-slate-200 font-mono">{v.plate}</span>
                      <span className={cn('text-xs', cfg.color)}>{cfg.label}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <User className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-500 dark:text-slate-400 truncate">{v.driverName}</span>
                    </div>
                    {v.currentOccurrence && (
                      <div className="mt-1 text-xs bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded px-1.5 py-0.5 truncate">
                        {v.currentOccurrence.protocol}
                      </div>
                    )}
                  </div>
                  <ChevronRight className={cn(
                    'w-4 h-4 text-gray-300 flex-shrink-0 mt-0.5 transition-transform',
                    selected?.id === v.id && 'rotate-90 text-primary-500',
                  )} />
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Vehicle detail drawer */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-700 p-5 w-96 z-20"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center',
                  selected.status === 'AVAILABLE' && 'bg-emerald-100', selected.status === 'ON_WAY' && 'bg-amber-100',
                  selected.status === 'IN_SERVICE' && 'bg-red-100', selected.status === 'OFFLINE' && 'bg-gray-100',
                )}>
                  <Truck className={cn('w-4 h-4',
                    selected.status === 'AVAILABLE' && 'text-emerald-600', selected.status === 'ON_WAY' && 'text-amber-600',
                    selected.status === 'IN_SERVICE' && 'text-red-600', selected.status === 'OFFLINE' && 'text-gray-500',
                  )} />
                </div>
                <div>
                  <p className="font-display font-bold text-gray-900 dark:text-white font-mono">{selected.plate}</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400">{selected.vehicleType}</p>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-gray-50 dark:bg-slate-900 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-0.5">Motorista</p>
                <p className="font-medium text-gray-800 dark:text-slate-200">{selected.driverName}</p>
              </div>
              <div className="bg-gray-50 dark:bg-slate-900 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-0.5">Status</p>
                <span className={STATUS_CONFIG[selected.status].color}>{STATUS_CONFIG[selected.status].label}</span>
              </div>
              {selected.speed !== undefined && (
                <div className="bg-gray-50 dark:bg-slate-900 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-0.5">Velocidade</p>
                  <p className="font-medium text-gray-800 dark:text-slate-200">{selected.speed} km/h</p>
                </div>
              )}
              {selected.currentOccurrence && (
                <div className="col-span-2 bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3">
                  <p className="text-xs text-amber-600 dark:text-amber-400 mb-0.5">Ocorrência Ativa</p>
                  <p className="font-semibold text-amber-700 dark:text-amber-300">{selected.currentOccurrence.protocol}</p>
                  <p className="text-xs text-amber-600/70 dark:text-amber-400/70 mt-0.5 truncate">{selected.currentOccurrence.address}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
