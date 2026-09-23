import React, { useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../api/client';
import { useToast } from '../components/Toast';
import { SkeletonTableRows } from '../components/Skeleton';

const STATUS_OPTIONS = ['PENDING', 'IN_PROGRESS', 'RESOLVED'];

export default function ReportedMedicines() {
  const toast = useToast();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const loadReports = async () => {
    setLoading(true);

    try {
      const params = statusFilter ? `?status=${statusFilter}` : '';

      const { ok, data } = await apiRequest(
        `/api/admin/medicine-reports${params}`
      );

      if (ok) {
        setReports(data || []);
      } else {
        toast.error('Failed to load reported medicines');
      }
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    setUpdatingId(id);

    try {
      const { ok, data } = await apiRequest(
        `/api/admin/medicine-reports/${id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ status }),
        }
      );

      if (ok) {
        toast.success('Report updated');
        loadReports();
      } else {
        toast.error((data && data.message) || 'Failed to update status');
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredReports = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return reports;

    return reports.filter((rep) =>
      [
        rep.reporterEmail,
        rep.medicineName,
        rep.category,
        rep.batchNumber,
        rep.description,
        rep.contactPhone,
      ]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(q))
    );
  }, [reports, search]);

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Reported Medicines</div>
          <div className="page-subtitle">
            Suspicious or counterfeit medicines reported from the app
          </div>
        </div>
      </div>

      <div className="filters-row">
        <select
          className="field-input"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s.replace('_', ' ')}
            </option>
          ))}
        </select>

        <input
          className="field-input"
          type="text"
          placeholder="Search name, medicine, batch, description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ minWidth: 260 }}
        />
      </div>

      <div className="panel">
        {loading ? (
          <SkeletonTableRows rows={5} cols={8} />
        ) : filteredReports.length === 0 ? (
          <div className="empty-state">
            {reports.length === 0
              ? 'No reported medicines yet.'
              : 'No reports match your search.'}
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>From</th>
                <th>Medicine</th>
                <th>Batch #</th>
                <th>Description</th>
                <th>Contact</th>
                <th>Status</th>
                <th>Submitted</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.map((rep, idx) => (
                <tr
                  key={rep.id}
                  className="table-row-enter"
                  style={{ animationDelay: `${idx * 25}ms` }}
                >
                  <td>{rep.reporterEmail || 'Guest'}</td>
                  <td>
                    {rep.medicineName || '—'}
                    {rep.category ? ` (${rep.category})` : ''}
                  </td>
                  <td>{rep.batchNumber || '—'}</td>
                  <td style={{ maxWidth: 200 }}>{rep.description || '—'}</td>
                  <td>{rep.contactPhone || '—'}</td>
                  <td>
                    <span
                      className={
                        'badge badge-' + rep.status.toLowerCase()
                      }
                    >
                      {rep.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    {new Date(rep.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    <select
                      className="btn-small"
                      value={rep.status}
                      disabled={updatingId === rep.id}
                      onChange={(e) =>
                        updateStatus(rep.id, e.target.value)
                      }
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s.replace('_', ' ')}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
