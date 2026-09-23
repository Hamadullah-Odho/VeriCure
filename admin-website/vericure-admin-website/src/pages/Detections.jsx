import React, { useEffect, useState } from 'react';
import { apiRequest } from '../api/client';
import { useToast } from '../components/Toast';
import { SkeletonTableRows } from '../components/Skeleton';

export default function Detections() {
  const toast = useToast();
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const [resultFilter, setResultFilter] = useState('COUNTERFEIT');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    loadScans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadScans = async () => {
    setLoading(true);

    try {
      const params = new URLSearchParams();
      if (resultFilter) params.set('result', resultFilter);
      if (fromDate) params.set('from', fromDate);
      if (toDate) params.set('to', toDate);
      if (query) params.set('query', query);

      const { ok, data } = await apiRequest(
        `/api/admin/scans?${params.toString()}`
      );

      if (ok) {
        setScans(data || []);
      } else {
        toast.error('Failed to load detections');
      }
    } finally {
      setLoading(false);
    }
  };

  const badgeClass = (result) =>
    'badge badge-' + (result || 'unknown').toLowerCase();

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Counterfeit Detections</div>
          <div className="page-subtitle">
            All flagged scans across every user, with location and
            medicine details
          </div>
        </div>
      </div>

      <div className="filters-row">
        <select
          className="field-input"
          value={resultFilter}
          onChange={(e) => setResultFilter(e.target.value)}
        >
          <option value="">All Results</option>
          <option value="COUNTERFEIT">Counterfeit</option>
          <option value="GENUINE">Genuine</option>
          <option value="UNKNOWN">Unknown</option>
        </select>

        <input
          className="field-input"
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          title="From date"
        />

        <input
          className="field-input"
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          title="To date"
        />

        <input
          className="field-input"
          type="text"
          placeholder="Search medicine, manufacturer, batch..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ minWidth: 240 }}
        />

        <button className="btn-small primary" onClick={loadScans} disabled={loading}>
          {loading ? (
            <span className="btn-loading-content">
              <span className="btn-spinner" aria-hidden="true" />
            </span>
          ) : (
            'Apply Filters'
          )}
        </button>
      </div>

      <div className="panel">
        {loading ? (
          <SkeletonTableRows rows={6} cols={9} />
        ) : scans.length === 0 ? (
          <div className="empty-state">
            No scans match these filters.
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Medicine</th>
                <th>Result</th>
                <th>Manufacturer</th>
                <th>Batch #</th>
                <th>Expiry</th>
                <th>Reported By</th>
                <th>Location</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {scans.map((scan, idx) => (
                <tr
                  key={scan.id}
                  className="table-row-enter"
                  style={{ animationDelay: `${Math.min(idx, 12) * 20}ms` }}
                >
                  <td>{scan.medicineName}</td>
                  <td>
                    <span className={badgeClass(scan.result)}>
                      {scan.result}
                    </span>
                  </td>
                  <td>{scan.manufacturer || '—'}</td>
                  <td>{scan.batchNumber || '—'}</td>
                  <td>{scan.expiryDate || '—'}</td>
                  <td>
                    {scan.reportedByName}
                    <br />
                    <span
                      style={{
                        color: 'var(--text-muted)',
                        fontSize: 11,
                      }}
                    >
                      {scan.reportedByEmail}
                    </span>
                  </td>
                  <td>
                    {scan.locationAddress ||
                      (scan.latitude
                        ? `${scan.latitude.toFixed(
                            3
                          )}, ${scan.longitude.toFixed(3)}`
                        : '—')}
                  </td>
                  <td>
                    {new Date(scan.scannedAt).toLocaleDateString()}
                  </td>
                  <td>
                    <button
                      className="btn-small"
                      onClick={() => setSelected(scan)}
                    >
                      Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selected && (
        <DetailModal
          scan={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

function DetailModal({ scan, onClose }) {
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className="modal-box panel"
        style={{ width: 480, maxHeight: '80vh', overflowY: 'auto' }}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="panel-title">{scan.medicineName}</div>

        <DetailRow label="Result" value={scan.result} />
        <DetailRow label="Manufacturer" value={scan.manufacturer} />
        <DetailRow label="Dosage" value={scan.dosage} />
        <DetailRow label="Batch Number" value={scan.batchNumber} />
        <DetailRow label="Expiry Date" value={scan.expiryDate} />
        <DetailRow label="Category" value={scan.category} />
        <DetailRow label="Description" value={scan.description} />
        <DetailRow
          label="Front Check"
          value={`${scan.frontStatus || '—'} (${
            scan.frontConfidence != null
              ? scan.frontConfidence.toFixed(1) + '%'
              : '—'
          })`}
        />
        <DetailRow
          label="Back Check"
          value={`${scan.backStatus || '—'} (${
            scan.backConfidence != null
              ? scan.backConfidence.toFixed(1) + '%'
              : '—'
          })`}
        />
        <DetailRow
          label="Reported By"
          value={`${scan.reportedByName} (${
            scan.reportedByEmail || 'no email'
          })`}
        />
        <DetailRow
          label="Location"
          value={
            scan.latitude
              ? `${scan.latitude}, ${scan.longitude}`
              : 'Not available'
          }
        />
        <DetailRow
          label="Scanned At"
          value={new Date(scan.scannedAt).toLocaleString()}
        />

        <button
          className="btn-secondary"
          style={{ marginTop: 12 }}
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div
        style={{
          fontSize: 11,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: 0.3,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 14 }}>{value || '—'}</div>
    </div>
  );
}
