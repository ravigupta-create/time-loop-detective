/* ═══════════════════════════════════════════════════════
   UI — HUD, menus, transitions, overlays
   ═══════════════════════════════════════════════════════ */

const UI = (() => {
    let examineTimeout = null;

    // ── Settings State ──
    const settings = {
        volume: 40,
        musicVolume: 15,
        textSpeed: 'normal',
        effects: 'full',
        textSize: 'normal',
        highContrast: false,
    };

    // ── Tutorial State ──
    let tutorialStep = 0;
    let tutorialActive = false;
    let tutorialShown = {};

    function init() {
        // Title screen buttons
        document.getElementById('btn-new-game').addEventListener('click', startNewGame);
        document.getElementById('btn-continue').addEventListener('click', continueGame);
        document.getElementById('btn-how-to-play').addEventListener('click', showHelp);
        document.getElementById('btn-settings').addEventListener('click', showSettings);

        // Game mode buttons (shown after first completion)
        document.getElementById('btn-hard-mode').addEventListener('click', () => {
            Engine.setGameMode('hard');
            startNewGame();
        });
        document.getElementById('btn-speedrun').addEventListener('click', () => {
            Engine.setGameMode('speedrun');
            startNewGame();
        });
        document.getElementById('btn-newgameplus').addEventListener('click', () => {
            Engine.setGameMode('newgameplus');
            startNewGame();
        });

        // Show game modes if player has completed the game before
        try {
            if (localStorage.getItem('ravenholm_completed')) {
                document.getElementById('btn-hard-mode').style.display = '';
                document.getElementById('btn-speedrun').style.display = '';
                document.getElementById('btn-newgameplus').style.display = '';
            }
        } catch (e) {}

        // HUD buttons
        document.getElementById('btn-notebook').addEventListener('click', toggleNotebook);
        document.getElementById('btn-wait').addEventListener('click', showWait);
        document.getElementById('btn-fast-forward').addEventListener('click', showFastForward);
        document.getElementById('btn-accuse').addEventListener('click', showAccusation);
        document.getElementById('btn-mute').addEventListener('click', toggleSound);

        // Help
        document.getElementById('help-close').addEventListener('click', hideHelp);

        // Settings
        document.getElementById('settings-close').addEventListener('click', hideSettings);
        document.getElementById('setting-volume').addEventListener('input', (e) => {
            settings.volume = parseInt(e.target.value);
            applySettings();
        });
        document.getElementById('setting-music').addEventListener('input', (e) => {
            settings.musicVolume = parseInt(e.target.value);
            applySettings();
        });
        document.getElementById('setting-text-speed').addEventListener('change', (e) => {
            settings.textSpeed = e.target.value;
        });
        document.getElementById('setting-effects').addEventListener('change', (e) => {
            settings.effects = e.target.value;
        });
        document.getElementById('setting-text-size').addEventListener('change', (e) => {
            settings.textSize = e.target.value;
            applyTextSize();
        });
        document.getElementById('setting-contrast').addEventListener('change', (e) => {
            settings.highContrast = e.target.value === 'on';
            applyContrast();
        });

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

        // Load saved settings
        loadSettings();
    }

    // ── Game Start ──
    function startNewGame() {
        Audio.init();
        Audio.resume();
        Engine.resetState();

        // Apply game mode bonuses
        Engine.applyNewGamePlusBonuses();

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
        Engine.state.endingKey = key;
        hideAllScreens();
        document.getElementById('ending-screen').classList.add('active');
        Audio.stopAmbience();

        document.getElementById('ending-title').textContent = ending.title;
        document.getElementById('ending-text').textContent = ending.text;

        const progress = Mystery.getProgress();
        const loops = Engine.state.totalLoops + 1;
        const evPct = Math.round((progress.evidence.found / progress.evidence.total) * 100);
        const rank = getDetectiveRank(loops, evPct, key);

        // Character epilogues
        const epilogues = getEpilogues(key);

        document.getElementById('ending-stats').innerHTML = `
            <div style="color:var(--amber);font-size:20px;font-family:var(--font-display);margin-bottom:8px">${rank.title}</div>
            <div style="color:var(--text-dim);font-size:11px;margin-bottom:16px">${rank.description}</div>
            <strong style="color:var(--amber)">${ending.rating}</strong><br><br>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;text-align:left;margin-bottom:16px">
                <div>🔄 Loops: <strong>${loops}</strong></div>
                <div>🔍 Evidence: <strong>${progress.evidence.found}/${progress.evidence.total}</strong></div>
                <div>👤 NPCs Met: <strong>${progress.npcs.met}/${progress.npcs.total}</strong></div>
                <div>👂 Overheard: <strong>${progress.eavesdrops.found}/${progress.eavesdrops.total}</strong></div>
                <div>🔗 Connections: <strong>${progress.connections.found}/${progress.connections.total}</strong></div>
                <div>⚡ Actions: <strong>${Engine.state.totalActions}</strong></div>
            </div>
            <div style="text-align:left;margin-top:12px;border-top:1px solid rgba(212,160,32,0.2);padding-top:12px">
                <div style="color:var(--amber);font-size:13px;margin-bottom:8px">Epilogues</div>
                ${epilogues}
            </div>
            <div style="margin-top:12px;border-top:1px solid rgba(212,160,32,0.2);padding-top:12px">
                <div style="color:var(--amber);font-size:13px;margin-bottom:8px">Achievements</div>
                ${getAchievementSummary()}
            </div>
        `;

        // Render ending animation on canvas
        Renderer.startLoop();

        // Mark game as completed (unlocks modes)
        try { localStorage.setItem('ravenholm_completed', 'true'); } catch (e) {}

        Engine.clearSave();
    }

    function getDetectiveRank(loops, evidencePct, endingKey) {
        if (endingKey === 'true_justice' && loops <= 3 && evidencePct >= 90) {
            return { title: '★★★★★ Master Detective', description: 'Exceptional work. Scotland Yard would be envious.' };
        }
        if (endingKey === 'true_justice' && loops <= 5) {
            return { title: '★★★★☆ Senior Inspector', description: 'A thorough and methodical investigation.' };
        }
        if (endingKey === 'prevention') {
            return { title: '★★★★★ Guardian of Time', description: 'You changed fate itself.' };
        }
        if (endingKey === 'true_justice') {
            return { title: '★★★☆☆ Detective', description: 'Justice served, even if it took a while.' };
        }
        if (endingKey === 'clock_secret') {
            return { title: '★★★★☆ Temporal Scholar', description: 'You glimpsed beyond the veil of time.' };
        }
        if (endingKey === 'partial_truth') {
            return { title: '★★☆☆☆ Constable', description: 'Partial truth is still truth, but questions remain.' };
        }
        return { title: '★☆☆☆☆ Amateur Sleuth', description: 'The mystery endures.' };
    }

    function getEpilogues(endingKey) {
        const chars = {
            true_justice: [
                '<strong>Lady Evelyn</strong> — Arrested and tried. Sentenced to life imprisonment.',
                '<strong>Rex Dalton</strong> — Apprehended attempting to flee. Confessed under questioning.',
                '<strong>James</strong> — Inherited the estate. Slowly paid off his debts.',
                '<strong>Lily</strong> — Left for London. Published poetry under a pen name.',
                '<strong>Dr. Cross</strong> — Retired from medicine. Carried guilt to his grave.',
                '<strong>Isabelle</strong> — Revealed as investigator. Left the manor. James never forgave the deception.',
            ],
            prevention: [
                '<strong>Lord Ashworth</strong> — Survived the night. Reformed his will. Sought treatment.',
                '<strong>Lady Evelyn</strong> — Confronted and contained. Committed to an asylum.',
                '<strong>Rex Dalton</strong> — Fled the country before dawn.',
                '<strong>The Clock</strong> — Its mechanism fell silent. The loop was broken.',
            ],
            partial_truth: [
                '<strong>The investigation</strong> — One suspect caught, but the full truth remained elusive.',
                '<strong>Ravenholm</strong> — The manor stood, its secrets not fully told.',
            ],
            clock_secret: [
                '<strong>The Ancient Clock</strong> — You understood its purpose. Time itself acknowledged your wisdom.',
                '<strong>The Loop</strong> — Neither broken nor eternal. Transformed into something new.',
            ],
        };
        const lines = chars[endingKey] || ['<em>The story continues in the shadows...</em>'];
        return lines.map(l => `<div style="font-size:11px;color:var(--text-dim);margin-bottom:4px;line-height:1.4">${l}</div>`).join('');
    }

    function getAchievementSummary() {
        const all = Engine.achievementDefs;
        const unlocked = Engine.state.achievements;
        let html = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:4px">';
        for (const [id, def] of Object.entries(all)) {
            const got = unlocked.has(id);
            html += `<div style="font-size:10px;color:${got ? 'var(--amber)' : 'var(--text-dim)'}">${got ? '★' : '☆'} ${def.name}</div>`;
        }
        html += '</div>';
        return html;
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

    // ── Settings ──
    function showSettings() {
        document.getElementById('settings-screen').classList.add('active');
    }

    function hideSettings() {
        document.getElementById('settings-screen').classList.remove('active');
        saveSettings();
    }

    function applySettings() {
        try {
            Audio.setMasterVolume(settings.volume / 100);
            Audio.setMusicVolume(settings.musicVolume / 100);
        } catch (e) {}
    }

    function applyTextSize() {
        const body = document.body;
        body.classList.remove('text-small', 'text-normal', 'text-large');
        body.classList.add(`text-${settings.textSize}`);
    }

    function applyContrast() {
        document.body.classList.toggle('high-contrast', settings.highContrast);
    }

    function getTextSpeed() {
        switch (settings.textSpeed) {
            case 'fast': return 12;
            case 'slow': return 40;
            default: return 25;
        }
    }

    function getEffectsLevel() {
        return settings.effects;
    }

    function saveSettings() {
        try {
            localStorage.setItem('ravenholm_settings', JSON.stringify(settings));
        } catch (e) {}
    }

    function loadSettings() {
        try {
            const saved = localStorage.getItem('ravenholm_settings');
            if (saved) {
                Object.assign(settings, JSON.parse(saved));
                document.getElementById('setting-volume').value = settings.volume;
                document.getElementById('setting-music').value = settings.musicVolume;
                document.getElementById('setting-text-speed').value = settings.textSpeed;
                document.getElementById('setting-effects').value = settings.effects;
                document.getElementById('setting-text-size').value = settings.textSize;
                document.getElementById('setting-contrast').value = settings.highContrast ? 'on' : 'off';
                applyTextSize();
                applyContrast();
            }
        } catch (e) {}
    }

    // ── Tutorial System ──
    function showTutorialTip(tipId, message) {
        if (tutorialShown[tipId]) return;
        tutorialShown[tipId] = true;

        const tip = document.createElement('div');
        tip.className = 'tutorial-tip';
        tip.innerHTML = `<div class="tutorial-tip-content">${message}</div>
            <button class="tutorial-tip-dismiss">Got it</button>`;
        document.getElementById('game-container').appendChild(tip);

        requestAnimationFrame(() => tip.classList.add('show'));

        tip.querySelector('.tutorial-tip-dismiss').addEventListener('click', () => {
            tip.classList.remove('show');
            setTimeout(() => tip.remove(), 300);
        });

        // Auto-dismiss after 8 seconds
        setTimeout(() => {
            if (tip.parentNode) {
                tip.classList.remove('show');
                setTimeout(() => { if (tip.parentNode) tip.remove(); }, 300);
            }
        }, 8000);
    }

    function checkTutorialTriggers() {
        if (Engine.state.loop > 0) return; // Only on first loop
        if (Engine.getGameMode() === 'hard') return; // No hints in hard mode

        const evCount = Engine.state.discoveredEvidence.size;
        const npcCount = Object.keys(Engine.state.notebook.profiles).length;

        if (!tutorialShown.welcome && Engine.state.totalActions <= 1) {
            showTutorialTip('welcome', '🔍 <strong>Welcome, Detective.</strong> Click on objects to examine them, people to talk, and doors to move between rooms.');
        }
        if (!tutorialShown.evidence && evCount === 1) {
            showTutorialTip('evidence', '📌 <strong>Evidence found!</strong> Press <strong>N</strong> to open your notebook and review your clues.');
        }
        if (!tutorialShown.npc && npcCount === 1) {
            showTutorialTip('npc', '💬 <strong>First contact!</strong> Different dialogue options unlock as you discover more evidence.');
        }
        if (!tutorialShown.time && Engine.state.time >= 600) {
            showTutorialTip('time', '⏰ <strong>Time is passing.</strong> Each action costs time. You have until midnight before the day resets.');
        }
        if (!tutorialShown.inventory && Inventory.getItems().length === 1) {
            showTutorialTip('inventory', '🎒 <strong>Item found!</strong> Press <strong>I</strong> to view your inventory. Use items on objects for special interactions.');
        }
    }

    return {
        init, updateHUD, toggleNotebook,
        showWait, showFastForward, hideFastForward,
        showAccusation, hideAccusation,
        showLoopTransition, showEavesdrop,
        showExamineText, showLoopRecap, showHelp, hideHelp,
        showSettings, hideSettings,
        onEvidenceToggle, hideAllScreens, toggleSound,
        getTextSpeed, getEffectsLevel,
        showTutorialTip, checkTutorialTriggers,
        settings,
    };
})();
