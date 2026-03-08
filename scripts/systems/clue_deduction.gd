class_name ClueDeduction
## Static analysis engine that runs after each new clue to auto-generate deductions.
## Checks for alibi breaks, financial trails, motive chains, pattern detection,
## conspiracy webs, and timeline contradictions.


## Run all deduction checks against current game state.
## Returns array of auto-generated clue dicts (already added to GameState).
static func run_all_deductions() -> Array[Dictionary]:
	var new_deductions: Array[Dictionary] = []

	new_deductions.append_array(_check_alibi_breaks())
	new_deductions.append_array(_check_financial_trail())
	new_deductions.append_array(_check_motive_chain())
	new_deductions.append_array(_check_pattern_detection())
	new_deductions.append_array(_check_conspiracy_web())
	new_deductions.append_array(_check_timeline_contradictions())

	return new_deductions


## If NPC claims to be at location A at time T, but player observed them at location B.
static func _check_alibi_breaks() -> Array[Dictionary]:
	var results: Array[Dictionary] = []

	# Gather testimony clues with location claims
	var location_claims: Array[Dictionary] = []
	for clue_id in GameState.discovered_clues:
		var clue: Dictionary = GameState.discovered_clues[clue_id]
		if clue.get("category") == Enums.ClueCategory.TESTIMONY:
			if clue.has("claimed_location") and clue.has("claimed_time") and clue.has("source_npc"):
				location_claims.append(clue)

	# Check against timeline entries
	for claim in location_claims:
		var npc_id: String = claim["source_npc"]
		var claimed_loc: int = claim["claimed_location"]
		var claimed_time: float = claim["claimed_time"]

		for entry in GameState.timeline_entries:
			if entry["npc_id"] != npc_id:
				continue
			# Check if observed at different location within a 30s window
			if absf(entry["time"] - claimed_time) < 30.0 and entry["location"] != claimed_loc:
				var deduction_id := "alibi_break_%s_%d" % [npc_id, GameState.discovered_clues.size()]
				if deduction_id in GameState.discovered_clues:
					continue

				var npc_name := NPCDatabase.get_npc_name(npc_id)
				var loc_name: String = Constants.LOCATION_NAMES.get(claimed_loc, "unknown")
				var actual_loc: String = Constants.LOCATION_NAMES.get(entry["location"], "unknown")

				var deduction := {
					"id": deduction_id,
					"title": "Alibi Break: %s" % npc_name,
					"description": "%s claimed to be at %s, but was observed at %s around the same time." % [npc_name, loc_name, actual_loc],
					"category": Enums.ClueCategory.DEDUCTION,
					"importance": 4,
					"related_npcs": [npc_id],
					"deduction_type": "alibi_break"
				}
				GameState.add_clue(deduction_id, deduction)
				GameState.add_connection(claim["id"], deduction_id, Enums.ConnectionType.ALIBI_BREAK)

				# Track as detected lie
				if npc_id not in GameState.npc_lies_detected:
					GameState.npc_lies_detected[npc_id] = []
				if claim["id"] not in GameState.npc_lies_detected[npc_id]:
					GameState.npc_lies_detected[npc_id].append(claim["id"])

				results.append(deduction)

	return results


## Connecting 3+ financial evidence clues generates a "Money Trail" deduction.
static func _check_financial_trail() -> Array[Dictionary]:
	var results: Array[Dictionary] = []
	var financial_clues: Array[String] = []

	for clue_id in GameState.discovered_clues:
		var clue: Dictionary = GameState.discovered_clues[clue_id]
		var desc: String = clue.get("description", "").to_lower()
		var title: String = clue.get("title", "").to_lower()
		if "financial" in desc or "money" in desc or "bank" in desc or \
		   "receipt" in desc or "payment" in desc or "ledger" in desc or \
		   "financial" in title or "money" in title:
			financial_clues.append(clue_id)

	if financial_clues.size() >= 3:
		var deduction_id := "money_trail_%d" % GameState.discovered_clues.size()
		if deduction_id not in GameState.discovered_clues:
			var related_npcs: Array = []
			for fc_id in financial_clues:
				var fc: Dictionary = GameState.discovered_clues[fc_id]
				for npc in fc.get("related_npcs", []):
					if npc not in related_npcs:
						related_npcs.append(npc)

			var deduction := {
				"id": deduction_id,
				"title": "Money Trail Discovered",
				"description": "Multiple financial records point to a pattern of illicit payments flowing through the town.",
				"category": Enums.ClueCategory.DEDUCTION,
				"importance": 4,
				"related_npcs": related_npcs,
				"deduction_type": "financial_trail"
			}
			GameState.add_clue(deduction_id, deduction)

			# Connect financial clues
			for i in range(1, financial_clues.size()):
				GameState.add_connection(financial_clues[0], financial_clues[i], Enums.ConnectionType.FINANCIAL)

			results.append(deduction)

	return results


## Evidence of motive + opportunity + means = "Strong Suspect" deduction.
static func _check_motive_chain() -> Array[Dictionary]:
	var results: Array[Dictionary] = []

	# Gather clues by related NPC
	var npc_clues: Dictionary = {} # npc_id -> {motive: [], opportunity: [], means: []}
	for clue_id in GameState.discovered_clues:
		var clue: Dictionary = GameState.discovered_clues[clue_id]
		for npc_id in clue.get("related_npcs", []):
			if npc_id not in npc_clues:
				npc_clues[npc_id] = {"motive": [], "opportunity": [], "means": []}

			var desc: String = clue.get("description", "").to_lower()
			var title: String = clue.get("title", "").to_lower()
			if "motive" in desc or "grudge" in desc or "threatened" in desc or "debt" in desc:
				npc_clues[npc_id]["motive"].append(clue_id)
			if "seen at" in desc or "observed" in desc or "alibi" in desc or "location" in desc:
				npc_clues[npc_id]["opportunity"].append(clue_id)
			if "weapon" in desc or "tool" in desc or "key" in desc or "means" in title:
				npc_clues[npc_id]["means"].append(clue_id)

	for npc_id in npc_clues:
		var data: Dictionary = npc_clues[npc_id]
		if not data["motive"].is_empty() and not data["opportunity"].is_empty() and not data["means"].is_empty():
			var deduction_id := "strong_suspect_%s" % npc_id
			if deduction_id in GameState.discovered_clues:
				continue

			var npc_name := NPCDatabase.get_npc_name(npc_id)
			var deduction := {
				"id": deduction_id,
				"title": "Strong Suspect: %s" % npc_name,
				"description": "Evidence shows %s had motive, opportunity, and means. A strong suspect." % npc_name,
				"category": Enums.ClueCategory.DEDUCTION,
				"importance": 5,
				"related_npcs": [npc_id],
				"deduction_type": "motive_chain"
			}
			GameState.add_clue(deduction_id, deduction)
			results.append(deduction)

	return results


## If same NPC appears in 3+ crime evidence -> "Serial Involvement" clue.
static func _check_pattern_detection() -> Array[Dictionary]:
	var results: Array[Dictionary] = []

	var npc_crime_count: Dictionary = {} # npc_id -> count of crime-related clues
	for clue_id in GameState.discovered_clues:
		var clue: Dictionary = GameState.discovered_clues[clue_id]
		if clue.get("category") == Enums.ClueCategory.PHYSICAL_EVIDENCE:
			for npc_id in clue.get("related_npcs", []):
				npc_crime_count[npc_id] = npc_crime_count.get(npc_id, 0) + 1

	for npc_id in npc_crime_count:
		if npc_crime_count[npc_id] >= 3:
			var deduction_id := "serial_involvement_%s" % npc_id
			if deduction_id in GameState.discovered_clues:
				continue

			var npc_name := NPCDatabase.get_npc_name(npc_id)
			var deduction := {
				"id": deduction_id,
				"title": "Serial Involvement: %s" % npc_name,
				"description": "%s keeps appearing in evidence from multiple crime scenes. This can't be coincidence." % npc_name,
				"category": Enums.ClueCategory.DEDUCTION,
				"importance": 4,
				"related_npcs": [npc_id],
				"deduction_type": "pattern"
			}
			GameState.add_clue(deduction_id, deduction)
			results.append(deduction)

	return results


## Connecting 5+ conspiracy-related clues generates "Organization Structure" deduction.
static func _check_conspiracy_web() -> Array[Dictionary]:
	var results: Array[Dictionary] = []

	var conspiracy_clues: Array[String] = []
	for clue_id in GameState.discovered_clues:
		var clue: Dictionary = GameState.discovered_clues[clue_id]
		var desc: String = clue.get("description", "").to_lower()
		var title: String = clue.get("title", "").to_lower()
		if "conspiracy" in desc or "organization" in desc or "secret meeting" in desc or \
		   "cover-up" in desc or "conspiracy" in title or "conspiratorial" in desc:
			conspiracy_clues.append(clue_id)

	# Also count conspiracy connections
	var conspiracy_connections := 0
	for conn in GameState.clue_connections:
		if conn["type"] == Enums.ConnectionType.CONSPIRACY:
			conspiracy_connections += 1

	if conspiracy_clues.size() + conspiracy_connections >= 5:
		var deduction_id := "organization_structure"
		if deduction_id not in GameState.discovered_clues:
			var all_related: Array = []
			for cc_id in conspiracy_clues:
				var cc: Dictionary = GameState.discovered_clues[cc_id]
				for npc in cc.get("related_npcs", []):
					if npc not in all_related:
						all_related.append(npc)

			var deduction := {
				"id": deduction_id,
				"title": "Organization Structure Revealed",
				"description": "The conspiracy has a clear hierarchy. Someone at the top is pulling all the strings.",
				"category": Enums.ClueCategory.DEDUCTION,
				"importance": 5,
				"related_npcs": all_related,
				"deduction_type": "conspiracy_web"
			}
			GameState.add_clue(deduction_id, deduction)
			GameState.advance_conspiracy(10)
			results.append(deduction)

	return results


## If NPC's claimed timeline is impossible based on location distances.
static func _check_timeline_contradictions() -> Array[Dictionary]:
	var results: Array[Dictionary] = []

	# Check for NPCs observed at two distant locations within a very short time
	var npc_observations: Dictionary = {} # npc_id -> [{time, location}]
	for entry in GameState.timeline_entries:
		var npc_id: String = entry["npc_id"]
		if npc_id not in npc_observations:
			npc_observations[npc_id] = []
		npc_observations[npc_id].append({"time": entry["time"], "location": entry["location"], "loop": entry["loop"]})

	for npc_id in npc_observations:
		var obs: Array = npc_observations[npc_id]
		for i in obs.size():
			for j in range(i + 1, obs.size()):
				# Only compare within same loop
				if obs[i]["loop"] != obs[j]["loop"]:
					continue
				var time_diff := absf(obs[i]["time"] - obs[j]["time"])
				var loc_a: int = obs[i]["location"]
				var loc_b: int = obs[j]["location"]

				# If at different locations within 5 seconds, that's suspicious
				if loc_a != loc_b and time_diff < 5.0:
					var deduction_id := "timeline_impossible_%s_%d" % [npc_id, GameState.discovered_clues.size()]
					if deduction_id in GameState.discovered_clues:
						continue

					var npc_name := NPCDatabase.get_npc_name(npc_id)
					var loc_a_name: String = Constants.LOCATION_NAMES.get(loc_a, "unknown")
					var loc_b_name: String = Constants.LOCATION_NAMES.get(loc_b, "unknown")

					var deduction := {
						"id": deduction_id,
						"title": "Impossible Timeline: %s" % npc_name,
						"description": "%s was seen at both %s and %s within seconds. Something doesn't add up." % [npc_name, loc_a_name, loc_b_name],
						"category": Enums.ClueCategory.DEDUCTION,
						"importance": 3,
						"related_npcs": [npc_id],
						"deduction_type": "timeline_contradiction"
					}
					GameState.add_clue(deduction_id, deduction)
					results.append(deduction)

	return results
