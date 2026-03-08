extends "res://scenes/locations/location_base.gd"
## Cafe Rosetta - a cozy neighborhood cafe run by Maria Santos.
## Counter along the back wall, four tables with chairs, warm lighting.


func _init() -> void:
	location_id = Enums.LocationID.CAFE_ROSETTA
	location_name = "Cafe Rosetta"
	location_width = 40
	location_height = 22


func _setup_spawn_points() -> void:
	var ts := Constants.TILE_SIZE
	# Staff
	spawn_points["behind_counter"] = Vector2(20 * ts, 3 * ts)  # Maria's position
	# Tables (center of each table area)
	spawn_points["table_1"] = Vector2(8 * ts, 10 * ts)
	spawn_points["table_2"] = Vector2(18 * ts, 10 * ts)
	spawn_points["table_3"] = Vector2(28 * ts, 10 * ts)
	spawn_points["table_4"] = Vector2(18 * ts, 16 * ts)
	# Entrance area
	spawn_points["entrance"] = Vector2(20 * ts, 20 * ts)
	# Window seats
	spawn_points["window_left"] = Vector2(4 * ts, 14 * ts)
	spawn_points["window_right"] = Vector2(36 * ts, 14 * ts)


func _setup_doors() -> void:
	var ts := Constants.TILE_SIZE
	# Exit to Apartment Complex (left side)
	add_door("res://scenes/locations/apartment_complex.tscn",
		Vector2(ts, 11 * ts), Vector2(16, 32))
	# Exit to Riverside Park (right side)
	add_door("res://scenes/locations/riverside_park.tscn",
		Vector2(39 * ts, 11 * ts), Vector2(16, 32))
	# Exit to Street Market (front door, bottom)
	add_door("res://scenes/locations/street_market.tscn",
		Vector2(20 * ts, 21 * ts), Vector2(32, 16))


func _setup_tilemap() -> void:
	var ts := Constants.TILE_SIZE
	var pw := location_width * ts
	var ph := location_height * ts

	# --- Floor - warm wood ---
	_add_rect(Color(0.60, 0.48, 0.32), Vector2.ZERO, Vector2(pw, ph), -10)

	# --- Walls - warm terracotta ---
	var wc := Color(0.62, 0.38, 0.28)
	var wt := ts * 2
	_add_rect(wc, Vector2.ZERO, Vector2(pw, wt))
	_add_rect(wc, Vector2(0, ph - wt), Vector2(pw, wt))
	_add_rect(wc, Vector2.ZERO, Vector2(wt, ph))
	_add_rect(wc, Vector2(pw - wt, 0), Vector2(wt, ph))

	# --- Counter (back wall) ---
	_add_rect(Color(0.40, 0.28, 0.18),  # dark wood counter
		Vector2(8 * ts, 2 * ts), Vector2(24 * ts, ts * 2))
	# Counter top accent
	_add_rect(Color(0.70, 0.55, 0.35),
		Vector2(8 * ts, 2 * ts), Vector2(24 * ts, 4))

	# --- Espresso machine ---
	_add_rect(Color(0.25, 0.25, 0.28),
		Vector2(14 * ts, 2 * ts + 4), Vector2(ts * 2, ts))

	# --- Menu board behind counter ---
	_add_rect(Color(0.15, 0.15, 0.12),
		Vector2(22 * ts, wt), Vector2(ts * 4, ts * 1))

	# --- Tables (four square tables) ---
	var table_color := Color(0.50, 0.38, 0.25)
	var table_size := Vector2(ts * 3, ts * 3)
	_add_rect(table_color, Vector2(7 * ts, 9 * ts), table_size)   # table 1
	_add_rect(table_color, Vector2(17 * ts, 9 * ts), table_size)  # table 2
	_add_rect(table_color, Vector2(27 * ts, 9 * ts), table_size)  # table 3
	_add_rect(table_color, Vector2(17 * ts, 15 * ts), table_size) # table 4

	# --- Chairs (small dark squares beside each table) ---
	var chair_color := Color(0.35, 0.25, 0.18)
	var chair_size := Vector2(ts, ts)
	for tx in [7, 17, 27]:
		# Chairs on left/right of row-1 tables
		_add_rect(chair_color, Vector2((tx - 1) * ts, 10 * ts), chair_size)
		_add_rect(chair_color, Vector2((tx + 3) * ts, 10 * ts), chair_size)
	# Chairs for table 4
	_add_rect(chair_color, Vector2(16 * ts, 16 * ts), chair_size)
	_add_rect(chair_color, Vector2(20 * ts, 16 * ts), chair_size)

	# --- Window highlights (lighter rectangles on side walls) ---
	_add_rect(Color(0.75, 0.85, 0.90, 0.4),
		Vector2(wt, 12 * ts), Vector2(4, ts * 5))
	_add_rect(Color(0.75, 0.85, 0.90, 0.4),
		Vector2(pw - wt - 4, 12 * ts), Vector2(4, ts * 5))

	# --- Floor tile pattern (checkerboard accent strip) ---
	for i in range(2, 38, 2):
		_add_rect(Color(0.55, 0.42, 0.28),
			Vector2(i * ts, 19 * ts), Vector2(ts, ts), -9)


func _setup_ambient() -> void:
	EventBus.ambience_change_requested.emit("cafe")


func _add_rect(color: Color, pos: Vector2, rect_size: Vector2, z: int = -5) -> void:
	var r := ColorRect.new()
	r.color = color
	r.size = rect_size
	r.position = pos
	r.z_index = z
	add_child(r)
