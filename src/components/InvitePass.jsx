import { useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { detonateCyberConfetti } from '../utils/confetti';
import { audioDirector } from '../utils/audioDirector';
import { getGuestName } from '../utils/guest';
import { sfx } from '../utils/sfx';

gsap.registerPlugin(ScrollTrigger);

// Exact HCMUT Hall A5 Ceremony Timestamp (GMT+7 Ho Chi Minh City)
const TARGET_TS = new Date('2026-11-29T07:30:00+07:00').getTime();

function getCountdown() {
  const diff = TARGET_TS - Date.now();
  if (diff <= 0) {
    return { done: true, days: '00', hours: '00', mins: '00', secs: '00' };
  }
  const d = Math.floor(diff / (1000 * 60 * 60 * 24));
  const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const m = Math.floor((diff / (1000 * 60)) % 60);
  const s = Math.floor((diff / 1000) % 60);
  return {
    done: false,
    days: String(d).padStart(2, '0'),
    hours: String(h).padStart(2, '0'),
    mins: String(m).padStart(2, '0'),
    secs: String(s).padStart(2, '0'),
  };
}

export default function InvitePass() {
  const sectionRef = useRef(null);
  const cardRef = useRef(null);
  const sheenRef = useRef(null);
  const holdTweenRef = useRef(null);
  const holdBarRef = useRef(null);

  const guestName = useMemo(() => getGuestName(), []);
  const [authorized, setAuthorized] = useState(false);
  const [countdown, setCountdown] = useState(getCountdown);

  useEffect(() => {
    const id = setInterval(() => setCountdown(getCountdown()), 1000);
    return () => clearInterval(id);
  }, []);

  useGSAP(
    () => {
      gsap.from(cardRef.current, {
        scale: 0.92,
        opacity: 0,
        y: 50,
        duration: 0.85,
        ease: 'power3.out',
        clearProps: 'transform,opacity',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 85%',
          once: true,
        },
      });
    },
    { scope: sectionRef }
  );

  const handleMouseMove = (e) => {
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;

    gsap.to(cardRef.current, {
      rotationY: x * 12,
      rotationX: -y * 12,
      transformPerspective: 1000,
      duration: 0.4,
      ease: 'power2.out',
    });

    if (sheenRef.current) {
      gsap.to(sheenRef.current, {
        x: x * 180,
        y: y * 180,
        opacity: 0.35,
        duration: 0.3,
      });
    }
  };

  const handleMouseLeave = () => {
    gsap.to(cardRef.current, {
      rotationY: 0,
      rotationX: 0,
      duration: 0.6,
      ease: 'elastic.out(1, 0.5)',
    });
    if (sheenRef.current) {
      gsap.to(sheenRef.current, { opacity: 0, duration: 0.4 });
    }
  };

  const startHold = () => {
    sfx.click();
    if (holdTweenRef.current) holdTweenRef.current.kill();
    holdTweenRef.current = gsap.to(holdBarRef.current, {
      scaleX: 1,
      duration: 1.0,
      ease: 'power1.inOut',
      onComplete: () => {
        setAuthorized(true);
        detonateCyberConfetti();
        audioDirector.playSubDrop();
        audioDirector.setStage('rebel', { fadeMs: 900 });
      },
    });
  };

  const cancelHold = () => {
    if (holdTweenRef.current) holdTweenRef.current.kill();
    gsap.to(holdBarRef.current, { scaleX: 0, duration: 0.25 });
  };

  const downloadCalendarInvite = () => {
    sfx.click();
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//graduate.exe//HCMUT//EN',
      'BEGIN:VEVENT',
      'DTSTART:20261129T073000',
      'DTEND:20261129T100000',
      'SUMMARY:Graduation Ceremony — Dinh Gia Kiet (Issac Fenton) | HCMUT CS',
      'DESCRIPTION:B.S. Computer Science Graduation Ceremony. CS Conferral: 08:25-09:40 | Photo Session: 09:40-10:00. Note: No bags/backpacks inside Hall A5.',
      'LOCATION:Hội trường A5, Trường ĐH Bách khoa - ĐHQG-HCM, 268 Lý Thường Kiệt, P. Diên Hồng, TP. HCM',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'hcmut-graduation-issac-fenton.ics';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section
      id="invite-section"
      ref={sectionRef}
      className="min-h-[85dvh] flex justify-center items-center px-4 sm:px-6 pt-14 sm:pt-16 pb-20"
    >
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={`w-full max-w-[820px] relative bg-[#0b0e15]/95 border backdrop-blur-md p-6 sm:p-8 md:p-12 clip-chamfer overflow-hidden will-change-transform transition-colors duration-500 ${
          authorized
            ? 'border-volt shadow-[0_0_50px_rgba(0,240,255,0.22)]'
            : 'border-white/20 shadow-[0_0_40px_rgba(0,0,0,0.65)]'
        }`}
      >
        <div className="absolute top-0 left-0 w-20 h-[3px] bg-volt" />
        <div className="absolute bottom-0 right-0 w-16 h-[3px] bg-crimson" />

        <div
          ref={sheenRef}
          className="pointer-events-none absolute -inset-24 opacity-0 rounded-full blur-2xl"
          style={{
            background:
              'radial-gradient(circle, rgba(0,240,255,0.45) 0%, rgba(139,233,253,0.25) 45%, rgba(255,42,60,0.28) 80%, transparent 100%)',
          }}
        />

        <div className="relative z-10">
          <div className="flex flex-wrap justify-between gap-2 font-mono text-[11px] sm:text-xs md:text-sm text-cyan pb-5 sm:pb-6 border-b border-dashed border-white/20 mb-6 sm:mb-8">
            <span className="truncate max-w-full">
              {guestName ? `ACCESS_PASS // VIP: ${guestName.toUpperCase()}` : 'ACCESS_PASS // VIP_INVITATION'}
            </span>
            <span className={authorized ? 'text-volt font-bold glow-volt' : 'text-crimson'}>
              {authorized ? '✓ PASS_AUTHORIZED' : '#2026-HCMUT-CSE'}
            </span>
          </div>

          {guestName && (
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 bg-volt/10 border border-volt/40 font-mono text-[11px] text-volt tracking-widest">
              <span className="w-1.5 h-1.5 bg-volt animate-pulse" />
              <span>TO: {guestName.toUpperCase()}</span>
            </div>
          )}

          <h2 className="font-display text-[clamp(1.35rem,5.2vw,2.85rem)] leading-[1.08] mb-4">
            YOU ARE INVITED TO MY <br />
            <span className="text-volt glow-volt">GRADUATION CEREMONY</span>
          </h2>

          <p className="text-zinc-400 text-sm sm:text-base max-w-[600px] leading-relaxed mb-6 sm:mb-7">
            {guestName ? (
              <>
                Hey <span className="text-white font-semibold">{guestName}</span> — join{' '}
              </>
            ) : (
              'Join '
            )}
            <span className="text-white font-semibold">Issac Fenton (Đinh Gia Kiệt)</span> at{' '}
            <span className="text-cyan">HCMUT — Hall A5</span> for my B.S. Computer Science degree
            conferral. CS ceremony runs <span className="text-white">08:25–09:40</span>, followed by
            photos at <span className="text-volt">09:40–10:00</span>.
          </p>

          {/* Live T-Minus Countdown */}
          <div className="grid grid-cols-4 gap-2 sm:gap-4 mb-5 sm:mb-6">
            {[
              { label: 'DAYS', val: countdown.days },
              { label: 'HRS', val: countdown.hours },
              { label: 'MIN', val: countdown.mins },
              { label: 'SEC', val: countdown.secs },
            ].map((unit) => (
              <div
                key={unit.label}
                className="bg-black/65 border border-white/10 py-2.5 sm:py-3 text-center"
              >
                <div className="font-mono text-lg sm:text-2xl font-bold text-volt glow-volt">
                  {unit.val}
                </div>
                <div className="font-mono text-[9px] sm:text-[10px] text-zinc-500 tracking-widest">
                  {unit.label}
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6 mb-5 p-5 sm:p-6 bg-black/60 border-l-[3px] border-volt">
            <div>
              <span className="block font-mono text-[0.7rem] text-zinc-500 mb-1">DATE //</span>
              <span className="font-bold text-base sm:text-lg">SUN, NOV 29, 2026</span>
            </div>
            <div>
              <span className="block font-mono text-[0.7rem] text-zinc-500 mb-1">TIME //</span>
              <span className="font-bold text-base sm:text-lg">07:30 — 10:00</span>
            </div>
            <div>
              <span className="block font-mono text-[0.7rem] text-zinc-500 mb-1">SECTOR //</span>
              <span className="font-bold text-base sm:text-lg">HALL A5 — HCMUT</span>
              <span className="block font-mono text-[10px] text-zinc-400 mt-0.5">
                268 Lý Thường Kiệt, Q.10
              </span>
            </div>
          </div>

          <div className="font-mono text-[10px] sm:text-[11px] text-zinc-400 mb-7 sm:mb-8 flex flex-wrap items-center justify-between gap-2">
            <span>NOTE: No backpacks or large bags inside Hall A5.</span>
            <a
              href="https://maps.app.goo.gl/wRzdTt4PwJdDPUsF8"
              target="_blank"
              rel="noreferrer"
              className="interactive text-cyan hover:text-volt underline underline-offset-4 cursor-none"
            >
              [OPEN_GOOGLE_MAPS ↗]
            </a>
          </div>

          <div className="flex flex-col sm:flex-row gap-3.5 sm:gap-4">
            <button
              onMouseDown={startHold}
              onMouseUp={cancelHold}
              onMouseLeave={cancelHold}
              onTouchStart={startHold}
              onTouchEnd={cancelHold}
              onTouchCancel={cancelHold}
              onContextMenu={(e) => e.preventDefault()}
              style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none' }}
              className="interactive relative flex-1 py-4 sm:py-5 font-mono text-xs sm:text-sm font-bold tracking-[1.5px] bg-white/5 border border-volt text-volt clip-btn overflow-hidden cursor-none select-none touch-none active:scale-[0.99] transition-transform"
            >
              <span
                ref={holdBarRef}
                className="absolute inset-0 bg-volt origin-left scale-x-0 z-0"
              />
              <span className="relative z-10 mix-blend-difference">
                {authorized ? 'CELEBRATION_UNLOCKED 🎉 (HOLD AGAIN)' : 'HOLD 1S TO DETONATE.EXE'}
              </span>
            </button>

            <button
              onClick={downloadCalendarInvite}
              className="interactive px-6 sm:px-7 py-4 sm:py-5 font-mono text-xs sm:text-sm font-bold tracking-[1.5px] bg-cyan text-void hover:bg-volt transition-colors clip-btn cursor-none"
            >
              + SAVE_TO_CALENDAR.ICS
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}