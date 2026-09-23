import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react';

/*
 * Reusable global toast/notification system.
 *
 * Usage:
 *   const toast = useToast();
 *   toast.success('Login successful');
 *   toast.error('Failed to load users');
 *   toast.warning('Session about to expire');
 *   toast.info('Refreshing data...');
 *
 * One provider, one <ToastViewport />, used everywhere — no more
 * one-off inline banners scattered across pages.
 */

const ToastContext = createContext(null);

const ICONS = {
  success: '✓',
  error: '✕',
  warning: '!',
  info: 'i',
};

const DEFAULT_DURATION = 4200;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (type, message, opts = {}) => {
      const id = ++idRef.current;
      const duration = opts.duration ?? DEFAULT_DURATION;

      setToasts((prev) => [...prev, { id, type, message }]);

      if (duration > 0) {
        setTimeout(() => remove(id), duration);
      }

      return id;
    },
    [remove]
  );

  const api = {
    success: (msg, opts) => push('success', msg, opts),
    error: (msg, opts) => push('error', msg, opts),
    warning: (msg, opts) => push('warning', msg, opts),
    info: (msg, opts) => push('info', msg, opts),
    remove,
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={remove} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Fail soft: never let a missing provider crash the app.
    return {
      success: () => {},
      error: () => {},
      warning: () => {},
      info: () => {},
      remove: () => {},
    };
  }
  return ctx;
}

function ToastViewport({ toasts, onDismiss }) {
  if (toasts.length === 0) return null;

  return (
    <div className="toast-viewport" role="region" aria-label="Notifications">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast toast-${t.type}`}
          role={t.type === 'error' ? 'alert' : 'status'}
        >
          <span className="toast-icon" aria-hidden="true">
            {ICONS[t.type] || ICONS.info}
          </span>
          <span className="toast-message">{t.message}</span>
          <button
            className="toast-close"
            aria-label="Dismiss notification"
            onClick={() => onDismiss(t.id)}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
