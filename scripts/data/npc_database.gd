class_name NPCDatabase
## Static database of all 10 NPC definitions.

static var _npc_data: Dictionary = {}
static var _initialized: bool = false

static func _ensure_init() -> void:
	if _initialized:
		return
	_initialized = true
	_build_database()

static func get_npc_data(npc_id: String) -> Dictionary:
	_ensure_init()
	return _npc_data.get(npc_id, {})

static func get_all_npc_ids() -> Array[String]:
	_ensure_init()
	var ids: Array[String] = []
	for key in _npc_data.keys():
		ids.append(key as String)
	return ids

static func get_npc_name(npc_id: String) -> String:
	_ensure_init()
	var data: Dictionary = _npc_data.get(npc_id, {})
	return data.get("name", "Unknown") as String

static func _build_database() -> void:
	_build_frank()
	_build_maria()
	_build_hale()
	_build_iris()
	_build_victor()
	_build_penny()
	_build_eleanor()
	_build_nina()
	_build_mayor()
	_build_tommy()

static func _build_frank() -> void:
	_npc_data[Constants.NPC_FRANK] = {
		"id": Constants.NPC_FRANK,
		"name": "Frank DeLuca",
		"job": "bartender",
		"personality_traits": [Enums.PersonalityTrait.LOYAL, Enums.PersonalityTrait.COWARDLY, Enums.PersonalityTrait.GREEDY],
		"secrets": ["In debt to Victor Crane", "Launders money through the bar"],
		"sprite_seed": 101,
		"relationships": [
			{"target": Constants.NPC_VICTOR, "type": Enums.RelationshipType.BLACKMAILEE, "trust": -2},
			{"target": Constants.NPC_MARIA, "type": Enums.RelationshipType.FRIEND, "trust": 3},
			{"target": Constants.NPC_TOMMY, "type": Enums.RelationshipType.COWORKER, "trust": 1},
		],
		"default_dialogue": {
			"greeting": {"lines": [
				{"text": "What'll it be? Keep it quick -- I got a full house tonight.", "speaker": Constants.NPC_FRANK, "truthful": true,
				"choices": [
					{"id": "ask_bar", "text": "Tell me about the bar.", "leads_to": "about_bar"},
					{"id": "ask_victor", "text": "You know Victor Crane?", "leads_to": "about_victor"},
					{"id": "ask_maria", "text": "What about Maria Santos?", "leads_to": "about_maria"},
					{"id": "ask_tommy", "text": "How's Tommy doing?", "leads_to": "about_tommy"},
					{"id": "ask_hale", "text": "Detective Hale been in?", "leads_to": "about_hale"},
					{"id": "ask_penny", "text": "Know a girl named Penny?", "leads_to": "about_penny"},
					{"id": "done", "text": "Never mind.", "leads_to": "end"},
				]},
			]},
			"greeting_familiar": {"lines": [
				{"text": "You again? Your usual spot's open. On the rocks or straight up this time?", "speaker": Constants.NPC_FRANK, "truthful": true,
				"choices": [
					{"id": "ask_bar", "text": "Anything new at the bar?", "leads_to": "about_bar"},
					{"id": "ask_victor", "text": "Let's talk about Victor.", "leads_to": "about_victor"},
					{"id": "ask_maria", "text": "How's Maria?", "leads_to": "about_maria"},
					{"id": "ask_tommy", "text": "Seen Tommy today?", "leads_to": "about_tommy"},
					{"id": "ask_hale", "text": "Hale causing trouble?", "leads_to": "about_hale"},
					{"id": "ask_penny", "text": "Penny been around?", "leads_to": "about_penny"},
					{"id": "done", "text": "Just checking in.", "leads_to": "end"},
				]},
			]},
			"greeting_late_game": {"lines": [
				{"text": "Lock the door behind you. I don't know who's watching anymore. Last call came early tonight.", "speaker": Constants.NPC_FRANK, "truthful": true,
				"choices": [
					{"id": "scared", "text": "What are you afraid of?", "leads_to": "frank_scared"},
					{"id": "victor_late", "text": "Victor's coming for you.", "leads_to": "about_victor_late"},
					{"id": "help", "text": "I can help you, Frank.", "leads_to": "frank_help_offer"},
					{"id": "done", "text": "Stay safe.", "leads_to": "end"},
				]},
			]},
			"about_bar": {"lines": [
				{"text": "Crossroads has been here longer than me. People come, people go. I just pour the drinks and mind my own business.", "speaker": Constants.NPC_FRANK, "truthful": true},
				{"text": "Place has history though. Every scratch on that bar top tells a story. Most of 'em I wish I didn't know.", "speaker": Constants.NPC_FRANK, "truthful": true,
				"choices": [
					{"id": "history", "text": "What kind of stories?", "leads_to": "bar_history"},
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "Thanks.", "leads_to": "end"},
				]},
			]},
			"bar_history": {"lines": [
				{"text": "The kind that keep a bartender up at night. People cut deals here, settle scores. I see it all from behind the counter.", "speaker": Constants.NPC_FRANK, "truthful": true},
				{"text": "But what happens at Crossroads stays at Crossroads. That's the only rule that keeps me pouring.", "speaker": Constants.NPC_FRANK, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "I understand.", "leads_to": "end"},
				]},
			]},
			"about_victor": {"lines": [
				{"text": "Victor? He's... a businessman. Comes in sometimes. Orders top shelf, never tips. I don't ask questions.", "speaker": Constants.NPC_FRANK, "truthful": false,
				"choices": [
					{"id": "press", "text": "You seem nervous about him.", "leads_to": "press_victor"},
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "Okay.", "leads_to": "end"},
				]},
			]},
			"press_victor": {"lines": [
				{"text": "Nervous? I've seen it all, pal. The man drinks here, that's it. Drop it before someone hears you asking.", "speaker": Constants.NPC_FRANK, "truthful": false,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "Fine.", "leads_to": "end"},
				]},
			]},
			"about_victor_late": {"lines": [
				{"text": "Coming for me? He already owns me. The bar, the books -- everything runs through his hands. I'm just the guy holding the bottle.", "speaker": Constants.NPC_FRANK, "truthful": true,
				"choices": [
					{"id": "press", "text": "What do you mean he owns you?", "leads_to": "frank_owned"},
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "We'll figure this out.", "leads_to": "end"},
				]},
			]},
			"frank_owned": {"lines": [
				{"text": "I got into debt. Bad debt. Victor bought it up and now every dollar that crosses this bar goes through his books first.", "speaker": Constants.NPC_FRANK, "truthful": true},
				{"text": "It's laundering, plain and simple. And I'm the patsy with the liquor license.", "speaker": Constants.NPC_FRANK, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "That's a big admission.", "leads_to": "end"},
				],
				"reveals_clues": [{"id": "frank_laundering_confession", "title": "Frank's Laundering Confession", "description": "Frank admitted Victor uses the bar to launder money, buying Frank's debts as leverage.", "category": Enums.ClueCategory.TESTIMONY, "importance": 3}]},
			]},
			"about_maria": {"lines": [
				{"text": "Maria? She's good people. Salt of the earth. Her cafe's the only honest place left in town.", "speaker": Constants.NPC_FRANK, "truthful": true},
				{"text": "We go way back. She keeps telling me to get out, but this bar's all I got.", "speaker": Constants.NPC_FRANK, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "She sounds like a good friend.", "leads_to": "end"},
				]},
			]},
			"about_tommy": {"lines": [
				{"text": "Tommy's a good kid. Works hard, doesn't complain. Reminds me of myself before I got mixed up in all this.", "speaker": Constants.NPC_FRANK, "truthful": true},
				{"text": "I worry about him though. He's running packages for people he shouldn't be. Kid doesn't even know what he's carrying.", "speaker": Constants.NPC_FRANK, "truthful": true,
				"choices": [
					{"id": "press", "text": "What's he carrying?", "leads_to": "tommy_packages"},
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "Someone should warn him.", "leads_to": "end"},
				]},
			]},
			"tommy_packages": {"lines": [
				{"text": "Sealed crates from Victor's warehouse. Heavy for their size. Tommy thinks it's business supplies.", "speaker": Constants.NPC_FRANK, "truthful": true},
				{"text": "I tried to tell him once, but what am I gonna say? 'Hey kid, your boss is a criminal and so am I'?", "speaker": Constants.NPC_FRANK, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "We need to protect him.", "leads_to": "end"},
				],
				"reveals_clues": [{"id": "tommy_suspicious_packages", "title": "Tommy's Suspicious Packages", "description": "Frank confirms Tommy unknowingly delivers sealed crates from Victor's warehouse.", "category": Enums.ClueCategory.TESTIMONY, "importance": 2}]},
			]},
			"about_hale": {"lines": [
				{"text": "Hale? That guy's got cop written all over him but none of the honor. Drinks on the house -- calls it 'professional courtesy.'", "speaker": Constants.NPC_FRANK, "truthful": true},
				{"text": "Between you and me, he's no better than the guys he's supposed to be arresting.", "speaker": Constants.NPC_FRANK, "truthful": true,
				"choices": [
					{"id": "press", "text": "Worse how?", "leads_to": "hale_detail"},
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "Noted.", "leads_to": "end"},
				]},
			]},
			"hale_detail": {"lines": [
				{"text": "I've seen him meeting with Victor after hours. Right here in my bar. Envelopes change hands. Thick ones. You do the math.", "speaker": Constants.NPC_FRANK, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "Very interesting.", "leads_to": "end"},
				],
				"reveals_clues": [{"id": "hale_victor_envelopes", "title": "Hale-Victor Envelope Exchange", "description": "Frank saw Hale and Victor exchanging thick envelopes at the bar after hours.", "category": Enums.ClueCategory.TESTIMONY, "importance": 3}]},
			]},
			"about_penny": {"lines": [
				{"text": "Penny? Street kid. Quick hands, quicker mouth. She drifts in here when it gets cold.", "speaker": Constants.NPC_FRANK, "truthful": true},
				{"text": "I let her warm up, give her something to eat. Don't tell anyone -- bad for my reputation.", "speaker": Constants.NPC_FRANK, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "Your secret's safe.", "leads_to": "end"},
				]},
			]},
			"frank_scared": {"lines": [
				{"text": "Everything. Victor's getting paranoid, Hale's sniffing around more than usual, and the mayor's cleaning house.", "speaker": Constants.NPC_FRANK, "truthful": true},
				{"text": "When powerful people get scared, the little guys like me are the first to disappear.", "speaker": Constants.NPC_FRANK, "truthful": true,
				"choices": [
					{"id": "press", "text": "Who's disappeared before?", "leads_to": "frank_disappeared"},
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "I won't let that happen.", "leads_to": "end"},
				]},
			]},
			"frank_disappeared": {"lines": [
				{"text": "A guy who worked the docks. Started asking about Victor's shipments. One day he just... wasn't there anymore.", "speaker": Constants.NPC_FRANK, "truthful": true},
				{"text": "Hale filed it as 'left town voluntarily.' Nobody buys that, but nobody argues with the badge.", "speaker": Constants.NPC_FRANK, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "I'll look into it.", "leads_to": "end"},
				],
				"reveals_clues": [{"id": "missing_dock_worker", "title": "Missing Dock Worker", "description": "A dock worker who questioned Victor's shipments disappeared. Hale ruled it voluntary.", "category": Enums.ClueCategory.TESTIMONY, "importance": 2}]},
			]},
			"frank_help_offer": {"lines": [
				{"text": "Help me? This ain't a problem you solve with good intentions, pal.", "speaker": Constants.NPC_FRANK, "truthful": true},
				{"text": "But if you're serious... I got records. Hidden ones. Every transaction Victor ran through this bar for two years.", "speaker": Constants.NPC_FRANK, "truthful": true,
				"choices": [
					{"id": "records", "text": "Show me the records.", "leads_to": "frank_records"},
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "Keep them safe for now.", "leads_to": "end"},
				]},
			]},
			"frank_records": {"lines": [
				{"text": "Under the loose floorboard behind the bar. Third plank from the left. Lockbox, combination 1-9-7-4.", "speaker": Constants.NPC_FRANK, "truthful": true},
				{"text": "Those records show where the money comes from and where it goes. City Hall, the docks, shell companies. All of it.", "speaker": Constants.NPC_FRANK, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "This changes everything.", "leads_to": "end"},
				],
				"reveals_clues": [{"id": "frank_hidden_records", "title": "Frank's Hidden Financial Records", "description": "Two years of laundering records hidden under the bar floorboards. Combination: 1974. Traces money to City Hall and shell companies.", "category": Enums.ClueCategory.DOCUMENT, "importance": 4}]},
			]},
			"conspiracy_reveal_25": {
				"min_conspiracy": 25,
				"choice_label": "You seem worried about money...",
				"lines": [
					{"text": "Look... I owe people. Bad people. The bar doesn't make enough to cover it -- not even close.", "speaker": Constants.NPC_FRANK, "truthful": true},
					{"text": "Victor bought my debts. Now I pour drinks and cook books. I stop, I lose everything. Or worse.", "speaker": Constants.NPC_FRANK, "truthful": true,
					"choices": [
						{"id": "press", "text": "Who do you owe?", "leads_to": "conspiracy_press_25"},
						{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					],
					"reveals_clues": [{"id": "frank_debt", "title": "Frank's Debt", "description": "Frank owes money to dangerous people. Victor bought the debts as leverage for laundering.", "category": Enums.ClueCategory.DOCUMENT, "importance": 2}]},
				],
			},
			"conspiracy_press_25": {"lines": [
				{"text": "Victor Crane. Bought my markers from loan sharks two years ago. Told me I'd work it off. But the debt never gets smaller.", "speaker": Constants.NPC_FRANK, "truthful": true},
				{"text": "Every week there's a new envelope. Cash in, cash out, different names. I just do what I'm told.", "speaker": Constants.NPC_FRANK, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "That's useful.", "leads_to": "end"},
				]},
			]},
			"conspiracy_reveal_50": {
				"min_conspiracy": 50,
				"choice_label": "I know about the money laundering, Frank.",
				"lines": [
					{"text": "Keep your voice down! You want to get us both killed?", "speaker": Constants.NPC_FRANK, "truthful": true},
					{"text": "Yeah, the bar's a front. Money comes in dirty, goes out clean. Victor's operation. But it goes higher than him.", "speaker": Constants.NPC_FRANK, "truthful": true},
					{"text": "The mayor's office takes a cut. Hale makes sure nobody investigates. It's a machine and I'm just a cog.", "speaker": Constants.NPC_FRANK, "truthful": true,
					"choices": [
						{"id": "press", "text": "The mayor is involved?", "leads_to": "frank_mayor_link"},
						{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
						{"id": "done", "text": "I'll be careful.", "leads_to": "end"},
					],
					"reveals_clues": [{"id": "frank_laundering_chain", "title": "Laundering Chain Exposed", "description": "Money flows through the bar, Victor manages it, the mayor takes a cut, Hale provides police cover.", "category": Enums.ClueCategory.TESTIMONY, "importance": 3}]},
				],
			},
			"frank_mayor_link": {"lines": [
				{"text": "Who signs off on Victor's building permits? The mayor gets his slice and Victor bulldozes half the waterfront.", "speaker": Constants.NPC_FRANK, "truthful": true},
				{"text": "I've seen the ledgers. 'Consulting fees' they call it. Last call for democracy in this town.", "speaker": Constants.NPC_FRANK, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "Goes deeper than I thought.", "leads_to": "end"},
				],
				"reveals_clues": [{"id": "mayor_consulting_fees", "title": "Mayor's Consulting Fees", "description": "Payments to Mayor Aldridge disguised as consulting fees in exchange for Victor's building permits.", "category": Enums.ClueCategory.DOCUMENT, "importance": 4}]},
			]},
			"conspiracy_reveal_75": {
				"min_conspiracy": 75,
				"choice_label": "I need to know about the device in City Hall.",
				"lines": [
					{"text": "The device? Oh god, you know about that too?", "speaker": Constants.NPC_FRANK, "truthful": true},
					{"text": "Victor mentioned it once when he was drunk. Something in City Hall's basement. Called it the mayor's 'insurance policy.'", "speaker": Constants.NPC_FRANK, "truthful": true},
					{"text": "He said time itself answers to Aldridge now. I thought he was rambling, but you don't look surprised.", "speaker": Constants.NPC_FRANK, "truthful": true,
					"choices": [
						{"id": "press", "text": "What else did Victor say?", "leads_to": "frank_device_detail"},
						{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
						{"id": "done", "text": "It's real, Frank.", "leads_to": "end"},
					],
					"reveals_clues": [{"id": "frank_device_rumor", "title": "Victor's Drunken Device Confession", "description": "Victor drunkenly told Frank about a device in City Hall's basement -- the mayor's insurance policy over time.", "category": Enums.ClueCategory.TESTIMONY, "importance": 4}]},
				],
			},
			"frank_device_detail": {"lines": [
				{"text": "Said it cost a fortune. Funded the whole thing through land deals. Called it 'the best investment he ever made.'", "speaker": Constants.NPC_FRANK, "truthful": true},
				{"text": "Mentioned a scientist too. Someone who built it. But he clammed up after that. Even drunk, Victor knows limits.", "speaker": Constants.NPC_FRANK, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "A scientist... I need to find out who.", "leads_to": "end"},
				],
				"reveals_clues": [{"id": "device_funding_source", "title": "Device Funded by Land Deals", "description": "Victor funded the loop device through land deals. A scientist built it.", "category": Enums.ClueCategory.TESTIMONY, "importance": 3}]},
			]},
			"confrontation": {
				"required_clues": ["frank_debt", "frank_laundering_chain"],
				"lines": [
					{"text": "You got the books? Then you know everything. I'm done pretending.", "speaker": Constants.NPC_FRANK, "truthful": true},
					{"text": "I've been cooking Victor's numbers for two years. Every dirty dollar has my prints on it.", "speaker": Constants.NPC_FRANK, "truthful": true},
					{"text": "But I kept copies. Dates, amounts, account numbers. Get them to Iris and maybe all this wasn't for nothing.", "speaker": Constants.NPC_FRANK, "truthful": true,
					"choices": [
						{"id": "accept", "text": "I'll get the evidence to the right people.", "leads_to": "frank_cooperate"},
						{"id": "who_else", "text": "Who else is involved?", "leads_to": "frank_full_list"},
						{"id": "done", "text": "Thank you, Frank.", "leads_to": "end"},
					],
					"reveals_clues": [{"id": "frank_full_confession", "title": "Frank's Full Confession", "description": "Frank fully confessed to laundering for Victor. Has copies of all financial records, willing to cooperate.", "category": Enums.ClueCategory.TESTIMONY, "importance": 5}]},
				],
			},
			"frank_cooperate": {"lines": [
				{"text": "Under the bar, third floorboard. Lockbox -- combination 1-9-7-4. The year this bar opened.", "speaker": Constants.NPC_FRANK, "truthful": true},
				{"text": "Just make sure it counts. If Victor finds out, last call's gonna be for me.", "speaker": Constants.NPC_FRANK, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "It'll count. I promise.", "leads_to": "end"},
				],
				"reveals_clues": [{"id": "frank_lockbox", "title": "Frank's Lockbox", "description": "Financial evidence in a lockbox under bar's third floorboard. Combination: 1974.", "category": Enums.ClueCategory.PHYSICAL_EVIDENCE, "importance": 5}]},
			]},
			"frank_full_list": {"lines": [
				{"text": "Victor runs the money. Hale protects it. The mayor profits. Dr. Solomon covers up what happens to people who get in the way.", "speaker": Constants.NPC_FRANK, "truthful": true},
				{"text": "Tommy delivers without knowing. Penny sees everything. Maria tries to keep her head down. And Iris... they're watching her close.", "speaker": Constants.NPC_FRANK, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "I'll protect her.", "leads_to": "end"},
				],
				"reveals_clues": [{"id": "conspiracy_roster", "title": "The Conspiracy Roster", "description": "Full conspiracy: Victor (money), Hale (protection), Mayor (profits), Eleanor (cover-ups). Iris is their primary target.", "category": Enums.ClueCategory.TESTIMONY, "importance": 5}]},
			]},
			"end": {"lines": []},
		},
	}


static func _build_maria() -> void:
	_npc_data[Constants.NPC_MARIA] = {
		"id": Constants.NPC_MARIA,
		"name": "Maria Santos",
		"job": "cafe_owner",
		"personality_traits": [Enums.PersonalityTrait.HONEST, Enums.PersonalityTrait.BRAVE, Enums.PersonalityTrait.GENEROUS],
		"secrets": ["Witnessed the original loop-causing incident", "Knows Nina's true identity"],
		"sprite_seed": 202,
		"relationships": [
			{"target": Constants.NPC_FRANK, "type": Enums.RelationshipType.FRIEND, "trust": 3},
			{"target": Constants.NPC_IRIS, "type": Enums.RelationshipType.FRIEND, "trust": 2},
			{"target": Constants.NPC_NINA, "type": Enums.RelationshipType.UNKNOWN, "trust": 1},
		],
		"default_dialogue": {
			"greeting": {"lines": [
				{"text": "Welcome to Cafe Rosetta, dear! Sit down, I'll bring you something warm.", "speaker": Constants.NPC_MARIA, "truthful": true,
				"choices": [
					{"id": "cafe", "text": "Nice place. Been here long?", "leads_to": "about_cafe"},
					{"id": "town", "text": "Anything strange going on?", "leads_to": "about_town"},
					{"id": "nina", "text": "Know the newcomer at the hotel?", "leads_to": "about_nina"},
					{"id": "frank", "text": "How's Frank doing?", "leads_to": "about_frank"},
					{"id": "iris", "text": "Know a journalist named Iris?", "leads_to": "about_iris"},
					{"id": "mayor", "text": "What do you think of the mayor?", "leads_to": "about_mayor"},
					{"id": "done", "text": "Just passing through.", "leads_to": "end"},
				]},
			]},
			"greeting_familiar": {"lines": [
				{"text": "Oh honey, you're back! Your usual table is waiting. I already started your coffee.", "speaker": Constants.NPC_MARIA, "truthful": true,
				"choices": [
					{"id": "cafe", "text": "How's business?", "leads_to": "about_cafe"},
					{"id": "town", "text": "Noticed anything strange today?", "leads_to": "about_town"},
					{"id": "nina", "text": "Let's talk about Nina.", "leads_to": "about_nina"},
					{"id": "frank", "text": "Heard from Frank?", "leads_to": "about_frank"},
					{"id": "iris", "text": "How's Iris?", "leads_to": "about_iris"},
					{"id": "tommy", "text": "Tommy come by today?", "leads_to": "about_tommy"},
					{"id": "done", "text": "Just enjoying the coffee.", "leads_to": "end"},
				]},
			]},
			"greeting_late_game": {"lines": [
				{"text": "Come in quickly, dear. Close the door. I've been praying you'd come back.", "speaker": Constants.NPC_MARIA, "truthful": true,
				"choices": [
					{"id": "falling", "text": "What's happening out there?", "leads_to": "maria_falling_apart"},
					{"id": "nina_truth", "text": "I need the truth about Nina.", "leads_to": "maria_nina_truth"},
					{"id": "incident", "text": "Tell me about the incident.", "leads_to": "maria_incident"},
					{"id": "done", "text": "Stay safe, Maria.", "leads_to": "end"},
				]},
			]},
			"about_cafe": {"lines": [
				{"text": "Fifteen years now. Opened it after my husband passed -- needed something to keep my hands busy.", "speaker": Constants.NPC_MARIA, "truthful": true},
				{"text": "Everyone comes through eventually. Politicians, criminals, good people. I just pour coffee and listen.", "speaker": Constants.NPC_MARIA, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "It's a lovely place.", "leads_to": "end"},
				]},
			]},
			"about_town": {"lines": [
				{"text": "Strange? Oh honey, this town has been strange for years. But lately... it feels like time itself is off.", "speaker": Constants.NPC_MARIA, "truthful": true},
				{"text": "Deja vu, but stronger. Like I've lived this same day before. Am I crazy?", "speaker": Constants.NPC_MARIA, "truthful": true,
				"choices": [
					{"id": "press", "text": "You're not crazy. Tell me more.", "leads_to": "maria_not_crazy"},
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "I'll look into it.", "leads_to": "end"},
				]},
			]},
			"maria_not_crazy": {"lines": [
				{"text": "Thank you, dear. There's something I've been wanting to tell someone.", "speaker": Constants.NPC_MARIA, "truthful": true},
				{"text": "I saw something at City Hall. Late at night. Blue light from the basement -- pulsing, like a heartbeat. Then I felt a skip. The whole world hiccupped.", "speaker": Constants.NPC_MARIA, "truthful": true,
				"choices": [
					{"id": "press", "text": "A blue light? Tell me more.", "leads_to": "maria_blue_light"},
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "That's very important.", "leads_to": "end"},
				],
				"reveals_clues": [{"id": "maria_blue_light_sighting", "title": "Blue Light at City Hall", "description": "Maria saw pulsing blue light from City Hall's basement, followed by time 'skipping.'", "category": Enums.ClueCategory.TESTIMONY, "importance": 3}]},
			]},
			"maria_blue_light": {"lines": [
				{"text": "It lasted maybe ten seconds. Then the mayor came out the side door, looking shaken. He didn't see me.", "speaker": Constants.NPC_MARIA, "truthful": true},
				{"text": "After that night, things started feeling repetitive. Like the town got stuck. Have some coffee, dear.", "speaker": Constants.NPC_MARIA, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "The mayor was there...", "leads_to": "end"},
				],
				"reveals_clues": [{"id": "mayor_basement_exit", "title": "Mayor Seen Leaving Basement", "description": "Maria saw the mayor exit City Hall looking shaken right after the blue light event.", "category": Enums.ClueCategory.TESTIMONY, "importance": 4}]},
			]},
			"about_nina": {"lines": [
				{"text": "Nina? She's cautious. Orders the same thing every visit. There's something familiar about her.", "speaker": Constants.NPC_MARIA, "truthful": true,
				"choices": [
					{"id": "press", "text": "Familiar how?", "leads_to": "maria_nina_familiar"},
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "Thanks.", "leads_to": "end"},
				]},
			]},
			"maria_nina_familiar": {"lines": [
				{"text": "She knows things she shouldn't. She knew my husband's name without me telling her.", "speaker": Constants.NPC_MARIA, "truthful": true},
				{"text": "Said she read about the cafe in a review. But I've never been reviewed. Oh honey, I don't know what to think.", "speaker": Constants.NPC_MARIA, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "That is very strange.", "leads_to": "end"},
				]},
			]},
			"maria_nina_truth": {"lines": [
				{"text": "Oh dear... I've been carrying this for so long.", "speaker": Constants.NPC_MARIA, "truthful": true},
				{"text": "Nina isn't from here. Not from out of town -- from somewhere else. Where this day already happened. Maybe many times.", "speaker": Constants.NPC_MARIA, "truthful": true},
				{"text": "She told me the first night. After what I saw at City Hall... I believed every word.", "speaker": Constants.NPC_MARIA, "truthful": true,
				"choices": [
					{"id": "press", "text": "Another timeline?", "leads_to": "maria_parallel"},
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "Thank you for trusting me.", "leads_to": "end"},
				],
				"reveals_clues": [{"id": "nina_parallel_confirmed", "title": "Nina's Parallel Origin Confirmed", "description": "Maria confirms Nina is from a parallel timeline where events already played out.", "category": Enums.ClueCategory.TESTIMONY, "importance": 5}]},
			]},
			"maria_parallel": {"lines": [
				{"text": "She called it a 'branch.' Every loop reset creates new branches. In hers, the mayor won. Used the device to erase opponents.", "speaker": Constants.NPC_MARIA, "truthful": true},
				{"text": "She came sideways to stop it here. But every loop drains her device.", "speaker": Constants.NPC_MARIA, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "We have to help her.", "leads_to": "end"},
				],
				"reveals_clues": [{"id": "nina_mission_detail", "title": "Nina's Mission", "description": "Nina crossed timelines from a branch where the mayor won. Her device drains with each loop.", "category": Enums.ClueCategory.TESTIMONY, "importance": 5}]},
			]},
			"about_frank": {"lines": [
				{"text": "Frank's a good man trapped in a bad situation. I've known him twenty years.", "speaker": Constants.NPC_MARIA, "truthful": true},
				{"text": "I keep telling him to close the bar. But someone has their hooks in him.", "speaker": Constants.NPC_MARIA, "truthful": true,
				"choices": [
					{"id": "press", "text": "Who do you suspect?", "leads_to": "maria_frank_suspicion"},
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "He's lucky to have you.", "leads_to": "end"},
				]},
			]},
			"maria_frank_suspicion": {"lines": [
				{"text": "Victor Crane. That man poisons everything he touches. I've seen him at the bar at odd hours.", "speaker": Constants.NPC_MARIA, "truthful": true},
				{"text": "I tried to bring it up once and Frank nearly bit my head off. That told me everything.", "speaker": Constants.NPC_MARIA, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "You're right to worry.", "leads_to": "end"},
				]},
			]},
			"about_iris": {"lines": [
				{"text": "Iris is a firecracker. Sharp as a tack. She comes in with her laptop connecting dots.", "speaker": Constants.NPC_MARIA, "truthful": true},
				{"text": "I give her free refills because someone needs to tell the truth in this town.", "speaker": Constants.NPC_MARIA, "truthful": true,
				"choices": [
					{"id": "press", "text": "Is she in danger?", "leads_to": "maria_iris_danger"},
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "She sounds brave.", "leads_to": "end"},
				]},
			]},
			"maria_iris_danger": {"lines": [
				{"text": "I think so. I overheard Hale on the phone outside -- mentioned her name. It didn't sound friendly.", "speaker": Constants.NPC_MARIA, "truthful": true},
				{"text": "I told her to be careful. She just smiled and said 'that's what they all say before the story breaks.'", "speaker": Constants.NPC_MARIA, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "I'll keep an eye on her.", "leads_to": "end"},
				],
				"reveals_clues": [{"id": "hale_targeting_iris", "title": "Hale Targeting Iris", "description": "Maria overheard Hale mentioning Iris by name on the phone in an unfriendly context.", "category": Enums.ClueCategory.TESTIMONY, "importance": 3}]},
			]},
			"about_mayor": {"lines": [
				{"text": "Mayor Aldridge? That man could sell sand in a desert. All smiles, but nothing behind those eyes.", "speaker": Constants.NPC_MARIA, "truthful": true},
				{"text": "Power changed him. Or maybe it just revealed what was always there.", "speaker": Constants.NPC_MARIA, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "Power corrupts.", "leads_to": "end"},
				]},
			]},
			"about_tommy": {"lines": [
				{"text": "Tommy's such a sweet boy. Comes in every morning for a pastry. Always so cheerful.", "speaker": Constants.NPC_MARIA, "truthful": true},
				{"text": "I worry about him. He's too trusting. Takes jobs without asking what's in the packages.", "speaker": Constants.NPC_MARIA, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "He needs looking after.", "leads_to": "end"},
				]},
			]},
			"maria_falling_apart": {"lines": [
				{"text": "People are scared, dear. Frank's barely sleeping. Iris hasn't been in days. And that Tommy boy...", "speaker": Constants.NPC_MARIA, "truthful": true},
				{"text": "Even the air feels heavy. Have some coffee -- it won't fix anything, but it'll warm your hands.", "speaker": Constants.NPC_MARIA, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "We'll get through this.", "leads_to": "end"},
				]},
			]},
			"maria_incident": {"lines": [
				{"text": "It was three months ago. A Tuesday -- Tuesdays are slow at the cafe.", "speaker": Constants.NPC_MARIA, "truthful": true},
				{"text": "Around midnight, blue light from City Hall's basement. Lit up the whole street for ten seconds.", "speaker": Constants.NPC_MARIA, "truthful": true},
				{"text": "Then a sound -- deep, like the earth humming. After that, every day has felt the same.", "speaker": Constants.NPC_MARIA, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "That's when the loop started.", "leads_to": "end"},
				],
				"reveals_clues": [{"id": "loop_origin_date", "title": "Loop Origin Incident", "description": "Loop activated on a Tuesday three months ago. Blue light, humming sound, then daily repetition began.", "category": Enums.ClueCategory.TESTIMONY, "importance": 5}]},
			]},
			"conspiracy_reveal_25": {
				"min_conspiracy": 25,
				"choice_label": "Maria, what's really going on in this town?",
				"lines": [
					{"text": "Oh honey, you're asking the right questions. Most people keep their heads down.", "speaker": Constants.NPC_MARIA, "truthful": true},
					{"text": "Properties getting bought up, residents pushed out. All started when Victor Crane showed up.", "speaker": Constants.NPC_MARIA, "truthful": true,
					"choices": [
						{"id": "press", "text": "Who's behind it?", "leads_to": "maria_changes"},
						{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					],
					"reveals_clues": [{"id": "town_displacement", "title": "Town Displacement", "description": "Residents being pushed out as properties are bought up since Victor's arrival.", "category": Enums.ClueCategory.OBSERVATION, "importance": 2}]},
				],
			},
			"maria_changes": {"lines": [
				{"text": "Victor buys, the mayor approves, anyone who complains gets a visit from Hale. Simple corruption, dear.", "speaker": Constants.NPC_MARIA, "truthful": true},
				{"text": "But lately there's something bigger. This isn't just about money anymore.", "speaker": Constants.NPC_MARIA, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "I think you're right.", "leads_to": "end"},
				]},
			]},
			"conspiracy_reveal_50": {
				"min_conspiracy": 50,
				"choice_label": "The loop is connected to City Hall, isn't it?",
				"lines": [
					{"text": "You figured it out too? Thank God. I thought I was the only one.", "speaker": Constants.NPC_MARIA, "truthful": true},
					{"text": "I saw it -- the night everything started. Blue light, the mayor walking out like he'd seen God.", "speaker": Constants.NPC_MARIA, "truthful": true},
					{"text": "My coffee machine starts at exactly 6:47 every morning. To the second. That's not normal.", "speaker": Constants.NPC_MARIA, "truthful": true,
					"choices": [
						{"id": "press", "text": "What else happened that night?", "leads_to": "maria_that_night"},
						{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					],
					"reveals_clues": [{"id": "maria_loop_witness", "title": "Maria's Loop Witness Account", "description": "Maria witnessed the loop activation. Blue light, mayor exiting. Repetition began immediately after.", "category": Enums.ClueCategory.TESTIMONY, "importance": 4}]},
				],
			},
			"maria_that_night": {"lines": [
				{"text": "There was someone else. A woman ran out of City Hall right after the mayor, holding some instrument. Terrified.", "speaker": Constants.NPC_MARIA, "truthful": true},
				{"text": "I didn't recognize her then. But when Nina walked into my cafe weeks later... same face. Older somehow.", "speaker": Constants.NPC_MARIA, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "Nina was there that night...", "leads_to": "end"},
				],
				"reveals_clues": [{"id": "nina_at_activation", "title": "Nina at Loop Activation", "description": "Maria saw a woman matching Nina flee City Hall during activation, carrying an instrument.", "category": Enums.ClueCategory.TESTIMONY, "importance": 5}]},
			]},
			"conspiracy_reveal_75": {
				"min_conspiracy": 75,
				"choice_label": "Maria, tell me everything about Nina's identity.",
				"lines": [
					{"text": "I promised her I wouldn't. But promises don't mean much when the world keeps resetting.", "speaker": Constants.NPC_MARIA, "truthful": true},
					{"text": "Nina is from another version of this town. Where the mayor won. Used that machine to erase anyone who opposed him.", "speaker": Constants.NPC_MARIA, "truthful": true},
					{"text": "She found a way to cross over. But every loop drains her device.", "speaker": Constants.NPC_MARIA, "truthful": true,
					"choices": [
						{"id": "press", "text": "What happens when it runs out?", "leads_to": "maria_nina_device"},
						{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
						{"id": "done", "text": "We have to act fast.", "leads_to": "end"},
					],
					"reveals_clues": [{"id": "nina_full_identity", "title": "Nina's Full Identity", "description": "Nina is from a parallel timeline where the mayor used the loop device for years. Her crossing device is draining.", "category": Enums.ClueCategory.TESTIMONY, "importance": 5}]},
				],
			},
			"maria_nina_device": {"lines": [
				{"text": "She'll be trapped here. In this loop. Forever. No way back, no way to stop the resets.", "speaker": Constants.NPC_MARIA, "truthful": true},
				{"text": "She needs to destroy the mayor's device before hers dies. It's the only way.", "speaker": Constants.NPC_MARIA, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "Then we destroy it together.", "leads_to": "end"},
				],
				"reveals_clues": [{"id": "nina_device_stakes", "title": "Nina's Device Failing", "description": "Nina's device drains each loop. If it dies she's trapped forever. Must destroy mayor's device first.", "category": Enums.ClueCategory.TESTIMONY, "importance": 4}]},
			]},
			"confrontation": {
				"required_clues": ["maria_loop_witness", "nina_parallel_confirmed"],
				"lines": [
					{"text": "You know everything now, don't you, dear?", "speaker": Constants.NPC_MARIA, "truthful": true},
					{"text": "I've been so scared. But you remember the loops. You're our best chance.", "speaker": Constants.NPC_MARIA, "truthful": true},
					{"text": "Nina's device, Frank's records, Iris's evidence -- bring it all together and we can end this.", "speaker": Constants.NPC_MARIA, "truthful": true,
					"choices": [
						{"id": "plan", "text": "How do we do it?", "leads_to": "maria_plan"},
						{"id": "done", "text": "I won't let you down.", "leads_to": "end"},
					],
					"reveals_clues": [{"id": "maria_full_picture", "title": "Maria's Complete Account", "description": "Maria confirmed everything and believes combining all evidence sources can end the loop.", "category": Enums.ClueCategory.TESTIMONY, "importance": 5}]},
				],
			},
			"maria_plan": {"lines": [
				{"text": "Nina knows where the device is. Frank has the financial records. Iris has the investigation.", "speaker": Constants.NPC_MARIA, "truthful": true},
				{"text": "Get them together in one loop. Expose the mayor before the reset. Someone has to reach that basement.", "speaker": Constants.NPC_MARIA, "truthful": true},
				{"text": "I'll keep the cafe open all night as a safe meeting point. And I make one hell of a strong coffee.", "speaker": Constants.NPC_MARIA, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "This loop ends tonight.", "leads_to": "end"},
				]},
			]},
			"end": {"lines": []},
		},
	}


static func _build_hale() -> void:
	_npc_data[Constants.NPC_HALE] = {
		"id": Constants.NPC_HALE,
		"name": "Detective Hale",
		"job": "detective",
		"personality_traits": [Enums.PersonalityTrait.DECEITFUL, Enums.PersonalityTrait.AGGRESSIVE, Enums.PersonalityTrait.GREEDY],
		"secrets": ["On Mayor's payroll", "Tampers with evidence", "Covered up previous murders"],
		"sprite_seed": 303,
		"relationships": [
			{"target": Constants.NPC_MAYOR, "type": Enums.RelationshipType.SUBORDINATE, "trust": 2},
			{"target": Constants.NPC_VICTOR, "type": Enums.RelationshipType.COWORKER, "trust": 1},
			{"target": Constants.NPC_ELEANOR, "type": Enums.RelationshipType.COWORKER, "trust": 1},
		],
		"default_dialogue": {
			"greeting": {"lines": [
				{"text": "This is a police station, not a tourist stop. State your business.", "speaker": Constants.NPC_HALE, "truthful": true,
				"choices": [
					{"id": "crimes", "text": "Any crime reports lately?", "leads_to": "about_crimes"},
					{"id": "mayor", "text": "How's the mayor?", "leads_to": "about_mayor"},
					{"id": "victor", "text": "Know Victor Crane?", "leads_to": "about_victor"},
					{"id": "eleanor", "text": "How's Dr. Solomon?", "leads_to": "about_eleanor"},
					{"id": "iris", "text": "A journalist has been asking questions...", "leads_to": "about_iris"},
					{"id": "frank", "text": "Been to Crossroads bar?", "leads_to": "about_frank"},
					{"id": "done", "text": "Sorry to bother you.", "leads_to": "end"},
				]},
			]},
			"greeting_familiar": {"lines": [
				{"text": "You again. I thought I told you to move along. What part of 'classified' don't you understand?", "speaker": Constants.NPC_HALE, "truthful": true,
				"choices": [
					{"id": "crimes", "text": "New cases?", "leads_to": "about_crimes"},
					{"id": "docks", "text": "What's at the docks?", "leads_to": "about_docks"},
					{"id": "iris", "text": "Iris Chen. What do you know?", "leads_to": "about_iris"},
					{"id": "tommy", "text": "Tommy Reeves come in?", "leads_to": "about_tommy"},
					{"id": "penny", "text": "Know Penny Marsh?", "leads_to": "about_penny"},
					{"id": "done", "text": "I'll come back.", "leads_to": "end"},
				]},
			]},
			"greeting_late_game": {"lines": [
				{"text": "I don't have time for you. Things are complicated. Whatever you want, the answer is no.", "speaker": Constants.NPC_HALE, "truthful": true,
				"choices": [
					{"id": "cornered", "text": "Complicated because the conspiracy is unraveling?", "leads_to": "hale_cornered"},
					{"id": "evidence", "text": "I know about the evidence tampering.", "leads_to": "hale_evidence_accusation"},
					{"id": "deal", "text": "I can help you get out.", "leads_to": "hale_deal_offer"},
					{"id": "done", "text": "Tick tock, Detective.", "leads_to": "end"},
				]},
			]},
			"about_crimes": {"lines": [
				{"text": "Nothing I can't handle. Crime rate's the lowest in the county. That's a fact.", "speaker": Constants.NPC_HALE, "truthful": false,
				"choices": [
					{"id": "docks", "text": "I heard about the docks.", "leads_to": "about_docks"},
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "Alright.", "leads_to": "end"},
				]},
			]},
			"about_docks": {"lines": [
				{"text": "The docks? Rough area, sure. But nothing criminal. Who told you otherwise?", "speaker": Constants.NPC_HALE, "truthful": false,
				"choices": [
					{"id": "press", "text": "Multiple witnesses, actually.", "leads_to": "hale_press_witnesses"},
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "Just rumors.", "leads_to": "end"},
				]},
			]},
			"hale_press_witnesses": {"lines": [
				{"text": "Witnesses? People see things that aren't there. It's called an overactive imagination.", "speaker": Constants.NPC_HALE, "truthful": false},
				{"text": "I'd be careful throwing accusations around. That's how people get in trouble. Friendly advice.", "speaker": Constants.NPC_HALE, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "Is that a threat?", "leads_to": "end"},
				]},
			]},
			"about_mayor": {"lines": [
				{"text": "Mayor Aldridge is a fine public servant. Best thing for this town. Why are you asking?", "speaker": Constants.NPC_HALE, "truthful": false,
				"choices": [
					{"id": "press", "text": "You two seem close.", "leads_to": "hale_mayor_close"},
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "No reason.", "leads_to": "end"},
				]},
			]},
			"hale_mayor_close": {"lines": [
				{"text": "He's the mayor. I'm a detective. We work together. That's called professionalism.", "speaker": Constants.NPC_HALE, "truthful": false,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "Professionalism. Right.", "leads_to": "end"},
				]},
			]},
			"about_victor": {"lines": [
				{"text": "Crane? Businessman. Brings jobs to this town. I don't see a problem. Do you?", "speaker": Constants.NPC_HALE, "truthful": false,
				"choices": [
					{"id": "press", "text": "His methods seem questionable.", "leads_to": "hale_victor_defend"},
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "Just asking.", "leads_to": "end"},
				]},
			]},
			"hale_victor_defend": {"lines": [
				{"text": "According to who? Jealous competitors? The man develops real estate. Not a crime. Drop it.", "speaker": Constants.NPC_HALE, "truthful": false,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "Noted.", "leads_to": "end"},
				]},
			]},
			"about_eleanor": {"lines": [
				{"text": "Dr. Solomon is a competent medical examiner. Reports are thorough. That's all.", "speaker": Constants.NPC_HALE, "truthful": false,
				"choices": [
					{"id": "press", "text": "Are they? All of them?", "leads_to": "hale_reports_defense"},
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "Good to know.", "leads_to": "end"},
				]},
			]},
			"hale_reports_defense": {"lines": [
				{"text": "Questioning a medical professional's integrity? Based on what? That's slander.", "speaker": Constants.NPC_HALE, "truthful": false,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "Defensive, aren't we?", "leads_to": "end"},
				]},
			]},
			"about_iris": {"lines": [
				{"text": "The journalist? A nuisance. Sticking her nose where it doesn't belong.", "speaker": Constants.NPC_HALE, "truthful": true},
				{"text": "I've warned her about interfering. If she keeps it up, there'll be consequences.", "speaker": Constants.NPC_HALE, "truthful": false,
				"choices": [
					{"id": "press", "text": "What kind of consequences?", "leads_to": "hale_iris_threat"},
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "She's doing her job.", "leads_to": "end"},
				]},
			]},
			"hale_iris_threat": {"lines": [
				{"text": "Obstruction charges. Trespassing. Maybe worse if she prints something defamatory.", "speaker": Constants.NPC_HALE, "truthful": false},
				{"text": "Mind your own business. Leave the policing to the police.", "speaker": Constants.NPC_HALE, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "I'll keep that in mind.", "leads_to": "end"},
				],
				"reveals_clues": [{"id": "hale_threatens_iris", "title": "Hale Threatens Iris", "description": "Hale threatened obstruction charges against Iris to stop her investigation.", "category": Enums.ClueCategory.TESTIMONY, "importance": 2}]},
			]},
			"about_frank": {"lines": [
				{"text": "The bartender? He pours drinks. I go in for a beer sometimes. Not a crime.", "speaker": Constants.NPC_HALE, "truthful": false,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "Nobody said it was.", "leads_to": "end"},
				]},
			]},
			"about_tommy": {"lines": [
				{"text": "The delivery kid? He delivers packages. Why would I know about him?", "speaker": Constants.NPC_HALE, "truthful": false,
				"choices": [
					{"id": "press", "text": "He delivers for Victor Crane.", "leads_to": "hale_tommy_crane"},
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "No reason.", "leads_to": "end"},
				]},
			]},
			"hale_tommy_crane": {"lines": [
				{"text": "Crane's legitimate. His deliveries are his business. Got evidence of something? No? Then we're done.", "speaker": Constants.NPC_HALE, "truthful": false,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "For now.", "leads_to": "end"},
				]},
			]},
			"about_penny": {"lines": [
				{"text": "The street rat? She's a petty thief. Not worth my time. Why, she steal something of yours?", "speaker": Constants.NPC_HALE, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "No. Just curious.", "leads_to": "end"},
				]},
			]},
			"hale_cornered": {"lines": [
				{"text": "Conspiracy? You've been talking to that journalist. She's filling your head with nonsense.", "speaker": Constants.NPC_HALE, "truthful": false},
				{"text": "There is no conspiracy. Now get out of my station.", "speaker": Constants.NPC_HALE, "truthful": false,
				"choices": [
					{"id": "push", "text": "I have financial records, Hale.", "leads_to": "hale_records_panic"},
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "We'll see.", "leads_to": "end"},
				]},
			]},
			"hale_records_panic": {"lines": [
				{"text": "Records? Where did you-- I mean, whatever you have, it's fabricated. Inadmissible.", "speaker": Constants.NPC_HALE, "truthful": false},
				{"text": "People who make accusations without backing them up tend to regret it.", "speaker": Constants.NPC_HALE, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "We'll let a judge decide.", "leads_to": "end"},
				],
				"reveals_clues": [{"id": "hale_panic_reaction", "title": "Hale Panics at Records", "description": "Hale panicked when records were mentioned, almost asking where they were found.", "category": Enums.ClueCategory.OBSERVATION, "importance": 3}]},
			]},
			"hale_evidence_accusation": {"lines": [
				{"text": "Evidence tampering? I'm a decorated officer. I don't tamper with evidence.", "speaker": Constants.NPC_HALE, "truthful": false},
				{"text": "Repeat that outside this room and I'll arrest you for defamation.", "speaker": Constants.NPC_HALE, "truthful": true,
				"choices": [
					{"id": "push", "text": "Autopsy reports don't match crime scenes.", "leads_to": "hale_autopsy_mismatch"},
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "I have what I need.", "leads_to": "end"},
				]},
			]},
			"hale_autopsy_mismatch": {"lines": [
				{"text": "How would you know what crime scenes looked like? Those are sealed files.", "speaker": Constants.NPC_HALE, "truthful": true},
				{"text": "Listen carefully. The people above me don't play nice. Walk away while you can.", "speaker": Constants.NPC_HALE, "truthful": true,
				"choices": [
					{"id": "press", "text": "Who's above you?", "leads_to": "hale_chain"},
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "I'm not walking away.", "leads_to": "end"},
				],
				"reveals_clues": [{"id": "hale_sealed_files", "title": "Hale Admits Sealed Files", "description": "Hale confirmed crime scene files are sealed and people above him are dangerous.", "category": Enums.ClueCategory.TESTIMONY, "importance": 3}]},
			]},
			"hale_chain": {"lines": [
				{"text": "I've said too much. This conversation is over. Get out. Now.", "speaker": Constants.NPC_HALE, "truthful": true,
				"choices": [
					{"id": "done", "text": "I'll be back, Hale.", "leads_to": "end"},
				]},
			]},
			"hale_deal_offer": {"lines": [
				{"text": "Help me? Nobody can. I made my bed twenty years ago.", "speaker": Constants.NPC_HALE, "truthful": true},
				{"text": "The mayor has things on me. Things that would end everything. I do what I'm told.", "speaker": Constants.NPC_HALE, "truthful": true,
				"choices": [
					{"id": "leverage", "text": "What does he have on you?", "leads_to": "hale_leverage"},
					{"id": "protect", "text": "Testify and I'll protect you.", "leads_to": "hale_consider"},
					{"id": "done", "text": "Everyone has a choice.", "leads_to": "end"},
				],
				"reveals_clues": [{"id": "hale_blackmailed", "title": "Hale Is Blackmailed", "description": "The mayor has compromising material on Hale. He complies to protect his career and freedom.", "category": Enums.ClueCategory.TESTIMONY, "importance": 4}]},
			]},
			"hale_leverage": {"lines": [
				{"text": "Twenty years ago I buried a case. Someone died and I made it go away because Aldridge asked.", "speaker": Constants.NPC_HALE, "truthful": true},
				{"text": "He kept the evidence. Photos, my report. One phone call and I'm in prison for life.", "speaker": Constants.NPC_HALE, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "Twenty years of this...", "leads_to": "end"},
				],
				"reveals_clues": [{"id": "hale_buried_case", "title": "Hale's Buried Murder", "description": "Twenty years ago Hale buried a murder at Aldridge's request. Aldridge kept all evidence as leverage.", "category": Enums.ClueCategory.TESTIMONY, "importance": 4}]},
			]},
			"hale_consider": {"lines": [
				{"text": "Protected by who? You? Against the mayor and everyone he owns?", "speaker": Constants.NPC_HALE, "truthful": true},
				{"text": "But if you have real evidence that could take them all down... maybe I'd talk.", "speaker": Constants.NPC_HALE, "truthful": true},
				{"text": "Don't come back empty-handed.", "speaker": Constants.NPC_HALE, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "I'll get the evidence.", "leads_to": "end"},
				]},
			]},
			"conspiracy_reveal_25": {
				"min_conspiracy": 25,
				"choice_label": "The crime stats don't add up, Detective.",
				"lines": [
					{"text": "Don't add up? Our records are impeccable. Move along.", "speaker": Constants.NPC_HALE, "truthful": false,
					"choices": [
						{"id": "press", "text": "Missing persons filed as voluntary departures?", "leads_to": "hale_missing"},
						{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					],
					"reveals_clues": [{"id": "hale_stats_deflection", "title": "Hale Deflects on Stats", "description": "Hale dismisses crime stat irregularities, suggesting numbers are manipulated.", "category": Enums.ClueCategory.OBSERVATION, "importance": 2}]},
				],
			},
			"hale_missing": {"lines": [
				{"text": "People leave towns. It happens. That doesn't make it suspicious.", "speaker": Constants.NPC_HALE, "truthful": false},
				{"text": "Come back with a badge or a warrant.", "speaker": Constants.NPC_HALE, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "I'll get that warrant.", "leads_to": "end"},
				]},
			]},
			"conspiracy_reveal_50": {
				"min_conspiracy": 50,
				"choice_label": "I know you're on Aldridge's payroll.",
				"lines": [
					{"text": "Ridiculous. My salary is public record. Who told you that? The journalist?", "speaker": Constants.NPC_HALE, "truthful": false,
					"choices": [
						{"id": "proof", "text": "I've seen the envelopes at the bar.", "leads_to": "hale_envelope_caught"},
						{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					],
					"reveals_clues": [{"id": "hale_payroll_denial", "title": "Hale's Panicked Denial", "description": "Hale panicked and blamed Iris when accused of being on the mayor's payroll.", "category": Enums.ClueCategory.OBSERVATION, "importance": 3}]},
				],
			},
			"hale_envelope_caught": {"lines": [
				{"text": "The bar? Frank told you? That son of a-- I mean, I don't know what you're talking about.", "speaker": Constants.NPC_HALE, "truthful": false,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "Too late for forgetting.", "leads_to": "end"},
				],
				"reveals_clues": [{"id": "hale_implicates_frank", "title": "Hale Implicates Frank", "description": "Hale accidentally confirmed envelope exchanges by assuming Frank was the source.", "category": Enums.ClueCategory.TESTIMONY, "importance": 3}]},
			]},
			"conspiracy_reveal_75": {
				"min_conspiracy": 75,
				"choice_label": "The cover-ups, the autopsies -- I know all of it.",
				"lines": [
					{"text": "You don't know what you're doing. You'll get people killed.", "speaker": Constants.NPC_HALE, "truthful": true},
					{"text": "Fine. The mayor runs this town. Victor funds it. I enforce it. Eleanor cleans up.", "speaker": Constants.NPC_HALE, "truthful": true},
					{"text": "And there's something in City Hall that keeps it going. Even if you try to stop it... tomorrow it resets.", "speaker": Constants.NPC_HALE, "truthful": true,
					"choices": [
						{"id": "device", "text": "The loop device. You know about it.", "leads_to": "hale_loop_knowledge"},
						{"id": "why", "text": "Why did you go along with this?", "leads_to": "hale_why"},
						{"id": "done", "text": "Thank you for being honest.", "leads_to": "end"},
					],
					"reveals_clues": [{"id": "hale_conspiracy_confession", "title": "Hale's Confession", "description": "Full structure: Mayor runs it, Victor funds it, Hale enforces, Eleanor covers up. Aware of the loop device.", "category": Enums.ClueCategory.TESTIMONY, "importance": 5}]},
				],
			},
			"hale_loop_knowledge": {"lines": [
				{"text": "I know it exists. Don't know how it works. The mayor keeps that to himself.", "speaker": Constants.NPC_HALE, "truthful": true},
				{"text": "Only he was supposed to remember. You remembering too... that scares me.", "speaker": Constants.NPC_HALE, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "Good. Be scared.", "leads_to": "end"},
				],
				"reveals_clues": [{"id": "mayor_loop_memory", "title": "Mayor Retains Loop Memory", "description": "The mayor is supposed to be the only one who remembers across resets.", "category": Enums.ClueCategory.TESTIMONY, "importance": 4}]},
			]},
			"hale_why": {"lines": [
				{"text": "Because I was already dirty. One bad decision and Aldridge owned me. By the time the real conspiracy took shape, I was in too deep.", "speaker": Constants.NPC_HALE, "truthful": true},
				{"text": "I'm not a good man. But I'm not the monster you think. I just couldn't find the exit.", "speaker": Constants.NPC_HALE, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "Maybe this is your exit.", "leads_to": "end"},
				]},
			]},
			"confrontation": {
				"required_clues": ["hale_blackmailed", "hale_conspiracy_confession"],
				"lines": [
					{"text": "You've got everything? The records, the testimony? Then I'm done running.", "speaker": Constants.NPC_HALE, "truthful": true},
					{"text": "Every case I buried, every report I altered, every payment. All of it.", "speaker": Constants.NPC_HALE, "truthful": true},
					{"text": "Just tell them I helped in the end. That I chose right, even if it was too late.", "speaker": Constants.NPC_HALE, "truthful": true,
					"choices": [
						{"id": "accept", "text": "I'll make sure they know.", "leads_to": "hale_full_testimony"},
						{"id": "refuse", "text": "You'll face justice like everyone else.", "leads_to": "hale_accept_fate"},
						{"id": "done", "text": "We'll see.", "leads_to": "end"},
					],
					"reveals_clues": [{"id": "hale_cooperation", "title": "Hale Cooperates", "description": "Detective Hale agreed to provide full testimony about the conspiracy.", "category": Enums.ClueCategory.TESTIMONY, "importance": 5}]},
				],
			},
			"hale_full_testimony": {"lines": [
				{"text": "The mayor activated the device three months ago. Victor funded it through shell companies.", "speaker": Constants.NPC_HALE, "truthful": true},
				{"text": "Eleanor falsifies autopsies. Tommy delivers evidence unknowingly. Frank launders the money.", "speaker": Constants.NPC_HALE, "truthful": true},
				{"text": "The device is in City Hall's basement behind a locked door. Power runs through the main junction box.", "speaker": Constants.NPC_HALE, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "The power supply... that's how we stop it.", "leads_to": "end"},
				],
				"reveals_clues": [{"id": "device_power_supply", "title": "Device Power Location", "description": "Loop device in City Hall basement. Power runs through main junction box -- a vulnerability.", "category": Enums.ClueCategory.TESTIMONY, "importance": 5}]},
			]},
			"hale_accept_fate": {"lines": [
				{"text": "Yeah. I figured you'd say that. You're right. I deserve whatever's coming.", "speaker": Constants.NPC_HALE, "truthful": true},
				{"text": "Just stop the loop. Even if I rot in a cell, at least it'll be a real cell in a real tomorrow.", "speaker": Constants.NPC_HALE, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "A real tomorrow. I'll make it happen.", "leads_to": "end"},
				]},
			]},
			"end": {"lines": []},
		},
	}


static func _build_iris() -> void:
	_npc_data[Constants.NPC_IRIS] = {
		"id": Constants.NPC_IRIS,
		"name": "Iris Chen",
		"job": "journalist",
		"personality_traits": [Enums.PersonalityTrait.CURIOUS, Enums.PersonalityTrait.BRAVE, Enums.PersonalityTrait.HONEST],
		"secrets": ["Investigating the conspiracy", "Has a hidden recording device", "Knows about the loop"],
		"sprite_seed": 404,
		"relationships": [
			{"target": Constants.NPC_MARIA, "type": Enums.RelationshipType.FRIEND, "trust": 2},
			{"target": Constants.NPC_NINA, "type": Enums.RelationshipType.INFORMANT, "trust": 1},
			{"target": Constants.NPC_VICTOR, "type": Enums.RelationshipType.ENEMY, "trust": -3},
		],
		"default_dialogue": {
			"greeting": {"lines": [
				{"text": "Hey -- another investigator? Or just a curious citizen? Either way, pull up a chair.", "speaker": Constants.NPC_IRIS, "truthful": true,
				"choices": [
					{"id": "story", "text": "What are you investigating?", "leads_to": "about_story"},
					{"id": "victor", "text": "What do you know about Victor Crane?", "leads_to": "about_victor"},
					{"id": "maria", "text": "Maria speaks highly of you.", "leads_to": "about_maria"},
					{"id": "hale", "text": "What's your read on Detective Hale?", "leads_to": "about_hale"},
					{"id": "mayor", "text": "Looked into the mayor?", "leads_to": "about_mayor"},
					{"id": "nina", "text": "Met a woman named Nina?", "leads_to": "about_nina"},
					{"id": "done", "text": "Just exploring.", "leads_to": "end"},
				]},
			]},
			"greeting_familiar": {"lines": [
				{"text": "My sources say you've been busy. Off the record -- what have you found?", "speaker": Constants.NPC_IRIS, "truthful": true,
				"choices": [
					{"id": "story", "text": "What's your latest lead?", "leads_to": "about_story"},
					{"id": "victor", "text": "More on Victor.", "leads_to": "about_victor"},
					{"id": "hale", "text": "Hale's been threatening you.", "leads_to": "about_hale"},
					{"id": "eleanor", "text": "Know Dr. Solomon?", "leads_to": "about_eleanor"},
					{"id": "penny", "text": "Penny Marsh -- useful source?", "leads_to": "about_penny"},
					{"id": "tommy", "text": "Tommy might be in danger.", "leads_to": "about_tommy"},
					{"id": "done", "text": "Still gathering.", "leads_to": "end"},
				]},
			]},
			"greeting_late_game": {"lines": [
				{"text": "We're running out of time. But have you considered -- that might be literally true? My sources say something very strange is happening.", "speaker": Constants.NPC_IRIS, "truthful": true,
				"choices": [
					{"id": "loop", "text": "You know about the time loop?", "leads_to": "iris_loop_aware"},
					{"id": "case", "text": "How close is your case?", "leads_to": "iris_case_status"},
					{"id": "danger", "text": "You're in danger, Iris.", "leads_to": "iris_danger"},
					{"id": "done", "text": "Keep digging.", "leads_to": "end"},
				]},
			]},
			"about_story": {"lines": [
				{"text": "Big money is flowing into this town and people are disappearing. Someone is pulling strings from the top.", "speaker": Constants.NPC_IRIS, "truthful": true},
				{"text": "But have you considered -- it's not just corruption? There's something else going on. Something that doesn't fit normal patterns.", "speaker": Constants.NPC_IRIS, "truthful": true,
				"choices": [
					{"id": "who", "text": "Who's behind it?", "leads_to": "iris_who"},
					{"id": "patterns", "text": "What patterns?", "leads_to": "iris_patterns"},
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "Be careful.", "leads_to": "end"},
				]},
			]},
			"iris_who": {"lines": [
				{"text": "Follow the money. It always leads to the same names. Victor Crane, Mayor Aldridge. But I need proof, not suspicions.", "speaker": Constants.NPC_IRIS, "truthful": true},
				{"text": "My sources say there's a paper trail, but someone keeps making it disappear. Almost like someone knows I'm looking before I look.", "speaker": Constants.NPC_IRIS, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "I'll keep my eyes open.", "leads_to": "end"},
				]},
			]},
			"iris_patterns": {"lines": [
				{"text": "Okay, this is going to sound crazy. But have you noticed how certain events keep... repeating?", "speaker": Constants.NPC_IRIS, "truthful": true},
				{"text": "I've been keeping a journal. Same things happen at the same times. It's not coincidence -- it's a pattern. A loop.", "speaker": Constants.NPC_IRIS, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "You're onto something.", "leads_to": "end"},
				],
				"reveals_clues": [{"id": "iris_loop_journal", "title": "Iris's Loop Journal", "description": "Iris has been documenting repeating patterns in town events, noticing the loop independently.", "category": Enums.ClueCategory.DOCUMENT, "importance": 3}]},
			]},
			"about_victor": {"lines": [
				{"text": "Crane is dangerous. Land deals, shell companies, intimidation. I'm building a case, but he covers his tracks well.", "speaker": Constants.NPC_IRIS, "truthful": true},
				{"text": "My sources say he's connected to at least three disappearances. But every time I get close, the evidence vanishes.", "speaker": Constants.NPC_IRIS, "truthful": true,
				"choices": [
					{"id": "press", "text": "Three disappearances?", "leads_to": "iris_disappearances"},
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "Good luck.", "leads_to": "end"},
				]},
			]},
			"iris_disappearances": {"lines": [
				{"text": "A dock worker, a city clerk, and a surveyor. All asked questions about Victor's properties. All 'left town voluntarily.'", "speaker": Constants.NPC_IRIS, "truthful": true},
				{"text": "And guess who filed those reports? Detective Hale. Same officer, same conclusion, three times. That's not coincidence.", "speaker": Constants.NPC_IRIS, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "Hale and Victor, working together.", "leads_to": "end"},
				],
				"reveals_clues": [{"id": "three_disappearances", "title": "Three Suspicious Disappearances", "description": "A dock worker, city clerk, and surveyor all disappeared after questioning Victor. All filed as voluntary by Hale.", "category": Enums.ClueCategory.DOCUMENT, "importance": 3}]},
			]},
			"about_maria": {"lines": [
				{"text": "Maria is a treasure. She sees everything from that cafe and she's brave enough to remember it.", "speaker": Constants.NPC_IRIS, "truthful": true},
				{"text": "Off the record, she's told me things that would make your hair stand up. But I need to protect my sources.", "speaker": Constants.NPC_IRIS, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "She's brave.", "leads_to": "end"},
				]},
			]},
			"about_hale": {"lines": [
				{"text": "Hale is either the worst detective in history or the most corrupt. My sources say it's the latter.", "speaker": Constants.NPC_IRIS, "truthful": true},
				{"text": "He's been threatening me with obstruction charges. Classic intimidation. But I've got copies of everything off-site.", "speaker": Constants.NPC_IRIS, "truthful": true,
				"choices": [
					{"id": "press", "text": "What have you got on him?", "leads_to": "iris_hale_evidence"},
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "Watch your back.", "leads_to": "end"},
				]},
			]},
			"iris_hale_evidence": {"lines": [
				{"text": "Financial discrepancies. His bank account shows deposits that don't match his salary. Regular as clockwork.", "speaker": Constants.NPC_IRIS, "truthful": true},
				{"text": "But have you considered -- he might not be the top? He takes orders. The question is from who.", "speaker": Constants.NPC_IRIS, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "The mayor.", "leads_to": "end"},
				],
				"reveals_clues": [{"id": "hale_bank_discrepancies", "title": "Hale's Bank Discrepancies", "description": "Hale's bank account shows regular deposits exceeding his salary, evidence of payments.", "category": Enums.ClueCategory.DOCUMENT, "importance": 3}]},
			]},
			"about_mayor": {"lines": [
				{"text": "Aldridge is the key to everything. But he's also the most protected man in town.", "speaker": Constants.NPC_IRIS, "truthful": true},
				{"text": "Every lead I follow eventually circles back to City Hall. He's got Hale, Victor, probably others. A whole network.", "speaker": Constants.NPC_IRIS, "truthful": true,
				"choices": [
					{"id": "press", "text": "What's he hiding?", "leads_to": "iris_mayor_hiding"},
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "We need to break through.", "leads_to": "end"},
				]},
			]},
			"iris_mayor_hiding": {"lines": [
				{"text": "Something in City Hall. I've tried to get access to the basement three times. Security stops me every time.", "speaker": Constants.NPC_IRIS, "truthful": true},
				{"text": "Whatever's down there, it's important enough to guard 24/7. That's not normal for 'old files and plumbing.'", "speaker": Constants.NPC_IRIS, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "I'll find a way in.", "leads_to": "end"},
				],
				"reveals_clues": [{"id": "city_hall_security", "title": "City Hall Basement Security", "description": "City Hall basement is guarded 24/7 despite official claims it's just storage.", "category": Enums.ClueCategory.OBSERVATION, "importance": 3}]},
			]},
			"about_nina": {"lines": [
				{"text": "Nina Volkov. Mysterious. She approached me with information I couldn't verify through normal channels.", "speaker": Constants.NPC_IRIS, "truthful": true},
				{"text": "But have you considered -- she knows things that haven't happened yet? As a journalist, that should be impossible. And yet her predictions keep coming true.", "speaker": Constants.NPC_IRIS, "truthful": true,
				"choices": [
					{"id": "press", "text": "What predictions?", "leads_to": "iris_nina_predictions"},
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "She's special.", "leads_to": "end"},
				]},
			]},
			"iris_nina_predictions": {"lines": [
				{"text": "She told me where Victor would be and when, before he went there. She described a meeting that hadn't happened.", "speaker": Constants.NPC_IRIS, "truthful": true},
				{"text": "Either she's the best intelligence operative I've ever met, or she's experiencing time differently than we are.", "speaker": Constants.NPC_IRIS, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "The second one.", "leads_to": "end"},
				],
				"reveals_clues": [{"id": "nina_predictions", "title": "Nina's Accurate Predictions", "description": "Nina accurately predicted Victor's movements and meetings before they happened.", "category": Enums.ClueCategory.OBSERVATION, "importance": 3}]},
			]},
			"about_eleanor": {"lines": [
				{"text": "Dr. Solomon. Professionally speaking, her autopsy reports are... inconsistent. My sources say she's under pressure.", "speaker": Constants.NPC_IRIS, "truthful": true},
				{"text": "I think she wants to come clean but she's terrified. Classic witness intimidation pattern.", "speaker": Constants.NPC_IRIS, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "She could be turned.", "leads_to": "end"},
				]},
			]},
			"about_penny": {"lines": [
				{"text": "Penny Marsh. Street-level intelligence you can't buy. She sees things nobody else does because nobody sees her.", "speaker": Constants.NPC_IRIS, "truthful": true},
				{"text": "I've been trying to get her to go on record but she's too scared. Can't blame her.", "speaker": Constants.NPC_IRIS, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "She knows a lot.", "leads_to": "end"},
				]},
			]},
			"about_tommy": {"lines": [
				{"text": "Tommy Reeves is an innocent kid caught in a very dangerous web. He doesn't know what he's delivering for Victor.", "speaker": Constants.NPC_IRIS, "truthful": true},
				{"text": "If Victor decides Tommy's a liability... I don't want to think about it.", "speaker": Constants.NPC_IRIS, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "We need to warn him.", "leads_to": "end"},
				]},
			]},
			"iris_loop_aware": {"lines": [
				{"text": "The time loop? I've been documenting it for weeks. Same events, same timestamps, same outcomes.", "speaker": Constants.NPC_IRIS, "truthful": true},
				{"text": "My sources say it's connected to something in City Hall. Nina confirmed it. The question is -- who controls it and how do we stop it?", "speaker": Constants.NPC_IRIS, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "Together.", "leads_to": "end"},
				],
				"reveals_clues": [{"id": "iris_loop_documentation", "title": "Iris's Loop Documentation", "description": "Iris has weeks of documented evidence of repeating events with identical timestamps.", "category": Enums.ClueCategory.DOCUMENT, "importance": 4}]},
			]},
			"iris_case_status": {"lines": [
				{"text": "Close. I have the financial trail, the disappearances, and Hale's bank records. But I need one more thing.", "speaker": Constants.NPC_IRIS, "truthful": true},
				{"text": "A witness. Someone on the inside willing to talk. Frank, Eleanor, even Hale -- any of them could crack this open.", "speaker": Constants.NPC_IRIS, "truthful": true,
				"choices": [
					{"id": "frank", "text": "Frank might cooperate.", "leads_to": "iris_frank_cooperate"},
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "I'll find you a witness.", "leads_to": "end"},
				]},
			]},
			"iris_frank_cooperate": {"lines": [
				{"text": "Frank? Really? If he'd testify about the laundering, that connects Victor directly to the mayor's office.", "speaker": Constants.NPC_IRIS, "truthful": true},
				{"text": "Get me Frank's testimony and his records, and I can publish a story that not even Hale can bury. Off the record -- this could change everything.", "speaker": Constants.NPC_IRIS, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "I'll make it happen.", "leads_to": "end"},
				]},
			]},
			"iris_danger": {"lines": [
				{"text": "I know. I've had two break-ins this month. My laptop was cloned. Someone followed me home Tuesday.", "speaker": Constants.NPC_IRIS, "truthful": true},
				{"text": "But have you considered -- if I stop now, they win? Everything resets anyway. At least in this loop, I can fight.", "speaker": Constants.NPC_IRIS, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "Then we fight together.", "leads_to": "end"},
				],
				"reveals_clues": [{"id": "iris_surveillance", "title": "Iris Under Surveillance", "description": "Iris has been followed, broken into, and her laptop cloned. Active intimidation campaign.", "category": Enums.ClueCategory.OBSERVATION, "importance": 3}]},
			]},
			"conspiracy_reveal_25": {
				"min_conspiracy": 25,
				"choice_label": "I have information about the corruption.",
				"lines": [
					{"text": "You do? Off the record -- what have you got? I've been chasing this story for months.", "speaker": Constants.NPC_IRIS, "truthful": true},
					{"text": "My sources say Victor Crane's land deals are the financial backbone. Every property he buys, money gets cleaned through local businesses.", "speaker": Constants.NPC_IRIS, "truthful": true,
					"choices": [
						{"id": "press", "text": "Which businesses?", "leads_to": "iris_businesses"},
						{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					],
					"reveals_clues": [{"id": "iris_land_deal_trail", "title": "Land Deal Money Trail", "description": "Iris has traced Victor's land deals as the financial backbone of the conspiracy.", "category": Enums.ClueCategory.DOCUMENT, "importance": 2}]},
				],
			},
			"iris_businesses": {"lines": [
				{"text": "The bar is obvious. Crossroads -- Frank's place. But have you considered there might be others?", "speaker": Constants.NPC_IRIS, "truthful": true},
				{"text": "I'm tracking shell companies registered to Victor. At least four that I've found. All funneling money to the same place.", "speaker": Constants.NPC_IRIS, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "The same place being City Hall.", "leads_to": "end"},
				]},
			]},
			"conspiracy_reveal_50": {
				"min_conspiracy": 50,
				"choice_label": "The mayor is at the center of everything.",
				"lines": [
					{"text": "You've reached the same conclusion I have. But have you considered -- it might go even deeper than corruption?", "speaker": Constants.NPC_IRIS, "truthful": true},
					{"text": "I've been tracking patterns. Events repeating. The same crimes, the same victims, the same cover-ups. It's not just corruption -- it's a system.", "speaker": Constants.NPC_IRIS, "truthful": true},
					{"text": "And I think the mayor has found a way to make it permanent. Something in City Hall. Something that shouldn't exist.", "speaker": Constants.NPC_IRIS, "truthful": true,
					"choices": [
						{"id": "press", "text": "You know about the device?", "leads_to": "iris_device_theory"},
						{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					],
					"reveals_clues": [{"id": "iris_system_theory", "title": "Iris's System Theory", "description": "Iris has identified that the corruption operates as a repeating system, not just individual crimes.", "category": Enums.ClueCategory.DEDUCTION, "importance": 3}]},
				],
			},
			"iris_device_theory": {"lines": [
				{"text": "I have a theory. Nina gave me readings from some instrument. Energy signatures from City Hall that spike at the same time every day.", "speaker": Constants.NPC_IRIS, "truthful": true},
				{"text": "Whatever's in that basement is generating some kind of temporal field. Off the record -- I think the mayor is literally resetting time.", "speaker": Constants.NPC_IRIS, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "You're right.", "leads_to": "end"},
				],
				"reveals_clues": [{"id": "iris_energy_readings", "title": "City Hall Energy Readings", "description": "Nina provided Iris with energy readings showing temporal spikes from City Hall at consistent times.", "category": Enums.ClueCategory.DOCUMENT, "importance": 4}]},
			]},
			"conspiracy_reveal_75": {
				"min_conspiracy": 75,
				"choice_label": "Iris, I need your help to end this. All of it.",
				"lines": [
					{"text": "End it? The loop, the conspiracy, everything? I've been waiting to hear someone say that.", "speaker": Constants.NPC_IRIS, "truthful": true},
					{"text": "I have enough evidence to publish. Financial records, witness statements, energy readings. But publishing won't stop the device.", "speaker": Constants.NPC_IRIS, "truthful": true},
					{"text": "We need a two-pronged approach. Expose the conspiracy AND destroy the device. Simultaneously. Before the loop resets.", "speaker": Constants.NPC_IRIS, "truthful": true,
					"choices": [
						{"id": "plan", "text": "What's the plan?", "leads_to": "iris_plan"},
						{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
						{"id": "done", "text": "Let's do it.", "leads_to": "end"},
					],
					"reveals_clues": [{"id": "iris_ready_to_publish", "title": "Iris Ready to Publish", "description": "Iris has enough evidence to publish but needs the device destroyed simultaneously.", "category": Enums.ClueCategory.DEDUCTION, "importance": 4}]},
				],
			},
			"iris_plan": {"lines": [
				{"text": "I publish the story while someone gets to the basement. Nina knows where the device is. Frank has the financial proof.", "speaker": Constants.NPC_IRIS, "truthful": true},
				{"text": "If we time it right, the story hits while the device goes down. No reset, no cover-up. Checkmate.", "speaker": Constants.NPC_IRIS, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "Checkmate indeed.", "leads_to": "end"},
				]},
			]},
			"confrontation": {
				"required_clues": ["iris_loop_journal", "three_disappearances"],
				"lines": [
					{"text": "You've brought me everything I need. The disappearances, the financial trail, the loop evidence.", "speaker": Constants.NPC_IRIS, "truthful": true},
					{"text": "This is the story of a lifetime. A mayor who literally controls time to stay in power. Funded by a criminal, enforced by a corrupt cop.", "speaker": Constants.NPC_IRIS, "truthful": true},
					{"text": "I can have this published within the hour. But once it's out, there's no going back. For any of us.", "speaker": Constants.NPC_IRIS, "truthful": true,
					"choices": [
						{"id": "publish", "text": "Publish it. Now.", "leads_to": "iris_publish"},
						{"id": "wait", "text": "Wait until we disable the device.", "leads_to": "iris_wait"},
						{"id": "done", "text": "Your call, Iris.", "leads_to": "end"},
					],
					"reveals_clues": [{"id": "iris_full_story", "title": "Iris's Complete Story", "description": "Iris has compiled all evidence into a publishable story exposing the entire conspiracy.", "category": Enums.ClueCategory.DOCUMENT, "importance": 5}]},
				],
			},
			"iris_publish": {"lines": [
				{"text": "Uploading now. Encrypted backup to three servers. Even if they take me out, the story lives.", "speaker": Constants.NPC_IRIS, "truthful": true},
				{"text": "This is what journalism is for. Off the record -- I'm terrified. On the record -- let's burn it all down.", "speaker": Constants.NPC_IRIS, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "The truth will set us free.", "leads_to": "end"},
				]},
			]},
			"iris_wait": {"lines": [
				{"text": "Smart. If the loop resets after I publish, it all disappears. We need to kill the device first.", "speaker": Constants.NPC_IRIS, "truthful": true},
				{"text": "Get to that basement. Destroy whatever's down there. Then send me the signal and I'll hit publish.", "speaker": Constants.NPC_IRIS, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "You'll get the signal.", "leads_to": "end"},
				]},
			]},
			"end": {"lines": []},
		},
	}


static func _build_victor() -> void:
	_npc_data[Constants.NPC_VICTOR] = {
		"id": Constants.NPC_VICTOR,
		"name": "Victor Crane",
		"job": "businessman",
		"personality_traits": [Enums.PersonalityTrait.DECEITFUL, Enums.PersonalityTrait.GREEDY, Enums.PersonalityTrait.AGGRESSIVE],
		"secrets": ["Orchestrating land grabs", "Funding the loop device", "Has killed before"],
		"sprite_seed": 505,
		"relationships": [
			{"target": Constants.NPC_MAYOR, "type": Enums.RelationshipType.BOSS, "trust": 2},
			{"target": Constants.NPC_HALE, "type": Enums.RelationshipType.COWORKER, "trust": 1},
			{"target": Constants.NPC_FRANK, "type": Enums.RelationshipType.SUBORDINATE, "trust": -1},
			{"target": Constants.NPC_TOMMY, "type": Enums.RelationshipType.UNKNOWN, "trust": 0},
		],
		"default_dialogue": {
			"greeting": {"lines": [
				{"text": "I don't recall scheduling a meeting. Make it quick -- my time is money. Yours, considerably less so.", "speaker": Constants.NPC_VICTOR, "truthful": true,
				"choices": [
					{"id": "business", "text": "What kind of business are you in?", "leads_to": "about_business"},
					{"id": "docks", "text": "I saw you at the docks.", "leads_to": "about_docks"},
					{"id": "frank", "text": "Frank DeLuca sends his regards.", "leads_to": "about_frank"},
					{"id": "tommy", "text": "Your courier Tommy -- nice kid.", "leads_to": "about_tommy"},
					{"id": "hale", "text": "You and Detective Hale seem close.", "leads_to": "about_hale"},
					{"id": "mayor", "text": "Working with the mayor?", "leads_to": "about_mayor"},
					{"id": "done", "text": "My mistake.", "leads_to": "end"},
				]},
			]},
			"greeting_familiar": {"lines": [
				{"text": "You again. It would be unfortunate if I had to start considering you a nuisance. Business is business, but pests are another matter.", "speaker": Constants.NPC_VICTOR, "truthful": true,
				"choices": [
					{"id": "business", "text": "Let's talk about your 'business.'", "leads_to": "about_business"},
					{"id": "docks", "text": "The docks. What's really there?", "leads_to": "about_docks"},
					{"id": "frank", "text": "Frank's had enough.", "leads_to": "about_frank"},
					{"id": "iris", "text": "A journalist is looking into you.", "leads_to": "about_iris"},
					{"id": "penny", "text": "Someone's been watching you.", "leads_to": "about_penny"},
					{"id": "done", "text": "Just passing through.", "leads_to": "end"},
				]},
			]},
			"greeting_late_game": {"lines": [
				{"text": "I know what you've been doing. Who you've been talking to. It would be very unfortunate if that continued.", "speaker": Constants.NPC_VICTOR, "truthful": true,
				"choices": [
					{"id": "threaten_back", "text": "Threatening me won't work, Victor.", "leads_to": "victor_threaten_back"},
					{"id": "device", "text": "I know about the device.", "leads_to": "victor_device_confront"},
					{"id": "offer", "text": "What if I could help you?", "leads_to": "victor_offer"},
					{"id": "done", "text": "We'll see who's unfortunate.", "leads_to": "end"},
				]},
			]},
			"about_business": {"lines": [
				{"text": "Real estate development. Revitalizing this town. You should be thanking me.", "speaker": Constants.NPC_VICTOR, "truthful": false},
				{"text": "Every building I buy, every lot I develop -- that's progress. That's investment. The little people don't see it, but that's why they're little.", "speaker": Constants.NPC_VICTOR, "truthful": false,
				"choices": [
					{"id": "press", "text": "Some people call it a land grab.", "leads_to": "victor_land_grab"},
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "I see.", "leads_to": "end"},
				]},
			]},
			"victor_land_grab": {"lines": [
				{"text": "People talk. I build. We'll see whose legacy lasts. It would be unfortunate if you ended up on the wrong side of progress.", "speaker": Constants.NPC_VICTOR, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "We'll talk again.", "leads_to": "end"},
				]},
			]},
			"about_docks": {"lines": [
				{"text": "The docks are part of my development project. Nothing unusual about inspecting your investments.", "speaker": Constants.NPC_VICTOR, "truthful": false},
				{"text": "Though I'd suggest staying away from that area at night. Rough crowd. It would be a shame if something happened to you.", "speaker": Constants.NPC_VICTOR, "truthful": true,
				"choices": [
					{"id": "press", "text": "Is that a warning or a threat?", "leads_to": "victor_docks_threat"},
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "Right.", "leads_to": "end"},
				]},
			]},
			"victor_docks_threat": {"lines": [
				{"text": "Call it friendly advice. From one professional to... whatever you are. The docks are my territory.", "speaker": Constants.NPC_VICTOR, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "Noted.", "leads_to": "end"},
				],
				"reveals_clues": [{"id": "victor_docks_territorial", "title": "Victor Claims the Docks", "description": "Victor explicitly claimed the docks as his territory and threatened anyone investigating.", "category": Enums.ClueCategory.TESTIMONY, "importance": 2}]},
			]},
			"about_frank": {"lines": [
				{"text": "DeLuca? He runs a bar. Occasionally I have a drink there. Business is business.", "speaker": Constants.NPC_VICTOR, "truthful": false},
				{"text": "Though between us, the man owes some debts. It would be unfortunate if those came due all at once.", "speaker": Constants.NPC_VICTOR, "truthful": true,
				"choices": [
					{"id": "press", "text": "Debts to you?", "leads_to": "victor_frank_debts"},
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "I'll pass that along.", "leads_to": "end"},
				]},
			]},
			"victor_frank_debts": {"lines": [
				{"text": "I'm a businessman. I invest in businesses. Sometimes those investments come with... obligations. That's just how the world works.", "speaker": Constants.NPC_VICTOR, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "Obligations. Sure.", "leads_to": "end"},
				]},
			]},
			"about_tommy": {"lines": [
				{"text": "The delivery boy? He does his job, I pay him well. Simple transaction. The kid should be grateful.", "speaker": Constants.NPC_VICTOR, "truthful": false,
				"choices": [
					{"id": "press", "text": "What's in those sealed crates?", "leads_to": "victor_crates"},
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "He's just a kid.", "leads_to": "end"},
				]},
			]},
			"victor_crates": {"lines": [
				{"text": "Business supplies. Documents. Building materials. I don't see why that concerns you.", "speaker": Constants.NPC_VICTOR, "truthful": false},
				{"text": "And if Tommy is smart, he'll keep delivering and keep his mouth shut. That's how people stay healthy in this town.", "speaker": Constants.NPC_VICTOR, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "Stay away from Tommy.", "leads_to": "end"},
				],
				"reveals_clues": [{"id": "victor_tommy_threat", "title": "Victor Threatens Tommy", "description": "Victor implied Tommy's safety depends on his silence about deliveries.", "category": Enums.ClueCategory.TESTIMONY, "importance": 3}]},
			]},
			"about_hale": {"lines": [
				{"text": "Detective Hale is a public servant doing his job. We occasionally consult on... security matters.", "speaker": Constants.NPC_VICTOR, "truthful": false,
				"choices": [
					{"id": "press", "text": "Security matters involving envelopes of cash?", "leads_to": "victor_hale_cash"},
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "Security. Right.", "leads_to": "end"},
				]},
			]},
			"victor_hale_cash": {"lines": [
				{"text": "I don't know what you're implying, but I'd suggest you be very careful with accusations you can't prove.", "speaker": Constants.NPC_VICTOR, "truthful": false},
				{"text": "It would be extremely unfortunate if those accusations reached the wrong ears.", "speaker": Constants.NPC_VICTOR, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "I have proof.", "leads_to": "end"},
				]},
			]},
			"about_mayor": {"lines": [
				{"text": "The mayor and I share a vision for this town's future. Growth, development, prosperity. For those who deserve it.", "speaker": Constants.NPC_VICTOR, "truthful": false,
				"choices": [
					{"id": "press", "text": "And who decides who deserves it?", "leads_to": "victor_deserves"},
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "A shared vision.", "leads_to": "end"},
				]},
			]},
			"victor_deserves": {"lines": [
				{"text": "The market decides. And the market favors those who take action. The rest? Well, that's evolution, isn't it?", "speaker": Constants.NPC_VICTOR, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "Social Darwinism from a criminal.", "leads_to": "end"},
				]},
			]},
			"about_iris": {"lines": [
				{"text": "The journalist? A minor irritation. She writes stories nobody reads. It would be unfortunate if she became... a bigger problem.", "speaker": Constants.NPC_VICTOR, "truthful": false,
				"choices": [
					{"id": "press", "text": "She has evidence.", "leads_to": "victor_iris_evidence"},
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "She's braver than you think.", "leads_to": "end"},
				]},
			]},
			"victor_iris_evidence": {"lines": [
				{"text": "Evidence of what? Legal business transactions? Philanthropy? Let her publish. My lawyers will eat her alive.", "speaker": Constants.NPC_VICTOR, "truthful": false,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "We'll see.", "leads_to": "end"},
				]},
			]},
			"about_penny": {"lines": [
				{"text": "I don't know who that is. Should I? Some street urchin isn't worth my attention.", "speaker": Constants.NPC_VICTOR, "truthful": false,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "She watches you.", "leads_to": "end"},
				]},
			]},
			"victor_threaten_back": {"lines": [
				{"text": "How refreshing. Someone with a spine. But spines can be broken, my friend. Business is business.", "speaker": Constants.NPC_VICTOR, "truthful": true},
				{"text": "You have no idea the forces you're dealing with. This town belongs to people who understand power.", "speaker": Constants.NPC_VICTOR, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "Not for long.", "leads_to": "end"},
				]},
			]},
			"victor_device_confront": {"lines": [
				{"text": "The device? I don't know what you're talking about.", "speaker": Constants.NPC_VICTOR, "truthful": false},
				{"text": "But hypothetically, if someone had invested millions in a technology that ensured stability... that would be smart business, wouldn't it?", "speaker": Constants.NPC_VICTOR, "truthful": true,
				"choices": [
					{"id": "press", "text": "You funded it. Through the land deals.", "leads_to": "victor_admits_funding"},
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "Hypothetically.", "leads_to": "end"},
				],
				"reveals_clues": [{"id": "victor_device_hint", "title": "Victor's Hypothetical Admission", "description": "Victor denied knowledge of the device but hypothetically described investing millions in 'stability technology.'", "category": Enums.ClueCategory.TESTIMONY, "importance": 3}]},
			]},
			"victor_admits_funding": {"lines": [
				{"text": "Land deals generate revenue. Revenue gets invested. Where it goes is nobody's business but mine and my partners'.", "speaker": Constants.NPC_VICTOR, "truthful": true},
				{"text": "And if that investment ensures this town stays exactly the way we want it... well, that's return on investment.", "speaker": Constants.NPC_VICTOR, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "You funded a time loop.", "leads_to": "end"},
				],
				"reveals_clues": [{"id": "victor_funding_confirmed", "title": "Victor Confirms Funding", "description": "Victor confirmed land deal revenue funds an investment that keeps the town 'exactly the way we want it.'", "category": Enums.ClueCategory.TESTIMONY, "importance": 4}]},
			]},
			"victor_offer": {"lines": [
				{"text": "Help me? Interesting. Everyone has a price. What's yours?", "speaker": Constants.NPC_VICTOR, "truthful": true},
				{"text": "If you're offering to walk away and keep quiet, I might be willing to make it worth your while. Business is business.", "speaker": Constants.NPC_VICTOR, "truthful": true,
				"choices": [
					{"id": "refuse", "text": "I'm not for sale.", "leads_to": "victor_not_for_sale"},
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "I'll think about it.", "leads_to": "end"},
				],
				"reveals_clues": [{"id": "victor_bribery_attempt", "title": "Victor's Bribery Attempt", "description": "Victor offered to pay for silence, confirming there's something worth covering up.", "category": Enums.ClueCategory.TESTIMONY, "importance": 2}]},
			]},
			"victor_not_for_sale": {"lines": [
				{"text": "Everyone says that. Until they see the alternative. It would be very unfortunate to learn what that is.", "speaker": Constants.NPC_VICTOR, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "I'll take my chances.", "leads_to": "end"},
				]},
			]},
			"conspiracy_reveal_25": {
				"min_conspiracy": 25,
				"choice_label": "Your land deals seem to involve a lot of disappearances.",
				"lines": [
					{"text": "Disappearances? People move. It's a free country. My developments improve property values -- some people cash out and leave.", "speaker": Constants.NPC_VICTOR, "truthful": false,
					"choices": [
						{"id": "press", "text": "Without telling anyone? Without forwarding addresses?", "leads_to": "victor_disappearances"},
						{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					],
					"reveals_clues": [{"id": "victor_dismisses_missing", "title": "Victor Dismisses Disappearances", "description": "Victor dismissed disappearances of people who questioned his deals as 'people moving.'", "category": Enums.ClueCategory.OBSERVATION, "importance": 2}]},
				],
			},
			"victor_disappearances": {"lines": [
				{"text": "Not everyone has the courtesy to say goodbye. That's not my problem. It's certainly not a crime.", "speaker": Constants.NPC_VICTOR, "truthful": false},
				{"text": "But I'd advise against becoming someone who asks too many questions about my business. Purely for your own wellbeing.", "speaker": Constants.NPC_VICTOR, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "Advice noted.", "leads_to": "end"},
				]},
			]},
			"conspiracy_reveal_50": {
				"min_conspiracy": 50,
				"choice_label": "I know about the laundering through Frank's bar.",
				"lines": [
					{"text": "Laundering? That's a very specific accusation. I hope you have evidence to back it up.", "speaker": Constants.NPC_VICTOR, "truthful": false},
					{"text": "Frank runs a bar. I'm a customer. If he's doing something illegal, that's his problem. Not mine.", "speaker": Constants.NPC_VICTOR, "truthful": false,
					"choices": [
						{"id": "push", "text": "I have his financial records.", "leads_to": "victor_records_reaction"},
						{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					],
					"reveals_clues": [{"id": "victor_denies_laundering", "title": "Victor Denies Laundering", "description": "Victor denied involvement in laundering despite evidence, attempting to deflect blame to Frank.", "category": Enums.ClueCategory.OBSERVATION, "importance": 3}]},
				],
			},
			"victor_records_reaction": {"lines": [
				{"text": "Records can be forged. Witnesses can be mistaken. Courts require proof beyond reasonable doubt.", "speaker": Constants.NPC_VICTOR, "truthful": true},
				{"text": "And it would be extremely unfortunate if those records were to... disappear. Things get lost all the time.", "speaker": Constants.NPC_VICTOR, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "I have copies.", "leads_to": "end"},
				],
				"reveals_clues": [{"id": "victor_destroy_evidence", "title": "Victor Threatens to Destroy Evidence", "description": "Victor implied he would make financial records disappear if they surface.", "category": Enums.ClueCategory.TESTIMONY, "importance": 3}]},
			]},
			"conspiracy_reveal_75": {
				"min_conspiracy": 75,
				"choice_label": "I know you funded the loop device, Victor.",
				"lines": [
					{"text": "The loop device? You've been talking to the wrong people. Interesting that you know about it, though.", "speaker": Constants.NPC_VICTOR, "truthful": true},
					{"text": "Fine. You want the truth? Yes. I invested. The mayor had a vision -- a town that never changes, where our power never fades.", "speaker": Constants.NPC_VICTOR, "truthful": true},
					{"text": "And it was the best investment I ever made. Every loop, every reset -- my deals stay closed, my money stays clean, my enemies stay forgotten.", "speaker": Constants.NPC_VICTOR, "truthful": true,
					"choices": [
						{"id": "press", "text": "And the people who died?", "leads_to": "victor_deaths"},
						{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
						{"id": "done", "text": "It ends now.", "leads_to": "end"},
					],
					"reveals_clues": [{"id": "victor_loop_confession", "title": "Victor's Loop Confession", "description": "Victor admitted to funding the loop device. Called it his best investment -- keeps deals closed and enemies forgotten.", "category": Enums.ClueCategory.TESTIMONY, "importance": 5}]},
				],
			},
			"victor_deaths": {"lines": [
				{"text": "Collateral. Business is business. You can't build an empire without breaking a few... foundations.", "speaker": Constants.NPC_VICTOR, "truthful": true},
				{"text": "Besides, in the loop, nobody stays dead. That's the beauty of it. No consequences. Ever.", "speaker": Constants.NPC_VICTOR, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "Consequences are coming.", "leads_to": "end"},
				],
				"reveals_clues": [{"id": "victor_no_consequences", "title": "Victor's Moral Void", "description": "Victor admitted people have died but dismisses it because the loop resets deaths. He sees no moral consequence.", "category": Enums.ClueCategory.TESTIMONY, "importance": 4}]},
			]},
			"confrontation": {
				"required_clues": ["victor_loop_confession", "victor_funding_confirmed"],
				"lines": [
					{"text": "So you've assembled your little case. Congratulations. It doesn't matter.", "speaker": Constants.NPC_VICTOR, "truthful": false},
					{"text": "The loop resets. Your evidence vanishes. Your witnesses forget. Business is business and this business never closes.", "speaker": Constants.NPC_VICTOR, "truthful": false},
					{"text": "Unless... you've found something I don't know about. Something that survives the reset. Have you?", "speaker": Constants.NPC_VICTOR, "truthful": true,
					"choices": [
						{"id": "bluff", "text": "I have. And you can't stop it.", "leads_to": "victor_bluff_response"},
						{"id": "truth", "text": "We're destroying the device.", "leads_to": "victor_device_panic"},
						{"id": "done", "text": "Watch and learn, Victor.", "leads_to": "end"},
					],
					"reveals_clues": [{"id": "victor_loop_reliance", "title": "Victor Relies on Reset", "description": "Victor's entire strategy depends on the loop erasing evidence each cycle. Destroying the device removes his protection.", "category": Enums.ClueCategory.DEDUCTION, "importance": 5}]},
				],
			},
			"victor_bluff_response": {"lines": [
				{"text": "You're bluffing. Nobody has that kind of power except the mayor. And he's on my side.", "speaker": Constants.NPC_VICTOR, "truthful": true},
				{"text": "But just in case... it would be very unfortunate if I had to accelerate certain plans. Very unfortunate indeed.", "speaker": Constants.NPC_VICTOR, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "Run while you can.", "leads_to": "end"},
				]},
			]},
			"victor_device_panic": {"lines": [
				{"text": "Destroy it? You can't. The basement is secured. The mayor has the only key. Hale guards the building.", "speaker": Constants.NPC_VICTOR, "truthful": true},
				{"text": "You're making a mistake. Without the device, this town collapses. The deals unwind, the money dries up, everything I've built--", "speaker": Constants.NPC_VICTOR, "truthful": true},
				{"text": "Wait. You're serious. You actually think you can do this. ...It would be very, very unfortunate.", "speaker": Constants.NPC_VICTOR, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "For you, Victor. For you.", "leads_to": "end"},
				],
				"reveals_clues": [{"id": "victor_basement_security", "title": "Basement Security Details", "description": "Victor revealed the basement is secured with the mayor's key and Hale guards the building.", "category": Enums.ClueCategory.TESTIMONY, "importance": 4}]},
			]},
			"end": {"lines": []},
		},
	}


static func _build_penny() -> void:
	_npc_data[Constants.NPC_PENNY] = {
		"id": Constants.NPC_PENNY,
		"name": "Penny Marsh",
		"job": "pickpocket",
		"personality_traits": [Enums.PersonalityTrait.CAUTIOUS, Enums.PersonalityTrait.CURIOUS, Enums.PersonalityTrait.COWARDLY],
		"secrets": ["Witnessed Victor's dealings", "Knows every NPC's routine", "Stole incriminating documents"],
		"sprite_seed": 606,
		"relationships": [
			{"target": Constants.NPC_TOMMY, "type": Enums.RelationshipType.FRIEND, "trust": 2},
			{"target": Constants.NPC_IRIS, "type": Enums.RelationshipType.UNKNOWN, "trust": 0},
			{"target": Constants.NPC_FRANK, "type": Enums.RelationshipType.UNKNOWN, "trust": 1},
		],
		"default_dialogue": {
			"greeting": {"lines": [
				{"text": "Whoa -- don't sneak up on me like that! You didn't hear this from me, but what do you want?", "speaker": Constants.NPC_PENNY, "truthful": true,
				"choices": [
					{"id": "streets", "text": "You seem to know these streets.", "leads_to": "about_streets"},
					{"id": "routines", "text": "Anyone acting suspicious?", "leads_to": "about_routines"},
					{"id": "victor", "text": "Seen Victor Crane around?", "leads_to": "about_victor"},
					{"id": "tommy", "text": "How's Tommy?", "leads_to": "about_tommy"},
					{"id": "hale", "text": "Hale giving you trouble?", "leads_to": "about_hale"},
					{"id": "frank", "text": "Frank lets you into the bar?", "leads_to": "about_frank"},
					{"id": "done", "text": "Nothing. Forget it.", "leads_to": "end"},
				]},
			]},
			"greeting_familiar": {"lines": [
				{"text": "Oh, it's you. Keep it quiet, yeah? I got eyes everywhere but that means eyes on me too. Watch your back.", "speaker": Constants.NPC_PENNY, "truthful": true,
				"choices": [
					{"id": "streets", "text": "What's the word on the street?", "leads_to": "about_streets"},
					{"id": "routines", "text": "Anyone doing anything weird today?", "leads_to": "about_routines"},
					{"id": "victor", "text": "Victor's latest moves?", "leads_to": "about_victor"},
					{"id": "nina", "text": "That new woman in town...", "leads_to": "about_nina"},
					{"id": "mayor", "text": "Seen the mayor doing anything shady?", "leads_to": "about_mayor"},
					{"id": "eleanor", "text": "Know the doctor?", "leads_to": "about_eleanor"},
					{"id": "done", "text": "Stay safe.", "leads_to": "end"},
				]},
			]},
			"greeting_late_game": {"lines": [
				{"text": "You need to be careful! People are disappearing. Like, more than usual. Keep it quiet and listen.", "speaker": Constants.NPC_PENNY, "truthful": true,
				"choices": [
					{"id": "disappearing", "text": "Who's disappearing?", "leads_to": "penny_disappearing"},
					{"id": "documents", "text": "You said you found something.", "leads_to": "penny_documents"},
					{"id": "help", "text": "I need your help.", "leads_to": "penny_help"},
					{"id": "done", "text": "I'll be careful.", "leads_to": "end"},
				]},
			]},
			"about_streets": {"lines": [
				{"text": "I live here. I see things. People don't notice me, which means I notice everything.", "speaker": Constants.NPC_PENNY, "truthful": true},
				{"text": "You didn't hear this from me, but this town runs on secrets. And I know most of 'em.", "speaker": Constants.NPC_PENNY, "truthful": true,
				"choices": [
					{"id": "press", "text": "What have you seen lately?", "leads_to": "penny_seen"},
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "Interesting.", "leads_to": "end"},
				]},
			]},
			"penny_seen": {"lines": [
				{"text": "Late-night meetings in alleys. Suits going where suits don't belong. Sealed envelopes. Cash changing hands.", "speaker": Constants.NPC_PENNY, "truthful": true},
				{"text": "That's all I'll say for free. Watch your back -- these people don't play nice.", "speaker": Constants.NPC_PENNY, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "I'll remember that.", "leads_to": "end"},
				]},
			]},
			"about_routines": {"lines": [
				{"text": "Suspicious? Half this town is suspicious. Depends what you're looking for.", "speaker": Constants.NPC_PENNY, "truthful": true},
				{"text": "I know where everyone goes and when. Victor hits the docks at sunset. Hale meets him after. The mayor never leaves City Hall after dark.", "speaker": Constants.NPC_PENNY, "truthful": true,
				"choices": [
					{"id": "press", "text": "Victor and Hale meet regularly?", "leads_to": "penny_meetings"},
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "That's useful.", "leads_to": "end"},
				],
				"reveals_clues": [{"id": "penny_routine_knowledge", "title": "Penny's Routine Intel", "description": "Penny knows NPC schedules: Victor at docks at sunset, Hale meets him after, mayor stays in City Hall after dark.", "category": Enums.ClueCategory.OBSERVATION, "importance": 2}]},
			]},
			"penny_meetings": {"lines": [
				{"text": "You didn't hear this from me, but yeah. Every day. Same time, same alley behind the bar.", "speaker": Constants.NPC_PENNY, "truthful": true},
				{"text": "Victor hands something to Hale -- envelope, thick. Hale checks inside, nods, walks away. Been happening for months.", "speaker": Constants.NPC_PENNY, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "Payoffs. Every day.", "leads_to": "end"},
				],
				"reveals_clues": [{"id": "penny_payoff_witness", "title": "Penny Witnesses Daily Payoffs", "description": "Penny has seen daily envelope exchanges between Victor and Hale in the alley behind the bar.", "category": Enums.ClueCategory.TESTIMONY, "importance": 3}]},
			]},
			"about_victor": {"lines": [
				{"text": "Victor Crane? Watch your back with that one. I've seen what happens to people who cross him.", "speaker": Constants.NPC_PENNY, "truthful": true},
				{"text": "He walks around like he owns the place. You didn't hear this from me, but... he kind of does.", "speaker": Constants.NPC_PENNY, "truthful": true,
				"choices": [
					{"id": "press", "text": "What happens to people who cross him?", "leads_to": "penny_victor_cross"},
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "I'll be careful.", "leads_to": "end"},
				]},
			]},
			"penny_victor_cross": {"lines": [
				{"text": "They disappear. One day they're here, next day -- gone. Like they never existed.", "speaker": Constants.NPC_PENNY, "truthful": true},
				{"text": "I saw Victor's guys grab a man near the docks once. Never saw that man again. Keep it quiet.", "speaker": Constants.NPC_PENNY, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "I believe you.", "leads_to": "end"},
				],
				"reveals_clues": [{"id": "penny_witness_abduction", "title": "Penny Witnessed Abduction", "description": "Penny saw Victor's men grab someone near the docks. That person was never seen again.", "category": Enums.ClueCategory.TESTIMONY, "importance": 3}]},
			]},
			"about_tommy": {"lines": [
				{"text": "Tommy's my friend. Only person in this town who's actually nice to me without wanting something.", "speaker": Constants.NPC_PENNY, "truthful": true},
				{"text": "He doesn't know how deep he's in. Those packages he delivers? I've peeked inside one. It's not business supplies.", "speaker": Constants.NPC_PENNY, "truthful": true,
				"choices": [
					{"id": "press", "text": "What was inside?", "leads_to": "penny_package_contents"},
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "We need to protect him.", "leads_to": "end"},
				]},
			]},
			"penny_package_contents": {"lines": [
				{"text": "Cash. Stacks of it. And documents -- property deeds, contracts, stuff with the mayor's seal on it.", "speaker": Constants.NPC_PENNY, "truthful": true},
				{"text": "Tommy's carrying evidence of the whole operation and he doesn't even know it. You didn't hear this from me.", "speaker": Constants.NPC_PENNY, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "Tommy's in real danger.", "leads_to": "end"},
				],
				"reveals_clues": [{"id": "package_contents_revealed", "title": "Package Contents Revealed", "description": "Tommy's packages contain cash and documents with the mayor's seal -- property deeds and contracts.", "category": Enums.ClueCategory.PHYSICAL_EVIDENCE, "importance": 4}]},
			]},
			"about_hale": {"lines": [
				{"text": "Hale? Keep it quiet around him. He's not a real cop -- he's Victor's enforcer with a badge.", "speaker": Constants.NPC_PENNY, "truthful": true},
				{"text": "I've seen him plant evidence, intimidate witnesses, escort people to the docks after dark. Bad news.", "speaker": Constants.NPC_PENNY, "truthful": true,
				"choices": [
					{"id": "press", "text": "He plants evidence?", "leads_to": "penny_hale_plants"},
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "Noted.", "leads_to": "end"},
				]},
			]},
			"penny_hale_plants": {"lines": [
				{"text": "Saw it myself. He put something in a guy's car then 'found' it during a search. Classic frame job.", "speaker": Constants.NPC_PENNY, "truthful": true},
				{"text": "That guy got arrested and nobody heard from him again. Watch your back around Hale.", "speaker": Constants.NPC_PENNY, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "He's going down.", "leads_to": "end"},
				],
				"reveals_clues": [{"id": "hale_plants_evidence", "title": "Hale Plants Evidence", "description": "Penny witnessed Hale planting evidence in someone's car and then 'finding' it to make an arrest.", "category": Enums.ClueCategory.TESTIMONY, "importance": 3}]},
			]},
			"about_frank": {"lines": [
				{"text": "Frank's okay. He lets me warm up at the bar when it's cold. Gives me leftovers.", "speaker": Constants.NPC_PENNY, "truthful": true},
				{"text": "He's scared though. I can tell. Something about Victor's got him trapped.", "speaker": Constants.NPC_PENNY, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "He is trapped.", "leads_to": "end"},
				]},
			]},
			"about_nina": {"lines": [
				{"text": "The new woman? She's weird. Not bad-weird, just... different. Like she knows where everything is already.", "speaker": Constants.NPC_PENNY, "truthful": true},
				{"text": "I followed her once. She went to City Hall, walked around the whole building with some gadget. Then she just stood there staring at the basement windows.", "speaker": Constants.NPC_PENNY, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "She's investigating something.", "leads_to": "end"},
				],
				"reveals_clues": [{"id": "penny_followed_nina", "title": "Penny Followed Nina", "description": "Penny saw Nina scanning City Hall with a device and staring at the basement windows.", "category": Enums.ClueCategory.OBSERVATION, "importance": 2}]},
			]},
			"about_mayor": {"lines": [
				{"text": "The mayor never leaves City Hall at night. Never. I've watched that building for weeks.", "speaker": Constants.NPC_PENNY, "truthful": true},
				{"text": "Sometimes I see blue light from the basement. Flickering. And the mayor comes out looking... refreshed? Like he just woke up from a good dream.", "speaker": Constants.NPC_PENNY, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "Blue light. The device.", "leads_to": "end"},
				],
				"reveals_clues": [{"id": "penny_blue_light", "title": "Penny Sees Blue Light", "description": "Penny has seen blue light from City Hall basement at night. Mayor exits looking refreshed afterward.", "category": Enums.ClueCategory.OBSERVATION, "importance": 3}]},
			]},
			"about_eleanor": {"lines": [
				{"text": "The doctor? She comes out of the hospital sometimes looking like she's been crying. Then Hale shows up and she pulls herself together.", "speaker": Constants.NPC_PENNY, "truthful": true},
				{"text": "Something's wrong with her. You didn't hear this from me, but I think she's being forced to do things she doesn't want to.", "speaker": Constants.NPC_PENNY, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "She wants out.", "leads_to": "end"},
				]},
			]},
			"penny_disappearing": {"lines": [
				{"text": "People who ask questions. People who look too close. Even a homeless guy who slept near the docks -- gone.", "speaker": Constants.NPC_PENNY, "truthful": true},
				{"text": "I'm scared. If they find out what I know, what I've seen... keep it quiet, okay?", "speaker": Constants.NPC_PENNY, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "I'll protect you.", "leads_to": "end"},
				]},
			]},
			"penny_documents": {"lines": [
				{"text": "Okay, okay. You didn't hear this from me. I picked a pocket I shouldn't have. One of Victor's guys.", "speaker": Constants.NPC_PENNY, "truthful": true},
				{"text": "Got a folder. Property deeds, bank transfers, names and dates. It's all connected -- Victor, the mayor, Hale.", "speaker": Constants.NPC_PENNY, "truthful": true},
				{"text": "I hid it. Under the loose brick by the market fountain. Too dangerous to carry.", "speaker": Constants.NPC_PENNY, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "That's incredible, Penny.", "leads_to": "end"},
				],
				"reveals_clues": [{"id": "penny_stolen_documents", "title": "Penny's Stolen Documents", "description": "Penny pickpocketed incriminating documents from Victor's associate. Hidden under the market fountain brick.", "category": Enums.ClueCategory.PHYSICAL_EVIDENCE, "importance": 5}]},
			]},
			"penny_help": {"lines": [
				{"text": "Help? Me? I'm a street rat. What can I do against suits and badges?", "speaker": Constants.NPC_PENNY, "truthful": true},
				{"text": "But... I know every alley, every back door, every blind spot in this town. If you need to get somewhere unseen, I'm your girl.", "speaker": Constants.NPC_PENNY, "truthful": true,
				"choices": [
					{"id": "city_hall", "text": "Can you get me into City Hall?", "leads_to": "penny_city_hall"},
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "That's exactly what I need.", "leads_to": "end"},
				]},
			]},
			"penny_city_hall": {"lines": [
				{"text": "City Hall? You're crazy. But... there's a service entrance on the east side. Lock's busted -- they never fixed it.", "speaker": Constants.NPC_PENNY, "truthful": true},
				{"text": "Gets you into the utility corridor. From there you can reach the basement stairs. Watch your back -- Hale patrols at the top of every hour.", "speaker": Constants.NPC_PENNY, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "You're amazing, Penny.", "leads_to": "end"},
				],
				"reveals_clues": [{"id": "city_hall_entry", "title": "City Hall Secret Entry", "description": "Busted service entrance on east side leads to utility corridor and basement stairs. Hale patrols hourly.", "category": Enums.ClueCategory.OBSERVATION, "importance": 5}]},
			]},
			"conspiracy_reveal_25": {
				"min_conspiracy": 25,
				"choice_label": "You see everything. What's really going on?",
				"lines": [
					{"text": "You didn't hear this from me, but... the suits run this town. Victor, the mayor, Hale -- they're all connected.", "speaker": Constants.NPC_PENNY, "truthful": true,
					"choices": [
						{"id": "press", "text": "How are they connected?", "leads_to": "penny_connections"},
						{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					],
					"reveals_clues": [{"id": "penny_power_structure", "title": "Penny's Street View", "description": "Penny confirms the power structure: Victor, mayor, and Hale all connected.", "category": Enums.ClueCategory.OBSERVATION, "importance": 2}]},
				],
			},
			"penny_connections": {"lines": [
				{"text": "Money flows up. Victor collects, the bar cleans it, Hale protects the operation, mayor gets his cut.", "speaker": Constants.NPC_PENNY, "truthful": true},
				{"text": "I've been watching for months. Keep it quiet -- if they knew I was talking, I'd be the next one to disappear.", "speaker": Constants.NPC_PENNY, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "Your secret's safe.", "leads_to": "end"},
				]},
			]},
			"conspiracy_reveal_50": {
				"min_conspiracy": 50,
				"choice_label": "Penny, I need to know about the docks.",
				"lines": [
					{"text": "The docks? That's where the heavy stuff happens. You didn't hear this from me.", "speaker": Constants.NPC_PENNY, "truthful": true},
					{"text": "Victor's warehouse -- crates come in at night. Not normal shipments. Armed guards, unmarked trucks.", "speaker": Constants.NPC_PENNY, "truthful": true,
					"choices": [
						{"id": "press", "text": "What's in the crates?", "leads_to": "penny_dock_crates"},
						{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					],
					"reveals_clues": [{"id": "penny_dock_intel", "title": "Penny's Dock Intelligence", "description": "Night shipments at Victor's warehouse with armed guards and unmarked trucks.", "category": Enums.ClueCategory.OBSERVATION, "importance": 3}]},
				],
			},
			"penny_dock_crates": {"lines": [
				{"text": "I snuck close once. Heard metal. Heavy equipment. One crate had a label I couldn't read -- looked scientific.", "speaker": Constants.NPC_PENNY, "truthful": true},
				{"text": "That equipment went straight to City Hall in a covered truck. Middle of the night. Watch your back if you go digging.", "speaker": Constants.NPC_PENNY, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "Scientific equipment to City Hall...", "leads_to": "end"},
				],
				"reveals_clues": [{"id": "equipment_to_city_hall", "title": "Equipment Shipped to City Hall", "description": "Scientific equipment delivered via Victor's docks was transported to City Hall at night.", "category": Enums.ClueCategory.OBSERVATION, "importance": 4}]},
			]},
			"conspiracy_reveal_75": {
				"min_conspiracy": 75,
				"choice_label": "I need to get into City Hall's basement. Can you help?",
				"lines": [
					{"text": "The basement? Are you insane? That's where... okay. You didn't hear this from me.", "speaker": Constants.NPC_PENNY, "truthful": true},
					{"text": "I got close to the basement once. Through the service entrance on the east side. Heard a humming sound. Felt weird, like my skin was buzzing.", "speaker": Constants.NPC_PENNY, "truthful": true},
					{"text": "Something's down there. Something big. And the mayor visits it every night like clockwork.", "speaker": Constants.NPC_PENNY, "truthful": true,
					"choices": [
						{"id": "route", "text": "Show me the way in.", "leads_to": "penny_city_hall"},
						{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
						{"id": "done", "text": "Thank you, Penny.", "leads_to": "end"},
					],
					"reveals_clues": [{"id": "penny_basement_recon", "title": "Penny's Basement Recon", "description": "Penny got near the basement, heard humming and felt physical buzzing. Mayor visits nightly.", "category": Enums.ClueCategory.OBSERVATION, "importance": 4}]},
				],
			},
			"confrontation": {
				"required_clues": ["penny_stolen_documents", "penny_payoff_witness"],
				"lines": [
					{"text": "You've got the documents I stole? And you know about the payoffs? Then you've got enough.", "speaker": Constants.NPC_PENNY, "truthful": true},
					{"text": "I'm just a street kid. Nobody listens to me. But those documents -- they speak for themselves.", "speaker": Constants.NPC_PENNY, "truthful": true},
					{"text": "Get them to Iris. She'll know what to do with them. And watch your back -- Victor's people are looking for whoever took that folder.", "speaker": Constants.NPC_PENNY, "truthful": true,
					"choices": [
						{"id": "promise", "text": "When this is over, you won't need to hide anymore.", "leads_to": "penny_hope"},
						{"id": "done", "text": "You're braver than you know, Penny.", "leads_to": "end"},
					],
					"reveals_clues": [{"id": "penny_full_testimony", "title": "Penny's Complete Testimony", "description": "Penny provided all her observations: payoffs, abductions, routines, stolen documents, and City Hall entry route.", "category": Enums.ClueCategory.TESTIMONY, "importance": 5}]},
				],
			},
			"penny_hope": {"lines": [
				{"text": "You really think so? A town where I don't have to watch my back every second?", "speaker": Constants.NPC_PENNY, "truthful": true},
				{"text": "That'd be nice. I'll believe it when I see it. But... thanks. For listening. Nobody ever listens to a street rat.", "speaker": Constants.NPC_PENNY, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "You're not a street rat. You're a witness.", "leads_to": "end"},
				]},
			]},
			"end": {"lines": []},
		},
	}


static func _build_eleanor() -> void:
	_npc_data[Constants.NPC_ELEANOR] = {
		"id": Constants.NPC_ELEANOR,
		"name": "Dr. Eleanor Solomon",
		"job": "doctor",
		"personality_traits": [Enums.PersonalityTrait.CAUTIOUS, Enums.PersonalityTrait.LOYAL, Enums.PersonalityTrait.PASSIVE],
		"secrets": ["Falsifies autopsies for Hale", "Knows the real cause of deaths", "Wants to come clean"],
		"sprite_seed": 707,
		"relationships": [
			{"target": Constants.NPC_HALE, "type": Enums.RelationshipType.COWORKER, "trust": -1},
			{"target": Constants.NPC_MAYOR, "type": Enums.RelationshipType.SUBORDINATE, "trust": 0},
			{"target": Constants.NPC_MARIA, "type": Enums.RelationshipType.UNKNOWN, "trust": 1},
		],
		"default_dialogue": {
			"greeting": {"lines": [
				{"text": "Can I help you? I'm rather busy with paperwork. Professionally speaking, I have a full schedule.", "speaker": Constants.NPC_ELEANOR, "truthful": true,
				"choices": [
					{"id": "work", "text": "What kind of work?", "leads_to": "about_work"},
					{"id": "deaths", "text": "Any unusual deaths recently?", "leads_to": "about_deaths"},
					{"id": "hale", "text": "You work with Detective Hale?", "leads_to": "about_hale"},
					{"id": "victor", "text": "Know Victor Crane?", "leads_to": "about_victor"},
					{"id": "maria", "text": "Maria's worried about you.", "leads_to": "about_maria"},
					{"id": "tommy", "text": "Tommy Reeves -- ever treat him?", "leads_to": "about_tommy"},
					{"id": "done", "text": "Sorry to interrupt.", "leads_to": "end"},
				]},
			]},
			"greeting_familiar": {"lines": [
				{"text": "You again. I can't discuss my cases. Professionally speaking, there are confidentiality protocols.", "speaker": Constants.NPC_ELEANOR, "truthful": true,
				"choices": [
					{"id": "deaths", "text": "The autopsy reports, Eleanor.", "leads_to": "about_deaths"},
					{"id": "hale", "text": "Hale's been pressuring you.", "leads_to": "about_hale"},
					{"id": "mayor", "text": "What does the mayor want from you?", "leads_to": "about_mayor"},
					{"id": "iris", "text": "Iris Chen is building a case.", "leads_to": "about_iris"},
					{"id": "frank", "text": "Frank says you cover things up.", "leads_to": "about_frank"},
					{"id": "done", "text": "Take care, Doctor.", "leads_to": "end"},
				]},
			]},
			"greeting_late_game": {"lines": [
				{"text": "I can't do this anymore. The evidence suggests... no. I can't discuss that. Please, just go.", "speaker": Constants.NPC_ELEANOR, "truthful": true,
				"choices": [
					{"id": "break", "text": "Eleanor, you need to tell the truth.", "leads_to": "eleanor_breaking"},
					{"id": "protect", "text": "I can protect you if you talk.", "leads_to": "eleanor_protection"},
					{"id": "reports", "text": "I've read the real autopsy data.", "leads_to": "eleanor_real_data"},
					{"id": "done", "text": "When you're ready, I'll listen.", "leads_to": "end"},
				]},
			]},
			"about_work": {"lines": [
				{"text": "Town medical examiner. Autopsies, health records. Nothing glamorous.", "speaker": Constants.NPC_ELEANOR, "truthful": true},
				{"text": "I went into medicine to help people. Professionally speaking, that's still what I do. Most days.", "speaker": Constants.NPC_ELEANOR, "truthful": false,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "Thanks, Doctor.", "leads_to": "end"},
				]},
			]},
			"about_deaths": {"lines": [
				{"text": "Unusual? No, nothing... nothing unusual. Everything is documented properly. The evidence suggests natural causes in most cases.", "speaker": Constants.NPC_ELEANOR, "truthful": false,
				"choices": [
					{"id": "press", "text": "You hesitated.", "leads_to": "eleanor_hesitation"},
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "Alright.", "leads_to": "end"},
				]},
			]},
			"eleanor_hesitation": {"lines": [
				{"text": "I... no. I just have a lot on my mind. Professionally speaking, the workload has been heavy.", "speaker": Constants.NPC_ELEANOR, "truthful": false},
				{"text": "Please, I need to get back to work. I can't discuss active cases.", "speaker": Constants.NPC_ELEANOR, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "I understand.", "leads_to": "end"},
				]},
			]},
			"about_hale": {"lines": [
				{"text": "Detective Hale is... a colleague. We work together on cases. Professionally speaking, our relationship is standard.", "speaker": Constants.NPC_ELEANOR, "truthful": false,
				"choices": [
					{"id": "press", "text": "He tells you what to write in the reports?", "leads_to": "eleanor_reports_pressed"},
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "Standard. Of course.", "leads_to": "end"},
				]},
			]},
			"eleanor_reports_pressed": {"lines": [
				{"text": "That's-- I don't-- the evidence suggests what it suggests. I write what I find.", "speaker": Constants.NPC_ELEANOR, "truthful": false},
				{"text": "This conversation is over. I can't discuss this. Professionally or otherwise.", "speaker": Constants.NPC_ELEANOR, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "We'll talk again.", "leads_to": "end"},
				]},
			]},
			"about_victor": {"lines": [
				{"text": "I don't know him personally. Professionally speaking, I've never had reason to interact with him.", "speaker": Constants.NPC_ELEANOR, "truthful": false,
				"choices": [
					{"id": "press", "text": "His name appears in your case files.", "leads_to": "eleanor_victor_files"},
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "Hmm.", "leads_to": "end"},
				]},
			]},
			"eleanor_victor_files": {"lines": [
				{"text": "Case files are confidential. I can't discuss who may or may not be referenced in medical documentation.", "speaker": Constants.NPC_ELEANOR, "truthful": true},
				{"text": "How did you even... never mind. I have nothing more to say.", "speaker": Constants.NPC_ELEANOR, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "You've said enough.", "leads_to": "end"},
				]},
			]},
			"about_maria": {"lines": [
				{"text": "Maria Santos? She owns the cafe. Nice woman. I go there sometimes for coffee.", "speaker": Constants.NPC_ELEANOR, "truthful": true},
				{"text": "She looks at me like she knows something. It makes me uncomfortable, professionally speaking.", "speaker": Constants.NPC_ELEANOR, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "Maybe she does know.", "leads_to": "end"},
				]},
			]},
			"about_tommy": {"lines": [
				{"text": "Tommy? He's a delivery boy. Why would I... I can't discuss patients.", "speaker": Constants.NPC_ELEANOR, "truthful": true},
				{"text": "He's a good kid. I hope nothing happens to him. Professionally speaking, young people shouldn't be in danger.", "speaker": Constants.NPC_ELEANOR, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "I hope so too.", "leads_to": "end"},
				]},
			]},
			"about_mayor": {"lines": [
				{"text": "The mayor? He's the mayor. I report to city administration. That's the extent of our relationship.", "speaker": Constants.NPC_ELEANOR, "truthful": false,
				"choices": [
					{"id": "press", "text": "He signs off on your altered reports.", "leads_to": "eleanor_mayor_signoff"},
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "Just city business.", "leads_to": "end"},
				]},
			]},
			"eleanor_mayor_signoff": {"lines": [
				{"text": "Altered? My reports are-- I mean, the evidence suggests-- please stop. I can't have this conversation.", "speaker": Constants.NPC_ELEANOR, "truthful": false,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "Your reaction says it all.", "leads_to": "end"},
				],
				"reveals_clues": [{"id": "eleanor_report_slip", "title": "Eleanor's Slip on Reports", "description": "Eleanor nearly admitted reports are altered before catching herself. Visibly distressed.", "category": Enums.ClueCategory.OBSERVATION, "importance": 3}]},
			]},
			"about_iris": {"lines": [
				{"text": "The journalist? She's been requesting my case files through FOIA. I can't discuss what she's looking for.", "speaker": Constants.NPC_ELEANOR, "truthful": true},
				{"text": "Professionally speaking, journalists have every right to request public records. I just... I worry about what she'll find.", "speaker": Constants.NPC_ELEANOR, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "She's getting close.", "leads_to": "end"},
				]},
			]},
			"about_frank": {"lines": [
				{"text": "Frank DeLuca? I don't know him well. I can't discuss what other people say about me.", "speaker": Constants.NPC_ELEANOR, "truthful": true},
				{"text": "If people are talking about my work, the evidence speaks for itself. Professionally speaking.", "speaker": Constants.NPC_ELEANOR, "truthful": false,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "Does it, though?", "leads_to": "end"},
				]},
			]},
			"eleanor_breaking": {"lines": [
				{"text": "The truth? The truth is that I've been lying. For months. Years, even. The evidence suggests-- no. The evidence was changed. By me.", "speaker": Constants.NPC_ELEANOR, "truthful": true},
				{"text": "Every autopsy Hale asks me to alter, I alter. Blunt force trauma becomes 'accidental fall.' Poisoning becomes 'heart failure.'", "speaker": Constants.NPC_ELEANOR, "truthful": true},
				{"text": "I keep the real findings in a separate notebook. Hidden. Because someday... someday someone would come asking.", "speaker": Constants.NPC_ELEANOR, "truthful": true,
				"choices": [
					{"id": "notebook", "text": "Where's the notebook?", "leads_to": "eleanor_notebook"},
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "Thank you for telling me.", "leads_to": "end"},
				],
				"reveals_clues": [{"id": "eleanor_falsification", "title": "Eleanor's Autopsy Falsification", "description": "Eleanor admitted to systematically altering autopsies at Hale's direction. Keeps real findings hidden.", "category": Enums.ClueCategory.TESTIMONY, "importance": 5}]},
			]},
			"eleanor_notebook": {"lines": [
				{"text": "In the medical supply closet. Behind the formaldehyde bottles on the top shelf. A blue notebook.", "speaker": Constants.NPC_ELEANOR, "truthful": true},
				{"text": "Every real cause of death. Every alteration I made. Dates, case numbers, who ordered the changes. Professionally speaking, it's my insurance policy.", "speaker": Constants.NPC_ELEANOR, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "This notebook will save lives.", "leads_to": "end"},
				],
				"reveals_clues": [{"id": "eleanor_blue_notebook", "title": "Eleanor's Blue Notebook", "description": "Real autopsy findings hidden in medical supply closet behind formaldehyde bottles. Contains all alterations with dates and who ordered them.", "category": Enums.ClueCategory.PHYSICAL_EVIDENCE, "importance": 5}]},
			]},
			"eleanor_protection": {"lines": [
				{"text": "Protect me? From who? Hale? The mayor? Victor?", "speaker": Constants.NPC_ELEANOR, "truthful": true},
				{"text": "I became a doctor to save lives. Instead I've been erasing them. The evidence suggests... I'm a coward.", "speaker": Constants.NPC_ELEANOR, "truthful": true,
				"choices": [
					{"id": "press", "text": "You're not a coward. You kept records.", "leads_to": "eleanor_not_coward"},
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "It's not too late.", "leads_to": "end"},
				]},
			]},
			"eleanor_not_coward": {"lines": [
				{"text": "I did. Every real finding, hidden away. Professionally speaking, it was the only way I could live with myself.", "speaker": Constants.NPC_ELEANOR, "truthful": true},
				{"text": "If you can end this -- really end it -- I'll testify. To everything. I just need to know it won't be erased.", "speaker": Constants.NPC_ELEANOR, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "It won't be erased. I promise.", "leads_to": "end"},
				]},
			]},
			"eleanor_real_data": {"lines": [
				{"text": "You've seen-- how? Those files are-- I kept them hidden--", "speaker": Constants.NPC_ELEANOR, "truthful": true},
				{"text": "Then you know. You know what I've done. The people who died of 'natural causes' were murdered. And I covered it up.", "speaker": Constants.NPC_ELEANOR, "truthful": true,
				"choices": [
					{"id": "press", "text": "How many deaths were falsified?", "leads_to": "eleanor_death_count"},
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "Help me make it right.", "leads_to": "end"},
				]},
			]},
			"eleanor_death_count": {"lines": [
				{"text": "Seven. Seven people in two years. All ruled natural causes or accidents. All actually murdered.", "speaker": Constants.NPC_ELEANOR, "truthful": true},
				{"text": "Hale brought me the bodies. Told me what to write. And I wrote it. God help me, I wrote it every time.", "speaker": Constants.NPC_ELEANOR, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "Seven people. They deserve justice.", "leads_to": "end"},
				],
				"reveals_clues": [{"id": "seven_murders_covered", "title": "Seven Covered-Up Murders", "description": "Eleanor falsified seven autopsies over two years. All victims were murdered but ruled natural causes or accidents.", "category": Enums.ClueCategory.TESTIMONY, "importance": 5}]},
			]},
			"conspiracy_reveal_25": {
				"min_conspiracy": 25,
				"choice_label": "Your autopsy reports seem... inconsistent.",
				"lines": [
					{"text": "Inconsistent? The evidence suggests my work is thorough. I can't discuss specific cases.", "speaker": Constants.NPC_ELEANOR, "truthful": false,
					"choices": [
						{"id": "press", "text": "Cause of death changed between drafts?", "leads_to": "eleanor_draft_changes"},
						{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					],
					"reveals_clues": [{"id": "eleanor_inconsistencies", "title": "Autopsy Inconsistencies", "description": "Eleanor deflected when confronted about inconsistencies in her autopsy reports.", "category": Enums.ClueCategory.OBSERVATION, "importance": 2}]},
				],
			},
			"eleanor_draft_changes": {"lines": [
				{"text": "I-- how would you know about drafts? Those are internal documents. Professionally speaking, preliminary findings sometimes change.", "speaker": Constants.NPC_ELEANOR, "truthful": false},
				{"text": "I need to go. I can't discuss this further.", "speaker": Constants.NPC_ELEANOR, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "We'll talk again.", "leads_to": "end"},
				]},
			]},
			"conspiracy_reveal_50": {
				"min_conspiracy": 50,
				"choice_label": "I know you're falsifying reports for Hale.",
				"lines": [
					{"text": "Please keep your voice down. I can't discuss-- the evidence-- I mean--", "speaker": Constants.NPC_ELEANOR, "truthful": true},
					{"text": "Yes. Alright? Yes. Hale brings me cases and tells me what to write. I'm not proud of it.", "speaker": Constants.NPC_ELEANOR, "truthful": true},
					{"text": "But what am I supposed to do? He threatened my medical license. My freedom. Everything I've worked for.", "speaker": Constants.NPC_ELEANOR, "truthful": true,
					"choices": [
						{"id": "press", "text": "What are the real causes of death?", "leads_to": "eleanor_real_causes"},
						{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					],
					"reveals_clues": [{"id": "eleanor_admits_falsifying", "title": "Eleanor Admits Falsifying", "description": "Eleanor admitted Hale directs her to falsify autopsy reports. He threatened her license and freedom.", "category": Enums.ClueCategory.TESTIMONY, "importance": 4}]},
				],
			},
			"eleanor_real_causes": {"lines": [
				{"text": "Blunt force trauma. Poisoning. Strangulation. None of them were accidents. None of them were natural.", "speaker": Constants.NPC_ELEANOR, "truthful": true},
				{"text": "The evidence -- the real evidence -- tells a completely different story from my official reports.", "speaker": Constants.NPC_ELEANOR, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "You kept the real evidence?", "leads_to": "end"},
				],
				"reveals_clues": [{"id": "real_causes_of_death", "title": "Real Causes of Death", "description": "True causes include blunt force trauma, poisoning, and strangulation -- not the accidents reported officially.", "category": Enums.ClueCategory.TESTIMONY, "importance": 4}]},
			]},
			"conspiracy_reveal_75": {
				"min_conspiracy": 75,
				"choice_label": "Eleanor, the loop device affects your work too.",
				"lines": [
					{"text": "The loop? I've noticed. The same bodies. The same reports. The same lies. Every single day.", "speaker": Constants.NPC_ELEANOR, "truthful": true},
					{"text": "Professionally speaking, it's a nightmare. I write the same false reports and they reset. But I remember. Or at least, I feel like I do.", "speaker": Constants.NPC_ELEANOR, "truthful": true},
					{"text": "If there's a way to stop it, I'll help. I'll give you everything. The notebook, my testimony, all of it. I just want this to end.", "speaker": Constants.NPC_ELEANOR, "truthful": true,
					"choices": [
						{"id": "press", "text": "Tell me about the notebook.", "leads_to": "eleanor_notebook"},
						{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
						{"id": "done", "text": "It will end. I promise.", "leads_to": "end"},
					],
					"reveals_clues": [{"id": "eleanor_loop_awareness", "title": "Eleanor Senses the Loop", "description": "Eleanor has vague awareness of the loop through repetitive feelings. Willing to provide all evidence to stop it.", "category": Enums.ClueCategory.TESTIMONY, "importance": 3}]},
				],
			},
			"confrontation": {
				"required_clues": ["eleanor_falsification", "eleanor_blue_notebook"],
				"lines": [
					{"text": "You found the notebook. Then you know everything. Seven murders. All covered up. All my fault.", "speaker": Constants.NPC_ELEANOR, "truthful": true},
					{"text": "I became a doctor to heal people. Instead I became an accessory to murder. The evidence suggests I deserve whatever's coming.", "speaker": Constants.NPC_ELEANOR, "truthful": true},
					{"text": "But if my testimony can help end this -- the conspiracy, the loop, all of it -- then use me. Please.", "speaker": Constants.NPC_ELEANOR, "truthful": true,
					"choices": [
						{"id": "forgive", "text": "You kept the real records. That took courage.", "leads_to": "eleanor_courage"},
						{"id": "justice", "text": "You'll face consequences, but you'll also save lives.", "leads_to": "eleanor_accept"},
						{"id": "done", "text": "Your testimony will be the key.", "leads_to": "end"},
					],
					"reveals_clues": [{"id": "eleanor_full_cooperation", "title": "Eleanor's Full Cooperation", "description": "Eleanor is willing to testify about all seven falsified autopsies and provide her hidden notebook as evidence.", "category": Enums.ClueCategory.TESTIMONY, "importance": 5}]},
				],
			},
			"eleanor_courage": {"lines": [
				{"text": "Courage? I don't know about that. But the evidence -- the real evidence -- deserved to survive. Even if I didn't have the strength to share it sooner.", "speaker": Constants.NPC_ELEANOR, "truthful": true},
				{"text": "Take the notebook. Take my testimony. End this loop and maybe, professionally speaking, I can start being a real doctor again.", "speaker": Constants.NPC_ELEANOR, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "You will. I'll make sure of it.", "leads_to": "end"},
				]},
			]},
			"eleanor_accept": {"lines": [
				{"text": "I know. And I accept that. Professionally speaking, I violated every oath I took. There should be consequences.", "speaker": Constants.NPC_ELEANOR, "truthful": true},
				{"text": "But if my punishment comes in a real tomorrow, in a world that actually moves forward... I'll take it. Gladly.", "speaker": Constants.NPC_ELEANOR, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "A real tomorrow. We'll get there.", "leads_to": "end"},
				]},
			]},
			"end": {"lines": []},
		},
	}


static func _build_nina() -> void:
	_npc_data[Constants.NPC_NINA] = {
		"id": Constants.NPC_NINA,
		"name": "Nina Volkov",
		"job": "mysterious",
		"personality_traits": [Enums.PersonalityTrait.CAUTIOUS, Enums.PersonalityTrait.CURIOUS, Enums.PersonalityTrait.BRAVE],
		"secrets": ["Investigating the loop itself", "Has a device that detects loop energy", "From a parallel timeline"],
		"sprite_seed": 808,
		"relationships": [
			{"target": Constants.NPC_MARIA, "type": Enums.RelationshipType.UNKNOWN, "trust": 1},
			{"target": Constants.NPC_IRIS, "type": Enums.RelationshipType.UNKNOWN, "trust": 1},
			{"target": Constants.NPC_MAYOR, "type": Enums.RelationshipType.ENEMY, "trust": -3},
		],
		"default_dialogue": {
			"greeting": {"lines": [
				{"text": "You can see me? Most people don't pay attention. That's... interesting. This has happened before, hasn't it?", "speaker": Constants.NPC_NINA, "truthful": true,
				"choices": [
					{"id": "who", "text": "Who are you?", "leads_to": "about_who"},
					{"id": "device", "text": "What's that device?", "leads_to": "about_device"},
					{"id": "loop", "text": "Do you know about the time loop?", "leads_to": "about_loop"},
					{"id": "maria", "text": "Maria mentioned you.", "leads_to": "about_maria"},
					{"id": "mayor", "text": "What do you know about the mayor?", "leads_to": "about_mayor"},
					{"id": "iris", "text": "Iris says you gave her readings.", "leads_to": "about_iris"},
					{"id": "done", "text": "Just passing by.", "leads_to": "end"},
				]},
			]},
			"greeting_familiar": {"lines": [
				{"text": "You remember. Across loops, you remember. Time is running out -- we've done this dance too many times.", "speaker": Constants.NPC_NINA, "truthful": true,
				"choices": [
					{"id": "device", "text": "How's your device?", "leads_to": "about_device_update"},
					{"id": "loop", "text": "How many loops have there been?", "leads_to": "nina_loop_count"},
					{"id": "plan", "text": "We need a plan.", "leads_to": "nina_plan"},
					{"id": "hale", "text": "Hale knows about you.", "leads_to": "about_hale"},
					{"id": "victor", "text": "Victor mentioned you.", "leads_to": "about_victor"},
					{"id": "tommy", "text": "Tommy's in danger again.", "leads_to": "about_tommy"},
					{"id": "done", "text": "I'll be back.", "leads_to": "end"},
				]},
			]},
			"greeting_late_game": {"lines": [
				{"text": "This is it. I can feel it. My device is almost drained -- this has happened before, but this time you feel it too, don't you? One more reset and I'm trapped here forever.", "speaker": Constants.NPC_NINA, "truthful": true,
				"choices": [
					{"id": "final", "text": "How do we end this?", "leads_to": "nina_final_plan"},
					{"id": "device_status", "text": "How much charge is left?", "leads_to": "nina_device_dying"},
					{"id": "parallel", "text": "Tell me about your timeline.", "leads_to": "nina_timeline"},
					{"id": "done", "text": "We'll break the loop today.", "leads_to": "end"},
				]},
			]},
			"about_who": {"lines": [
				{"text": "Nina. I'm new in town. Doing research. That's all you need to know for now.", "speaker": Constants.NPC_NINA, "truthful": false},
				{"text": "Time is running out. We can do pleasantries later. What matters is whether you feel it -- the repetition.", "speaker": Constants.NPC_NINA, "truthful": true,
				"choices": [
					{"id": "feel_it", "text": "I feel it. The same day, over and over.", "leads_to": "nina_you_feel_it"},
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "Fair enough.", "leads_to": "end"},
				]},
			]},
			"nina_you_feel_it": {"lines": [
				{"text": "Then you're like me. Aware. That means the loop is weakening, or you're special. Either way, we need to talk.", "speaker": Constants.NPC_NINA, "truthful": true},
				{"text": "This has happened before -- in another place. Another version of this town. I came here to stop it.", "speaker": Constants.NPC_NINA, "truthful": true,
				"choices": [
					{"id": "press", "text": "Another version?", "leads_to": "nina_other_version"},
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "Tell me everything.", "leads_to": "end"},
				]},
			]},
			"nina_other_version": {"lines": [
				{"text": "A parallel timeline. Where the mayor succeeded. Where the loop ran for years and he erased everyone who opposed him.", "speaker": Constants.NPC_NINA, "truthful": true},
				{"text": "I found a way to cross over. To come here. To stop it before it gets that far. But time is running out.", "speaker": Constants.NPC_NINA, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "We'll stop it.", "leads_to": "end"},
				],
				"reveals_clues": [{"id": "nina_parallel_origin", "title": "Nina's Parallel Origin", "description": "Nina is from a parallel timeline where the mayor's loop ran for years. She crossed over to prevent it here.", "category": Enums.ClueCategory.TESTIMONY, "importance": 4}]},
			]},
			"about_device": {"lines": [
				{"text": "It's a temporal spectrometer. It detects loop energy. This has happened before -- my device proves it.", "speaker": Constants.NPC_NINA, "truthful": true,
				"choices": [
					{"id": "press", "text": "It's blinking. What does that mean?", "leads_to": "nina_blinking"},
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "Okay.", "leads_to": "end"},
				]},
			]},
			"nina_blinking": {"lines": [
				{"text": "It means there's temporal energy here that shouldn't exist. Heavy concentrations near City Hall. Especially the basement.", "speaker": Constants.NPC_NINA, "truthful": true},
				{"text": "You feel it too, don't you? That buzzing sensation near certain buildings? That's temporal radiation.", "speaker": Constants.NPC_NINA, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "I need to think about this.", "leads_to": "end"},
				],
				"reveals_clues": [{"id": "temporal_radiation", "title": "Temporal Radiation Detected", "description": "Nina's device detects heavy temporal energy near City Hall, especially the basement.", "category": Enums.ClueCategory.PHYSICAL_EVIDENCE, "importance": 3}]},
			]},
			"about_device_update": {"lines": [
				{"text": "Weaker every loop. Time is running out. Each reset drains more power from my crossing device.", "speaker": Constants.NPC_NINA, "truthful": true},
				{"text": "But the readings are clear -- the mayor's device is in the basement. I've mapped its energy signature.", "speaker": Constants.NPC_NINA, "truthful": true,
				"choices": [
					{"id": "map", "text": "Show me the energy map.", "leads_to": "nina_energy_map"},
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "We're running out of time.", "leads_to": "end"},
				]},
			]},
			"nina_energy_map": {"lines": [
				{"text": "Here. The epicenter is City Hall's basement, northeast corner. That's where the device sits.", "speaker": Constants.NPC_NINA, "truthful": true},
				{"text": "Secondary readings show conduits through the building's electrical system. The power supply. That's the vulnerability.", "speaker": Constants.NPC_NINA, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "Northeast corner. Power supply. Got it.", "leads_to": "end"},
				],
				"reveals_clues": [{"id": "device_location_exact", "title": "Exact Device Location", "description": "Loop device is in northeast corner of City Hall basement. Power runs through building electrical system.", "category": Enums.ClueCategory.PHYSICAL_EVIDENCE, "importance": 5}]},
			]},
			"about_loop": {"lines": [
				{"text": "So you're aware. Good. This has happened before, in my timeline. The loop destroys everything if left unchecked.", "speaker": Constants.NPC_NINA, "truthful": true},
				{"text": "The mayor activated it three months ago. Every ten minutes of real time, the day resets. Most people don't notice.", "speaker": Constants.NPC_NINA, "truthful": true,
				"choices": [
					{"id": "press", "text": "Why does the mayor want a loop?", "leads_to": "nina_mayor_motive"},
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "We should talk more. Not here.", "leads_to": "end"},
				]},
			]},
			"nina_mayor_motive": {"lines": [
				{"text": "Power. Control. In a loop, nobody can organize against you. Nobody remembers your crimes. No elections, no consequences.", "speaker": Constants.NPC_NINA, "truthful": true},
				{"text": "In my timeline, he ran the loop for three years before anyone realized. By then, half the town had been 'reset' out of existence.", "speaker": Constants.NPC_NINA, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "That won't happen here.", "leads_to": "end"},
				],
				"reveals_clues": [{"id": "mayor_loop_motive", "title": "Mayor's Loop Motive", "description": "The loop prevents organization against the mayor. No one remembers crimes or can hold elections. In Nina's timeline, it ran for three years.", "category": Enums.ClueCategory.TESTIMONY, "importance": 4}]},
			]},
			"nina_loop_count": {"lines": [
				{"text": "In this timeline? My device has counted 847 resets since I arrived. That's 847 identical days.", "speaker": Constants.NPC_NINA, "truthful": true},
				{"text": "But you -- you started remembering recently. That means the loop is destabilizing. Time is running out, but that's also our opportunity.", "speaker": Constants.NPC_NINA, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "847 days... all the same.", "leads_to": "end"},
				],
				"reveals_clues": [{"id": "loop_count", "title": "Loop Count: 847", "description": "Nina's device has counted 847 loop resets since her arrival. The loop is destabilizing.", "category": Enums.ClueCategory.PHYSICAL_EVIDENCE, "importance": 3}]},
			]},
			"nina_plan": {"lines": [
				{"text": "This has happened before, but this time we can change it. We need to destroy the device in City Hall's basement.", "speaker": Constants.NPC_NINA, "truthful": true},
				{"text": "I've been mapping it. The power runs through the building's junction box. Cut the power, the device fails, the loop breaks.", "speaker": Constants.NPC_NINA, "truthful": true},
				{"text": "But the mayor has a key to the basement and Hale guards the building. We need to get past both.", "speaker": Constants.NPC_NINA, "truthful": true,
				"choices": [
					{"id": "how", "text": "How do we get in?", "leads_to": "nina_entry"},
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "Then we plan carefully.", "leads_to": "end"},
				]},
			]},
			"nina_entry": {"lines": [
				{"text": "There's a service entrance on the east side. I've timed Hale's patrols -- he passes every hour on the hour.", "speaker": Constants.NPC_NINA, "truthful": true},
				{"text": "Five-minute window between patrols. That's all we get. Time is running out, but it's enough.", "speaker": Constants.NPC_NINA, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "Five minutes. We make it count.", "leads_to": "end"},
				],
				"reveals_clues": [{"id": "nina_patrol_timing", "title": "Patrol Timing Intel", "description": "Hale patrols City Hall hourly. Five-minute window between patrols at the east service entrance.", "category": Enums.ClueCategory.OBSERVATION, "importance": 4}]},
			]},
			"about_maria": {"lines": [
				{"text": "Maria is... important. She saw the activation. She's one of the few who senses the loop without understanding it.", "speaker": Constants.NPC_NINA, "truthful": true},
				{"text": "I told her the truth about where I'm from. She believed me. That woman has more courage than this whole town combined.", "speaker": Constants.NPC_NINA, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "She speaks highly of you too.", "leads_to": "end"},
				]},
			]},
			"about_mayor": {"lines": [
				{"text": "Aldridge. In my timeline, he became a tyrant. Erased anyone who questioned him. Used the loop to rewrite history.", "speaker": Constants.NPC_NINA, "truthful": true},
				{"text": "Here, he's still in the early stages. Still building his power base. Time is running out to stop him.", "speaker": Constants.NPC_NINA, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "We stop him here.", "leads_to": "end"},
				]},
			]},
			"about_iris": {"lines": [
				{"text": "Iris. A good journalist. I've been feeding her data -- energy readings, pattern analyses. She's building a case.", "speaker": Constants.NPC_NINA, "truthful": true},
				{"text": "In my timeline, she was the first one erased. This has happened before, but this time we protect her.", "speaker": Constants.NPC_NINA, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "Nobody gets erased this time.", "leads_to": "end"},
				],
				"reveals_clues": [{"id": "iris_erased_alt_timeline", "title": "Iris Erased in Other Timeline", "description": "In Nina's parallel timeline, Iris was the first person the mayor erased using the loop.", "category": Enums.ClueCategory.TESTIMONY, "importance": 3}]},
			]},
			"about_hale": {"lines": [
				{"text": "Hale is the mayor's enforcer. In my timeline, he was the one who physically operated the device for erasures.", "speaker": Constants.NPC_NINA, "truthful": true},
				{"text": "But he's also the weakest link. This has happened before -- pressure him enough and he cracks.", "speaker": Constants.NPC_NINA, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "He's already cracking.", "leads_to": "end"},
				]},
			]},
			"about_victor": {"lines": [
				{"text": "Victor Crane. The money man. Without his funding, the device never gets built.", "speaker": Constants.NPC_NINA, "truthful": true},
				{"text": "In my timeline, he was the last to fall. He had escape plans, hidden assets. This has happened before -- don't let him run.", "speaker": Constants.NPC_NINA, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "He won't escape this time.", "leads_to": "end"},
				]},
			]},
			"about_tommy": {"lines": [
				{"text": "Tommy. In every timeline, he's a victim. The innocent who pays for other people's crimes.", "speaker": Constants.NPC_NINA, "truthful": true},
				{"text": "This has happened before. In my timeline, he died 312 times before the loop was stopped. Different causes, same outcome.", "speaker": Constants.NPC_NINA, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "312 times... we save him this time.", "leads_to": "end"},
				],
				"reveals_clues": [{"id": "tommy_312_deaths", "title": "Tommy Died 312 Times", "description": "In Nina's timeline, Tommy was killed 312 different times in the loop before it was stopped.", "category": Enums.ClueCategory.TESTIMONY, "importance": 3}]},
			]},
			"nina_final_plan": {"lines": [
				{"text": "Time is running out. Here's what we know: the device is in the northeast corner of City Hall's basement.", "speaker": Constants.NPC_NINA, "truthful": true},
				{"text": "My device can overload the mayor's if I get close enough. Like a temporal short circuit. But it will destroy mine too.", "speaker": Constants.NPC_NINA, "truthful": true},
				{"text": "One chance. We get in through the east entrance, reach the basement, and I trigger the overload. The loop breaks. Forever.", "speaker": Constants.NPC_NINA, "truthful": true,
				"choices": [
					{"id": "sacrifice", "text": "But your device -- you'll be stranded here.", "leads_to": "nina_sacrifice"},
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "One chance. Let's take it.", "leads_to": "end"},
				],
				"reveals_clues": [{"id": "nina_overload_plan", "title": "Nina's Overload Plan", "description": "Nina can overload the mayor's device with hers, creating a temporal short circuit. Destroys both devices and breaks the loop permanently.", "category": Enums.ClueCategory.DEDUCTION, "importance": 5}]},
			]},
			"nina_sacrifice": {"lines": [
				{"text": "Stranded? No. I'll be free. We'll all be free. A real tomorrow is worth more than any device.", "speaker": Constants.NPC_NINA, "truthful": true},
				{"text": "In my timeline, I lost everything. Here, I can save everyone. This has happened before, but this time the ending changes.", "speaker": Constants.NPC_NINA, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "The ending changes today.", "leads_to": "end"},
				]},
			]},
			"nina_device_dying": {"lines": [
				{"text": "Three percent. Maybe two more resets before it's dead. Time is running out in every sense.", "speaker": Constants.NPC_NINA, "truthful": true},
				{"text": "But it has enough for one overload. One chance to break the loop. That's all I need.", "speaker": Constants.NPC_NINA, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "Then we don't waste another reset.", "leads_to": "end"},
				]},
			]},
			"nina_timeline": {"lines": [
				{"text": "My timeline? It's gone. The loop ran so long that reality frayed. Buildings flickered. People became shadows.", "speaker": Constants.NPC_NINA, "truthful": true},
				{"text": "I was the last researcher studying the phenomenon. I built this device from salvaged loop technology. Then I jumped.", "speaker": Constants.NPC_NINA, "truthful": true},
				{"text": "This has happened before. But here, right now, we can write a different ending.", "speaker": Constants.NPC_NINA, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "A different ending. I promise.", "leads_to": "end"},
				],
				"reveals_clues": [{"id": "nina_timeline_collapse", "title": "Nina's Timeline Collapsed", "description": "Nina's original timeline degraded from the loop -- buildings flickered, people became shadows. She was the last researcher.", "category": Enums.ClueCategory.TESTIMONY, "importance": 4}]},
			]},
			"conspiracy_reveal_25": {
				"min_conspiracy": 25,
				"choice_label": "What do you know about the strange energy in town?",
				"lines": [
					{"text": "You feel it too? Temporal radiation. My device measures it. This has happened before -- the readings are unmistakable.", "speaker": Constants.NPC_NINA, "truthful": true,
					"choices": [
						{"id": "press", "text": "Where's the source?", "leads_to": "nina_source"},
						{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					],
					"reveals_clues": [{"id": "nina_temporal_readings", "title": "Temporal Readings Confirmed", "description": "Nina's device confirms temporal radiation throughout the town. Strongest at City Hall.", "category": Enums.ClueCategory.PHYSICAL_EVIDENCE, "importance": 2}]},
				],
			},
			"nina_source": {"lines": [
				{"text": "City Hall. Specifically the basement. My readings spike every time the loop resets. Something down there is bending time.", "speaker": Constants.NPC_NINA, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "City Hall basement. The source.", "leads_to": "end"},
				]},
			]},
			"conspiracy_reveal_50": {
				"min_conspiracy": 50,
				"choice_label": "Nina, I need to know about the loop device.",
				"lines": [
					{"text": "The device? This has happened before. In my timeline, I studied it for years before it was too late.", "speaker": Constants.NPC_NINA, "truthful": true},
					{"text": "It generates a temporal field that resets everything within its radius every ten minutes. Biological, digital, physical -- all reset.", "speaker": Constants.NPC_NINA, "truthful": true},
					{"text": "But consciousness sometimes leaks through. That's why you remember. That's why I'm here.", "speaker": Constants.NPC_NINA, "truthful": true,
					"choices": [
						{"id": "press", "text": "How do we destroy it?", "leads_to": "nina_destroy_method"},
						{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					],
					"reveals_clues": [{"id": "loop_device_mechanics", "title": "Loop Device Mechanics", "description": "Device resets everything in its radius every 10 minutes. Consciousness sometimes leaks through resets.", "category": Enums.ClueCategory.DEDUCTION, "importance": 4}]},
				],
			},
			"nina_destroy_method": {"lines": [
				{"text": "Two options. Cut its power supply -- the building's main junction box. That stops it temporarily.", "speaker": Constants.NPC_NINA, "truthful": true},
				{"text": "Or I use my device to create a temporal overload. Feedback loop destroys both devices. Permanent solution.", "speaker": Constants.NPC_NINA, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "Permanent sounds better.", "leads_to": "end"},
				],
				"reveals_clues": [{"id": "device_destruction_methods", "title": "Two Ways to Stop the Device", "description": "Cut power at junction box (temporary) or Nina's temporal overload (permanent, destroys both devices).", "category": Enums.ClueCategory.DEDUCTION, "importance": 5}]},
			]},
			"conspiracy_reveal_75": {
				"min_conspiracy": 75,
				"choice_label": "Nina, it's time. Tell me everything.",
				"lines": [
					{"text": "Everything. Alright. Time is running out anyway.", "speaker": Constants.NPC_NINA, "truthful": true},
					{"text": "The mayor found plans for a temporal displacement device in old city records. Victor funded its construction. A scientist -- whose name I never learned -- built it.", "speaker": Constants.NPC_NINA, "truthful": true},
					{"text": "When activated, it created a ten-minute pocket of looping time. The mayor retains his memory because the device is tuned to his neural pattern.", "speaker": Constants.NPC_NINA, "truthful": true},
					{"text": "This has happened before, in my timeline. But here, right now, you and I can change it. One overload. One chance.", "speaker": Constants.NPC_NINA, "truthful": true,
					"choices": [
						{"id": "ready", "text": "I'm ready. Let's end this.", "leads_to": "nina_final_plan"},
						{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
						{"id": "done", "text": "One chance. We take it.", "leads_to": "end"},
					],
					"reveals_clues": [{"id": "full_device_history", "title": "Complete Device History", "description": "Mayor found temporal device plans in old records. Victor funded construction. Device tuned to mayor's neural pattern for memory retention.", "category": Enums.ClueCategory.TESTIMONY, "importance": 5}]},
				],
			},
			"confrontation": {
				"required_clues": ["nina_parallel_origin", "device_location_exact"],
				"lines": [
					{"text": "You've done it. You have everything -- the location, the evidence, the allies. This has happened before, but never this far.", "speaker": Constants.NPC_NINA, "truthful": true},
					{"text": "I've been waiting 847 loops for someone to put it all together. You did. Now we end it.", "speaker": Constants.NPC_NINA, "truthful": true},
					{"text": "My device is ready. Three percent charge -- just enough for the overload. Time is running out. Literally.", "speaker": Constants.NPC_NINA, "truthful": true,
					"choices": [
						{"id": "go", "text": "Let's go. Right now.", "leads_to": "nina_go_time"},
						{"id": "sure", "text": "Are you sure about this? Your device will be destroyed.", "leads_to": "nina_sacrifice"},
						{"id": "done", "text": "See you at City Hall.", "leads_to": "end"},
					],
					"reveals_clues": [{"id": "nina_final_ready", "title": "Nina Ready for Final Operation", "description": "Nina's device has exactly enough charge for one overload attempt. All 847 loops have led to this moment.", "category": Enums.ClueCategory.DEDUCTION, "importance": 5}]},
				],
			},
			"nina_go_time": {"lines": [
				{"text": "East entrance. Five-minute window. Straight to the basement. Northeast corner. I trigger the overload. You watch my back.", "speaker": Constants.NPC_NINA, "truthful": true},
				{"text": "When the devices connect, there'll be a flash. Blue light, just like the first activation. Then silence.", "speaker": Constants.NPC_NINA, "truthful": true},
				{"text": "And then -- tomorrow. A real tomorrow. This has happened before, but it ends here.", "speaker": Constants.NPC_NINA, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "Tomorrow. A real one. Let's go.", "leads_to": "end"},
				]},
			]},
			"end": {"lines": []},
		},
	}


static func _build_mayor() -> void:
	_npc_data[Constants.NPC_MAYOR] = {
		"id": Constants.NPC_MAYOR,
		"name": "Mayor Aldridge",
		"job": "mayor",
		"personality_traits": [Enums.PersonalityTrait.DECEITFUL, Enums.PersonalityTrait.GREEDY, Enums.PersonalityTrait.AGGRESSIVE],
		"secrets": ["Controls the loop device", "Loop keeps him in power", "Eliminated opponents"],
		"sprite_seed": 909,
		"relationships": [
			{"target": Constants.NPC_VICTOR, "type": Enums.RelationshipType.BOSS, "trust": 2},
			{"target": Constants.NPC_HALE, "type": Enums.RelationshipType.SUBORDINATE, "trust": 1},
			{"target": Constants.NPC_NINA, "type": Enums.RelationshipType.ENEMY, "trust": -3},
		],
		"default_dialogue": {
			"greeting": {"lines": [
				{"text": "A citizen! Always happy to serve the public. What can the mayor's office do for you today? For the good of the city, I'm all ears.", "speaker": Constants.NPC_MAYOR, "truthful": false,
				"choices": [
					{"id": "town", "text": "How's the town doing?", "leads_to": "about_town"},
					{"id": "plans", "text": "Any big plans?", "leads_to": "about_plans"},
					{"id": "basement", "text": "What's in City Hall's basement?", "leads_to": "about_basement"},
					{"id": "victor", "text": "You work with Victor Crane?", "leads_to": "about_victor"},
					{"id": "hale", "text": "Detective Hale reports to you?", "leads_to": "about_hale"},
					{"id": "nina", "text": "There's a newcomer in town...", "leads_to": "about_nina"},
					{"id": "done", "text": "Just visiting.", "leads_to": "end"},
				]},
			]},
			"greeting_familiar": {"lines": [
				{"text": "You again. You don't understand the bigger picture, do you? For the good of the city, I suggest you find a hobby.", "speaker": Constants.NPC_MAYOR, "truthful": true,
				"choices": [
					{"id": "town", "text": "The town is falling apart.", "leads_to": "about_town_decline"},
					{"id": "basement", "text": "The basement, Aldridge.", "leads_to": "about_basement"},
					{"id": "iris", "text": "Iris Chen is publishing a story.", "leads_to": "about_iris"},
					{"id": "eleanor", "text": "Dr. Solomon has been talking.", "leads_to": "about_eleanor"},
					{"id": "frank", "text": "Frank has records.", "leads_to": "about_frank"},
					{"id": "done", "text": "See you around, Mayor.", "leads_to": "end"},
				]},
			]},
			"greeting_late_game": {"lines": [
				{"text": "I know who you are and what you're doing. You don't understand the bigger picture. This town needs me. Without me, everything collapses.", "speaker": Constants.NPC_MAYOR, "truthful": false,
				"choices": [
					{"id": "device", "text": "I know about the device.", "leads_to": "mayor_device_confront"},
					{"id": "loop", "text": "The loop ends today.", "leads_to": "mayor_loop_ends"},
					{"id": "deal", "text": "Last chance. Shut it down yourself.", "leads_to": "mayor_deal"},
					{"id": "done", "text": "Your time is up.", "leads_to": "end"},
				]},
			]},
			"about_town": {"lines": [
				{"text": "Thriving! Crime is down, business is up. My administration has been very effective. For the good of the city, of course.", "speaker": Constants.NPC_MAYOR, "truthful": false,
				"choices": [
					{"id": "press", "text": "Crime is down because you hide it.", "leads_to": "mayor_crime_hidden"},
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "Glad to hear it.", "leads_to": "end"},
				]},
			]},
			"mayor_crime_hidden": {"lines": [
				{"text": "Hide it? That's absurd. We have an excellent police force led by Detective Hale. All crimes are properly documented.", "speaker": Constants.NPC_MAYOR, "truthful": false},
				{"text": "You don't understand the bigger picture. A stable town attracts investment. Investment creates jobs. That's governance.", "speaker": Constants.NPC_MAYOR, "truthful": false,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "Governance. Sure.", "leads_to": "end"},
				]},
			]},
			"about_town_decline": {"lines": [
				{"text": "Falling apart? Nonsense. Every metric shows improvement. For the good of the city, I've ensured stability.", "speaker": Constants.NPC_MAYOR, "truthful": false},
				{"text": "Though I admit, some... elements have been disruptive. Journalists spreading lies. Outsiders asking questions. You, for instance.", "speaker": Constants.NPC_MAYOR, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "Disruptive. That's one word for it.", "leads_to": "end"},
				]},
			]},
			"about_plans": {"lines": [
				{"text": "Development, modernization. For the good of the city, big things are coming. You don't understand the bigger picture yet.", "speaker": Constants.NPC_MAYOR, "truthful": false,
				"choices": [
					{"id": "press", "text": "What kind of big things?", "leads_to": "mayor_big_things"},
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "Sounds promising.", "leads_to": "end"},
				]},
			]},
			"mayor_big_things": {"lines": [
				{"text": "All in due time. You can't rush progress. Let's just say this town will never change. Not on my watch.", "speaker": Constants.NPC_MAYOR, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "Never change... interesting choice of words.", "leads_to": "end"},
				]},
			]},
			"about_basement": {"lines": [
				{"text": "The basement? Storage. Old files. Plumbing. Why would you ask about that?", "speaker": Constants.NPC_MAYOR, "truthful": false,
				"choices": [
					{"id": "press", "text": "People hear strange noises down there.", "leads_to": "mayor_basement_press"},
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "No reason.", "leads_to": "end"},
				]},
			]},
			"mayor_basement_press": {"lines": [
				{"text": "Old pipes. Nothing more. I'd appreciate you not spreading rumors. For the good of the city.", "speaker": Constants.NPC_MAYOR, "truthful": false,
				"choices": [
					{"id": "press_more", "text": "Then why is it guarded 24/7?", "leads_to": "mayor_guard_question"},
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "Good day, Mayor.", "leads_to": "end"},
				]},
			]},
			"mayor_guard_question": {"lines": [
				{"text": "Security is standard for government buildings. I have nothing to hide. Now, if you'll excuse me, I have a city to run.", "speaker": Constants.NPC_MAYOR, "truthful": false,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "Of course you do.", "leads_to": "end"},
				],
				"reveals_clues": [{"id": "mayor_defensive_basement", "title": "Mayor Defensive About Basement", "description": "Mayor became increasingly defensive about the basement, dismissing noise reports and 24/7 security as normal.", "category": Enums.ClueCategory.OBSERVATION, "importance": 2}]},
			]},
			"about_victor": {"lines": [
				{"text": "Victor Crane is a valued member of our business community. His investments have been good for the city.", "speaker": Constants.NPC_MAYOR, "truthful": false,
				"choices": [
					{"id": "press", "text": "Good for the city, or good for you?", "leads_to": "mayor_victor_press"},
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "Valued. Of course.", "leads_to": "end"},
				]},
			]},
			"mayor_victor_press": {"lines": [
				{"text": "What's good for business is good for the city. You don't understand the bigger picture. Victor creates jobs.", "speaker": Constants.NPC_MAYOR, "truthful": false,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "And you create cover stories.", "leads_to": "end"},
				]},
			]},
			"about_hale": {"lines": [
				{"text": "Detective Hale is an exemplary officer. His record speaks for itself. For the good of the city, we need strong law enforcement.", "speaker": Constants.NPC_MAYOR, "truthful": false,
				"choices": [
					{"id": "press", "text": "An exemplary officer on your payroll.", "leads_to": "mayor_hale_payroll"},
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "Exemplary. Right.", "leads_to": "end"},
				]},
			]},
			"mayor_hale_payroll": {"lines": [
				{"text": "All city employees are on the city payroll. That's how employment works. You're grasping at straws.", "speaker": Constants.NPC_MAYOR, "truthful": false,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "We both know what I mean.", "leads_to": "end"},
				]},
			]},
			"about_nina": {"lines": [
				{"text": "Newcomer? I'm not aware of any newcomer. People come and go. For the good of the city, we welcome all visitors.", "speaker": Constants.NPC_MAYOR, "truthful": false,
				"choices": [
					{"id": "press", "text": "She's been scanning City Hall.", "leads_to": "mayor_nina_scanning"},
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "All visitors. Interesting.", "leads_to": "end"},
				]},
			]},
			"mayor_nina_scanning": {"lines": [
				{"text": "Scanning? If someone is conducting unauthorized surveillance of a government building, that's a security matter. I'll have Hale look into it.", "speaker": Constants.NPC_MAYOR, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "I bet you will.", "leads_to": "end"},
				],
				"reveals_clues": [{"id": "mayor_nina_threat", "title": "Mayor Threatens Nina", "description": "Mayor immediately wanted to send Hale after Nina when he learned she was scanning City Hall.", "category": Enums.ClueCategory.OBSERVATION, "importance": 2}]},
			]},
			"about_iris": {"lines": [
				{"text": "The journalist? She's free to write whatever she wants. This is a democracy. For the good of the city, I support a free press.", "speaker": Constants.NPC_MAYOR, "truthful": false},
				{"text": "Though defamation has consequences. Legal ones. You don't understand the bigger picture of how journalism works.", "speaker": Constants.NPC_MAYOR, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "She understands perfectly.", "leads_to": "end"},
				]},
			]},
			"about_eleanor": {"lines": [
				{"text": "Dr. Solomon is a respected professional. If she's 'talking,' she's violating medical confidentiality. For the good of the city, that can't be tolerated.", "speaker": Constants.NPC_MAYOR, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "Can't be tolerated? Sounds like a threat.", "leads_to": "end"},
				]},
			]},
			"about_frank": {"lines": [
				{"text": "Records? What records? Frank DeLuca is a bartender. Whatever papers he has are liquor licenses and tax forms.", "speaker": Constants.NPC_MAYOR, "truthful": false},
				{"text": "You don't understand the bigger picture. People make up stories for attention. It's pathetic.", "speaker": Constants.NPC_MAYOR, "truthful": false,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "We'll see what a judge thinks.", "leads_to": "end"},
				]},
			]},
			"mayor_device_confront": {"lines": [
				{"text": "The device? You don't understand the bigger picture. What I've built -- it's not a weapon. It's a gift.", "speaker": Constants.NPC_MAYOR, "truthful": false},
				{"text": "No crime, no aging, no change. Perfect stability. For the good of the city, I've stopped time itself.", "speaker": Constants.NPC_MAYOR, "truthful": true},
				{"text": "And you want to destroy that? You'd plunge this town into chaos. Into a future nobody can control.", "speaker": Constants.NPC_MAYOR, "truthful": false,
				"choices": [
					{"id": "push", "text": "A future where you don't get to play God.", "leads_to": "mayor_god_complex"},
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "It's not a gift. It's a cage.", "leads_to": "end"},
				],
				"reveals_clues": [{"id": "mayor_admits_device", "title": "Mayor Admits to Device", "description": "Mayor admitted to the loop device, calling it a 'gift' that creates perfect stability by stopping time.", "category": Enums.ClueCategory.TESTIMONY, "importance": 5}]},
			]},
			"mayor_god_complex": {"lines": [
				{"text": "God? No. Gods are worshipped. I just run a town. But I run it perfectly. Every day, exactly the same. No surprises, no threats, no opposition.", "speaker": Constants.NPC_MAYOR, "truthful": true},
				{"text": "You don't understand. Without the loop, my enemies come back. The investigations reopen. The elections happen. I lose everything.", "speaker": Constants.NPC_MAYOR, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "Good. You should lose everything.", "leads_to": "end"},
				],
				"reveals_clues": [{"id": "mayor_motive_revealed", "title": "Mayor's True Motive", "description": "Mayor uses the loop to prevent elections, investigations, and opposition. Without it, he loses everything.", "category": Enums.ClueCategory.TESTIMONY, "importance": 5}]},
			]},
			"mayor_loop_ends": {"lines": [
				{"text": "Ends? You don't understand the bigger picture. The loop doesn't end. I control it. I always control it.", "speaker": Constants.NPC_MAYOR, "truthful": false},
				{"text": "But since you mention it... I've been meaning to increase security. For the good of the city. Hale!", "speaker": Constants.NPC_MAYOR, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "Hale's not coming to save you this time.", "leads_to": "end"},
				]},
			]},
			"mayor_deal": {"lines": [
				{"text": "Shut it down? Why would I shut down the greatest achievement in human history?", "speaker": Constants.NPC_MAYOR, "truthful": true},
				{"text": "But hypothetically... if I did... what's in it for me? Everyone wants something. Even righteous crusaders like you.", "speaker": Constants.NPC_MAYOR, "truthful": true,
				"choices": [
					{"id": "freedom", "text": "Your freedom. Turn yourself in, cooperate.", "leads_to": "mayor_reject_deal"},
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "Time's up for deals.", "leads_to": "end"},
				]},
			]},
			"mayor_reject_deal": {"lines": [
				{"text": "Freedom? I have all the freedom in the world! Every day is mine to control. Why would I trade that for a cell?", "speaker": Constants.NPC_MAYOR, "truthful": true},
				{"text": "No. For the good of the city, the loop continues. And you... you'll forget this conversation ever happened. Just like everyone else.", "speaker": Constants.NPC_MAYOR, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "I never forget. That's your problem.", "leads_to": "end"},
				]},
			]},
			"conspiracy_reveal_25": {
				"min_conspiracy": 25,
				"choice_label": "The development projects seem to benefit very specific people.",
				"lines": [
					{"text": "Development benefits everyone. Jobs, infrastructure, progress. You don't understand the bigger picture.", "speaker": Constants.NPC_MAYOR, "truthful": false,
					"choices": [
						{"id": "press", "text": "Everyone except the people being displaced.", "leads_to": "mayor_displacement"},
						{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					],
					"reveals_clues": [{"id": "mayor_deflects_development", "title": "Mayor Deflects on Development", "description": "Mayor dismisses concerns about targeted development benefiting only his allies.", "category": Enums.ClueCategory.OBSERVATION, "importance": 2}]},
				],
			},
			"mayor_displacement": {"lines": [
				{"text": "Progress requires sacrifice. Some properties need to make way for modern development. For the good of the city.", "speaker": Constants.NPC_MAYOR, "truthful": false,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "Sacrifice. Easy to say when it's not yours.", "leads_to": "end"},
				]},
			]},
			"conspiracy_reveal_50": {
				"min_conspiracy": 50,
				"choice_label": "I know about Victor's payments to your office.",
				"lines": [
					{"text": "Payments? Victor Crane makes legal campaign contributions. That's democracy in action.", "speaker": Constants.NPC_MAYOR, "truthful": false},
					{"text": "If you're suggesting impropriety, you'd better have evidence. For the good of the city, I won't tolerate slander against this office.", "speaker": Constants.NPC_MAYOR, "truthful": false,
					"choices": [
						{"id": "push", "text": "I have Frank's financial records.", "leads_to": "mayor_records_threat"},
						{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					],
					"reveals_clues": [{"id": "mayor_denies_payments", "title": "Mayor Denies Corrupt Payments", "description": "Mayor called Victor's payments 'legal campaign contributions' despite evidence of laundering.", "category": Enums.ClueCategory.OBSERVATION, "importance": 3}]},
				],
			},
			"mayor_records_threat": {"lines": [
				{"text": "Records can be fabricated. And the people who fabricate them tend to have... accidents. For the good of the city, I'd suggest destroying those records.", "speaker": Constants.NPC_MAYOR, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "Was that a threat, Mayor?", "leads_to": "end"},
				],
				"reveals_clues": [{"id": "mayor_threatens_records", "title": "Mayor Threatens Over Records", "description": "Mayor threatened 'accidents' for people with financial records and suggested destroying them.", "category": Enums.ClueCategory.TESTIMONY, "importance": 4}]},
			]},
			"conspiracy_reveal_75": {
				"min_conspiracy": 75,
				"choice_label": "The loop device in the basement. Your 'insurance policy.'",
				"lines": [
					{"text": "So you know. Impressive. Most people never get this far. You don't understand the bigger picture, but you've found part of it.", "speaker": Constants.NPC_MAYOR, "truthful": true},
					{"text": "Yes. The device exists. And yes, I control it. For the good of the city -- genuine good. No crime remembered. No suffering carried forward. A perfect day, forever.", "speaker": Constants.NPC_MAYOR, "truthful": false},
					{"text": "You think you can stop it? The loop resets everything. Your evidence, your plans, your allies' memories. I always win.", "speaker": Constants.NPC_MAYOR, "truthful": false,
					"choices": [
						{"id": "challenge", "text": "Not if I break the device before the reset.", "leads_to": "mayor_challenge"},
						{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
						{"id": "done", "text": "We'll see who wins today.", "leads_to": "end"},
					],
					"reveals_clues": [{"id": "mayor_loop_confirmed", "title": "Mayor Confirms Loop Control", "description": "Mayor admitted to controlling the loop device. Believes the reset makes him unbeatable.", "category": Enums.ClueCategory.TESTIMONY, "importance": 5}]},
				],
			},
			"mayor_challenge": {"lines": [
				{"text": "Break it? The basement is locked. I have the only key. Hale guards the building. Victor's people watch the perimeter.", "speaker": Constants.NPC_MAYOR, "truthful": true},
				{"text": "You'd need to get past all of them in a ten-minute window. Impossible. For the good of the city, give up.", "speaker": Constants.NPC_MAYOR, "truthful": false,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "Impossible is what I do.", "leads_to": "end"},
				],
				"reveals_clues": [{"id": "mayor_security_layout", "title": "Mayor Reveals Security", "description": "Mayor described his security: locked basement with his only key, Hale guards building, Victor's people on perimeter.", "category": Enums.ClueCategory.TESTIMONY, "importance": 4}]},
			]},
			"confrontation": {
				"required_clues": ["mayor_admits_device", "mayor_motive_revealed"],
				"lines": [
					{"text": "You know everything. Fine. But for the good of the city, consider this -- what happens when the loop breaks?", "speaker": Constants.NPC_MAYOR, "truthful": true},
					{"text": "All the crimes come flooding back. The disappearances, the deaths, the corruption. This town won't survive the truth.", "speaker": Constants.NPC_MAYOR, "truthful": false},
					{"text": "I've been protecting these people from consequences. Without me, without the loop, chaos. Is that what you want?", "speaker": Constants.NPC_MAYOR, "truthful": false,
					"choices": [
						{"id": "reject", "text": "Chaos is better than your prison.", "leads_to": "mayor_final_words"},
						{"id": "pity", "text": "You actually believe your own lies.", "leads_to": "mayor_delusion"},
						{"id": "done", "text": "Goodbye, Mayor.", "leads_to": "end"},
					],
					"reveals_clues": [{"id": "mayor_final_defense", "title": "Mayor's Final Defense", "description": "Mayor argued the loop protects people from the truth of accumulated crimes. His final justification for eternal control.", "category": Enums.ClueCategory.TESTIMONY, "importance": 5}]},
				],
			},
			"mayor_final_words": {"lines": [
				{"text": "Then do it. Destroy the device. Break the loop. Watch this town tear itself apart when everyone remembers.", "speaker": Constants.NPC_MAYOR, "truthful": true},
				{"text": "But know this -- I built something extraordinary. I stopped time itself. You don't understand the bigger picture. You never will.", "speaker": Constants.NPC_MAYOR, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "The bigger picture is freedom. And it starts now.", "leads_to": "end"},
				]},
			]},
			"mayor_delusion": {"lines": [
				{"text": "Lies? Everything I've done has been for this town. For stability. For order. You don't understand--", "speaker": Constants.NPC_MAYOR, "truthful": false},
				{"text": "...the bigger picture. Yes, I know. I've heard myself say it a thousand times. Literally. 847 loops of the same speech.", "speaker": Constants.NPC_MAYOR, "truthful": true},
				{"text": "Maybe you're right. Maybe I've been telling myself a story to sleep at night. But what's done is done.", "speaker": Constants.NPC_MAYOR, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "It's not done. It's just beginning.", "leads_to": "end"},
				]},
			]},
			"end": {"lines": []},
		},
	}


static func _build_tommy() -> void:
	_npc_data[Constants.NPC_TOMMY] = {
		"id": Constants.NPC_TOMMY,
		"name": "Tommy Reeves",
		"job": "delivery",
		"personality_traits": [Enums.PersonalityTrait.HONEST, Enums.PersonalityTrait.LOYAL, Enums.PersonalityTrait.COWARDLY],
		"secrets": ["Unknowing courier for Victor", "Delivers suspicious packages", "Murder victim in many loops"],
		"sprite_seed": 1010,
		"relationships": [
			{"target": Constants.NPC_FRANK, "type": Enums.RelationshipType.COWORKER, "trust": 2},
			{"target": Constants.NPC_PENNY, "type": Enums.RelationshipType.FRIEND, "trust": 2},
			{"target": Constants.NPC_VICTOR, "type": Enums.RelationshipType.SUBORDINATE, "trust": 0},
		],
		"default_dialogue": {
			"greeting": {"lines": [
				{"text": "Hey! Can't talk long -- got deliveries to make. No worries though, what's up?", "speaker": Constants.NPC_TOMMY, "truthful": true,
				"choices": [
					{"id": "deliveries", "text": "What are you delivering?", "leads_to": "about_deliveries"},
					{"id": "packages", "text": "Ever deliver anything suspicious?", "leads_to": "about_packages"},
					{"id": "frank", "text": "How's working with Frank?", "leads_to": "about_frank"},
					{"id": "penny", "text": "How's Penny?", "leads_to": "about_penny"},
					{"id": "victor", "text": "Victor Crane -- your boss?", "leads_to": "about_victor"},
					{"id": "maria", "text": "Been to Maria's cafe?", "leads_to": "about_maria"},
					{"id": "done", "text": "Don't let me hold you up.", "leads_to": "end"},
				]},
			]},
			"greeting_familiar": {"lines": [
				{"text": "Hey, nice to see you again! Just doing my rounds. Same routes, same packages. No worries!", "speaker": Constants.NPC_TOMMY, "truthful": true,
				"choices": [
					{"id": "deliveries", "text": "Same routes every day?", "leads_to": "tommy_same_routes"},
					{"id": "packages", "text": "About those packages...", "leads_to": "about_packages"},
					{"id": "hale", "text": "Hale ever bother you?", "leads_to": "about_hale"},
					{"id": "nina", "text": "Met the new woman in town?", "leads_to": "about_nina"},
					{"id": "penny", "text": "Penny says hi.", "leads_to": "about_penny"},
					{"id": "mayor", "text": "Deliver to City Hall?", "leads_to": "about_mayor"},
					{"id": "done", "text": "Stay safe, Tommy.", "leads_to": "end"},
				]},
			]},
			"greeting_late_game": {"lines": [
				{"text": "Hey... something's wrong today. I can't explain it. Everything feels like it already happened. No worries though... right?", "speaker": Constants.NPC_TOMMY, "truthful": true,
				"choices": [
					{"id": "feeling", "text": "You're feeling the loop, Tommy.", "leads_to": "tommy_loop_feeling"},
					{"id": "danger", "text": "You're in danger. Listen carefully.", "leads_to": "tommy_danger"},
					{"id": "today", "text": "Today's different. Trust me.", "leads_to": "tommy_trust"},
					{"id": "done", "text": "Be careful today.", "leads_to": "end"},
				]},
			]},
			"about_deliveries": {"lines": [
				{"text": "Packages, mail, food orders -- you name it! Mostly for businesses around town. Just doing my job!", "speaker": Constants.NPC_TOMMY, "truthful": true},
				{"text": "It's not glamorous, but hey, I know every street and alley. No worries about getting lost with me!", "speaker": Constants.NPC_TOMMY, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "Stay safe out there.", "leads_to": "end"},
				]},
			]},
			"tommy_same_routes": {"lines": [
				{"text": "Yeah! Same stops, same times. Mr. Crane's warehouse first, then City Hall, then the bar, then the market.", "speaker": Constants.NPC_TOMMY, "truthful": true},
				{"text": "Actually, now that you mention it... it's weird how everything is always exactly the same. Even the traffic. Even the birds.", "speaker": Constants.NPC_TOMMY, "truthful": true,
				"choices": [
					{"id": "press", "text": "What if I told you it's been the same day, over and over?", "leads_to": "tommy_same_day"},
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "Keep your eyes open.", "leads_to": "end"},
				]},
			]},
			"tommy_same_day": {"lines": [
				{"text": "The same day? That's... wait. You know what, that actually makes sense. I keep having this feeling like I already did all of this.", "speaker": Constants.NPC_TOMMY, "truthful": true},
				{"text": "Like I already delivered these exact packages to these exact places. Whoa. That's kind of freaky. No worries though... I think.", "speaker": Constants.NPC_TOMMY, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "It's real, Tommy. Stay alert.", "leads_to": "end"},
				]},
			]},
			"about_packages": {"lines": [
				{"text": "Suspicious? No way! Well... there's this one client who always has sealed crates. But that's normal, right?", "speaker": Constants.NPC_TOMMY, "truthful": true,
				"choices": [
					{"id": "press", "text": "Who's the client?", "leads_to": "tommy_client"},
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "Probably nothing.", "leads_to": "end"},
				]},
			]},
			"tommy_client": {"lines": [
				{"text": "Some business guy. Crane, I think? He tips well, so I don't ask questions. Just doing my job!", "speaker": Constants.NPC_TOMMY, "truthful": true},
				{"text": "The crates are heavy though. And he always says 'don't open them.' Which is weird because I never open packages anyway.", "speaker": Constants.NPC_TOMMY, "truthful": true,
				"choices": [
					{"id": "press", "text": "Tommy, those crates might be dangerous.", "leads_to": "tommy_crates_warning"},
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "Be careful, Tommy.", "leads_to": "end"},
				]},
			]},
			"tommy_crates_warning": {"lines": [
				{"text": "Dangerous? Come on, he's just a businessman. No worries! ...Right?", "speaker": Constants.NPC_TOMMY, "truthful": true},
				{"text": "Actually, now that I think about it, he does look at me funny sometimes. Like he's deciding something. That's probably nothing.", "speaker": Constants.NPC_TOMMY, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "Trust your instincts, Tommy.", "leads_to": "end"},
				],
				"reveals_clues": [{"id": "tommy_senses_danger", "title": "Tommy Senses Danger", "description": "Tommy noticed Victor looks at him as if 'deciding something' -- possibly evaluating him as a liability.", "category": Enums.ClueCategory.OBSERVATION, "importance": 2}]},
			]},
			"about_frank": {"lines": [
				{"text": "Frank's solid! Grumpy sometimes, but he looks out for me. Like an older brother, you know?", "speaker": Constants.NPC_TOMMY, "truthful": true},
				{"text": "He's been stressed lately though. Stays at the bar super late, jumps when the phone rings. No worries, I'm sure it'll pass.", "speaker": Constants.NPC_TOMMY, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "He's lucky to have you.", "leads_to": "end"},
				]},
			]},
			"about_penny": {"lines": [
				{"text": "Penny's the best! She's had it rough but she's so smart. Knows everything that happens in this town.", "speaker": Constants.NPC_TOMMY, "truthful": true},
				{"text": "I share my lunch with her sometimes. She pretends she doesn't need it but I can tell she's hungry. No worries, I got enough for two!", "speaker": Constants.NPC_TOMMY, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "You're a good friend, Tommy.", "leads_to": "end"},
				]},
			]},
			"about_victor": {"lines": [
				{"text": "Mr. Crane? He's okay I guess. Pays well, always has work. Just doing my job for him, no worries!", "speaker": Constants.NPC_TOMMY, "truthful": true},
				{"text": "Though he's not exactly friendly. More like... business-like. Never smiles. Gets annoyed if I'm even a minute late.", "speaker": Constants.NPC_TOMMY, "truthful": true,
				"choices": [
					{"id": "press", "text": "Tommy, Victor isn't who you think he is.", "leads_to": "tommy_victor_truth"},
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "Watch yourself around him.", "leads_to": "end"},
				]},
			]},
			"tommy_victor_truth": {"lines": [
				{"text": "Not who I think? What do you mean? He's a businessman. He buys buildings and stuff.", "speaker": Constants.NPC_TOMMY, "truthful": true},
				{"text": "...Are you saying he's bad? Like, actually bad? But he pays me. And he's never been mean to me. Well, not super mean.", "speaker": Constants.NPC_TOMMY, "truthful": true,
				"choices": [
					{"id": "tell", "text": "He's a criminal, Tommy. You're delivering evidence.", "leads_to": "tommy_revelation"},
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "Just be careful.", "leads_to": "end"},
				]},
			]},
			"tommy_revelation": {"lines": [
				{"text": "A criminal? Those crates are... evidence? Oh man. Oh no. I've been helping him this whole time?", "speaker": Constants.NPC_TOMMY, "truthful": true},
				{"text": "No worries, no worries... actually, a LOT of worries. What do I do? I can't just stop showing up, he'll know something's wrong!", "speaker": Constants.NPC_TOMMY, "truthful": true,
				"choices": [
					{"id": "plan", "text": "Keep acting normal. I'll handle Victor.", "leads_to": "tommy_act_normal"},
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "I'll protect you, Tommy.", "leads_to": "end"},
				],
				"reveals_clues": [{"id": "tommy_now_aware", "title": "Tommy Becomes Aware", "description": "Tommy now knows he's been unknowingly delivering criminal evidence for Victor Crane.", "category": Enums.ClueCategory.TESTIMONY, "importance": 3}]},
			]},
			"tommy_act_normal": {"lines": [
				{"text": "Act normal. Right. I can do that. Just smile and deliver. Just doing my job. No worries. Totally no worries.", "speaker": Constants.NPC_TOMMY, "truthful": true},
				{"text": "But hey -- if you need me to, I can keep one of those crates. Bring it to you instead of to Victor. Would that help?", "speaker": Constants.NPC_TOMMY, "truthful": true,
				"choices": [
					{"id": "accept", "text": "Yes! Bring me the next crate.", "leads_to": "tommy_intercept"},
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "Too dangerous. Just stay safe.", "leads_to": "end"},
				]},
			]},
			"tommy_intercept": {"lines": [
				{"text": "Okay! I'll grab the next one and bring it to you. Victor won't know until it's too late. Just doing my job -- my REAL job this time!", "speaker": Constants.NPC_TOMMY, "truthful": true},
				{"text": "I'll meet you at Maria's cafe. It's the safest place I know. No worries -- okay, lots of worries. But I'll do it.", "speaker": Constants.NPC_TOMMY, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "You're brave, Tommy.", "leads_to": "end"},
				],
				"reveals_clues": [{"id": "tommy_will_intercept", "title": "Tommy Will Intercept Delivery", "description": "Tommy agreed to intercept Victor's next delivery and bring it as evidence to Maria's cafe.", "category": Enums.ClueCategory.TESTIMONY, "importance": 4}]},
			]},
			"about_maria": {"lines": [
				{"text": "Maria's amazing! Best pastries in town. I go there every morning before deliveries. She always has something warm waiting.", "speaker": Constants.NPC_TOMMY, "truthful": true},
				{"text": "She worries about me. Says I'm too trusting. But hey, nice to meet people who care, right? No worries!", "speaker": Constants.NPC_TOMMY, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "She's right to worry.", "leads_to": "end"},
				]},
			]},
			"about_hale": {"lines": [
				{"text": "Detective Hale? He's kind of scary. Stopped me once and searched my packages. Said it was routine.", "speaker": Constants.NPC_TOMMY, "truthful": true},
				{"text": "Weird thing is, he looked at Victor's crates, nodded, and let me go. Didn't even open them. No worries, I guess.", "speaker": Constants.NPC_TOMMY, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "He let Victor's crates through...", "leads_to": "end"},
				],
				"reveals_clues": [{"id": "hale_passes_crates", "title": "Hale Passes Victor's Crates", "description": "Hale searched Tommy's packages but deliberately skipped Victor's sealed crates.", "category": Enums.ClueCategory.OBSERVATION, "importance": 3}]},
			]},
			"about_nina": {"lines": [
				{"text": "The new lady? She's nice but kind of intense. Asked me a bunch of questions about my delivery routes.", "speaker": Constants.NPC_TOMMY, "truthful": true},
				{"text": "Said something about 'keeping me safe this time.' This time? Weird, right? No worries though, she seemed to mean well.", "speaker": Constants.NPC_TOMMY, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "She does mean well.", "leads_to": "end"},
				]},
			]},
			"about_mayor": {"lines": [
				{"text": "City Hall? Yeah, I deliver there! Official mail, some boxes from Mr. Crane. The security guy always makes me sign in.", "speaker": Constants.NPC_TOMMY, "truthful": true},
				{"text": "I noticed something weird though -- there's a door in the hallway that's always locked. And it hums. Like, the door itself vibrates.", "speaker": Constants.NPC_TOMMY, "truthful": true,
				"choices": [
					{"id": "press", "text": "The vibrating door -- where exactly?", "leads_to": "tommy_vibrating_door"},
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "That's very helpful.", "leads_to": "end"},
				]},
			]},
			"tommy_vibrating_door": {"lines": [
				{"text": "Ground floor, end of the east corridor. Heavy metal door with a keypad lock. I always feel weird standing near it.", "speaker": Constants.NPC_TOMMY, "truthful": true},
				{"text": "Like a buzzing in my teeth. No worries though, I just drop the packages and go. But it is creepy.", "speaker": Constants.NPC_TOMMY, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "East corridor, keypad lock. Got it.", "leads_to": "end"},
				],
				"reveals_clues": [{"id": "basement_door_location", "title": "Basement Door Location", "description": "Heavy metal door with keypad lock at end of east corridor, ground floor of City Hall. Vibrates with temporal energy.", "category": Enums.ClueCategory.OBSERVATION, "importance": 4}]},
			]},
			"tommy_loop_feeling": {"lines": [
				{"text": "The loop? Is that what this is? I knew something was off! The same day, the same deliveries, the same everything!", "speaker": Constants.NPC_TOMMY, "truthful": true},
				{"text": "Wait... does that mean... every time I die... I come back? That's why Nina said 'this time.' How many times have I...?", "speaker": Constants.NPC_TOMMY, "truthful": true,
				"choices": [
					{"id": "tell_truth", "text": "Many times, Tommy. But not today.", "leads_to": "tommy_many_times"},
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "Today we break the loop.", "leads_to": "end"},
				]},
			]},
			"tommy_many_times": {"lines": [
				{"text": "Many... oh man. Oh man oh man. I die? Like, a lot? No worries, no worries, no-- okay, lots of worries.", "speaker": Constants.NPC_TOMMY, "truthful": true},
				{"text": "But you're here now. And you remember. So this time is different, right? Right?", "speaker": Constants.NPC_TOMMY, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "This time is different. I promise.", "leads_to": "end"},
				]},
			]},
			"tommy_danger": {"lines": [
				{"text": "In danger? From who? Mr. Crane? But I've always done my deliveries on time!", "speaker": Constants.NPC_TOMMY, "truthful": true},
				{"text": "Oh no. You mean because of what's in the crates? He's going to find out I know, isn't he?", "speaker": Constants.NPC_TOMMY, "truthful": true,
				"choices": [
					{"id": "protect", "text": "Stay at the cafe. Don't do today's deliveries.", "leads_to": "tommy_stay_safe"},
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "Just avoid Victor today.", "leads_to": "end"},
				]},
			]},
			"tommy_stay_safe": {"lines": [
				{"text": "Skip my deliveries? But Mr. Crane will-- oh. Right. He's the bad guy. I keep forgetting.", "speaker": Constants.NPC_TOMMY, "truthful": true},
				{"text": "Okay, I'll go to Maria's. She'll let me hide out there. No worries... okay, some worries. Thanks for looking out for me.", "speaker": Constants.NPC_TOMMY, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "Stay safe, Tommy. Today matters.", "leads_to": "end"},
				]},
			]},
			"tommy_trust": {"lines": [
				{"text": "Today's different? You keep saying that. But it does feel different. More... real somehow.", "speaker": Constants.NPC_TOMMY, "truthful": true},
				{"text": "I trust you. I don't know why, but I do. Just doing my job -- if my job today is helping you, then no worries!", "speaker": Constants.NPC_TOMMY, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "Your job today saves everyone.", "leads_to": "end"},
				]},
			]},
			"conspiracy_reveal_25": {
				"min_conspiracy": 25,
				"choice_label": "Tommy, those crates from Victor are suspicious.",
				"lines": [
					{"text": "Suspicious? They're just... well, they ARE always sealed. And heavy. And he says never to open them.", "speaker": Constants.NPC_TOMMY, "truthful": true,
					"choices": [
						{"id": "press", "text": "Where do the crates go?", "leads_to": "tommy_crate_destinations"},
						{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					],
					"reveals_clues": [{"id": "tommy_crate_concern", "title": "Tommy Notices Crate Issues", "description": "Tommy admits Victor's crates are suspiciously sealed, heavy, and he's forbidden from opening them.", "category": Enums.ClueCategory.OBSERVATION, "importance": 2}]},
				],
			},
			"tommy_crate_destinations": {"lines": [
				{"text": "Different places! The docks, City Hall, sometimes the back of the bar. No worries, it's probably just business supplies.", "speaker": Constants.NPC_TOMMY, "truthful": true},
				{"text": "...Though one time I dropped a crate and heard glass break inside. And Mr. Crane went really, really quiet. That was scary.", "speaker": Constants.NPC_TOMMY, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "Not business supplies, Tommy.", "leads_to": "end"},
				]},
			]},
			"conspiracy_reveal_50": {
				"min_conspiracy": 50,
				"choice_label": "Tommy, I need you to look inside the next crate.",
				"lines": [
					{"text": "Look inside? Mr. Crane said never to-- but you think there's something bad in there?", "speaker": Constants.NPC_TOMMY, "truthful": true},
					{"text": "Okay. Okay, I'll do it. Just doing my job. My REAL job. Which is apparently not what I thought it was.", "speaker": Constants.NPC_TOMMY, "truthful": true,
					"choices": [
						{"id": "press", "text": "What did you find?", "leads_to": "tommy_crate_contents"},
						{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					],
					"reveals_clues": [{"id": "tommy_agrees_to_look", "title": "Tommy Agrees to Investigate", "description": "Tommy agreed to open and examine Victor's sealed crates despite the risk.", "category": Enums.ClueCategory.TESTIMONY, "importance": 3}]},
				],
			},
			"tommy_crate_contents": {"lines": [
				{"text": "Cash. Lots of it. And documents with the mayor's seal. And something wrapped in cloth that looked like... equipment? Scientific stuff.", "speaker": Constants.NPC_TOMMY, "truthful": true},
				{"text": "No worries, no worries-- actually, HUGE worries. I've been delivering evidence of a crime ring this whole time!", "speaker": Constants.NPC_TOMMY, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "Now you know the truth.", "leads_to": "end"},
				],
				"reveals_clues": [{"id": "crate_contents_confirmed", "title": "Crate Contents Confirmed", "description": "Tommy found cash, mayor-sealed documents, and scientific equipment in Victor's crates.", "category": Enums.ClueCategory.PHYSICAL_EVIDENCE, "importance": 4}]},
			]},
			"conspiracy_reveal_75": {
				"min_conspiracy": 75,
				"choice_label": "Tommy, there's a reason you feel like this day repeats.",
				"lines": [
					{"text": "A reason? You mean it's not just deja vu? It's actually happening?", "speaker": Constants.NPC_TOMMY, "truthful": true},
					{"text": "Oh man. That explains so much. The same deliveries, the same routes, the same creepy feeling near City Hall.", "speaker": Constants.NPC_TOMMY, "truthful": true},
					{"text": "And... wait. If the day repeats... have I died before? In other loops? No worries... no worries...", "speaker": Constants.NPC_TOMMY, "truthful": true,
					"choices": [
						{"id": "comfort", "text": "Not today, Tommy. Today we end it.", "leads_to": "tommy_end_it"},
						{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
						{"id": "done", "text": "Stay strong.", "leads_to": "end"},
					],
					"reveals_clues": [{"id": "tommy_loop_aware", "title": "Tommy Becomes Loop Aware", "description": "Tommy now understands the time loop and suspects he's died in previous iterations.", "category": Enums.ClueCategory.OBSERVATION, "importance": 2}]},
				],
			},
			"tommy_end_it": {"lines": [
				{"text": "End it? You can actually stop the loop? Then tell me what to do. I'm tired of being a pawn.", "speaker": Constants.NPC_TOMMY, "truthful": true},
				{"text": "I know Victor's schedule. I know his warehouse. I know when Hale does his rounds. Just doing my job -- but this time, for the right team!", "speaker": Constants.NPC_TOMMY, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "Welcome to the right team, Tommy.", "leads_to": "end"},
				]},
			]},
			"confrontation": {
				"required_clues": ["tommy_now_aware", "crate_contents_confirmed"],
				"lines": [
					{"text": "I know everything now. The crates, Victor, the loop, all of it. And you know what? No worries.", "speaker": Constants.NPC_TOMMY, "truthful": true},
					{"text": "Because for the first time, I'm not just doing my job blindly. I'm actually helping.", "speaker": Constants.NPC_TOMMY, "truthful": true},
					{"text": "I intercepted today's delivery. Cash, documents, a piece of equipment. It's all at Maria's cafe. Take it.", "speaker": Constants.NPC_TOMMY, "truthful": true,
					"choices": [
						{"id": "thank", "text": "Tommy, you might have just saved this town.", "leads_to": "tommy_hero"},
						{"id": "warn", "text": "Victor will come looking for you.", "leads_to": "tommy_aware_danger"},
						{"id": "done", "text": "You're incredibly brave.", "leads_to": "end"},
					],
					"reveals_clues": [{"id": "tommy_intercepted_delivery", "title": "Tommy's Intercepted Delivery", "description": "Tommy intercepted Victor's delivery and brought cash, documents, and equipment to Maria's cafe as evidence.", "category": Enums.ClueCategory.PHYSICAL_EVIDENCE, "importance": 5}]},
				],
			},
			"tommy_hero": {"lines": [
				{"text": "Saved the town? Me? Tommy Reeves, delivery boy? Heh. No worries! That's what heroes say, right?", "speaker": Constants.NPC_TOMMY, "truthful": true},
				{"text": "Just doing my job. Except today, my job actually matters. Hey, nice to finally meet the real me!", "speaker": Constants.NPC_TOMMY, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "The real you is pretty great, Tommy.", "leads_to": "end"},
				]},
			]},
			"tommy_aware_danger": {"lines": [
				{"text": "I know. Penny told me what happens to people who cross Victor. But this time I'm not alone.", "speaker": Constants.NPC_TOMMY, "truthful": true},
				{"text": "Maria's keeping me safe at the cafe. Frank said he'd watch the door. Even Penny's keeping lookout. No worries -- I got friends.", "speaker": Constants.NPC_TOMMY, "truthful": true,
				"choices": [
					{"id": "back", "text": "Let me ask something else.", "leads_to": "greeting"},
					{"id": "done", "text": "You've got more friends than you know.", "leads_to": "end"},
				]},
			]},
			"end": {"lines": []},
		},
	}
