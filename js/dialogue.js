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
    let typewriterCallback = null;

    function init() {
        // Click to skip typewriter
        document.getElementById('dialogue-text').addEventListener('click', () => {
            if (isTyping) {
                finishTypewriter();
                if (typewriterCallback) {
                    const cb = typewriterCallback;
                    typewriterCallback = null;
                    cb();
                }
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

        // Feature 27: Play NPC dialogue motif
        try { Audio.playNPCMotif(npcId); } catch (e) {}

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
            'secret_meeting', 'confront_debts', 'confront_insurance',
            'confront_wolfsbane', 'confront_overheard', 'confront_medical',
            'confront_negligence', 'confront_embezzlement', 'confront_footprints',
            'confront_photograph', 'confront_cufflink', 'confront_prophecy',
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

    // ── Time-of-Day Greeting Helper ──
    function getTimeGreeting(npcId) {
        const greetings = GameData.npcGreetings?.[npcId];
        if (!greetings) return null;
        const rawTod = GameData.getTimeOfDay(Engine.state.time);
        // Map detailed time periods to the 4 greeting keys
        const todMap = {
            early_morning: 'morning', morning: 'morning',
            late_morning: 'morning', afternoon: 'afternoon',
            late_afternoon: 'afternoon', evening: 'evening',
            night: 'night', late_night: 'night'
        };
        const key = todMap[rawTod] || 'morning';
        return greetings[key] || null;
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

        // Process evidence discovery from dialogue (Feature 1)
        if (node.evidence) {
            Engine.discoverEvidence(node.evidence);
        }

        // Use time-of-day greeting text if this is the greeting node
        let displayText = node.text;
        if (nodeId === 'greeting') {
            // Feature 5: Deja vu greetings in loop 3+
            const dejaVu = GameData.dejaVuGreetings?.[currentNPC];
            if (dejaVu && Engine.state.loop >= 3 && !Engine.state.flags['dejavu_' + currentNPC + '_' + Engine.state.loop]) {
                Engine.state.flags['dejavu_' + currentNPC + '_' + Engine.state.loop] = true;
                displayText = dejaVu;
            } else {
                const timeGreeting = getTimeGreeting(currentNPC);
                if (timeGreeting) displayText = timeGreeting;
            }
        }

        // Typewriter effect for text
        startTypewriter(displayText, () => {
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
            // Confrontation reveals
            'james_full_debt_amount': 'Owes £40,000 to dangerous creditors.',
            'james_needs_father_alive': 'Needs father alive — inheritance goes through probate.',
            'james_suspects_conspiracy': 'Suspects Evelyn and Rex are working together.',
            'james_in_danger': 'In danger from Whitechapel creditors.',
            'insurance_evelyn_rex': 'Found insurance policy — Evelyn and Rex co-signed.',
            'james_begs_intervention': 'Begged detective to stop whatever Evelyn and Rex are planning.',
            'lily_confirms_wolfsbane_source': 'Confirmed wolfsbane receipt from Madame Fournier.',
            'lily_suspected_poisoning': 'Suspected her mother was poisoning her father.',
            'lily_knows_timing': 'Knows murder will happen at 11:30 in the Library.',
            'lily_chemistry_knowledge': 'Studies chemistry. Recognized wolfsbane symptoms.',
            'lily_confirms_timeline': 'Confirmed murder timeline via passage timing notes.',
            'lily_allied': 'Allied with detective. Will help stop the murder.',
            'cross_knew_poisoning': 'KNEW about the poisoning for weeks. Documented it.',
            'cross_complicit': 'Delayed reporting at Lord Ashworth\'s request.',
            'cross_lethal_dose_warning': 'Warns next dose will be lethal — cardiac arrest.',
            'cross_failed_duty': 'Admits to being a coward. Failed his duty as physician.',
            'cross_will_testify': 'Will testify. Ready to do whatever it takes.',
            'cross_antidote_info': 'Has atropine antidote in his medical bag.',
            'rex_confirms_insurance': 'Confirms he co-signed the insurance policy.',
            'rex_denies_murder_plan': 'Denies knowing about murder. Claims he\'s "a thief, not a murderer."',
            'rex_realizes_truth': 'Realizes Evelyn used passage timing for murder route.',
            'rex_willful_ignorance': 'Admits willful ignorance about Evelyn\'s true plans.',
            'rex_garden_confession': 'Was in garden at 10:45 PM clearing passage entrance.',
            'rex_pawn_realization': 'Realizes he\'s Evelyn\'s patsy, not her partner.',
            'isabelle_is_daughter': 'REAL IDENTITY: Lord Ashworth\'s biological daughter.',
            'isabelle_will_beneficiary': 'Ashworth changed will to include her.',
            'isabelle_protective': 'Fiercely protective of Ashworth. Will die to save him.',
            'isabelle_backstory': 'Mother Claudette Moreau died when Isabelle was 16.',
            'isabelle_identifies_cufflink': 'Identified bloody cufflink as Rex Dalton\'s (R.D.).',
            'isabelle_case_complete': 'Says they have enough evidence to stop the murder.',
            'thomas_knows_clock': 'Knows the tower clock bends time.',
            'thomas_remembers_loops': 'Remembers the time loops like the detective.',
            'thomas_loop_solution': 'Says justice is needed to break the time loop.',
            'thomas_clock_origin': 'Clock is pre-Roman. Ashworth found it beneath the cellar.',
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
        typewriterCallback = onComplete;
        el.textContent = '';

        typewriterTimer = setInterval(() => {
            if (typewriterIndex < typewriterText.length) {
                el.textContent += typewriterText[typewriterIndex];
                typewriterIndex++;
                if (typewriterIndex % 3 === 0) Audio.playSound('typewriter');
            } else {
                finishTypewriter();
                if (typewriterCallback) {
                    const cb = typewriterCallback;
                    typewriterCallback = null;
                    cb();
                }
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
        init, startConversation, endConversation, getTimeGreeting,
    };
})();
