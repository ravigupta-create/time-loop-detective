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

        // Description and narration — use time-of-day variant if available
        const rawTod = GameData.getTimeOfDay(Engine.state.time);
        // Map detailed time periods to description keys (fallback for late_morning, late_afternoon, late_night)
        const todMap = { late_morning: 'morning', late_afternoon: 'afternoon', late_night: 'night' };
        const tod = todMap[rawTod] || rawTod;
        const desc = loc.descriptions?.[tod] || loc.description;
        const descEl = document.getElementById('room-description');
        descEl.textContent = desc;
        descEl.classList.add('fade-in');

        // First visit or regular narration
        const narEl = document.getElementById('room-narration');
        if (!firstVisit[locationId] && loc.narratorFirst) {
            narEl.textContent = loc.narratorFirst;
            firstVisit[locationId] = true;
        } else if (firstVisit[locationId] && GameData.narration.returning && Math.random() < 0.35) {
            // Occasionally show "returning" narration when revisiting a location
            const retLines = GameData.narration.returning;
            narEl.textContent = retLines[Math.floor(Math.random() * retLines.length)];
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

        // Start background music — quiet theme for tower/wine_cellar, default investigation
        if (locationId === 'tower' || locationId === 'wine_cellar') {
            Audio.startMusic('quiet');
        } else {
            Audio.startMusic('investigation');
        }
    }

    function buildRoomActions(locationId) {
        const loc = GameData.locations[locationId];
        const hotspots = [];

        // ── Object hotspots ──
        const objSlots = RoomViews.getObjectSlots(locationId);
        let slotIdx = 0;
        loc.objects.forEach(obj => {
            if (obj.requiresLoop && Engine.state.loop < obj.requiresLoop) return;
            const slot = objSlots[slotIdx];
            slotIdx++;
            if (!slot) return;

            const hs = {
                type: 'object',
                label: `${obj.icon} Examine ${obj.name}`,
                rect: slot.rect,
                action: () => {
                    Engine.examineObject(obj);
                    setTimeout(() => refreshHotspots(locationId), 100);
                },
            };

            // Evidence shimmer
            if (obj.evidence && !Engine.state.discoveredEvidence.has(obj.evidence)) {
                const ev = GameData.evidence[obj.evidence];
                if (!ev.requiresLoop || Engine.state.loop >= ev.requiresLoop) {
                    if (!obj.requiresFlag || Engine.state.flags[obj.requiresFlag]) {
                        hs.hasEvidence = true;
                        hs.evidenceId = obj.evidence;
                    }
                }
            }

            hotspots.push(hs);
        });

        // ── Exit hotspots ──
        const exitSlots = RoomViews.getExitSlots(locationId);
        loc.exits.forEach((exit, i) => {
            const slot = exitSlots[i];
            if (!slot) return;

            const locked = exit.requiresFlag && !Engine.state.flags[exit.requiresFlag];
            hotspots.push({
                type: 'exit',
                label: locked ? `🔒 ${exit.label} (Locked)` : `→ ${exit.label}`,
                rect: slot.rect,
                action: locked ? () => Engine.notify('That area is locked.') : () => {
                    // Fade transition then move
                    Hotspots.setEnabled(false);
                    Renderer.startRoomTransition(() => {
                        Engine.moveToLocation(exit.to);
                        Hotspots.setEnabled(true);
                    });
                },
            });
        });

        // NPC hotspots are added dynamically each frame by RoomViews.drawNPCSilhouettes
        // via Hotspots.addDynamicHotspots in the render loop

        Hotspots.setRoomHotspots(hotspots);

        // Clear old HTML buttons
        document.getElementById('room-objects').innerHTML = '';
        document.getElementById('room-npcs').innerHTML = '';
        document.getElementById('room-exits').innerHTML = '';
    }

    function refreshHotspots(locationId) {
        buildRoomActions(locationId || Engine.state.currentLocation);
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
        refreshActions, refreshHotspots,
    };
})();
