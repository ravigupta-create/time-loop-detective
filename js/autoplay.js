/* ═══════════════════════════════════════════════════════
   AUTOPLAY — Secret cheat code "srg2" activates auto-play.

   Two modes:
   1. NORMAL — spacebar toggles. Human-like: ghost cursor,
      hover-before-click, variable pacing, reading delays,
      step-by-step minigames, strategic eavesdrop planning,
      notebook browsing, dialogue intelligence (never repeats),
      evidence-aware NPC targeting, smart accusation.
   2. MAX — type "max" at the prompt. Perfect decisions only,
      1 second per action. Analyses dialogue trees for optimal
      paths, instant minigames, fastest route to true_justice.

   Session-only (no persistence). 100% free, zero deps.
   ═══════════════════════════════════════════════════════ */

const AutoPlay = (() => {
    const CODE = ['s', 'r', 'g', '2'];
    let codeIndex = 0;
    let activated = false;
    let running = false;
    let tickTimer = null;
    let maxMode = false;

    // ── Timing Constants ──
    const TICK_MS = 100;
    const MAX_DELAY = 1000; // 1 second per action in max mode

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
        // Dialogue intelligence
        dialogueChoices: {},
        npcExhausted: new Set(),
        currentDialogueNPC: null,
        evidenceWhenTalked: {},
        confrontsTriggered: new Set(),
        npcTalkCount: {},
        readyToAccuse: false,
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
        memory.npcExhausted.clear();
        memory.currentDialogueNPC = null;
        memory.evidenceWhenTalked = {};
        memory.npcTalkCount = {};
        memory.readyToAccuse = false;
        memory.accusationStep = 0;
        memory.loopsPlayed++;
        memory.eavesdropTargets = buildEavesdropPlan();
    }

    // ── Momentum System (normal mode only) ──
    function updateMomentum() {
        if (maxMode) { memory.momentum = 1; return; }
        const t = Engine.state.time;
        if (t < 480) memory.momentum = rand(0.7, 0.9);
        else if (t < 1200) memory.momentum = rand(0.9, 1.1);
        else if (t < 1380) memory.momentum = rand(1.1, 1.3);
        else memory.momentum = rand(1.2, 1.5);
        if (Date.now() - memory.lastEvidenceTime < 5000) {
            memory.momentum *= 0.6;
        }
    }

    // Timing functions — in max mode all return MAX_DELAY
    function shortPause()    { return maxMode ? MAX_DELAY : rand(500, 1200) / memory.momentum; }
    function readingPause()  { return maxMode ? MAX_DELAY : rand(1800, 3500) / memory.momentum; }
    function thinkingPause() { return maxMode ? MAX_DELAY : rand(1400, 2800) / memory.momentum; }
    function longPause()     { return maxMode ? MAX_DELAY : rand(3000, 5500) / memory.momentum; }
    function hesitation()    { return maxMode ? 0 : (Math.random() < 0.18 ? rand(1500, 4000) / memory.momentum : 0); }
    function textReadTime(len) { return maxMode ? MAX_DELAY : Math.min(6000, len * 28 + 600) / memory.momentum; }

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

    function getNPCIdFromDialogueName() {
        const nameEl = document.getElementById('dialogue-name');
        if (!nameEl) return null;
        const name = nameEl.textContent.trim();
        for (const [id, npc] of Object.entries(GameData.npcs)) {
            if (npc.name === name) return id;
        }
        return null;
    }

    function getChosenTexts(npcId) {
        if (!memory.dialogueChoices[npcId]) {
            memory.dialogueChoices[npcId] = new Set();
        }
        return memory.dialogueChoices[npcId];
    }

    function recordChoice(npcId, buttonText) {
        if (!npcId) return;
        getChosenTexts(npcId).add(buttonText);
    }

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
            const hasReqs = tree[nodeId].requires.every(req =>
                state.discoveredEvidence.has(req) ||
                state.knownFacts.has(req) ||
                state.flags[req]
            );
            if (!hasReqs) continue;
            const flagKey = npcId + '_' + nodeId + '_' + state.loop;
            if (state.flags[flagKey]) continue;
            if (tree[nodeId].location && state.currentLocation !== tree[nodeId].location) continue;
            if (tree[nodeId].timeWindow) {
                const t = state.time;
                if (t < tree[nodeId].timeWindow.start || t > tree[nodeId].timeWindow.end) continue;
            }
            return true;
        }
        return false;
    }

    function hasEnoughForAccusation() {
        const state = Engine.state;
        const critical = ['poison_vial', 'love_letters', 'secret_passage', 'brandy_glass'];
        const hasCritical = critical.filter(e => state.discoveredEvidence.has(e)).length;
        return hasCritical >= 3 && state.discoveredEvidence.size >= 8;
    }

    function countDialogueDepth(npcId) {
        const tree = GameData.dialogues[npcId];
        if (!tree || !tree.greeting) return 0;
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

    function isDialogueExhausted(npcId) {
        if (memory.npcExhausted.has(npcId)) return true;
        const chosen = getChosenTexts(npcId);
        const totalDepth = countDialogueDepth(npcId);
        if (totalDepth > 0 && chosen.size >= totalDepth * 0.6) return true;
        return false;
    }

    // ═══════════════════════════════════════════════════════
    // MAX MODE — Optimal dialogue tree analysis
    // ═══════════════════════════════════════════════════════

    // Count total reveals reachable from a given dialogue node
    function countReveals(tree, nodeId, visited) {
        if (!nodeId || !tree[nodeId] || visited.has(nodeId)) return 0;
        visited.add(nodeId);
        const node = tree[nodeId];
        let score = 0;
        if (node.reveals) score += node.reveals.length * 3;
        if (node.evidence) score += 5;
        if (node.flags) score += node.flags.length * 2;
        if (node.responses) {
            for (const r of node.responses) {
                if (r.next) score += countReveals(tree, r.next, visited);
            }
        }
        return score;
    }

    // Find the optimal dialogue choice by analysing the tree
    function findOptimalChoice(npcId, buttons) {
        const tree = GameData.dialogues[npcId];
        if (!tree) return buttons[0];

        let bestBtn = null, bestScore = -1;
        for (const btn of buttons) {
            const text = btn.textContent.trim();
            // Search all nodes for this response text
            for (const [nodeId, node] of Object.entries(tree)) {
                if (!node.responses) continue;
                const resp = node.responses.find(r => r.text === text);
                if (!resp) continue;
                let score = 0;
                if (resp.next) {
                    score += countReveals(tree, resp.next, new Set());
                }
                // Evidence-gated choices are extremely valuable
                if (resp.requires) score += 20;
                // Avoid terminal choices (next: null) unless they're the only option
                if (resp.next === null) score -= 5;
                if (score > bestScore) {
                    bestScore = score;
                    bestBtn = btn;
                }
                break;
            }
        }
        return bestBtn || buttons[0];
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
                score += maxMode ? 100 : 35;
            }
        });

        // NPCs at this location
        const npcsHere = Engine.getNPCsAtLocation(destId, state.time);
        npcsHere.forEach(npc => {
            if (!memory.npcsSpokenTo.has(npc.id)) {
                score += maxMode ? 50 : 18;
            } else if (hasNewConfrontNodes(npc.id)) {
                score += maxMode ? 80 : 40;
            } else if (!isDialogueExhausted(npc.id)) {
                score += 8;
            } else {
                score += maxMode ? 0 : 1;
            }
        });

        // Upcoming eavesdrop
        const eavesdrop = memory.eavesdropTargets.find(e =>
            e.location === destId && Math.abs(state.time - e.time) <= 45
        );
        if (eavesdrop) score += maxMode ? 120 : 60;

        // Avoid ping-pong
        if (destId === memory.lastRoom) score -= 25;
        if (destId === memory.secondLastRoom) score -= 10;

        // Visit count penalty
        score -= (memory.roomVisitCount[destId] || 0) * (maxMode ? 15 : 6);

        // Unexplored bonus
        if (!memory.roomsExplored.has(destId)) score += maxMode ? 30 : 12;

        // No randomness in max mode
        if (!maxMode) score += rand(-4, 4);

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

    // ═══════════════════════════════════════════════════════
    // MODE PROMPT — shown after "srg2" code entry
    // ═══════════════════════════════════════════════════════

    function showModePrompt() {
        const overlay = document.createElement('div');
        overlay.id = 'autoplay-prompt';
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;' +
            'background:rgba(0,0,0,0.75);display:flex;align-items:center;' +
            'justify-content:center;z-index:9999;';

        const box = document.createElement('div');
        box.style.cssText = 'background:#1a1a2e;border:2px solid #d4a020;padding:28px 36px;' +
            'border-radius:8px;text-align:center;font-family:monospace;min-width:320px;';

        const title = document.createElement('div');
        title.textContent = 'AUTO-PLAY';
        title.style.cssText = 'color:#d4a020;font-size:20px;font-weight:bold;' +
            'margin-bottom:6px;letter-spacing:2px;';

        const subtitle = document.createElement('div');
        subtitle.textContent = 'Code accepted';
        subtitle.style.cssText = 'color:#6a6a80;font-size:12px;margin-bottom:18px;';

        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'type "max" or press Enter';
        input.style.cssText = 'background:#0d0d1a;color:#e0e0e0;border:1px solid #6a6a80;' +
            'padding:10px 14px;font-size:14px;font-family:monospace;width:240px;' +
            'text-align:center;border-radius:4px;outline:none;';

        const hint = document.createElement('div');
        hint.innerHTML = '<span style="color:#d4a020">max</span> = perfect play, 1s actions' +
            '<br><span style="color:#6a6a80">Enter</span> = realistic mode (Space to toggle)';
        hint.style.cssText = 'color:#8a8a9a;font-size:11px;margin-top:14px;line-height:1.6;';

        box.appendChild(title);
        box.appendChild(subtitle);
        box.appendChild(input);
        box.appendChild(hint);
        overlay.appendChild(box);
        document.body.appendChild(overlay);

        input.focus();

        function finish(isMax) {
            overlay.remove();
            activated = true;
            if (isMax) {
                maxMode = true;
                Engine.notify('MAX MODE — perfect play, 1s per action');
                startRunning();
            } else {
                maxMode = false;
                Engine.notify('Auto-play ready — press Space to toggle');
            }
        }

        input.addEventListener('keydown', (e) => {
            e.stopPropagation();
            if (e.key === 'Enter') {
                finish(input.value.trim().toLowerCase() === 'max');
            } else if (e.key === 'Escape') {
                finish(false);
            }
        });

        // Clicking outside the box = normal mode
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) finish(false);
        });
    }

    // ── Code Entry Detection ──
    document.addEventListener('keydown', (e) => {
        // Spacebar toggle (normal mode only, after activation)
        if (activated && !maxMode && e.key === ' ' && Engine.state.screen !== 'title') {
            e.preventDefault();
            e.stopPropagation();
            toggle();
            return;
        }
        if (!activated) {
            if (e.key.toLowerCase() === CODE[codeIndex]) {
                codeIndex++;
                if (codeIndex >= CODE.length) {
                    codeIndex = 0;
                    showModePrompt();
                }
            } else {
                codeIndex = e.key.toLowerCase() === CODE[0] ? 1 : 0;
            }
        }
    }, true);

    function startRunning() {
        running = true;
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
    }

    function toggle() {
        running = !running;
        if (running) {
            Engine.notify('AUTO-PLAY ON');
            startRunning();
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
        if (!maxMode) updateCursor();
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
                case 'playing':      maxMode ? maxDecidePlaying() : decidePlaying(); break;
                case 'dialogue':     maxMode ? maxDecideDialogue() : decideDialogue(); break;
                case 'minigame':     maxMode ? maxDecideMinigame() : decideMinigame(); break;
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
    // NORMAL MODE DECISION MAKERS
    // ════════════════════════════════════════════════════

    function decideTitle() {
        enqueue({ type: 'wait', ms: maxMode ? MAX_DELAY : readingPause() });
        const cont = document.getElementById('btn-continue');
        const btn = (cont && cont.style.display !== 'none') ? cont : document.getElementById('btn-new-game');
        if (btn) {
            if (!maxMode) enqueue({ type: 'hoverEl', el: btn, ms: rand(600, 1200) });
            enqueue({ type: 'clickEl', el: btn });
        }
    }

    function decideIntro() {
        const textEl = document.getElementById('intro-text');
        if (maxMode) {
            // Skip through intro quickly
            if (textEl) enqueue({ type: 'clickEl', el: textEl });
            enqueue({ type: 'wait', ms: MAX_DELAY });
            const screen = document.getElementById('intro-screen');
            if (screen) enqueue({ type: 'clickEl', el: screen });
            return;
        }
        const len = textEl ? textEl.textContent.length : 50;
        enqueue({ type: 'wait', ms: textReadTime(len) + hesitation() });
        const screen = document.getElementById('intro-screen');
        if (screen) enqueue({ type: 'clickEl', el: screen });
    }

    function decideLoopRecap() {
        enqueue({ type: 'wait', ms: maxMode ? MAX_DELAY : longPause() + rand(1000, 2000) });
        const btn = document.getElementById('btn-begin-loop');
        if (btn) {
            if (!maxMode) enqueue({ type: 'hoverEl', el: btn, ms: rand(400, 800) });
            enqueue({ type: 'clickEl', el: btn });
            enqueue({ type: 'fn', fn: () => resetLoopMemory() });
        }
    }

    function decideHelp() {
        enqueue({ type: 'wait', ms: maxMode ? MAX_DELAY : readingPause() });
        const btn = document.getElementById('help-close');
        if (btn) enqueue({ type: 'clickEl', el: btn });
    }

    // ── Normal Mode: Playing ──
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

        // Smart Accusation Check
        if (state.loop >= 4 && hasEnoughForAccusation() && !memory.readyToAccuse
            && state.time > 600 && state.time < 1350) {
            memory.readyToAccuse = true;
            enqueue({ type: 'wait', ms: thinkingPause() });
            enqueue({ type: 'key', key: 'n' });
            return;
        }
        if (memory.readyToAccuse && memory.notebookTabsVisited === 0 && state.loop >= 4) {
            memory.readyToAccuse = false;
            enqueue({ type: 'wait', ms: longPause() });
            enqueue({ type: 'key', key: 'a' });
            return;
        }

        // Notebook Check
        memory.notebookCheckTimer += TICK_MS;
        if (memory.notebookCheckTimer > 40000 && state.discoveredEvidence.size > 2 && Math.random() < 0.08) {
            memory.notebookCheckTimer = 0;
            enqueue({ type: 'wait', ms: shortPause() });
            enqueue({ type: 'key', key: 'n' });
            return;
        }

        // Past Murder
        if (state.time >= 1410) {
            const canvas = document.getElementById('game-canvas');
            if (canvas) {
                enqueue({ type: 'fn', fn: () => moveCursorTo(canvas.width * rand(0.2, 0.8), canvas.height * rand(0.2, 0.7)) });
            }
            enqueue({ type: 'wait', ms: longPause() });
            return;
        }

        // Strategic Wait for Eavesdrop
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

        // Navigate Toward Eavesdrop
        const urgentEavesdrop = memory.eavesdropTargets.find(e => {
            const diff = e.time - state.time;
            return diff > -15 && diff < 55;
        });
        if (urgentEavesdrop && currentLoc !== urgentEavesdrop.location) {
            const hotspots = Hotspots.getHotspots();
            const exitHS = hotspots.find(hs =>
                hs.type === 'exit' && hs.action && !isExitLocked(hs) && isExitToward(hs, urgentEavesdrop.location)
            );
            if (exitHS) {
                enqueue({ type: 'hover', target: exitHS, ms: rand(500, 1000) });
                enqueue({ type: 'wait', ms: thinkingPause() });
                enqueue({ type: 'click', target: exitHS });
                return;
            }
        }

        // Get Hotspots
        const hotspots = Hotspots.getHotspots();
        if (!hotspots || hotspots.length === 0) {
            enqueue({ type: 'wait', ms: shortPause() });
            return;
        }

        const evidence = [], npcs = [], objects = [], exits = [];
        hotspots.forEach(hs => {
            if (hs.type === 'exit' && !isExitLocked(hs)) exits.push(hs);
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

        // Priority 2: Fresh NPCs
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

        // Priority 3: Fresh objects
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

        memory.roomsExplored.add(currentLoc);

        // Priority 4: NPCs with new confront nodes
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

        // Priority 5: Re-talk (evidence-triggered)
        const retalkNPCs = npcs.filter(hs => {
            const npcId = extractNPCId(hs);
            if (!npcId) return false;
            if (isDialogueExhausted(npcId)) return false;
            const evidenceThen = memory.evidenceWhenTalked[npcId] || 0;
            if (state.discoveredEvidence.size <= evidenceThen) return false;
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

        // Priority 6: Move to best room
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

    // ── Normal Mode: Dialogue ──
    function decideDialogue() {
        const textEl = document.getElementById('dialogue-text');
        const buttons = document.querySelectorAll('#dialogue-choices button');

        if (!memory.currentDialogueNPC) {
            memory.currentDialogueNPC = getNPCIdFromDialogueName();
        }
        const npcId = memory.currentDialogueNPC;

        if (buttons.length === 0) {
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
        const textLen = textEl ? textEl.textContent.length : 40;
        enqueue({ type: 'wait', ms: textReadTime(textLen) });

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

        const chosenTexts = npcId ? getChosenTexts(npcId) : new Set();
        const newChoices = available.filter(btn => !chosenTexts.has(btn.textContent.trim()));
        const oldChoices = available.filter(btn => chosenTexts.has(btn.textContent.trim()));
        const newEvidenceChoices = newChoices.filter(b => b.classList.contains('evidence-choice'));
        const oldEvidenceChoices = oldChoices.filter(b => b.classList.contains('evidence-choice'));

        const scanTargets = newChoices.length > 0 ? newChoices : available;
        if (scanTargets.length > 1) {
            const scanCount = Math.min(scanTargets.length, randInt(1, 2));
            for (let i = 0; i < scanCount; i++) {
                enqueue({ type: 'hoverEl', el: scanTargets[i], ms: rand(300, 700) });
            }
            enqueue({ type: 'wait', ms: rand(400, 1000) });
        }

        let chosen = null;
        if (newEvidenceChoices.length > 0) {
            chosen = newEvidenceChoices[0];
        } else if (oldEvidenceChoices.length > 0 && newChoices.length === 0) {
            chosen = oldEvidenceChoices[0];
        } else if (newChoices.length > 0) {
            if (newChoices.length === 1) {
                chosen = newChoices[0];
            } else {
                const weights = newChoices.map((_, i) => Math.max(0.15, 1 - i * 0.25));
                const total = weights.reduce((a, b) => a + b, 0);
                let r = Math.random() * total;
                for (let i = 0; i < weights.length; i++) {
                    r -= weights[i];
                    if (r <= 0) { chosen = newChoices[i]; break; }
                }
                if (!chosen) chosen = newChoices[0];
            }
        } else if (endBtn) {
            chosen = endBtn;
            if (npcId && available.length > 0 && newChoices.length === 0) {
                memory.npcExhausted.add(npcId);
            }
        } else if (available.length > 0) {
            chosen = available[0];
        }

        if (chosen) {
            if (npcId) recordChoice(npcId, chosen.textContent.trim());
            enqueue({ type: 'hoverEl', el: chosen, ms: rand(200, 500) });
            enqueue({ type: 'clickEl', el: chosen });
        }
    }

    // ── Normal Mode: Minigame ──
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

    // ════════════════════════════════════════════════════
    // MAX MODE DECISION MAKERS
    // ════════════════════════════════════════════════════

    function maxDecidePlaying() {
        if (Renderer.isTransitioning()) {
            enqueue({ type: 'wait', ms: 300 });
            return;
        }

        const state = Engine.state;
        const currentLoc = state.currentLocation;

        // Track room entry
        if (currentLoc !== memory.lastRoom) {
            memory.secondLastRoom = memory.lastRoom;
            memory.lastRoom = currentLoc;
            memory.roomVisitCount[currentLoc] = (memory.roomVisitCount[currentLoc] || 0) + 1;
            enqueue({ type: 'wait', ms: MAX_DELAY });
            return;
        }

        // Accuse ASAP when ready
        if (state.loop >= 4 && hasEnoughForAccusation() && state.time > 480 && state.time < 1380) {
            enqueue({ type: 'wait', ms: MAX_DELAY });
            enqueue({ type: 'key', key: 'a' });
            return;
        }

        // Past murder — just wait
        if (state.time >= 1410) {
            enqueue({ type: 'wait', ms: MAX_DELAY });
            return;
        }

        // Navigate toward eavesdrop
        const urgentEavesdrop = memory.eavesdropTargets.find(e => {
            const diff = e.time - state.time;
            return diff > -15 && diff < 55;
        });
        if (urgentEavesdrop && currentLoc !== urgentEavesdrop.location) {
            const hotspots = Hotspots.getHotspots();
            const exitHS = hotspots.find(hs =>
                hs.type === 'exit' && hs.action && !isExitLocked(hs) && isExitToward(hs, urgentEavesdrop.location)
            );
            if (exitHS) {
                enqueue({ type: 'click', target: exitHS, ms: MAX_DELAY });
                return;
            }
        }

        // Wait for eavesdrop if close
        const waitTarget = shouldWait();
        if (waitTarget) {
            const waitBtn = document.getElementById('btn-wait');
            if (waitBtn) {
                enqueue({ type: 'clickEl', el: waitBtn, ms: MAX_DELAY });
                return;
            }
        }

        // Get hotspots
        const hotspots = Hotspots.getHotspots();
        if (!hotspots || hotspots.length === 0) {
            enqueue({ type: 'wait', ms: MAX_DELAY });
            return;
        }

        const evidence = [], npcs = [], objects = [], exits = [];
        hotspots.forEach(hs => {
            if (hs.type === 'exit' && !isExitLocked(hs)) exits.push(hs);
            else if (hs.type === 'npc') npcs.push(hs);
            else if (hs.hasEvidence && !state.discoveredEvidence.has(hs.evidenceId)) evidence.push(hs);
            else if (hs.type === 'object' || hs.type === 'examine') objects.push(hs);
        });

        // Evidence first
        if (evidence.length > 0) {
            enqueue({ type: 'click', target: evidence[0], ms: MAX_DELAY });
            return;
        }

        // NPCs not yet spoken to
        const freshNPCs = npcs.filter(hs => {
            const id = extractNPCId(hs);
            return id && !memory.npcsSpokenTo.has(id);
        });
        if (freshNPCs.length > 0) {
            const target = freshNPCs[0];
            const npcId = extractNPCId(target);
            if (npcId) {
                memory.npcsSpokenTo.add(npcId);
                memory.npcTalkCount[npcId] = (memory.npcTalkCount[npcId] || 0) + 1;
                memory.currentDialogueNPC = npcId;
            }
            enqueue({ type: 'click', target: target, ms: MAX_DELAY });
            return;
        }

        // Objects not examined
        const freshObjects = objects.filter(hs => {
            const id = extractObjectId(hs);
            return id && !memory.objectsExamined.has(id);
        });
        if (freshObjects.length > 0) {
            const objId = extractObjectId(freshObjects[0]);
            if (objId) memory.objectsExamined.add(objId);
            enqueue({ type: 'click', target: freshObjects[0], ms: MAX_DELAY });
            return;
        }

        memory.roomsExplored.add(currentLoc);

        // NPCs with new confront nodes
        const confrontNPCs = npcs.filter(hs => {
            const npcId = extractNPCId(hs);
            return npcId && hasNewConfrontNodes(npcId);
        });
        if (confrontNPCs.length > 0) {
            const npcId = extractNPCId(confrontNPCs[0]);
            if (npcId) {
                memory.npcTalkCount[npcId] = (memory.npcTalkCount[npcId] || 0) + 1;
                memory.currentDialogueNPC = npcId;
            }
            enqueue({ type: 'click', target: confrontNPCs[0], ms: MAX_DELAY });
            return;
        }

        // Move to best room
        if (exits.length > 0) {
            const best = pickBestExit(exits) || exits[0];
            enqueue({ type: 'click', target: best, ms: MAX_DELAY });
        } else {
            enqueue({ type: 'wait', ms: MAX_DELAY });
        }
    }

    function maxDecideDialogue() {
        const textEl = document.getElementById('dialogue-text');
        const buttons = document.querySelectorAll('#dialogue-choices button');

        if (!memory.currentDialogueNPC) {
            memory.currentDialogueNPC = getNPCIdFromDialogueName();
        }
        const npcId = memory.currentDialogueNPC;

        // Skip typewriter instantly
        if (buttons.length === 0) {
            if (textEl) textEl.click();
            enqueue({ type: 'wait', ms: 300 });
            return;
        }

        // Categorize buttons
        const available = [];
        let endBtn = null;
        buttons.forEach(btn => {
            if (btn.classList.contains('locked')) return;
            const txt = btn.textContent.trim();
            if (txt.includes('End conversation') || txt.includes('[End') ||
                txt === 'Leave.' || txt === 'Leave') {
                endBtn = btn;
            } else {
                available.push(btn);
            }
        });

        let chosen = null;

        if (available.length > 0 && npcId) {
            // Use tree analysis to pick the optimal choice
            chosen = findOptimalChoice(npcId, available);
        } else if (available.length > 0) {
            // No NPC ID — pick evidence choices first, then first available
            const evChoices = available.filter(b => b.classList.contains('evidence-choice'));
            chosen = evChoices.length > 0 ? evChoices[0] : available[0];
        } else if (endBtn) {
            chosen = endBtn;
        }

        if (chosen) {
            if (npcId) recordChoice(npcId, chosen.textContent.trim());
            enqueue({ type: 'clickEl', el: chosen, ms: MAX_DELAY });
        }
    }

    function maxDecideMinigame() {
        if (!MiniGames.isActive()) return;
        // Solve instantly
        enqueue({ type: 'fn', fn: () => MiniGames.autoSolve() });
        enqueue({ type: 'wait', ms: MAX_DELAY });
    }

    // ════════════════════════════════════════════════════
    // SHARED DECISION MAKERS (both modes)
    // ════════════════════════════════════════════════════

    function decideNotebook() {
        if (maxMode) {
            // Close immediately in max mode
            memory.notebookTabsVisited = 0;
            const closeBtn = document.getElementById('notebook-close');
            if (closeBtn) enqueue({ type: 'clickEl', el: closeBtn, ms: MAX_DELAY });
            return;
        }
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

    function decideAccusation() {
        const state = Engine.state;

        // Smart accusation when ready
        if ((state.loop >= 4 || maxMode) && hasEnoughForAccusation()) {
            memory.accusationStep++;

            // Step 1: Select Lady Evelyn
            if (memory.accusationStep === 1) {
                enqueue({ type: 'wait', ms: maxMode ? MAX_DELAY : thinkingPause() });
                enqueue({ type: 'fn', fn: () => {
                    const suspectBtns = document.querySelectorAll('.suspect-btn');
                    for (const btn of suspectBtns) {
                        if (btn.textContent.includes('Lady Evelyn')) {
                            btn.click();
                            break;
                        }
                    }
                }});
                enqueue({ type: 'wait', ms: maxMode ? MAX_DELAY : readingPause() });
                return;
            }

            // Step 2: Select evidence
            if (memory.accusationStep === 2) {
                enqueue({ type: 'wait', ms: maxMode ? MAX_DELAY : shortPause() });
                enqueue({ type: 'fn', fn: () => {
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
                enqueue({ type: 'wait', ms: maxMode ? MAX_DELAY : readingPause() });
                return;
            }

            // Step 3: Confirm
            if (memory.accusationStep === 3) {
                enqueue({ type: 'wait', ms: maxMode ? MAX_DELAY : longPause() });
                const confirmBtn = document.getElementById('btn-confirm-accuse');
                if (confirmBtn) {
                    if (!maxMode) enqueue({ type: 'hoverEl', el: confirmBtn, ms: rand(500, 1000) });
                    enqueue({ type: 'clickEl', el: confirmBtn });
                }
                memory.accusationStep = 0;
                return;
            }
        }

        // Not ready — cancel
        memory.accusationStep = 0;
        enqueue({ type: 'wait', ms: maxMode ? MAX_DELAY : thinkingPause() });
        const cancelBtn = document.getElementById('btn-cancel-accuse');
        if (cancelBtn) {
            if (!maxMode) enqueue({ type: 'hoverEl', el: cancelBtn, ms: rand(300, 600) });
            enqueue({ type: 'clickEl', el: cancelBtn });
        } else {
            enqueue({ type: 'key', key: 'Escape' });
        }
    }

    function decideFastForward() {
        enqueue({ type: 'wait', ms: maxMode ? MAX_DELAY : shortPause() });
        const cancelBtn = document.getElementById('ff-cancel');
        if (cancelBtn) {
            if (!maxMode) enqueue({ type: 'hoverEl', el: cancelBtn, ms: rand(200, 400) });
            enqueue({ type: 'clickEl', el: cancelBtn });
        }
    }

    function decideEavesdrop() {
        const textEl = document.getElementById('eavesdrop-text');
        if (maxMode) {
            if (textEl) textEl.click();
            enqueue({ type: 'wait', ms: MAX_DELAY });
            const overlay = document.getElementById('eavesdrop-overlay');
            if (overlay) enqueue({ type: 'clickEl', el: overlay });
            return;
        }
        const len = textEl ? textEl.textContent.length : 60;
        enqueue({ type: 'wait', ms: textReadTime(len) + rand(800, 1500) });
        const overlay = document.getElementById('eavesdrop-overlay');
        if (overlay) enqueue({ type: 'clickEl', el: overlay });
    }

    // ── Helpers ──

    function isExitLocked(hs) {
        return hs.label && (hs.label.includes('🔒') || hs.label.includes('Locked'));
    }

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
    function isMaxMode() { return maxMode; }

    return { isRunning, isActivated, getCursor, isMaxMode };
})();
