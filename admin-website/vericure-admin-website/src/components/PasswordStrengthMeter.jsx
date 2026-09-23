import React from 'react';

/*
 * Simple, dependency-free strength scoring — not trying to be
 * a full zxcvbn-style analysis, just enough to nudge people
 * away from "password1" and toward something with a bit more
 * variety. Used everywhere a NEW password is being set:
 * Signup, Bootstrap, Forgot Password, and Change Password.
 */

export function scorePassword(password) {
  if (!password) return 0;

  let score = 0;

  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  return Math.min(score, 4);
}

const LABELS = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
const COLORS = [
  'var(--danger)',
  'var(--danger)',
  'var(--warning)',
  'var(--primary)',
  'var(--success)',
];

export default function PasswordStrengthMeter({ password }) {
  if (!password) return null;

  const score = scorePassword(password);

  return (
    <div style={{ marginTop: -10, marginBottom: 18 }}>
      <div
        style={{
          display: 'flex',
          gap: 4,
          marginBottom: 4,
        }}
      >
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              height: 4,
              flex: 1,
              borderRadius: 2,
              background:
                i < score ? COLORS[score] : 'var(--border)',
              transition: 'background .2s ease',
            }}
          />
        ))}
      </div>
      <div
        style={{
          fontSize: 11,
          color: COLORS[score],
          fontWeight: 600,
        }}
      >
        {LABELS[score]}
        {score < 3 && (
          <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>
            {' '}
            — try adding a number, a capital letter, or a symbol
          </span>
        )}
      </div>
    </div>
  );
}
