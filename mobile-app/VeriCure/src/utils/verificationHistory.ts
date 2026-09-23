/*
 * ============================================================
 * VERIFICATION HISTORY UTILITIES
 * ============================================================
 * Shared by HomeScreen (recent scans preview) and
 * SeeAllMedicinesScreen (full searchable history), so both
 * screens fetch and format scan data the same way.
 */

import { API_BASE_URL } from '../config/api';

export interface RawVerificationScan {
  id: number;
  medicineName: string;
  result: 'GENUINE' | 'COUNTERFEIT' | 'UNKNOWN' | string;
  frontStatus?: string;
  frontConfidence?: number;
  backStatus?: string;
  backConfidence?: number;
  manufacturer?: string;
  dosage?: string;
  batchNumber?: string;
  expiryDate?: string;
  category?: string;
  description?: string;
  scannedAt: string;
}

/*
 * Fetches the logged-in user's scan history.
 * Returns an empty array on any failure — callers should
 * treat "no history" and "fetch failed" the same way in the
 * UI (both just show an empty state), while this function
 * logs the real error for debugging.
 */
export async function fetchVerificationHistory(
  email: string,
): Promise<RawVerificationScan[]> {

  const normalizedEmail =
    typeof email === 'string'
      ? email.trim().toLowerCase()
      : '';

  if (!normalizedEmail) {
    return [];
  }

  try {

    const response =
      await fetch(
        API_BASE_URL +
          '/api/verification/history?email=' +
          encodeURIComponent(normalizedEmail),
        {
          method: 'GET',
        },
      );

    const responseText =
      await response.text();

    let data: any = null;

    try {
      data =
        responseText
          ? JSON.parse(responseText)
          : null;
    } catch {
      data = null;
    }

    if (
      !response.ok ||
      !data ||
      !data.success ||
      !Array.isArray(data.scans)
    ) {
      console.log(
        'Unable to load scan history:',
        data,
      );
      return [];
    }

    return data.scans as RawVerificationScan[];

  } catch (error) {

    console.log(
      'Fetch scan history error:',
      error,
    );

    return [];
  }
}

/*
 * Formats an ISO datetime string (e.g. from
 * LocalDateTime on the backend) into a short display date,
 * e.g. "20 Aug 2026".
 */
export function formatScanDate(
  isoString: string,
): string {

  if (!isoString) {
    return '';
  }

  try {
    const date = new Date(isoString);

    if (isNaN(date.getTime())) {
      return '';
    }

    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

  } catch {
    return '';
  }
}

/*
 * Maps a raw backend scan result into the simplified
 * genuine/not-genuine label used across list/badge UI.
 * UNKNOWN (low-confidence) results are treated as
 * "not confirmed authentic" for binary badge display,
 * matching how the verification result screen already
 * handles this case.
 */
export function isScanAuthentic(
  result: string,
): boolean {
  return (
    typeof result === 'string' &&
    result.toUpperCase() === 'GENUINE'
  );
}

/*
 * Maps a raw scan into the shape screens can pass forward
 * to MedicineDetailScreen (matches the field names that
 * screen already reads: batchNo/batchNumber, dosage/strength,
 * expiryDate, category, info/description).
 */
export function mapScanToMedicine(
  scan: RawVerificationScan,
): any {
  return {
    id: String(scan.id),
    name: scan.medicineName,
    isAuthentic: isScanAuthentic(scan.result),
    verdict: scan.result,

    manufacturer: scan.manufacturer,
    dosage: scan.dosage,
    batchNumber: scan.batchNumber,
    expiryDate: scan.expiryDate,
    category: scan.category,
    description: scan.description,

    scannedAt: scan.scannedAt,
    date: formatScanDate(scan.scannedAt),
  };
}
