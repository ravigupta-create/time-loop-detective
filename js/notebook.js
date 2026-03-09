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

    // ── Interactive board state ──
    let boardZoom = 1.0;
    let boardPan = { x: 0, y: 0 };
    let boardDragging = false;
    let boardDragStart = { x: 0, y: 0 };
    let boardDragCardStart = { x: 0, y: 0 };
    let boardPanning = false;
    let boardPanStart = { x: 0, y: 0 };
    let boardPanOffset = { x: 0, y: 0 };
    let boardHoverCard = null;
    let boardAnimFrame = null;
    let boardAnimTime = 0;
    let boardListenersAttached = false;
    let boardTooltip = null;

    const CARD_W = 140;
    const CARD_H = 50;
    const CARD_RADIUS = 6;
    const PIN_RADIUS = 5;

    // Category icons (drawn as text symbols)
    const categoryIcons = {
        documents: '\u{1F4C4}',
        physical: '\u{1F50D}',
        records: '\u{1F4CB}',
        structural: '\u{1F3D7}',
        supernatural: '\u{2728}',
        key: '\u{1F511}',
    };

    const catColors = {
        documents: '#d4a020',
        physical: '#cc3333',
        records: '#4488cc',
        structural: '#44aa66',
        supernatural: '#8855bb',
        key: '#d4a020',
    };

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
        boardTooltip = document.getElementById('board-tooltip');
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
        // Hide tooltip when closing notebook
        if (boardTooltip) boardTooltip.classList.remove('visible');
        // Stop board animation loop
        if (boardAnimFrame) {
            cancelAnimationFrame(boardAnimFrame);
            boardAnimFrame = null;
        }
    }

    function switchTab(tabName) {
        currentTab = tabName;
        document.querySelectorAll('.nb-tab').forEach(t => t.classList.remove('active'));
        document.querySelector(`.nb-tab[data-tab="${tabName}"]`).classList.add('active');
        document.querySelectorAll('.nb-page').forEach(p => p.classList.remove('active'));
        document.getElementById(`nb-${tabName}`).classList.add('active');
        // Hide tooltip when switching tabs
        if (boardTooltip) boardTooltip.classList.remove('visible');
        // Stop animation if leaving board tab
        if (tabName !== 'board' && boardAnimFrame) {
            cancelAnimationFrame(boardAnimFrame);
            boardAnimFrame = null;
        }
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
            documents: '\u{1F4C4} Documents',
            physical: '\u{1F50D} Physical Evidence',
            records: '\u{1F4CB} Records',
            structural: '\u{1F3D7}\u{FE0F} Structural',
            supernatural: '\u{2728} Supernatural',
            key: '\u{1F511} Keys & Codes',
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
            html += `<div style="margin-top:8px;font-size:11px;color:#4488cc">\u{1F4CD} Currently: ${currentLocName}</div>`;

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

    // ══════════════════════════════════════════════════
    //  EVIDENCE BOARD — Interactive Canvas
    // ══════════════════════════════════════════════════

    /** Convert screen (mouse) coords to board (world) coords */
    function screenToBoard(sx, sy) {
        const rect = boardCanvas.getBoundingClientRect();
        const scaleX = boardCanvas.width / rect.width;
        const scaleY = boardCanvas.height / rect.height;
        const cx = (sx - rect.left) * scaleX;
        const cy = (sy - rect.top) * scaleY;
        return {
            x: (cx - boardPan.x) / boardZoom,
            y: (cy - boardPan.y) / boardZoom,
        };
    }

    /** Find which clue card (if any) is under board coords bx, by */
    function hitTestCard(bx, by) {
        const clues = Engine.state.notebook.clues;
        // Iterate in reverse so top-drawn cards are hit first
        for (let i = clues.length - 1; i >= 0; i--) {
            const clue = clues[i];
            const pos = boardPositions[clue.id];
            if (!pos) continue;
            if (bx >= pos.x && bx <= pos.x + CARD_W &&
                by >= pos.y && by <= pos.y + CARD_H) {
                return clue;
            }
        }
        return null;
    }

    /** Attach mouse/wheel listeners to board canvas (once) */
    function attachBoardListeners() {
        if (boardListenersAttached) return;
        boardListenersAttached = true;

        // ── Mouse Down ──
        boardCanvas.addEventListener('mousedown', (e) => {
            if (currentTab !== 'board') return;
            const bp = screenToBoard(e.clientX, e.clientY);

            if (e.button === 0) {
                // Left click: drag card or start panning if no card
                const card = hitTestCard(bp.x, bp.y);
                if (card) {
                    boardDragging = true;
                    boardDragNode = card.id;
                    boardDragStart = { x: e.clientX, y: e.clientY };
                    boardDragCardStart = { x: boardPositions[card.id].x, y: boardPositions[card.id].y };
                    boardCanvas.classList.add('dragging');
                }
            }

            if (e.button === 1 || e.button === 2) {
                // Middle or right click: pan
                boardPanning = true;
                boardPanStart = { x: e.clientX, y: e.clientY };
                boardPanOffset = { x: boardPan.x, y: boardPan.y };
                boardCanvas.classList.add('dragging');
                e.preventDefault();
            }
        });

        // ── Mouse Move ──
        boardCanvas.addEventListener('mousemove', (e) => {
            if (currentTab !== 'board') return;

            if (boardDragging && boardDragNode) {
                // Drag card
                const dx = (e.clientX - boardDragStart.x) / boardZoom;
                const dy = (e.clientY - boardDragStart.y) / boardZoom;
                // Account for CSS vs canvas pixel ratio
                const rect = boardCanvas.getBoundingClientRect();
                const scaleX = boardCanvas.width / rect.width;
                const scaleY = boardCanvas.height / rect.height;
                boardPositions[boardDragNode].x = boardDragCardStart.x + dx * scaleX;
                boardPositions[boardDragNode].y = boardDragCardStart.y + dy * scaleY;
                return; // redraw happens in animation loop
            }

            if (boardPanning) {
                const dx = e.clientX - boardPanStart.x;
                const dy = e.clientY - boardPanStart.y;
                const rect = boardCanvas.getBoundingClientRect();
                boardPan.x = boardPanOffset.x + dx * (boardCanvas.width / rect.width);
                boardPan.y = boardPanOffset.y + dy * (boardCanvas.height / rect.height);
                return;
            }

            // Hover detection
            const bp = screenToBoard(e.clientX, e.clientY);
            const card = hitTestCard(bp.x, bp.y);
            boardHoverCard = card ? card.id : null;

            // Tooltip
            if (card && boardTooltip) {
                const locName = GameData.locations[card.location]?.name || card.location || 'Unknown';
                const catName = card.category ? card.category.charAt(0).toUpperCase() + card.category.slice(1) : '';
                boardTooltip.innerHTML = `
                    <div class="tooltip-name">${card.name}</div>
                    <div class="tooltip-category">${catName}</div>
                    <div class="tooltip-desc">${card.description || ''}</div>
                    <div class="tooltip-meta">Found: ${locName} — Loop ${(card.loop || 0) + 1}</div>
                `;
                // Position tooltip near cursor, clamped to viewport
                let tx = e.clientX + 16;
                let ty = e.clientY - 10;
                const tw = 280;
                const th = boardTooltip.offsetHeight || 120;
                if (tx + tw > window.innerWidth) tx = e.clientX - tw - 10;
                if (ty + th > window.innerHeight) ty = window.innerHeight - th - 10;
                if (ty < 10) ty = 10;
                boardTooltip.style.left = tx + 'px';
                boardTooltip.style.top = ty + 'px';
                boardTooltip.classList.add('visible');
            } else if (boardTooltip) {
                boardTooltip.classList.remove('visible');
            }
        });

        // ── Mouse Up ──
        boardCanvas.addEventListener('mouseup', (e) => {
            boardDragging = false;
            boardDragNode = null;
            boardPanning = false;
            boardCanvas.classList.remove('dragging');
        });

        // Mouse leaves canvas
        boardCanvas.addEventListener('mouseleave', () => {
            boardDragging = false;
            boardDragNode = null;
            boardPanning = false;
            boardHoverCard = null;
            boardCanvas.classList.remove('dragging');
            if (boardTooltip) boardTooltip.classList.remove('visible');
        });

        // ── Mouse Wheel (Zoom) ──
        boardCanvas.addEventListener('wheel', (e) => {
            if (currentTab !== 'board') return;
            e.preventDefault();

            const rect = boardCanvas.getBoundingClientRect();
            const scaleX = boardCanvas.width / rect.width;
            const scaleY = boardCanvas.height / rect.height;
            // Cursor position in canvas pixel space
            const cx = (e.clientX - rect.left) * scaleX;
            const cy = (e.clientY - rect.top) * scaleY;

            const oldZoom = boardZoom;
            const zoomDelta = e.deltaY < 0 ? 1.1 : 0.9;
            boardZoom = Math.max(0.5, Math.min(2.0, boardZoom * zoomDelta));

            // Adjust pan so zoom centers on cursor
            boardPan.x = cx - (cx - boardPan.x) * (boardZoom / oldZoom);
            boardPan.y = cy - (cy - boardPan.y) * (boardZoom / oldZoom);
        }, { passive: false });

        // Prevent context menu on right-click (we use it for panning)
        boardCanvas.addEventListener('contextmenu', (e) => {
            if (currentTab === 'board') e.preventDefault();
        });
    }

    /** Draw a rounded rectangle path */
    function roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.arcTo(x + w, y, x + w, y + r, r);
        ctx.lineTo(x + w, y + h - r);
        ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
        ctx.lineTo(x + r, y + h);
        ctx.arcTo(x, y + h, x, y + h - r, r);
        ctx.lineTo(x, y + r);
        ctx.arcTo(x, y, x + r, y, r);
        ctx.closePath();
    }

    /** Draw a sagging string connection between two points */
    function drawStringConnection(ctx, x1, y1, x2, y2, time, highlight) {
        const segments = 24;
        const dx = x2 - x1;
        const dy = y2 - y1;
        const dist = Math.sqrt(dx * dx + dy * dy);
        // Sag increases with distance
        const sag = Math.min(dist * 0.15, 40);

        ctx.beginPath();
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            // Linear interpolation
            let px = x1 + dx * t;
            let py = y1 + dy * t;
            // Parabolic sag (peaks at t=0.5)
            const sagAmount = sag * 4 * t * (1 - t);
            py += sagAmount;
            // Small wave animation
            const wave = Math.sin(t * Math.PI * 4 + time * 2) * 1.5;
            py += wave;

            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }

        if (highlight) {
            // Bright pulsing crimson
            const pulse = 0.6 + 0.4 * Math.sin(time * 4);
            ctx.strokeStyle = `rgba(255, 60, 60, ${pulse})`;
            ctx.lineWidth = 2.5;
            // Glow effect
            ctx.shadowColor = '#ff4444';
            ctx.shadowBlur = 8;
        } else {
            ctx.strokeStyle = 'rgba(160, 40, 40, 0.5)';
            ctx.lineWidth = 1.2;
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
        }

        ctx.setLineDash([5, 3]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
    }

    /** Draw a pin with wobble animation */
    function drawPin(ctx, x, y, time, wobble) {
        ctx.save();
        if (wobble) {
            const angle = Math.sin(time * 3 + x * 0.1) * 0.08;
            ctx.translate(x, y);
            ctx.rotate(angle);
            ctx.translate(-x, -y);
        }

        // Pin shaft
        ctx.strokeStyle = '#888';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x, y + PIN_RADIUS);
        ctx.lineTo(x, y + PIN_RADIUS + 6);
        ctx.stroke();

        // Pin head (gradient)
        const grad = ctx.createRadialGradient(x - 1, y - 1, 0, x, y, PIN_RADIUS);
        grad.addColorStop(0, '#ff5555');
        grad.addColorStop(0.7, '#cc3333');
        grad.addColorStop(1, '#881111');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, PIN_RADIUS, 0, Math.PI * 2);
        ctx.fill();

        // Pin highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.arc(x - 1.5, y - 1.5, 1.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    /** Main board render (called every frame when board is visible) */
    function drawBoard(timestamp) {
        if (!boardCanvas || !boardCtx) return;
        if (currentTab !== 'board') return;

        boardAnimTime = timestamp / 1000;

        const ctx = boardCtx;
        const w = boardCanvas.width;
        const h = boardCanvas.height;

        const clues = Engine.state.notebook.clues;
        const connections = Engine.state.evidenceConnections || [];

        // Clear
        ctx.fillStyle = '#1a1510';
        ctx.fillRect(0, 0, w, h);

        if (clues.length === 0) {
            ctx.fillStyle = '#6a6a80';
            ctx.font = '14px Courier New';
            ctx.textAlign = 'center';
            ctx.fillText('No evidence to display.', w / 2, h / 2);
            ctx.textAlign = 'start';
            boardAnimFrame = requestAnimationFrame(drawBoard);
            return;
        }

        // Ensure positions exist
        initBoardPositions(clues);

        // Cork board texture (static, drawn once via seeded random)
        drawCorkTexture(ctx, w, h);

        // Apply zoom and pan transform
        ctx.save();
        ctx.translate(boardPan.x, boardPan.y);
        ctx.scale(boardZoom, boardZoom);

        // Determine connected clue IDs for hover highlighting
        const connectedToHover = new Set();
        if (boardHoverCard) {
            connections.forEach(conn => {
                if (conn.from === boardHoverCard || conn.to === boardHoverCard) {
                    connectedToHover.add(conn.from);
                    connectedToHover.add(conn.to);
                }
            });
        }

        // ── Draw connections (strings) ──
        connections.forEach(conn => {
            const from = boardPositions[conn.from];
            const to = boardPositions[conn.to];
            if (!from || !to) return;

            const fromCX = from.x + CARD_W / 2;
            const fromCY = from.y + CARD_H / 2;
            const toCX = to.x + CARD_W / 2;
            const toCY = to.y + CARD_H / 2;

            const isHighlighted = boardHoverCard &&
                (conn.from === boardHoverCard || conn.to === boardHoverCard);

            drawStringConnection(ctx, fromCX, fromCY, toCX, toCY, boardAnimTime, isHighlighted);

            // Label on connection
            const mx = (fromCX + toCX) / 2;
            const my = (fromCY + toCY) / 2 + 10; // slight offset for sag
            const labelW = Math.min(ctx.measureText(conn.label || '').width + 16, 120);
            ctx.fillStyle = isHighlighted ? 'rgba(40, 10, 10, 0.9)' : 'rgba(13, 13, 26, 0.8)';
            roundRect(ctx, mx - labelW / 2, my - 8, labelW, 16, 3);
            ctx.fill();
            ctx.fillStyle = isHighlighted ? '#ff5555' : '#aa3333';
            ctx.font = '9px Courier New';
            ctx.textAlign = 'center';
            ctx.fillText(conn.label || '', mx, my + 3);
            ctx.textAlign = 'start';
        });

        // ── Draw evidence cards ──
        clues.forEach(clue => {
            const pos = boardPositions[clue.id];
            if (!pos) return;

            const isHovered = boardHoverCard === clue.id;
            const isDragged = boardDragNode === clue.id;
            const isConnected = connectedToHover.has(clue.id);
            const isDimmed = boardHoverCard && !isHovered && !isConnected;

            ctx.save();
            if (isDimmed) ctx.globalAlpha = 0.35;

            // Card shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
            roundRect(ctx, pos.x + 3, pos.y + 3, CARD_W, CARD_H, CARD_RADIUS);
            ctx.fill();

            // Card body
            const cardColor = isDragged ? 'rgba(36, 36, 60, 0.95)' :
                              isHovered ? 'rgba(32, 32, 56, 0.95)' :
                              'rgba(26, 26, 46, 0.92)';
            roundRect(ctx, pos.x, pos.y, CARD_W, CARD_H, CARD_RADIUS);
            ctx.fillStyle = cardColor;
            ctx.fill();

            // Highlight border when hovered or dragged
            if (isHovered || isDragged) {
                ctx.strokeStyle = isHovered ? '#d4a020' : '#f0c840';
                ctx.lineWidth = 2;
                ctx.shadowColor = '#d4a020';
                ctx.shadowBlur = 10;
                roundRect(ctx, pos.x, pos.y, CARD_W, CARD_H, CARD_RADIUS);
                ctx.stroke();
                ctx.shadowColor = 'transparent';
                ctx.shadowBlur = 0;
            } else {
                ctx.strokeStyle = 'rgba(80, 80, 120, 0.3)';
                ctx.lineWidth = 1;
                roundRect(ctx, pos.x, pos.y, CARD_W, CARD_H, CARD_RADIUS);
                ctx.stroke();
            }

            // Category accent bar (left side, inside rounded rect)
            const accentColor = catColors[clue.category] || '#d4a020';
            ctx.fillStyle = accentColor;
            ctx.beginPath();
            ctx.moveTo(pos.x, pos.y + CARD_RADIUS);
            ctx.arcTo(pos.x, pos.y, pos.x + CARD_RADIUS, pos.y, CARD_RADIUS);
            ctx.lineTo(pos.x + 4, pos.y);
            ctx.lineTo(pos.x + 4, pos.y + CARD_H);
            ctx.lineTo(pos.x + CARD_RADIUS, pos.y + CARD_H);
            ctx.arcTo(pos.x, pos.y + CARD_H, pos.x, pos.y + CARD_H - CARD_RADIUS, CARD_RADIUS);
            ctx.closePath();
            ctx.fill();

            // Category icon
            const icon = categoryIcons[clue.category] || '\u{1F50D}';
            ctx.font = '14px serif';
            ctx.textAlign = 'left';
            ctx.fillText(icon, pos.x + 10, pos.y + 18);

            // Card text — name
            ctx.fillStyle = isHovered ? '#e8e8f0' : '#c8c8d4';
            ctx.font = 'bold 10px Courier New';
            ctx.textAlign = 'left';
            const maxNameW = CARD_W - 40;
            let name = clue.name;
            while (ctx.measureText(name).width > maxNameW && name.length > 3) {
                name = name.substring(0, name.length - 1);
            }
            if (name !== clue.name) name += '...';
            ctx.fillText(name, pos.x + 28, pos.y + 18);

            // Card text — location
            ctx.fillStyle = '#6a6a80';
            ctx.font = '8px Courier New';
            const locName = GameData.locations[clue.location]?.name || '';
            ctx.fillText(locName, pos.x + 28, pos.y + 32);

            // Loop badge
            ctx.fillStyle = 'rgba(68, 136, 204, 0.3)';
            const badgeText = 'L' + ((clue.loop || 0) + 1);
            const badgeW = ctx.measureText(badgeText).width + 8;
            roundRect(ctx, pos.x + CARD_W - badgeW - 6, pos.y + CARD_H - 16, badgeW, 12, 3);
            ctx.fill();
            ctx.fillStyle = '#4488cc';
            ctx.font = '8px Courier New';
            ctx.fillText(badgeText, pos.x + CARD_W - badgeW - 2, pos.y + CARD_H - 7);

            ctx.restore();

            // Pin (drawn outside card, on top, with wobble)
            drawPin(ctx, pos.x + CARD_W / 2, pos.y - 4, boardAnimTime, true);
        });

        ctx.restore(); // pop zoom/pan transform

        // Draw zoom indicator
        ctx.fillStyle = 'rgba(106, 106, 128, 0.6)';
        ctx.font = '10px Courier New';
        ctx.textAlign = 'right';
        ctx.fillText(`${Math.round(boardZoom * 100)}%`, w - 12, h - 10);
        ctx.textAlign = 'start';

        // Continue animation loop
        boardAnimFrame = requestAnimationFrame(drawBoard);
    }

    /** Seeded cork board texture — deterministic dots to avoid flicker */
    let corkTextureCache = null;
    let corkTextureDims = { w: 0, h: 0 };

    function drawCorkTexture(ctx, w, h) {
        // Regenerate if canvas resized
        if (corkTextureCache && corkTextureDims.w === w && corkTextureDims.h === h) {
            ctx.drawImage(corkTextureCache, 0, 0);
            return;
        }

        // Create offscreen canvas for cork texture
        const offscreen = document.createElement('canvas');
        offscreen.width = w;
        offscreen.height = h;
        const octx = offscreen.getContext('2d');

        // Base
        octx.fillStyle = '#1a1510';
        octx.fillRect(0, 0, w, h);

        // Subtle grain dots
        const seed = 12345;
        let rng = seed;
        function pseudoRandom() {
            rng = (rng * 16807 + 0) % 2147483647;
            return rng / 2147483647;
        }

        for (let i = 0; i < 200; i++) {
            const alpha = 0.05 + pseudoRandom() * 0.08;
            octx.fillStyle = `rgba(50, 35, 25, ${alpha})`;
            octx.fillRect(pseudoRandom() * w, pseudoRandom() * h, 1 + pseudoRandom() * 2, 1 + pseudoRandom() * 2);
        }

        // Faint grid lines (like cork board)
        octx.strokeStyle = 'rgba(60, 45, 30, 0.06)';
        octx.lineWidth = 0.5;
        for (let x = 0; x < w; x += 40) {
            octx.beginPath();
            octx.moveTo(x, 0);
            octx.lineTo(x, h);
            octx.stroke();
        }
        for (let y = 0; y < h; y += 40) {
            octx.beginPath();
            octx.moveTo(0, y);
            octx.lineTo(w, y);
            octx.stroke();
        }

        corkTextureCache = offscreen;
        corkTextureDims = { w, h };
        ctx.drawImage(offscreen, 0, 0);
    }

    /** Initialize board — setup canvas, attach listeners, start animation */
    function renderBoard() {
        if (!boardCanvas) return;

        const parent = boardCanvas.parentElement;
        boardCanvas.width = parent.clientWidth;
        boardCanvas.height = parent.clientHeight;
        boardCtx = boardCanvas.getContext('2d');

        // Invalidate cork texture cache on resize
        corkTextureCache = null;

        const clues = Engine.state.notebook.clues;

        if (clues.length === 0) {
            boardCtx.fillStyle = '#1a1510';
            boardCtx.fillRect(0, 0, boardCanvas.width, boardCanvas.height);
            boardCtx.fillStyle = '#6a6a80';
            boardCtx.font = '14px Courier New';
            boardCtx.textAlign = 'center';
            boardCtx.fillText('No evidence to display.', boardCanvas.width / 2, boardCanvas.height / 2);
            boardCtx.textAlign = 'start';
        }

        // Auto-layout positions for new clues
        initBoardPositions(clues);

        // Attach interactive listeners (only once)
        attachBoardListeners();

        // Add controls hint if not present
        if (!parent.querySelector('.board-controls-hint')) {
            const hint = document.createElement('div');
            hint.className = 'board-controls-hint';
            hint.textContent = 'Drag cards \u2022 Scroll to zoom \u2022 Right-drag to pan';
            parent.appendChild(hint);
        }

        // Start animation loop
        if (boardAnimFrame) cancelAnimationFrame(boardAnimFrame);
        boardAnimFrame = requestAnimationFrame(drawBoard);
    }

    function initBoardPositions(clues) {
        const w = boardCanvas.width;
        const h = boardCanvas.height;
        const padding = 30;
        const cols = Math.ceil(Math.sqrt(clues.length));
        const cellW = (w - padding * 2) / Math.max(cols, 1);
        const cellH = CARD_H + 30;

        // Use a seeded pseudo-random for consistent jitter
        let rng = 42;
        function pseudoRandom() {
            rng = (rng * 16807 + 0) % 2147483647;
            return rng / 2147483647;
        }

        clues.forEach((clue, i) => {
            if (!boardPositions[clue.id]) {
                const col = i % cols;
                const row = Math.floor(i / cols);
                boardPositions[clue.id] = {
                    x: padding + col * cellW + (pseudoRandom() * 20 - 10),
                    y: padding + row * cellH + (pseudoRandom() * 10 - 5) + 10, // +10 for pin clearance
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
            \u{1F4A1} ${hint}
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
