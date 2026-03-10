/* ═══════════════════════════════════════════════════════
   ENGINE — Core game state, time, input, save/load
   ═══════════════════════════════════════════════════════ */

const Engine = (() => {
    // ── Game Mode ──
    let gameMode = 'normal'; // 'normal', 'hard', 'newgameplus', 'speedrun'
    let speedrunStart = 0;

    // ── Game State ──
    const state = {
        screen: 'title',
        loop: 0,
        time: 360, // 6:00 AM in minutes
        currentLocation: 'your_room',
        previousLocation: null,
        knownFacts: new Set(),
        discoveredEvidence: new Set(),
        evidenceConnections: [],
        npcTrust: {},
        flags: {},
        loopHistory: [],
        currentLoopEvents: [],
        notebook: {
            clues: [],
            profiles: {},
            timeline: [],
            theories: [],
        },
        accusationsMade: [],
        totalLoops: 0,
        totalActions: 0,
        visitedLocations: new Set(),
        talkedTo: new Set(),
        eavesdropsWitnessed: new Set(),
        bookshelfExamineCount: 0,
        started: false,
        achievements: new Set(),
    };

    // ── Input State ──
    const input = {
        keys: {},
        mouseX: 0,
        mouseY: 0,
        clicked: false,
    };

    // ── Initialization ──
    function init() {
        // Input listeners
        document.addEventListener('keydown', e => {
            input.keys[e.key.toLowerCase()] = true;
            handleKeyPress(e.key.toLowerCase(), e);
        });
        document.addEventListener('keyup', e => {
            input.keys[e.key.toLowerCase()] = false;
        });
        document.addEventListener('mousemove', e => {
            input.mouseX = e.clientX;
            input.mouseY = e.clientY;
        });

        // Check for save
        if (hasSave()) {
            document.getElementById('btn-continue').style.display = '';
        }
    }

    function handleKeyPress(key, event) {
        // Minigames capture input first
        if (MiniGames.isActive()) {
            MiniGames.handleKeyDown(key);
            return;
        }
        if (state.screen === 'playing') {
            if (key === 'n') UI.toggleNotebook();
            else if (key === 'w') UI.showWait();
            else if (key === 'f') UI.showFastForward();
            else if (key === 'a') UI.showAccusation();
            else if (key === 'm') UI.toggleSound();
            else if (key === 'i') Inventory.toggleInventory();
            else if (key === 'h' || key === '?') UI.toggleShortcutOverlay();
            else if (key === 's') save();
            else if (key === 'q') quickSave();
            // Number keys 1-9 for quick room navigation
            else if (key >= '1' && key <= '9') {
                const loc = GameData.locations[state.currentLocation];
                if (loc) {
                    const exits = loc.exits.filter(e => !e.requiresFlag || state.flags[e.requiresFlag]);
                    const idx = parseInt(key) - 1;
                    if (idx < exits.length) {
                        Hotspots.setEnabled(false);
                        Renderer.startRoomTransition(() => {
                            moveToLocation(exits[idx].to);
                            Hotspots.setEnabled(true);
                        });
                    }
                }
            }
        }
        if (key === 'escape') {
            if (Inventory.isShowingInventory()) Inventory.toggleInventory();
            else if (state.screen === 'notebook') UI.toggleNotebook();
            else if (state.screen === 'fast_forward') UI.hideFastForward();
            else if (state.screen === 'accusation') UI.hideAccusation();
            else if (state.screen === 'help') UI.hideHelp();
        }
    }

    function quickSave() {
        save();
        notify('Game saved.');
    }

    // ── Time Management ──
    function advanceTime(minutes) {
        const prevHour = Math.floor(state.time / 60);
        state.time += minutes;
        state.totalActions++;

        // Clock chime on the hour
        const newHour = Math.floor(state.time / 60);
        if (newHour > prevHour && state.time < 1440) {
            Audio.playSound('clock_chime');
            // Show time notification
            const displayHour = newHour > 12 ? newHour - 12 : newHour;
            const ampm = newHour >= 12 ? 'PM' : 'AM';
            notify(`The clock strikes ${displayHour}:00 ${ampm}`);
        }

        // Tension sting at key moments
        if (state.time >= 1380 && state.time - minutes < 1380) {
            Audio.playSound('tension_sting');
        }

        // Update music tension
        Audio.updateMusicTension(state.time);

        // Check for eavesdrop opportunities
        checkEavesdrops();

        // Check for loop-specific events
        checkLoopEvents();

        // Set post-murder flag after 11:30 PM (murder time)
        if (state.time >= 1410 && !state.flags.post_murder) {
            state.flags.post_murder = true;
            World.refreshActions();
        }

        // Check for midnight
        if (state.time >= 1440) {
            triggerMidnight();
            return;
        }

        // Feature 31: Autosave check
        checkAutosave();

        // Update HUD
        UI.updateHUD();

        // Tutorial triggers
        UI.checkTutorialTriggers();

        // Check for approaching midnight narration
        if (state.time >= 1320 && state.time < 1380) {
            const lines = GameData.narration.approaching_midnight;
            showNarration(lines[Math.floor(Math.random() * lines.length)]);
        }
    }

    function checkEavesdrops() {
        const available = GameData.eavesdrops.filter(e => {
            if (state.eavesdropsWitnessed.has(e.id)) return false;
            if (e.requiresLoop && state.loop < e.requiresLoop) return false;
            if (state.currentLocation !== e.location) return false;
            // Player is at the right location within a time window
            const timeDiff = Math.abs(state.time - e.time);
            return timeDiff <= 20;
        });

        if (available.length > 0) {
            const eavesdrop = available[0];
            triggerEavesdrop(eavesdrop);
        }
    }

    function checkLoopEvents() {
        if (!GameData.loopEvents) return;
        GameData.loopEvents.forEach(evt => {
            if (state.flags['loop_event_' + evt.id]) return;
            if (evt.loop && state.loop < evt.loop) return;
            if (evt.location && state.currentLocation !== evt.location) return;
            const timeDiff = Math.abs(state.time - evt.time);
            if (timeDiff > 20) return;
            // Trigger
            state.flags['loop_event_' + evt.id] = true;
            if (evt.flags) {
                evt.flags.forEach(f => { state.flags[f] = true; });
            }
            notify(evt.description.substring(0, 80) + '...');
            showNarration(evt.description);
            // Ghost achievement
            if (evt.id === 'ghost_apparition') {
                unlockAchievement('ghost_hunter');
            }
        });
    }

    function triggerEavesdrop(eavesdrop) {
        state.eavesdropsWitnessed.add(eavesdrop.id);
        eavesdrop.reveals.forEach(fact => state.knownFacts.add(fact));

        // Time cost for eavesdropping
        if (eavesdrop.timeAdvance) {
            state.time += eavesdrop.timeAdvance;
        }

        UI.showEavesdrop(eavesdrop);
        checkAchievements();
    }

    function triggerMidnight() {
        state.time = 1440;
        state.flags.post_murder = true;
        UI.updateHUD();

        // Record loop history
        state.loopHistory.push({
            loop: state.loop,
            events: [...state.currentLoopEvents],
            evidenceFound: [...state.discoveredEvidence],
            locationsVisited: [...state.visitedLocations],
        });

        // Show loop transition
        UI.showLoopTransition(() => {
            startNewLoop();
        });
    }

    function startNewLoop() {
        state.loop++;
        state.totalLoops++;
        state.time = 360;
        state.currentLocation = 'your_room';
        state.previousLocation = null;
        state.currentLoopEvents = [];
        state.visitedLocations = new Set(['your_room']);
        state.talkedTo = new Set();
        state.suspicion = {}; // Feature 13: Reset suspicion each loop

        // Knowledge persists across loops
        // Evidence, facts, flags all persist

        // Auto-unlock master suite after loop 2
        if (state.loop >= 2 && !state.flags.master_suite_access) {
            state.flags.master_suite_access = true;
            notify('You remember a way into the Master Suite...');
        }

        // Auto-unlock tower after loop 3
        if (state.loop >= 3 && !state.flags.tower_access) {
            state.flags.tower_access = true;
            notify('You recall seeing Lily head toward the Tower...');
        }

        // Bookshelf secret passage
        if (state.bookshelfExamineCount >= 3 && !state.flags.examined_bookshelf_3_times) {
            state.flags.examined_bookshelf_3_times = true;
        }
        if (state.flags.examined_bookshelf_3_times || state.discoveredEvidence.has('secret_passage')) {
            state.flags.found_secret_passage = true;
        }

        checkAchievements();
        UI.updateHUD();
        World.enterLocation('your_room');

        // Show loop narration
        if (state.loop <= 5) {
            showNarration(GameData.loopMessages[state.loop - 1] || GameData.loopMessages[GameData.loopMessages.length - 1]);
        }

        save();

        // Show loop recap overlay (after loop 1, when player has context)
        if (state.loop >= 1) {
            UI.showLoopRecap();
        }
    }

    // ── Location Movement ──
    function moveToLocation(locationId) {
        if (!GameData.locations[locationId]) return;

        // Check requirements
        for (const exit of GameData.locations[state.currentLocation].exits) {
            if (exit.to === locationId && exit.requiresFlag && !state.flags[exit.requiresFlag]) {
                notify('That area is locked.');
                return;
            }
        }

        state.previousLocation = state.currentLocation;
        state.currentLocation = locationId;
        state.visitedLocations.add(locationId);
        state.currentLoopEvents.push({ type: 'move', to: locationId, time: state.time });

        advanceTime(Math.round(15 * getTimeCostMultiplier()));

        // Location-aware footstep sounds
        if (locationId === 'garden') {
            Audio.playSound('footsteps_grass');
        } else if (locationId === 'wine_cellar' || locationId === 'tower') {
            Audio.playSound('footsteps_stone');
        } else {
            Audio.playSound('footsteps');
        }
        // Door sounds for indoor transitions
        if (locationId !== 'garden' && state.previousLocation !== 'garden') {
            Audio.playSound('door_open');
        }
        // Random creaking floorboards
        if (Math.random() < 0.3 && locationId !== 'garden') {
            setTimeout(() => Audio.playSound('creak'), 400);
        }
        World.enterLocation(locationId);
    }

    // ── Evidence Discovery ──
    function discoverEvidence(evidenceId) {
        if (state.discoveredEvidence.has(evidenceId)) {
            notify('You\'ve already noted this evidence.');
            return false;
        }

        const ev = GameData.evidence[evidenceId];
        if (!ev) return false;

        // Check loop requirement
        if (ev.requiresLoop && state.loop < ev.requiresLoop) {
            return false; // Don't reveal it exists
        }

        state.discoveredEvidence.add(evidenceId);
        state.notebook.clues.push({
            id: evidenceId,
            name: ev.name,
            description: ev.description,
            category: ev.category,
            location: ev.location,
            loop: state.loop,
            time: state.time,
        });

        state.currentLoopEvents.push({ type: 'evidence', id: evidenceId, time: state.time });

        // Handle special evidence
        if (evidenceId === 'safe_code') {
            state.flags.knows_safe_code = true;
            notify('You found the safe combination: 1-8-8-7');
        }
        if (evidenceId === 'secret_passage') {
            state.flags.found_secret_passage = true;
            notify('You discovered a secret passage!');
        }

        // Auto-discover connections
        checkAutoConnections(evidenceId);

        Audio.playSound('evidence');
        notifyEvidence(`Evidence Found: ${ev.name}`);

        // Feature 20: Evidence discovery animation
        try { Renderer.triggerEvidenceAnimation(ev.name); } catch (e) {}

        // Narration
        const lines = GameData.narration.evidenceFound;
        showNarration(lines[Math.floor(Math.random() * lines.length)]);

        // Add to timeline
        state.notebook.timeline.push({
            time: state.time,
            event: `Found: ${ev.name}`,
            location: state.currentLocation,
            loop: state.loop,
        });

        // Check for newly unlocked deductions
        checkDeductions(evidenceId);

        checkAchievements();
        return true;
    }

    function checkDeductions(newEvidenceId) {
        if (!GameData.deductions) return;
        GameData.deductions.forEach(ded => {
            // Check if this new evidence completes a deduction
            if (!ded.requires.includes(newEvidenceId)) return;
            if (!ded.requires.every(id => state.discoveredEvidence.has(id))) return;
            // Check if already notified
            if (state.flags['deduction_' + ded.id]) return;
            state.flags['deduction_' + ded.id] = true;
            // Notify
            setTimeout(() => {
                notify(`Deduction Unlocked: ${ded.title}`);
                Audio.playSound('evidence');
            }, 1500);
        });
    }

    function checkAutoConnections(newEvidenceId) {
        GameData.connections.forEach(conn => {
            if ((conn.from === newEvidenceId && state.discoveredEvidence.has(conn.to)) ||
                (conn.to === newEvidenceId && state.discoveredEvidence.has(conn.from))) {
                const exists = state.evidenceConnections.some(c =>
                    (c.from === conn.from && c.to === conn.to));
                if (!exists) {
                    state.evidenceConnections.push(conn);
                }
            }
        });
    }

    // ── NPC Interaction ──
    function getNPCsAtLocation(locationId, time) {
        const present = [];
        for (const [id, npc] of Object.entries(GameData.npcs)) {
            if (id === 'lord_ashworth' && time >= 1410 && state.loop > 0) continue; // dead
            const slot = npc.schedule.find(s => time >= s.start && time < s.end);
            if (slot && slot.location === locationId) {
                present.push({ id, ...npc, activity: slot.activity });
            }
        }
        return present;
    }

    function talkToNPC(npcId) {
        state.talkedTo.add(npcId);
        state.currentLoopEvents.push({ type: 'talk', npc: npcId, time: state.time });

        // Update profile
        if (!state.notebook.profiles[npcId]) {
            const npc = GameData.npcs[npcId];
            state.notebook.profiles[npcId] = {
                name: npc.name,
                role: npc.role,
                age: npc.age,
                description: npc.description,
                notes: [],
            };
        }

        // NPC trust adjustment for talking
        if (!state.npcTrust[npcId]) state.npcTrust[npcId] = 0;
        state.npcTrust[npcId] += 2; // Builds trust over time

        advanceTime(10);

        // Feature 13: Check suspicion
        if (isNPCSuspicious(npcId)) {
            UI.showExamineText(`${GameData.npcs[npcId]?.name || 'They'} eyes you with deep suspicion. "I've noticed you snooping around, Detective. Perhaps you should mind your own affairs for a while."`);
            return;
        }

        // Wrong accusation consequences — NPCs you wrongly accused are hostile
        if (state.flags['accused_' + npcId] && state.npcTrust[npcId] < 0) {
            const hostileMsg = GameData.wrongAccusationDialogue?.npc_hostile ||
                '"After what you accused me of, I have nothing more to say."';
            UI.showExamineText(hostileMsg);
            return;
        }

        Dialogue.startConversation(npcId);
        checkAchievements();
    }

    function addFact(fact) {
        state.knownFacts.add(fact);
        checkAchievements();
    }

    function getNPCTrust(npcId) {
        return state.npcTrust[npcId] || 0;
    }

    function adjustNPCTrust(npcId, amount) {
        if (!state.npcTrust[npcId]) state.npcTrust[npcId] = 0;
        state.npcTrust[npcId] += amount;
    }

    function isPostMurder() {
        return state.time >= 1410 || state.flags.post_murder;
    }

    function setFlag(flag) {
        state.flags[flag] = true;
    }

    function addProfileNote(npcId, note) {
        if (!state.notebook.profiles[npcId]) return;
        if (!state.notebook.profiles[npcId].notes.includes(note)) {
            state.notebook.profiles[npcId].notes.push(note);
        }
    }

    // ── Examine Object ──
    function examineObject(objData) {
        state.currentLoopEvents.push({ type: 'examine', id: objData.id, time: state.time });

        // Feature 13: Raise suspicion if NPCs present
        const npcsHere = getNPCsAtLocationWithOverrides(state.currentLocation, state.time);
        if (npcsHere.length > 0 && GameData.suspicionConfig) {
            npcsHere.forEach(n => raiseSuspicion(n.id, GameData.suspicionConfig.examineNearNPC));
        }

        // Trigger mini-games for specific objects
        if (objData.id === 'wall_safe' && state.flags.knows_safe_code && !state.flags.safe_opened) {
            MiniGames.startSafeCracking((success) => {
                if (success) {
                    state.flags.safe_opened = true;
                    // Discover modified will evidence
                    if (objData.evidence) discoverEvidence(objData.evidence);
                    notify('The safe swings open!');
                }
            });
            advanceTime(5);
            return;
        }

        if (objData.id === 'spiral_staircase' && !state.flags.cipher_decoded) {
            MiniGames.startCipherDecoding((success) => {
                if (success) {
                    state.flags.cipher_decoded = true;
                    discoverEvidence('cipher_message');
                    notify('The cipher decoded: "THEY WILL KILL AT MIDNIGHT"');
                }
            });
            advanceTime(5);
            return;
        }

        if (objData.id === 'bookshelf_secret' && state.bookshelfExamineCount >= 2 && !state.flags.found_secret_passage) {
            MiniGames.startBookshelfPuzzle((success) => {
                if (success) {
                    state.flags.found_secret_passage = true;
                    state.flags.examined_bookshelf_3_times = true;
                    discoverEvidence('secret_passage');
                    notify('A hidden passage revealed!');
                }
            });
            advanceTime(5);
            return;
        }

        // Check for inventory pickups at this location
        const availableItems = Inventory.checkForItems(state.currentLocation);
        availableItems.forEach(itemId => {
            const itemDef = Inventory.getItemDef(itemId);
            if (itemDef && (itemDef.object === objData.id || !itemDef.object)) {
                Inventory.pickupItem(itemId);
            }
        });

        // Track bookshelf examinations for secret passage
        if (objData.id === 'bookshelf_secret') {
            state.bookshelfExamineCount++;
            if (state.bookshelfExamineCount >= 3) {
                state.flags.examined_bookshelf_3_times = true;
            }
        }

        // Check evidence
        if (objData.evidence) {
            const ev = GameData.evidence[objData.evidence];
            if (ev) {
                // Check requirements
                if (objData.requiresLoop && state.loop < objData.requiresLoop) {
                    // Show base examine text without evidence
                    UI.showExamineText(objData.examine.split('.')[0] + '.');
                    advanceTime(5);
                    return;
                }
                if (objData.requiresFlag && !state.flags[objData.requiresFlag]) {
                    UI.showExamineText(objData.examine.split('.')[0] + '.');
                    advanceTime(5);
                    return;
                }
                discoverEvidence(objData.evidence);
                // Show unlocked examine text if available (Feature 2: shed key)
                if (objData.examineUnlocked) {
                    UI.showExamineText(objData.examineUnlocked);
                    advanceTime(5);
                    return;
                }
            }
        }

        UI.showExamineText(objData.examine);
        advanceTime(5);
    }

    // ── Notifications ──
    function notify(text) {
        const el = document.getElementById('notification');
        el.textContent = text;
        el.className = 'show';
        setTimeout(() => el.className = '', 3000);
    }

    function notifyEvidence(text) {
        const el = document.getElementById('notification');
        el.textContent = text;
        el.className = 'show evidence';
        Audio.playSound('evidence');
        setTimeout(() => el.className = '', 4000);
    }

    function showNarration(text) {
        const el = document.getElementById('room-narration');
        if (el) {
            el.textContent = text;
            el.style.opacity = '0';
            requestAnimationFrame(() => {
                el.style.transition = 'opacity 1s ease';
                el.style.opacity = '1';
            });
        }
    }

    // ── Save / Load ──
    function save() {
        const saveData = {
            loop: state.loop,
            time: state.time,
            currentLocation: state.currentLocation,
            knownFacts: [...state.knownFacts],
            discoveredEvidence: [...state.discoveredEvidence],
            evidenceConnections: state.evidenceConnections,
            flags: state.flags,
            notebook: {
                clues: state.notebook.clues,
                profiles: state.notebook.profiles,
                timeline: state.notebook.timeline,
                theories: state.notebook.theories,
            },
            loopHistory: state.loopHistory,
            accusationsMade: state.accusationsMade,
            totalLoops: state.totalLoops,
            totalActions: state.totalActions,
            eavesdropsWitnessed: [...state.eavesdropsWitnessed],
            bookshelfExamineCount: state.bookshelfExamineCount,
            npcTrust: state.npcTrust,
            visitedLocations: [...state.visitedLocations],
            achievements: [...state.achievements],
            inventory: Inventory.getSaveData(),
            suspicion: state.suspicion || {},
            version: 3,
        };
        try {
            localStorage.setItem('ravenholm_save', JSON.stringify(saveData));
        } catch (e) { /* storage full or disabled */ }
    }

    function load() {
        try {
            const raw = localStorage.getItem('ravenholm_save');
            if (!raw) return false;
            const data = JSON.parse(raw);

            state.loop = data.loop || 0;
            state.time = data.time || 360;
            state.currentLocation = data.currentLocation || 'your_room';
            state.knownFacts = new Set(data.knownFacts || []);
            state.discoveredEvidence = new Set(data.discoveredEvidence || []);
            state.evidenceConnections = data.evidenceConnections || [];
            state.flags = data.flags || {};
            state.notebook = data.notebook || { clues: [], profiles: {}, timeline: [], theories: [] };
            state.loopHistory = data.loopHistory || [];
            state.accusationsMade = data.accusationsMade || [];
            state.totalLoops = data.totalLoops || 0;
            state.totalActions = data.totalActions || 0;
            state.eavesdropsWitnessed = new Set(data.eavesdropsWitnessed || []);
            state.bookshelfExamineCount = data.bookshelfExamineCount || 0;
            state.npcTrust = data.npcTrust || {};
            state.visitedLocations = new Set(data.visitedLocations || []);
            state.achievements = new Set(data.achievements || []);
            state.currentLoopEvents = [];
            state.talkedTo = new Set();
            state.started = true;

            if (data.inventory) Inventory.loadSaveData(data.inventory);
            state.suspicion = data.suspicion || {};

            return true;
        } catch (e) {
            return false;
        }
    }

    function hasSave() {
        return !!localStorage.getItem('ravenholm_save');
    }

    function clearSave() {
        localStorage.removeItem('ravenholm_save');
    }

    // ── Reset for new game ──
    function resetState() {
        state.screen = 'playing';
        state.loop = 0;
        state.time = 360;
        state.currentLocation = 'your_room';
        state.previousLocation = null;
        state.knownFacts = new Set();
        state.discoveredEvidence = new Set();
        state.evidenceConnections = [];
        state.npcTrust = {};
        state.flags = {};
        state.loopHistory = [];
        state.currentLoopEvents = [];
        state.notebook = { clues: [], profiles: {}, timeline: [], theories: [] };
        state.accusationsMade = [];
        state.totalLoops = 0;
        state.totalActions = 0;
        state.visitedLocations = new Set(['your_room']);
        state.talkedTo = new Set();
        state.eavesdropsWitnessed = new Set();
        state.bookshelfExamineCount = 0;
        state.achievements = new Set();
        state.started = true;
    }

    // ── Make Accusation ──
    function makeAccusation(suspect, selectedEvidence) {
        const accomplice = selectedEvidence.includes('love_letters') || selectedEvidence.includes('rex_shirt')
            ? 'rex_dalton' : null;

        state.accusationsMade.push({
            suspect, accomplice, evidence: selectedEvidence,
            loop: state.loop, time: state.time
        });

        // Check for prevention ending
        if (state.flags.evelyn_full_confession && state.loop >= 3 && state.time < 1380) {
            unlockAchievement('prevention');
            unlockAchievement('loop_breaker');
            return 'prevention';
        }

        // Check for clock secret ending
        if (suspect === 'clock' && state.discoveredEvidence.has('ancient_clock') && state.discoveredEvidence.has('tower_journal')) {
            unlockAchievement('loop_breaker');
            return 'clock_secret';
        }

        const result = GameData.validateAccusation(suspect, accomplice, selectedEvidence);

        // Track wrong accusations for NPC reactions
        if (result === 'wrong_accusation') {
            state.flags.wrong_accusation_made = true;
            state.flags['accused_' + suspect] = true;
            // Decrease trust with accused NPC
            if (!state.npcTrust[suspect]) state.npcTrust[suspect] = 0;
            state.npcTrust[suspect] -= 30;
        }

        // Achievement checks for endings
        if (result === 'true_justice') {
            unlockAchievement('true_detective');
            unlockAchievement('loop_breaker');
            if (state.totalLoops <= 2) unlockAchievement('perfect_loop');
        }
        if (result === 'prevention') {
            unlockAchievement('prevention');
            unlockAchievement('loop_breaker');
        }
        if (result === 'partial_truth' || result === 'clock_secret') {
            unlockAchievement('loop_breaker');
        }

        return result;
    }

    // ── Achievements System ──
    const achievementDefs = {
        first_clue:     { name: 'First Clue',     desc: 'Find your first evidence' },
        ear_to_wall:    { name: 'Ear to the Wall', desc: 'Witness your first eavesdrop' },
        profiler:       { name: 'Profiler',        desc: 'Meet all 10 NPCs' },
        evidence_master:{ name: 'Evidence Master', desc: 'Find all evidence' },
        web_of_lies:    { name: 'Web of Lies',     desc: 'Find all connections' },
        time_student:   { name: 'Time Student',    desc: 'Complete 3 loops' },
        time_master:    { name: 'Time Master',     desc: 'Complete 5 loops' },
        confrontation:  { name: 'Confrontation',   desc: 'Confront Lady Evelyn with the poison vial' },
        true_detective: { name: 'True Detective',  desc: 'Achieve the True Justice ending' },
        clock_watcher:  { name: 'Clock Watcher',   desc: 'Discover the Ancient Clock' },
        loop_breaker:   { name: 'Loop Breaker',    desc: 'Break the time loop (any good ending)' },
        prevention:     { name: 'Prevention',      desc: 'Prevent the murder' },
        // Secret achievements
        night_owl:      { name: 'Night Owl',       desc: 'Visit every room after 10 PM', secret: true },
        speed_demon:    { name: 'Speed Demon',     desc: 'Find 10+ evidence in a single loop', secret: true },
        wallflower:     { name: 'Wallflower',      desc: 'Witness all eavesdrops', secret: true },
        safe_cracker:   { name: 'Safe Cracker',    desc: 'Open the study safe', secret: true },
        bookworm:       { name: 'Bookworm',        desc: 'Discover the secret passage via bookshelf', secret: true },
        ghost_hunter:   { name: 'Ghost Hunter',    desc: 'See a ghostly apparition', secret: true },
        perfect_loop:   { name: 'Perfect Loop',    desc: 'Solve the case in 3 loops or fewer', secret: true },
        collector:      { name: 'Collector',        desc: 'Pick up every inventory item', secret: true },
    };

    function unlockAchievement(id) {
        if (state.achievements.has(id)) return;
        if (!achievementDefs[id]) return;
        state.achievements.add(id);
        notifyAchievement(achievementDefs[id].name);
        save();
    }

    function notifyAchievement(name) {
        const el = document.getElementById('notification');
        el.textContent = `Achievement Unlocked: ${name}`;
        el.className = 'show achievement';
        Audio.playSound('evidence');
        setTimeout(() => el.className = '', 5000);
    }

    function checkAchievements() {
        // First Clue — any evidence discovered
        if (state.discoveredEvidence.size >= 1) {
            unlockAchievement('first_clue');
        }

        // Ear to the Wall — any eavesdrop witnessed
        if (state.eavesdropsWitnessed.size >= 1) {
            unlockAchievement('ear_to_wall');
        }

        // Profiler — met all 10 NPCs
        if (Object.keys(state.notebook.profiles).length >= 10) {
            unlockAchievement('profiler');
        }

        // Evidence Master — all evidence found
        if (state.discoveredEvidence.size >= Object.keys(GameData.evidence).length) {
            unlockAchievement('evidence_master');
        }

        // Web of Lies — all connections found
        if (state.evidenceConnections.length >= GameData.connections.length) {
            unlockAchievement('web_of_lies');
        }

        // Time Student — 3 loops completed
        if (state.totalLoops >= 3) {
            unlockAchievement('time_student');
        }

        // Time Master — 5 loops completed
        if (state.totalLoops >= 5) {
            unlockAchievement('time_master');
        }

        // Confrontation — confront Lady Evelyn with the poison vial
        if (state.knownFacts.has('evelyn_caught')) {
            unlockAchievement('confrontation');
        }

        // Clock Watcher — discover the Ancient Clock
        if (state.discoveredEvidence.has('ancient_clock')) {
            unlockAchievement('clock_watcher');
        }

        // Wallflower — all eavesdrops
        if (state.eavesdropsWitnessed.size >= GameData.eavesdrops.length) {
            unlockAchievement('wallflower');
        }

        // Speed Demon — 10+ evidence in one loop
        const evidenceThisLoop = state.currentLoopEvents.filter(e => e.type === 'evidence').length;
        if (evidenceThisLoop >= 10) {
            unlockAchievement('speed_demon');
        }

        // Night Owl — visit every room after 10 PM
        if (state.time >= 1320) {
            const allRooms = Object.keys(GameData.locations);
            const visitedNow = state.visitedLocations;
            if (allRooms.every(r => visitedNow.has(r))) {
                unlockAchievement('night_owl');
            }
        }

        // Safe Cracker
        if (state.flags.safe_opened) {
            unlockAchievement('safe_cracker');
        }

        // Bookworm
        if (state.flags.found_secret_passage && state.flags.examined_bookshelf_3_times) {
            unlockAchievement('bookworm');
        }

        // Collector — all inventory items
        if (Inventory.getItems().length >= Object.keys(Inventory.ITEMS).length) {
            unlockAchievement('collector');
        }
    }

    // ── Game Mode Functions ──
    function setGameMode(mode) {
        gameMode = mode;
        if (mode === 'speedrun') speedrunStart = Date.now();
    }

    function getGameMode() { return gameMode; }

    function getTimeCostMultiplier() {
        switch (gameMode) {
            case 'hard': return 1.5;       // Actions cost 50% more time
            case 'newgameplus': return 0.8; // Actions cost 20% less time
            default: return 1;
        }
    }

    function getSpeedrunElapsed() {
        if (gameMode !== 'speedrun' || !speedrunStart) return 0;
        return Date.now() - speedrunStart;
    }

    // ── New Game+ Bonuses ──
    function applyNewGamePlusBonuses() {
        if (gameMode !== 'newgameplus') return;
        // Start with magnifying glass
        Inventory.pickupItem('magnifying_glass');
        // Unlock master suite and tower from the start
        state.flags.master_suite_access = true;
        state.flags.tower_access = true;
        notify('New Game+ active: Master Suite and Tower unlocked from the start.');
    }

    // ── FEATURE 13: Suspicion System ──
    function raiseSuspicion(npcId, amount) {
        if (!state.suspicion) state.suspicion = {};
        if (!state.suspicion[npcId]) state.suspicion[npcId] = 0;
        state.suspicion[npcId] += amount;
        const cfg = GameData.suspicionConfig;
        if (state.suspicion[npcId] >= cfg.highThreshold) {
            notify(`${GameData.npcs[npcId]?.name || npcId} is suspicious of your snooping!`);
            // Alert nearby NPCs
            const npcsHere = getNPCsAtLocation(state.currentLocation, state.time);
            npcsHere.forEach(n => {
                if (n.id !== npcId) {
                    if (!state.suspicion[n.id]) state.suspicion[n.id] = 0;
                    state.suspicion[n.id] += cfg.alertOtherAmount;
                }
            });
        }
    }

    function getSuspicion(npcId) {
        return (state.suspicion && state.suspicion[npcId]) || 0;
    }

    function isNPCSuspicious(npcId) {
        const cfg = GameData.suspicionConfig;
        return getSuspicion(npcId) >= cfg.highThreshold;
    }

    // ── FEATURE 14: Alibi Tracker ──
    function getAlibiData() {
        const keyTimes = [1380, 1410, 1440]; // 11 PM, 11:30 PM, midnight
        const alibis = {};
        for (const [id, npc] of Object.entries(GameData.npcs)) {
            if (id === 'lord_ashworth') continue;
            alibis[id] = { name: npc.name, times: {} };
            keyTimes.forEach(t => {
                const slot = npc.schedule.find(s => t >= s.start && t < s.end);
                if (slot) {
                    alibis[id].times[t] = {
                        location: slot.location,
                        locationName: GameData.locations[slot.location]?.name || slot.location,
                        activity: slot.activity,
                    };
                }
            });
        }
        return alibis;
    }

    // ── FEATURE 10: Schedule Overrides ──
    function getNPCsAtLocationWithOverrides(locationId, time) {
        const present = [];
        const overrides = GameData.scheduleOverrides?.[state.loop];
        for (const [id, npc] of Object.entries(GameData.npcs)) {
            if (id === 'lord_ashworth' && time >= 1410 && state.loop > 0) continue;
            // Check overrides first
            let slot = null;
            if (overrides && overrides[id]) {
                slot = overrides[id].find(s => time >= s.start && time < s.end);
            }
            if (!slot) {
                slot = npc.schedule.find(s => time >= s.start && time < s.end);
            }
            if (slot && slot.location === locationId) {
                present.push({ id, ...npc, activity: slot.activity });
            }
        }
        return present;
    }

    // ── FEATURE 18: Gift System ──
    function giveGiftToNPC(npcId) {
        const giftDef = GameData.npcGifts?.[npcId];
        if (!giftDef) return false;
        if (!Inventory.hasItem(giftDef.item)) return false;
        if (state.flags['gift_given_' + npcId]) return false;

        Inventory.removeItem(giftDef.item);
        adjustNPCTrust(npcId, giftDef.trustBoost);
        state.flags['gift_given_' + npcId] = true;
        if (giftDef.unlocks) addFact(giftDef.unlocks);
        notify(giftDef.message);
        return true;
    }

    // ── FEATURE 31: Autosave ──
    let lastAutosaveTime = 0;
    function checkAutosave() {
        if (state.time - lastAutosaveTime >= 30) {
            lastAutosaveTime = state.time;
            save();
            // Feature 31: Show autosave indicator
            try { Renderer.triggerAutosaveIndicator(); } catch (e) {}
        }
    }

    // ── FEATURE 32: Per-loop Statistics ──
    function getLoopStats() {
        const evThisLoop = state.currentLoopEvents.filter(e => e.type === 'evidence').length;
        const npcsThisLoop = state.talkedTo.size;
        const eavesThisLoop = state.currentLoopEvents.filter(e => e.type === 'eavesdrop').length;
        const roomsThisLoop = state.visitedLocations.size;
        const totalMinutes = state.time - 360;
        const maxMinutes = 1440 - 360;
        const efficiency = Math.round((state.totalActions > 0 ? (evThisLoop + npcsThisLoop) / state.totalActions : 0) * 100);
        return { evThisLoop, npcsThisLoop, eavesThisLoop, roomsThisLoop, efficiency };
    }

    // Override getNPCsAtLocation to use schedule overrides
    const _originalGetNPCsAtLocation = getNPCsAtLocation;

    // Public API
    return {
        state, input, init, advanceTime, moveToLocation,
        discoverEvidence, getNPCsAtLocation: getNPCsAtLocationWithOverrides, talkToNPC,
        examineObject, addFact, setFlag, addProfileNote,
        notify, notifyEvidence, showNarration,
        save, load, hasSave, clearSave, resetState,
        makeAccusation, triggerMidnight, startNewLoop,
        checkEavesdrops, achievementDefs, checkAchievements,
        unlockAchievement, getNPCTrust, adjustNPCTrust, isPostMurder,
        setGameMode, getGameMode, getTimeCostMultiplier,
        getSpeedrunElapsed, applyNewGamePlusBonuses,
        // New features
        raiseSuspicion, getSuspicion, isNPCSuspicious,
        getAlibiData, giveGiftToNPC, checkAutosave, getLoopStats,
    };
})();
