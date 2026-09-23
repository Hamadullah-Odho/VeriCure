/**
 * ============================================================
 * EXPIRY DATE UTILITY
 * ============================================================
 *
 * Cabinet medicines store expiryDate as a plain string. Going
 * forward, CabinetMedicineFormScreen collects this via a
 * Month/Year picker and always saves it in the "MM/YYYY" format
 * (e.g. "03/2027") — this matches how medicine packaging
 * actually prints expiry dates (month + year, rarely a specific
 * day).
 *
 * Older entries saved before the picker existed may still be
 * free text in other formats (the old placeholder suggested
 * both "12/2027" and "2027-12-31"), or the literal string
 * "Not available" when nothing was found/entered. This utility
 * tries the new standard format first, then falls back to a
 * few common alternatives for backward compatibility, and
 * returns null (rather than guessing) for anything it can't
 * confidently parse — an unparseable date should be skipped by
 * the reminder feature, not silently misinterpreted.
 *
 * ============================================================
 */

export interface ExpiryStatus {
  expiryDate: Date;
  daysUntil: number;      // negative if already expired
  isExpired: boolean;
  isUrgent: boolean;      // expires within 7 days (not yet expired)
  isUpcoming: boolean;    // expires within 30 days (not yet expired/urgent)
}

const MONTH_NAMES: { [key: string]: number } = {
  jan: 0, january: 0,
  feb: 1, february: 1,
  mar: 2, march: 2,
  apr: 3, april: 3,
  may: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, sept: 8, september: 8,
  oct: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, december: 11,
};

/**
 * Returns the LAST day of the given month/year — a medicine
 * printed as expiring "03/2027" is safe to use up through the
 * end of March 2027, not just the 1st.
 */
function lastDayOfMonth(year: number, monthIndexZeroBased: number): Date {
  // Day 0 of the *next* month = the last day of this month.
  return new Date(year, monthIndexZeroBased + 1, 0);
}

export function parseExpiryDate(raw: string | null | undefined): Date | null {
  if (!raw || typeof raw !== 'string') {
    return null;
  }

  const trimmed = raw.trim();

  if (
    trimmed.length === 0 ||
    trimmed.toLowerCase() === 'not available' ||
    trimmed.toLowerCase() === 'unknown'
  ) {
    return null;
  }

  // ---------------------------------------------------------
  // 1. "MM/YYYY" — the new standard format from the picker.
  // ---------------------------------------------------------
  let match = trimmed.match(/^(\d{1,2})\/(\d{4})$/);
  if (match) {
    const month = parseInt(match[1], 10);
    const year = parseInt(match[2], 10);
    if (month >= 1 && month <= 12) {
      return lastDayOfMonth(year, month - 1);
    }
  }

  // ---------------------------------------------------------
  // 2. "YYYY-MM-DD" or "YYYY-MM" — ISO-ish, sometimes what
  //    Gemini extracts directly off packaging text.
  // ---------------------------------------------------------
  match = trimmed.match(/^(\d{4})-(\d{1,2})(?:-(\d{1,2}))?$/);
  if (match) {
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const day = match[3] ? parseInt(match[3], 10) : null;
    if (month >= 1 && month <= 12) {
      return day
        ? new Date(year, month - 1, day)
        : lastDayOfMonth(year, month - 1);
    }
  }

  // ---------------------------------------------------------
  // 3. "DD/MM/YYYY" — only trusted when the first number can't
  //    possibly be a month (i.e. > 12), since "03/04/2027" is
  //    genuinely ambiguous and we'd rather skip it than guess
  //    wrong for something safety-related.
  // ---------------------------------------------------------
  match = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (match) {
    const first = parseInt(match[1], 10);
    const second = parseInt(match[2], 10);
    const year = parseInt(match[3], 10);
    if (first > 12 && second >= 1 && second <= 12) {
      // Unambiguous day/month order.
      return new Date(year, second - 1, first);
    }
    if (second > 12 && first >= 1 && first <= 12) {
      // Unambiguous month/day order.
      return new Date(year, first - 1, second);
    }
    // Both <= 12 — genuinely ambiguous, skip rather than guess.
  }

  // ---------------------------------------------------------
  // 4. Month name formats: "Dec 2027", "December 2027".
  // ---------------------------------------------------------
  match = trimmed
    .toLowerCase()
    .match(/^([a-z]+)\.?\s+(\d{4})$/);
  if (match) {
    const monthIndex = MONTH_NAMES[match[1]];
    const year = parseInt(match[2], 10);
    if (monthIndex !== undefined) {
      return lastDayOfMonth(year, monthIndex);
    }
  }

  // Genuinely couldn't parse it — better to skip than guess.
  return null;
}

export function formatMonthYear(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${month}/${year}`;
}

export function getExpiryStatus(raw: string | null | undefined): ExpiryStatus | null {
  const expiryDate = parseExpiryDate(raw);

  if (!expiryDate) {
    return null;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const msPerDay = 1000 * 60 * 60 * 24;
  const daysUntil = Math.round(
    (expiryDate.getTime() - today.getTime()) / msPerDay
  );

  return {
    expiryDate,
    daysUntil,
    isExpired: daysUntil < 0,
    isUrgent: daysUntil >= 0 && daysUntil <= 7,
    isUpcoming: daysUntil > 7 && daysUntil <= 30,
  };
}
