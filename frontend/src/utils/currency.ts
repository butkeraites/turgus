/**
 * Currency formatting utilities for Brazilian Real (BRL)
 */

export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(price);
};

export const formatPriceCompact = (price: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(price);
};

export const getCurrencySymbol = (): string => {
  return 'R$';
};