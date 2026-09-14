'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign, TrendingUp, CreditCard, ArrowUpRight, ArrowDownRight,
  Download, Calendar, Filter, FileText, CheckCircle2, Clock, AlertCircle,
  PieChart as PieChartIcon, Percent, Building2, User
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { cn } from '@/lib/utils/cn';

const FINANCIAL_DATA = [
  { mes: 'Mar', faturamento: 124000, repasseMotoristas: 49600, lucroLiquido: 74400 },
  { mes: 'Abr', faturamento: 138000, repasseMotoristas: 55200, lucroLiquido: 82800 },
  { mes: 'Mai', faturamento: 152000, repasseMotoristas: 60800, lucroLiquido: 91200 },
  { mes: 'Jun', faturamento: 147000, repasseMotoristas: 58800, lucroLiquido: 88200 },
  { mes: 'Jul', faturamento: 169000, repasseMotoristas: 67600, lucroLiquido: 101400 },
  { mes: 'Ago', faturamento: 185000, repasseMotoristas: 74000, lucroLiquido: 111000 },
  { mes: 'Set', faturamento: 210000, repasseMotoristas: 84000, lucroLiquido: 126000 },
];

interface FinancialTransaction {
  id: string;
  protocol: string;
  clientName: string;
  partner: string;
  serviceType: string;
  driverName: string;
  date: string;
  grossAmount: number;
  driverCommission: number;
  netMargin: number;
  status: 'PAID' | 'PENDING' | 'PROCESSING' | 'BILLED';
  paymentMethod: 'PIX' | 'BOLETO_FATURADO' | 'CARTAO' | 'TRANSFERENCIA';
}

const MOCK_TRANSACTIONS: FinancialTransaction[] = [
  {
    id: 'tx-1',
    protocol: 'OS-2026-00412',
    clientName: 'Roberto Albuquerque',
    partner: 'Porto Seguro Seguros',
    serviceType: 'Guincho Plataforma (42 km)',
    driverName: 'Carlos Eduardo Silva',
    date: '14/09/2026 13:40',
    grossAmount: 480.00,
    driverCommission: 192.00,
    netMargin: 288.00,
    status: 'PAID',
    paymentMethod: 'PIX',
  },
  {
    id: 'tx-2',
    protocol: 'OS-2026-00411',
    clientName: 'Transportadora Rodonaves Ltda',
    partner: 'Bradesco Auto/RE',
    serviceType: 'Guincho Extra-Pesado (Scania)',
    driverName: 'Marcio Rogério Souza',
    date: '14/09/2026 11:15',
    grossAmount: 2450.00,
    driverCommission: 857.50,
    netMargin: 1592.50,
    status: 'PROCESSING',
    paymentMethod: 'BOLETO_FATURADO',
  },
  {
    id: 'tx-3',
    protocol: 'OS-2026-00410',
    clientName: 'Mariana Penteado',
    partner: 'SulAmérica Auto',
    serviceType: 'Pane Elétrica / Recarga Bateria',
    driverName: 'Carlos Eduardo Silva',
    date: '14/09/2026 10:20',
    grossAmount: 190.00,
    driverCommission: 76.00,
    netMargin: 114.00,
    status: 'PAID',
    paymentMethod: 'PIX',
  },
  {
    id: 'tx-4',
    protocol: 'OS-2026-00409',
    clientName: 'Fábio Guimarães',
    partner: 'Cliente Particular',
    serviceType: 'Reboque Subsolo / Asa Delta',
    driverName: 'João Marcos Santos',
    date: '14/09/2026 09:05',
    grossAmount: 380.00,
    driverCommission: 152.00,
    netMargin: 228.00,
    status: 'PAID',
    paymentMethod: 'CARTAO',
  },
  {
    id: 'tx-5',
    protocol: 'OS-2026-00408',
    clientName: 'Locadora Movida Gestão de Frotas',
    partner: 'Allianz Seguros',
    serviceType: 'Guincho Plataforma Noturno',
    driverName: 'Pedro Alcântara',
    date: '13/09/2026 23:45',
    grossAmount: 520.00,
    driverCommission: 208.00,
    netMargin: 312.00,
    status: 'BILLED',
    paymentMethod: 'BOLETO_FATURADO',
  },
  {
    id: 'tx-6',
    protocol: 'OS-2026-00407',
    clientName: 'Luiz Fernando Correa',
    partner: 'Tokio Marine Seguradora',
    serviceType: 'Troca de Pneu Caminhonete',
    driverName: 'Carlos Eduardo Silva',
    date: '13/09/2026 19:10',
    grossAmount: 180.00,
    driverCommission: 72.00,
    netMargin: 108.00,
    status: 'PENDING',
    paymentMethod: 'TRANSFERENCIA',
  },
];

const STATUS_CONFIG: Record<FinancialTransaction['status'], { label: string; badge: string; icon: React.ElementType }> = {
  PAID: { label: 'Recebido / Liquidado', badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: CheckCircle2 },
  PROCESSING: { label: 'Em Processamento', badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: Clock },
  BILLED: { label: 'Faturado (30 Dias)', badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: Calendar },
  PENDING: { label: 'Aguardando Conciliação', badge: 'bg-rose-500/10 text-rose-400 border-rose-500/20', icon: AlertCircle },
};

export default function FinancialPage() {
  const [activeTab, setActiveTab] = useState<'TRANSACTIONS' | 'COMMISSIONS' | 'PRICING'>('TRANSACTIONS');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filteredTransactions = MOCK_TRANSACTIONS.filter((tx) =>
    statusFilter === 'ALL' ? true : tx.status === statusFilter
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-emerald-500" />
            Gestão Financeira & Comissionamento
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Faturamento em tempo real, repasse para socorristas, conciliação de seguradoras e DRE operacional.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2 rounded-xl text-sm font-medium transition-colors">
            <Download className="w-4 h-4" />
            Exportar Relatório (PDF / CSV)
          </button>
          <button className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-lg shadow-emerald-600/20">
            <CreditCard className="w-4 h-4" />
            Fechar Lote Quinzenal
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-400">Faturamento Bruto (Mês Atual)</p>
            <span className="flex items-center text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full">
              <ArrowUpRight className="w-3.5 h-3.5" /> +14.2%
            </span>
          </div>
          <p className="text-3xl font-bold text-white mt-2 font-mono">R$ 210.000,00</p>
          <p className="text-xs text-slate-500 mt-2">Baseado em 512 atendimentos concluídos</p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-400">Comissões a Pagar (Frota)</p>
            <span className="text-xs text-blue-400 font-semibold bg-blue-500/10 px-2 py-0.5 rounded-full">
              40% Repasse Médio
            </span>
          </div>
          <p className="text-3xl font-bold text-blue-400 mt-2 font-mono">R$ 84.000,00</p>
          <p className="text-xs text-slate-500 mt-2">18 motoristas ativos qualificados</p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-400">Margem Operacional Líquida</p>
            <span className="text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full">
              60% Margem
            </span>
          </div>
          <p className="text-3xl font-bold text-emerald-400 mt-2 font-mono">R$ 126.000,00</p>
          <p className="text-xs text-slate-500 mt-2">Após dedução de comissões e combustíveis</p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-400">A Receber de Seguradoras</p>
            <span className="text-xs text-amber-400 font-semibold bg-amber-500/10 px-2 py-0.5 rounded-full">
              Giro Médio 28D
            </span>
          </div>
          <p className="text-3xl font-bold text-amber-400 mt-2 font-mono">R$ 68.450,00</p>
          <p className="text-xs text-slate-500 mt-2">Porto Seguro, Allianz e Bradesco</p>
        </div>
      </div>

      {/* Revenue & Profit Chart */}
      <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl backdrop-blur-sm shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              Evolução da Receita & Lucratividade Líquida
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Histórico mensal comparativo entre faturamento, comissões e resultado líquido.</p>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={FINANCIAL_DATA} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorFat" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0}/>
                </linearGradient>
                <linearGradient id="colorLucro" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.5}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
              <XAxis dataKey="mes" stroke="#64748B" fontSize={12} tickLine={false} />
              <YAxis stroke="#64748B" fontSize={12} tickLine={false} tickFormatter={(val) => `R$${val/1000}k`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, '']}
              />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ color: '#94A3B8', fontSize: '12px' }} />
              <Area type="monotone" dataKey="faturamento" name="Faturamento Bruto" stroke="#3B82F6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorFat)" />
              <Area type="monotone" dataKey="lucroLiquido" name="Resultado Líquido" stroke="#10B981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorLucro)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('TRANSACTIONS')}
          className={cn(
            'px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2',
            activeTab === 'TRANSACTIONS' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
          )}
        >
          <FileText className="w-4 h-4" /> Extrato de Atendimentos
        </button>
        <button
          onClick={() => setActiveTab('COMMISSIONS')}
          className={cn(
            'px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2',
            activeTab === 'COMMISSIONS' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
          )}
        >
          <User className="w-4 h-4" /> Fechamento por Motorista
        </button>
        <button
          onClick={() => setActiveTab('PRICING')}
          className={cn(
            'px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2',
            activeTab === 'PRICING' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
          )}
        >
          <Building2 className="w-4 h-4" /> Tabelas de Preço & KM
        </button>
      </div>

      {/* Transactions Table */}
      {activeTab === 'TRANSACTIONS' && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          {/* Table Toolbar */}
          <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <h3 className="text-sm font-semibold text-white">Lançamentos Recentes</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 flex items-center gap-1"><Filter className="w-3 h-3" /> Status:</span>
              {(['ALL', 'PAID', 'PROCESSING', 'BILLED', 'PENDING'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={cn(
                    'text-xs px-2.5 py-1 rounded-lg border transition-all',
                    statusFilter === st
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-white'
                  )}
                >
                  {st === 'ALL' ? 'Todos' : STATUS_CONFIG[st].label.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/50 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3.5 font-semibold">Protocolo / Data</th>
                  <th className="p-3.5 font-semibold">Cliente & Parceiro</th>
                  <th className="p-3.5 font-semibold">Serviço / Prestador</th>
                  <th className="p-3.5 font-semibold text-right">Valor Bruto</th>
                  <th className="p-3.5 font-semibold text-right">Repasse Motorista</th>
                  <th className="p-3.5 font-semibold text-right">Margem Líquida</th>
                  <th className="p-3.5 font-semibold text-center">Status / Tag</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredTransactions.map((tx) => {
                  const cfg = STATUS_CONFIG[tx.status];
                  return (
                    <tr key={tx.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-3.5">
                        <span className="font-mono font-bold text-blue-400">{tx.protocol}</span>
                        <p className="text-slate-500 text-[11px] mt-0.5">{tx.date}</p>
                      </td>
                      <td className="p-3.5">
                        <span className="font-medium text-slate-200">{tx.clientName}</span>
                        <p className="text-slate-400 text-[11px] flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-slate-500" /> {tx.partner}
                        </p>
                      </td>
                      <td className="p-3.5">
                        <span className="text-slate-300">{tx.serviceType}</span>
                        <p className="text-slate-400 text-[11px]">Motorista: {tx.driverName}</p>
                      </td>
                      <td className="p-3.5 text-right font-mono font-semibold text-slate-200">
                        R$ {tx.grossAmount.toFixed(2)}
                      </td>
                      <td className="p-3.5 text-right font-mono text-blue-400">
                        R$ {tx.driverCommission.toFixed(2)}
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-emerald-400">
                        R$ {tx.netMargin.toFixed(2)}
                      </td>
                      <td className="p-3.5 text-center">
                        <span className={cn('inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[11px] font-semibold', cfg.badge)}>
                          <cfg.icon className="w-3 h-3" />
                          {cfg.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pricing Tables View */}
      {activeTab === 'PRICING' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
            <span className="text-xs px-2.5 py-1 rounded-full border bg-blue-500/10 text-blue-400 border-blue-500/20 font-semibold">Tabela Convencional</span>
            <h3 className="text-lg font-bold text-white mt-3">Socorro Urbano Leve</h3>
            <p className="text-xs text-slate-400 mt-1">Carros de passeio, SUVs e motocicletas em perímetro urbano.</p>
            <div className="mt-4 space-y-2 text-xs border-t border-slate-800 pt-3">
              <div className="flex justify-between text-slate-300"><span>Saída Básica (até 15km):</span><strong className="text-white font-mono">R$ 180,00</strong></div>
              <div className="flex justify-between text-slate-300"><span>KM Excedente Diurno:</span><strong className="text-white font-mono">R$ 4,50 / km</strong></div>
              <div className="flex justify-between text-slate-300"><span>KM Excedente Noturno:</span><strong className="text-white font-mono">R$ 6,00 / km</strong></div>
              <div className="flex justify-between text-slate-300"><span>Uso de Patins / Subsolo:</span><strong className="text-emerald-400 font-mono">+ R$ 90,00</strong></div>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
            <span className="text-xs px-2.5 py-1 rounded-full border bg-purple-500/10 text-purple-400 border-purple-500/20 font-semibold">Tabela Seguradoras</span>
            <h3 className="text-lg font-bold text-white mt-3">Corporativo & Apólices</h3>
            <p className="text-xs text-slate-400 mt-1">Valores contratados para Porto Seguro, Allianz e Bradesco.</p>
            <div className="mt-4 space-y-2 text-xs border-t border-slate-800 pt-3">
              <div className="flex justify-between text-slate-300"><span>Chamado Básico Contratual:</span><strong className="text-white font-mono">R$ 145,00</strong></div>
              <div className="flex justify-between text-slate-300"><span>KM Rodado (Acima de 40km):</span><strong className="text-white font-mono">R$ 3,80 / km</strong></div>
              <div className="flex justify-between text-slate-300"><span>SLA Máximo Garantido:</span><strong className="text-blue-400 font-mono">45 minutos</strong></div>
              <div className="flex justify-between text-slate-300"><span>Faturamento:</span><strong className="text-amber-400 font-mono">Quinzenal / 30D</strong></div>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
            <span className="text-xs px-2.5 py-1 rounded-full border bg-orange-500/10 text-orange-400 border-orange-500/20 font-semibold">Tabela Linha Pesada</span>
            <h3 className="text-lg font-bold text-white mt-3">Caminhões & Ônibus</h3>
            <p className="text-xs text-slate-400 mt-1">Lança extra-pesada, destombamento e resgates complexos.</p>
            <div className="mt-4 space-y-2 text-xs border-t border-slate-800 pt-3">
              <div className="flex justify-between text-slate-300"><span>Saída Guincho Pesado:</span><strong className="text-white font-mono">R$ 1.200,00</strong></div>
              <div className="flex justify-between text-slate-300"><span>KM Rodado Rodovia:</span><strong className="text-white font-mono">R$ 14,00 / km</strong></div>
              <div className="flex justify-between text-slate-300"><span>Hora Técnica de Içamento:</span><strong className="text-white font-mono">R$ 450,00 / h</strong></div>
              <div className="flex justify-between text-slate-300"><span>Destombamento com Munck:</span><strong className="text-orange-400 font-mono">Sob Consulta</strong></div>
            </div>
          </div>
        </div>
      )}

      {/* Commissions View */}
      {activeTab === 'COMMISSIONS' && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-base font-semibold text-white mb-2">Extrato de Comissões por Motorista</h3>
          <p className="text-xs text-slate-400 mb-6">Regra de cálculo: 40% do valor bruto do serviço + bônus de pontualidade de SLA.</p>
          <div className="space-y-4">
            {[
              { name: 'Carlos Eduardo Silva', atendimentos: 34, total: 'R$ 6.120,00', status: 'Liberado para Transferência PIX', score: '99% SLA' },
              { name: 'João Marcos Santos', atendimentos: 28, total: 'R$ 5.040,00', status: 'Liberado para Transferência PIX', score: '97% SLA' },
              { name: 'Marcio Rogério Souza (Pesado)', atendimentos: 12, total: 'R$ 9.800,00', status: 'Em Análise Contábil', score: '100% SLA' },
              { name: 'Pedro Alcântara', atendimentos: 22, total: 'R$ 3.960,00', status: 'Liberado para Transferência PIX', score: '95% SLA' },
            ].map((driver, i) => (
              <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-950/60 border border-slate-800 rounded-xl gap-3">
                <div>
                  <h4 className="text-sm font-semibold text-white">{driver.name}</h4>
                  <p className="text-xs text-slate-400">{driver.atendimentos} atendimentos realizados • Taxa de Sucesso: <span className="text-emerald-400 font-medium">{driver.score}</span></p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-base font-bold font-mono text-emerald-400">{driver.total}</p>
                    <p className="text-[11px] text-slate-500">{driver.status}</p>
                  </div>
                  <button className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium transition-colors">
                    Liquidar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
