'use client';

import { useState } from 'react';
import { X, MapPin, Loader2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, CUENTAS, getCategoryInfo } from '@/lib/categories';

interface NewTransactionModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export default function NewTransactionModal({ open, onClose, onSaved }: NewTransactionModalProps) {
  const [tipo, setTipo] = useState<'Gasto' | 'Ingreso'>('Gasto');
  const [monto, setMonto] = useState('');
  const [categoria, setCategoria] = useState('');
  const [cuenta, setCuenta] = useState('Efectivo');
  const [descripcion, setDescripcion] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const categories = tipo === 'Gasto' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  const getLocation = async () => {
    setLoadingLocation(true);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
      });
      const { latitude, longitude } = pos.coords;
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=16`
      );
      const data = await res.json();
      const address = data?.display_name ?? `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
      setUbicacion(address);
    } catch (err: any) {
      console.error('Location error:', err);
      setUbicacion('No se pudo obtener ubicación');
    } finally {
      setLoadingLocation(false);
    }
  };

  const handleSave = async () => {
    if (!monto || !categoria) return;
    setSaving(true);
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo,
          monto: parseFloat(monto),
          categoria,
          cuenta,
          descripcion: descripcion || categoria,
          ubicacion: ubicacion || null,
        }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => {
          setSaved(false);
          resetForm();
          onSaved();
        }, 800);
      }
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setMonto('');
    setCategoria('');
    setCuenta('Efectivo');
    setDescripcion('');
    setUbicacion('');
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
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

          {/* Modal */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="relative w-full max-w-[430px] glass-strong rounded-t-3xl p-6 pb-8 max-h-[90vh] overflow-y-auto no-scrollbar"
          >
            {/* Handle */}
            <div className="w-10 h-1 bg-white/30 rounded-full mx-auto mb-4" />

            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-xl font-bold text-white">Nuevo movimiento</h2>
              <button onClick={onClose} className="p-2 rounded-xl glass hover:bg-white/10">
                <X size={18} className="text-white/70" />
              </button>
            </div>

            {/* Type Toggle */}
            <div className="flex gap-2 mb-5">
              {(['Gasto', 'Ingreso'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => { setTipo(t); setCategoria(''); }}
                  className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all ${
                    tipo === t
                      ? t === 'Gasto'
                        ? 'bg-red-500/30 text-red-300 border border-red-500/40'
                        : 'bg-green-500/30 text-green-300 border border-green-500/40'
                      : 'glass text-white/50'
                  }`}
                >
                  {t === 'Gasto' ? '💸 Gasto' : '💰 Ingreso'}
                </button>
              ))}
            </div>

            {/* Amount */}
            <div className="mb-5">
              <label className="text-white/50 text-xs mb-2 block">Monto</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 text-2xl font-mono">$</span>
                <input
                  type="number"
                  inputMode="decimal"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-10 pr-4 text-white text-2xl font-mono font-bold focus:outline-none focus:border-purple-500/50 transition-colors"
                />
              </div>
            </div>

            {/* Category */}
            <div className="mb-5">
              <label className="text-white/50 text-xs mb-2 block">Categoría</label>
              <div className="grid grid-cols-3 gap-2">
                {categories.map((cat: any) => (
                  <button
                    key={cat.value}
                    onClick={() => setCategoria(cat.value)}
                    className={`p-3 rounded-xl text-center transition-all text-xs ${
                      categoria === cat.value
                        ? 'border-2 bg-white/10'
                        : 'glass hover:bg-white/10'
                    }`}
                    style={{
                      borderColor: categoria === cat.value ? cat.color : 'transparent',
                    }}
                  >
                    <span className="text-lg block mb-1">{cat.emoji}</span>
                    <span className="text-white/80 block truncate">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Account */}
            <div className="mb-5">
              <label className="text-white/50 text-xs mb-2 block">Cuenta</label>
              <div className="flex gap-2">
                {CUENTAS.map((c: any) => (
                  <button
                    key={c.value}
                    onClick={() => setCuenta(c.value)}
                    className={`flex-1 py-3 rounded-xl text-sm transition-all ${
                      cuenta === c.value
                        ? 'bg-purple-500/30 text-purple-300 border border-purple-500/40'
                        : 'glass text-white/60'
                    }`}
                  >
                    <span className="block text-lg">{c.emoji}</span>
                    <span className="block text-xs mt-1">{c.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="mb-5">
              <label className="text-white/50 text-xs mb-2 block">Descripción</label>
              <input
                type="text"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Ej: Almuerzo en..."
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:border-purple-500/50 transition-colors"
              />
            </div>

            {/* Location */}
            <div className="mb-6">
              <label className="text-white/50 text-xs mb-2 block">Ubicación</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={ubicacion}
                  onChange={(e) => setUbicacion(e.target.value)}
                  placeholder="Obtener automáticamente..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:border-purple-500/50 transition-colors"
                  readOnly
                />
                <button
                  onClick={getLocation}
                  disabled={loadingLocation}
                  className="glass px-4 rounded-xl hover:bg-white/10 transition-colors"
                >
                  {loadingLocation ? (
                    <Loader2 size={18} className="text-purple-400 animate-spin" />
                  ) : (
                    <MapPin size={18} className="text-purple-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={!monto || !categoria || saving}
              className={`w-full py-4 rounded-2xl font-semibold text-lg transition-all flex items-center justify-center gap-2 ${
                saved
                  ? 'bg-green-500 text-white'
                  : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-500 hover:to-blue-500 disabled:opacity-40'
              }`}
            >
              {saved ? (
                <><Check size={24} /> Guardado</>  
              ) : saving ? (
                <Loader2 size={24} className="animate-spin" />
              ) : (
                'Guardar movimiento'
              )}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
