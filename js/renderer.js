/* ═══════════════════════════════════════════════════════
   RENDERER — Canvas rendering, procedural art, effects
   Noir aesthetic with atmospheric lighting
   ═══════════════════════════════════════════════════════ */

const Renderer = (() => {
    let canvas, ctx;
    let width = 960, height = 540;
    let particles = [];
    let raindrops = [];
    let time = 0;
    let animFrame = null;
    let lightningFlash = 0;
    let lightningTimer = 0;
    let fogParticles = [];

    function init() {
        canvas = document.getElementById('game-canvas');
        ctx = canvas.getContext('2d');
        resize();
        window.addEventListener('resize', resize);
        generateRain();
        initFogParticles();
    }

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        width = canvas.width;
        height = canvas.height;
    }

    function generateRain() {
        raindrops = [];
        for (let i = 0; i < 120; i++) {
            raindrops.push({
                x: Math.random() * width,
                y: Math.random() * height,
                speed: 3 + Math.random() * 5,
                length: 10 + Math.random() * 20,
                opacity: 0.1 + Math.random() * 0.2,
            });
        }
    }

    // ── Main Render Loop ──
    function startLoop() {
        const loop = () => {
            time += 0.016;
            render();
            animFrame = requestAnimationFrame(loop);
        };
        loop();
    }

    function stopLoop() {
        if (animFrame) cancelAnimationFrame(animFrame);
    }

    function render() {
        const screen = Engine.state.screen;
        if (screen === 'title' || screen === 'intro') {
            Cutscenes.renderTitleScene(ctx, width, height);
        } else if (screen === 'ending') {
            Cutscenes.renderEndingScene(ctx, width, height, Engine.state.endingKey || 'default', time);
        } else if (screen === 'minigame') {
            renderRoom();
            MiniGames.updateAndRender(ctx, width, height, 0.016);
        } else if (screen === 'playing' || screen === 'dialogue' ||
                   screen === 'notebook' || screen === 'accusation' ||
                   screen === 'fast_forward' || screen === 'eavesdrop') {
            renderRoom();
        }
    }

    // ── Background (title, intro) ──
    function renderBackground() {
        // Dark gradient with rain
        const grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, '#07070f');
        grad.addColorStop(0.5, '#0d0d1a');
        grad.addColorStop(1, '#1a1020');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        // Rain
        renderRain(0.5);

        // Lightning
        updateLightning();
    }

    // ── Room Transition State ──
    let transitionAlpha = 0;
    let transitionState = 'none'; // 'none' | 'out' | 'in'
    let transitionCallback = null;

    function startRoomTransition(callback) {
        transitionState = 'out';
        transitionAlpha = 0;
        transitionCallback = callback;
    }

    function updateTransition() {
        if (transitionState === 'out') {
            transitionAlpha += 0.06;
            if (transitionAlpha >= 1) {
                transitionAlpha = 1;
                transitionState = 'in';
                if (transitionCallback) {
                    transitionCallback();
                    transitionCallback = null;
                }
            }
        } else if (transitionState === 'in') {
            transitionAlpha -= 0.05;
            if (transitionAlpha <= 0) {
                transitionAlpha = 0;
                transitionState = 'none';
            }
        }
    }

    function isTransitioning() {
        return transitionState !== 'none';
    }

    // ── Room Rendering (First-Person Perspective) ──
    function renderRoom() {
        const loc = GameData.locations[Engine.state.currentLocation];
        if (!loc) return;
        const gameTime = Engine.state.time;

        // Time-based lighting
        const brightness = getTimeBrightness(gameTime);
        const warmth = getTimeWarmth(gameTime);

        // Draw first-person perspective room via RoomViews
        RoomViews.drawRoom(ctx, width, height, Engine.state.currentLocation, brightness, warmth, time, gameTime);

        // NPC silhouettes within the room (returns hotspots for click detection)
        Hotspots.removeDynamicHotspots('npc');
        const npcHotspots = RoomViews.drawNPCSilhouettes(ctx, width, height, brightness, time);
        if (npcHotspots.length > 0) {
            Hotspots.addDynamicHotspots(npcHotspots);
        }

        // Ambient lighting overlay
        renderLighting(loc, brightness, warmth, gameTime);

        // Particles (dust, embers)
        updateAndRenderParticles();

        // Fog for garden, cellar, tower
        if (loc.ambience === 'garden' || loc.ambience === 'cellar' || loc.ambience === 'tower') {
            renderFog();
        }

        // Rain if outdoor
        if (loc.ambience === 'garden') {
            renderRain(0.4);
        }

        // Lightning flashes
        updateLightning();

        // Hotspot highlights and tooltips
        Hotspots.render(ctx, width, height, time);

        // Effects overlay (tension, dust, moonbeams, candle glow)
        Effects.renderAll(ctx, width, height, gameTime, Engine.state.currentLocation, brightness, time);

        // Inventory bar at bottom
        Inventory.renderInventoryBar(ctx, width, height);

        // Speedrun timer overlay
        if (Engine.getGameMode() === 'speedrun') {
            renderSpeedrunTimer();
        }

        // Hard mode indicator
        if (Engine.getGameMode() === 'hard') {
            renderModeIndicator('HARD MODE', '#cc3333');
        } else if (Engine.getGameMode() === 'newgameplus') {
            renderModeIndicator('NEW GAME+', '#8855bb');
        }

        // Minimap in corner
        renderMinimapOverlay();

        // Post-murder visual effects
        if (Engine.isPostMurder()) {
            renderPostMurderOverlay(gameTime);
        }

        // Atmospheric warning text near midnight
        renderAtmosphericText(gameTime);

        // Vignette
        renderVignette();

        // Scanlines
        renderScanlines();

        // Room transition fade
        updateTransition();
        if (transitionAlpha > 0) {
            ctx.fillStyle = `rgba(0, 0, 0, ${transitionAlpha})`;
            ctx.fillRect(0, 0, width, height);
        }
    }

    // (Old flat room drawing code removed — now handled by RoomViews module)

    // ── Lighting ──
    function renderLighting(loc, brightness, warmth, gameTime) {
        // Time-based overlay
        const tod = GameData.getTimeOfDay(gameTime);
        let overlayColor, overlayOpacity;

        switch (tod) {
            case 'early_morning':
                overlayColor = '30, 30, 60'; overlayOpacity = 0.3; break;
            case 'morning':
                overlayColor = '60, 50, 30'; overlayOpacity = 0.1; break;
            case 'late_morning':
                overlayColor = '40, 40, 30'; overlayOpacity = 0.05; break;
            case 'afternoon':
                overlayColor = '30, 30, 20'; overlayOpacity = 0.05; break;
            case 'late_afternoon':
                overlayColor = '60, 40, 20'; overlayOpacity = 0.15; break;
            case 'evening':
                overlayColor = '40, 20, 10'; overlayOpacity = 0.2; break;
            case 'night':
                overlayColor = '10, 10, 30'; overlayOpacity = 0.3; break;
            case 'late_night':
                overlayColor = '10, 5, 20'; overlayOpacity = 0.4; break;
        }

        ctx.fillStyle = `rgba(${overlayColor}, ${overlayOpacity})`;
        ctx.fillRect(0, 0, width, height);

        // Warm light sources
        if (loc.hasFireplace || loc.ambience === 'fire') {
            const grad = ctx.createRadialGradient(
                width * 0.5, height * 0.45, 0,
                width * 0.5, height * 0.45, width * 0.4
            );
            grad.addColorStop(0, 'rgba(255, 180, 80, 0.08)');
            grad.addColorStop(1, 'rgba(255, 180, 80, 0)');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, width, height);
        }
    }

    // (Old renderWindow and renderFireplace removed — now in RoomViews)

    // ── Rain ──
    function renderRain(opacity) {
        ctx.strokeStyle = `rgba(150, 170, 200, ${opacity})`;
        ctx.lineWidth = 1;
        raindrops.forEach(drop => {
            drop.y += drop.speed;
            if (drop.y > height) {
                drop.y = -drop.length;
                drop.x = Math.random() * width;
            }
            ctx.globalAlpha = drop.opacity;
            ctx.beginPath();
            ctx.moveTo(drop.x, drop.y);
            ctx.lineTo(drop.x - 1, drop.y + drop.length);
            ctx.stroke();
        });
        ctx.globalAlpha = 1;
    }

    // ── Particles ──
    function addParticle(x, y, type) {
        particles.push({
            x, y, type,
            vx: (Math.random() - 0.5) * 0.5,
            vy: -0.5 - Math.random() * 0.5,
            life: 1,
            decay: 0.005 + Math.random() * 0.01,
        });
    }

    function updateAndRenderParticles() {
        particles = particles.filter(p => p.life > 0);
        particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.life -= p.decay;

            if (p.type === 'dust') {
                ctx.fillStyle = `rgba(200, 180, 150, ${p.life * 0.3})`;
                ctx.fillRect(p.x, p.y, 2, 2);
            } else if (p.type === 'ember') {
                ctx.fillStyle = `rgba(255, 150, 50, ${p.life * 0.5})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
                ctx.fill();
            }
        });

        // Spawn dust
        if (Math.random() < 0.05) {
            addParticle(Math.random() * width, height * 0.3 + Math.random() * height * 0.3, 'dust');
        }
        // Spawn embers near fireplace
        const loc = GameData.locations[Engine.state.currentLocation];
        if (loc && (loc.ambience === 'fire' || loc.hasFireplace) && Math.random() < 0.1) {
            addParticle(width * 0.45 + Math.random() * 60, height * 0.35, 'ember');
        }
    }

    // ── Vignette ──
    function renderVignette() {
        const grad = ctx.createRadialGradient(
            width / 2, height / 2, width * 0.25,
            width / 2, height / 2, width * 0.7
        );
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(1, 'rgba(0,0,0,0.5)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
    }

    // ── NPC Portrait (Enhanced with expressions) ──
    function drawPortraitOnCanvas(npcId, targetCanvas, emotion) {
        const c = targetCanvas.getContext('2d');
        const w = targetCanvas.width;
        const h = targetCanvas.height;
        const npc = GameData.npcs[npcId];
        if (!npc) return;

        const emo = emotion || 'neutral';

        // Background gradient
        const bgGrad = c.createLinearGradient(0, 0, 0, h);
        bgGrad.addColorStop(0, '#0d0d1a');
        bgGrad.addColorStop(1, '#151525');
        c.fillStyle = bgGrad;
        c.fillRect(0, 0, w, h);

        // Subtle ambient light from side
        const ambGrad = c.createRadialGradient(w * 0.2, h * 0.3, 0, w * 0.2, h * 0.3, w * 0.6);
        ambGrad.addColorStop(0, 'rgba(255, 200, 120, 0.04)');
        ambGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        c.fillStyle = ambGrad;
        c.fillRect(0, 0, w, h);

        // Neck shadow
        c.fillStyle = 'rgba(0, 0, 0, 0.15)';
        c.beginPath();
        c.ellipse(w / 2, h * 0.6, w * 0.12, h * 0.08, 0, 0, Math.PI * 2);
        c.fill();

        // Face shape (more refined ellipse)
        const skinTone = npc.skinTone || '#c4a882';
        const faceShadow = c.createRadialGradient(w * 0.45, h * 0.35, 0, w / 2, h * 0.4, w * 0.28);
        faceShadow.addColorStop(0, skinTone);
        faceShadow.addColorStop(0.8, skinTone);
        faceShadow.addColorStop(1, adjustColor(skinTone, 0.7));
        c.fillStyle = faceShadow;
        c.beginPath();
        c.ellipse(w / 2, h * 0.4, w * 0.24, h * 0.28, 0, 0, Math.PI * 2);
        c.fill();

        // Jawline shadow
        c.fillStyle = 'rgba(0, 0, 0, 0.06)';
        c.beginPath();
        c.ellipse(w / 2, h * 0.52, w * 0.2, h * 0.1, 0, 0, Math.PI);
        c.fill();

        // Hair (varies by NPC)
        c.fillStyle = npc.color;
        if (npc.gender === 'female' || npcId === 'lady_evelyn' || npcId === 'lily' ||
            npcId === 'isabelle' || npcId === 'mrs_blackwood') {
            // Longer hair
            c.beginPath();
            c.ellipse(w / 2, h * 0.22, w * 0.3, h * 0.18, 0, 0, Math.PI);
            c.fill();
            // Side hair
            c.fillRect(w * 0.2, h * 0.22, w * 0.08, h * 0.35);
            c.fillRect(w * 0.72, h * 0.22, w * 0.08, h * 0.35);
        } else {
            // Shorter hair
            c.beginPath();
            c.ellipse(w / 2, h * 0.24, w * 0.27, h * 0.17, 0, 0, Math.PI);
            c.fill();
        }

        // Eyes (expression-dependent)
        const eyeY = h * 0.37;
        const eyeW = w * 0.07;
        const eyeH = h * 0.035;

        // Eye whites
        c.fillStyle = '#e8e0d8';
        c.beginPath();
        c.ellipse(w * 0.38, eyeY, eyeW, eyeH, 0, 0, Math.PI * 2);
        c.fill();
        c.beginPath();
        c.ellipse(w * 0.62, eyeY, eyeW, eyeH, 0, 0, Math.PI * 2);
        c.fill();

        // Pupils (move based on emotion)
        let pupilOffX = 0, pupilOffY = 0;
        if (emo === 'nervous') { pupilOffX = -1; pupilOffY = 1; }
        else if (emo === 'lying') { pupilOffX = 2; pupilOffY = -1; }
        else if (emo === 'angry') { pupilOffY = -1; }
        else if (emo === 'sad') { pupilOffY = 1; }

        c.fillStyle = '#1a1a2a';
        c.beginPath();
        c.arc(w * 0.38 + pupilOffX, eyeY + pupilOffY, w * 0.025, 0, Math.PI * 2);
        c.fill();
        c.beginPath();
        c.arc(w * 0.62 + pupilOffX, eyeY + pupilOffY, w * 0.025, 0, Math.PI * 2);
        c.fill();

        // Eye shine
        c.fillStyle = 'rgba(255, 255, 255, 0.4)';
        c.beginPath();
        c.arc(w * 0.37, eyeY - 1, 1.5, 0, Math.PI * 2);
        c.fill();
        c.beginPath();
        c.arc(w * 0.61, eyeY - 1, 1.5, 0, Math.PI * 2);
        c.fill();

        // Eyebrows (expression-dependent)
        c.strokeStyle = adjustColor(npc.color, 0.6);
        c.lineWidth = 2;
        if (emo === 'angry') {
            // Furrowed
            c.beginPath();
            c.moveTo(w * 0.30, eyeY - h * 0.05);
            c.lineTo(w * 0.44, eyeY - h * 0.07);
            c.stroke();
            c.beginPath();
            c.moveTo(w * 0.70, eyeY - h * 0.05);
            c.lineTo(w * 0.56, eyeY - h * 0.07);
            c.stroke();
        } else if (emo === 'nervous' || emo === 'scared') {
            // Raised
            c.beginPath();
            c.moveTo(w * 0.30, eyeY - h * 0.08);
            c.quadraticCurveTo(w * 0.38, eyeY - h * 0.1, w * 0.44, eyeY - h * 0.07);
            c.stroke();
            c.beginPath();
            c.moveTo(w * 0.70, eyeY - h * 0.08);
            c.quadraticCurveTo(w * 0.62, eyeY - h * 0.1, w * 0.56, eyeY - h * 0.07);
            c.stroke();
        } else if (emo === 'sad') {
            // Drooped
            c.beginPath();
            c.moveTo(w * 0.30, eyeY - h * 0.06);
            c.lineTo(w * 0.44, eyeY - h * 0.08);
            c.stroke();
            c.beginPath();
            c.moveTo(w * 0.70, eyeY - h * 0.06);
            c.lineTo(w * 0.56, eyeY - h * 0.08);
            c.stroke();
        } else {
            // Neutral
            c.beginPath();
            c.moveTo(w * 0.30, eyeY - h * 0.06);
            c.lineTo(w * 0.44, eyeY - h * 0.06);
            c.stroke();
            c.beginPath();
            c.moveTo(w * 0.70, eyeY - h * 0.06);
            c.lineTo(w * 0.56, eyeY - h * 0.06);
            c.stroke();
        }

        // Nose (simple)
        c.strokeStyle = adjustColor(skinTone, 0.8);
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(w * 0.48, h * 0.40);
        c.lineTo(w * 0.46, h * 0.47);
        c.lineTo(w * 0.50, h * 0.48);
        c.stroke();

        // Mouth (expression-dependent)
        c.strokeStyle = '#8a6a52';
        c.lineWidth = 1.5;
        if (emo === 'angry') {
            c.beginPath();
            c.moveTo(w * 0.40, h * 0.53);
            c.lineTo(w * 0.60, h * 0.53);
            c.stroke();
        } else if (emo === 'nervous' || emo === 'lying') {
            c.beginPath();
            c.moveTo(w * 0.42, h * 0.535);
            c.quadraticCurveTo(w * 0.50, h * 0.52, w * 0.58, h * 0.535);
            c.stroke();
        } else if (emo === 'sad') {
            c.beginPath();
            c.arc(w / 2, h * 0.56, w * 0.07, Math.PI + 0.3, -0.3);
            c.stroke();
        } else if (emo === 'happy') {
            c.beginPath();
            c.arc(w / 2, h * 0.50, w * 0.07, 0.3, Math.PI - 0.3);
            c.stroke();
        } else {
            c.beginPath();
            c.arc(w / 2, h * 0.52, w * 0.06, 0.1, Math.PI - 0.1);
            c.stroke();
        }

        // Clothing (richer detail)
        const clothGrad = c.createLinearGradient(w * 0.2, h * 0.65, w * 0.8, h);
        clothGrad.addColorStop(0, npc.color);
        clothGrad.addColorStop(1, adjustColor(npc.color, 0.7));
        c.fillStyle = clothGrad;
        c.beginPath();
        c.moveTo(w * 0.15, h);
        c.lineTo(w * 0.25, h * 0.65);
        c.quadraticCurveTo(w * 0.5, h * 0.60, w * 0.75, h * 0.65);
        c.lineTo(w * 0.85, h);
        c.closePath();
        c.fill();

        // Collar/lapel detail
        c.strokeStyle = adjustColor(npc.color, 1.3);
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(w * 0.40, h * 0.63);
        c.lineTo(w * 0.48, h * 0.72);
        c.lineTo(w * 0.52, h * 0.72);
        c.lineTo(w * 0.60, h * 0.63);
        c.stroke();

        // Lie detection: subtle sweat drops when lying
        if (emo === 'lying' || emo === 'nervous') {
            c.fillStyle = 'rgba(180, 200, 220, 0.4)';
            c.beginPath();
            c.ellipse(w * 0.72, h * 0.32, 1.5, 2.5, 0.3, 0, Math.PI * 2);
            c.fill();
        }

        // Gold ornate border
        c.strokeStyle = '#d4a020';
        c.lineWidth = 2;
        c.strokeRect(1, 1, w - 2, h - 2);

        // Inner border
        c.strokeStyle = 'rgba(212, 160, 32, 0.3)';
        c.lineWidth = 1;
        c.strokeRect(3, 3, w - 6, h - 6);

        // Corner accents
        const cornerSize = 6;
        c.fillStyle = '#d4a020';
        [[1, 1], [w - cornerSize - 1, 1], [1, h - cornerSize - 1], [w - cornerSize - 1, h - cornerSize - 1]].forEach(([cx, cy]) => {
            c.fillRect(cx, cy, cornerSize, 1);
            c.fillRect(cx, cy, 1, cornerSize);
        });
    }

    // ── Utility ──
    function getTimeBrightness(gameTime) {
        if (gameTime < 420) return 0.4;      // 6 AM
        if (gameTime < 540) return 0.6;      // 7-9 AM
        if (gameTime < 720) return 0.8;      // 9-12
        if (gameTime < 1020) return 0.9;     // 12-5 PM
        if (gameTime < 1140) return 0.7;     // 5-7 PM
        if (gameTime < 1320) return 0.5;     // 7-10 PM
        return 0.3;                           // 10 PM+
    }

    function getTimeWarmth(gameTime) {
        if (gameTime < 480) return 0.3;
        if (gameTime < 720) return 0.5;
        if (gameTime < 1020) return 0.6;
        if (gameTime < 1200) return 0.8;
        return 0.4;
    }

    function adjustColor(hex, factor) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgb(${Math.floor(r * factor)}, ${Math.floor(g * factor)}, ${Math.floor(b * factor)})`;
    }

    // (Old NPC indicators removed — now full silhouettes via RoomViews.drawNPCSilhouettes)

    // ── Minimap Overlay (bottom-right corner) ──
    function renderMinimapOverlay() {
        const mw = 130;
        const mh = 100;
        const mx = width - mw - 16;
        const my = height - mh - 80;

        // Background
        ctx.fillStyle = 'rgba(7, 7, 15, 0.7)';
        ctx.fillRect(mx - 2, my - 2, mw + 4, mh + 4);
        ctx.strokeStyle = 'rgba(212, 160, 32, 0.2)';
        ctx.lineWidth = 1;
        ctx.strokeRect(mx - 2, my - 2, mw + 4, mh + 4);

        // Draw minimap inline
        const current = Engine.state.currentLocation;
        const gameTime = Engine.state.time;

        // Connections
        ctx.strokeStyle = 'rgba(100, 100, 120, 0.2)';
        ctx.lineWidth = 0.5;
        for (const [locId, loc] of Object.entries(GameData.locations)) {
            const pos = GameData.mapLayout[locId];
            if (!pos) continue;
            for (const exit of loc.exits) {
                const toPos = GameData.mapLayout[exit.to];
                if (!toPos) continue;
                ctx.beginPath();
                ctx.moveTo(mx + pos.x * mw, my + pos.y * mh);
                ctx.lineTo(mx + toPos.x * mw, my + toPos.y * mh);
                ctx.stroke();
            }
        }

        // Nodes
        for (const [locId, pos] of Object.entries(GameData.mapLayout)) {
            const px = mx + pos.x * mw;
            const py = my + pos.y * mh;
            const isVisited = Engine.state.visitedLocations.has(locId);
            const isCurrent = locId === current;

            // NPC count indicator
            const npcsHere = Engine.getNPCsAtLocation(locId, gameTime);
            if (npcsHere.length > 0 && !isCurrent && Engine.state.loop >= 1) {
                ctx.fillStyle = 'rgba(212, 160, 32, 0.15)';
                ctx.beginPath();
                ctx.arc(px, py, 4 + npcsHere.length, 0, Math.PI * 2);
                ctx.fill();
            }

            if (isCurrent) {
                // Pulsing current location
                const pulse = 3 + Math.sin(time * 3) * 1.5;
                ctx.fillStyle = '#d4a020';
                ctx.beginPath();
                ctx.arc(px, py, pulse, 0, Math.PI * 2);
                ctx.fill();
            } else if (isVisited) {
                ctx.fillStyle = '#444455';
                ctx.beginPath();
                ctx.arc(px, py, 2.5, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.fillStyle = '#1a1a2a';
                ctx.beginPath();
                ctx.arc(px, py, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    // ── Speedrun Timer ──
    function renderSpeedrunTimer() {
        const elapsed = Engine.getSpeedrunElapsed();
        const totalSeconds = Math.floor(elapsed / 1000);
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        const ms = Math.floor((elapsed % 1000) / 10);
        const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(2, '0')}`;

        const x = width / 2;
        const y = 20;

        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        const tw = ctx.measureText(timeStr).width || 100;
        ctx.fillRect(x - tw / 2 - 16, y - 12, tw + 32, 22);

        // Border
        ctx.strokeStyle = 'rgba(212, 160, 32, 0.5)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x - tw / 2 - 16, y - 12, tw + 32, 22);

        // Text
        ctx.fillStyle = '#d4a020';
        ctx.font = 'bold 14px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(timeStr, x, y + 3);
        ctx.textAlign = 'start';
    }

    // ── Atmospheric Warning Text ──
    function renderAtmosphericText(gameTime) {
        const msg = Effects.getWarningMessage(gameTime);
        if (!msg) return;

        const alpha = 0.15 + Math.sin(time * 1.5) * 0.05;
        ctx.fillStyle = `rgba(180, 60, 60, ${alpha})`;
        ctx.font = 'italic 12px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(msg, width / 2, height - 50);
        ctx.textAlign = 'start';
    }

    // ── Game Mode Indicator ──
    function renderModeIndicator(label, color) {
        const x = 16;
        const y = height - 20;

        ctx.fillStyle = color;
        ctx.font = 'bold 10px "Courier New", monospace';
        ctx.globalAlpha = 0.5 + Math.sin(time * 2) * 0.2;
        ctx.fillText(label, x, y);
        ctx.globalAlpha = 1;
    }

    // ── Post-Murder Overlay ──
    function renderPostMurderOverlay(gameTime) {
        // Red-tinged atmosphere after the murder
        const intensity = Math.min(0.15, (gameTime - 1410) / 300 * 0.15);
        ctx.fillStyle = `rgba(80, 10, 10, ${intensity})`;
        ctx.fillRect(0, 0, width, height);

        // Pulsing crimson edges
        const pulse = Math.sin(time * 2) * 0.03 + 0.05;
        const edgeGrad = ctx.createRadialGradient(
            width / 2, height / 2, width * 0.2,
            width / 2, height / 2, width * 0.65
        );
        edgeGrad.addColorStop(0, 'rgba(0,0,0,0)');
        edgeGrad.addColorStop(1, `rgba(100, 20, 20, ${pulse})`);
        ctx.fillStyle = edgeGrad;
        ctx.fillRect(0, 0, width, height);

        // "MURDER" text flash in library
        if (Engine.state.currentLocation === 'library') {
            const flashAlpha = Math.sin(time * 3) * 0.05 + 0.05;
            ctx.fillStyle = `rgba(180, 30, 30, ${flashAlpha})`;
            ctx.font = 'bold 48px "Courier New", monospace';
            ctx.textAlign = 'center';
            ctx.fillText('CRIME SCENE', width / 2, height * 0.15);
            ctx.textAlign = 'start';
        }
    }

    // ── Scanlines ──
    function renderScanlines() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.03)';
        for (let y = 0; y < height; y += 3) {
            ctx.fillRect(0, y, width, 1);
        }
    }

    // ── Lightning ──
    function updateLightning() {
        lightningTimer -= 0.016;
        if (lightningTimer <= 0) {
            // Random chance of lightning, more frequent at night
            const gameTime = Engine.state.time;
            const nightFactor = gameTime > 1200 ? 0.003 : 0.001;
            if (Math.random() < nightFactor) {
                lightningFlash = 1.0;
                lightningTimer = 0.1 + Math.random() * 0.2; // brief flash
                // Sometimes double flash
                if (Math.random() < 0.3) {
                    setTimeout(() => { lightningFlash = 0.7; }, 150);
                }
            }
        }
        if (lightningFlash > 0) {
            ctx.fillStyle = `rgba(200, 210, 255, ${lightningFlash * 0.15})`;
            ctx.fillRect(0, 0, width, height);
            lightningFlash *= 0.85; // decay
            if (lightningFlash < 0.01) lightningFlash = 0;
        }
    }

    // ── Fog/Mist for Garden and Tower ──
    function initFogParticles() {
        fogParticles = [];
        for (let i = 0; i < 20; i++) {
            fogParticles.push({
                x: Math.random() * width * 1.5 - width * 0.25,
                y: height * 0.2 + Math.random() * height * 0.5,
                w: 100 + Math.random() * 200,
                h: 20 + Math.random() * 40,
                speed: 0.2 + Math.random() * 0.4,
                opacity: 0.02 + Math.random() * 0.04,
            });
        }
    }

    function renderFog() {
        fogParticles.forEach(f => {
            f.x += f.speed;
            if (f.x > width + f.w) {
                f.x = -f.w;
                f.y = height * 0.2 + Math.random() * height * 0.5;
            }
            ctx.fillStyle = `rgba(180, 190, 200, ${f.opacity})`;
            ctx.beginPath();
            ctx.ellipse(f.x, f.y, f.w / 2, f.h / 2, 0, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    // ── Minimap ──
    function renderMinimap(targetCtx, w, h) {
        const current = Engine.state.currentLocation;
        targetCtx.fillStyle = '#0d0d1a';
        targetCtx.fillRect(0, 0, w, h);

        // Draw connections
        targetCtx.strokeStyle = 'rgba(100, 100, 120, 0.3)';
        targetCtx.lineWidth = 1;
        for (const [locId, loc] of Object.entries(GameData.locations)) {
            const pos = GameData.mapLayout[locId];
            if (!pos) continue;
            for (const exit of loc.exits) {
                const toPos = GameData.mapLayout[exit.to];
                if (!toPos) continue;
                targetCtx.beginPath();
                targetCtx.moveTo(pos.x * w, pos.y * h);
                targetCtx.lineTo(toPos.x * w, toPos.y * h);
                targetCtx.stroke();
            }
        }

        // Draw nodes
        for (const [locId, pos] of Object.entries(GameData.mapLayout)) {
            const isVisited = Engine.state.visitedLocations.has(locId);
            const isCurrent = locId === current;

            if (isCurrent) {
                targetCtx.fillStyle = '#d4a020';
                targetCtx.beginPath();
                targetCtx.arc(pos.x * w, pos.y * h, 6, 0, Math.PI * 2);
                targetCtx.fill();
            } else if (isVisited) {
                targetCtx.fillStyle = '#555566';
                targetCtx.beginPath();
                targetCtx.arc(pos.x * w, pos.y * h, 4, 0, Math.PI * 2);
                targetCtx.fill();
            } else {
                targetCtx.fillStyle = '#2a2a3a';
                targetCtx.beginPath();
                targetCtx.arc(pos.x * w, pos.y * h, 3, 0, Math.PI * 2);
                targetCtx.fill();
            }
        }
    }

    // ── Feature 20: Evidence Discovery Animation ──
    let evidenceSparkles = [];
    let evidenceFloatTexts = [];

    function triggerEvidenceAnimation(evidenceName) {
        // Golden sparkle burst
        for (let i = 0; i < 20; i++) {
            const angle = (Math.PI * 2 * i) / 20;
            const speed = 1.5 + Math.random() * 2;
            evidenceSparkles.push({
                x: width / 2 + (Math.random() - 0.5) * 60,
                y: height / 2 + (Math.random() - 0.5) * 40,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 1,
                life: 1,
                decay: 0.015 + Math.random() * 0.01,
                size: 2 + Math.random() * 3,
            });
        }
        // Floating text
        evidenceFloatTexts.push({
            text: evidenceName || 'Evidence Found',
            x: width / 2,
            y: height * 0.4,
            life: 1,
            decay: 0.008,
        });
    }

    function updateAndRenderEvidenceAnimation() {
        // Sparkles
        evidenceSparkles = evidenceSparkles.filter(s => s.life > 0);
        evidenceSparkles.forEach(s => {
            s.x += s.vx;
            s.y += s.vy;
            s.vy += 0.05; // gravity
            s.life -= s.decay;
            const alpha = s.life * 0.8;
            ctx.fillStyle = `rgba(212, 160, 32, ${alpha})`;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size * s.life, 0, Math.PI * 2);
            ctx.fill();
            // Glow
            ctx.fillStyle = `rgba(255, 220, 100, ${alpha * 0.3})`;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size * s.life * 2.5, 0, Math.PI * 2);
            ctx.fill();
        });

        // Float texts
        evidenceFloatTexts = evidenceFloatTexts.filter(t => t.life > 0);
        evidenceFloatTexts.forEach(t => {
            t.y -= 0.5;
            t.life -= t.decay;
            ctx.save();
            ctx.font = 'bold 16px "Courier New", monospace';
            ctx.textAlign = 'center';
            ctx.fillStyle = `rgba(212, 160, 32, ${t.life})`;
            ctx.fillText(t.text, t.x, t.y);
            ctx.restore();
        });
    }

    // ── Feature 22: Minimap Room Labels ──
    let minimapHoverLabel = null;

    function checkMinimapHover(mouseX, mouseY) {
        const mw = 130, mh = 100;
        const mx = width - mw - 16;
        const my = height - mh - 80;

        minimapHoverLabel = null;
        for (const [locId, pos] of Object.entries(GameData.mapLayout)) {
            const px = mx + pos.x * mw;
            const py = my + pos.y * mh;
            const dist = Math.hypot(mouseX - px, mouseY - py);
            if (dist < 10) {
                const loc = GameData.locations[locId];
                if (loc) {
                    minimapHoverLabel = { name: loc.name, x: px, y: py - 12 };
                }
                break;
            }
        }
    }

    function renderMinimapLabel() {
        if (!minimapHoverLabel) return;
        ctx.save();
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        const tw = ctx.measureText(minimapHoverLabel.name).width + 8;
        ctx.fillStyle = 'rgba(7, 7, 15, 0.85)';
        ctx.fillRect(minimapHoverLabel.x - tw / 2, minimapHoverLabel.y - 10, tw, 14);
        ctx.strokeStyle = 'rgba(212, 160, 32, 0.4)';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(minimapHoverLabel.x - tw / 2, minimapHoverLabel.y - 10, tw, 14);
        ctx.fillStyle = '#d4a020';
        ctx.fillText(minimapHoverLabel.name, minimapHoverLabel.x, minimapHoverLabel.y);
        ctx.restore();
    }

    // ── Feature 24: Analog Clock Face in HUD ──
    function renderAnalogClock(gameTime) {
        const clockSize = 20;
        const cx = width - 50;
        const cy = 22;

        // Background
        ctx.fillStyle = 'rgba(7, 7, 15, 0.7)';
        ctx.beginPath();
        ctx.arc(cx, cy, clockSize + 2, 0, Math.PI * 2);
        ctx.fill();

        // Clock face
        const isLate = gameTime >= 1380; // after 11 PM
        ctx.strokeStyle = isLate ? 'rgba(200, 50, 50, 0.6)' : 'rgba(212, 160, 32, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cx, cy, clockSize, 0, Math.PI * 2);
        ctx.stroke();

        // Hour marks
        for (let i = 0; i < 12; i++) {
            const angle = (i * Math.PI * 2) / 12 - Math.PI / 2;
            const inner = clockSize * 0.8;
            const outer = clockSize * 0.95;
            ctx.strokeStyle = isLate ? 'rgba(200, 50, 50, 0.4)' : 'rgba(212, 160, 32, 0.3)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(cx + Math.cos(angle) * inner, cy + Math.sin(angle) * inner);
            ctx.lineTo(cx + Math.cos(angle) * outer, cy + Math.sin(angle) * outer);
            ctx.stroke();
        }

        // Convert game time (minutes from midnight) to 12-hour angle
        const hours = Math.floor(gameTime / 60) % 12;
        const minutes = gameTime % 60;

        // Hour hand
        const hourAngle = ((hours + minutes / 60) * Math.PI * 2) / 12 - Math.PI / 2;
        ctx.strokeStyle = isLate ? '#cc3333' : '#d4a020';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(hourAngle) * clockSize * 0.5, cy + Math.sin(hourAngle) * clockSize * 0.5);
        ctx.stroke();

        // Minute hand
        const minAngle = (minutes * Math.PI * 2) / 60 - Math.PI / 2;
        ctx.strokeStyle = isLate ? '#cc3333' : '#d4a020';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(minAngle) * clockSize * 0.75, cy + Math.sin(minAngle) * clockSize * 0.75);
        ctx.stroke();

        // Center dot
        ctx.fillStyle = isLate ? '#cc3333' : '#d4a020';
        ctx.beginPath();
        ctx.arc(cx, cy, 2, 0, Math.PI * 2);
        ctx.fill();

        // Red glow after 11 PM
        if (isLate) {
            const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, clockSize + 8);
            glow.addColorStop(0, 'rgba(200, 50, 50, 0.08)');
            glow.addColorStop(1, 'rgba(200, 50, 50, 0)');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(cx, cy, clockSize + 8, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // ── Feature 25: Accusation Reveal Effect ──
    let accusationRevealActive = false;
    let accusationRevealPhase = 0;

    function triggerAccusationReveal() {
        accusationRevealActive = true;
        accusationRevealPhase = 0;
        Audio.playSound('thunder');
    }

    function updateAccusationReveal() {
        if (!accusationRevealActive) return;
        accusationRevealPhase += 0.02;

        // Flash
        if (accusationRevealPhase < 0.3) {
            const flash = 1 - accusationRevealPhase / 0.3;
            ctx.fillStyle = `rgba(255, 255, 255, ${flash * 0.5})`;
            ctx.fillRect(0, 0, width, height);
        }

        // Vignette zoom
        if (accusationRevealPhase < 1) {
            const zoom = accusationRevealPhase;
            const vigGrad = ctx.createRadialGradient(
                width / 2, height / 2, width * 0.1 * (1 - zoom),
                width / 2, height / 2, width * 0.5
            );
            vigGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
            vigGrad.addColorStop(1, `rgba(0, 0, 0, ${zoom * 0.6})`);
            ctx.fillStyle = vigGrad;
            ctx.fillRect(0, 0, width, height);
        }

        if (accusationRevealPhase >= 1.5) {
            accusationRevealActive = false;
        }
    }

    // ── Feature 31: Autosave Indicator ──
    let autosaveFlash = 0;

    function triggerAutosaveIndicator() {
        autosaveFlash = 1;
    }

    function renderAutosaveIndicator() {
        if (autosaveFlash <= 0) return;
        autosaveFlash -= 0.01;

        const alpha = Math.min(1, autosaveFlash);
        const x = 16, y = 22;

        // Floppy disk icon
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#d4a020';
        ctx.fillRect(x, y, 14, 16);
        ctx.fillStyle = '#0d0d1a';
        ctx.fillRect(x + 3, y, 8, 6);
        ctx.fillRect(x + 2, y + 9, 10, 5);
        ctx.fillStyle = '#d4a020';
        ctx.fillRect(x + 5, y + 10, 4, 4);
        // "Saved" text
        ctx.font = '9px monospace';
        ctx.fillStyle = `rgba(212, 160, 32, ${alpha})`;
        ctx.fillText('Saved', x + 18, y + 12);
        ctx.restore();
    }

    // ── Hook mouse move for minimap labels ──
    function setupMouseHover() {
        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            const mx = e.clientX - rect.left;
            const my = e.clientY - rect.top;
            checkMinimapHover(mx, my);
        });
    }

    // Patch init to add hover listener
    const _origInit = init;
    function enhancedInit() {
        _origInit();
        setupMouseHover();
    }

    // ── Auto-Play Indicator ──
    function renderAutoPlayIndicator() {
        if (typeof AutoPlay === 'undefined' || !AutoPlay.isRunning()) return;
        const pulse = 0.6 + Math.sin(time * 4) * 0.4;
        ctx.save();
        ctx.globalAlpha = pulse;
        ctx.font = 'bold 14px "Courier New", monospace';
        ctx.fillStyle = '#d4a020';
        ctx.textAlign = 'left';
        ctx.fillText('AUTO', 16, 42);
        ctx.restore();
    }

    // Patch renderRoom to include new features
    const _origRenderRoom = renderRoom;
    function enhancedRenderRoom() {
        _origRenderRoom();
        // Additional overlays
        updateAndRenderEvidenceAnimation();
        renderAnalogClock(Engine.state.time);
        renderMinimapLabel();
        updateAccusationReveal();
        renderAutosaveIndicator();
        renderAutoPlayIndicator();
    }

    return {
        init: enhancedInit, startLoop, stopLoop,
        render() {
            const screen = Engine.state.screen;
            if (screen === 'title' || screen === 'intro') {
                Cutscenes.renderTitleScene(ctx, width, height);
            } else if (screen === 'ending') {
                Cutscenes.renderEndingScene(ctx, width, height, Engine.state.endingKey || 'default', time);
            } else if (screen === 'minigame') {
                enhancedRenderRoom();
                MiniGames.updateAndRender(ctx, width, height, 0.016);
            } else if (screen === 'playing' || screen === 'dialogue' ||
                       screen === 'notebook' || screen === 'accusation' ||
                       screen === 'fast_forward' || screen === 'eavesdrop') {
                enhancedRenderRoom();
            }
        },
        drawPortraitOnCanvas, renderMinimap,
        adjustColor,
        startRoomTransition, isTransitioning,
        triggerEvidenceAnimation,
        triggerAccusationReveal,
        triggerAutosaveIndicator,
    };
})();
