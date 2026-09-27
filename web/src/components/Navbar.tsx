import { useState, useEffect } from 'react';
import { useStore } from '../state/store';
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
  const { sensoryMode, setSensoryMode, cinematicMode, setCinematicMode } = useStore();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState('🔊 Audio');

  const path = typeof window !== 'undefined' ? window.location.pathname : '/';

  const handleBanglaVoice = () => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setVoiceStatus('🔊 Audio');
      return;
    }
    
    const voices = window.speechSynthesis.getVoices();
    const bnVoice = voices.find(v => v.lang.toLowerCase().includes('bn'));
    
    let msg: SpeechSynthesisUtterance;
    if (bnVoice) {
      msg = new SpeechSynthesisUtterance("যমুনা নদীর এই অংশে বিশাল ভাঙন শনাক্ত করা হয়েছে। স্যাটেলাইট ডেটা ব্যবহার করে এটি নিশ্চিত করা হয়েছে। দয়া করে সতর্ক হোন।");
      msg.lang = 'bn-BD';
      msg.voice = bnVoice;
      setVoiceStatus('🔊 Playing...');
    } else {
      msg = new SpeechSynthesisUtterance("Severe erosion detected in this section of the Jamuna River. Satellite data confirms this anomaly. Please alert local authorities.");
      msg.lang = 'en-US';
      setVoiceStatus('🔊 Playing...');
    }
    
    msg.onend = () => setVoiceStatus('🔊 Audio');
    msg.onerror = () => setVoiceStatus('🔊 Audio');
    
    window.speechSynthesis.speak(msg);
  };

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

          {/* Nav links (hidden on /app to save space on laptops) */}
          {!showReachInfo && (
            <div className={`navbar__nav${mobileOpen ? ' navbar__nav--open' : ''}`}>
              <a href="/cases" className={linkClass('/cases')}>
                Investigations
              </a>
              <a href="/methods" className={linkClass('/methods')}>
                Methods
              </a>
              <a href="/about" className={linkClass('/about')}>
                About Us
              </a>
            </div>
          )}

          {/* Reach selector (only on /app) */}
          {showReachInfo && reaches && reaches.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
              <button
                onClick={() => useStore.getState().setCinematicDesc(!useStore.getState().showCinematicDesc)}
                className="navbar__btn"
                style={{ background: 'rgba(57,196,217,0.1)', border: '1px solid var(--water)', color: 'var(--water)', padding: '6px 10px', fontSize: '0.7rem', display: 'flex', gap: '6px', alignItems: 'center' }}
                title="Cinematic HUD Description"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                Info
              </button>
            </div>
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

          {/* Extra PRD Features and Trigger for Agentic Workflow (only on /app page) */}
          {showReachInfo && (
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <button 
                onClick={handleBanglaVoice}
                className="navbar__btn"
                style={{ background: 'transparent', border: '1px solid var(--water)', color: 'var(--water)', padding: '6px 10px', fontSize: '0.7rem' }}
                title="Bangla Voice Report"
              >
                {voiceStatus}
              </button>
              
              <button 
                onClick={() => setSensoryMode(!sensoryMode)}
                className="navbar__btn"
                style={{ background: sensoryMode ? 'var(--warn)' : 'transparent', border: `1px solid var(--warn)`, color: sensoryMode ? '#000' : 'var(--warn)', padding: '6px 10px', fontSize: '0.7rem' }}
                title="Haptic & Audio Pixel Inspector"
              >
                {sensoryMode ? '🔎 Sensory' : '🔍 Sensory'}
              </button>
              
              <button 
                onClick={() => setCinematicMode(!cinematicMode)}
                className="navbar__btn"
                style={{ background: cinematicMode ? 'var(--pass)' : 'transparent', border: `1px solid var(--pass)`, color: cinematicMode ? '#000' : 'var(--pass)', padding: '6px 10px', fontSize: '0.7rem' }}
                title="5-Sec X-Ray Optical/SAR Swipe"
              >
                🎬 Swipe
              </button>

              <button
                onClick={onAnalyzeClick}
                className="navbar__btn navbar__btn--primary"
                style={{ padding: '6px 16px', marginLeft: '4px', fontSize: '0.75rem' }}
              >
                <span style={{ marginRight: 6 }}>●</span> Live Analysis
              </button>
            </div>
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
