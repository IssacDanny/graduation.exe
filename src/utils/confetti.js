import gsap from 'gsap';
import confetti from 'canvas-confetti';

export function detonateCyberConfetti() {
  const cyberColors = ['#fcee0a', '#00f0ff', '#ff003c', '#ffffff'];

  gsap.fromTo(
    '#smooth-main',
    { x: -6, y: 4 },
    { x: 0, y: 0, duration: 0.4, ease: 'elastic.out(1.2, 0.2)' }
  );

  confetti({ particleCount: 110, spread: 95, origin: { y: 0.65 }, colors: cyberColors });
  setTimeout(() => {
    confetti({ particleCount: 60, angle: 60, spread: 60, origin: { x: 0, y: 0.7 }, colors: cyberColors });
    confetti({ particleCount: 60, angle: 120, spread: 60, origin: { x: 1, y: 0.7 }, colors: cyberColors });
  }, 180);
}