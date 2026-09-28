'use client';

import {
  Utensils, ShoppingCart, User, Truck, Smartphone, BookOpen, Car, Heart,
  Film, ShoppingBag, Gift, FileText, Landmark, CreditCard, Banknote,
  TrendingUp, TrendingDown, Wallet, type LucideProps
} from 'lucide-react';

const ICON_MAP: Record<string, React.ComponentType<LucideProps>> = {
  Utensils, ShoppingCart, User, Truck, Smartphone, BookOpen, Car, Heart,
  Film, ShoppingBag, Gift, FileText, Landmark, CreditCard, Banknote,
  TrendingUp, TrendingDown, Wallet,
};

interface LucideIconProps extends LucideProps {
  name: string;
}

export default function LucideIcon({ name, ...props }: LucideIconProps) {
  const Icon = ICON_MAP[name];
  if (!Icon) return <FileText {...props} />;
  return <Icon {...props} />;
}
