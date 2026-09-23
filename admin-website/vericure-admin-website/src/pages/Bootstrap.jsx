import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiRequest } from '../api/client';
import { useToast } from '../components/Toast';
import PasswordStrengthMeter from '../components/PasswordStrengthMeter';

const RESEND_COOLDOWN_SECONDS = 30;

/*
 * One-time setup page — only ever works while the admins
 * table is completely empty (enforced server-side, re-checked
 * again at the verify step too). Visiting this page after
 * that point will simply show an error saying setup is
 * already complete.
 */

export default function Bootstrap() {
  const navigate = useNavigate();
  const toast = useToast();

  const [step, setStep] = useState(1);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const cooldownTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) {
        clearInterval(cooldownTimerRef.current);
      }
    };
  }, []);

  const startCooldown = () => {
    setResendCooldown(RESEND_COOLDOWN_SECONDS);

    cooldownTimerRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownTimerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (loading) return;

    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const { ok, data } = await apiRequest(
        '/api/admin/bootstrap/send-otp',
        {
          method: 'POST',
          body: JSON.stringify({ name, email }),
        }
      );

      if (ok && data && data.success) {
        toast.success('Verification code sent to your email');
        setStep(2);
        startCooldown();
      } else {
        const message = (data && data.message) || 'Unable to send code.';
        setError(message);
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (loading || resendCooldown > 0) return;

    setLoading(true);
    setError('');

    try {
      const { ok, data } = await apiRequest(
        '/api/admin/bootstrap/send-otp',
        {
          method: 'POST',
          body: JSON.stringify({ name, email }),
        }
      );

      if (ok && data && data.success) {
        toast.success('A new code has been sent');
        startCooldown();
      } else {
        toast.error((data && data.message) || 'Unable to resend code.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (loading) return;

    setError('');
    setLoading(true);

    try {
      const { ok, data } = await apiRequest('/api/admin/bootstrap/verify', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, otp }),
      });

      if (ok && data && data.success) {
        toast.success('Head Admin account created');
        navigate('/login');
      } else {
        const message = (data && data.message) || 'Setup failed.';
        setError(message);
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-logo">VeriCure</div>
        <div className="auth-tagline">
          {step === 1
            ? 'First-time setup — create the Head Admin'
            : 'Verify Your Email'}
        </div>

        {error && <div className="error-banner">{error}</div>}

        {step === 1 ? (
          <form onSubmit={handleSendOtp} autoComplete="off">
            <label className="field-label">Full Name</label>
            <input
              className="field-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="off"
              required
            />

            <label className="field-label">Email</label>
            <input
              className="field-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="off"
              required
            />

            <label className="field-label">
              Password (min. 8 characters)
            </label>
            <input
              className="field-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />

            <PasswordStrengthMeter password={password} />

            <label className="field-label">Confirm Password</label>
            <input
              className="field-input"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />

            <button className="btn-primary" disabled={loading}>
              {loading ? (
                <span className="btn-loading-content">
                  <span className="btn-spinner" aria-hidden="true" />
                  Sending Code...
                </span>
              ) : (
                'Send Verification Code'
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify}>
            <div
              style={{
                fontSize: 13,
                color: 'var(--text-secondary)',
                marginBottom: 18,
                lineHeight: 1.5,
              }}
            >
              We sent a 4-digit code to <strong>{email}</strong>.
              Enter it below to confirm this email is yours.
            </div>

            <label className="field-label">Verification Code</label>
            <input
              className="field-input"
              value={otp}
              onChange={(e) =>
                setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))
              }
              inputMode="numeric"
              maxLength={4}
              placeholder="0000"
              style={{
                letterSpacing: 6,
                fontSize: 20,
                textAlign: 'center',
                fontWeight: 700,
              }}
              required
              autoFocus
            />

            <button
              className="btn-primary"
              disabled={loading || otp.length !== 4}
            >
              {loading ? (
                <span className="btn-loading-content">
                  <span className="btn-spinner" aria-hidden="true" />
                  Verifying...
                </span>
              ) : (
                'Verify & Create Head Admin'
              )}
            </button>

            <button
              type="button"
              className="btn-secondary"
              style={{ marginTop: 10 }}
              onClick={handleResend}
              disabled={loading || resendCooldown > 0}
            >
              {resendCooldown > 0
                ? `Resend code in ${resendCooldown}s`
                : 'Resend Code'}
            </button>

            <button
              type="button"
              className="auth-switch"
              style={{
                background: 'none',
                border: 'none',
                width: '100%',
                marginTop: 14,
                cursor: 'pointer',
              }}
              onClick={() => {
                setStep(1);
                setOtp('');
                setError('');
              }}
            >
              ← Change email or name
            </button>
          </form>
        )}

        <div className="auth-switch">
          <Link to="/login">Back to login</Link>
        </div>
      </div>
    </div>
  );
}
