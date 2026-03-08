extends CharacterBody2D
## NPC entity with schedule-driven behavior and state machine.

var npc_id: String = ""
var npc_name: String = ""
var npc_job: String = ""
var sprite_seed: int = 0
var current_activity: String = "idle"
var target_position: Vector2 = Vector2.ZERO
var current_state: int = Enums.NPCState.IDLE
var is_interruptible: bool = true

@onready var sprite: AnimatedSprite2D = $AnimatedSprite2D
@onready var nav_agent: NavigationAgent2D = $NavigationAgent2D
@onready var interaction_label: Label = $InteractionLabel

var _speed: float = Constants.NPC_SPEED
var _facing: Vector2 = Vector2.DOWN
var _dialogue_data: Dictionary = {}
var _state_timer: float = 0.0
var _idle_wander_timer: float = 0.0


func _ready() -> void:
	add_to_group("npcs")
	nav_agent.path_desired_distance = 4.0
	nav_agent.target_desired_distance = 4.0
	nav_agent.navigation_layers = 1
	if interaction_label:
		interaction_label.text = npc_name
		interaction_label.visible = false
	EventBus.npc_interaction_started.connect(_on_interaction_started)
	EventBus.npc_interaction_ended.connect(_on_interaction_ended)


func _physics_process(delta: float) -> void:
	_state_timer += delta
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
			_process_crime(delta)
		Enums.NPCState.FLEEING:
			_process_fleeing(delta)
		Enums.NPCState.CONVERSATION:
			_process_conversation(delta)
		Enums.NPCState.SLEEPING:
			pass # Do nothing

	move_and_slide()
	_update_sprite()


func initialize(data: Dictionary) -> void:
	npc_id = data.get("id", "")
	npc_name = data.get("name", "Unknown")
	npc_job = data.get("job", "")
	sprite_seed = data.get("sprite_seed", 0)
	_dialogue_data = data.get("dialogue_trees", {})
	if interaction_label:
		interaction_label.text = npc_name

	# Generate sprite
	if sprite:
		sprite.sprite_frames = SpriteGenerator.generate_character(sprite_seed, npc_job, "neutral")


func get_npc_id() -> String:
	return npc_id


func set_state(new_state: int) -> void:
	if current_state == new_state:
		return
	var old := current_state
	current_state = new_state
	_state_timer = 0.0
	EventBus.npc_state_changed.emit(npc_id, old, new_state)


func set_target(pos: Vector2) -> void:
	target_position = pos
	nav_agent.target_position = pos


func get_dialogue() -> Dictionary:
	return _dialogue_data


# State processing
func _process_idle(delta: float) -> void:
	velocity = Vector2.ZERO
	_idle_wander_timer -= delta
	if _idle_wander_timer <= 0:
		# Small random movement
		_idle_wander_timer = randf_range(2.0, 5.0)
		var wander := Vector2(randf_range(-8, 8), randf_range(-8, 8))
		_facing = wander.normalized() if wander.length() > 0 else _facing


func _process_walking(_delta: float) -> void:
	if nav_agent.is_navigation_finished():
		set_state(Enums.NPCState.IDLE)
		velocity = Vector2.ZERO
		return
	var next_pos := nav_agent.get_next_path_position()
	var direction := (next_pos - global_position).normalized()
	velocity = direction * _speed
	_facing = direction


func _process_working(_delta: float) -> void:
	velocity = Vector2.ZERO


func _process_socializing(_delta: float) -> void:
	velocity = Vector2.ZERO


func _process_crime(_delta: float) -> void:
	# Move to crime position then stop
	if global_position.distance_to(target_position) > 8:
		var direction := (target_position - global_position).normalized()
		velocity = direction * _speed
		_facing = direction
	else:
		velocity = Vector2.ZERO


func _process_fleeing(_delta: float) -> void:
	# Move away from player
	var players := get_tree().get_nodes_in_group("player")
	if players.size() > 0:
		var away: Vector2 = (global_position - players[0].global_position).normalized()
		velocity = away * _speed * 1.5
		_facing = away
	else:
		velocity = Vector2.ZERO


func _process_conversation(_delta: float) -> void:
	velocity = Vector2.ZERO
	# Face the player
	var players := get_tree().get_nodes_in_group("player")
	if players.size() > 0:
		_facing = (players[0].global_position - global_position).normalized()


func _update_sprite() -> void:
	if not sprite or not sprite.sprite_frames:
		return
	var dir_name := "down"
	if abs(_facing.x) > abs(_facing.y):
		dir_name = "right" if _facing.x > 0 else "left"
	else:
		dir_name = "down" if _facing.y > 0 else "up"

	if velocity.length() > 5:
		var anim := "walk_" + dir_name
		if sprite.sprite_frames.has_animation(anim):
			sprite.play(anim)
	else:
		var anim := "idle_" + dir_name
		if sprite.sprite_frames.has_animation(anim):
			sprite.play(anim)
		elif sprite.sprite_frames.has_animation("idle"):
			sprite.play("idle")


func _on_interaction_started(id: String) -> void:
	if id == npc_id:
		set_state(Enums.NPCState.CONVERSATION)


func _on_interaction_ended(id: String) -> void:
	if id == npc_id:
		set_state(Enums.NPCState.IDLE)


func show_label() -> void:
	if interaction_label:
		interaction_label.visible = true


func hide_label() -> void:
	if interaction_label:
		interaction_label.visible = false
