import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import LeafLogo from './LeafLogo.jsx';

export default function OwnerHeader({ title, back }) {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate('/');
  }

  return (
    <header className="bg-navy text-white shadow-md sticky top-0 z-30">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {back ? (
            <button onClick={() => navigate(back)} className="text-white/50 hover:text-white mr-1">
              <ChevronLeft />
            </button>
          ) : null}
          <Link to="/dashboard" className="flex items-center gap-2.5">
            <LeafLogo />
            <span className="font-serif text-xl font-semibold">Heirloom</span>
          </Link>
          {title && (
            <>
              <span className="text-white/30 hidden sm:block">›</span>
              <span className="text-white/70 text-base hidden sm:block truncate max-w-xs">{title}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span className="text-white/40 text-sm hidden sm:block truncate max-w-[160px]">{user?.email}</span>
          <button
            onClick={handleSignOut}
            className="text-white/60 hover:text-white text-sm font-medium transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}

function ChevronLeft() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
    </svg>
  );
}
