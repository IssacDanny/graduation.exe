import { useEffect, useRef, useState } from 'react';
import TrsGlyph from './TrsGlyph';
import { audioDirector } from '../../utils/audioDirector';

const CENTER_OUT_MAP = Array.from({ length: 64 }, (_, idx) => {
  const r = Math.floor(idx / 8);
  const c = idx % 8;
  const dist = (r - 3.5) ** 2 + (c - 3.5) ** 2;
  return { idx, dist, r, c };
})
  .sort((a, b) => a.dist - b.dist || a.r - b.r || a.c - b.c)
  .map((item) => item.idx);

const ROW_YS = [184, 217, 250, 283, 317, 350, 383, 416];
const COL_XS = [484, 517, 550, 583, 617, 650, 683, 716];
const DOT_COORDS = [467, 500, 533, 567, 600, 633, 667, 700, 733];
const DOT_YS = [167, 200, 233, 267, 300, 333, 367, 400, 433];

const BRAIDED_CABLES = [
  { d: 'M 248 260 C 330 260, 345 184, 418 184', ch: 0 },
  { d: 'M 248 265 C 335 265, 340 217, 418 217', ch: 0 },
  { d: 'M 248 270 C 315 270, 360 283, 418 283', ch: 1 },
  { d: 'M 248 273 C 305 273, 355 317, 418 317', ch: 2 },
  { d: 'M 248 294 C 315 294, 345 217, 418 217', ch: 0 },
  { d: 'M 248 298 C 330 298, 355 250, 418 250', ch: 1 },
  { d: 'M 248 302 C 330 302, 355 350, 418 350', ch: 2 },
  { d: 'M 248 306 C 315 306, 345 383, 418 383', ch: 3 },
  { d: 'M 248 327 C 305 327, 355 283, 418 283', ch: 1 },
  { d: 'M 248 330 C 315 330, 360 317, 418 317', ch: 2 },
  { d: 'M 248 335 C 335 335, 340 383, 418 383', ch: 3 },
  { d: 'M 248 340 C 330 340, 345 416, 418 416', ch: 3 },
];

export default function TriggerMatrixRig({
  cells = [],
  totalLen = 0,
  overflow = 0,
  exprStr = '',
  ruleLabel = 'BOOTING',
  stepNum = 0,
  activeChannel = 0,
  showSos = false,
  sosPremise = '',
  sosConclusion = '',
  lexCursor = -1,
  lexName = '',
  isBaseHit = false,
  isSlideFeed = false,
}) {
  const auraRef = useRef(null);
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 640 : false
  );

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    let rafId;
    const tick = () => {
      const { bass, high } = audioDirector.getAudioEnergy();
      if (auraRef.current) {
        auraRef.current.style.opacity = String(0.18 + bass * 0.65);
        auraRef.current.style.transform = `scale(${1 + bass * 0.12})`;
        auraRef.current.style.boxShadow = `0 0 ${24 + bass * 55}px rgba(${
          isBaseHit || bass > 0.62 ? '255, 42, 60' : '0, 240, 255'
        }, ${0.22 + high * 0.35})`;
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isBaseHit]);

  const slots = Array(64).fill(null);
  cells.slice(0, 64).forEach((cell, logicalIdx) => {
    slots[CENTER_OUT_MAP[logicalIdx]] = cell;
  });

  return (
    <div className="trigger-rig relative w-full max-w-[1220px] aspect-[3/2] sm:aspect-[2/1] flex items-center justify-center px-2 sm:px-4 my-12 sm:my-0">
      <svg
        viewBox={isMobile ? '240 60 720 480' : '0 0 1200 600'}
        className="w-full h-full overflow-visible"
      >
        <defs>
          <filter id="cyber-bloom" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2.4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g className="trig-wings">
          <g fill="#e4e4e7" opacity="0.85">
            <rect x="82" y="22" width="3.5" height="3.5" />
            <rect x="282" y="22" width="3.5" height="3.5" />
            <rect x="914" y="22" width="3.5" height="3.5" />
            <rect x="1114" y="22" width="3.5" height="3.5" />
            <rect x="82" y="574" width="3.5" height="3.5" />
            <rect x="282" y="574" width="3.5" height="3.5" />
            <rect x="914" y="574" width="3.5" height="3.5" />
            <rect x="1114" y="574" width="3.5" height="3.5" />
          </g>

          <text
            x="600"
            y="26"
            textAnchor="middle"
            fill="#f4f4f5"
            fontSize="8.5"
            fontFamily="JetBrains Mono"
            letterSpacing="12"
          >
            GRADUATE.EXE
          </text>

          <path d="M 465 92 H 520 L 534 80 H 666 L 680 92 H 735" fill="none" stroke="#9ec5d1" strokeWidth="0.9" strokeOpacity="0.65" />
          <path d="M 465 508 H 520 L 534 520 H 666 L 680 508 H 735" fill="none" stroke="#9ec5d1" strokeWidth="0.9" strokeOpacity="0.65" />

          {[-12, 0, 12].map((dx) => (
            <g key={dx} fill="#d4d4d8" opacity="0.8">
              <circle cx={600 + dx} cy="72" r="1.4" />
              <circle cx={600 + dx} cy="528" r="1.4" />
            </g>
          ))}

          {[0, 1].map((side) => (
            <g key={side} transform={side === 1 ? 'translate(1200, 0) scale(-1, 1)' : undefined}>
              <path d="M 68 286 A 16 16 0 0 0 68 314" fill="none" stroke="#e4e4e7" strokeWidth="1.2" />
              <path d="M 86 286 A 16 16 0 0 1 86 314" fill="none" stroke="#e4e4e7" strokeWidth="1.2" />
              <circle cx="77" cy="300" r="2.2" fill="#00f0ff" />

              <path d="M 60 198 L 96 162 V 132" fill="none" stroke="#94a3b8" strokeWidth="0.9" strokeOpacity="0.6" />
              <path d="M 60 402 L 96 438 V 468" fill="none" stroke="#94a3b8" strokeWidth="0.9" strokeOpacity="0.6" />
              <path d="M 102 252 V 230 H 124" fill="none" stroke="#64748b" strokeWidth="0.8" />
              <path d="M 102 348 V 370 H 124" fill="none" stroke="#64748b" strokeWidth="0.8" />

              <line x1="126" y1="68" x2="262" y2="204" stroke="#9ec5d1" strokeWidth="0.95" strokeOpacity="0.7" />
              <circle cx="194" cy="136" r="3.8" fill="#020305" stroke="#e4e4e7" strokeWidth="1.3" />
              <line x1="126" y1="532" x2="262" y2="396" stroke="#9ec5d1" strokeWidth="0.95" strokeOpacity="0.7" />
              <circle cx="194" cy="464" r="3.8" fill="#020305" stroke="#e4e4e7" strokeWidth="1.3" />

              <line x1="346" y1="74" x2="362" y2="90" stroke="#ff2a3c" strokeWidth="1.1" opacity="0.85" />
              <line x1="346" y1="526" x2="362" y2="510" stroke="#ff2a3c" strokeWidth="1.1" opacity="0.85" />
              <circle cx="155" cy="242" r="1.5" fill="#ff2a3c" />
              <circle cx="155" cy="358" r="1.5" fill="#ff2a3c" />

              <line x1="252" y1="104" x2="305" y2="104" stroke="#71717a" strokeWidth="0.9" strokeDasharray="2 2" />
              <line x1="252" y1="496" x2="305" y2="496" stroke="#71717a" strokeWidth="0.9" strokeDasharray="2 2" />
              <line x1="202" y1="252" x2="228" y2="252" stroke="#ff2a3c" strokeWidth="0.9" strokeDasharray="2 2" />
              <line x1="202" y1="348" x2="228" y2="348" stroke="#ff2a3c" strokeWidth="0.9" strokeDasharray="2 2" />

              {[258, 292, 326].map((py, pIdx) => {
                const plugActive = activeChannel === pIdx || (activeChannel === 3 && pIdx === 2);
                return (
                  <g key={py} filter={plugActive ? 'url(#cyber-bloom)' : undefined}>
                    <rect
                      x="222"
                      y={py}
                      width="26"
                      height="16"
                      fill="#0d1520"
                      stroke={plugActive ? '#00f0ff' : '#9ec5d1'}
                      strokeWidth="1"
                    />
                    <line x1="227" y1={py + 3} x2="227" y2={py + 13} stroke="#64748b" strokeWidth="1.2" />
                    <line x1="232" y1={py + 3} x2="232" y2={py + 13} stroke="#94a3b8" strokeWidth="1.2" />
                    <line x1="237" y1={py + 3} x2="237" y2={py + 13} stroke="#64748b" strokeWidth="1.2" />
                    <rect
                      x="241"
                      y={py + 2}
                      width="5"
                      height="12"
                      fill={plugActive ? (isBaseHit ? '#ff2a3c' : '#00f0ff') : '#475569'}
                    />
                  </g>
                );
              })}

              {BRAIDED_CABLES.map((cable, idx) => {
                const isActive = activeChannel === cable.ch;
                return (
                  <g key={`c-${side}-${idx}`}>
                    <path
                      d={cable.d}
                      fill="none"
                      stroke={isActive ? '#8be9fd' : '#52657a'}
                      strokeWidth={isActive ? '1.1' : '0.72'}
                      strokeOpacity={isActive ? '0.88' : '0.45'}
                      className="trig-cable-draw"
                    />
                    <path
                      d={cable.d}
                      fill="none"
                      stroke={isBaseHit ? '#ff2a3c' : isActive ? '#ffffff' : '#00f0ff'}
                      strokeWidth="1.5"
                      filter="url(#cyber-bloom)"
                      className="trig-cable-pulse"
                    />
                  </g>
                );
              })}
            </g>
          ))}

          <g fontFamily="JetBrains Mono" fontSize="6.5" letterSpacing="1">
            <text x="128" y="218" fill="#71717a">BCLK</text>
            <text x="128" y="274" fill={activeChannel === 0 ? '#00f0ff' : '#d4d4d8'}>TRS-0.0</text>
            <text x="128" y="303" fill={activeChannel === 1 ? '#00f0ff' : '#d4d4d8'}>TRS-0.1</text>
            <text x="128" y="332" fill={activeChannel === 2 || activeChannel === 3 ? '#ff2a3c' : '#d4d4d8'}>TRS-0.2</text>
            <text x="128" y="388" fill="#71717a">FREQ</text>

            <text x="215" y="294" textAnchor="end" fill="#94a3b8" fontSize="5.8">121.8b/s</text>
            <text x="215" y="316" textAnchor="end" fill="#00f0ff" fontSize="5.8">134.7b/s</text>

            <text x="1072" y="218" textAnchor="end" fill="#71717a">MEM_BUS</text>
            <text x="1072" y="274" textAnchor="end" fill="#d4d4d8">PTR:0x00</text>
            <text x="1072" y="303" textAnchor="end" fill="#d4d4d8">ARITY:OK</text>
            <text x="1072" y="332" textAnchor="end" fill={isBaseHit ? '#ff2a3c' : '#00f0ff'}>
              {isBaseHit ? 'BASE:NEG' : 'ORD:LEX'}
            </text>
            <text x="1072" y="388" textAnchor="end" fill="#71717a">2^6_SLOT</text>

            <text x="985" y="294" fill="#94a3b8" fontSize="5.8">NF:SYNC</text>
            <text x="985" y="316" fill="#00f0ff" fontSize="5.8">64_CELL</text>
          </g>
        </g>

        <g className="trig-outer-reticles">
          {[
            { x: 266, y: 120, ly: 162, val: `S:${String(stepNum).padStart(3, '0')}`, corner: 'tl' },
            { x: 910, y: 120, ly: 162, val: `M:${String(Math.min(totalLen, 64)).padStart(2, '0')}/64`, corner: 'tr' },
            { x: 266, y: 452, ly: 494, val: overflow > 0 ? `+${String(overflow).padStart(3, '0')}` : '00000', corner: 'bl' },
            { x: 910, y: 452, ly: 494, val: lexCursor >= 0 ? `0x${lexCursor.toString(16).toUpperCase().padStart(2, '0')}` : '00000', corner: 'br' },
          ].map((pos, idx) => (
            <g key={idx}>
              <circle cx={pos.x + 12} cy={pos.y + 12} r="13" fill="none" stroke="#ff2a3c" strokeWidth="0.85" strokeDasharray="4 2.5" opacity="0.75" />
              <path
                d={`M ${pos.x - 4} ${pos.y + 6} V ${pos.y - 4} H ${pos.x + 6} M ${pos.x + 18} ${pos.y - 4} H ${pos.x + 28} V ${pos.y + 6} M ${pos.x - 4} ${pos.y + 18} V ${pos.y + 28} H ${pos.x + 6} M ${pos.x + 18} ${pos.y + 28} H ${pos.x + 28} V ${pos.y + 18}`}
                fill="none"
                stroke="#ff2a3c"
                strokeWidth="1.25"
                filter="url(#cyber-bloom)"
              />
              {pos.corner === 'tl' && <path d={`M ${pos.x - 14} ${pos.y + 52} A 10 10 0 0 0 ${pos.x - 4} ${pos.y + 42}`} fill="none" stroke="#e4e4e7" strokeWidth="1.1" />}
              {pos.corner === 'tr' && <path d={`M ${pos.x + 38} ${pos.y + 52} A 10 10 0 0 1 ${pos.x + 28} ${pos.y + 42}`} fill="none" stroke="#e4e4e7" strokeWidth="1.1" />}
              {pos.corner === 'bl' && <path d={`M ${pos.x - 14} ${pos.y - 28} A 10 10 0 0 1 ${pos.x - 4} ${pos.y - 18}`} fill="none" stroke="#e4e4e7" strokeWidth="1.1" />}
              {pos.corner === 'br' && <path d={`M ${pos.x + 38} ${pos.y - 28} A 10 10 0 0 0 ${pos.x + 28} ${pos.y - 18}`} fill="none" stroke="#e4e4e7" strokeWidth="1.1" />}
              <text x={pos.x + 12} y={pos.ly} textAnchor="middle" fill="#a1a1aa" fontSize="7.5" fontFamily="JetBrains Mono" letterSpacing="1.5">
                {pos.val}
              </text>
            </g>
          ))}
        </g>

        <g className="trig-center-frame">
          <path d="M 432 136 H 460 M 432 136 V 164" stroke="#f4f4f5" strokeWidth="1.4" fill="none" />
          <path d="M 768 136 H 740 M 768 136 V 164" stroke="#f4f4f5" strokeWidth="1.4" fill="none" />
          <path d="M 432 464 H 460 M 432 464 V 436" stroke="#f4f4f5" strokeWidth="1.4" fill="none" />
          <path d="M 768 464 H 740 M 768 464 V 436" stroke="#f4f4f5" strokeWidth="1.4" fill="none" />

          <path d="M 442 156 A 14 14 0 0 0 456 142" stroke="#e4e4e7" strokeWidth="1.2" fill="none" />
          <path d="M 758 156 A 14 14 0 0 1 744 142" stroke="#e4e4e7" strokeWidth="1.2" fill="none" />
          <path d="M 442 444 A 14 14 0 0 1 456 458" stroke="#e4e4e7" strokeWidth="1.2" fill="none" />
          <path d="M 758 444 A 14 14 0 0 0 744 458" stroke="#e4e4e7" strokeWidth="1.2" fill="none" />

          <g stroke="#ff2a3c" strokeWidth="1.2" fill="none" filter="url(#cyber-bloom)">
            <path d="M 474 144 H 516 L 526 135 H 552" />
            <path d="M 726 144 H 684 L 674 135 H 648" />
            <path d="M 474 456 H 516 L 526 465 H 552" />
            <path d="M 726 456 H 684 L 674 465 H 648" />
            <path d="M 526 141 H 544 M 656 141 H 674 M 526 459 H 544 M 656 459 H 674" strokeWidth="1" />
          </g>

          <path d="M 570 138 H 630 M 570 462 H 630" stroke="#e4e4e7" strokeWidth="1.2" />
          <polygon points="434,296 441,300 434,304" fill="#f4f4f5" />
          <polygon points="766,296 759,300 766,304" fill="#f4f4f5" />

          {ROW_YS.map((y, idx) => (
            <g key={idx}>
              <line x1="418" y1={y} x2="430" y2={y} stroke="#9ec5d1" strokeWidth="0.9" />
              <line x1="770" y1={y} x2="782" y2={y} stroke="#9ec5d1" strokeWidth="0.9" />
              <text x="410" y={y + 2.5} textAnchor="end" fill="#71717a" fontSize="6" fontFamily="JetBrains Mono">{idx + 1}</text>
              <text x="790" y={y + 2.5} textAnchor="start" fill="#71717a" fontSize="6" fontFamily="JetBrains Mono">{idx + 1}</text>
              <line x1="467" y1={y} x2="733" y2={y} stroke="#ffffff" strokeWidth="0.4" strokeOpacity="0.09" strokeDasharray="3 9" />
            </g>
          ))}

          <g fill="#a1a1aa" opacity="0.55">
            {DOT_YS.map((dy) =>
              DOT_COORDS.map((dx) => (
                <rect key={`${dx}-${dy}`} x={dx - 0.75} y={dy - 0.75} width="1.5" height="1.5" />
              ))
            )}
          </g>

          <g
            className={`trig-sweep-lines transition-opacity duration-150 ${
              isSlideFeed ? 'opacity-90' : 'opacity-0'
            }`}
            stroke="#e4e4e7"
            strokeWidth="0.8"
          >
            <line x1="452" y1={ROW_YS[1]} x2="748" y2={ROW_YS[1]} />
            <line x1="452" y1={ROW_YS[3]} x2="748" y2={ROW_YS[3]} />
            <line x1="452" y1={ROW_YS[5]} x2="748" y2={ROW_YS[5]} />
            <line x1={COL_XS[2]} y1="152" x2={COL_XS[2]} y2="448" />
            <line x1={COL_XS[5]} y1="152" x2={COL_XS[5]} y2="448" />
          </g>
        </g>

        <g transform="translate(544, 566)" stroke="#d4d4d8" strokeWidth="1.2" fill="none">
          <circle cx="8" cy="8" r="4.2" />
          <path d="M29 12V7A4 4 0 0 1 37 7V12" />
          <polygon points="56,3.5 61,12.5 51,12.5" />
          <g>
            <rect x="76" y="4" width="8" height="8" />
            <circle cx="80" cy="8" r="1" fill="#00f0ff" stroke="none" />
          </g>
          <rect x="100" y="4" width="8" height="8" />
        </g>
      </svg>

      {/* Audio-Reactive Central Core Aura */}
      <div
        ref={auraRef}
        className="pointer-events-none absolute w-[39%] sm:w-[24%] aspect-square rounded-full blur-2xl will-change-transform"
        style={{
          background:
            'radial-gradient(circle, rgba(0,240,255,0.22) 0%, rgba(255,42,60,0.14) 55%, transparent 75%)',
        }}
      />

      {/* CENTRAL 8x8 FLOATING RUNE MATRIX (Scaled 2x bigger on phones!) */}
      <div className="absolute w-[37%] sm:w-[22.2%] aspect-square grid grid-cols-8 gap-1 sm:gap-1.5 p-1">
        {slots.map((cell, idx) => {
          const isLexHit = lexCursor === idx;
          const isLexVisited = lexCursor > idx;

          if (!cell) {
            return (
              <div
                key={idx}
                className={`relative flex items-center justify-center transition-colors duration-75 ${
                  isLexHit ? 'bg-crimson/35 ring-1 ring-crimson' : ''
                }`}
              >
                {isLexVisited && (
                  <span className="w-[3px] h-[3px] rounded-full bg-volt/65 shadow-[0_0_6px_#00f0ff]" />
                )}
              </div>
            );
          }

          const colorClass = isLexHit
            ? 'text-crimson scale-115 drop-shadow-[0_0_8px_rgba(255,42,60,0.9)]'
            : cell.isRedex
            ? 'text-crimson drop-shadow-[0_0_7px_rgba(255,42,60,0.8)]'
            : cell.kind === 'op'
            ? 'text-volt drop-shadow-[0_0_6px_rgba(0,240,255,0.65)]'
            : cell.kind === 'punct'
            ? 'text-zinc-500/70'
            : 'text-zinc-100';

          return (
            <div
              key={idx}
              className={`trig-glyph relative flex items-center justify-center p-0.5 transition-all duration-100 ${
                cell.isRedex ? 'bg-crimson/10 ring-1 ring-crimson/65' : ''
              } ${isLexHit ? 'ring-1 ring-white bg-crimson/30' : ''}`}
            >
              <TrsGlyph tok={cell.tok} className={`w-full h-full ${colorClass}`} />
            </div>
          );
        })}
      </div>

      {/* SOS Inference Rule Box (Clears matrix cleanly on both mobile & desktop) */}
      {showSos && (
        <div className="absolute -top-12 sm:top-[5%] left-1/2 -translate-x-1/2 w-[92%] sm:w-auto max-w-[92vw] bg-[#05070c]/95 border border-volt/65 px-3 sm:px-5 py-1.5 sm:py-2 font-mono text-[8.5px] sm:text-[10px] text-center pointer-events-none z-30 shadow-[0_0_25px_rgba(0,240,255,0.2)]">
          <div className="text-volt tracking-wider pb-1 border-b border-white/25 truncate">
            {sosPremise}
          </div>
          <div className="text-white font-bold tracking-widest pt-1 truncate">{sosConclusion}</div>
        </div>
      )}

      {/* Lexicographical Name Search Banner */}
      {lexName && (
        <div className="absolute -top-11 sm:top-[5.5%] left-1/2 -translate-x-1/2 whitespace-nowrap bg-[#05070c]/95 border border-crimson/80 px-4 sm:px-6 py-1.5 sm:py-2 font-mono text-[10px] sm:text-sm tracking-[3px] sm:tracking-[4px] text-white z-30 shadow-[0_0_25px_rgba(255,42,60,0.3)]">
          LEX_SEARCH: <span className="text-volt font-bold glow-volt">{lexName}</span>
        </div>
      )}

      {/* Active TRS Term Readout */}
      <div className="absolute -bottom-9 sm:bottom-[8%] left-1/2 -translate-x-1/2 max-w-[92%] sm:max-w-[85%] truncate font-mono text-[9px] sm:text-[10px] text-zinc-300 bg-[#05070c]/90 px-3 py-1 border border-white/15">
        <span className="text-crimson mr-2 font-bold">TERM&gt;</span>
        {exprStr}
        {overflow > 0 && <span className="text-volt ml-2">[TRUNC +{overflow}]</span>}
      </div>

      {/* Mobile Rule Footer */}
      <div className="sm:hidden absolute -bottom-16 left-1/2 -translate-x-1/2 w-[92%] truncate text-center font-mono text-[8.5px] text-cyan/80 tracking-widest">
        {ruleLabel}
      </div>
    </div>
  );
}