class_name NPCManager
extends Node
## Manages all NPC instances and off-screen simulation.
## Tracks logical state for every NPC regardless of whether they are
## spawned in the current scene.  Connects to EventBus.time_tick to
## advance NPC schedules each second.

# Active NPC scene nodes (only those in the player's current location)
var npc_instances: Dictionary = {}  # npc_id -> NPC CharacterBody2D node

# Logical tracking for ALL NPCs (on-screen and off-screen)
var npc_locations: Dictionary = {}  # npc_id -> current Enums.LocationID
var npc_states: Dictionary = {}     # npc_id -> {state, position, activity, location}

# Cached schedules so we don't rebuild them every tick
var _schedules: Dictionary = {}     # npc_id -> Array[Dictionary]

# The NPC scene to instantiate when spawning
var _npc_scene: PackedScene = null
const NPC_SCENE_PATH: String = "res://scenes/entities/npc/npc.tscn"

# Crime-override tracking: crime engine can override an NPC's scheduled behavior
var _crime_overrides: Dictionary = {}  # npc_id -> {location, position, state, activity}


func _ready() -> void:
	_initialize_all_npcs()

	# Connect EventBus signals
	EventBus.time_tick.connect(_on_time_tick)
	EventBus.loop_reset.connect(_on_loop_reset)
	EventBus.player_entered_location.connect(_on_player_entered_location)
	EventBus.player_exited_location.connect(_on_player_exited_location)
	EventBus.crime_started.connect(_on_crime_started)
	EventBus.crime_completed.connect(_on_crime_completed)

	# Pre-load NPC scene
	if ResourceLoader.exists(NPC_SCENE_PATH):
		_npc_scene = load(NPC_SCENE_PATH) as PackedScene


# ---------------------------------------------------------------------------
# Initialization
# ---------------------------------------------------------------------------

func _initialize_all_npcs() -> void:
	var all_ids := NPCDatabase.get_all_npc_ids()
	for npc_id in all_ids:
		# Cache schedule
		_schedules[npc_id] = ScheduleEvaluator.get_schedule_for_npc(npc_id)

		# Evaluate initial state at time 0
		var schedule: Array[Dictionary] = _schedules[npc_id]
		var eval_result := ScheduleEvaluator.evaluate(npc_id, 0.0, schedule)

		npc_locations[npc_id] = eval_result["location"]
		npc_states[npc_id] = {
			"state":    eval_result["state"],
			"position": eval_result["position"],
			"activity": eval_result["activity"],
			"location": eval_result["location"],
		}

	print("[NPCManager] Initialized %d NPCs" % all_ids.size())


# ---------------------------------------------------------------------------
# Time-driven updates
# ---------------------------------------------------------------------------

func _on_time_tick(current_time: float) -> void:
	update_npcs(current_time)


func update_npcs(current_time: float) -> void:
	var all_ids := NPCDatabase.get_all_npc_ids()
	for npc_id in all_ids:
		_update_single_npc(npc_id, current_time)


func _update_single_npc(npc_id: String, current_time: float) -> void:
	# Crime overrides take priority over the schedule
	if npc_id in _crime_overrides:
		var override: Dictionary = _crime_overrides[npc_id]
		var old_location: int = npc_locations.get(npc_id, -1)
		npc_locations[npc_id] = override["location"]
		npc_states[npc_id] = override.duplicate()

		if old_location != override["location"]:
			EventBus.npc_arrived_at_location.emit(npc_id, override["location"])

		_apply_state_to_instance(npc_id)
		return

	# Normal schedule evaluation
	var schedule: Array[Dictionary] = _schedules.get(npc_id, [])
	if schedule.is_empty():
		return

	var eval_result := ScheduleEvaluator.evaluate(npc_id, current_time, schedule)
	var old_location: int = npc_locations.get(npc_id, -1)
	var new_location: int = eval_result["location"]

	npc_locations[npc_id] = new_location
	npc_states[npc_id] = {
		"state":    eval_result["state"],
		"position": eval_result["position"],
		"activity": eval_result["activity"],
		"location": new_location,
	}

	# Emit arrival signal on location change
	if old_location != new_location:
		EventBus.npc_arrived_at_location.emit(npc_id, new_location)

	# Update the live instance if it exists
	_apply_state_to_instance(npc_id)


func _apply_state_to_instance(npc_id: String) -> void:
	if npc_id not in npc_instances:
		return

	var instance: CharacterBody2D = npc_instances[npc_id]
	if not is_instance_valid(instance):
		npc_instances.erase(npc_id)
		return

	var state_info: Dictionary = npc_states[npc_id]
	var target_state: int = state_info["state"]
	var target_pos: Vector2 = state_info["position"]

	# Drive the NPC's state and target position
	if instance.has_method("set_state"):
		instance.set_state(target_state)
	if instance.has_method("set_target"):
		instance.set_target(target_pos)


# ---------------------------------------------------------------------------
# Location queries
# ---------------------------------------------------------------------------

## Returns all NPC ids currently at a given location (logical, not scene).
func get_npcs_at_location(location_id: int) -> Array[String]:
	var result: Array[String] = []
	for npc_id in npc_locations:
		if npc_locations[npc_id] == location_id:
			result.append(str(npc_id))
	return result


## Returns the logical state for an NPC.
func get_npc_state(npc_id: String) -> Dictionary:
	return npc_states.get(npc_id, {})


## Returns whether an NPC is currently interruptible.
func is_npc_interruptible(npc_id: String) -> bool:
	if npc_id in _crime_overrides:
		return false  # NPCs involved in crimes are never interruptible
	return ScheduleEvaluator.is_interruptible(npc_id, TimeManager.current_time)


# ---------------------------------------------------------------------------
# Spawn / Despawn
# ---------------------------------------------------------------------------

## Instantiate an NPC node in the scene at the given position.
func spawn_npc_in_scene(npc_id: String, parent: Node, position: Vector2) -> void:
	# Don't double-spawn
	if npc_id in npc_instances and is_instance_valid(npc_instances[npc_id]):
		return

	var instance: CharacterBody2D = null

	if _npc_scene != null:
		instance = _npc_scene.instantiate() as CharacterBody2D
	else:
		# Create a minimal CharacterBody2D placeholder if scene doesn't exist yet
		instance = CharacterBody2D.new()
		instance.name = npc_id

	# Set NPC identity
	if "npc_id" in instance:
		instance.npc_id = npc_id
	else:
		instance.set_meta("npc_id", npc_id)

	instance.global_position = position
	parent.add_child(instance)
	npc_instances[npc_id] = instance

	# Wire up the state machine if present
	_apply_state_to_instance(npc_id)

	print("[NPCManager] Spawned %s at %s" % [NPCDatabase.get_npc_name(npc_id), str(position)])


## Remove an NPC node from the scene (logical state preserved).
func despawn_npc(npc_id: String) -> void:
	if npc_id not in npc_instances:
		return

	var instance: CharacterBody2D = npc_instances[npc_id]
	if is_instance_valid(instance):
		instance.queue_free()

	npc_instances.erase(npc_id)


## Spawn all NPCs that should be at the given location.
func spawn_npcs_for_location(location_id: int, parent: Node) -> void:
	var ids := get_npcs_at_location(location_id)
	for npc_id in ids:
		var state_info: Dictionary = npc_states.get(npc_id, {})
		var pos: Vector2 = state_info.get("position", Vector2(100, 100))
		spawn_npc_in_scene(npc_id, parent, pos)


## Despawn all currently active NPC instances.
func despawn_all() -> void:
	var ids := npc_instances.keys().duplicate()
	for npc_id in ids:
		despawn_npc(npc_id)


# ---------------------------------------------------------------------------
# Loop reset
# ---------------------------------------------------------------------------

func _on_loop_reset(_loop_number: int) -> void:
	# Despawn all active instances
	despawn_all()

	# Clear crime overrides
	_crime_overrides.clear()

	# Re-initialize logical state at time 0
	_initialize_all_npcs()


# ---------------------------------------------------------------------------
# Location change handlers
# ---------------------------------------------------------------------------

func _on_player_entered_location(location_id: int) -> void:
	# Spawn NPCs that are logically at this location
	# The caller (location scene) should provide itself as the parent
	# This is handled externally -- the location scene calls spawn_npcs_for_location
	pass


func _on_player_exited_location(_location_id: int) -> void:
	# Despawn all scene NPCs when leaving a location
	despawn_all()


# ---------------------------------------------------------------------------
# Crime integration
# ---------------------------------------------------------------------------

func _on_crime_started(crime_id: String, _crime_type: int) -> void:
	# The CrimeEngine handles NPC overrides via npc_arrived_at_location.
	# We can also set explicit overrides here if needed by listening to
	# crime stage signals.
	pass


func _on_crime_completed(crime_id: String, _outcome: String) -> void:
	# Clear any crime overrides for NPCs involved in the completed crime
	var to_clear: Array[String] = []
	for npc_id in _crime_overrides:
		var override: Dictionary = _crime_overrides[npc_id]
		if override.get("crime_id", "") == crime_id:
			to_clear.append(npc_id)

	for npc_id in to_clear:
		_crime_overrides.erase(npc_id)

	# Force immediate schedule re-evaluation for cleared NPCs
	for npc_id in to_clear:
		_update_single_npc(npc_id, TimeManager.current_time)


## Called by external systems (e.g., CrimeEngine) to override an NPC's behavior.
func set_crime_override(npc_id: String, crime_id: String, location_id: int,
		position: Vector2, state: int, activity: String) -> void:
	_crime_overrides[npc_id] = {
		"crime_id": crime_id,
		"location": location_id,
		"position": position,
		"state":    state,
		"activity": activity,
	}


## Clear a specific NPC's crime override.
func clear_crime_override(npc_id: String) -> void:
	_crime_overrides.erase(npc_id)


# ---------------------------------------------------------------------------
# Save / Load  (for mid-loop saves, if supported)
# ---------------------------------------------------------------------------

func get_save_data() -> Dictionary:
	return {
		"npc_locations": npc_locations.duplicate(),
		"npc_states": npc_states.duplicate(true),
		"crime_overrides": _crime_overrides.duplicate(true),
	}


func load_save_data(data: Dictionary) -> void:
	npc_locations = data.get("npc_locations", {})
	npc_states = data.get("npc_states", {})
	_crime_overrides = data.get("crime_overrides", {})
