/* ═══════════════════════════════════════════════════════
   AUTOPLAY — Secret cheat code "srg2" activates auto-play.
   Spacebar toggles bot on/off. Session-only (no persistence).

   Maximum realism & intelligence: ghost cursor with smooth
   movement, hover before click, variable pacing with momentum
   shifts, reading delays scaled to text length, step-by-step
   minigames with mistakes, strategic Wait usage for eavesdrops,
   notebook tab browsing, post-evidence reaction pauses,
   occasional mind changes, urgency near midnight.

   Max intelligence: full dialogue tree tracking (never repeats
   the same question to an NPC), evidence-aware NPC targeting
   (revisits NPCs when new confront nodes unlock), exhaustion
   detection, smart accusation in later loops, strategic
   fast-forward, loop-phase strategy. 100% free, zero deps.
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
    const queue = [];
    let queueDelay = 0;

    function enqueue(...actions) { queue.push(...actions); }
    function clearQueue() { queue.length = 0; queueDelay = 0; }

    // ── Ghost Cursor ──
    const cursor = {
        x: 0, y: 0,
        targetX: 0, targetY: 0,
        visible: false,
        opacity: 0,
        speed: 0.08,
    };

    function updateCursor() {
        if (!running) { cursor.visible = false; return; }
        const dx = cursor.targetX - cursor.x;
        const dy = cursor.targetY - cursor.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const speed = dist > 200 ? 0.06 : dist > 50 ? 0.08 : 0.12;
        cursor.x += dx * speed;
        cursor.y += dy * speed;
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
        lastEvidenceTime: 0,
        actionsThisTick: 0,
        momentum: 1.0,
        lastScreenChange: 0,
        notebookTabsVisited: 0,
        waitUsed: false,

        // ── Dialogue Intelligence ──
        // Track which dialogue choices we've picked per NPC (persists across loops)
        dialogueChoices: {},          // npcId → Set of button text strings
        // Track NPCs whose dialogue tree is fully explored this loop
        npcExhausted: new Set(),
        // Track current NPC we're talking to
        currentDialogueNPC: null,
        // Track evidence count when we last talked to each NPC
        evidenceWhenTalked: {},       // npcId → number of discovered evidence
        // Track which confront nodes we've used (persists across session)
        confrontsTriggered: new Set(),
        // Track how many times we've talked to each NPC this loop
        npcTalkCount: {},
        // Ready to accuse (set when we have enough evidence)
        readyToAccuse: false,
        // Accusation step tracker
        accusationStep: 0,
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
        // Dialogue exhaustion resets per loop (confront nodes reset per loop)
        memory.npcExhausted.clear();
        memory.currentDialogueNPC = null;
        memory.evidenceWhenTalked = {};
        memory.npcTalkCount = {};
        memory.readyToAccuse = false;
        memory.accusationStep = 0;
        // dialogueChoices and confrontsTriggered persist across loops
        memory.loopsPlayed++;
        memory.eavesdropTargets = buildEavesdropPlan();
    }

    // ── Momentum System ──
    function updateMomentum() {
        const t = Engine.state.time;
        if (t < 480) memory.momentum = rand(0.7, 0.9);
        else if (t < 1200) memory.momentum = rand(0.9, 1.1);
        else if (t < 1380) memory.momentum = rand(1.1, 1.3);
        else memory.momentum = rand(1.2, 1.5);
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

    // ═══════════════════════════════════════════════════════
    // DIALOGUE INTELLIGENCE
    // ═══════════════════════════════════════════════════════

    // Get NPC ID from name shown in dialogue header
    function getNPCIdFromDialogueName() {
        const nameEl = document.getElementById('dialogue-name');
        if (!nameEl) return null;
        const name = nameEl.textContent.trim();
        for (const [id, npc] of Object.entries(GameData.npcs)) {
            if (npc.name === name) return id;
        }
        return null;
    }

    // Get the Set of previously chosen dialogue texts for an NPC
    function getChosenTexts(npcId) {
        if (!memory.dialogueChoices[npcId]) {
            memory.dialogueChoices[npcId] = new Set();
        }
        return memory.dialogueChoices[npcId];
    }

    // Record that we chose a particular dialogue option
    function recordChoice(npcId, buttonText) {
        if (!npcId) return;
        getChosenTexts(npcId).add(buttonText);
    }

    // Check if an NPC has confront nodes that we haven't triggered yet
    // and that we now have the evidence for
    function hasNewConfrontNodes(npcId) {
        const tree = GameData.dialogues[npcId];
        if (!tree) return false;
        const state = Engine.state;

        const specialNodes = [
            'confront_poisoning', 'confront_letters', 'confront_affair',
            'confront_confession', 'confront_glass', 'midnight_testimony',
            'secret_meeting', 'confront_debts', 'confront_insurance',
            'confront_wolfsbane', 'confront_overheard', 'confront_medical',
            'confront_negligence', 'confront_embezzlement', 'confront_footprints',
            'confront_photograph', 'confront_cufflink', 'confront_prophecy',
        ];

        for (const nodeId of specialNodes) {
            if (!tree[nodeId] || !tree[nodeId].requires) continue;
            // Check if we have the requirements
            const hasReqs = tree[nodeId].requires.every(req =>
                state.discoveredEvidence.has(req) ||
                state.knownFacts.has(req) ||
                state.flags[req]
            );
            if (!hasReqs) continue;
            // Check if this confront hasn't been used this loop
            const flagKey = npcId + '_' + nodeId + '_' + state.loop;
            if (state.flags[flagKey]) continue;
            // Check location/time requirements
            if (tree[nodeId].location && state.currentLocation !== tree[nodeId].location) continue;
            if (tree[nodeId].timeWindow) {
                const t = state.time;
                if (t < tree[nodeId].timeWindow.start || t > tree[nodeId].timeWindow.end) continue;
            }
            // This confront node is available and unused
            return true;
        }
        return false;
    }

    // Check if we have enough evidence to make a correct accusation
    function hasEnoughForAccusation() {
        const state = Engine.state;
        const critical = ['poison_vial', 'love_letters', 'secret_passage', 'brandy_glass'];
        const hasCritical = critical.filter(e => state.discoveredEvidence.has(e)).length;
        return hasCritical >= 3 && state.discoveredEvidence.size >= 8;
    }

    // Count non-end, non-locked responses in a dialogue tree node
    function countDialogueDepth(npcId) {
        const tree = GameData.dialogues[npcId];
        if (!tree || !tree.greeting) return 0;
        // Count total reachable unique response texts
        let count = 0;
        const visited = new Set();
        function walk(nodeId) {
            if (!nodeId || visited.has(nodeId)) return;
            visited.add(nodeId);
            const node = tree[nodeId];
            if (!node || !node.responses) return;
            node.responses.forEach(r => {
                count++;
                if (r.next) walk(r.next);
            });
        }
        walk('greeting');
        return count;
    }

    // Check if we've explored most dialogue paths for this NPC
    function isDialogueExhausted(npcId) {
        if (memory.npcExhausted.has(npcId)) return true;
        const chosen = getChosenTexts(npcId);
        const totalDepth = countDialogueDepth(npcId);
        // If we've chosen more responses than 60% of total depth, consider exhausted
        // (not all paths are reachable due to evidence gating)
        if (totalDepth > 0 && chosen.size >= totalDepth * 0.6) return true;
        return false;
    }

    // ═══════════════════════════════════════════════════════
    // ROOM SCORING
    // ═══════════════════════════════════════════════════════

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

        // NPCs at this location
        const npcsHere = Engine.getNPCsAtLocation(destId, state.time);
        npcsHere.forEach(npc => {
            if (!memory.npcsSpokenTo.has(npc.id)) {
                score += 18;
            } else if (hasNewConfrontNodes(npc.id)) {
                // High priority: we have new evidence to confront them with
                score += 40;
            } else if (!isDialogueExhausted(npc.id)) {
                score += 8;
            } else {
                score += 1;
            }
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

    function shouldWait() {
        const state = Engine.state;
        const nextEavesdrop = memory.eavesdropTargets.find(e => {
            const timeDiff = e.time - state.time;
            return timeDiff > 20 && timeDiff < 60;
        });
        if (!nextEavesdrop) return null;
        if (state.currentLocation === nextEavesdrop.location) return nextEavesdrop;
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
                queueDelay = action.ms || rand(400, 900);
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
    // DECISION MAKERS
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

        // ── Smart Accusation Check ──
        // In loop 4+ with enough evidence, make the accusation
        if (state.loop >= 4 && hasEnoughForAccusation() && !memory.readyToAccuse
            && state.time > 600 && state.time < 1350) {
            memory.readyToAccuse = true;
            // Open notebook first to "review evidence" before accusing
            enqueue({ type: 'wait', ms: thinkingPause() });
            enqueue({ type: 'key', key: 'n' });
            return;
        }

        // After notebook review, trigger accusation
        if (memory.readyToAccuse && memory.notebookTabsVisited === 0 && state.loop >= 4) {
            memory.readyToAccuse = false;
            enqueue({ type: 'wait', ms: longPause() });
            enqueue({ type: 'key', key: 'a' });
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

        // Priority 1: Undiscovered evidence
        if (evidence.length > 0) {
            const target = evidence[0];
            if (objects.length > 0 && Math.random() < 0.25) {
                enqueue({ type: 'hover', target: pick(objects), ms: rand(400, 800) });
            }
            enqueue({ type: 'hover', target: target, ms: rand(600, 1200) });
            enqueue({ type: 'wait', ms: thinkingPause() + hesitation() });
            enqueue({ type: 'click', target: target });
            enqueue({ type: 'fn', fn: () => { memory.lastEvidenceTime = Date.now(); } });
            return;
        }

        // Priority 2: NPCs not yet spoken to this loop
        if (freshNPCs.length > 0) {
            const target = pick(freshNPCs);
            const npcId = extractNPCId(target);
            if (npcId) {
                memory.npcsSpokenTo.add(npcId);
                memory.npcTalkCount[npcId] = (memory.npcTalkCount[npcId] || 0) + 1;
                memory.evidenceWhenTalked[npcId] = state.discoveredEvidence.size;
                memory.currentDialogueNPC = npcId;
            }
            enqueue({ type: 'hover', target: target, ms: rand(500, 1000) });
            enqueue({ type: 'wait', ms: shortPause() + hesitation() });
            enqueue({ type: 'click', target: target });
            return;
        }

        // Priority 3: Fresh objects to examine
        if (freshObjects.length > 0) {
            const target = freshObjects[0];
            const objId = extractObjectId(target);
            if (objId) memory.objectsExamined.add(objId);
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

        // Priority 4: Re-talk to NPCs with NEW confront nodes available
        const confrontNPCs = npcs.filter(hs => {
            const npcId = extractNPCId(hs);
            return npcId && hasNewConfrontNodes(npcId);
        });
        if (confrontNPCs.length > 0) {
            const target = confrontNPCs[0];
            const npcId = extractNPCId(target);
            if (npcId) {
                memory.npcTalkCount[npcId] = (memory.npcTalkCount[npcId] || 0) + 1;
                memory.evidenceWhenTalked[npcId] = state.discoveredEvidence.size;
                memory.currentDialogueNPC = npcId;
            }
            enqueue({ type: 'hover', target: target, ms: rand(500, 900) });
            enqueue({ type: 'wait', ms: thinkingPause() });
            enqueue({ type: 'click', target: target });
            return;
        }

        // Priority 5: Re-talk to NPCs with unexplored dialogue paths
        // Only if we've found new evidence since last talking to them
        const retalkNPCs = npcs.filter(hs => {
            const npcId = extractNPCId(hs);
            if (!npcId) return false;
            // Skip exhausted NPCs
            if (isDialogueExhausted(npcId)) return false;
            // Skip if we haven't found new evidence since last talk
            const evidenceThen = memory.evidenceWhenTalked[npcId] || 0;
            if (state.discoveredEvidence.size <= evidenceThen) return false;
            // Limit re-talks per NPC per loop
            if ((memory.npcTalkCount[npcId] || 0) >= 3) return false;
            return true;
        });
        if (retalkNPCs.length > 0 && Math.random() < 0.4) {
            const target = pick(retalkNPCs);
            const npcId = extractNPCId(target);
            if (npcId) {
                memory.npcTalkCount[npcId] = (memory.npcTalkCount[npcId] || 0) + 1;
                memory.evidenceWhenTalked[npcId] = state.discoveredEvidence.size;
                memory.currentDialogueNPC = npcId;
            }
            enqueue({ type: 'hover', target: target, ms: rand(500, 900) });
            enqueue({ type: 'wait', ms: thinkingPause() });
            enqueue({ type: 'click', target: target });
            return;
        }

        // Priority 6: Pick best exit
        if (exits.length > 0) {
            const bestExit = pickBestExit(exits);
            const target = bestExit || pick(exits);
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

    // ── Dialogue (with full path tracking) ──
    function decideDialogue() {
        const textEl = document.getElementById('dialogue-text');
        const buttons = document.querySelectorAll('#dialogue-choices button');

        // Identify which NPC we're talking to
        if (!memory.currentDialogueNPC) {
            memory.currentDialogueNPC = getNPCIdFromDialogueName();
        }
        const npcId = memory.currentDialogueNPC;

        if (buttons.length === 0) {
            // Typewriter still going
            memory.dialogueTurns++;
            if (memory.dialogueTurns <= 1) {
                enqueue({ type: 'wait', ms: readingPause() + rand(500, 1500) });
            } else {
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
            const txt = btn.textContent.trim();
            if (txt.includes('End conversation') || txt.includes('[End') ||
                txt === 'Leave.' || txt === 'Leave') {
                endBtn = btn;
            } else {
                available.push(btn);
            }
        });

        // Get previously chosen texts for this NPC
        const chosenTexts = npcId ? getChosenTexts(npcId) : new Set();

        // Split available into new (unexplored) vs already-tried
        const newChoices = available.filter(btn => !chosenTexts.has(btn.textContent.trim()));
        const oldChoices = available.filter(btn => chosenTexts.has(btn.textContent.trim()));

        // Evidence-gated choices (always high priority, even if seen before)
        const newEvidenceChoices = newChoices.filter(b => b.classList.contains('evidence-choice'));
        const oldEvidenceChoices = oldChoices.filter(b => b.classList.contains('evidence-choice'));

        // Scan choices visually (hover over a couple before deciding)
        const scanTargets = newChoices.length > 0 ? newChoices : available;
        if (scanTargets.length > 1) {
            const scanCount = Math.min(scanTargets.length, randInt(1, 2));
            for (let i = 0; i < scanCount; i++) {
                enqueue({ type: 'hoverEl', el: scanTargets[i], ms: rand(300, 700) });
            }
            enqueue({ type: 'wait', ms: rand(400, 1000) });
        }

        // Pick choice with intelligence
        let chosen = null;

        // 1. New evidence-gated choices (highest priority — these unlock reveals)
        if (newEvidenceChoices.length > 0) {
            chosen = newEvidenceChoices[0];
        }
        // 2. Old evidence-gated choices we haven't fully explored
        else if (oldEvidenceChoices.length > 0 && newChoices.length === 0) {
            chosen = oldEvidenceChoices[0];
        }
        // 3. New (unexplored) regular choices
        else if (newChoices.length > 0) {
            if (newChoices.length === 1) {
                chosen = newChoices[0];
            } else {
                // Weighted toward first option but not rigidly
                const weights = newChoices.map((_, i) => Math.max(0.15, 1 - i * 0.25));
                const total = weights.reduce((a, b) => a + b, 0);
                let r = Math.random() * total;
                for (let i = 0; i < weights.length; i++) {
                    r -= weights[i];
                    if (r <= 0) { chosen = newChoices[i]; break; }
                }
                if (!chosen) chosen = newChoices[0];
            }
        }
        // 4. All choices exhausted — end conversation
        else if (endBtn) {
            chosen = endBtn;
            // Mark NPC as exhausted if all non-end choices have been tried
            if (npcId && available.length > 0 && newChoices.length === 0) {
                memory.npcExhausted.add(npcId);
            }
        }
        // 5. Only "Leave" type options available
        else if (available.length > 0) {
            chosen = available[0];
        }

        if (chosen) {
            // Record this choice
            if (npcId) {
                recordChoice(npcId, chosen.textContent.trim());
            }
            enqueue({ type: 'hoverEl', el: chosen, ms: rand(200, 500) });
            enqueue({ type: 'clickEl', el: chosen });
        }
    }

    // ── Minigame ──
    function decideMinigame() {
        if (!MiniGames.isActive()) return;

        memory.minigameStep++;

        if (memory.minigameStep > 14) {
            memory.minigameStep = 0;
            enqueue({ type: 'wait', ms: shortPause() });
            enqueue({ type: 'fn', fn: () => MiniGames.autoSolve() });
            return;
        }

        enqueue({ type: 'wait', ms: rand(1200, 2800) / memory.momentum });

        if (MiniGames.botStep) {
            enqueue({ type: 'fn', fn: () => {
                const solved = MiniGames.botStep();
                if (solved) memory.minigameStep = 0;
            }});
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
            const tabName = tabs[memory.notebookTabsVisited];
            const tabEl = document.querySelector(`.nb-tab[data-tab="${tabName}"]`);
            if (tabEl) {
                enqueue({ type: 'hoverEl', el: tabEl, ms: rand(300, 600) });
                enqueue({ type: 'clickEl', el: tabEl });
                enqueue({ type: 'wait', ms: longPause() });
            }
            memory.notebookTabsVisited++;
            return;
        }

        memory.notebookTabsVisited = 0;
        enqueue({ type: 'wait', ms: shortPause() });
        const closeBtn = document.getElementById('notebook-close');
        if (closeBtn) {
            enqueue({ type: 'hoverEl', el: closeBtn, ms: rand(200, 400) });
            enqueue({ type: 'clickEl', el: closeBtn });
        }
    }

    // ── Accusation (smart — actually accuse in later loops) ──
    function decideAccusation() {
        const state = Engine.state;

        // If we have enough evidence and are in loop 4+, make the accusation
        if (state.loop >= 4 && hasEnoughForAccusation()) {
            memory.accusationStep++;

            // Step 1: Select Lady Evelyn as suspect
            if (memory.accusationStep === 1) {
                enqueue({ type: 'wait', ms: thinkingPause() });
                enqueue({ type: 'fn', fn: () => {
                    const suspectBtns = document.querySelectorAll('.suspect-btn');
                    for (const btn of suspectBtns) {
                        if (btn.textContent.includes('Lady Evelyn')) {
                            btn.click();
                            break;
                        }
                    }
                }});
                enqueue({ type: 'wait', ms: readingPause() });
                return;
            }

            // Step 2: Select evidence
            if (memory.accusationStep === 2) {
                enqueue({ type: 'wait', ms: shortPause() });
                enqueue({ type: 'fn', fn: () => {
                    // Check critical evidence items
                    const critical = ['poison_vial', 'love_letters', 'secret_passage',
                                     'brandy_glass', 'burned_letter', 'empty_vial',
                                     'insurance_policy', 'wolfsbane_kitchen', 'brandy_note'];
                    const checkboxes = document.querySelectorAll('.evidence-check input[type="checkbox"]');
                    checkboxes.forEach(cb => {
                        if (critical.includes(cb.value) || state.discoveredEvidence.has(cb.value)) {
                            if (!cb.checked) {
                                cb.checked = true;
                                cb.dispatchEvent(new Event('change'));
                            }
                        }
                    });
                }});
                enqueue({ type: 'wait', ms: readingPause() });
                return;
            }

            // Step 3: Confirm accusation
            if (memory.accusationStep === 3) {
                enqueue({ type: 'wait', ms: longPause() });
                const confirmBtn = document.getElementById('btn-confirm-accuse');
                if (confirmBtn) {
                    enqueue({ type: 'hoverEl', el: confirmBtn, ms: rand(500, 1000) });
                    enqueue({ type: 'clickEl', el: confirmBtn });
                }
                memory.accusationStep = 0;
                return;
            }
        }

        // Not ready to accuse — cancel out
        memory.accusationStep = 0;
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
