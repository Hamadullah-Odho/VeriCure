import React, { useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import ConfirmModal from '../components/ConfirmModal';
import { SkeletonTableRows } from '../components/Skeleton';

/*
 * Actions available per admin row:
 *  - Suspend / Reactivate  -> POST /api/admin/suspend/{id}, /api/admin/activate/{id}
 *  - Remove                -> DELETE /api/admin/{id}
 *
 * These endpoints are not part of the original backend surface
 * (only login/signup/bootstrap/pending/approve/reject/all existed).
 * They follow the exact same request/response convention as the
 * existing approve/reject calls: POST/DELETE, no body, and a JSON
 * response shaped like { success: boolean, message?: string }.
 * Add matching endpoints in Spring Boot for this UI to work.
 */

export default function AdminManagement() {
  const toast = useToast();
  const { admin: currentAdmin } = useAuth();

  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // { id, name, action: 'suspend' | 'activate' | 'remove' } | null
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const [removingId, setRemovingId] = useState(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);

    try {
      const { ok, data } = await apiRequest('/api/admin/all');

      if (ok) {
        setAdmins(data || []);
      } else {
        toast.error('Failed to load admin accounts');
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredAdmins = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return admins;

    return admins.filter((a) => {
      const role = a.role === 'HEAD_ADMIN' ? 'head admin' : 'admin';
      return (
        (a.name || '').toLowerCase().includes(q) ||
        (a.email || '').toLowerCase().includes(q) ||
        (a.status || '').toLowerCase().includes(q) ||
        role.includes(q)
      );
    });
  }, [admins, search]);

  const requestAction = (a, action) => {
    if (processingId) return;
    setConfirmTarget({ id: a.id, name: a.name, action });
  };

  const cancelAction = () => {
    if (processingId) return;
    setConfirmTarget(null);
  };

  const endpointFor = (id, action) => {
    if (action === 'suspend') return { path: `/api/admin/suspend/${id}`, method: 'POST' };
    if (action === 'activate') return { path: `/api/admin/activate/${id}`, method: 'POST' };
    return { path: `/api/admin/${id}`, method: 'DELETE' };
  };

  const confirmAction = async () => {
    if (!confirmTarget || processingId) return;

    const { id, action } = confirmTarget;
    const { path, method } = endpointFor(id, action);

    setProcessingId(id);

    try {
      const { ok, data } = await apiRequest(path, { method });

      if (ok) {
        if (action === 'remove') {
          toast.success('Admin removed successfully');
          setConfirmTarget(null);
          setRemovingId(id);
          setTimeout(() => {
            setAdmins((prev) => prev.filter((a) => a.id !== id));
            setRemovingId(null);
          }, 260);
        } else {
          toast.success(
            action === 'suspend'
              ? 'Admin account suspended'
              : 'Admin account reactivated'
          );
          setConfirmTarget(null);
          setAdmins((prev) =>
            prev.map((a) =>
              a.id === id
                ? { ...a, status: action === 'suspend' ? 'SUSPENDED' : 'APPROVED' }
                : a
            )
          );
        }
      } else {
        toast.error(
          (data && data.message) ||
            `Failed to ${action === 'remove' ? 'remove' : action} this admin.`
        );
        setConfirmTarget(null);
      }
    } finally {
      setProcessingId(null);
    }
  };

  const isSuspended = (status) => (status || '').toUpperCase() === 'SUSPENDED';

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Admin Management</div>
          <div className="page-subtitle">
            Full roster of every admin account
          </div>
        </div>
      </div>

      <div className="filters-row">
        <input
          className="field-input"
          type="text"
          placeholder="Search by name, email, role or status..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ minWidth: 280 }}
        />
      </div>

      <div className="panel">
        {loading ? (
          <SkeletonTableRows rows={5} cols={6} />
        ) : filteredAdmins.length === 0 ? (
          <div className="empty-state">
            {admins.length === 0
              ? 'No admin accounts found.'
              : 'No admins match your search.'}
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredAdmins.map((a, idx) => {
                const isSelf = currentAdmin && a.id === currentAdmin.id;
                const isHeadAdmin = a.role === 'HEAD_ADMIN';
                const suspended = isSuspended(a.status);
                const busy = processingId === a.id;

                return (
                  <tr
                    key={a.id}
                    className={
                      removingId === a.id ? 'row-fading-out' : 'table-row-enter'
                    }
                    style={{ animationDelay: `${idx * 25}ms` }}
                  >
                    <td>{a.name}</td>
                    <td>{a.email}</td>
                    <td>
                      {isHeadAdmin ? 'Head Admin' : 'Admin'}
                    </td>
                    <td>
                      <span
                        className={
                          'badge badge-' + (a.status || '').toLowerCase()
                        }
                      >
                        {a.status}
                      </span>
                    </td>
                    <td>
                      {new Date(a.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ display: 'flex', gap: 8, whiteSpace: 'nowrap' }}>
                      {isHeadAdmin || isSelf ? (
                        <span
                          style={{
                            color: 'var(--text-muted)',
                            fontSize: 11,
                          }}
                          title={
                            isHeadAdmin
                              ? 'Head Admin accounts cannot be modified here'
                              : 'You cannot modify your own account here'
                          }
                        >
                          —
                        </span>
                      ) : (
                        <>
                          <button
                            className="btn-small"
                            onClick={() =>
                              requestAction(a, suspended ? 'activate' : 'suspend')
                            }
                            disabled={busy}
                          >
                            {suspended ? 'Reactivate' : 'Suspend'}
                          </button>
                          <button
                            className="btn-small danger-btn"
                            onClick={() => requestAction(a, 'remove')}
                            disabled={busy}
                          >
                            Remove
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <ConfirmModal
        open={!!confirmTarget}
        title={
          confirmTarget?.action === 'remove'
            ? 'Remove Admin?'
            : confirmTarget?.action === 'suspend'
            ? 'Suspend Admin?'
            : 'Reactivate Admin?'
        }
        message={
          confirmTarget
            ? confirmTarget.action === 'remove'
              ? `Are you sure you want to permanently remove ${confirmTarget.name}? This cannot be undone.`
              : confirmTarget.action === 'suspend'
              ? `Are you sure you want to suspend ${confirmTarget.name}? They will lose access until reactivated.`
              : `Are you sure you want to reactivate ${confirmTarget.name}? Their access will be restored.`
            : ''
        }
        confirmLabel={
          confirmTarget?.action === 'remove'
            ? 'Remove'
            : confirmTarget?.action === 'suspend'
            ? 'Suspend'
            : 'Reactivate'
        }
        tone={confirmTarget?.action === 'activate' ? 'success' : 'danger'}
        loading={!!processingId}
        onConfirm={confirmAction}
        onCancel={cancelAction}
      />
    </div>
  );
}
