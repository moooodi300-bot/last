import type { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

export function Card({ children, className = '', onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  return (
    <div className={`bg-white rounded-2xl border border-surface-200/80 shadow-sm ${className}`} onClick={onClick}>
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action, className = "" }: { title: string; subtitle?: string; action?: ReactNode; className?: string }) {
  return (
    <div className={`flex items-start justify-between gap-3 px-5 pt-5 pb-3 ${className}`}>
      <div>
        <h3 className="text-base font-bold text-surface-800">{title}</h3>
        {subtitle && <p className="text-sm text-surface-500 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function CardBody({ children, className = '' }: { children: ReactNode; className?: string; onClick?: () => void }) {
  return <div className={`px-5 pb-5 ${className}`}>{children}</div>;
}

export function StatCard({
  label,
  title,
  action,
  value,
  icon,
  tone = 'slate',
  hint,
  trend,
  trendUp,
  className = "",
}: {
  label?: string;
  title?: string;
  action?: ReactNode;
  value: string;
  icon?: ReactNode;
  tone?: 'slate' | 'blue' | 'emerald' | 'amber' | 'rose' | 'cyan';
  hint?: string;
  trend?: string;
  trendUp?: boolean;
  className?: string;
}) {
  const tones: Record<string, string> = {
    slate: 'bg-surface-50 text-surface-600',
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600',
    cyan: 'bg-primary-50 text-primary-600',
  };
  return (
    <Card className="overflow-hidden">
      <div className="p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-surface-500">{title || label}</p>
          {(icon || action) && <div className={`p-2 rounded-xl ${tones[tone]}`}>{icon || action}</div>}
        </div>
        <p className="text-2xl font-bold text-surface-800 mt-3 tracking-tight">{value}</p>
        {hint && <p className="text-xs text-surface-400 mt-1">{hint}</p>}
        {trend && (
          <p className={`text-xs mt-2 flex items-center font-bold ${trendUp ? "text-emerald-600" : "text-rose-600"}`}>
            {trendUp ? "↑" : "↓"} {trend}
          </p>
        )}
      </div>
    </Card>
  );
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  type = 'button',
  disabled,
  className = '',
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  type?: 'button' | 'submit';
  disabled?: boolean;
  className?: string;
}) {
  const variants: Record<string, string> = {
    primary: 'bg-surface-800 text-white hover:bg-surface-900 shadow-sm',
    secondary: 'bg-white text-surface-700 border border-surface-200 hover:bg-surface-50',
    ghost: 'text-surface-600 hover:bg-surface-100',
    outline: 'border border-surface-300 text-surface-700 hover:bg-surface-50',
    danger: 'bg-rose-600 text-white hover:bg-rose-700 shadow-sm',
  };
  const sizes: Record<string, string> = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base',
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  );
}

export function Badge({ children, tone = 'slate' }: { children: ReactNode; tone?: 'slate' | 'blue' | 'emerald' | 'amber' | 'rose' | 'cyan' }) {
  const tones: Record<string, string> = {
    slate: 'bg-surface-100 text-surface-700',
    blue: 'bg-blue-100 text-blue-700',
    emerald: 'bg-emerald-100 text-emerald-700',
    amber: 'bg-amber-100 text-amber-700',
    rose: 'bg-rose-100 text-rose-700',
    cyan: 'bg-primary-100 text-primary-700',
  };
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tones[tone]}`}>{children}</span>;
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full px-3.5 py-2.5 rounded-xl border border-surface-200 bg-white text-surface-800 placeholder:text-surface-400 outline-none transition-all focus:border-surface-400 focus:ring-2 focus:ring-surface-200 ${props.className ?? ''}`}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full px-3.5 py-2.5 rounded-xl border border-surface-200 bg-white text-surface-800 outline-none transition-all focus:border-surface-400 focus:ring-2 focus:ring-surface-200 ${props.className ?? ''}`}
    />
  );
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full px-3.5 py-2.5 rounded-xl border border-surface-200 bg-white text-surface-800 placeholder:text-surface-400 outline-none transition-all focus:border-surface-400 focus:ring-2 focus:ring-surface-200 ${props.className ?? ''}`}
    />
  );
}

export function Label({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <label className={`block text-sm font-medium text-surface-600 mb-1.5 ${className}`}>{children}</label>;
}

export function Modal({
  open,
  onClose,
  title,
  children,
  size = 'md',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}) {
  if (!open) return null;
  const widths: Record<string, string> = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-surface-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white rounded-2xl shadow-2xl w-full ${widths[size]} max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-100 sticky top-0 bg-white rounded-t-2xl z-10">
          <h3 className="text-base font-bold text-surface-800">{title}</h3>
          <button onClick={onClose} className="text-surface-400 hover:text-surface-600 text-xl leading-none">×</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-surface-400">
      <Loader2 className="w-7 h-7 animate-spin" />
      {label && <p className="mt-2 text-sm">{label}</p>}
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-surface-400">
      <p className="text-sm">{message}</p>
    </div>
  );
}

export function PageHeader({ title, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-800 tracking-tight">{title}</h1>
      </div>
      {action}
    </div>
  );
}
