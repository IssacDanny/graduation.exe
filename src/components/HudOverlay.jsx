import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { audioDirector } from '../utils/audioDirector';
import { sfx } from '../utils/sfx';

gsap.registerPlugin(ScrollTrigger);

export default function HudOverlay({
  audioActive,
  isMuted,
  trackLabel,
  onToggleMute,
  onOpenTerminal,
}) {
  const cursorRef = useRef(null);
  const coordsRef = useRef(null);
  const scrollFillRef = useRef(null);
  const eqBarRefs = useRef([]);
  const headerRef = useRef(null);
  const [time, setTime] = useState('00:00:00');

  useEffect(() => {
    const updateTime = () => setTime(new Date().toTimeString().split(' ')[0]);
    updateTime();
    const tInt = setInterval(updateTime, 1000);
    return () => clearInterval(tInt);
  }, []);

  useEffect(() => {
    if (!audioActive) return;
    let rafId;

    const tick = () => {
      const { bass, bars } = audioDirector.getAudioEnergy();
      for (let i = 0; i < 7; i++) {
        const el = eqBarRefs.current[i];
        if (!el) continue;
        const val = isMuted ? 0.08 : Math.max(0.12, bars[i] || 0.12);
        el.style.transform = `scaleY(${val})`;
        el.style.backgroundColor = !isMuted && val > 0.72 ? '#ff2a3c' : '#00f0ff';
      }
      if (headerRef.current) {
        headerRef.current.style.borderBottomColor = isMuted
          ? 'rgba(0, 240, 255, 0.2)'
          : `rgba(0, 240, 255, ${0.2 + bass * 0.45})`;
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [audioActive, isMuted]);

  useGSAP(() => {
    const curX = gsap.quickTo(cursorRef.current, 'x', { duration: 0.12, ease: 'power3.out' });
    const curY = gsap.quickTo(cursorRef.current, 'y', { duration: 0.12, ease: 'power3.out' });

    const onMove = (e) => {
      curX(e.clientX);
      curY(e.clientY);
      if (coordsRef.current) {
        coordsRef.current.textContent = `X:${String(e.clientX).padStart(4, '0')} Y:${String(e.clientY).padStart(4, '0')}`;
      }
    };

    const onMouseOver = (e) => {
      const target = e.target.closest('.interactive, .glitch-hover, button, a');
      if (target) {
        if (!cursorRef.current?.classList.contains('is-hovering')) sfx.hover();
        cursorRef.current?.classList.add('is-hovering');
      } else {
        cursorRef.current?.classList.remove('is-hovering');
      }
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseover', onMouseOver);

    gsap.to(scrollFillRef.current, {
      scaleY: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: document.body,
        start: 'top top',
        end: 'bottom bottom',
        scrub: true,
      },
    });

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseover', onMouseOver);
    };
  }, []);

  return (
    <>
      <div className="crt-overlay fixed inset-0 pointer-events-none z-90" />
      <div className="noise-overlay fixed inset-0 opacity-[0.035] pointer-events-none z-91" />

      <div
        className="fixed inset-0 pointer-events-none z-85"
        style={{
          background: 'radial-gradient(circle at center, transparent 58%, rgba(2, 3, 5, 0.78) 100%)',
        }}
      />

      <div className="cyber-scan-beam fixed left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-volt/35 to-transparent pointer-events-none z-86" />

      {/* Precision FUI Crosshair Cursor (Desktop Only) */}
      <div
        ref={cursorRef}
        className="hud-cursor fixed top-0 left-0 pointer-events-none z-9999 hidden md:block"
      >
        <div className="cursor-ring w-[28px] h-[28px] border border-cyan -translate-1/2 rotate-45 transition-all duration-200" />
        <div className="absolute top-0 left-0 w-1 h-1 bg-volt -translate-1/2" />
        <span
          ref={coordsRef}
          className="absolute top-[18px] left-[18px] font-mono text-[9px] text-volt whitespace-nowrap tracking-widest"
        >
          X:0000 Y:0000
        </span>
      </div>

      {/* Top Cyberpunk Telemetry Bar */}
      <header
        ref={headerRef}
        className="fixed top-0 left-0 right-0 h-14 px-3 sm:px-6 flex items-center justify-between bg-void/80 backdrop-blur-md border-b border-volt/20 z-80 font-mono text-[10px] tracking-[1.5px] sm:tracking-[1.8px]"
      >
        <div className="flex items-center gap-2 shrink-0">
          <span className="w-2 h-2 bg-volt shadow-[0_0_10px_#00f0ff] animate-pulse" />
          <span className="text-volt sm:hidden">SYS.CORE</span>
          <span className="text-volt hidden sm:inline">SYS.CORE // ACTIVATED</span>
          <span className="hidden md:inline text-crimson/80 ml-2">[CLASS_2026]</span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => {
              sfx.click();
              onOpenTerminal();
            }}
            className="interactive px-2.5 py-1 border border-cyan/50 text-cyan hover:bg-cyan hover:text-void transition-colors cursor-none shrink-0"
          >
            &gt;_ CLI
          </button>

          {audioActive && (
            <button
              onClick={onToggleMute}
              className="interactive flex items-center gap-2 px-2 sm:px-2.5 py-1 border border-volt/50 text-volt hover:bg-volt hover:text-void transition-colors cursor-none"
              title={trackLabel || 'Toggle Audio'}
            >
              <span className="flex items-end gap-[2px] h-3.5 shrink-0" aria-hidden="true">
                {[0, 1, 2, 3, 4, 5, 6].map((idx) => (
                  <span
                    key={idx}
                    ref={(el) => (eqBarRefs.current[idx] = el)}
                    className="w-[2px] h-full bg-volt origin-bottom will-change-transform"
                    style={{ transform: 'scaleY(0.15)' }}
                  />
                ))}
              </span>
              <span className="max-w-[95px] sm:max-w-[230px] truncate">
                {isMuted ? 'OFF' : trackLabel || 'ON'}
              </span>
            </button>
          )}
          <span className="hidden sm:inline text-white/30">|</span>
          <span className="hidden sm:inline text-white/75">{time}</span>
        </div>
      </header>

      <div className="fixed bottom-4 left-6 w-5 h-5 border-b-2 border-l-2 border-volt/40 pointer-events-none z-80 hidden sm:block" />
      <div className="fixed bottom-4 right-6 w-5 h-5 border-b-2 border-r-2 border-crimson/50 pointer-events-none z-80 hidden sm:block" />

      <div className="fixed right-2.5 top-1/2 -translate-y-1/2 w-[2px] h-32 bg-white/10 z-80 pointer-events-none">
        <div
          ref={scrollFillRef}
          className="w-full h-full bg-volt origin-top scale-y-0 shadow-[0_0_10px_#00f0ff]"
        />
      </div>
    </>
  );
}