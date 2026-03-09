/* ═══════════════════════════════════════════════════════
   NPCs — NPC schedule tracking, location, state
   ═══════════════════════════════════════════════════════ */

const NPCs = (() => {

    function init() {
        // NPC states are derived from schedules + game time
    }

    // Get the current schedule slot for an NPC
    function getCurrentSlot(npcId, time) {
        const npc = GameData.npcs[npcId];
        if (!npc) return null;
        return npc.schedule.find(s => time >= s.start && time < s.end) || null;
    }

    // Get which location an NPC is at
    function getLocation(npcId, time) {
        const slot = getCurrentSlot(npcId, time);
        return slot ? slot.location : null;
    }

    // Get what an NPC is doing
    function getActivity(npcId, time) {
        const slot = getCurrentSlot(npcId, time);
        return slot ? slot.activity : 'Unknown';
    }

    // Get all NPCs at a specific location at a specific time
    function getAtLocation(locationId, time) {
        const result = [];
        for (const [id, npc] of Object.entries(GameData.npcs)) {
            // Lord Ashworth is dead after 11:10 PM in loops after the first
            if (id === 'lord_ashworth' && time >= 1410 && Engine.state.loop > 0) continue;

            const slot = getCurrentSlot(id, time);
            if (slot && slot.location === locationId) {
                result.push({
                    id,
                    name: npc.name,
                    role: npc.role,
                    color: npc.color,
                    activity: slot.activity,
                    personality: npc.personality,
                });
            }
        }
        return result;
    }

    // Get schedule overview for an NPC (for timeline view)
    function getScheduleOverview(npcId) {
        const npc = GameData.npcs[npcId];
        if (!npc) return [];
        return npc.schedule.map(slot => ({
            start: slot.start,
            end: slot.end,
            location: slot.location,
            activity: slot.activity,
            locationName: GameData.locations[slot.location]?.name || slot.location,
        }));
    }

    // Check if player can eavesdrop on a conversation
    function checkEavesdropOpportunity(locationId, time) {
        return GameData.eavesdrops.filter(e => {
            if (Engine.state.eavesdropsWitnessed.has(e.id)) return false;
            if (e.requiresLoop && Engine.state.loop < e.requiresLoop) return false;
            if (e.location !== locationId) return false;
            const timeDiff = Math.abs(time - e.time);
            return timeDiff <= 20;
        });
    }

    // Get NPC disposition toward player (affects dialogue tone)
    function getDisposition(npcId) {
        const trust = Engine.state.npcTrust[npcId] || 0;
        if (trust >= 3) return 'trusting';
        if (trust >= 1) return 'neutral';
        if (trust <= -2) return 'hostile';
        return 'cautious';
    }

    function adjustTrust(npcId, amount) {
        if (!Engine.state.npcTrust[npcId]) Engine.state.npcTrust[npcId] = 0;
        Engine.state.npcTrust[npcId] += amount;
    }

    // Get a summary of where all NPCs are right now
    function getLocationSummary(time) {
        const summary = {};
        for (const [id, npc] of Object.entries(GameData.npcs)) {
            const loc = getLocation(id, time);
            if (loc) {
                if (!summary[loc]) summary[loc] = [];
                summary[loc].push({ id, name: npc.name });
            }
        }
        return summary;
    }

    return {
        init, getCurrentSlot, getLocation, getActivity,
        getAtLocation, getScheduleOverview, checkEavesdropOpportunity,
        getDisposition, adjustTrust, getLocationSummary,
    };
})();
