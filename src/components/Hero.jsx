import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { cipherReveal } from '../utils/cipher';
import { detonateCyberConfetti } from '../utils/confetti';

export default function Hero({ ready, onScrollToInvite }) {
  const containerRef = useRef(null);
  const metaRef = useRef(null);
  const nameRef = useRef(null);

  useGSAP(
    () => {
      if (!ready) return;

      const tl = gsap.timeline();
      tl.from('.reveal-line', {
        yPercent: 115,
        skewY: 6,
        stagger: 0.12,
        duration: 0.9,
        ease: 'power4.out',
      })
        .add(() => {
          cipherReveal(metaRef.current, 'SYS_OVERRIDE // HCMUT_CLASS_2026', 0.9);
          cipherReveal(nameRef.current, 'ISSAC FENTON', 1.2);
        }, '-=0.7')
        .from(
          '.hero-bottom-item',
          {
            y: 40,
            opacity: 0,
            stagger: 0.15,
            duration: 0.7,
            ease: 'power3.out',
          },
          '-=0.5'
        );
    },
    { scope: containerRef, dependencies: [ready] }
  );

  const handleCelebrate = () => {
    detonateCyberConfetti();
    onScrollToInvite();
  };

  return (
    <section
      ref={containerRef}
      className="relative min-h-[100dvh] flex items-center px-5 sm:px-8 md:px-20 pt-22 sm:pt-24 pb-12 overflow-hidden"
    >
      <div
        className="pointer-events-none absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[500px] sm:w-[700px] h-[350px] sm:h-[420px] rounded-full blur-[120px] opacity-20"
        style={{
          background: 'radial-gradient(circle, rgba(0,240,255,0.6) 0%, rgba(255,42,60,0.35) 60%, transparent 100%)',
        }}
      />

      <div className="relative z-10 w-full max-w-[1400px] mx-auto">
        <div className="flex items-center gap-3 mb-5 sm:mb-6">
          <span className="w-2 h-2 bg-crimson shrink-0" />
          <div ref={metaRef} className="font-mono text-[11px] sm:text-xs md:text-sm text-cyan tracking-[2.5px] sm:tracking-[3px]">
            SYS_OVERRIDE // HCMUT_CLASS_2026
          </div>
        </div>

        <h1 className="font-display font-extrabold text-[clamp(1.65rem,8vw,8.5rem)] leading-[0.95] tracking-[-0.03em] uppercase mb-9 sm:mb-12">
          <span className="block overflow-hidden">
            <span className="reveal-line inline-block glitch-hover">COMPUTER</span>
          </span>
          <span className="block overflow-hidden">
            <span className="reveal-line inline-block text-volt glow-volt glitch-hover">SCIENCE</span>
          </span>
          <span className="block overflow-hidden">
            <span className="reveal-line inline-block outline-text glitch-hover">GRADUATED.</span>
          </span>
        </h1>

        <div className="flex flex-col sm:flex-row sm:flex-wrap justify-between items-stretch sm:items-end gap-6 sm:gap-8">
          <div className="hero-bottom-item relative bg-[#0a0d14]/85 border border-volt/25 backdrop-blur-md px-6 py-5 sm:px-8 sm:py-6 clip-chamfer shadow-[0_0_30px_rgba(0,240,255,0.08)]">
            <div className="absolute top-0 left-0 w-12 h-[3px] bg-volt shadow-[0_0_8px_#00f0ff]" />
            <div className="absolute bottom-0 right-0 w-10 h-[2px] bg-crimson" />
            <div className="flex items-center justify-between gap-6 font-mono text-[0.68rem] text-zinc-500 tracking-[2px]">
              <span>SUBJECT_ID // DINH GIA KIET</span>
              <span className="text-crimson">● VERIFIED</span>
            </div>
            <div ref={nameRef} className="text-xl sm:text-2xl md:text-3xl font-bold tracking-wide my-1.5">
              ISSAC FENTON
            </div>
            <div className="font-mono text-[11px] sm:text-xs text-cyan">
              B.S. COMPUTER SCIENCE — HCMUT // EXIT_CODE(0)
            </div>
          </div>

          <div className="hero-bottom-item">
            <button
              onClick={handleCelebrate}
              className="interactive group relative w-full sm:w-auto px-7 sm:px-9 py-4 sm:py-4.5 font-mono text-xs sm:text-sm font-bold tracking-[1.5px] text-void clip-btn overflow-hidden cursor-none shadow-[0_0_25px_rgba(0,240,255,0.3)] hover:shadow-[0_0_40px_rgba(0,240,255,0.6)] transition-shadow"
            >
              <span className="absolute inset-0 bg-volt group-hover:bg-white transition-colors duration-250 z-0" />
              <span className="relative z-10">INITIALIZE_CELEBRATION [ ]</span>
            </button>

            <div className="mt-4 sm:mt-5 flex items-center justify-center sm:justify-start gap-3 font-mono text-[0.7rem] text-zinc-500 tracking-[2px]">
              <span>SCROLL TO ACCESS DATA LOGS</span>
              <span className="animate-bounce text-volt">↓</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}