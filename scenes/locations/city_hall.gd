extends "res://scenes/locations/location_base.gd"
## City Hall - the seat of local government. Marble floors, columns, the
## mayor's office, a meeting room, filing room, and basement stairs that are
## locked until the player has uncovered enough of the conspiracy.


func _init() -> void:
	location_id = Enums.LocationID.CITY_HALL
	location_name = "City Hall"
	location_width = 40
	location_height = 22


func _setup_spawn_points() -> void:
	var ts := Constants.TILE_SIZE
	# Reception / front desk
	spawn_points["reception"] = Vector2(20 * ts, 18 * ts)
	# Mayor's office (top-right area)
	spawn_points["mayor_office"] = Vector2(33 * ts, 5 * ts)
	# Meeting room (top-left area)
	spawn_points["meeting_room"] = Vector2(8 * ts, 5 * ts)
	# Basement entrance (bottom-right)
	spawn_points["basement_entrance"] = Vector2(36 * ts, 18 * ts)
	# Filing room (mid-left)
	spawn_points["filing_room"] = Vector2(6 * ts, 12 * ts)
	# Hallway
	spawn_points["hallway_north"] = Vector2(20 * ts, 8 * ts)
	spawn_points["hallway_south"] = Vector2(20 * ts, 14 * ts)
	# Entrance
	spawn_points["entrance"] = Vector2(20 * ts, 20 * ts)


func _setup_doors() -> void:
	var ts := Constants.TILE_SIZE
	# Exit to Street Market (front entrance, bottom-center)
	add_door("res://scenes/locations/street_market.tscn",
		Vector2(20 * ts, 21 * ts), Vector2(48, 16))
	# Exit to Back Alley (side door, left)
	add_door("res://scenes/locations/back_alley.tscn",
		Vector2(ts, 14 * ts), Vector2(16, 32))

	# Basement door - only accessible when conspiracy progress is high enough
	if GameState.conspiracy_progress >= Constants.CONSPIRACY_TIER_3:
		_add_basement_door()
	else:
		_add_locked_basement_indicator()
		# Listen for conspiracy progress changes to unlock later
		EventBus.conspiracy_progress_changed.connect(_on_conspiracy_progress)


func _on_conspiracy_progress(new_value: int) -> void:
	if new_value >= Constants.CONSPIRACY_TIER_3:
		_add_basement_door()
		# Remove locked indicator
		var locked := get_node_or_null("LockedBasement")
		if locked:
			locked.queue_free()
		EventBus.notification_queued.emit("City Hall basement unlocked!", "key")
		# Disconnect so we only do this once
		if EventBus.conspiracy_progress_changed.is_connected(_on_conspiracy_progress):
			EventBus.conspiracy_progress_changed.disconnect(_on_conspiracy_progress)


func _add_basement_door() -> void:
	var ts := Constants.TILE_SIZE
	add_door("res://scenes/locations/city_hall.tscn",  # basement is same scene, different layer
		Vector2(36 * ts, 20 * ts), Vector2(24, 16))


func _add_locked_basement_indicator() -> void:
	var ts := Constants.TILE_SIZE
	var locked := ColorRect.new()
	locked.name = "LockedBasement"
	locked.color = Color(0.5, 0.1, 0.1, 0.6)  # red tint = locked
	locked.size = Vector2(24, 16)
	locked.position = Vector2(36 * ts - 12, 20 * ts - 8)
	locked.z_index = 0
	add_child(locked)


func _setup_tilemap() -> void:
	var ts := Constants.TILE_SIZE
	var pw := location_width * ts
	var ph := location_height * ts

	# --- Floor - polished marble ---
	_add_rect(Color(0.82, 0.80, 0.78), Vector2.ZERO, Vector2(pw, ph), -10)

	# --- Marble checkerboard pattern ---
	for tx in range(0, location_width, 2):
		for ty in range(0, location_height, 2):
			_add_rect(Color(0.75, 0.73, 0.70),
				Vector2(tx * ts, ty * ts), Vector2(ts, ts), -9)

	# --- Walls - white stone ---
	var wc := Color(0.88, 0.86, 0.82)
	var wt := ts * 2
	_add_rect(wc, Vector2.ZERO, Vector2(pw, wt))
	_add_rect(wc, Vector2(0, ph - wt), Vector2(pw, wt))
	_add_rect(wc, Vector2.ZERO, Vector2(wt, ph))
	_add_rect(wc, Vector2(pw - wt, 0), Vector2(wt, ph))

	# --- Columns (pairs along the main hallway) ---
	var column_color := Color(0.78, 0.75, 0.70)
	var column_size := Vector2(ts, ts * 2)
	for cx in [8, 16, 24, 32]:
		_add_rect(column_color, Vector2(cx * ts, 7 * ts), column_size)
		_add_rect(column_color, Vector2(cx * ts, 14 * ts), column_size)

	# --- Mayor's office (top-right, walled off) ---
	var office_wall := Color(0.70, 0.65, 0.58)
	_add_rect(office_wall, Vector2(28 * ts, wt), Vector2(ts, 8 * ts))           # left wall
	_add_rect(office_wall, Vector2(28 * ts, 9 * ts), Vector2(10 * ts, ts))      # bottom wall
	# Mayor desk
	_add_rect(Color(0.40, 0.28, 0.18),
		Vector2(32 * ts, 4 * ts), Vector2(ts * 4, ts * 2))
	# Mayor chair
	_add_rect(Color(0.50, 0.15, 0.10),
		Vector2(33 * ts, 6 * ts), Vector2(ts * 2, ts))

	# --- Meeting room (top-left, walled off) ---
	_add_rect(office_wall, Vector2(12 * ts, wt), Vector2(ts, 8 * ts))           # right wall
	_add_rect(office_wall, Vector2(wt, 9 * ts), Vector2(11 * ts, ts))           # bottom wall
	# Long meeting table
	_add_rect(Color(0.38, 0.30, 0.20),
		Vector2(4 * ts, 4 * ts), Vector2(ts * 6, ts * 3))

	# --- Filing room (mid-left) ---
	_add_rect(office_wall, Vector2(wt, 10 * ts), Vector2(10 * ts, ts))   # top wall
	_add_rect(office_wall, Vector2(11 * ts, 10 * ts), Vector2(ts, 5 * ts))  # right wall
	_add_rect(office_wall, Vector2(wt, 14 * ts), Vector2(10 * ts, ts))   # bottom wall
	# Filing cabinets
	var cabinet_color := Color(0.50, 0.48, 0.45)
	for fy in range(11, 14):
		_add_rect(cabinet_color, Vector2(3 * ts, fy * ts), Vector2(ts * 2, ts - 2))

	# --- Reception desk (bottom center) ---
	_add_rect(Color(0.42, 0.35, 0.25),
		Vector2(16 * ts, 17 * ts), Vector2(ts * 8, ts * 2))

	# --- Basement stairs indicator (bottom-right corner) ---
	_add_rect(Color(0.35, 0.32, 0.30),
		Vector2(34 * ts, 19 * ts), Vector2(ts * 4, ts))

	# --- Grand entrance carpet ---
	_add_rect(Color(0.55, 0.12, 0.12),
		Vector2(18 * ts, 19 * ts), Vector2(ts * 4, ts * 2), -8)


func _setup_ambient() -> void:
	EventBus.ambience_change_requested.emit("city_hall")


func _add_rect(color: Color, pos: Vector2, rect_size: Vector2, z: int = -5) -> void:
	var r := ColorRect.new()
	r.color = color
	r.size = rect_size
	r.position = pos
	r.z_index = z
	add_child(r)
