/* ═══════════════════════════════════════════════════════
   WORLD — Location management, room rendering, movement
   ═══════════════════════════════════════════════════════ */

const World = (() => {
    let firstVisit = {};

    function init() {
        firstVisit = {};
    }

    function enterLocation(locationId) {
        const loc = GameData.locations[locationId];
        if (!loc) return;

        Engine.state.screen = 'playing';

        // Update HUD
        document.getElementById('hud-location').textContent = loc.name;

        // Show/hide room view
        showScreen('hud');
        showScreen('room-view');

        // Description and narration
        const descEl = document.getElementById('room-description');
        descEl.textContent = loc.description;
        descEl.classList.add('fade-in');

        // First visit or regular narration
        const narEl = document.getElementById('room-narration');
        if (!firstVisit[locationId] && loc.narratorFirst) {
            narEl.textContent = loc.narratorFirst;
            firstVisit[locationId] = true;
        } else if (loc.narrator) {
            narEl.textContent = loc.narrator;
        } else {
            const lines = Engine.state.loop === 0
                ? GameData.narration.firstLoop
                : GameData.narration.laterLoops;
            narEl.textContent = lines[Math.floor(Math.random() * lines.length)];
        }

        // Build actions
        buildRoomActions(locationId);

        // Start ambience
        Audio.startAmbience(loc.ambience || 'rain');
    }

    function buildRoomActions(locationId) {
        const loc = GameData.locations[locationId];
        const time = Engine.state.time;

        // Objects
        const objContainer = document.getElementById('room-objects');
        objContainer.innerHTML = '';
        loc.objects.forEach(obj => {
            // Check if evidence requirements are met for visibility
            if (obj.requiresFlag && !Engine.state.flags[obj.requiresFlag]) {
                // Show the object but it won't reveal evidence
            }
            if (obj.requiresLoop && Engine.state.loop < obj.requiresLoop) {
                // Don't show objects that require higher loop count
                return;
            }

            const btn = document.createElement('button');
            btn.className = 'action-btn';
            btn.textContent = `${obj.icon} Examine ${obj.name}`;

            // Highlight if has undiscovered evidence
            if (obj.evidence && !Engine.state.discoveredEvidence.has(obj.evidence)) {
                const ev = GameData.evidence[obj.evidence];
                if (!ev.requiresLoop || Engine.state.loop >= ev.requiresLoop) {
                    if (!obj.requiresFlag || Engine.state.flags[obj.requiresFlag]) {
                        btn.classList.add('evidence-new');
                    }
                }
            }

            btn.addEventListener('click', () => {
                Audio.playSound('click');
                Engine.examineObject(obj);
                // Rebuild actions after examining (evidence state may have changed)
                setTimeout(() => buildRoomActions(locationId), 100);
            });
            objContainer.appendChild(btn);
        });

        // NPCs present
        const npcContainer = document.getElementById('room-npcs');
        npcContainer.innerHTML = '';
        const npcsHere = Engine.getNPCsAtLocation(locationId, time);
        npcsHere.forEach(npc => {
            const btn = document.createElement('button');
            btn.className = 'action-btn npc-btn';
            btn.textContent = `💬 Talk to ${npc.name}`;
            btn.title = npc.activity;
            btn.addEventListener('click', () => {
                Audio.playSound('click');
                Engine.talkToNPC(npc.id);
            });
            npcContainer.appendChild(btn);

            // Show NPC activity hint
            if (npc.activity) {
                const hint = document.createElement('span');
                hint.style.fontSize = '11px';
                hint.style.color = '#6a6a80';
                hint.style.display = 'block';
                hint.style.textAlign = 'center';
                hint.textContent = `(${npc.activity})`;
                npcContainer.appendChild(hint);
            }
        });

        // Exits
        const exitContainer = document.getElementById('room-exits');
        exitContainer.innerHTML = '';
        loc.exits.forEach(exit => {
            const btn = document.createElement('button');
            btn.className = 'action-btn exit-btn';

            if (exit.requiresFlag && !Engine.state.flags[exit.requiresFlag]) {
                btn.textContent = `🔒 ${exit.label}`;
                btn.classList.add('locked');
                btn.style.opacity = '0.4';
                btn.style.cursor = 'not-allowed';
                btn.title = 'Locked';
            } else {
                btn.textContent = `${exit.icon} → ${exit.label}`;
                btn.addEventListener('click', () => {
                    Audio.playSound('click');
                    Engine.moveToLocation(exit.to);
                });
            }
            exitContainer.appendChild(btn);
        });
    }

    // ── Screen Management ──
    function showScreen(id) {
        const el = document.getElementById(id);
        if (el) el.classList.add('active');
    }

    function hideScreen(id) {
        const el = document.getElementById(id);
        if (el) el.classList.remove('active');
    }

    function hideAllGameScreens() {
        ['hud', 'room-view', 'dialogue-screen', 'notebook-screen',
         'accusation-screen', 'ff-screen', 'eavesdrop-overlay'].forEach(id => {
            hideScreen(id);
        });
    }

    // Refresh the current room's action buttons
    function refreshActions() {
        buildRoomActions(Engine.state.currentLocation);
    }

    return {
        init, enterLocation, buildRoomActions,
        showScreen, hideScreen, hideAllGameScreens,
        refreshActions,
    };
})();
