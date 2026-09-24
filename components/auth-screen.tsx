'use client';

import { useState } from 'react';
import { Fingerprint, ShieldCheck, Loader2 } from 'lucide-react';
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
import { motion } from 'framer-motion';

interface AuthScreenProps {
  mode: 'register' | 'authenticate';
  onSuccess: () => void;
}

export default function AuthScreen({ mode, onSuccess }: AuthScreenProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Get registration options
      const optRes = await fetch('/api/auth/webauthn/register/options', { method: 'POST' });
      const optData = await optRes.json();
      if (!optRes.ok) throw new Error(optData?.error ?? 'Error obteniendo opciones');

      // 2. Start WebAuthn registration
      const credential = await startRegistration({ optionsJSON: optData.options });

      // 3. Verify
      const verifyRes = await fetch('/api/auth/webauthn/register/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential, userId: optData.userId }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) throw new Error(verifyData?.error ?? 'Error de verificación');

      // 4. Import historical data
      await fetch('/api/import', { method: 'POST' });

      onSuccess();
    } catch (err: any) {
      console.error('Register error:', err);
      setError(err?.message ?? 'Error al registrar. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleAuthenticate = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Get authentication options
      const optRes = await fetch('/api/auth/webauthn/authenticate/options', { method: 'POST' });
      const optData = await optRes.json();
      if (!optRes.ok) {
        if (optData?.needsSetup) {
          // Fallback to registration
          await handleRegister();
          return;
        }
        throw new Error(optData?.error ?? 'Error obteniendo opciones');
      }

      // 2. Start WebAuthn authentication
      const credential = await startAuthentication({ optionsJSON: optData.options });

      // 3. Verify
      const verifyRes = await fetch('/api/auth/webauthn/authenticate/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential, userId: optData.userId }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) throw new Error(verifyData?.error ?? 'Verificación fallida');

      onSuccess();
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err?.message ?? 'Error al autenticar. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card p-8 w-full max-w-[380px] text-center"
      >
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center mx-auto mb-6 glow-purple">
          {mode === 'register' ? (
            <ShieldCheck size={36} className="text-white" />
          ) : (
            <Fingerprint size={36} className="text-white" />
          )}
        </div>

        <h1 className="font-display text-2xl font-bold text-white mb-2 tracking-tight">
          {mode === 'register' ? 'Bienvenido a FinTrack' : 'Hola de nuevo'}
        </h1>
        <p className="text-white/60 text-sm mb-8">
          {mode === 'register'
            ? 'Registra tu huella dactilar o Face ID para comenzar'
            : 'Usa tu huella dactilar o Face ID para acceder'}
        </p>

        {error && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-3 mb-4">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        <button
          onClick={mode === 'register' ? handleRegister : handleAuthenticate}
          disabled={loading}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold text-lg hover:from-purple-500 hover:to-blue-500 transition-all disabled:opacity-50 flex items-center justify-center gap-3 glow-purple"
        >
          {loading ? (
            <Loader2 size={24} className="animate-spin" />
          ) : (
            <Fingerprint size={24} />
          )}
          {loading
            ? 'Verificando...'
            : mode === 'register'
            ? 'Registrar huella'
            : 'Desbloquear con huella'}
        </button>

        <p className="text-white/30 text-xs mt-6">
          Tus datos biométricos nunca salen de tu dispositivo
        </p>
      </motion.div>
    </div>
  );
}
