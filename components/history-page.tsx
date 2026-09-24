'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Filter, ChevronDown, Trash2, Edit3, X, Check, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getCategoryInfo, MONTHS_ES, EXPENSE_CATEGORIES, INCOME_CATEGORIES, CUENTAS } from '@/lib/categories';

interface HistoryPageProps {
  refreshKey: number;
  onRefresh: () => void;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

export default function HistoryPage({ refreshKey, onRefresh }: HistoryPageProps) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterCuenta, setFilterCuenta] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '20');
      if (search) params.set('search', search);
      if (filterMonth) params.set('mes', filterMonth);
      if (filterCategory) params.set('categoria', filterCategory);
      if (filterCuenta) params.set('cuenta', filterCuenta);

      const res = await fetch(`/api/transactions?${params.toString()}`);
      const data = await res.json();
      setTransactions(data?.transactions ?? []);
      setTotalPages(data?.totalPages ?? 1);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, filterMonth, filterCategory, filterCuenta]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions, refreshKey]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
      fetchTransactions();
      onRefresh();
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (tx: any) => {
    setEditingId(tx?.id);
    setEditData({
      descripcion: tx?.descripcion ?? '',
      monto: String(tx?.monto ?? '0'),
      categoria: tx?.categoria ?? '',
      cuenta: tx?.cuenta ?? 'Efectivo',
    });
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    try {
      await fetch(`/api/transactions/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      });
      setEditingId(null);
      fetchTransactions();
      onRefresh();
    } catch (err) {
      console.error('Edit error:', err);
    }
  };

  const allCategories = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];

  return (
    <div className="p-4 space-y-4">
      <h2 className="font-display text-xl font-bold text-white">Historial</h2>

      {/* Search */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Buscar movimientos..."
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-purple-500/50"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`glass px-4 rounded-xl transition-colors ${showFilters ? 'bg-purple-500/20 text-purple-300' : 'text-white/60 hover:bg-white/10'}`}
        >
          <Filter size={18} />
        </button>
      </div>

      {/* Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="glass-card p-4 space-y-3">
              <div>
                <label className="text-white/50 text-xs mb-1 block">Mes</label>
                <select
                  value={filterMonth}
                  onChange={(e) => { setFilterMonth(e.target.value); setPage(1); }}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-white text-sm focus:outline-none"
                >
                  <option value="" className="bg-gray-900">Todos</option>
                  {MONTHS.map((m) => (
                    <option key={m} value={m} className="bg-gray-900">{MONTHS_ES[m] ?? m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-white/50 text-xs mb-1 block">Categoría</label>
                <select
                  value={filterCategory}
                  onChange={(e) => { setFilterCategory(e.target.value); setPage(1); }}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-white text-sm focus:outline-none"
                >
                  <option value="" className="bg-gray-900">Todas</option>
                  {allCategories.map((c: any) => (
                    <option key={c.value} value={c.value} className="bg-gray-900">{c.emoji} {c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-white/50 text-xs mb-1 block">Cuenta</label>
                <select
                  value={filterCuenta}
                  onChange={(e) => { setFilterCuenta(e.target.value); setPage(1); }}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-white text-sm focus:outline-none"
                >
                  <option value="" className="bg-gray-900">Todas</option>
                  {CUENTAS.map((c: any) => (
                    <option key={c.value} value={c.value} className="bg-gray-900">{c.emoji} {c.label}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => { setFilterMonth(''); setFilterCategory(''); setFilterCuenta(''); setSearch(''); setPage(1); }}
                className="text-purple-400 text-xs hover:underline"
              >
                Limpiar filtros
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transaction List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="glass-card p-4 animate-pulse">
              <div className="h-4 bg-white/10 rounded w-2/3 mb-2" />
              <div className="h-3 bg-white/10 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : transactions.length === 0 ? (
        <div className="glass-card p-8 text-center">
          <p className="text-white/40">No se encontraron movimientos</p>
        </div>
      ) : (
        <div className="space-y-2">
          {transactions.map((tx: any, i: number) => {
            const catInfo = getCategoryInfo(tx?.categoria ?? 'Otros');
            const isIngreso = tx?.tipo === 'Ingreso';
            const isEditing = editingId === tx?.id;

            return (
              <motion.div
                key={tx?.id ?? i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.03 * i }}
                className="glass-card p-4"
              >
                {isEditing ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editData?.descripcion ?? ''}
                      onChange={(e) => setEditData({ ...(editData ?? {}), descripcion: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-white text-sm focus:outline-none"
                    />
                    <input
                      type="number"
                      inputMode="decimal"
                      value={editData?.monto ?? ''}
                      onChange={(e) => setEditData({ ...(editData ?? {}), monto: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-white text-sm font-mono focus:outline-none"
                    />
                    <div className="flex gap-2">
                      <button onClick={handleSaveEdit} className="flex-1 py-2 rounded-lg bg-green-500/30 text-green-300 text-sm flex items-center justify-center gap-1">
                        <Check size={14} /> Guardar
                      </button>
                      <button onClick={() => setEditingId(null)} className="flex-1 py-2 rounded-lg glass text-white/60 text-sm flex items-center justify-center gap-1">
                        <X size={14} /> Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                      style={{ backgroundColor: `${catInfo.color}20` }}
                    >
                      {catInfo.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{tx?.descripcion ?? 'Sin descripción'}</p>
                      <p className="text-white/40 text-xs">
                        {catInfo.label} · {tx?.cuenta ?? ''} · {MONTHS_ES[tx?.mes] ?? tx?.mes ?? ''}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`font-mono text-sm font-semibold ${isIngreso ? 'text-green-400' : 'text-red-400'}`}>
                        {isIngreso ? '+' : '-'}${tx?.monto?.toFixed?.(2) ?? '0.00'}
                      </p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => handleEdit(tx)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                        <Edit3 size={14} className="text-white/40" />
                      </button>
                      <button
                        onClick={() => handleDelete(tx?.id)}
                        disabled={deletingId === tx?.id}
                        className="p-1.5 rounded-lg hover:bg-red-500/20 transition-colors"
                      >
                        {deletingId === tx?.id ? (
                          <Loader2 size={14} className="text-red-400 animate-spin" />
                        ) : (
                          <Trash2 size={14} className="text-white/40" />
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 py-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="glass px-4 py-2 rounded-xl text-white/60 text-sm disabled:opacity-30"
          >
            Anterior
          </button>
          <span className="text-white/50 text-sm">{page} / {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="glass px-4 py-2 rounded-xl text-white/60 text-sm disabled:opacity-30"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}
