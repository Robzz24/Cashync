export interface CategoryInfo {
  label: string;
  emoji: string;
  color: string;
}

export const CATEGORIES: Record<string, CategoryInfo> = {
  'Food': { label: 'Comida', emoji: '🍔', color: '#f97316' },
  'Groceries': { label: 'Supermercado', emoji: '🛒', color: '#22c55e' },
  'Personal': { label: 'Personal', emoji: '💄', color: '#ec4899' },
  'Delivery': { label: 'Delivery', emoji: '📦', color: '#f59e0b' },
  'Suscripciones': { label: 'Suscripciones', emoji: '📱', color: '#6366f1' },
  'Educación': { label: 'Educación', emoji: '📚', color: '#3b82f6' },
  'Transportation': { label: 'Transporte', emoji: '🚗', color: '#14b8a6' },
  'Salud': { label: 'Salud', emoji: '💊', color: '#ef4444' },
  'Entretenimiento': { label: 'Entretenimiento', emoji: '🎬', color: '#a855f7' },
  'Compras': { label: 'Compras', emoji: '🛍️', color: '#d946ef' },
  'Regalos': { label: 'Regalos', emoji: '🎁', color: '#f43f5e' },
  'Variables': { label: 'Variables', emoji: '📋', color: '#64748b' },
  'Vault': { label: 'Ahorro', emoji: '🏦', color: '#0ea5e9' },
  'Pago de crédito': { label: 'Pago de crédito', emoji: '💳', color: '#8b5cf6' },
  'Retiro de efectivo': { label: 'Retiro de efectivo', emoji: '🏧', color: '#78716c' },
  'Otros': { label: 'Otros', emoji: '📋', color: '#94a3b8' },
  'Ingreso': { label: 'Ingreso', emoji: '💰', color: '#22c55e' },
};

export const EXPENSE_CATEGORIES = Object.entries(CATEGORIES)
  .filter(([key]) => key !== 'Ingreso')
  .map(([key, val]) => ({ value: key, ...val }));

export const INCOME_CATEGORIES = [{ value: 'Ingreso', ...CATEGORIES['Ingreso'] }];

export const CUENTAS = [
  { value: 'Efectivo', label: 'Efectivo', emoji: '💵' },
  { value: 'Tarjeta de Débito', label: 'Tarjeta de Débito', emoji: '💳' },
  { value: 'Tarjeta de Crédito', label: 'Tarjeta de Crédito', emoji: '🏦' },
];

export const METODOS_PAGO: Record<string, string> = {
  'Efectivo': 'Efectivo',
  'Debit': 'Debit',
  'Credit': 'Credit',
  'Tarjeta de Débito': 'Debit',
  'Tarjeta de Crédito': 'Credit',
};

export function getCategoryInfo(cat: string): CategoryInfo {
  return CATEGORIES[cat] ?? { label: cat, emoji: '📋', color: '#94a3b8' };
}

export const MONTHS_ES: Record<string, string> = {
  'January': 'Enero',
  'February': 'Febrero',
  'March': 'Marzo',
  'April': 'Abril',
  'May': 'Mayo',
  'June': 'Junio',
  'July': 'Julio',
  'August': 'Agosto',
  'September': 'Septiembre',
  'October': 'Octubre',
  'November': 'Noviembre',
  'December': 'Diciembre',
};

export const MONTH_NUMBERS: Record<string, number> = {
  'January': 0, 'February': 1, 'March': 2, 'April': 3,
  'May': 4, 'June': 5, 'July': 6, 'August': 7,
  'September': 8, 'October': 9, 'November': 10, 'December': 11,
};
