class_name EndgameManager
extends Node
## Tracks the true ending sequence and conspiracy milestones.
## The final loop requires 6 simultaneous steps executed at the right times.

signal endgame_progress_updated(completed_steps: int, total_steps: int)

# Endgame step tracking
var is_endgame_active: bool = false
var completed_steps: Dictionary = {} # step_id -> bool

# Step definitions with time windows (in loop seconds)
const ENDGAME_STEPS: Array[Dictionary] = [
	{
		"id": "warn_tommy",
		"description": "Warn Tommy at the docks before the murder",
		"location": Enums.LocationID.DOCKS,
		"time_window": [260.0, 380.0],
		"requires_npc": "tommy_reeves"
	},
	{
		"id": "show_evidence_iris",
		"description": "Show evidence to Iris so she broadcasts the truth",
		"location": Enums.LocationID.HOTEL_MARLOW,
		"time_window": [300.0, 440.0],
		"requires_npc": "iris_chen"
	},
	{
		"id": "confront_hale",
		"description": "Confront Hale at the police station with evidence",
		"location": Enums.LocationID.POLICE_STATION,
		"time_window": [350.0, 480.0],
		"requires_npc": "detective_hale"
	},
	{
		"id": "block_victor",
		"description": "Block Victor's escape at the back alley",
		"location": Enums.LocationID.BACK_ALLEY,
		"time_window": [450.0, 540.0],
		"requires_npc": "victor_crane"
	},
	{
		"id": "access_basement",
		"description": "Access the basement and present evidence to the Mayor",
		"location": Enums.LocationID.CITY_HALL,
		"time_window": [480.0, 560.0],
		"requires_npc": "mayor_aldridge"
	},
	{
		"id": "activate_nina_device",
		"description": "Help Nina activate her device to break the loop",
		"location": Enums.LocationID.CITY_HALL,
		"time_window": [550.0, 595.0],
		"requires_npc": "nina_volkov"
	}
]

# Milestone tracking
var _milestones_triggered: Array[String] = []


func _ready() -> void:
	EventBus.conspiracy_progress_changed.connect(_on_conspiracy_changed)
	EventBus.loop_reset.connect(_on_loop_reset)
	EventBus.endgame_step_completed.connect(_on_endgame_step_completed)


func _on_loop_reset(_loop_number: int) -> void:
	# Reset endgame steps each loop (player must complete all in one loop)
	completed_steps.clear()
	if is_endgame_active:
		EventBus.notification_queued.emit("The loop resets. Try again...", "info")


func _on_conspiracy_changed(new_value: int) -> void:
	_check_milestones(new_value)

	# Activate endgame when conspiracy reaches 100
	if new_value >= Constants.CONSPIRACY_MAX and not is_endgame_active:
		_activate_endgame()


func _check_milestones(progress: int) -> void:
	var d: int = GameState.difficulty
	# Tier 1 — "Familiar Faces"
	if progress >= int(Constants.get_dp("tier_1", d)) and "familiar_faces" not in _milestones_triggered:
		_milestones_triggered.append("familiar_faces")
		_trigger_milestone("familiar_faces", 1)

	# Tier 2 — "Following the Money"
	if progress >= int(Constants.get_dp("tier_2", d)) and "following_money" not in _milestones_triggered:
		_milestones_triggered.append("following_money")
		_trigger_milestone("following_money", 2)

	# Tier 3 — "The Device"
	if progress >= int(Constants.get_dp("tier_3", d)) and "the_device" not in _milestones_triggered:
		_milestones_triggered.append("the_device")
		_trigger_milestone("the_device", 3)

	# Tier 4 — "The Truth"
	if progress >= int(Constants.get_dp("tier_4", d)) and "the_truth" not in _milestones_triggered:
		_milestones_triggered.append("the_truth")
		_trigger_milestone("the_truth", 4)


func _trigger_milestone(milestone_id: String, tier: int) -> void:
	if milestone_id in GameState.conspiracy_milestones:
		return

	GameState.conspiracy_milestones.append(milestone_id)
	EventBus.conspiracy_milestone_reached.emit(milestone_id, tier)

	match milestone_id:
		"familiar_faces":
			EventBus.notification_queued.emit("These names keep coming up...", "clue")
			# Generate milestone clue
			GameState.add_clue("milestone_familiar_faces", {
				"id": "milestone_familiar_faces",
				"title": "Familiar Faces",
				"description": "The same names appear again and again. There's a pattern here — these people are connected.",
				"category": Enums.ClueCategory.DEDUCTION,
				"importance": 3,
				"related_npcs": [Constants.NPC_VICTOR, Constants.NPC_MAYOR, Constants.NPC_HALE]
			})

		"following_money":
			EventBus.notification_queued.emit("Follow the money...", "clue")
			GameState.add_clue("milestone_following_money", {
				"id": "milestone_following_money",
				"title": "Following the Money",
				"description": "Financial documents reveal a web of payments between City Hall, Victor Crane, and the police department.",
				"category": Enums.ClueCategory.DOCUMENT,
				"importance": 4,
				"related_npcs": [Constants.NPC_VICTOR, Constants.NPC_MAYOR, Constants.NPC_HALE]
			})

		"the_device":
			EventBus.notification_queued.emit("Something hums beneath City Hall...", "clue")
			GameState.add_clue("milestone_the_device", {
				"id": "milestone_the_device",
				"title": "The Device",
				"description": "There's a machine in the City Hall basement. It's the source of the loop. The Mayor controls it.",
				"category": Enums.ClueCategory.DEDUCTION,
				"importance": 5,
				"related_npcs": [Constants.NPC_MAYOR, Constants.NPC_NINA]
			})

		"the_truth":
			EventBus.notification_queued.emit("The full truth emerges...", "clue")
			GameState.add_clue("milestone_the_truth", {
				"id": "milestone_the_truth",
				"title": "The Truth",
				"description": "Mayor Aldridge built the loop device to stay in power indefinitely. Victor funds it. Hale covers it up. Eleanor hides the bodies. The loop must be broken.",
				"category": Enums.ClueCategory.DEDUCTION,
				"importance": 5,
				"related_npcs": [Constants.NPC_MAYOR, Constants.NPC_VICTOR, Constants.NPC_HALE, Constants.NPC_ELEANOR, Constants.NPC_NINA]
			})


func _activate_endgame() -> void:
	is_endgame_active = true
	EventBus.endgame_started.emit()
	EventBus.notification_queued.emit("You know everything. This is the final loop.", "info")
	print("[EndgameManager] Endgame activated - conspiracy at 100")


func _on_endgame_step_completed(step_id: String) -> void:
	if not is_endgame_active:
		return

	if step_id in completed_steps:
		return

	# Enforce sequential order: all previous steps must be completed
	var step_index := -1
	for i in ENDGAME_STEPS.size():
		if ENDGAME_STEPS[i]["id"] == step_id:
			step_index = i
			break
	if step_index > 0:
		for i in step_index:
			if ENDGAME_STEPS[i]["id"] not in completed_steps:
				EventBus.notification_queued.emit("You need to do something else first...", "info")
				return

	# Validate step timing
	var current_time := TimeManager.current_time
	for step in ENDGAME_STEPS:
		if step["id"] == step_id:
			if current_time >= _scale_time(step["time_window"][0]) and current_time <= _scale_time(step["time_window"][1]):
				completed_steps[step_id] = true
				var done_count := completed_steps.size()
				EventBus.notification_queued.emit("Step complete: %s (%d/6)" % [step["description"].left(30), done_count], "clue")
				endgame_progress_updated.emit(done_count, ENDGAME_STEPS.size())
				print("[EndgameManager] Step %s completed (%d/%d)" % [step_id, done_count, ENDGAME_STEPS.size()])

				# Check for victory
				if done_count >= ENDGAME_STEPS.size():
					_trigger_victory()
			else:
				EventBus.notification_queued.emit("Wrong timing for this step!", "crime")
			return


func _trigger_victory() -> void:
	print("[EndgameManager] VICTORY - All 6 steps completed!")
	EventBus.endgame_victory.emit()
	EventBus.notification_queued.emit("The loop is broken. You did it.", "info")

	# Stop the clock
	TimeManager.is_running = false

	# Save victory state
	GameState.add_clue("victory_loop_broken", {
		"id": "victory_loop_broken",
		"title": "Loop Broken",
		"description": "You executed the perfect loop. Every piece fell into place. The loop is broken forever.",
		"category": Enums.ClueCategory.DEDUCTION,
		"importance": 5,
		"related_npcs": []
	})


## Scale a time window designed for 600s to the current difficulty's loop duration.
func _scale_time(t: float) -> float:
	var loop_dur: float = float(Constants.get_dp("loop_duration", GameState.difficulty))
	return t * loop_dur / 600.0


## Check if a specific endgame step can be attempted right now.
func can_attempt_step(step_id: String) -> bool:
	if not is_endgame_active:
		return false
	if step_id in completed_steps:
		return false
	var current_time := TimeManager.current_time
	for step in ENDGAME_STEPS:
		if step["id"] == step_id:
			return current_time >= _scale_time(step["time_window"][0]) and current_time <= _scale_time(step["time_window"][1])
	return false


## Get progress overlay data for the HUD.
func get_progress_data() -> Dictionary:
	if not is_endgame_active:
		return {}
	var steps: Array[Dictionary] = []
	for step in ENDGAME_STEPS:
		steps.append({
			"id": step["id"],
			"description": step["description"],
			"completed": step["id"] in completed_steps,
			"time_window": step["time_window"],
			"can_attempt": can_attempt_step(step["id"])
		})
	return {
		"active": true,
		"steps": steps,
		"completed_count": completed_steps.size(),
		"total": ENDGAME_STEPS.size()
	}


func get_save_data() -> Dictionary:
	return {
		"is_endgame_active": is_endgame_active,
		"milestones_triggered": _milestones_triggered.duplicate()
	}


func load_save_data(data: Dictionary) -> void:
	is_endgame_active = data.get("is_endgame_active", false)
	_milestones_triggered.clear()
	for m in data.get("milestones_triggered", []):
		_milestones_triggered.append(m)
