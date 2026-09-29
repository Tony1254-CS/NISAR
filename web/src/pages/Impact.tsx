import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Navbar } from '../components/Navbar';
import '../styles/globe.css';
import '../styles/base.css';

// --- Particle Engine ---
class Particle {
  x: number = 0; y: number = 0; ox: number = 0; oy: number = 0;
  vx: number = 0; vy: number = 0;
  isRiver: boolean = false; isEroded: boolean = false;
  color: string = ''; size: number = 2;
  
  constructor(x: number, y: number, isRiver: boolean) {
    this.x = x; this.y = y; this.ox = x; this.oy = y;
    this.isRiver = isRiver;
    this.color = isRiver ? '#000000' : '#1e293b';
    this.size = Math.random() * 1.5 + 1;
  }
  
  update(erosionThreshold: number, w: number, h: number) {
    if (this.isRiver) return;
    
    // Calculate distance to the meandering river center
    const riverCenter = w / 2 + Math.sin(this.oy * 0.005) * (w * 0.1);
    const dist = Math.abs(this.ox - riverCenter);
    
    // Erosion boundary expands with time (threshold)
    const boundary = 60 + (erosionThreshold / 100) * (w * 0.25);

    if (!this.isEroded && dist < boundary) {
      this.isEroded = true;
      this.color = '#ef4444'; // Warning Red
      this.vx = (Math.random() - 0.5) * 4;
      this.vy = Math.random() * 5 + 2; 
    }

    if (this.isEroded) {
      this.x += this.vx;
      this.y += this.vy;
      this.vy += 0.1; // gravity
    } else {
      // Idle float
      this.x = this.ox + Math.sin(Date.now() * 0.002 + this.oy) * 0.5;
    }
  }
  
  draw(ctx: CanvasRenderingContext2D) {
    if (this.isRiver) return;
    ctx.fillStyle = this.color;
    ctx.globalAlpha = this.isEroded ? 0.9 : 0.5;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

function DigitalTwinCanvas({ timeSim }: { timeSim: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timeRef = useRef(timeSim);
  
  useEffect(() => { timeRef.current = timeSim; }, [timeSim]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;
    
    const setSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    setSize();
    window.addEventListener('resize', setSize);

    const particles: Particle[] = [];
    const w = canvas.width;
    const h = canvas.height;
    
    // Generate Point Cloud
    for (let x = 0; x < w; x += 12) {
      for (let y = 0; y < h; y += 12) {
        const riverCenter = w / 2 + Math.sin(y * 0.005) * (w * 0.1);
        const isRiver = Math.abs(x - riverCenter) < 60;
        // Add noise to placement
        particles.push(new Particle(x + (Math.random()*6-3), y + (Math.random()*6-3), isRiver));
      }
    }

    let animationId: number;
    const render = () => {
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw grid lines
      ctx.strokeStyle = 'rgba(57, 196, 217, 0.03)';
      ctx.lineWidth = 1;
      for(let i=0; i<canvas.width; i+=40) { ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,canvas.height); ctx.stroke(); }
      for(let i=0; i<canvas.height; i+=40) { ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(canvas.width,i); ctx.stroke(); }

      const currentErosion = timeRef.current;
      
      for (let i = 0; i < particles.length; i++) {
        particles[i].update(currentErosion, canvas.width, canvas.height);
        particles[i].draw(ctx);
      }
      
      // Draw central scanline
      ctx.fillStyle = 'rgba(239, 68, 68, 0.1)';
      ctx.fillRect(0, canvas.height * ((Date.now() % 3000) / 3000), canvas.width, 2);

      animationId = requestAnimationFrame(render);
    };
    render();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', setSize);
    };
  }, []);

  return <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} />;
}

// --- React App ---
export function ImpactPage() {
  const [time, setTime] = useState(0); // 0 to 100
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isPlaying && time < 100) {
      interval = setInterval(() => {
        setTime(t => Math.min(t + 0.5, 100));
      }, 50);
    } else if (time >= 100) {
      setIsPlaying(false);
    }
    return () => clearInterval(interval);
  }, [isPlaying, time]);

  // Derived metrics
  const popRisk = Math.floor(12450 + (time * 845));
  const econDamage = (18.4 + (time * 1.4)).toFixed(1);
  const cropLost = Math.floor(2450 + (time * 112));
  const coherenceDrop = Math.min(84, Math.floor(20 + time * 0.8));

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#020617', color: '#fff', overflow: 'hidden', fontFamily: 'monospace' }}>
      <Navbar transparent={true} />
      
      <DigitalTwinCanvas timeSim={time} />

      {/* Holographic UI Layer */}
      <div style={{ position: 'relative', zIndex: 10, width: '100%', height: '100vh', pointerEvents: 'none' }}>
        
        {/* Top Left: Mission Details */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 1 }}
          style={{ position: 'absolute', top: '100px', left: '40px', background: 'rgba(8,12,16,0.6)', backdropFilter: 'blur(10px)', border: '1px solid rgba(57,196,217,0.3)', padding: '24px', borderRadius: '16px', width: '350px', pointerEvents: 'auto' }}
        >
          <div style={{ fontSize: '10px', color: '#39c4d9', letterSpacing: '2px', marginBottom: '8px' }}>// DIGITAL TWIN SIMULATION</div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 16px 0', textShadow: '0 0 10px rgba(255,255,255,0.5)' }}>L-BAND COHERENCE ENGINE</h1>
          <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: '1.6', marginBottom: '16px' }}>
            Real-time particle projection of SAR backscatter anomalies. Red nodes indicate total phase decorrelation (γ &lt; 0.3) matching active land collapse.
          </p>
          <div style={{ display: 'flex', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '10px', color: '#64748b' }}>RESOLUTION</div>
              <div style={{ color: '#fff', fontWeight: 'bold' }}>5m / pixel</div>
            </div>
            <div>
              <div style={{ fontSize: '10px', color: '#64748b' }}>SENSOR</div>
              <div style={{ color: '#fff', fontWeight: 'bold' }}>NISAR + S1</div>
            </div>
          </div>
        </motion.div>

        {/* Top Right: Economic Fallout */}
        <motion.div 
          initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 1, delay: 0.2 }}
          style={{ position: 'absolute', top: '100px', right: '40px', background: 'rgba(8,12,16,0.6)', backdropFilter: 'blur(10px)', border: '1px solid rgba(239,68,68,0.3)', padding: '24px', borderRadius: '16px', width: '300px', textAlign: 'right', pointerEvents: 'auto' }}
        >
          <div style={{ fontSize: '10px', color: '#ef4444', letterSpacing: '2px', marginBottom: '8px' }}>CRITICAL LOSS TRAJECTORY</div>
          
          <div style={{ fontSize: '48px', fontWeight: '900', color: '#ef4444', textShadow: '0 0 20px rgba(239,68,68,0.5)', lineHeight: '1' }}>
            ${econDamage}M
          </div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px' }}>DIRECT ECONOMIC DESTRUCTION</div>

          <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '16px' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '18px', color: '#fff', fontWeight: 'bold' }}>{popRisk.toLocaleString()}</div>
                <div style={{ fontSize: '10px', color: '#64748b' }}>PEOPLE DISPLACED</div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '16px' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '18px', color: '#fff', fontWeight: 'bold' }}>{cropLost.toLocaleString()} ha</div>
                <div style={{ fontSize: '10px', color: '#64748b' }}>CROPS ERADICATED</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Center Target HUD */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <motion.div 
            animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            style={{ width: '400px', height: '400px', borderRadius: '50%', border: '1px dashed rgba(57,196,217,0.3)', position: 'absolute' }}
          />
          <motion.div 
            animate={{ rotate: -360 }} transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
            style={{ width: '300px', height: '300px', borderRadius: '50%', border: '2px solid rgba(239,68,68,0.2)', position: 'absolute', borderTopColor: 'transparent', borderBottomColor: 'transparent' }}
          />
          <div style={{ fontSize: '10px', color: '#ef4444', background: 'rgba(0,0,0,0.5)', padding: '4px 8px', borderRadius: '4px', letterSpacing: '2px' }}>
            DECORRELATION: {coherenceDrop}%
          </div>
        </div>

        {/* Bottom Time Controls */}
        <motion.div 
          initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.4 }}
          style={{ position: 'absolute', bottom: '60px', left: '50%', transform: 'translateX(-50%)', width: '80%', background: 'rgba(8,12,16,0.8)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', padding: '24px', borderRadius: '24px', pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: '24px' }}
        >
          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            style={{ width: '48px', height: '48px', borderRadius: '50%', background: isPlaying ? '#ef4444' : '#39c4d9', color: '#000', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s' }}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>
          
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94a3b8' }}>
              <span>T-30 DAYS (CALIBRATION)</span>
              <span style={{ color: '#fff', fontWeight: 'bold' }}>DAY {Math.floor(time * 0.9)} / 90</span>
              <span>T+60 DAYS (PREDICTED)</span>
            </div>
            <input 
              type="range" min="0" max="100" step="0.1" value={time} 
              onChange={(e) => { setTime(Number(e.target.value)); setIsPlaying(false); }}
              style={{ width: '100%', cursor: 'pointer', accentColor: '#ef4444' }}
            />
          </div>
        </motion.div>

      </div>
    </div>
  );
}
