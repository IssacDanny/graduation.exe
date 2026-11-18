import { useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import TriggerMatrixRig from './fui/TriggerMatrixRig';
import { buildSlideAndFeedTimeline } from '../utils/trsEngine';
import { detonateCyberConfetti } from '../utils/confetti';
import { audioDirector } from '../utils/audioDirector';
import { getGuestName } from '../utils/guest';

const TARGET_NAME = 'ISSAC_FENTON'; // <-- CHANGE YOUR NAME HERE

export default function FuiTriggerSequence({ onStartAudio, onComplete }) {
  const containerRef = useRef(null);
  const timerRef = useRef(null);
  const progressBarRef = useRef(null);
  const tlRef = useRef(null);
  const guestName = useMemo(() => getGuestName(), []);

  const trsFrames = useMemo(() => buildSlideAndFeedTimeline(), []);

  const [booting, setBooting] = useState(false);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [frameIdx, setFrameIdx] = useState(0);
  const [showSos, setShowSos] = useState(false);
  const [lexCursor, setLexCursor] = useState(-1);
  const [lexName, setLexName] = useState('');

  const handleExecute = async () => {
    if (booting || started) return;
    setBooting(true);
    await onStartAudio();
    setBooting(false);
    setStarted(true);
  };

  const handleSkip = () => {
    if (tlRef.current) tlRef.current.kill();
    audioDirector.playGlitchBlip();
    gsap.to(containerRef.current, {
      clipPath: 'polygon(0 0, 100% 0, 100% 0%, 0 0%)',
      duration: 0.6,
      ease: 'expo.inOut',
      onComplete: () => {
        setFinished(true);
        onComplete();
      },
    });
  };

  useGSAP(
    () => {
      if (!started) return;

      const clockObj = { sec: 0 };
      const trsObj = { idx: 0 };
      const lexObj = { cell: 0, charProg: 0 };

      const tl = gsap.timeline({
        onComplete: () => {
          setFinished(true);
          onComplete();
        },
      });
      tlRef.current = tl;

      tl.to(
        clockObj,
        {
          sec: 30,
          duration: 30,
          ease: 'none',
          onUpdate: () => {
            if (timerRef.current) {
              timerRef.current.textContent = `${clockObj.sec.toFixed(2).padStart(5, '0')}s / 30.00s`;
            }
          },
        },
        0
      ).to(progressBarRef.current, { scaleX: 1, duration: 30, ease: 'none' }, 0);

      const cableEls = gsap.utils.toArray('.trig-cable-draw');
      cableEls.forEach((p) => {
        const len = p.getTotalLength();
        gsap.set(p, { strokeDasharray: len, strokeDashoffset: len });
      });
      gsap.set('.trig-cable-pulse', { strokeDasharray: '14 250', strokeDashoffset: 0, opacity: 0 });
      gsap.set('.trig-wings', { opacity: 0 });

      // ACT 1: GENESIS Staged Mount
      tl.from('.trig-outer-reticles', { opacity: 0, scale: 1.12, duration: 0.5, ease: 'power3.out' }, 0.15)
        .from('.trig-center-frame', { opacity: 0, scale: 0.94, duration: 0.6, ease: 'power3.out' }, 0.25)
        .to('.trig-wings', { opacity: 1, duration: 0.75, ease: 'power2.out' }, 0.65)
        .to(cableEls, { strokeDashoffset: 0, duration: 1.15, stagger: 0.03, ease: 'power3.inOut' }, 0.7)
        .to('.trig-cable-pulse', { opacity: 0.85, duration: 0.35 }, 1.75)
        .to('.trig-cable-pulse', { strokeDashoffset: -264, duration: 1.1, repeat: 23, ease: 'none' }, 1.75);

      // ACT 1B & ACT 2: LIVE REAL TRS REDUCTIONS + SOS + GLITCH BLIPS
      tl.to(
        trsObj,
        {
          idx: trsFrames.length - 1,
          duration: 17.5,
          ease: 'none',
          onUpdate: () => {
            const nextIdx = Math.min(trsFrames.length - 1, Math.floor(trsObj.idx));
            setFrameIdx((prev) => (prev === nextIdx ? prev : nextIdx));
          },
        },
        2.0
      )
        .call(() => { setShowSos(true); audioDirector.playGlitchBlip(); }, null, 6.2)
        .call(() => setShowSos(false), null, 8.8)
        .call(() => { setShowSos(true); audioDirector.playGlitchBlip(); }, null, 11.2)
        .call(() => setShowSos(false), null, 15.8)
        .call(() => { setShowSos(true); audioDirector.playGlitchBlip(); }, null, 17.2)
        .call(() => setShowSos(false), null, 19.4);

      // ACT 3: LEXICOGRAPHICAL SEARCH
      const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_';
      tl.to(
        lexObj,
        {
          cell: 63,
          charProg: 1,
          duration: 6.4,
          ease: 'power1.inOut',
          onUpdate: () => {
            setLexCursor(Math.floor(lexObj.cell));
            const p = lexObj.charProg;
            const lockedCount = Math.floor(p * TARGET_NAME.length);
            let out = '';
            for (let i = 0; i < TARGET_NAME.length; i++) {
              const targetCh = TARGET_NAME[i];
              if (i < lockedCount) {
                out += targetCh;
              } else {
                const targetIdx = Math.max(0, alphabet.indexOf(targetCh));
                const localP = Math.min(1, Math.max(0, p * TARGET_NAME.length - i));
                const curIdx = Math.min(targetIdx, Math.floor(localP * targetIdx));
                out += alphabet[curIdx] || 'A';
              }
            }
            setLexName(out);
          },
        },
        19.6
      ).call(() => {
        setLexCursor(-1);
        setLexName(TARGET_NAME);
      }, null, 26.1);

      // FINALE (26.5s - 30.0s): SUB-DROP + CONFETTI EXPLOSION
      tl.to('.trigger-rig', { opacity: 0, scale: 1.06, duration: 0.45, ease: 'power2.in' }, 26.3)
        .set('.fui-climax', { opacity: 1 }, 26.6)
        .call(() => {
          detonateCyberConfetti();
          audioDirector.playSubDrop();
        }, null, 26.65)
        .from('.climax-badge', { scale: 1.25, opacity: 0, duration: 0.55, ease: 'expo.out' }, 26.65)
        .to(
          containerRef.current,
          { clipPath: 'polygon(0 0, 100% 0, 100% 0%, 0 0%)', duration: 0.9, ease: 'expo.inOut' },
          29.1
        );
    },
    { scope: containerRef, dependencies: [started, trsFrames] }
  );

  if (finished) return null;

  const cur = trsFrames[frameIdx] || trsFrames[0];

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-void cyber-grid-bg z-200 flex items-center justify-center overflow-hidden select-none"
      style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)' }}
    >
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgba(0,240,255,0.09) 0%, rgba(255,42,60,0.04) 42%, rgba(2,3,5,0.94) 85%)',
        }}
      />

      {!started && (
        <div className="relative z-20 w-full max-w-[1260px] md:min-h-[540px] px-6 flex items-center justify-center">
          <svg
            viewBox="0 0 1200 540"
            preserveAspectRatio="xMidYMid meet"
            className="hidden md:block absolute inset-0 w-full h-full pointer-events-none overflow-visible"
          >
            <defs>
              <filter id="boot-bloom" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <g fill="#e4e4e7" opacity="0.75">
              <rect x="24" y="18" width="4" height="4" />
              <rect x="240" y="18" width="4" height="4" />
              <rect x="956" y="18" width="4" height="4" />
              <rect x="1172" y="18" width="4" height="4" />
              <rect x="24" y="518" width="4" height="4" />
              <rect x="240" y="518" width="4" height="4" />
              <rect x="956" y="518" width="4" height="4" />
              <rect x="1172" y="518" width="4" height="4" />
            </g>

            <path d="M 350 42 H 500 L 518 28 H 682 L 700 42 H 850" fill="none" stroke="#8be9fd" strokeWidth="1" strokeOpacity="0.5" />
            <path d="M 350 498 H 500 L 518 512 H 682 L 700 498 H 850" fill="none" stroke="#8be9fd" strokeWidth="1" strokeOpacity="0.5" />

            {[0, 1].map((side) => (
              <g key={side} transform={side === 1 ? 'translate(1200, 0) scale(-1, 1)' : undefined}>
                <path d="M 42 256 A 16 16 0 0 0 42 284" fill="none" stroke="#e4e4e7" strokeWidth="1.2" />
                <path d="M 60 256 A 16 16 0 0 1 60 284" fill="none" stroke="#e4e4e7" strokeWidth="1.2" />
                <circle cx="51" cy="270" r="2.2" fill="#00f0ff" />

                <path d="M 34 172 L 72 134 V 96" fill="none" stroke="#64748b" strokeWidth="0.9" />
                <path d="M 34 368 L 72 406 V 444" fill="none" stroke="#64748b" strokeWidth="0.9" />
                <path d="M 94 235 H 146 L 166 215 H 192" fill="none" stroke="#00f0ff" strokeWidth="0.9" strokeOpacity="0.55" />
                <path d="M 94 305 H 146 L 166 325 H 192" fill="none" stroke="#00f0ff" strokeWidth="0.9" strokeOpacity="0.55" />
                <path d="M 86 270 H 182" fill="none" stroke="#ff2a3c" strokeWidth="0.8" strokeDasharray="3 4" strokeOpacity="0.7" />

                <line x1="92" y1="50" x2="196" y2="154" stroke="#9ec5d1" strokeWidth="1" strokeOpacity="0.6" />
                <circle cx="144" cy="102" r="4" fill="#020305" stroke="#e4e4e7" strokeWidth="1.3" />
                <line x1="92" y1="490" x2="196" y2="386" stroke="#9ec5d1" strokeWidth="1" strokeOpacity="0.6" />
                <circle cx="144" cy="438" r="4" fill="#020305" stroke="#e4e4e7" strokeWidth="1.3" />

                <g stroke="#ff2a3c" strokeWidth="1.3" fill="none" filter="url(#boot-bloom)">
                  <path d="M 192 92 H 264 L 280 78 H 370" />
                  <path d="M 192 448 H 264 L 280 462 H 370" />
                  <path d="M 176 198 V 146 L 198 124" />
                  <path d="M 176 342 V 394 L 198 416" />
                </g>

                <path d="M 188 108 H 222 M 188 108 V 142" stroke="#f4f4f5" strokeWidth="1.4" fill="none" />
                <path d="M 188 432 H 222 M 188 432 V 398" stroke="#f4f4f5" strokeWidth="1.4" fill="none" />
                <path d="M 200 130 A 14 14 0 0 0 214 116" stroke="#00f0ff" strokeWidth="1.2" fill="none" />
                <path d="M 200 410 A 14 14 0 0 1 214 424" stroke="#00f0ff" strokeWidth="1.2" fill="none" />

                <polygon points="180,265 189,270 180,275" fill="#00f0ff" />

                {[92, 424].map((ry) => (
                  <g key={ry} transform={`translate(122, ${ry})`}>
                    <circle cx="12" cy="12" r="12" fill="none" stroke="#ff2a3c" strokeWidth="0.9" strokeDasharray="3 2.5" opacity="0.8" />
                    <path
                      d="M -3 5 V -3 H 5 M 19 -3 H 27 V 5 M -3 19 V 27 H 5 M 19 27 H 27 V 19"
                      fill="none"
                      stroke="#ff2a3c"
                      strokeWidth="1.2"
                    />
                  </g>
                ))}
              </g>
            ))}
          </svg>

          <div className="relative z-10 text-center max-w-4xl mx-auto py-8">
            <div className="inline-flex items-center gap-3 font-mono text-[10px] sm:text-[11px] tracking-[2.5px] sm:tracking-[3px] text-cyan border border-cyan/35 bg-cyan/5 px-4 py-1.5 mb-7 max-w-[90vw] truncate">
              <span className="w-2 h-2 bg-crimson animate-ping shrink-0" />
              <span className="truncate">
                {guestName
                  ? `VIP_LINK // WELCOME, ${guestName.toUpperCase()}`
                  : 'NEURAL_TRS // 8x8 MEMORY READY'}
              </span>
            </div>

            <div className="font-mono text-xs sm:text-sm tracking-[0.45em] text-zinc-300 mb-3">
              TRIGGGER // SYSTEM_BOOT
            </div>

            <h1 className="font-display font-extrabold tracking-tight leading-[1.05] text-[clamp(1.35rem,4.6vw,3.75rem)] text-volt glow-volt glitch-hover mb-4 sm:mb-5">
              GRADUATE.EXE
            </h1>

            <p className="font-mono text-[10px] sm:text-xs text-zinc-400 mb-8 sm:mb-10 tracking-[1.5px] sm:tracking-[2px] px-2">
              30.00s TRS + SOS + LEXICOGRAPHICAL SEARCH // AUDIO RECOMMENDED
            </p>

            <button
              onClick={handleExecute}
              disabled={booting}
              className="interactive group relative px-10 py-4 sm:px-12 sm:py-5 font-mono text-xs sm:text-sm font-bold tracking-[2.5px] text-void clip-btn overflow-hidden cursor-none shadow-[0_0_35px_rgba(0,240,255,0.35)] hover:shadow-[0_0_55px_rgba(255,42,60,0.55)] transition-shadow disabled:opacity-75"
            >
              <span className="absolute inset-0 bg-volt group-hover:bg-white transition-colors duration-200 z-0" />
              <span className="relative z-10">
                {booting ? 'SYNCING_AUDIO...' : '▶ EXECUTE GRADUATE.EXE'}
              </span>
            </button>
          </div>
        </div>
      )}

      {started && (
        <>
          <div className="fixed top-0 left-0 right-0 z-40">
            <div className="h-[2px] w-full bg-white/10">
              <div
                ref={progressBarRef}
                className="h-full w-full bg-volt origin-left scale-x-0 shadow-[0_0_10px_#00f0ff]"
              />
            </div>
            <div className="flex justify-between items-center px-4 sm:px-6 py-3 sm:py-4 font-mono text-[10px] sm:text-[11px]">
              <span ref={timerRef} className="text-zinc-400 tracking-widest">
                00.00s / 30.00s
              </span>
              <button
                onClick={handleSkip}
                className="interactive px-3 py-1 border border-white/20 text-zinc-400 hover:text-volt hover:border-volt transition-colors cursor-none"
              >
                SKIP &gt;&gt;
              </button>
            </div>
          </div>

          <TriggerMatrixRig
            cells={cur.tokens.cells}
            totalLen={cur.tokens.totalLen}
            overflow={cur.tokens.overflow}
            exprStr={cur.str}
            ruleLabel={`${cur.label} // ${cur.rule}`}
            stepNum={cur.step}
            activeChannel={cur.channel}
            showSos={showSos}
            sosPremise={cur.sosPremise}
            sosConclusion={cur.sosConclusion}
            lexCursor={lexCursor}
            lexName={lexName}
            isBaseHit={cur.isBaseHit}
            isSlideFeed={cur.phase === 'SLIDE_FEED'}
          />

          <div className="fui-climax fixed inset-0 flex items-center justify-center opacity-0 pointer-events-none z-30 px-4">
            <div className="climax-badge w-full max-w-[94vw] text-center">
              <div className="inline-block px-3 sm:px-4 py-1 bg-crimson text-white font-mono text-[9px] sm:text-xs font-bold tracking-[2px] sm:tracking-[3px] mb-3 sm:mb-4 shadow-[0_0_24px_rgba(255,42,60,0.65)]">
                NORMAL_FORM // EXIT(0) = 2026
              </div>
              <div className="font-display text-[clamp(1.2rem,5.2vw,4.75rem)] leading-[1.08] font-extrabold text-white tracking-tight glow-volt whitespace-nowrap">
                {TARGET_NAME}
              </div>
              <div className="font-mono text-[9px] sm:text-xs md:text-sm text-volt mt-3 sm:mt-4 tracking-[2px] sm:tracking-[4px]">
                DINH GIA KIET // B.S. COMPUTER SCIENCE — HCMUT
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}