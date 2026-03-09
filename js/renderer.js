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

    function init() {
        canvas = document.getElementById('game-canvas');
        ctx = canvas.getContext('2d');
        resize();
        window.addEventListener('resize', resize);
        generateRain();
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
        if (screen === 'title' || screen === 'intro' || screen === 'ending') {
            renderBackground();
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

        // Lightning flash
        if (Math.random() < 0.001) {
            ctx.fillStyle = 'rgba(200, 200, 255, 0.1)';
            ctx.fillRect(0, 0, width, height);
        }

        // Rain
        renderRain(0.5);
    }

    // ── Room Rendering ──
    function renderRoom() {
        const loc = GameData.locations[Engine.state.currentLocation];
        if (!loc) return;
        const colors = loc.color;
        const gameTime = Engine.state.time;
        const tod = GameData.getTimeOfDay(gameTime);

        // Time-based lighting
        const brightness = getTimeBrightness(gameTime);
        const warmth = getTimeWarmth(gameTime);

        // Floor
        const floorGrad = ctx.createLinearGradient(0, height * 0.55, 0, height);
        floorGrad.addColorStop(0, adjustColor(colors.floor, brightness * 0.8));
        floorGrad.addColorStop(1, adjustColor(colors.floor, brightness * 0.5));
        ctx.fillStyle = floorGrad;
        ctx.fillRect(0, height * 0.55, width, height * 0.45);

        // Back wall
        const wallGrad = ctx.createLinearGradient(0, 0, 0, height * 0.55);
        wallGrad.addColorStop(0, adjustColor(colors.bg, brightness * 0.6));
        wallGrad.addColorStop(1, adjustColor(colors.wall, brightness));
        ctx.fillStyle = wallGrad;
        ctx.fillRect(0, 0, width, height * 0.55);

        // Wall/floor dividing line
        ctx.strokeStyle = adjustColor(colors.accent, brightness * 0.5);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, height * 0.55);
        ctx.lineTo(width, height * 0.55);
        ctx.stroke();

        // Wainscoting
        ctx.fillStyle = adjustColor(colors.wall, brightness * 0.7);
        ctx.fillRect(0, height * 0.35, width, height * 0.2);
        ctx.strokeStyle = adjustColor(colors.accent, brightness * 0.3);
        ctx.lineWidth = 1;
        ctx.strokeRect(0, height * 0.35, width, height * 0.2);

        // Room-specific decorations
        renderRoomDetails(loc, brightness, warmth);

        // Window with weather
        if (loc.hasWindow) {
            renderWindow(brightness, gameTime);
        }

        // Fireplace
        if (loc.hasFireplace || loc.ambience === 'fire') {
            renderFireplace(brightness);
        }

        // Ambient lighting
        renderLighting(loc, brightness, warmth, gameTime);

        // Particles
        updateAndRenderParticles();

        // Rain if outdoor or window
        if (loc.ambience === 'garden' || loc.ambience === 'rain') {
            renderRain(0.3);
        }

        // Vignette
        renderVignette();
    }

    function renderRoomDetails(loc, brightness, warmth) {
        const id = Engine.state.currentLocation;

        switch (id) {
            case 'grand_hallway':
                // Chandelier
                drawChandelier(width * 0.5, height * 0.08, brightness);
                // Staircase
                drawStaircase(width * 0.65, height * 0.2, brightness);
                // Grandfather clock
                drawGrandfatherClock(width * 0.15, height * 0.2, brightness);
                // Portraits
                for (let i = 0; i < 4; i++) {
                    drawPortrait(width * (0.25 + i * 0.15), height * 0.12, brightness);
                }
                break;

            case 'library':
                // Bookshelves
                drawBookshelf(width * 0.05, height * 0.05, width * 0.2, height * 0.5, brightness);
                drawBookshelf(width * 0.75, height * 0.05, width * 0.2, height * 0.5, brightness);
                // Desk
                drawDesk(width * 0.4, height * 0.55, brightness);
                break;

            case 'study':
                // Large desk
                drawDesk(width * 0.35, height * 0.55, brightness);
                // Safe (painting)
                drawPainting(width * 0.7, height * 0.15, brightness);
                // Bookshelves
                drawBookshelf(width * 0.05, height * 0.1, width * 0.15, height * 0.4, brightness);
                break;

            case 'dining_room':
                // Long table
                drawDiningTable(width * 0.2, height * 0.55, width * 0.6, brightness);
                // Candelabra
                drawCandelabra(width * 0.5, height * 0.5, brightness);
                break;

            case 'kitchen':
                // Counter
                ctx.fillStyle = adjustColor('#2a2218', brightness);
                ctx.fillRect(width * 0.1, height * 0.55, width * 0.5, height * 0.05);
                // Shelves
                for (let i = 0; i < 3; i++) {
                    ctx.fillStyle = adjustColor('#1a1510', brightness * 0.8);
                    ctx.fillRect(width * 0.15, height * (0.15 + i * 0.12), width * 0.3, height * 0.02);
                }
                break;

            case 'drawing_room':
                // Piano
                drawPiano(width * 0.6, height * 0.4, brightness);
                // Sofa
                ctx.fillStyle = adjustColor('#2a1a2a', brightness);
                ctx.fillRect(width * 0.15, height * 0.6, width * 0.25, height * 0.08);
                break;

            case 'ballroom':
                // Chandelier (large)
                drawChandelier(width * 0.5, height * 0.05, brightness);
                drawChandelier(width * 0.3, height * 0.08, brightness * 0.7);
                drawChandelier(width * 0.7, height * 0.08, brightness * 0.7);
                break;

            case 'garden':
                // Trees/hedges
                for (let i = 0; i < 5; i++) {
                    drawTree(width * (0.1 + i * 0.2), height * 0.25, brightness);
                }
                // Greenhouse glow
                ctx.fillStyle = `rgba(100, 180, 100, ${0.05 * brightness})`;
                ctx.fillRect(width * 0.65, height * 0.3, width * 0.2, height * 0.2);
                break;

            case 'master_suite':
                // Bed
                ctx.fillStyle = adjustColor('#2a1a20', brightness);
                ctx.fillRect(width * 0.3, height * 0.55, width * 0.35, height * 0.12);
                ctx.fillStyle = adjustColor('#1a1015', brightness);
                ctx.fillRect(width * 0.3, height * 0.53, width * 0.35, height * 0.04);
                // Vanity
                ctx.fillStyle = adjustColor('#2a2030', brightness);
                ctx.fillRect(width * 0.1, height * 0.55, width * 0.12, height * 0.08);
                break;

            case 'wine_cellar':
                // Arches
                for (let i = 0; i < 3; i++) {
                    drawArch(width * (0.2 + i * 0.25), height * 0.1, brightness);
                }
                // Wine racks
                for (let i = 0; i < 4; i++) {
                    ctx.fillStyle = adjustColor('#1a1510', brightness * 0.6);
                    ctx.fillRect(width * (0.1 + i * 0.22), height * 0.3, width * 0.08, height * 0.35);
                }
                break;

            case 'tower':
                // Circular room feel
                ctx.strokeStyle = adjustColor('#15152a', brightness);
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(width * 0.5, height * 0.4, width * 0.3, 0, Math.PI, true);
                ctx.stroke();
                // Ancient clock (center)
                drawAncientClock(width * 0.5, height * 0.3, brightness);
                // Telescope
                drawTelescope(width * 0.75, height * 0.35, brightness);
                break;

            case 'your_room':
                // Bed
                ctx.fillStyle = adjustColor('#2a2030', brightness);
                ctx.fillRect(width * 0.55, height * 0.55, width * 0.3, height * 0.1);
                // Nightstand
                ctx.fillStyle = adjustColor('#1a1510', brightness);
                ctx.fillRect(width * 0.5, height * 0.58, width * 0.06, height * 0.06);
                // Lamp glow
                ctx.fillStyle = 'rgba(212, 160, 32, 0.1)';
                ctx.beginPath();
                ctx.arc(width * 0.53, height * 0.55, 40, 0, Math.PI * 2);
                ctx.fill();
                break;
        }
    }

    // ── Drawing Helpers ──
    function drawChandelier(x, y, b) {
        ctx.strokeStyle = adjustColor('#8b6914', b);
        ctx.lineWidth = 2;
        // Chain
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, y);
        ctx.stroke();
        // Base
        ctx.fillStyle = adjustColor('#8b6914', b);
        ctx.fillRect(x - 30, y, 60, 8);
        // Candle glow
        for (let i = -2; i <= 2; i++) {
            ctx.fillStyle = `rgba(255, 200, 100, ${0.15 * b})`;
            ctx.beginPath();
            ctx.arc(x + i * 14, y - 5, 8, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function drawStaircase(x, y, b) {
        ctx.fillStyle = adjustColor('#1a1510', b);
        for (let i = 0; i < 8; i++) {
            ctx.fillRect(x + i * 8, y + height * 0.35 - i * 15, width * 0.15, 12);
        }
        // Railing
        ctx.strokeStyle = adjustColor('#8b6914', b * 0.6);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y + height * 0.35);
        ctx.lineTo(x + 64, y + height * 0.35 - 120);
        ctx.stroke();
    }

    function drawGrandfatherClock(x, y, b) {
        ctx.fillStyle = adjustColor('#2a1a0a', b);
        ctx.fillRect(x, y, 40, height * 0.35);
        // Clock face
        ctx.fillStyle = adjustColor('#d4d0c0', b * 0.5);
        ctx.beginPath();
        ctx.arc(x + 20, y + 30, 15, 0, Math.PI * 2);
        ctx.fill();
        // Pendulum
        const swing = Math.sin(time * 2) * 8;
        ctx.strokeStyle = adjustColor('#8b6914', b);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + 20, y + 50);
        ctx.lineTo(x + 20 + swing, y + 90);
        ctx.stroke();
        ctx.fillStyle = adjustColor('#8b6914', b);
        ctx.beginPath();
        ctx.arc(x + 20 + swing, y + 90, 5, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawPortrait(x, y, b) {
        ctx.fillStyle = adjustColor('#2a1a0a', b * 0.8);
        ctx.fillRect(x - 20, y - 15, 40, 50);
        ctx.strokeStyle = adjustColor('#8b6914', b * 0.5);
        ctx.lineWidth = 2;
        ctx.strokeRect(x - 22, y - 17, 44, 54);
        // Face suggestion
        ctx.fillStyle = adjustColor('#665544', b * 0.4);
        ctx.beginPath();
        ctx.arc(x, y + 5, 8, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawBookshelf(x, y, w, h, b) {
        ctx.fillStyle = adjustColor('#2a1a0a', b * 0.8);
        ctx.fillRect(x, y, w, h);
        // Shelves
        const shelfCount = Math.floor(h / 30);
        for (let i = 0; i < shelfCount; i++) {
            const sy = y + i * (h / shelfCount);
            ctx.fillStyle = adjustColor('#1a1510', b);
            ctx.fillRect(x, sy, w, 3);
            // Books
            for (let j = 0; j < 6; j++) {
                const bookH = 15 + Math.random() * 10;
                const bookW = 4 + Math.random() * 4;
                const colors = ['#8b0000', '#003366', '#2a4a2a', '#4a3a2a', '#2a2a4a', '#4a2a00'];
                ctx.fillStyle = adjustColor(colors[j % colors.length], b * 0.6);
                ctx.fillRect(x + 4 + j * (w / 7), sy + (h / shelfCount) - bookH - 3, bookW, bookH);
            }
        }
    }

    function drawDesk(x, y, b) {
        ctx.fillStyle = adjustColor('#2a1a0a', b);
        ctx.fillRect(x, y, width * 0.25, height * 0.04);
        // Legs
        ctx.fillRect(x + 5, y + height * 0.04, 5, height * 0.08);
        ctx.fillRect(x + width * 0.25 - 10, y + height * 0.04, 5, height * 0.08);
        // Lamp on desk
        ctx.fillStyle = `rgba(212, 160, 32, ${0.15 * b})`;
        ctx.beginPath();
        ctx.arc(x + width * 0.2, y - 10, 25, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawPainting(x, y, b) {
        ctx.fillStyle = adjustColor('#1a1a2a', b * 0.5);
        ctx.fillRect(x, y, 60, 45);
        ctx.strokeStyle = adjustColor('#8b6914', b * 0.6);
        ctx.lineWidth = 3;
        ctx.strokeRect(x - 2, y - 2, 64, 49);
    }

    function drawDiningTable(x, y, w, b) {
        ctx.fillStyle = adjustColor('#2a1a0a', b);
        ctx.fillRect(x, y, w, height * 0.03);
        // Legs
        ctx.fillRect(x + 10, y + height * 0.03, 5, height * 0.08);
        ctx.fillRect(x + w - 15, y + height * 0.03, 5, height * 0.08);
        // Table cloth edges
        ctx.fillStyle = adjustColor('#ffffff', b * 0.1);
        ctx.fillRect(x - 5, y - 2, w + 10, 4);
    }

    function drawCandelabra(x, y, b) {
        ctx.fillStyle = adjustColor('#8b6914', b);
        ctx.fillRect(x - 2, y, 4, 20);
        ctx.fillRect(x - 12, y - 5, 24, 3);
        // Flames
        for (let i = -1; i <= 1; i++) {
            ctx.fillStyle = `rgba(255, 200, 100, ${0.3 * b})`;
            ctx.beginPath();
            ctx.arc(x + i * 10, y - 10, 5, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function drawPiano(x, y, b) {
        ctx.fillStyle = adjustColor('#0a0a0a', b);
        ctx.fillRect(x, y, width * 0.2, height * 0.12);
        // Keys
        ctx.fillStyle = adjustColor('#d4d0c0', b * 0.3);
        ctx.fillRect(x + 5, y + height * 0.08, width * 0.19, height * 0.03);
        // Black keys
        for (let i = 0; i < 6; i++) {
            ctx.fillStyle = adjustColor('#0a0a0a', b);
            ctx.fillRect(x + 10 + i * 18, y + height * 0.08, 8, height * 0.02);
        }
    }

    function drawTree(x, y, b) {
        // Trunk
        ctx.fillStyle = adjustColor('#1a1510', b * 0.5);
        ctx.fillRect(x - 3, y + 20, 6, 30);
        // Canopy (dark, winter)
        ctx.fillStyle = adjustColor('#0a1a0a', b * 0.6);
        ctx.beginPath();
        ctx.arc(x, y + 10, 20, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawArch(x, y, b) {
        ctx.strokeStyle = adjustColor('#2a2018', b * 0.7);
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(x, y + height * 0.25, width * 0.1, Math.PI, 0);
        ctx.stroke();
    }

    function drawAncientClock(x, y, b) {
        // Mysterious glow
        ctx.fillStyle = `rgba(68, 136, 204, ${0.1 + Math.sin(time * 2) * 0.05})`;
        ctx.beginPath();
        ctx.arc(x, y, 60, 0, Math.PI * 2);
        ctx.fill();

        // Clock body
        ctx.fillStyle = adjustColor('#2a2a40', b);
        ctx.beginPath();
        ctx.arc(x, y, 40, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = adjustColor('#4488cc', b);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, 40, 0, Math.PI * 2);
        ctx.stroke();

        // Symbols
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
            const sx = x + Math.cos(angle) * 32;
            const sy = y + Math.sin(angle) * 32;
            ctx.fillStyle = `rgba(68, 136, 204, ${0.5 + Math.sin(time + i) * 0.3})`;
            ctx.beginPath();
            ctx.arc(sx, sy, 3, 0, Math.PI * 2);
            ctx.fill();
        }

        // Rotating hands
        const handAngle = time * 0.5;
        ctx.strokeStyle = adjustColor('#4488cc', b);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(handAngle) * 25, y + Math.sin(handAngle) * 25);
        ctx.stroke();
    }

    function drawTelescope(x, y, b) {
        ctx.fillStyle = adjustColor('#555566', b);
        // Stand
        ctx.fillRect(x, y + 20, 4, 30);
        ctx.fillRect(x - 10, y + 48, 24, 4);
        // Tube
        ctx.save();
        ctx.translate(x + 2, y + 20);
        ctx.rotate(-0.4);
        ctx.fillRect(-3, -30, 6, 35);
        ctx.restore();
    }

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

    function renderWindow(brightness, gameTime) {
        const wx = width * 0.85;
        const wy = height * 0.1;
        const ww = 60;
        const wh = 80;

        // Window frame
        ctx.fillStyle = adjustColor('#1a1510', brightness);
        ctx.fillRect(wx - 3, wy - 3, ww + 6, wh + 6);

        // Sky through window (time-based)
        const tod = GameData.getTimeOfDay(gameTime);
        let skyColor;
        switch (tod) {
            case 'early_morning': skyColor = '#0a0a20'; break;
            case 'morning': skyColor = '#1a2040'; break;
            case 'late_morning': skyColor = '#2a3050'; break;
            case 'afternoon': skyColor = '#3a4060'; break;
            case 'late_afternoon': skyColor = '#2a2540'; break;
            case 'evening': skyColor = '#1a1530'; break;
            default: skyColor = '#0a0a15'; break;
        }
        ctx.fillStyle = skyColor;
        ctx.fillRect(wx, wy, ww, wh);

        // Rain on window
        ctx.strokeStyle = 'rgba(150, 170, 200, 0.3)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 8; i++) {
            const rx = wx + Math.random() * ww;
            const ry = wy + ((time * 50 + i * 40) % wh);
            ctx.beginPath();
            ctx.moveTo(rx, ry);
            ctx.lineTo(rx - 1, ry + 8);
            ctx.stroke();
        }

        // Window cross
        ctx.fillStyle = adjustColor('#1a1510', brightness);
        ctx.fillRect(wx + ww / 2 - 1.5, wy, 3, wh);
        ctx.fillRect(wx, wy + wh / 2 - 1.5, ww, 3);

        // Faint light spill from window
        const grad = ctx.createRadialGradient(wx + ww / 2, wy + wh / 2, 0, wx + ww / 2, wy + wh / 2, 100);
        grad.addColorStop(0, 'rgba(150, 170, 200, 0.03)');
        grad.addColorStop(1, 'rgba(150, 170, 200, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(wx - 50, wy - 30, ww + 100, wh + 60);
    }

    function renderFireplace(brightness) {
        const fx = width * 0.45;
        const fy = height * 0.35;
        const fw = 60;
        const fh = 50;

        // Fireplace frame
        ctx.fillStyle = adjustColor('#333333', brightness);
        ctx.fillRect(fx - 10, fy - 10, fw + 20, fh + 10);

        // Fire
        ctx.fillStyle = '#1a0a00';
        ctx.fillRect(fx, fy, fw, fh);

        // Animated flames
        for (let i = 0; i < 5; i++) {
            const flameX = fx + 10 + i * 10;
            const flameH = 15 + Math.sin(time * 5 + i * 2) * 8;
            const grad = ctx.createLinearGradient(flameX, fy + fh, flameX, fy + fh - flameH);
            grad.addColorStop(0, 'rgba(255, 100, 20, 0.8)');
            grad.addColorStop(0.5, 'rgba(255, 200, 50, 0.6)');
            grad.addColorStop(1, 'rgba(255, 255, 100, 0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.ellipse(flameX, fy + fh, 6, flameH, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // Warm glow
        const glowGrad = ctx.createRadialGradient(fx + fw / 2, fy + fh / 2, 0, fx + fw / 2, fy + fh / 2, 150);
        glowGrad.addColorStop(0, 'rgba(255, 150, 50, 0.06)');
        glowGrad.addColorStop(1, 'rgba(255, 150, 50, 0)');
        ctx.fillStyle = glowGrad;
        ctx.fillRect(fx - 120, fy - 80, fw + 240, fh + 160);
    }

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

    // ── NPC Portrait ──
    function drawPortraitOnCanvas(npcId, targetCanvas) {
        const c = targetCanvas.getContext('2d');
        const w = targetCanvas.width;
        const h = targetCanvas.height;
        const npc = GameData.npcs[npcId];
        if (!npc) return;

        c.fillStyle = '#0d0d1a';
        c.fillRect(0, 0, w, h);

        // Face
        c.fillStyle = '#c4a882';
        c.beginPath();
        c.ellipse(w / 2, h * 0.4, w * 0.25, h * 0.3, 0, 0, Math.PI * 2);
        c.fill();

        // Hair
        c.fillStyle = npc.color;
        c.beginPath();
        c.ellipse(w / 2, h * 0.25, w * 0.28, h * 0.2, 0, 0, Math.PI);
        c.fill();

        // Eyes
        c.fillStyle = '#1a1a2a';
        c.fillRect(w * 0.35, h * 0.38, w * 0.08, h * 0.04);
        c.fillRect(w * 0.57, h * 0.38, w * 0.08, h * 0.04);

        // Mouth
        c.strokeStyle = '#8a6a52';
        c.lineWidth = 1;
        c.beginPath();
        c.arc(w / 2, h * 0.52, w * 0.08, 0.1, Math.PI - 0.1);
        c.stroke();

        // Clothes
        c.fillStyle = npc.color;
        c.fillRect(w * 0.2, h * 0.68, w * 0.6, h * 0.32);

        // Border
        c.strokeStyle = '#d4a020';
        c.lineWidth = 2;
        c.strokeRect(1, 1, w - 2, h - 2);
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

    return {
        init, startLoop, stopLoop, render,
        drawPortraitOnCanvas, renderMinimap,
        adjustColor,
    };
})();
