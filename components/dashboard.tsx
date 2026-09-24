'use client';

import { useState, useEffect, useRef } from 'react';
import { TrendingUp, TrendingDown, Wallet, ChevronLeft, ChevronRight, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { getCategoryInfo, MONTHS_ES } from '@/lib/categories';
import CategoryChart from './category-chart';
import MonthlyChart from './monthly-chart';

interface DashboardProps {
  refreshKey: number;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

export default function Dashboard({ refreshKey }: DashboardProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('September');

  useEffect(() => {
    const now = new Date();
    const m = MONTHS[now.getMonth()];
    if (m) setSelectedMonth(m);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/dashboard?mes=${selectedMonth}`);
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedMonth, refreshKey]);

  const prevMonth = () => {
    const idx = MONTHS.indexOf(selectedMonth);
    if (idx > 0) setSelectedMonth(MONTHS[idx - 1] ?? 'January');
  };

  const nextMonth = () => {
    const idx = MONTHS.indexOf(selectedMonth);
    if (idx < 11) setSelectedMonth(MONTHS[idx + 1] ?? 'December');
  };

  if (loading && !data) {
    return (
      <div className="p-4 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass-card p-6 animate-pulse">
            <div className="h-4 bg-white/10 rounded w-1/3 mb-3" />
            <div className="h-8 bg-white/10 rounded w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  const balance = data?.mesSaldo ?? 0;
  const mesIngresos = data?.mesIngresos ?? 0;
  const mesGastos = data?.mesGastos ?? 0;
  const categorias = data?.categorias ?? {};
  const recientes = data?.recientes ?? [];
  const monthlyTrend = data?.monthlyTrend ?? [];

  return (
    <div className="p-4 space-y-4">
      {/* Month Selector */}
      <div className="flex items-center justify-center gap-4 mb-2">
        <button onClick={prevMonth} className="p-2 rounded-xl glass hover:bg-white/10 transition-colors">
          <ChevronLeft size={20} className="text-white/70" />
        </button>
        <h2 className="font-display text-lg font-semibold text-white min-w-[140px] text-center">
          {MONTHS_ES[selectedMonth] ?? selectedMonth} 2026
        </h2>
        <button onClick={nextMonth} className="p-2 rounded-xl glass hover:bg-white/10 transition-colors">
          <ChevronRight size={20} className="text-white/70" />
        </button>
      </div>

      {/* Balance Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-5 glow-purple"
      >
        <div className="flex items-center gap-2 mb-1">
          <Wallet size={16} className="text-purple-400" />
          <span className="text-white/60 text-sm">Balance del mes</span>
        </div>
        <p className={`font-mono text-3xl font-bold ${balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          ${balance?.toFixed?.(2) ?? '0.00'}
        </p>
      </motion.div>

      {/* Month Summary */}
      <div className="grid grid-cols-2 gap-3">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-4"
        >
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={14} className="text-green-400" />
            <span className="text-white/50 text-xs">Ingresos</span>
          </div>
          <p className="font-mono text-xl font-bold text-green-400">
            ${mesIngresos?.toFixed?.(2) ?? '0.00'}
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
          className="glass-card p-4"
        >
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown size={14} className="text-red-400" />
            <span className="text-white/50 text-xs">Gastos</span>
          </div>
          <p className="font-mono text-xl font-bold text-red-400">
            ${mesGastos?.toFixed?.(2) ?? '0.00'}
          </p>
        </motion.div>
      </div>

      {/* Category Chart */}
      {Object.keys(categorias).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-4"
        >
          <h3 className="text-white/80 text-sm font-semibold mb-3">Gastos por categoría</h3>
          <CategoryChart categorias={categorias} />
        </motion.div>
      )}

      {/* Monthly Trend */}
      {monthlyTrend.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="glass-card p-4"
        >
          <h3 className="text-white/80 text-sm font-semibold mb-3">Tendencia mensual</h3>
          <MonthlyChart data={monthlyTrend} />
        </motion.div>
      )}

      {/* Recent Transactions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card p-4"
      >
        <h3 className="text-white/80 text-sm font-semibold mb-3">Últimos movimientos</h3>
        <div className="space-y-2">
          {recientes.length === 0 && (
            <p className="text-white/40 text-sm text-center py-4">No hay movimientos aún</p>
          )}
          {recientes.slice(0, 8).map((tx: any, i: number) => {
            const catInfo = getCategoryInfo(tx?.categoria ?? 'Otros');
            const isIngreso = tx?.tipo === 'Ingreso';
            return (
              <motion.div
                key={tx?.id ?? i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * i }}
                className="flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-white/5 transition-colors"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                  style={{ backgroundColor: `${catInfo.color}20` }}
                >
                  {catInfo.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{tx?.descripcion ?? 'Sin descripción'}</p>
                  <p className="text-white/40 text-xs">{catInfo.label}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`font-mono text-sm font-semibold ${isIngreso ? 'text-green-400' : 'text-red-400'}`}>
                    {isIngreso ? '+' : '-'}${tx?.monto?.toFixed?.(2) ?? '0.00'}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
