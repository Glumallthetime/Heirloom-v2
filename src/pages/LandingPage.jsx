import { Link } from 'react-router-dom';
import LeafLogo from '../components/shared/LeafLogo.jsx';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* Nav */}
      <nav className="px-6 py-4 flex items-center justify-between max-w-screen-xl mx-auto w-full">
        <div className="flex items-center gap-2.5">
          <LeafLogo size={28} />
          <span className="font-serif text-xl font-semibold text-navy">Heirloom</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login"  className="text-navy/60 hover:text-navy text-base font-medium transition-colors">Sign in</Link>
          <Link to="/signup" className="bg-navy text-white px-4 py-2 rounded-xl text-base font-semibold hover:bg-navy-light transition-colors">Get started</Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
        <div className="max-w-2xl">
          <div className="flex justify-center mb-6">
            <LeafLogo size={56} />
          </div>
          <h1 className="font-serif text-5xl sm:text-6xl font-semibold text-navy leading-tight mb-6">
            A fair way to share<br />what matters most
          </h1>
          <p className="text-navy/60 text-xl leading-relaxed mb-10 max-w-xl mx-auto">
            Heirloom helps families distribute personal property peacefully —
            through a private, transparent process that respects everyone's wishes.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/signup"
              className="bg-navy text-white px-8 py-3.5 rounded-xl text-lg font-semibold hover:bg-navy-light transition-colors shadow-card"
            >
              Create your estate
            </Link>
            <Link
              to="/login"
              className="border border-navy/20 text-navy px-8 py-3.5 rounded-xl text-lg font-semibold hover:border-navy/40 transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>
      </main>

      {/* How it works — three steps */}
      <section className="bg-white border-t border-cream-dark py-16 px-6">
        <div className="max-w-screen-lg mx-auto">
          <h2 className="font-serif text-3xl font-semibold text-navy text-center mb-12">How it works</h2>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { n: '1', title: 'Catalogue your estate', body: 'Upload photos and descriptions of your items. Organise by room and category.' },
              { n: '2', title: 'Share with family',     body: 'Send a private link to family members. They browse, wishlist, and rank what matters to them — privately.' },
              { n: '3', title: 'Review and resolve',    body: 'See who wants what. Uncontested items assign easily. Conflicts are flagged for a fair conversation.' },
            ].map((s) => (
              <div key={s.n} className="text-center">
                <div className="w-12 h-12 rounded-full bg-navy text-white text-xl font-bold font-serif flex items-center justify-center mx-auto mb-4">
                  {s.n}
                </div>
                <h3 className="font-serif text-lg font-semibold text-navy mb-2">{s.title}</h3>
                <p className="text-navy/60 text-base leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-navy text-white/40 text-sm text-center py-5 px-6">
        <div className="flex items-center justify-center gap-2 mb-1">
          <LeafLogo size={16} />
          <span className="font-serif text-white/60 font-medium">Heirloom</span>
        </div>
        <p>© {new Date().getFullYear()} Heirloom — heirloom-app.ca</p>
      </footer>
    </div>
  );
}
