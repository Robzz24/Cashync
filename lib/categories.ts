export interface CategoryInfo {
  label: string;
  icon: string;   // Lucide icon name
  color: string;
}

export const CATEGORIES: Record<string, CategoryInfo> = {
  'Food': { label: 'Comida', icon: 'Utensils', color: '#f97316' },
  'Groceries': { label: 'Supermercado', icon: 'ShoppingCart', color: '#22c55e' },
  'Personal': { label: 'Personal', icon: 'User', color: '#ec4899' },
  'Delivery': { label: 'Delivery', icon: 'Truck', color: '#f59e0b' },
  'Suscripciones': { label: 'Suscripciones', icon: 'Smartphone', color: '#6366f1' },
  'Educación': { label: 'Educación', icon: 'BookOpen', color: '#3b82f6' },
  'Transportation': { label: 'Transporte', icon: 'Car', color: '#14b8a6' },
  'Salud': { label: 'Salud', icon: 'Heart', color: '#ef4444' },
  'Entretenimiento': { label: 'Entretenimiento', icon: 'Film', color: '#a855f7' },
  'Compras': { label: 'Compras', icon: 'ShoppingBag', color: '#d946ef' },
  'Regalos': { label: 'Regalos', icon: 'Gift', color: '#f43f5e' },
  'Variables': { label: 'Variables', icon: 'FileText', color: '#64748b' },
  'Vault': { label: 'Ahorro', icon: 'Landmark', color: '#0ea5e9' },
  'Pago de crédito': { label: 'Pago de crédito', icon: 'CreditCard', color: '#8b5cf6' },
  'Retiro de efectivo': { label: 'Retiro de efectivo', icon: 'Banknote', color: '#78716c' },
  'Otros': { label: 'Otros', icon: 'FileText', color: '#94a3b8' },
  'Ingreso': { label: 'Ingreso', icon: 'TrendingUp', color: '#22c55e' },
};

export const EXPENSE_CATEGORIES = Object.entries(CATEGORIES)
  .filter(([key]) => key !== 'Ingreso')
  .map(([key, val]) => ({ value: key, ...val }));

export const INCOME_CATEGORIES = [{ value: 'Ingreso', ...CATEGORIES['Ingreso'] }];

export const CUENTAS = [
  { value: 'Efectivo', label: 'Efectivo', icon: 'Wallet' },
  { value: 'Tarjeta de Débito', label: 'Tarjeta de Débito', icon: 'CreditCard' },
  { value: 'Tarjeta de Crédito', label: 'Tarjeta de Crédito', icon: 'CreditCard' },
];

export const METODOS_PAGO: Record<string, string> = {
  'Efectivo': 'Efectivo',
  'Debit': 'Debit',
  'Credit': 'Credit',
  'Tarjeta de Débito': 'Debit',
  'Tarjeta de Crédito': 'Credit',
};

export function getCategoryInfo(cat: string): CategoryInfo {
  return CATEGORIES[cat] ?? { label: cat, icon: 'FileText', color: '#94a3b8' };
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
