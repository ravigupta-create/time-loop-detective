extends Node2D
## Base location scene - all locations inherit from this.

@export var location_id: int = Enums.LocationID.APARTMENT_COMPLEX
@export var location_name: String = "Unknown"
@export var location_width: int = 40 # tiles
@export var location_height: int = 22 # tiles

var spawn_points: Dictionary = {} # marker_name -> Vector2
var npc_nodes: Dictionary = {} # npc_id -> NPC node
var evidence_nodes: Array[Node] = []
var door_areas: Array[Area2D] = []
var _weather_overlay: ColorRect = null

@onready var tilemap: TileMapLayer = $GroundLayer
@onready var wall_layer: TileMapLayer = $WallLayer
@onready var nav_region: NavigationRegion2D = $NavigationRegion2D
@onready var entities: Node2D = $Entities
@onready var day_night: CanvasModulate = $DayNight

const NPC_SCENE := preload("res://scenes/entities/npc/npc.tscn")


func _ready() -> void:
	_setup_navigation()
	_setup_tilemap()
	_setup_spawn_points()
	_setup_doors()
	_setup_ambient()
	_setup_interactables()

	EventBus.time_tick.connect(_on_time_tick)
	EventBus.evidence_spawned.connect(_on_evidence_spawned)
	EventBus.time_of_day_changed.connect(_on_time_of_day_changed)
	EventBus.weather_changed.connect(_on_weather_changed)
	EventBus.player_entered_location.emit(location_id)

	# Create weather overlay
	_weather_overlay = ColorRect.new()
	_weather_overlay.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	_weather_overlay.size = Vector2(location_width * Constants.TILE_SIZE, location_height * Constants.TILE_SIZE)
	_weather_overlay.color = Color(1, 1, 1, 0)
	_weather_overlay.z_index = 5
	_weather_overlay.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(_weather_overlay)


func _setup_navigation() -> void:
	if not nav_region:
		return
	var nav_poly := NavigationPolygon.new()
	# Create a walkable rectangle for the interior
	var margin := Constants.TILE_SIZE * 2
	var outline := PackedVector2Array([
		Vector2(margin, margin),
		Vector2(location_width * Constants.TILE_SIZE - margin, margin),
		Vector2(location_width * Constants.TILE_SIZE - margin, location_height * Constants.TILE_SIZE - margin),
		Vector2(margin, location_height * Constants.TILE_SIZE - margin)
	])
	nav_poly.add_outline(outline)
	nav_poly.make_polygons_from_outlines()
	nav_region.navigation_polygon = nav_poly


func _setup_tilemap() -> void:
	# Override in subclasses to set up specific tile layouts
	pass


func _setup_spawn_points() -> void:
	# Override to define NPC spawn positions
	# Default: spread evenly
	for i in 10:
		var x := (i % 5) * 64 + 64
		var y := (i / 5) * 64 + 64
		spawn_points["spawn_%d" % i] = Vector2(x, y)


func _setup_doors() -> void:
	# Override to add door areas for each exit
	pass


func _setup_ambient() -> void:
	# Override for location-specific ambience
	pass


func _setup_interactables() -> void:
	# Override to add location-specific discoverable interactions
	pass


func _add_interactable(clue_id: String, title: String, description: String, category: int, importance: int, pos: Vector2, visual_color: Color = Color(0.5, 0.7, 1.0, 0.5)) -> void:
	## Create a discoverable interaction point that reveals a clue when examined.
	var obj := Area2D.new()
	obj.add_to_group("interactables")
	obj.position = pos

	var shape := CollisionShape2D.new()
	var rect := RectangleShape2D.new()
	rect.size = Vector2(14, 14)
	shape.shape = rect
	obj.add_child(shape)

	# Subtle glow indicator
	var visual := ColorRect.new()
	visual.color = visual_color
	visual.size = Vector2(10, 10)
	visual.position = Vector2(-5, -5)
	visual.z_index = 2
	obj.add_child(visual)

	var clue_data := {
		"id": clue_id,
		"title": title,
		"description": description,
		"category": category,
		"importance": importance,
	}
	obj.set_meta("clue_data", clue_data)

	entities.add_child(obj)


func _on_time_tick(current_time: float) -> void:
	_update_day_night(current_time)


func _update_day_night(_current_time: float) -> void:
	if day_night:
		var tod := TimeManager.get_time_of_day()
		day_night.color = Palette.get_time_color(tod)


func _on_time_of_day_changed(tod: int) -> void:
	if day_night:
		day_night.color = Palette.get_time_color(tod)


func _on_weather_changed(weather_type: int) -> void:
	if not _weather_overlay:
		return
	match weather_type:
		Enums.WeatherType.CLEAR:
			_weather_overlay.color = Color(1, 1, 1, 0)
		Enums.WeatherType.OVERCAST:
			_weather_overlay.color = Color(0.5, 0.5, 0.55, 0.15)
		Enums.WeatherType.RAIN:
			_weather_overlay.color = Color(0.3, 0.35, 0.45, 0.25)
		Enums.WeatherType.FOG:
			_weather_overlay.color = Color(0.7, 0.7, 0.75, 0.35)


func _on_evidence_spawned(evidence_id: String, ev_location: int) -> void:
	if ev_location == location_id:
		_spawn_evidence(evidence_id)


func spawn_npc(npc_id: String, npc_data: Dictionary, pos: Vector2) -> void:
	if npc_id in npc_nodes:
		return # Already spawned
	var npc_node: CharacterBody2D = NPC_SCENE.instantiate()
	npc_node.initialize(npc_data)
	npc_node.global_position = pos
	entities.add_child(npc_node)
	npc_nodes[npc_id] = npc_node


func despawn_npc(npc_id: String) -> void:
	if npc_id in npc_nodes:
		npc_nodes[npc_id].queue_free()
		npc_nodes.erase(npc_id)


func get_npc_node(npc_id: String) -> CharacterBody2D:
	return npc_nodes.get(npc_id)


func _spawn_evidence(evidence_id: String) -> void:
	# Create an evidence interactable
	var ev := Area2D.new()
	ev.add_to_group("evidence")
	ev.name = evidence_id

	var shape := CollisionShape2D.new()
	var rect := RectangleShape2D.new()
	rect.size = Vector2(8, 8)
	shape.shape = rect
	ev.add_child(shape)

	# Visual indicator
	var indicator := ColorRect.new()
	indicator.color = Color(1.0, 0.9, 0.2, 0.8) # Yellow glow
	indicator.size = Vector2(8, 8)
	indicator.position = Vector2(-4, -4)
	ev.add_child(indicator)

	# Place at a random walkable position
	var pos := Vector2(
		randf_range(Constants.TILE_SIZE * 3, (location_width - 3) * Constants.TILE_SIZE),
		randf_range(Constants.TILE_SIZE * 3, (location_height - 3) * Constants.TILE_SIZE)
	)
	ev.position = pos

	ev.set_meta("evidence_id", evidence_id)
	ev.set_script(load("res://scenes/entities/evidence_pickup.gd") if ResourceLoader.exists("res://scenes/entities/evidence_pickup.gd") else null)

	entities.add_child(ev)
	evidence_nodes.append(ev)


func add_door(target_location: String, position: Vector2, size: Vector2 = Vector2(16, 32)) -> void:
	var door := Area2D.new()
	door.add_to_group("doors")
	door.position = position

	var shape := CollisionShape2D.new()
	var rect := RectangleShape2D.new()
	rect.size = size
	shape.shape = rect
	door.add_child(shape)

	# Door visual
	var visual := ColorRect.new()
	visual.color = Color(0.4, 0.25, 0.1, 0.8) # Brown door
	visual.size = size
	visual.position = -size / 2
	door.add_child(visual)

	door.set_meta("destination", target_location)
	door.body_entered.connect(_on_door_body_entered.bind(target_location))

	add_child(door)
	door_areas.append(door)


func _on_door_body_entered(body: Node2D, target: String) -> void:
	if body.is_in_group("player"):
		TransitionManager.transition_to_location(target)


func get_spawn_position(index: int) -> Vector2:
	var key := "spawn_%d" % index
	return spawn_points.get(key, Vector2(160, 160))
