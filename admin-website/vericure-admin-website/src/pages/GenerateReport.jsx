import React, { useState } from 'react';
import { apiRequest } from '../api/client';
import { useToast } from '../components/Toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function GenerateReport() {
  const toast = useToast();
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [resultFilter, setResultFilter] = useState('COUNTERFEIT');
  const [loading, setLoading] = useState(false);
  const [scans, setScans] = useState(null);

  const runReport = async () => {
    setLoading(true);

    try {
      const params = new URLSearchParams();
      if (resultFilter) params.set('result', resultFilter);
      if (fromDate) params.set('from', fromDate);
      if (toDate) params.set('to', toDate);

      const { ok, data } = await apiRequest(
        `/api/admin/scans?${params.toString()}`
      );

      if (ok) {
        setScans(data || []);
      } else {
        toast.error('Failed to generate report preview');
      }
    } finally {
      setLoading(false);
    }
  };

  const downloadPdf = () => {
    if (!scans || scans.length === 0) return;

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'pt',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const generatedAt = new Date();

    // ------------------------------------------------------
    // HEADER
    // ------------------------------------------------------

    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(16, 122, 87); // VeriCure primary green
    doc.text('VeriCure', 40, 44);

    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(60, 60, 60);
    doc.text('Medicine Verification Report', 40, 62);

    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);

    const filterLabel = resultFilter
      ? resultFilter.charAt(0) + resultFilter.slice(1).toLowerCase()
      : 'All results';

    const rangeLabel =
      fromDate || toDate
        ? `${fromDate || 'earliest'} to ${toDate || 'latest'}`
        : 'All time';

    doc.text(
      `Filter: ${filterLabel}  |  Range: ${rangeLabel}  |  Generated: ${generatedAt.toLocaleString()}`,
      40,
      78
    );

    doc.setDrawColor(220, 220, 220);
    doc.line(40, 88, pageWidth - 40, 88);

    // ------------------------------------------------------
    // SUMMARY COUNTS
    // ------------------------------------------------------

    const counts = scans.reduce((acc, s) => {
      const key = (s.result || 'UNKNOWN').toUpperCase();
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.text(
      `Total: ${scans.length}   |   Genuine: ${counts.GENUINE || 0}   |   Counterfeit: ${counts.COUNTERFEIT || 0}   |   Unknown: ${counts.UNKNOWN || 0}`,
      40,
      104
    );

    // ------------------------------------------------------
    // TABLE
    // ------------------------------------------------------

    const head = [[
      'Medicine Name',
      'Result',
      'Manufacturer',
      'Batch Number',
      'Expiry Date',
      'Reported By',
      'Location',
      'Scanned At',
    ]];

    const body = scans.map((s) => [
      s.medicineName || '—',
      s.result || '—',
      s.manufacturer || '—',
      s.batchNumber || '—',
      s.expiryDate || '—',
      s.reportedByName || (s.isGuestScan ? 'Guest' : '—'),
      s.locationAddress ||
        (s.latitude != null && s.longitude != null
          ? `${s.latitude.toFixed(4)}, ${s.longitude.toFixed(4)}`
          : '—'),
      s.scannedAt ? new Date(s.scannedAt).toLocaleString() : '—',
    ]);

    autoTable(doc, {
      head,
      body,
      startY: 116,
      margin: { left: 40, right: 40 },
      styles: {
        fontSize: 8,
        cellPadding: 5,
      },
      headStyles: {
        fillColor: [16, 122, 87],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [247, 250, 249],
      },
      columnStyles: {
        1: { fontStyle: 'bold' },
      },
      didParseCell: (data) => {
        // Color the Result column by value for quick scanning.
        if (data.section === 'body' && data.column.index === 1) {
          const value = String(data.cell.raw).toUpperCase();
          if (value === 'COUNTERFEIT') {
            data.cell.styles.textColor = [220, 38, 38];
          } else if (value === 'GENUINE') {
            data.cell.styles.textColor = [16, 122, 87];
          } else {
            data.cell.styles.textColor = [180, 140, 20];
          }
        }
      },
      didDrawPage: (data) => {
        const pageCount = doc.internal.getNumberOfPages();
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `Page ${doc.internal.getCurrentPageInfo().pageNumber} of ${pageCount}`,
          pageWidth - 100,
          doc.internal.pageSize.getHeight() - 20
        );
      },
    });

    doc.save(
      `vericure-report-${generatedAt.toISOString().split('T')[0]}.pdf`
    );

    toast.success('Report downloaded successfully');
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Generate Report</div>
          <div className="page-subtitle">
            Export scan data for regulatory authorities
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-title">Report Filters</div>

        <div className="filters-row">
          <select
            className="field-input"
            value={resultFilter}
            onChange={(e) => setResultFilter(e.target.value)}
          >
            <option value="">All Results</option>
            <option value="COUNTERFEIT">Counterfeit Only</option>
            <option value="GENUINE">Genuine Only</option>
            <option value="UNKNOWN">Unknown Only</option>
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

          <button
            className="btn-small primary"
            onClick={runReport}
            disabled={loading}
          >
            {loading ? (
              <span className="btn-loading-content">
                <span className="btn-spinner" aria-hidden="true" />
                Loading...
              </span>
            ) : (
              'Preview Report'
            )}
          </button>
        </div>

        {scans !== null && (
          <>
            <div style={{ margin: '16px 0', fontSize: 14 }}>
              <strong>{scans.length}</strong> matching record
              {scans.length === 1 ? '' : 's'} found.
            </div>

            {scans.length > 0 && (
              <button
                className="btn-primary"
                style={{ width: 'auto', padding: '10px 20px' }}
                onClick={downloadPdf}
              >
                ⬇ Download PDF
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
