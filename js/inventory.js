/* ═══════════════════════════════════════════════════════
   INVENTORY — Collectible items, combinations,
   item-on-object/NPC interactions
   ═══════════════════════════════════════════════════════ */

const Inventory = (() => {
    // ── Item Definitions ──
    const ITEMS = {
        magnifying_glass: {
            name: 'Magnifying Glass',
            icon: '🔍',
            description: 'A detective\'s essential tool. Reveals hidden details when used on objects.',
            location: 'your_room',
            object: 'nightstand',
            persistent: true,  // survives loops
        },
        skeleton_key: {
            name: 'Skeleton Key',
            icon: '🗝️',
            description: 'An old master key found in the butler\'s pantry. Opens most locks in the manor.',
            location: 'kitchen',
            requiresLoop: 2,
            persistent: false,
        },
        brandy_sample: {
            name: 'Brandy Sample',
            icon: '🥃',
            description: 'A sample of the drugged brandy from the library. Could be analyzed.',
            location: 'library',
            requiresEvidence: 'brandy_glass',
            persistent: false,
        },
        pressed_flower: {
            name: 'Pressed Wolfsbane',
            icon: '🌸',
            description: 'A pressed wolfsbane flower. Matches the poison used on Lord Ashworth.',
            location: 'garden',
            requiresEvidence: 'wolfsbane_garden',
            persistent: false,
        },
        pocket_watch: {
            name: 'Ashworth\'s Pocket Watch',
            icon: '⌚',
            description: 'Lord Ashworth\'s gold pocket watch. Stopped at 11:10 PM.',
            requiresLoop: 3,
            location: 'library',
            persistent: false,
        },
        cipher_key: {
            name: 'Cipher Key',
            icon: '📜',
            description: 'A cipher key found behind a painting. Decodes the burned letter fragments.',
            location: 'study',
            requiresLoop: 2,
            persistent: false,
        },
        medical_report: {
            name: 'Medical Report',
            icon: '📋',
            description: 'Dr. Cross\'s private medical notes on Lord Ashworth\'s condition.',
            requiresNPC: 'dr_cross',
            requiresFact: 'ashworth_poisoned',
            persistent: false,
        },
        torn_fabric: {
            name: 'Torn Fabric',
            icon: '🧵',
            description: 'A scrap of expensive fabric caught on the secret passage entrance.',
            location: 'wine_cellar',
            requiresEvidence: 'secret_passage',
            persistent: false,
        },
    };

    // ── Combination Recipes ──
    const COMBINATIONS = [
        {
            items: ['brandy_sample', 'pressed_flower'],
            result: 'poison_match',
            message: 'The wolfsbane matches the residue in the brandy! This proves the murder method.',
            unlocksFact: 'poison_method_confirmed',
        },
        {
            items: ['cipher_key', 'torn_fabric'],
            result: 'decoded_message',
            message: 'Using the cipher, you decode markings on the fabric: "R.D." — Rex Dalton!',
            unlocksFact: 'rex_fabric_identified',
        },
        {
            items: ['pocket_watch', 'medical_report'],
            result: 'timeline_proof',
            message: 'The watch stopped at 11:10 and the report shows increasing aconitine levels. The timeline is clear.',
            unlocksFact: 'murder_timeline_confirmed',
        },
    ];

    // ── State ──
    let items = new Set();       // currently held item IDs
    let usedCombinations = new Set();
    let selectedItem = null;     // currently selected for use
    let showingInventory = false;
    let tooltipItem = null;
    let tooltipTimer = 0;

    function init() {}

    function reset() {
        // Keep persistent items across loops
        const persistent = [...items].filter(id => ITEMS[id] && ITEMS[id].persistent);
        items = new Set(persistent);
        usedCombinations = new Set();
        selectedItem = null;
    }

    // ── Pickup ──
    function pickupItem(itemId) {
        if (items.has(itemId)) return false;
        const item = ITEMS[itemId];
        if (!item) return false;

        items.add(itemId);
        Engine.notify(`Picked up: ${item.icon} ${item.name}`);
        Audio.playSound('evidence');

        // Add to timeline
        Engine.state.notebook.timeline.push({
            time: Engine.state.time,
            event: `Found item: ${item.name}`,
            location: Engine.state.currentLocation,
            loop: Engine.state.loop,
        });

        return true;
    }

    // ── Check availability ──
    function checkForItems(locationId) {
        const available = [];
        for (const [id, item] of Object.entries(ITEMS)) {
            if (items.has(id)) continue;
            if (item.location !== locationId) continue;
            if (item.requiresLoop && Engine.state.loop < item.requiresLoop) continue;
            if (item.requiresEvidence && !Engine.state.discoveredEvidence.has(item.requiresEvidence)) continue;
            if (item.requiresFact && !Engine.state.knownFacts.has(item.requiresFact)) continue;
            available.push(id);
        }
        return available;
    }

    // ── Use item on object/NPC ──
    function useItemOn(targetType, targetId) {
        if (!selectedItem) return false;
        const item = ITEMS[selectedItem];
        if (!item) return false;

        // Magnifying glass special: reveals hidden text
        if (selectedItem === 'magnifying_glass') {
            if (targetType === 'object') {
                Engine.notify('You examine it closely with your magnifying glass...');
                // Could reveal hidden details in specific objects
                if (targetId === 'burned_letter' && Engine.state.discoveredEvidence.has('burned_letter')) {
                    Engine.addFact('burned_letter_decoded');
                    Engine.notify('Under magnification, you can read fragments: "...arrangement with R.D. ... the passage..."');
                }
                if (targetId === 'brandy_glass' && Engine.state.discoveredEvidence.has('brandy_glass')) {
                    Engine.addFact('brandy_residue_analyzed');
                    Engine.notify('Crystalline residue visible — definitely drugged, not just brandy.');
                }
            }
            selectedItem = null;
            return true;
        }

        selectedItem = null;
        return false;
    }

    // ── Combine ──
    function tryCombine(item1, item2) {
        for (const combo of COMBINATIONS) {
            const comboKey = combo.items.sort().join('+');
            if (usedCombinations.has(comboKey)) continue;

            if ((combo.items.includes(item1) && combo.items.includes(item2)) ||
                (combo.items.includes(item2) && combo.items.includes(item1))) {
                usedCombinations.add(comboKey);
                Engine.notify(combo.message);
                if (combo.unlocksFact) {
                    Engine.addFact(combo.unlocksFact);
                }
                Audio.playSound('evidence');
                return combo.result;
            }
        }
        Engine.notify('Those items can\'t be combined.');
        return null;
    }

    // ── Rendering ──
    function renderInventoryBar(ctx, w, h) {
        const itemList = [...items];
        if (itemList.length === 0) return;

        const barH = 50;
        const barY = h - barH - 5;
        const itemSize = 36;
        const padding = 8;
        const totalW = itemList.length * (itemSize + padding) + padding;
        const barX = (w - totalW) / 2;

        // Bar background
        ctx.fillStyle = 'rgba(7, 7, 15, 0.8)';
        ctx.fillRect(barX, barY, totalW, barH);
        ctx.strokeStyle = 'rgba(212, 160, 32, 0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, totalW, barH);

        // Items
        ctx.font = `${itemSize * 0.7}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        itemList.forEach((id, i) => {
            const item = ITEMS[id];
            if (!item) return;
            const ix = barX + padding + i * (itemSize + padding) + itemSize / 2;
            const iy = barY + barH / 2;

            // Selection highlight
            if (selectedItem === id) {
                ctx.fillStyle = 'rgba(212, 160, 32, 0.3)';
                ctx.fillRect(ix - itemSize / 2, barY + 3, itemSize, barH - 6);
                ctx.strokeStyle = '#d4a020';
                ctx.lineWidth = 2;
                ctx.strokeRect(ix - itemSize / 2, barY + 3, itemSize, barH - 6);
            }

            // Item icon
            ctx.fillStyle = '#fff';
            ctx.fillText(item.icon, ix, iy);
        });

        // Tooltip
        if (tooltipItem && ITEMS[tooltipItem]) {
            const item = ITEMS[tooltipItem];
            ctx.font = '11px monospace';
            ctx.fillStyle = 'rgba(7, 7, 15, 0.9)';
            const textW = ctx.measureText(item.name).width + 16;
            ctx.fillRect(w / 2 - textW / 2, barY - 25, textW, 20);
            ctx.fillStyle = '#d4a020';
            ctx.textAlign = 'center';
            ctx.fillText(item.name, w / 2, barY - 13);
        }
    }

    // ── Inventory panel (full screen) ──
    function renderInventoryPanel(ctx, w, h) {
        if (!showingInventory) return;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(0, 0, w, h);

        const panelW = Math.min(500, w * 0.6);
        const panelH = Math.min(400, h * 0.7);
        const px = (w - panelW) / 2;
        const py = (h - panelH) / 2;

        ctx.fillStyle = '#0d0d1a';
        ctx.fillRect(px, py, panelW, panelH);
        ctx.strokeStyle = '#d4a020';
        ctx.lineWidth = 2;
        ctx.strokeRect(px, py, panelW, panelH);

        // Title
        ctx.font = '18px monospace';
        ctx.fillStyle = '#d4a020';
        ctx.textAlign = 'center';
        ctx.fillText('Inventory', w / 2, py + 30);

        // Items grid
        const itemList = [...items];
        const cols = 4;
        const cellSize = 70;
        const gridX = px + (panelW - cols * cellSize) / 2;
        const gridY = py + 50;

        itemList.forEach((id, i) => {
            const item = ITEMS[id];
            if (!item) return;
            const col = i % cols;
            const row = Math.floor(i / cols);
            const cx = gridX + col * cellSize + cellSize / 2;
            const cy = gridY + row * cellSize + cellSize / 2;

            // Cell
            ctx.fillStyle = selectedItem === id ? 'rgba(212, 160, 32, 0.2)' : 'rgba(30, 30, 50, 0.5)';
            ctx.fillRect(cx - cellSize / 2 + 3, cy - cellSize / 2 + 3, cellSize - 6, cellSize - 6);
            ctx.strokeStyle = selectedItem === id ? '#d4a020' : '#333';
            ctx.lineWidth = 1;
            ctx.strokeRect(cx - cellSize / 2 + 3, cy - cellSize / 2 + 3, cellSize - 6, cellSize - 6);

            // Icon
            ctx.font = '28px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#fff';
            ctx.fillText(item.icon, cx, cy - 5);

            // Name (small)
            ctx.font = '8px monospace';
            ctx.fillStyle = '#888';
            ctx.fillText(item.name.split(' ')[0], cx, cy + 22);
        });

        if (itemList.length === 0) {
            ctx.font = '14px monospace';
            ctx.fillStyle = '#6a6a80';
            ctx.textAlign = 'center';
            ctx.fillText('No items collected yet.', w / 2, py + panelH / 2);
        }

        // Instructions
        ctx.font = '11px monospace';
        ctx.fillStyle = '#6a6a80';
        ctx.textAlign = 'center';
        ctx.fillText('Click item to select, then click object/NPC to use', w / 2, py + panelH - 40);
        ctx.fillText('Drag one item onto another to combine', w / 2, py + panelH - 25);
        ctx.fillText('Press I or ESC to close', w / 2, py + panelH - 10);
    }

    // ── Getters / Setters ──
    function hasItem(id) { return items.has(id); }
    function getItems() { return [...items]; }
    function getSelectedItem() { return selectedItem; }
    function selectItem(id) { selectedItem = items.has(id) ? id : null; }
    function deselectItem() { selectedItem = null; }
    function toggleInventory() { showingInventory = !showingInventory; }
    function isShowingInventory() { return showingInventory; }
    function getItemDef(id) { return ITEMS[id]; }

    // ── Save / Load ──
    function getSaveData() {
        return {
            items: [...items],
            usedCombinations: [...usedCombinations],
        };
    }

    function loadSaveData(data) {
        items = new Set(data.items || []);
        usedCombinations = new Set(data.usedCombinations || []);
    }

    return {
        init, reset, pickupItem, checkForItems,
        useItemOn, tryCombine,
        renderInventoryBar, renderInventoryPanel,
        hasItem, getItems, getSelectedItem,
        selectItem, deselectItem,
        toggleInventory, isShowingInventory, getItemDef,
        getSaveData, loadSaveData,
        ITEMS,
    };
})();
