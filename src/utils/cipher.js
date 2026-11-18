import gsap from 'gsap';

export function cipherReveal(element, finalText, duration = 1.1) {
  if (!element) return;
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_/#$%&*';
  const state = { p: 0 };

  gsap.to(state, {
    p: 1,
    duration,
    ease: 'power2.out',
    onUpdate: () => {
      const revealed = Math.floor(state.p * finalText.length);
      let out = '';
      for (let i = 0; i < finalText.length; i++) {
        if (finalText[i] === ' ') out += ' ';
        else if (i < revealed) out += finalText[i];
        else out += chars[Math.floor(Math.random() * chars.length)];
      }
      element.textContent = out;
    },
    onComplete: () => {
      element.textContent = finalText;
    },
  });
}