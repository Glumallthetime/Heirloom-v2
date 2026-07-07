import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import AuthLayout from './AuthLayout.jsx';

export default function LoginPage() {
  const { signIn }   = useAuth();
  const navigate     = useNavigate();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) { setError(error.message); setLoading(false); return; }
    navigate('/dashboard');
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to manage your estates"
      footer={<>Don't have an account? <Link to="/signup" className="text-navy font-semibold hover:underline">Sign up</Link></>}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" />
        <Field label="Password" type="password" value={password} onChange={setPassword} placeholder="••••••••" />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-navy text-white font-semibold text-base hover:bg-navy-light transition-colors disabled:opacity-50"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </AuthLayout>
  );
}

function Field({ label, type, value, onChange, placeholder }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-navy/60 uppercase tracking-wide mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required
        className="w-full px-4 py-3 border border-cream-dark rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-gold/50 placeholder-navy/30"
      />
    </div>
  );
}
