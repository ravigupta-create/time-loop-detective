/* ═══════════════════════════════════════════════════════
   CUTSCENES — Animated title screen, intro sequence,
   murder witness, loop transitions, ending cinematics
   ═══════════════════════════════════════════════════════ */

const Cutscenes = (() => {
    let time = 0;

    // ── Title Screen State ──
    let titleLightning = 0;
    let titleWindows = [];
    let titleRain = [];
    let titleTrees = [];
    let titleClouds = [];

    function init() {
        // Initialize title screen elements
        generateTitleElements();
    }

    function generateTitleElements() {
        // Windows that flicker
        titleWindows = [];
        const windowPositions = [
            // Left tower windows
            { x: 0.28, y: 0.32, w: 0.015, h: 0.025 },
            { x: 0.28, y: 0.38, w: 0.015, h: 0.025 },
            // Main building windows (ground floor)
            { x: 0.36, y: 0.48, w: 0.02, h: 0.03 },
            { x: 0.42, y: 0.48, w: 0.02, h: 0.03 },
            { x: 0.50, y: 0.48, w: 0.02, h: 0.03 },
            { x: 0.58, y: 0.48, w: 0.02, h: 0.03 },
            { x: 0.64, y: 0.48, w: 0.02, h: 0.03 },
            // Main building windows (upper floor)
            { x: 0.38, y: 0.38, w: 0.018, h: 0.025 },
            { x: 0.46, y: 0.38, w: 0.018, h: 0.025 },
            { x: 0.54, y: 0.38, w: 0.018, h: 0.025 },
            { x: 0.62, y: 0.38, w: 0.018, h: 0.025 },
            // Right tower windows
            { x: 0.72, y: 0.30, w: 0.015, h: 0.025 },
            { x: 0.72, y: 0.36, w: 0.015, h: 0.025 },
        ];
        windowPositions.forEach(wp => {
            titleWindows.push({
                ...wp,
                brightness: Math.random(),
                flickerSpeed: 0.02 + Math.random() * 0.05,
                flickerPhase: Math.random() * Math.PI * 2,
                on: Math.random() > 0.3,
            });
        });

        // Rain drops
        titleRain = [];
        for (let i = 0; i < 200; i++) {
            titleRain.push({
                x: Math.random(),
                y: Math.random(),
                speed: 0.008 + Math.random() * 0.012,
                length: 0.02 + Math.random() * 0.04,
                opacity: 0.1 + Math.random() * 0.3,
                windOffset: 0,
            });
        }

        // Dead trees
        titleTrees = [];
        for (let i = 0; i < 6; i++) {
            const side = i < 3 ? 'left' : 'right';
            titleTrees.push({
                x: side === 'left' ? 0.05 + i * 0.08 : 0.75 + (i - 3) * 0.08,
                height: 0.15 + Math.random() * 0.15,
                branches: 3 + Math.floor(Math.random() * 3),
                sway: Math.random() * Math.PI * 2,
            });
        }

        // Storm clouds
        titleClouds = [];
        for (let i = 0; i < 8; i++) {
            titleClouds.push({
                x: Math.random() * 1.5 - 0.25,
                y: Math.random() * 0.15,
                width: 0.15 + Math.random() * 0.25,
                height: 0.03 + Math.random() * 0.05,
                speed: 0.0002 + Math.random() * 0.0004,
                opacity: 0.3 + Math.random() * 0.4,
            });
        }
    }

    // ══════════════════════════════════════════════════
    // ANIMATED TITLE SCREEN
    // ══════════════════════════════════════════════════
    function renderTitleScene(ctx, w, h) {
        time += 0.016;

        // ── Sky ──
        const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.55);
        skyGrad.addColorStop(0, '#04040a');
        skyGrad.addColorStop(0.4, '#0a0a18');
        skyGrad.addColorStop(0.7, '#10101f');
        skyGrad.addColorStop(1, '#151525');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, w, h * 0.55);

        // ── Storm Clouds ──
        titleClouds.forEach(cloud => {
            cloud.x += cloud.speed;
            if (cloud.x > 1.3) cloud.x = -0.3;

            ctx.fillStyle = `rgba(25, 25, 40, ${cloud.opacity})`;
            ctx.beginPath();
            ctx.ellipse(cloud.x * w, cloud.y * h, cloud.width * w / 2, cloud.height * h, 0, 0, Math.PI * 2);
            ctx.fill();
        });

        // ── Lightning ──
        if (Math.random() < 0.003) {
            titleLightning = 1;
        }
        if (titleLightning > 0) {
            ctx.fillStyle = `rgba(180, 190, 220, ${titleLightning * 0.12})`;
            ctx.fillRect(0, 0, w, h);

            // Lightning bolt
            if (titleLightning > 0.8) {
                drawLightningBolt(ctx, w * (0.2 + Math.random() * 0.6), 0, w, h);
            }

            titleLightning *= 0.9;
            if (titleLightning < 0.01) titleLightning = 0;
        }

        // ── Ground ──
        const groundGrad = ctx.createLinearGradient(0, h * 0.55, 0, h);
        groundGrad.addColorStop(0, '#0a0a12');
        groundGrad.addColorStop(0.3, '#080810');
        groundGrad.addColorStop(1, '#050508');
        ctx.fillStyle = groundGrad;
        ctx.fillRect(0, h * 0.55, w, h * 0.45);

        // ── Path (leading to manor) ──
        ctx.fillStyle = '#0c0c14';
        ctx.beginPath();
        ctx.moveTo(w * 0.42, h);
        ctx.lineTo(w * 0.58, h);
        ctx.lineTo(w * 0.52, h * 0.56);
        ctx.lineTo(w * 0.48, h * 0.56);
        ctx.closePath();
        ctx.fill();

        // ── Dead Trees ──
        titleTrees.forEach(tree => {
            tree.sway += 0.01;
            const sway = Math.sin(tree.sway) * 2;
            drawDeadTree(ctx, tree.x * w + sway, h * 0.55, tree.height * h, tree.branches, w);
        });

        // ── Manor Silhouette ──
        drawManorSilhouette(ctx, w, h);

        // ── Windows ──
        titleWindows.forEach(win => {
            win.flickerPhase += win.flickerSpeed;
            if (Math.random() < 0.005) win.on = !win.on;

            if (win.on) {
                const flicker = 0.5 + Math.sin(win.flickerPhase) * 0.3 + Math.random() * 0.2;
                const alpha = flicker * 0.7;

                // Window glow
                ctx.fillStyle = `rgba(255, 200, 100, ${alpha})`;
                ctx.fillRect(win.x * w, win.y * h, win.w * w, win.h * h);

                // Glow halo
                const grd = ctx.createRadialGradient(
                    (win.x + win.w / 2) * w, (win.y + win.h / 2) * h, 0,
                    (win.x + win.w / 2) * w, (win.y + win.h / 2) * h, win.w * w * 3
                );
                grd.addColorStop(0, `rgba(255, 180, 80, ${alpha * 0.15})`);
                grd.addColorStop(1, 'rgba(255, 180, 80, 0)');
                ctx.fillStyle = grd;
                ctx.fillRect(
                    (win.x - win.w * 2) * w, (win.y - win.h * 2) * h,
                    win.w * 5 * w, win.h * 5 * h
                );
            }
        });

        // ── Clock Tower Glow ──
        const clockGlow = Math.sin(time * 0.5) * 0.3 + 0.5;
        const cgrd = ctx.createRadialGradient(w * 0.72, h * 0.24, 0, w * 0.72, h * 0.24, w * 0.04);
        cgrd.addColorStop(0, `rgba(100, 200, 255, ${clockGlow * 0.15})`);
        cgrd.addColorStop(1, 'rgba(100, 200, 255, 0)');
        ctx.fillStyle = cgrd;
        ctx.fillRect(w * 0.68, h * 0.20, w * 0.08, h * 0.08);

        // ── Rain ──
        ctx.strokeStyle = 'rgba(150, 170, 200, 0.3)';
        ctx.lineWidth = 1;
        titleRain.forEach(drop => {
            drop.y += drop.speed;
            drop.windOffset = Math.sin(time * 0.5) * 0.005;
            drop.x += drop.windOffset;
            if (drop.y > 1) {
                drop.y = -drop.length;
                drop.x = Math.random();
            }
            ctx.globalAlpha = drop.opacity;
            ctx.beginPath();
            ctx.moveTo(drop.x * w, drop.y * h);
            ctx.lineTo((drop.x + drop.windOffset * 3) * w, (drop.y + drop.length) * h);
            ctx.stroke();
        });
        ctx.globalAlpha = 1;

        // ── Ground fog ──
        for (let i = 0; i < 5; i++) {
            const fogX = (Math.sin(time * 0.1 + i * 2) * 0.3 + 0.5 + i * 0.15) % 1.2 - 0.1;
            ctx.fillStyle = `rgba(30, 30, 50, ${0.15 + Math.sin(time * 0.2 + i) * 0.05})`;
            ctx.beginPath();
            ctx.ellipse(fogX * w, h * 0.58, w * 0.12, h * 0.02, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // ── Iron gate at bottom ──
        drawIronGate(ctx, w, h);
    }

    function drawManorSilhouette(ctx, w, h) {
        ctx.fillStyle = '#0a0a14';

        // Left tower
        ctx.fillRect(w * 0.25, h * 0.26, w * 0.06, h * 0.30);
        // Left tower roof (pointed)
        ctx.beginPath();
        ctx.moveTo(w * 0.28, h * 0.20);
        ctx.lineTo(w * 0.24, h * 0.28);
        ctx.lineTo(w * 0.32, h * 0.28);
        ctx.closePath();
        ctx.fill();

        // Main building
        ctx.fillRect(w * 0.31, h * 0.33, w * 0.38, h * 0.23);

        // Main roof
        ctx.beginPath();
        ctx.moveTo(w * 0.29, h * 0.33);
        ctx.lineTo(w * 0.50, h * 0.24);
        ctx.lineTo(w * 0.71, h * 0.33);
        ctx.closePath();
        ctx.fill();

        // Chimneys
        ctx.fillRect(w * 0.37, h * 0.25, w * 0.02, h * 0.08);
        ctx.fillRect(w * 0.61, h * 0.26, w * 0.02, h * 0.07);

        // Right tower (taller — clock tower)
        ctx.fillRect(w * 0.69, h * 0.22, w * 0.06, h * 0.34);
        ctx.beginPath();
        ctx.moveTo(w * 0.72, h * 0.15);
        ctx.lineTo(w * 0.68, h * 0.24);
        ctx.lineTo(w * 0.76, h * 0.24);
        ctx.closePath();
        ctx.fill();

        // Front entrance
        ctx.fillStyle = '#080810';
        ctx.beginPath();
        ctx.arc(w * 0.50, h * 0.53, w * 0.025, Math.PI, 0);
        ctx.lineTo(w * 0.525, h * 0.56);
        ctx.lineTo(w * 0.475, h * 0.56);
        ctx.closePath();
        ctx.fill();

        // Steps
        ctx.fillStyle = '#0c0c16';
        ctx.fillRect(w * 0.46, h * 0.555, w * 0.08, h * 0.01);
        ctx.fillRect(w * 0.455, h * 0.565, w * 0.09, h * 0.01);
    }

    function drawDeadTree(ctx, x, groundY, height, branches, canvasW) {
        ctx.strokeStyle = '#0a0a14';
        ctx.lineWidth = Math.max(2, canvasW * 0.003);

        // Trunk
        ctx.beginPath();
        ctx.moveTo(x, groundY);
        ctx.lineTo(x, groundY - height);
        ctx.stroke();

        // Branches
        for (let i = 0; i < branches; i++) {
            const bY = groundY - height * (0.3 + i * 0.2);
            const bLen = height * (0.15 + Math.random() * 0.15);
            const dir = i % 2 === 0 ? -1 : 1;
            ctx.lineWidth = Math.max(1, canvasW * 0.002);
            ctx.beginPath();
            ctx.moveTo(x, bY);
            ctx.lineTo(x + dir * bLen, bY - bLen * 0.5);
            ctx.stroke();

            // Sub-branches
            if (Math.random() > 0.5) {
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(x + dir * bLen * 0.6, bY - bLen * 0.3);
                ctx.lineTo(x + dir * bLen * 0.9, bY - bLen * 0.8);
                ctx.stroke();
            }
        }
    }

    function drawLightningBolt(ctx, startX, startY, canvasW, canvasH) {
        ctx.strokeStyle = 'rgba(200, 210, 255, 0.6)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        let x = startX;
        let y = startY;
        ctx.moveTo(x, y);
        const segments = 6 + Math.floor(Math.random() * 4);
        for (let i = 0; i < segments; i++) {
            x += (Math.random() - 0.5) * canvasW * 0.06;
            y += canvasH * 0.05 + Math.random() * canvasH * 0.03;
            ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Glow around bolt
        ctx.strokeStyle = 'rgba(150, 170, 255, 0.15)';
        ctx.lineWidth = 8;
        ctx.stroke();
    }

    function drawIronGate(ctx, w, h) {
        const gateY = h * 0.82;
        const gateW = w * 0.25;
        const gateX = (w - gateW) / 2;
        const gateH = h * 0.12;

        // Gate posts
        ctx.fillStyle = '#1a1a25';
        ctx.fillRect(gateX - 8, gateY - 5, 10, gateH + 10);
        ctx.fillRect(gateX + gateW - 2, gateY - 5, 10, gateH + 10);

        // Post tops (spheres)
        ctx.beginPath();
        ctx.arc(gateX - 3, gateY - 8, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(gateX + gateW + 3, gateY - 8, 6, 0, Math.PI * 2);
        ctx.fill();

        // Gate bars
        ctx.strokeStyle = '#1a1a28';
        ctx.lineWidth = 2;
        const barCount = 8;
        for (let i = 0; i <= barCount; i++) {
            const bx = gateX + (gateW / barCount) * i;
            ctx.beginPath();
            ctx.moveTo(bx, gateY);
            ctx.lineTo(bx, gateY + gateH);
            ctx.stroke();

            // Arrow tips
            ctx.fillStyle = '#1a1a28';
            ctx.beginPath();
            ctx.moveTo(bx, gateY - 3);
            ctx.lineTo(bx - 2, gateY + 3);
            ctx.lineTo(bx + 2, gateY + 3);
            ctx.closePath();
            ctx.fill();
        }

        // Cross bars
        ctx.beginPath();
        ctx.moveTo(gateX, gateY + gateH * 0.3);
        ctx.lineTo(gateX + gateW, gateY + gateH * 0.3);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(gateX, gateY + gateH * 0.7);
        ctx.lineTo(gateX + gateW, gateY + gateH * 0.7);
        ctx.stroke();
    }

    // ══════════════════════════════════════════════════
    // INTRO CUTSCENE (Animated carriage approach)
    // ══════════════════════════════════════════════════
    let introPhase = 0;
    let introTime = 0;

    function renderIntroCutscene(ctx, w, h) {
        introTime += 0.016;

        // Same stormy background as title
        renderTitleScene(ctx, w, h);

        // Letterbox bars
        const barH = h * 0.12;
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, w, barH);
        ctx.fillRect(0, h - barH, w, barH);

        // Carriage silhouette approaching (bottom third)
        if (introPhase === 0 && introTime < 5) {
            const progress = introTime / 5;
            const carriageX = w * (-0.2 + progress * 0.7);
            const carriageY = h * 0.72;

            drawCarriage(ctx, carriageX, carriageY, w * 0.08, progress);

            // Lantern glow
            const lanternGlow = ctx.createRadialGradient(
                carriageX + w * 0.06, carriageY - h * 0.02, 0,
                carriageX + w * 0.06, carriageY - h * 0.02, w * 0.05
            );
            lanternGlow.addColorStop(0, 'rgba(255, 200, 100, 0.15)');
            lanternGlow.addColorStop(1, 'rgba(255, 200, 100, 0)');
            ctx.fillStyle = lanternGlow;
            ctx.fillRect(carriageX, carriageY - h * 0.05, w * 0.12, h * 0.08);
        }
    }

    function drawCarriage(ctx, x, y, size, bouncePhase) {
        const bounce = Math.sin(bouncePhase * 20) * 2;

        ctx.fillStyle = '#0a0a14';
        // Body
        ctx.fillRect(x, y - size * 0.6 + bounce, size * 1.2, size * 0.5);
        // Roof
        ctx.beginPath();
        ctx.arc(x + size * 0.6, y - size * 0.6 + bounce, size * 0.65, Math.PI, 0);
        ctx.fill();
        // Wheels
        ctx.strokeStyle = '#1a1a28';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x + size * 0.25, y + bounce, size * 0.15, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x + size * 0.95, y + bounce, size * 0.15, 0, Math.PI * 2);
        ctx.stroke();
        // Horse (simple silhouette)
        ctx.fillStyle = '#080810';
        ctx.beginPath();
        ctx.moveTo(x + size * 1.3, y - size * 0.2 + bounce);
        ctx.lineTo(x + size * 1.7, y - size * 0.5 + bounce);
        ctx.lineTo(x + size * 1.8, y - size * 0.55 + bounce);
        ctx.lineTo(x + size * 1.7, y - size * 0.3 + bounce);
        ctx.lineTo(x + size * 1.8, y + bounce);
        ctx.lineTo(x + size * 1.6, y + bounce);
        ctx.lineTo(x + size * 1.5, y - size * 0.15 + bounce);
        ctx.lineTo(x + size * 1.3, y + bounce);
        ctx.lineTo(x + size * 1.2, y + bounce);
        ctx.closePath();
        ctx.fill();
    }

    // ══════════════════════════════════════════════════
    // MURDER WITNESS SCENE
    // ══════════════════════════════════════════════════
    function renderMurderScene(ctx, w, h, progress) {
        // If player is in the library at 11:10 PM
        // Dramatic scene: shadows, struggle, silhouette falls

        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(0, 0, w, h);

        // Dark library silhouette
        ctx.fillStyle = '#0a0a14';
        ctx.fillRect(w * 0.1, h * 0.1, w * 0.8, h * 0.8);

        // Fireplace glow (dim)
        const fireGlow = ctx.createRadialGradient(w * 0.5, h * 0.4, 0, w * 0.5, h * 0.4, w * 0.15);
        fireGlow.addColorStop(0, 'rgba(200, 80, 20, 0.08)');
        fireGlow.addColorStop(1, 'rgba(200, 80, 20, 0)');
        ctx.fillStyle = fireGlow;
        ctx.fillRect(0, 0, w, h);

        // Two shadow figures
        const phase = Math.min(1, progress * 2);

        // Victim (falls slowly)
        ctx.fillStyle = '#050508';
        const fallAngle = phase * 0.5;
        ctx.save();
        ctx.translate(w * 0.55, h * 0.5);
        ctx.rotate(fallAngle);
        ctx.fillRect(-15, -60, 30, 80);
        ctx.beginPath();
        ctx.arc(0, -70, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Attacker shadow (retreating)
        if (phase < 0.8) {
            ctx.fillStyle = '#030306';
            const retreatX = w * (0.45 - phase * 0.15);
            ctx.fillRect(retreatX - 15, h * 0.35, 30, 80);
            ctx.beginPath();
            ctx.arc(retreatX, h * 0.28, 15, 0, Math.PI * 2);
            ctx.fill();
        }

        // Red flash at moment of murder
        if (progress < 0.1) {
            ctx.fillStyle = `rgba(150, 0, 0, ${(1 - progress * 10) * 0.2})`;
            ctx.fillRect(0, 0, w, h);
        }
    }

    // ══════════════════════════════════════════════════
    // ENDING CINEMATICS
    // ══════════════════════════════════════════════════
    function renderEndingScene(ctx, w, h, endingKey, progress) {
        ctx.fillStyle = '#050508';
        ctx.fillRect(0, 0, w, h);

        // Letterbox
        const barH = h * 0.1;
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, w, barH);
        ctx.fillRect(0, h - barH, w, barH);

        if (endingKey === 'true_justice') {
            renderTrueJusticeEnding(ctx, w, h, progress);
        } else if (endingKey === 'prevention') {
            renderPreventionEnding(ctx, w, h, progress);
        } else if (endingKey === 'clock_secret') {
            renderClockSecretEnding(ctx, w, h, progress);
        } else {
            renderDefaultEnding(ctx, w, h, progress);
        }
    }

    function renderTrueJusticeEnding(ctx, w, h, progress) {
        // Dawn breaking over manor
        const dawnProgress = Math.min(1, progress * 2);

        // Sky gradient shifts from dark to dawn
        const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.5);
        skyGrad.addColorStop(0, `rgba(${10 + dawnProgress * 40}, ${10 + dawnProgress * 20}, ${30 + dawnProgress * 30}, 1)`);
        skyGrad.addColorStop(1, `rgba(${20 + dawnProgress * 80}, ${15 + dawnProgress * 40}, ${30 + dawnProgress * 20}, 1)`);
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, h * 0.1, w, h * 0.4);

        // Horizon glow
        if (dawnProgress > 0.3) {
            const horizonGlow = ctx.createRadialGradient(
                w * 0.5, h * 0.5, 0,
                w * 0.5, h * 0.5, w * 0.4
            );
            horizonGlow.addColorStop(0, `rgba(255, 180, 100, ${(dawnProgress - 0.3) * 0.15})`);
            horizonGlow.addColorStop(1, 'rgba(255, 180, 100, 0)');
            ctx.fillStyle = horizonGlow;
            ctx.fillRect(0, h * 0.3, w, h * 0.3);
        }

        // Manor silhouette (small, in distance)
        ctx.fillStyle = '#0a0a14';
        ctx.fillRect(w * 0.35, h * 0.42, w * 0.30, h * 0.12);
        // Roof
        ctx.beginPath();
        ctx.moveTo(w * 0.33, h * 0.42);
        ctx.lineTo(w * 0.50, h * 0.36);
        ctx.lineTo(w * 0.67, h * 0.42);
        ctx.closePath();
        ctx.fill();

        // Ground
        ctx.fillStyle = '#080810';
        ctx.fillRect(0, h * 0.54, w, h * 0.36);

        // Police carriage (if progress > 0.5)
        if (progress > 0.3) {
            const carriageProgress = Math.min(1, (progress - 0.3) * 2);
            const cx = w * (0.1 + carriageProgress * 0.2);
            drawCarriage(ctx, cx, h * 0.58, w * 0.05, carriageProgress);

            // Blue police lantern
            ctx.fillStyle = `rgba(50, 100, 255, ${0.2 + Math.sin(progress * 15) * 0.1})`;
            ctx.beginPath();
            ctx.arc(cx + w * 0.04, h * 0.54, 5, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function renderPreventionEnding(ctx, w, h, progress) {
        // Clock frozen, golden light
        const centerX = w * 0.5;
        const centerY = h * 0.4;

        // Golden radial glow
        const glow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, w * 0.3);
        glow.addColorStop(0, `rgba(212, 160, 32, ${Math.min(0.15, progress * 0.2)})`);
        glow.addColorStop(0.5, `rgba(180, 120, 20, ${Math.min(0.08, progress * 0.1)})`);
        glow.addColorStop(1, 'rgba(100, 60, 10, 0)');
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, w, h);

        // Clock face
        const clockR = Math.min(w, h) * 0.15;
        ctx.strokeStyle = '#d4a020';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(centerX, centerY, clockR, 0, Math.PI * 2);
        ctx.stroke();

        // Clock numbers
        ctx.font = `${clockR * 0.2}px monospace`;
        ctx.fillStyle = '#d4a020';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        for (let i = 1; i <= 12; i++) {
            const angle = (i * 30 - 90) * Math.PI / 180;
            const nx = centerX + Math.cos(angle) * clockR * 0.8;
            const ny = centerY + Math.sin(angle) * clockR * 0.8;
            ctx.fillText(String(i), nx, ny);
        }

        // Clock hands frozen at 11:10
        // Hour hand (pointing at ~11)
        const hourAngle = (330 + 5 - 90) * Math.PI / 180;
        ctx.strokeStyle = '#d4a020';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX + Math.cos(hourAngle) * clockR * 0.5, centerY + Math.sin(hourAngle) * clockR * 0.5);
        ctx.stroke();

        // Minute hand (pointing at 2 = 10 min)
        const minAngle = (60 - 90) * Math.PI / 180;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX + Math.cos(minAngle) * clockR * 0.7, centerY + Math.sin(minAngle) * clockR * 0.7);
        ctx.stroke();

        // Crack appearing in clock face
        if (progress > 0.5) {
            const crackAlpha = (progress - 0.5) * 2;
            ctx.strokeStyle = `rgba(255, 255, 255, ${crackAlpha * 0.3})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(centerX - clockR * 0.2, centerY - clockR * 0.1);
            ctx.lineTo(centerX, centerY);
            ctx.lineTo(centerX + clockR * 0.3, centerY + clockR * 0.2);
            ctx.stroke();
        }
    }

    function renderClockSecretEnding(ctx, w, h, progress) {
        // Cosmic/supernatural — clock mechanism exposed, reality fracturing
        const centerX = w * 0.5;
        const centerY = h * 0.45;

        // Deep purple void
        const voidGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, w * 0.5);
        voidGrad.addColorStop(0, '#1a0030');
        voidGrad.addColorStop(0.5, '#0a0018');
        voidGrad.addColorStop(1, '#050008');
        ctx.fillStyle = voidGrad;
        ctx.fillRect(0, h * 0.1, w, h * 0.8);

        // Rotating gear rings
        for (let ring = 0; ring < 3; ring++) {
            const ringR = (0.1 + ring * 0.08) * Math.min(w, h);
            const segments = 12 + ring * 4;
            const rotSpeed = (ring % 2 === 0 ? 1 : -1) * 0.3;

            ctx.strokeStyle = `rgba(100, 200, 255, ${0.1 + ring * 0.05})`;
            ctx.lineWidth = 1;

            for (let i = 0; i < segments; i++) {
                const angle = (i * (360 / segments) + progress * rotSpeed * 360) * Math.PI / 180;
                const x1 = centerX + Math.cos(angle) * ringR;
                const y1 = centerY + Math.sin(angle) * ringR;
                const x2 = centerX + Math.cos(angle) * (ringR + 8);
                const y2 = centerY + Math.sin(angle) * (ringR + 8);
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
            }

            ctx.beginPath();
            ctx.arc(centerX, centerY, ringR, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Central bright point
        const coreGlow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 20);
        coreGlow.addColorStop(0, `rgba(200, 230, 255, ${0.3 + Math.sin(progress * 10) * 0.1})`);
        coreGlow.addColorStop(1, 'rgba(200, 230, 255, 0)');
        ctx.fillStyle = coreGlow;
        ctx.fillRect(centerX - 30, centerY - 30, 60, 60);
    }

    function renderDefaultEnding(ctx, w, h, progress) {
        // Moody, bittersweet — rain on window
        renderTitleScene(ctx, w, h);

        // Heavier darkness overlay
        ctx.fillStyle = `rgba(0, 0, 0, ${0.3 + progress * 0.2})`;
        ctx.fillRect(0, 0, w, h);
    }

    // ══════════════════════════════════════════════════
    // PUBLIC
    // ══════════════════════════════════════════════════
    return {
        init,
        renderTitleScene,
        renderIntroCutscene,
        renderMurderScene,
        renderEndingScene,
    };
})();
