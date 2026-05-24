/**
 * 赛博植物 · 全息水晶插画风（对齐用户参照图）
 * 明媚型 ≈ 水晶盆景 + 彩虹螺旋盆 + 云朵
 * 异变型 ≈ 玻璃碗 + 卷须 + 嵌套爱心/星星
 */
window.CyberPlants = (function () {
  "use strict";

  const FORM = { BRIGHT: "bright", DARK: "dark", WEIRD: "weird" };
  const FORM_LABELS = { bright: "明媚型", dark: "幽暗型", weird: "异变型" };
  const HOLO = ["#ffb8d0", "#ffe8a0", "#c8f8a8", "#98e8ff", "#d8b8ff", "#ffc8e0"];
  const OUTLINE = "#3a3358";
  const OUTLINE_SOFT = "rgba(58, 51, 88, 0.75)";

  function normalizeTraits(t) {
    const s = (t.bright || 0) + (t.dark || 0) + (t.weird || 0) + (t.elegant || 0) || 1;
    return {
      bright: (t.bright || 0) / s,
      dark: (t.dark || 0) / s,
      weird: (t.weird || 0) / s,
      elegant: (t.elegant || 0) / s,
    };
  }

  function resolveFormStyle(traits) {
    const n = normalizeTraits(traits);
    if (n.weird >= 0.28 && n.weird >= n.dark * 0.8) return FORM.WEIRD;
    if (n.dark > n.bright + 0.05) return FORM.DARK;
    return FORM.BRIGHT;
  }

  /** 由 bright/dark/weird 累计分判定形态（供心情加权系统使用） */
  function resolveFormStyleFromScores(scores) {
    const s = (scores.bright || 0) + (scores.dark || 0) + (scores.weird || 0) || 1;
    const n = {
      bright: (scores.bright || 0) / s,
      dark: (scores.dark || 0) / s,
      weird: (scores.weird || 0) / s,
    };
    if (n.weird >= 0.28 && n.weird >= n.dark * 0.8) return FORM.WEIRD;
    if (n.dark > n.bright + 0.05) return FORM.DARK;
    return FORM.BRIGHT;
  }

  function getFormLabel(form) {
    return FORM_LABELS[form] || FORM_LABELS.bright;
  }

  function getPalette(traits, formStyle) {
    const form = formStyle || resolveFormStyle(traits);
    if (form === FORM.DARK) {
      return {
        pot: ["#5a4a78", "#7a6a98", "#9a8ab8", "#6a5a88"],
        soil: "#2a2438",
        stem: "#6a5a88",
        stemHi: "#9a8ab8",
        glow: "rgba(140, 120, 200, 0.5)",
        crystal: ["#e8e0ff", "#c8b8f0", "#a898e0"],
        leaf: ["#7a9aaa", "#6a8a9a", "#8a7aaa"],
        neon: "#f0e8ff",
        shadow: "rgba(30, 20, 50, 0.38)",
        bowl: ["#4a4068", "#6a5a88", "#8a7aa8"],
      };
    }
    if (form === FORM.WEIRD) {
      return {
        pot: ["#ffe0c8", "#c8f0e0", "#f0c8e8", "#e8f0a8"],
        soil: "#3a3228",
        stem: "#b8e8a8",
        stemHi: "#f0c8e8",
        glow: "rgba(255, 200, 160, 0.45)",
        crystal: ["#ffb8e8", "#ffe8a8", "#a8f0ff", "#c8f8c8"],
        leaf: ["#f0d8b8", "#c8f0d8", "#f8c8e0"],
        neon: "#fff8e0",
        shadow: "rgba(160, 100, 80, 0.28)",
        bowl: ["#ffe8f0", "#c8f0ff", "#f0ffc8", "#ffd8f0"],
      };
    }
    return {
      pot: ["#ffc8e8", "#fff0b0", "#b8f8e0", "#b0e0ff", "#e8c8ff"],
      soil: "#4a3828",
      stem: "#9a7a68",
      stemHi: "#c8a898",
      glow: "rgba(255, 240, 200, 0.55)",
      crystal: ["#ffffff", "#e8f8ff", "#fff8e8", "#f0e8ff"],
      leaf: HOLO,
      neon: "#ffffff",
      shadow: "rgba(200, 160, 220, 0.32)",
      bowl: ["#ffe8f8", "#c8f8ff", "#f8ffc8", "#ffd0f0"],
    };
  }

  function holoGrad(ctx, x0, y0, x1, y1, colors) {
    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    const n = colors.length - 1 || 1;
    colors.forEach((c, i) => g.addColorStop(i / n, c));
    return g;
  }

  function radialHolo(ctx, x, y, r, colors) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    const n = colors.length - 1 || 1;
    colors.forEach((c, i) => g.addColorStop(i / n, c));
    return g;
  }

  function fillStroke(ctx, strokeW) {
    ctx.fill();
    if (strokeW !== false) {
      ctx.lineWidth = strokeW || 1.4;
      ctx.strokeStyle = OUTLINE;
      ctx.stroke();
    }
  }

  function drawGlow(ctx, x, y, r, color) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color);
    g.addColorStop(0.6, color.replace(/[\d.]+\)$/, "0.15)"));
    g.addColorStop(1, "transparent");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawSparkle(ctx, x, y, size) {
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = "rgba(255,255,255,0.9)";
    ctx.lineWidth = 1;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-size, 0);
    ctx.lineTo(size, 0);
    ctx.moveTo(0, -size);
    ctx.lineTo(0, size);
    ctx.stroke();
    ctx.restore();
  }

  function drawNestedStar(ctx, x, y, r, colors) {
    const drawOne = (rad, cols, lw) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.fillStyle = holoGrad(ctx, -rad, -rad, rad, rad, cols);
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = lw;
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
        const a2 = ((i + 0.5) / 5) * Math.PI * 2 - Math.PI / 2;
        const x1 = Math.cos(a) * rad;
        const y1 = Math.sin(a) * rad;
        const x2 = Math.cos(a2) * rad * 0.45;
        const y2 = Math.sin(a2) * rad * 0.45;
        if (i === 0) ctx.moveTo(x1, y1);
        else ctx.lineTo(x1, y1);
        ctx.lineTo(x2, y2);
      }
      ctx.closePath();
      fillStroke(ctx, lw);
      ctx.restore();
    };
    drawGlow(ctx, x, y, r * 2.2, "rgba(255,240,200,0.35)");
    drawOne(r, colors, 1.5);
    drawOne(r * 0.52, ["#fffef8", "#fff0c8", "#e8ffe8"], 1);
  }

  function drawNestedHeart(ctx, x, y, s, colors) {
    const heartPath = (scale) => {
      ctx.beginPath();
      ctx.moveTo(0, scale * 0.28);
      ctx.bezierCurveTo(scale, -scale * 0.55, scale * 1.15, scale * 0.38, 0, scale * 0.95);
      ctx.bezierCurveTo(-scale * 1.15, scale * 0.38, -scale, -scale * 0.55, 0, scale * 0.28);
    };
    ctx.save();
    ctx.translate(x, y);
    drawGlow(ctx, 0, 0, s * 2.5, "rgba(255,200,220,0.3)");
    ctx.fillStyle = holoGrad(ctx, -s, -s, s, s, colors);
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.5;
    heartPath(s);
    fillStroke(ctx, 1.5);
    ctx.fillStyle = holoGrad(ctx, -s * 0.4, -s * 0.4, s * 0.4, s * 0.4, ["#fffef8", "#ffe8f0", "#e8fff0"]);
    ctx.lineWidth = 1;
    heartPath(s * 0.48);
    fillStroke(ctx, 1);
    ctx.restore();
  }

  function drawCrystalBloom(ctx, x, y, scale, pal, rot) {
    const cols = pal.crystal.length >= 3 ? pal.crystal : pal.crystal.concat(pal.crystal);
    drawGlow(ctx, x, y, scale * 22, pal.glow);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + rot;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(a);
      ctx.fillStyle = holoGrad(ctx, -scale * 4, -scale * 14, scale * 4, scale * 4, [
        "#ffffff",
        cols[i % cols.length],
        cols[(i + 1) % cols.length],
      ]);
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(0, -scale * 15);
      ctx.lineTo(scale * 5.5, -scale * 1);
      ctx.lineTo(0, scale * 4);
      ctx.lineTo(-scale * 5.5, -scale * 1);
      ctx.closePath();
      fillStroke(ctx, 1.3);
      ctx.strokeStyle = "rgba(255,255,255,0.85)";
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.moveTo(-scale * 1.5, -scale * 11);
      ctx.lineTo(scale * 1.2, -scale * 4);
      ctx.stroke();
      ctx.restore();
    }
    ctx.fillStyle = radialHolo(ctx, x, y, scale * 7, ["#ffffff", cols[0], cols[1]]);
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(x, y, scale * 5.5, 0, Math.PI * 2);
    fillStroke(ctx, 1.2);
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.beginPath();
    ctx.ellipse(x - scale * 1.5, y - scale * 1.5, scale * 2, scale * 1.2, -0.5, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawKawaiiLeaf(ctx, x, y, angle, len, wid, pal, idx) {
    const cols = pal.leaf || HOLO;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = holoGrad(ctx, -len * 0.2, -wid, len, wid, [
      cols[idx % cols.length],
      cols[(idx + 2) % cols.length],
      cols[(idx + 4) % cols.length],
    ]);
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-len * 0.15, 0);
    ctx.quadraticCurveTo(len * 0.45, -wid * 0.9, len * 0.85, 0);
    ctx.quadraticCurveTo(len * 0.45, wid * 0.9, -len * 0.15, 0);
    fillStroke(ctx, 1.2);
    ctx.strokeStyle = OUTLINE_SOFT;
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.moveTo(0, -wid * 0.3);
    ctx.quadraticCurveTo(len * 0.5, 0, len * 0.75, wid * 0.2);
    ctx.stroke();
    ctx.restore();
  }

  function drawCloudBase(ctx, cx, y) {
    const blobs = [
      { dx: -24, w: 22, h: 11 },
      { dx: 0, w: 28, h: 13 },
      { dx: 22, w: 20, h: 10 },
    ];
    blobs.forEach((b) => {
      ctx.fillStyle = "rgba(255,255,255,0.88)";
      ctx.strokeStyle = "rgba(200,210,240,0.5)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(cx + b.dx, y, b.w, b.h, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
  }

  function drawGroundShadow(ctx, cx, y, w, color) {
    ctx.fillStyle = color || "rgba(180, 140, 200, 0.28)";
    ctx.beginPath();
    ctx.ellipse(cx + w * 0.08, y, w * 0.55, w * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawSpiralRainbowPot(ctx, cx, baseY, potW, potH, pal, wilt) {
    const x = cx;
    const y = baseY + wilt * 3;
    const top = y - potH * 0.42;
    const bot = y + potH * 0.08;

    drawCloudBase(ctx, x, bot + 14);
    drawGroundShadow(ctx, x, y + 10, potW, pal.shadow);

    const bodyG = holoGrad(ctx, x - potW / 2, top, x + potW / 2, bot, pal.pot);
    ctx.fillStyle = bodyG;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(x - potW * 0.48, top + potH * 0.06);
    ctx.lineTo(x + potW * 0.48, top + potH * 0.06);
    ctx.lineTo(x + potW * 0.42, bot);
    ctx.lineTo(x - potW * 0.42, bot);
    ctx.closePath();
    fillStroke(ctx, 1.6);

    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 5; i++) {
      const t = i / 5;
      ctx.beginPath();
      ctx.moveTo(x - potW * 0.38 + t * potW * 0.12, top + potH * 0.12);
      ctx.bezierCurveTo(
        x - potW * 0.2 + t * potW * 0.4,
        top + potH * 0.35,
        x + potW * 0.15 + t * potW * 0.1,
        bot - potH * 0.08,
        x + potW * 0.35 - t * potW * 0.08,
        bot - potH * 0.02
      );
      ctx.stroke();
    }

    ctx.fillStyle = pal.soil;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(x, top + 4, potW * 0.34, potH * 0.09, 0, 0, Math.PI * 2);
    fillStroke(ctx, 1);

    ctx.fillStyle = "rgba(80,60,40,0.25)";
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.arc(x - 12 + i * 6, top + 2, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    return top + 4;
  }

  function drawGlassBowl(ctx, cx, baseY, potW, potH, pal, wilt, form) {
    const x = cx;
    const y = baseY + wilt * 3;
    const rimY = y - potH * 0.38;
    const bowlH = potH * 0.55;

    if (form === FORM.BRIGHT) drawCloudBase(ctx, x, y + 12);
    drawGroundShadow(ctx, x, y + 8, potW * 1.1, pal.shadow);

    const bowlCols = pal.bowl || pal.pot;
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.ellipse(x, rimY, potW * 0.46, potH * 0.1, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.save();
    ctx.beginPath();
    ctx.ellipse(x, rimY, potW * 0.44, potH * 0.09, 0, 0, Math.PI);
    ctx.lineTo(x + potW * 0.4, y);
    ctx.quadraticCurveTo(x, y + bowlH * 0.35, x - potW * 0.4, y);
    ctx.closePath();
    const bg = holoGrad(ctx, x - potW / 2, rimY, x + potW / 2, y + bowlH * 0.2, bowlCols);
    ctx.fillStyle = bg;
    ctx.globalAlpha = 0.55;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.clip();

    for (let s = 0; s < 4; s++) {
      ctx.strokeStyle = bowlCols[s % bowlCols.length];
      ctx.globalAlpha = 0.35;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x - potW * 0.1 + s * 8, rimY + bowlH * 0.25, potW * 0.22, s * 0.8, s * 0.8 + Math.PI * 1.1);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    ctx.strokeStyle = "rgba(255,255,255,0.75)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(x - potW * 0.18, rimY - 2, potW * 0.12, potH * 0.04, -0.4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(x + potW * 0.15, rimY + 4, potW * 0.06, potH * 0.025, 0.3, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = pal.soil;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(x, rimY + 2, potW * 0.32, potH * 0.08, 0, 0, Math.PI * 2);
    fillStroke(ctx, 1);
    return rimY + 2;
  }

  function drawDarkPot(ctx, cx, baseY, potW, potH, pal, wilt) {
    const x = cx;
    const y = baseY + wilt * 3;
    const top = y - potH * 0.4;
    drawGroundShadow(ctx, x, y + 8, potW, pal.shadow);
    ctx.fillStyle = holoGrad(ctx, x - potW / 2, top, x + potW / 2, y, pal.pot);
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(x - potW * 0.45, top);
    ctx.lineTo(x + potW * 0.45, top);
    ctx.lineTo(x + potW * 0.38, y);
    ctx.lineTo(x - potW * 0.38, y);
    ctx.closePath();
    fillStroke(ctx, 1.6);
    ctx.strokeStyle = "rgba(200,180,255,0.3)";
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(x - potW * 0.3 + i * potW * 0.15, top + 8);
      ctx.lineTo(x - potW * 0.25 + i * potW * 0.15, y - 4);
      ctx.stroke();
    }
    ctx.fillStyle = pal.soil;
    ctx.beginPath();
    ctx.ellipse(x, top + 5, potW * 0.32, potH * 0.08, 0, 0, Math.PI * 2);
    ctx.fill();
    return top + 5;
  }

  function drawBonsaiTrunk(ctx, cx, soilY, h, pal, sway, p) {
    const tips = [];
    const lean = sway * 0.4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const trunkG = holoGrad(ctx, cx, soilY, cx + lean, soilY - h, [pal.stemHi || pal.stem, pal.stem, "#6a5048"]);
    ctx.strokeStyle = trunkG;
    ctx.lineWidth = 7 * p + 2;
    ctx.beginPath();
    ctx.moveTo(cx, soilY);
    ctx.bezierCurveTo(cx + lean * 0.2, soilY - h * 0.35, cx - lean * 0.15, soilY - h * 0.7, cx + lean * 0.1, soilY - h);
    ctx.stroke();

    const branches = [
      { t: 0.55, dir: -1, len: 0.42 },
      { t: 0.68, dir: 1, len: 0.38 },
      { t: 0.78, dir: -0.6, len: 0.32 },
      { t: 0.88, dir: 0.8, len: 0.28 },
    ];
    const trunkTop = { x: cx + lean * 0.1, y: soilY - h };
    branches.forEach((b, i) => {
      const sy = soilY - h * b.t;
      const sx = cx + lean * 0.1 * b.t;
      const ex = sx + b.dir * h * b.len * p;
      const ey = sy - h * b.len * 0.55 * p;
      ctx.strokeStyle = holoGrad(ctx, sx, sy, ex, ey, [pal.stemHi || pal.stem, pal.stem]);
      ctx.lineWidth = 3.5 * p + 1;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.quadraticCurveTo(sx + b.dir * 12, (sy + ey) / 2, ex, ey);
      ctx.stroke();
      tips.push({ x: ex, y: ey, i });
    });
    tips.push({ x: trunkTop.x, y: trunkTop.y - 8, i: 4 });
    return tips;
  }

  function drawTentacleStems(ctx, cx, soilY, h, pal, sway, p, pulse) {
    const tips = [];
    const count = 5;
    for (let i = 0; i < count; i++) {
      const spread = (i - (count - 1) / 2) * 0.35;
      const sx = cx + spread * 8;
      const ex = cx + spread * 28 * p + sway + Math.sin(pulse + i) * 4;
      const midY = soilY - h * (0.45 + (i % 3) * 0.12);
      const ey = soilY - h * (0.85 + (i % 2) * 0.08);
      ctx.strokeStyle = holoGrad(ctx, sx, soilY, ex, ey, [pal.stem, pal.stemHi || "#f0c8e8", pal.stem]);
      ctx.lineWidth = 5 * p + 2;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(sx, soilY);
      ctx.bezierCurveTo(sx + spread * 20, midY, ex - 10, midY - 15, ex, ey);
      ctx.stroke();

      for (let d = 0; d < 6; d++) {
        const t = d / 6;
        const px = sx + (ex - sx) * t;
        const py = soilY + (ey - soilY) * t;
        ctx.fillStyle = "rgba(255,255,255,0.55)";
        ctx.strokeStyle = OUTLINE_SOFT;
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.arc(px + Math.sin(t * 8 + i) * 2, py, 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      const curlX = ex + Math.cos(pulse * 0.5 + i) * 6;
      const curlY = ey - 8;
      ctx.strokeStyle = pal.stemHi || pal.stem;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(curlX, curlY, 8 * p, 0.2, Math.PI * 1.5);
      ctx.stroke();
      tips.push({ x: curlX - 6, y: curlY - 4, i });
    }
    return tips;
  }

  function drawCrescentMoon(ctx, x, y, r) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = holoGrad(ctx, -r, -r, r, r, HOLO);
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0.2, Math.PI * 1.8);
    ctx.arc(r * 0.35, 0, r * 0.75, Math.PI * 1.2, Math.PI * 0.3, true);
    ctx.closePath();
    fillStroke(ctx, 1.2);
    ctx.restore();
  }

  function ambientDecor(ctx, cx, cy, p, pal, form, pulse) {
    const n = form === FORM.BRIGHT ? 10 : form === FORM.DARK ? 6 : 8;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + pulse * 0.15;
      const dist = 35 + (i % 4) * 12;
      const sx = cx + Math.cos(a) * dist * p;
      const sy = cy + Math.sin(a) * dist * 0.45 * p;
      if (i % 3 === 0) drawSparkle(ctx, sx, sy, 2 + (i % 2));
      else if (i % 3 === 1)
        drawNestedStar(ctx, sx, sy, 3.5 + (i % 2), HOLO.slice(i % 3, i % 3 + 3));
      else {
        ctx.fillStyle = "rgba(255,255,255,0.7)";
        ctx.beginPath();
        ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    if (form === FORM.BRIGHT) drawCrescentMoon(ctx, cx + 42 * p, cy - 55 * p, 7 * p);
  }

  const VARIANTS = {
    pulse_iris(ctx, tips, p, pal, sway, form, pulse) {
      tips.forEach((t, i) => {
        if (form === FORM.WEIRD && i % 2 === 0) {
          drawNestedHeart(ctx, t.x, t.y, 7 * p, pal.crystal);
        } else if (form === FORM.WEIRD) {
          drawNestedStar(ctx, t.x, t.y, 6 * p, pal.crystal);
        } else {
          drawCrystalBloom(ctx, t.x, t.y, 0.55 + (i % 3) * 0.12, pal, pulse + i * 0.3);
        }
      });
    },
    wire_lotus(ctx, tips, p, pal, sway, form, pulse) {
      tips.forEach((t, i) => {
        const layers = form === FORM.BRIGHT ? 3 : 2;
        for (let L = 0; L < layers; L++) {
          const sc = (0.35 + L * 0.18) * p;
          for (let k = 0; k < 5; k++) {
            const a = (k / 5) * Math.PI * 2 + L * 0.25 + pulse * 0.05;
            ctx.save();
            ctx.translate(t.x, t.y);
            ctx.rotate(a);
            ctx.fillStyle = holoGrad(ctx, -6 * sc, -14 * sc, 6 * sc, 4 * sc, pal.crystal);
            ctx.strokeStyle = OUTLINE;
            ctx.lineWidth = 1.1;
            ctx.beginPath();
            ctx.ellipse(0, -10 * sc, 5 * sc, 12 * sc, 0, 0, Math.PI * 2);
            fillStroke(ctx, 1.1);
            ctx.restore();
          }
        }
        ctx.fillStyle = radialHolo(ctx, t.x, t.y, 6 * p, ["#fff", pal.neon, pal.crystal[1]]);
        ctx.beginPath();
        ctx.arc(t.x, t.y, 4 * p, 0, Math.PI * 2);
        ctx.fill();
      });
    },
    neon_fern(ctx, tips, p, pal, sway, form, pulse) {
      tips.forEach((t, i) => {
        drawKawaiiLeaf(ctx, t.x - 14 * p, t.y + 8, -0.6, 22 * p, 9, pal, i);
        drawKawaiiLeaf(ctx, t.x + 14 * p, t.y + 8, 0.6, 22 * p, 9, pal, i + 2);
        drawKawaiiLeaf(ctx, t.x, t.y - 6, 0, 20 * p, 8, pal, i + 4);
        if (form !== FORM.DARK) drawNestedStar(ctx, t.x, t.y - 18 * p, 4 * p, pal.crystal);
      });
    },
    crystal_moss(ctx, tips, p, pal, sway, form, pulse) {
      tips.forEach((t, i) => {
        drawCrystalBloom(ctx, t.x, t.y, 0.45 + i * 0.08, pal, pulse);
        if (form === FORM.BRIGHT)
          drawKawaiiLeaf(ctx, t.x, t.y + 12, 0.3, 14 * p, 6, pal, i + 1);
      });
    },
    glitch_thorn(ctx, tips, p, pal, sway, form, pulse) {
      tips.forEach((t, i) => {
        const jx = form === FORM.WEIRD ? Math.sin(pulse + i) * 5 : 0;
        drawCrystalBloom(ctx, t.x + jx, t.y, 0.5, pal, pulse + i);
        if (form === FORM.WEIRD) drawNestedHeart(ctx, t.x + jx + 6, t.y + 10, 5 * p, pal.crystal);
      });
    },
    neon_rose(ctx, tips, p, pal, sway, form, pulse) {
      tips.forEach((t, i) => {
        if (form === FORM.WEIRD) {
          drawNestedHeart(ctx, t.x, t.y, 9 * p, pal.crystal);
          drawNestedStar(ctx, t.x - 16 * p, t.y + 4, 5 * p, pal.crystal);
          drawNestedStar(ctx, t.x + 16 * p, t.y + 4, 5 * p, pal.crystal);
        } else {
          for (let ring = 0; ring < 3; ring++) {
            const dist = (8 + ring * 7) * p;
            for (let k = 0; k < 5; k++) {
              const a = (k / 5) * Math.PI * 2 + ring * 0.35;
              ctx.save();
              ctx.translate(t.x + Math.cos(a) * dist * 0.35, t.y + Math.sin(a) * dist * 0.2);
              ctx.rotate(a);
              ctx.fillStyle = holoGrad(ctx, -4, -10, 4, 4, pal.crystal);
              ctx.strokeStyle = OUTLINE;
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.ellipse(0, -6 * p, 4 * p, 10 * p, 0, 0, Math.PI * 2);
              fillStroke(ctx, 1);
              ctx.restore();
            }
          }
          drawCrystalBloom(ctx, t.x, t.y, 0.35, pal, pulse);
        }
      });
    },
    prism_vine(ctx, tips, p, pal, sway, form, pulse) {
      tips.forEach((t, i) => {
        drawKawaiiLeaf(ctx, t.x, t.y + 10, 0.15, 18 * p, 8, pal, i);
        drawNestedStar(ctx, t.x + sway, t.y - 14 * p, 5 * p, pal.crystal);
        if (form === FORM.BRIGHT) drawSparkle(ctx, t.x + 12, t.y - 8, 2.5);
      });
    },
    pixel_poppy(ctx, tips, p, pal, sway, form, pulse) {
      tips.forEach((t) => {
        if (form === FORM.WEIRD) {
          drawNestedHeart(ctx, t.x, t.y, 11 * p, pal.crystal);
          drawNestedStar(ctx, t.x - 18 * p, t.y, 6 * p, pal.crystal);
          drawNestedStar(ctx, t.x + 18 * p, t.y, 6 * p, pal.crystal);
        } else {
          drawCrystalBloom(ctx, t.x, t.y, 0.65, pal, pulse);
        }
      });
    },
    void_bloom(ctx, tips, p, pal, sway, form, pulse) {
      tips.forEach((t) => {
        drawGlow(ctx, t.x, t.y, 38 * p, pal.glow);
        ctx.fillStyle = radialHolo(ctx, t.x, t.y, 22 * p, pal.crystal);
        ctx.strokeStyle = OUTLINE;
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.ellipse(t.x, t.y, 22 * p, 11 * p, 0, 0, Math.PI * 2);
        fillStroke(ctx, 1.3);
        if (form === FORM.BRIGHT) drawCrescentMoon(ctx, t.x, t.y - 28 * p, 6 * p);
      });
    },
    shadow_bramble(ctx, tips, p, pal, sway, form, pulse) {
      tips.forEach((t, i) => {
        ctx.strokeStyle = pal.stem;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(t.x, t.y + 20);
        ctx.lineTo(t.x + sway, t.y - 8);
        ctx.stroke();
        drawCrystalBloom(ctx, t.x + sway, t.y - 12, 0.4, pal, pulse + i);
      });
    },
    aurora_sage(ctx, tips, p, pal, sway, form, pulse) {
      tips.forEach((t, i) => {
        drawKawaiiLeaf(ctx, t.x - 10, t.y + 6, -0.4, 20 * p, 8, pal, i);
        drawKawaiiLeaf(ctx, t.x + 10, t.y + 6, 0.4, 20 * p, 8, pal, i + 1);
        drawNestedStar(ctx, t.x + sway, t.y - 20 * p, 4.5 * p, HOLO);
        drawGlow(ctx, t.x, t.y, 18 * p, pal.glow);
      });
    },
  };

  function drawSprout(ctx, cx, soilY, p, pal) {
    drawGlow(ctx, cx, soilY - 8, 14 + p * 10, pal.glow);
    ctx.fillStyle = radialHolo(ctx, cx, soilY - 5, 8 + p * 6, [pal.neon, pal.crystal[0], "transparent"]);
    ctx.beginPath();
    ctx.ellipse(cx, soilY - 5, 5 + p * 9, 4 + p * 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = holoGrad(ctx, cx - 4, soilY - 14, cx + 4, soilY, [pal.stemHi || pal.stem, pal.stem]);
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(cx, soilY);
    ctx.quadraticCurveTo(cx + 3, soilY - 8 * p, cx, soilY - 14 * p);
    ctx.lineTo(cx - 2, soilY - 12 * p);
    ctx.quadraticCurveTo(cx - 4, soilY - 6 * p, cx, soilY);
    fillStroke(ctx, 1.2);
  }

  function drawSproutInSoil(ctx, cx, soilY, t, pal) {
    const n = 3 + Math.floor(t * 4);
    for (let i = 0; i < n; i++) {
      const ox = (i - (n - 1) / 2) * (10 + t * 6);
      const h = 8 + t * 22;
      ctx.strokeStyle = holoGrad(ctx, cx + ox, soilY, cx + ox, soilY - h, [pal.stem, "#a8e878", pal.stemHi || "#c8f0a8"]);
      ctx.lineWidth = 2 + t;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(cx + ox, soilY);
      ctx.quadraticCurveTo(cx + ox + (i % 2 ? 3 : -3), soilY - h * 0.5, cx + ox, soilY - h);
      ctx.stroke();
      ctx.fillStyle = holoGrad(ctx, cx + ox - 4, soilY - h - 6, cx + ox + 4, soilY - h + 2, [pal.leaf[i % pal.leaf.length], pal.leaf[(i + 2) % pal.leaf.length]]);
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.ellipse(cx + ox, soilY - h - 2, 4 + t * 2, 2.5 + t, (i - 1) * 0.25, 0, Math.PI * 2);
      fillStroke(ctx, 0.9);
    }
  }

  function drawPlantBody(ctx, w, soilY, progress, data, wilt, shakeX, pulse, options) {
    const opts = options || {};
    const variant = data.variant || "pulse_iris";
    const form = data.formStyle || resolveFormStyle(data.traits || {});
    const pal = getPalette(data.traits || {}, form);
    const cx = w / 2 + (shakeX || 0);
    const sway = Math.sin(pulse || 0) * 3 * (1 - (wilt || 0) * 0.6);
    const p = Math.min(1, Math.max(0, progress));

    if (p < 0.12) {
      if (opts.skipPot) drawSproutInSoil(ctx, cx, soilY, p / 0.12, pal);
      else drawSprout(ctx, cx, soilY, p / 0.12, pal);
      return pal;
    }

    const stemScale = opts.skipPot ? 0.72 : 1;
    const stemH = (35 + p * 110) * (form === FORM.BRIGHT ? 1.05 : 1) * stemScale;
    let tips;
    if (form === FORM.WEIRD) {
      tips = drawTentacleStems(ctx, cx, soilY, stemH, pal, sway, p, pulse || 0);
    } else {
      tips = drawBonsaiTrunk(ctx, cx, soilY, stemH, pal, sway, p);
      const headY = soilY - stemH;
      if (p > 0.25) {
        drawKawaiiLeaf(ctx, cx - 22 * p, headY + 30, -0.5, 24 * p, 9, pal, 0);
        drawKawaiiLeaf(ctx, cx + 20 * p, headY + 35, 0.45, 22 * p, 8, pal, 2);
        drawKawaiiLeaf(ctx, cx, headY + 20, -0.2, 20 * p, 7, pal, 4);
      }
    }

    const draw = VARIANTS[variant] || VARIANTS.pulse_iris;
    if (form === FORM.WEIRD) {
      ctx.save();
      ctx.globalAlpha = 0.32;
      ctx.translate(5, 2);
      draw(ctx, tips, p * 0.95, pal, sway, form, pulse || 0);
      ctx.restore();
    }
    draw(ctx, tips, p, pal, sway, form, pulse || 0);

    if (!opts.skipPot) {
      const decorY = soilY - stemH * 0.5;
      ambientDecor(ctx, cx + sway, decorY, p, pal, form, pulse || 0);
    } else if (p > 0.35) {
      ambientDecor(ctx, cx + sway, soilY - stemH * 0.65, p * 0.85, pal, form, pulse || 0);
    }
    return pal;
  }

  function drawFrame(ctx, w, h, data, progress, wilt, shakeX, pulse, options) {
    if (!ctx || w < 1 || h < 1) return getPalette(data?.traits || {}, data?.formStyle);
    const opts = options || {};
    ctx.clearRect(0, 0, w, h);
    const form = data.formStyle || resolveFormStyle(data.traits || {});
    const pal = getPalette(data.traits || {}, form);
    let soilY;

    if (opts.skipPot) {
      soilY = h * (opts.soilLine != null ? opts.soilLine : 0.9);
    } else {
      const potW = Math.min(108, w * 0.38);
      const potH = potW * 0.65;
      const baseY = h * 0.84;
      if (form === FORM.WEIRD) {
        soilY = drawGlassBowl(ctx, w / 2, baseY, potW, potH, pal, wilt || 0, form);
      } else if (form === FORM.BRIGHT) {
        soilY = drawSpiralRainbowPot(ctx, w / 2, baseY, potW, potH, pal, wilt || 0);
      } else {
        soilY = drawDarkPot(ctx, w / 2, baseY, potW, potH, pal, wilt || 0);
      }
    }

    return drawPlantBody(ctx, w, soilY, progress, data, wilt || 0, shakeX || 0, pulse || 0, opts);
  }

  return { FORM, resolveFormStyle, resolveFormStyleFromScores, getFormLabel, getPalette, drawFrame, VARIANTS };
})();
