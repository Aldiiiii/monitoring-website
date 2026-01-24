import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setToken } from '../lib/auth';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Login failed');
      }

      const data = (await response.json()) as { accessToken: string };
      setToken(data.accessToken);
      navigate('/', { replace: true });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <header className="header">
        <span className="badge">Auth</span>
        <h1>Login</h1>
        <p>Masuk untuk mengakses dashboard monitoring.</p>
      </header>

      <section className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>
          </div>
          {error && <div className="empty">{error}</div>}
          <div className="footer-actions">
            <button className="button" type="submit" disabled={loading}>
              {loading ? 'Signing in...' : 'Login'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
