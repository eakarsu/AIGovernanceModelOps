import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/api';

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('compliance@aigov.io');
  const [password, setPassword] = useState('audit123');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      if (onLogin) onLogin();
      navigate('/');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-shell">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-brand">AI Governance · ModelOps</div>
        <div className="login-sub">EU AI Act · NIST AI RMF · ISO/IEC 42001</div>

        <div className="form-group" style={{ marginTop: 16 }}>
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
        </div>
        <div className="form-group" style={{ marginTop: 10 }}>
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>

        {error && <div className="ai-error" style={{ marginTop: 10 }}>{error}</div>}

        <button className="btn" type="submit" disabled={loading} style={{ marginTop: 16, width: '100%' }}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>

        <div className="login-hint">
          Demo credentials pre-filled: <code>compliance@aigov.io</code> / <code>audit123</code><br/>
          Also try: <code>admin@aigov.io</code> / <code>admin123</code><br/>
          <code>officer@aigov.io</code> / <code>officer123</code><br/>
          <code>auditor@aigov.io</code> / <code>auditor123</code> (read-only)
        </div>
      </form>
    </div>
  );
}
