'use client';

import { useState, useEffect, useCallback } from 'react';
import AuthScreen from './auth-screen';
import Dashboard from './dashboard';
import HistoryPage from './history-page';
import NewTransactionModal from './new-transaction-modal';
import ExportModal from './export-modal';
import { Plus, LayoutDashboard, Clock, LogOut, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Page = 'dashboard' | 'history';

export default function AppShell() {
  const [authState, setAuthState] = useState<'loading' | 'needsSetup' | 'needsAuth' | 'authenticated'>('loading');
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [showNewTx, setShowNewTx] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const checkAuth = useCallback(async () => {
    try {
      const [sessionRes, setupRes] = await Promise.all([
        fetch('/api/auth/session'),
        fetch('/api/auth/check-setup'),
      ]);
      const session = await sessionRes.json();
      const setup = await setupRes.json();

      if (session?.authenticated) {
        setAuthState('authenticated');
      } else if (!setup?.hasUser || !setup?.hasPin) {
        setAuthState('needsSetup');
      } else {
        setAuthState('needsAuth');
      }
    } catch {
      setAuthState('needsSetup');
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/session', { method: 'DELETE' });
    setAuthState('needsAuth');
  };

  const handleTxSaved = () => {
    setShowNewTx(false);
    setRefreshKey((k) => k + 1);
  };

  if (authState === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card p-8 text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/70">Cargando Cashync...</p>
        </div>
      </div>
    );
  }

  if (authState === 'needsSetup' || authState === 'needsAuth') {
    return (
      <AuthScreen
        mode={authState === 'needsSetup' ? 'setup' : 'authenticate'}
        onSuccess={() => {
          setAuthState('authenticated');
          setRefreshKey((k) => k + 1);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen pb-24 max-w-[430px] mx-auto relative">
      {/* Header */}
      <header className="sticky top-0 z-40 glass px-4 py-3 flex items-center justify-between">
        <h1 className="font-display text-xl font-bold text-white tracking-tight">Cashync</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowExport(true)}
            className="p-2 rounded-xl glass hover:bg-white/10 transition-colors"
            aria-label="Exportar Excel"
          >
            <Download size={18} className="text-white/70" />
          </button>
          <button
            onClick={handleLogout}
            className="p-2 rounded-xl glass hover:bg-white/10 transition-colors"
            aria-label="Cerrar sesion"
          >
            <LogOut size={18} className="text-white/70" />
          </button>
        </div>
      </header>

      {/* Content */}
      <AnimatePresence mode="wait">
        {currentPage === 'dashboard' && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Dashboard refreshKey={refreshKey} />
          </motion.div>
        )}
        {currentPage === 'history' && (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <HistoryPage refreshKey={refreshKey} onRefresh={() => setRefreshKey((k) => k + 1)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB */}
      <button
        onClick={() => setShowNewTx(true)}
        className="fab-button fixed bottom-20 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full flex items-center justify-center z-50"
        aria-label="Registrar movimiento"
      >
        <Plus size={28} className="text-white" />
      </button>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] glass-strong z-40 flex items-center justify-around py-3 px-4">
        <button
          onClick={() => setCurrentPage('dashboard')}
          className={`flex flex-col items-center gap-1 transition-colors ${
            currentPage === 'dashboard' ? 'text-purple-400' : 'text-white/50'
          }`}
        >
          <LayoutDashboard size={22} />
          <span className="text-xs">Inicio</span>
        </button>
        <div className="w-16" />
        <button
          onClick={() => setCurrentPage('history')}
          className={`flex flex-col items-center gap-1 transition-colors ${
            currentPage === 'history' ? 'text-purple-400' : 'text-white/50'
          }`}
        >
          <Clock size={22} />
          <span className="text-xs">Historial</span>
        </button>
      </nav>

      {/* Modals */}
      <NewTransactionModal
        open={showNewTx}
        onClose={() => setShowNewTx(false)}
        onSaved={handleTxSaved}
      />
      <ExportModal
        open={showExport}
        onClose={() => setShowExport(false)}
      />
    </div>
  );
}
