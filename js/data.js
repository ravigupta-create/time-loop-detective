/* ═══════════════════════════════════════════════════════
   GAME DATA — All content for Midnight at Ravenholm
   Locations, NPCs, Schedules, Dialogue, Evidence, Events
   ═══════════════════════════════════════════════════════ */

const GameData = (() => {

// ── LOCATIONS ──
const locations = {
    your_room: {
        name: 'Your Room',
        description: 'A modest guest room with heavy curtains and a single lamp casting amber light across floral wallpaper. Rain streaks the window. Your coat hangs by the door, still damp from last night\'s arrival.',
        descriptions: {
            early_morning: 'The room is swallowed in pre-dawn grey. Rain hammers the window like a warning. Your coat drips steadily onto the floor — you don\'t remember hanging it there.',
            morning: 'Weak morning light seeps through the curtains, painting the floral wallpaper in washed-out gold. The storm has settled into a steady murmur. Your reflection in the mirror looks older than yesterday.',
            afternoon: 'Afternoon light barely reaches this side of the manor. The lamp casts its amber glow across rumpled sheets and scattered notes. The room smells of damp wool and sleepless nights.',
            evening: 'The single lamp fights a losing war against the encroaching dark. Shadows pool in the corners like spilled ink. Outside, the storm picks up again — as if the house is breathing deeper.',
            night: 'Your room feels smaller at night, the walls pressing in. The lamp flickers once. Rain drives against the glass with renewed fury, and somewhere deep in the manor, a clock chimes the hour.',
        },
        color: { bg: '#1a1520', wall: '#2a2030', floor: '#1a1510', accent: '#d4a020' },
        objects: [
            { id: 'mirror', name: 'Mirror', icon: '🪞',
              examine: 'You look tired. Dark circles under sharp eyes. How many mornings have you woken up here? The answer should be one, but something tells you otherwise.' },
            { id: 'window_room', name: 'Window', icon: '🪟',
              examine: 'Rain hammers the glass. The manor grounds stretch into darkness below — the garden, the greenhouse, all swallowed by the storm. You can barely see the tower silhouette against the sky.' },
            { id: 'nightstand', name: 'Nightstand', icon: '🗄️',
              examine: 'A Bible, a glass of water (untouched), and a card: "Welcome to Ravenholm Manor. We hope your stay is... unforgettable." The ellipsis feels deliberate.' },
        ],
        exits: [
            { to: 'grand_hallway', label: 'Grand Hallway', icon: '🚪' },
        ],
        ambience: 'rain',
        hasWindow: true,
        narratorFirst: 'You wake with a gasp. The clock reads 6:00 AM. Outside, the storm rages on. Something is wrong — you can feel it in your bones.',
        narrator: 'Your room. Familiar now, in ways it shouldn\'t be.',
    },
    grand_hallway: {
        name: 'Grand Hallway',
        description: 'The central artery of Ravenholm Manor. A grand staircase sweeps upward beneath a dusty chandelier. Portraits of Ashworth ancestors line the walls, their painted eyes following you. The grandfather clock ticks with mechanical precision.',
        descriptions: {
            early_morning: 'The hallway is dim and cathedral-silent. The chandelier hangs dark overhead, and the Ashworth portraits stare down from their frames like a jury assembled before dawn.',
            morning: 'Morning light angles through the high windows, catching dust motes that drift like tiny ghosts. The grandfather clock\'s ticking echoes off marble floors, steady as a heartbeat.',
            afternoon: 'Afternoon sun throws long rectangles of gold across the hallway, but the portraits remain in shadow. The house feels awake now, alert — as if every door is an ear.',
            evening: 'The chandelier blazes to life as evening settles in, casting fractured light across the ancestral portraits. The hallway feels like a stage set, dressed for the performance to come.',
            night: 'The hallway feels endless at night, stretching into pools of darkness between each lamp. The grandfather clock\'s pendulum swings like a metronome counting down to something terrible.',
        },
        color: { bg: '#0d0d1a', wall: '#1a1a2e', floor: '#1a1510', accent: '#8b6914' },
        objects: [
            { id: 'grandfather_clock', name: 'Grandfather Clock', icon: '🕰️',
              examine: 'An imposing clock, easily seven feet tall. The pendulum swings with hypnotic regularity. The face reads the current time — but you notice strange symbols etched around the dial that aren\'t numbers. They seem to shimmer if you look too long.' },
            { id: 'portraits', name: 'Family Portraits', icon: '🖼️',
              examine: 'Generations of Ashworths stare down at you. Lord Ashworth\'s portrait is the newest — he looks younger, before the weight of secrets carved lines in his face. Lady Evelyn stands beside him, beautiful and unreachable. Their children are conspicuously absent from the wall.' },
            { id: 'hall_table', name: 'Side Table', icon: '📋',
              examine: 'A silver tray holds the day\'s post. Most are invitations and business letters for Lord Ashworth. One envelope is unmarked — but it\'s been opened and hastily stuffed back. The letter inside reads: "You cannot escape what you\'ve built. Midnight comes for us all."',
              evidence: 'threatening_letter' },
        ],
        exits: [
            { to: 'your_room', label: 'Your Room', icon: '🛏️' },
            { to: 'dining_room', label: 'Dining Room', icon: '🍽️' },
            { to: 'library', label: 'Library', icon: '📚' },
            { to: 'study', label: 'Study', icon: '📝' },
            { to: 'drawing_room', label: 'Drawing Room', icon: '🎹' },
            { to: 'ballroom', label: 'Ballroom', icon: '💃' },
            { to: 'garden', label: 'Garden', icon: '🌧️' },
            { to: 'master_suite', label: 'Master Suite', icon: '🔒', requiresFlag: 'master_suite_access' },
            { to: 'tower', label: 'Tower', icon: '🗼', requiresFlag: 'tower_access' },
        ],
        ambience: 'clock_ticking',
        narrator: 'The hallway stretches in both directions, each door a choice, each choice a cost measured in minutes you can\'t afford to waste.',
    },
    dining_room: {
        name: 'Dining Room',
        description: 'A long mahogany table set for twelve, though tonight\'s gala guests number far fewer. Crystal glassware catches the candlelight. The room smells of furniture polish and old money.',
        descriptions: {
            early_morning: 'The dining room sits empty and expectant in the grey dawn, place settings gleaming dully. The candles are unlit, the chairs pushed in with military precision. A room waiting to perform.',
            morning: 'Breakfast service has begun. Steam rises from silver chafing dishes. The crystal catches the thin morning light, and the mahogany table glows like a dark mirror.',
            afternoon: 'The lunch things have been cleared but the smell of roast lingers. A single wine glass sits forgotten at the far end of the table, a ruby ring of sediment at its base.',
            evening: 'Candles burn low in their holders as the evening deepens. The table has been reset for the gala dinner — more silver, more crystal, more knives. The room smells of furniture polish and anticipation.',
            night: 'The dining room is all flickering candlelight and long shadows now. The crystal throws tiny rainbows across the walls. Empty chairs surround the table like mourners at a wake.',
        },
        color: { bg: '#1a1015', wall: '#2a1a20', floor: '#1a1510', accent: '#cc3333' },
        objects: [
            { id: 'dining_table', name: 'Dining Table', icon: '🍽️',
              examine: 'Place cards in elegant calligraphy. You note the seating: Lord Ashworth at the head, Lady Evelyn opposite. James next to Isabelle. Lily as far from her father as possible. Rex positioned strategically close to Lord Ashworth. The seating tells its own story.' },
            { id: 'wine_cabinet', name: 'Wine Cabinet', icon: '🍷',
              examine: 'An impressive collection, mostly untouched. One bottle of 1982 Château Lafite is set aside — labeled "For tonight." A small tag reads: "Decant at 6 PM — E." Lady Evelyn\'s handwriting.' },
            { id: 'sideboard', name: 'Sideboard', icon: '🗄️',
              examine: 'Silver serving dishes, polished to a mirror shine. In the bottom drawer, tucked beneath napkins: a small glass vial, empty, with a faint lavender residue. The label has been scratched off.',
              evidence: 'empty_vial', requiresLoop: 2 },
        ],
        exits: [
            { to: 'grand_hallway', label: 'Grand Hallway', icon: '🚪' },
            { to: 'kitchen', label: 'Kitchen', icon: '🍳' },
        ],
        ambience: 'candles',
        narrator: 'Every meal here is a performance. Watch the silences between courses — they say more than the conversation.',
    },
    kitchen: {
        name: 'Kitchen',
        description: 'A vast working kitchen, all copper pots and stone surfaces. Mrs. Blackwood rules this domain with quiet efficiency. Steam rises from pots on the massive range. The servants\' bell board hangs by the door, each bell labeled with a room.',
        descriptions: {
            early_morning: 'The kitchen is already alive before dawn — the range stoked, the kettle whistling. Copper pots catch the gas-light like small suns. Mrs. Blackwood\'s domain never truly sleeps.',
            morning: 'Breakfast chaos fills the kitchen with the clatter of dishes and the sharp scent of toast and strong coffee. The bell board jangles intermittently. The staff move in practiced silence.',
            afternoon: 'The afternoon kitchen hums with purpose. Gala preparations are in full swing — sauces simmer, pastry chills, and the air is thick with the smell of roasting meat and rosemary.',
            evening: 'The kitchen is a furnace of activity as evening falls. Every surface is covered in gala preparations. Steam clouds the windows. The bell board rings with increasing urgency.',
            night: 'The kitchen runs at full capacity for the gala service, a machine of silver trays and shouted orders. But in the far corners, where the lamplight doesn\'t reach, the shadows hold their secrets.',
        },
        color: { bg: '#1a1810', wall: '#2a2520', floor: '#2a2218', accent: '#d4a020' },
        objects: [
            { id: 'bell_board', name: 'Bell Board', icon: '🔔',
              examine: 'A row of brass bells, each labeled: Study, Master Suite, Library, Drawing Room, Dining Room. A notepad beside it logs when each bell was last rung. The Library bell was rung at 11:47 PM last night. That\'s... very late.',
              evidence: 'bell_log', requiresLoop: 1 },
            { id: 'herb_shelf', name: 'Herb Shelf', icon: '🌿',
              examine: 'Cooking herbs and spices, all neatly labeled. But at the back, partially hidden: a small jar of dried purple flowers. Monkshood — also known as wolfsbane. Highly toxic. What is this doing in a kitchen?',
              evidence: 'wolfsbane_kitchen', requiresLoop: 3 },
            { id: 'pantry', name: 'Pantry', icon: '🥫',
              examine: 'Fully stocked for the gala. You notice a notepad with Mrs. Blackwood\'s meticulous inventory. She accounts for every ingredient — except the brandy. "Brandy: moved to Library per Lady A\'s instruction, 4 PM." Lady Evelyn arranged for brandy in the Library.' ,
              evidence: 'brandy_note' },
        ],
        exits: [
            { to: 'dining_room', label: 'Dining Room', icon: '🍽️' },
            { to: 'wine_cellar', label: 'Wine Cellar', icon: '🍷' },
        ],
        ambience: 'kitchen',
        narrator: 'Kitchens hear everything. Servants see everything. The question is whether they\'ll tell you what they know.',
    },
    library: {
        name: 'The Library',
        description: 'Floor-to-ceiling bookshelves frame a room that smells of leather and dust. A reading desk sits near the window. The fireplace crackles softly. After midnight, this becomes a crime scene. The chalked outline of a body would fit perfectly between the desk and the hearth.',
        descriptions: {
            early_morning: 'The library is hushed in the pre-dawn dark, the fireplace cold and grey with last night\'s ashes. Books stand like sentinels in the gloom. The crime scene that hasn\'t happened yet waits patiently.',
            morning: 'Weak light filters through the rain-streaked window, barely reaching the reading desk. The fireplace has been relit, its crackle the only sound. The books seem to lean in, listening.',
            afternoon: 'The library is warm in the afternoon, the fire well-fed and the leather chairs inviting. Dust motes swirl in the thin light. A deceptive calm — this room will be a murder scene before dawn.',
            evening: 'Evening turns the library into a theatre of shadow and firelight. The bookshelves become dark walls, the reading desk an island of amber light. The brandy tray catches the flame.',
            night: 'The library at night is intimate and dangerous. The fire throws dancing shadows across the spines of a thousand books. Somewhere between the desk and the hearth, death is keeping an appointment.',
        },
        color: { bg: '#10100a', wall: '#1a1a10', floor: '#2a1a0a', accent: '#8b4513' },
        objects: [
            { id: 'reading_desk', name: 'Reading Desk', icon: '📖',
              examine: 'Lord Ashworth\'s reading glasses sit atop a half-finished letter. The handwriting is shaky: "To whom it may concern — I, Victor Ashworth, being of sound mind, wish to record that if anything should happen to me..." The letter is unfinished. He knew.',
              evidence: 'unfinished_letter', requiresLoop: 2 },
            { id: 'fireplace_library', name: 'Fireplace', icon: '🔥',
              examine: 'A healthy fire burns. In the ashes, you spot fragments of burned paper. One piece is still partially legible: "...the arrangement with R.D. is no longer..." R.D. — Rex Dalton?' ,
              evidence: 'burned_letter', requiresLoop: 1 },
            { id: 'bookshelf_secret', name: 'East Bookshelf', icon: '📚',
              examine: 'A wall of leather-bound classics. But one section seems... newer than the rest. You try pulling a book — "The Art of Deception" — and hear a faint click. A section of the bookshelf swings open, revealing a narrow passage descending into darkness. It leads to the wine cellar.',
              evidence: 'secret_passage', requiresFlag: 'examined_bookshelf_3_times' },
            { id: 'brandy_tray', name: 'Brandy Tray', icon: '🥃',
              examine: 'A crystal decanter of brandy and one glass, set on a silver tray. The glass has a faint residue — slightly cloudy. If this is where Lord Ashworth had his last drink...',
              evidence: 'brandy_glass', requiresLoop: 3 },
        ],
        exits: [
            { to: 'grand_hallway', label: 'Grand Hallway', icon: '🚪' },
            { to: 'wine_cellar', label: 'Secret Passage', icon: '🕳️', requiresFlag: 'found_secret_passage' },
        ],
        ambience: 'fire',
        narrator: 'The Library. Where it all ends — and where the answers hide between the lines.',
    },
    study: {
        name: 'The Study',
        description: 'Lord Ashworth\'s private domain. A heavy oak desk dominates the room, covered in papers and ledgers. A wall safe sits behind a painting. The room reeks of cigars and consequence.',
        descriptions: {
            early_morning: 'The study is dark and heavy with the ghost of last night\'s cigars. Papers lie scattered across the desk like evidence at a crime scene. The safe behind the painting watches from the wall.',
            morning: 'Morning light cuts a sharp line across the desk, illuminating the paperwork Lord Ashworth has already begun. The room smells of fresh coffee over stale tobacco. Power gathers here like dust.',
            afternoon: 'The afternoon study is warm with trapped cigar smoke and the weight of decisions. Ledgers lie open, numbers telling their own grim story. The telephone sits like a loaded weapon.',
            evening: 'The desk lamp casts a tight circle of light as evening presses against the windows. The study feels smaller now, more private — a confessional for a man with too many sins to count.',
            night: 'The study is abandoned at night, its occupant elsewhere. But the room holds the impression of Lord Ashworth like a coffin holds its shape. His secrets linger in every drawer.',
        },
        color: { bg: '#1a1510', wall: '#2a2018', floor: '#1a150a', accent: '#d4a020' },
        objects: [
            { id: 'desk_papers', name: 'Desk Papers', icon: '📄',
              examine: 'Business correspondence, mostly mundane. But one letter stands out — from Rex Dalton, marked "CONFIDENTIAL." It discusses "restructuring the partnership" and mentions "irregularities in the offshore accounts." Someone has underlined a passage about embezzlement in red.',
              evidence: 'business_letter' },
            { id: 'wall_safe', name: 'Wall Safe', icon: '🔐',
              examine: 'A heavy iron safe behind a painting of the manor. It\'s locked with a four-digit combination. You\'ll need to find the code somewhere.',
              evidence: 'modified_will', requiresFlag: 'knows_safe_code' },
            { id: 'cigar_box', name: 'Cigar Box', icon: '📦',
              examine: 'Cuban cigars. Inside the lid, someone has scratched numbers: "1-8-8-7." A date? A code? 1887 — the year Ravenholm Manor was built. Could be the safe combination.',
              evidence: 'safe_code' },
            { id: 'phone_log', name: 'Telephone', icon: '📞',
              examine: 'An old rotary phone. A notepad beside it has recent calls logged in Lord Ashworth\'s hand. "11:00 — Called M. Re: the situation. She says she has proof." M? Mira? Isabelle Moreau? Someone has proof of something.',
              evidence: 'phone_log', requiresLoop: 1 },
        ],
        exits: [
            { to: 'grand_hallway', label: 'Grand Hallway', icon: '🚪' },
        ],
        ambience: 'study',
        narrator: 'A man\'s study reveals his mind. Ashworth\'s reveals a man with enemies, debts, and secrets too heavy for one safe to hold.',
    },
    drawing_room: {
        name: 'Drawing Room',
        description: 'An elegant sitting room with a grand piano in the corner. Soft light from table lamps creates pools of warmth against the cold darkness outside. The guests gather here during quieter hours.',
        descriptions: {
            early_morning: 'The drawing room is still and silver in the early light. The grand piano\'s lid is closed, its black surface reflecting the rain-streaked windows like a dark lake.',
            morning: 'Morning tea is laid out on the side table. The drawing room wears its elegance lightly now — sunlight softens the velvet, and the piano gleams. A civilized mask for an uncivilized house.',
            afternoon: 'The drawing room drowses in the afternoon warmth, table lamps burning low. Conversation murmurs here like background music. The piano sits silent, waiting for someone brave enough to play.',
            evening: 'The lamps are turned up as evening settles in, and the drawing room glows with false comfort. The piano catches the light like polished bone. Guests drift through, rehearsing their smiles for the gala.',
            night: 'At night the drawing room empties, the gala pulling everyone to the ballroom. The piano stands alone in the half-dark, its keys untouched. The silence here feels deliberate, like someone holding their breath.',
        },
        color: { bg: '#15101a', wall: '#201828', floor: '#1a1510', accent: '#8855bb' },
        objects: [
            { id: 'piano', name: 'Grand Piano', icon: '🎹',
              examine: 'A beautiful Steinway. Sheet music for Chopin\'s Nocturne in E-flat sits on the stand. Inside the piano bench: a folded note in Lily\'s handwriting: "Father, you can\'t keep us all caged here. One way or another, we\'ll all be free after tonight." Written before the gala, clearly.',
              evidence: 'lily_note' },
            { id: 'bookshelves_dr', name: 'Reading Corner', icon: '📚',
              examine: 'A small selection of poetry and novels. A book of Tennyson lies open to "In Memoriam": the passage about loss is underlined. In the margin, someone wrote: "She knows about R. — F.T." Father Thomas?' },
            { id: 'drink_cabinet', name: 'Drinks Cabinet', icon: '🥂',
              examine: 'Well-stocked with spirits. You notice the brandy is a different brand than the one in the Library. The Library brandy was specifically requested — it wasn\'t from the main supply.' },
        ],
        exits: [
            { to: 'grand_hallway', label: 'Grand Hallway', icon: '🚪' },
        ],
        ambience: 'piano',
        narrator: 'The Drawing Room wears civility like a mask. Underneath, every conversation here is a negotiation.',
    },
    ballroom: {
        name: 'Ballroom',
        description: 'The grandest room in the manor. Crystal chandeliers hang from a vaulted ceiling painted with scenes from mythology. Before the gala, it\'s empty and echoing. After 7 PM, it fills with music, champagne, and carefully maintained facades.',
        descriptions: {
            early_morning: 'The ballroom is a cavern of silence before dawn. The chandeliers hang dark and heavy, the vaulted ceiling lost in shadow. Your footsteps echo on the parquet like a ghost walking.',
            morning: 'Empty in the morning light, the ballroom reveals its true scale. The mythological ceiling paintings seem garish without the softening of candlelight. Staff move through, setting tables and polishing silver.',
            afternoon: 'The ballroom is being transformed for the gala. Staff arrange chairs, polish crystal, test the lighting. The chandeliers blaze experimentally, then dim. A dress rehearsal for the final act.',
            evening: 'The ballroom glitters as the chandeliers are lit for real. Champagne is chilling, the string quartet is tuning up, and the room holds its breath. The stage is set for the evening\'s performance.',
            night: 'The gala is in full swing. Crystal chandeliers blaze. Music swells. Champagne flows. Every face wears a smile, and behind every smile hides a motive. The ballroom has never looked more beautiful or more dangerous.',
        },
        color: { bg: '#10101a', wall: '#1a1a30', floor: '#2a2020', accent: '#d4a020' },
        objects: [
            { id: 'champagne_table', name: 'Champagne Table', icon: '🍾',
              examine: 'Cases of champagne ready for tonight. The gala will be Lord Ashworth\'s last party, one way or another.' },
            { id: 'stage_area', name: 'Stage', icon: '🎭',
              examine: 'A small raised area for the string quartet. Behind the curtain, you find a discarded notebook — James\'s gambling debts listed in frantic handwriting. The total: £485,000. His father\'s annual allowance: £50,000. He\'s desperate.',
              evidence: 'gambling_debts', requiresLoop: 1 },
            { id: 'back_door', name: 'Service Door', icon: '🚪',
              examine: 'A door for the serving staff. It connects to the kitchen through a back corridor. During the gala, it would be easy for someone to slip out unnoticed.' },
        ],
        exits: [
            { to: 'grand_hallway', label: 'Grand Hallway', icon: '🚪' },
        ],
        ambience: 'ballroom',
        narrator: 'By tonight, this room will glitter with false smiles. Everyone will have their mask on — the challenge is finding the one with blood on their hands.',
    },
    garden: {
        name: 'The Garden',
        description: 'The manor grounds stretch into mist and rain. Gravel paths wind between manicured hedges turned wild by winter. A greenhouse glows faintly in the distance. The gazebo offers shelter but little warmth.',
        descriptions: {
            early_morning: 'The garden is a world of mist and grey before sunrise. Hedges loom like dark walls, and the gravel paths vanish into fog. The greenhouse is a faint smudge of light in the distance, spectral and wrong.',
            morning: 'Morning rain falls steady on the garden, turning the gravel paths to dark ribbons. The hedges drip. The greenhouse glows a sickly green through the mist. Even in daylight, the grounds feel watched.',
            afternoon: 'The rain eases to a drizzle by afternoon, and the garden exhales. Wet stone paths gleam. The greenhouse stands clearer now, its glass walls fogged from within. The air smells of earth and decay.',
            evening: 'Evening swallows the garden quickly. The paths dissolve into darkness, the hedges become impenetrable walls, and the greenhouse light burns like an ember in the black. The gazebo offers no shelter from what\'s coming.',
            night: 'The garden at night is a void. Rain hammers unseen gravel, wind tears at invisible hedges, and the greenhouse is a lone beacon of poisonous green light. No sane person walks these grounds after dark.',
        },
        color: { bg: '#0a100a', wall: '#1a2a1a', floor: '#101a10', accent: '#44aa66' },
        objects: [
            { id: 'greenhouse', name: 'Greenhouse', icon: '🌱',
              examine: 'A Victorian glass structure, steamy inside. Exotic plants, medicinal herbs, and — in the back corner — a bed of purple flowers. Aconitum. Wolfsbane. Extremely toxic. Someone has been harvesting it recently — several stems are freshly cut.',
              evidence: 'wolfsbane_garden' },
            { id: 'gazebo', name: 'Gazebo', icon: '🏛️',
              examine: 'A stone gazebo overlooking the moor. On the bench: a pair of leather gloves, too large for a woman. The initials "R.D." are embossed on the cuff. Rex Dalton was here — recently, despite the rain.',
              evidence: 'rex_gloves', requiresLoop: 2 },
            { id: 'gardener_shed', name: 'Garden Shed', icon: '🏚️',
              examine: 'Locked. Through the window you can see gardening tools — and a lockbox. Mrs. Blackwood mentioned the shed key hangs in the Kitchen.' },
        ],
        exits: [
            { to: 'grand_hallway', label: 'Grand Hallway', icon: '🚪' },
        ],
        ambience: 'garden',
        narrator: 'The garden in winter is a graveyard for flowers. Beautiful things come here to die.',
    },
    master_suite: {
        name: 'Master Suite',
        description: 'Lord and Lady Ashworth\'s private chambers. Opulent but cold — a king-size bed that looks like it\'s been slept in from only one side. Lady Evelyn\'s vanity gleams with perfume bottles and jewellery.',
        descriptions: {
            early_morning: 'The master suite is heavy with sleep and silence. Curtains drawn tight, the bed disturbed on only one side. Perfume bottles on the vanity catch a sliver of light from beneath the door like guilty eyes.',
            morning: 'Morning light is ruthless in the master suite, exposing the cold distance between the two sides of the bed. Lady Evelyn\'s vanity is immaculate. Lord Ashworth\'s side is bare. A marriage told in furniture.',
            afternoon: 'The suite is quiet in the afternoon, the bed remade, the surfaces polished. But the room can\'t hide what it is — a gilded prison shared by two people who stopped loving each other long ago.',
            evening: 'Evening preparations transform the suite. Gala attire is laid out, jewellery selected, masks prepared. The room buzzes with the energy of two people dressing for a performance they\'ve rehearsed for decades.',
            night: 'The master suite is empty during the gala, its occupants elsewhere playing their roles. The perfume bottles stand like sentries on the vanity. The bed waits. The room knows it will witness no reconciliation tonight.',
        },
        color: { bg: '#1a101a', wall: '#2a1a2a', floor: '#201520', accent: '#cc3333' },
        objects: [
            { id: 'vanity', name: 'Vanity Table', icon: '💍',
              examine: 'Perfumes, powder, and a locked jewellery box. The key is tiny — hidden in a false-bottom drawer. Inside the box: a small vial of clear liquid labeled "Tincture — 3 drops, nightly." This isn\'t perfume. This is the poison.',
              evidence: 'poison_vial', requiresLoop: 3 },
            { id: 'lord_diary', name: 'Lord Ashworth\'s Diary', icon: '📔',
              examine: 'Hidden in a drawer under the bed. Recent entries reveal growing paranoia: "Someone is making me ill. The headaches, the nausea — it\'s not natural. Cross says it\'s stress but I\'ve had myself tested privately. Traces of aconitine in my blood." He knew he was being poisoned.',
              evidence: 'ashworth_diary' },
            { id: 'lady_letters', name: 'Lady Evelyn\'s Letters', icon: '✉️',
              examine: 'A bundle of letters in the bedside drawer, tied with a ribbon. Love letters — but not from Lord Ashworth. They\'re from Rex Dalton. "My dearest Evelyn, after tonight, we\'ll be free. Trust the plan. All my love, R." Dated yesterday.',
              evidence: 'love_letters', requiresLoop: 2 },
        ],
        exits: [
            { to: 'grand_hallway', label: 'Grand Hallway', icon: '🚪' },
        ],
        ambience: 'rain',
        narrator: 'The most private room in the house. Every secret you find here was meant to stay buried.',
    },
    wine_cellar: {
        name: 'Wine Cellar',
        description: 'Cool, dark, and labyrinthine. Stone archways frame rows of dusty bottles. The air is damp and tastes of earth. Deep in the cellar, the walls change from brick to rough-hewn stone — older, much older than the manor itself.',
        descriptions: {
            early_morning: 'The cellar doesn\'t know what time it is. It\'s always midnight down here — always cold, always dark. Stone archways frame rows of dusty bottles like a crypt for the drinkable dead.',
            morning: 'Even in the morning, the cellar is a world apart. Damp stone, dead air, the drip of condensation. The ancient walls at the back seem to breathe, older than anything above ground.',
            afternoon: 'The cellar in the afternoon is no different from the cellar at dawn. Time has no jurisdiction here. Only the dust moves, disturbed by footsteps that have no business being this far underground.',
            evening: 'As evening falls above, the cellar grows colder — or perhaps it only feels that way. The stone walls sweat. The deeper passages beckon with the promise of older, darker secrets.',
            night: 'Night in the cellar is absolute. The single bulb barely reaches the first row of bottles. Beyond lies a maze of stone and shadow where someone could hide, or be hidden, and never be found.',
        },
        color: { bg: '#0a0a0a', wall: '#1a1510', floor: '#0d0a08', accent: '#553322' },
        objects: [
            { id: 'wine_racks', name: 'Wine Racks', icon: '🍷',
              examine: 'Hundreds of bottles, organized by year. Some are extraordinarily valuable. But you notice a gap in one rack — a bottle has been recently removed. The dust outline suggests it was taken today.' },
            { id: 'old_wall', name: 'Ancient Stone Wall', icon: '🧱',
              examine: 'The back wall of the cellar is much older than the rest — medieval, possibly. One section of the stone seems different, slightly recessed. You push it and hear a grinding sound. A hidden passage opens, leading upward. It connects to the Library above.',
              evidence: 'secret_passage', requiresLoop: 2 },
            { id: 'cellar_crate', name: 'Wooden Crate', icon: '📦',
              examine: 'Behind the far wine rack: a crate that doesn\'t belong. Inside: a man\'s dress shirt with a torn cuff, a cufflink is missing. The shirt has faint stains on the collar. Size: large. This belongs to Rex Dalton.',
              evidence: 'rex_shirt', requiresLoop: 3 },
        ],
        exits: [
            { to: 'kitchen', label: 'Kitchen', icon: '🍳' },
            { to: 'library', label: 'Secret Passage', icon: '📚', requiresFlag: 'found_secret_passage' },
        ],
        ambience: 'cellar',
        narrator: 'Underground. Where old things wait in darkness. Some bottles. Some secrets. Some passages that should have stayed sealed.',
    },
    tower: {
        name: 'The Tower',
        description: 'A spiral staircase leads to a circular room at the top of the manor\'s only tower. An antique telescope points at the sky. But the room\'s centerpiece is impossible to ignore: an ancient clock mechanism, far older than the manor, humming with an energy that makes your teeth ache.',
        descriptions: {
            early_morning: 'The tower room is cold and thrumming before dawn. The ancient clock mechanism pulses with a faint blue light, casting alien shadows on the curved walls. The telescope points at a sky that hasn\'t changed in loops.',
            morning: 'Morning light floods the circular room through narrow windows, but it can\'t warm the air near the clock. The mechanism hums louder in daylight, as if agitated by the sun. Your teeth ache just standing here.',
            afternoon: 'The tower bakes in the afternoon, the curved walls trapping heat — everywhere except near the clock. A pocket of cold air surrounds the mechanism like a grave. The telescope stands useless against the overcast sky.',
            evening: 'As evening light dims, the clock mechanism seems to glow brighter, its ancient gears turning with impossible precision. The hum rises in pitch. The tower feels less like a room and more like the inside of something alive.',
            night: 'The tower at night is the heart of the loop. The clock mechanism blazes with cold blue light, its hum vibrating through stone and bone. The spiral staircase below is a throat, and you are standing in the skull of something ancient.',
        },
        color: { bg: '#0a0a15', wall: '#15152a', floor: '#1a1520', accent: '#4488cc' },
        objects: [
            { id: 'ancient_clock', name: 'Ancient Clock', icon: '⏰',
              examine: 'It\'s not a normal clock. The gears are made of a metal you don\'t recognize, etched with the same symbols as the grandfather clock downstairs. It hums. It vibrates. You can feel it in your chest. This is what\'s causing the time loop. Lord Ashworth found it — and activated it.',
              evidence: 'ancient_clock' },
            { id: 'telescope', name: 'Telescope', icon: '🔭',
              examine: 'Pointed at the sky, but the storm blocks everything. On the telescope\'s base, an inscription: "Time is the fire in which we burn — and the water in which we are reborn." Lord Ashworth\'s handwriting.' },
            { id: 'tower_journal', name: 'Research Journal', icon: '📓',
              examine: 'Lord Ashworth\'s private research journal. He found the clock mechanism beneath the manor years ago. He\'d been studying it, trying to harness its power. "If I can control time itself, death becomes optional." He activated it the night of the gala. He was trying to cheat death — and instead created the loop.',
              evidence: 'tower_journal', requiresLoop: 4 },
        ],
        exits: [
            { to: 'grand_hallway', label: 'Grand Hallway', icon: '🚪' },
        ],
        ambience: 'tower',
        narrator: 'The source. The origin of the loop. Whatever this clock is, it\'s older than the manor, older than the family. Maybe older than the hill it sits on.',
    },
};

// ── MAP CONNECTIONS (for minimap rendering) ──
const mapLayout = {
    your_room:    { x: 0.15, y: 0.15 },
    grand_hallway:{ x: 0.5,  y: 0.35 },
    dining_room:  { x: 0.25, y: 0.5 },
    kitchen:      { x: 0.15, y: 0.7 },
    library:      { x: 0.75, y: 0.5 },
    study:        { x: 0.85, y: 0.3 },
    drawing_room: { x: 0.35, y: 0.2 },
    ballroom:     { x: 0.6,  y: 0.15 },
    garden:       { x: 0.5,  y: 0.8 },
    master_suite: { x: 0.85, y: 0.15 },
    wine_cellar:  { x: 0.5,  y: 0.95 },
    tower:        { x: 0.15, y: 0.9 },
};

// ── NPCs ──
const npcs = {
    lord_ashworth: {
        name: 'Lord Ashworth',
        role: 'The Patriarch',
        age: 68,
        description: 'A tall, gaunt man with silver hair and piercing gray eyes. His handshake could crush walnuts. Decades of command have carved authority into every line of his face.',
        color: '#8888aa',
        personality: 'commanding, secretive, paranoid',
        alive: true, // becomes false after midnight
        schedule: [
            { start: 360, end: 420, location: 'study',        activity: 'Reviewing papers at his desk' },
            { start: 420, end: 480, location: 'drawing_room',  activity: 'Morning coffee, reading the paper' },
            { start: 480, end: 540, location: 'dining_room',   activity: 'Having breakfast' },
            { start: 540, end: 600, location: 'study',        activity: 'Meeting with Rex Dalton' },
            { start: 600, end: 660, location: 'garden',       activity: 'Walking the grounds alone' },
            { start: 660, end: 720, location: 'study',        activity: 'Making private phone calls' },
            { start: 720, end: 780, location: 'library',      activity: 'Reading quietly' },
            { start: 780, end: 840, location: 'dining_room',   activity: 'Lunch' },
            { start: 840, end: 900, location: 'master_suite',  activity: 'Resting' },
            { start: 900, end: 960, location: 'study',        activity: 'Meeting with Dr. Cross' },
            { start: 960, end: 1020,location: 'garden',       activity: 'Walking with Lady Evelyn' },
            { start: 1020,end: 1080,location: 'drawing_room',  activity: 'Playing piano' },
            { start: 1080,end: 1140,location: 'master_suite',  activity: 'Preparing for the gala' },
            { start: 1140,end: 1380,location: 'ballroom',     activity: 'At the gala, entertaining guests' },
            { start: 1380,end: 1410,location: 'library',      activity: 'Alone. Having a brandy.' },
            { start: 1410,end: 1440,location: 'library',      activity: '...' },
        ],
    },
    lady_evelyn: {
        name: 'Lady Evelyn',
        role: 'The Wife',
        age: 55,
        description: 'Elegant and composed, with auburn hair always perfectly arranged. Her smile never reaches her cold blue eyes. She runs the household with an iron will disguised as grace.',
        color: '#cc6688',
        personality: 'composed, calculating, resentful',
        isKiller: true,
        schedule: [
            { start: 360, end: 480, location: 'master_suite',  activity: 'Getting ready, reviewing gala plans' },
            { start: 480, end: 540, location: 'dining_room',   activity: 'Having breakfast' },
            { start: 540, end: 600, location: 'drawing_room',  activity: 'Planning gala decorations' },
            { start: 600, end: 660, location: 'garden',       activity: 'Arranging flowers' },
            { start: 660, end: 720, location: 'kitchen',      activity: 'Consulting with Mrs. Blackwood on the menu' },
            { start: 720, end: 780, location: 'drawing_room',  activity: 'Resting with tea' },
            { start: 780, end: 840, location: 'dining_room',   activity: 'Lunch' },
            { start: 840, end: 900, location: 'master_suite',  activity: 'Rest' },
            { start: 900, end: 960, location: 'grand_hallway', activity: 'Overseeing decorations' },
            { start: 960, end: 1020,location: 'garden',       activity: 'Walking with Lord Ashworth' },
            { start: 1020,end: 1080,location: 'kitchen',      activity: 'Final gala preparations' },
            { start: 1080,end: 1140,location: 'master_suite',  activity: 'Dressing for the gala' },
            { start: 1140,end: 1380,location: 'ballroom',     activity: 'Hosting the gala, greeting guests' },
            { start: 1380,end: 1395,location: 'kitchen',      activity: 'Checking on dessert service (alibi)' },
            { start: 1395,end: 1410,location: 'library',      activity: '(Secretly) Visiting the Library' },
            { start: 1410,end: 1440,location: 'kitchen',      activity: 'Returns to kitchen, "discovers" murder later' },
        ],
    },
    james_ashworth: {
        name: 'James Ashworth',
        role: 'The Heir',
        age: 32,
        description: 'Handsome in a dissipated way, with his father\'s jawline but none of his discipline. Dark circles under charming eyes. His suit is expensive but carelessly worn.',
        color: '#7788cc',
        personality: 'charming, reckless, desperate',
        schedule: [
            { start: 360, end: 540, location: 'grand_hallway', activity: 'Still asleep in his guest room' },
            { start: 540, end: 600, location: 'dining_room',   activity: 'Late breakfast, hungover' },
            { start: 600, end: 720, location: 'drawing_room',  activity: 'With Isabelle, discussing their future' },
            { start: 720, end: 780, location: 'garden',       activity: 'Smoking alone, making phone calls' },
            { start: 780, end: 840, location: 'dining_room',   activity: 'Lunch' },
            { start: 840, end: 960, location: 'ballroom',     activity: 'Drinking early, playing cards alone' },
            { start: 960, end: 1020,location: 'study',        activity: 'Trying to talk to his father (rejected)' },
            { start: 1020,end: 1080,location: 'drawing_room',  activity: 'With Isabelle' },
            { start: 1080,end: 1140,location: 'grand_hallway', activity: 'Getting dressed in his room' },
            { start: 1140,end: 1380,location: 'ballroom',     activity: 'At the gala, drinking heavily' },
            { start: 1380,end: 1440,location: 'ballroom',     activity: 'Passed out in a chair' },
        ],
    },
    lily_ashworth: {
        name: 'Lily Ashworth',
        role: 'The Daughter',
        age: 28,
        description: 'Sharp-featured and intense, with her mother\'s beauty channeled into defiance. She dresses simply despite the family wealth. Her eyes burn with quiet fury.',
        color: '#66aa88',
        personality: 'idealistic, angry, perceptive',
        schedule: [
            { start: 360, end: 420, location: 'garden',       activity: 'Morning walk despite the rain' },
            { start: 420, end: 540, location: 'drawing_room',  activity: 'Reading, ignoring the family' },
            { start: 540, end: 600, location: 'dining_room',   activity: 'Brief breakfast, leaves early' },
            { start: 600, end: 720, location: 'library',      activity: 'Research, writing in her journal' },
            { start: 720, end: 840, location: 'garden',       activity: 'In the greenhouse, tending plants' },
            { start: 840, end: 900, location: 'dining_room',   activity: 'Lunch' },
            { start: 900, end: 960, location: 'tower',        activity: 'Exploring the tower (curious about the clock)' },
            { start: 960, end: 1020,location: 'drawing_room',  activity: 'Trying to talk to James about their father' },
            { start: 1020,end: 1140,location: 'grand_hallway', activity: 'Getting ready reluctantly' },
            { start: 1140,end: 1320,location: 'ballroom',     activity: 'At the gala, keeping to the edges' },
            { start: 1320,end: 1380,location: 'library',      activity: 'Retreated from the gala, reading' },
            { start: 1380,end: 1440,location: 'drawing_room',  activity: 'Alone with her thoughts' },
        ],
    },
    dr_cross: {
        name: 'Dr. Cross',
        role: 'Family Physician',
        age: 60,
        description: 'A stout man with kind eyes behind wire-rimmed glasses. His medical bag is never far from reach. He\'s been the Ashworth family doctor for thirty years, and the weight of their secrets shows.',
        color: '#88aa88',
        personality: 'cautious, guilt-ridden, caring',
        schedule: [
            { start: 360, end: 480, location: 'dining_room',   activity: 'Early breakfast, reading medical journal' },
            { start: 480, end: 600, location: 'drawing_room',  activity: 'Morning tea, conversation' },
            { start: 600, end: 720, location: 'garden',       activity: 'Constitutional walk' },
            { start: 720, end: 780, location: 'library',      activity: 'Reading' },
            { start: 780, end: 840, location: 'dining_room',   activity: 'Lunch' },
            { start: 840, end: 960, location: 'drawing_room',  activity: 'Resting, checking medical notes' },
            { start: 960, end: 1020,location: 'study',        activity: 'Meeting with Lord Ashworth (medical)' },
            { start: 1020,end: 1140,location: 'drawing_room',  activity: 'Preparing for the evening' },
            { start: 1140,end: 1380,location: 'ballroom',     activity: 'At the gala, observing' },
            { start: 1380,end: 1440,location: 'drawing_room',  activity: 'Retired early, feeling unwell' },
        ],
    },
    rex_dalton: {
        name: 'Rex Dalton',
        role: 'Business Partner',
        age: 52,
        description: 'Built like a boxer gone to seed, with a broad face and sharp, calculating eyes. His expensive suit strains at the shoulders. He smiles too much and means none of it.',
        color: '#aa7744',
        personality: 'aggressive, cunning, desperate',
        isAccomplice: true,
        schedule: [
            { start: 360, end: 480, location: 'dining_room',   activity: 'Breakfast, checking his phone constantly' },
            { start: 480, end: 540, location: 'grand_hallway',  activity: 'Pacing, waiting for the meeting' },
            { start: 540, end: 600, location: 'study',        activity: 'Meeting with Lord Ashworth (argument)' },
            { start: 600, end: 720, location: 'garden',       activity: 'Smoking, making angry phone calls' },
            { start: 720, end: 780, location: 'drawing_room',  activity: 'Drinking, brooding' },
            { start: 780, end: 840, location: 'dining_room',   activity: 'Lunch' },
            { start: 840, end: 960, location: 'ballroom',     activity: 'Drinking alone' },
            { start: 960, end: 1020,location: 'garden',       activity: 'Another cigarette, another call' },
            { start: 1020,end: 1140,location: 'grand_hallway', activity: 'Getting dressed, pacing' },
            { start: 1140,end: 1380,location: 'ballroom',     activity: 'At the gala, watching Ashworth' },
            { start: 1380,end: 1410,location: 'wine_cellar',  activity: 'Sneaking to the cellar (secret passage)' },
            { start: 1410,end: 1425,location: 'library',      activity: '(Via passage) In the Library with Lord Ashworth' },
            { start: 1425,end: 1440,location: 'ballroom',     activity: 'Returns to ballroom, acts shocked' },
        ],
    },
    isabelle_moreau: {
        name: 'Isabelle Moreau',
        role: 'James\'s Fiancée',
        age: 27,
        description: 'French accent, dark curls, and watchful brown eyes. She seems out of place among the Ashworths — too attentive, too curious. She asks questions a fiancée wouldn\'t normally ask.',
        color: '#cc88aa',
        personality: 'observant, deceptive, conflicted',
        schedule: [
            { start: 360, end: 540, location: 'grand_hallway', activity: 'Getting ready in her guest room' },
            { start: 540, end: 600, location: 'dining_room',   activity: 'Breakfast with James' },
            { start: 600, end: 720, location: 'drawing_room',  activity: 'With James, charming the family' },
            { start: 720, end: 780, location: 'grand_hallway', activity: 'Exploring the manor "innocently"' },
            { start: 780, end: 840, location: 'dining_room',   activity: 'Lunch' },
            { start: 840, end: 900, location: 'study',        activity: 'Snooping in the Study (she\'s investigating)' },
            { start: 900, end: 960, location: 'garden',       activity: 'Greenhouse visit' },
            { start: 960, end: 1020,location: 'master_suite',  activity: 'Snooping in Lady Evelyn\'s things' },
            { start: 1020,end: 1140,location: 'drawing_room',  activity: 'Getting ready with James' },
            { start: 1140,end: 1380,location: 'ballroom',     activity: 'At the gala with James' },
            { start: 1380,end: 1440,location: 'ballroom',     activity: 'With James (he\'s passed out)' },
        ],
    },
    father_thomas: {
        name: 'Father Thomas',
        role: 'Family Chaplain',
        age: 65,
        description: 'A thin, stooped man in black with gentle hands and troubled eyes. He\'s served the Ashworth family\'s spiritual needs for decades. The things he\'s heard in confession weigh heavily on his soul.',
        color: '#666688',
        personality: 'gentle, tormented, principled',
        schedule: [
            { start: 360, end: 480, location: 'library',      activity: 'Morning prayers and reading' },
            { start: 480, end: 540, location: 'dining_room',   activity: 'Breakfast' },
            { start: 540, end: 660, location: 'garden',       activity: 'Walking the grounds, contemplation' },
            { start: 660, end: 720, location: 'drawing_room',  activity: 'Tea, quiet reflection' },
            { start: 720, end: 780, location: 'library',      activity: 'Reading theology' },
            { start: 780, end: 840, location: 'dining_room',   activity: 'Lunch' },
            { start: 840, end: 960, location: 'grand_hallway', activity: 'Wandering, checking on the family' },
            { start: 960, end: 1080,location: 'drawing_room',  activity: 'Writing in his journal' },
            { start: 1080,end: 1140,location: 'library',      activity: 'Quiet time before the gala' },
            { start: 1140,end: 1320,location: 'ballroom',     activity: 'At the gala, observing quietly' },
            { start: 1320,end: 1440,location: 'library',      activity: 'Retired to the library, praying' },
        ],
    },
    mrs_blackwood: {
        name: 'Mrs. Blackwood',
        role: 'The Housekeeper',
        age: 58,
        description: 'A sturdy woman with steel-gray hair pinned in a tight bun. Nothing escapes her notice. She\'s run Ravenholm Manor for twenty years and knows where every skeleton is buried — literally and figuratively.',
        color: '#888877',
        personality: 'observant, loyal, conflicted',
        schedule: [
            { start: 360, end: 420, location: 'kitchen',      activity: 'Morning preparations' },
            { start: 420, end: 480, location: 'dining_room',   activity: 'Setting breakfast' },
            { start: 480, end: 540, location: 'kitchen',      activity: 'Overseeing breakfast service' },
            { start: 540, end: 660, location: 'grand_hallway', activity: 'Cleaning, overseeing staff' },
            { start: 660, end: 720, location: 'master_suite',  activity: 'Making beds, tidying' },
            { start: 720, end: 780, location: 'kitchen',      activity: 'Lunch preparation' },
            { start: 780, end: 840, location: 'dining_room',   activity: 'Serving lunch' },
            { start: 840, end: 960, location: 'kitchen',      activity: 'Gala food preparation' },
            { start: 960, end: 1080,location: 'ballroom',     activity: 'Setting up the ballroom' },
            { start: 1080,end: 1140,location: 'kitchen',      activity: 'Final preparations' },
            { start: 1140,end: 1380,location: 'kitchen',      activity: 'Managing gala service' },
            { start: 1380,end: 1440,location: 'kitchen',      activity: 'Cleaning up' },
        ],
    },
    mr_finch: {
        name: 'Mr. Finch',
        role: 'The Butler',
        age: 62,
        description: 'Impeccably dressed, with a thin mustache and an expression that reveals nothing. He\'s served Lord Ashworth since before the children were born. His loyalty is absolute — perhaps too absolute.',
        color: '#555566',
        personality: 'formal, loyal, secretive',
        schedule: [
            { start: 360, end: 420, location: 'grand_hallway', activity: 'Morning rounds, opening curtains' },
            { start: 420, end: 480, location: 'study',        activity: 'Preparing Lord Ashworth\'s desk' },
            { start: 480, end: 540, location: 'dining_room',   activity: 'Serving breakfast' },
            { start: 540, end: 660, location: 'grand_hallway', activity: 'Managing the household' },
            { start: 660, end: 720, location: 'study',        activity: 'Attending to Lord Ashworth' },
            { start: 720, end: 780, location: 'dining_room',   activity: 'Setting lunch' },
            { start: 780, end: 840, location: 'dining_room',   activity: 'Serving lunch' },
            { start: 840, end: 960, location: 'grand_hallway', activity: 'Overseeing gala preparations' },
            { start: 960, end: 1080,location: 'grand_hallway', activity: 'Final preparations' },
            { start: 1080,end: 1140,location: 'grand_hallway', activity: 'Welcoming guests' },
            { start: 1140,end: 1380,location: 'ballroom',     activity: 'Serving at the gala' },
            { start: 1380,end: 1410,location: 'grand_hallway', activity: 'At his station, monitoring bells' },
            { start: 1410,end: 1440,location: 'grand_hallway', activity: 'Heard a commotion, heading to Library' },
        ],
    },
};

// ── EVIDENCE ──
const evidence = {
    threatening_letter: {
        name: 'Threatening Letter',
        description: 'An unmarked letter found in the Grand Hallway: "You cannot escape what you\'ve built. Midnight comes for us all."',
        category: 'documents',
        location: 'grand_hallway',
        importance: 1,
    },
    bell_log: {
        name: 'Bell Board Log',
        description: 'The kitchen bell log shows the Library bell was rung at 11:47 PM — just before Lord Ashworth\'s death.',
        category: 'records',
        location: 'kitchen',
        importance: 2,
    },
    brandy_note: {
        name: 'Brandy Instruction',
        description: 'Mrs. Blackwood\'s note: "Brandy moved to Library per Lady A\'s instruction, 4 PM." Lady Evelyn arranged for brandy in the murder room.',
        category: 'records',
        location: 'kitchen',
        importance: 3,
    },
    wolfsbane_kitchen: {
        name: 'Wolfsbane in Kitchen',
        description: 'A jar of dried wolfsbane (aconitum) hidden at the back of the kitchen herb shelf. Extremely toxic.',
        category: 'physical',
        location: 'kitchen',
        importance: 3,
    },
    unfinished_letter: {
        name: 'Lord Ashworth\'s Unfinished Letter',
        description: '"If anything should happen to me..." — Lord Ashworth was writing a statement about his own death. He knew he was in danger.',
        category: 'documents',
        location: 'library',
        importance: 2,
    },
    burned_letter: {
        name: 'Burned Letter Fragment',
        description: 'Partially burned letter in the Library fireplace. Mentions "the arrangement with R.D." — Rex Dalton.',
        category: 'documents',
        location: 'library',
        importance: 2,
    },
    secret_passage: {
        name: 'Secret Passage',
        description: 'A hidden passage connects the Wine Cellar to the Library through the manor\'s medieval foundations. The killer could have used this to reach Lord Ashworth unseen.',
        category: 'structural',
        location: 'library',
        importance: 4,
    },
    brandy_glass: {
        name: 'Drugged Brandy Glass',
        description: 'The brandy glass in the Library has a cloudy residue — it was drugged. Lord Ashworth was sedated before he was killed.',
        category: 'physical',
        location: 'library',
        importance: 4,
    },
    business_letter: {
        name: 'Rex\'s Business Letter',
        description: 'Confidential letter from Rex Dalton discussing "irregularities in offshore accounts" and embezzlement. Lord Ashworth underlined the worst parts.',
        category: 'documents',
        location: 'study',
        importance: 2,
    },
    modified_will: {
        name: 'Modified Will',
        description: 'Lord Ashworth\'s new will, found in the safe. It cuts out James entirely, gives everything to a trust managed by Isabelle Moreau, and leaves nothing to Lady Evelyn. Dated three days ago.',
        category: 'documents',
        location: 'study',
        importance: 4,
    },
    safe_code: {
        name: 'Safe Combination',
        description: 'Numbers scratched inside the cigar box: 1-8-8-7. The year Ravenholm was built — and likely the safe combination.',
        category: 'key',
        location: 'study',
        importance: 2,
    },
    phone_log: {
        name: 'Phone Log',
        description: 'Lord Ashworth called "M" at 11 AM about "the situation." She says she has proof. M could be Isabelle Moreau.',
        category: 'records',
        location: 'study',
        importance: 2,
    },
    lily_note: {
        name: 'Lily\'s Note',
        description: '"You can\'t keep us all caged here. One way or another, we\'ll all be free after tonight." — Lily\'s note found in the piano bench.',
        category: 'documents',
        location: 'drawing_room',
        importance: 1,
    },
    gambling_debts: {
        name: 'James\'s Gambling Debts',
        description: 'James owes £485,000 to various creditors. His annual allowance is only £50,000. He\'s utterly desperate for inheritance.',
        category: 'documents',
        location: 'ballroom',
        importance: 2,
    },
    wolfsbane_garden: {
        name: 'Wolfsbane in Greenhouse',
        description: 'A bed of wolfsbane (aconitum) in the greenhouse with freshly cut stems. Someone has been harvesting the poison\'s source.',
        category: 'physical',
        location: 'garden',
        importance: 3,
    },
    rex_gloves: {
        name: 'Rex\'s Gloves',
        description: 'Leather gloves monogrammed "R.D." left in the gazebo. Rex was outside in the rain recently — why?',
        category: 'physical',
        location: 'garden',
        importance: 1,
    },
    poison_vial: {
        name: 'Poison Vial',
        description: 'A vial labeled "Tincture — 3 drops, nightly" hidden in Lady Evelyn\'s jewellery box. This is the aconitine poison used to slowly poison Lord Ashworth.',
        category: 'physical',
        location: 'master_suite',
        importance: 5,
    },
    ashworth_diary: {
        name: 'Lord Ashworth\'s Diary',
        description: 'Lord Ashworth\'s diary reveals he knew he was being poisoned. "Traces of aconitine in my blood." He was being killed slowly before the final murder.',
        category: 'documents',
        location: 'master_suite',
        importance: 4,
    },
    love_letters: {
        name: 'Love Letters (Evelyn & Rex)',
        description: 'Love letters from Rex to Evelyn: "After tonight, we\'ll be free. Trust the plan." They were having an affair and planned something for tonight.',
        category: 'documents',
        location: 'master_suite',
        importance: 5,
    },
    rex_shirt: {
        name: 'Rex\'s Hidden Shirt',
        description: 'A dress shirt with Rex\'s size, hidden in the cellar. Missing cufflink, faint stains on the collar. Evidence of a struggle.',
        category: 'physical',
        location: 'wine_cellar',
        importance: 4,
    },
    empty_vial: {
        name: 'Empty Vial (Dining Room)',
        description: 'An empty vial with lavender residue found in the dining room sideboard. Used to administer something — sleeping agent in the brandy?',
        category: 'physical',
        location: 'dining_room',
        importance: 2,
    },
    ancient_clock: {
        name: 'The Ancient Clock',
        description: 'An impossibly old clock mechanism in the tower, made of unknown metal. It hums with energy. This is the source of the time loop.',
        category: 'supernatural',
        location: 'tower',
        importance: 5,
    },
    tower_journal: {
        name: 'Ashworth\'s Research Journal',
        description: 'Lord Ashworth found the clock beneath the manor. He activated it the night of the gala, trying to "make death optional." He created the time loop.',
        category: 'documents',
        location: 'tower',
        importance: 5,
    },
};

// ── EVIDENCE CONNECTIONS (for the board) ──
const connections = [
    { from: 'poison_vial', to: 'wolfsbane_garden', label: 'Same poison source' },
    { from: 'poison_vial', to: 'wolfsbane_kitchen', label: 'Poison processing' },
    { from: 'poison_vial', to: 'ashworth_diary', label: 'Confirms chronic poisoning' },
    { from: 'love_letters', to: 'rex_shirt', label: 'Co-conspirators' },
    { from: 'love_letters', to: 'brandy_note', label: 'Evelyn\'s preparation' },
    { from: 'brandy_note', to: 'brandy_glass', label: 'Drugged brandy setup' },
    { from: 'brandy_glass', to: 'empty_vial', label: 'Sedative source' },
    { from: 'secret_passage', to: 'rex_shirt', label: 'Rex used the passage' },
    { from: 'business_letter', to: 'modified_will', label: 'Motives compound' },
    { from: 'modified_will', to: 'gambling_debts', label: 'James cut from will' },
    { from: 'phone_log', to: 'modified_will', label: 'Isabelle is "M"' },
    { from: 'bell_log', to: 'brandy_glass', label: 'Timing of murder' },
    { from: 'unfinished_letter', to: 'ashworth_diary', label: 'He knew he would die' },
    { from: 'ancient_clock', to: 'tower_journal', label: 'Source of the loop' },
];

// ── EAVESDROP EVENTS ──
const eavesdrops = [
    {
        id: 'rex_ashworth_argument',
        time: 540, location: 'study',
        speakers: 'Lord Ashworth & Rex Dalton',
        lines: [
            { speaker: 'rex', text: 'Victor, you can\'t just shut me out. We built this company together.' },
            { speaker: 'ashworth', text: 'Built it? You embezzled from it. I have the audit report, Rex.' },
            { speaker: 'rex', text: 'Those were authorized transfers—' },
            { speaker: 'ashworth', text: 'Don\'t. I\'ve already spoken to my solicitor. After tonight\'s announcement, our partnership is dissolved.' },
            { speaker: 'rex', text: '...You\'ll regret this, Victor. I promise you that.' },
        ],
        reveals: ['business_dispute', 'rex_motive'],
        timeAdvance: 15,
    },
    {
        id: 'evelyn_rex_garden',
        time: 600, location: 'garden',
        speakers: 'Lady Evelyn & Rex Dalton',
        lines: [
            { speaker: 'evelyn', text: 'He told you about the audit?' },
            { speaker: 'rex', text: 'It\'s over, Evelyn. Everything we planned.' },
            { speaker: 'evelyn', text: 'Nothing is over. We stick to the plan. Tonight, during the gala.' },
            { speaker: 'rex', text: 'Are you sure about this? There\'s no going back.' },
            { speaker: 'evelyn', text: 'I\'ve been married to that man for thirty years. I have never been more sure of anything.' },
        ],
        reveals: ['evelyn_rex_conspiring', 'tonight_plan'],
        timeAdvance: 15,
        requiresLoop: 2,
    },
    {
        id: 'james_phone',
        time: 720, location: 'garden',
        speakers: 'James Ashworth (on phone)',
        lines: [
            { speaker: 'james', text: 'I know, I know. I just need more time.' },
            { speaker: 'james', text: '...No, my father won\'t help. He\'s changing the will — I\'m being cut out.' },
            { speaker: 'james', text: 'You don\'t understand. If he announces it tonight, I\'m finished. Completely finished.' },
            { speaker: 'james', text: 'I\'ll get the money. I\'ll do whatever it takes. Just give me until the end of the week.' },
        ],
        reveals: ['james_debts', 'james_motive'],
        timeAdvance: 10,
    },
    {
        id: 'lily_james_argument',
        time: 960, location: 'drawing_room',
        speakers: 'Lily & James Ashworth',
        lines: [
            { speaker: 'lily', text: 'You need to talk to him, James. Before the gala.' },
            { speaker: 'james', text: 'He won\'t listen. He never listens.' },
            { speaker: 'lily', text: 'I heard Mother on the phone last night. She was talking to someone about "after tonight." It frightened me.' },
            { speaker: 'james', text: 'Mother? She\'s been planning the gala—' },
            { speaker: 'lily', text: 'This wasn\'t about the gala. She said: "Make sure you\'re in position by eleven."' },
        ],
        reveals: ['lily_overheard_evelyn', 'evelyn_suspicious'],
        timeAdvance: 15,
        requiresLoop: 1,
    },
    {
        id: 'cross_ashworth_medical',
        time: 900, location: 'study',
        speakers: 'Lord Ashworth & Dr. Cross',
        lines: [
            { speaker: 'ashworth', text: 'Edmund, the private tests came back. Aconitine. In my blood.' },
            { speaker: 'cross', text: 'My God, Victor. Are you saying someone is—' },
            { speaker: 'ashworth', text: 'Poisoning me. Yes. Slowly, over months. The question is who.' },
            { speaker: 'cross', text: 'We need to go to the police immediately.' },
            { speaker: 'ashworth', text: 'Not yet. I want to know who. And I think I\'m close. I\'ve hired someone to investigate.' },
            { speaker: 'cross', text: 'Hired someone? Who?' },
            { speaker: 'ashworth', text: 'Someone already inside the house.' },
        ],
        reveals: ['ashworth_knew_poisoning', 'hired_investigator', 'aconitine_confirmed'],
        timeAdvance: 15,
        requiresLoop: 2,
    },
    {
        id: 'evelyn_finch_glass',
        time: 1395, location: 'library',
        speakers: 'Lady Evelyn (to herself)',
        lines: [
            { speaker: 'evelyn', text: '...three drops in the brandy... he\'ll be drowsy within minutes...' },
            { speaker: 'evelyn', text: 'Rex will come through the passage. Quick and quiet. Then it\'s over.' },
            { speaker: 'evelyn', text: 'Thirty years. Thirty years of this prison. No more.' },
        ],
        reveals: ['evelyn_confession', 'drugged_brandy_confirmed', 'passage_plan'],
        timeAdvance: 10,
        requiresLoop: 4,
    },
];

// ── DIALOGUE TREES ──
const dialogues = {
    lord_ashworth: {
        greeting: {
            text: 'Lord Ashworth regards you with penetrating gray eyes. "Detective Voss. I trust you slept well? The storm can be... unsettling to those unaccustomed to it."',
            responses: [
                { text: 'Tell me about tonight\'s gala.', next: 'gala' },
                { text: 'You seem troubled, Lord Ashworth.', next: 'troubled' },
                { text: 'Tell me about your family.', next: 'family' },
                { text: 'I\'ll let you get back to your work.', next: null },
            ]
        },
        gala: {
            text: '"The winter gala is an Ashworth tradition. Every year, we gather the family and our closest... associates. This year, I intend to make an important announcement." He pauses. "One that not everyone will appreciate."',
            responses: [
                { text: 'What kind of announcement?', next: 'announcement' },
                { text: 'Who might not appreciate it?', next: 'enemies' },
                { text: 'Thank you. I\'ll be there.', next: null },
            ]
        },
        announcement: {
            text: '"Changes, Detective. Long overdue changes. To the business. To the family. To..." He trails off, staring at something only he can see. "Let\'s just say that after tonight, nothing at Ravenholm will be the same."',
            reveals: ['ashworth_announcement'],
            responses: [
                { text: 'That sounds ominous.', next: 'ominous' },
                { text: 'I see. Thank you.', next: null },
            ]
        },
        ominous: {
            text: 'He smiles — a cold, joyless thing. "Perhaps. But change always is, isn\'t it? The question is whether we shape it, or let it shape us." He turns back to his papers. Something in his tone tells you this conversation is over.',
            responses: [
                { text: 'Leave.', next: null },
            ]
        },
        troubled: {
            text: '"Troubled?" He laughs, but it doesn\'t reach his eyes. "I\'m a man with a large estate, complicated finances, and a family that would happily see me... retired. But troubled? No, Detective. I\'m resolute."',
            reveals: ['ashworth_fears'],
            responses: [
                { text: 'Retired how, exactly?', next: 'retired' },
                { text: 'Your family seems lovely.', next: 'family' },
                { text: 'I understand. Excuse me.', next: null },
            ]
        },
        retired: {
            text: 'His eyes sharpen. "You\'re perceptive. I\'ll give you that." He lowers his voice. "Let me say this: not everyone in this house wishes me well. But I have taken... precautions. I\'m not a man who leaves things to chance."',
            reveals: ['ashworth_precautions'],
            responses: [
                { text: 'What precautions?', next: 'precautions' },
                { text: 'Be careful tonight.', next: null },
            ]
        },
        precautions: {
            text: '"That\'s my concern, not yours." He meets your eyes. "But if something does happen — look in the Study. The safe. 1887. You\'ll understand." He turns away, and you realize he just gave you the combination to his safe. Why?',
            reveals: ['ashworth_safe_hint'],
            flags: ['knows_safe_code'],
            responses: [
                { text: 'I\'ll remember.', next: null },
            ]
        },
        family: {
            text: '"My family." The word tastes bitter in his mouth. "James drinks his inheritance before he\'s earned it. Lily wages war against everything I\'ve built. Evelyn..." A long pause. "Evelyn plays her part beautifully. She always has."',
            responses: [
                { text: 'And your wife?', next: 'about_evelyn' },
                { text: 'Thank you for your candor.', next: null },
            ]
        },
        about_evelyn: {
            text: '"Evelyn is the most dangerous person in this house, Detective. And I say that with admiration." He stares out the window. "She has survived me for thirty years. That is no small feat."',
            reveals: ['ashworth_suspects_evelyn'],
            responses: [
                { text: 'Leave.', next: null },
            ]
        },
        enemies: {
            text: '"Everyone. Change threatens everyone who benefits from the status quo." He counts on his fingers. "My business partner. My wife. My son. Perhaps even my physician, who has been... overly attentive lately."',
            reveals: ['everyone_has_motive'],
            responses: [
                { text: 'That\'s a lot of suspects.', next: null },
            ]
        },
        // Evidence-based dialogue
        confront_poisoning: {
            text: 'His face drains of color. "How did you... yes. I\'ve been poisoned. Slowly, over months. Aconitine — derived from wolfsbane." He grips the desk. "I don\'t know who. But I\'m running out of time to find out."',
            requires: ['ashworth_diary'],
            reveals: ['ashworth_confirms_poison'],
            responses: [
                { text: 'Do you suspect your wife?', next: 'suspect_evelyn' },
                { text: 'Who else knows?', next: 'who_knows' },
                { text: 'We need to get you out of here.', next: 'cant_leave' },
            ]
        },
        suspect_evelyn: {
            text: 'A long silence. "I suspect everyone. But yes... Evelyn had the opportunity. And the motive." He pulls open a drawer. "I changed my will three days ago. She doesn\'t know yet. Or perhaps she does — perhaps that\'s why the poison accelerated."',
            reveals: ['will_change_motive'],
            responses: [
                { text: 'Leave.', next: null },
            ]
        },
        who_knows: {
            text: '"Cross knows — my physician. He\'s been treating the symptoms without realizing the cause. And I\'ve hired someone... Isabelle. She\'s not really James\'s fiancée. She\'s a private investigator. I hired her to find proof."',
            reveals: ['isabelle_truth_from_ashworth'],
            responses: [
                { text: 'Leave.', next: null },
            ]
        },
        cant_leave: {
            text: '"Leave? No, Detective." He gestures at the storm. "The roads are flooded. We\'re trapped here until morning. All of us." He looks at the clock. "And by midnight, I suspect the matter will be... resolved. One way or another."',
            responses: [
                { text: 'Leave.', next: null },
            ]
        },
    },

    lady_evelyn: {
        greeting: {
            text: 'Lady Evelyn turns to you with practiced grace. "Detective Voss. How charming that my husband invited a detective to our little gathering. I do hope you find everything... satisfactory."',
            responses: [
                { text: 'The manor is beautiful.', next: 'manor' },
                { text: 'Tell me about yourself.', next: 'herself' },
                { text: 'I\'m just here to enjoy the gala.', next: 'enjoy' },
                { text: 'Excuse me.', next: null },
            ]
        },
        manor: {
            text: '"Ravenholm has been in the Ashworth family since 1887. I came into it through marriage — a transaction, really. Wealth for status, status for wealth." Her smile is razor-thin. "I\'ve maintained it for thirty years. Every painting, every flower arrangement. This house is more mine than his."',
            responses: [
                { text: 'That sounds lonely.', next: 'lonely' },
                { text: 'Thank you for the history.', next: null },
            ]
        },
        lonely: {
            text: 'A flicker of something real crosses her face — gone in an instant. "Lonely? I have staff, guests, responsibilities. Loneliness is a luxury for people with less to manage." She adjusts a flower in a vase. "Was there anything else?"',
            responses: [
                { text: 'Leave.', next: null },
            ]
        },
        herself: {
            text: '"What would you like to know? I\'m an Ashworth by marriage, a hostess by duty, and a survivor by necessity." She studies you. "We all play our parts here, Detective. Mine is to make sure everything runs smoothly."',
            responses: [
                { text: 'How is your marriage?', next: 'marriage' },
                { text: 'What do you mean by survivor?', next: 'survivor' },
                { text: 'Thank you.', next: null },
            ]
        },
        marriage: {
            text: '"My marriage is an institution, not a romance. Victor and I have an understanding." Her eyes harden. "Or we did, until recently. Things are... changing."',
            reveals: ['evelyn_marriage_trouble'],
            responses: [
                { text: 'Changing how?', next: 'changing' },
                { text: 'I see.', next: null },
            ]
        },
        changing: {
            text: '"Victor has become paranoid. Changing his will, locking his study, whispering on the phone. And he\'s brought strangers into the house." She glances at Isabelle\'s direction. "That girl is not who she claims to be. I can smell a fraud."',
            reveals: ['evelyn_suspects_isabelle'],
            responses: [
                { text: 'Leave.', next: null },
            ]
        },
        survivor: {
            text: '"This family destroys people, Detective. It destroyed Victor\'s first wife. It nearly destroyed me. But I learned to adapt. To watch. To wait." She meets your eyes. "Patience is the greatest weapon."',
            reveals: ['first_wife'],
            responses: [
                { text: 'First wife?', next: 'first_wife' },
                { text: 'Leave.', next: null },
            ]
        },
        first_wife: {
            text: '"Victor was married before me. She died young — officially of pneumonia. But the staff whispered about other things. Victor keeps her portrait in the Tower." A pause. "History has a way of repeating itself in this house."',
            reveals: ['first_wife_death'],
            responses: [
                { text: 'Leave.', next: null },
            ]
        },
        enjoy: {
            text: '"Of course you are." Her tone says she doesn\'t believe you for a moment. "Well, the gala begins at seven. Don\'t be late. And Detective? Do try not to ask too many questions. It makes the other guests... nervous."',
            responses: [
                { text: 'Leave.', next: null },
            ]
        },
        // Evidence confrontation
        confront_letters: {
            text: 'Her composure cracks — just for a moment. "Where did you get those?" She reaches for the letters. "Those are private. That is a private matter between—" She stops. Collects herself. "Rex and I are old friends. Nothing more."',
            requires: ['love_letters'],
            reveals: ['evelyn_affair_confirmed'],
            responses: [
                { text: '"After tonight, we\'ll be free." What does that mean?', next: 'confront_plan' },
                { text: 'I understand. Private matters.', next: null },
            ]
        },
        confront_plan: {
            text: 'Her mask slips completely. Fear — real, raw fear — floods her eyes. "I... that was about leaving Victor. Divorce. That\'s all. Rex was going to help me..." She\'s lying. You can see it. She knows you can see it.',
            reveals: ['evelyn_lying_about_plan'],
            responses: [
                { text: 'I found the poison vial in your jewellery box.', next: 'confront_poison', requires: ['poison_vial'] },
                { text: 'We\'ll talk again later.', next: null },
            ]
        },
        confront_poison: {
            text: 'All color drains from her face. She grips the back of a chair. "That\'s... that\'s for my migraines. A herbal tincture—" She sees your expression and stops. "What are you going to do?"',
            reveals: ['evelyn_caught'],
            responses: [
                { text: 'The truth, Lady Evelyn. All of it.', next: 'full_confession' },
                { text: 'Leave without answering.', next: null },
            ]
        },
        full_confession: {
            text: 'She sits. The mask falls away entirely. "Thirty years. He\'s controlled every aspect of my life. My money. My friends. My freedom." Tears streak her makeup. "Yes. I\'ve been poisoning him. Slowly. And tonight, Rex will finish it." She looks at the clock. "Unless you stop us."',
            reveals: ['evelyn_full_confession'],
            responses: [
                { text: 'I will stop you. Tonight.', next: 'prevent_vow' },
                { text: 'Leave.', next: null },
            ]
        },
        prevent_vow: {
            text: 'She stares at you. "You can try. But Rex is already in position. The brandy is already drugged." A strange light enters her eyes — hope? Relief? "You\'d have to stop Rex. Keep Victor away from the Library after eleven. And somehow make this right." She pauses. "Can you really do that?"',
            reveals: ['prevention_path'],
            responses: [
                { text: 'I\'ve done this before. More times than you know.', next: 'prevention_loop' },
                { text: 'Leave.', next: null },
            ]
        },
        prevention_loop: {
            text: 'Her eyes widen. "You... you remember, don\'t you? The loops. The clock." She touches your hand. "My God. You\'ve been living this day over and over." For the first time, genuine compassion crosses her face. "Then you know how it feels to be trapped. Help me find another way out."',
            reveals: ['evelyn_knows_loops'],
            flags: ['prevention_ready'],
            responses: [
                { text: 'There is another way. I promise.', next: null },
            ]
        },
    },

    james_ashworth: {
        greeting: {
            text: 'James waves you over with a drink in hand — his third of the morning, by the look of him. "Detective! Wonderful. An actual interesting person in this museum. Come, sit."',
            responses: [
                { text: 'Drinking already?', next: 'drinking' },
                { text: 'Tell me about yourself.', next: 'himself' },
                { text: 'What do you know about tonight?', next: 'tonight' },
                { text: 'Maybe later.', next: null },
            ]
        },
        drinking: {
            text: '"Hair of the dog, old sport. Last night\'s drive up here required liquid courage." He grins. "Besides, have you met my family? Sobriety is a liability in this house."',
            responses: [
                { text: 'Tell me about Isabelle.', next: 'isabelle' },
                { text: 'You seem nervous.', next: 'nervous' },
                { text: 'Leave.', next: null },
            ]
        },
        himself: {
            text: '"What\'s to tell? I\'m the heir to Ravenholm — for whatever that\'s worth these days. Father\'s doing his best to make sure I don\'t inherit a penny." Bitterness creeps in. "I have my mother\'s charm and my father\'s enemies. Dangerous combination."',
            responses: [
                { text: 'Why is your father cutting you out?', next: 'cutting_out' },
                { text: 'Leave.', next: null },
            ]
        },
        cutting_out: {
            text: '"Because I\'m a disappointment. Because I gamble. Because I exist." He swirls his drink. "Father has always loved his money more than his children. Now he\'s found a way to keep it even after he\'s gone."',
            reveals: ['james_resentment'],
            responses: [
                { text: 'You sound angry enough to do something about it.', next: 'angry' },
                { text: 'I\'m sorry.', next: null },
            ]
        },
        angry: {
            text: 'He looks at you sharply. "If you\'re asking whether I\'d hurt my father — no. I\'m a disaster, not a monster." He finishes his drink. "Besides, there are others in this house with far better reasons."',
            reveals: ['james_innocent_claim'],
            responses: [
                { text: 'Like who?', next: 'suspects_from_james' },
                { text: 'Leave.', next: null },
            ]
        },
        suspects_from_james: {
            text: '"Rex Dalton is being destroyed by Father\'s audit. Mother hasn\'t genuinely smiled in a decade. Even Dr. Cross — there\'s something he\'s not telling us about Father\'s health." He leans in. "This house is full of people with everything to lose."',
            reveals: ['james_observations'],
            responses: [
                { text: 'Leave.', next: null },
            ]
        },
        tonight: {
            text: '"The gala? Same as every year. Champagne, false smiles, and Father making everyone feel small." He hesitates. "Though this year feels different. Everyone\'s on edge. Mother\'s been whispering with Rex. Lily\'s angrier than usual. Even Finch looks worried."',
            reveals: ['everyone_on_edge'],
            responses: [
                { text: 'Your mother and Rex?', next: 'mother_rex' },
                { text: 'Leave.', next: null },
            ]
        },
        mother_rex: {
            text: '"They\'ve been close for years. \'Old friends,\' she calls it." He makes air quotes. "I\'m not stupid, Detective. I know what they are. The question is whether Father knows." He shrugs. "Maybe that\'s what tonight\'s announcement is about."',
            reveals: ['james_knows_affair'],
            responses: [
                { text: 'Leave.', next: null },
            ]
        },
        isabelle: {
            text: '"Isabelle is..." He pauses, and something genuine softens his face. "She\'s the best thing in my life. Smart, beautiful, far too good for me." He frowns. "Though sometimes I catch her looking at things — studying the house, the family — like she\'s taking notes."',
            reveals: ['james_doubts_isabelle'],
            responses: [
                { text: 'Leave.', next: null },
            ]
        },
        nervous: {
            text: '"Nervous?" He laughs too loudly. "I owe some very unpleasant people a very large amount of money. Father\'s about to announce he\'s cutting me off. And I\'m trapped in a manor during a storm with everyone who wants a piece of me." His smile doesn\'t waver. "What\'s there to be nervous about?"',
            reveals: ['james_debts_hint'],
            responses: [
                { text: 'Leave.', next: null },
            ]
        },
    },

    lily_ashworth: {
        greeting: {
            text: 'Lily looks up from her book with guarded eyes. "You\'re the detective Father invited. I suppose he thinks having you here will... deter whatever he\'s afraid of."',
            responses: [
                { text: 'What is he afraid of?', next: 'afraid' },
                { text: 'You don\'t seem happy to be here.', next: 'unhappy' },
                { text: 'I\'m just a guest.', next: 'just_guest' },
                { text: 'Leave.', next: null },
            ]
        },
        afraid: {
            text: '"Everything. Nothing. The consequences of his own actions." She closes her book. "My father built an empire on the suffering of others. Now the empire is crumbling. And he wants a detective to keep the walls standing."',
            reveals: ['lily_perspective'],
            responses: [
                { text: 'Tell me about the family.', next: 'family_lily' },
                { text: 'Leave.', next: null },
            ]
        },
        unhappy: {
            text: '"I haven\'t been happy at Ravenholm since I was twelve. That\'s when I realized what this family really is." She meets your eyes. "We\'re not aristocrats, Detective. We\'re prisoners. Father is the warden."',
            responses: [
                { text: 'Have you thought about leaving?', next: 'leaving' },
                { text: 'Leave.', next: null },
            ]
        },
        leaving: {
            text: '"Every day. But he controls the money. All of it. Even James\'s allowance, even Mother\'s pin money." Her jaw tightens. "After tonight, one way or another, I\'m done. I wrote him a letter. Left it in the piano bench."',
            reveals: ['lily_leaving'],
            responses: [
                { text: 'Leave.', next: null },
            ]
        },
        just_guest: {
            text: '"Detectives are never just guests." A hint of a smile. "But fine. If you\'re \'just a guest,\' then let me give you a guest\'s advice: don\'t trust anyone in this house. Including me."',
            responses: [
                { text: 'Why shouldn\'t I trust you?', next: 'trust_lily' },
                { text: 'Leave.', next: null },
            ]
        },
        trust_lily: {
            text: '"Because I want my father\'s empire to fall. Because I\'ve wished terrible things on this family. Because—" She catches herself. "But I didn\'t DO anything. Wanting change and causing harm are different things."',
            reveals: ['lily_desires'],
            responses: [
                { text: 'Leave.', next: null },
            ]
        },
        family_lily: {
            text: '"James is self-destructing. Mother is a statue. Rex is a leech. Dr. Cross covers up everything Father tells him to. Isabelle—" She pauses. "I like Isabelle. But she\'s hiding something. I can tell."',
            reveals: ['lily_observations'],
            responses: [
                { text: 'What about Father Thomas?', next: 'about_thomas' },
                { text: 'Leave.', next: null },
            ]
        },
        about_thomas: {
            text: '"Father Thomas is the only decent person here. He\'s heard everyone\'s confessions. If anyone knows the truth about this family, it\'s him." She lowers her voice. "But he\'s bound by his vows. He can\'t tell you what he knows. Even if it would save someone\'s life."',
            reveals: ['thomas_knows_everything'],
            responses: [
                { text: 'Leave.', next: null },
            ]
        },
    },

    dr_cross: {
        greeting: {
            text: 'Dr. Cross adjusts his glasses and offers a warm, slightly nervous handshake. "Detective Voss. I understand you\'re a friend of Victor\'s? He doesn\'t have many of those left."',
            responses: [
                { text: 'How is Lord Ashworth\'s health?', next: 'health' },
                { text: 'You\'ve known the family long?', next: 'long_time' },
                { text: 'Anything unusual about this gathering?', next: 'unusual' },
                { text: 'Just checking in. Goodbye.', next: null },
            ]
        },
        health: {
            text: 'His smile freezes. "Patient confidentiality, I\'m afraid. But... between us? He\'s not well. Persistent symptoms that don\'t respond to treatment. I\'ve been worried." He cleans his glasses — a nervous habit. "Very worried."',
            reveals: ['cross_concerned'],
            responses: [
                { text: 'What kind of symptoms?', next: 'symptoms' },
                { text: 'Leave.', next: null },
            ]
        },
        symptoms: {
            text: '"Headaches. Nausea. Tremors in his hands. At first I thought stress — he\'s under enormous pressure. But the progression..." He trails off. "It\'s not natural. I should have pushed harder for proper testing. I should have—" He stops. "Forgive me. I\'ve said too much."',
            reveals: ['cross_guilt'],
            responses: [
                { text: 'Leave.', next: null },
            ]
        },
        long_time: {
            text: '"Thirty years. I delivered both children. I\'ve patched up every Ashworth crisis, medical and otherwise." He looks tired. "This family takes a toll on those who serve it."',
            responses: [
                { text: 'Leave.', next: null },
            ]
        },
        unusual: {
            text: '"Everything. The tension is thicker than I\'ve ever seen it. Victor is paranoid. Evelyn is icy. Rex looks like a man waiting for a verdict." He lowers his voice. "And Victor asked me to examine his blood privately. What he told me..." He shakes his head. "I can\'t say."',
            reveals: ['cross_blood_test'],
            responses: [
                { text: 'He told you about the poisoning?', next: 'cross_poisoning', requires: ['ashworth_diary'] },
                { text: 'Leave.', next: null },
            ]
        },
        cross_poisoning: {
            text: 'He goes pale. "He told you? Yes. Aconitine. A plant-based toxin — wolfsbane. Administered in small doses over months." His hands shake. "I should have caught it sooner. The symptoms mimicked stress perfectly. Whoever did this knew exactly what they were doing."',
            reveals: ['cross_confirms_aconitine'],
            responses: [
                { text: 'Who had access to wolfsbane?', next: 'who_access' },
                { text: 'Leave.', next: null },
            ]
        },
        who_access: {
            text: '"There\'s wolfsbane in the greenhouse. Lady Evelyn tends the garden. Mrs. Blackwood uses herbs in the kitchen. Even Lily spends time in the greenhouse." He wrings his hands. "But to administer it regularly? That requires intimate access to his food or drink. His nightcap. His tea."',
            reveals: ['wolfsbane_access'],
            responses: [
                { text: 'Leave.', next: null },
            ]
        },
    },

    rex_dalton: {
        greeting: {
            text: 'Rex Dalton eyes you with the suspicion of a man who measures everyone as a threat. "Detective. Didn\'t realize Victor was paranoid enough to hire personal security." He lights a cigarette. "Or maybe it\'s not paranoia."',
            responses: [
                { text: 'Tell me about your business with Lord Ashworth.', next: 'business' },
                { text: 'You seem tense.', next: 'tense' },
                { text: 'Nice evening for a gala.', next: 'gala_talk' },
                { text: 'Just passing through.', next: null },
            ]
        },
        business: {
            text: '"Ashworth-Dalton Holdings. Thirty years of empire-building, and now he wants to tear it all down because of some... irregularities." He exhales smoke. "Every business has grey areas. Victor just decided mine were darker than his."',
            reveals: ['rex_business'],
            responses: [
                { text: 'What irregularities?', next: 'irregularities' },
                { text: 'Leave.', next: null },
            ]
        },
        irregularities: {
            text: '"Offshore accounts. Restructured funds. Nothing that doesn\'t happen in every major firm." His jaw clenches. "But Victor commissioned an audit. And now he\'s threatening to dissolve the partnership and go public." He stubs out his cigarette. "It would destroy me."',
            reveals: ['rex_motive_details'],
            responses: [
                { text: 'That gives you motive.', next: 'motive_rex' },
                { text: 'Leave.', next: null },
            ]
        },
        motive_rex: {
            text: 'He gets very close. "Everyone in this house has motive, Detective. I\'m just the one honest enough to admit it." His eyes are dangerous. "But I didn\'t come here to kill anyone. I came here to negotiate. If Victor won\'t listen to reason..." He doesn\'t finish.',
            reveals: ['rex_threat'],
            responses: [
                { text: 'Leave.', next: null },
            ]
        },
        tense: {
            text: '"Wouldn\'t you be? My entire life\'s work is about to be dismantled by a vindictive old man." He pours a drink. "I built that company as much as he did. More, arguably. And now he wants to take it all because he found out about—" He stops himself.',
            reveals: ['rex_almost_reveals'],
            responses: [
                { text: 'Found out about what?', next: 'found_out' },
                { text: 'Leave.', next: null },
            ]
        },
        found_out: {
            text: '"Business decisions. That\'s all." He\'s a terrible liar when cornered. "Look, I\'m not the villain here. Talk to the wife. Talk to the son. Everyone in this family is circling like vultures."',
            responses: [
                { text: 'Leave.', next: null },
            ]
        },
        gala_talk: {
            text: '"Nice? It\'s a performance. Victor gathers his court, makes his announcements, reminds everyone who holds the power." He sneers. "Not for much longer."',
            responses: [
                { text: 'Leave.', next: null },
            ]
        },
        confront_affair: {
            text: 'His face turns to stone. "Where did you get those?" A long pause. "Evelyn and I... yes. For years now. Victor trapped her in a loveless marriage. I offered her something real." His voice drops. "We were going to leave together. After tonight."',
            requires: ['love_letters'],
            reveals: ['rex_admits_affair'],
            responses: [
                { text: '"Trust the plan." What plan?', next: 'rex_plan' },
                { text: 'Leave.', next: null },
            ]
        },
        rex_plan: {
            text: '"The plan was to LEAVE. Take what\'s ours and disappear." He\'s sweating. "That\'s all. Just... leave. Nothing else." He can\'t meet your eyes. He\'s lying, and you both know it.',
            reveals: ['rex_lying'],
            responses: [
                { text: 'Leave.', next: null },
            ]
        },
    },

    isabelle_moreau: {
        greeting: {
            text: 'Isabelle offers a charming smile, but her eyes are scanning, cataloguing, assessing. "Detective Voss, oui? James mentioned you. It is so nice to meet another outsider in this... unique family."',
            responses: [
                { text: 'How did you and James meet?', next: 'met_james' },
                { text: 'You\'re very observant for a guest.', next: 'observant' },
                { text: 'What do you think of the Ashworths?', next: 'ashworths' },
                { text: 'Pleasure. Excuse me.', next: null },
            ]
        },
        met_james: {
            text: '"At a charity function in London. He was charming, funny, hopelessly in debt." She laughs softly. "I know what he is. But there is something good in him, underneath the recklessness. I believe that."',
            responses: [
                { text: 'Do you love him?', next: 'love_james' },
                { text: 'Leave.', next: null },
            ]
        },
        love_james: {
            text: 'A pause that says everything. "I care for him deeply. Whether that is love..." She looks away. "It is complicated. More complicated than you know."',
            reveals: ['isabelle_conflicted'],
            responses: [
                { text: 'Leave.', next: null },
            ]
        },
        observant: {
            text: 'Her smile doesn\'t waver, but her eyes sharpen. "Am I? Perhaps I am simply curious. This manor, this family — it is like a novel. Everyone has secrets." She tilts her head. "Even you, Detective."',
            reveals: ['isabelle_deflecting'],
            responses: [
                { text: 'Who are you really, Isabelle?', next: 'who_really', requires: ['phone_log'] },
                { text: 'Leave.', next: null },
            ]
        },
        who_really: {
            text: 'The mask slips. She glances around, then pulls you aside. "Not here. Meet me in the Garden at 3 PM. I\'ll tell you everything." She walks away without another word.',
            reveals: ['isabelle_will_confess'],
            flags: ['isabelle_garden_3pm'],
            responses: [
                { text: 'Leave.', next: null },
            ]
        },
        ashworths: {
            text: '"A family of contradictions. They love each other and destroy each other in equal measure." She pauses. "Lord Ashworth is dying — whether he knows it or not. The question is whether someone is helping him along."',
            reveals: ['isabelle_suspects'],
            responses: [
                { text: 'Leave.', next: null },
            ]
        },
        secret_meeting: {
            text: '"You came." She checks that no one followed you. "My name is Isabelle Moreau, but I am not James\'s fiancée. I am a private investigator. Lord Ashworth hired me three months ago to investigate his wife." She hands you a file. "Lady Evelyn has been slowly poisoning her husband with aconitine. I have proof."',
            requires: ['isabelle_garden_3pm'],
            reveals: ['isabelle_is_PI', 'isabelle_proof'],
            location: 'garden',
            timeWindow: { start: 900, end: 960 },
            responses: [
                { text: 'What proof?', next: 'isabelle_proof' },
                { text: 'Leave.', next: null },
            ]
        },
        isabelle_proof: {
            text: '"I photographed the vial in her jewellery box. I have records of her purchasing wolfsbane from a herbalist in London. And I witnessed her meeting with Rex Dalton — they are having an affair, and they are planning something for tonight." She looks scared. "I was going to present everything to Lord Ashworth at midnight. But now I am afraid I will be too late."',
            reveals: ['isabelle_full_evidence'],
            responses: [
                { text: 'Leave.', next: null },
            ]
        },
    },

    father_thomas: {
        greeting: {
            text: 'Father Thomas sets down his prayer book with trembling hands. "Ah, Detective. I have been... expecting someone would come to talk to me. The weight of what I carry..." He trails off. "Forgive me. I speak in riddles."',
            responses: [
                { text: 'What weight do you carry?', next: 'weight' },
                { text: 'You look troubled.', next: 'troubled_thomas' },
                { text: 'Tell me about the family.', next: 'family_thomas' },
                { text: 'I\'ll leave you to your prayers.', next: null },
            ]
        },
        weight: {
            text: '"The seal of confession, Detective. I have heard things — terrible things — that I cannot repeat. Not without breaking my sacred vow." His eyes are haunted. "But I will tell you this: someone in this house intends great harm tonight. And I am powerless to prevent it."',
            reveals: ['thomas_warning'],
            responses: [
                { text: 'Can you tell me who?', next: 'who_thomas' },
                { text: 'Leave.', next: null },
            ]
        },
        who_thomas: {
            text: '"I cannot name names. But..." He chooses his words with agonizing care. "If you look at who has the most to gain from Lord Ashworth\'s death — and who has the means — the truth is not well hidden." He meets your eyes. "Follow the love that shouldn\'t exist. That is all I can say."',
            reveals: ['thomas_hint'],
            responses: [
                { text: 'Leave.', next: null },
            ]
        },
        troubled_thomas: {
            text: '"I have served this family\'s spiritual needs for twenty years. In that time, I have heard confessions that would curdle your blood." He clutches his prayer beads. "And now I fear one of those confessions is about to become reality."',
            reveals: ['thomas_fears'],
            responses: [
                { text: 'Leave.', next: null },
            ]
        },
        family_thomas: {
            text: '"They are broken, Detective. All of them. Lord Ashworth rules through fear. Lady Evelyn endures through ice. James drowns. Lily burns." He sighs. "And the rest of us? We enable it. We serve it. We absolve it. God forgive us."',
            reveals: ['thomas_family_view'],
            responses: [
                { text: 'Leave.', next: null },
            ]
        },
        confront_confession: {
            text: 'He closes his eyes. "You know, then. About the confession." A long silence. "Lady Evelyn came to me a week ago. She told me she was going to free herself from her marriage. Permanently." Tears roll down his cheeks. "I told her it was a mortal sin. She said: \'Some sins are worth the damnation.\'"',
            requires: ['love_letters', 'poison_vial'],
            reveals: ['thomas_confirms_evelyn'],
            responses: [
                { text: 'Will you testify?', next: 'testify' },
                { text: 'Leave.', next: null },
            ]
        },
        testify: {
            text: '"I... cannot break the seal of confession. Not even for this." He weeps. "But if you confront her — if you gather enough evidence — she will confess to you. I know she will. Because underneath the ice, there is still a soul that wants to be caught. That wants to be stopped."',
            reveals: ['thomas_advice'],
            responses: [
                { text: 'Leave.', next: null },
            ]
        },
    },

    mrs_blackwood: {
        greeting: {
            text: 'Mrs. Blackwood regards you with the composed expression of someone who has seen everything and is surprised by nothing. "Detective. Can I help you? I have a gala to prepare."',
            responses: [
                { text: 'What have you seen today?', next: 'seen' },
                { text: 'Tell me about the household.', next: 'household' },
                { text: 'About the brandy in the Library...', next: 'brandy_question', requires: ['brandy_note'] },
                { text: 'I\'ll let you work.', next: null },
            ]
        },
        seen: {
            text: '"What have I seen? I see everything, Detective. Twenty years in this house, you learn to watch." She polishes a glass methodically. "I see Lady Evelyn whispering with Mr. Dalton. I see Master James drinking before noon. I see Lord Ashworth growing thinner by the week."',
            reveals: ['blackwood_observant'],
            responses: [
                { text: 'Lady Evelyn and Rex?', next: 'evelyn_rex' },
                { text: 'Lord Ashworth is growing thinner?', next: 'ashworth_health_bw' },
                { text: 'Leave.', next: null },
            ]
        },
        evelyn_rex: {
            text: '"They think they\'re discreet. They are not." She doesn\'t look up from her work. "I\'ve seen the looks. The notes. The late-night meetings in the garden." A pause. "It is not my place to judge. But it is my place to notice."',
            reveals: ['blackwood_knows_affair'],
            responses: [
                { text: 'Leave.', next: null },
            ]
        },
        ashworth_health_bw: {
            text: '"He\'s been unwell for months. Claims it\'s stress, but I\'ve cooked for the family for twenty years. I know what a stressed man looks like. This is different." She sets down the glass. "Someone is making Lord Ashworth sick. And I think they\'re doing it through his food."',
            reveals: ['blackwood_suspects_poisoning'],
            responses: [
                { text: 'Who prepares his food?', next: 'food_prep' },
                { text: 'Leave.', next: null },
            ]
        },
        food_prep: {
            text: '"I prepare all meals. But Lady Evelyn insists on preparing his evening tea herself. \'A wife\'s duty,\' she says." Mrs. Blackwood\'s expression is carefully neutral. "She also manages his nightcap. His brandy."',
            reveals: ['evelyn_prepares_drinks'],
            responses: [
                { text: 'Leave.', next: null },
            ]
        },
        household: {
            text: '"Ravenholm runs on schedules and secrets, Detective. I manage the former; the family provides the latter." She pauses. "Mr. Finch manages Lord Ashworth\'s personal needs. I manage the house. Between us, we know where every body is buried." She catches herself. "Metaphorically speaking."',
            responses: [
                { text: 'Leave.', next: null },
            ]
        },
        brandy_question: {
            text: 'She stiffens. "Lady Evelyn asked me to move a specific brandy to the Library. For Lord Ashworth\'s nightcap after the gala." She meets your eyes. "I thought nothing of it at the time. But the brandy she chose — it wasn\'t from our cellar. She brought it herself."',
            reveals: ['special_brandy'],
            responses: [
                { text: 'Where did she get it?', next: 'brandy_source' },
                { text: 'Leave.', next: null },
            ]
        },
        brandy_source: {
            text: '"I don\'t know. She had it delivered yesterday — a private package. I only noticed because I handle all deliveries." Her voice drops. "Detective, I\'ve worked for this family for twenty years. I owe them my livelihood. But something is wrong in this house. Very wrong."',
            reveals: ['brandy_privately_sourced'],
            responses: [
                { text: 'Leave.', next: null },
            ]
        },
        // Critical testimony for after midnight
        midnight_testimony: {
            text: '"I saw her." Mrs. Blackwood\'s composure finally cracks. "At 11:45 PM. Lady Evelyn. She wasn\'t in the kitchen like she claimed. She was coming OUT of the Library. She had something in her hand — a small vial." She grips the counter. "I said nothing. God help me, I said nothing."',
            requires: ['brandy_glass'],
            reveals: ['blackwood_testimony'],
            responses: [
                { text: 'Thank you for telling me.', next: null },
            ]
        },
    },

    mr_finch: {
        greeting: {
            text: 'Mr. Finch stands at attention, his expression revealing nothing. "Detective Voss. Is there something you require? I am at Lord Ashworth\'s service — and by extension, yours."',
            responses: [
                { text: 'You\'re very loyal to Lord Ashworth.', next: 'loyalty' },
                { text: 'Tell me about the household staff.', next: 'staff' },
                { text: 'Have you noticed anything unusual?', next: 'unusual_finch' },
                { text: 'No, thank you.', next: null },
            ]
        },
        loyalty: {
            text: '"I have served Lord Ashworth since before the children were born. He is a difficult man. A demanding man. But he is also a fair one — to those who serve him well." His eyes flicker. "I would do anything for this family."',
            reveals: ['finch_loyalty'],
            responses: [
                { text: 'Anything?', next: 'anything' },
                { text: 'Leave.', next: null },
            ]
        },
        anything: {
            text: 'A long pause. "Within reason, Detective. Within reason." But something in his voice suggests the bounds of reason are... flexible.',
            responses: [
                { text: 'Leave.', next: null },
            ]
        },
        staff: {
            text: '"Mrs. Blackwood manages the kitchen and household. I manage Lord Ashworth\'s personal affairs and the manor\'s security." He straightens his cuffs. "Between us, we maintain the illusion of order. Some days, the illusion is all there is."',
            responses: [
                { text: 'Leave.', next: null },
            ]
        },
        unusual_finch: {
            text: '"Unusual?" He considers. "Mr. Dalton arrived agitated. Lady Evelyn has been making unusual requests — rearranging the Library, requesting specific brandy. And Miss Moreau..." He pauses. "She is not what she presents herself to be."',
            reveals: ['finch_observations'],
            responses: [
                { text: 'What do you mean about Isabelle?', next: 'finch_isabelle' },
                { text: 'Leave.', next: null },
            ]
        },
        finch_isabelle: {
            text: '"I found her in the Study yesterday, going through Lord Ashworth\'s papers. When I confronted her, she said she was looking for a pen." His mustache twitches. "One does not search a locked desk drawer for a pen."',
            reveals: ['isabelle_snooping_confirmed'],
            responses: [
                { text: 'Leave.', next: null },
            ]
        },
        // After midnight confrontation
        confront_glass: {
            text: 'His composure cracks. "She asked me to dispose of it. Lady Evelyn. The brandy glass. After... after they found him." He looks down. "I did as she asked. Because I always do as the family asks." His hands tremble. "It\'s in the kitchen. I couldn\'t bring myself to actually destroy it."',
            requires: ['brandy_glass'],
            reveals: ['finch_hid_glass'],
            flags: ['glass_recovered'],
            responses: [
                { text: 'You did the right thing telling me.', next: null },
            ]
        },
    },
};

// ── INTRO SEQUENCE ──
const introSequence = [
    'December 21st. The shortest day of the year.',
    'The invitation arrived three days ago — gold leaf on black card. "Lord Victor Ashworth requests the honour of your company at the annual Winter Gala, Ravenholm Manor."',
    'You are Detective Alex Voss. You came because Lord Ashworth asked. He said he needed someone he could trust. Someone outside the family.',
    'The drive took four hours through worsening rain. The manor appeared through the storm like a ship emerging from fog — ancient, imposing, wrong.',
    'You arrived at midnight. Everyone was already here. Everyone was already watching.',
    'Now it is 6:00 AM. The storm hasn\'t stopped. The roads are flooded. And something terrible is going to happen tonight.',
    'You can feel it. The way you can feel a storm before it breaks.',
    'The question is: can you stop it?',
];

// ── LOOP MESSAGES ──
const loopMessages = [
    'The clock strikes twelve. Lord Ashworth is dead. And the world... rewinds.',
    'Again. The same morning. The same rain. But this time, you remember.',
    'The loop tightens. You know more. You see more. But midnight still comes.',
    'Each loop, the truth gets clearer. Each loop, the clock gets louder.',
    'You\'re close. The pieces are almost in place. One more loop...',
    'The clock ticks. Midnight approaches. But this time, you\'re ready.',
];

// ── ENDING CONDITIONS ──
const endings = {
    true_justice: {
        title: 'True Justice',
        requires: { suspect: 'lady_evelyn', accomplice: 'rex_dalton',
            evidence: ['poison_vial', 'love_letters', 'secret_passage', 'brandy_glass', 'blackwood_testimony'] },
        text: 'You present the evidence before the gathered guests, and the ballroom falls silent. Every eye turns to Lady Evelyn. For one long moment, her mask holds — the practiced smile, the dignified composure. Then it crumbles, piece by piece, like a portrait dissolving in rain.\n\nRex makes for the door, but Mr. Finch is already there, blocking the exit with the quiet authority of a man who has waited decades for this moment. There is nowhere to run in a house this old. The walls themselves are witnesses.\n\nThe truth pours out like blood from a wound. Thirty years of a loveless marriage. A desperate affair born in whispered garden meetings and hidden letters. A plan hatched in poison and executed with surgical patience — aconitine in the brandy, Rex through the secret passage to ensure the deed was done. They killed Lord Ashworth not out of madness, but out of a cold, calculated need to be free.\n\nAs you speak the last words of your accusation, the grandfather clock in the hallway strikes midnight. But this time, the world does not rewind. The ancient mechanism in the tower emits a single, clear tone — like a bell being struck for the last time — and falls silent. The gears stop. The humming fades. The loop shatters like glass.\n\nOutside, the rain begins to ease. December 22nd dawns for the first time in an eternity. Justice, at last, has broken the cycle.',
        rating: 'Perfect Ending',
    },
    partial_truth: {
        title: 'A Crack in the Case',
        requires: { suspect: 'lady_evelyn',
            minEvidence: 3 },
        text: 'You level your accusation at Lady Evelyn before the assembled guests, and the ballroom divides like a courtroom. She denies it, of course — her voice steady, her chin raised, every inch the lady of the manor. But your evidence is a blade, and it cuts through her composure in ways the guests cannot ignore.\n\nWhispers ripple through the crowd. James stares at his mother with dawning horror. Lily closes her eyes, as if she always knew. Rex Dalton stands very still in the corner, his face a careful blank — his role in the conspiracy still hidden, a shadow behind the shadow.\n\nThe police are called. The investigation will continue through the night and into the weeks that follow. You have cracked the case open, but the full truth — the accomplice, the secret passage, the depth of the betrayal — remains buried in the foundations of Ravenholm Manor.\n\nAs midnight strikes, the loop breaks. The ancient clock in the tower winds down with a weary sigh. You step outside into the cold December air. The rain has stopped, but the clouds remain. Some justice is better than none — but a detective never forgets the questions left unanswered.',
        rating: 'Good Ending',
    },
    wrong_accusation: {
        title: 'The Wrong Thread',
        requires: { suspectNot: 'lady_evelyn' },
        text: 'You make your accusation with conviction, laying out your evidence before the gathered guests. The room holds its breath. For a moment, you believe you have it — the motive, the means, the opportunity all aligned.\n\nBut the true killers know better. Across the ballroom, Lady Evelyn and Rex Dalton exchange the briefest of glances — not relief, exactly, but something colder. Satisfaction. They have watched you chase the wrong shadow through every room in this house, and your failure is their freedom.\n\nThe accused protests their innocence. The guests murmur. The evidence, examined in the harsh light of scrutiny, falls apart like wet paper. You were close — you could feel the shape of the truth — but you pulled the wrong thread, and the tapestry unraveled in your hands.\n\nThe grandfather clock strikes twelve. The world shudders, blurs, and rewinds. You wake with a gasp in your guest room. 6:00 AM. The rain. The same rain. But you are not the same detective who woke here last time. You know one more thing now: who didn\'t do it. And in a house full of liars, even that is progress.',
        rating: 'Try Again',
        continuesLoop: true,
    },
    prevention: {
        title: 'Midnight Never Comes',
        requires: { flags: ['evelyn_full_confession'], minLoop: 5 },
        text: 'Armed with the full, terrible truth — every confession, every piece of evidence, every thread of conspiracy woven through this house of lies — you make your move before the killers can make theirs. At 11 PM, while the gala still glitters and the champagne still flows, you confront Lady Evelyn in the drawing room.\n\nShe sees it in your eyes: you know everything. The poison. The affair. The plan with Rex. The secret passage. The brandy that was meant to be Lord Ashworth\'s last drink. Her composure shatters, not with a scream, but with silence — the silence of a woman who realizes the game is over before the final move.\n\nRex Dalton never reaches the Library. Mr. Finch, quietly informed, locks the cellar passage. Dr. Cross is summoned to Lord Ashworth\'s side. And Lord Ashworth — stubborn, paranoid, brilliant Lord Ashworth — lives to see another morning for the first time in what feels like forever.\n\nThe ancient clock in the tower chimes once at midnight. Not the heavy, grinding toll of the loop resetting, but a single, pure note — clear as a church bell, clean as absolution. The mechanism exhales. The gears slow. The humming that has saturated Ravenholm Manor like a fever finally, mercifully, stops.\n\nAs dawn breaks on December 22nd — a day that hasn\'t existed in a very long time — the rain stops too. Light spills over the moor, touching the garden, the greenhouse, the stone walls of the manor. Lord Ashworth stands at his window, alive, watching the sunrise with the expression of a man who has been given a gift he doesn\'t yet understand. The loop was never about justice after the fact. It was about this: prevention. Not punishment, but salvation. Not solving the crime, but stopping it.',
        rating: 'Perfect Ending — True Resolution',
    },
    clock_secret: {
        title: 'The Clockmaker\'s Truth',
        requires: { evidence: ['ancient_clock', 'tower_journal'] },
        text: 'You discovered the source of the loop, and it is older than murder, older than the Ashworth family, older than the manor itself. In the tower room, bathed in cold blue light, the ancient clock mechanism hums with the voice of something that was never meant to be found.\n\nLord Ashworth\'s journal tells the story: he discovered the mechanism beneath the cellar years ago, buried in stone older than recorded history. He studied it obsessively, convinced he could harness its power. "If I can control time itself," he wrote, "death becomes optional." The irony is exquisite — a man trying to cheat death who instead created an endless loop of his own murder.\n\nYou stand before the mechanism now. Its gears turn with impossible precision, etched with symbols that predate any language you recognize. The humming fills your chest, your skull, your bones. This is not a clock. This is something else entirely — a device built by hands unknown, for purposes unknowable, and Lord Ashworth merely stumbled upon its smallest function.\n\nYou reach out and touch the central gear. The metal is ice-cold and vibrating. The gears slow. The humming drops in pitch, like a great beast exhaling its last breath. The blue light flickers, dims, and dies. Silence floods the tower room — real silence, for the first time since the loop began.\n\nThe loop breaks. The murder, unsolved, will play out one final time. But the mechanism is still, and whatever ancient intelligence designed it has moved on to longer, stranger games. You descend the spiral staircase into a house that will finally see tomorrow. The mystery of who made the clock, and why, will follow you for the rest of your life — a question without an answer, humming softly in the back of your mind like a gear that never quite stops turning.',
        rating: 'Secret Ending',
    },
    surrender: {
        title: 'Endless Night',
        requires: {},
        text: 'The clock strikes twelve. Lord Ashworth dies in the Library, a glass of poisoned brandy at his side. The world shudders, blurs, and rewinds. 6:00 AM. The guest room. The rain.\n\nYou\'ve lived this day more times than you can count. You know the rhythm of the house by heart — when Mrs. Blackwood starts the range, when James pours his first drink, when Lily walks the garden in the rain, when Rex makes his angry phone calls, when Lady Evelyn arranges flowers with hands that will later arrange a murder. You know all of it, and none of it is enough.\n\nSo you stop. You sit on the edge of your bed, hands on your knees, and listen to the rain. The storm doesn\'t care about your investigation. The clock doesn\'t care about justice. The loop will continue whether you fight or surrender, and somewhere in the space between exhaustion and despair, you choose to let go.\n\nThe day plays out around you like a film you\'ve seen too many times. The gala glitters. The champagne flows. The music plays. And at midnight, a man dies in a library, and the world resets, and a detective sits in a guest room staring at rain-streaked glass, and the loop continues. It always continues. The storm never breaks. The clock never stops. And some mysteries — the ones that live in old houses, in old families, in the spaces between the ticking of ancient gears — are never solved.',
        rating: 'Dark Ending',
    },
};

// ── NPC TIME-OF-DAY GREETINGS ──
const npcGreetings = {
    lord_ashworth: {
        morning: 'Lord Ashworth looks up from his morning coffee, his gray eyes sharp despite the early hour. "Ah, Detective Voss. Early riser, are you? Good. Join me — I find the morning is the only honest hour in this house."',
        afternoon: 'Lord Ashworth regards you over steepled fingers. "Back again, Detective? I trust you\'re finding your stay... productive. The afternoon has a way of revealing what the morning hides."',
        evening: 'Lord Ashworth adjusts his cufflinks with practiced precision. "The evening draws on, Detective. The gala will begin soon. I hope you\'ve had time to... observe." His tone carries the weight of a man who knows what\'s coming.',
        night: '"It\'s rather late for social calls, isn\'t it, Detective?" Lord Ashworth\'s voice is lower now, rougher. The firelight catches the hollows beneath his eyes. "But then, the night brings out the truth in people. Ask your questions."',
    },
    lady_evelyn: {
        morning: 'Lady Evelyn sips her tea with mechanical grace. "Good morning, Detective. I trust the guest room was adequate? We do pride ourselves on hospitality here." Her smile is porcelain and just as cold.',
        afternoon: '"Detective Voss." Lady Evelyn acknowledges you without looking up from her flower arrangement. "I\'m rather busy with gala preparations. I hope this won\'t take long." Every petal she places feels like a calculated move.',
        evening: 'Lady Evelyn stands in the doorway, resplendent in her gala preparation. "Ah, Detective. Don\'t you look handsome. The gala is nearly upon us — I do hope you\'ll enjoy yourself." Her eyes say something entirely different from her mouth.',
        night: '"Still prowling the halls, Detective?" Lady Evelyn\'s composure is flawless even at this hour, but her fingers grip her champagne glass a fraction too tight. "Some things are best left until morning."',
    },
    james_ashworth: {
        morning: 'James squints at you through bloodshot eyes, nursing what appears to be his third coffee. "God, Detective, it\'s too early for interrogations. Come back when the room stops spinning."',
        afternoon: 'James waves you over with a tumbler in hand. "Detective! Thank God, someone worth talking to. This house is like a mausoleum in the afternoons. Drink?" He\'s already pouring before you can answer.',
        evening: '"Evening, Detective." James straightens his tie with unsteady hands. "The gala approaches. Father\'s big night. Everyone\'s pretending to be excited." He drains his glass. "I\'m pretending hardest of all."',
        night: 'James is deep in his cups, his charm fraying at the edges. "Detective Voss! My favorite person in this... this gilded prison. Sit, sit. The night is young and I have opinions about everyone in this family."',
    },
    lily_ashworth: {
        morning: 'Lily looks up from her journal, rain-damp hair framing her fierce expression. "You\'re up early, Detective. Good. The morning is when people forget to wear their masks. Pay attention today."',
        afternoon: '"Detective." Lily sets down her book with a measured sigh. "Another afternoon trapped in the amber of this house. Have you noticed how time moves differently here? Or is that just me?"',
        evening: 'Lily stands by the window, watching the last light die. "Evening, Detective. The gala is almost here. Everyone is getting dressed up to play their parts." She turns to you. "I refuse to play mine."',
        night: '"Still investigating, Detective? Good." Lily\'s eyes burn with quiet intensity in the dim light. "The night is when this family shows its true face. Don\'t trust the smiles. Don\'t trust the tears."',
    },
    dr_cross: {
        morning: 'Dr. Cross adjusts his spectacles and offers a warm, if weary, handshake. "Good morning, Detective. I find the mornings here... bracing. The coffee is excellent, at least. Victor always did have good taste in coffee."',
        afternoon: '"Ah, Detective Voss." Dr. Cross looks up from his medical journal, a pen still in hand. "The afternoon drags on, doesn\'t it? I find myself checking Lord Ashworth\'s vitals more than I probably should. Old habits."',
        evening: 'Dr. Cross stands near the fireplace, his medical bag at his feet as always. "Evening, Detective. I must say, I have a... premonition about tonight. Call it a doctor\'s instinct." His hands tremble slightly.',
        night: '"Detective." Dr. Cross\'s voice is hushed, his kind eyes shadowed with worry. "I don\'t like the feel of tonight. Victor looked unwell at dinner. I wanted to examine him but he waved me off. Stubborn man."',
    },
    rex_dalton: {
        morning: 'Rex Dalton barely glances up from his phone, jaw tight. "Detective. Bit early for whatever this is, isn\'t it? I haven\'t even finished my first cigarette." He lights one to prove his point.',
        afternoon: '"Afternoon, Detective." Rex pours himself a generous whisky, his third of the day. "Still sniffing around, are you? I admire the work ethic. I just wish it weren\'t directed at me." His smile doesn\'t reach his calculating eyes.',
        evening: 'Rex straightens his dinner jacket, checking his reflection. "Ah, the Detective. Ready for the gala? Big night. Big announcements." He tugs at his collar. "Should be... memorable." There\'s something feral behind his casual tone.',
        night: '"Christ, Detective, what do you want now?" Rex\'s civility has worn thin with the hour. His eyes are glassy from drink, but his mind is clearly elsewhere — calculating, planning. "The night\'s getting on. Don\'t you have somewhere to be?"',
    },
    isabelle_moreau: {
        morning: 'Isabelle smiles warmly, though her dark eyes miss nothing. "Bonjour, Detective. I am still learning the rhythms of this house. The mornings are... tense, non? Everyone performing even over their breakfast."',
        afternoon: '"Detective Voss." Isabelle tilts her head, studying you. "The afternoons here are strange. Everyone retreats to their corners, like boxers between rounds. What have you discovered today?" Her curiosity feels professional.',
        evening: '"Bonsoir, Detective." Isabelle adjusts the bracelet on her wrist — a nervous habit or a calculated gesture. "The gala approaches. Everyone is putting on their best face. I wonder which faces will slip tonight."',
        night: 'Isabelle\'s smile is strained at this hour. "Detective. Still working? So am I." She catches herself. "I mean — still enjoying the party. It is quite the event." The mask nearly slipped. She knows it.',
    },
    father_thomas: {
        morning: 'Father Thomas closes his prayer book gently. "Good morning, Detective. I trust you slept? I did not. The Lord grants me watchfulness when others need it most." His eyes carry the weight of unspoken confessions.',
        afternoon: '"Detective Voss." Father Thomas folds his hands, a gesture somewhere between prayer and resignation. "The afternoon light reveals much, doesn\'t it? I wish I could say the same for the souls in this house."',
        evening: 'Father Thomas stands near the window, his black vestments blending with the coming dark. "Evening, Detective. The hour of reckoning approaches. I have prayed for this family, but I fear God has other plans for tonight."',
        night: '"Detective." Father Thomas\'s voice is barely a whisper. "The night presses in. I carry knowledge that burns like a coal in my chest. The seal of confession binds me, but..." He trails off, anguished. "Ask me the right questions."',
    },
    mrs_blackwood: {
        morning: 'Mrs. Blackwood wipes her hands on her apron with brisk efficiency. "Morning, Detective. Breakfast is on the sideboard. If you need anything, ring the bell. Otherwise, I have a house to run."',
        afternoon: '"Detective." Mrs. Blackwood pauses mid-task, her steel-gray eyes assessing. "Afternoon already. The gala preparations won\'t manage themselves. If you have questions, make them quick — the lamb won\'t braise itself."',
        evening: 'Mrs. Blackwood is a whirlwind of last-minute preparations as evening falls. "Detective Voss. The gala begins in hours. I haven\'t time for pleasantries." She pauses. "But if it\'s about the family... I might make time."',
        night: '"Still about, Detective?" Mrs. Blackwood\'s composure cracks for just a moment, revealing exhaustion and something else — fear. "The gala\'s in full swing. Everyone\'s accounted for. Mostly." That last word hangs in the air.',
    },
    mr_finch: {
        morning: 'Mr. Finch inclines his head precisely fifteen degrees. "Good morning, Detective Voss. Lord Ashworth is already at his desk. The household is in motion. Is there something I can assist you with?"',
        afternoon: '"Detective." Mr. Finch materializes beside you with the silence of a man who has spent decades learning to move without being noticed. "The afternoon proceeds as expected. Shall I arrange tea, or is this a professional call?"',
        evening: 'Mr. Finch stands at rigid attention, every button polished, every crease sharp. "Good evening, Detective. The gala preparations are on schedule. Lord Ashworth has asked that all guests assemble in the ballroom by eight." His loyalty is a wall.',
        night: '"Detective Voss." Mr. Finch\'s voice is lower than usual, his composure strained by something beneath the surface. "The hour is late. I remain at my station, as always. But tonight..." He straightens. "Tonight feels different."',
    },
};

// ── NARRATION LINES ──
const narration = {
    firstLoop: [
        'Something is wrong. You can feel it in the air, in the static charge of the storm.',
        'This house has secrets older than its foundations.',
        'Watch the people. Listen to what they don\'t say.',
        'The manor breathes around you — old walls, old money, old sins. You\'re not a guest here. You\'re a witness.',
        'Every room in this house is a stage. Every conversation is a performance. Your job is to see behind the curtain.',
        'Trust your instincts, Detective. They brought you here for a reason — and it wasn\'t the gala.',
        'The storm outside mirrors the one inside these walls. Someone in this house is desperate, and desperate people do desperate things.',
        'You\'ve worked cases before. Murders, frauds, disappearances. But this one feels different. This one feels like it\'s already happened.',
    ],
    laterLoops: [
        'You\'ve been here before. Done this before. But this time, you know more.',
        'The rain sounds the same. The clock ticks the same. But you are different.',
        'Every loop, the picture gets clearer. The killer doesn\'t know you\'re coming.',
        'Deja vu is for amateurs. You remember everything — every lie, every glance, every door that closed too quickly. This time, you\'re ready.',
        'The loop is a cage, but it\'s also a weapon. Every repetition is another chance to catch what you missed.',
        'They repeat the same mistakes, the same conversations, the same sins. You don\'t. That\'s your advantage.',
        'The faces are the same. The smiles are the same. But now you see the machinery behind them — the gears of greed, jealousy, and fear.',
        'Another loop. Another chance. The killer is consistent, predictable. And predictable people get caught.',
    ],
    evidenceFound: [
        'Another piece of the puzzle falls into place.',
        'The truth doesn\'t hide — it waits for those patient enough to find it.',
        'Evidence doesn\'t lie. People do.',
    ],
    approaching_midnight: [
        'The clock is ticking. Midnight approaches.',
        'Hours left. The gala is in full swing. The killer is making their move.',
        'Time is running out. Do you have enough?',
        'The witching hour draws near. Somewhere in this manor, a killer is following their script. Do you know enough to rewrite the ending?',
        'The grandfather clock counts down like a fuse. Each tick is a second closer to murder. Each tick is a second closer to the truth.',
        'Midnight waits for no one — not even a detective trapped in time. The pieces are on the board. It\'s your move.',
    ],
    time_passing: [
        'Minutes bleed away like ink in rain. The storm outside hasn\'t changed, but the house has — the mood shifting, the shadows lengthening.',
        'You wait. The clock ticks. Somewhere in the manor, people are moving, talking, scheming. The world turns without your input.',
        'Time passes. The rain continues its assault on the windows. You feel the minutes like sand running through your fingers — each grain irreplaceable.',
        'Half an hour vanishes into the rhythm of the storm. When you check the clock, the hands have moved, and so has everyone in the house.',
        'You let the time flow past you, listening to the old house settle and creak. When the world sharpens again, the light has changed. So have the stakes.',
    ],
    returning: [
        'You\'ve been here before — in more ways than one. The room hasn\'t changed, but your understanding of it has.',
        'Familiar walls. Familiar shadows. But now you see the details you missed the first time through.',
        'Back again. The room greets you like an old accomplice — silent, knowing, full of secrets you haven\'t extracted yet.',
        'This place holds something you need. You can feel it, like a word on the tip of your tongue — just out of reach, but close.',
        'You return with fresh eyes and old suspicions. Every object, every shadow, every dust mote might be the key to everything.',
    ],
};

// ── TIME HELPERS ──
function formatTime(minutes) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    const period = h >= 12 ? 'PM' : 'AM';
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

function getTimeOfDay(minutes) {
    if (minutes < 420) return 'early_morning';  // before 7 AM
    if (minutes < 540) return 'morning';         // 7-9 AM
    if (minutes < 720) return 'late_morning';    // 9-12 PM
    if (minutes < 840) return 'afternoon';       // 12-2 PM
    if (minutes < 1020) return 'late_afternoon'; // 2-5 PM
    if (minutes < 1140) return 'evening';        // 5-7 PM
    if (minutes < 1320) return 'night';          // 7-10 PM
    return 'late_night';                          // 10 PM-midnight
}

function getTimePeriodName(minutes) {
    const tod = getTimeOfDay(minutes);
    const names = {
        early_morning: 'Early Morning', morning: 'Morning',
        late_morning: 'Late Morning', afternoon: 'Afternoon',
        late_afternoon: 'Late Afternoon', evening: 'Evening',
        night: 'Night', late_night: 'Late Night'
    };
    return names[tod];
}

// ── DEDUCTION RULES — Logic chains that unlock conclusions ──
const deductions = [
    {
        id: 'poison_method',
        title: 'Method: Chronic Poisoning',
        conclusion: 'Lady Evelyn has been slowly poisoning Lord Ashworth with aconitine extracted from wolfsbane in the greenhouse.',
        requires: ['poison_vial', 'wolfsbane_garden'],
        category: 'method',
        importance: 4,
    },
    {
        id: 'brandy_trap',
        title: 'The Drugged Brandy',
        conclusion: 'Lord Ashworth\'s brandy was drugged with a sedative, rendering him helpless for the final act. The empty vial in the dining room contained the sleeping agent.',
        requires: ['brandy_glass', 'empty_vial'],
        category: 'method',
        importance: 3,
    },
    {
        id: 'affair_motive',
        title: 'Motive: The Affair',
        conclusion: 'Lady Evelyn and Rex Dalton are having an affair. They planned Lord Ashworth\'s murder together to be free — and wealthy.',
        requires: ['love_letters', 'rex_shirt'],
        category: 'motive',
        importance: 5,
    },
    {
        id: 'evelyn_mastermind',
        title: 'Evelyn: The Mastermind',
        conclusion: 'Lady Evelyn orchestrated everything: the chronic poisoning, the drugged brandy, and Rex as her willing accomplice through the secret passage.',
        requires: ['poison_vial', 'love_letters', 'brandy_note'],
        category: 'suspect',
        importance: 5,
    },
    {
        id: 'rex_accomplice',
        title: 'Rex: The Accomplice',
        conclusion: 'Rex Dalton used the secret passage to reach Lord Ashworth\'s study after the brandy took effect. His hidden shirt with stains proves physical involvement.',
        requires: ['secret_passage', 'rex_shirt'],
        category: 'suspect',
        importance: 4,
    },
    {
        id: 'james_innocent',
        title: 'James: Desperate but Innocent',
        conclusion: 'James had motive (gambling debts, being cut from the will) but no opportunity. His desperation is real, but he\'s not the killer.',
        requires: ['gambling_debts', 'modified_will'],
        category: 'suspect',
        importance: 2,
    },
    {
        id: 'murder_timeline',
        title: 'Timeline Reconstructed',
        conclusion: '11:10 PM — Brandy takes effect. 11:20 PM — Rex enters through passage. 11:30 PM — Lord Ashworth is murdered. Midnight — Evelyn "discovers" the body.',
        requires: ['bell_log', 'brandy_glass', 'secret_passage'],
        category: 'timeline',
        importance: 4,
    },
    {
        id: 'ashworth_knew',
        title: 'Ashworth Knew His Fate',
        conclusion: 'Lord Ashworth suspected he was being poisoned and wrote about it. He activated the ancient clock to try to cheat death — creating the time loop.',
        requires: ['ashworth_diary', 'unfinished_letter'],
        category: 'revelation',
        importance: 4,
    },
    {
        id: 'loop_origin',
        title: 'Origin of the Time Loop',
        conclusion: 'The ancient clock mechanism in the tower is a temporal device. Lord Ashworth activated it the night of his murder, trapping everyone in a repeating day.',
        requires: ['ancient_clock', 'tower_journal'],
        category: 'revelation',
        importance: 5,
    },
    {
        id: 'isabelle_secret',
        title: 'Isabelle\'s True Identity',
        conclusion: 'Isabelle Moreau is "M" from the phone log — an undercover investigator Lord Ashworth hired to gather proof of the conspiracy against him.',
        requires: ['phone_log', 'modified_will'],
        category: 'suspect',
        importance: 3,
    },
    {
        id: 'complete_picture',
        title: 'The Full Truth',
        conclusion: 'Lady Evelyn and Rex planned to murder Lord Ashworth to inherit his fortune and be together. She poisoned him slowly, then drugged his brandy. Rex delivered the killing blow via the secret passage. Lord Ashworth, suspecting his end, activated the ancient clock — trapping his murderers in an endless loop as punishment.',
        requires: ['poison_vial', 'love_letters', 'secret_passage', 'brandy_glass', 'ancient_clock'],
        category: 'revelation',
        importance: 5,
    },
];

// ── ACCUSATION VALIDATION ──
function validateAccusation(suspect, accomplice, evidencePresented) {
    if (suspect === 'lady_evelyn' && accomplice === 'rex_dalton') {
        const critical = ['poison_vial', 'love_letters', 'secret_passage', 'brandy_glass'];
        const hasCritical = critical.filter(e => evidencePresented.includes(e)).length;
        if (hasCritical >= 4 && evidencePresented.length >= 5) return 'true_justice';
        if (hasCritical >= 2) return 'partial_truth';
        return 'partial_truth';
    }
    if (suspect === 'lady_evelyn') {
        if (evidencePresented.length >= 3) return 'partial_truth';
        return 'wrong_accusation';
    }
    return 'wrong_accusation';
}

// Public API
return {
    locations, mapLayout, npcs, evidence, connections, deductions,
    eavesdrops, dialogues, npcGreetings, introSequence, loopMessages,
    endings, narration, formatTime, getTimeOfDay,
    getTimePeriodName, validateAccusation,
};

})();
