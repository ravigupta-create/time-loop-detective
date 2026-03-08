extends Node
## Persistent player knowledge - survives loop resets AND game restarts.

# Clue tracking
var discovered_clues: Dictionary = {} # clue_id -> ClueData dict
var clue_connections: Array[Dictionary] = [] # [{clue_a, clue_b, type}]
var theories: Array[Dictionary] = [] # [{id, description, clues[], verified}]

# NPC knowledge
var known_npcs: Dictionary = {} # npc_id -> {name, job, known_facts[], trust, observed_schedules[]}
var npc_dialogue_history: Dictionary = {} # npc_id -> [dialogue_ids seen]
var npc_lies_detected: Dictionary = {} # npc_id -> [clue_ids that contradict]

# Crime knowledge
var witnessed_crimes: Array[String] = [] # crime_ids
var solved_crimes: Array[String] = []
var intervention_history: Array[Dictionary] = [] # [{loop, crime_id, type, outcome}]

# Conspiracy
var conspiracy_progress: int = 0
var conspiracy_milestones: Array[String] = [] # unlocked story beats

# Difficulty
var difficulty: int = 1  # 0=Easy, 1=Medium, 2=Hard, 3=Extreme

# Loop tracking
var current_loop: int = 1
var total_play_time: float = 0.0

# Timeline data (what player observed each loop)
var timeline_entries: Array[Dictionary] = [] # [{loop, time, npc_id, location, activity}]

# Player position persistence (for save/load, not loop reset)
var last_location: int = Enums.LocationID.APARTMENT_COMPLEX

# Settings (persisted with save data)
var settings: Dictionary = {
	"music_volume": 0.8,
	"sfx_volume": 1.0,
	"ambience_volume": 0.6
}


func _ready() -> void:
	EventBus.clue_discovered.connect(_on_clue_discovered)
	EventBus.conspiracy_progress_changed.connect(_on_conspiracy_changed)
	EventBus.loop_reset.connect(_on_loop_reset)


func _on_clue_discovered(clue_id: String) -> void:
	if clue_id not in discovered_clues:
		discovered_clues[clue_id] = {"id": clue_id, "loop_discovered": current_loop, "time_discovered": TimeManager.current_time}
		_check_auto_deductions()


func _on_conspiracy_changed(new_value: int) -> void:
	conspiracy_progress = new_value


func _on_loop_reset(loop_number: int) -> void:
	current_loop = loop_number


func add_clue(clue_id: String, clue_dict: Dictionary) -> void:
	if clue_id not in discovered_clues:
		discovered_clues[clue_id] = clue_dict
		discovered_clues[clue_id]["loop_discovered"] = current_loop
		discovered_clues[clue_id]["time_discovered"] = TimeManager.current_time
		EventBus.clue_discovered.emit(clue_id)
		_check_auto_deductions()


func add_npc_knowledge(npc_id: String, fact: String) -> void:
	if npc_id not in known_npcs:
		known_npcs[npc_id] = {"known_facts": [], "trust": 0, "observed_schedules": []}
	if fact not in known_npcs[npc_id]["known_facts"]:
		known_npcs[npc_id]["known_facts"].append(fact)


func record_npc_dialogue(npc_id: String, dialogue_id: String) -> void:
	if npc_id not in npc_dialogue_history:
		npc_dialogue_history[npc_id] = []
	if dialogue_id not in npc_dialogue_history[npc_id]:
		npc_dialogue_history[npc_id].append(dialogue_id)


func has_seen_dialogue(npc_id: String, dialogue_id: String) -> bool:
	if npc_id not in npc_dialogue_history:
		return false
	return dialogue_id in npc_dialogue_history[npc_id]


func record_timeline_entry(npc_id: String, location_id: int, activity: String) -> void:
	timeline_entries.append({
		"loop": current_loop,
		"time": TimeManager.current_time,
		"npc_id": npc_id,
		"location": location_id,
		"activity": activity
	})


func add_connection(clue_a: String, clue_b: String, conn_type: int) -> String:
	for conn in clue_connections:
		if (conn["clue_a"] == clue_a and conn["clue_b"] == clue_b) or \
		   (conn["clue_a"] == clue_b and conn["clue_b"] == clue_a):
			return "" # Already exists
	var conn_id := "conn_%d" % clue_connections.size()
	clue_connections.append({
		"id": conn_id,
		"clue_a": clue_a,
		"clue_b": clue_b,
		"type": conn_type
	})
	EventBus.clue_connection_made.emit(conn_id)
	_update_conspiracy_progress()
	return conn_id


func advance_conspiracy(amount: int) -> void:
	var old := conspiracy_progress
	conspiracy_progress = mini(conspiracy_progress + amount, Constants.CONSPIRACY_MAX)
	if conspiracy_progress != old:
		EventBus.conspiracy_progress_changed.emit(conspiracy_progress)


func _update_conspiracy_progress() -> void:
	# Each valid conspiracy connection advances progress
	var conspiracy_conns := 0
	for conn in clue_connections:
		if conn["type"] == Enums.ConnectionType.CONSPIRACY or \
		   conn["type"] == Enums.ConnectionType.FINANCIAL:
			conspiracy_conns += 1
	var mult: int = Constants.get_dp("conspiracy_mult", difficulty)
	var target := mini(conspiracy_conns * mult, Constants.CONSPIRACY_MAX)
	if target > conspiracy_progress:
		advance_conspiracy(target - conspiracy_progress)


func _check_auto_deductions() -> void:
	# Check for contradictions between NPC testimonies
	var testimonies: Dictionary = {}
	for clue_id in discovered_clues:
		var clue: Dictionary = discovered_clues[clue_id]
		if clue.get("category") == Enums.ClueCategory.TESTIMONY:
			var npc := clue.get("source_npc", "") as String
			if npc not in testimonies:
				testimonies[npc] = []
			testimonies[npc].append(clue)

	# Check for same-event contradictions
	for npc_a in testimonies:
		for clue_a in testimonies[npc_a]:
			for npc_b in testimonies:
				if npc_a == npc_b:
					continue
				for clue_b in testimonies[npc_b]:
					if clue_a.get("about_event") == clue_b.get("about_event") and \
					   clue_a.get("claim") != clue_b.get("claim") and \
					   not _connection_exists(clue_a["id"], clue_b["id"]):
						var contra_id := "auto_contradiction_%d" % discovered_clues.size()
						add_clue(contra_id, {
							"id": contra_id,
							"title": "Contradiction: %s vs %s" % [npc_a, npc_b],
							"description": "Their stories about %s don't match." % clue_a.get("about_event", "an event"),
							"category": Enums.ClueCategory.CONTRADICTION,
							"importance": 3,
							"related_npcs": [npc_a, npc_b]
						})
						add_connection(clue_a["id"], clue_b["id"], Enums.ConnectionType.CONTRADICTION)

	# Run advanced deduction engine
	ClueDeduction.run_all_deductions()


func _connection_exists(clue_a: String, clue_b: String) -> bool:
	for conn in clue_connections:
		if (conn["clue_a"] == clue_a and conn["clue_b"] == clue_b) or \
		   (conn["clue_a"] == clue_b and conn["clue_b"] == clue_a):
			return true
	return false


func get_save_data() -> Dictionary:
	return {
		"discovered_clues": discovered_clues,
		"clue_connections": clue_connections,
		"theories": theories,
		"known_npcs": known_npcs,
		"npc_dialogue_history": npc_dialogue_history,
		"npc_lies_detected": npc_lies_detected,
		"witnessed_crimes": witnessed_crimes,
		"solved_crimes": solved_crimes,
		"intervention_history": intervention_history,
		"conspiracy_progress": conspiracy_progress,
		"conspiracy_milestones": conspiracy_milestones,
		"difficulty": difficulty,
		"current_loop": current_loop,
		"total_play_time": total_play_time,
		"timeline_entries": timeline_entries,
		"last_location": last_location,
		"settings": settings
	}


func load_save_data(data: Dictionary) -> void:
	discovered_clues = data.get("discovered_clues", {})
	clue_connections = []
	for c in data.get("clue_connections", []):
		clue_connections.append(c)
	theories = []
	for t in data.get("theories", []):
		theories.append(t)
	known_npcs = data.get("known_npcs", {})
	npc_dialogue_history = data.get("npc_dialogue_history", {})
	npc_lies_detected = data.get("npc_lies_detected", {})
	witnessed_crimes = []
	for w in data.get("witnessed_crimes", []):
		witnessed_crimes.append(w)
	solved_crimes = []
	for s in data.get("solved_crimes", []):
		solved_crimes.append(s)
	intervention_history = []
	for i in data.get("intervention_history", []):
		intervention_history.append(i)
	conspiracy_progress = data.get("conspiracy_progress", 0)
	conspiracy_milestones = []
	for m in data.get("conspiracy_milestones", []):
		conspiracy_milestones.append(m)
	difficulty = data.get("difficulty", 1)
	current_loop = data.get("current_loop", 1)
	total_play_time = data.get("total_play_time", 0.0)
	timeline_entries = []
	for e in data.get("timeline_entries", []):
		timeline_entries.append(e)
	last_location = data.get("last_location", Enums.LocationID.APARTMENT_COMPLEX)
	settings = data.get("settings", {"music_volume": 0.8, "sfx_volume": 1.0, "ambience_volume": 0.6})
	# Apply volumes to AudioManager
	if has_node("/root/AudioManager"):
		var am := get_node("/root/AudioManager")
		am.music_volume = settings.get("music_volume", 0.8)
		am.sfx_volume = settings.get("sfx_volume", 1.0)
		am.ambience_volume = settings.get("ambience_volume", 0.6)
