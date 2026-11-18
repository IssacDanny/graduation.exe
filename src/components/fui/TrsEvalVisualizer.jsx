import { useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import TriggerMatrixRig from './TriggerMatrixRig';
import { formatTerm, tokenizeTermForMatrix } from '../../utils/trsEngine';
import { audioDirector } from '../../utils/audioDirector';
import { detonateCyberConfetti } from '../../utils/confetti';
import { sfx } from '../../utils/sfx';

const CHANNEL_NAMES = ['00:CANON', '01:RING', '10:MUL', '11:EUCLID'];

export default function TrsEvalVisualizer({ expr, trace, finalTerm, onClose }) {
  const wrapRef = useRef(null);

  const frames = useMemo(() => {
    const stride = trace.length > 90 ? Math.ceil(trace.length / 75) : 1;
    const sampled = trace.filter(
      (item, idx) =>
        idx === 0 ||
        idx === trace.length - 1 ||
        item.isBaseHit ||
        idx % stride === 0 ||
        (idx > 0 && trace[idx - 1].channel !== item.channel)
    );

    return sampled.map((item) => ({
      ...item,
      tokens: tokenizeTermForMatrix(item.term, item.activeRedex),
    }));
  }, [trace]);

  const [stepIdx, setStepIdx] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [sweepFlash, setSweepFlash] = useState(false);

  const finalStr = useMemo(() => formatTerm(finalTerm), [finalTerm]);
  const isDone = stepIdx >= frames.length - 1;
  const cur = frames[stepIdx] || frames[0];

  const baseStepMs = useMemo(() => {
    if (frames.length <= 8) return 520;
    if (frames.length <= 20) return 320;
    if (frames.length <= 45) return 180;
    return 110;
  }, [frames.length]);

  useGSAP(
    () => {
      const cableEls = gsap.utils.toArray('.trig-cable-draw');
      cableEls.forEach((p) => {
        const len = p.getTotalLength();
        gsap.set(p, { strokeDasharray: len, strokeDashoffset: len });
      });
      gsap.set('.trig-cable-pulse', { strokeDasharray: '14 250', strokeDashoffset: 0, opacity: 0.85 });

      const tl = gsap.timeline();
      tl.from('.trig-center-frame, .trig-outer-reticles', {
        opacity: 0,
        scale: 0.94,
        duration: 0.4,
        ease: 'power3.out',
      })
        .from('.trig-wings', { opacity: 0, duration: 0.45 }, 0.1)
        .to(cableEls, { strokeDashoffset: 0, duration: 0.65, stagger: 0.02, ease: 'power3.out' }, 0.05)
        .to('.trig-cable-pulse', { strokeDashoffset: -264, duration: 1.0, repeat: -1, ease: 'none' }, 0.3);
    },
    { scope: wrapRef }
  );

  useEffect(() => {
    if (!playing || isDone) return;

    const timer = setTimeout(() => {
      setStepIdx((prev) => {
        const next = Math.min(frames.length - 1, prev + 1);
        const prevFrame = frames[prev];
        const nextFrame = frames[next];

        if (nextFrame && prevFrame && (nextFrame.channel !== prevFrame.channel || nextFrame.isBaseHit)) {
          setSweepFlash(true);
          audioDirector.playGlitchBlip();
          setTimeout(() => setSweepFlash(false), 160);
        }

        if (next === frames.length - 1) {
          audioDirector.playSubDrop();
          if (finalStr === "'2026'") {
            detonateCyberConfetti();
          }
        }

        return next;
      });
    }, baseStepMs / speed);

    return () => clearTimeout(timer);
  }, [playing, isDone, stepIdx, frames, baseStepMs, speed, finalStr]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      } else if (e.key === ' ') {
        e.preventDefault();
        setPlaying((p) => !p);
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onClose]);

  const handleReplay = () => {
    sfx.click();
    setStepIdx(0);
    setPlaying(true);
  };

  return (
    <div
      ref={wrapRef}
      className="fixed inset-0 h-[100dvh] z-170 bg-void/95 cyber-grid-bg backdrop-blur-md flex flex-col items-center justify-center overflow-hidden select-none"
    >
      {/* Top Eval Telemetry Bar */}
      <div className="fixed top-0 left-0 right-0 px-3 sm:px-6 py-3 sm:py-4 flex justify-between items-center gap-2 border-b border-volt/20 bg-void/85 font-mono text-[10px] sm:text-[11px] z-40">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 bg-crimson animate-ping shrink-0" />
          <span className="text-volt font-bold truncate">CLI // {expr}</span>
          <span className="hidden md:inline text-zinc-500 shrink-0">
            [{CHANNEL_NAMES[cur.channel] || '00:CANON'}]
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-zinc-400">
            {String(cur.step).padStart(3, '0')}/{String(trace.length - 1).padStart(3, '0')}
          </span>
          <button
            onClick={() => {
              sfx.click();
              onClose();
            }}
            className="interactive px-2.5 sm:px-3 py-1 border border-crimson/60 text-crimson hover:bg-crimson hover:text-white transition-colors cursor-none"
          >
            [BACK]
          </button>
        </div>
      </div>

      <div className="w-full flex items-center justify-center pt-12 pb-16">
        <TriggerMatrixRig
          cells={cur.tokens.cells}
          totalLen={cur.tokens.totalLen}
          overflow={cur.tokens.overflow}
          exprStr={cur.str}
          ruleLabel={
            isDone
              ? `NORMAL_FORM // ${trace.length - 1} STEPS`
              : `CH:${CHANNEL_NAMES[cur.channel]} // ${cur.rule}`
          }
          stepNum={cur.step}
          activeChannel={cur.channel}
          showSos={true}
          sosPremise={isDone ? 't ->* NF  |-  0 REDEXES REMAINING' : `RULE_FIRE: ${cur.rule}`}
          sosConclusion={
            isDone
              ? `EXIT(0) => ${finalStr}`
              : `CHANNEL ${CHANNEL_NAMES[cur.channel]} // STEP ${cur.step}`
          }
          isBaseHit={cur.isBaseHit}
          isSlideFeed={sweepFlash}
        />
      </div>

      {/* Bottom Playback Controls */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 flex items-center justify-center gap-1.5 sm:gap-2 bg-[#070a11]/95 border border-volt/30 px-3 sm:px-4 py-2 font-mono text-[10px] sm:text-[11px] z-40 shadow-[0_0_25px_rgba(0,240,255,0.15)] whitespace-nowrap">
        <button
          onClick={() => {
            sfx.click();
            setPlaying(false);
            setStepIdx((s) => Math.max(0, s - 1));
          }}
          className="interactive px-2.5 py-1.5 border border-white/15 text-zinc-300 hover:border-volt hover:text-volt cursor-none"
        >
          &lt; STEP
        </button>

        <button
          onClick={() => {
            sfx.click();
            if (isDone) handleReplay();
            else setPlaying((p) => !p);
          }}
          className="interactive px-3.5 py-1.5 bg-volt text-void font-bold hover:bg-white transition-colors cursor-none"
        >
          {isDone ? '↻ REPLAY' : playing ? '❚❚ PAUSE' : '▶ PLAY'}
        </button>

        <button
          onClick={() => {
            sfx.click();
            setPlaying(false);
            setStepIdx((s) => Math.min(frames.length - 1, s + 1));
          }}
          className="interactive px-2.5 py-1.5 border border-white/15 text-zinc-300 hover:border-volt hover:text-volt cursor-none"
        >
          STEP &gt;
        </button>

        <button
          onClick={() => {
            sfx.click();
            setSpeed((sp) => (sp === 1 ? 2 : 1));
          }}
          className="interactive px-2.5 py-1.5 border border-cyan/40 text-cyan hover:border-volt cursor-none"
        >
          {speed}X
        </button>
      </div>
    </div>
  );
}