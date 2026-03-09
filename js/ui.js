/* ═══════════════════════════════════════════════════════
   UI — HUD, menus, transitions, overlays
   ═══════════════════════════════════════════════════════ */

const UI = (() => {
    let examineTimeout = null;

    function init() {
        // Title screen buttons
        document.getElementById('btn-new-game').addEventListener('click', startNewGame);
        document.getElementById('btn-continue').addEventListener('click', continueGame);
        document.getElementById('btn-how-to-play').addEventListener('click', showHelp);

        // HUD buttons
        document.getElementById('btn-notebook').addEventListener('click', toggleNotebook);
        document.getElementById('btn-wait').addEventListener('click', showWait);
        document.getElementById('btn-fast-forward').addEventListener('click', showFastForward);
        document.getElementById('btn-accuse').addEventListener('click', showAccusation);
        document.getElementById('btn-mute').addEventListener('click', toggleSound);

        // Help
        document.getElementById('help-close').addEventListener('click', hideHelp);

        // Fast forward cancel
        document.getElementById('ff-cancel').addEventListener('click', hideFastForward);

        // Ending screen
        document.getElementById('btn-play-again').addEventListener('click', () => {
            Engine.clearSave();
            startNewGame();
        });
        document.getElementById('btn-main-menu').addEventListener('click', () => {
            location.reload();
        });

        // Accusation cancel
        document.getElementById('btn-cancel-accuse').addEventListener('click', hideAccusation);
    }

    // ── Game Start ──
    function startNewGame() {
        Audio.init();
        Audio.resume();
        Engine.resetState();

        hideAllScreens();
        showIntro();
    }

    function continueGame() {
        Audio.init();
        Audio.resume();

        if (Engine.load()) {
            hideAllScreens();
            updateHUD();
            World.enterLocation(Engine.state.currentLocation);
            Renderer.startLoop();
        } else {
            startNewGame();
        }
    }

    function showIntro() {
        const screen = document.getElementById('intro-screen');
        screen.classList.add('active');

        const textEl = document.getElementById('intro-text');
        const promptEl = document.getElementById('intro-prompt');
        const lines = GameData.introSequence;
        let lineIndex = 0;

        promptEl.style.display = 'none';

        function showLine() {
            if (lineIndex >= lines.length) {
                promptEl.textContent = 'Click to begin your investigation...';
                promptEl.style.display = '';
                screen.onclick = () => {
                    screen.onclick = null;
                    screen.classList.remove('active');
                    Engine.state.screen = 'playing';
                    updateHUD();
                    World.enterLocation('your_room');
                    Renderer.startLoop();
                    Engine.save();
                };
                return;
            }

            textEl.textContent = lines[lineIndex];
            textEl.classList.remove('visible');
            requestAnimationFrame(() => {
                textEl.classList.add('visible');
            });

            promptEl.textContent = 'Click to continue...';
            promptEl.style.display = '';

            screen.onclick = () => {
                lineIndex++;
                showLine();
            };
        }

        showLine();
        Audio.startAmbience('rain');
    }

    // ── HUD ──
    function updateHUD() {
        document.getElementById('hud-clock').textContent = GameData.formatTime(Engine.state.time);
        document.getElementById('hud-loop-num').textContent = Engine.state.loop + 1;

        // Time bar (0-100% of the day)
        const progress = ((Engine.state.time - 360) / (1440 - 360)) * 100;
        document.getElementById('hud-time-fill').style.width = `${Math.min(100, progress)}%`;

        // Color the time bar red as midnight approaches
        const fill = document.getElementById('hud-time-fill');
        if (progress > 80) {
            fill.style.background = 'linear-gradient(90deg, #d4a020, #cc3333, #ff4444)';
        } else if (progress > 60) {
            fill.style.background = 'linear-gradient(90deg, #d4a020, #cc3333)';
        } else {
            fill.style.background = 'linear-gradient(90deg, #8b6914, #d4a020)';
        }
    }

    // ── Notebook Toggle ──
    function toggleNotebook() {
        if (Engine.state.screen === 'notebook') {
            Notebook.close();
        } else if (Engine.state.screen === 'playing') {
            Notebook.open();
        }
    }

    // ── Wait ──
    function showWait() {
        if (Engine.state.screen !== 'playing') return;
        Engine.advanceTime(30);
        // Show atmospheric time-passing narration
        const lines = GameData.narration.time_passing;
        const msg = lines ? lines[Math.floor(Math.random() * lines.length)] : '30 minutes pass...';
        Engine.notify(msg);
        // Also update the room narration text
        const narEl = document.getElementById('room-narration');
        if (narEl) narEl.textContent = msg;
        World.refreshActions();
    }

    // ── Fast Forward ──
    function showFastForward() {
        if (Engine.state.screen !== 'playing') return;

        Engine.state.screen = 'fast_forward';
        const screen = document.getElementById('ff-screen');
        screen.classList.add('active');

        const container = document.getElementById('ff-options');
        container.innerHTML = '';

        const times = [
            { label: '8:00 AM', minutes: 480 },
            { label: '10:00 AM', minutes: 600 },
            { label: '12:00 PM', minutes: 720 },
            { label: '2:00 PM', minutes: 840 },
            { label: '4:00 PM', minutes: 960 },
            { label: '6:00 PM', minutes: 1080 },
            { label: '8:00 PM', minutes: 1200 },
            { label: '10:00 PM', minutes: 1320 },
            { label: '11:00 PM', minutes: 1380 },
            { label: '11:30 PM', minutes: 1410 },
        ];

        times.forEach(t => {
            const btn = document.createElement('button');
            btn.className = 'ff-btn';
            btn.textContent = t.label;

            if (t.minutes <= Engine.state.time) {
                btn.classList.add('past');
                btn.title = 'Already past this time';
            } else {
                btn.addEventListener('click', () => {
                    hideFastForward();
                    const advance = t.minutes - Engine.state.time;
                    Engine.advanceTime(advance);
                    Engine.notify(`Time advances to ${t.label}...`);
                    World.refreshActions();
                });
            }
            container.appendChild(btn);
        });
    }

    function hideFastForward() {
        Engine.state.screen = 'playing';
        document.getElementById('ff-screen').classList.remove('active');
    }

    // ── Accusation ──
    function showAccusation() {
        if (Engine.state.screen !== 'playing') return;

        Mystery.resetAccusation();
        Engine.state.screen = 'accusation';
        document.getElementById('accusation-screen').classList.add('active');
        Audio.playSound('accusation');

        buildAccusationUI();
    }

    function hideAccusation() {
        Engine.state.screen = 'playing';
        document.getElementById('accusation-screen').classList.remove('active');
    }

    function buildAccusationUI() {
        // Suspects
        const suspectContainer = document.getElementById('accusation-suspects');
        suspectContainer.innerHTML = '';

        // Also add option to accuse "the clock" for the secret ending
        const suspects = Mystery.getSuspects();
        if (Engine.state.discoveredEvidence.has('ancient_clock')) {
            suspects.push({ id: 'clock', name: 'The Ancient Clock', role: 'The Time Loop Itself' });
        }

        suspects.forEach(s => {
            const btn = document.createElement('button');
            btn.className = 'suspect-btn';
            btn.innerHTML = `<strong>${s.name}</strong><br><span style="font-size:10px;color:#6a6a80">${s.role}</span>`;
            btn.addEventListener('click', () => {
                document.querySelectorAll('.suspect-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                Mystery.selectSuspect(s.id);
                buildEvidenceCheckboxes();
            });
            suspectContainer.appendChild(btn);
        });

        // Evidence section
        document.getElementById('accusation-evidence').innerHTML = '';
        document.getElementById('accusation-confirm').style.display = 'none';
    }

    function buildEvidenceCheckboxes() {
        const container = document.getElementById('accusation-evidence');
        const clues = Engine.state.notebook.clues;

        if (clues.length === 0) {
            container.innerHTML = '<p style="color:#6a6a80;font-size:12px;font-style:italic">No evidence collected yet.</p>';
            return;
        }

        let html = '<h4>Supporting Evidence</h4>';
        clues.forEach(clue => {
            html += `<label class="evidence-check">
                <input type="checkbox" value="${clue.id}" onchange="UI.onEvidenceToggle('${clue.id}')">
                ${clue.name}
            </label>`;
        });
        container.innerHTML = html;

        // Show confirm button
        document.getElementById('accusation-confirm').style.display = '';

        // Confirm button
        document.getElementById('btn-confirm-accuse').onclick = () => {
            const result = Mystery.makeAccusation();
            if (!result) return;
            handleAccusationResult(result);
        };
    }

    function onEvidenceToggle(evidenceId) {
        Mystery.toggleEvidence(evidenceId);
    }

    function handleAccusationResult(endingKey) {
        hideAccusation();

        const ending = GameData.endings[endingKey];
        if (!ending) {
            // Wrong accusation — loop continues
            Engine.notify('Your accusation was incorrect. The loop continues...');
            Engine.triggerMidnight();
            return;
        }

        if (ending.continuesLoop) {
            // Wrong accusation
            Engine.notify('You accused the wrong person...');
            setTimeout(() => {
                Engine.triggerMidnight();
            }, 2000);
            return;
        }

        // Show ending
        showEnding(endingKey, ending);
    }

    // ── Endings ──
    function showEnding(key, ending) {
        Engine.state.screen = 'ending';
        hideAllScreens();
        document.getElementById('ending-screen').classList.add('active');
        Renderer.stopLoop();
        Audio.stopAmbience();

        document.getElementById('ending-title').textContent = ending.title;
        document.getElementById('ending-text').textContent = ending.text;

        const progress = Mystery.getProgress();
        document.getElementById('ending-stats').innerHTML = `
            <strong>${ending.rating}</strong><br><br>
            Total Loops: ${Engine.state.totalLoops + 1}<br>
            Evidence Found: ${progress.evidence.found}/${progress.evidence.total}<br>
            NPCs Interviewed: ${progress.npcs.met}/${progress.npcs.total}<br>
            Conversations Overheard: ${progress.eavesdrops.found}/${progress.eavesdrops.total}<br>
            Connections Made: ${progress.connections.found}/${progress.connections.total}<br>
            Total Actions: ${Engine.state.totalActions}
        `;

        Engine.clearSave();
    }

    // ── Loop Transition ──
    function showLoopTransition(callback) {
        const screen = document.getElementById('loop-transition');
        const clock = document.getElementById('loop-clock');
        const msg = document.getElementById('loop-message');

        screen.classList.add('active');
        Audio.playSound('loop_reset');
        Audio.stopAmbience();

        // Animate clock rewinding
        let displayTime = 1440;
        clock.textContent = '12:00';
        msg.textContent = 'The clock strikes midnight...';

        setTimeout(() => {
            msg.textContent = GameData.loopMessages[Math.min(Engine.state.loop, GameData.loopMessages.length - 1)];

            // Rewind animation
            const rewind = setInterval(() => {
                displayTime -= 30;
                if (displayTime <= 360) {
                    displayTime = 360;
                    clearInterval(rewind);
                    clock.textContent = '6:00';

                    setTimeout(() => {
                        screen.classList.remove('active');
                        if (callback) callback();
                    }, 1500);
                }
                const h = Math.floor(displayTime / 60);
                const m = displayTime % 60;
                clock.textContent = `${h}:${String(m).padStart(2, '0')}`;
            }, 50);
        }, 2000);
    }

    // ── Eavesdrop ──
    function showEavesdrop(eavesdrop) {
        Engine.state.screen = 'eavesdrop';
        const screen = document.getElementById('eavesdrop-overlay');
        screen.classList.add('active');

        document.getElementById('eavesdrop-speakers').textContent = eavesdrop.speakers;
        const textEl = document.getElementById('eavesdrop-text');
        const promptEl = document.getElementById('eavesdrop-prompt');

        let lineIndex = 0;

        function showLine() {
            if (lineIndex >= eavesdrop.lines.length) {
                promptEl.textContent = 'Click to close...';
                screen.onclick = () => {
                    screen.onclick = null;
                    screen.classList.remove('active');
                    Engine.state.screen = 'playing';

                    // Add to timeline
                    Engine.state.notebook.timeline.push({
                        time: Engine.state.time,
                        event: `Overheard: ${eavesdrop.speakers}`,
                        location: Engine.state.currentLocation,
                        loop: Engine.state.loop,
                    });

                    Engine.notify('Conversation overheard — check your notebook.');
                    World.refreshActions();
                };
                return;
            }

            const line = eavesdrop.lines[lineIndex];
            const speakerName = getSpeakerName(line.speaker);
            textEl.innerHTML = `<span style="color:#d4a020">${speakerName}:</span> "${line.text}"`;

            promptEl.textContent = 'Click to continue...';
            screen.onclick = () => {
                lineIndex++;
                showLine();
            };
        }

        showLine();
    }

    function getSpeakerName(key) {
        const map = {
            ashworth: 'Lord Ashworth', evelyn: 'Lady Evelyn', james: 'James',
            lily: 'Lily', cross: 'Dr. Cross', rex: 'Rex', isabelle: 'Isabelle',
            thomas: 'Father Thomas', blackwood: 'Mrs. Blackwood', finch: 'Mr. Finch',
        };
        return map[key] || key;
    }

    // ── Loop Recap ──
    function showLoopRecap() {
        Engine.state.screen = 'loop_recap';
        const screen = document.getElementById('loop-recap-screen');
        screen.classList.add('active');

        // Loop number
        document.getElementById('loop-recap-header').textContent = `Loop ${Engine.state.loop + 1}`;

        // Evidence count
        const evidenceCount = Mystery.getEvidenceCount();
        const totalEvidence = Mystery.getTotalEvidence();
        const evidenceEl = document.getElementById('loop-recap-evidence');
        evidenceEl.innerHTML = `<strong style="color:var(--amber)">Evidence:</strong> ${evidenceCount} / ${totalEvidence} pieces found`;

        // Key facts learned
        const factsEl = document.getElementById('loop-recap-facts');
        const facts = [...Engine.state.knownFacts];
        if (facts.length === 0) {
            factsEl.innerHTML = '<strong style="color:var(--purple)">Key Facts:</strong> None yet — talk to NPCs and examine objects.';
        } else {
            const displayFacts = facts.slice(-5); // Show up to 5 most recent
            let factsHTML = `<strong style="color:var(--purple)">Key Facts:</strong> ${facts.length} learned`;
            if (facts.length > 5) {
                factsHTML += ` (showing latest ${displayFacts.length})`;
            }
            factsHTML += '<br>';
            displayFacts.forEach(f => {
                const formatted = f.replace(/_/g, ' ');
                factsHTML += `<div class="recap-fact">${formatted}</div>`;
            });
            factsEl.innerHTML = factsHTML;
        }

        // Hint
        const hintEl = document.getElementById('loop-recap-hint');
        const hint = Mystery.getHint();
        hintEl.innerHTML = `<strong style="color:var(--blue-accent)">Hint:</strong> ${hint}`;

        // Begin Loop button
        document.getElementById('btn-begin-loop').onclick = () => {
            screen.classList.remove('active');
            Engine.state.screen = 'playing';
        };
    }

    // ── Examine Text ──
    function showExamineText(text) {
        const descEl = document.getElementById('room-description');
        descEl.textContent = text;
        descEl.classList.remove('fade-in');
        requestAnimationFrame(() => descEl.classList.add('fade-in'));
    }

    // ── Sound Toggle ──
    function toggleSound() {
        const enabled = Audio.toggle();
        const btn = document.getElementById('btn-mute');
        btn.textContent = enabled ? '🔊 Sound' : '🔇 Muted';
    }

    // ── Help ──
    function showHelp() {
        document.getElementById('help-screen').classList.add('active');
    }

    function hideHelp() {
        document.getElementById('help-screen').classList.remove('active');
        Engine.state.screen = Engine.state.started ? 'playing' : 'title';
    }

    // ── Screen Management ──
    function hideAllScreens() {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    }

    return {
        init, updateHUD, toggleNotebook,
        showWait, showFastForward, hideFastForward,
        showAccusation, hideAccusation,
        showLoopTransition, showEavesdrop,
        showExamineText, showLoopRecap, showHelp, hideHelp,
        onEvidenceToggle, hideAllScreens, toggleSound,
    };
})();
