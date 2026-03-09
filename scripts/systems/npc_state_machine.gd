class_name NPCStateMachine
extends Node
## Finite state machine that drives per-frame NPC behavior.
## Attach as a child of an NPC CharacterBody2D.  The parent must expose:
##   - navigation_agent: NavigationAgent2D
##   - animated_sprite: AnimatedSprite2D  (or Sprite2D -- we call play() only if available)
##   - npc_id: String

var current_state: int = Enums.NPCState.IDLE
var npc: CharacterBody2D = null  # set by parent on _ready

# Internal timers / helpers
var _idle_timer: float = 0.0
var _idle_direction_change_interval: float = 2.0
var _idle_wander_offset: Vector2 = Vector2.ZERO
var _rng := RandomNumberGenerator.new()

# Walking
var target_position: Vector2 = Vector2.ZERO
var flee_source: Vector2 = Vector2.ZERO

# State flags
var _entered: bool = false


func _ready() -> void:
	_rng.randomize()
	# Try to auto-detect parent as NPC if not explicitly set
	if npc == null and get_parent() is CharacterBody2D:
		npc = get_parent() as CharacterBody2D


# ---------------------------------------------------------------------------
# State transitions
# ---------------------------------------------------------------------------

func transition_to(new_state: int) -> void:
	if new_state == current_state:
		return

	var old_state := current_state
	_exit_state(current_state)
	current_state = new_state
	_enter_state(new_state)

	var npc_id: String = _get_npc_id()
	if not npc_id.is_empty():
		EventBus.npc_state_changed.emit(npc_id, old_state, new_state)


func _exit_state(state: int) -> void:
	_entered = false
	match state:
		Enums.NPCState.FLEEING:
			flee_source = Vector2.ZERO
		Enums.NPCState.CONVERSATION:
			var npc_id := _get_npc_id()
			if not npc_id.is_empty():
				EventBus.npc_interaction_ended.emit(npc_id)


func _enter_state(state: int) -> void:
	_entered = true
	match state:
		Enums.NPCState.IDLE:
			_idle_timer = 0.0
			_idle_wander_offset = Vector2.ZERO
			_play_animation("idle")
		Enums.NPCState.WALKING:
			_play_animation("walk")
		Enums.NPCState.WORKING:
			_play_animation("work")
		Enums.NPCState.SOCIALIZING:
			_play_animation("idle")
		Enums.NPCState.CRIME_ACTION:
			_play_animation("work")
		Enums.NPCState.FLEEING:
			_play_animation("walk")
		Enums.NPCState.CONVERSATION:
			_play_animation("talk")
			var npc_id := _get_npc_id()
			if not npc_id.is_empty():
				EventBus.npc_interaction_started.emit(npc_id)
		Enums.NPCState.SLEEPING:
			_play_animation("sleep")


# ---------------------------------------------------------------------------
# Per-frame processing
# ---------------------------------------------------------------------------

func process_state(delta: float) -> void:
	if npc == null:
		return

	match current_state:
		Enums.NPCState.IDLE:
			_process_idle(delta)
		Enums.NPCState.WALKING:
			_process_walking(delta)
		Enums.NPCState.WORKING:
			_process_working(delta)
		Enums.NPCState.SOCIALIZING:
			_process_socializing(delta)
		Enums.NPCState.CRIME_ACTION:
			_process_crime_action(delta)
		Enums.NPCState.FLEEING:
			_process_fleeing(delta)
		Enums.NPCState.CONVERSATION:
			_process_conversation(delta)
		Enums.NPCState.SLEEPING:
			_process_sleeping(delta)


# ---------------------------------------------------------------------------
# State processors
# ---------------------------------------------------------------------------

func _process_idle(delta: float) -> void:
	_idle_timer += delta
	if _idle_timer >= _idle_direction_change_interval:
		_idle_timer = 0.0
		_idle_direction_change_interval = _rng.randf_range(1.5, 4.0)

		# Face a random direction (flip sprite)
		_flip_sprite(_rng.randf() > 0.5)

		# Occasional small movement (30% chance)
		if _rng.randf() < 0.3:
			_idle_wander_offset = Vector2(
				_rng.randf_range(-8.0, 8.0),
				_rng.randf_range(-8.0, 8.0)
			)

	# Apply tiny wander movement
	if _idle_wander_offset.length() > 0.5:
		var move_step := _idle_wander_offset.normalized() * Constants.NPC_SPEED * 0.3 * delta
		if move_step.length() > _idle_wander_offset.length():
			move_step = _idle_wander_offset
		npc.velocity = move_step / delta
		npc.move_and_slide()
		_idle_wander_offset -= move_step
	else:
		npc.velocity = Vector2.ZERO


func _process_walking(delta: float) -> void:
	var nav_agent := _get_nav_agent()
	if nav_agent == null:
		# Fallback: move directly toward target
		_move_toward(target_position, Constants.NPC_SPEED, delta)
		return

	if nav_agent.is_navigation_finished():
		npc.velocity = Vector2.ZERO
		return

	var next_pos := nav_agent.get_next_path_position()
	var direction := (next_pos - npc.global_position).normalized()
	npc.velocity = direction * Constants.NPC_SPEED
	npc.move_and_slide()

	# Flip sprite based on movement direction
	_flip_sprite(direction.x < 0)


func _process_working(_delta: float) -> void:
	# Stay at position, animation plays continuously
	npc.velocity = Vector2.ZERO


func _process_socializing(delta: float) -> void:
	npc.velocity = Vector2.ZERO

	# Occasional gesture (flip direction toward nearby NPCs)
	_idle_timer += delta
	if _idle_timer >= 3.0:
		_idle_timer = 0.0
		# Face a random direction as a "gesture"
		_flip_sprite(_rng.randf() > 0.5)


func _process_crime_action(delta: float) -> void:
	# Move toward crime position, then stay
	var dist := npc.global_position.distance_to(target_position)
	if dist > 4.0:
		_move_toward(target_position, Constants.NPC_SPEED, delta)
	else:
		npc.velocity = Vector2.ZERO
		_play_animation("work")  # crime animation


func _process_fleeing(delta: float) -> void:
	# Move away from threat at increased speed
	var flee_speed := Constants.NPC_SPEED * 1.8
	var flee_dir: Vector2

	if flee_source != Vector2.ZERO:
		flee_dir = (npc.global_position - flee_source).normalized()
	else:
		# Flee in a random direction if no source specified
		flee_dir = Vector2(_rng.randf_range(-1, 1), _rng.randf_range(-1, 1)).normalized()

	var nav_agent := _get_nav_agent()
	if nav_agent != null:
		var flee_target := npc.global_position + flee_dir * 200.0
		nav_agent.target_position = flee_target
		if not nav_agent.is_navigation_finished():
			var next_pos := nav_agent.get_next_path_position()
			var direction := (next_pos - npc.global_position).normalized()
			npc.velocity = direction * flee_speed
			npc.move_and_slide()
			_flip_sprite(direction.x < 0)
			return

	# Fallback direct movement
	npc.velocity = flee_dir * flee_speed
	npc.move_and_slide()
	_flip_sprite(flee_dir.x < 0)


func _process_conversation(_delta: float) -> void:
	# Face player, stay still, talk animation plays
	npc.velocity = Vector2.ZERO

	# Try to face the player
	var player := _find_player()
	if player != null:
		_flip_sprite(player.global_position.x < npc.global_position.x)


func _process_sleeping(_delta: float) -> void:
	# Don't move, sleep animation plays
	npc.velocity = Vector2.ZERO


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

## Set the walking target and update NavigationAgent2D if available.
func set_target(pos: Vector2) -> void:
	target_position = pos
	var nav_agent := _get_nav_agent()
	if nav_agent != null:
		nav_agent.target_position = pos


## Set the flee source position (what the NPC is running from).
func set_flee_source(source: Vector2) -> void:
	flee_source = source


## Check if the NPC has reached its walking target.
func has_reached_target() -> bool:
	var nav_agent := _get_nav_agent()
	if nav_agent != null:
		return nav_agent.is_navigation_finished()
	return npc.global_position.distance_to(target_position) < 4.0


func _move_toward(target: Vector2, speed: float, delta: float) -> void:
	var direction := (target - npc.global_position).normalized()
	var distance := npc.global_position.distance_to(target)
	if distance < 4.0:
		npc.velocity = Vector2.ZERO
		return
	npc.velocity = direction * speed
	npc.move_and_slide()
	_flip_sprite(direction.x < 0)


func _get_nav_agent() -> NavigationAgent2D:
	if npc == null:
		return null
	if npc.has_node("NavigationAgent2D"):
		return npc.get_node("NavigationAgent2D") as NavigationAgent2D
	return null


func _get_npc_id() -> String:
	if npc != null and "npc_id" in npc:
		return str(npc.npc_id)
	return ""


func _play_animation(anim_name: String) -> void:
	if npc == null:
		return
	# Support both AnimatedSprite2D and Sprite2D setups
	if npc.has_node("AnimatedSprite2D"):
		var sprite := npc.get_node("AnimatedSprite2D") as AnimatedSprite2D
		if sprite.sprite_frames != null and sprite.sprite_frames.has_animation(anim_name):
			sprite.play(anim_name)
		elif sprite.sprite_frames != null and sprite.sprite_frames.has_animation("default"):
			sprite.play("default")


func _flip_sprite(flip: bool) -> void:
	if npc == null:
		return
	if npc.has_node("AnimatedSprite2D"):
		(npc.get_node("AnimatedSprite2D") as AnimatedSprite2D).flip_h = flip
	elif npc.has_node("Sprite2D"):
		(npc.get_node("Sprite2D") as Sprite2D).flip_h = flip


func _find_player() -> Node2D:
	# Find the player node in the scene tree
	var tree := npc.get_tree()
	if tree == null:
		return null
	var players := tree.get_nodes_in_group("player")
	if players.size() > 0:
		return players[0] as Node2D
	return null
