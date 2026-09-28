'use client';

import { useState } from 'react';
import { X, Download, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MONTHS_ES } from '@/lib/categories';

interface ExportModalProps {
  open: boolean;
  onClose: () => void;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

export default function ExportModal({ open, onClose }: ExportModalProps) {
  const currentMonthIdx = new Date().getMonth();
  const [selectedMonth, setSelectedMonth] = useState(MONTHS[currentMonthIdx] ?? 'January');
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    try {
      setExporting(true);
      const res = await fetch(`/api/export?mes=${selectedMonth}`);
      if (!res.ok) throw new Error('Error al exportar');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Cashync_${MONTHS_ES[selectedMonth] ?? selectedMonth}_2026.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      onClose();
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center"
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="relative w-full max-w-[430px] glass-strong rounded-t-3xl p-6 pb-8"
          >
            <div className="w-10 h-1 bg-white/30 rounded-full mx-auto mb-4" />

            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-lg font-bold text-white">Exportar a Excel</h2>
              <button onClick={onClose} className="p-2 rounded-xl glass hover:bg-white/10">
                <X size={18} className="text-white/70" />
              </button>
            </div>

            <p className="text-white/50 text-sm mb-4">Selecciona hasta que mes exportar:</p>

            <div className="grid grid-cols-3 gap-2 mb-6">
              {MONTHS.slice(0, currentMonthIdx + 1).map((m) => (
                <button
                  key={m}
                  onClick={() => setSelectedMonth(m)}
                  className={`py-2 px-3 rounded-xl text-sm transition-all ${
                    selectedMonth === m
                      ? 'bg-purple-500/30 text-purple-300 border border-purple-500/40'
                      : 'glass text-white/60 border border-transparent'
                  }`}
                >
                  {MONTHS_ES[m]?.slice(0, 3) ?? m.slice(0, 3)}
                </button>
              ))}
            </div>

            <button
              onClick={handleExport}
              disabled={exporting}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold text-lg hover:from-purple-500 hover:to-blue-500 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {exporting ? (
                <Loader2 size={24} className="animate-spin" />
              ) : (
                <><Download size={20} /> Descargar Excel</>
              )}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
