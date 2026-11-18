import { useEffect, useRef, useState } from 'react';
import { detonateCyberConfetti } from '../utils/confetti';
import { reduceTrace, formatTerm } from '../utils/trsEngine';
import { audioDirector } from '../utils/audioDirector';
import { buildGuestInviteUrl } from '../utils/guest';
import { sfx } from '../utils/sfx';
import TrsEvalVisualizer from './fui/TrsEvalVisualizer';

const QUICK_BUTTONS = [
  { label: '▶ 99 + 1', cmd: 'eval Add(99, 1)' },
  { label: '▶ Make 2026', cmd: 'eval Add(Mul(45, 45), 1)' },
  { label: '▶ GCD(48, 18)', cmd: 'eval GCD(48, 18)' },
  { label: '▶ -18 ÷ 12', cmd: 'eval Div(Neg(18), 12)' },
  { label: '🎉 Confetti', cmd: 'sudo graduate' },
  { label: '? Guide', cmd: 'guide' },
];

const GUIDE_EXAMPLES = [
  {
    title: '99 + 1 = 100',
    subtitle: 'Watch digits carry over like dominoes',
    cmd: 'eval Add(99, 1)',
    tag: 'EASY',
  },
  {
    title: '100 - 1 = 99',
    subtitle: 'Watch the machine borrow from 100',
    cmd: 'eval Sub(100, 1)',
    tag: 'EASY',
  },
  {
    title: '45 × 45 + 1 = 2026',
    subtitle: 'Builds my graduation year (+ confetti!)',
    cmd: 'eval Add(Mul(45, 45), 1)',
    tag: 'SPECIAL',
  },
  {
    title: 'GCD(48, 18) = 6',
    subtitle: 'Euclidean modulo loop on Channel 3',
    cmd: 'eval GCD(48, 18)',
    tag: 'CS / TRS',
  },
  {
    title: '-18 ÷ 12 = -3/2',
    subtitle: 'Simplifies a fraction across all channels',
    cmd: 'eval Div(Neg(18), 12)',
    tag: 'ADVANCED',
  },
];

// Lets non-technical guests type normal math like "12 + 5" or "eval 45 * 45"
function toTrsExpr(raw) {
  const s = raw.trim();
  const m = s.match(/^(-?\d+)\s*([+\-*/×÷])\s*(-?\d+)$/);
  if (!m) return s;

  const fmt = (n) => (n.startsWith('-') ? `Neg(${n.slice(1)})` : n);
  const a = fmt(m[1]);
  const b = fmt(m[3]);

  switch (m[2]) {
    case '+':
      return `Add(${a}, ${b})`;
    case '-':
      return `Sub(${a}, ${b})`;
    case '*':
    case '×':
      return `Mul(${a}, ${b})`;
    case '/':
    case '÷':
      return `Div(${a}, ${b})`;
    default:
      return s;
  }
}

export default function CyberTerminal({ isOpen, onClose, onReplayIntro }) {
  const [input, setInput] = useState('');
  const [evalSession, setEvalSession] = useState(null);
  const [showGuide, setShowGuide] = useState(false);
  const [history, setHistory] = useState([
    {
      type: 'sys',
      text: "GRADUATE.EXE SHELL v2.5 — TAP [? GUIDE] FOR EASY WALKTHROUGH, OR TYPE 'help' / '12 + 5'",
    },
  ]);
  const inputRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (isOpen && !evalSession && !showGuide) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, evalSession, showGuide]);

  useEffect(() => {
    if (!showGuide) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [history, showGuide]);

  if (!isOpen) return null;

  const executeEval = (expr, newLines) => {
    try {
      const { trace, finalTerm } = reduceTrace(expr, 1000);
      newLines.push({ type: 'sys', text: `[TRS] Initial: ${trace[0].str}` });

      const preview = trace.slice(1, 6);
      preview.forEach((step) => {
        newLines.push({ type: 'res', text: `  [${step.step}] ${step.str}   (${step.rule})` });
      });
      if (trace.length > 7) {
        newLines.push({
          type: 'sys',
          text: `  ... (${trace.length - 7} intermediate steps omitted) ...`,
        });
      }

      newLines.push({
        type: 'volt',
        text: `=> NORMAL FORM (${trace.length - 1} steps): ${formatTerm(finalTerm)}`,
      });
      setHistory((prev) => [...prev, ...newLines]);
      setEvalSession({ expr, trace, finalTerm });
    } catch (err) {
      newLines.push({
        type: 'err',
        text: `TRS_ERR: ${err.message} — Try "12 + 5", "eval GCD(48, 18)", or tap [? GUIDE].`,
      });
      setHistory((prev) => [...prev, ...newLines]);
    }
  };

  const runCommand = (rawCmd) => {
    const trimmed = rawCmd.trim();
    const cmd = trimmed.toLowerCase();
    sfx.click();

    if (cmd === 'guide' || cmd === 'manual') {
      setShowGuide(true);
      return;
    }

    setShowGuide(false);
    const newLines = [{ type: 'cmd', text: `guest@trs-machine:~$ ${rawCmd}` }];

    // Support both "eval Add(12, 5)" and "eval 12 + 5"
    if (cmd.startsWith('eval ')) {
      const expr = toTrsExpr(trimmed.slice(5).trim());
      executeEval(expr, newLines);
      return;
    }

    // Support direct plain math without "eval ", e.g. "12 + 5" or "45 * 45"
    if (/^(-?\d+)\s*([+\-*/×÷])\s*(-?\d+)$/.test(trimmed)) {
      const expr = toTrsExpr(trimmed);
      executeEval(expr, newLines);
      return;
    }

    if (cmd.startsWith('invite ')) {
      const guest = trimmed.slice(7).trim();
      if (!guest) {
        newLines.push({ type: 'err', text: 'USAGE: invite <Guest Name>' });
      } else {
        const vipUrl = buildGuestInviteUrl(guest);
        navigator.clipboard?.writeText(vipUrl).catch(() => {});
        newLines.push({ type: 'volt', text: `VIP LINK FOR "${guest}" (COPIED TO CLIPBOARD):` });
        newLines.push({ type: 'sys', text: vipUrl });
      }
      setHistory((prev) => [...prev, ...newLines]);
      return;
    }

    switch (cmd) {
      case 'help':
        newLines.push({
          type: 'res',
          text: 'COMMANDS: guide | eval <expr> | <a + b> | invite <name> | trs | whoami | party | sudo graduate | replay | clear | exit',
        });
        break;
      case 'trs':
        newLines.push({
          type: 'res',
          text: 'BIG-ENDIAN STRING TRS: Add, Sub (borrow), Mul, Div, IntDiv, IntMod, GCD, Frac, Reduce, Rat, Neg, Abs',
        });
        break;
      case 'whoami':
        newLines.push({
          type: 'res',
          text: 'SUBJECT: ISSAC FENTON (DINH GIA KIET) // B.S. Computer Science — HCMUT',
        });
        break;
      case 'party':
        newLines.push({
          type: 'volt',
          text: '>> SUN, NOV 29, 2026 @ 07:30 (Photos 09:40–10:00) — HALL A5, HCMUT (268 Lý Thường Kiệt).',
        });
        break;
      case 'sudo graduate':
        detonateCyberConfetti();
        audioDirector.playSubDrop();
        audioDirector.setStage('rebel', { fadeMs: 800 });
        newLines.push({
          type: 'volt',
          text: 'NORMAL FORM VERIFIED! EXIT_CODE(0) — CONFETTI DEPLOYED!',
        });
        break;
      case 'replay':
        onClose();
        onReplayIntro();
        return;
      case 'clear':
        setHistory([]);
        return;
      case 'exit':
        onClose();
        return;
      case '':
        break;
      default:
        newLines.push({
          type: 'err',
          text: `ERR: command not found "${trimmed}". Try "12 + 5", "help", or tap [? GUIDE].`,
        });
    }

    setHistory((prev) => [...prev, ...newLines]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    runCommand(input);
    setInput('');
  };

  return (
    <>
      <div className="fixed inset-0 z-150 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
        <div className="w-full max-w-2xl max-h-[85dvh] flex flex-col bg-[#06080d] border border-volt/60 shadow-[0_0_55px_rgba(0,240,255,0.22)] clip-chamfer overflow-hidden font-mono text-xs md:text-sm">
          {/* Header */}
          <div className="bg-[#0c111a] px-4 sm:px-5 py-3 border-b border-volt/20 flex justify-between items-center gap-2 shrink-0">
            <span className="text-volt tracking-widest truncate">
              {showGuide ? '// MANUAL_GUIDE — EASY & TRS MODE' : '// TRS_CLI — LIVE REWRITE ENGINE'}
            </span>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  sfx.click();
                  setShowGuide((g) => !g);
                }}
                className={`interactive px-2.5 py-0.5 border transition-colors cursor-none ${
                  showGuide
                    ? 'bg-volt text-void border-volt font-bold'
                    : 'border-cyan/60 text-cyan hover:border-volt hover:text-volt'
                }`}
              >
                {showGuide ? '[< TERMINAL]' : '[? GUIDE]'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="interactive text-crimson hover:text-white px-2 py-0.5 border border-crimson/50 cursor-none"
              >
                [CLOSE]
              </button>
            </div>
          </div>

          {/* Body: Simple + Technical Guide OR Classic CLI Log */}
          {showGuide ? (
            <div
              data-lenis-prevent
              className="p-4 sm:p-5 h-60 sm:h-80 flex-1 min-h-0 overflow-y-auto space-y-5 text-xs"
            >
              <div>
                <div className="text-volt font-bold tracking-wider mb-1.5">
                  1. WHAT DOES THIS DO?
                </div>
                <p className="text-zinc-300 leading-relaxed font-sans text-sm">
                  This is the same visual math machine that powered the 30-second intro! Give it
                  any math problem and watch it solve the expression step-by-step using glowing
                  cyber symbols.
                </p>
              </div>

              <div>
                <div className="text-volt font-bold tracking-wider mb-2">
                  2. TAP ANY DEMO TO WATCH IT PLAY
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {GUIDE_EXAMPLES.map((ex) => (
                    <button
                      key={ex.cmd}
                      type="button"
                      onClick={() => runCommand(ex.cmd)}
                      className="interactive text-left bg-black/55 hover:bg-volt/10 border border-white/15 hover:border-volt p-3 transition-colors cursor-none"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-white font-bold text-sm">▶ {ex.title}</span>
                        <span className="text-[9px] px-1.5 py-0.5 bg-crimson/20 text-crimson border border-crimson/40">
                          {ex.tag}
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-400 font-sans">{ex.subtitle}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-volt font-bold tracking-wider mb-2">
                  3. WHAT DO THE GLOWING SYMBOLS MEAN?
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                  <div className="bg-crimson/10 border border-crimson/50 p-2.5">
                    <div className="text-crimson font-bold mb-0.5">RED BOX (REDEX)</div>
                    <div className="text-zinc-300 font-sans">The piece being solved right now</div>
                  </div>
                  <div className="bg-black/50 border border-volt/30 p-2.5">
                    <div className="text-volt font-bold mb-0.5">CYAN SYMBOLS</div>
                    <div className="text-zinc-300 font-sans">Math actions (+, −, ×, ÷, GCD)</div>
                  </div>
                  <div className="bg-black/50 border border-white/15 p-2.5">
                    <div className="text-white font-bold mb-0.5">WHITE SYMBOLS</div>
                    <div className="text-zinc-300 font-sans">Digits (0 to 9)</div>
                  </div>
                </div>
              </div>

              <div>
                <div className="text-volt font-bold tracking-wider mb-1.5">
                  4. TRY TYPING YOUR OWN (EASY OR TRS MODE)
                </div>
                <p className="text-zinc-300 font-sans text-xs leading-relaxed">
                  <strong className="text-white">Easy Mode:</strong> Just type{' '}
                  <span className="font-mono text-cyan">25 + 75</span>,{' '}
                  <span className="font-mono text-cyan">12 * 12</span>,{' '}
                  <span className="font-mono text-cyan">100 - 1</span>, or{' '}
                  <span className="font-mono text-cyan">18 / 12</span>.
                  <br />
                  <strong className="text-white">CS / TRS Mode:</strong> Nest rules like{' '}
                  <span className="font-mono text-cyan">eval Add(Mul(45, 45), 1)</span> using{' '}
                  <span className="font-mono text-zinc-400">
                    Add, Sub, Mul, Div, IntDiv, IntMod, GCD, Neg, Abs, Rat
                  </span>
                  .
                  <br />
                  <strong className="text-white">Extra Commands:</strong>{' '}
                  <span className="font-mono text-volt">sudo graduate</span> (confetti),{' '}
                  <span className="font-mono text-volt">invite Name</span> (VIP link),{' '}
                  <span className="font-mono text-volt">party</span>,{' '}
                  <span className="font-mono text-volt">replay</span>.
                </p>
              </div>
            </div>
          ) : (
            <div
              data-lenis-prevent
              className="p-4 sm:p-5 h-48 sm:h-72 flex-1 min-h-0 overflow-y-auto space-y-1.5"
              onClick={() => inputRef.current?.focus()}
            >
              {history.map((line, i) => (
                <div
                  key={i}
                  className={
                    line.type === 'cmd'
                      ? 'text-zinc-400 break-words'
                      : line.type === 'err'
                      ? 'text-crimson break-words'
                      : line.type === 'volt'
                      ? 'text-volt font-bold break-words'
                      : line.type === 'sys'
                      ? 'text-cyan break-words'
                      : 'text-zinc-200 break-words'
                  }
                >
                  {line.text}
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          )}

          {/* Quick-Tap Buttons */}
          <div className="px-4 sm:px-5 py-2.5 border-t border-white/10 bg-black/40 flex flex-wrap gap-1.5 sm:gap-2 shrink-0">
            {QUICK_BUTTONS.map((btn) => (
              <button
                key={btn.label}
                type="button"
                onClick={() => runCommand(btn.cmd)}
                className="interactive text-[10px] sm:text-[11px] px-2.5 py-1 border border-cyan/35 text-cyan hover:border-volt hover:text-volt transition-colors cursor-none"
              >
                {btn.label}
              </button>
            ))}
          </div>

          {/* Command Prompt */}
          <form onSubmit={handleSubmit} className="flex items-center px-4 sm:px-5 py-3 border-t border-white/10 bg-black/60 shrink-0">
            <span className="text-crimson mr-2 font-bold">$</span>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="try '12 + 5', 'eval GCD(48, 18)', or 'help'..."
              className="w-full bg-transparent outline-none text-white placeholder:text-zinc-500 cursor-text text-xs sm:text-sm"
            />
          </form>
        </div>
      </div>

      {evalSession && (
        <TrsEvalVisualizer
          expr={evalSession.expr}
          trace={evalSession.trace}
          finalTerm={evalSession.finalTerm}
          onClose={() => setEvalSession(null)}
        />
      )}
    </>
  );
}