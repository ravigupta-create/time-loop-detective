/* ═══════════════════════════════════════════════════════
   DIALOGUE — Conversation system, typewriter effect
   ═══════════════════════════════════════════════════════ */

const Dialogue = (() => {
    let currentNPC = null;
    let currentNode = null;
    let typewriterTimer = null;
    let typewriterText = '';
    let typewriterIndex = 0;
    let isTyping = false;

    function init() {
        // Click to skip typewriter
        document.getElementById('dialogue-text').addEventListener('click', () => {
            if (isTyping) {
                finishTypewriter();
            }
        });
    }

    function startConversation(npcId) {
        currentNPC = npcId;
        const tree = GameData.dialogues[npcId];
        if (!tree) {
            Engine.notify('They have nothing to say.');
            return;
        }

        Engine.state.screen = 'dialogue';
        World.showScreen('dialogue-screen');

        // Draw portrait
        const portraitCanvas = document.getElementById('dialogue-portrait');
        Renderer.drawPortraitOnCanvas(npcId, portraitCanvas);

        // Set name
        const npc = GameData.npcs[npcId];
        document.getElementById('dialogue-name').textContent = npc.name;

        // Find best starting node
        const startNode = findBestStartNode(npcId, tree);
        showNode(startNode, tree);
    }

    function findBestStartNode(npcId, tree) {
        // Check for evidence-based special conversations first
        const specialNodes = [
            'confront_poisoning', 'confront_letters', 'confront_affair',
            'confront_confession', 'confront_glass', 'midnight_testimony',
            'secret_meeting',
        ];

        for (const nodeId of specialNodes) {
            if (tree[nodeId] && tree[nodeId].requires) {
                const reqs = tree[nodeId].requires;
                const hasAllReqs = reqs.every(req =>
                    Engine.state.discoveredEvidence.has(req) ||
                    Engine.state.knownFacts.has(req) ||
                    Engine.state.flags[req]
                );
                if (hasAllReqs) {
                    // Check location/time requirements for special meetings
                    if (tree[nodeId].location) {
                        if (Engine.state.currentLocation !== tree[nodeId].location) continue;
                    }
                    if (tree[nodeId].timeWindow) {
                        const t = Engine.state.time;
                        if (t < tree[nodeId].timeWindow.start || t > tree[nodeId].timeWindow.end) continue;
                    }
                    // Only show once per loop for confront nodes
                    if (nodeId.startsWith('confront_') || nodeId === 'midnight_testimony') {
                        const key = `${npcId}_${nodeId}_${Engine.state.loop}`;
                        if (Engine.state.flags[key]) continue;
                        Engine.state.flags[key] = true;
                    }
                    return nodeId;
                }
            }
        }

        return 'greeting';
    }

    function showNode(nodeId, tree) {
        if (!tree) tree = GameData.dialogues[currentNPC];
        const node = tree[nodeId];
        if (!node) {
            endConversation();
            return;
        }
        currentNode = nodeId;

        // Process reveals
        if (node.reveals) {
            node.reveals.forEach(fact => {
                Engine.addFact(fact);
                // Add profile notes based on reveals
                addAutoProfileNote(currentNPC, fact);
            });
        }

        // Process flags
        if (node.flags) {
            node.flags.forEach(flag => Engine.setFlag(flag));
        }

        // Typewriter effect for text
        startTypewriter(node.text, () => {
            showChoices(node.responses, tree);
        });
    }

    function addAutoProfileNote(npcId, fact) {
        const noteMap = {
            'ashworth_announcement': 'Plans to make a major announcement at the gala.',
            'ashworth_fears': 'Fears for his safety. Says not everyone wishes him well.',
            'ashworth_precautions': 'Has taken precautions. Gave safe combination: 1887.',
            'ashworth_suspects_evelyn': 'Called his wife "the most dangerous person in this house."',
            'ashworth_confirms_poison': 'Confirmed he is being poisoned with aconitine.',
            'will_change_motive': 'Changed his will 3 days ago. Wife doesn\'t know.',
            'isabelle_truth_from_ashworth': 'Reveals Isabelle is a PI he hired to investigate Evelyn.',
            'evelyn_marriage_trouble': 'Marriage is troubled. "Things are changing."',
            'evelyn_suspects_isabelle': 'Suspects Isabelle is not who she claims to be.',
            'first_wife_death': 'Victor had a first wife who died young. Suspicious.',
            'evelyn_affair_confirmed': 'Confirmed her relationship with Rex when confronted.',
            'evelyn_lying_about_plan': 'Claims plan was about divorce. Clearly lying.',
            'evelyn_caught': 'Confronted about poison vial. Mask dropped.',
            'evelyn_full_confession': 'FULL CONFESSION: She and Rex planned the murder.',
            'james_resentment': 'Deeply resents his father for cutting him out.',
            'james_observations': 'Observed Rex, his mother, and Dr. Cross acting suspicious.',
            'james_knows_affair': 'Knows about his mother and Rex\'s affair.',
            'james_doubts_isabelle': 'Has doubts about Isabelle — notices her studying the family.',
            'lily_perspective': 'Views father as a tyrant. Sees family as prisoners.',
            'lily_overheard_evelyn': 'Heard her mother tell someone "be in position by eleven."',
            'thomas_warning': 'Warns that someone intends great harm tonight.',
            'thomas_hint': 'Hints to "follow the love that shouldn\'t exist."',
            'thomas_confirms_evelyn': 'Confirmed Evelyn confessed plan to him.',
            'cross_concerned': 'Very worried about Lord Ashworth\'s health.',
            'cross_confirms_aconitine': 'Confirms aconitine poisoning. Wolfsbane-based.',
            'wolfsbane_access': 'Wolfsbane in greenhouse. Evelyn tends the garden.',
            'rex_motive_details': 'Audit threatens to expose his embezzlement. Faces ruin.',
            'rex_admits_affair': 'Admits affair with Evelyn. Says they planned to "leave."',
            'rex_lying': 'Claims plan was just to leave. Clearly lying.',
            'isabelle_is_PI': 'REAL IDENTITY: Private investigator hired by Lord Ashworth.',
            'isabelle_full_evidence': 'Has proof of Evelyn\'s poisoning and affair with Rex.',
            'blackwood_knows_affair': 'Knows about Evelyn and Rex\'s affair.',
            'evelyn_prepares_drinks': 'Lady Evelyn personally prepares Lord Ashworth\'s drinks.',
            'special_brandy': 'The Library brandy was brought by Evelyn — not from cellar.',
            'blackwood_testimony': 'SAW Evelyn leaving the Library at 11:45 PM with a vial.',
            'finch_hid_glass': 'Hid the brandy glass on Evelyn\'s orders. Still has it.',
            'isabelle_conflicted': 'Has complex feelings about her role and James.',
        };

        const note = noteMap[fact];
        if (note) {
            Engine.addProfileNote(currentNPC, note);
        }
    }

    function showChoices(responses, tree) {
        const container = document.getElementById('dialogue-choices');
        container.innerHTML = '';

        if (!responses || responses.length === 0) {
            // Auto-end
            const btn = document.createElement('button');
            btn.className = 'dialogue-choice';
            btn.textContent = '[End conversation]';
            btn.addEventListener('click', () => {
                Audio.playSound('click');
                endConversation();
            });
            container.appendChild(btn);
            return;
        }

        responses.forEach(resp => {
            const btn = document.createElement('button');

            // Check requirements
            if (resp.requires) {
                const hasReqs = resp.requires.every(req =>
                    Engine.state.discoveredEvidence.has(req) ||
                    Engine.state.knownFacts.has(req) ||
                    Engine.state.flags[req]
                );
                if (!hasReqs) {
                    btn.className = 'dialogue-choice locked';
                    btn.textContent = '[Evidence required]';
                    btn.style.cursor = 'not-allowed';
                    container.appendChild(btn);
                    return;
                }
                btn.className = 'dialogue-choice evidence-choice';
            } else {
                btn.className = 'dialogue-choice';
            }

            btn.textContent = resp.text;
            btn.addEventListener('click', () => {
                Audio.playSound('click');
                if (resp.next === null) {
                    endConversation();
                } else {
                    showNode(resp.next, tree);
                }
            });
            container.appendChild(btn);
        });
    }

    function endConversation() {
        currentNPC = null;
        currentNode = null;
        stopTypewriter();

        Engine.state.screen = 'playing';
        World.hideScreen('dialogue-screen');

        // Refresh room actions (NPC positions may have changed with time)
        World.refreshActions();
    }

    // ── Typewriter Effect ──
    function startTypewriter(text, onComplete) {
        stopTypewriter();
        const el = document.getElementById('dialogue-text');
        typewriterText = text;
        typewriterIndex = 0;
        isTyping = true;
        el.textContent = '';

        typewriterTimer = setInterval(() => {
            if (typewriterIndex < typewriterText.length) {
                el.textContent += typewriterText[typewriterIndex];
                typewriterIndex++;
                if (typewriterIndex % 3 === 0) Audio.playSound('typewriter');
            } else {
                finishTypewriter();
                if (onComplete) onComplete();
            }
        }, 25);
    }

    function finishTypewriter() {
        if (typewriterTimer) clearInterval(typewriterTimer);
        const el = document.getElementById('dialogue-text');
        el.textContent = typewriterText;
        isTyping = false;
    }

    function stopTypewriter() {
        if (typewriterTimer) clearInterval(typewriterTimer);
        isTyping = false;
    }

    return {
        init, startConversation, endConversation,
    };
})();
