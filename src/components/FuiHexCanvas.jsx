import { useEffect, useRef } from 'react';
import { audioDirector } from '../utils/audioDirector';

export default function FuiHexCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const mouse = { x: width / 2, y: height / 2 };
    let hexes = [];

    const buildHexGrid = () => {
      hexes = [];
      const r = 24;
      const w = Math.sqrt(3) * r;
      const dy = 1.5 * r;
      const cols = Math.ceil(width / w) + 2;
      const rows = Math.ceil(height / dy) + 2;

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const cx = col * w + (row % 2 === 1 ? w / 2 : 0);
          const cy = row * dy;
          hexes.push({ cx, cy, r });
        }
      }
    };

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      buildHexGrid();
    };

    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    buildHexGrid();
    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);

    let time = 0;

    const drawHex = (cx, cy, r) => {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 6;
        const px = cx + r * Math.cos(angle);
        const py = cy + r * Math.sin(angle);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
    };

    const render = () => {
      const { bass, mid } = audioDirector.getAudioEnergy();
      time += 0.025 + bass * 0.015;
      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;
      const maxDim = Math.max(width, height) * 0.58;
      const pulseRadius = (time * 180) % maxDim;
      const ringBand = 55 + bass * 35;

      for (let i = 0; i < hexes.length; i++) {
        const { cx, cy, r } = hexes[i];
        const distCenter = Math.hypot(cx - centerX, cy - centerY);
        const distMouse = Math.hypot(cx - mouse.x, cy - mouse.y);

        const ambient = Math.max(0, 1 - distCenter / maxDim) * (0.045 + mid * 0.045);
        const mouseGlow = Math.max(0, 1 - distMouse / 190) * (0.25 + bass * 0.14);
        const ringGlow =
          Math.max(0, 1 - Math.abs(distCenter - pulseRadius) / ringBand) * (0.08 + bass * 0.18);

        const alpha = ambient + mouseGlow + ringGlow;
        if (alpha < 0.03) continue;

        drawHex(cx, cy, r - 2);
        if (ringGlow > mouseGlow && ringGlow > 0.045) {
          ctx.strokeStyle = `rgba(255, 42, 60, ${Math.min(0.65, alpha * (1.1 + bass * 0.9))})`;
          ctx.lineWidth = 1.0 + bass * 0.9;
        } else {
          ctx.strokeStyle = `rgba(0, 240, 255, ${Math.min(0.65, alpha)})`;
          ctx.lineWidth = mouseGlow > 0.1 ? 1.25 : 0.7;
        }
        ctx.stroke();

        if (mouseGlow > 0.17) {
          ctx.fillStyle = `rgba(0, 240, 255, ${mouseGlow * 0.14})`;
          ctx.fill();
          ctx.fillStyle = `rgba(255, 42, 60, ${mouseGlow * 0.55})`;
          ctx.fillRect(cx - 1, cy - 1, 2, 2);
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none" />;
}