import { useState, useEffect } from 'react';
import '../styles/navbar.css';

interface NavbarProps {
  /** Transparent background until scroll (use on Landing page) */
  transparent?: boolean;
  /** Show reach selector + observation metadata (use on /app page) */
  showReachInfo?: boolean;
  /** Reach selector items */
  reaches?: { reach_id: string; name: string }[] | null;
  /** Currently selected reach */
  reachId?: string | null;
  /** Callback when reach changes */
  onReachChange?: (id: string) => void;
  /** Callback to open agentic workflow */
  onAnalyzeClick?: () => void;
  /** Latest data info */
  dataInfo?: string;
}

export function Navbar({
  transparent = false,
  showReachInfo = false,
  reaches,
  reachId,
  onReachChange,
  onAnalyzeClick,
  dataInfo,
}: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const path = typeof window !== 'undefined' ? window.location.pathname : '/';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navClass = [
    'navbar',
    scrolled ? 'navbar--scrolled' : '',
    transparent && !scrolled ? 'navbar--transparent' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const isActive = (href: string) => {
    if (href === '/' && path === '/') return true;
    if (href !== '/' && path.startsWith(href)) return true;
    return false;
  };

  const linkClass = (href: string) =>
    `navbar__link${isActive(href) ? ' navbar__link--active' : ''}`;

  return (
    <>
      <nav className={navClass} role="navigation" aria-label="Primary">
        <div className="navbar__left">
          {/* Brand */}
          <a href="/" className="navbar__brand" aria-label="Same River Twice — Home">
            <span className="navbar__brand-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" stroke="var(--water)" strokeOpacity="0.6" />
                <path d="M12 2 L12 4 M12 20 L12 22 M2 12 L4 12 M20 12 L22 12" stroke="var(--water)" strokeOpacity="0.4" />
                <circle cx="12" cy="12" r="3" fill="var(--water)" fillOpacity="0.2" stroke="var(--water)" />
                <path d="M12 9 Q15 12 12 15 Q9 12 12 9" fill="var(--water)" fillOpacity="0.3" />
              </svg>
            </span>
            <span className="navbar__brand-text">SAME RIVER TWICE</span>
          </a>

          {/* Nav links */}
          <div className={`navbar__nav${mobileOpen ? ' navbar__nav--open' : ''}`}>
            <a href="/cases" className={linkClass('/cases')}>
              Investigations
            </a>
            <a href="/methods" className={linkClass('/methods')}>
              Methods
            </a>
            <a href="/about" className={linkClass('/about')}>
              Data &amp; Sources
            </a>
          </div>

          {/* Reach selector (only on /app) */}
          {showReachInfo && reaches && reaches.length > 0 && (
            <select
              aria-label="Select investigation reach"
              value={reachId ?? ''}
              onChange={(e) => onReachChange?.(e.target.value)}
              className="navbar__reach-select"
            >
              {reaches.map((r) => (
                <option key={r.reach_id} value={r.reach_id}>
                  {r.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="navbar__right">
          {/* Data status */}
          {dataInfo && (
            <span className="navbar__status" title="Data freshness">
              <span className="navbar__status-dot" />
              {dataInfo}
            </span>
          )}

          {/* Trigger for Agentic Workflow (only on /app page) */}
          {showReachInfo && (
            <button
              onClick={onAnalyzeClick}
              className="navbar__btn navbar__btn--primary"
            >
              <span style={{ marginRight: 6 }}>●</span> Live Analysis
            </button>
          )}

          {!showReachInfo && (
            <a href="/auth" className="navbar__btn">
              Sign in
            </a>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="navbar__toggle"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle navigation"
          aria-expanded={mobileOpen}
        >
          <span className="navbar__toggle-bar" />
          <span className="navbar__toggle-bar" />
          <span className="navbar__toggle-bar" />
        </button>
      </nav>
    </>
  );
}
