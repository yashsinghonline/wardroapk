import React from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { ToastMessage } from '../types/outfit';

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onDismiss,
}) => {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed top-16 right-4 left-4 sm:left-auto sm:w-88 z-50 flex flex-col gap-2 pointer-events-none"
    >
      {toasts.map((toast) => {
        const iconMap = {
          success: <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />,
          warning: <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />,
          error: <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />,
          info: <Info className="w-4 h-4 text-[#3B82F6] shrink-0" />,
        };

        return (
          <div
            key={toast.id}
            className="pointer-events-auto rounded-xl theme-surface backdrop-blur-md border shadow-xl p-3 flex items-start gap-2.5 animate-sheet-up"
          >
            <div className="mt-0.5">{iconMap[toast.type]}</div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold theme-text-primary">
                {toast.title}
              </p>
              {toast.description && (
                <p className="text-[11px] theme-text-secondary mt-0.5 leading-snug">
                  {toast.description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              aria-label="Dismiss notification"
              className="w-7 h-7 rounded-lg flex items-center justify-center theme-text-muted hover:theme-text-primary transition-colors cursor-pointer shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
