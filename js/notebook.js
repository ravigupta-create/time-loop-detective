/* ═══════════════════════════════════════════════════════
   NOTEBOOK — Detective's notebook UI, evidence board
   ═══════════════════════════════════════════════════════ */

const Notebook = (() => {
    let currentTab = 'clues';
    let boardCanvas = null;
    let boardCtx = null;
    let boardDragNode = null;
    let boardPositions = {};
    let boardOffset = { x: 0, y: 0 };

    function init() {
        // Tab switching
        document.querySelectorAll('.nb-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                switchTab(tab.dataset.tab);
            });
        });

        // Close
        document.getElementById('notebook-close').addEventListener('click', () => {
            UI.toggleNotebook();
        });

        // Board canvas setup
        boardCanvas = document.getElementById('board-canvas');
    }

    function open() {
        Audio.playSound('notebook_open');
        Engine.state.screen = 'notebook';
        World.showScreen('notebook-screen');
        renderCurrentTab();
    }

    function close() {
        Audio.playSound('notebook_close');
        Engine.state.screen = 'playing';
        World.hideScreen('notebook-screen');
    }

    function switchTab(tabName) {
        currentTab = tabName;
        document.querySelectorAll('.nb-tab').forEach(t => t.classList.remove('active'));
        document.querySelector(`.nb-tab[data-tab="${tabName}"]`).classList.add('active');
        document.querySelectorAll('.nb-page').forEach(p => p.classList.remove('active'));
        document.getElementById(`nb-${tabName}`).classList.add('active');
        renderCurrentTab();
    }

    function renderCurrentTab() {
        switch (currentTab) {
            case 'clues': renderClues(); break;
            case 'profiles': renderProfiles(); break;
            case 'timeline': renderTimeline(); break;
            case 'board': renderBoard(); break;
            case 'theories': renderTheories(); break;
        }
    }

    // ── Clues Tab ──
    function renderClues() {
        const container = document.getElementById('nb-clues');
        const clues = Engine.state.notebook.clues;

        if (clues.length === 0) {
            container.innerHTML = '<div class="nb-empty">No clues discovered yet. Examine objects in rooms to find evidence.</div>';
            return;
        }

        const byCategory = Mystery.getEvidenceByCategory();
        let html = '';

        const categoryNames = {
            documents: '📄 Documents',
            physical: '🔍 Physical Evidence',
            records: '📋 Records',
            structural: '🏗️ Structural',
            supernatural: '✨ Supernatural',
            key: '🔑 Keys & Codes',
        };

        for (const [cat, items] of Object.entries(byCategory)) {
            if (items.length === 0) continue;
            html += `<h3 style="color:#d4a020;font-size:12px;margin:16px 0 8px;text-transform:uppercase;letter-spacing:1px">${categoryNames[cat] || cat}</h3>`;
            items.forEach(clue => {
                html += `<div class="clue-item">
                    <h4>${clue.name}</h4>
                    <p>${clue.description}</p>
                    <div class="clue-location">Found in ${GameData.locations[clue.location]?.name || clue.location} — Loop ${clue.loop + 1}</div>
                </div>`;
            });
        }

        // Progress
        const progress = Mystery.getProgress();
        html += `<div style="margin-top:20px;padding:12px;border-top:1px solid rgba(212,160,32,0.2);font-size:12px;color:#6a6a80">
            Evidence: ${progress.evidence.found}/${progress.evidence.total} (${progress.evidence.pct}%) |
            Overall Progress: ${progress.overallPct}%
        </div>`;

        container.innerHTML = html;
    }

    // ── Profiles Tab ──
    function renderProfiles() {
        const container = document.getElementById('nb-profiles');
        const profiles = Engine.state.notebook.profiles;
        const profileIds = Object.keys(profiles);

        if (profileIds.length === 0) {
            container.innerHTML = '<div class="nb-empty">No profiles yet. Talk to people to learn about them.</div>';
            return;
        }

        let html = '';
        profileIds.forEach(id => {
            const p = profiles[id];
            const npc = GameData.npcs[id];
            const schedule = NPCs.getScheduleOverview(id);
            const currentLoc = NPCs.getLocation(id, Engine.state.time);
            const currentLocName = currentLoc ? (GameData.locations[currentLoc]?.name || currentLoc) : 'Unknown';

            html += `<div class="profile-card">
                <h4>${p.name}</h4>
                <div class="profile-role">${p.role} — Age ${p.age}</div>
                <p>${p.description}</p>`;

            // Current location
            html += `<div style="margin-top:8px;font-size:11px;color:#4488cc">📍 Currently: ${currentLocName}</div>`;

            // Notes
            if (p.notes.length > 0) {
                html += '<div class="profile-notes">';
                p.notes.forEach(note => {
                    html += `<div class="profile-note">${note}</div>`;
                });
                html += '</div>';
            }

            // Known schedule (if player has observed enough)
            if (Engine.state.loop >= 1) {
                html += `<details style="margin-top:8px">
                    <summary style="font-size:11px;color:#6a6a80;cursor:pointer">Known Schedule</summary>
                    <div style="padding:4px 0">`;
                schedule.forEach(slot => {
                    const startTime = GameData.formatTime(slot.start);
                    const endTime = GameData.formatTime(slot.end);
                    const isCurrent = Engine.state.time >= slot.start && Engine.state.time < slot.end;
                    html += `<div style="font-size:11px;color:${isCurrent ? '#d4a020' : '#6a6a80'};padding:2px 0">
                        ${startTime}-${endTime}: ${slot.locationName} — ${slot.activity}
                    </div>`;
                });
                html += '</div></details>';
            }

            html += '</div>';
        });

        container.innerHTML = html;
    }

    // ── Timeline Tab ──
    function renderTimeline() {
        const container = document.getElementById('nb-timeline');
        const timeline = Engine.state.notebook.timeline;

        if (timeline.length === 0) {
            container.innerHTML = '<div class="nb-empty">No events recorded yet. Explore and investigate to build your timeline.</div>';
            return;
        }

        // Group by loop
        const byLoop = {};
        timeline.forEach(entry => {
            const loop = entry.loop || 0;
            if (!byLoop[loop]) byLoop[loop] = [];
            byLoop[loop].push(entry);
        });

        let html = '';
        for (const [loop, entries] of Object.entries(byLoop).reverse()) {
            html += `<h3 style="color:#d4a020;font-size:12px;margin:16px 0 8px;text-transform:uppercase;letter-spacing:1px">Loop ${parseInt(loop) + 1}</h3>`;
            entries.sort((a, b) => a.time - b.time).forEach(entry => {
                html += `<div class="timeline-entry">
                    <div class="timeline-time">${GameData.formatTime(entry.time)}</div>
                    <div class="timeline-event">${entry.event}${entry.location ? ` <span style="color:#4488cc">(${GameData.locations[entry.location]?.name || entry.location})</span>` : ''}</div>
                </div>`;
            });
        }

        container.innerHTML = html;
    }

    // ── Evidence Board Tab ──
    function renderBoard() {
        if (!boardCanvas) return;

        const parent = boardCanvas.parentElement;
        boardCanvas.width = parent.clientWidth;
        boardCanvas.height = parent.clientHeight;
        boardCtx = boardCanvas.getContext('2d');

        const clues = Engine.state.notebook.clues;
        const connections = Engine.state.evidenceConnections;

        if (clues.length === 0) {
            boardCtx.fillStyle = '#1a1510';
            boardCtx.fillRect(0, 0, boardCanvas.width, boardCanvas.height);
            boardCtx.fillStyle = '#6a6a80';
            boardCtx.font = '14px Courier New';
            boardCtx.textAlign = 'center';
            boardCtx.fillText('No evidence to display.', boardCanvas.width / 2, boardCanvas.height / 2);
            return;
        }

        // Auto-layout evidence positions
        initBoardPositions(clues);

        const w = boardCanvas.width;
        const h = boardCanvas.height;

        // Background
        boardCtx.fillStyle = '#1a1510';
        boardCtx.fillRect(0, 0, w, h);

        // Cork board texture
        for (let i = 0; i < 50; i++) {
            boardCtx.fillStyle = `rgba(40, 30, 20, ${0.1 + Math.random() * 0.1})`;
            boardCtx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
        }

        // Draw connections (strings)
        connections.forEach(conn => {
            const from = boardPositions[conn.from];
            const to = boardPositions[conn.to];
            if (!from || !to) return;

            boardCtx.strokeStyle = '#cc3333';
            boardCtx.lineWidth = 1.5;
            boardCtx.setLineDash([4, 4]);
            boardCtx.beginPath();
            boardCtx.moveTo(from.x + 60, from.y + 20);
            boardCtx.lineTo(to.x + 60, to.y + 20);
            boardCtx.stroke();
            boardCtx.setLineDash([]);

            // Label on connection
            const mx = (from.x + to.x) / 2 + 60;
            const my = (from.y + to.y) / 2 + 20;
            boardCtx.fillStyle = 'rgba(13,13,26,0.8)';
            boardCtx.fillRect(mx - 50, my - 8, 100, 16);
            boardCtx.fillStyle = '#cc3333';
            boardCtx.font = '9px Courier New';
            boardCtx.textAlign = 'center';
            boardCtx.fillText(conn.label, mx, my + 3);
        });

        // Draw evidence cards
        clues.forEach(clue => {
            const pos = boardPositions[clue.id];
            if (!pos) return;

            // Card
            const cardW = 120;
            const cardH = 40;
            boardCtx.fillStyle = 'rgba(26, 26, 46, 0.9)';
            boardCtx.fillRect(pos.x, pos.y, cardW, cardH);

            // Category accent
            const catColors = {
                documents: '#d4a020',
                physical: '#cc3333',
                records: '#4488cc',
                structural: '#44aa66',
                supernatural: '#8855bb',
                key: '#d4a020',
            };
            boardCtx.fillStyle = catColors[clue.category] || '#d4a020';
            boardCtx.fillRect(pos.x, pos.y, 3, cardH);

            // Pin
            boardCtx.fillStyle = '#cc3333';
            boardCtx.beginPath();
            boardCtx.arc(pos.x + cardW / 2, pos.y - 2, 4, 0, Math.PI * 2);
            boardCtx.fill();

            // Text
            boardCtx.fillStyle = '#c8c8d4';
            boardCtx.font = '10px Courier New';
            boardCtx.textAlign = 'left';
            const name = clue.name.length > 18 ? clue.name.substring(0, 16) + '...' : clue.name;
            boardCtx.fillText(name, pos.x + 8, pos.y + 16);
            boardCtx.fillStyle = '#6a6a80';
            boardCtx.font = '8px Courier New';
            boardCtx.fillText(GameData.locations[clue.location]?.name || '', pos.x + 8, pos.y + 30);
        });

        boardCtx.textAlign = 'start';
    }

    function initBoardPositions(clues) {
        const w = boardCanvas.width;
        const h = boardCanvas.height;
        const padding = 20;
        const cols = Math.ceil(Math.sqrt(clues.length));
        const cellW = (w - padding * 2) / cols;
        const cellH = 60;

        clues.forEach((clue, i) => {
            if (!boardPositions[clue.id]) {
                const col = i % cols;
                const row = Math.floor(i / cols);
                boardPositions[clue.id] = {
                    x: padding + col * cellW + (Math.random() * 20 - 10),
                    y: padding + row * cellH + (Math.random() * 10 - 5),
                };
            }
        });
    }

    // ── Theories Tab ──
    function renderTheories() {
        const container = document.getElementById('nb-theories');
        const theories = Mystery.getTheories();

        let html = '';

        // Add theory input
        html += `<div style="margin-bottom:16px">
            <textarea id="theory-input" placeholder="Write your theory here..." style="
                width:100%;height:60px;background:rgba(0,0,0,0.3);border:1px solid #252540;
                color:#c8c8d4;padding:8px;font-family:'Courier New',monospace;font-size:12px;
                resize:vertical;
            "></textarea>
            <button id="add-theory-btn" class="action-btn" style="margin-top:4px">Add Theory</button>
        </div>`;

        // Hint
        const hint = Mystery.getHint();
        html += `<div style="padding:10px;margin-bottom:12px;background:rgba(68,136,204,0.05);border-left:3px solid #2a4a6a;font-size:12px;color:#4488cc;font-style:italic">
            💡 ${hint}
        </div>`;

        // Progress summary
        const progress = Mystery.getProgress();
        html += `<div style="padding:10px;margin-bottom:16px;background:rgba(212,160,32,0.05);border-left:3px solid #8b6914;font-size:12px">
            <div style="color:#d4a020;margin-bottom:4px">Investigation Progress — ${progress.overallPct}%</div>
            <div style="color:#6a6a80">
                Evidence: ${progress.evidence.found}/${progress.evidence.total} |
                NPCs Met: ${progress.npcs.met}/${progress.npcs.total} |
                Overheard: ${progress.eavesdrops.found}/${progress.eavesdrops.total} |
                Connections: ${progress.connections.found}/${progress.connections.total} |
                Loops: ${progress.loops + 1}
            </div>
        </div>`;

        // Achievements
        const achievements = Engine.state.achievements;
        const defs = Engine.achievementDefs;
        const totalAch = Object.keys(defs).length;
        const unlockedAch = achievements.size;
        html += `<div style="padding:10px;margin-bottom:16px;background:rgba(136,85,187,0.05);border-left:3px solid #8855bb;font-size:12px">
            <div style="color:#8855bb;margin-bottom:8px;font-weight:bold">Achievements — ${unlockedAch}/${totalAch}</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">`;
        for (const [id, def] of Object.entries(defs)) {
            const unlocked = achievements.has(id);
            const color = unlocked ? '#d4a020' : '#3a3a50';
            const icon = unlocked ? '\u2605' : '\u2606';
            html += `<div style="padding:6px 8px;background:rgba(0,0,0,0.2);border:1px solid ${color};border-radius:4px;opacity:${unlocked ? '1' : '0.5'}">
                <div style="color:${color};font-size:11px;font-weight:bold">${icon} ${def.name}</div>
                <div style="color:#6a6a80;font-size:10px;margin-top:2px">${def.desc}</div>
            </div>`;
        }
        html += '</div></div>';

        // Existing theories
        if (theories.length > 0) {
            theories.slice().reverse().forEach(theory => {
                html += `<div class="theory-item">
                    <h4>Loop ${theory.loop + 1} — ${GameData.formatTime(theory.time)}</h4>
                    <p>${theory.text}</p>
                </div>`;
            });
        } else {
            html += '<div class="nb-empty" style="padding:20px">No theories yet. Use this space to track your suspicions and reasoning.</div>';
        }

        container.innerHTML = html;

        // Add theory button handler
        const addBtn = document.getElementById('add-theory-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                const input = document.getElementById('theory-input');
                if (input.value.trim()) {
                    Mystery.addTheory(input.value.trim());
                    input.value = '';
                    renderTheories();
                    Engine.notify('Theory recorded.');
                }
            });
        }
    }

    return {
        init, open, close, renderCurrentTab,
        renderBoard,
    };
})();
