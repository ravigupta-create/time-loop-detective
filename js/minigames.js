/* ═══════════════════════════════════════════════════════
   MINIGAMES — Interactive puzzles: safe cracking,
   lock picking, secret passage discovery
   ═══════════════════════════════════════════════════════ */

const MiniGames = (() => {
    let active = null;     // current minigame type
    let mgState = {};      // minigame-specific state
    let onComplete = null; // callback when solved
    let canvas, ctx;
    let mgW, mgH;

    function init() {
        // Use main game canvas — minigames render as overlay
    }

    // ══════════════════════════════════════════════════
    // SAFE CRACKING
    // ══════════════════════════════════════════════════
    function startSafeCracking(callback) {
        active = 'safe';
        onComplete = callback;
        mgState = {
            code: [1, 8, 8, 7],       // correct combination
            currentDigit: 0,           // which digit we're entering (0-3)
            dialAngle: 0,              // current dial rotation (degrees)
            dialSpeed: 0,              // rotation speed
            spinning: false,           // is dial spinning?
            enteredDigits: [],         // digits entered so far
            feedback: '',              // feedback message
            feedbackTimer: 0,
            solved: false,
            failed: false,
            tickSounds: 0,
            hintShown: false,
            notchAngles: [],           // visual notch positions
            glowPulse: 0,
        };
        // Generate notch angles for dial markings (0-9)
        for (let i = 0; i < 10; i++) {
            mgState.notchAngles.push(i * 36); // 360/10 = 36 degrees per number
        }
        Engine.state.screen = 'minigame';
        Audio.playSound('click');
    }

    function updateSafe(dt) {
        const s = mgState;
        s.glowPulse += dt * 2;

        // Dial rotation
        if (s.spinning) {
            s.dialAngle += s.dialSpeed * dt;
            s.dialSpeed *= 0.98; // friction
            if (Math.abs(s.dialSpeed) < 5) {
                s.spinning = false;
                s.dialSpeed = 0;
                // Snap to nearest number
                const snapAngle = Math.round(s.dialAngle / 36) * 36;
                s.dialAngle = snapAngle;
                const selectedNum = ((Math.round(snapAngle / 36) % 10) + 10) % 10;
                tryDigit(selectedNum);
            }
            // Tick sound at each notch
            const currentNotch = Math.floor(s.dialAngle / 36);
            if (currentNotch !== s.tickSounds) {
                s.tickSounds = currentNotch;
                Audio.playSound('click');
            }
        }

        if (s.feedbackTimer > 0) {
            s.feedbackTimer -= dt;
            if (s.feedbackTimer <= 0) s.feedback = '';
        }
    }

    function tryDigit(num) {
        const s = mgState;
        const expected = s.code[s.currentDigit];

        if (num === expected) {
            s.enteredDigits.push(num);
            s.currentDigit++;
            s.feedback = `Click! (${s.currentDigit}/4)`;
            s.feedbackTimer = 2;
            Audio.playSound('evidence');

            if (s.currentDigit >= 4) {
                s.solved = true;
                s.feedback = 'The safe opens!';
                setTimeout(() => {
                    closeMiniGame();
                    if (onComplete) onComplete(true);
                }, 1500);
            }
        } else {
            // Wrong — reset
            s.enteredDigits = [];
            s.currentDigit = 0;
            s.feedback = 'Wrong combination...';
            s.feedbackTimer = 2;
            Audio.playSound('click');
        }
    }

    function renderSafe(mainCtx, w, h) {
        const s = mgState;
        mgW = w; mgH = h;

        // Darken background
        mainCtx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        mainCtx.fillRect(0, 0, w, h);

        // Safe body
        const safeW = Math.min(400, w * 0.5);
        const safeH = Math.min(350, h * 0.6);
        const sx = (w - safeW) / 2;
        const sy = (h - safeH) / 2;

        // Safe exterior
        mainCtx.fillStyle = '#2a2a2a';
        mainCtx.fillRect(sx, sy, safeW, safeH);
        mainCtx.strokeStyle = '#555';
        mainCtx.lineWidth = 3;
        mainCtx.strokeRect(sx + 3, sy + 3, safeW - 6, safeH - 6);

        // Rivets
        const rivetPositions = [
            [sx + 15, sy + 15], [sx + safeW - 15, sy + 15],
            [sx + 15, sy + safeH - 15], [sx + safeW - 15, sy + safeH - 15],
        ];
        rivetPositions.forEach(([rx, ry]) => {
            mainCtx.fillStyle = '#666';
            mainCtx.beginPath();
            mainCtx.arc(rx, ry, 5, 0, Math.PI * 2);
            mainCtx.fill();
            mainCtx.fillStyle = '#444';
            mainCtx.beginPath();
            mainCtx.arc(rx, ry, 3, 0, Math.PI * 2);
            mainCtx.fill();
        });

        // Dial center
        const dialX = sx + safeW / 2;
        const dialY = sy + safeH * 0.45;
        const dialR = Math.min(80, safeW * 0.2);

        // Dial background ring
        mainCtx.beginPath();
        mainCtx.arc(dialX, dialY, dialR + 8, 0, Math.PI * 2);
        mainCtx.fillStyle = '#1a1a1a';
        mainCtx.fill();
        mainCtx.strokeStyle = '#888';
        mainCtx.lineWidth = 2;
        mainCtx.stroke();

        // Dial face
        const dialGrad = mainCtx.createRadialGradient(dialX, dialY, 0, dialX, dialY, dialR);
        dialGrad.addColorStop(0, '#444');
        dialGrad.addColorStop(1, '#222');
        mainCtx.beginPath();
        mainCtx.arc(dialX, dialY, dialR, 0, Math.PI * 2);
        mainCtx.fillStyle = dialGrad;
        mainCtx.fill();

        // Number markings
        mainCtx.font = `${Math.floor(dialR * 0.3)}px monospace`;
        mainCtx.textAlign = 'center';
        mainCtx.textBaseline = 'middle';

        for (let i = 0; i < 10; i++) {
            const angle = (i * 36 - 90 + s.dialAngle) * Math.PI / 180;
            const nx = dialX + Math.cos(angle) * (dialR * 0.72);
            const ny = dialY + Math.sin(angle) * (dialR * 0.72);

            // Highlight current top number
            const isTop = Math.abs(((i * 36 + s.dialAngle) % 360 + 360) % 360 - 0) < 18 ||
                           Math.abs(((i * 36 + s.dialAngle) % 360 + 360) % 360 - 360) < 18;

            mainCtx.fillStyle = isTop ? '#d4a020' : '#aaa';
            mainCtx.fillText(String(i), nx, ny);

            // Tick marks
            const tickAngle = (i * 36 - 90 + s.dialAngle) * Math.PI / 180;
            const t1x = dialX + Math.cos(tickAngle) * (dialR * 0.9);
            const t1y = dialY + Math.sin(tickAngle) * (dialR * 0.9);
            const t2x = dialX + Math.cos(tickAngle) * dialR;
            const t2y = dialY + Math.sin(tickAngle) * dialR;
            mainCtx.strokeStyle = isTop ? '#d4a020' : '#666';
            mainCtx.lineWidth = isTop ? 2 : 1;
            mainCtx.beginPath();
            mainCtx.moveTo(t1x, t1y);
            mainCtx.lineTo(t2x, t2y);
            mainCtx.stroke();
        }

        // Center knob
        mainCtx.beginPath();
        mainCtx.arc(dialX, dialY, dialR * 0.2, 0, Math.PI * 2);
        mainCtx.fillStyle = '#666';
        mainCtx.fill();

        // Top indicator arrow
        mainCtx.fillStyle = '#d4a020';
        mainCtx.beginPath();
        mainCtx.moveTo(dialX, dialY - dialR - 12);
        mainCtx.lineTo(dialX - 6, dialY - dialR - 2);
        mainCtx.lineTo(dialX + 6, dialY - dialR - 2);
        mainCtx.closePath();
        mainCtx.fill();

        // Progress dots
        for (let i = 0; i < 4; i++) {
            const dotX = sx + safeW * 0.3 + i * (safeW * 0.1);
            const dotY = sy + safeH * 0.8;
            mainCtx.beginPath();
            mainCtx.arc(dotX, dotY, 8, 0, Math.PI * 2);
            if (i < s.enteredDigits.length) {
                mainCtx.fillStyle = '#d4a020';
            } else if (i === s.currentDigit) {
                const glow = Math.sin(s.glowPulse) * 0.3 + 0.7;
                mainCtx.fillStyle = `rgba(212, 160, 32, ${glow})`;
            } else {
                mainCtx.fillStyle = '#333';
            }
            mainCtx.fill();
            mainCtx.strokeStyle = '#555';
            mainCtx.lineWidth = 1;
            mainCtx.stroke();
        }

        // Feedback text
        if (s.feedback) {
            mainCtx.font = '16px monospace';
            mainCtx.fillStyle = s.solved ? '#4a4' : '#d4a020';
            mainCtx.textAlign = 'center';
            mainCtx.fillText(s.feedback, w / 2, sy + safeH + 30);
        }

        // Instructions
        mainCtx.font = '13px monospace';
        mainCtx.fillStyle = '#6a6a80';
        mainCtx.textAlign = 'center';
        mainCtx.fillText('Click and drag to spin the dial — stop on each digit', w / 2, sy - 20);

        if (Engine.state.flags.knows_safe_code && !s.hintShown) {
            mainCtx.fillStyle = '#d4a020';
            mainCtx.fillText('You know the combination: 1-8-8-7', w / 2, sy - 40);
        }

        // Close button
        mainCtx.fillStyle = '#6a6a80';
        mainCtx.fillText('Press ESC to cancel', w / 2, sy + safeH + 55);
    }

    // ══════════════════════════════════════════════════
    // LOCK PICKING
    // ══════════════════════════════════════════════════
    function startLockPicking(callback) {
        active = 'lockpick';
        onComplete = callback;
        mgState = {
            pins: [],
            numPins: 4,
            currentPin: 0,
            tensionAngle: 0,     // tension wrench rotation (0-90)
            pickY: 0,            // pick vertical position
            solved: false,
            failed: false,
            feedback: '',
            feedbackTimer: 0,
            shakeTimer: 0,
            attempts: 0,
        };
        // Generate random pin heights (sweet spots)
        for (let i = 0; i < mgState.numPins; i++) {
            mgState.pins.push({
                height: 0.3 + Math.random() * 0.4,  // sweet spot (normalized 0-1)
                tolerance: 0.08 + Math.random() * 0.04,
                set: false,
                springY: 0,      // current spring position
            });
        }
        Engine.state.screen = 'minigame';
        Audio.playSound('click');
    }

    function updateLockPick(dt) {
        const s = mgState;
        if (s.shakeTimer > 0) {
            s.shakeTimer -= dt;
        }
        if (s.feedbackTimer > 0) {
            s.feedbackTimer -= dt;
            if (s.feedbackTimer <= 0) s.feedback = '';
        }
        // Spring physics on pins
        s.pins.forEach(pin => {
            if (!pin.set) {
                pin.springY += (0 - pin.springY) * 0.1;
            }
        });
    }

    function renderLockPick(mainCtx, w, h) {
        const s = mgState;
        mgW = w; mgH = h;

        mainCtx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        mainCtx.fillRect(0, 0, w, h);

        const lockW = Math.min(350, w * 0.45);
        const lockH = Math.min(200, h * 0.35);
        const lx = (w - lockW) / 2;
        const ly = (h - lockH) / 2;

        // Lock body
        mainCtx.fillStyle = '#3a3520';
        mainCtx.fillRect(lx, ly, lockW, lockH);
        mainCtx.strokeStyle = '#655830';
        mainCtx.lineWidth = 2;
        mainCtx.strokeRect(lx, ly, lockW, lockH);

        // Keyhole (bottom)
        mainCtx.fillStyle = '#1a1510';
        mainCtx.beginPath();
        mainCtx.arc(lx + lockW / 2, ly + lockH - 25, 12, 0, Math.PI * 2);
        mainCtx.fill();
        mainCtx.fillRect(lx + lockW / 2 - 3, ly + lockH - 25, 6, 20);

        // Pin chambers
        const pinSpacing = lockW / (s.numPins + 1);
        for (let i = 0; i < s.numPins; i++) {
            const pin = s.pins[i];
            const px = lx + pinSpacing * (i + 1);
            const chamberTop = ly + 15;
            const chamberH = lockH * 0.5;

            // Chamber slot
            mainCtx.fillStyle = '#1a1510';
            mainCtx.fillRect(px - 8, chamberTop, 16, chamberH);

            // Pin (colored based on state)
            const pinTop = chamberTop + chamberH * (1 - pin.height) + pin.springY * chamberH;
            if (pin.set) {
                mainCtx.fillStyle = '#4a4';
            } else if (i === s.currentPin) {
                mainCtx.fillStyle = '#d4a020';
            } else {
                mainCtx.fillStyle = '#888';
            }
            mainCtx.fillRect(px - 5, pinTop, 10, chamberH * pin.height);

            // Shear line indicator
            const shearY = chamberTop + chamberH * (1 - pin.height);
            mainCtx.strokeStyle = 'rgba(212, 160, 32, 0.3)';
            mainCtx.lineWidth = 1;
            mainCtx.setLineDash([3, 3]);
            mainCtx.beginPath();
            mainCtx.moveTo(px - 10, shearY);
            mainCtx.lineTo(px + 10, shearY);
            mainCtx.stroke();
            mainCtx.setLineDash([]);

            // Pin number
            mainCtx.font = '10px monospace';
            mainCtx.fillStyle = '#6a6a80';
            mainCtx.textAlign = 'center';
            mainCtx.fillText(String(i + 1), px, chamberTop - 5);
        }

        // Pick position indicator
        const currentPinX = lx + pinSpacing * (s.currentPin + 1);
        mainCtx.strokeStyle = '#d4a020';
        mainCtx.lineWidth = 2;
        mainCtx.beginPath();
        mainCtx.moveTo(currentPinX, ly + lockH + 5);
        mainCtx.lineTo(currentPinX, ly + lockH + 15);
        mainCtx.stroke();
        mainCtx.fillStyle = '#d4a020';
        mainCtx.beginPath();
        mainCtx.moveTo(currentPinX, ly + lockH + 5);
        mainCtx.lineTo(currentPinX - 4, ly + lockH + 12);
        mainCtx.lineTo(currentPinX + 4, ly + lockH + 12);
        mainCtx.closePath();
        mainCtx.fill();

        // Feedback
        if (s.feedback) {
            mainCtx.font = '14px monospace';
            mainCtx.fillStyle = s.solved ? '#4a4' : '#d4a020';
            mainCtx.textAlign = 'center';
            mainCtx.fillText(s.feedback, w / 2, ly + lockH + 40);
        }

        // Instructions
        mainCtx.font = '13px monospace';
        mainCtx.fillStyle = '#6a6a80';
        mainCtx.textAlign = 'center';
        mainCtx.fillText('Click to push pin up — find the sweet spot!', w / 2, ly - 15);
        mainCtx.fillText(`Pin ${s.currentPin + 1} of ${s.numPins}`, w / 2, ly - 35);
        mainCtx.fillStyle = '#555';
        mainCtx.fillText('Press ESC to cancel', w / 2, ly + lockH + 60);
    }

    // ══════════════════════════════════════════════════
    // BOOKSHELF SECRET PASSAGE
    // ══════════════════════════════════════════════════
    function startBookshelfPuzzle(callback) {
        active = 'bookshelf';
        onComplete = callback;
        mgState = {
            books: [],
            correctSequence: [2, 5, 1],  // indices of books to pull
            currentStep: 0,
            pullAnimation: -1,
            pullProgress: 0,
            solved: false,
            feedback: '',
            feedbackTimer: 0,
            shelfShake: 0,
        };
        // Generate bookshelf
        const colors = ['#8b4513', '#654321', '#2f1b0e', '#4a3728', '#3c1518',
                        '#1b4332', '#1d3557', '#582f0e'];
        for (let i = 0; i < 8; i++) {
            mgState.books.push({
                color: colors[i],
                height: 0.7 + Math.random() * 0.3,
                width: 0.8 + Math.random() * 0.4,
                pulled: false,
                isCorrect: [2, 5, 1].includes(i),
                label: ['Histories', 'Botany', 'Poisons', 'Poetry', 'Law',
                        'Alchemy', 'Letters', 'Maps'][i],
            });
        }
        Engine.state.screen = 'minigame';
        Audio.playSound('click');
    }

    function updateBookshelf(dt) {
        const s = mgState;
        if (s.pullAnimation >= 0) {
            s.pullProgress += dt * 3;
            if (s.pullProgress >= 1) {
                s.pullProgress = 0;
                s.pullAnimation = -1;
            }
        }
        if (s.shelfShake > 0) {
            s.shelfShake -= dt * 2;
        }
        if (s.feedbackTimer > 0) {
            s.feedbackTimer -= dt;
            if (s.feedbackTimer <= 0) s.feedback = '';
        }
    }

    function renderBookshelf(mainCtx, w, h) {
        const s = mgState;
        mgW = w; mgH = h;

        mainCtx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        mainCtx.fillRect(0, 0, w, h);

        const shelfW = Math.min(500, w * 0.6);
        const shelfH = Math.min(250, h * 0.4);
        const sx = (w - shelfW) / 2 + (s.shelfShake > 0 ? (Math.random() - 0.5) * s.shelfShake * 4 : 0);
        const sy = (h - shelfH) / 2;

        // Bookshelf frame
        mainCtx.fillStyle = '#3a2810';
        mainCtx.fillRect(sx - 10, sy - 10, shelfW + 20, shelfH + 20);
        mainCtx.strokeStyle = '#5a4020';
        mainCtx.lineWidth = 3;
        mainCtx.strokeRect(sx - 10, sy - 10, shelfW + 20, shelfH + 20);

        // Shelf backing
        mainCtx.fillStyle = '#1a1008';
        mainCtx.fillRect(sx, sy, shelfW, shelfH);

        // Shelf board
        mainCtx.fillStyle = '#4a3520';
        mainCtx.fillRect(sx, sy + shelfH - 5, shelfW, 8);

        // Books
        const bookW = shelfW / s.books.length;
        s.books.forEach((book, i) => {
            const bx = sx + i * bookW + 3;
            const bw = bookW * book.width - 6;
            const bh = shelfH * book.height - 10;
            const by = sy + shelfH - bh - 8;

            let pullOffset = 0;
            if (s.pullAnimation === i) {
                pullOffset = Math.sin(s.pullProgress * Math.PI) * 20;
            }
            if (book.pulled) {
                pullOffset = 15;
            }

            // Book body
            mainCtx.fillStyle = book.color;
            mainCtx.fillRect(bx, by - pullOffset, bw, bh);

            // Book spine detail
            mainCtx.strokeStyle = 'rgba(255,255,255,0.1)';
            mainCtx.lineWidth = 1;
            mainCtx.strokeRect(bx + 2, by + 5 - pullOffset, bw - 4, bh - 10);

            // Book title (vertical)
            mainCtx.save();
            mainCtx.translate(bx + bw / 2, by + bh / 2 - pullOffset);
            mainCtx.rotate(-Math.PI / 2);
            mainCtx.font = '9px monospace';
            mainCtx.fillStyle = 'rgba(255,220,180,0.6)';
            mainCtx.textAlign = 'center';
            mainCtx.fillText(book.label, 0, 3);
            mainCtx.restore();

            // Highlight correct books with subtle shimmer (if player has examined 3x)
            if (book.isCorrect && Engine.state.bookshelfExamineCount >= 2) {
                const shimmer = Math.sin(Date.now() * 0.003 + i) * 0.1 + 0.1;
                mainCtx.fillStyle = `rgba(212, 160, 32, ${shimmer})`;
                mainCtx.fillRect(bx, by - pullOffset, bw, bh);
            }
        });

        // Feedback
        if (s.feedback) {
            mainCtx.font = '14px monospace';
            mainCtx.fillStyle = s.solved ? '#4a4' : '#d4a020';
            mainCtx.textAlign = 'center';
            mainCtx.fillText(s.feedback, w / 2, sy + shelfH + 40);
        }

        // Instructions
        mainCtx.font = '13px monospace';
        mainCtx.fillStyle = '#6a6a80';
        mainCtx.textAlign = 'center';
        mainCtx.fillText('Click the right books in the right order to open the passage', w / 2, sy - 25);
        mainCtx.fillText(`Step ${s.currentStep + 1} of ${s.correctSequence.length}`, w / 2, sy - 45);
        mainCtx.fillStyle = '#555';
        mainCtx.fillText('Press ESC to cancel', w / 2, sy + shelfH + 60);
    }

    // ══════════════════════════════════════════════════
    // CIPHER DECODING
    // ══════════════════════════════════════════════════
    function startCipherDecoding(callback) {
        active = 'cipher';
        onComplete = callback;
        // Caesar cipher with shift 3: "THEY WILL KILL AT MIDNIGHT"
        const plaintext = 'THEY WILL KILL AT MIDNIGHT';
        const ciphertext = 'WKHB ZLOO NLOO DW PLGQLJKW';
        mgState = {
            ciphertext,
            plaintext,
            shift: 3,
            currentShift: 0,     // player's current guess
            decoded: '',
            solved: false,
            feedback: '',
            feedbackTimer: 0,
            hintShown: false,
            wheelAngle: 0,
            glowPulse: 0,
        };
        mgState.decoded = decodeCaesar(ciphertext, mgState.currentShift);
        Engine.state.screen = 'minigame';
        Audio.playSound('click');
    }

    function decodeCaesar(text, shift) {
        return text.split('').map(c => {
            if (c >= 'A' && c <= 'Z') {
                const code = ((c.charCodeAt(0) - 65 - shift + 26) % 26) + 65;
                return String.fromCharCode(code);
            }
            return c;
        }).join('');
    }

    function updateCipher(dt) {
        const s = mgState;
        s.glowPulse += dt * 2;
        if (s.feedbackTimer > 0) {
            s.feedbackTimer -= dt;
            if (s.feedbackTimer <= 0) s.feedback = '';
        }
    }

    function renderCipher(mainCtx, w, h) {
        const s = mgState;
        mgW = w; mgH = h;

        mainCtx.fillStyle = 'rgba(0, 0, 0, 0.90)';
        mainCtx.fillRect(0, 0, w, h);

        const panelW = Math.min(550, w * 0.65);
        const panelH = Math.min(380, h * 0.65);
        const px = (w - panelW) / 2;
        const py = (h - panelH) / 2;

        // Panel background
        mainCtx.fillStyle = '#151520';
        mainCtx.fillRect(px, py, panelW, panelH);
        mainCtx.strokeStyle = '#4488cc';
        mainCtx.lineWidth = 2;
        mainCtx.strokeRect(px, py, panelW, panelH);

        // Title
        mainCtx.font = 'bold 18px "Courier New", monospace';
        mainCtx.fillStyle = '#4488cc';
        mainCtx.textAlign = 'center';
        mainCtx.fillText('CIPHER DECODER', w / 2, py + 30);

        // Cipher text (encoded)
        mainCtx.font = '14px "Courier New", monospace';
        mainCtx.fillStyle = '#6a6a80';
        mainCtx.fillText('Encoded:', w / 2, py + 60);
        mainCtx.font = 'bold 20px "Courier New", monospace';
        mainCtx.fillStyle = '#cc6666';
        // Split long text
        const half = Math.ceil(s.ciphertext.length / 2);
        const line1 = s.ciphertext.substring(0, s.ciphertext.indexOf(' ', half - 3));
        const line2 = s.ciphertext.substring(s.ciphertext.indexOf(' ', half - 3) + 1);
        mainCtx.fillText(line1, w / 2, py + 90);
        mainCtx.fillText(line2, w / 2, py + 115);

        // Decoded text (current guess)
        mainCtx.font = '14px "Courier New", monospace';
        mainCtx.fillStyle = '#6a6a80';
        mainCtx.fillText('Decoded:', w / 2, py + 150);
        mainCtx.font = 'bold 20px "Courier New", monospace';
        mainCtx.fillStyle = s.solved ? '#44cc44' : '#d4a020';
        const dHalf = Math.ceil(s.decoded.length / 2);
        const dLine1 = s.decoded.substring(0, s.decoded.indexOf(' ', dHalf - 3));
        const dLine2 = s.decoded.substring(s.decoded.indexOf(' ', dHalf - 3) + 1);
        mainCtx.fillText(dLine1, w / 2, py + 180);
        mainCtx.fillText(dLine2, w / 2, py + 205);

        // Shift wheel
        const wheelX = w / 2;
        const wheelY = py + panelH - 90;
        const wheelR = 35;

        // Wheel background
        mainCtx.beginPath();
        mainCtx.arc(wheelX, wheelY, wheelR + 4, 0, Math.PI * 2);
        mainCtx.fillStyle = '#1a1a2e';
        mainCtx.fill();
        mainCtx.strokeStyle = '#4488cc';
        mainCtx.lineWidth = 2;
        mainCtx.stroke();

        // Wheel number
        mainCtx.font = 'bold 24px "Courier New", monospace';
        mainCtx.fillStyle = '#d4a020';
        mainCtx.fillText(String(s.currentShift), wheelX, wheelY + 8);

        // Arrows
        mainCtx.font = '20px sans-serif';
        mainCtx.fillStyle = '#4488cc';
        mainCtx.fillText('◀', wheelX - wheelR - 25, wheelY + 7);
        mainCtx.fillText('▶', wheelX + wheelR + 15, wheelY + 7);

        // Shift label
        mainCtx.font = '12px "Courier New", monospace';
        mainCtx.fillStyle = '#6a6a80';
        mainCtx.fillText(`Shift: ${s.currentShift} / 25`, wheelX, wheelY + wheelR + 20);

        // Instructions
        mainCtx.fillStyle = '#6a6a80';
        mainCtx.fillText('Click arrows or use ← → to rotate the cipher wheel', w / 2, py + panelH - 15);

        // Hint
        if (Engine.state.loop >= 3) {
            mainCtx.fillStyle = 'rgba(68, 136, 204, 0.5)';
            mainCtx.fillText('Hint: Caesar cipher. Try small shifts...', w / 2, py - 15);
        }

        // Feedback
        if (s.feedback) {
            mainCtx.font = '16px monospace';
            mainCtx.fillStyle = s.solved ? '#44cc44' : '#d4a020';
            mainCtx.fillText(s.feedback, w / 2, py + panelH + 25);
        }

        mainCtx.fillStyle = '#555';
        mainCtx.font = '12px monospace';
        mainCtx.fillText('Press ESC to cancel', w / 2, py + panelH + 45);
        mainCtx.textAlign = 'start';
    }

    function cipherShift(dir) {
        const s = mgState;
        if (s.solved) return;
        s.currentShift = ((s.currentShift + dir) % 26 + 26) % 26;
        s.decoded = decodeCaesar(s.ciphertext, s.currentShift);

        if (s.currentShift === s.shift) {
            s.solved = true;
            s.feedback = 'Message decoded!';
            Audio.playSound('evidence');
            setTimeout(() => {
                closeMiniGame();
                if (onComplete) onComplete(true);
            }, 1500);
        }
    }

    // ══════════════════════════════════════════════════
    // INPUT HANDLING
    // ══════════════════════════════════════════════════
    let isDragging = false;
    let dragStartX = 0;
    let dragLastX = 0;

    function handleMouseDown(x, y) {
        if (!active) return false;

        if (active === 'cipher') {
            // Click arrows to shift
            const wheelX = mgW / 2;
            const panelW = Math.min(550, mgW * 0.65);
            const panelH = Math.min(380, mgH * 0.65);
            const wheelY = (mgH - panelH) / 2 + panelH - 90;
            const wheelR = 35;
            if (x < wheelX - wheelR && x > wheelX - wheelR - 40 &&
                Math.abs(y - wheelY) < 25) {
                cipherShift(-1);
            } else if (x > wheelX + wheelR && x < wheelX + wheelR + 40 &&
                Math.abs(y - wheelY) < 25) {
                cipherShift(1);
            }
            return true;
        }

        if (active === 'safe') {
            isDragging = true;
            dragStartX = x;
            dragLastX = x;
            return true;
        }

        if (active === 'lockpick') {
            // Click to push current pin
            const s = mgState;
            if (s.solved || s.currentPin >= s.numPins) return true;

            const pin = s.pins[s.currentPin];
            // Randomize the push amount based on click position
            const pushAmount = 0.2 + Math.random() * 0.6;
            const diff = Math.abs(pushAmount - pin.height);

            if (diff < pin.tolerance) {
                pin.set = true;
                pin.springY = -0.1;
                s.currentPin++;
                s.feedback = 'Pin set!';
                s.feedbackTimer = 1.5;
                Audio.playSound('evidence');

                if (s.currentPin >= s.numPins) {
                    s.solved = true;
                    s.feedback = 'Lock opened!';
                    setTimeout(() => {
                        closeMiniGame();
                        if (onComplete) onComplete(true);
                    }, 1200);
                }
            } else {
                s.attempts++;
                pin.springY = (pushAmount - pin.height) * 0.5;
                s.feedback = diff < pin.tolerance * 2 ? 'Almost...' : 'Too far off';
                s.feedbackTimer = 1;
                s.shakeTimer = 0.3;
                Audio.playSound('click');

                if (s.attempts > 12) {
                    // Auto-solve on too many attempts (not punishing)
                    s.pins.forEach(p => p.set = true);
                    s.currentPin = s.numPins;
                    s.solved = true;
                    s.feedback = 'The lock gives way!';
                    setTimeout(() => {
                        closeMiniGame();
                        if (onComplete) onComplete(true);
                    }, 1200);
                }
            }
            return true;
        }

        if (active === 'bookshelf') {
            const s = mgState;
            if (s.solved || s.pullAnimation >= 0) return true;

            // Determine which book was clicked
            const shelfW = Math.min(500, mgW * 0.6);
            const shelfH = Math.min(250, mgH * 0.4);
            const sx = (mgW - shelfW) / 2;
            const sy = (mgH - shelfH) / 2;
            const bookW = shelfW / s.books.length;

            const bookIdx = Math.floor((x - sx) / bookW);
            if (bookIdx < 0 || bookIdx >= s.books.length) return true;
            if (s.books[bookIdx].pulled) return true;

            const expected = s.correctSequence[s.currentStep];
            if (bookIdx === expected) {
                s.books[bookIdx].pulled = true;
                s.pullAnimation = bookIdx;
                s.pullProgress = 0;
                s.currentStep++;
                s.feedback = `"${s.books[bookIdx].label}" clicks into place...`;
                s.feedbackTimer = 2;
                Audio.playSound('click');

                if (s.currentStep >= s.correctSequence.length) {
                    s.solved = true;
                    s.shelfShake = 1;
                    s.feedback = 'The bookshelf slides open revealing a hidden passage!';
                    Audio.playSound('evidence');
                    setTimeout(() => {
                        closeMiniGame();
                        if (onComplete) onComplete(true);
                    }, 2000);
                }
            } else {
                // Wrong book — reset
                s.books.forEach(b => b.pulled = false);
                s.currentStep = 0;
                s.shelfShake = 0.5;
                s.feedback = 'Nothing happens... try a different sequence.';
                s.feedbackTimer = 2;
                Audio.playSound('click');
            }
            return true;
        }

        return false;
    }

    function handleMouseMove(x, y) {
        if (!active) return false;
        if (active === 'safe' && isDragging) {
            const dx = x - dragLastX;
            mgState.dialAngle += dx * 0.5;
            mgState.dialSpeed = dx * 30;
            mgState.spinning = true;
            dragLastX = x;
            return true;
        }
        return active !== null;
    }

    function handleMouseUp(x, y) {
        if (!active) return false;
        if (active === 'safe') {
            isDragging = false;
            if (Math.abs(mgState.dialSpeed) < 10) {
                // Very gentle release — snap immediately
                mgState.spinning = true; // let friction stop it
            }
            return true;
        }
        return active !== null;
    }

    function handleKeyDown(key) {
        if (!active) return false;
        if (key === 'escape') {
            closeMiniGame();
            if (onComplete) onComplete(false);
            return true;
        }
        if (active === 'cipher') {
            if (key === 'arrowleft') cipherShift(-1);
            else if (key === 'arrowright') cipherShift(1);
            return true;
        }
        return active !== null;
    }

    // ══════════════════════════════════════════════════
    // LIFECYCLE
    // ══════════════════════════════════════════════════
    function closeMiniGame() {
        active = null;
        mgState = {};
        Engine.state.screen = 'playing';
    }

    function updateAndRender(mainCtx, w, h, dt) {
        if (!active) return false;

        if (active === 'safe') {
            updateSafe(dt);
            renderSafe(mainCtx, w, h);
        } else if (active === 'lockpick') {
            updateLockPick(dt);
            renderLockPick(mainCtx, w, h);
        } else if (active === 'bookshelf') {
            updateBookshelf(dt);
            renderBookshelf(mainCtx, w, h);
        } else if (active === 'cipher') {
            updateCipher(dt);
            renderCipher(mainCtx, w, h);
        }
        return true;
    }

    function isActive() {
        return active !== null;
    }

    return {
        init,
        startSafeCracking, startLockPicking, startBookshelfPuzzle,
        startCipherDecoding,
        updateAndRender, isActive,
        handleMouseDown, handleMouseMove, handleMouseUp, handleKeyDown,
    };
})();
