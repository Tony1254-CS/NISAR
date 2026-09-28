import { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import '../styles/landing.css';

export function Landing() {
  const [people, setPeople] = useState(0);
  const [percent, setPercent] = useState(0);
  const [homes, setHomes] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setPeople((prev) => (prev < 4.96 ? Math.min(prev + 0.1, 4.96) : prev));
      setPercent((prev) => (prev < 60 ? Math.min(prev + 2, 60) : prev));
      setHomes((prev) => (prev < 100 ? Math.min(prev + 4, 100) : prev));
    }, 50);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="page-container" style={{ background: '#0a0a0a', color: '#fff', minHeight: '100vh' }}>
      <Navbar transparent />

      {/* Hero Section */}
      <section className="landing-hero" style={{ 
        position: 'relative', 
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        textAlign: 'center',
        padding: '0 2rem'
      }}>
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundImage: 'linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.9)), url(/data/v1/jamuna-chilmari/img/radar_20260919.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          zIndex: -1
        }} />
        
        <div style={{ maxWidth: 800, marginTop: '10vh' }}>
          <h1 style={{ fontSize: '3rem', fontWeight: 700, marginBottom: '1.5rem', lineHeight: 1.2 }}>
            4.96 million people have been displaced <br />
            by erosion and flooding in Bangladesh alone.
          </h1>
          <p style={{ fontSize: '1.5rem', color: '#a0a0a0', marginBottom: '3rem' }}>
            What if we could see it coming — from space?
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <a href="#demo" style={{ padding: '1rem 2rem', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '30px', color: '#fff', textDecoration: 'none', fontWeight: 600 }}>
              ▶ Watch the Demo
            </a>
            <a href="/cases" style={{ padding: '1rem 2rem', background: '#39c4d9', borderRadius: '30px', color: '#000', textDecoration: 'none', fontWeight: 600 }}>
              → Launch Platform
            </a>
          </div>
        </div>
      </section>

      {/* The Problem */}
      <section style={{ padding: '8rem 2rem', background: '#000' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>
            Every year, the Jamuna River devours villages, farmland, and futures. <br/>
            <span style={{ color: '#888' }}>By the time it's visible from the ground, it's already too late.</span>
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginTop: '4rem' }}>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '2rem', borderRadius: '16px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ fontSize: '3.5rem', fontWeight: 800, color: '#39c4d9' }}>{people.toFixed(2)}M</div>
              <div style={{ fontSize: '1.2rem', color: '#ccc' }}>People displaced</div>
              <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>Source: IOM 2025</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '2rem', borderRadius: '16px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ fontSize: '3.5rem', fontWeight: 800, color: '#39c4d9' }}>{Math.floor(percent)}%</div>
              <div style={{ fontSize: '1.2rem', color: '#ccc' }}>Erosion from Jamuna</div>
              <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>Of all erosion in Bangladesh</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '2rem', borderRadius: '16px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ fontSize: '3.5rem', fontWeight: 800, color: '#39c4d9' }}>{Math.floor(homes)}k+</div>
              <div style={{ fontSize: '1.2rem', color: '#ccc' }}>Families lose homes</div>
              <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>Annually</div>
            </div>
          </div>
        </div>
      </section>

      {/* The Solution */}
      <section style={{ padding: '8rem 2rem', background: '#050505' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '3rem', marginBottom: '4rem' }}>NISAR sees what eyes can't.</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '4rem' }}>
            <div style={{ textAlign: 'left', padding: '2rem', borderLeft: '2px solid #39c4d9' }}>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>1. Penetrates Clouds</h3>
              <p style={{ color: '#aaa', lineHeight: 1.6 }}>L-band radar works through monsoon, day and night.</p>
            </div>
            <div style={{ textAlign: 'left', padding: '2rem', borderLeft: '2px solid #39c4d9' }}>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>2. Detects Change</h3>
              <p style={{ color: '#aaa', lineHeight: 1.6 }}>Automated comparison of SAR acquisitions at matched river levels.</p>
            </div>
            <div style={{ textAlign: 'left', padding: '2rem', borderLeft: '2px solid #39c4d9' }}>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>3. Predicts Risk</h3>
              <p style={{ color: '#aaa', lineHeight: 1.6 }}>ML model identifies where erosion will strike NEXT.</p>
            </div>
          </div>

          <div style={{ background: 'rgba(57,196,217,0.1)', padding: '2rem', borderRadius: '16px', border: '1px solid rgba(57,196,217,0.3)', display: 'flex', justifyContent: 'space-around', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ fontWeight: 'bold', color: '#39c4d9' }}>ACQUIRE</div>
            <div>→</div>
            <div style={{ fontWeight: 'bold', color: '#39c4d9' }}>DETECT</div>
            <div>→</div>
            <div style={{ fontWeight: 'bold', color: '#39c4d9' }}>VALIDATE</div>
            <div>→</div>
            <div style={{ fontWeight: 'bold', color: '#39c4d9' }}>ALERT</div>
          </div>
        </div>
      </section>

      {/* The Proof & The Call */}
      <section style={{ padding: '8rem 2rem', background: '#000', textAlign: 'center' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>4 continents. 12 SAR acquisitions. 1 unified platform.</h2>
          <p style={{ color: '#666', marginBottom: '4rem' }}>Global reach, local impact.</p>
          
          <h1 style={{ fontSize: '3rem', fontWeight: 700, marginBottom: '2rem' }}>
            Same River Twice — because no river,<br/>
            and no home, should be lost unwitnessed.
          </h1>
          
          <a href="/cases" style={{ display: 'inline-block', padding: '1.2rem 3rem', background: '#fff', borderRadius: '40px', color: '#000', textDecoration: 'none', fontWeight: 600, fontSize: '1.2rem' }}>
            Launch Platform →
          </a>
        </div>
      </section>

      <footer className="landing-footer" style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
        Same River Twice &middot; NASA Space Apps Challenge 2026 &middot; Dancing with the SARs
      </footer>
    </div>
  );
}
