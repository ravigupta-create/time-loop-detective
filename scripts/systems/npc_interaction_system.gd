class_name NPCInteractionSystem
extends Node
## Manages NPC-to-NPC interactions when two or more NPCs share a location.
## Generates contextual conversations, speech bubbles, and observation clues.

var _active_interactions: Array[Dictionary] = []
var _interaction_cooldowns: Dictionary = {} # "npcA_npcB" -> time_until_next
var _rng := RandomNumberGenerator.new()


func _ready() -> void:
	_rng.randomize()
	EventBus.time_tick.connect(_on_time_tick)
	EventBus.loop_reset.connect(_on_loop_reset)


func _on_loop_reset(_loop_number: int) -> void:
	_active_interactions.clear()
	_interaction_cooldowns.clear()


func _on_time_tick(current_time: float) -> void:
	# Decrease cooldowns
	var expired_keys: Array[String] = []
	for key in _interaction_cooldowns:
		_interaction_cooldowns[key] -= Constants.TIME_TICK_INTERVAL
		if _interaction_cooldowns[key] <= 0:
			expired_keys.append(key)
	for key in expired_keys:
		_interaction_cooldowns.erase(key)

	# Advance active interactions
	var finished: Array[int] = []
	for i in _active_interactions.size():
		_active_interactions[i]["remaining"] -= Constants.TIME_TICK_INTERVAL
		if _active_interactions[i]["remaining"] <= 0:
			finished.append(i)

	# Remove finished interactions (reverse order to preserve indices)
	finished.reverse()
	for i in finished:
		var interaction: Dictionary = _active_interactions[i]
		EventBus.npc_npc_interaction_ended.emit(interaction["npc_a"], interaction["npc_b"])
		_active_interactions.remove_at(i)


## Called by game_world when it detects NPCs sharing a location.
## npc_pairs: Array of [npc_id_a, npc_id_b] pairs at the current player location.
func check_interactions(npc_pairs: Array, player_location_id: int, current_time: float) -> void:
	for pair in npc_pairs:
		var npc_a: String = pair[0]
		var npc_b: String = pair[1]

		# Sort for consistent key
		var key := _pair_key(npc_a, npc_b)

		# Skip if on cooldown or already interacting
		if key in _interaction_cooldowns:
			continue
		if _is_interacting(npc_a) or _is_interacting(npc_b):
			continue

		# Check if both are interruptible
		if not ScheduleEvaluator.is_interruptible(npc_a, current_time):
			continue
		if not ScheduleEvaluator.is_interruptible(npc_b, current_time):
			continue

		# Determine interaction type based on relationship
		var interaction_type := _determine_interaction_type(npc_a, npc_b)
		if interaction_type.is_empty():
			continue

		# Some interactions only happen when player is NOT present
		if interaction_type == "conspiratorial" and _player_is_present(player_location_id):
			continue

		# Start interaction
		var duration := _rng.randf_range(15.0, 30.0)
		var interaction := {
			"npc_a": npc_a,
			"npc_b": npc_b,
			"type": interaction_type,
			"remaining": duration,
			"location": player_location_id,
			"clue_generated": false
		}
		_active_interactions.append(interaction)
		_interaction_cooldowns[key] = Constants.NPC_INTERACTION_COOLDOWN

		EventBus.npc_npc_interaction_started.emit(npc_a, npc_b, interaction_type)

		# If player witnesses, generate observation clue
		if _player_is_present(player_location_id):
			_generate_observation_clue(interaction)


func _determine_interaction_type(npc_a: String, npc_b: String) -> String:
	var data_a := NPCDatabase.get_npc_data(npc_a)
	var data_b := NPCDatabase.get_npc_data(npc_b)

	var rel_type := _get_relationship_type(data_a, npc_b)

	match rel_type:
		Enums.RelationshipType.FRIEND:
			return "friendly"
		Enums.RelationshipType.ENEMY:
			return "hostile"
		Enums.RelationshipType.BOSS, Enums.RelationshipType.SUBORDINATE:
			# Check if they're conspiracy-connected
			if _are_conspirators(npc_a, npc_b):
				return "conspiratorial"
			return "business"
		Enums.RelationshipType.BLACKMAILEE:
			return "tense"
		Enums.RelationshipType.COWORKER:
			if _are_conspirators(npc_a, npc_b):
				return "conspiratorial"
			return "professional"
		Enums.RelationshipType.INFORMANT:
			return "secretive"
		_:
			# 30% chance of small talk for unknown relationships
			if _rng.randf() < 0.3:
				return "smalltalk"
			return ""


func _are_conspirators(npc_a: String, npc_b: String) -> bool:
	var conspirators := [Constants.NPC_MAYOR, Constants.NPC_VICTOR, Constants.NPC_HALE, Constants.NPC_ELEANOR]
	return npc_a in conspirators and npc_b in conspirators


func _generate_observation_clue(interaction: Dictionary) -> void:
	if interaction["clue_generated"]:
		return
	interaction["clue_generated"] = true

	var npc_a: String = interaction["npc_a"]
	var npc_b: String = interaction["npc_b"]
	var itype: String = interaction["type"]
	var name_a := NPCDatabase.get_npc_name(npc_a)
	var name_b := NPCDatabase.get_npc_name(npc_b)

	var clue_id := "obs_%s_%s_%d" % [npc_a.left(5), npc_b.left(5), GameState.current_loop]
	var title := ""
	var description := ""
	var importance := 1
	var category := Enums.ClueCategory.OBSERVATION

	match itype:
		"friendly":
			title = "%s and %s chatting" % [name_a, name_b]
			description = "You observed %s and %s having a friendly conversation. They seem close." % [name_a, name_b]
		"hostile":
			title = "Tension between %s and %s" % [name_a, name_b]
			description = "You witnessed a tense exchange between %s and %s. Voices were raised." % [name_a, name_b]
			importance = 2
		"conspiratorial":
			title = "Secret meeting: %s and %s" % [name_a, name_b]
			description = "You caught %s and %s in a whispered conversation. They stopped when they noticed you." % [name_a, name_b]
			importance = 4
			category = Enums.ClueCategory.OBSERVATION
		"business":
			title = "%s giving orders to %s" % [name_a, name_b]
			description = "You saw %s issuing instructions to %s. The tone was authoritative." % [name_a, name_b]
			importance = 2
		"tense":
			title = "%s cornering %s" % [name_a, name_b]
			description = "%s seemed to be pressuring %s about something. %s looked uncomfortable." % [name_a, name_b, name_b]
			importance = 3
		"secretive":
			title = "Hushed exchange: %s and %s" % [name_a, name_b]
			description = "%s passed something to %s discreetly. They separated quickly afterwards." % [name_a, name_b]
			importance = 3
		"professional":
			title = "%s and %s in discussion" % [name_a, name_b]
			description = "%s and %s were discussing work matters." % [name_a, name_b]
		"smalltalk":
			title = "%s and %s in passing" % [name_a, name_b]
			description = "%s and %s exchanged brief pleasantries." % [name_a, name_b]

	GameState.add_clue(clue_id, {
		"id": clue_id,
		"title": title,
		"description": description,
		"category": category,
		"importance": importance,
		"related_npcs": [npc_a, npc_b],
		"location": interaction["location"]
	})

	# Notify player
	EventBus.notification_queued.emit("Observed: %s" % title, "clue")


func _get_relationship_type(npc_data: Dictionary, target_id: String) -> int:
	var relationships: Array = npc_data.get("relationships", [])
	for rel in relationships:
		if rel.get("target", "") == target_id:
			return rel.get("type", Enums.RelationshipType.UNKNOWN) as int
	return Enums.RelationshipType.UNKNOWN


func _pair_key(npc_a: String, npc_b: String) -> String:
	if npc_a < npc_b:
		return "%s_%s" % [npc_a, npc_b]
	return "%s_%s" % [npc_b, npc_a]


func _is_interacting(npc_id: String) -> bool:
	for interaction in _active_interactions:
		if interaction["npc_a"] == npc_id or interaction["npc_b"] == npc_id:
			return true
	return false


func _player_is_present(_location_id: int) -> bool:
	# The player is always at the current location being checked
	return true


func get_active_interaction_text(npc_id: String) -> String:
	## Returns speech bubble text for an NPC currently in an interaction.
	for interaction in _active_interactions:
		if interaction["npc_a"] != npc_id and interaction["npc_b"] != npc_id:
			continue

		var partner_id: String = interaction["npc_b"] if interaction["npc_a"] == npc_id else interaction["npc_a"]
		var partner_name := NPCDatabase.get_npc_name(partner_id)

		match interaction["type"]:
			"friendly":
				var lines := [
					"So anyway, I was saying...",
					"Ha! That's a good one.",
					"You heard the latest?",
					"Things have been strange lately...",
				]
				return lines[_rng.randi() % lines.size()]
			"hostile":
				var lines := [
					"Stay out of my way.",
					"We're not done here.",
					"You'll regret this.",
					"Back off.",
				]
				return lines[_rng.randi() % lines.size()]
			"conspiratorial":
				var lines := [
					"*whispering*",
					"Keep your voice down...",
					"Not here. Later.",
					"...",
				]
				return lines[_rng.randi() % lines.size()]
			"business":
				var lines := [
					"Get it done.",
					"I need that report.",
					"Understood.",
					"Right away.",
				]
				return lines[_rng.randi() % lines.size()]
			"tense":
				var lines := [
					"You owe me.",
					"I didn't have a choice...",
					"Don't forget what I know.",
					"Please, just give me more time.",
				]
				return lines[_rng.randi() % lines.size()]
			"secretive":
				return "*exchanges glance with %s*" % partner_name
			_:
				return "..."

	return ""
