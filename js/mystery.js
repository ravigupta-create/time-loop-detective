/* ═══════════════════════════════════════════════════════
   MYSTERY — Evidence tracking, board, accusation logic
   ═══════════════════════════════════════════════════════ */

const Mystery = (() => {
    let selectedSuspect = null;
    let selectedEvidence = new Set();

    function init() {}

    // ── Evidence Board ──
    function getDiscoveredEvidence() {
        return Engine.state.notebook.clues;
    }

    function getConnections() {
        return Engine.state.evidenceConnections;
    }

    function getEvidenceCount() {
        return Engine.state.discoveredEvidence.size;
    }

    function getTotalEvidence() {
        return Object.keys(GameData.evidence).length;
    }

    // Get evidence organized by category
    function getEvidenceByCategory() {
        const categories = {
            documents: [],
            physical: [],
            records: [],
            structural: [],
            supernatural: [],
            key: [],
        };
        Engine.state.notebook.clues.forEach(clue => {
            if (categories[clue.category]) {
                categories[clue.category].push(clue);
            }
        });
        return categories;
    }

    // ── Accusation System ──
    function getSuspects() {
        // Can accuse any NPC except the victim and witnesses
        return Object.entries(GameData.npcs)
            .filter(([id]) => id !== 'lord_ashworth')
            .map(([id, npc]) => ({
                id,
                name: npc.name,
                role: npc.role,
            }));
    }

    function selectSuspect(npcId) {
        selectedSuspect = npcId;
    }

    function toggleEvidence(evidenceId) {
        if (selectedEvidence.has(evidenceId)) {
            selectedEvidence.delete(evidenceId);
        } else {
            selectedEvidence.add(evidenceId);
        }
    }

    function getSelectedSuspect() { return selectedSuspect; }
    function getSelectedEvidence() { return [...selectedEvidence]; }

    function resetAccusation() {
        selectedSuspect = null;
        selectedEvidence = new Set();
    }

    function makeAccusation() {
        if (!selectedSuspect) return null;
        const result = Engine.makeAccusation(selectedSuspect, [...selectedEvidence]);
        return result;
    }

    // ── Theory Building ──
    function addTheory(theory) {
        Engine.state.notebook.theories.push({
            text: theory,
            loop: Engine.state.loop,
            time: Engine.state.time,
            timestamp: Date.now(),
        });
        Engine.save();
    }

    function getTheories() {
        return Engine.state.notebook.theories;
    }

    // ── Progress Tracking ──
    function getProgress() {
        const totalEv = getTotalEvidence();
        const foundEv = getEvidenceCount();
        const totalNPCs = Object.keys(GameData.npcs).length;
        const metNPCs = Object.keys(Engine.state.notebook.profiles).length;
        const totalEavesdrops = GameData.eavesdrops.length;
        const witnessedEavesdrops = Engine.state.eavesdropsWitnessed.size;
        const totalConnections = GameData.connections.length;
        const foundConnections = Engine.state.evidenceConnections.length;

        return {
            evidence: { found: foundEv, total: totalEv, pct: Math.round(foundEv / totalEv * 100) },
            npcs: { met: metNPCs, total: totalNPCs, pct: Math.round(metNPCs / totalNPCs * 100) },
            eavesdrops: { found: witnessedEavesdrops, total: totalEavesdrops, pct: Math.round(witnessedEavesdrops / totalEavesdrops * 100) },
            connections: { found: foundConnections, total: totalConnections, pct: Math.round(foundConnections / totalConnections * 100) },
            loops: Engine.state.loop,
            overallPct: Math.round(
                (foundEv / totalEv * 30 +
                 metNPCs / totalNPCs * 20 +
                 witnessedEavesdrops / totalEavesdrops * 25 +
                 foundConnections / totalConnections * 25)
            ),
        };
    }

    // Check if the player has enough for a good ending
    function hasEnoughForAccusation() {
        const criticalEvidence = ['poison_vial', 'love_letters', 'secret_passage', 'brandy_glass'];
        const found = criticalEvidence.filter(e => Engine.state.discoveredEvidence.has(e));
        return found.length >= 3;
    }

    // Get hint about what to investigate next
    function getHint() {
        // Hard mode: no specific hints
        try {
            if (Engine.getGameMode() === 'hard') {
                return 'Hard mode: no hints. Trust your instincts, Detective.';
            }
        } catch (e) {}

        const hints = [];

        if (!Engine.state.discoveredEvidence.has('business_letter')) {
            hints.push('Check Lord Ashworth\'s desk in the Study.');
        }
        if (!Engine.state.discoveredEvidence.has('brandy_note') && Engine.state.visitedLocations.has('kitchen')) {
            hints.push('The Kitchen pantry might have useful records.');
        }
        if (!Engine.state.flags.master_suite_access && Engine.state.loop >= 2) {
            hints.push('You might be able to access the Master Suite now.');
        }
        if (Engine.state.discoveredEvidence.has('safe_code') && !Engine.state.discoveredEvidence.has('modified_will')) {
            hints.push('You have the safe combination. Check the Study safe.');
        }
        if (!Engine.state.eavesdropsWitnessed.has('rex_ashworth_argument')) {
            hints.push('Rex meets with Lord Ashworth around 9 AM in the Study.');
        }
        if (Engine.state.loop >= 2 && !Engine.state.eavesdropsWitnessed.has('evelyn_rex_garden')) {
            hints.push('Lady Evelyn and Rex meet in the Garden around 10 AM.');
        }
        if (Engine.state.loop >= 2 && !Engine.state.eavesdropsWitnessed.has('cross_ashworth_medical')) {
            hints.push('Dr. Cross meets Lord Ashworth at 3 PM in the Study.');
        }
        if (Engine.state.discoveredEvidence.has('love_letters') && Engine.state.discoveredEvidence.has('poison_vial')) {
            if (!Engine.state.knownFacts.has('thomas_confirms_evelyn')) {
                hints.push('Father Thomas might confirm what you know about Evelyn.');
            }
        }
        if (hints.length === 0) {
            if (hasEnoughForAccusation()) {
                hints.push('You may have enough evidence to make an accusation (A).');
            } else {
                hints.push('Keep investigating. Follow the evidence where it leads.');
            }
        }

        return hints[Math.floor(Math.random() * Math.min(hints.length, 3))];
    }

    return {
        init, getDiscoveredEvidence, getConnections,
        getEvidenceCount, getTotalEvidence, getEvidenceByCategory,
        getSuspects, selectSuspect, toggleEvidence,
        getSelectedSuspect, getSelectedEvidence,
        resetAccusation, makeAccusation,
        addTheory, getTheories, getProgress,
        hasEnoughForAccusation, getHint,
    };
})();
