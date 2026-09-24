const FEATURES: { title: string; body: string; accent: string }[] = [
  {
    title: 'Real NISAR radar, not stock photos',
    body: 'Every image on this site is a calibrated L-band radar pass from NASA/JPL’s NISAR mission, clipped and processed from the raw granule — never a placeholder.',
    accent: 'var(--water)',
  },
  {
    title: 'Before / after, side by side',
    body: 'Drag one slider to compare two dates of the same stretch of river. Water looks dark, land looks bright — the difference is the story.',
    accent: 'var(--erosion)',
  },
  {
    title: 'Click any claim for its evidence',
    body: 'Every erosion or accretion patch links back to the exact satellite granule, threshold, and QC checks that produced it — in two clicks, max.',
    accent: 'var(--accretion)',
  },
  {
    title: 'Honest by design',
    body: 'When the data doesn’t support a confident number, the app says so — SUPPORTED, LIMITED, or INCONCLUSIVE. No fabricated results, ever.',
    accent: 'var(--ambiguous)',
  },
];

export function Landing() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        color: 'var(--text)',
        fontFamily: 'var(--font-text)',
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'var(--s4) var(--s6)',
          borderBottom: '1px solid var(--line)',
        }}
      >
        <strong style={{ letterSpacing: '0.04em' }}>SAME RIVER TWICE</strong>
        <nav style={{ display: 'flex', gap: 'var(--s5)', alignItems: 'center', fontSize: '0.9rem' }}>
          <a href="/methods" style={{ color: 'var(--text-2)', textDecoration: 'none' }}>
            Methods
          </a>
          <a
            href="/auth"
            style={{
              color: 'var(--text)',
              border: '1px solid var(--line-strong)',
              borderRadius: 'var(--r)',
              padding: '6px 14px',
              textDecoration: 'none',
            }}
          >
            Sign in
          </a>
        </nav>
      </header>

      <section
        style={{
          position: 'relative',
          padding: 'var(--s6) var(--s6) 0',
          textAlign: 'center',
          overflow: 'hidden',
        }}
      >
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'url(/data/v1/jamuna-chilmari/img/radar_20260919.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.16,
            filter: 'grayscale(1)',
            maskImage: 'linear-gradient(to bottom, black, transparent)',
          }}
        />
        <div style={{ position: 'relative', maxWidth: 760, margin: '0 auto', padding: 'var(--s6) 0' }}>
          <div
            style={{
              display: 'inline-block',
              fontSize: '0.75rem',
              letterSpacing: '0.08em',
              color: 'var(--water)',
              border: '1px solid var(--line-strong)',
              borderRadius: 'var(--r)',
              padding: '4px 10px',
              marginBottom: 'var(--s4)',
            }}
          >
            NASA NISAR &middot; JAMUNA RIVER, BANGLADESH
          </div>
          <h1 style={{ fontSize: '3rem', lineHeight: 1.1, margin: '0 0 var(--s4)' }}>
            Prove the river moved.
            <br />
            <span style={{ color: 'var(--water)' }}>Don&rsquo;t just claim it.</span>
          </h1>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-2)', maxWidth: 560, margin: '0 auto var(--s5)' }}>
            Same River Twice compares real satellite radar of the same stretch of the Jamuna on two
            dates, and shows exactly where land turned to water and water turned to land — with the
            evidence to back every claim.
          </p>
          <div style={{ display: 'flex', gap: 'var(--s3)', justifyContent: 'center', marginBottom: 'var(--s6)' }}>
            <a
              href="/app"
              style={{
                background: 'var(--water)',
                color: '#04222b',
                fontWeight: 700,
                padding: '12px 24px',
                borderRadius: 'var(--r)',
                textDecoration: 'none',
              }}
            >
              Launch Same River Twice &rarr;
            </a>
            <a
              href="/methods"
              style={{
                border: '1px solid var(--line-strong)',
                color: 'var(--text)',
                padding: '12px 24px',
                borderRadius: 'var(--r)',
                textDecoration: 'none',
              }}
            >
              See the methods
            </a>
          </div>
        </div>
      </section>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 'var(--s4)',
          maxWidth: 1040,
          margin: '0 auto',
          padding: '0 var(--s6) var(--s6)',
        }}
      >
        {FEATURES.map((f) => (
          <div
            key={f.title}
            style={{
              background: 'var(--panel)',
              border: '1px solid var(--line)',
              borderTop: `2px solid ${f.accent}`,
              borderRadius: 'var(--r)',
              padding: 'var(--s4)',
            }}
          >
            <h3 style={{ margin: '0 0 var(--s2)', fontSize: '1rem' }}>{f.title}</h3>
            <p style={{ margin: 0, color: 'var(--text-2)', fontSize: '0.9rem', lineHeight: 1.5 }}>{f.body}</p>
          </div>
        ))}
      </section>

      <footer
        style={{
          textAlign: 'center',
          color: 'var(--text-3)',
          fontSize: '0.8rem',
          padding: 'var(--s5) var(--s6)',
          borderTop: '1px solid var(--line)',
        }}
      >
        Self-authored, independent build &middot; not an official NASA Space Apps submission &middot;{' '}
        <a href="/methods" style={{ color: 'var(--text-2)' }}>
          full methods &amp; sources
        </a>
      </footer>
    </div>
  );
}
