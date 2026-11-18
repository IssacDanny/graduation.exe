import * as THREE from 'three';

const W = 2400;
const H = 1080;
const CX = W / 2;
const CY = H / 2;

function makeCanvas(w = W, h = H) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function toTexture(canvas) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  return tex;
}

function createGlassGrainPattern(ctx, density = 0.25) {
  const nc = makeCanvas(128, 128);
  const nctx = nc.getContext('2d');
  const img = nctx.createImageData(128, 128);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.random();
    if (v > 0.64) {
      img.data[i] = 248;
      img.data[i + 1] = 205;
      img.data[i + 2] = 112;
      img.data[i + 3] = Math.min(255, Math.round(28 * density));
    } else if (v < 0.26) {
      img.data[i] = 16;
      img.data[i + 1] = 10;
      img.data[i + 2] = 2;
      img.data[i + 3] = Math.min(255, Math.round(32 * density));
    }
  }
  nctx.putImageData(img, 0, 0);
  return ctx.createPattern(nc, 'repeat');
}

function applyOpticalBloom(sourceCanvas, blurPx = 6, glowAlpha = 0.35) {
  const out = makeCanvas();
  const ctx = out.getContext('2d');

  if ('filter' in ctx) ctx.filter = `blur(${blurPx}px)`;
  ctx.globalAlpha = glowAlpha;
  ctx.drawImage(sourceCanvas, 0, 0);

  if ('filter' in ctx) ctx.filter = 'none';
  ctx.globalAlpha = 1;
  ctx.drawImage(sourceCanvas, 0, 0);

  return out;
}

function hexPath(ctx, x, y, r) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i - Math.PI / 6;
    const px = x + r * Math.cos(a);
    const py = y + r * Math.sin(a);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

function polyPath(ctx, pts) {
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
  ctx.closePath();
}

function hash2d(x, y) {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return n - Math.floor(n);
}

function clusterMask(x, y) {
  const ax = Math.abs(x - CX);
  const dy = y - CY;
  const n1 = Math.sin(ax * 0.021) * Math.cos(dy * 0.023);
  const n2 = Math.cos(ax * 0.036 - dy * 0.029);
  const n3 = Math.sin(ax * 0.011 + dy * 0.014);
  return 0.5 + 0.5 * (n1 * 0.45 + n2 * 0.35 + n3 * 0.2);
}

function drawPlateHelper(ctx, pts, gx1, gy1, gx2, gy2, colA, colB, colC, hexMode = 'none', hexBright = 0.85, feather = 4, grainPat = null) {
  ctx.save();
  polyPath(ctx, pts);
  const grad = ctx.createLinearGradient(gx1, gy1, gx2, gy2);
  grad.addColorStop(0, colA);
  grad.addColorStop(0.55, colB);
  grad.addColorStop(1, colC);

  if (feather > 0) {
    ctx.shadowColor = colB;
    ctx.shadowBlur = feather;
  }
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.clip();
  if (grainPat) {
    ctx.fillStyle = grainPat;
    ctx.fillRect(0, 0, W, H);
  }

  if (hexMode !== 'none') {
    const hr = hexMode === 'blade' ? 7.2 : 8.0;
    const hdx = Math.sqrt(3) * hr;
    const hdy = 1.5 * hr;
    for (let y = 40; y < H - 40; y += hdy) {
      const row = Math.round(y / hdy);
      for (let x = 60; x < W - 60; x += hdx) {
        const hx = x + (row % 2 === 1 ? hdx / 2 : 0);
        const ax = Math.abs(hx - CX);
        const cVal = clusterMask(hx, y);

        let bias = 1;
        if (hexMode === 'inner-brow') {
          bias = Math.max(0.08, 1.18 - Math.hypot((ax - 195) * 0.72, (y - (CY - 270)) * 0.95) / 165);
        }
        const v = cVal * bias;
        if (v < 0.25) continue;

        hexPath(ctx, hx, y, hr - 0.95);
        const a = Math.min(0.95, Math.pow(v, 1.0) * hexBright);
        ctx.strokeStyle = `rgba(255, 214, 102, ${a})`;
        ctx.lineWidth = 1.05;
        ctx.stroke();

        if (v > 0.62 && hash2d(row * 3, Math.round(x)) > 0.54) {
          ctx.fillStyle = `rgba(255, 220, 118, ${a * 0.38})`;
          ctx.fill();
        }
      }
    }
  }
  ctx.restore();
}

export function buildMechanicalGridTextures() {
  // =========================================================
  // LAYER 0 (Z = -2.2): WARM OCHRE ATMOSPHERE, PATCHY HEX & BOKEH
  // =========================================================
  const c0 = makeCanvas();
  const ctx0 = c0.getContext('2d');

  const coreGlow = ctx0.createRadialGradient(CX, CY - 10, 15, CX, CY - 10, 520);
  coreGlow.addColorStop(0, 'rgba(235, 182, 78, 0.34)');
  coreGlow.addColorStop(0.35, 'rgba(168, 112, 32, 0.16)');
  coreGlow.addColorStop(0.75, 'rgba(72, 42, 8, 0.05)');
  coreGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx0.fillStyle = coreGlow;
  ctx0.fillRect(0, 0, W, H);

  [-1, 1].forEach((s) => {
    const sideGlow = ctx0.createRadialGradient(CX + s * 1080, CY + 45, 40, CX + s * 1040, CY + 45, 460);
    sideGlow.addColorStop(0, 'rgba(232, 170, 64, 0.52)');
    sideGlow.addColorStop(0.55, 'rgba(148, 94, 22, 0.26)');
    sideGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx0.fillStyle = sideGlow;
    ctx0.fillRect(0, 0, W, H);
  });

  const r = 9.0;
  const dx = Math.sqrt(3) * r;
  const dy = 1.5 * r;

  for (let y = 20; y <= H - 20; y += dy) {
    const row = Math.round(y / dy);
    for (let x = 0; x <= W; x += dx) {
      const hx = x + (row % 2 === 1 ? dx / 2 : 0);
      const ax = Math.abs(hx - CX);
      const ay = y - CY;

      const dOval = Math.hypot(ax * 1.0, ay * 0.72);
      const centerMask = Math.max(0, 1 - dOval / 520);
      const edgeMask = ax > 820 ? Math.min(1, (ax - 820) / 180) * Math.max(0, 1 - Math.abs(ay - 30) / 480) : 0;

      const cl = Math.pow(clusterMask(hx, y), 1.6);
      const val = Math.max(centerMask, edgeMask) * (0.22 + cl * 1.05);
      if (val < 0.25) continue;

      hexPath(ctx0, hx, y, r - 1.1);
      const alpha = Math.min(0.88, val * 0.78);
      ctx0.strokeStyle = `rgba(238, 184, 76, ${alpha})`;
      ctx0.lineWidth = val > 0.60 ? 1.25 : 0.8;
      ctx0.stroke();

      if (val > 0.68 && hash2d(row, Math.round(x)) > 0.58) {
        ctx0.fillStyle = `rgba(242, 194, 88, ${alpha * 0.36})`;
        ctx0.fill();
      }
    }
  }

  ctx0.save();
  if ('filter' in ctx0) ctx0.filter = 'blur(10px)';
  ctx0.lineCap = 'round';
  [-1, 1].forEach((s) => {
    ctx0.strokeStyle = 'rgba(205, 138, 42, 0.28)';
    ctx0.lineWidth = 10;
    ctx0.beginPath();
    ctx0.moveTo(CX + s * 305, CY + 95);
    ctx0.lineTo(CX + s * 225, CY + 95);
    ctx0.lineTo(CX + s * 225, CY + 205);
    ctx0.lineTo(CX + s * 335, CY + 205);
    ctx0.stroke();

    ctx0.strokeStyle = 'rgba(185, 122, 34, 0.26)';
    ctx0.lineWidth = 14;
    ctx0.beginPath();
    ctx0.arc(CX + s * 215, CY - 410, 44, Math.PI * 0.15, Math.PI * 1.35);
    ctx0.stroke();

    ctx0.strokeStyle = 'rgba(175, 114, 30, 0.30)';
    ctx0.lineWidth = 18;
    ctx0.beginPath();
    ctx0.arc(CX + s * 285, CY - 345, 58, Math.PI * 0.65, Math.PI * 1.75);
    ctx0.stroke();

    ctx0.fillStyle = 'rgba(235, 182, 72, 0.48)';
    ctx0.beginPath();
    ctx0.arc(CX + s * 122, CY + 54, 15, 0, Math.PI * 2);
    ctx0.fill();

    ctx0.fillStyle = 'rgba(220, 155, 52, 0.26)';
    ctx0.beginPath();
    ctx0.arc(CX + s * 235, CY - 355, 22, 0, Math.PI * 2);
    ctx0.fill();
  });
  ctx0.restore();

  const c0Bloom = applyOpticalBloom(c0, 7, 0.36);

  // =========================================================
  // LAYER CORE (Z = -0.55): STATIONARY CENTER BUTTERFLY & VERTICAL AXIS
  // (Remains locked in center while left/right doors open at 00:03!)
  // =========================================================
  const cCore = makeCanvas();
  const ctxCore = cCore.getContext('2d');
  const coreGrain = createGlassGrainPattern(ctxCore, 1.05);

  const vGrad = ctxCore.createLinearGradient(CX, 70, CX, 950);
  vGrad.addColorStop(0, 'rgba(242, 202, 122, 0.2)');
  vGrad.addColorStop(0.2, 'rgba(242, 202, 122, 0.62)');
  vGrad.addColorStop(0.8, 'rgba(242, 202, 122, 0.62)');
  vGrad.addColorStop(1, 'rgba(242, 202, 122, 0.18)');
  ctxCore.strokeStyle = vGrad;
  ctxCore.lineWidth = 1.0;
  ctxCore.beginPath();
  ctxCore.moveTo(CX, 75);
  ctxCore.lineTo(CX, 225);
  ctxCore.moveTo(CX, 260);
  ctxCore.lineTo(CX, 445);
  ctxCore.moveTo(CX, 610);
  ctxCore.lineTo(CX, 725);
  ctxCore.moveTo(CX, 760);
  ctxCore.lineTo(CX, 935);
  ctxCore.stroke();

  ctxCore.fillStyle = '#fff5dc';
  ctxCore.fillRect(CX - 8, CY - 0.75, 5, 1.5);
  ctxCore.fillRect(CX + 3, CY - 0.75, 5, 1.5);
  ctxCore.fillRect(CX - 0.75, CY - 8, 1.5, 5);
  ctxCore.fillRect(CX - 0.75, CY + 3, 1.5, 5);
  polyPath(ctxCore, [[CX - 4, CY - 14], [CX + 4, CY - 14], [CX, CY - 8]]);
  ctxCore.fill();

  ctxCore.fillStyle = '#ffe896';
  ctxCore.fillRect(CX - 1.5, CY + 455, 3, 18);

  ctxCore.strokeStyle = 'rgba(248, 194, 78, 0.85)';
  ctxCore.lineWidth = 1.4;
  ctxCore.beginPath();
  ctxCore.moveTo(CX - 38, CY + 408);
  ctxCore.lineTo(CX - 22, CY + 428);
  ctxCore.lineTo(CX + 22, CY + 428);
  ctxCore.lineTo(CX + 38, CY + 408);
  ctxCore.stroke();

  [-1, 1].forEach((s) => {
    // 4A. Small dark-amber inner-waist tab
    drawPlateHelper(
      ctxCore,
      [
        [CX + s * 36, CY - 10],
        [CX + s * 22, CY - 4],
        [CX + s * 18, CY + 14],
        [CX + s * 32, CY + 24],
        [CX + s * 42, CY + 12],
      ],
      CX + s * 20, CY - 6,
      CX + s * 40, CY + 22,
      'rgba(148, 92, 24, 0.92)',
      'rgba(116, 68, 16, 0.88)',
      'rgba(84, 46, 10, 0.84)',
      'none',
      0.85,
      1,
      coreGrain
    );

    // 4B. Big back Butterfly Armor Plate
    ctxCore.save();
    const coreBigPts = [
      [CX + s * 30, CY - 78],
      [CX + s * 46, CY - 84],
      [CX + s * 76, CY - 86],
      [CX + s * 86, CY - 68],
      [CX + s * 68, CY - 48],
      [CX + s * 108, CY - 12],
      [CX + s * 66, CY + 44],
      [CX + s * 40, CY + 44],
      [CX + s * 32, CY + 24],
      [CX + s * 32, CY - 12],
      [CX + s * 24, CY - 46],
    ];

    polyPath(ctxCore, coreBigPts);
    const coreG = ctxCore.createLinearGradient(CX + s * 60, CY - 86, CX + s * 60, CY + 44);
    coreG.addColorStop(0, 'rgba(218, 158, 52, 0.94)');
    coreG.addColorStop(0.5, 'rgba(186, 126, 36, 0.90)');
    coreG.addColorStop(1, 'rgba(148, 94, 22, 0.86)');
    ctxCore.fillStyle = coreG;
    ctxCore.fill();

    ctxCore.clip();
    if (coreGrain) {
      ctxCore.fillStyle = coreGrain;
      ctxCore.fillRect(CX - 130, CY - 110, 260, 175);
    }

    polyPath(ctxCore, [
      [CX + s * 74, CY - 24],
      [CX + s * 108, CY - 12],
      [CX + s * 66, CY + 44],
      [CX + s * 44, CY + 10],
    ]);
    ctxCore.fillStyle = 'rgba(116, 68, 14, 0.26)';
    ctxCore.fill();

    ctxCore.strokeStyle = 'rgba(255, 228, 128, 0.92)';
    ctxCore.lineWidth = 1.5;
    ctxCore.beginPath();
    ctxCore.moveTo(CX + s * 80, CY - 14);
    ctxCore.lineTo(CX + s * 62, CY + 4);
    ctxCore.lineTo(CX + s * 44, CY + 4);
    ctxCore.lineTo(CX + s * 38, CY + 12);
    ctxCore.stroke();
    ctxCore.fillStyle = '#fff6d0';
    ctxCore.fillRect(CX + s * 37, CY + 10, 3, 3);
    ctxCore.restore();

    // 4C. Small bright golden Upper Crown Plate
    ctxCore.save();
    const smallCrownPts = [
      [CX + s * 34, CY - 72],
      [CX + s * 42, CY - 84],
      [CX + s * 52, CY - 84],
      [CX + s * 60, CY - 96],
      [CX + s * 68, CY - 92],
      [CX + s * 64, CY - 84],
      [CX + s * 78, CY - 82],
      [CX + s * 88, CY - 68],
      [CX + s * 74, CY - 54],
      [CX + s * 56, CY - 54],
      [CX + s * 42, CY - 62],
    ];

    ctxCore.shadowColor = 'rgba(62, 30, 4, 0.65)';
    ctxCore.shadowBlur = 5;
    ctxCore.shadowOffsetX = s * 1.5;
    ctxCore.shadowOffsetY = 3;

    polyPath(ctxCore, smallCrownPts);
    const crownGrad = ctxCore.createLinearGradient(CX + s * 55, CY - 94, CX + s * 55, CY - 54);
    crownGrad.addColorStop(0, 'rgba(255, 228, 98, 0.96)');
    crownGrad.addColorStop(1, 'rgba(242, 192, 64, 0.94)');
    ctxCore.fillStyle = crownGrad;
    ctxCore.fill();

    ctxCore.shadowBlur = 0;
    ctxCore.shadowOffsetX = 0;
    ctxCore.shadowOffsetY = 0;
    ctxCore.clip();
    if (coreGrain) {
      ctxCore.fillStyle = coreGrain;
      ctxCore.fillRect(CX - 110, CY - 105, 220, 65);
    }
    ctxCore.restore();

    ctxCore.fillStyle = 'rgba(248, 208, 96, 0.85)';
    [
      [90, -94],
      [98, -84],
      [106, -96],
      [96, -70],
      [84, -104],
    ].forEach(([dxp, dyp]) => {
      ctxCore.fillRect(CX + s * dxp, CY + dyp, 2, 2);
    });

    ctxCore.strokeStyle = 'rgba(255, 224, 128, 0.88)';
    ctxCore.lineWidth = 1.2;
    polyPath(ctxCore, [
      [CX + s * 10, CY - 46],
      [CX + s * 14, CY - 58],
      [CX + s * 16, CY - 46],
    ]);
    ctxCore.stroke();
  });

  const cCoreBloom = applyOpticalBloom(cCore, 5, 0.28);

  // =========================================================
  // LAYER 1 (Z = -0.6): RETRACTABLE LEFT & RIGHT ARMOR PLATES
  // =========================================================
  const c1 = makeCanvas();
  const ctx1 = c1.getContext('2d');
  const glassGrain = createGlassGrainPattern(ctx1, 0.28);
  const flankGrain = createGlassGrainPattern(ctx1, 0.42);
  const plateCoreGrain = createGlassGrainPattern(ctx1, 1.05);

  [-1, 1].forEach((s) => {
    // 1. TOP BROW SHIELD
    drawPlateHelper(
      ctx1,
      [
        [CX + s * 405, CY - 208],
        [CX + s * 405, CY - 238],
        [CX + s * 255, CY - 344],
        [CX + s * 218, CY - 344],
        [CX + s * 204, CY - 358],
        [CX + s * 148, CY - 358],
        [CX + s * 124, CY - 328],
        [CX + s * 124, CY - 256],
        [CX + s * 162, CY - 208],
      ],
      CX + s * 140, CY - 215,
      CX + s * 380, CY - 325,
      'rgba(186, 126, 46, 0.78)',
      'rgba(134, 86, 26, 0.64)',
      'rgba(82, 48, 12, 0.44)',
      'inner-brow',
      0.95,
      3,
      glassGrain
    );

    // 2. MID-FLANK SHIELD
    drawPlateHelper(
      ctx1,
      [
        [CX + s * 538, CY - 234],
        [CX + s * 480, CY - 234],
        [CX + s * 424, CY - 152],
        [CX + s * 424, CY - 108],
        [CX + s * 458, CY - 62],
        [CX + s * 458, CY - 34],
        [CX + s * 378, CY + 34],
        [CX + s * 422, CY + 68],
        [CX + s * 456, CY + 78],
        [CX + s * 556, CY + 78],
        [CX + s * 576, CY + 40],
        [CX + s * 645, CY - 48],
        [CX + s * 645, CY - 152],
      ],
      CX + s * 430, CY - 190,
      CX + s * 610, CY + 72,
      'rgba(152, 98, 34, 0.72)',
      'rgba(108, 66, 18, 0.60)',
      'rgba(62, 36, 9, 0.48)',
      'none',
      0.85,
      3,
      flankGrain
    );

    // SMALL SIDE ARMOR PLATE
    drawPlateHelper(
      ctx1,
      [
        [CX + s * 568, CY - 16],
        [CX + s * 622, CY - 16],
        [CX + s * 606, CY + 10],
        [CX + s * 632, CY + 46],
        [CX + s * 588, CY + 80],
        [CX + s * 542, CY + 58],
        [CX + s * 566, CY + 26],
        [CX + s * 548, CY + 2],
      ],
      CX + s * 555, CY - 12,
      CX + s * 624, CY + 76,
      'rgba(96, 58, 18, 0.88)',
      'rgba(68, 38, 10, 0.84)',
      'rgba(42, 22, 5, 0.78)',
      'none',
      0.85,
      2,
      plateCoreGrain
    );

    drawPlateHelper(
      ctx1,
      [
        [CX + s * 568, CY - 16],
        [CX + s * 622, CY - 16],
        [CX + s * 606, CY + 10],
        [CX + s * 566, CY + 26],
        [CX + s * 548, CY + 2],
      ],
      CX + s * 560, CY - 14,
      CX + s * 615, CY + 22,
      'rgba(138, 86, 28, 0.76)',
      'rgba(104, 62, 18, 0.66)',
      'rgba(68, 38, 10, 0.52)',
      'none',
      0.85,
      1,
      plateCoreGrain
    );

    // 3. LOWER-CENTER DIAGONAL HONEYCOMB BLADE
    drawPlateHelper(
      ctx1,
      [
        [CX + s * 158, CY + 132],
        [CX + s * 188, CY + 120],
        [CX + s * 222, CY + 144],
        [CX + s * 214, CY + 166],
        [CX + s * 184, CY + 172],
        [CX + s * 150, CY + 146],
      ],
      CX + s * 160, CY + 125,
      CX + s * 220, CY + 168,
      'rgba(182, 122, 38, 0.72)',
      'rgba(132, 82, 22, 0.58)',
      'rgba(78, 44, 10, 0.36)',
      'blade',
      0.92,
      2,
      glassGrain
    );

    ctx1.save();
    if ('filter' in ctx1) ctx1.filter = 'blur(2.2px)';
    ctx1.fillStyle = 'rgba(255, 234, 130, 0.96)';
    polyPath(ctx1, [
      [CX + s * 218, CY + 160],
      [CX + s * 232, CY + 166],
      [CX + s * 224, CY + 178],
      [CX + s * 212, CY + 170],
    ]);
    ctx1.fill();
    ctx1.restore();

    ctx1.save();
    if ('filter' in ctx1) ctx1.filter = 'blur(4px)';
    ctx1.fillStyle = 'rgba(235, 172, 55, 0.48)';
    ctx1.beginPath();
    ctx1.ellipse(CX + s * 612, CY + 72, 16, 9, -s * 0.25, 0, Math.PI * 2);
    ctx1.fill();
    ctx1.restore();

    ctx1.fillStyle = '#ffe158';
    polyPath(ctx1, [
      [CX + s * 642, CY + 58],
      [CX + s * 655, CY + 58],
      [CX + s * 655, CY + 68],
      [CX + s * 665, CY + 68],
      [CX + s * 665, CY + 80],
      [CX + s * 642, CY + 80],
    ]);
    ctx1.fill();

    // 5. BOTTOM BUMPER WING PLATE
    ctx1.save();
    polyPath(ctx1, [
      [CX + s * 405, CY + 428],
      [CX + s * 368, CY + 394],
      [CX + s * 332, CY + 416],
      [CX + s * 245, CY + 432],
      [CX + s * 198, CY + 432],
      [CX + s * 192, CY + 448],
      [CX + s * 372, CY + 456],
    ]);
    const bGrad = ctx1.createLinearGradient(CX + s * 400, CY + 418, CX + s * 198, CY + 444);
    bGrad.addColorStop(0, 'rgba(246, 178, 62, 0.94)');
    bGrad.addColorStop(0.5, 'rgba(176, 106, 28, 0.56)');
    bGrad.addColorStop(1, 'rgba(92, 48, 10, 0.0)');
    ctx1.fillStyle = bGrad;
    ctx1.fill();
    ctx1.restore();

    // 6. LOWER DARK-AMBER BACKING PLATE BEHIND 'SYSTEM' / 'POWER'
    drawPlateHelper(
      ctx1,
      [
        [CX + s * 915, H - 195],
        [CX + s * 735, H - 215],
        [CX + s * 705, H - 155],
        [CX + s * 845, H - 85],
        [CX + s * 945, H - 85],
      ],
      CX + s * 740, H - 210,
      CX + s * 915, H - 90,
      'rgba(105, 62, 18, 0.62)',
      'rgba(68, 38, 10, 0.48)',
      'rgba(24, 12, 2, 0.25)',
      'none',
      0.85,
      4,
      glassGrain
    );
  });

  const c1Bloom = applyOpticalBloom(c1, 5, 0.24);

  // =========================================================
  // LAYER 2 (Z = +0.15): RETRACTABLE WIREFRAMES & THRUSTER PODS
  // =========================================================
  const c2 = makeCanvas();
  const ctx2 = c2.getContext('2d');

  ctx2.strokeStyle = 'rgba(235, 175, 68, 0.55)';
  ctx2.lineWidth = 1.0;
  [-1, 1].forEach((s) => {
    for (let col = 0; col < 4; col++) {
      for (let row = 0; row < 4; row++) {
        const gx = CX + s * (36 + col * 18) - 2.5;
        const gy = CY + 485 + row * 14;
        ctx2.strokeRect(gx, gy, 5, 5);
      }
    }
  });

  [-1, 1].forEach((s) => {
    for (let slice = 0; slice < 5; slice++) {
      const dyOff = slice * 6.5;
      const spread = slice * 2.2;
      ctx2.save();
      ctx2.strokeStyle = `rgba(240, 182, 74, ${0.78 - slice * 0.14})`;
      ctx2.lineWidth = slice === 0 ? 1.8 : 1.1;
      ctx2.lineJoin = 'round';
      polyPath(ctx2, [
        [CX + s * 68, 22 + dyOff],
        [CX + s * (98 + spread), 60 + dyOff],
        [CX + s * (42 - spread * 0.5), 60 + dyOff],
      ]);
      ctx2.stroke();
      ctx2.restore();
    }

    ctx2.fillStyle = '#ffdf6b';
    polyPath(ctx2, [
      [CX + s * 324, CY - 404],
      [CX + s * 348, CY - 404],
      [CX + s * 344, CY - 382],
    ]);
    ctx2.fill();

    ctx2.strokeStyle = 'rgba(245, 195, 92, 0.85)';
    ctx2.lineWidth = 1.2;
    ctx2.lineJoin = 'round';
    polyPath(ctx2, [
      [CX + s * 320, CY - 396],
      [CX + s * 304, CY - 376],
      [CX + s * 332, CY - 372],
    ]);
    ctx2.stroke();

    ctx2.save();
    if ('filter' in ctx2) ctx2.filter = 'blur(4px)';
    ctx2.fillStyle = 'rgba(240, 185, 72, 0.58)';
    ctx2.beginPath();
    ctx2.arc(CX + s * 365, CY - 380, 10, 0, Math.PI * 2);
    ctx2.fill();
    ctx2.restore();

    ctx2.strokeStyle = 'rgba(245, 195, 92, 0.86)';
    ctx2.lineWidth = 1.25;
    ctx2.beginPath();
    ctx2.moveTo(CX + s * 172, CY - 318);
    ctx2.lineTo(CX + s * 142, CY - 318);
    ctx2.lineTo(CX + s * 134, CY - 334);
    ctx2.lineTo(CX + s * 144, CY - 366);
    ctx2.lineTo(CX + s * 192, CY - 366);
    ctx2.lineTo(CX + s * 200, CY - 348);
    ctx2.stroke();

    ctx2.fillStyle = '#0c0600';
    ctx2.beginPath();
    ctx2.arc(CX + s * 168, CY - 336, 3.6, 0, Math.PI * 2);
    ctx2.fill();

    [
      [355, -182, 4, false],
      [368, -172, 4, true],
      [345, -162, 3, false],
      [378, -150, 4, false],
      [338, -140, 3, true],
      [324, -125, 4, false],
      [388, -135, 3, false],
      [362, -118, 4, true],
      [402, -110, 3, false],
      [348, -95, 3, false],
      [545, -275, 5, false],
      [572, -300, 4, true],
      [602, -280, 5, true],
      [596, -252, 4, false],
    ].forEach(([px, py, ps, filled]) => {
      ctx2.strokeStyle = 'rgba(242, 192, 88, 0.82)';
      ctx2.fillStyle = 'rgba(248, 205, 98, 0.88)';
      if (filled) ctx2.fillRect(CX + s * px, CY + py, ps, ps);
      else ctx2.strokeRect(CX + s * px, CY + py, ps, ps);
    });

    ctx2.save();
    ctx2.translate(CX + s * 425, CY - 295);
    ctx2.rotate(s * 0.78);
    ctx2.strokeStyle = 'rgba(245, 195, 92, 0.85)';
    ctx2.lineWidth = 1.0;
    ctx2.setLineDash([6, 4]);
    ctx2.beginPath();
    ctx2.moveTo(-22, 0);
    ctx2.lineTo(22, 0);
    ctx2.stroke();
    ctx2.setLineDash([]);
    [-10, 8].forEach((tx) => {
      ctx2.beginPath();
      ctx2.moveTo(tx, -6);
      ctx2.lineTo(tx, 6);
      ctx2.stroke();
    });
    ctx2.restore();

    ctx2.strokeStyle = 'rgba(235, 178, 72, 0.85)';
    ctx2.lineWidth = 1.1;
    [
      [785, -248],
      [798, -236],
      [742, -158],
      [756, -158],
    ].forEach(([ox, oy]) => {
      ctx2.beginPath();
      ctx2.ellipse(CX + s * ox, CY + oy, 2.8, 5, s * 0.45, 0, Math.PI * 2);
      ctx2.stroke();
    });

    ctx2.save();
    ctx2.translate(CX + s * 282, CY - 135);
    ctx2.strokeStyle = 'rgba(245, 198, 92, 0.9)';
    ctx2.lineWidth = 1.15;
    ctx2.beginPath();
    ctx2.moveTo(0, -8);
    ctx2.quadraticCurveTo(2, -2, 8, 0);
    ctx2.quadraticCurveTo(2, 2, 0, 8);
    ctx2.quadraticCurveTo(-2, 2, -8, 0);
    ctx2.quadraticCurveTo(-2, -2, 0, -8);
    ctx2.stroke();
    ctx2.restore();

    ctx2.strokeStyle = 'rgba(245, 195, 90, 0.85)';
    ctx2.strokeRect(CX + s * 320 - 5, CY + 45, 9, 9);

    [
      [CX + s * 78, CY - 126, s * 0.45],
      [CX + s * 56, CY + 62, s * 2.55],
    ].forEach(([tx, ty, ang]) => {
      ctx2.save();
      ctx2.translate(tx, ty);
      ctx2.rotate(ang);
      ctx2.strokeStyle = 'rgba(248, 208, 112, 0.88)';
      ctx2.lineWidth = 1.25;
      ctx2.beginPath();
      ctx2.moveTo(-6, 0);
      ctx2.lineTo(6, 0);
      ctx2.moveTo(0, 0);
      ctx2.lineTo(0, 9);
      ctx2.stroke();
      ctx2.restore();
    });

    ctx2.save();
    ctx2.translate(CX + s * 425, CY + 178);
    ctx2.rotate(-s * 0.68);
    ctx2.strokeStyle = 'rgba(235, 180, 72, 0.85)';
    ctx2.lineWidth = 1.25;
    ctx2.beginPath();
    ctx2.moveTo(-8, -10);
    ctx2.lineTo(-8, 12);
    ctx2.lineTo(8, 12);
    ctx2.lineTo(8, -10);
    ctx2.moveTo(0, 12);
    ctx2.lineTo(0, 22);
    ctx2.lineTo(6, 26);
    ctx2.stroke();
    ctx2.restore();

    ctx2.strokeStyle = 'rgba(185, 122, 34, 0.45)';
    ctx2.lineWidth = 0.9;
    ctx2.beginPath();
    ctx2.moveTo(CX + s * 495, CY + 230);
    ctx2.lineTo(CX + s * 535, CY + 265);
    ctx2.lineTo(CX + s * 550, CY + 265);
    ctx2.lineTo(CX + s * 575, CY + 290);
    ctx2.stroke();

    ctx2.strokeStyle = 'rgba(205, 132, 38, 0.50)';
    ctx2.lineWidth = 1.0;
    ctx2.beginPath();
    ctx2.moveTo(CX + s * 840, H - 195);
    ctx2.lineTo(CX + s * 715, H - 208);
    ctx2.lineTo(CX + s * 615, H - 120);
    ctx2.lineTo(CX + s * 655, H - 12);
    ctx2.stroke();

    ctx2.strokeStyle = 'rgba(235, 175, 68, 0.85)';
    ctx2.lineWidth = 1.3;
    ctx2.beginPath();
    ctx2.moveTo(CX + s * 1070, CY + 42);
    ctx2.lineTo(CX + s * 1018, CY + 42);
    ctx2.lineTo(CX + s * 994, CY + 16);
    ctx2.lineTo(CX + s * 955, CY + 16);
    ctx2.stroke();
    ctx2.fillStyle = '#ffe588';
    ctx2.beginPath();
    ctx2.arc(CX + s * 952, CY + 16, 2.2, 0, Math.PI * 2);
    ctx2.fill();

    ctx2.strokeStyle = 'rgba(242, 198, 110, 0.75)';
    ctx2.lineWidth = 1.0;
    ctx2.beginPath();
    ctx2.moveTo(CX + s * 290, CY - 35);
    ctx2.lineTo(CX + s * 335, CY - 35);
    ctx2.stroke();

    ctx2.strokeStyle = 'rgba(242, 194, 92, 0.86)';
    ctx2.lineWidth = 1.25;
    ctx2.beginPath();
    ctx2.moveTo(CX + s * 72, CY + 365);
    ctx2.lineTo(CX + s * 28, CY + 408);
    ctx2.lineTo(CX + s * 14, CY + 408);
    ctx2.stroke();

    ctx2.fillStyle = '#ffe088';
    ctx2.beginPath();
    ctx2.arc(CX + s * 30, CY + 432, 2.2, 0, Math.PI * 2);
    ctx2.fill();

    [0, 9].forEach((off, idx) => {
      ctx2.strokeStyle = idx === 0 ? 'rgba(225, 152, 48, 0.72)' : 'rgba(195, 122, 28, 0.45)';
      ctx2.lineWidth = idx === 0 ? 1.3 : 1.0;
      ctx2.beginPath();
      ctx2.moveTo(CX + s * (58 + off), CY + 422);
      ctx2.lineTo(CX + s * (114 + off), CY + 478);
      ctx2.lineTo(CX + s * (114 + off), CY + 538);
      ctx2.stroke();
    });

    const ex = CX + s * 172;
    const ey = CY + 332;

    ctx2.save();
    ctx2.translate(ex, ey);
    ctx2.rotate(s * 0.48);

    ctx2.fillStyle = 'rgba(20, 10, 2, 0.92)';
    ctx2.strokeStyle = 'rgba(220, 152, 46, 0.75)';
    ctx2.lineWidth = 1.4;
    polyPath(ctx2, [
      [-32, -26], [30, -32], [38, 18], [12, 36], [-26, 28],
    ]);
    ctx2.fill();
    ctx2.stroke();

    [
      { x: -16, y: -14, rOuter: 15, tilt: -0.25 },
      { x: 18, y: -16, rOuter: 13, tilt: 0.2 },
      { x: 4, y: 16, rOuter: 16, tilt: 0.1 },
    ].forEach((noz) => {
      ctx2.save();
      ctx2.translate(noz.x, noz.y);
      ctx2.rotate(noz.tilt);

      for (let ring = 0; ring < 3; ring++) {
        const rad = noz.rOuter - ring * 3.6;
        const offY = ring * 2.2;
        ctx2.fillStyle = ring === 2 ? 'rgba(12, 6, 1, 0.95)' : 'rgba(38, 20, 4, 0.85)';
        ctx2.strokeStyle = `rgba(248, 194, 78, ${0.88 - ring * 0.18})`;
        ctx2.lineWidth = ring === 0 ? 1.6 : 1.1;
        ctx2.beginPath();
        ctx2.ellipse(0, offY, rad, rad * 0.78, 0, 0, Math.PI * 2);
        ctx2.fill();
        ctx2.stroke();
      }

      ctx2.strokeStyle = 'rgba(255, 234, 145, 0.95)';
      ctx2.lineWidth = 2.0;
      ctx2.beginPath();
      ctx2.ellipse(0, 0, noz.rOuter, noz.rOuter * 0.78, 0, Math.PI * 1.1, Math.PI * 1.85);
      ctx2.stroke();

      ctx2.fillStyle = 'rgba(255, 215, 96, 0.92)';
      ctx2.beginPath();
      ctx2.arc(0, 4, 3.2, 0, Math.PI * 2);
      ctx2.fill();
      ctx2.restore();
    });

    ctx2.strokeStyle = 'rgba(245, 192, 82, 0.88)';
    ctx2.lineWidth = 1.6;
    ctx2.beginPath();
    ctx2.moveTo(-16, -14);
    ctx2.lineTo(4, 16);
    ctx2.moveTo(18, -16);
    ctx2.lineTo(0, 0);
    ctx2.stroke();

    ctx2.fillStyle = '#fff5c8';
    ctx2.beginPath();
    ctx2.arc(0, -1, 3.8, 0, Math.PI * 2);
    ctx2.fill();
    ctx2.restore();

    for (let k = 0; k < 6; k++) {
      ctx2.strokeStyle = `rgba(235, 162, 52, ${0.88 - k * 0.11})`;
      ctx2.lineWidth = k === 0 ? 1.8 : 1.1;
      ctx2.beginPath();
      ctx2.moveTo(CX + s * (235 + k * 10), CY + 292 + k * 12);
      ctx2.lineTo(CX + s * (288 + k * 10), CY + 292 + k * 12);
      ctx2.lineTo(CX + s * (322 + k * 8), CY + 365 + k * 11);
      ctx2.lineTo(CX + s * (296 + k * 8), CY + 428 + k * 9);
      ctx2.lineTo(CX + s * (225 + k * 6), CY + 436 + k * 7);
      ctx2.stroke();
    }
  });

  const c2Bloom = applyOpticalBloom(c2, 6, 0.38);

  // =========================================================
  // LAYER 3 (Z = +0.75): WARM CREAM HUD TELEMETRY
  // =========================================================
  const c3 = makeCanvas();
  const ctx3 = c3.getContext('2d');
  ctx3.textBaseline = 'middle';
  ctx3.textAlign = 'center';

  ctx3.font = '700 11px "JetBrains Mono", monospace';
  ctx3.fillStyle = 'rgba(255, 244, 220, 0.94)';
  ctx3.fillText('Y', CX + 14, 72);
  ctx3.fillText('00', CX, 242);
  ctx3.fillText('00', CX, 742);
  ctx3.fillText('00', CX, CY + 418);
  ctx3.fillText('-00', CX - 320, CY - 35);
  ctx3.fillText('X', CX + 265, CY - 35);
  ctx3.fillText('-00', CX + 320, CY - 35);

  ctx3.save();
  ctx3.translate(CX - 462, CY + 34);
  ctx3.rotate(-0.14);
  ctx3.fillText('-10', 0, 0);
  ctx3.strokeStyle = 'rgba(255, 240, 210, 0.85)';
  ctx3.lineWidth = 1.0;
  ctx3.beginPath();
  ctx3.moveTo(-16, -6);
  ctx3.lineTo(-12, -10);
  ctx3.moveTo(12, 8);
  ctx3.lineTo(16, 4);
  ctx3.moveTo(-14, 10);
  ctx3.lineTo(-10, 14);
  ctx3.stroke();
  ctx3.restore();

  ctx3.textAlign = 'left';
  ctx3.font = '600 19px "Chakra Petch", sans-serif';
  ctx3.fillStyle = '#fbf4e6';
  ctx3.fillText('SCANING CORE..', CX - 680, CY - 154);

  ctx3.font = '400 9.5px "JetBrains Mono", monospace';
  ctx3.fillStyle = 'rgba(252, 238, 210, 0.92)';
  [
    'FILES : _ ?',
    'MATCH NOT FOUND :',
    '1564587        16',
    '9134          366',
    '35645          00',
    '154             7',
  ].forEach((line, i) => {
    ctx3.fillText(line, CX - 680, CY - 130 + i * 14);
  });

  ctx3.font = '600 13px "JetBrains Mono", monospace';
  ctx3.fillStyle = 'rgba(255, 244, 222, 0.96)';
  ctx3.fillText('- [ INITIATE AUTOMODE ] >', CX + 178, CY - 252);

  ctx3.font = '400 9px "JetBrains Mono", monospace';
  ctx3.fillStyle = 'rgba(252, 238, 208, 0.92)';
  ctx3.fillText('46587 / / . 46', CX + 505, CY - 135);
  ctx3.fillText(':-:-:-:-.', CX + 505, CY - 120);
  ctx3.fillText('DETECTING ERRORS :---', CX + 405, CY + 36);
  ctx3.fillText('THREADS : 256', CX + 405, CY + 52);
  ctx3.fillText('CACHES  : 65', CX + 405, CY + 68);

  ctx3.font = '600 11.5px "JetBrains Mono", monospace';
  ctx3.fillStyle = 'rgba(255, 244, 222, 0.95)';
  ctx3.fillText('LONGITUDE : _ _', CX + 530, CY + 190);
  ctx3.fillText('LATITUDE  : _ _', CX + 530, CY + 220);
  ctx3.font = '400 8.5px "JetBrains Mono", monospace';
  ctx3.fillStyle = 'rgba(245, 220, 178, 0.85)';
  ctx3.fillText('465466', CX + 530, CY + 205);
  ctx3.fillText('879899', CX + 530, CY + 235);

  ctx3.save();
  ctx3.translate(CX - 765, H - 155);
  ctx3.rotate(-0.08);
  ctx3.font = '600 22px "Chakra Petch", sans-serif';
  ctx3.fillStyle = 'rgba(252, 244, 228, 0.92)';
  ctx3.fillText('SYSTEM : _ _', 0, 0);

  ctx3.fillStyle = 'rgba(232, 224, 210, 0.78)';
  ctx3.fillRect(0, 18, 138, 28);
  ctx3.fillStyle = 'rgba(12, 8, 4, 0.92)';
  ctx3.fillText('ACTIVATED', 12, 32);

  ctx3.fillStyle = 'rgba(252, 244, 228, 0.88)';
  ctx3.fillText('PROCESSOR : _', 0, 66);
  ctx3.font = '400 8.5px "JetBrains Mono", monospace';
  ctx3.fillStyle = 'rgba(240, 215, 175, 0.65)';
  ctx3.fillText('ACTIVE : 56 %', 0, 92);
  ctx3.fillText('HEAT   : 23 %', 0, 105);
  ctx3.restore();

  ctx3.save();
  ctx3.translate(CX + 625, H - 145);
  ctx3.rotate(0.08);
  ctx3.font = '600 14px "JetBrains Mono", monospace';
  ctx3.fillStyle = 'rgba(252, 244, 228, 0.92)';
  ctx3.fillText('+ POWER :', 18, 0);
  ctx3.fillText('[ 65 % ] :-:-:-:-', 0, 24);
  ctx3.fillText('* BACKUP', 18, 56);
  ctx3.fillText('[ 23 % ] :-:-', 0, 78);
  ctx3.restore();

  const c3Bloom = applyOpticalBloom(c3, 3.5, 0.25);

  // =========================================================
  // LAYER 4 (Z = +1.55): RETRACTABLE LIT FAR-EDGE ARMOR & VISOR MASK
  // =========================================================
  const c4 = makeCanvas();
  const ctx4 = c4.getContext('2d');

  ctx4.save();
  if ('filter' in ctx4) ctx4.filter = 'blur(3.5px)';
  [-1, 1].forEach((s) => {
    polyPath(ctx4, [
      [CX + s * 1200, CY - 210],
      [CX + s * 1110, CY - 245],
      [CX + s * 1065, CY - 95],
      [CX + s * 985, CY + 90],
      [CX + s * 1075, CY + 245],
      [CX + s * 995, H],
      [CX + s * 1200, H],
    ]);
    const edgePlateGrad = ctx4.createLinearGradient(CX + s * 1190, CY + 40, CX + s * 990, CY + 80);
    edgePlateGrad.addColorStop(0, 'rgba(175, 122, 38, 0.34)');
    edgePlateGrad.addColorStop(0.6, 'rgba(128, 82, 22, 0.22)');
    edgePlateGrad.addColorStop(1, 'rgba(62, 38, 8, 0.08)');
    ctx4.fillStyle = edgePlateGrad;
    ctx4.fill();
  });
  ctx4.restore();

  ctx4.save();
  if ('filter' in ctx4) ctx4.filter = 'blur(3px)';
  [-1, 1].forEach((s) => {
    polyPath(ctx4, [
      [CX + s * 915, 0],
      [CX + s * 1020, CY - 325],
      [CX + s * 955, CY - 220],
      [CX + s * 1065, CY - 55],
      [CX + s * 985, CY + 90],
      [CX + s * 1075, CY + 245],
      [CX + s * 985, H],
      [CX + s * 785, H],
      [CX + s * 845, CY + 240],
      [CX + s * 815, CY - 80],
    ]);
    ctx4.fillStyle = 'rgba(2, 1, 0, 0.92)';
    ctx4.fill();
  });
  ctx4.restore();

  [-1, 1].forEach((s) => {
    ctx4.save();
    ctx4.translate(CX + s * 1005, CY + 90);
    ctx4.rotate(Math.PI / 4);
    ctx4.fillStyle = '#050200';
    ctx4.fillRect(-7.5, -7.5, 15, 15);
    ctx4.restore();
  });

  ctx4.save();
  if ('filter' in ctx4) ctx4.filter = 'blur(3.5px)';
  [-1, 1].forEach((s) => {
    polyPath(ctx4, [
      [CX + s * 915, 0],
      [CX + s * 1200, 0],
      [CX + s * 1200, 195],
      [CX + s * 985, 228],
      [CX + s * 945, 165],
    ]);
    const topGrad = ctx4.createLinearGradient(CX + s * 945, 40, CX + s * 1160, 210);
    topGrad.addColorStop(0, 'rgba(178, 128, 42, 0.58)');
    topGrad.addColorStop(1, 'rgba(92, 58, 16, 0.36)');
    ctx4.fillStyle = topGrad;
    ctx4.fill();

    polyPath(ctx4, [
      [CX + s * 985, 228],
      [CX + s * 1200, 195],
      [CX + s * 1200, 325],
      [CX + s * 1045, 325],
    ]);
    ctx4.fillStyle = 'rgba(58, 36, 10, 0.30)';
    ctx4.fill();
  });
  ctx4.restore();

  [-1, 1].forEach((s) => {
    ctx4.save();
    ctx4.translate(CX + s * 972, 142);
    ctx4.rotate(s * 0.2);
    ctx4.fillStyle = 'rgba(12, 6, 1, 0.94)';
    ctx4.fillRect(-5, -5, 10, 10);
    ctx4.restore();
  });

  return {
    bgTex: toTexture(c0Bloom),
    coreTex: toTexture(cCoreBloom),
    armorTex: toTexture(c1Bloom),
    circuitsTex: toTexture(c2Bloom),
    hudTex: toTexture(c3Bloom),
    foreTex: toTexture(c4),
  };
}