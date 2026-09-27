import { useEffect, useState } from 'react';
import { useStore } from '../state/store';
import '../styles/agentic.css'; // Has typewriter-text class

export function CinematicDescription() {
  const { showCinematicDesc, setCinematicDesc, reach } = useStore();
  const [textStage, setTextStage] = useState(0);

  useEffect(() => {
    if (showCinematicDesc) {
      setTextStage(0);
      
      // Dispatch event for the Map to fly to a cinematic 3D angle
      if (reach?.viewState) {
        window.dispatchEvent(new CustomEvent('cinematic-fly', { 
          detail: { 
            longitude: reach.viewState.longitude, 
            latitude: reach.viewState.latitude, 
            zoom: 11,
            pitch: 65,
            bearing: -20
          } 
        }));
      }

      const timer1 = setTimeout(() => setTextStage(1), 1000);
      const timer2 = setTimeout(() => setTextStage(2), 2500);
      const timer3 = setTimeout(() => setTextStage(3), 4000);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    } else {
      // Dispatch event to return to normal map view
      if (reach?.viewState) {
        window.dispatchEvent(new CustomEvent('cinematic-fly', { 
          detail: { ...reach.viewState } 
        }));
      }
    }
  }, [showCinematicDesc, reach]);

  if (!showCinematicDesc) return null;

  return (
    <div 
      style={{ 
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 
        background: 'radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.8) 70%, rgba(0,0,0,0.95) 100%)', 
        zIndex: 40, 
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20%'
      }}
    >
      <div 
        style={{
          background: 'rgba(0, 0, 0, 0.6)',
          border: '1px solid rgba(57, 196, 217, 0.3)',
          backdropFilter: 'blur(8px)',
          padding: '32px',
          borderRadius: '12px',
          boxShadow: '0 0 40px rgba(57, 196, 217, 0.1)',
          maxWidth: '600px',
          pointerEvents: 'auto',
          animation: 'fade-in 0.5s ease-out'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--fail)', animation: 'pulse-dot 1s infinite' }} />
            <span style={{ color: 'var(--fail)', letterSpacing: '0.2em', fontSize: '0.8rem', fontWeight: 600 }}>LIVE SATELLITE FEED</span>
          </div>
          <button 
            onClick={() => setCinematicDesc(false)}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: '1.2rem' }}
          >
            ×
          </button>
        </div>

        {textStage >= 1 && (
          <h2 className="typewriter-text" style={{ color: 'var(--water)', fontSize: '2rem', marginBottom: 16, textTransform: 'uppercase', textShadow: '0 0 10px var(--water)' }}>
            Target: {reach?.name ?? 'Jamuna River System'}
          </h2>
        )}

        {textStage >= 2 && (
          <div style={{ animation: 'fade-in 1s ease-out' }}>
            <p style={{ color: 'var(--text)', fontSize: '1.1rem', lineHeight: 1.8, marginBottom: 16 }}>
              The Jamuna River is one of the world's most volatile braided river systems. It exhibits rapid morphological changes, shifting its banks by hundreds of meters annually. The <span style={{ color: 'var(--warn)' }}>Chilmari-Roumari reach</span> represents a critical vulnerability zone due to aggressive lateral erosion.
            </p>
            <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid var(--fail)', padding: '16px', borderRadius: '8px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 0 20px rgba(239, 68, 68, 0.2)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--fail)" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
              <div>
                <div style={{ color: 'var(--fail)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', marginBottom: '4px' }}>CRITICAL ALERT</div>
                <div style={{ color: '#fff', fontSize: '1.4rem', fontWeight: 800, textShadow: '0 0 10px var(--fail)' }}>LAND LOST TO THE RIVER</div>
              </div>
            </div>
          </div>
        )}

        {textStage >= 3 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, animation: 'fade-in 1s ease-out' }}>
            <div style={{ background: 'rgba(0,0,0,0.4)', padding: 16, borderRadius: 8, borderLeft: '3px solid var(--pass)' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-3)' }}>HYDROLOGICAL REGIME</div>
              <div style={{ fontSize: '1.2rem', color: 'var(--pass)', fontWeight: 600 }}>High-Flow Braided</div>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.4)', padding: 16, borderRadius: 8, borderLeft: '3px solid var(--warn)' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-3)' }}>VULNERABILITY INDEX</div>
              <div style={{ fontSize: '1.2rem', color: 'var(--warn)', fontWeight: 600 }}>Critical Level 4</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
