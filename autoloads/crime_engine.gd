extends Node
## Procedural crime generation, stage execution, intervention handling.

var active_crimes: Array[Dictionary] = []
var crime_templates: Array[Dictionary] = []
var _rng := RandomNumberGenerator.new()


func _ready() -> void:
	_rng.randomize()
	_init_crime_templates()
	EventBus.loop_reset.connect(_on_loop_reset)
	EventBus.time_tick.connect(_on_time_tick)
	EventBus.crime_intervened.connect(_on_crime_intervened)


func _on_loop_reset(_loop_number: int) -> void:
	active_crimes.clear()
	_generate_crimes_for_loop()


func _on_time_tick(current_time: float) -> void:
	for crime in active_crimes:
		if crime["resolved"]:
			continue
		_advance_crime(crime, current_time)


func _generate_crimes_for_loop() -> void:
	var available := _get_available_templates()
	var count := _rng.randi_range(Constants.MIN_CRIMES_PER_LOOP, Constants.MAX_CRIMES_PER_LOOP)

	# Always include one conspiracy-connected crime if progress allows
	var conspiracy_crime := _pick_conspiracy_crime(available)
	if conspiracy_crime:
		active_crimes.append(_instantiate_crime(conspiracy_crime))
		available.erase(conspiracy_crime)
		count -= 1

	# Fill remaining with side crimes
	available.shuffle()
	for i in mini(count, available.size()):
		active_crimes.append(_instantiate_crime(available[i]))

	print("[CrimeEngine] Generated %d crimes for loop %d" % [active_crimes.size(), GameState.current_loop])


func _get_available_templates() -> Array[Dictionary]:
	var result: Array[Dictionary] = []
	for tmpl in crime_templates:
		var tier: int = tmpl["tier"]
		match tier:
			Enums.CrimeTier.EARLY:
				result.append(tmpl)
			Enums.CrimeTier.MID:
				if GameState.conspiracy_progress >= Constants.CONSPIRACY_TIER_1:
					result.append(tmpl)
			Enums.CrimeTier.LATE:
				if GameState.conspiracy_progress >= Constants.CONSPIRACY_TIER_2:
					result.append(tmpl)
			Enums.CrimeTier.ENDGAME:
				if GameState.conspiracy_progress >= Constants.CONSPIRACY_TIER_4:
					result.append(tmpl)
	return result


func _pick_conspiracy_crime(available: Array[Dictionary]) -> Dictionary:
	var conspiracy_crimes: Array[Dictionary] = []
	for tmpl in available:
		if tmpl.get("conspiracy_connected", false):
			conspiracy_crimes.append(tmpl)
	if conspiracy_crimes.is_empty():
		return {}
	return conspiracy_crimes[_rng.randi() % conspiracy_crimes.size()]


func _instantiate_crime(template: Dictionary) -> Dictionary:
	var crime_id := "crime_%d_%d" % [GameState.current_loop, active_crimes.size()]
	var cast := _cast_roles(template)
	var start_time := _rng.randf_range(template["time_window"][0], template["time_window"][1])
	var evidence := _generate_evidence(template, cast, crime_id)

	var crime := {
		"id": crime_id,
		"template": template["id"],
		"type": template["type"],
		"severity": template["severity"],
		"cast": cast,
		"start_time": start_time,
		"current_stage": Enums.CrimeStage.SETUP,
		"stages": template["stages"].duplicate(true),
		"evidence": evidence,
		"location": template["location"],
		"resolved": false,
		"outcome": "",
		"intervened": false,
		"conspiracy_connected": template.get("conspiracy_connected", false)
	}

	# Inject schedule overrides for involved NPCs
	for role in cast:
		EventBus.npc_state_changed.emit(cast[role], -1, Enums.NPCState.IDLE)

	return crime


func _cast_roles(template: Dictionary) -> Dictionary:
	var cast := {}
	var used_npcs: Array[String] = []
	var all_npcs := [
		Constants.NPC_FRANK, Constants.NPC_MARIA, Constants.NPC_HALE,
		Constants.NPC_IRIS, Constants.NPC_VICTOR, Constants.NPC_PENNY,
		Constants.NPC_ELEANOR, Constants.NPC_NINA, Constants.NPC_MAYOR,
		Constants.NPC_TOMMY
	]

	for role_def in template.get("required_roles", []):
		var role_type: int = role_def["role"]
		var preferred: Array = role_def.get("preferred_npcs", [])
		var chosen := ""

		# Try preferred NPCs first
		for npc_id in preferred:
			if npc_id not in used_npcs:
				chosen = npc_id
				break

		# Fallback to random eligible NPC
		if chosen.is_empty():
			var shuffled := all_npcs.duplicate()
			shuffled.shuffle()
			for npc_id in shuffled:
				if npc_id not in used_npcs:
					chosen = npc_id
					break

		if not chosen.is_empty():
			cast[role_type] = chosen
			used_npcs.append(chosen)

	return cast


func _generate_evidence(template: Dictionary, cast: Dictionary, crime_id: String) -> Array[Dictionary]:
	var evidence: Array[Dictionary] = []
	for ev_tmpl in template.get("evidence_templates", []):
		evidence.append({
			"id": "%s_ev_%d" % [crime_id, evidence.size()],
			"type": ev_tmpl["type"],
			"description": ev_tmpl["description"],
			"location": ev_tmpl.get("location", template["location"]),
			"links_to": cast.get(ev_tmpl.get("links_to_role", -1), ""),
			"spawned": false,
			"discovered": false
		})
	return evidence


func _advance_crime(crime: Dictionary, current_time: float) -> void:
	var stage_idx: int = crime["current_stage"]
	if stage_idx >= crime["stages"].size():
		return

	var stage: Dictionary = crime["stages"][stage_idx]
	var stage_time: float = crime["start_time"] + stage.get("time_offset", 0.0)

	if current_time >= stage_time:
		# Execute this stage
		_execute_stage(crime, stage)
		crime["current_stage"] = stage_idx + 1

		EventBus.crime_stage_advanced.emit(crime["id"], stage_idx)

		# Spawn evidence if this stage generates it
		if stage.get("spawns_evidence", false):
			_spawn_crime_evidence(crime)

		# Check if crime is complete
		if crime["current_stage"] >= crime["stages"].size():
			crime["resolved"] = true
			crime["outcome"] = "completed"
			EventBus.crime_completed.emit(crime["id"], "completed")


func _execute_stage(crime: Dictionary, stage: Dictionary) -> void:
	# Emit crime start on first stage
	if crime["current_stage"] == Enums.CrimeStage.SETUP:
		EventBus.crime_started.emit(crime["id"], crime["type"])

	# Move involved NPCs to crime location
	var cast: Dictionary = crime["cast"]
	for role in cast:
		var npc_id: String = cast[role]
		if stage.get("involves_role", -1) == -1 or stage.get("involves_role") == role:
			EventBus.npc_arrived_at_location.emit(npc_id, crime["location"])


func _spawn_crime_evidence(crime: Dictionary) -> void:
	for ev in crime["evidence"]:
		if not ev["spawned"]:
			ev["spawned"] = true
			EventBus.evidence_spawned.emit(ev["id"], ev["location"])


func _on_crime_intervened(crime_id: String, intervention_type: int) -> void:
	for crime in active_crimes:
		if crime["id"] == crime_id and not crime["resolved"]:
			crime["intervened"] = true
			crime["resolved"] = true
			crime["outcome"] = "intervened"

			# Record in game state
			GameState.intervention_history.append({
				"loop": GameState.current_loop,
				"crime_id": crime_id,
				"type": intervention_type,
				"outcome": "intervened"
			})

			EventBus.crime_completed.emit(crime_id, "intervened")

			# Advance conspiracy if this was connected
			if crime["conspiracy_connected"]:
				GameState.advance_conspiracy(3)

			print("[CrimeEngine] Crime %s intervened via %d" % [crime_id, intervention_type])
			break


func get_active_crime_at_location(location_id: int) -> Dictionary:
	for crime in active_crimes:
		if crime["location"] == location_id and not crime["resolved"]:
			return crime
	return {}


func get_evidence_at_location(location_id: int) -> Array[Dictionary]:
	var result: Array[Dictionary] = []
	for crime in active_crimes:
		for ev in crime["evidence"]:
			if ev["location"] == location_id and ev["spawned"] and not ev["discovered"]:
				result.append(ev)
	return result


func mark_evidence_discovered(evidence_id: String) -> void:
	for crime in active_crimes:
		for ev in crime["evidence"]:
			if ev["id"] == evidence_id:
				ev["discovered"] = true
				# Create a clue from this evidence
				GameState.add_clue(evidence_id, {
					"id": evidence_id,
					"title": ev["description"],
					"description": ev["description"],
					"category": Enums.ClueCategory.PHYSICAL_EVIDENCE,
					"importance": 2,
					"related_npcs": [ev["links_to"]] if not ev["links_to"].is_empty() else [],
					"location": ev["location"]
				})
				return


func _init_crime_templates() -> void:
	# Tier 1 - Early crimes
	crime_templates.append({
		"id": "pickpocketing",
		"type": Enums.CrimeType.PICKPOCKETING,
		"tier": Enums.CrimeTier.EARLY,
		"severity": 1,
		"conspiracy_connected": false,
		"location": Enums.LocationID.STREET_MARKET,
		"time_window": [120.0, 300.0],
		"required_roles": [
			{"role": Enums.CrimeRole.PERPETRATOR, "preferred_npcs": [Constants.NPC_PENNY]},
			{"role": Enums.CrimeRole.VICTIM, "preferred_npcs": [Constants.NPC_IRIS, Constants.NPC_MARIA]}
		],
		"stages": [
			{"time_offset": 0.0, "action": "approach", "involves_role": Enums.CrimeRole.PERPETRATOR},
			{"time_offset": 30.0, "action": "execute", "involves_role": Enums.CrimeRole.PERPETRATOR, "spawns_evidence": false},
			{"time_offset": 45.0, "action": "escape", "involves_role": Enums.CrimeRole.PERPETRATOR, "spawns_evidence": true}
		],
		"evidence_templates": [
			{"type": "dropped_item", "description": "A dropped wallet near the market stalls", "links_to_role": Enums.CrimeRole.VICTIM},
			{"type": "witness_account", "description": "A vendor saw someone bumping into the victim", "links_to_role": Enums.CrimeRole.PERPETRATOR}
		]
	})

	crime_templates.append({
		"id": "bar_break_in",
		"type": Enums.CrimeType.BAR_BREAK_IN,
		"tier": Enums.CrimeTier.EARLY,
		"severity": 2,
		"conspiracy_connected": false,
		"location": Enums.LocationID.BAR_CROSSROADS,
		"time_window": [60.0, 180.0],
		"required_roles": [
			{"role": Enums.CrimeRole.PERPETRATOR, "preferred_npcs": [Constants.NPC_TOMMY]},
			{"role": Enums.CrimeRole.WITNESS, "preferred_npcs": [Constants.NPC_FRANK]}
		],
		"stages": [
			{"time_offset": 0.0, "action": "approach", "involves_role": Enums.CrimeRole.PERPETRATOR},
			{"time_offset": 20.0, "action": "break_in", "involves_role": Enums.CrimeRole.PERPETRATOR, "spawns_evidence": true},
			{"time_offset": 60.0, "action": "escape", "involves_role": Enums.CrimeRole.PERPETRATOR}
		],
		"evidence_templates": [
			{"type": "broken_lock", "description": "The back door lock has been forced open", "links_to_role": Enums.CrimeRole.PERPETRATOR},
			{"type": "footprints", "description": "Muddy footprints leading from the alley", "links_to_role": Enums.CrimeRole.PERPETRATOR}
		]
	})

	crime_templates.append({
		"id": "park_mugging",
		"type": Enums.CrimeType.PARK_MUGGING,
		"tier": Enums.CrimeTier.EARLY,
		"severity": 2,
		"conspiracy_connected": false,
		"location": Enums.LocationID.RIVERSIDE_PARK,
		"time_window": [350.0, 480.0],
		"required_roles": [
			{"role": Enums.CrimeRole.PERPETRATOR, "preferred_npcs": []},
			{"role": Enums.CrimeRole.VICTIM, "preferred_npcs": [Constants.NPC_TOMMY, Constants.NPC_IRIS]}
		],
		"stages": [
			{"time_offset": 0.0, "action": "stalk", "involves_role": Enums.CrimeRole.PERPETRATOR},
			{"time_offset": 40.0, "action": "confront", "spawns_evidence": false},
			{"time_offset": 55.0, "action": "rob", "spawns_evidence": true},
			{"time_offset": 70.0, "action": "flee", "involves_role": Enums.CrimeRole.PERPETRATOR}
		],
		"evidence_templates": [
			{"type": "torn_fabric", "description": "A piece of torn fabric caught on a park bench", "links_to_role": Enums.CrimeRole.PERPETRATOR},
			{"type": "victim_testimony", "description": "The victim remembers a distinctive voice", "links_to_role": Enums.CrimeRole.PERPETRATOR}
		]
	})

	# Tier 2 - Mid crimes
	crime_templates.append({
		"id": "docks_murder",
		"type": Enums.CrimeType.DOCKS_MURDER,
		"tier": Enums.CrimeTier.MID,
		"severity": 5,
		"conspiracy_connected": true,
		"location": Enums.LocationID.DOCKS,
		"time_window": [400.0, 520.0],
		"required_roles": [
			{"role": Enums.CrimeRole.PERPETRATOR, "preferred_npcs": [Constants.NPC_VICTOR, Constants.NPC_HALE]},
			{"role": Enums.CrimeRole.VICTIM, "preferred_npcs": [Constants.NPC_TOMMY]},
			{"role": Enums.CrimeRole.WITNESS, "preferred_npcs": [Constants.NPC_PENNY]}
		],
		"stages": [
			{"time_offset": 0.0, "action": "lure_victim", "involves_role": Enums.CrimeRole.VICTIM},
			{"time_offset": 30.0, "action": "confront", "spawns_evidence": false},
			{"time_offset": 50.0, "action": "murder", "spawns_evidence": true},
			{"time_offset": 80.0, "action": "dispose", "involves_role": Enums.CrimeRole.PERPETRATOR, "spawns_evidence": true}
		],
		"evidence_templates": [
			{"type": "blood_stain", "description": "Blood stains on the dock planks", "links_to_role": Enums.CrimeRole.VICTIM},
			{"type": "murder_weapon", "description": "A weighted pipe hidden under the dock", "links_to_role": Enums.CrimeRole.PERPETRATOR},
			{"type": "document", "description": "A crumpled delivery manifest with Victor's signature", "links_to_role": Enums.CrimeRole.PERPETRATOR, "location": Enums.LocationID.DOCKS}
		]
	})

	crime_templates.append({
		"id": "blackmail",
		"type": Enums.CrimeType.BLACKMAIL,
		"tier": Enums.CrimeTier.MID,
		"severity": 3,
		"conspiracy_connected": true,
		"location": Enums.LocationID.BACK_ALLEY,
		"time_window": [200.0, 350.0],
		"required_roles": [
			{"role": Enums.CrimeRole.PERPETRATOR, "preferred_npcs": [Constants.NPC_VICTOR, Constants.NPC_HALE]},
			{"role": Enums.CrimeRole.VICTIM, "preferred_npcs": [Constants.NPC_FRANK, Constants.NPC_ELEANOR]}
		],
		"stages": [
			{"time_offset": 0.0, "action": "arrange_meeting", "involves_role": Enums.CrimeRole.PERPETRATOR},
			{"time_offset": 30.0, "action": "deliver_threat", "spawns_evidence": true},
			{"time_offset": 60.0, "action": "depart"}
		],
		"evidence_templates": [
			{"type": "threatening_note", "description": "A crumpled threatening note with typed text", "links_to_role": Enums.CrimeRole.PERPETRATOR},
			{"type": "envelope", "description": "An envelope with a partial fingerprint", "links_to_role": Enums.CrimeRole.PERPETRATOR}
		]
	})

	crime_templates.append({
		"id": "market_arson",
		"type": Enums.CrimeType.MARKET_ARSON,
		"tier": Enums.CrimeTier.MID,
		"severity": 4,
		"conspiracy_connected": true,
		"location": Enums.LocationID.STREET_MARKET,
		"time_window": [300.0, 420.0],
		"required_roles": [
			{"role": Enums.CrimeRole.PERPETRATOR, "preferred_npcs": [Constants.NPC_FRANK]},
			{"role": Enums.CrimeRole.WITNESS, "preferred_npcs": [Constants.NPC_PENNY, Constants.NPC_MARIA]}
		],
		"stages": [
			{"time_offset": 0.0, "action": "plant_accelerant", "involves_role": Enums.CrimeRole.PERPETRATOR, "spawns_evidence": true},
			{"time_offset": 45.0, "action": "ignite", "spawns_evidence": true},
			{"time_offset": 60.0, "action": "flee", "involves_role": Enums.CrimeRole.PERPETRATOR}
		],
		"evidence_templates": [
			{"type": "accelerant_can", "description": "An empty kerosene can behind a stall", "links_to_role": Enums.CrimeRole.PERPETRATOR},
			{"type": "burn_pattern", "description": "The burn pattern suggests deliberate ignition", "links_to_role": Enums.CrimeRole.PERPETRATOR}
		]
	})

	crime_templates.append({
		"id": "evidence_tampering",
		"type": Enums.CrimeType.EVIDENCE_TAMPERING,
		"tier": Enums.CrimeTier.MID,
		"severity": 3,
		"conspiracy_connected": true,
		"location": Enums.LocationID.POLICE_STATION,
		"time_window": [250.0, 400.0],
		"required_roles": [
			{"role": Enums.CrimeRole.PERPETRATOR, "preferred_npcs": [Constants.NPC_HALE]},
			{"role": Enums.CrimeRole.ACCOMPLICE, "preferred_npcs": [Constants.NPC_ELEANOR]}
		],
		"stages": [
			{"time_offset": 0.0, "action": "access_evidence_room", "involves_role": Enums.CrimeRole.PERPETRATOR},
			{"time_offset": 20.0, "action": "swap_evidence", "spawns_evidence": true},
			{"time_offset": 40.0, "action": "falsify_report", "involves_role": Enums.CrimeRole.ACCOMPLICE, "spawns_evidence": true}
		],
		"evidence_templates": [
			{"type": "security_log", "description": "Evidence room access log shows unusual entry", "links_to_role": Enums.CrimeRole.PERPETRATOR},
			{"type": "original_report", "description": "A discarded original autopsy report in the trash", "links_to_role": Enums.CrimeRole.ACCOMPLICE}
		]
	})

	# Tier 3 - Late crimes
	crime_templates.append({
		"id": "journalist_kidnapping",
		"type": Enums.CrimeType.JOURNALIST_KIDNAPPING,
		"tier": Enums.CrimeTier.LATE,
		"severity": 5,
		"conspiracy_connected": true,
		"location": Enums.LocationID.BACK_ALLEY,
		"time_window": [350.0, 480.0],
		"required_roles": [
			{"role": Enums.CrimeRole.PERPETRATOR, "preferred_npcs": [Constants.NPC_VICTOR]},
			{"role": Enums.CrimeRole.VICTIM, "preferred_npcs": [Constants.NPC_IRIS]},
			{"role": Enums.CrimeRole.ACCOMPLICE, "preferred_npcs": [Constants.NPC_HALE]}
		],
		"stages": [
			{"time_offset": 0.0, "action": "set_trap", "involves_role": Enums.CrimeRole.PERPETRATOR},
			{"time_offset": 30.0, "action": "lure_journalist", "involves_role": Enums.CrimeRole.VICTIM},
			{"time_offset": 50.0, "action": "grab", "spawns_evidence": true},
			{"time_offset": 70.0, "action": "transport", "involves_role": Enums.CrimeRole.ACCOMPLICE}
		],
		"evidence_templates": [
			{"type": "press_badge", "description": "Iris's press badge found on the ground", "links_to_role": Enums.CrimeRole.VICTIM},
			{"type": "van_tracks", "description": "Tire tracks from a van in the alley mud", "links_to_role": Enums.CrimeRole.PERPETRATOR},
			{"type": "phone", "description": "Iris's phone with a half-typed message", "links_to_role": Enums.CrimeRole.VICTIM}
		]
	})

	crime_templates.append({
		"id": "secret_meeting",
		"type": Enums.CrimeType.SECRET_MEETING,
		"tier": Enums.CrimeTier.LATE,
		"severity": 3,
		"conspiracy_connected": true,
		"location": Enums.LocationID.CITY_HALL,
		"time_window": [450.0, 550.0],
		"required_roles": [
			{"role": Enums.CrimeRole.PERPETRATOR, "preferred_npcs": [Constants.NPC_MAYOR]},
			{"role": Enums.CrimeRole.ACCOMPLICE, "preferred_npcs": [Constants.NPC_VICTOR, Constants.NPC_HALE]}
		],
		"stages": [
			{"time_offset": 0.0, "action": "arrive_separately"},
			{"time_offset": 20.0, "action": "discuss_plans", "spawns_evidence": true},
			{"time_offset": 60.0, "action": "depart_separately"}
		],
		"evidence_templates": [
			{"type": "document", "description": "Meeting notes about 'Project Reset' left behind", "links_to_role": Enums.CrimeRole.PERPETRATOR},
			{"type": "financial_record", "description": "Bank transfer receipts on the desk", "links_to_role": Enums.CrimeRole.ACCOMPLICE}
		]
	})

	# Tier 4 - Endgame
	crime_templates.append({
		"id": "loop_device_destruction",
		"type": Enums.CrimeType.LOOP_DEVICE_DESTRUCTION,
		"tier": Enums.CrimeTier.ENDGAME,
		"severity": 5,
		"conspiracy_connected": true,
		"location": Enums.LocationID.CITY_HALL,
		"time_window": [500.0, 580.0],
		"required_roles": [
			{"role": Enums.CrimeRole.PERPETRATOR, "preferred_npcs": [Constants.NPC_MAYOR]},
			{"role": Enums.CrimeRole.ACCOMPLICE, "preferred_npcs": [Constants.NPC_HALE]}
		],
		"stages": [
			{"time_offset": 0.0, "action": "access_basement", "involves_role": Enums.CrimeRole.PERPETRATOR},
			{"time_offset": 20.0, "action": "activate_device", "spawns_evidence": true},
			{"time_offset": 40.0, "action": "guard_entrance", "involves_role": Enums.CrimeRole.ACCOMPLICE}
		],
		"evidence_templates": [
			{"type": "basement_key", "description": "A special key card for the basement level", "links_to_role": Enums.CrimeRole.PERPETRATOR},
			{"type": "blueprints", "description": "Blueprints of the loop device", "links_to_role": Enums.CrimeRole.PERPETRATOR}
		]
	})
