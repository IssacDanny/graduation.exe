import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { cipherReveal } from '../utils/cipher';

const YEARS_DATA = [
  {
    num: '01 // YEAR_FRESHMAN',
    title: 'HELLO_WORLD.C',
    desc: 'Entered the mainframe. Discovered that missing a single semicolon can ruin an entire Tuesday night.',
    stat: 'STATUS: SYNTAX_SURVIVED',
  },
  {
    num: '02 // YEAR_SOPHOMORE',
    title: 'POINTERS & PAIN',
    desc: 'Battled Data Structures, Algorithms, and Segmentation Faults at 3:00 AM. Became one with Big-O notation.',
    stat: 'STATUS: MEMORY_LEAK_PATCHED',
  },
  {
    num: '03 // YEAR_JUNIOR',
    title: 'STACK_OVERFLOW',
    desc: 'Built full-stack systems, broke production databases, mastered Git rebasing under extreme pressure.',
    stat: 'STATUS: MERGE_RESOLVED',
  },
  {
    num: '04 // YEAR_SENIOR',
    title: 'DEPLOY_DEGREE.EXE',
    desc: 'Capstone shipped. Thesis compiled. All degree dependencies successfully resolved. Ready for the next arc.',
    stat: 'STATUS: MISSION_COMPLETE',
    isFinal: true,
  },
];

export default function MemoryShards() {
  const sectionRef = useRef(null);
  const titleRef = useRef(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const cards = section.querySelectorAll('.shard-card');
    gsap.set(cards, { y: 36, opacity: 0 });

    let revealed = false;
    const reveal = () => {
      if (revealed) return;
      revealed = true;

      if (titleRef.current) {
        cipherReveal(titleRef.current, '4-YEAR RUNTIME LOGS', 1.0);
      }

      gsap.to(cards, {
        y: 0,
        opacity: 1,
        stagger: 0.1,
        duration: 0.65,
        ease: 'power3.out',
        clearProps: 'transform,opacity',
      });
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          reveal();
          observer.disconnect();
        }
      },
      { threshold: 0.08 }
    );

    observer.observe(section);

    return () => {
      observer.disconnect();
      gsap.killTweensOf(cards);
      gsap.set(cards, { clearProps: 'transform,opacity' });
      if (titleRef.current) {
        titleRef.current.textContent = '4-YEAR RUNTIME LOGS';
      }
    };
  }, []);

  return (
    <section ref={sectionRef} className="max-w-[1380px] mx-auto px-6 md:px-14 py-24">
      <div className="mb-12">
        <span className="font-mono text-crimson text-sm tracking-[2px]">// ARCHIVE_01</span>
        <h2 ref={titleRef} className="font-display text-[clamp(1.5rem,6vw,3.75rem)] font-extrabold mt-2">
          4-YEAR RUNTIME LOGS
        </h2>
      </div>

      <div className="shards-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
        {YEARS_DATA.map((item) => (
          <article
            key={item.num}
            className={`shard-card interactive relative bg-[#0b0e15]/90 border border-white/15 p-6 xl:p-7 clip-shard flex flex-col justify-between transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-1.5 group ${
              item.isFinal
                ? 'hover:border-volt hover:shadow-[0_0_28px_rgba(0,240,255,0.18)]'
                : 'hover:border-cyan hover:shadow-[0_0_24px_rgba(139,233,253,0.14)]'
            }`}
          >
            <div
              className={`absolute top-0 right-0 w-10 h-[2px] transition-colors ${
                item.isFinal ? 'bg-volt' : 'bg-crimson/60 group-hover:bg-cyan'
              }`}
            />

            <div>
              <div className="flex items-center justify-between font-mono text-[11px] text-cyan mb-4">
                <span>{item.num}</span>
                <span
                  className={`w-1.5 h-1.5 ${
                    item.isFinal ? 'bg-volt animate-pulse' : 'bg-crimson/70'
                  }`}
                />
              </div>
              <h3 className="text-[1.15rem] xl:text-[1.28rem] font-bold tracking-tight mb-3 group-hover:text-white transition-colors">
                {item.title}
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed mb-6">{item.desc}</p>
            </div>

            <div
              className={`font-mono text-[0.7rem] tracking-wide pt-4 border-t border-white/10 whitespace-nowrap ${
                item.isFinal ? 'text-volt font-bold' : 'text-zinc-500'
              }`}
            >
              {item.stat}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}