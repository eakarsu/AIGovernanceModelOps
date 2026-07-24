import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/api';

const demoPassword = process.env.REACT_APP_ENABLE_DEMO_CREDENTIAL_AUTOFILL === 'true'
  ? process.env.REACT_APP_DEMO_PASSWORD || ''
  : '';
const demoAccounts = [
  ['Compliance', 'compliance@aigov.invalid'],
  ['Admin', 'admin@aigov.invalid'],
  ['Officer', 'officer@aigov.invalid'],
  ['Auditor', 'auditor@aigov.invalid'],
];

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
          <div>Quick demo login:</div>
          {demoAccounts.map(([label, accountEmail]) => (
            <button
              key={accountEmail}
              type="button"
              className="btn"
              disabled={!demoPassword}
              onClick={() => {
                setEmail(accountEmail);
                setPassword(demoPassword);
              }}
              style={{ margin: '6px 4px 0 0' }}
            >
              {label}
            </button>
          ))}
        </div>
      </form>
    </div>
  );
}
