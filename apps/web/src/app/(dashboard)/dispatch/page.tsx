'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Zap, Navigation, Clock, Star, Award, CheckCircle2,
  AlertOctagon, ShieldAlert, Truck, User, ArrowRight,
  Bot, RefreshCw, Cpu
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface OccurrenceQueueItem {
  id: string;
  protocol: string;
  clientName: string;
  vehicleModel: string;
  problem: string;
  priority: 'EMERGENCY' | 'HIGH' | 'NORMAL';
  originAddress: string;
  destinationAddress: string;
  createdAt: string;
  elapsedMinutes: number;
}

const MOCK_QUEUE: OccurrenceQueueItem[] = [
  {
    id: 'oc-1',
    protocol: 'OS-2026-00415',
    clientName: 'Dra. Beatriz Fontana',
    vehicleModel: 'BMW 320i M Sport 2023',
    problem: 'Pane Elétrica Total no Túnel (Trânsito Travado)',
    priority: 'EMERGENCY',
    originAddress: 'Túnel Ayrton Senna, Sentido Bairro - SP',
    destinationAddress: 'Concessionária Eurobike - Av. Faria Lima',
    createdAt: '14:28:10',
    elapsedMinutes: 4,
  },
  {
    id: 'oc-2',
    protocol: 'OS-2026-00416',
    clientName: 'Marcos Vinicius Rezende',
    vehicleModel: 'Toyota Hilux SRX 4x4',
    problem: 'Pneu Furado / Sem chave de roda',
    priority: 'HIGH',
    originAddress: 'Av. das Nações Unidas, 12901 - Brooklin',
    destinationAddress: 'Atendimento no local (Troca de estepe)',
    createdAt: '14:22:45',
    elapsedMinutes: 9,
  },
  {
    id: 'oc-3',
    protocol: 'OS-2026-00417',
    clientName: 'Frota Transcoop Cargas',
    vehicleModel: 'Caminhão Mercedes-Benz Atego 1719',
    problem: 'Quebra de Barra de Direção (Carga 8T)',
    priority: 'NORMAL',
    originAddress: 'Rodovia Castello Branco, KM 28 - Barueri',
    destinationAddress: 'Pátio Transcoop - Osasco',
    createdAt: '14:15:00',
    elapsedMinutes: 17,
  },
];

interface Candidate {
  rank: number;
  driverName: string;
  driverRating: number;
  totalServices: number;
  vehiclePlate: string;
  vehicleType: string;
  distanceKm: number;
  durationMin: number;
  score: number;
}

const MOCK_CANDIDATES: Candidate[] = [
  {
    rank: 1,
    driverName: 'Carlos Eduardo Silva',
    driverRating: 4.96,
    totalServices: 432,
    vehiclePlate: 'BRA2E19',
    vehicleType: 'Plataforma Hidráulica',
    distanceKm: 2.1,
    durationMin: 6,
    score: 96.4,
  },
  {
    rank: 2,
    driverName: 'João Marcos Santos',
    driverRating: 4.88,
    totalServices: 310,
    vehiclePlate: 'RGA4H88',
    vehicleType: 'Asa Delta + Plataforma',
    distanceKm: 4.8,
    durationMin: 12,
    score: 87.1,
  },
  {
    rank: 3,
    driverName: 'Pedro Alcântara',
    driverRating: 4.75,
    totalServices: 195,
    vehiclePlate: 'GU19P02',
    vehicleType: 'Plataforma Estendida',
    distanceKm: 7.2,
    durationMin: 19,
    score: 74.8,
  },
];

const PRIORITY_BADGES = {
  EMERGENCY: { label: 'Emergência Crítica', badge: 'bg-rose-500/10 text-rose-400 border-rose-500/30', border: 'border-l-rose-500' },
  HIGH: { label: 'Alta Prioridade', badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30', border: 'border-l-amber-500' },
  NORMAL: { label: 'Prioridade Normal', badge: 'bg-blue-500/10 text-blue-400 border-blue-500/30', border: 'border-l-blue-500' },
};

export default function DispatchPage() {
  const [selectedOccurrence, setSelectedOccurrence] = useState<OccurrenceQueueItem>(MOCK_QUEUE[0]);
  const [autoDispatchAI, setAutoDispatchAI] = useState(false);
  const [dispatchedSuccess, setDispatchedSuccess] = useState<string | null>(null);

  const handleDispatch = (candidate: Candidate) => {
    setDispatchedSuccess(`Guincho ${candidate.vehiclePlate} (${candidate.driverName}) despachado com sucesso!`);
    setTimeout(() => setDispatchedSuccess(null), 4000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Zap className="w-8 h-8 text-amber-400" />
            Central de Despacho Inteligente & IA
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Fila operacional, cálculo algorítmico de pontuação geoespacial e alocação preditiva de resgate.
          </p>
        </div>

        {/* AI Auto-Dispatch Toggle */}
        <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl">
          <Bot className={cn('w-5 h-5', autoDispatchAI ? 'text-cyan-400 animate-spin' : 'text-slate-500')} />
          <div className="text-left">
            <p className="text-xs font-semibold text-white">Auto-Despacho Preditivo com IA</p>
            <p className="text-[10px] text-slate-400">Gemini & Distance Matrix Score</p>
          </div>
          <button
            onClick={() => setAutoDispatchAI(!autoDispatchAI)}
            className={cn(
              'w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 ml-2',
              autoDispatchAI ? 'bg-cyan-500' : 'bg-slate-700'
            )}
          >
            <div className={cn('w-5 h-5 rounded-full bg-white transition-transform', autoDispatchAI && 'translate-x-5')} />
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {dispatchedSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-4 py-3 rounded-xl text-sm flex items-center gap-2"
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          {dispatchedSuccess}
        </motion.div>
      )}

      {/* Algorithm Formula Highlight */}
      <div className="bg-gradient-to-r from-blue-950/40 via-slate-900/60 to-purple-950/40 border border-blue-900/30 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Algoritmo de Roteamento Ponderado</h4>
            <p className="text-xs text-slate-300 mt-0.5 font-mono">
              Score = (0.70 × Proximidade/ETA) + (0.20 × Rating) + (0.10 × Experiência Histórica)
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold px-3 py-1 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30 self-start md:self-auto">
          PostGIS + Google Distance Matrix
        </span>
      </div>

      {/* Main Split: Queue (Left) & Dispatch Suggestion (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Occurrence Queue */}
        <div className="lg:col-span-5 space-y-3">
          <h2 className="text-sm font-semibold text-slate-300 flex items-center justify-between">
            <span>Fila de Ocorrências Aguardando</span>
            <span className="text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
              {MOCK_QUEUE.length} pendentes
            </span>
          </h2>

          <div className="space-y-3">
            {MOCK_QUEUE.map((item) => {
              const isSelected = selectedOccurrence.id === item.id;
              const p = PRIORITY_BADGES[item.priority];

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedOccurrence(item)}
                  className={cn(
                    'p-4 rounded-2xl border transition-all cursor-pointer border-l-4 relative',
                    p.border,
                    isSelected
                      ? 'bg-slate-900 border-blue-500/60 shadow-lg shadow-blue-500/10'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-xs font-bold text-blue-400">{item.protocol}</span>
                      <h4 className="text-sm font-semibold text-white mt-1">{item.clientName}</h4>
                      <p className="text-xs text-slate-400">{item.vehicleModel}</p>
                    </div>

                    <div className="text-right">
                      <span className={cn('text-[11px] px-2 py-0.5 rounded-full border font-semibold', p.badge)}>
                        {p.label}
                      </span>
                      <p className="text-[11px] text-slate-500 mt-1 flex items-center justify-end gap-1">
                        <Clock className="w-3 h-3" /> há {item.elapsedMinutes} min
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-800/80 text-xs text-slate-300">
                    <p className="line-clamp-1"><strong>Motivo:</strong> {item.problem}</p>
                    <p className="text-slate-400 line-clamp-1 mt-1"><strong>Local:</strong> {item.originAddress}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: AI Candidate Ranking & Dispatch Action */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ocorrência Selecionada</span>
                <h3 className="text-lg font-bold text-white mt-1">
                  {selectedOccurrence.protocol} — {selectedOccurrence.clientName}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">{selectedOccurrence.originAddress}</p>
              </div>

              <span className={cn('text-xs px-2.5 py-1 rounded-full border font-semibold', PRIORITY_BADGES[selectedOccurrence.priority].badge)}>
                {PRIORITY_BADGES[selectedOccurrence.priority].label}
              </span>
            </div>

            {/* Candidates Ranking */}
            <div className="mt-5 space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Top 3 Guinchos Recomendados pelo Algoritmo</span>
                <span className="text-cyan-400 text-[11px]">Ordenados por Score Preditivo</span>
              </h4>

              {MOCK_CANDIDATES.map((cand) => (
                <div
                  key={cand.rank}
                  className="bg-slate-950/70 border border-slate-800 hover:border-slate-700 p-4 rounded-xl transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs',
                      cand.rank === 1 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-slate-800 text-slate-300'
                    )}>
                      #{cand.rank}
                    </div>

                    <div>
                      <h5 className="text-sm font-bold text-white flex items-center gap-2">
                        {cand.driverName}
                        <span className="font-mono text-xs font-medium text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                          {cand.vehiclePlate}
                        </span>
                      </h5>
                      <p className="text-xs text-slate-400">{cand.vehicleType} • {cand.totalServices} serviços</p>

                      <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-300">
                        <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                          <Navigation className="w-3 h-3" /> {cand.distanceKm} km ({cand.durationMin} min)
                        </span>
                        <span className="flex items-center gap-1 text-amber-400">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {cand.driverRating.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Score & Action Button */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800">
                    <div className="text-right">
                      <p className="text-xs text-slate-500">Score Algorítmico</p>
                      <p className="text-base font-extrabold font-mono text-cyan-400">{cand.score} pts</p>
                    </div>

                    <button
                      onClick={() => handleDispatch(cand)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-md shadow-blue-600/20"
                    >
                      Despachar <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
