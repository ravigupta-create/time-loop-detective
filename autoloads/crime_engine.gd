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
	if not conspiracy_crime.is_empty():
		var inst := _instantiate_crime(conspiracy_crime)
		if not inst.is_empty():
			active_crimes.append(inst)
			count -= 1
		available.erase(conspiracy_crime)

	# Fill remaining with side crimes
	available.shuffle()
	for i in mini(count, available.size()):
		var inst := _instantiate_crime(available[i])
		if not inst.is_empty():
			active_crimes.append(inst)

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

	# Validate all required roles were filled
	for role_def in template.get("required_roles", []):
		var role_type: int = role_def["role"]
		if role_type not in cast:
			print("[CrimeEngine] Cannot fill role %d for %s, skipping crime" % [role_type, template["id"]])
			return {}

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
		if cast[role] is String and not cast[role].is_empty():
			EventBus.npc_state_changed.emit(cast[role], -1, Enums.NPCState.IDLE)

	_apply_variation(crime)

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


func _apply_variation(crime: Dictionary) -> void:
	# Slightly modify crime timing each loop so the perpetrator isn't always
	# in the same place at the same second.
	crime["start_time"] += _rng.randf_range(-30.0, 30.0)
	crime["start_time"] = clampf(crime["start_time"], 60.0, 550.0)

	# If the player warned the victim in a previous loop, the perpetrator
	# adapts by shifting their timing forward by 60 seconds.
	var victim_id: String = crime["cast"].get(Enums.CrimeRole.VICTIM, "")
	if not victim_id.is_empty():
		for intervention in GameState.intervention_history:
			if intervention.get("type") == Enums.InterventionType.WARN_NPC:
				crime["start_time"] = clampf(crime["start_time"] + 60.0, 60.0, 550.0)
				break


func _on_crime_intervened(crime_id: String, intervention_type: int) -> void:
	for crime in active_crimes:
		if crime["id"] != crime_id or crime["resolved"]:
			continue

		crime["intervened"] = true
		var outcome_string := "intervened"

		match intervention_type:
			Enums.InterventionType.WARN_NPC:
				# Only prevents the crime if the warning reaches the victim before it begins
				var victim_id: String = crime["cast"].get(Enums.CrimeRole.VICTIM, "")
				if crime["current_stage"] == Enums.CrimeStage.SETUP:
					crime["resolved"] = true
					outcome_string = "warn_npc_success"
					# Victim avoids the crime location for this loop
					if not victim_id.is_empty():
						EventBus.npc_state_changed.emit(victim_id, -1, Enums.NPCState.FLEEING)
					print("[CrimeEngine] Crime %s prevented: victim warned before crime began" % crime_id)
				else:
					outcome_string = "warn_npc_too_late"
					print("[CrimeEngine] Crime %s warn failed: crime already in progress" % crime_id)

			Enums.InterventionType.BLOCK_PATH:
				# Delay the crime; smaller delay if already past SETUP
				var delay := 60.0
				if crime["current_stage"] > Enums.CrimeStage.SETUP:
					delay = 30.0
				crime["start_time"] += delay
				outcome_string = "block_path_delayed_%ds" % int(delay)
				print("[CrimeEngine] Crime %s delayed by %.0fs via path block" % [crime_id, delay])

			Enums.InterventionType.STEAL_WEAPON:
				# Reduce severity, non-lethal outcome
				crime["severity"] = maxi(crime["severity"] - 2, 1)
				crime["resolved"] = true
				outcome_string = "steal_weapon_nonlethal"
				print("[CrimeEngine] Crime %s: weapon removed, severity reduced to %d" % [crime_id, crime["severity"]])

			Enums.InterventionType.CALL_POLICE:
				# Outcome depends on whether Hale is honest or corrupt
				var hale_corrupt: bool = GameState.conspiracy_progress >= 50 or \
					Enums.PersonalityTrait.DECEITFUL in NPCDatabase.get_npc_data(Constants.NPC_HALE).get("personality_traits", [])
				if hale_corrupt:
					# Hale tips off the conspirators — perpetrator gets advance warning
					var perp_id: String = crime["cast"].get(Enums.CrimeRole.PERPETRATOR, "")
					if not perp_id.is_empty():
						EventBus.npc_state_changed.emit(perp_id, -1, Enums.NPCState.FLEEING)
					crime["start_time"] = clampf(crime["start_time"] - 30.0, 60.0, 550.0)
					outcome_string = "call_police_tipped_off"
					print("[CrimeEngine] Crime %s: Hale corrupt — conspirators warned" % crime_id)
				else:
					crime["resolved"] = true
					outcome_string = "call_police_stopped"
					print("[CrimeEngine] Crime %s stopped by honest police response" % crime_id)

			Enums.InterventionType.CONFRONT:
				# Requires 3+ clues about perpetrator; result depends on personality
				var perp_id: String = crime["cast"].get(Enums.CrimeRole.PERPETRATOR, "")
				var perp_clue_count := 0
				for clue_id in GameState.discovered_clues:
					var clue: Dictionary = GameState.discovered_clues[clue_id]
					if perp_id in clue.get("related_npcs", []):
						perp_clue_count += 1
				if perp_clue_count >= 3:
					var perp_data := NPCDatabase.get_npc_data(perp_id)
					var traits: Array = perp_data.get("personality_traits", [])
					if Enums.PersonalityTrait.COWARDLY in traits:
						crime["resolved"] = true
						outcome_string = "confront_perp_fled"
						if not perp_id.is_empty():
							EventBus.npc_state_changed.emit(perp_id, -1, Enums.NPCState.FLEEING)
						print("[CrimeEngine] Crime %s: cowardly perpetrator fled confrontation" % crime_id)
					elif Enums.PersonalityTrait.AGGRESSIVE in traits:
						outcome_string = "confront_perp_fought_back"
						print("[CrimeEngine] Crime %s: aggressive perpetrator fought back" % crime_id)
					else:
						crime["resolved"] = true
						outcome_string = "confront_perp_backed_down"
						print("[CrimeEngine] Crime %s: perpetrator backed down" % crime_id)
				else:
					outcome_string = "confront_insufficient_clues"
					print("[CrimeEngine] Crime %s: confrontation failed, only %d clues about perpetrator" % [crime_id, perp_clue_count])

			Enums.InterventionType.SHOW_EVIDENCE:
				# Confession chance depends on perpetrator personality
				var perp_id: String = crime["cast"].get(Enums.CrimeRole.PERPETRATOR, "")
				var perp_data := NPCDatabase.get_npc_data(perp_id)
				var traits: Array = perp_data.get("personality_traits", [])
				# Check whether the player has evidence that links to this crime's perpetrator
				var has_correct_evidence := false
				for ev in crime["evidence"]:
					if ev["discovered"] and ev["links_to"] == perp_id:
						has_correct_evidence = true
						break
				if has_correct_evidence:
					if Enums.PersonalityTrait.HONEST in traits:
						crime["resolved"] = true
						outcome_string = "show_evidence_confession"
						print("[CrimeEngine] Crime %s: honest perpetrator confessed" % crime_id)
					elif Enums.PersonalityTrait.COWARDLY in traits:
						crime["resolved"] = true
						outcome_string = "show_evidence_coward_confessed"
						print("[CrimeEngine] Crime %s: cowardly perpetrator broke under evidence" % crime_id)
					else:
						outcome_string = "show_evidence_denied"
						print("[CrimeEngine] Crime %s: perpetrator denied despite evidence" % crime_id)
				else:
					outcome_string = "show_evidence_wrong_evidence"
					print("[CrimeEngine] Crime %s: player showed incorrect or undiscovered evidence" % crime_id)

			Enums.InterventionType.DISTRACT:
				# Delays the crime by 30 seconds
				crime["start_time"] = clampf(crime["start_time"] + 30.0, 60.0, 550.0)
				outcome_string = "distract_delayed_30s"
				print("[CrimeEngine] Crime %s delayed by 30s via distraction" % crime_id)

			Enums.InterventionType.HIDE_VICTIM:
				# Victim removed from scene — crime cannot proceed
				var victim_id: String = crime["cast"].get(Enums.CrimeRole.VICTIM, "")
				crime["resolved"] = true
				outcome_string = "hide_victim_crime_failed"
				if not victim_id.is_empty():
					EventBus.npc_state_changed.emit(victim_id, -1, Enums.NPCState.IDLE)
				print("[CrimeEngine] Crime %s failed completely: victim hidden" % crime_id)

		# Record outcome in intervention history
		GameState.intervention_history.append({
			"loop": GameState.current_loop,
			"crime_id": crime_id,
			"type": intervention_type,
			"outcome": outcome_string
		})

		if crime["resolved"]:
			EventBus.crime_completed.emit(crime_id, outcome_string)
			# Advance conspiracy if this was a connected crime that the player stopped
			if crime["conspiracy_connected"]:
				GameState.advance_conspiracy(3)

		print("[CrimeEngine] Crime %s intervention type %d -> outcome: %s" % [crime_id, intervention_type, outcome_string])
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

	# --- NEW TIER 1 TEMPLATES ---

	crime_templates.append({
		"id": "hotel_theft",
		"type": Enums.CrimeType.HOTEL_THEFT,
		"tier": Enums.CrimeTier.EARLY,
		"severity": 2,
		"conspiracy_connected": false,
		"location": Enums.LocationID.HOTEL_MARLOW,
		"time_window": [150.0, 300.0],
		"required_roles": [
			{"role": Enums.CrimeRole.PERPETRATOR, "preferred_npcs": [Constants.NPC_PENNY]},
			{"role": Enums.CrimeRole.VICTIM, "preferred_npcs": [Constants.NPC_NINA, Constants.NPC_IRIS]}
		],
		"stages": [
			{"time_offset": 0.0, "action": "case_room", "involves_role": Enums.CrimeRole.PERPETRATOR},
			{"time_offset": 30.0, "action": "steal", "involves_role": Enums.CrimeRole.PERPETRATOR, "spawns_evidence": true},
			{"time_offset": 50.0, "action": "escape", "involves_role": Enums.CrimeRole.PERPETRATOR}
		],
		"evidence_templates": [
			{"type": "missing_belongings", "description": "The victim's valuables are gone from the room", "links_to_role": Enums.CrimeRole.VICTIM},
			{"type": "forced_lock", "description": "The room lock has been tampered with", "links_to_role": Enums.CrimeRole.PERPETRATOR},
			{"type": "suspicious_guest_log", "description": "Hotel guest log shows an unauthorised entry", "links_to_role": Enums.CrimeRole.PERPETRATOR}
		]
	})

	crime_templates.append({
		"id": "cafe_poisoning",
		"type": Enums.CrimeType.CAFE_POISONING,
		"tier": Enums.CrimeTier.EARLY,
		"severity": 3,
		"conspiracy_connected": false,
		"location": Enums.LocationID.CAFE_ROSETTA,
		"time_window": [200.0, 350.0],
		"required_roles": [
			{"role": Enums.CrimeRole.PERPETRATOR, "preferred_npcs": [Constants.NPC_VICTOR, Constants.NPC_HALE]},
			{"role": Enums.CrimeRole.VICTIM, "preferred_npcs": [Constants.NPC_MARIA, Constants.NPC_IRIS]}
		],
		"stages": [
			{"time_offset": 0.0, "action": "prep_poison", "involves_role": Enums.CrimeRole.PERPETRATOR},
			{"time_offset": 25.0, "action": "contaminate", "involves_role": Enums.CrimeRole.PERPETRATOR, "spawns_evidence": true},
			{"time_offset": 50.0, "action": "observe", "involves_role": Enums.CrimeRole.PERPETRATOR},
			{"time_offset": 70.0, "action": "aftermath", "spawns_evidence": true}
		],
		"evidence_templates": [
			{"type": "chemical_residue", "description": "A faint chemical smell lingers near the counter", "links_to_role": Enums.CrimeRole.PERPETRATOR},
			{"type": "tampered_cup", "description": "A cup with a discoloured residue inside", "links_to_role": Enums.CrimeRole.VICTIM},
			{"type": "pharmacy_receipt", "description": "A crumpled pharmacy receipt for an unusual compound", "links_to_role": Enums.CrimeRole.PERPETRATOR}
		]
	})

	crime_templates.append({
		"id": "delivery_interception",
		"type": Enums.CrimeType.DELIVERY_INTERCEPTION,
		"tier": Enums.CrimeTier.EARLY,
		"severity": 2,
		"conspiracy_connected": false,
		"location": Enums.LocationID.STREET_MARKET,
		"time_window": [100.0, 250.0],
		"required_roles": [
			{"role": Enums.CrimeRole.PERPETRATOR, "preferred_npcs": [Constants.NPC_VICTOR]},
			{"role": Enums.CrimeRole.VICTIM, "preferred_npcs": [Constants.NPC_TOMMY]},
			{"role": Enums.CrimeRole.WITNESS, "preferred_npcs": [Constants.NPC_PENNY]}
		],
		"stages": [
			{"time_offset": 0.0, "action": "ambush_setup", "involves_role": Enums.CrimeRole.PERPETRATOR},
			{"time_offset": 30.0, "action": "intercept", "spawns_evidence": true},
			{"time_offset": 50.0, "action": "swap_contents", "involves_role": Enums.CrimeRole.PERPETRATOR, "spawns_evidence": true},
			{"time_offset": 70.0, "action": "depart", "involves_role": Enums.CrimeRole.PERPETRATOR}
		],
		"evidence_templates": [
			{"type": "original_package", "description": "The original delivery package, now empty", "links_to_role": Enums.CrimeRole.VICTIM},
			{"type": "swap_receipt", "description": "A handwritten receipt for the intercepted goods", "links_to_role": Enums.CrimeRole.PERPETRATOR},
			{"type": "tire_tracks", "description": "Fresh tyre tracks near the market loading bay", "links_to_role": Enums.CrimeRole.PERPETRATOR}
		]
	})

	# --- NEW TIER 2 TEMPLATES ---

	crime_templates.append({
		"id": "document_forgery",
		"type": Enums.CrimeType.DOCUMENT_FORGERY,
		"tier": Enums.CrimeTier.MID,
		"severity": 3,
		"conspiracy_connected": true,
		"location": Enums.LocationID.CITY_HALL,
		"time_window": [200.0, 400.0],
		"required_roles": [
			{"role": Enums.CrimeRole.PERPETRATOR, "preferred_npcs": [Constants.NPC_MAYOR]},
			{"role": Enums.CrimeRole.ACCOMPLICE, "preferred_npcs": [Constants.NPC_HALE]}
		],
		"stages": [
			{"time_offset": 0.0, "action": "access_records", "involves_role": Enums.CrimeRole.PERPETRATOR},
			{"time_offset": 30.0, "action": "forge_documents", "involves_role": Enums.CrimeRole.PERPETRATOR, "spawns_evidence": true},
			{"time_offset": 60.0, "action": "file_forgery", "involves_role": Enums.CrimeRole.ACCOMPLICE, "spawns_evidence": true}
		],
		"evidence_templates": [
			{"type": "ink_mismatch", "description": "The ink on official documents doesn't match the printer on file", "links_to_role": Enums.CrimeRole.PERPETRATOR},
			{"type": "original_document_fragment", "description": "A torn fragment of the genuine document in the wastepaper bin", "links_to_role": Enums.CrimeRole.ACCOMPLICE},
			{"type": "typewriter_ribbon", "description": "A used typewriter ribbon bearing the forged text", "links_to_role": Enums.CrimeRole.PERPETRATOR}
		]
	})

	crime_templates.append({
		"id": "witness_intimidation",
		"type": Enums.CrimeType.WITNESS_INTIMIDATION,
		"tier": Enums.CrimeTier.MID,
		"severity": 3,
		"conspiracy_connected": true,
		"location": Enums.LocationID.BACK_ALLEY,
		"time_window": [300.0, 450.0],
		"required_roles": [
			{"role": Enums.CrimeRole.PERPETRATOR, "preferred_npcs": [Constants.NPC_VICTOR, Constants.NPC_HALE]},
			{"role": Enums.CrimeRole.VICTIM, "preferred_npcs": [Constants.NPC_FRANK, Constants.NPC_PENNY, Constants.NPC_TOMMY]}
		],
		"stages": [
			{"time_offset": 0.0, "action": "corner_witness", "involves_role": Enums.CrimeRole.PERPETRATOR},
			{"time_offset": 20.0, "action": "threaten", "spawns_evidence": true},
			{"time_offset": 40.0, "action": "demand_silence"},
			{"time_offset": 60.0, "action": "depart", "involves_role": Enums.CrimeRole.PERPETRATOR}
		],
		"evidence_templates": [
			{"type": "threatening_message", "description": "A note with a thinly veiled threat left in the victim's pocket", "links_to_role": Enums.CrimeRole.PERPETRATOR},
			{"type": "bruise_marks", "description": "Fresh bruising consistent with a violent confrontation", "links_to_role": Enums.CrimeRole.VICTIM},
			{"type": "witness_testimony", "description": "A bystander overheard raised voices in the alley", "links_to_role": Enums.CrimeRole.PERPETRATOR}
		]
	})

	crime_templates.append({
		"id": "drug_smuggling",
		"type": Enums.CrimeType.DRUG_SMUGGLING,
		"tier": Enums.CrimeTier.MID,
		"severity": 4,
		"conspiracy_connected": true,
		"location": Enums.LocationID.DOCKS,
		"time_window": [250.0, 400.0],
		"required_roles": [
			{"role": Enums.CrimeRole.PERPETRATOR, "preferred_npcs": [Constants.NPC_VICTOR]},
			{"role": Enums.CrimeRole.ACCOMPLICE, "preferred_npcs": [Constants.NPC_TOMMY]},
			{"role": Enums.CrimeRole.WITNESS, "preferred_npcs": [Constants.NPC_NINA]}
		],
		"stages": [
			{"time_offset": 0.0, "action": "receive_shipment", "involves_role": Enums.CrimeRole.PERPETRATOR},
			{"time_offset": 30.0, "action": "unload", "involves_role": Enums.CrimeRole.ACCOMPLICE, "spawns_evidence": true},
			{"time_offset": 60.0, "action": "transport", "spawns_evidence": true},
			{"time_offset": 80.0, "action": "hide", "involves_role": Enums.CrimeRole.PERPETRATOR}
		],
		"evidence_templates": [
			{"type": "contraband_residue", "description": "White powder residue inside an unlabelled crate", "links_to_role": Enums.CrimeRole.PERPETRATOR},
			{"type": "shipping_manifest", "description": "A falsified shipping manifest concealing the true cargo", "links_to_role": Enums.CrimeRole.PERPETRATOR},
			{"type": "hidden_compartment", "description": "A false-bottomed storage unit on the dock", "links_to_role": Enums.CrimeRole.ACCOMPLICE}
		]
	})

	# --- NEW TIER 3 TEMPLATES ---

	crime_templates.append({
		"id": "forced_accomplice",
		"type": Enums.CrimeType.FORCED_ACCOMPLICE,
		"tier": Enums.CrimeTier.LATE,
		"severity": 4,
		"conspiracy_connected": true,
		"location": Enums.LocationID.BAR_CROSSROADS,
		"time_window": [380.0, 500.0],
		"required_roles": [
			{"role": Enums.CrimeRole.PERPETRATOR, "preferred_npcs": [Constants.NPC_VICTOR]},
			{"role": Enums.CrimeRole.VICTIM, "preferred_npcs": [Constants.NPC_FRANK]},
			{"role": Enums.CrimeRole.WITNESS, "preferred_npcs": [Constants.NPC_PENNY]}
		],
		"stages": [
			{"time_offset": 0.0, "action": "confront", "involves_role": Enums.CrimeRole.PERPETRATOR},
			{"time_offset": 25.0, "action": "coerce", "spawns_evidence": true},
			{"time_offset": 50.0, "action": "assign_task", "involves_role": Enums.CrimeRole.VICTIM},
			{"time_offset": 70.0, "action": "verify_compliance", "involves_role": Enums.CrimeRole.PERPETRATOR, "spawns_evidence": true}
		],
		"evidence_templates": [
			{"type": "coercion_recording", "description": "A muffled recording of threats being issued", "links_to_role": Enums.CrimeRole.PERPETRATOR},
			{"type": "debt_ledger", "description": "A ledger page listing debts used as leverage", "links_to_role": Enums.CrimeRole.PERPETRATOR},
			{"type": "burned_evidence_remains", "description": "Charred paper scraps -- something was destroyed in a hurry", "links_to_role": Enums.CrimeRole.VICTIM}
		]
	})

	crime_templates.append({
		"id": "assassination_attempt",
		"type": Enums.CrimeType.ASSASSINATION_ATTEMPT,
		"tier": Enums.CrimeTier.LATE,
		"severity": 5,
		"conspiracy_connected": true,
		"location": Enums.LocationID.RIVERSIDE_PARK,
		"time_window": [400.0, 530.0],
		"required_roles": [
			{"role": Enums.CrimeRole.PERPETRATOR, "preferred_npcs": [Constants.NPC_HALE]},
			{"role": Enums.CrimeRole.VICTIM, "preferred_npcs": [Constants.NPC_NINA, Constants.NPC_IRIS]},
			{"role": Enums.CrimeRole.ACCOMPLICE, "preferred_npcs": [Constants.NPC_VICTOR]}
		],
		"stages": [
			{"time_offset": 0.0, "action": "position", "involves_role": Enums.CrimeRole.PERPETRATOR},
			{"time_offset": 25.0, "action": "lure_target", "involves_role": Enums.CrimeRole.ACCOMPLICE},
			{"time_offset": 50.0, "action": "attempt", "spawns_evidence": true},
			{"time_offset": 70.0, "action": "flee", "involves_role": Enums.CrimeRole.PERPETRATOR, "spawns_evidence": true}
		],
		"evidence_templates": [
			{"type": "weapon_stash", "description": "A concealed weapon hidden beneath a park bench", "links_to_role": Enums.CrimeRole.PERPETRATOR},
			{"type": "communication_device", "description": "A burner phone with an encrypted message", "links_to_role": Enums.CrimeRole.ACCOMPLICE},
			{"type": "getaway_vehicle_keys", "description": "Keys to a vehicle parked at the park perimeter", "links_to_role": Enums.CrimeRole.PERPETRATOR}
		]
	})

	# --- NEW TIER 4 TEMPLATES ---

	crime_templates.append({
		"id": "final_confrontation",
		"type": Enums.CrimeType.FINAL_CONFRONTATION,
		"tier": Enums.CrimeTier.ENDGAME,
		"severity": 5,
		"conspiracy_connected": true,
		"location": Enums.LocationID.CITY_HALL,
		"time_window": [520.0, 580.0],
		"required_roles": [
			{"role": Enums.CrimeRole.PERPETRATOR, "preferred_npcs": [Constants.NPC_MAYOR]},
			{"role": Enums.CrimeRole.ACCOMPLICE, "preferred_npcs": [Constants.NPC_VICTOR]},
			{"role": Enums.CrimeRole.ACCOMPLICE, "preferred_npcs": [Constants.NPC_HALE]}
		],
		"stages": [
			{"time_offset": 0.0, "action": "gather_forces", "involves_role": Enums.CrimeRole.PERPETRATOR},
			{"time_offset": 20.0, "action": "confront_player", "spawns_evidence": true},
			{"time_offset": 40.0, "action": "reveal_device", "spawns_evidence": true}
		],
		"evidence_templates": [
			{"type": "master_plan_document", "description": "A detailed document outlining the full conspiracy", "links_to_role": Enums.CrimeRole.PERPETRATOR},
			{"type": "device_blueprints", "description": "Engineering schematics for the loop device", "links_to_role": Enums.CrimeRole.PERPETRATOR},
			{"type": "confession_recording", "description": "An audio recording of the mayor admitting his role", "links_to_role": Enums.CrimeRole.PERPETRATOR}
		]
	})

	crime_templates.append({
		"id": "loop_breaking",
		"type": Enums.CrimeType.LOOP_BREAKING,
		"tier": Enums.CrimeTier.ENDGAME,
		"severity": 5,
		"conspiracy_connected": true,
		"location": Enums.LocationID.CITY_HALL,
		"time_window": [540.0, 590.0],
		"required_roles": [
			{"role": Enums.CrimeRole.PERPETRATOR, "preferred_npcs": [Constants.NPC_MAYOR]},
			{"role": Enums.CrimeRole.VICTIM, "preferred_npcs": [Constants.NPC_NINA]}
		],
		"stages": [
			{"time_offset": 0.0, "action": "access_device", "involves_role": Enums.CrimeRole.PERPETRATOR},
			{"time_offset": 20.0, "action": "activate", "involves_role": Enums.CrimeRole.PERPETRATOR, "spawns_evidence": true},
			{"time_offset": 40.0, "action": "overload", "spawns_evidence": true}
		],
		"evidence_templates": [
			{"type": "activation_key", "description": "The unique key used to trigger the loop device", "links_to_role": Enums.CrimeRole.PERPETRATOR},
			{"type": "energy_readings", "description": "A printout showing catastrophic temporal energy spikes", "links_to_role": Enums.CrimeRole.PERPETRATOR},
			{"type": "timeline_fracture_data", "description": "Nina's device records an irreversible fracture event", "links_to_role": Enums.CrimeRole.VICTIM}
		]
	})
