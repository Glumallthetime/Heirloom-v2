import { Link } from 'react-router-dom';
import LeafLogo from '../components/shared/LeafLogo.jsx';

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <Link to="/" className="flex items-center gap-2.5 mb-2">
            <LeafLogo size={36} />
            <span className="font-serif text-2xl font-semibold text-navy">Heirloom</span>
          </Link>
          <h1 className="font-serif text-xl font-semibold text-navy mt-3">{title}</h1>
          {subtitle && <p className="text-navy/50 text-sm mt-1 text-center">{subtitle}</p>}
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-card border border-cream-dark p-6">
          {children}
        </div>

        {/* Footer link */}
        {footer && <p className="text-center text-sm text-navy/50 mt-4">{footer}</p>}
      </div>
    </div>
  );
}
