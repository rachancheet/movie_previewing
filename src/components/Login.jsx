import React, { useState } from 'react';

const Login = ({ onLogin, loading }) => {
  const [passcode, setPasscode] = useState('');

  const handleChange = (e) => {
    setPasscode(e.target.value);
    if (e.target.value.length === 4) {
      onLogin(e.target.value);
    }
  };

  return (
    <div className="passcode-container">
      <div className="glass-panel" style={{ padding: '50px', textAlign: 'center' }}>
        <h1 className="passcode-title" style={{ color: 'var(--primary-color)' }}>Access Required</h1>
        <p style={{ marginBottom: '20px', color: 'var(--text-secondary)' }}>
          Enter 4-digit passcode to view reminders
        </p>
        <input
          type="password"
          maxLength={4}
          className="passcode-input"
          value={passcode}
          onChange={handleChange}
          disabled={loading}
          autoFocus
          placeholder="••••"
        />
        {loading && <p style={{ marginTop: '20px', color: 'var(--secondary-color)' }}>Authenticating...</p>}
      </div>
    </div>
  );
};

export default Login;
