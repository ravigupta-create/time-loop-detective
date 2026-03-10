/* ═══════════════════════════════════════════════════════
   AUTOPLAY — Secret cheat code "srg2" activates auto-play.
   Spacebar toggles bot on/off. Session-only (no persistence).
   ═══════════════════════════════════════════════════════ */

const AutoPlay = (() => {
    const CODE = ['s', 'r', 'g', '2'];
    let codeIndex = 0;
    let activated = false;
    let running = false;
    let tickTimer = null;
    const TICK_MS = 1500;

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
            tickTimer = setInterval(tick, TICK_MS);
        } else {
            Engine.notify('AUTO-PLAY OFF');
            if (tickTimer) { clearInterval(tickTimer); tickTimer = null; }
        }
    }

    // ── Bot Decision Loop ──
    function tick() {
        if (!running) return;
        try {
            const screen = Engine.state.screen;
            switch (screen) {
                case 'title':       handleTitle(); break;
                case 'intro':       handleIntro(); break;
                case 'playing':     handlePlaying(); break;
                case 'dialogue':    handleDialogue(); break;
                case 'minigame':    handleMinigame(); break;
                case 'notebook':    handleNotebook(); break;
                case 'accusation':  handleAccusation(); break;
                case 'fast_forward': handleFastForward(); break;
                case 'eavesdrop':   handleEavesdrop(); break;
                case 'loop_recap':  handleLoopRecap(); break;
                case 'ending':      break; // let player read
            }
        } catch (e) {
            // Silently ignore — game state may be in transition
        }
    }

    // ── Screen Handlers ──

    function handleTitle() {
        const cont = document.getElementById('btn-continue');
        const newg = document.getElementById('btn-new-game');
        if (cont && cont.style.display !== 'none') {
            cont.click();
        } else if (newg) {
            newg.click();
        }
    }

    function handleIntro() {
        const screen = document.getElementById('intro-screen');
        if (screen) screen.click();
    }

    function handlePlaying() {
        // 1. Auto-solve any active minigame
        if (MiniGames.isActive()) {
            MiniGames.autoSolve();
            return;
        }

        // 2. If transitioning, wait
        if (Renderer.isTransitioning()) return;

        // 3. If past murder time, just wait for loop end
        if (Engine.state.time >= 1410) return;

        // 4. Get available hotspots
        const hotspots = Hotspots.getHotspots();
        if (!hotspots || hotspots.length === 0) return;

        // Priority: evidence objects > untouched NPCs > other objects > exits
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

        // Pick action by priority
        let target = null;
        if (evidence.length > 0) {
            target = evidence[Math.floor(Math.random() * evidence.length)];
        } else if (npcs.length > 0) {
            target = npcs[Math.floor(Math.random() * npcs.length)];
        } else if (objects.length > 0) {
            target = objects[Math.floor(Math.random() * objects.length)];
        } else if (exits.length > 0) {
            target = exits[Math.floor(Math.random() * exits.length)];
        }

        if (target && target.action) {
            Audio.playSound('click');
            target.action();
        }
    }

    function handleDialogue() {
        const buttons = document.querySelectorAll('#dialogue-choices button');
        if (!buttons.length) return;

        const available = [];
        let endBtn = null;

        buttons.forEach(btn => {
            if (btn.classList.contains('locked')) return;
            if (btn.textContent.includes('End conversation') ||
                btn.textContent.includes('[End')) {
                endBtn = btn;
            } else {
                available.push(btn);
            }
        });

        // Prefer evidence-based choices, then any non-end choice
        const evidenceChoices = available.filter(b => b.classList.contains('evidence-choice'));
        if (evidenceChoices.length > 0) {
            evidenceChoices[0].click();
        } else if (available.length > 0) {
            available[0].click();
        } else if (endBtn) {
            endBtn.click();
        }
    }

    function handleMinigame() {
        MiniGames.autoSolve();
    }

    function handleNotebook() {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    }

    function handleAccusation() {
        // Don't auto-accuse — just close
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    }

    function handleFastForward() {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    }

    function handleEavesdrop() {
        const overlay = document.getElementById('eavesdrop-overlay');
        if (overlay) overlay.click();
    }

    function handleLoopRecap() {
        const btn = document.getElementById('btn-begin-loop');
        if (btn) btn.click();
    }

    // ── Public API ──
    function isRunning() { return running; }
    function isActivated() { return activated; }

    return { isRunning, isActivated };
})();
