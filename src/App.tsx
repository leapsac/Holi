import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RotateCcw } from 'lucide-react';

const COLORS = ['#ff0080', '#7928ca', '#ff4d4d', '#f9cb28', '#00ff87', '#60efff', '#ff1b6b'];

interface SmokeParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  decay: number;
  growth: number;
  alpha: number;
}

interface BgParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
}

export default function App() {
  const [stage, setStage] = useState<'entry' | 'experience'>('entry');
  const [userName, setUserName] = useState('Everyone');
  const [chargeLevel, setChargeLevel] = useState(0);
  const [isCharging, setIsCharging] = useState(false);
  const [showText, setShowText] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const smokeCanvasRef = useRef<HTMLCanvasElement>(null);
  const smokeParticlesRef = useRef<SmokeParticle[]>([]);
  const bgParticlesRef = useRef<BgParticle[]>([]);
  const requestRef = useRef<number>(0);
  const pichkariRef = useRef<HTMLDivElement>(null);

  const initBg = useCallback((w: number, h: number) => {
    bgParticlesRef.current = Array.from({ length: 40 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      size: Math.random() * 100 + 50,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      alpha: Math.random() * 0.15,
    }));
  }, []);

  const animate = useCallback(() => {
    const bgCanvas = bgCanvasRef.current;
    const smokeCanvas = smokeCanvasRef.current;
    if (!bgCanvas || !smokeCanvas) return;

    const bgCtx = bgCanvas.getContext('2d');
    const smokeCtx = smokeCanvas.getContext('2d');
    if (!bgCtx || !smokeCtx) return;

    bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
    bgParticlesRef.current.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < -100) p.x = bgCanvas.width + 100;
      if (p.x > bgCanvas.width + 100) p.x = -100;
      if (p.y < -100) p.y = bgCanvas.height + 100;
      if (p.y > bgCanvas.height + 100) p.y = -100;

      bgCtx.save();
      bgCtx.globalAlpha = p.alpha;
      bgCtx.fillStyle = p.color;
      bgCtx.filter = 'blur(50px)';
      bgCtx.beginPath();
      bgCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      bgCtx.fill();
      bgCtx.restore();
    });

    smokeCtx.clearRect(0, 0, smokeCanvas.width, smokeCanvas.height);
    const smokeParticles = smokeParticlesRef.current;
    for (let i = smokeParticles.length - 1; i >= 0; i--) {
      const s = smokeParticles[i];
      s.x += s.vx;
      s.y += s.vy;
      s.vx *= 0.97;
      s.vy *= 0.97;
      s.size *= s.growth;
      s.life -= s.decay;
      s.alpha = s.life * 0.7;

      smokeCtx.save();
      smokeCtx.globalAlpha = s.alpha;
      smokeCtx.fillStyle = s.color;
      smokeCtx.filter = 'blur(35px)';
      smokeCtx.beginPath();
      smokeCtx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      smokeCtx.fill();
      smokeCtx.restore();

      if (s.life <= 0) smokeParticles.splice(i, 1);
    }
    requestRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (bgCanvasRef.current && smokeCanvasRef.current) {
        const w = window.innerWidth;
        const h = window.innerHeight;
        bgCanvasRef.current.width = w;
        bgCanvasRef.current.height = h;
        smokeCanvasRef.current.width = w;
        smokeCanvasRef.current.height = h;
        initBg(w, h);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(requestRef.current);
    };
  }, [animate, initBg]);

  const fire = useCallback(() => {
    if (chargeLevel < 10) return;
    const rect = pichkariRef.current?.getBoundingClientRect();
    if (!rect) return;
    const startX = rect.left + rect.width / 2;
    const startY = rect.top;
    setShowText(false);
    const sprayCount = 140;
    for (let i = 0; i < sprayCount; i++) {
      const color = COLORS[i % 7];
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.9;
      const speed = 15 + Math.random() * (chargeLevel / 2);
      smokeParticlesRef.current.push({
        x: startX,
        y: startY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: 25 + Math.random() * 35,
        life: 1.0,
        decay: 0.004 + Math.random() * 0.008,
        growth: 1.03 + Math.random() * 0.02,
        alpha: 0.8,
      });
    }
    setChargeLevel(0);
    setHasInteracted(true);
    setTimeout(() => setShowText(true), 1500);
  }, [chargeLevel]);

  useEffect(() => {
    let interval: number;
    if (isCharging) {
      interval = window.setInterval(() => {
        setChargeLevel(prev => Math.min(100, prev + 1.5));
      }, 20);
    }
    return () => clearInterval(interval);
  }, [isCharging]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#050505] font-sans select-none">
      <canvas ref={bgCanvasRef} className="absolute inset-0 z-0 pointer-events-none" />
      <canvas ref={smokeCanvasRef} className="absolute inset-0 z-30 pointer-events-none" />

      <div className="relative z-40 w-full h-full flex flex-col items-center justify-center p-6">
        <AnimatePresence mode="wait">
          {stage === 'entry' ? (
            <motion.div
              key="entry"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.1 }}
              transition={{ duration: 1 }}
              className="glass-card bg-white/5 backdrop-blur-3xl border border-white/10 p-12 rounded-[40px] text-center shadow-2xl max-w-md w-full"
            >
              <h1 className="text-6xl md:text-7xl font-bold italic tracking-tighter text-white mb-12 font-serif">
                HAPPY <span className="text-white/40">HOLI</span>
              </h1>
              
              <div className="space-y-6">
                <div className="relative group">
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Apna naam likho"
                    className="w-full px-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-white text-xl text-center outline-none focus:border-white/40 transition-all placeholder:text-white/20"
                  />
                  <div className="absolute inset-0 rounded-2xl bg-white/5 opacity-0 group-focus-within:opacity-100 blur-xl transition-opacity pointer-events-none" />
                </div>
                
                <button
                  onClick={() => setStage('experience')}
                  className="w-full py-5 rounded-2xl bg-white text-black text-xl font-extrabold uppercase tracking-widest hover:bg-zinc-200 transition-all transform active:scale-95 shadow-xl"
                >
                  START HOLI
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="experience"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full h-full flex flex-col items-center justify-between pt-16 pb-28"
            >
              <div className="text-center space-y-4 max-w-3xl px-6">
                <AnimatePresence>
                  {showText && (
                    <motion.div
                      initial={{ opacity: 0, filter: 'blur(20px)', y: 20 }}
                      animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
                      transition={{ duration: 2 }}
                    >
                      <h2 className="text-5xl md:text-7xl font-bold italic tracking-tighter text-white font-serif">
                        HAPPY HOLI
                      </h2>
                      <p className="text-xl md:text-3xl font-light text-white/70 mt-4">
                        To <span className="text-white font-semibold">{userName}</span> 🌈
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex flex-col items-center gap-4">
                <AnimatePresence>
                  {!hasInteracted && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.4 }}
                      exit={{ opacity: 0 }}
                      className="text-white text-sm font-light tracking-widest uppercase"
                    >
                      Hold to shoot
                    </motion.p>
                  )}
                </AnimatePresence>
                
                <div 
                  className="relative cursor-pointer group mb-12"
                  onMouseDown={() => setIsCharging(true)}
                  onMouseUp={() => { setIsCharging(false); fire(); }}
                  onTouchStart={(e) => { e.preventDefault(); setIsCharging(true); }}
                  onTouchEnd={() => { setIsCharging(false); fire(); }}
                >
                  <motion.div
                    ref={pichkariRef}
                    animate={isCharging ? { x: [0, -1, 1, -1, 0], scale: [1, 1.02, 1] } : {}}
                    transition={{ repeat: Infinity, duration: 0.1 }}
                    className="flex flex-col items-center"
                  >
                    <div className="w-4 h-8 bg-white/30 rounded-t-lg mb-[-2px]" />
                    
                    <div className="w-16 md:w-20 h-56 md:h-64 border-4 border-white/20 rounded-[40px] relative bg-white/5 backdrop-blur-md overflow-hidden shadow-2xl">
                      <div 
                        className="absolute bottom-0 w-full bg-gradient-to-t from-pink-600 via-purple-600 to-red-500 transition-all duration-75"
                        style={{ height: `${chargeLevel}%` }}
                      >
                        <div className="absolute top-0 left-0 w-full h-4 bg-white/20 blur-sm" />
                      </div>
                      
                      <div className="absolute left-4 top-0 w-2 h-full bg-white/10 blur-[1px]" />
                    </div>

                    <div 
                      className="w-3 bg-white/40 transition-all duration-75 relative"
                      style={{ height: '100px', transform: `translateY(${chargeLevel * 0.8}px)` }}
                    >
                      <div className="absolute bottom-[-15px] left-1/2 -translate-x-1/2 w-12 h-4 bg-white rounded-full shadow-lg" />
                    </div>
                  </motion.div>
                  
                  <AnimatePresence>
                    {isCharging && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1.5 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-white/10 blur-[100px] -z-10"
                      />
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="flex flex-col items-center gap-8">
                <AnimatePresence>
                  {showText && (
                    <motion.h3
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-2xl font-serif italic text-white/60"
                    >
                      Bura na mano... <span className="text-white">HOLI HAI!</span>
                    </motion.h3>
                  )}
                </AnimatePresence>
                
                <div className="flex gap-6">
                  <button 
                    onClick={() => {
                      const canvas = smokeCanvasRef.current;
                      if (canvas) {
                        const ctx = canvas.getContext('2d');
                        ctx?.clearRect(0, 0, canvas.width, canvas.height);
                        setShowText(false);
                      }
                    }}
                    className="p-4 rounded-full bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all border border-white/5"
                    title="Reset"
                  >
                    <RotateCcw className="w-6 h-6" />
                  </button>
                  <button 
                    onClick={() => setStage('entry')}
                    className="px-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-white/60 text-sm font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all"
                  >
                    CHANGE NAME
                  </button>
                </div>
              </div>

              <div className="absolute bottom-6 left-0 w-full text-center px-4 pointer-events-none">
                {showText && (
                  <p className="text-[9px] uppercase tracking-[0.25em] text-white/10 font-medium">
                    Now go celebrate!
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
