import React, { useEffect, useState } from 'react';
import { apiRequest } from '../api/client';
import { useToast } from '../components/Toast';
import ConfirmModal from '../components/ConfirmModal';
import { SkeletonTableRows } from '../components/Skeleton';

export default function PendingApprovals() {
  const toast = useToast();

  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);

  // { id, action: 'approve' | 'reject' } | null
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const [removingId, setRemovingId] = useState(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);

    try {
      const { ok, data } = await apiRequest('/api/admin/pending');

      if (ok) {
        setPending(data || []);
      } else {
        toast.error('Failed to load pending approvals');
      }
    } finally {
      setLoading(false);
    }
  };

  const requestDecision = (id, action) => {
    if (processingId) return;
    setConfirmTarget({ id, action });
  };

  const cancelDecision = () => {
    if (processingId) return;
    setConfirmTarget(null);
  };

  const confirmDecision = async () => {
    if (!confirmTarget || processingId) return;

    const { id, action } = confirmTarget;
    setProcessingId(id);

    try {
      const { ok, data } = await apiRequest(`/api/admin/${action}/${id}`, {
        method: 'POST',
      });

      if (ok) {
        toast.success(
          action === 'approve'
            ? 'Request approved successfully'
            : 'Request rejected'
        );

        setConfirmTarget(null);
        setRemovingId(id);

        // Let the fade-out play before removing the row from state.
        setTimeout(() => {
          setPending((prev) => prev.filter((p) => p.id !== id));
          setRemovingId(null);
        }, 260);
      } else {
        toast.error(
          (data && data.message) ||
            `Failed to ${action === 'approve' ? 'approve' : 'reject'} this request.`
        );
        setConfirmTarget(null);
      }
    } finally {
      setProcessingId(null);
    }
  };

  const target = pending.find((p) => p.id === confirmTarget?.id);

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Pending Approvals</div>
          <div className="page-subtitle">
            Admin signup requests awaiting your decision
          </div>
        </div>
      </div>

      <div className="panel">
        {loading ? (
          <SkeletonTableRows rows={4} cols={4} />
        ) : pending.length === 0 ? (
          <div className="empty-state">
            No pending requests right now.
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Requested</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {pending.map((p, idx) => (
                <tr
                  key={p.id}
                  className={
                    removingId === p.id ? 'row-fading-out' : 'table-row-enter'
                  }
                  style={{ animationDelay: `${idx * 30}ms` }}
                >
                  <td>{p.name}</td>
                  <td>{p.email}</td>
                  <td>
                    {new Date(p.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ display: 'flex', gap: 8 }}>
                    <button
                      className="btn-small primary"
                      onClick={() => requestDecision(p.id, 'approve')}
                      disabled={processingId === p.id}
                    >
                      Approve
                    </button>
                    <button
                      className="btn-small"
                      onClick={() => requestDecision(p.id, 'reject')}
                      disabled={processingId === p.id}
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ConfirmModal
        open={!!confirmTarget}
        title={
          confirmTarget?.action === 'approve'
            ? 'Approve Request?'
            : 'Reject Request?'
        }
        message={
          target
            ? `Are you sure you want to ${
                confirmTarget?.action === 'approve' ? 'approve' : 'reject'
              } the admin request from ${target.name} (${target.email})?`
            : `Are you sure you want to ${
                confirmTarget?.action === 'approve' ? 'approve' : 'reject'
              } this request?`
        }
        confirmLabel={confirmTarget?.action === 'approve' ? 'Approve' : 'Reject'}
        tone={confirmTarget?.action === 'approve' ? 'success' : 'danger'}
        loading={!!processingId}
        onConfirm={confirmDecision}
        onCancel={cancelDecision}
      />
    </div>
  );
}
