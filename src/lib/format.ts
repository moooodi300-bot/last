import type { Lang } from './i18n';

export function formatSAR(n: number, lang: Lang = 'ar'): string {
  const locale = lang === 'ar' ? 'ar-SA' : 'en-US';
  const suffix = lang === 'ar' ? ' ر.س' : ' SAR';
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(Number(n) || 0) + suffix;
}

export function formatNumber(n: number, lang: Lang = 'ar'): string {
  const locale = lang === 'ar' ? 'ar-SA' : 'en-US';
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(Number(n) || 0);
}

export function formatDate(d: string | Date, lang: Lang = 'ar'): string {
  const locale = lang === 'ar' ? 'ar-SA' : 'en-US';
  const date = typeof d === 'string' ? new Date(d) : d;
  return new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: 'numeric' }).format(date);
}

export function formatDateTime(d: string | Date, lang: Lang = 'ar'): string {
  const locale = lang === 'ar' ? 'ar-SA' : 'en-US';
  const date = typeof d === 'string' ? new Date(d) : d;
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatPercent(n: number, lang: Lang = 'ar'): string {
  return (Number(n) || 0).toFixed(1) + (lang === 'ar' ? '٪' : '%');
}

export function monthName(monthIndex: number, lang: Lang = 'ar'): string {
  const locale = lang === 'ar' ? 'ar-SA' : 'en-US';
  const d = new Date();
  d.setMonth(monthIndex);
  return new Intl.DateTimeFormat(locale, { month: 'short' }).format(d);
}
