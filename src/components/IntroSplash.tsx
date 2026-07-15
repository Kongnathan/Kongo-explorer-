import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";

interface IntroSplashProps {
  onComplete: () => void;
}

export default function IntroSplash({ onComplete }: IntroSplashProps) {
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [progress, setProgress] = useState(0);
  const [isDismissing, setIsDismissing] = useState(false);

  // Auto-progress logic for loading bar
  useEffect(() => {
    const duration = 4000; // 4 seconds total
    const intervalTime = 40; // 25 fps
    const step = (intervalTime / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          handleTriggerDismiss();
          return 100;
        }
        return prev + step;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, []);

  // Soft oscillation on mobile/idle to simulate a physical hologram
  useEffect(() => {
    let frameId: number;
    let angle = 0;

    const tick = () => {
      // Rotate slowly if mouse is not tilting it
      angle += 0.02;
      setRotate((prev) => {
        // Only oscillate automatically if they aren't actively tilting with mouse
        if (Math.abs(prev.x) < 0.1 && Math.abs(prev.y) < 0.1) {
          return {
            x: Math.sin(angle) * 3,
            y: Math.cos(angle * 0.8) * 4,
          };
        }
        return prev;
      });
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left - width / 2;
    const mouseY = e.clientY - rect.top - height / 2;

    // Maximum tilt angle of 18 degrees
    const rotateX = -(mouseY / (height / 2)) * 18;
    const rotateY = (mouseX / (width / 2)) * 18;

    setRotate({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    // Reset back to center slowly
    setRotate({ x: 0, y: 0 });
  };

  const handleTriggerDismiss = () => {
    if (isDismissing) return;
    setIsDismissing(true);
    // Extra dramatic camera zoom in before calling parent complete
    setTimeout(() => {
      onComplete();
    }, 850);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: isDismissing ? 0 : 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#0c1c14] via-[#1B3022] to-[#050f0a] px-6 select-none"
        style={{ perspective: "1200px" }}
      >
        {/* Subtle Background Elements */}
        <div className="absolute inset-0 opacity-15 pointer-events-none">
          {/* Topographic Map Lines SVG Background */}
          <svg className="w-full h-full stroke-amber-400/30 fill-none stroke-[0.75]" viewBox="0 0 1000 1000">
            <path d="M-100,200 C150,150 200,350 450,250 C700,150 850,400 1100,300" />
            <path d="M-100,300 C180,220 250,450 500,350 C750,250 900,500 1100,400" />
            <path d="M-100,450 C200,320 300,550 550,480 C800,410 950,600 1100,550" />
            <path d="M-100,600 C220,500 350,700 600,600 C850,500 1000,750 1100,700" />
            <path d="M-100,750 C250,650 400,850 650,750 C900,650 1050,900 1100,850" />
            <circle cx="500" cy="500" r="300" className="stroke-amber-400/10" />
            <circle cx="500" cy="500" r="450" className="stroke-amber-400/5" />
          </svg>
        </div>

        {/* Ambient background glows */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full filter blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full filter blur-[100px] pointer-events-none" />

        {/* 3D Holographic Card Container */}
        <motion.div
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          animate={{
            rotateX: rotate.x,
            rotateY: rotate.y,
            scale: isDismissing ? 1.4 : 1,
            translateZ: isDismissing ? 150 : 0,
          }}
          transition={{
            type: "spring",
            stiffness: isDismissing ? 80 : 120,
            damping: isDismissing ? 18 : 22,
          }}
          style={{
            transformStyle: "preserve-3d",
          }}
          className="relative w-full max-w-xl aspect-[3/4] md:aspect-[4/3] rounded-[40px] bg-white/[0.03] border border-white/10 backdrop-blur-xl p-8 md:p-12 flex flex-col justify-between shadow-[0_50px_100px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.2)] cursor-grab active:cursor-grabbing"
        >
          {/* Highlight glare line on top */}
          <div className="absolute top-0 left-10 right-10 h-[1px] bg-gradient-to-r from-transparent via-amber-300/40 to-transparent" />

          {/* Golden Corner Accents (Royal/Historical Vibe) */}
          <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-amber-500/50 rounded-tl-lg" />
          <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-amber-500/50 rounded-tr-lg" />
          <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-amber-500/50 rounded-bl-lg" />
          <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-amber-500/50 rounded-br-lg" />

          {/* Card Top: Small Metadata Tag */}
          <div className="flex justify-between items-center z-10" style={{ transform: "translateZ(30px)" }}>
            <span className="text-[10px] tracking-[0.25em] font-mono uppercase text-amber-400 font-bold">
              PROVINCE DU KONGO CENTRAL
            </span>
            <div className="flex items-center gap-1.5 bg-black/30 px-3 py-1 rounded-full border border-white/5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-[9px] font-mono text-white/70">Éducation & Patrimoine</span>
            </div>
          </div>

          {/* Card Middle: Massive 3D Logo / Compass */}
          <div className="flex flex-col items-center justify-center my-6 relative" style={{ transform: "translateZ(85px)", transformStyle: "preserve-3d" }}>
            {/* Spinning Golden Compass Ring */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 35, ease: "linear" }}
              className="w-36 h-36 md:w-44 md:h-44 rounded-full border border-dashed border-amber-400/40 flex items-center justify-center relative shadow-[0_0_40px_rgba(245,158,11,0.1)]"
              style={{ transformStyle: "preserve-3d" }}
            >
              <div className="absolute inset-3 rounded-full border border-amber-300/20 flex items-center justify-center">
                <div className="absolute inset-4 rounded-full bg-amber-500/[0.03] backdrop-blur-sm border border-amber-500/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-amber-400 text-[56px] md:text-[68px] fill animate-pulse">explore</span>
                </div>
              </div>

              {/* Cardinal points */}
              <span className="absolute top-2 text-[10px] font-mono font-bold text-amber-300 tracking-wider">N</span>
              <span className="absolute bottom-2 text-[10px] font-mono font-bold text-amber-300 tracking-wider">S</span>
              <span className="absolute right-2 text-[10px] font-mono font-bold text-amber-300 tracking-wider">E</span>
              <span className="absolute left-2 text-[10px] font-mono font-bold text-amber-300 tracking-wider">O</span>
            </motion.div>

            {/* Faint shadows projected behind */}
            <div className="absolute inset-0 bg-amber-500/5 filter blur-xl rounded-full scale-75 -z-10" style={{ transform: "translateZ(-30px)" }} />
          </div>

          {/* Card Bottom: Majestic Title and Description */}
          <div className="text-center space-y-4 z-10" style={{ transform: "translateZ(50px)" }}>
            <div className="space-y-1">
              <h1 className="font-sans text-headline-lg font-black text-white tracking-tight text-3xl md:text-4xl bg-gradient-to-b from-white via-amber-100 to-amber-300 bg-clip-text text-transparent">
                KONGO CENTRAL
              </h1>
              <p className="text-[11px] font-mono font-bold uppercase tracking-[0.4em] text-emerald-400">
                EXPLORER
              </p>
            </div>

            <p className="text-white/70 text-xs md:text-sm max-w-sm mx-auto leading-relaxed">
              Embarquez pour un voyage immersif à la découverte des trésors écologiques, historiques et culturels de notre province.
            </p>

            {/* Quick action button to trigger direct entrance */}
            <div className="pt-2">
              <button
                onClick={handleTriggerDismiss}
                className="group relative inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-sans text-xs font-black px-8 py-3.5 rounded-full shadow-2xl hover:brightness-110 active:scale-95 transition-all cursor-pointer border border-amber-300/30 overflow-hidden"
              >
                {/* Shining flare effect */}
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                
                <span>EXPLORER LA PROVINCE</span>
                <span className="material-symbols-outlined text-[16px] font-bold group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Loading / Progress Footer */}
        <div className="mt-8 w-full max-w-xs flex flex-col items-center gap-2 z-10">
          <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 via-amber-400 to-amber-500 rounded-full transition-all duration-75"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-[10px] font-mono text-white/40 tracking-widest uppercase">
            Chargement des archives ({Math.round(progress)}%)
          </span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
