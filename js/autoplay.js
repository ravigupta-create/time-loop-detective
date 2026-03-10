/* ═══════════════════════════════════════════════════════
   AUTOPLAY — Secret cheat code "srg2" activates auto-play.
   Spacebar toggles bot on/off. Session-only (no persistence).

   Maximum realism: ghost cursor with smooth movement, hover
   before click, variable pacing with momentum shifts, reading
   delays scaled to text length, step-by-step minigames with
   mistakes, strategic Wait usage for eavesdrops, notebook tab
   browsing, post-evidence reaction pauses, occasional mind
   changes, urgency near midnight. 100% free, zero deps.
   ═══════════════════════════════════════════════════════ */

const AutoPlay = (() => {
    const CODE = ['s', 'r', 'g', '2'];
    let codeIndex = 0;
    let activated = false;
    let running = false;
    let tickTimer = null;

    // ── Timing Constants ──
    const TICK_MS = 100; // fast tick for smooth cursor movement

    function rand(min, max) { return min + Math.random() * (max - min); }
    function randInt(min, max) { return Math.floor(rand(min, max + 1)); }
    function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

    // ── Action Queue ──
    // Instead of fixed delays, queue up micro-actions (hover, pause, click, wait)
    const queue = [];
    let queueDelay = 0; // ms until next queue step

    function enqueue(...actions) { queue.push(...actions); }
    function clearQueue() { queue.length = 0; queueDelay = 0; }

    // Action types:
    //   { type: 'wait', ms: 2000 }
    //   { type: 'hover', target: hotspot }         — move ghost cursor, trigger tooltip
    //   { type: 'click', target: hotspot }          — click the hotspot
    //   { type: 'clickEl', el: domElement }          — click a DOM element
    //   { type: 'key', key: 'n' }                    — simulate keypress
    //   { type: 'fn', fn: () => {} }                 — run arbitrary function
    //   { type: 'hoverEl', el: domElement }          — hover a DOM button

    // ── Ghost Cursor ──
    // Rendered on canvas to simulate where the player is "looking"
    const cursor = {
        x: 0, y: 0,           // current position (canvas coords)
        targetX: 0, targetY: 0, // where we're moving to
        visible: false,
        opacity: 0,
        speed: 0.08,           // lerp factor (lower = smoother)
    };

    function updateCursor() {
        if (!running) { cursor.visible = false; return; }
        // Smooth lerp toward target
        const dx = cursor.targetX - cursor.x;
        const dy = cursor.targetY - cursor.y;
        // Variable speed: faster for long distances, slower near target
        const dist = Math.sqrt(dx * dx + dy * dy);
        const speed = dist > 200 ? 0.06 : dist > 50 ? 0.08 : 0.12;
        cursor.x += dx * speed;
        cursor.y += dy * speed;
        // Fade in/out
        if (cursor.visible) {
            cursor.opacity = Math.min(1, cursor.opacity + 0.08);
        } else {
            cursor.opacity = Math.max(0, cursor.opacity - 0.05);
        }
    }

    function moveCursorTo(canvasX, canvasY) {
        cursor.targetX = canvasX;
        cursor.targetY = canvasY;
        cursor.visible = true;
    }

    function moveCursorToHotspot(hs) {
        const canvas = document.getElementById('game-canvas');
        if (!canvas || !hs) return;
        const w = canvas.width, h = canvas.height;
        let cx, cy;
        if (hs.rect) {
            // Center of rect with slight randomness (humans don't click dead center)
            cx = (hs.rect.x + hs.rect.w * (0.3 + Math.random() * 0.4)) * w;
            cy = (hs.rect.y + hs.rect.h * (0.3 + Math.random() * 0.4)) * h;
        } else if (hs.polygon) {
            cx = hs.polygon.reduce((s, p) => s + p[0], 0) / hs.polygon.length * w;
            cy = hs.polygon.reduce((s, p) => s + p[1], 0) / hs.polygon.length * h;
            cx += rand(-10, 10);
            cy += rand(-10, 10);
        } else {
            cx = w / 2 + rand(-50, 50);
            cy = h / 2 + rand(-50, 50);
        }
        moveCursorTo(cx, cy);
    }

    // Dispatch a synthetic mousemove on the canvas to trigger tooltip
    function simulateHover(hs) {
        const canvas = document.getElementById('game-canvas');
        if (!canvas || !hs) return;
        const rect = canvas.getBoundingClientRect();
        const w = canvas.width, h = canvas.height;
        let cx, cy;
        if (hs.rect) {
            cx = (hs.rect.x + hs.rect.w / 2) * w;
            cy = (hs.rect.y + hs.rect.h / 2) * h;
        } else if (hs.polygon) {
            cx = hs.polygon.reduce((s, p) => s + p[0], 0) / hs.polygon.length * w;
            cy = hs.polygon.reduce((s, p) => s + p[1], 0) / hs.polygon.length * h;
        } else return;
        // Convert canvas coords to client coords
        const clientX = rect.left + cx * (rect.width / w);
        const clientY = rect.top + cy * (rect.height / h);
        canvas.dispatchEvent(new MouseEvent('mousemove', {
            clientX, clientY, bubbles: true
        }));
    }

    // ── Bot Memory ──
    const memory = {
        roomsExplored: new Set(),
        npcsSpokenTo: new Set(),
        objectsExamined: new Set(),
        lastRoom: null,
        secondLastRoom: null,
        roomVisitCount: {},
        loopsPlayed: 0,
        notebookCheckTimer: 0,
        eavesdropTargets: [],
        dialogueTurns: 0,
        minigameStep: 0,
        lastEvidenceTime: 0,        // timestamp of last evidence find (for reaction)
        actionsThisTick: 0,         // track how active we've been
        momentum: 1.0,              // pace multiplier (0.6=slow, 1.0=normal, 1.4=fast)
        lastScreenChange: 0,
        notebookTabsVisited: 0,
        waitUsed: false,
    };

    function resetLoopMemory() {
        memory.roomsExplored.clear();
        memory.npcsSpokenTo.clear();
        memory.objectsExamined.clear();
        memory.lastRoom = null;
        memory.secondLastRoom = null;
        memory.roomVisitCount = {};
        memory.notebookCheckTimer = 0;
        memory.dialogueTurns = 0;
        memory.minigameStep = 0;
        memory.lastEvidenceTime = 0;
        memory.actionsThisTick = 0;
        memory.momentum = 1.0;
        memory.notebookTabsVisited = 0;
        memory.waitUsed = false;
        memory.loopsPlayed++;
        memory.eavesdropTargets = buildEavesdropPlan();
    }

    // ── Momentum System ──
    // Pace varies naturally: slow when exploring new rooms, fast when backtracking
    function updateMomentum() {
        const t = Engine.state.time;
        // Slow and cautious early game
        if (t < 480) memory.momentum = rand(0.7, 0.9);
        // Normal pace mid-game
        else if (t < 1200) memory.momentum = rand(0.9, 1.1);
        // Urgent near midnight
        else if (t < 1380) memory.momentum = rand(1.1, 1.3);
        // Frantic in final hour
        else memory.momentum = rand(1.2, 1.5);

        // Recently found evidence? Slow down to process
        if (Date.now() - memory.lastEvidenceTime < 5000) {
            memory.momentum *= 0.6;
        }
    }

    // Timing functions adjusted by momentum
    function shortPause()    { return rand(500, 1200) / memory.momentum; }
    function readingPause()  { return rand(1800, 3500) / memory.momentum; }
    function thinkingPause() { return rand(1400, 2800) / memory.momentum; }
    function longPause()     { return rand(3000, 5500) / memory.momentum; }
    function hesitation()    { return Math.random() < 0.18 ? rand(1500, 4000) / memory.momentum : 0; }
    function textReadTime(len) { return Math.min(6000, len * 28 + 600) / memory.momentum; }

    // ── Eavesdrop Planning ──
    function buildEavesdropPlan() {
        if (!GameData.eavesdrops) return [];
        const state = Engine.state;
        return GameData.eavesdrops
            .filter(e => {
                if (state.eavesdropsWitnessed.has(e.id)) return false;
                if (e.requiresLoop && state.loop < e.requiresLoop) return false;
                return true;
            })
            .map(e => ({ id: e.id, time: e.time, location: e.location }))
            .sort((a, b) => a.time - b.time);
    }

    // ── Room Scoring ──
    function scoreRoom(destId) {
        const state = Engine.state;
        const destLoc = GameData.locations[destId];
        if (!destLoc) return -999;
        let score = 0;

        // Undiscovered evidence
        destLoc.objects.forEach(obj => {
            if (obj.evidence && !state.discoveredEvidence.has(obj.evidence)) {
                const ev = GameData.evidence[obj.evidence];
                if (!ev) return;
                if (ev.requiresLoop && state.loop < ev.requiresLoop) return;
                if (obj.requiresFlag && !state.flags[obj.requiresFlag]) return;
                score += 35;
            }
        });

        // NPCs not yet spoken to
        const npcsHere = Engine.getNPCsAtLocation(destId, state.time);
        npcsHere.forEach(npc => {
            if (!memory.npcsSpokenTo.has(npc.id)) score += 18;
            else score += 3;
        });

        // Upcoming eavesdrop
        const eavesdrop = memory.eavesdropTargets.find(e =>
            e.location === destId && Math.abs(state.time - e.time) <= 45
        );
        if (eavesdrop) score += 60;

        // Avoid ping-pong
        if (destId === memory.lastRoom) score -= 25;
        if (destId === memory.secondLastRoom) score -= 10;

        // Visit count penalty
        score -= (memory.roomVisitCount[destId] || 0) * 6;

        // Unexplored bonus
        if (!memory.roomsExplored.has(destId)) score += 12;

        // Human imprecision
        score += rand(-4, 4);

        return score;
    }

    function pickBestExit(exits) {
        if (exits.length === 0) return null;
        let best = null, bestScore = -Infinity;
        exits.forEach(hs => {
            const destId = getExitDestination(hs);
            if (!destId) return;
            const score = scoreRoom(destId);
            if (score > bestScore) { bestScore = score; best = hs; }
        });
        return best;
    }

    function getExitDestination(hs) {
        if (!hs.label) return null;
        const currentLoc = GameData.locations[Engine.state.currentLocation];
        if (!currentLoc) return null;
        for (const exit of currentLoc.exits) {
            if (hs.label.includes(exit.label)) return exit.to;
        }
        return null;
    }

    // Should we use the Wait button to reach an eavesdrop?
    function shouldWait() {
        const state = Engine.state;
        const nextEavesdrop = memory.eavesdropTargets.find(e => {
            const timeDiff = e.time - state.time;
            return timeDiff > 20 && timeDiff < 60; // 20-60 minutes away
        });
        if (!nextEavesdrop) return null;
        // Only wait if we're already at or near the eavesdrop location
        if (state.currentLocation === nextEavesdrop.location) return nextEavesdrop;
        // Or if eavesdrop is close and no other productive actions
        return null;
    }

    // ── Code Entry Detection ──
    document.addEventListener('keydown', (e) => {
        if (activated && e.key === ' ' && Engine.state.screen !== 'title') {
            e.preventDefault();
            e.stopPropagation();
            toggle();
            return;
        }
        if (!activated) {
            if (e.key.toLowerCase() === CODE[codeIndex]) {
                codeIndex++;
                if (codeIndex >= CODE.length) {
                    activated = true;
                    codeIndex = 0;
                    Engine.notify('Code accepted — press Space to toggle auto-play');
                }
            } else {
                codeIndex = e.key.toLowerCase() === CODE[0] ? 1 : 0;
            }
        }
    }, true);

    function toggle() {
        running = !running;
        if (running) {
            Engine.notify('AUTO-PLAY ON');
            resetLoopMemory();
            clearQueue();
            // Initialize cursor near center
            const canvas = document.getElementById('game-canvas');
            if (canvas) {
                cursor.x = canvas.width / 2;
                cursor.y = canvas.height / 2;
                cursor.targetX = cursor.x;
                cursor.targetY = cursor.y;
            }
            tickTimer = setInterval(tick, TICK_MS);
        } else {
            Engine.notify('AUTO-PLAY OFF');
            if (tickTimer) { clearInterval(tickTimer); tickTimer = null; }
            clearQueue();
            cursor.visible = false;
        }
    }

    // ── Main Tick ──
    function tick() {
        if (!running) return;
        updateCursor();
        updateMomentum();

        // Process queue
        if (queue.length > 0) {
            if (queueDelay > 0) {
                queueDelay -= TICK_MS;
                return;
            }
            const action = queue.shift();
            processAction(action);
            return;
        }

        // No queued actions — decide what to do
        try {
            const screen = Engine.state.screen;
            switch (screen) {
                case 'title':        decideTitle(); break;
                case 'intro':        decideIntro(); break;
                case 'playing':      decidePlaying(); break;
                case 'dialogue':     decideDialogue(); break;
                case 'minigame':     decideMinigame(); break;
                case 'notebook':     decideNotebook(); break;
                case 'accusation':   decideAccusation(); break;
                case 'fast_forward': decideFastForward(); break;
                case 'eavesdrop':    decideEavesdrop(); break;
                case 'loop_recap':   decideLoopRecap(); break;
                case 'help':         decideHelp(); break;
                case 'ending':       break;
                case 'settings':     break;
            }
        } catch (e) {
            queueDelay = shortPause();
        }
    }

    function processAction(action) {
        switch (action.type) {
            case 'wait':
                queueDelay = action.ms;
                break;
            case 'hover':
                moveCursorToHotspot(action.target);
                simulateHover(action.target);
                queueDelay = action.ms || rand(400, 900); // linger on hover
                break;
            case 'click':
                Audio.playSound('click');
                if (action.target && action.target.action) action.target.action();
                queueDelay = action.ms || 200;
                break;
            case 'clickEl':
                if (action.el) {
                    Audio.playSound('click');
                    action.el.click();
                }
                queueDelay = action.ms || 200;
                break;
            case 'hoverEl':
                // Move cursor near the DOM element
                if (action.el) {
                    const rect = action.el.getBoundingClientRect();
                    moveCursorTo(rect.left + rect.width / 2, rect.top + rect.height / 2);
                }
                queueDelay = action.ms || rand(300, 700);
                break;
            case 'key':
                document.dispatchEvent(new KeyboardEvent('keydown', {
                    key: action.key, bubbles: true
                }));
                queueDelay = action.ms || 150;
                break;
            case 'fn':
                if (action.fn) action.fn();
                queueDelay = action.ms || 0;
                break;
        }
    }

    // ════════════════════════════════════════════════════
    // DECISION MAKERS (queue up actions)
    // ════════════════════════════════════════════════════

    function decideTitle() {
        enqueue({ type: 'wait', ms: readingPause() });
        const cont = document.getElementById('btn-continue');
        const btn = (cont && cont.style.display !== 'none') ? cont : document.getElementById('btn-new-game');
        if (btn) {
            enqueue({ type: 'hoverEl', el: btn, ms: rand(600, 1200) });
            enqueue({ type: 'clickEl', el: btn });
        }
    }

    function decideIntro() {
        const textEl = document.getElementById('intro-text');
        const len = textEl ? textEl.textContent.length : 50;
        enqueue({ type: 'wait', ms: textReadTime(len) + hesitation() });
        const screen = document.getElementById('intro-screen');
        if (screen) enqueue({ type: 'clickEl', el: screen });
    }

    function decideLoopRecap() {
        // Read the recap content
        enqueue({ type: 'wait', ms: longPause() + rand(1000, 2000) });
        const btn = document.getElementById('btn-begin-loop');
        if (btn) {
            enqueue({ type: 'hoverEl', el: btn, ms: rand(400, 800) });
            enqueue({ type: 'clickEl', el: btn });
            enqueue({ type: 'fn', fn: () => resetLoopMemory() });
        }
    }

    function decideHelp() {
        enqueue({ type: 'wait', ms: readingPause() });
        const btn = document.getElementById('help-close');
        if (btn) enqueue({ type: 'clickEl', el: btn });
    }

    // ── Playing ──
    function decidePlaying() {
        if (Renderer.isTransitioning()) {
            enqueue({ type: 'wait', ms: shortPause() });
            return;
        }

        const state = Engine.state;
        const currentLoc = state.currentLocation;

        // Just entered a new room — look around
        if (currentLoc !== memory.lastRoom) {
            memory.secondLastRoom = memory.lastRoom;
            memory.lastRoom = currentLoc;
            memory.roomVisitCount[currentLoc] = (memory.roomVisitCount[currentLoc] || 0) + 1;

            // Idle gaze: move cursor around the room
            const canvas = document.getElementById('game-canvas');
            if (canvas) {
                const w = canvas.width, h = canvas.height;
                enqueue({ type: 'fn', fn: () => moveCursorTo(w * rand(0.2, 0.8), h * rand(0.2, 0.5)) });
                enqueue({ type: 'wait', ms: rand(800, 1500) });
                enqueue({ type: 'fn', fn: () => moveCursorTo(w * rand(0.1, 0.9), h * rand(0.3, 0.7)) });
                enqueue({ type: 'wait', ms: readingPause() + hesitation() });
            }
            return;
        }

        // ── Notebook Check ──
        memory.notebookCheckTimer += TICK_MS;
        if (memory.notebookCheckTimer > 40000 && state.discoveredEvidence.size > 2 && Math.random() < 0.08) {
            memory.notebookCheckTimer = 0;
            enqueue({ type: 'wait', ms: shortPause() });
            enqueue({ type: 'key', key: 'n' });
            return;
        }

        // ── Past Murder ──
        if (state.time >= 1410) {
            // Idle in room, occasionally look around
            const canvas = document.getElementById('game-canvas');
            if (canvas) {
                enqueue({ type: 'fn', fn: () => moveCursorTo(canvas.width * rand(0.2, 0.8), canvas.height * rand(0.2, 0.7)) });
            }
            enqueue({ type: 'wait', ms: longPause() });
            return;
        }

        // ── Strategic Wait for Eavesdrop ──
        const waitTarget = shouldWait();
        if (waitTarget && !memory.waitUsed) {
            const timeDiff = waitTarget.time - state.time;
            if (timeDiff > 20 && timeDiff <= 40) {
                memory.waitUsed = true;
                enqueue({ type: 'wait', ms: thinkingPause() });
                // Use the wait button
                const waitBtn = document.getElementById('btn-wait');
                if (waitBtn) {
                    enqueue({ type: 'hoverEl', el: waitBtn, ms: rand(400, 800) });
                    enqueue({ type: 'clickEl', el: waitBtn });
                    enqueue({ type: 'wait', ms: shortPause() });
                }
                return;
            }
        }

        // ── Navigate Toward Eavesdrop ──
        const urgentEavesdrop = memory.eavesdropTargets.find(e => {
            const diff = e.time - state.time;
            return diff > -15 && diff < 55;
        });
        if (urgentEavesdrop && currentLoc !== urgentEavesdrop.location) {
            const hotspots = Hotspots.getHotspots();
            const exitHS = hotspots.find(hs =>
                hs.type === 'exit' && hs.action && isExitToward(hs, urgentEavesdrop.location)
            );
            if (exitHS) {
                enqueue({ type: 'hover', target: exitHS, ms: rand(500, 1000) });
                enqueue({ type: 'wait', ms: thinkingPause() });
                enqueue({ type: 'click', target: exitHS });
                return;
            }
        }

        // ── Get Hotspots ──
        const hotspots = Hotspots.getHotspots();
        if (!hotspots || hotspots.length === 0) {
            enqueue({ type: 'wait', ms: shortPause() });
            return;
        }

        const evidence = [], npcs = [], objects = [], exits = [];
        hotspots.forEach(hs => {
            if (hs.type === 'exit') exits.push(hs);
            else if (hs.type === 'npc') npcs.push(hs);
            else if (hs.hasEvidence && !state.discoveredEvidence.has(hs.evidenceId)) evidence.push(hs);
            else if (hs.type === 'object' || hs.type === 'examine') objects.push(hs);
        });

        const freshNPCs = npcs.filter(hs => {
            const id = extractNPCId(hs);
            return id && !memory.npcsSpokenTo.has(id);
        });
        const freshObjects = objects.filter(hs => {
            const id = extractObjectId(hs);
            return id && !memory.objectsExamined.has(id);
        });

        // ── Decision with Hover-Before-Click ──

        if (evidence.length > 0) {
            const target = evidence[0];
            // Sometimes glance at another hotspot first (mind-change effect)
            if (objects.length > 0 && Math.random() < 0.25) {
                enqueue({ type: 'hover', target: pick(objects), ms: rand(400, 800) });
            }
            enqueue({ type: 'hover', target: target, ms: rand(600, 1200) });
            enqueue({ type: 'wait', ms: thinkingPause() + hesitation() });
            enqueue({ type: 'click', target: target });
            enqueue({ type: 'fn', fn: () => { memory.lastEvidenceTime = Date.now(); } });
            return;
        }

        if (freshNPCs.length > 0) {
            const target = pick(freshNPCs);
            const npcId = extractNPCId(target);
            if (npcId) memory.npcsSpokenTo.add(npcId);
            enqueue({ type: 'hover', target: target, ms: rand(500, 1000) });
            enqueue({ type: 'wait', ms: shortPause() + hesitation() });
            enqueue({ type: 'click', target: target });
            return;
        }

        if (freshObjects.length > 0) {
            const target = freshObjects[0];
            const objId = extractObjectId(target);
            if (objId) memory.objectsExamined.add(objId);
            // Occasionally scan another object first
            if (freshObjects.length > 1 && Math.random() < 0.3) {
                enqueue({ type: 'hover', target: freshObjects[1], ms: rand(300, 600) });
            }
            enqueue({ type: 'hover', target: target, ms: rand(500, 1000) });
            enqueue({ type: 'wait', ms: thinkingPause() });
            enqueue({ type: 'click', target: target });
            return;
        }

        // Room fully explored
        memory.roomsExplored.add(currentLoc);

        // Occasionally re-talk to NPCs for deeper dialogue
        if (npcs.length > 0 && Math.random() < 0.2) {
            const target = pick(npcs);
            enqueue({ type: 'hover', target: target, ms: rand(500, 900) });
            enqueue({ type: 'wait', ms: thinkingPause() });
            enqueue({ type: 'click', target: target });
            return;
        }

        // Pick best exit
        if (exits.length > 0) {
            const bestExit = pickBestExit(exits);
            const target = bestExit || pick(exits);
            // Sometimes hover a different exit first (considering options)
            if (exits.length > 1 && Math.random() < 0.3) {
                const other = exits.find(e => e !== target) || exits[0];
                enqueue({ type: 'hover', target: other, ms: rand(400, 700) });
            }
            enqueue({ type: 'hover', target: target, ms: rand(600, 1100) });
            enqueue({ type: 'wait', ms: readingPause() + hesitation() });
            enqueue({ type: 'click', target: target });
        } else {
            enqueue({ type: 'wait', ms: shortPause() });
        }
    }

    // ── Dialogue ──
    function decideDialogue() {
        const textEl = document.getElementById('dialogue-text');
        const buttons = document.querySelectorAll('#dialogue-choices button');

        if (buttons.length === 0) {
            // Typewriter still going
            memory.dialogueTurns++;
            if (memory.dialogueTurns <= 1) {
                // Let typewriter run for a bit (reading along)
                enqueue({ type: 'wait', ms: readingPause() + rand(500, 1500) });
            } else {
                // Click to finish typewriter (impatient after waiting)
                if (textEl) enqueue({ type: 'clickEl', el: textEl });
                enqueue({ type: 'wait', ms: shortPause() });
                memory.dialogueTurns = 0;
            }
            return;
        }

        memory.dialogueTurns = 0;

        // Read the NPC's text
        const textLen = textEl ? textEl.textContent.length : 40;
        enqueue({ type: 'wait', ms: textReadTime(textLen) });

        // Categorize choices
        const available = [], locked = [];
        let endBtn = null;
        buttons.forEach(btn => {
            if (btn.classList.contains('locked')) { locked.push(btn); return; }
            if (btn.textContent.includes('End conversation') || btn.textContent.includes('[End')) {
                endBtn = btn;
            } else {
                available.push(btn);
            }
        });

        // Scan choices visually (hover over a couple before deciding)
        if (available.length > 1) {
            // Hover over 1-2 choices before picking
            const scanCount = Math.min(available.length, randInt(1, 2));
            for (let i = 0; i < scanCount; i++) {
                enqueue({ type: 'hoverEl', el: available[i], ms: rand(300, 700) });
            }
            enqueue({ type: 'wait', ms: rand(400, 1000) }); // "deciding"
        }

        // Pick choice
        let chosen = null;
        const evidenceChoices = available.filter(b => b.classList.contains('evidence-choice'));
        if (evidenceChoices.length > 0) {
            chosen = Math.random() < 0.85 ? evidenceChoices[0] : pick(evidenceChoices);
        } else if (available.length > 0) {
            if (available.length === 1) {
                chosen = available[0];
            } else {
                // Weighted: prefer earlier options but not rigidly
                const weights = available.map((_, i) => Math.max(0.15, 1 - i * 0.3));
                const total = weights.reduce((a, b) => a + b, 0);
                let r = Math.random() * total;
                for (let i = 0; i < weights.length; i++) {
                    r -= weights[i];
                    if (r <= 0) { chosen = available[i]; break; }
                }
                if (!chosen) chosen = available[0];
            }
        } else if (endBtn) {
            chosen = endBtn;
        }

        if (chosen) {
            enqueue({ type: 'hoverEl', el: chosen, ms: rand(200, 500) });
            enqueue({ type: 'clickEl', el: chosen });
        }
    }

    // ── Minigame ──
    function decideMinigame() {
        if (!MiniGames.isActive()) return;

        memory.minigameStep++;

        // Fallback after too many attempts
        if (memory.minigameStep > 14) {
            memory.minigameStep = 0;
            enqueue({ type: 'wait', ms: shortPause() });
            enqueue({ type: 'fn', fn: () => MiniGames.autoSolve() });
            return;
        }

        // Pause like thinking, then try a step
        enqueue({ type: 'wait', ms: rand(1200, 2800) / memory.momentum });

        if (MiniGames.botStep) {
            enqueue({ type: 'fn', fn: () => {
                const solved = MiniGames.botStep();
                if (solved) {
                    memory.minigameStep = 0;
                }
            }});
            // React to step result
            enqueue({ type: 'wait', ms: rand(400, 1000) });
        } else {
            enqueue({ type: 'wait', ms: longPause() });
            enqueue({ type: 'fn', fn: () => { MiniGames.autoSolve(); memory.minigameStep = 0; } });
        }
    }

    // ── Notebook (browse tabs before closing) ──
    function decideNotebook() {
        const tabs = ['clues', 'profiles', 'timeline', 'board'];
        if (memory.notebookTabsVisited < 2 && Engine.state.discoveredEvidence.size > 1) {
            // Browse a tab
            const tabName = tabs[memory.notebookTabsVisited];
            const tabEl = document.querySelector(`.nb-tab[data-tab="${tabName}"]`);
            if (tabEl) {
                enqueue({ type: 'hoverEl', el: tabEl, ms: rand(300, 600) });
                enqueue({ type: 'clickEl', el: tabEl });
                enqueue({ type: 'wait', ms: longPause() }); // "reading the tab"
            }
            memory.notebookTabsVisited++;
            return;
        }

        // Done browsing — close
        memory.notebookTabsVisited = 0;
        enqueue({ type: 'wait', ms: shortPause() });
        const closeBtn = document.getElementById('notebook-close');
        if (closeBtn) {
            enqueue({ type: 'hoverEl', el: closeBtn, ms: rand(200, 400) });
            enqueue({ type: 'clickEl', el: closeBtn });
        }
    }

    function decideAccusation() {
        enqueue({ type: 'wait', ms: thinkingPause() });
        const cancelBtn = document.getElementById('btn-cancel-accuse');
        if (cancelBtn) {
            enqueue({ type: 'hoverEl', el: cancelBtn, ms: rand(300, 600) });
            enqueue({ type: 'clickEl', el: cancelBtn });
        } else {
            enqueue({ type: 'key', key: 'Escape' });
        }
    }

    function decideFastForward() {
        enqueue({ type: 'wait', ms: shortPause() });
        const cancelBtn = document.getElementById('ff-cancel');
        if (cancelBtn) {
            enqueue({ type: 'hoverEl', el: cancelBtn, ms: rand(200, 400) });
            enqueue({ type: 'clickEl', el: cancelBtn });
        }
    }

    function decideEavesdrop() {
        // Read each line carefully — eavesdrops are critical
        const textEl = document.getElementById('eavesdrop-text');
        const len = textEl ? textEl.textContent.length : 60;
        enqueue({ type: 'wait', ms: textReadTime(len) + rand(800, 1500) });
        const overlay = document.getElementById('eavesdrop-overlay');
        if (overlay) enqueue({ type: 'clickEl', el: overlay });
    }

    // ── Helpers ──

    function isExitToward(hs, targetLocation) {
        if (!hs.label) return false;
        const targetName = GameData.locations[targetLocation]?.name || '';
        if (hs.label.includes(targetName)) return true;
        if (hs.label.includes('Grand Hallway') && targetLocation !== Engine.state.currentLocation) return true;
        return false;
    }

    function extractNPCId(hs) {
        if (!hs.label) return null;
        for (const [id, npc] of Object.entries(GameData.npcs)) {
            if (hs.label.includes(npc.name)) return id;
        }
        return null;
    }

    function extractObjectId(hs) {
        if (!hs.label) return null;
        const loc = GameData.locations[Engine.state.currentLocation];
        if (!loc) return null;
        for (const obj of loc.objects) {
            if (hs.label.includes(obj.name)) return obj.id;
        }
        return null;
    }

    // ── Public API ──
    function isRunning() { return running; }
    function isActivated() { return activated; }
    function getCursor() { return cursor; }

    return { isRunning, isActivated, getCursor };
})();
