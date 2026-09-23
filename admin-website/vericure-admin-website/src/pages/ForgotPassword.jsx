import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiRequest } from '../api/client';
import { useToast } from '../components/Toast';
import PasswordStrengthMeter from '../components/PasswordStrengthMeter';

const RESEND_COOLDOWN_SECONDS = 30;

export default function ForgotPassword() {
  const navigate = useNavigate();
  const toast = useToast();

  // Step 1: enter email, request a code.
  // Step 2: enter code + new password.
  const [step, setStep] = useState(1);

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

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
    setLoading(true);

    try {
      const { ok, data } = await apiRequest(
        '/api/admin/forgot-password/send-otp',
        {
          method: 'POST',
          body: JSON.stringify({ email }),
        }
      );

      // The backend intentionally always returns success here
      // (whether or not the email is a real admin account), so
      // this page can't be used to check which emails exist.
      if (ok && data && data.success) {
        toast.success(data.message || 'Check your email for a code');
        setStep(2);
        startCooldown();
      } else {
        const message = (data && data.message) || 'Something went wrong.';
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

    try {
      await apiRequest('/api/admin/forgot-password/send-otp', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });

      toast.success('A new code has been sent, if that email exists');
      startCooldown();
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (loading) return;

    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const { ok, data } = await apiRequest(
        '/api/admin/forgot-password/reset',
        {
          method: 'POST',
          body: JSON.stringify({ email, otp, newPassword }),
        }
      );

      if (ok && data && data.success) {
        toast.success(data.message || 'Password reset successfully');
        navigate('/login');
      } else {
        const message = (data && data.message) || 'Reset failed.';
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
          {step === 1 ? 'Reset Your Password' : 'Enter New Password'}
        </div>

        {error && <div className="error-banner">{error}</div>}

        {step === 1 ? (
          <form onSubmit={handleSendOtp} autoComplete="off">
            <div
              style={{
                fontSize: 13,
                color: 'var(--text-secondary)',
                marginBottom: 18,
                lineHeight: 1.5,
              }}
            >
              Enter the email on your admin account and we'll send
              you a verification code to reset your password.
            </div>

            <label className="field-label">Email</label>
            <input
              className="field-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="off"
              required
            />

            <button className="btn-primary" disabled={loading}>
              {loading ? (
                <span className="btn-loading-content">
                  <span className="btn-spinner" aria-hidden="true" />
                  Sending Code...
                </span>
              ) : (
                'Send Reset Code'
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleReset}>
            <div
              style={{
                fontSize: 13,
                color: 'var(--text-secondary)',
                marginBottom: 18,
                lineHeight: 1.5,
              }}
            >
              If <strong>{email}</strong> is a valid approved admin
              account, a code was sent to it.
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
                marginBottom: 18,
              }}
              required
              autoFocus
            />

            <label className="field-label">
              New Password (min. 8 characters)
            </label>
            <input
              className="field-input"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />

            <PasswordStrengthMeter password={newPassword} />

            <label className="field-label">Confirm New Password</label>
            <input
              className="field-input"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />

            <button
              className="btn-primary"
              disabled={loading || otp.length !== 4}
            >
              {loading ? (
                <span className="btn-loading-content">
                  <span className="btn-spinner" aria-hidden="true" />
                  Resetting...
                </span>
              ) : (
                'Reset Password'
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
              ← Use a different email
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
