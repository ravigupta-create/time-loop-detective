/* ═══════════════════════════════════════════════════════
   AUTOPLAY — Secret cheat code "srg2" activates auto-play.
   Spacebar toggles bot on/off. Session-only (no persistence).

   Plays like a real human: variable timing, reading pauses,
   step-by-step minigame solving, strategic exploration with
   memory, eavesdrop hunting, notebook checks, natural pacing.
   ═══════════════════════════════════════════════════════ */

const AutoPlay = (() => {
    const CODE = ['s', 'r', 'g', '2'];
    let codeIndex = 0;
    let activated = false;
    let running = false;
    let tickTimer = null;
    let busy = false; // prevents overlapping actions

    // ── Human-like Timing ──
    const TICK_BASE = 800;    // base tick check interval (ms)
    let nextActionDelay = 0;  // countdown before next action (ms)
    let idleTicks = 0;        // how many ticks we've "thought" before acting

    function randBetween(min, max) { return min + Math.random() * (max - min); }

    // Variable delays to look human
    function shortPause()    { return randBetween(600, 1400); }    // quick glance
    function readingPause()  { return randBetween(2000, 4000); }   // reading text
    function thinkingPause() { return randBetween(1500, 3000); }   // deciding
    function longPause()     { return randBetween(3500, 6000); }   // studying something
    function hesitation()    { return Math.random() < 0.15 ? randBetween(2000, 4500) : 0; }

    // ── Bot Memory (per session) ──
    const memory = {
        roomsExplored: new Set(),       // rooms fully searched this loop
        npcsSpokenTo: new Set(),        // NPCs talked to this loop
        objectsExamined: new Set(),     // objects examined this loop
        failedMinigameAttempts: {},     // track attempts per minigame
        lastRoom: null,                 // avoid ping-ponging
        roomVisitCount: {},             // how many times visited each room
        loopsPlayed: 0,                 // how many loops the bot has played
        notebookCheckTimer: 0,          // time since last notebook peek
        eavesdropTargets: [],           // eavesdrops we're trying to catch
        pendingAction: null,            // queued multi-step action
        dialogueDepth: 0,              // how deep in current conversation
        minigameStep: 0,               // step within a minigame solve
        minigameTimer: 0,              // delay for next minigame step
    };

    // Reset per-loop memory
    function resetLoopMemory() {
        memory.roomsExplored.clear();
        memory.npcsSpokenTo.clear();
        memory.objectsExamined.clear();
        memory.lastRoom = null;
        memory.roomVisitCount = {};
        memory.notebookCheckTimer = 0;
        memory.dialogueDepth = 0;
        memory.loopsPlayed++;
        memory.eavesdropTargets = buildEavesdropPlan();
    }

    // ── Eavesdrop Planning ──
    // Build a list of eavesdrops we should try to catch this loop
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

    // ── Optimal Room Route ──
    // Decide where to go based on what's available
    function pickBestRoom() {
        const state = Engine.state;
        const currentLoc = state.currentLocation;
        const loc = GameData.locations[currentLoc];
        if (!loc) return null;

        const availableExits = loc.exits.filter(e =>
            !e.requiresFlag || state.flags[e.requiresFlag]
        );
        if (availableExits.length === 0) return null;

        // Score each possible destination
        let best = null;
        let bestScore = -Infinity;

        availableExits.forEach(exit => {
            const dest = exit.to;
            let score = 0;
            const destLoc = GameData.locations[dest];
            if (!destLoc) return;

            // Strong bonus: room has undiscovered evidence
            destLoc.objects.forEach(obj => {
                if (obj.evidence && !state.discoveredEvidence.has(obj.evidence)) {
                    const ev = GameData.evidence[obj.evidence];
                    if (!ev) return;
                    if (ev.requiresLoop && state.loop < ev.requiresLoop) return;
                    if (obj.requiresFlag && !state.flags[obj.requiresFlag]) return;
                    score += 30;
                }
            });

            // Bonus: NPCs here we haven't talked to
            const npcsHere = Engine.getNPCsAtLocation(dest, state.time);
            npcsHere.forEach(npc => {
                if (!memory.npcsSpokenTo.has(npc.id)) score += 15;
                else score += 2; // still worth visiting for deeper dialogue
            });

            // Bonus: eavesdrop coming up at this location
            const upcomingEavesdrop = memory.eavesdropTargets.find(e =>
                e.location === dest && Math.abs(state.time - e.time) <= 40
            );
            if (upcomingEavesdrop) score += 50; // highest priority

            // Penalty: just came from there (avoid ping-pong)
            if (dest === memory.lastRoom) score -= 20;

            // Penalty: visited many times already
            const visits = memory.roomVisitCount[dest] || 0;
            score -= visits * 5;

            // Bonus: haven't fully explored yet
            if (!memory.roomsExplored.has(dest)) score += 10;

            // Small random factor (humans aren't perfectly optimal)
            score += randBetween(-3, 3);

            if (score > bestScore) {
                bestScore = score;
                best = exit;
            }
        });

        return best;
    }

    // ── Code Entry Detection ──
    document.addEventListener('keydown', (e) => {
        // Spacebar toggle (only after activation)
        if (activated && e.key === ' ' && Engine.state.screen !== 'title') {
            e.preventDefault();
            e.stopPropagation();
            toggle();
            return;
        }

        // Code entry sequence
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
            nextActionDelay = 0;
            busy = false;
            tickTimer = setInterval(tick, TICK_BASE);
        } else {
            Engine.notify('AUTO-PLAY OFF');
            if (tickTimer) { clearInterval(tickTimer); tickTimer = null; }
            busy = false;
        }
    }

    // ── Main Tick (runs every TICK_BASE ms) ──
    function tick() {
        if (!running || busy) return;

        // Countdown delay before next action
        if (nextActionDelay > 0) {
            nextActionDelay -= TICK_BASE;
            return;
        }

        try {
            const screen = Engine.state.screen;
            switch (screen) {
                case 'title':        handleTitle(); break;
                case 'intro':        handleIntro(); break;
                case 'playing':      handlePlaying(); break;
                case 'dialogue':     handleDialogue(); break;
                case 'minigame':     handleMinigame(); break;
                case 'notebook':     handleNotebook(); break;
                case 'accusation':   handleAccusation(); break;
                case 'fast_forward': handleFastForward(); break;
                case 'eavesdrop':    handleEavesdrop(); break;
                case 'loop_recap':   handleLoopRecap(); break;
                case 'ending':       break;
                case 'help':         handleHelp(); break;
                case 'settings':     break;
            }
        } catch (e) {
            // Game state may be in transition — wait a tick
            nextActionDelay = shortPause();
        }
    }

    // ════════════════════════════════════════════════════
    // SCREEN HANDLERS
    // ════════════════════════════════════════════════════

    function handleTitle() {
        nextActionDelay = readingPause(); // "player reads title screen"
        const cont = document.getElementById('btn-continue');
        const newg = document.getElementById('btn-new-game');
        if (cont && cont.style.display !== 'none') {
            cont.click();
        } else if (newg) {
            newg.click();
        }
    }

    function handleIntro() {
        // Read each intro slide for a natural duration
        nextActionDelay = readingPause();
        const screen = document.getElementById('intro-screen');
        if (screen) screen.click();
    }

    function handleLoopRecap() {
        // Read the recap before clicking
        nextActionDelay = longPause();
        const btn = document.getElementById('btn-begin-loop');
        if (btn) {
            btn.click();
            resetLoopMemory();
        }
    }

    function handleHelp() {
        nextActionDelay = shortPause();
        const btn = document.getElementById('help-close');
        if (btn) btn.click();
    }

    // ── Playing (Main Game) ──
    function handlePlaying() {
        // If transitioning, wait patiently
        if (Renderer.isTransitioning()) {
            nextActionDelay = shortPause();
            return;
        }

        // Track current room visits
        const currentLoc = Engine.state.currentLocation;
        memory.roomVisitCount[currentLoc] = (memory.roomVisitCount[currentLoc] || 0);

        // If just entered a new room, pause to "look around"
        if (currentLoc !== memory.lastRoom) {
            memory.lastRoom = currentLoc;
            memory.roomVisitCount[currentLoc]++;
            nextActionDelay = readingPause() + hesitation();
            return;
        }

        // Occasionally check notebook (like a real detective)
        memory.notebookCheckTimer += TICK_BASE;
        if (memory.notebookCheckTimer > 45000 && Engine.state.discoveredEvidence.size > 0 && Math.random() < 0.12) {
            memory.notebookCheckTimer = 0;
            nextActionDelay = shortPause();
            // Simulate pressing N
            const evt = new KeyboardEvent('keydown', { key: 'n', bubbles: true });
            document.dispatchEvent(evt);
            return;
        }

        // Past murder time — wait for midnight
        if (Engine.state.time >= 1410) {
            nextActionDelay = longPause();
            return;
        }

        // Check if there's an eavesdrop we should go catch
        const urgentEavesdrop = memory.eavesdropTargets.find(e => {
            const timeDiff = e.time - Engine.state.time;
            return timeDiff > -10 && timeDiff < 50; // within 50 min window
        });

        if (urgentEavesdrop && Engine.state.currentLocation !== urgentEavesdrop.location) {
            // Navigate toward eavesdrop location
            const hotspots = Hotspots.getHotspots();
            const exitToEavesdrop = hotspots.find(hs =>
                hs.type === 'exit' && hs.action &&
                isExitToward(hs, urgentEavesdrop.location)
            );
            if (exitToEavesdrop) {
                nextActionDelay = thinkingPause();
                Audio.playSound('click');
                exitToEavesdrop.action();
                return;
            }
        }

        // Get available hotspots
        const hotspots = Hotspots.getHotspots();
        if (!hotspots || hotspots.length === 0) {
            nextActionDelay = shortPause();
            return;
        }

        // Categorize hotspots
        const evidence = [];
        const npcs = [];
        const objects = [];
        const exits = [];

        hotspots.forEach(hs => {
            if (hs.type === 'exit') {
                exits.push(hs);
            } else if (hs.type === 'npc') {
                npcs.push(hs);
            } else if (hs.hasEvidence && !Engine.state.discoveredEvidence.has(hs.evidenceId)) {
                evidence.push(hs);
            } else if (hs.type === 'object' || hs.type === 'examine') {
                objects.push(hs);
            }
        });

        // Filter NPCs to those we haven't spoken to recently
        const freshNPCs = npcs.filter(hs => {
            const npcId = extractNPCId(hs);
            return npcId && !memory.npcsSpokenTo.has(npcId);
        });

        // Filter objects to those we haven't examined this loop
        const freshObjects = objects.filter(hs => {
            const objId = extractObjectId(hs);
            return objId && !memory.objectsExamined.has(objId);
        });

        // ── Decision Priority ──
        let target = null;
        let delay = thinkingPause();

        if (evidence.length > 0) {
            // Evidence is always top priority — examine it
            target = evidence[0];
            delay = thinkingPause(); // "noticing something"
        } else if (freshNPCs.length > 0) {
            // Talk to someone new
            target = freshNPCs[Math.floor(Math.random() * freshNPCs.length)];
            delay = shortPause();
            const npcId = extractNPCId(target);
            if (npcId) memory.npcsSpokenTo.add(npcId);
        } else if (freshObjects.length > 0) {
            // Examine remaining objects
            target = freshObjects[0];
            delay = thinkingPause();
            const objId = extractObjectId(target);
            if (objId) memory.objectsExamined.add(objId);
        } else {
            // Room is fully explored — mark it and move on
            memory.roomsExplored.add(currentLoc);

            // If we've talked to NPCs but there might be deeper dialogue, re-talk
            if (npcs.length > 0 && Math.random() < 0.2) {
                target = npcs[Math.floor(Math.random() * npcs.length)];
                delay = thinkingPause();
            } else {
                // Find best exit
                const bestExit = pickBestRoom();
                if (bestExit) {
                    // Find the hotspot matching this exit
                    target = exits.find(hs =>
                        hs.label && hs.label.includes(bestExit.label)
                    );
                    // Fallback: just pick any exit
                    if (!target && exits.length > 0) {
                        // Avoid going back to previous room
                        const forwardExits = exits.filter(hs => {
                            const label = hs.label || '';
                            const prevLoc = Engine.state.previousLocation;
                            if (!prevLoc) return true;
                            const prevName = GameData.locations[prevLoc]?.name || '';
                            return !label.includes(prevName);
                        });
                        target = forwardExits.length > 0
                            ? forwardExits[Math.floor(Math.random() * forwardExits.length)]
                            : exits[Math.floor(Math.random() * exits.length)];
                    }
                    delay = readingPause(); // "deciding where to go"
                }
            }
        }

        if (target && target.action) {
            nextActionDelay = delay + hesitation();
            Audio.playSound('click');
            target.action();
        } else {
            nextActionDelay = shortPause();
        }
    }

    // Check if an exit hotspot leads toward a target location
    function isExitToward(hs, targetLocation) {
        if (!hs.label) return false;
        const targetName = GameData.locations[targetLocation]?.name || '';
        if (hs.label.includes(targetName)) return true;
        // Check if the exit goes to grand_hallway (hub) when target is elsewhere
        if (hs.label.includes('Grand Hallway') && targetLocation !== Engine.state.currentLocation) return true;
        return false;
    }

    // Extract NPC ID from a hotspot label like "🗣️ Talk to Lady Evelyn"
    function extractNPCId(hs) {
        if (!hs.label) return null;
        for (const [id, npc] of Object.entries(GameData.npcs)) {
            if (hs.label.includes(npc.name)) return id;
        }
        return null;
    }

    // Extract object ID from hotspot label
    function extractObjectId(hs) {
        if (!hs.label) return null;
        const loc = GameData.locations[Engine.state.currentLocation];
        if (!loc) return null;
        for (const obj of loc.objects) {
            if (hs.label.includes(obj.name)) return obj.id;
        }
        return null;
    }

    // ── Dialogue ──
    function handleDialogue() {
        const textEl = document.getElementById('dialogue-text');
        const buttons = document.querySelectorAll('#dialogue-choices button');

        // Wait for typewriter to finish (or skip it after a reading pause)
        if (buttons.length === 0) {
            // Typewriter still going — wait, then click to skip
            if (memory.dialogueDepth === 0) {
                nextActionDelay = readingPause();
                memory.dialogueDepth = 1;
            } else {
                // Click to skip typewriter
                if (textEl) textEl.click();
                nextActionDelay = shortPause();
                memory.dialogueDepth = 0;
            }
            return;
        }

        // Choices are visible — "read" them first
        const textLength = textEl ? textEl.textContent.length : 0;
        const readTime = Math.min(5000, textLength * 30 + 800); // ~30ms per char

        const available = [];
        let endBtn = null;

        buttons.forEach(btn => {
            if (btn.classList.contains('locked')) return;
            const text = btn.textContent;
            if (text.includes('End conversation') || text.includes('[End')) {
                endBtn = btn;
            } else {
                available.push(btn);
            }
        });

        // Pick a choice with human-like preference
        let chosen = null;
        const evidenceChoices = available.filter(b => b.classList.contains('evidence-choice'));

        if (evidenceChoices.length > 0) {
            // Evidence choices are gold — pick one (prefer first, but occasionally pick another)
            chosen = evidenceChoices[Math.random() < 0.8 ? 0 : Math.floor(Math.random() * evidenceChoices.length)];
        } else if (available.length > 0) {
            // Normal choices — don't always pick first (human reads and considers)
            if (available.length === 1) {
                chosen = available[0];
            } else {
                // Slight preference for earlier choices but not always
                const weights = available.map((_, i) => Math.max(0.1, 1 - i * 0.25));
                const totalWeight = weights.reduce((a, b) => a + b, 0);
                let r = Math.random() * totalWeight;
                for (let i = 0; i < weights.length; i++) {
                    r -= weights[i];
                    if (r <= 0) { chosen = available[i]; break; }
                }
                if (!chosen) chosen = available[0];
            }
        } else if (endBtn) {
            chosen = endBtn;
            memory.dialogueDepth = 0;
        }

        if (chosen) {
            nextActionDelay = readTime + hesitation();
            Audio.playSound('click');
            chosen.click();
        }
    }

    // ── Minigame (Step-by-Step Solving) ──
    function handleMinigame() {
        if (!MiniGames.isActive()) return;

        // Use step-by-step for realistic feel, with delays between steps
        const mgType = MiniGames.getActiveType ? MiniGames.getActiveType() : null;

        // If we've been stuck for a while, use autoSolve as fallback
        memory.minigameStep++;
        if (memory.minigameStep > 12) {
            memory.minigameStep = 0;
            MiniGames.autoSolve();
            nextActionDelay = shortPause();
            return;
        }

        // Try step-by-step interaction via exposed methods
        if (MiniGames.botStep) {
            nextActionDelay = thinkingPause();
            const solved = MiniGames.botStep();
            if (solved) {
                memory.minigameStep = 0;
                nextActionDelay = readingPause(); // "react to solving"
            }
        } else {
            // Fallback: autoSolve after a realistic pause
            nextActionDelay = longPause();
            MiniGames.autoSolve();
            memory.minigameStep = 0;
        }
    }

    // ── Other Screens ──

    function handleNotebook() {
        // Spend time "reading" the notebook before closing
        nextActionDelay = longPause();
        const closeBtn = document.getElementById('notebook-close');
        if (closeBtn) closeBtn.click();
    }

    function handleAccusation() {
        // Don't auto-accuse — close after a pause
        nextActionDelay = thinkingPause();
        const cancelBtn = document.getElementById('btn-cancel-accuse');
        if (cancelBtn) {
            cancelBtn.click();
        } else {
            const evt = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
            document.dispatchEvent(evt);
        }
    }

    function handleFastForward() {
        nextActionDelay = shortPause();
        const cancelBtn = document.getElementById('ff-cancel');
        if (cancelBtn) cancelBtn.click();
    }

    function handleEavesdrop() {
        // Read eavesdrop text before advancing — this is important content
        const textEl = document.getElementById('eavesdrop-text');
        const textLength = textEl ? textEl.textContent.length : 0;
        nextActionDelay = Math.max(readingPause(), textLength * 35 + 1000);
        const overlay = document.getElementById('eavesdrop-overlay');
        if (overlay) overlay.click();
    }

    // ── Public API ──
    function isRunning() { return running; }
    function isActivated() { return activated; }

    return { isRunning, isActivated };
})();
