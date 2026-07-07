import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import AuthLayout from './AuthLayout.jsx';

export default function SignupPage() {
  const { signUp } = useAuth();
  const navigate   = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [done, setDone]         = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setLoading(true);
    const { error } = await signUp(email, password, fullName);
    if (error) { setError(error.message); setLoading(false); return; }
    setDone(true);
  }

  if (done) {
    return (
      <AuthLayout title="Check your email" subtitle="We sent you a confirmation link to activate your account.">
        <div className="text-center py-4">
          <p className="text-navy/70 text-base leading-relaxed mb-6">
            Once confirmed, come back and sign in to start your first estate.
          </p>
          <Link to="/login" className="text-navy font-semibold hover:underline text-base">
            Go to sign in →
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Free during beta — no credit card required"
      footer={<>Already have an account? <Link to="/login" className="text-navy font-semibold hover:underline">Sign in</Link></>}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Full name"  type="text"     value={fullName}  onChange={setFullName}  placeholder="Your name" />
        <Field label="Email"      type="email"    value={email}     onChange={setEmail}     placeholder="you@example.com" />
        <Field label="Password"   type="password" value={password}  onChange={setPassword}  placeholder="At least 8 characters" />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-navy text-white font-semibold text-base hover:bg-navy-light transition-colors disabled:opacity-50"
        >
          {loading ? 'Creating account…' : 'Create account'}
        </button>
        <p className="text-xs text-navy/40 text-center leading-relaxed">
          By signing up you agree to use Heirloom responsibly and acknowledge that it is a decision-support tool, not a legal instrument.
        </p>
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
