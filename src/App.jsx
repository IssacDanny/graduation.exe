import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

import FuiHexCanvas from './components/FuiHexCanvas';
import FuiTriggerSequence from './components/FuiTriggerSequence';
import HudOverlay from './components/HudOverlay';
import Hero from './components/Hero';
import VelocityMarquee from './components/VelocityMarquee';
import MemoryShards from './components/MemoryShards';
import TechArsenal from './components/TechArsenal';
import InvitePass from './components/InvitePass';
import CyberTerminal from './components/CyberTerminal';
import { audioDirector } from './utils/audioDirector';
import { sfx } from './utils/sfx';

gsap.registerPlugin(ScrollTrigger);

export default function App() {
  const [sequenceDone, setSequenceDone] = useState(false);
  const [sequenceKey, setSequenceKey] = useState(0);
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [audioActive, setAudioActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [trackLabel, setTrackLabel] = useState('');

  const lenisRef = useRef(null);
  const sequenceDoneRef = useRef(false);

  useEffect(() => {
    // Preload MP3s while user is on boot screen so Spoiler starts with 0ms lag!
    audioDirector.preloadAll();
    const unsub = audioDirector.subscribe(({ label }) => setTrackLabel(label));

    const lenis = new Lenis({
      duration: 1.25,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    lenisRef.current = lenis;
    lenis.stop();

    lenis.on('scroll', ScrollTrigger.update);
    const updateLenis = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(updateLenis);
    gsap.ticker.lagSmoothing(0);

    const stageTrigger = ScrollTrigger.create({
      trigger: '#rebel-stage-marker',
      start: 'top 65%',
      onEnter: () => {
        if (sequenceDoneRef.current) audioDirector.setStage('rebel', { fadeMs: 1600 });
      },
      onLeaveBack: () => {
        if (sequenceDoneRef.current) audioDirector.setStage('chill', { fadeMs: 1600 });
      },
    });

    const onKeyDown = (e) => {
      if (e.key === '`') {
        e.preventDefault();
        setTerminalOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setTerminalOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      unsub();
      stageTrigger.kill();
      window.removeEventListener('keydown', onKeyDown);
      gsap.ticker.remove(updateLenis);
      lenis.destroy();
      audioDirector.stopAll();
    };
  }, []);

  const handleStartAudio = async () => {
    setAudioActive(true);
    sfx.init();
    await audioDirector.startIntro();
  };

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    sfx.setMuted(nextMuted);
    audioDirector.setMuted(nextMuted);
  };

  const handleSequenceComplete = () => {
    sequenceDoneRef.current = true;
    setSequenceDone(true);
    lenisRef.current?.start();
    ScrollTrigger.refresh();
    audioDirector.setStage('chill', { fadeMs: 1800 });
  };

  const handleReplayIntro = () => {
    sequenceDoneRef.current = false;
    setSequenceDone(false);
    lenisRef.current?.scrollTo(0, { immediate: true });
    lenisRef.current?.stop();
    audioDirector.stopAll();
    setSequenceKey((k) => k + 1);
  };

  const scrollToInvite = () => {
    sfx.click();
    audioDirector.playSubDrop();
    audioDirector.setStage('rebel', { fadeMs: 1200 });
    lenisRef.current?.scrollTo('#invite-section', { duration: 1.8 });
  };

  return (
    <>
      <FuiHexCanvas />
      <HudOverlay
        audioActive={audioActive}
        isMuted={isMuted}
        trackLabel={trackLabel}
        onToggleMute={handleToggleMute}
        onOpenTerminal={() => setTerminalOpen(true)}
      />

      <FuiTriggerSequence
        key={sequenceKey}
        onStartAudio={handleStartAudio}
        onComplete={handleSequenceComplete}
      />

      <CyberTerminal
        isOpen={terminalOpen}
        onClose={() => setTerminalOpen(false)}
        onReplayIntro={handleReplayIntro}
      />

      <main id="smooth-main" className="relative z-10">
        <Hero ready={sequenceDone} onScrollToInvite={scrollToInvite} />
        <VelocityMarquee />
        <MemoryShards />

        <div id="rebel-stage-marker" />
        <TechArsenal />
        <InvitePass />

        <footer className="border-t border-volt/15 bg-void/80 backdrop-blur-sm py-8 px-6 md:px-20 font-mono text-[11px] text-zinc-500 flex flex-wrap justify-between items-center gap-4">
          <span>SYS_EOF // GRADUATION.EXE — ISSAC FENTON // CLASS OF 2026 — HCMUT</span>
          <div className="flex items-center gap-4">
            <button
              onClick={handleReplayIntro}
              className="interactive text-crimson hover:text-white transition-colors cursor-none"
            >
              [REPLAY_INTRO]
            </button>
            <button
              onClick={() => setTerminalOpen(true)}
              className="interactive text-volt hover:text-white transition-colors cursor-none"
            >
              [OPEN_CLI: `]
            </button>
          </div>
        </footer>
      </main>
    </>
  );
}