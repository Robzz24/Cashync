'use client';

import { useState, useCallback } from 'react';
import { Shield, Lock, Loader2, ArrowLeft, Wallet, CreditCard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AuthScreenProps {
  mode: 'setup' | 'authenticate';
  onSuccess: () => void;
}

type SetupStep = 'pin' | 'confirm' | 'balances';

export default function AuthScreen({ mode, onSuccess }: AuthScreenProps) {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [setupStep, setSetupStep] = useState<SetupStep>('pin');
  const [saldoEfectivo, setSaldoEfectivo] = useState('');
  const [saldoTarjeta, setSaldoTarjeta] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const currentPin = setupStep === 'confirm' ? confirmPin : pin;
  const setCurrentPin = setupStep === 'confirm' ? setConfirmPin : setPin;

  const handleDigit = (d: string) => {
    if (currentPin.length >= 4) return;
    const newPin = currentPin + d;
    setCurrentPin(newPin);
    setError(null);

    if (newPin.length === 4) {
      if (mode === 'authenticate') {
        handleVerify(newPin);
      } else if (setupStep === 'pin') {
        setTimeout(() => setSetupStep('confirm'), 300);
      } else if (setupStep === 'confirm') {
        if (newPin !== pin) {
          setError('Los PINs no coinciden');
          triggerShake();
          setTimeout(() => {
            setConfirmPin('');
            setSetupStep('pin');
            setPin('');
          }, 800);
        } else {
          setTimeout(() => setSetupStep('balances'), 300);
        }
      }
    }
  };

  const handleDelete = () => {
    setCurrentPin(currentPin.slice(0, -1));
    setError(null);
  };

  const handleVerify = async (pinValue: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/pin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pinValue }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? 'PIN incorrecto');
        triggerShake();
        setTimeout(() => setPin(''), 500);
      } else {
        onSuccess();
      }
    } catch {
      setError('Error de conexión');
      triggerShake();
      setTimeout(() => setPin(''), 500);
    } finally {
      setLoading(false);
    }
  };

  const handleSetup = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/pin/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pin,
          saldoInicialEfectivo: parseFloat(saldoEfectivo || '0'),
          saldoInicialTarjeta: parseFloat(saldoTarjeta || '0'),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? 'Error');

      // Import historical data
      await fetch('/api/import', { method: 'POST' }).catch(() => {});

      onSuccess();
    } catch (err: any) {
      setError(err?.message ?? 'Error al configurar');
    } finally {
      setLoading(false);
    }
  };

  const renderPinDots = (value: string) => (
    <motion.div
      className="flex items-center justify-center gap-4 my-8"
      animate={shake ? { x: [0, -12, 12, -12, 12, 0] } : {}}
      transition={{ duration: 0.4 }}
    >
      {[0, 1, 2, 3].map((i) => (
        <motion.div
          key={i}
          className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
            i < value.length
              ? 'bg-purple-400 border-purple-400 scale-110'
              : 'border-white/30 bg-transparent'
          }`}
          animate={i === value.length - 1 && value.length > 0 ? { scale: [1.3, 1] } : {}}
        />
      ))}
    </motion.div>
  );

  const renderKeypad = () => (
    <div className="grid grid-cols-3 gap-3 max-w-[280px] mx-auto">
      {['1','2','3','4','5','6','7','8','9','','0','del'].map((key) => {
        if (key === '') return <div key="empty" />;
        if (key === 'del') {
          return (
            <button
              key="del"
              onClick={handleDelete}
              className="h-16 rounded-2xl flex items-center justify-center text-white/60 hover:bg-white/5 active:bg-white/10 transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
          );
        }
        return (
          <button
            key={key}
            onClick={() => handleDigit(key)}
            disabled={loading}
            className="h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-medium hover:bg-white/5 active:bg-white/10 transition-colors disabled:opacity-50"
          >
            {key}
          </button>
        );
      })}
    </div>
  );

  // Balances setup step
  if (mode === 'setup' && setupStep === 'balances') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-8 w-full max-w-[380px]"
        >
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center mx-auto mb-4">
              <Wallet size={28} className="text-white" />
            </div>
            <h2 className="font-display text-xl font-bold text-white">Saldos iniciales</h2>
            <p className="text-white/50 text-sm mt-1">Ingresa cuanto tienes actualmente</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-white/50 text-xs mb-2 flex items-center gap-2">
                <Wallet size={14} />
                Efectivo actual
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 text-lg font-mono">$</span>
                <input
                  type="number"
                  inputMode="decimal"
                  value={saldoEfectivo}
                  onChange={(e) => setSaldoEfectivo(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white text-lg font-mono focus:outline-none focus:border-purple-500/50 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="text-white/50 text-xs mb-2 flex items-center gap-2">
                <CreditCard size={14} />
                Saldo de tarjeta actual
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 text-lg font-mono">$</span>
                <input
                  type="number"
                  inputMode="decimal"
                  value={saldoTarjeta}
                  onChange={(e) => setSaldoTarjeta(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white text-lg font-mono focus:outline-none focus:border-purple-500/50 transition-colors"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-3 mt-4">
              <p className="text-red-300 text-sm text-center">{error}</p>
            </div>
          )}

          <button
            onClick={handleSetup}
            disabled={loading}
            className="w-full mt-6 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold text-lg hover:from-purple-500 hover:to-blue-500 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={24} className="animate-spin" /> : 'Comenzar'}
          </button>
        </motion.div>
      </div>
    );
  }

  // PIN entry (setup or authenticate)
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-[380px] text-center"
      >
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center mx-auto mb-4">
          {mode === 'setup' ? <Shield size={28} className="text-white" /> : <Lock size={28} className="text-white" />}
        </div>

        <h1 className="font-display text-2xl font-bold text-white mb-1 tracking-tight">
          {mode === 'setup'
            ? setupStep === 'pin' ? 'Crea tu PIN' : 'Confirma tu PIN'
            : 'Cashync'
          }
        </h1>
        <p className="text-white/50 text-sm mb-2">
          {mode === 'setup'
            ? setupStep === 'pin' ? 'Elige un PIN de 4 digitos' : 'Ingresa el PIN nuevamente'
            : 'Ingresa tu PIN para acceder'
          }
        </p>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-red-500/20 border border-red-500/30 rounded-xl p-2 mb-2 mx-4"
            >
              <p className="text-red-300 text-sm">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {renderPinDots(currentPin)}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={32} className="text-purple-400 animate-spin" />
          </div>
        ) : (
          renderKeypad()
        )}

        <p className="text-white/20 text-xs mt-8">Cashync v1.0</p>
      </motion.div>
    </div>
  );
}
