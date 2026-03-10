/* ═══════════════════════════════════════════════════════
   HOTSPOTS — Canvas click/hover hit-testing, tooltips,
   evidence shimmer, cursor management, touch support
   ═══════════════════════════════════════════════════════ */

const Hotspots = (() => {
    let currentHotspots = [];
    let hoveredHotspot = null;
    let tooltipAlpha = 0;
    let canvasEl = null;
    let enabled = true;

    function init(canvas) {
        canvasEl = canvas;
        canvas.addEventListener('mousemove', onMouseMove);
        canvas.addEventListener('click', onClick);
        canvas.addEventListener('mouseup', onMouseUp);
        canvas.addEventListener('mouseleave', onMouseLeave);
        canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    }

    function onMouseUp(e) {
        if (MiniGames.isActive()) {
            const { x, y } = canvasCoords(e);
            MiniGames.handleMouseUp(x, y);
        }
    }

    function setRoomHotspots(hotspots) {
        currentHotspots = hotspots || [];
        hoveredHotspot = null;
        tooltipAlpha = 0;
    }

    function addDynamicHotspots(hotspots) {
        currentHotspots.push(...hotspots);
    }

    function removeDynamicHotspots(type) {
        currentHotspots = currentHotspots.filter(h => h.type !== type);
    }

    function setEnabled(val) { enabled = val; }

    // ── Coordinate Helpers ──
    function canvasCoords(e) {
        const rect = canvasEl.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left) * (canvasEl.width / rect.width),
            y: (e.clientY - rect.top) * (canvasEl.height / rect.height),
        };
    }

    function normalize(px, py, w, h) {
        return { x: px / w, y: py / h };
    }

    // ── Hit Testing ──
    function hitTest(mx, my) {
        const w = canvasEl.width, h = canvasEl.height;
        const n = normalize(mx, my, w, h);

        for (let i = currentHotspots.length - 1; i >= 0; i--) {
            const hs = currentHotspots[i];
            if (hs.rect) {
                const r = hs.rect;
                if (n.x >= r.x && n.x <= r.x + r.w && n.y >= r.y && n.y <= r.y + r.h) return hs;
            } else if (hs.polygon) {
                if (pointInPolygon(n.x, n.y, hs.polygon)) return hs;
            }
        }
        return null;
    }

    function pointInPolygon(x, y, poly) {
        let inside = false;
        for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
            const xi = poly[i][0], yi = poly[i][1];
            const xj = poly[j][0], yj = poly[j][1];
            if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) {
                inside = !inside;
            }
        }
        return inside;
    }

    // ── Event Handlers ──
    function onMouseMove(e) {
        if (!enabled) return;
        const { x, y } = canvasCoords(e);
        // Route to minigames first
        if (MiniGames.isActive()) {
            MiniGames.handleMouseMove(x, y);
            return;
        }
        const hit = hitTest(x, y);

        if (hit !== hoveredHotspot) {
            hoveredHotspot = hit;
            tooltipAlpha = 0;
        }
        canvasEl.style.cursor = hit ? 'pointer' : 'default';
    }

    function onClick(e) {
        if (!enabled) return;
        const { x, y } = canvasCoords(e);
        // Route to minigames first
        if (MiniGames.isActive()) {
            MiniGames.handleMouseDown(x, y);
            return;
        }
        const hit = hitTest(x, y);
        if (hit && hit.action) {
            Audio.playSound('click');
            hit.action();
        }
    }

    function onMouseLeave() {
        hoveredHotspot = null;
        tooltipAlpha = 0;
        if (canvasEl) canvasEl.style.cursor = 'default';
    }

    function onTouchStart(e) {
        if (!enabled) return;
        e.preventDefault();
        const touch = e.touches[0];
        const rect = canvasEl.getBoundingClientRect();
        const x = (touch.clientX - rect.left) * (canvasEl.width / rect.width);
        const y = (touch.clientY - rect.top) * (canvasEl.height / rect.height);
        const hit = hitTest(x, y);
        if (hit && hit.action) {
            Audio.playSound('click');
            hit.action();
        }
    }

    // ── Render ──
    function render(ctx, w, h, time) {
        if (!enabled) return;

        // Evidence shimmer on undiscovered evidence
        currentHotspots.forEach(hs => {
            if (hs.hasEvidence && !Engine.state.discoveredEvidence.has(hs.evidenceId)) {
                drawShimmer(ctx, hs, w, h, time, 'rgba(204, 51, 51,');
            }
        });

        // Hover highlight
        if (hoveredHotspot) {
            drawHighlight(ctx, hoveredHotspot, w, h, time);
            tooltipAlpha = Math.min(1, tooltipAlpha + 0.1);
            drawTooltip(ctx, hoveredHotspot, w, h);
        }
    }

    function drawShimmer(ctx, hs, w, h, time, colorBase) {
        const shimmer = 0.08 + Math.sin(time * 3) * 0.06;
        ctx.save();
        if (hs.rect) {
            const r = hs.rect;
            ctx.fillStyle = colorBase + shimmer + ')';
            ctx.fillRect(r.x * w, r.y * h, r.w * w, r.h * h);
            // Pulsing border
            ctx.strokeStyle = colorBase + (shimmer + 0.15) + ')';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(r.x * w, r.y * h, r.w * w, r.h * h);
        } else if (hs.polygon) {
            ctx.beginPath();
            hs.polygon.forEach((p, i) => {
                if (i === 0) ctx.moveTo(p[0] * w, p[1] * h);
                else ctx.lineTo(p[0] * w, p[1] * h);
            });
            ctx.closePath();
            ctx.fillStyle = colorBase + shimmer + ')';
            ctx.fill();
            ctx.strokeStyle = colorBase + (shimmer + 0.15) + ')';
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }
        ctx.restore();
    }

    function drawHighlight(ctx, hs, w, h, time) {
        const pulse = 0.25 + Math.sin(time * 4) * 0.1;
        let color;
        switch (hs.type) {
            case 'exit': color = [68, 136, 204]; break;
            case 'npc':  color = [212, 160, 32]; break;
            default:     color = [200, 200, 212]; break;
        }
        const rgba = `rgba(${color[0]},${color[1]},${color[2]},`;

        ctx.save();
        ctx.strokeStyle = rgba + (pulse + 0.2) + ')';
        ctx.lineWidth = 2;
        ctx.fillStyle = rgba + (pulse * 0.3) + ')';

        if (hs.rect) {
            const r = hs.rect;
            ctx.fillRect(r.x * w, r.y * h, r.w * w, r.h * h);
            ctx.strokeRect(r.x * w, r.y * h, r.w * w, r.h * h);
        } else if (hs.polygon) {
            ctx.beginPath();
            hs.polygon.forEach((p, i) => {
                if (i === 0) ctx.moveTo(p[0] * w, p[1] * h);
                else ctx.lineTo(p[0] * w, p[1] * h);
            });
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }
        ctx.restore();
    }

    function drawTooltip(ctx, hs, w, h) {
        if (!hs.label) return;

        ctx.save();
        ctx.globalAlpha = tooltipAlpha;

        // Calculate center of hotspot
        let cx, cy;
        if (hs.rect) {
            cx = (hs.rect.x + hs.rect.w / 2) * w;
            cy = hs.rect.y * h;
        } else if (hs.polygon) {
            cx = hs.polygon.reduce((s, p) => s + p[0], 0) / hs.polygon.length * w;
            cy = Math.min(...hs.polygon.map(p => p[1])) * h;
        }

        const text = hs.label;
        ctx.font = '13px "Courier New", monospace';
        const metrics = ctx.measureText(text);
        const pad = 12;
        const tw = metrics.width + pad * 2;
        const th = 26;
        const tx = Math.max(4, Math.min(w - tw - 4, cx - tw / 2));
        const ty = Math.max(4, cy - th - 10);

        // Background
        ctx.fillStyle = 'rgba(13, 13, 26, 0.93)';
        ctx.fillRect(tx, ty, tw, th);

        // Accent border
        let borderColor;
        switch (hs.type) {
            case 'exit': borderColor = '#4488cc'; break;
            case 'npc':  borderColor = '#d4a020'; break;
            default:     borderColor = '#6a6a80';
        }
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 1;
        ctx.strokeRect(tx, ty, tw, th);
        ctx.fillStyle = borderColor;
        ctx.fillRect(tx, ty, tw, 2);

        // Text
        ctx.fillStyle = '#e8e8f0';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, tx + tw / 2, ty + th / 2 + 1);
        ctx.textAlign = 'start';
        ctx.textBaseline = 'alphabetic';

        ctx.restore();
    }

    function getHotspots() { return currentHotspots; }

    return {
        init, setRoomHotspots, addDynamicHotspots, removeDynamicHotspots,
        setEnabled, render, getHotspots,
    };
})();
