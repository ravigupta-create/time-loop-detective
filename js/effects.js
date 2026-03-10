/* ═══════════════════════════════════════════════════════
   EFFECTS — Suspense/tension escalation, enhanced weather,
   environmental storytelling, atmospheric overlays
   ═══════════════════════════════════════════════════════ */

const Effects = (() => {
    // ── Suspense State ──
    let tension = 0;           // 0-1, rises as midnight approaches
    let heartbeatPhase = 0;    // heartbeat visual pulse
    let shakeX = 0, shakeY = 0;
    let bloodOverlay = 0;      // post-murder blood vignette
    let breathFog = 0;         // cold breath effect in cellar/tower
    let clockTick = 0;         // visual clock tick pulse
    let dreadPulse = 0;        // slow red pulse on screen edges

    // ── Enhanced Weather State ──
    let windStrength = 0;
    let windTarget = 0;
    let windGustTimer = 0;
    let rainIntensity = 0.5;
    let rainTarget = 0.5;
    let curtainSway = [];      // for indoor curtain/drape animations
    let candleFlickers = [];   // candle flame flicker state

    // ── Environmental Storytelling ──
    let postMurder = false;
    let murderWitnessed = false;

    // ── Floating Dust Motes (enhanced) ──
    let dustMotes = [];
    const MAX_DUST = 30;

    // ── Moonbeam State ──
    let moonbeamAngle = 0;

    function init() {
        // Initialize curtain sway points
        for (let i = 0; i < 6; i++) {
            curtainSway.push({
                phase: Math.random() * Math.PI * 2,
                speed: 0.3 + Math.random() * 0.4,
                amplitude: 2 + Math.random() * 3,
            });
        }
        // Initialize candle flickers
        for (let i = 0; i < 8; i++) {
            candleFlickers.push({
                brightness: 0.7 + Math.random() * 0.3,
                target: 0.7 + Math.random() * 0.3,
                speed: 0.05 + Math.random() * 0.1,
            });
        }
        // Initialize dust motes
        for (let i = 0; i < MAX_DUST; i++) {
            dustMotes.push(createDustMote());
        }
        // Initialize rain streaks
        initRainStreaks();
    }

    function createDustMote() {
        return {
            x: Math.random(),
            y: Math.random(),
            size: 0.5 + Math.random() * 1.5,
            speedX: (Math.random() - 0.5) * 0.0003,
            speedY: -0.0002 - Math.random() * 0.0003,
            opacity: 0.1 + Math.random() * 0.2,
            wobblePhase: Math.random() * Math.PI * 2,
            wobbleSpeed: 0.5 + Math.random() * 1,
        };
    }

    // ══════════════════════════════════════════════════
    // MAIN UPDATE — called each frame from renderer
    // ══════════════════════════════════════════════════
    function update(gameTime, dt) {
        // Calculate tension (0 at 6AM, 1 at midnight)
        const dayProgress = Math.max(0, (gameTime - 360) / (1440 - 360));

        // Tension curve: slow rise until 9PM, then accelerates dramatically
        if (dayProgress < 0.7) {
            tension = dayProgress * 0.3; // gentle rise to 0.21
        } else if (dayProgress < 0.85) {
            tension = 0.21 + (dayProgress - 0.7) * 2.6; // 0.21 to 0.6
        } else if (dayProgress < 0.95) {
            tension = 0.6 + (dayProgress - 0.85) * 3.0; // 0.6 to 0.9
        } else {
            tension = 0.9 + (dayProgress - 0.95) * 2.0; // 0.9 to 1.0
        }
        tension = Math.min(1, tension);

        // Post-murder detection (after 11:10 PM = 1410 min, loop > 0)
        try {
            if (gameTime >= 1410 && Engine.state.loop > 0) {
                postMurder = true;
            } else {
                postMurder = false;
            }
        } catch (e) {}

        // Heartbeat pulse (increases with tension)
        if (tension > 0.5) {
            const heartbeatSpeed = 1.5 + tension * 3;
            heartbeatPhase += dt * heartbeatSpeed;
            if (heartbeatPhase > Math.PI * 2) heartbeatPhase -= Math.PI * 2;
        }

        // Screen shake (subtle, only at high tension)
        if (tension > 0.8) {
            const shakeIntensity = (tension - 0.8) * 8;
            shakeX = (Math.random() - 0.5) * shakeIntensity;
            shakeY = (Math.random() - 0.5) * shakeIntensity;
        } else {
            shakeX *= 0.9;
            shakeY *= 0.9;
        }

        // Clock tick visual pulse
        clockTick += dt * 1.0;
        if (clockTick > 1) clockTick -= 1;

        // Dread pulse (slow, ominous)
        dreadPulse += dt * 0.4;

        // Wind dynamics
        windGustTimer -= dt;
        if (windGustTimer <= 0) {
            windTarget = 0.2 + Math.random() * 0.8;
            windGustTimer = 3 + Math.random() * 8;
        }
        windStrength += (windTarget - windStrength) * 0.02;

        // Rain intensity tied to tension + randomness
        rainTarget = 0.3 + tension * 0.5 + Math.sin(Date.now() * 0.0001) * 0.2;
        rainIntensity += (rainTarget - rainIntensity) * 0.01;

        // Update curtain sway
        curtainSway.forEach(c => {
            c.phase += c.speed * dt * (1 + windStrength);
        });

        // Update candle flickers
        candleFlickers.forEach(c => {
            c.brightness += (c.target - c.brightness) * c.speed;
            if (Math.random() < 0.05) {
                c.target = 0.5 + Math.random() * 0.5;
            }
            // Wind affects candles
            if (windStrength > 0.6 && Math.random() < 0.1) {
                c.target = 0.3 + Math.random() * 0.3;
            }
        });

        // Update dust motes
        dustMotes.forEach(d => {
            d.x += d.speedX + Math.sin(d.wobblePhase) * 0.0001;
            d.y += d.speedY;
            d.wobblePhase += d.wobbleSpeed * dt;
            if (d.y < -0.05 || d.x < -0.05 || d.x > 1.05) {
                Object.assign(d, createDustMote());
                d.y = 1.05;
            }
        });

        // Moonbeam angle slowly shifts
        moonbeamAngle += dt * 0.02;
    }

    // ══════════════════════════════════════════════════
    // RENDER EFFECTS — layered on top of room
    // ══════════════════════════════════════════════════

    function renderTensionOverlay(ctx, w, h) {
        if (tension < 0.15) return;

        // ── Red Dread Vignette (pulsing at edges) ──
        const dreadAmount = Math.max(0, tension - 0.4) * 1.6;
        if (dreadAmount > 0) {
            const pulse = Math.sin(dreadPulse) * 0.3 + 0.7;
            const alpha = dreadAmount * 0.15 * pulse;

            const grad = ctx.createRadialGradient(
                w / 2, h / 2, w * 0.2,
                w / 2, h / 2, w * 0.65
            );
            grad.addColorStop(0, 'rgba(80, 0, 0, 0)');
            grad.addColorStop(0.7, `rgba(120, 10, 10, ${alpha * 0.5})`);
            grad.addColorStop(1, `rgba(60, 0, 0, ${alpha})`);
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, w, h);
        }

        // ── Desaturation overlay (tension washes color out) ──
        if (tension > 0.6) {
            const desatAlpha = (tension - 0.6) * 0.15;
            ctx.fillStyle = `rgba(20, 20, 25, ${desatAlpha})`;
            ctx.fillRect(0, 0, w, h);
        }

        // ── Heartbeat pulse overlay ──
        if (tension > 0.5) {
            const beat = Math.pow(Math.max(0, Math.sin(heartbeatPhase)), 8);
            if (beat > 0.01) {
                const beatAlpha = beat * (tension - 0.4) * 0.08;
                ctx.fillStyle = `rgba(100, 0, 0, ${beatAlpha})`;
                ctx.fillRect(0, 0, w, h);
            }
        }

        // ── Clock tick indicator (top center) ──
        if (tension > 0.7) {
            const tickAlpha = Math.max(0, Math.sin(clockTick * Math.PI * 2)) * (tension - 0.6) * 0.3;
            ctx.fillStyle = `rgba(212, 160, 32, ${tickAlpha * 0.15})`;
            ctx.fillRect(w * 0.45, 0, w * 0.1, 3);
        }
    }

    function renderPostMurderEffect(ctx, w, h) {
        if (!postMurder) return;

        // Eerie blue-green tint
        ctx.fillStyle = 'rgba(0, 15, 20, 0.12)';
        ctx.fillRect(0, 0, w, h);

        // Subtle pulsing cold light
        const eeriePhase = Math.sin(Date.now() * 0.001) * 0.5 + 0.5;
        const eerieAlpha = eeriePhase * 0.04;
        ctx.fillStyle = `rgba(100, 150, 180, ${eerieAlpha})`;
        ctx.fillRect(0, 0, w, h);
    }

    function renderDustMotes(ctx, w, h, brightness) {
        if (brightness < 0.4) return; // too dark for visible dust

        const dustAlpha = Math.min(1, brightness * 0.8);
        dustMotes.forEach(d => {
            const x = d.x * w;
            const y = d.y * h;
            const alpha = d.opacity * dustAlpha;

            ctx.fillStyle = `rgba(220, 210, 180, ${alpha})`;
            ctx.beginPath();
            ctx.arc(x, y, d.size, 0, Math.PI * 2);
            ctx.fill();

            // Tiny glow around bright motes
            if (d.size > 1 && brightness > 0.6) {
                ctx.fillStyle = `rgba(255, 240, 200, ${alpha * 0.3})`;
                ctx.beginPath();
                ctx.arc(x, y, d.size * 2.5, 0, Math.PI * 2);
                ctx.fill();
            }
        });
    }

    function renderMoonbeams(ctx, w, h, gameTime, locationId) {
        // Only show moonbeams at night (after 7PM) and in rooms with windows
        if (gameTime < 1140) return;
        const windowRooms = ['your_room', 'grand_hallway', 'dining_room', 'library',
                             'study', 'drawing_room', 'ballroom', 'master_suite'];
        if (!windowRooms.includes(locationId)) return;

        const nightProgress = Math.min(1, (gameTime - 1140) / 300);
        const beamAlpha = nightProgress * 0.06;

        ctx.save();
        // Angled beam from upper-right window
        const beamX = w * 0.75;
        const beamY = 0;
        const beamEndX = w * 0.3 + Math.sin(moonbeamAngle) * w * 0.05;
        const beamEndY = h;

        const grad = ctx.createLinearGradient(beamX, beamY, beamEndX, beamEndY);
        grad.addColorStop(0, `rgba(150, 170, 210, ${beamAlpha})`);
        grad.addColorStop(0.5, `rgba(120, 140, 180, ${beamAlpha * 0.5})`);
        grad.addColorStop(1, `rgba(100, 120, 160, 0)`);

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(beamX - w * 0.02, beamY);
        ctx.lineTo(beamX + w * 0.06, beamY);
        ctx.lineTo(beamEndX + w * 0.15, beamEndY);
        ctx.lineTo(beamEndX - w * 0.08, beamEndY);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    function renderCandleGlow(ctx, w, h, locationId) {
        const candleRooms = ['dining_room', 'ballroom', 'drawing_room', 'master_suite'];
        if (!candleRooms.includes(locationId)) return;

        // Warm flickering glow points
        const glowPositions = [
            { x: 0.3, y: 0.25 }, { x: 0.7, y: 0.25 },
            { x: 0.5, y: 0.2 }, { x: 0.4, y: 0.3 },
        ];

        glowPositions.forEach((pos, i) => {
            const flicker = candleFlickers[i] || { brightness: 0.8 };
            const radius = (20 + flicker.brightness * 30) * (w / 960);
            const alpha = flicker.brightness * 0.04;

            const grad = ctx.createRadialGradient(
                pos.x * w, pos.y * h, 0,
                pos.x * w, pos.y * h, radius
            );
            grad.addColorStop(0, `rgba(255, 200, 100, ${alpha})`);
            grad.addColorStop(0.5, `rgba(255, 150, 50, ${alpha * 0.5})`);
            grad.addColorStop(1, 'rgba(255, 150, 50, 0)');
            ctx.fillStyle = grad;
            ctx.fillRect(pos.x * w - radius, pos.y * h - radius, radius * 2, radius * 2);
        });
    }

    function renderBreathFog(ctx, w, h, locationId, time) {
        // Cold breath in cellar and tower
        if (locationId !== 'wine_cellar' && locationId !== 'tower') return;

        const breathPhase = Math.sin(time * 0.8);
        if (breathPhase < 0.7) return;

        const alpha = (breathPhase - 0.7) * 0.15;
        const x = w * 0.5;
        const y = h * 0.75;

        ctx.fillStyle = `rgba(200, 210, 220, ${alpha})`;
        ctx.beginPath();
        ctx.ellipse(x, y - (breathPhase - 0.7) * 30, 15, 8, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    // ── Wind effect on rain (called from enhanced rain rendering) ──
    function getWindOffset() {
        return windStrength * 3;
    }

    function getRainIntensity() {
        return rainIntensity;
    }

    function getCurtainSway(index) {
        const c = curtainSway[index % curtainSway.length];
        return Math.sin(c.phase) * c.amplitude;
    }

    function getCandleBrightness(index) {
        const c = candleFlickers[index % candleFlickers.length];
        return c ? c.brightness : 0.8;
    }

    function getScreenShake() {
        return { x: shakeX, y: shakeY };
    }

    function getTension() {
        return tension;
    }

    function isPostMurder() {
        return postMurder;
    }

    // ── Window Rain Streaks ──
    let rainStreaks = [];
    const MAX_STREAKS = 15;

    function initRainStreaks() {
        for (let i = 0; i < MAX_STREAKS; i++) {
            rainStreaks.push(createRainStreak());
        }
    }

    function createRainStreak() {
        return {
            x: Math.random(),
            y: -0.1 - Math.random() * 0.3,
            speed: 0.001 + Math.random() * 0.002,
            length: 0.05 + Math.random() * 0.15,
            opacity: 0.03 + Math.random() * 0.06,
            width: 0.5 + Math.random() * 1.5,
            wobble: Math.random() * Math.PI * 2,
            wobbleSpeed: 0.5 + Math.random(),
        };
    }

    function updateRainStreaks(dt) {
        rainStreaks.forEach(s => {
            s.y += s.speed * (1 + windStrength * 0.5);
            s.wobble += s.wobbleSpeed * dt;
            if (s.y > 1.1) {
                Object.assign(s, createRainStreak());
            }
        });
    }

    function renderWindowRainStreaks(ctx, w, h, locationId) {
        // Only in rooms with windows (indoor rooms)
        const windowRooms = ['your_room', 'grand_hallway', 'dining_room', 'library',
                             'study', 'drawing_room', 'ballroom', 'master_suite'];
        if (!windowRooms.includes(locationId)) return;

        rainStreaks.forEach(s => {
            const sx = s.x * w + Math.sin(s.wobble) * 2;
            const sy = s.y * h;
            const endY = sy + s.length * h;

            const grad = ctx.createLinearGradient(sx, sy, sx, endY);
            grad.addColorStop(0, `rgba(180, 200, 220, 0)`);
            grad.addColorStop(0.3, `rgba(180, 200, 220, ${s.opacity})`);
            grad.addColorStop(0.7, `rgba(180, 200, 220, ${s.opacity * 0.7})`);
            grad.addColorStop(1, `rgba(180, 200, 220, 0)`);

            ctx.strokeStyle = grad;
            ctx.lineWidth = s.width;
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.quadraticCurveTo(sx + Math.sin(s.wobble) * 3, (sy + endY) / 2, sx + windStrength * 5, endY);
            ctx.stroke();
        });
    }

    // ── Thunder Flash Effect ──
    let thunderFlash = 0;
    let thunderTimer = 0;
    let thunderRumbleTimer = 0;

    function updateThunder(dt, gameTime) {
        thunderTimer -= dt;
        if (thunderTimer <= 0) {
            // Thunder frequency increases with tension and at night
            const freq = gameTime > 1200 ? 0.008 : 0.003;
            if (Math.random() < freq) {
                thunderFlash = 1.0;
                thunderTimer = 0.15 + Math.random() * 0.1;
                thunderRumbleTimer = 0.5 + Math.random() * 1.5; // rumble delay
                // Double flash chance
                if (Math.random() < 0.4) {
                    setTimeout(() => { thunderFlash = Math.max(thunderFlash, 0.6); }, 120);
                }
                // Play thunder sound after delay
                setTimeout(() => {
                    try { Audio.playSound('thunder'); } catch (e) {}
                }, Math.floor(thunderRumbleTimer * 1000));
            } else {
                thunderTimer = 0.5;
            }
        }

        if (thunderFlash > 0) {
            thunderFlash *= 0.88;
            if (thunderFlash < 0.01) thunderFlash = 0;
        }
    }

    function renderThunderFlash(ctx, w, h) {
        if (thunderFlash <= 0) return;
        ctx.fillStyle = `rgba(220, 230, 255, ${thunderFlash * 0.12})`;
        ctx.fillRect(0, 0, w, h);
    }

    // ── Flickering Light Effect (power fluctuation) ──
    let flickerState = 1.0;
    let flickerTarget = 1.0;
    let flickerTimer = 0;

    function updateFlicker(dt, gameTime) {
        // Rare power flicker, more common after 10 PM
        flickerTimer -= dt;
        if (flickerTimer <= 0) {
            const flickerChance = gameTime > 1320 ? 0.02 : 0.005;
            if (Math.random() < flickerChance) {
                // Brief dim
                flickerTarget = 0.3 + Math.random() * 0.4;
                flickerTimer = 0.05 + Math.random() * 0.1;
            } else {
                flickerTarget = 1.0;
                flickerTimer = 0.5 + Math.random() * 2;
            }
        }
        flickerState += (flickerTarget - flickerState) * 0.3;
    }

    function renderFlickerOverlay(ctx, w, h, locationId) {
        // Only indoor rooms have electric lighting to flicker
        if (locationId === 'garden') return;
        if (flickerState >= 0.98) return;

        const dimAmount = 1 - flickerState;
        ctx.fillStyle = `rgba(0, 0, 0, ${dimAmount * 0.3})`;
        ctx.fillRect(0, 0, w, h);
    }

    // ── Fog Density Variation ──
    let fogDensity = 0;
    let fogDensityTarget = 0;

    function updateFogDensity(dt, gameTime, locationId) {
        // Garden, cellar, tower get varying fog
        const fogRooms = ['garden', 'wine_cellar', 'tower'];
        if (fogRooms.includes(locationId)) {
            fogDensityTarget = 0.3 + Math.sin(Date.now() * 0.0003) * 0.15 + tension * 0.3;
        } else {
            fogDensityTarget = 0;
        }
        fogDensity += (fogDensityTarget - fogDensity) * 0.02;
    }

    function renderFogDensity(ctx, w, h) {
        if (fogDensity < 0.05) return;

        // Low-lying fog gradient
        const grad = ctx.createLinearGradient(0, h * 0.5, 0, h);
        grad.addColorStop(0, `rgba(160, 170, 180, 0)`);
        grad.addColorStop(0.5, `rgba(160, 170, 180, ${fogDensity * 0.06})`);
        grad.addColorStop(1, `rgba(160, 170, 180, ${fogDensity * 0.12})`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
    }

    // ── Warning Messages ──
    function getWarningMessage(gameTime) {
        if (gameTime >= 1410) return 'The murder has already happened...';
        if (gameTime >= 1380) return 'Minutes remain. The clock is merciless.';
        if (gameTime >= 1350) return 'Less than an hour until midnight...';
        if (gameTime >= 1320) return 'The gala grows quiet. Something is wrong.';
        if (gameTime >= 1260) return 'The evening wears on. Time slips away.';
        if (gameTime >= 1200) return 'Night deepens around Ravenholm.';
        return null;
    }

    // ══════════════════════════════════════════════════
    // RENDER ALL — master render call
    // ══════════════════════════════════════════════════
    function renderAll(ctx, w, h, gameTime, locationId, brightness, time) {
        update(gameTime, 0.016);

        // Apply screen shake
        if (Math.abs(shakeX) > 0.1 || Math.abs(shakeY) > 0.1) {
            ctx.save();
            ctx.translate(shakeX, shakeY);
        }

        // Layer effects
        renderDustMotes(ctx, w, h, brightness);
        renderMoonbeams(ctx, w, h, gameTime, locationId);
        renderCandleGlow(ctx, w, h, locationId);
        renderBreathFog(ctx, w, h, locationId, time);
        renderTensionOverlay(ctx, w, h);
        renderPostMurderEffect(ctx, w, h);

        if (Math.abs(shakeX) > 0.1 || Math.abs(shakeY) > 0.1) {
            ctx.restore();
        }
    }

    // ── Ghost Sightings (Easter Egg) ──
    let ghostVisible = false;
    let ghostTimer = 0;
    let ghostX = 0.5, ghostY = 0.5;
    let ghostAlpha = 0;

    function updateGhost(gameTime, dt) {
        // Ghosts only appear at night (after 10PM), loop 3+, very rare
        try {
            if (Engine.state.loop < 3 || gameTime < 1320) {
                ghostVisible = false;
                ghostAlpha = 0;
                return;
            }
        } catch (e) { return; }

        ghostTimer -= dt;
        if (ghostTimer <= 0 && !ghostVisible) {
            // 0.5% chance per frame of spawning a ghost
            if (Math.random() < 0.005) {
                ghostVisible = true;
                ghostTimer = 2 + Math.random() * 3; // visible for 2-5 seconds
                ghostX = 0.2 + Math.random() * 0.6;
                ghostY = 0.2 + Math.random() * 0.4;
                ghostAlpha = 0;
                Audio.playSound('whisper');
            } else {
                ghostTimer = 1; // check again in 1 second
            }
        }

        if (ghostVisible) {
            ghostTimer -= dt;
            if (ghostTimer > 1) {
                ghostAlpha = Math.min(0.15, ghostAlpha + dt * 0.08);
            } else {
                ghostAlpha -= dt * 0.1;
            }
            if (ghostAlpha <= 0) {
                ghostVisible = false;
                ghostAlpha = 0;
                ghostTimer = 5 + Math.random() * 15;
                // Unlock ghost achievement
                try { Engine.unlockAchievement('ghost_hunter'); } catch (e) {}
            }
        }
    }

    function renderGhost(ctx, w, h) {
        if (!ghostVisible || ghostAlpha <= 0) return;

        const gx = ghostX * w;
        const gy = ghostY * h;

        ctx.save();
        ctx.globalAlpha = ghostAlpha;

        // Ghostly figure
        ctx.fillStyle = 'rgba(180, 200, 220, 0.5)';
        // Head
        ctx.beginPath();
        ctx.arc(gx, gy - 30, 10, 0, Math.PI * 2);
        ctx.fill();
        // Body (fading downward)
        const bodyGrad = ctx.createLinearGradient(gx, gy - 20, gx, gy + 40);
        bodyGrad.addColorStop(0, 'rgba(180, 200, 220, 0.3)');
        bodyGrad.addColorStop(1, 'rgba(180, 200, 220, 0)');
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.moveTo(gx - 12, gy - 20);
        ctx.lineTo(gx + 12, gy - 20);
        ctx.lineTo(gx + 8, gy + 40);
        ctx.lineTo(gx - 8, gy + 40);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }

    // Override renderAll to include ghost
    const _origRenderAll = renderAll;
    function renderAllWithGhost(ctx, w, h, gameTime, locationId, brightness, time) {
        const dt = 0.016;
        update(gameTime, dt);
        updateGhost(gameTime, dt);
        updateRainStreaks(dt);
        updateThunder(dt, gameTime);
        updateFlicker(dt, gameTime);
        updateFogDensity(dt, gameTime, locationId);

        if (Math.abs(shakeX) > 0.1 || Math.abs(shakeY) > 0.1) {
            ctx.save();
            ctx.translate(shakeX, shakeY);
        }

        renderDustMotes(ctx, w, h, brightness);
        renderMoonbeams(ctx, w, h, gameTime, locationId);
        renderCandleGlow(ctx, w, h, locationId);
        renderWindowRainStreaks(ctx, w, h, locationId);
        renderBreathFog(ctx, w, h, locationId, time);
        renderFogDensity(ctx, w, h);
        renderGhost(ctx, w, h);
        renderFlickerOverlay(ctx, w, h, locationId);
        renderThunderFlash(ctx, w, h);
        renderTensionOverlay(ctx, w, h);
        renderPostMurderEffect(ctx, w, h);

        if (Math.abs(shakeX) > 0.1 || Math.abs(shakeY) > 0.1) {
            ctx.restore();
        }
    }

    // ── Feature 19: Footstep Trail (garden → wine cellar after muddy_footprints) ──
    let footstepTrailDots = [];
    function initFootstepTrail() {
        // Muddy footprints leading from garden center toward wine cellar entrance
        footstepTrailDots = [];
        const steps = 12;
        for (let i = 0; i < steps; i++) {
            const t = i / (steps - 1);
            footstepTrailDots.push({
                x: 0.35 + t * 0.35,   // left-to-right across garden
                y: 0.72 - t * 0.15 + Math.sin(i * 1.2) * 0.02, // slight wobble
                size: 4 + Math.random() * 2,
                opacity: 0.15 + Math.random() * 0.1,
                rotation: (i % 2 === 0 ? -0.2 : 0.2) + Math.random() * 0.1,
            });
        }
    }

    function renderFootstepTrail(ctx, w, h, locationId) {
        if (locationId !== 'garden') return;
        try {
            if (!Engine.state.discoveredEvidence.has('muddy_footprints')) return;
        } catch (e) { return; }

        if (footstepTrailDots.length === 0) initFootstepTrail();

        footstepTrailDots.forEach(dot => {
            const dx = dot.x * w;
            const dy = dot.y * h;
            ctx.save();
            ctx.translate(dx, dy);
            ctx.rotate(dot.rotation);
            ctx.fillStyle = `rgba(80, 60, 30, ${dot.opacity})`;
            // Boot-shaped print
            ctx.beginPath();
            ctx.ellipse(0, 0, dot.size * 0.6, dot.size, 0, 0, Math.PI * 2);
            ctx.fill();
            // Heel
            ctx.beginPath();
            ctx.ellipse(0, dot.size * 1.3, dot.size * 0.45, dot.size * 0.5, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
    }

    // ── Feature 23: NPC Idle Animations ──
    let npcIdlePhases = {};
    function getNPCIdleOffset(npcId, time) {
        if (!npcIdlePhases[npcId]) {
            npcIdlePhases[npcId] = Math.random() * Math.PI * 2;
        }
        const phase = npcIdlePhases[npcId] + time;
        const idle = {
            lord_ashworth: { dx: 0, dy: Math.sin(phase * 0.5) * 1.5 },  // slight sway
            lady_evelyn:   { dx: Math.sin(phase * 0.7) * 1, dy: 0 },    // adjusting posture
            james:         { dx: Math.sin(phase * 1.2) * 2, dy: 0 },    // swirling drink
            lily:          { dx: 0, dy: Math.sin(phase * 1.5) * 1.5 },  // page turning bob
            dr_cross:      { dx: 0, dy: Math.sin(phase * 0.4) * 1 },    // standing still mostly
            rex_dalton:    { dx: Math.sin(phase * 0.9) * 1.5, dy: 0 },  // restless shifting
            isabelle:      { dx: 0, dy: Math.sin(phase * 0.6) * 1 },    // subtle movement
            thomas:        { dx: 0, dy: Math.sin(phase * 0.3) * 0.8 },  // clasping hands gently
            mrs_blackwood: { dx: Math.sin(phase * 0.5) * 0.5, dy: 0 },  // standing firm
            finch:         { dx: Math.sin(phase * 0.8) * 1, dy: 0 },    // busy movement
        };
        return idle[npcId] || { dx: 0, dy: 0 };
    }

    // ── Feature 26: Enhanced Room Weather ──
    let condensationDrops = [];
    const MAX_CONDENSATION = 20;

    function initCondensation() {
        condensationDrops = [];
        for (let i = 0; i < MAX_CONDENSATION; i++) {
            condensationDrops.push({
                x: 0.6 + Math.random() * 0.3,  // right side where window is
                y: 0.1 + Math.random() * 0.4,
                speed: 0.0001 + Math.random() * 0.0003,
                size: 1 + Math.random() * 2,
                opacity: 0.02 + Math.random() * 0.04,
            });
        }
    }

    function updateCondensation(dt) {
        if (condensationDrops.length === 0) initCondensation();
        condensationDrops.forEach(d => {
            d.y += d.speed;
            if (d.y > 0.5) {
                d.y = 0.1 + Math.random() * 0.1;
                d.x = 0.6 + Math.random() * 0.3;
            }
        });
    }

    function renderCondensation(ctx, w, h, locationId) {
        // Indoor rooms only, not garden/cellar/tower
        const indoorRooms = ['your_room', 'grand_hallway', 'dining_room', 'library',
                             'study', 'drawing_room', 'ballroom', 'master_suite', 'kitchen'];
        if (!indoorRooms.includes(locationId)) return;

        condensationDrops.forEach(d => {
            const cx = d.x * w;
            const cy = d.y * h;
            ctx.fillStyle = `rgba(180, 200, 220, ${d.opacity})`;
            ctx.beginPath();
            ctx.arc(cx, cy, d.size, 0, Math.PI * 2);
            ctx.fill();
            // Small drip trail
            ctx.strokeStyle = `rgba(180, 200, 220, ${d.opacity * 0.5})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx, cy + d.size * 3);
            ctx.stroke();
        });
    }

    // Override renderAllWithGhost to include new features
    const _origRenderAllWithGhost = renderAllWithGhost;
    function renderAllFinal(ctx, w, h, gameTime, locationId, brightness, time) {
        const dt = 0.016;
        update(gameTime, dt);
        updateGhost(gameTime, dt);
        updateRainStreaks(dt);
        updateThunder(dt, gameTime);
        updateFlicker(dt, gameTime);
        updateFogDensity(dt, gameTime, locationId);
        updateCondensation(dt);

        if (Math.abs(shakeX) > 0.1 || Math.abs(shakeY) > 0.1) {
            ctx.save();
            ctx.translate(shakeX, shakeY);
        }

        renderDustMotes(ctx, w, h, brightness);
        renderMoonbeams(ctx, w, h, gameTime, locationId);
        renderCandleGlow(ctx, w, h, locationId);
        renderWindowRainStreaks(ctx, w, h, locationId);
        renderBreathFog(ctx, w, h, locationId, time);
        renderFogDensity(ctx, w, h);
        renderFootstepTrail(ctx, w, h, locationId);
        renderCondensation(ctx, w, h, locationId);
        renderGhost(ctx, w, h);
        renderFlickerOverlay(ctx, w, h, locationId);
        renderThunderFlash(ctx, w, h);
        renderTensionOverlay(ctx, w, h);
        renderPostMurderEffect(ctx, w, h);

        if (Math.abs(shakeX) > 0.1 || Math.abs(shakeY) > 0.1) {
            ctx.restore();
        }
    }

    return {
        init, update, renderAll: renderAllFinal,
        getWindOffset, getRainIntensity,
        getCurtainSway, getCandleBrightness,
        getScreenShake, getTension, isPostMurder,
        getWarningMessage, getNPCIdleOffset,
    };
})();
