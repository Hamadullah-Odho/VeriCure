import React, { useEffect, useRef } from 'react';

/*
 * Reusable confirmation modal used for logout, approve/reject,
 * delete, and any other important admin action.
 *
 * Props:
 *  - open: boolean
 *  - title: string
 *  - message: string | node
 *  - confirmLabel / cancelLabel: string
 *  - tone: 'default' | 'danger' | 'success'
 *  - loading: boolean            -> confirm button shows a spinner + is disabled
 *  - onConfirm / onCancel: fns
 *  - children: optional extra content rendered between message and buttons
 *              (e.g. a "reason" textarea for rejections)
 */
export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'default',
  loading = false,
  onConfirm,
  onCancel,
  children,
}) {
  const boxRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e) => {
      if (e.key === 'Escape' && !loading) {
        onCancel?.();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, loading, onCancel]);

  if (!open) return null;

  const handleOverlayClick = () => {
    if (!loading) onCancel?.();
  };

  return (
    <div
      className="modal-overlay"
      onClick={handleOverlayClick}
      role="presentation"
    >
      <div
        className="modal-box"
        ref={boxRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div id="confirm-modal-title" className="modal-title">
          {title}
        </div>
        {message && <div className="modal-message">{message}</div>}

        {children && <div className="modal-extra">{children}</div>}

        <div className="modal-actions">
          <button
            type="button"
            className="btn-secondary modal-btn"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`btn-primary modal-btn modal-btn-${tone}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? (
              <span className="btn-loading-content">
                <span className="btn-spinner" aria-hidden="true" />
                Processing...
              </span>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
