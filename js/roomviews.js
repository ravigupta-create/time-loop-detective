/* ═══════════════════════════════════════════════════════
   ROOMVIEWS — First-person perspective room rendering
   12 detailed rooms + shared perspective utilities +
   NPC silhouette rendering + hotspot position maps
   ═══════════════════════════════════════════════════════ */

const RoomViews = (() => {

    // ── Perspective Constants ──
    // Back wall boundaries in normalized 0-1 coords
    const BW = { l: 0.22, r: 0.78, t: 0.08, b: 0.65 };

    // ── Color Utility ──
    function adj(hex, f) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgb(${Math.floor(r * f)},${Math.floor(g * f)},${Math.floor(b * f)})`;
    }

    function rgba(r, g, b, a) { return `rgba(${r},${g},${b},${a})`; }

    // ── Shared Perspective Shell ──
    function drawShell(ctx, w, h, colors, br) {
        // Ceiling trapezoid
        ctx.fillStyle = adj(colors.bg, br * 0.5);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(w, 0);
        ctx.lineTo(BW.r * w, BW.t * h);
        ctx.lineTo(BW.l * w, BW.t * h);
        ctx.closePath();
        ctx.fill();

        // Left wall trapezoid
        const lwGrad = ctx.createLinearGradient(0, 0, BW.l * w, 0);
        lwGrad.addColorStop(0, adj(colors.wall, br * 0.55));
        lwGrad.addColorStop(1, adj(colors.wall, br * 0.85));
        ctx.fillStyle = lwGrad;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(BW.l * w, BW.t * h);
        ctx.lineTo(BW.l * w, BW.b * h);
        ctx.lineTo(0, h);
        ctx.closePath();
        ctx.fill();

        // Right wall trapezoid
        const rwGrad = ctx.createLinearGradient(w, 0, BW.r * w, 0);
        rwGrad.addColorStop(0, adj(colors.wall, br * 0.55));
        rwGrad.addColorStop(1, adj(colors.wall, br * 0.85));
        ctx.fillStyle = rwGrad;
        ctx.beginPath();
        ctx.moveTo(w, 0);
        ctx.lineTo(BW.r * w, BW.t * h);
        ctx.lineTo(BW.r * w, BW.b * h);
        ctx.lineTo(w, h);
        ctx.closePath();
        ctx.fill();

        // Back wall
        const bwGrad = ctx.createLinearGradient(0, BW.t * h, 0, BW.b * h);
        bwGrad.addColorStop(0, adj(colors.wall, br * 0.7));
        bwGrad.addColorStop(1, adj(colors.wall, br * 0.9));
        ctx.fillStyle = bwGrad;
        ctx.fillRect(BW.l * w, BW.t * h, (BW.r - BW.l) * w, (BW.b - BW.t) * h);

        // Floor
        const flGrad = ctx.createLinearGradient(0, BW.b * h, 0, h);
        flGrad.addColorStop(0, adj(colors.floor, br * 0.7));
        flGrad.addColorStop(1, adj(colors.floor, br * 0.4));
        ctx.fillStyle = flGrad;
        ctx.beginPath();
        ctx.moveTo(BW.l * w, BW.b * h);
        ctx.lineTo(BW.r * w, BW.b * h);
        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        ctx.closePath();
        ctx.fill();

        // ── Perspective lines ──
        // Baseboard on back wall
        ctx.fillStyle = adj(colors.accent, br * 0.4);
        ctx.fillRect(BW.l * w, BW.b * h - 4, (BW.r - BW.l) * w, 4);

        // Wainscoting on back wall (lower 30%)
        const wainTop = BW.t + (BW.b - BW.t) * 0.65;
        ctx.fillStyle = adj(colors.wall, br * 0.75);
        ctx.fillRect(BW.l * w, wainTop * h, (BW.r - BW.l) * w, (BW.b - wainTop) * h);
        ctx.strokeStyle = adj(colors.accent, br * 0.3);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(BW.l * w, wainTop * h);
        ctx.lineTo(BW.r * w, wainTop * h);
        ctx.stroke();

        // Floor grid lines (perspective)
        ctx.strokeStyle = rgba(255, 255, 255, 0.03);
        ctx.lineWidth = 1;
        for (let i = 1; i <= 6; i++) {
            const t = i / 7;
            const y = BW.b * h + (h - BW.b * h) * t;
            const lx = BW.l * w * (1 - t);
            const rx = BW.r * w + (w - BW.r * w) * t;
            ctx.beginPath();
            ctx.moveTo(lx, y);
            ctx.lineTo(rx, y);
            ctx.stroke();
        }
        // Vertical floor lines converging to vanishing point
        const vpx = 0.5 * w, vpy = 0.4 * h;
        for (let i = 0; i < 8; i++) {
            const bx = (i / 7) * w;
            ctx.beginPath();
            ctx.moveTo(bx, h);
            ctx.lineTo(vpx + (bx - vpx) * 0.5, BW.b * h);
            ctx.stroke();
        }

        // Left wall wainscoting
        ctx.fillStyle = adj(colors.wall, br * 0.6);
        ctx.beginPath();
        const lwWainT = 0.65;
        ctx.moveTo(0, h * lwWainT);
        ctx.lineTo(BW.l * w, BW.t * h + (BW.b * h - BW.t * h) * lwWainT);
        ctx.lineTo(BW.l * w, BW.b * h);
        ctx.lineTo(0, h);
        ctx.closePath();
        ctx.fill();

        // Right wall wainscoting
        ctx.beginPath();
        ctx.moveTo(w, h * lwWainT);
        ctx.lineTo(BW.r * w, BW.t * h + (BW.b * h - BW.t * h) * lwWainT);
        ctx.lineTo(BW.r * w, BW.b * h);
        ctx.lineTo(w, h);
        ctx.closePath();
        ctx.fill();
    }

    // ── Shared Element Helpers ──

    function drawDoorOnBackWall(ctx, w, h, nx, br, colors, locked) {
        // nx: normalized x position on back wall (0-1 within back wall)
        const dx = (BW.l + nx * (BW.r - BW.l)) * w;
        const dw = 0.08 * w;
        const dh = (BW.b - BW.t) * 0.55 * h;
        const dy = BW.b * h - dh;

        ctx.fillStyle = adj(locked ? '#1a1015' : '#2a1a0a', br);
        ctx.fillRect(dx - dw / 2, dy, dw, dh);

        // Frame
        ctx.strokeStyle = adj(colors.accent, br * 0.5);
        ctx.lineWidth = 2;
        ctx.strokeRect(dx - dw / 2, dy, dw, dh);

        // Doorknob
        ctx.fillStyle = adj(locked ? '#553322' : '#8b6914', br);
        ctx.beginPath();
        ctx.arc(dx + dw / 2 - 8, dy + dh * 0.55, 3, 0, Math.PI * 2);
        ctx.fill();

        if (locked) {
            // Lock icon
            ctx.fillStyle = rgba(204, 51, 51, 0.6);
            ctx.font = '14px serif';
            ctx.textAlign = 'center';
            ctx.fillText('🔒', dx, dy + dh * 0.3);
            ctx.textAlign = 'start';
        }
    }

    function drawDoorOnLeftWall(ctx, w, h, ny, br, colors) {
        // ny: normalized y position (0-1, 0=near back wall, 1=near viewer)
        const t = ny;
        const dx = BW.l * w * (1 - t);
        const dw = 0.06 * w * (0.6 + t * 0.4);
        const topY = (BW.t * h) * (1 - t) + 0 * t;
        const botY = (BW.b * h) * (1 - t) + h * t;
        const dy = topY + (botY - topY) * 0.25;
        const dh = (botY - topY) * 0.6;

        ctx.fillStyle = adj('#2a1a0a', br);
        ctx.fillRect(dx, dy, dw, dh);
        ctx.strokeStyle = adj(colors.accent, br * 0.4);
        ctx.lineWidth = 1.5;
        ctx.strokeRect(dx, dy, dw, dh);
    }

    function drawDoorOnRightWall(ctx, w, h, ny, br, colors) {
        const t = ny;
        const rx = BW.r * w + (w - BW.r * w) * t;
        const dw = 0.06 * w * (0.6 + t * 0.4);
        const topY = (BW.t * h) * (1 - t);
        const botY = (BW.b * h) * (1 - t) + h * t;
        const dy = topY + (botY - topY) * 0.25;
        const dh = (botY - topY) * 0.6;

        ctx.fillStyle = adj('#2a1a0a', br);
        ctx.fillRect(rx - dw, dy, dw, dh);
        ctx.strokeStyle = adj(colors.accent, br * 0.4);
        ctx.lineWidth = 1.5;
        ctx.strokeRect(rx - dw, dy, dw, dh);
    }

    function drawWindowOnBackWall(ctx, w, h, nx, br, time, gameTime) {
        const wx = (BW.l + nx * (BW.r - BW.l)) * w;
        const ww = 0.1 * w;
        const wh = (BW.b - BW.t) * 0.45 * h;
        const wy = (BW.t + (BW.b - BW.t) * 0.1) * h;

        // Frame
        ctx.fillStyle = adj('#1a1510', br);
        ctx.fillRect(wx - ww / 2 - 3, wy - 3, ww + 6, wh + 6);

        // Sky
        const tod = GameData.getTimeOfDay(gameTime);
        let sky;
        switch (tod) {
            case 'early_morning': sky = '#0a0a20'; break;
            case 'morning': sky = '#1a2040'; break;
            case 'late_morning': sky = '#2a3050'; break;
            case 'afternoon': sky = '#3a4060'; break;
            case 'late_afternoon': sky = '#2a2540'; break;
            case 'evening': sky = '#1a1530'; break;
            default: sky = '#0a0a15'; break;
        }
        ctx.fillStyle = sky;
        ctx.fillRect(wx - ww / 2, wy, ww, wh);

        // Rain streaks
        ctx.strokeStyle = rgba(150, 170, 200, 0.3);
        ctx.lineWidth = 1;
        for (let i = 0; i < 6; i++) {
            const rx = wx - ww / 2 + Math.random() * ww;
            const ry = wy + ((time * 50 + i * 30) % wh);
            ctx.beginPath();
            ctx.moveTo(rx, ry);
            ctx.lineTo(rx - 1, ry + 8);
            ctx.stroke();
        }

        // Cross
        ctx.fillStyle = adj('#1a1510', br);
        ctx.fillRect(wx - 1.5, wy, 3, wh);
        ctx.fillRect(wx - ww / 2, wy + wh / 2 - 1.5, ww, 3);

        // Light spill
        const grad = ctx.createRadialGradient(wx, wy + wh / 2, 0, wx, wy + wh / 2, ww * 1.5);
        grad.addColorStop(0, rgba(150, 170, 200, 0.04));
        grad.addColorStop(1, rgba(150, 170, 200, 0));
        ctx.fillStyle = grad;
        ctx.fillRect(wx - ww, wy - wh / 2, ww * 2, wh * 2);
    }

    function drawFireplace(ctx, w, h, nx, br, time) {
        const fx = (BW.l + nx * (BW.r - BW.l)) * w;
        const fw = 0.1 * w;
        const fh = (BW.b - BW.t) * 0.4 * h;
        const fy = BW.b * h - fh;

        // Mantel
        ctx.fillStyle = adj('#333333', br);
        ctx.fillRect(fx - fw / 2 - 10, fy - 15, fw + 20, 12);
        // Surround
        ctx.fillStyle = adj('#2a2a2a', br);
        ctx.fillRect(fx - fw / 2 - 5, fy - 3, fw + 10, fh + 3);
        // Hearth opening
        ctx.fillStyle = '#0a0500';
        ctx.fillRect(fx - fw / 2 + 3, fy + 5, fw - 6, fh - 8);

        // Flames
        for (let i = 0; i < 5; i++) {
            const flx = fx - fw / 2 + 8 + i * ((fw - 16) / 4);
            const flH = 18 + Math.sin(time * 5 + i * 2) * 8;
            const grad = ctx.createLinearGradient(flx, fy + fh - 3, flx, fy + fh - 3 - flH);
            grad.addColorStop(0, rgba(255, 100, 20, 0.8));
            grad.addColorStop(0.5, rgba(255, 200, 50, 0.6));
            grad.addColorStop(1, rgba(255, 255, 100, 0));
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.ellipse(flx, fy + fh - 3, 5, flH, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // Warm glow
        const glow = ctx.createRadialGradient(fx, fy + fh / 2, 0, fx, fy + fh / 2, fw * 2.5);
        glow.addColorStop(0, rgba(255, 150, 50, 0.08));
        glow.addColorStop(1, rgba(255, 150, 50, 0));
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, w, h);
    }

    function drawChandelier(ctx, w, h, nx, ny, br, time, size) {
        const cx = nx * w, cy = ny * h;
        const s = size || 1;

        // Chain
        ctx.strokeStyle = adj('#8b6914', br);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx, 0);
        ctx.lineTo(cx, cy);
        ctx.stroke();

        // Frame
        ctx.fillStyle = adj('#8b6914', br);
        const bw = 35 * s, bh = 6 * s;
        ctx.fillRect(cx - bw, cy, bw * 2, bh);

        // Arms
        ctx.strokeStyle = adj('#8b6914', br * 0.8);
        ctx.lineWidth = 1;
        for (let i = -2; i <= 2; i++) {
            ctx.beginPath();
            ctx.moveTo(cx, cy + bh / 2);
            ctx.lineTo(cx + i * 14 * s, cy + bh + 8 * s);
            ctx.stroke();
        }

        // Candle glow
        for (let i = -2; i <= 2; i++) {
            const gx = cx + i * 14 * s;
            const gy = cy - 4 * s;
            const flicker = 6 + Math.sin(time * 4 + i * 1.5) * 2;
            ctx.fillStyle = rgba(255, 220, 120, 0.2 * br);
            ctx.beginPath();
            ctx.arc(gx, gy, flicker * s, 0, Math.PI * 2);
            ctx.fill();
            // Flame dot
            ctx.fillStyle = rgba(255, 240, 180, 0.6 * br);
            ctx.beginPath();
            ctx.arc(gx, gy, 2 * s, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function drawBookshelf(ctx, w, h, x, y, bw, bh, br) {
        // Shelf unit
        ctx.fillStyle = adj('#2a1a0a', br * 0.8);
        ctx.fillRect(x, y, bw, bh);
        // Frame
        ctx.strokeStyle = adj('#1a1510', br);
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x, y, bw, bh);

        const shelfCount = Math.floor(bh / 28);
        for (let i = 0; i < shelfCount; i++) {
            const sy = y + i * (bh / shelfCount);
            // Shelf plank
            ctx.fillStyle = adj('#1a1510', br);
            ctx.fillRect(x + 1, sy, bw - 2, 2);
            // Books
            const bookColors = ['#8b0000', '#003366', '#2a4a2a', '#4a3a2a', '#2a2a4a', '#4a2a00', '#0a3a3a'];
            for (let j = 0; j < 6; j++) {
                const bookH = 12 + (j * 3 + i * 7) % 10;
                const bookW = 3 + (j * 2 + i) % 4;
                ctx.fillStyle = adj(bookColors[(j + i) % bookColors.length], br * 0.5);
                ctx.fillRect(x + 3 + j * (bw / 7), sy + (bh / shelfCount) - bookH - 2, bookW, bookH);
            }
        }
    }

    function drawPainting(ctx, w, h, px, py, pw, ph, br, hasSubject) {
        // Frame
        ctx.strokeStyle = adj('#8b6914', br * 0.6);
        ctx.lineWidth = 3;
        ctx.strokeRect(px - 2, py - 2, pw + 4, ph + 4);
        // Canvas
        ctx.fillStyle = adj('#1a1a2a', br * 0.4);
        ctx.fillRect(px, py, pw, ph);
        // Subject hint
        if (hasSubject) {
            ctx.fillStyle = adj('#665544', br * 0.3);
            ctx.beginPath();
            ctx.arc(px + pw / 2, py + ph * 0.4, pw * 0.15, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function drawTable(ctx, w, h, tx, ty, tw, th, br, color) {
        const c = color || '#2a1a0a';
        // Top
        ctx.fillStyle = adj(c, br);
        ctx.fillRect(tx, ty, tw, th * 0.2);
        // Legs
        ctx.fillRect(tx + 4, ty + th * 0.2, 5, th * 0.8);
        ctx.fillRect(tx + tw - 9, ty + th * 0.2, 5, th * 0.8);
    }

    function drawBed(ctx, w, h, bx, by, bw, bh, br, color) {
        const c = color || '#2a1a20';
        // Headboard
        ctx.fillStyle = adj('#1a1015', br);
        ctx.fillRect(bx, by - bh * 0.3, bw, bh * 0.35);
        // Mattress
        ctx.fillStyle = adj(c, br);
        ctx.fillRect(bx, by, bw, bh);
        // Pillow
        ctx.fillStyle = adj('#d4d0c0', br * 0.3);
        ctx.fillRect(bx + 5, by + 3, bw * 0.25, bh * 0.3);
        // Blanket fold
        ctx.fillStyle = adj(c, br * 0.8);
        ctx.fillRect(bx, by + bh * 0.6, bw, 3);
    }

    function drawGrandfatherClock(ctx, w, h, cx, cy, cw, ch, br, time) {
        // Body
        ctx.fillStyle = adj('#2a1a0a', br);
        ctx.fillRect(cx, cy, cw, ch);
        // Top ornament
        ctx.beginPath();
        ctx.arc(cx + cw / 2, cy, cw / 2, Math.PI, 0);
        ctx.fill();
        // Face
        ctx.fillStyle = adj('#d4d0c0', br * 0.4);
        ctx.beginPath();
        ctx.arc(cx + cw / 2, cy + ch * 0.18, cw * 0.35, 0, Math.PI * 2);
        ctx.fill();
        // Hour marks
        ctx.fillStyle = adj('#1a1510', br);
        for (let i = 0; i < 12; i++) {
            const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
            ctx.beginPath();
            ctx.arc(cx + cw / 2 + Math.cos(a) * cw * 0.28, cy + ch * 0.18 + Math.sin(a) * cw * 0.28, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
        // Pendulum
        const swing = Math.sin(time * 2) * cw * 0.3;
        ctx.strokeStyle = adj('#8b6914', br);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx + cw / 2, cy + ch * 0.35);
        ctx.lineTo(cx + cw / 2 + swing, cy + ch * 0.7);
        ctx.stroke();
        ctx.fillStyle = adj('#8b6914', br);
        ctx.beginPath();
        ctx.arc(cx + cw / 2 + swing, cy + ch * 0.7, 4, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawStaircase(ctx, w, h, sx, sy, sw, sh, br, goesUp) {
        const steps = 10;
        for (let i = 0; i < steps; i++) {
            const t = i / steps;
            const stepW = sw * (0.6 + t * 0.4);
            const stepY = sy + sh * t;
            const stepX = sx + (sw - stepW) * 0.5;
            ctx.fillStyle = adj('#1a1510', br * (0.6 + t * 0.4));
            ctx.fillRect(stepX, stepY, stepW, sh / steps - 1);
        }
        // Railing
        ctx.strokeStyle = adj('#8b6914', br * 0.5);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(sx + sw * 0.1, sy);
        ctx.lineTo(sx + sw * 0.5, sy + sh);
        ctx.stroke();
        // Newel post
        ctx.fillStyle = adj('#8b6914', br * 0.6);
        ctx.fillRect(sx + sw * 0.48, sy + sh - 3, 6, 3);
    }

    function drawCandelabra(ctx, w, h, cx, cy, br, time) {
        // Base
        ctx.fillStyle = adj('#8b6914', br);
        ctx.fillRect(cx - 3, cy, 6, 22);
        ctx.fillRect(cx - 14, cy - 5, 28, 3);

        // Candles and flames
        for (let i = -1; i <= 1; i++) {
            const fx = cx + i * 11;
            // Candle
            ctx.fillStyle = adj('#d4d0c0', br * 0.4);
            ctx.fillRect(fx - 2, cy - 14, 4, 10);
            // Flame
            const flH = 5 + Math.sin(time * 6 + i * 2) * 2;
            ctx.fillStyle = rgba(255, 200, 100, 0.5 * br);
            ctx.beginPath();
            ctx.ellipse(fx, cy - 14 - flH / 2, 3, flH, 0, 0, Math.PI * 2);
            ctx.fill();
            // Glow
            ctx.fillStyle = rgba(255, 200, 100, 0.08 * br);
            ctx.beginPath();
            ctx.arc(fx, cy - 14, 12, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function drawPiano(ctx, w, h, px, py, pw, ph, br) {
        // Body
        ctx.fillStyle = adj('#0a0a0a', br);
        ctx.fillRect(px, py, pw, ph);
        // Lid (angled up)
        ctx.fillStyle = adj('#111111', br);
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px + pw, py);
        ctx.lineTo(px + pw - 5, py - ph * 0.4);
        ctx.lineTo(px + 5, py - ph * 0.15);
        ctx.closePath();
        ctx.fill();
        // Keys area
        const ky = py + ph * 0.65;
        ctx.fillStyle = adj('#d4d0c0', br * 0.3);
        ctx.fillRect(px + 4, ky, pw - 8, ph * 0.25);
        // Black keys
        for (let i = 0; i < 7; i++) {
            if (i !== 2 && i !== 5) {
                ctx.fillStyle = adj('#0a0a0a', br);
                ctx.fillRect(px + 8 + i * ((pw - 16) / 7), ky, 5, ph * 0.15);
            }
        }
    }

    function drawAncientClock(ctx, w, h, cx, cy, radius, br, time) {
        // Outer glow
        const glow = 0.1 + Math.sin(time * 2) * 0.05;
        ctx.fillStyle = rgba(68, 136, 204, glow);
        ctx.beginPath();
        ctx.arc(cx, cy, radius * 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Clock body
        ctx.fillStyle = adj('#2a2a40', br);
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = adj('#4488cc', br);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.stroke();

        // Symbols
        for (let i = 0; i < 12; i++) {
            const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
            const sx = cx + Math.cos(a) * radius * 0.8;
            const sy = cy + Math.sin(a) * radius * 0.8;
            ctx.fillStyle = rgba(68, 136, 204, 0.5 + Math.sin(time + i) * 0.3);
            ctx.beginPath();
            ctx.arc(sx, sy, 3, 0, Math.PI * 2);
            ctx.fill();
        }

        // Hands
        const handA = time * 0.5;
        ctx.strokeStyle = rgba(68, 136, 204, 0.8);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(handA) * radius * 0.6, cy + Math.sin(handA) * radius * 0.6);
        ctx.stroke();
        const handB = time * 0.13;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(handB) * radius * 0.4, cy + Math.sin(handB) * radius * 0.4);
        ctx.stroke();
    }

    function drawTelescope(ctx, w, h, tx, ty, br) {
        // Tripod
        ctx.strokeStyle = adj('#555566', br);
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(tx, ty + 15); ctx.lineTo(tx - 15, ty + 55); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(tx, ty + 15); ctx.lineTo(tx + 15, ty + 55); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(tx, ty + 15); ctx.lineTo(tx + 3, ty + 55); ctx.stroke();
        // Tube
        ctx.fillStyle = adj('#555566', br);
        ctx.save();
        ctx.translate(tx, ty + 15);
        ctx.rotate(-0.4);
        ctx.fillRect(-3, -35, 7, 40);
        // Lens
        ctx.fillStyle = rgba(100, 150, 200, 0.3);
        ctx.beginPath();
        ctx.arc(0, -37, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    function drawTree(ctx, x, y, br, scale) {
        const s = scale || 1;
        // Trunk
        ctx.fillStyle = adj('#1a1510', br * 0.5);
        ctx.fillRect(x - 3 * s, y, 6 * s, 35 * s);
        // Canopy (dark winter)
        ctx.fillStyle = adj('#0a1a0a', br * 0.6);
        ctx.beginPath();
        ctx.arc(x, y - 5 * s, 22 * s, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = adj('#0a150a', br * 0.4);
        ctx.beginPath();
        ctx.arc(x - 8 * s, y + 2 * s, 15 * s, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawLampGlow(ctx, x, y, radius, br) {
        const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
        grad.addColorStop(0, rgba(212, 160, 32, 0.15 * br));
        grad.addColorStop(0.5, rgba(212, 160, 32, 0.05 * br));
        grad.addColorStop(1, rgba(212, 160, 32, 0));
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }

    // ── NPC Silhouette Rendering ──
    function drawNPCSilhouettes(ctx, w, h, br, time) {
        const npcsHere = Engine.getNPCsAtLocation(Engine.state.currentLocation, Engine.state.time);
        if (npcsHere.length === 0) return [];

        const npcHotspots = [];
        const slots = getNPCSlots(Engine.state.currentLocation);

        npcsHere.forEach((npc, i) => {
            if (i >= slots.length) return;
            const slot = slots[i];
            const cx = slot.x * w;
            const baseY = slot.y * h;
            const npcData = GameData.npcs[npc.id];
            const color = npcData ? npcData.color : '#888';
            const figH = h * 0.22;
            const figW = figH * 0.35;

            // Floor shadow
            ctx.fillStyle = rgba(0, 0, 0, 0.25);
            ctx.beginPath();
            ctx.ellipse(cx, baseY + 2, figW * 0.8, 4, 0, 0, Math.PI * 2);
            ctx.fill();

            // Body silhouette (dark with color accent)
            const breathe = Math.sin(time * 1.8 + i * 1.3) * 1.5;
            const bodyGrad = ctx.createLinearGradient(cx, baseY - figH, cx, baseY);
            bodyGrad.addColorStop(0, 'rgba(15,15,25,0.9)');
            bodyGrad.addColorStop(0.4, color);
            bodyGrad.addColorStop(1, 'rgba(15,15,25,0.95)');

            ctx.fillStyle = bodyGrad;
            // Torso
            ctx.beginPath();
            ctx.ellipse(cx, baseY - figH * 0.35 + breathe, figW, figH * 0.4, 0, 0, Math.PI * 2);
            ctx.fill();
            // Legs
            ctx.fillStyle = 'rgba(15,15,25,0.9)';
            ctx.fillRect(cx - figW * 0.4, baseY - figH * 0.15, figW * 0.35, figH * 0.2);
            ctx.fillRect(cx + figW * 0.05, baseY - figH * 0.15, figW * 0.35, figH * 0.2);

            // Head
            ctx.fillStyle = 'rgba(20,20,30,0.95)';
            ctx.beginPath();
            ctx.arc(cx, baseY - figH * 0.78 + breathe, figW * 0.45, 0, Math.PI * 2);
            ctx.fill();

            // Glowing eyes
            ctx.fillStyle = rgba(200, 200, 220, 0.6);
            ctx.fillRect(cx - 4, baseY - figH * 0.8 + breathe, 3, 2);
            ctx.fillRect(cx + 2, baseY - figH * 0.8 + breathe, 3, 2);

            // Name label
            ctx.fillStyle = rgba(200, 200, 212, 0.5);
            ctx.font = '10px "Courier New", monospace';
            ctx.textAlign = 'center';
            ctx.fillText(npcData ? npcData.name.split(' ').pop() : '', cx, baseY + 14);
            ctx.textAlign = 'start';

            // Register hotspot
            const hsW = 0.07, hsH = 0.25;
            npcHotspots.push({
                type: 'npc',
                label: `Talk to ${npc.name}`,
                rect: { x: slot.x - hsW / 2, y: slot.y - hsH, w: hsW, h: hsH },
                action: () => Engine.talkToNPC(npc.id),
            });
        });

        return npcHotspots;
    }

    function getNPCSlots(roomId) {
        const slots = {
            your_room:     [{ x: 0.38, y: 0.62 }, { x: 0.28, y: 0.60 }],
            grand_hallway: [{ x: 0.35, y: 0.62 }, { x: 0.50, y: 0.60 }, { x: 0.65, y: 0.62 }, { x: 0.42, y: 0.58 }],
            dining_room:   [{ x: 0.35, y: 0.62 }, { x: 0.55, y: 0.60 }, { x: 0.65, y: 0.62 }],
            kitchen:       [{ x: 0.40, y: 0.62 }, { x: 0.55, y: 0.60 }],
            library:       [{ x: 0.38, y: 0.62 }, { x: 0.55, y: 0.60 }, { x: 0.65, y: 0.62 }],
            study:         [{ x: 0.42, y: 0.62 }, { x: 0.58, y: 0.60 }],
            drawing_room:  [{ x: 0.35, y: 0.62 }, { x: 0.50, y: 0.60 }, { x: 0.65, y: 0.62 }],
            ballroom:      [{ x: 0.30, y: 0.62 }, { x: 0.45, y: 0.60 }, { x: 0.60, y: 0.62 }, { x: 0.72, y: 0.60 }],
            garden:        [{ x: 0.35, y: 0.62 }, { x: 0.55, y: 0.60 }, { x: 0.70, y: 0.62 }],
            master_suite:  [{ x: 0.40, y: 0.62 }, { x: 0.55, y: 0.60 }],
            wine_cellar:   [{ x: 0.40, y: 0.62 }, { x: 0.55, y: 0.60 }],
            tower:         [{ x: 0.38, y: 0.62 }, { x: 0.55, y: 0.60 }],
        };
        return slots[roomId] || [{ x: 0.5, y: 0.62 }];
    }

    // ═══════════════════════════════════════════
    // ROOM DRAWING FUNCTIONS (12 rooms)
    // ═══════════════════════════════════════════

    function drawYourRoom(ctx, w, h, br, warmth, time, gameTime) {
        const colors = { bg: '#1a1520', wall: '#2a2030', floor: '#1a1510', accent: '#d4a020' };
        drawShell(ctx, w, h, colors, br);

        // Floral wallpaper hint on back wall — subtle vertical stripes
        ctx.strokeStyle = rgba(180, 140, 100, 0.03);
        ctx.lineWidth = 1;
        for (let i = 0; i < 20; i++) {
            const x = (BW.l + i / 20 * (BW.r - BW.l)) * w;
            ctx.beginPath();
            ctx.moveTo(x, BW.t * h);
            ctx.lineTo(x, BW.b * h);
            ctx.stroke();
        }

        // Window on back wall (right side)
        drawWindowOnBackWall(ctx, w, h, 0.72, br, time, gameTime);

        // Door on left wall
        drawDoorOnLeftWall(ctx, w, h, 0.5, br, colors);

        // Bed (right side of back wall, extending toward viewer)
        const bedX = 0.52 * w, bedY = BW.b * h - 10;
        const bedW = 0.22 * w, bedH = h * 0.12;
        drawBed(ctx, w, h, bedX, bedY, bedW, bedH, br, '#2a2030');

        // Nightstand (left of bed)
        const nsX = 0.44 * w, nsY = BW.b * h + 2;
        ctx.fillStyle = adj('#1a1510', br);
        ctx.fillRect(nsX, nsY, w * 0.06, h * 0.06);
        // Lamp on nightstand
        ctx.fillStyle = adj('#8b6914', br * 0.6);
        ctx.fillRect(nsX + w * 0.02, nsY - h * 0.04, w * 0.02, h * 0.04);
        ctx.fillStyle = adj('#d4a020', br * 0.5);
        ctx.beginPath();
        ctx.moveTo(nsX + w * 0.01, nsY - h * 0.04);
        ctx.lineTo(nsX + w * 0.05, nsY - h * 0.04);
        ctx.lineTo(nsX + w * 0.04, nsY - h * 0.07);
        ctx.lineTo(nsX + w * 0.02, nsY - h * 0.07);
        ctx.closePath();
        ctx.fill();
        drawLampGlow(ctx, nsX + w * 0.03, nsY - h * 0.06, 50, br);

        // Mirror on back wall (left side)
        const mirX = (BW.l + 0.12 * (BW.r - BW.l)) * w;
        const mirY = (BW.t + 0.15 * (BW.b - BW.t)) * h;
        const mirW = 0.06 * w, mirH = 0.12 * h;
        ctx.fillStyle = rgba(100, 110, 130, 0.15);
        ctx.fillRect(mirX, mirY, mirW, mirH);
        ctx.strokeStyle = adj('#8b6914', br * 0.5);
        ctx.lineWidth = 2;
        ctx.strokeRect(mirX, mirY, mirW, mirH);
        // Reflection hint
        ctx.fillStyle = rgba(200, 200, 220, 0.05);
        ctx.fillRect(mirX + 3, mirY + 3, mirW - 6, mirH - 6);

        // Coat by door
        ctx.fillStyle = adj('#1a1a1a', br * 0.5);
        ctx.fillRect(BW.l * w + 8, BW.t * h + (BW.b - BW.t) * h * 0.2, 8, 30);
    }

    function drawGrandHallway(ctx, w, h, br, warmth, time, gameTime) {
        const colors = { bg: '#0d0d1a', wall: '#1a1a2e', floor: '#1a1510', accent: '#8b6914' };
        drawShell(ctx, w, h, colors, br);

        // Checkered marble floor
        ctx.save();
        for (let row = 0; row < 6; row++) {
            for (let col = 0; col < 10; col++) {
                const t = (row + 1) / 7;
                const y = BW.b * h + (h - BW.b * h) * t;
                const py = BW.b * h + (h - BW.b * h) * (row / 7);
                const lx = BW.l * w * (1 - t);
                const rx = BW.r * w + (w - BW.r * w) * t;
                const tileW = (rx - lx) / 10;
                const tx = lx + col * tileW;
                const dark = (row + col) % 2 === 0;
                ctx.fillStyle = dark ? rgba(15, 15, 20, 0.3) : rgba(40, 35, 30, 0.2);
                ctx.fillRect(tx, py, tileW + 1, y - py + 1);
            }
        }
        ctx.restore();

        // Grand staircase on back wall (center-right)
        drawStaircase(ctx, w, h, 0.52 * w, BW.t * h + (BW.b - BW.t) * h * 0.15,
            0.18 * w, (BW.b - BW.t) * h * 0.75, br, true);

        // Chandelier
        drawChandelier(ctx, w, h, 0.5, 0.04, br, time, 1.2);

        // Grandfather clock on back wall (left)
        const clockX = (BW.l + 0.04 * (BW.r - BW.l)) * w;
        const clockY = BW.t * h + (BW.b - BW.t) * h * 0.15;
        drawGrandfatherClock(ctx, w, h, clockX, clockY, 30, (BW.b - BW.t) * h * 0.65, br, time);

        // Portraits on back wall
        for (let i = 0; i < 4; i++) {
            const px = (BW.l + (0.22 + i * 0.14) * (BW.r - BW.l)) * w;
            const py = (BW.t + 0.08 * (BW.b - BW.t)) * h;
            drawPainting(ctx, w, h, px, py, 32, 42, br, true);
        }

        // Side table (back wall, right-center area)
        const stX = (BW.l + 0.72 * (BW.r - BW.l)) * w;
        const stY = BW.b * h - 22;
        drawTable(ctx, w, h, stX, stY, 40, 22, br);

        // Multiple doors on back wall for exits
        drawDoorOnBackWall(ctx, w, h, 0.08, br, colors, false); // left back door
        drawDoorOnBackWall(ctx, w, h, 0.88, br, colors, false); // right back door

        // Left wall door
        drawDoorOnLeftWall(ctx, w, h, 0.4, br, colors);
        // Right wall door
        drawDoorOnRightWall(ctx, w, h, 0.4, br, colors);
    }

    function drawDiningRoom(ctx, w, h, br, warmth, time, gameTime) {
        const colors = { bg: '#1a1015', wall: '#2a1a20', floor: '#1a1510', accent: '#cc3333' };
        drawShell(ctx, w, h, colors, br);

        // Long dining table (in perspective, receding toward back wall)
        const tableL = 0.3 * w, tableR = 0.7 * w;
        const tableNearY = BW.b * h + (h - BW.b * h) * 0.3;
        const tableFarY = BW.b * h + 5;
        // Table surface (perspective quad)
        ctx.fillStyle = adj('#2a1a0a', br);
        ctx.beginPath();
        ctx.moveTo(tableL, tableNearY);
        ctx.lineTo(tableR, tableNearY);
        ctx.lineTo(tableR * 0.85 + 0.15 * BW.r * w, tableFarY);
        ctx.lineTo(tableL * 0.85 + 0.15 * BW.l * w, tableFarY);
        ctx.closePath();
        ctx.fill();
        // Table cloth edge
        ctx.strokeStyle = adj('#ffffff', br * 0.15);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(tableL - 3, tableNearY);
        ctx.lineTo(tableR + 3, tableNearY);
        ctx.stroke();
        // Place settings
        for (let i = 0; i < 5; i++) {
            const t = (i + 1) / 6;
            const px = tableL + (tableR - tableL) * 0.2;
            const py = tableNearY - (tableNearY - tableFarY) * t;
            ctx.fillStyle = rgba(200, 200, 210, 0.1);
            ctx.beginPath();
            ctx.arc(px + 5, py + 4, 5 * (1 - t * 0.3), 0, Math.PI * 2);
            ctx.fill();
        }

        // Candelabra on table center
        drawCandelabra(ctx, w, h, 0.5 * w, tableFarY + (tableNearY - tableFarY) * 0.4, br, time);

        // Wine cabinet on back wall (right side)
        drawBookshelf(ctx, w, h, (BW.l + 0.7 * (BW.r - BW.l)) * w, (BW.t + 0.15 * (BW.b - BW.t)) * h,
            0.08 * w, (BW.b - BW.t) * 0.7 * h, br);

        // Sideboard on back wall (left)
        const sbX = (BW.l + 0.05 * (BW.r - BW.l)) * w;
        const sbY = BW.b * h - 25;
        ctx.fillStyle = adj('#2a1a15', br);
        ctx.fillRect(sbX, sbY, 0.12 * w, 25);
        ctx.strokeStyle = adj(colors.accent, br * 0.3);
        ctx.lineWidth = 1;
        ctx.strokeRect(sbX, sbY, 0.12 * w, 25);

        // Door to hallway (left wall)
        drawDoorOnLeftWall(ctx, w, h, 0.4, br, colors);
        // Door to kitchen (right wall)
        drawDoorOnRightWall(ctx, w, h, 0.5, br, colors);

        // Window
        drawWindowOnBackWall(ctx, w, h, 0.45, br, time, gameTime);
    }

    function drawKitchen(ctx, w, h, br, warmth, time, gameTime) {
        const colors = { bg: '#1a1810', wall: '#2a2520', floor: '#2a2218', accent: '#d4a020' };
        drawShell(ctx, w, h, colors, br);

        // Stone counter along back wall
        const ctrY = BW.b * h - 18;
        ctx.fillStyle = adj('#3a3530', br);
        ctx.fillRect(BW.l * w + 5, ctrY, (BW.r - BW.l) * w * 0.6, 18);
        ctx.strokeStyle = adj('#2a2520', br);
        ctx.lineWidth = 1;
        ctx.strokeRect(BW.l * w + 5, ctrY, (BW.r - BW.l) * w * 0.6, 18);

        // Copper pots on back wall
        const potsColors = ['#b87333', '#a06828', '#c08040'];
        for (let i = 0; i < 3; i++) {
            const px = (BW.l + (0.08 + i * 0.15) * (BW.r - BW.l)) * w;
            const py = (BW.t + 0.12 * (BW.b - BW.t)) * h;
            ctx.fillStyle = adj(potsColors[i], br * 0.5);
            ctx.beginPath();
            ctx.arc(px, py + 8, 10, 0, Math.PI);
            ctx.fill();
            ctx.fillRect(px - 10, py, 20, 8);
            // Handle
            ctx.strokeStyle = adj(potsColors[i], br * 0.4);
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(px, py - 2, 6, Math.PI, 0);
            ctx.stroke();
        }

        // Bell board on right side of back wall
        const bbX = (BW.l + 0.72 * (BW.r - BW.l)) * w;
        const bbY = (BW.t + 0.1 * (BW.b - BW.t)) * h;
        ctx.fillStyle = adj('#1a1510', br);
        ctx.fillRect(bbX, bbY, 0.08 * w, 0.15 * h);
        ctx.strokeStyle = adj('#8b6914', br * 0.4);
        ctx.lineWidth = 1;
        ctx.strokeRect(bbX, bbY, 0.08 * w, 0.15 * h);
        // Bells
        for (let i = 0; i < 5; i++) {
            ctx.fillStyle = adj('#8b6914', br * 0.5);
            ctx.beginPath();
            ctx.arc(bbX + 0.04 * w, bbY + 8 + i * 12, 4, 0, Math.PI * 2);
            ctx.fill();
        }

        // Herb shelf on back wall (center-left)
        const hsX = (BW.l + 0.3 * (BW.r - BW.l)) * w;
        for (let i = 0; i < 3; i++) {
            const shY = (BW.t + (0.15 + i * 0.14) * (BW.b - BW.t)) * h;
            ctx.fillStyle = adj('#1a1510', br * 0.8);
            ctx.fillRect(hsX, shY, 0.15 * w, 3);
            // Jars
            for (let j = 0; j < 3; j++) {
                ctx.fillStyle = adj(j === 2 && i === 2 ? '#4a2a4a' : '#3a3a2a', br * 0.4);
                ctx.fillRect(hsX + 4 + j * 18, shY - 12, 12, 12);
            }
        }

        // Pantry door on back wall
        drawDoorOnBackWall(ctx, w, h, 0.55, br, colors, false);

        // Door to dining room (left wall)
        drawDoorOnLeftWall(ctx, w, h, 0.4, br, colors);
        // Door to wine cellar (right wall — stairs down)
        drawDoorOnRightWall(ctx, w, h, 0.5, br, colors);

        // Range/stove (foreground left)
        ctx.fillStyle = adj('#1a1a1a', br);
        ctx.fillRect(0.08 * w, BW.b * h + 10, 0.12 * w, h * 0.15);
        // Steam
        ctx.fillStyle = rgba(200, 200, 210, 0.05);
        for (let i = 0; i < 3; i++) {
            const sy = BW.b * h + 5 - i * 15 + Math.sin(time * 2 + i) * 3;
            ctx.beginPath();
            ctx.arc(0.12 * w + i * 8, sy, 8 + i * 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function drawLibrary(ctx, w, h, br, warmth, time, gameTime) {
        const colors = { bg: '#10100a', wall: '#1a1a10', floor: '#2a1a0a', accent: '#8b4513' };
        drawShell(ctx, w, h, colors, br);

        // Floor-to-ceiling bookshelves — LEFT side of back wall
        drawBookshelf(ctx, w, h,
            BW.l * w + 3, BW.t * h + 5,
            (BW.r - BW.l) * w * 0.22, (BW.b - BW.t) * h - 10, br);

        // Floor-to-ceiling bookshelves — RIGHT side of back wall
        drawBookshelf(ctx, w, h,
            BW.r * w - (BW.r - BW.l) * w * 0.22 - 3, BW.t * h + 5,
            (BW.r - BW.l) * w * 0.22, (BW.b - BW.t) * h - 10, br);

        // Left wall bookshelves
        ctx.fillStyle = adj('#2a1a0a', br * 0.6);
        ctx.beginPath();
        ctx.moveTo(0, h * 0.05);
        ctx.lineTo(BW.l * w - 2, BW.t * h + 5);
        ctx.lineTo(BW.l * w - 2, BW.b * h - 5);
        ctx.lineTo(0, h * 0.9);
        ctx.closePath();
        ctx.fill();
        // Book texture on left wall
        for (let i = 0; i < 8; i++) {
            const t = i / 8;
            const ly = h * 0.05 + (h * 0.85) * t;
            const lx = BW.l * w * (1 - t * 0.8);
            ctx.fillStyle = adj('#1a1510', br * 0.5);
            ctx.fillRect(0, ly, lx - 2, 2);
        }

        // Fireplace (center of back wall)
        drawFireplace(ctx, w, h, 0.5, br, time);

        // Reading desk (foreground, slightly right of center)
        const deskX = 0.42 * w, deskY = BW.b * h + 15;
        drawTable(ctx, w, h, deskX, deskY, 0.2 * w, h * 0.08, br);
        // Papers on desk
        ctx.fillStyle = rgba(200, 190, 170, 0.15);
        ctx.fillRect(deskX + 10, deskY - 2, 25, 18);
        ctx.fillRect(deskX + 40, deskY - 1, 20, 15);
        // Lamp on desk
        drawLampGlow(ctx, deskX + 0.15 * w, deskY - 15, 40, br);

        // East bookshelf (right side, on the back wall — the one with secret passage)
        // Already drawn as right bookshelf above — just add "The Art of Deception" indicator
        const artX = BW.r * w - (BW.r - BW.l) * w * 0.12;
        const artY = BW.t * h + (BW.b - BW.t) * h * 0.5;
        ctx.fillStyle = adj('#8b0000', br * 0.7);
        ctx.fillRect(artX, artY, 5, 16);

        // Brandy tray (near fireplace)
        const btX = (BW.l + 0.62 * (BW.r - BW.l)) * w;
        const btY = BW.b * h - 10;
        ctx.fillStyle = adj('#8b6914', br * 0.4);
        ctx.fillRect(btX, btY, 25, 3);
        // Decanter
        ctx.fillStyle = adj('#553322', br * 0.5);
        ctx.fillRect(btX + 4, btY - 14, 8, 14);
        ctx.beginPath();
        ctx.arc(btX + 8, btY - 14, 5, 0, Math.PI * 2);
        ctx.fill();

        // Door (back wall, far left)
        drawDoorOnBackWall(ctx, w, h, 0.06, br, colors, false);

        // Window
        drawWindowOnBackWall(ctx, w, h, 0.35, br, time, gameTime);
    }

    function drawStudy(ctx, w, h, br, warmth, time, gameTime) {
        const colors = { bg: '#1a1510', wall: '#2a2018', floor: '#1a150a', accent: '#d4a020' };
        drawShell(ctx, w, h, colors, br);

        // Large oak desk (center-left, large)
        const deskX = 0.28 * w, deskY = BW.b * h + 5;
        const deskW = 0.3 * w, deskH = h * 0.1;
        ctx.fillStyle = adj('#2a1a0a', br);
        ctx.fillRect(deskX, deskY, deskW, deskH * 0.25);
        // Desk drawers
        ctx.fillStyle = adj('#201508', br);
        ctx.fillRect(deskX + 5, deskY + deskH * 0.25, deskW * 0.35, deskH * 0.75);
        ctx.fillRect(deskX + deskW * 0.55, deskY + deskH * 0.25, deskW * 0.4, deskH * 0.75);
        // Papers on desk
        ctx.fillStyle = rgba(200, 190, 170, 0.12);
        for (let i = 0; i < 4; i++) {
            ctx.fillRect(deskX + 15 + i * 20, deskY - 3, 16, 12);
        }
        // Desk lamp
        drawLampGlow(ctx, deskX + deskW * 0.7, deskY - 20, 50, br);
        ctx.fillStyle = adj('#8b6914', br * 0.5);
        ctx.fillRect(deskX + deskW * 0.68, deskY - 12, 4, 12);

        // Painting hiding safe (back wall, right side)
        const safeX = (BW.l + 0.65 * (BW.r - BW.l)) * w;
        const safeY = (BW.t + 0.15 * (BW.b - BW.t)) * h;
        drawPainting(ctx, w, h, safeX, safeY, 55, 40, br, true);

        // Cigar box on desk
        ctx.fillStyle = adj('#4a2a10', br * 0.6);
        ctx.fillRect(deskX + deskW - 30, deskY - 4, 22, 8);

        // Bookshelf on left wall
        ctx.fillStyle = adj('#2a1a0a', br * 0.5);
        ctx.beginPath();
        ctx.moveTo(0, h * 0.08);
        ctx.lineTo(BW.l * w - 2, BW.t * h + 8);
        ctx.lineTo(BW.l * w - 2, BW.b * h - 5);
        ctx.lineTo(0, h * 0.85);
        ctx.closePath();
        ctx.fill();

        // Telephone on desk
        ctx.fillStyle = adj('#1a1a1a', br * 0.6);
        ctx.fillRect(deskX + 8, deskY - 6, 15, 8);
        // Handset
        ctx.strokeStyle = adj('#1a1a1a', br * 0.5);
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(deskX + 15, deskY - 8, 7, Math.PI, 0);
        ctx.stroke();

        // Cigar smoke wisps
        ctx.strokeStyle = rgba(180, 180, 190, 0.04);
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
            const sx = deskX + deskW - 20;
            const sy = deskY - 10 - i * 15;
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.quadraticCurveTo(sx + Math.sin(time + i) * 10, sy - 8, sx + 5, sy - 15);
            ctx.stroke();
        }

        // Door (left wall)
        drawDoorOnLeftWall(ctx, w, h, 0.5, br, colors);

        // Window
        drawWindowOnBackWall(ctx, w, h, 0.3, br, time, gameTime);
    }

    function drawDrawingRoom(ctx, w, h, br, warmth, time, gameTime) {
        const colors = { bg: '#15101a', wall: '#201828', floor: '#1a1510', accent: '#8855bb' };
        drawShell(ctx, w, h, colors, br);

        // Grand piano (right side, extending from back wall)
        const pianoX = 0.58 * w, pianoY = BW.b * h - 5;
        drawPiano(ctx, w, h, pianoX, pianoY, 0.18 * w, h * 0.1, br);

        // Velvet sofa (left-center, facing viewer)
        const sofaX = 0.2 * w, sofaY = BW.b * h + 20;
        ctx.fillStyle = adj('#2a1a2a', br);
        ctx.fillRect(sofaX, sofaY, 0.22 * w, h * 0.06);
        // Sofa back
        ctx.fillStyle = adj('#351a35', br);
        ctx.fillRect(sofaX - 3, sofaY - 8, 0.22 * w + 6, 10);
        // Armrests
        ctx.fillRect(sofaX - 5, sofaY - 8, 6, h * 0.06 + 8);
        ctx.fillRect(sofaX + 0.22 * w - 1, sofaY - 8, 6, h * 0.06 + 8);

        // Reading corner bookshelf on back wall (left)
        drawBookshelf(ctx, w, h,
            (BW.l + 0.03 * (BW.r - BW.l)) * w, (BW.t + 0.1 * (BW.b - BW.t)) * h,
            0.08 * w, (BW.b - BW.t) * 0.75 * h, br);

        // Drinks cabinet on back wall (right)
        const dcX = (BW.l + 0.8 * (BW.r - BW.l)) * w;
        const dcY = BW.b * h - 30;
        ctx.fillStyle = adj('#2a1a0a', br);
        ctx.fillRect(dcX, dcY, 0.06 * w, 30);
        // Glass bottles
        for (let i = 0; i < 3; i++) {
            ctx.fillStyle = adj(i === 0 ? '#553322' : '#224433', br * 0.4);
            ctx.fillRect(dcX + 4 + i * 10, dcY - 10, 6, 10);
        }

        // Table lamp on side table
        const ltX = 0.15 * w, ltY = BW.b * h + 5;
        drawTable(ctx, w, h, ltX, ltY, 30, 20, br);
        drawLampGlow(ctx, ltX + 15, ltY - 15, 35, br);

        // Window on back wall
        drawWindowOnBackWall(ctx, w, h, 0.5, br, time, gameTime);

        // Door (left wall)
        drawDoorOnLeftWall(ctx, w, h, 0.45, br, colors);
    }

    function drawBallroom(ctx, w, h, br, warmth, time, gameTime) {
        const colors = { bg: '#10101a', wall: '#1a1a30', floor: '#2a2020', accent: '#d4a020' };
        drawShell(ctx, w, h, colors, br);

        // Parquet floor pattern
        ctx.save();
        for (let row = 0; row < 5; row++) {
            for (let col = 0; col < 12; col++) {
                const t = (row + 1) / 6;
                const py = BW.b * h + (h - BW.b * h) * (row / 6);
                const y2 = BW.b * h + (h - BW.b * h) * t;
                const lx = BW.l * w * (1 - t);
                const rx = BW.r * w + (w - BW.r * w) * t;
                const tileW = (rx - lx) / 12;
                const tx = lx + col * tileW;
                const alt = (row + col) % 2 === 0;
                ctx.fillStyle = alt ? rgba(30, 18, 10, 0.25) : rgba(20, 12, 8, 0.15);
                ctx.fillRect(tx, py, tileW + 1, y2 - py + 1);
            }
        }
        ctx.restore();

        // Three chandeliers
        drawChandelier(ctx, w, h, 0.5, 0.035, br, time, 1.3);
        drawChandelier(ctx, w, h, 0.3, 0.06, br, time, 0.8);
        drawChandelier(ctx, w, h, 0.7, 0.06, br, time, 0.8);

        // Vaulted ceiling arches
        ctx.strokeStyle = adj('#2a2a40', br * 0.3);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0.5 * w, BW.t * h, 0.15 * w, Math.PI, 0);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0.3 * w, BW.t * h * 0.8, 0.08 * w, Math.PI, 0);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0.7 * w, BW.t * h * 0.8, 0.08 * w, Math.PI, 0);
        ctx.stroke();

        // Champagne table (left of center)
        const ctX = 0.25 * w, ctY = BW.b * h + 10;
        drawTable(ctx, w, h, ctX, ctY, 0.14 * w, h * 0.06, br);
        // Champagne bottles
        for (let i = 0; i < 3; i++) {
            ctx.fillStyle = adj('#224422', br * 0.4);
            ctx.fillRect(ctX + 10 + i * 15, ctY - 12, 6, 12);
        }
        // Glasses
        ctx.fillStyle = rgba(200, 200, 220, 0.1);
        for (let i = 0; i < 4; i++) {
            ctx.fillRect(ctX + 8 + i * 12, ctY - 5, 3, 6);
        }

        // Stage with curtains (back wall, center)
        const stgX = (BW.l + 0.25 * (BW.r - BW.l)) * w;
        const stgW = (BW.r - BW.l) * 0.5 * w;
        const stgY = BW.b * h - 8;
        // Stage platform
        ctx.fillStyle = adj('#2a1a10', br);
        ctx.fillRect(stgX, stgY, stgW, 8);
        // Curtains
        ctx.fillStyle = adj('#8b1a1a', br * 0.5);
        ctx.fillRect(stgX, (BW.t + 0.05 * (BW.b - BW.t)) * h, 15, (BW.b - BW.t) * 0.9 * h);
        ctx.fillRect(stgX + stgW - 15, (BW.t + 0.05 * (BW.b - BW.t)) * h, 15, (BW.b - BW.t) * 0.9 * h);
        // Curtain folds
        ctx.strokeStyle = adj('#6b0a0a', br * 0.3);
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
            const cx = stgX + 4 + i * 4;
            ctx.beginPath();
            ctx.moveTo(cx, (BW.t + 0.05 * (BW.b - BW.t)) * h);
            ctx.lineTo(cx, stgY);
            ctx.stroke();
        }

        // Service door (back wall, far right)
        drawDoorOnBackWall(ctx, w, h, 0.92, br, colors, false);

        // Exit door (left wall)
        drawDoorOnLeftWall(ctx, w, h, 0.4, br, colors);
    }

    function drawGarden(ctx, w, h, br, warmth, time, gameTime) {
        const colors = { bg: '#0a100a', wall: '#1a2a1a', floor: '#101a10', accent: '#44aa66' };

        // Outdoor scene — no enclosed room shell. Sky + ground.
        // Stormy sky
        const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.55);
        const tod = GameData.getTimeOfDay(gameTime);
        let skyTop, skyBot;
        switch (tod) {
            case 'early_morning': skyTop = '#050510'; skyBot = '#0a0a1a'; break;
            case 'morning': skyTop = '#101020'; skyBot = '#1a1a30'; break;
            case 'late_morning': skyTop = '#151525'; skyBot = '#252540'; break;
            case 'afternoon': skyTop = '#1a1a30'; skyBot = '#2a2a45'; break;
            case 'late_afternoon': skyTop = '#151520'; skyBot = '#201a25'; break;
            case 'evening': skyTop = '#0a0a15'; skyBot = '#151520'; break;
            default: skyTop = '#050508'; skyBot = '#0a0a12'; break;
        }
        skyGrad.addColorStop(0, skyTop);
        skyGrad.addColorStop(1, skyBot);
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, w, h * 0.55);

        // Storm clouds
        ctx.fillStyle = rgba(30, 30, 40, 0.4);
        for (let i = 0; i < 5; i++) {
            const cx = w * (0.1 + i * 0.2) + Math.sin(time * 0.3 + i) * 20;
            ctx.beginPath();
            ctx.ellipse(cx, h * (0.08 + i * 0.03), 80 + i * 20, 25 + i * 5, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // Ground
        const grndGrad = ctx.createLinearGradient(0, h * 0.5, 0, h);
        grndGrad.addColorStop(0, adj('#1a2a1a', br * 0.5));
        grndGrad.addColorStop(1, adj('#101810', br * 0.3));
        ctx.fillStyle = grndGrad;
        ctx.fillRect(0, h * 0.5, w, h * 0.5);

        // Gravel path (center, receding)
        ctx.fillStyle = adj('#2a2520', br * 0.4);
        ctx.beginPath();
        ctx.moveTo(0.4 * w, h);
        ctx.lineTo(0.6 * w, h);
        ctx.lineTo(0.52 * w, h * 0.55);
        ctx.lineTo(0.48 * w, h * 0.55);
        ctx.closePath();
        ctx.fill();

        // Hedge borders (left and right)
        ctx.fillStyle = adj('#0a1a0a', br * 0.5);
        ctx.fillRect(0, h * 0.45, w * 0.15, h * 0.25);
        ctx.fillRect(w * 0.85, h * 0.45, w * 0.15, h * 0.25);
        // Hedge texture
        ctx.fillStyle = adj('#0a150a', br * 0.4);
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.arc(w * 0.07 + i * 8, h * 0.52 + Math.sin(i) * 5, 10, 0, Math.PI * 2);
            ctx.fill();
        }

        // Trees
        drawTree(ctx, w * 0.12, h * 0.35, br, 1.2);
        drawTree(ctx, w * 0.25, h * 0.38, br, 0.9);
        drawTree(ctx, w * 0.78, h * 0.36, br, 1.1);
        drawTree(ctx, w * 0.88, h * 0.33, br, 1.3);

        // Greenhouse (center-right, in distance)
        const ghX = 0.62 * w, ghY = h * 0.38;
        const ghW = 0.12 * w, ghH = h * 0.14;
        // Glass walls
        ctx.fillStyle = rgba(100, 180, 100, 0.08 * br);
        ctx.fillRect(ghX, ghY, ghW, ghH);
        ctx.strokeStyle = adj('#44aa66', br * 0.3);
        ctx.lineWidth = 1;
        ctx.strokeRect(ghX, ghY, ghW, ghH);
        // Glass panes
        ctx.strokeStyle = rgba(100, 180, 100, 0.1);
        ctx.beginPath();
        ctx.moveTo(ghX + ghW / 2, ghY); ctx.lineTo(ghX + ghW / 2, ghY + ghH); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(ghX, ghY + ghH / 2); ctx.lineTo(ghX + ghW, ghY + ghH / 2); ctx.stroke();
        // Glow
        drawLampGlow(ctx, ghX + ghW / 2, ghY + ghH / 2, ghW, br * 0.5);

        // Gazebo (center-left)
        const gazX = 0.3 * w, gazY = h * 0.42;
        // Pillars
        ctx.fillStyle = adj('#3a3a3a', br * 0.4);
        ctx.fillRect(gazX, gazY, 4, 25);
        ctx.fillRect(gazX + 35, gazY, 4, 25);
        // Roof
        ctx.fillStyle = adj('#2a2a2a', br * 0.3);
        ctx.beginPath();
        ctx.moveTo(gazX - 5, gazY);
        ctx.lineTo(gazX + 45, gazY);
        ctx.lineTo(gazX + 20, gazY - 12);
        ctx.closePath();
        ctx.fill();
        // Bench
        ctx.fillStyle = adj('#2a2018', br * 0.3);
        ctx.fillRect(gazX + 5, gazY + 18, 30, 5);

        // Garden shed (far left background)
        const shedX = 0.15 * w, shedY = h * 0.4;
        ctx.fillStyle = adj('#1a1510', br * 0.4);
        ctx.fillRect(shedX, shedY, 25, 18);
        ctx.fillStyle = adj('#1a1008', br * 0.3);
        ctx.beginPath();
        ctx.moveTo(shedX - 2, shedY);
        ctx.lineTo(shedX + 27, shedY);
        ctx.lineTo(shedX + 12, shedY - 8);
        ctx.closePath();
        ctx.fill();

        // Door back to manor (implied path leading back)
        // Draw manor silhouette in background
        ctx.fillStyle = adj('#0a0a10', br * 0.4);
        ctx.fillRect(0.35 * w, h * 0.28, 0.3 * w, h * 0.22);
        // Tower silhouette
        ctx.fillRect(0.58 * w, h * 0.2, 0.04 * w, h * 0.08);
    }

    function drawMasterSuite(ctx, w, h, br, warmth, time, gameTime) {
        const colors = { bg: '#1a101a', wall: '#2a1a2a', floor: '#201520', accent: '#cc3333' };
        drawShell(ctx, w, h, colors, br);

        // Rich wallpaper — damask pattern hint
        ctx.fillStyle = rgba(150, 50, 50, 0.03);
        for (let i = 0; i < 12; i++) {
            for (let j = 0; j < 6; j++) {
                const px = (BW.l + i / 12 * (BW.r - BW.l)) * w;
                const py = (BW.t + j / 6 * (BW.b - BW.t)) * h;
                ctx.beginPath();
                ctx.arc(px, py, 5, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Large bed (center, prominent)
        const bedX = (BW.l + 0.2 * (BW.r - BW.l)) * w;
        const bedY = BW.b * h - 8;
        const bedW = (BW.r - BW.l) * 0.55 * w;
        const bedH = h * 0.12;
        drawBed(ctx, w, h, bedX, bedY, bedW, bedH, br, '#3a1a20');

        // Heavy curtains (back wall sides)
        ctx.fillStyle = adj('#3a1020', br * 0.5);
        ctx.fillRect(BW.l * w + 3, BW.t * h + 3, 18, (BW.b - BW.t) * h - 6);
        ctx.fillRect(BW.r * w - 21, BW.t * h + 3, 18, (BW.b - BW.t) * h - 6);
        // Curtain folds
        ctx.strokeStyle = adj('#2a0a15', br * 0.3);
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(BW.l * w + 6 + i * 5, BW.t * h + 3);
            ctx.lineTo(BW.l * w + 6 + i * 5, BW.b * h - 3);
            ctx.stroke();
        }

        // Vanity with mirror (back wall, right side)
        const vanX = (BW.l + 0.72 * (BW.r - BW.l)) * w;
        const vanY = BW.b * h - 20;
        // Vanity table
        ctx.fillStyle = adj('#2a2030', br);
        ctx.fillRect(vanX, vanY, 0.08 * w, 20);
        // Mirror
        ctx.fillStyle = rgba(100, 110, 130, 0.12);
        ctx.fillRect(vanX + 5, vanY - 35, 0.06 * w, 32);
        ctx.strokeStyle = adj('#8b6914', br * 0.4);
        ctx.lineWidth = 2;
        ctx.strokeRect(vanX + 5, vanY - 35, 0.06 * w, 32);
        // Perfume bottles
        for (let i = 0; i < 3; i++) {
            ctx.fillStyle = adj(i === 0 ? '#cc3355' : i === 1 ? '#55aacc' : '#aa88cc', br * 0.4);
            ctx.fillRect(vanX + 10 + i * 12, vanY - 8, 5, 8);
        }
        drawLampGlow(ctx, vanX + 0.04 * w, vanY - 10, 30, br);

        // Lord's diary (hidden under bed — show nightstand)
        const nsX = (BW.l + 0.1 * (BW.r - BW.l)) * w;
        ctx.fillStyle = adj('#1a1510', br);
        ctx.fillRect(nsX, bedY + 2, 25, 15);

        // Lady's letters (bedside)
        const lsX = bedX + bedW + 5;
        ctx.fillStyle = adj('#1a1510', br);
        ctx.fillRect(lsX, bedY + 2, 25, 15);

        // Window (back wall center, behind curtains)
        drawWindowOnBackWall(ctx, w, h, 0.5, br, time, gameTime);

        // Door (left wall)
        drawDoorOnLeftWall(ctx, w, h, 0.5, br, colors);
    }

    function drawWineCellar(ctx, w, h, br, warmth, time, gameTime) {
        const colors = { bg: '#0a0a0a', wall: '#1a1510', floor: '#0d0a08', accent: '#553322' };
        drawShell(ctx, w, h, colors, br);

        // Override — cellar is darker with stone texture
        // Stone texture on walls
        ctx.fillStyle = rgba(40, 35, 25, 0.08);
        for (let i = 0; i < 30; i++) {
            const sx = BW.l * w + (i % 10) * ((BW.r - BW.l) * w / 10);
            const sy = BW.t * h + Math.floor(i / 10) * ((BW.b - BW.t) * h / 3);
            ctx.fillRect(sx, sy, (BW.r - BW.l) * w / 10, (BW.b - BW.t) * h / 3);
            if ((i + Math.floor(i / 10)) % 2 === 0) {
                ctx.fillRect(sx, sy, (BW.r - BW.l) * w / 10, (BW.b - BW.t) * h / 3);
            }
        }

        // Stone arches receding (on back wall)
        for (let i = 0; i < 3; i++) {
            const ax = (BW.l + (0.15 + i * 0.28) * (BW.r - BW.l)) * w;
            const ay = (BW.t + 0.05 * (BW.b - BW.t)) * h;
            const aw = 0.1 * w;
            ctx.strokeStyle = adj('#2a2018', br * 0.7);
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(ax, ay + aw, aw, Math.PI, 0);
            ctx.stroke();
            // Arch pillars
            ctx.fillStyle = adj('#1a1510', br * 0.6);
            ctx.fillRect(ax - aw - 2, ay + aw, 4, (BW.b - BW.t) * h * 0.7);
            ctx.fillRect(ax + aw - 2, ay + aw, 4, (BW.b - BW.t) * h * 0.7);
        }

        // Wine racks
        for (let i = 0; i < 4; i++) {
            const rx = (BW.l + (0.05 + i * 0.23) * (BW.r - BW.l)) * w;
            const ry = (BW.t + 0.25 * (BW.b - BW.t)) * h;
            const rw = 0.06 * w;
            const rh = (BW.b - BW.t) * 0.6 * h;
            ctx.fillStyle = adj('#1a1510', br * 0.5);
            ctx.fillRect(rx, ry, rw, rh);
            // Bottles
            for (let j = 0; j < 5; j++) {
                ctx.fillStyle = adj(j % 2 === 0 ? '#2a0a0a' : '#0a2a0a', br * 0.3);
                ctx.beginPath();
                ctx.ellipse(rx + rw / 2, ry + 8 + j * (rh / 5), rw * 0.35, 4, 0, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Ancient stone wall (back wall, visible between arches)
        ctx.fillStyle = adj('#15120a', br * 0.4);
        ctx.fillRect((BW.l + 0.75 * (BW.r - BW.l)) * w, BW.t * h + 5, 0.1 * w, (BW.b - BW.t) * h - 10);
        // Stone blocks
        ctx.strokeStyle = rgba(40, 35, 20, 0.1);
        ctx.lineWidth = 1;
        for (let j = 0; j < 6; j++) {
            const y = BW.t * h + 5 + j * ((BW.b - BW.t) * h / 6);
            ctx.beginPath();
            ctx.moveTo((BW.l + 0.75 * (BW.r - BW.l)) * w, y);
            ctx.lineTo((BW.l + 0.85 * (BW.r - BW.l)) * w, y);
            ctx.stroke();
        }

        // Wooden crate (foreground right)
        const crX = 0.68 * w, crY = BW.b * h + 15;
        ctx.fillStyle = adj('#2a1a0a', br * 0.5);
        ctx.fillRect(crX, crY, 35, 25);
        ctx.strokeStyle = adj('#1a1008', br * 0.3);
        ctx.lineWidth = 1;
        ctx.strokeRect(crX, crY, 35, 25);
        // Slats
        ctx.beginPath();
        ctx.moveTo(crX, crY + 12);
        ctx.lineTo(crX + 35, crY + 12);
        ctx.stroke();

        // Single bulb (hanging from ceiling center)
        ctx.strokeStyle = adj('#555555', br * 0.3);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0.5 * w, 0);
        ctx.lineTo(0.5 * w, BW.t * h + 10);
        ctx.stroke();
        // Bulb
        ctx.fillStyle = rgba(255, 220, 150, 0.3 * br);
        ctx.beginPath();
        ctx.arc(0.5 * w, BW.t * h + 15, 5, 0, Math.PI * 2);
        ctx.fill();
        drawLampGlow(ctx, 0.5 * w, BW.t * h + 15, 80, br * 0.6);

        // Door to kitchen (left wall — stairs up)
        drawDoorOnLeftWall(ctx, w, h, 0.4, br, colors);
    }

    function drawTower(ctx, w, h, br, warmth, time, gameTime) {
        const colors = { bg: '#0a0a15', wall: '#15152a', floor: '#1a1520', accent: '#4488cc' };
        drawShell(ctx, w, h, colors, br);

        // Curved walls — override with arcs
        ctx.strokeStyle = adj('#15152a', br * 0.4);
        ctx.lineWidth = 2;
        // Back wall curve
        ctx.beginPath();
        ctx.arc(0.5 * w, BW.b * h, (BW.r - BW.l) * w * 0.55, Math.PI + 0.3, -0.3);
        ctx.stroke();

        // Narrow windows (arrow slits)
        for (let i = 0; i < 2; i++) {
            const wx = (BW.l + (0.2 + i * 0.55) * (BW.r - BW.l)) * w;
            const wy = (BW.t + 0.15 * (BW.b - BW.t)) * h;
            ctx.fillStyle = adj('#0a0a15', br * 0.3);
            ctx.fillRect(wx, wy, 8, 35);
            // Sky
            ctx.fillStyle = rgba(30, 30, 60, 0.3);
            ctx.fillRect(wx + 1, wy + 1, 6, 33);
        }

        // Ancient clock mechanism (center, dominant)
        const clockR = Math.min(w, h) * 0.12;
        drawAncientClock(ctx, w, h, 0.5 * w, (BW.t + 0.45 * (BW.b - BW.t)) * h, clockR, br, time);

        // Telescope (right side)
        drawTelescope(ctx, w, h, (BW.l + 0.78 * (BW.r - BW.l)) * w, (BW.t + 0.35 * (BW.b - BW.t)) * h, br);

        // Spiral staircase (left side, going down)
        const stX = BW.l * w + 5;
        const stY = BW.b * h - 5;
        // Curved steps
        for (let i = 0; i < 6; i++) {
            const a = Math.PI * 0.5 + i * 0.25;
            const r = 20 + i * 3;
            ctx.fillStyle = adj('#1a1520', br * (0.5 + i * 0.08));
            ctx.beginPath();
            ctx.arc(stX + 15, stY - 30, r, a, a + 0.3);
            ctx.lineTo(stX + 15, stY - 30);
            ctx.closePath();
            ctx.fill();
        }
        // Center pole
        ctx.fillStyle = adj('#555566', br * 0.4);
        ctx.fillRect(stX + 13, BW.t * h + 15, 4, (BW.b - BW.t) * h - 20);

        // Research journal (on a stone table near clock)
        const jnlX = (BW.l + 0.35 * (BW.r - BW.l)) * w;
        const jnlY = BW.b * h - 15;
        ctx.fillStyle = adj('#2a2a2a', br * 0.5);
        ctx.fillRect(jnlX, jnlY, 30, 15);
        ctx.fillStyle = adj('#2a1a0a', br * 0.5);
        ctx.fillRect(jnlX + 5, jnlY - 3, 18, 12);

        // Blue ambient glow from clock
        const clockGlow = ctx.createRadialGradient(0.5 * w, 0.4 * h, 0, 0.5 * w, 0.4 * h, w * 0.4);
        clockGlow.addColorStop(0, rgba(68, 136, 204, 0.06 + Math.sin(time * 2) * 0.02));
        clockGlow.addColorStop(1, rgba(68, 136, 204, 0));
        ctx.fillStyle = clockGlow;
        ctx.fillRect(0, 0, w, h);

        // Door (back wall, left — stairs down to hallway)
        drawDoorOnBackWall(ctx, w, h, 0.08, br, colors, false);
    }

    // ── Room Dispatch ──
    const roomDrawers = {
        your_room: drawYourRoom,
        grand_hallway: drawGrandHallway,
        dining_room: drawDiningRoom,
        kitchen: drawKitchen,
        library: drawLibrary,
        study: drawStudy,
        drawing_room: drawDrawingRoom,
        ballroom: drawBallroom,
        garden: drawGarden,
        master_suite: drawMasterSuite,
        wine_cellar: drawWineCellar,
        tower: drawTower,
    };

    function drawRoom(ctx, w, h, roomId, br, warmth, time, gameTime) {
        const drawer = roomDrawers[roomId];
        if (drawer) {
            drawer(ctx, w, h, br, warmth, time, gameTime);
        } else {
            // Fallback
            const loc = GameData.locations[roomId];
            if (loc) drawShell(ctx, w, h, loc.color, br);
        }
    }

    // ═══════════════════════════════════════════
    // HOTSPOT POSITION MAPS
    // ═══════════════════════════════════════════

    // Object hotspot positions per room (indexed by object order in data.js)
    const objectSlots = {
        your_room: [
            // mirror
            { rect: { x: 0.28, y: 0.13, w: 0.07, h: 0.14 } },
            // window
            { rect: { x: 0.57, y: 0.1, w: 0.12, h: 0.22 } },
            // nightstand
            { rect: { x: 0.44, y: 0.55, w: 0.08, h: 0.1 } },
        ],
        grand_hallway: [
            // grandfather clock
            { rect: { x: 0.24, y: 0.12, w: 0.06, h: 0.4 } },
            // portraits
            { rect: { x: 0.35, y: 0.09, w: 0.3, h: 0.12 } },
            // side table
            { rect: { x: 0.62, y: 0.52, w: 0.1, h: 0.1 } },
        ],
        dining_room: [
            // dining table
            { rect: { x: 0.3, y: 0.55, w: 0.4, h: 0.15 } },
            // wine cabinet
            { rect: { x: 0.62, y: 0.12, w: 0.1, h: 0.4 } },
            // sideboard
            { rect: { x: 0.24, y: 0.55, w: 0.12, h: 0.08 } },
        ],
        kitchen: [
            // bell board
            { rect: { x: 0.6, y: 0.1, w: 0.1, h: 0.18 } },
            // herb shelf
            { rect: { x: 0.38, y: 0.12, w: 0.15, h: 0.35 } },
            // pantry
            { rect: { x: 0.48, y: 0.2, w: 0.1, h: 0.35 } },
        ],
        library: [
            // reading desk
            { rect: { x: 0.42, y: 0.62, w: 0.2, h: 0.1 } },
            // fireplace
            { rect: { x: 0.44, y: 0.3, w: 0.12, h: 0.28 } },
            // east bookshelf
            { rect: { x: 0.63, y: 0.09, w: 0.13, h: 0.52 } },
            // brandy tray
            { rect: { x: 0.56, y: 0.57, w: 0.08, h: 0.06 } },
        ],
        study: [
            // desk papers
            { rect: { x: 0.28, y: 0.6, w: 0.3, h: 0.1 } },
            // wall safe (painting)
            { rect: { x: 0.55, y: 0.13, w: 0.12, h: 0.12 } },
            // cigar box
            { rect: { x: 0.48, y: 0.6, w: 0.08, h: 0.04 } },
            // telephone
            { rect: { x: 0.28, y: 0.58, w: 0.06, h: 0.06 } },
        ],
        drawing_room: [
            // piano
            { rect: { x: 0.58, y: 0.53, w: 0.2, h: 0.14 } },
            // reading corner
            { rect: { x: 0.23, y: 0.1, w: 0.1, h: 0.45 } },
            // drinks cabinet
            { rect: { x: 0.65, y: 0.48, w: 0.08, h: 0.12 } },
        ],
        ballroom: [
            // champagne table
            { rect: { x: 0.25, y: 0.62, w: 0.15, h: 0.08 } },
            // stage
            { rect: { x: 0.35, y: 0.1, w: 0.3, h: 0.5 } },
            // service door
            { rect: { x: 0.72, y: 0.2, w: 0.07, h: 0.35 } },
        ],
        garden: [
            // greenhouse
            { rect: { x: 0.62, y: 0.36, w: 0.14, h: 0.16 } },
            // gazebo
            { rect: { x: 0.28, y: 0.38, w: 0.1, h: 0.12 } },
            // garden shed
            { rect: { x: 0.14, y: 0.37, w: 0.07, h: 0.08 } },
        ],
        master_suite: [
            // vanity
            { rect: { x: 0.6, y: 0.37, w: 0.1, h: 0.2 } },
            // lord's diary
            { rect: { x: 0.26, y: 0.58, w: 0.08, h: 0.06 } },
            // lady's letters
            { rect: { x: 0.58, y: 0.58, w: 0.08, h: 0.06 } },
        ],
        wine_cellar: [
            // wine racks
            { rect: { x: 0.25, y: 0.2, w: 0.4, h: 0.38 } },
            // ancient stone wall
            { rect: { x: 0.62, y: 0.1, w: 0.12, h: 0.5 } },
            // wooden crate
            { rect: { x: 0.68, y: 0.65, w: 0.08, h: 0.07 } },
        ],
        tower: [
            // ancient clock
            { rect: { x: 0.38, y: 0.18, w: 0.24, h: 0.35 } },
            // telescope
            { rect: { x: 0.64, y: 0.2, w: 0.1, h: 0.2 } },
            // research journal
            { rect: { x: 0.38, y: 0.55, w: 0.08, h: 0.06 } },
        ],
    };

    // Exit hotspot positions per room (indexed by exit order in data.js)
    const exitSlots = {
        your_room: [
            // grand hallway (left wall door)
            { rect: { x: 0.02, y: 0.2, w: 0.1, h: 0.45 } },
        ],
        grand_hallway: [
            // your room (left back door)
            { rect: { x: 0.24, y: 0.15, w: 0.08, h: 0.38 } },
            // dining room (left wall)
            { rect: { x: 0.02, y: 0.18, w: 0.1, h: 0.45 } },
            // library (right back door)
            { rect: { x: 0.68, y: 0.15, w: 0.08, h: 0.38 } },
            // study (right wall)
            { rect: { x: 0.88, y: 0.18, w: 0.1, h: 0.45 } },
            // drawing room (left mid back)
            { rect: { x: 0.3, y: 0.15, w: 0.07, h: 0.2 } },
            // ballroom (right mid back)
            { rect: { x: 0.6, y: 0.15, w: 0.07, h: 0.2 } },
            // garden (back wall center-bottom)
            { rect: { x: 0.46, y: 0.4, w: 0.08, h: 0.15 } },
            // master suite
            { rect: { x: 0.75, y: 0.15, w: 0.06, h: 0.2 } },
            // tower
            { rect: { x: 0.24, y: 0.55, w: 0.06, h: 0.08 } },
        ],
        dining_room: [
            // grand hallway
            { rect: { x: 0.02, y: 0.2, w: 0.1, h: 0.45 } },
            // kitchen
            { rect: { x: 0.88, y: 0.2, w: 0.1, h: 0.45 } },
        ],
        kitchen: [
            // dining room
            { rect: { x: 0.02, y: 0.2, w: 0.1, h: 0.45 } },
            // wine cellar
            { rect: { x: 0.88, y: 0.2, w: 0.1, h: 0.45 } },
        ],
        library: [
            // grand hallway
            { rect: { x: 0.23, y: 0.15, w: 0.08, h: 0.38 } },
            // secret passage (to wine cellar)
            { rect: { x: 0.63, y: 0.35, w: 0.13, h: 0.25 } },
        ],
        study: [
            // grand hallway
            { rect: { x: 0.02, y: 0.2, w: 0.1, h: 0.45 } },
        ],
        drawing_room: [
            // grand hallway
            { rect: { x: 0.02, y: 0.2, w: 0.1, h: 0.45 } },
        ],
        ballroom: [
            // grand hallway
            { rect: { x: 0.02, y: 0.2, w: 0.1, h: 0.45 } },
        ],
        garden: [
            // grand hallway (back to manor)
            { rect: { x: 0.42, y: 0.28, w: 0.16, h: 0.2 } },
        ],
        master_suite: [
            // grand hallway
            { rect: { x: 0.02, y: 0.2, w: 0.1, h: 0.45 } },
        ],
        wine_cellar: [
            // kitchen
            { rect: { x: 0.02, y: 0.2, w: 0.1, h: 0.45 } },
            // secret passage (to library)
            { rect: { x: 0.62, y: 0.15, w: 0.12, h: 0.45 } },
        ],
        tower: [
            // grand hallway
            { rect: { x: 0.23, y: 0.15, w: 0.08, h: 0.38 } },
        ],
    };

    function getObjectSlots(roomId) {
        return objectSlots[roomId] || [];
    }

    function getExitSlots(roomId) {
        return exitSlots[roomId] || [];
    }

    return {
        drawRoom, drawNPCSilhouettes,
        getObjectSlots, getExitSlots,
        adj,
    };
})();
