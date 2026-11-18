import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger);

export default function VelocityMarquee() {
  const trackRef = useRef(null);

  useGSAP(() => {
    const marqueeTween = gsap.to(trackRef.current, {
      xPercent: -50,
      repeat: -1,
      duration: 18,
      ease: 'none',
    });

    ScrollTrigger.create({
      onUpdate: (self) => {
        const velocity = Math.abs(self.getVelocity());
        const speedMultiplier = Math.min(1 + velocity / 400, 6);
        gsap.to(marqueeTween, {
          timeScale: self.direction === 1 ? speedMultiplier : -speedMultiplier,
          duration: 0.3,
          overwrite: true,
        });
      },
    });
  });

  const Items = () => (
    <div className="flex gap-12 font-display text-2xl md:text-4xl font-extrabold whitespace-nowrap pr-12">
      <span>// HCMUT — B.S. COMPUTER SCIENCE</span>
      <span className="text-volt">// 0 FATAL ERRORS</span>
      <span>// 1,460 DAYS COMPILED</span>
      <span className="text-cyan">// CAFFEINE OVERCLOCKED</span>
      <span className="text-volt">// CLASS OF 2026</span>
      <span>// ISSAC FENTON // DINH GIA KIET</span>
      <span className="text-cyan">// NOV 29, 2026 @ HALL A5</span>
      <span>// GRADUATION.EXE COMPLETE</span>
    </div>
    
  );

  return (
    <section className="py-5 bg-volt/5 border-y border-volt/35 overflow-hidden -rotate-1 scale-[1.03] my-16">
      <div ref={trackRef} className="flex w-max will-change-transform">
        <Items />
        <Items />
        <Items />
        <Items />
      </div>
    </section>
  );
}