import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { apiRequest } from '../api/client';
import { useToast } from '../components/Toast';
import AnimatedNumber from '../components/AnimatedNumber';
import { SkeletonStatCards, SkeletonPanel, SkeletonTableRows } from '../components/Skeleton';

const formatNumber = (value) =>
  new Intl.NumberFormat().format(Number(value || 0));

export default function Dashboard() {
  const toast = useToast();
  const [stats, setStats] = useState(null);
  const [recentCounterfeits, setRecentCounterfeits] = useState([]);
  const [trendScans, setTrendScans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);

    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
      const fromParam = thirtyDaysAgo.toISOString().split('T')[0];

      const [statsResult, scansResult, trendResult] = await Promise.all([
        apiRequest('/api/admin/dashboard-stats'),
        apiRequest('/api/admin/scans?result=COUNTERFEIT'),
        apiRequest(`/api/admin/scans?from=${fromParam}`),
      ]);

      if (statsResult.ok) {
        setStats(statsResult.data);
      } else {
        toast.error('Failed to load dashboard statistics');
      }

      if (scansResult.ok) {
        setRecentCounterfeits(scansResult.data || []);
      } else {
        toast.error('Failed to load counterfeit detections');
      }

      if (trendResult.ok) {
        setTrendScans(trendResult.data || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const total = Number(stats?.totalScans || 0);
  const genuine = Number(stats?.genuineCount || 0);
  const counterfeit = Number(stats?.counterfeitCount || 0);
  const unknown = Number(stats?.unknownCount || 0);

  const percentages = useMemo(() => {
    if (!total) return { genuine: 0, counterfeit: 0, unknown: 0 };
    return {
      genuine: Math.round((genuine / total) * 100),
      counterfeit: Math.round((counterfeit / total) * 100),
      unknown: Math.round((unknown / total) * 100),
    };
  }, [total, genuine, counterfeit, unknown]);

  const activity = [
    { label: 'All time', value: counterfeit },
    { label: 'Last 30 days', value: Number(stats?.counterfeitLast30Days || 0) },
    { label: 'Last 7 days', value: Number(stats?.counterfeitLast7Days || 0) },
  ];
  const activityMax = Math.max(...activity.map((item) => item.value), 1);

  // ---------------------------------------------------------
  // 30-DAY TREND — daily genuine/counterfeit/unknown counts,
  // built client-side from the last 30 days of scans rather
  // than a new backend endpoint, since the data's already a
  // single fetch away via the existing /api/admin/scans
  // search endpoint.
  // ---------------------------------------------------------

  const trendDays = useMemo(() => {
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push({
        key: d.toISOString().split('T')[0],
        label: d.toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
        }),
        genuine: 0,
        counterfeit: 0,
        unknown: 0,
      });
    }

    const byKey = Object.fromEntries(days.map((d) => [d.key, d]));

    trendScans.forEach((scan) => {
      if (!scan.scannedAt) return;
      const key = scan.scannedAt.split('T')[0];
      const bucket = byKey[key];
      if (!bucket) return;

      const result = (scan.result || 'UNKNOWN').toUpperCase();
      if (result === 'GENUINE') bucket.genuine += 1;
      else if (result === 'COUNTERFEIT') bucket.counterfeit += 1;
      else bucket.unknown += 1;
    });

    return days;
  }, [trendScans]);

  const trendMax = Math.max(
    ...trendDays.map((d) => d.genuine + d.counterfeit + d.unknown),
    1
  );

  const withLocation = recentCounterfeits.filter(
    (s) => s.latitude != null && s.longitude != null
  );

  const mapCenter =
    withLocation.length > 0
      ? [withLocation[0].latitude, withLocation[0].longitude]
      : [30.3753, 69.3451];

  return (
    <div>
      <div className="page-header dashboard-header">
        <div>
          <div className="page-kicker">VERICURE ADMIN</div>
          <div className="page-title">Dashboard</div>
          <div className="page-subtitle">
            Monitor medicine verification activity and counterfeit risk.
          </div>
        </div>
        <button className="btn-small primary refresh-btn" onClick={loadData} disabled={loading}>
          {loading ? (
            <span className="btn-loading-content">
              <span className="btn-spinner" aria-hidden="true" />
              Refreshing...
            </span>
          ) : (
            '↻ Refresh data'
          )}
        </button>
      </div>

      {loading && !stats ? (
        <>
          <SkeletonStatCards count={4} />
          <div className="dashboard-grid">
            <SkeletonPanel height={215} />
            <SkeletonPanel height={215} />
          </div>
          <SkeletonPanel height={200} />
        </>
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat-card featured stagger-item" style={{ animationDelay: '0ms' }}>
              <div className="stat-top"><span className="stat-icon">⌁</span><span>All activity</span></div>
              <div className="stat-value"><AnimatedNumber value={total} /></div>
              <div className="stat-label">Total Scans</div>
            </div>

            <div className="stat-card success stagger-item" style={{ animationDelay: '60ms' }}>
              <div className="stat-top"><span className="stat-icon">✓</span><span>Verified</span></div>
              <div className="stat-value"><AnimatedNumber value={genuine} /></div>
              <div className="stat-label">Genuine medicines</div>
            </div>

            <div className="stat-card danger stagger-item" style={{ animationDelay: '120ms' }}>
              <div className="stat-top"><span className="stat-icon">!</span><span>Risk</span></div>
              <div className="stat-value"><AnimatedNumber value={counterfeit} /></div>
              <div className="stat-label">Counterfeit detections</div>
            </div>

            <div className="stat-card warning stagger-item" style={{ animationDelay: '180ms' }}>
              <div className="stat-top"><span className="stat-icon">?</span><span>Review</span></div>
              <div className="stat-value"><AnimatedNumber value={unknown} /></div>
              <div className="stat-label">Unknown / uncertain</div>
            </div>
          </div>

          <div className="dashboard-grid">
            <div className="panel chart-panel stagger-item" style={{ animationDelay: '240ms' }}>
              <div className="panel-heading">
                <div>
                  <div className="panel-title">Verification distribution</div>
                  <div className="panel-subtitle">Current scan results across the platform</div>
                </div>
              </div>

              <div className="distribution-content">
                <div
                  className="donut-chart"
                  style={{
                    background: `conic-gradient(#22C55E 0 ${percentages.genuine}%, #EF4444 ${percentages.genuine}% ${percentages.genuine + percentages.counterfeit}%, #F59E0B ${percentages.genuine + percentages.counterfeit}% 100%)`,
                  }}
                >
                  <div className="donut-hole">
                    <strong>{formatNumber(total)}</strong>
                    <span>Total</span>
                  </div>
                </div>

                <div className="legend-list">
                  <div className="legend-item"><span className="legend-dot genuine-dot" /><div><strong>Genuine</strong><small>{percentages.genuine}% · {formatNumber(genuine)}</small></div></div>
                  <div className="legend-item"><span className="legend-dot counterfeit-dot" /><div><strong>Counterfeit</strong><small>{percentages.counterfeit}% · {formatNumber(counterfeit)}</small></div></div>
                  <div className="legend-item"><span className="legend-dot unknown-dot" /><div><strong>Unknown</strong><small>{percentages.unknown}% · {formatNumber(unknown)}</small></div></div>
                </div>
              </div>
            </div>

            <div className="panel chart-panel stagger-item" style={{ animationDelay: '300ms' }}>
              <div className="panel-heading">
                <div>
                  <div className="panel-title">Counterfeit activity</div>
                  <div className="panel-subtitle">Detection volume by reporting period</div>
                </div>
              </div>

              <div className="bar-chart">
                {activity.map((item) => (
                  <div className="bar-column" key={item.label}>
                    <div className="bar-value">{formatNumber(item.value)}</div>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ height: `${Math.max((item.value / activityMax) * 100, item.value ? 8 : 2)}%` }} />
                    </div>
                    <div className="bar-label">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="panel chart-panel stagger-item" style={{ animationDelay: '270ms' }}>
            <div className="panel-heading">
              <div>
                <div className="panel-title">30-day scan trend</div>
                <div className="panel-subtitle">Daily verification volume by result</div>
              </div>
            </div>

            <div className="trend-chart">
              {trendDays.map((day) => (
                <div className="trend-column" key={day.key} title={`${day.label}: ${day.genuine + day.counterfeit + day.unknown} scans`}>
                  <div className="trend-track">
                    <div
                      className="trend-segment trend-segment-genuine"
                      style={{ height: `${(day.genuine / trendMax) * 100}%` }}
                    />
                    <div
                      className="trend-segment trend-segment-counterfeit"
                      style={{ height: `${(day.counterfeit / trendMax) * 100}%` }}
                    />
                    <div
                      className="trend-segment trend-segment-unknown"
                      style={{ height: `${(day.unknown / trendMax) * 100}%` }}
                    />
                  </div>
                  <div className="trend-label">{day.label.split(' ')[1]}</div>
                </div>
              ))}
            </div>

            <div className="trend-legend">
              <span><span className="trend-legend-dot" style={{ background: '#22C55E' }} />Genuine</span>
              <span><span className="trend-legend-dot" style={{ background: '#EF4444' }} />Counterfeit</span>
              <span><span className="trend-legend-dot" style={{ background: '#F59E0B' }} />Unknown</span>
            </div>
          </div>

          <div className="insight-strip stagger-item" style={{ animationDelay: '340ms' }}>
            <div>
              <span className="insight-label">COUNTERFEIT RATE</span>
              <strong>{total ? ((counterfeit / total) * 100).toFixed(1) : '0.0'}%</strong>
            </div>
            <div>
              <span className="insight-label">LAST 7 DAYS</span>
              <strong>{formatNumber(stats?.counterfeitLast7Days)}</strong>
            </div>
            <div>
              <span className="insight-label">LAST 30 DAYS</span>
              <strong>{formatNumber(stats?.counterfeitLast30Days)}</strong>
            </div>
            <div className="insight-note">
              Keep an eye on counterfeit detections and their geographic concentration below.
            </div>
          </div>

          <div className="panel stagger-item" style={{ animationDelay: '380ms' }}>
            <div className="panel-heading">
              <div>
                <div className="panel-title">Counterfeit detection map</div>
                <div className="panel-subtitle">
                  Geographic distribution of detections with available location data
                </div>
              </div>
              <span className="panel-count">{withLocation.length} mapped</span>
            </div>

            <div className="map-wrapper">
              <MapContainer center={mapCenter} zoom={withLocation.length > 0 ? 6 : 4} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution="&copy; OpenStreetMap contributors"
                />
                {withLocation.map((scan) => (
                  <Marker key={scan.id} position={[scan.latitude, scan.longitude]}>
                    <Popup>
                      <strong>{scan.medicineName}</strong><br />
                      {scan.manufacturer || 'Unknown manufacturer'}<br />
                      Batch: {scan.batchNumber || 'N/A'}<br />
                      {new Date(scan.scannedAt).toLocaleString()}
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </div>

          <div className="panel stagger-item" style={{ animationDelay: '420ms' }}>
            <div className="panel-heading">
              <div>
                <div className="panel-title">Recent counterfeit detections</div>
                <div className="panel-subtitle">Latest records requiring administrator attention</div>
              </div>
              <span className="panel-count">{recentCounterfeits.length} records</span>
            </div>

            {recentCounterfeits.length === 0 ? (
              <div className="empty-state">No counterfeit detections yet.</div>
            ) : (
              <div className="table-scroll">
                <table className="data-table">
                  <thead>
                    <tr><th>Medicine</th><th>Manufacturer</th><th>Batch #</th><th>Reported By</th><th>Location</th><th>Date</th></tr>
                  </thead>
                  <tbody>
                    {recentCounterfeits.slice(0, 10).map((scan, idx) => (
                      <tr key={scan.id} className="table-row-enter" style={{ animationDelay: `${idx * 30}ms` }}>
                        <td><strong>{scan.medicineName}</strong></td>
                        <td>{scan.manufacturer || '—'}</td>
                        <td>{scan.batchNumber || '—'}</td>
                        <td>{scan.reportedByName}</td>
                        <td>{scan.locationAddress || (scan.latitude != null ? `${scan.latitude.toFixed(3)}, ${scan.longitude.toFixed(3)}` : '—')}</td>
                        <td>{new Date(scan.scannedAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
