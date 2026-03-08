extends Node2D
## Main game world - manages current location, NPCs, and game flow.

var current_location: Node2D = null
var current_location_id: int = Enums.LocationID.APARTMENT_COMPLEX
var player: CharacterBody2D = null
var npc_manager: Node = null
var weather_system: WeatherSystem = null
var npc_interaction_system: NPCInteractionSystem = null
var endgame_manager: EndgameManager = null

const PLAYER_SCENE := preload("res://scenes/entities/player/player.tscn")

const LOCATION_SCENES: Dictionary = {
	Enums.LocationID.APARTMENT_COMPLEX: "res://scenes/locations/apartment_complex.tscn",
	Enums.LocationID.CAFE_ROSETTA: "res://scenes/locations/cafe_rosetta.tscn",
	Enums.LocationID.BAR_CROSSROADS: "res://scenes/locations/bar_crossroads.tscn",
	Enums.LocationID.RIVERSIDE_PARK: "res://scenes/locations/riverside_park.tscn",
	Enums.LocationID.CITY_HALL: "res://scenes/locations/city_hall.tscn",
	Enums.LocationID.BACK_ALLEY: "res://scenes/locations/back_alley.tscn",
	Enums.LocationID.POLICE_STATION: "res://scenes/locations/police_station.tscn",
	Enums.LocationID.DOCKS: "res://scenes/locations/docks.tscn",
	Enums.LocationID.STREET_MARKET: "res://scenes/locations/street_market.tscn",
	Enums.LocationID.HOTEL_MARLOW: "res://scenes/locations/hotel_marlow.tscn"
}

# Reverse lookup: scene path -> location_id
var _scene_to_id: Dictionary = {}


func _ready() -> void:
	# Build reverse lookup
	for loc_id in LOCATION_SCENES:
		_scene_to_id[LOCATION_SCENES[loc_id]] = loc_id

	# Connect signals
	EventBus.loop_reset.connect(_on_loop_reset)
	EventBus.transition_midpoint.connect(_on_transition_midpoint)
	EventBus.player_interacted.connect(_on_player_interacted)

	# Setup NPC manager
	npc_manager = Node.new()
	npc_manager.name = "NPCManager"
	npc_manager.set_script(load("res://scripts/systems/npc_manager.gd"))
	add_child(npc_manager)

	# Setup weather system
	weather_system = WeatherSystem.new()
	weather_system.name = "WeatherSystem"
	add_child(weather_system)

	# Setup NPC interaction system
	npc_interaction_system = NPCInteractionSystem.new()
	npc_interaction_system.name = "NPCInteractionSystem"
	add_child(npc_interaction_system)

	# Setup endgame manager
	endgame_manager = EndgameManager.new()
	endgame_manager.name = "EndgameManager"
	add_child(endgame_manager)

	# Start game
	_load_location(GameState.last_location)
	_spawn_player()

	# Start the loop
	TimeManager.start_loop()
	CrimeEngine._generate_crimes_for_loop()

	EventBus.time_tick.connect(_on_time_tick)


func _load_location(location_id: int) -> void:
	# Remove current location
	if current_location:
		current_location.queue_free()
		await current_location.tree_exited

	current_location_id = location_id
	GameState.last_location = location_id

	# Load new location
	var scene_path: String = LOCATION_SCENES.get(location_id, LOCATION_SCENES[Enums.LocationID.APARTMENT_COMPLEX])
	if ResourceLoader.exists(scene_path):
		var scene := load(scene_path)
		current_location = scene.instantiate()
	else:
		# Fallback: create a basic location
		current_location = _create_fallback_location(location_id)

	add_child(current_location)

	# Spawn NPCs that should be at this location
	_spawn_npcs_for_location(location_id)

	EventBus.player_entered_location.emit(location_id)

	# Request location ambience
	var loc_name: String = Constants.LOCATION_NAMES.get(location_id, "unknown").to_lower().replace(" ", "_")
	EventBus.ambience_change_requested.emit(loc_name)


func change_location(scene_path: String) -> void:
	var target_id: int = _scene_to_id.get(scene_path, Enums.LocationID.STREET_MARKET)
	_load_location(target_id)

	# Reposition player at entrance
	if player:
		player.global_position = _get_entrance_position(target_id)


func _spawn_player() -> void:
	player = PLAYER_SCENE.instantiate()
	player.global_position = _get_entrance_position(current_location_id)
	add_child(player)


func _spawn_npcs_for_location(location_id: int) -> void:
	if not current_location:
		return

	var npcs_here: Array[String] = []
	if npc_manager and npc_manager.has_method("get_npcs_at_location"):
		npcs_here = npc_manager.get_npcs_at_location(location_id)
	else:
		# Fallback: check schedule manually
		var all_ids := [
			Constants.NPC_FRANK, Constants.NPC_MARIA, Constants.NPC_HALE,
			Constants.NPC_IRIS, Constants.NPC_VICTOR, Constants.NPC_PENNY,
			Constants.NPC_ELEANOR, Constants.NPC_NINA, Constants.NPC_MAYOR,
			Constants.NPC_TOMMY
		]
		for npc_id in all_ids:
			var schedule := ScheduleEvaluator.get_schedule_for_npc(npc_id)
			var eval_result := ScheduleEvaluator.evaluate(npc_id, TimeManager.current_time, schedule)
			if eval_result.get("location", -1) == location_id:
				npcs_here.append(npc_id)

	for i in npcs_here.size():
		var npc_id: String = npcs_here[i]
		var npc_data := NPCDatabase.get_npc_data(npc_id)
		if npc_data.is_empty():
			continue
		var pos: Vector2
		if current_location and current_location.has_method("get_spawn_position"):
			pos = current_location.get_spawn_position(i)
		else:
			pos = Vector2(100 + i * 50, 150)
		if current_location and current_location.has_method("spawn_npc"):
			current_location.spawn_npc(npc_id, npc_data, pos)


func _on_time_tick(current_time: float) -> void:
	# Check if any NPCs need to move to/from this location
	if not current_location:
		return

	var all_ids := [
		Constants.NPC_FRANK, Constants.NPC_MARIA, Constants.NPC_HALE,
		Constants.NPC_IRIS, Constants.NPC_VICTOR, Constants.NPC_PENNY,
		Constants.NPC_ELEANOR, Constants.NPC_NINA, Constants.NPC_MAYOR,
		Constants.NPC_TOMMY
	]

	if not current_location or not is_instance_valid(current_location):
		return
	if not current_location.get("npc_nodes") is Dictionary:
		return

	for npc_id in all_ids:
		var schedule := ScheduleEvaluator.get_schedule_for_npc(npc_id)
		var eval_result := ScheduleEvaluator.evaluate(npc_id, current_time, schedule)
		var should_be_here: bool = eval_result.get("location", -1) == current_location_id

		var is_here: bool = npc_id in current_location.npc_nodes

		if should_be_here and not is_here:
			# NPC arrived
			var npc_data := NPCDatabase.get_npc_data(npc_id)
			var pos: Vector2 = eval_result.get("position", Vector2(200, 150))
			if current_location.has_method("spawn_npc"):
				current_location.spawn_npc(npc_id, npc_data, pos)
			EventBus.npc_arrived_at_location.emit(npc_id, current_location_id)
		elif not should_be_here and is_here:
			# NPC left — check instance is still valid before despawning
			if is_instance_valid(current_location.npc_nodes.get(npc_id)):
				current_location.despawn_npc(npc_id)
			else:
				current_location.npc_nodes.erase(npc_id)

		# Update NPC state if they're in the scene
		if should_be_here and npc_id in current_location.npc_nodes:
			var npc_node = current_location.npc_nodes[npc_id]
			if not is_instance_valid(npc_node):
				current_location.npc_nodes.erase(npc_id)
				continue
			var target_state: int = eval_result.get("state", Enums.NPCState.IDLE)
			if npc_node.current_state != Enums.NPCState.CONVERSATION: # Don't interrupt conversations
				npc_node.set_state(target_state)
				if eval_result.has("position"):
					npc_node.set_target(eval_result["position"])

		# Record to timeline if player can see
		if should_be_here:
			GameState.record_timeline_entry(npc_id, current_location_id, eval_result.get("activity", "unknown"))

	# Check for NPC-to-NPC interactions
	_check_npc_interactions(current_time)


func _check_npc_interactions(current_time: float) -> void:
	if not npc_interaction_system or not current_location:
		return
	if not current_location.get("npc_nodes") is Dictionary:
		return

	var present_npcs: Array[String] = []
	for npc_id in current_location.npc_nodes:
		if is_instance_valid(current_location.npc_nodes[npc_id]):
			present_npcs.append(npc_id)

	# Generate all pairs
	var pairs: Array = []
	for i in present_npcs.size():
		for j in range(i + 1, present_npcs.size()):
			pairs.append([present_npcs[i], present_npcs[j]])

	if not pairs.is_empty():
		npc_interaction_system.check_interactions(pairs, current_location_id, current_time)


func _on_loop_reset(_loop_number: int) -> void:
	# Reset to apartment
	await get_tree().create_timer(0.1).timeout
	_load_location(Enums.LocationID.APARTMENT_COMPLEX)
	if player:
		player.global_position = _get_entrance_position(Enums.LocationID.APARTMENT_COMPLEX)


func _on_transition_midpoint() -> void:
	pass # Location swap happens in change_location


func _on_player_interacted(target: Node) -> void:
	if target.is_in_group("npcs") and target.has_method("get_npc_id"):
		var npc_id: String = target.get_npc_id()
		var npc_data := NPCDatabase.get_npc_data(npc_id)

		# Record that we know this NPC
		GameState.add_npc_knowledge(npc_id, "Met %s" % npc_data.get("name", "someone"))

		# Start dialogue
		var dialogue := _get_dialogue_for_npc(npc_id, npc_data)
		EventBus.dialogue_started.emit(npc_id)

		# The dialogue box will handle the rest
		var dialogue_box := get_tree().get_first_node_in_group("dialogue_box")
		if dialogue_box and dialogue_box.has_method("start_dialogue"):
			dialogue_box.start_dialogue(npc_id, dialogue)


func _get_dialogue_for_npc(npc_id: String, npc_data: Dictionary) -> Dictionary:
	var dialogues: Dictionary = npc_data.get("dialogue_trees", npc_data.get("default_dialogue", {}))
	if dialogues.is_empty():
		return {
			"lines": [{"text": "...", "speaker": npc_id, "truthful": true}]
		}

	# Build a full navigable tree — all branches accessible via leads_to
	var tree: Dictionary = dialogues.duplicate(true)

	# Select the best greeting variant based on game state
	var greeting_key := "greeting"
	var conspiracy: int = GameState.conspiracy_progress
	var loop_num: int = GameState.current_loop
	if conspiracy >= 75 and "greeting_late_game" in tree:
		greeting_key = "greeting_late_game"
	elif loop_num >= 5 and "greeting_familiar" in tree:
		greeting_key = "greeting_familiar"

	# Set top-level lines from selected greeting
	if greeting_key in tree:
		tree["lines"] = tree[greeting_key].get("lines", [])
	elif "greeting" in tree:
		tree["lines"] = tree["greeting"].get("lines", [])
	else:
		tree["lines"] = [{"text": "...", "speaker": npc_id, "truthful": true}]

	# Dynamically inject conspiracy-gated choices into the greeting
	var greeting_lines: Array = tree.get("lines", [])
	if not greeting_lines.is_empty():
		var first_line: Dictionary = greeting_lines[0]
		var choices: Array = first_line.get("choices", [])
		# Add conspiracy-gated branches as extra choices
		for key in tree:
			var branch: Dictionary = tree[key]
			var min_consp: int = branch.get("min_conspiracy", 0)
			var required_clues: Array = branch.get("required_clues", [])
			if min_consp > 0 and conspiracy >= min_consp:
				var label: String = branch.get("choice_label", "")
				if not label.is_empty() and not _choice_exists(choices, key):
					choices.append({"id": key, "text": label, "leads_to": key})
			if not required_clues.is_empty():
				var all_met := true
				for clue_id in required_clues:
					if clue_id not in GameState.discovered_clues:
						all_met = false
						break
				if all_met:
					var label: String = branch.get("choice_label", "")
					if not label.is_empty() and not _choice_exists(choices, key):
						choices.append({"id": key, "text": label, "leads_to": key})
		first_line["choices"] = choices

	return tree


func _choice_exists(choices: Array, choice_id: String) -> bool:
	for c in choices:
		if c.get("id", "") == choice_id:
			return true
	return false


func _get_entrance_position(location_id: int) -> Vector2:
	match location_id:
		Enums.LocationID.APARTMENT_COMPLEX:
			return Vector2(160, 280)
		Enums.LocationID.CAFE_ROSETTA:
			return Vector2(320, 300)
		Enums.LocationID.BAR_CROSSROADS:
			return Vector2(320, 300)
		Enums.LocationID.RIVERSIDE_PARK:
			return Vector2(80, 200)
		Enums.LocationID.CITY_HALL:
			return Vector2(320, 310)
		Enums.LocationID.BACK_ALLEY:
			return Vector2(320, 300)
		Enums.LocationID.POLICE_STATION:
			return Vector2(320, 300)
		Enums.LocationID.DOCKS:
			return Vector2(80, 200)
		Enums.LocationID.STREET_MARKET:
			return Vector2(320, 180)
		Enums.LocationID.HOTEL_MARLOW:
			return Vector2(320, 300)
		_:
			return Vector2(160, 160)


func _create_fallback_location(location_id: int) -> Node2D:
	var loc := Node2D.new()
	loc.name = Constants.LOCATION_NAMES.get(location_id, "Unknown")

	# Ground layer
	var ground := TileMapLayer.new()
	ground.name = "GroundLayer"
	loc.add_child(ground)

	# Wall layer
	var walls := TileMapLayer.new()
	walls.name = "WallLayer"
	loc.add_child(walls)

	# Navigation
	var nav := NavigationRegion2D.new()
	nav.name = "NavigationRegion2D"
	var nav_poly := NavigationPolygon.new()
	nav_poly.add_outline(PackedVector2Array([
		Vector2(32, 32), Vector2(608, 32), Vector2(608, 328), Vector2(32, 328)
	]))
	nav_poly.make_polygons_from_outlines()
	nav.navigation_polygon = nav_poly
	loc.add_child(nav)

	# Entities container
	var entities := Node2D.new()
	entities.name = "Entities"
	loc.add_child(entities)

	# Day/Night
	var day_night := CanvasModulate.new()
	day_night.name = "DayNight"
	loc.add_child(day_night)

	# Visual floor
	var floor_rect := ColorRect.new()
	floor_rect.size = Vector2(640, 360)
	floor_rect.color = _get_floor_color(location_id)
	floor_rect.z_index = -10
	loc.add_child(floor_rect)

	# Walls
	var wall_color := _get_floor_color(location_id).darkened(0.3)
	for wall_data in [
		[Vector2(0, 0), Vector2(640, 16)],
		[Vector2(0, 344), Vector2(640, 16)],
		[Vector2(0, 0), Vector2(16, 360)],
		[Vector2(624, 0), Vector2(16, 360)]
	]:
		var wall := ColorRect.new()
		wall.position = wall_data[0]
		wall.size = wall_data[1]
		wall.color = wall_color
		wall.z_index = -5
		loc.add_child(wall)

	# Location label
	var label := Label.new()
	label.text = Constants.LOCATION_NAMES.get(location_id, "Unknown")
	label.position = Vector2(8, 4)
	label.add_theme_color_override("font_color", Color.WHITE)
	loc.add_child(label)

	# Add script methods the game_world expects
	loc.set_meta("location_id", location_id)
	loc.set_meta("npc_nodes", {})
	loc.set_meta("spawn_points", {})

	# We need these to be callable, so we'll use a generated script
	var script := GDScript.new()
	script.source_code = """extends Node2D

var npc_nodes: Dictionary = {}
var spawn_points: Dictionary = {}
var location_id: int = %d

const NPC_SCENE = preload("res://scenes/entities/npc/npc.tscn")

func _ready():
	for i in 10:
		spawn_points["spawn_" + str(i)] = Vector2(64 + (i %% 5) * 100, 80 + (i / 5) * 120)

func spawn_npc(npc_id: String, npc_data: Dictionary, pos: Vector2) -> void:
	if npc_id in npc_nodes:
		return
	var npc_node = NPC_SCENE.instantiate()
	npc_node.initialize(npc_data)
	npc_node.global_position = pos
	$Entities.add_child(npc_node)
	npc_nodes[npc_id] = npc_node

func despawn_npc(npc_id: String) -> void:
	if npc_id in npc_nodes:
		npc_nodes[npc_id].queue_free()
		npc_nodes.erase(npc_id)

func get_spawn_position(index: int) -> Vector2:
	return spawn_points.get("spawn_" + str(index), Vector2(160, 160))
""" % location_id
	script.reload()
	loc.set_script(script)

	return loc


func _get_floor_color(location_id: int) -> Color:
	match location_id:
		Enums.LocationID.APARTMENT_COMPLEX: return Color(0.35, 0.3, 0.25)
		Enums.LocationID.CAFE_ROSETTA: return Color(0.45, 0.35, 0.25)
		Enums.LocationID.BAR_CROSSROADS: return Color(0.25, 0.2, 0.15)
		Enums.LocationID.RIVERSIDE_PARK: return Color(0.25, 0.45, 0.2)
		Enums.LocationID.CITY_HALL: return Color(0.55, 0.55, 0.5)
		Enums.LocationID.BACK_ALLEY: return Color(0.3, 0.3, 0.3)
		Enums.LocationID.POLICE_STATION: return Color(0.45, 0.45, 0.4)
		Enums.LocationID.DOCKS: return Color(0.35, 0.3, 0.2)
		Enums.LocationID.STREET_MARKET: return Color(0.4, 0.38, 0.3)
		Enums.LocationID.HOTEL_MARLOW: return Color(0.4, 0.3, 0.3)
		_: return Color(0.35, 0.35, 0.35)
