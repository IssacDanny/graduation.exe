import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger);

// CUSTOMIZE YOUR CS SKILLS & PROJECTS HERE
const ARSENAL_CARDS = [
  {
    id: '01',
    tag: 'CORE_STACK // FRONTEND',
    title: 'REACT & MOTION',
    metric: '99.9% FPS',
    desc: 'Crafting hyper-responsive interfaces using React.js, Tailwind CSS, GSAP Timelines, and WebGL/Canvas shaders.',
    chips: ['React 19', 'GSAP', 'Tailwind v4', 'Canvas API', 'Vite'],
    accent: 'border-volt/60 hover:border-volt',
    bar: 'bg-volt',
  },
  {
    id: '02',
    tag: 'SYSTEMS // ALGORITHMS',
    title: 'CS FUNDAMENTALS',
    metric: 'O(log n)',
    desc: 'Deep understanding of memory management, concurrency, operating systems, data structures, and distributed architecture.',
    chips: ['C / C++', 'Python', 'Data Structures', 'OS', 'Networking'],
    accent: 'border-cyan/60 hover:border-cyan',
    bar: 'bg-cyan',
  },
  {
    id: '03',
    tag: 'CAPSTONE // DEPLOYED',
    title: 'GRADUATION.EXE',
    metric: '100% STATIC',
    desc: 'An Awwwards-inspired cyberpunk digital experience built from scratch with zero backend overhead.',
    chips: ['Lenis Smooth Scroll', 'Web Audio API', 'SVG HUD', 'GitHub Actions'],
    accent: 'border-crimson/60 hover:border-crimson',
    bar: 'bg-crimson',
  },
  {
    id: '04',
    tag: 'NEXT_ARC // AVAILABLE',
    title: 'OPEN TO BUILD',
    metric: 'STATUS: READY',
    desc: 'Officially graduating and ready to engineer ambitious products, creative web experiences, and scalable software.',
    chips: ['Full-Stack', 'Creative Dev', 'UI Engineering', 'Software Eng'],
    accent: 'border-volt/60 hover:border-volt',
    bar: 'bg-volt',
  },
];

export default function TechArsenal() {
  const sectionRef = useRef(null);
  const trackRef = useRef(null);
  const [scrollDist, setScrollDist] = useState(1200);

  useEffect(() => {
    const updateSize = () => {
      if (!trackRef.current) return;
      const dist = Math.max(0, trackRef.current.scrollWidth - window.innerWidth);
      setScrollDist(dist);
      ScrollTrigger.refresh();
    };

    updateSize();
    document.fonts?.ready?.then(updateSize);

    const ro = new ResizeObserver(updateSize);
    if (trackRef.current) ro.observe(trackRef.current);
    window.addEventListener('resize', updateSize);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  useGSAP(
    () => {
      const track = trackRef.current;
      if (!track || scrollDist <= 0) return;

      gsap.fromTo(
        track,
        { x: 0 },
        {
          x: () => -Math.max(0, track.scrollWidth - window.innerWidth),
          ease: 'none',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top top',
            end: 'bottom bottom',
            scrub: 0.5,
            invalidateOnRefresh: true,
          },
        }
      );
    },
    { scope: sectionRef, dependencies: [scrollDist] }
  );

  return (
    <section
      ref={sectionRef}
      style={{ height: `calc(100dvh + ${scrollDist}px)` }}
      className="relative"
    >
      <div className="sticky top-0 h-[100dvh] flex flex-col justify-center overflow-hidden border-y border-white/10 bg-[#06080e]/80 cyber-grid-bg pt-12 sm:pt-0">
        <div className="px-5 sm:px-8 md:px-20 mb-5 sm:mb-8 flex justify-between items-end">
          <div>
            <span className="font-mono text-[10px] sm:text-xs text-crimson tracking-[2.5px] sm:tracking-[3px]">
              // ARCHIVE_02 — HORIZONTAL_DRIVE
            </span>
            <h2 className="font-display text-[clamp(1.45rem,5.5vw,3rem)] font-extrabold mt-1">
              TECH <span className="text-volt glow-volt">ARSENAL</span>
            </h2>
          </div>
          <div className="hidden md:block font-mono text-xs text-zinc-400 tracking-widest">
            KEEP SCROLLING TO TRAVERSE &gt;&gt;
          </div>
        </div>

        <div ref={trackRef} className="flex gap-5 sm:gap-8 px-5 sm:px-8 md:px-20 w-max items-stretch">
          {ARSENAL_CARDS.map((card) => (
            <article
              key={card.id}
              className={`interactive w-[86vw] sm:w-[65vw] md:w-[48vw] lg:w-[38vw] shrink-0 bg-[#0b0e15]/95 border ${card.accent} p-6 sm:p-8 md:p-10 clip-chamfer flex flex-col justify-between relative group transition-colors duration-300`}
            >
              <div className={`absolute top-0 left-0 w-14 h-[3px] ${card.bar}`} />
              <div>
                <div className="flex justify-between items-start mb-4 sm:mb-6">
                  <span className="font-mono text-[10px] sm:text-xs text-cyan tracking-[2px]">{card.tag}</span>
                  <span className="font-display text-3xl sm:text-4xl font-extrabold text-white/15 group-hover:text-volt/45 transition-colors">
                    {card.id}
                  </span>
                </div>

                <h3 className="font-display text-xl sm:text-3xl md:text-4xl font-extrabold mb-3 sm:mb-4">
                  {card.title}
                </h3>

                <p className="text-zinc-400 text-xs sm:text-sm md:text-base leading-relaxed mb-5 sm:mb-8">
                  {card.desc}
                </p>
              </div>

              <div>
                <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-5 sm:mb-6">
                  {card.chips.map((chip) => (
                    <span
                      key={chip}
                      className="font-mono text-[0.65rem] sm:text-[0.7rem] px-2 sm:px-2.5 py-1 bg-white/5 border border-white/10 text-zinc-300 group-hover:border-volt/30 transition-colors"
                    >
                      {chip}
                    </span>
                  ))}
                </div>

                <div className="pt-3.5 sm:pt-4 border-t border-white/10 flex justify-between font-mono text-[11px] sm:text-xs">
                  <span className="text-zinc-500">TELEMETRY</span>
                  <span className="text-volt font-bold">{card.metric}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}