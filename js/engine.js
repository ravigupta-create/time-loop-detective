/* ═══════════════════════════════════════════════════════
   ENGINE — Core game state, time, input, save/load
   ═══════════════════════════════════════════════════════ */

const Engine = (() => {
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
        if (state.screen === 'playing') {
            if (key === 'n') UI.toggleNotebook();
            else if (key === 'w') UI.showWait();
            else if (key === 'f') UI.showFastForward();
            else if (key === 'a') UI.showAccusation();
        }
        if (key === 'escape') {
            if (state.screen === 'notebook') UI.toggleNotebook();
            else if (state.screen === 'fast_forward') UI.hideFastForward();
            else if (state.screen === 'accusation') UI.hideAccusation();
            else if (state.screen === 'help') UI.hideHelp();
        }
    }

    // ── Time Management ──
    function advanceTime(minutes) {
        state.time += minutes;
        state.totalActions++;

        // Check for eavesdrop opportunities
        checkEavesdrops();

        // Check for midnight
        if (state.time >= 1440) {
            triggerMidnight();
            return;
        }

        // Update HUD
        UI.updateHUD();

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

    function triggerEavesdrop(eavesdrop) {
        state.eavesdropsWitnessed.add(eavesdrop.id);
        eavesdrop.reveals.forEach(fact => state.knownFacts.add(fact));

        // Time cost for eavesdropping
        if (eavesdrop.timeAdvance) {
            state.time += eavesdrop.timeAdvance;
        }

        UI.showEavesdrop(eavesdrop);
    }

    function triggerMidnight() {
        state.time = 1440;
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

        UI.updateHUD();
        World.enterLocation('your_room');

        // Show loop narration
        if (state.loop <= 5) {
            showNarration(GameData.loopMessages[state.loop - 1] || GameData.loopMessages[GameData.loopMessages.length - 1]);
        }

        save();
    }

    // ── Location Movement ──
    function moveToLocation(locationId) {
        if (!GameData.locations[locationId]) return;

        const loc = GameData.locations[locationId];

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

        advanceTime(15);

        Audio.playSound('footsteps');
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

        return true;
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

        advanceTime(10);
        Dialogue.startConversation(npcId);
    }

    function addFact(fact) {
        state.knownFacts.add(fact);
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
            version: 1,
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
            state.currentLoopEvents = [];
            state.talkedTo = new Set();
            state.started = true;

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
        if (state.flags.evelyn_full_confession && state.loop >= 5 && state.time < 1380) {
            return 'prevention';
        }

        // Check for clock secret ending
        if (suspect === 'clock' && state.discoveredEvidence.has('ancient_clock') && state.discoveredEvidence.has('tower_journal')) {
            return 'clock_secret';
        }

        const result = GameData.validateAccusation(suspect, accomplice, selectedEvidence);
        return result;
    }

    // Public API
    return {
        state, input, init, advanceTime, moveToLocation,
        discoverEvidence, getNPCsAtLocation, talkToNPC,
        examineObject, addFact, setFlag, addProfileNote,
        notify, notifyEvidence, showNarration,
        save, load, hasSave, clearSave, resetState,
        makeAccusation, triggerMidnight, startNewLoop,
        checkEavesdrops,
    };
})();
