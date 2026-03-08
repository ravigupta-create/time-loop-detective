extends CharacterBody2D
## Player character with movement, interaction, and follow mode.

@onready var sprite: AnimatedSprite2D = $AnimatedSprite2D
@onready var interaction_area: Area2D = $InteractionArea
@onready var camera: Camera2D = $Camera2D
@onready var raycast: RayCast2D = $RayCast2D

var speed: float = Constants.PLAYER_SPEED
var facing_direction: Vector2 = Vector2.DOWN
var is_in_dialogue: bool = false
var is_in_menu: bool = false

# Follow mode
var follow_target_id: String = ""
var is_following: bool = false

# Interaction
var nearby_interactables: Array[Node] = []
var nearby_npcs: Array[Node] = []


func _ready() -> void:
	EventBus.dialogue_started.connect(_on_dialogue_started)
	EventBus.dialogue_ended.connect(_on_dialogue_ended)
	EventBus.notebook_opened.connect(func(): is_in_menu = true)
	EventBus.notebook_closed.connect(func(): is_in_menu = false)
	EventBus.transition_started.connect(func(_t): is_in_menu = true)
	EventBus.transition_completed.connect(func(): is_in_menu = false)
	EventBus.loop_reset.connect(_on_loop_reset)

	# Set camera smoothing
	camera.position_smoothing_enabled = true
	camera.position_smoothing_speed = 1.0 / Constants.CAMERA_SMOOTHING


func _physics_process(delta: float) -> void:
	if is_in_dialogue or is_in_menu:
		velocity = Vector2.ZERO
		return

	if is_following:
		_process_follow_mode(delta)
	else:
		_process_movement()

	move_and_slide()
	_update_animation()
	_update_raycast()


func _input(event: InputEvent) -> void:
	if is_in_dialogue or is_in_menu:
		return

	if event.is_action_pressed("interact"):
		_try_interact()
	elif event.is_action_pressed("follow"):
		_toggle_follow_mode()


func _process_movement() -> void:
	var input := Vector2.ZERO
	input.x = Input.get_axis("move_left", "move_right")
	input.y = Input.get_axis("move_up", "move_down")

	if input.length() > 0:
		input = input.normalized()
		facing_direction = input
		velocity = input * speed
	else:
		velocity = velocity.move_toward(Vector2.ZERO, speed * 0.5)


func _process_follow_mode(_delta: float) -> void:
	# Find the target NPC in the scene
	var target: Node2D = null
	for npc in nearby_npcs:
		if npc.has_method("get_npc_id") and npc.get_npc_id() == follow_target_id:
			target = npc
			break

	if not target:
		# NPC not in this location anymore
		is_following = false
		EventBus.player_stopped_following.emit()
		return

	var to_target := target.global_position - global_position
	var dist := to_target.length()

	if dist > Constants.FOLLOW_DISTANCE:
		facing_direction = to_target.normalized()
		velocity = facing_direction * speed * 0.9
	else:
		velocity = velocity.move_toward(Vector2.ZERO, speed * 0.5)


func _try_interact() -> void:
	# Priority: NPC > evidence > interactable > door
	var target := _get_best_interaction_target()
	if target:
		EventBus.player_interacted.emit(target)
		EventBus.sfx_requested.emit("interact")

		if target.is_in_group("npcs"):
			EventBus.npc_interaction_started.emit(target.get_npc_id() if target.has_method("get_npc_id") else "")
		elif target.is_in_group("evidence"):
			if target.has_method("collect"):
				target.collect()
		elif target.is_in_group("interactables"):
			if target.has_meta("clue_data"):
				var clue: Dictionary = target.get_meta("clue_data")
				GameState.add_clue(clue.get("id", ""), clue)
				EventBus.sfx_requested.emit("evidence")
				target.queue_free()
		elif target.is_in_group("doors"):
			if target.has_method("get_destination"):
				var dest: String = target.get_destination()
				TransitionManager.transition_to_location(dest)


func _get_best_interaction_target() -> Node:
	# Check along raycast first
	if raycast.is_colliding():
		var collider := raycast.get_collider()
		if collider and (collider.is_in_group("npcs") or collider.is_in_group("evidence") or collider.is_in_group("doors") or collider.is_in_group("interactables")):
			return collider

	# Then check area overlap
	var bodies := interaction_area.get_overlapping_bodies()
	var areas := interaction_area.get_overlapping_areas()
	var all_targets: Array[Node] = []
	all_targets.append_array(bodies)
	all_targets.append_array(areas)

	# Sort by priority
	var best: Node = null
	var best_priority := -1
	for target in all_targets:
		var priority := 0
		if target.is_in_group("npcs"):
			priority = 4
		elif target.is_in_group("evidence"):
			priority = 3
		elif target.is_in_group("interactables"):
			priority = 2
		elif target.is_in_group("doors"):
			priority = 1
		if priority > best_priority:
			best_priority = priority
			best = target

	return best


func _toggle_follow_mode() -> void:
	if is_following:
		is_following = false
		follow_target_id = ""
		EventBus.player_stopped_following.emit()
	else:
		# Find nearest NPC to follow
		var nearest_npc: Node = null
		var nearest_dist := 999999.0
		for body in interaction_area.get_overlapping_bodies():
			if body.is_in_group("npcs"):
				var dist := global_position.distance_to(body.global_position)
				if dist < nearest_dist:
					nearest_dist = dist
					nearest_npc = body
		if nearest_npc and nearest_npc.has_method("get_npc_id"):
			follow_target_id = nearest_npc.get_npc_id()
			is_following = true
			EventBus.player_started_following.emit(follow_target_id)


func _update_animation() -> void:
	if not sprite or not sprite.sprite_frames:
		return
	var dir_name := _get_direction_name()
	if velocity.length() > 10:
		var anim := "walk_" + dir_name
		if sprite.sprite_frames.has_animation(anim):
			sprite.play(anim)
	else:
		var anim := "idle_" + dir_name
		if sprite.sprite_frames.has_animation(anim):
			sprite.play(anim)
		elif sprite.sprite_frames.has_animation("idle"):
			sprite.play("idle")


func _get_direction_name() -> String:
	if abs(facing_direction.x) > abs(facing_direction.y):
		return "right" if facing_direction.x > 0 else "left"
	else:
		return "down" if facing_direction.y > 0 else "up"


func _update_raycast() -> void:
	raycast.target_position = facing_direction.normalized() * Constants.INTERACTION_RADIUS


func _on_dialogue_started(_npc_id: String) -> void:
	is_in_dialogue = true
	velocity = Vector2.ZERO


func _on_dialogue_ended(_npc_id: String) -> void:
	is_in_dialogue = false


func _on_loop_reset(_loop_number: int) -> void:
	# Reset player to apartment
	is_following = false
	follow_target_id = ""
	is_in_dialogue = false
	is_in_menu = false


func _on_interaction_area_body_entered(body: Node2D) -> void:
	if body.is_in_group("npcs"):
		nearby_npcs.append(body)
	if body.is_in_group("npcs") or body.is_in_group("evidence") or body.is_in_group("interactables"):
		nearby_interactables.append(body)


func _on_interaction_area_body_exited(body: Node2D) -> void:
	nearby_npcs.erase(body)
	nearby_interactables.erase(body)


func _on_interaction_area_area_entered(area: Area2D) -> void:
	if area.is_in_group("doors") or area.is_in_group("evidence") or area.is_in_group("interactables"):
		nearby_interactables.append(area)


func _on_interaction_area_area_exited(area: Area2D) -> void:
	nearby_interactables.erase(area)


func get_interaction_prompt() -> String:
	var target := _get_best_interaction_target()
	if not target:
		return ""
	if target.is_in_group("npcs"):
		return "E: Talk"
	elif target.is_in_group("evidence"):
		return "E: Inspect"
	elif target.is_in_group("doors"):
		return "E: Enter"
	elif target.is_in_group("interactables"):
		return "E: Interact"
	return ""
