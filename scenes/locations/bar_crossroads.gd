extends "res://scenes/locations/location_base.gd"
## Bar Crossroads - a dim, jazz-filled bar run by Frank DeLuca.
## Long counter, bar stools, small stage in the corner, and private booths.


func _init() -> void:
	location_id = Enums.LocationID.BAR_CROSSROADS
	location_name = "Bar Crossroads"
	location_width = 40
	location_height = 22


func _setup_spawn_points() -> void:
	var ts := Constants.TILE_SIZE
	# Staff
	spawn_points["behind_bar"] = Vector2(20 * ts, 3 * ts)  # Frank's position
	# Bar stools along the counter
	spawn_points["stool_1"] = Vector2(12 * ts, 5 * ts)
	spawn_points["stool_2"] = Vector2(17 * ts, 5 * ts)
	spawn_points["stool_3"] = Vector2(22 * ts, 5 * ts)
	spawn_points["stool_4"] = Vector2(27 * ts, 5 * ts)
	# Stage area (bottom-left corner)
	spawn_points["stage"] = Vector2(6 * ts, 17 * ts)
	# Booths (right side)
	spawn_points["booth_1"] = Vector2(34 * ts, 10 * ts)
	spawn_points["booth_2"] = Vector2(34 * ts, 16 * ts)
	# General floor
	spawn_points["floor_center"] = Vector2(20 * ts, 12 * ts)
	spawn_points["entrance"] = Vector2(20 * ts, 20 * ts)


func _setup_doors() -> void:
	var ts := Constants.TILE_SIZE
	# Exit to Back Alley (back door, top-right)
	add_door("res://scenes/locations/back_alley.tscn",
		Vector2(38 * ts, ts), Vector2(16, 32))
	# Exit to Street Market (front door, bottom)
	add_door("res://scenes/locations/street_market.tscn",
		Vector2(20 * ts, 21 * ts), Vector2(32, 16))


func _setup_tilemap() -> void:
	var ts := Constants.TILE_SIZE
	var pw := location_width * ts
	var ph := location_height * ts

	# --- Floor - dark stained wood ---
	_add_rect(Color(0.22, 0.18, 0.14), Vector2.ZERO, Vector2(pw, ph), -10)

	# --- Walls - dark paneling ---
	var wc := Color(0.16, 0.12, 0.10)
	var wt := ts * 2
	_add_rect(wc, Vector2.ZERO, Vector2(pw, wt))
	_add_rect(wc, Vector2(0, ph - wt), Vector2(pw, wt))
	_add_rect(wc, Vector2.ZERO, Vector2(wt, ph))
	_add_rect(wc, Vector2(pw - wt, 0), Vector2(wt, ph))

	# --- Bar counter (horizontal, near top) ---
	_add_rect(Color(0.35, 0.22, 0.12),  # polished dark wood
		Vector2(8 * ts, 3 * ts), Vector2(24 * ts, ts * 2))
	# Bar top shine
	_add_rect(Color(0.50, 0.35, 0.20),
		Vector2(8 * ts, 3 * ts), Vector2(24 * ts, 3))

	# --- Bottle shelf behind bar ---
	_add_rect(Color(0.28, 0.20, 0.14),
		Vector2(10 * ts, wt), Vector2(20 * ts, ts))
	# Individual bottles (small colored rectangles)
	for i in 8:
		var bottle_hue := Color.from_hsv(i * 0.12, 0.6, 0.5)
		_add_rect(bottle_hue,
			Vector2((11 + i * 2) * ts + 4, wt + 2), Vector2(6, ts - 4))

	# --- Bar stools (small circles approximated as small squares) ---
	var stool_color := Color(0.30, 0.28, 0.25)
	for sx in [12, 17, 22, 27]:
		_add_rect(stool_color, Vector2(sx * ts, 5 * ts), Vector2(ts, ts))

	# --- Stage (raised platform, bottom-left) ---
	_add_rect(Color(0.32, 0.26, 0.20),
		Vector2(3 * ts, 15 * ts), Vector2(8 * ts, 5 * ts))
	# Stage edge highlight
	_add_rect(Color(0.45, 0.35, 0.25),
		Vector2(3 * ts, 15 * ts), Vector2(8 * ts, 3))

	# --- Booths (right side, two alcoves) ---
	var booth_color := Color(0.45, 0.15, 0.12)  # red leather
	# Booth 1
	_add_rect(booth_color, Vector2(32 * ts, 9 * ts), Vector2(6 * ts, ts))   # back
	_add_rect(booth_color, Vector2(32 * ts, 9 * ts), Vector2(ts, ts * 3))   # left side
	_add_rect(booth_color, Vector2(32 * ts, 12 * ts), Vector2(6 * ts, ts))  # front
	# Booth table
	_add_rect(Color(0.30, 0.20, 0.12), Vector2(33 * ts, 10 * ts), Vector2(4 * ts, ts))
	# Booth 2
	_add_rect(booth_color, Vector2(32 * ts, 15 * ts), Vector2(6 * ts, ts))
	_add_rect(booth_color, Vector2(32 * ts, 15 * ts), Vector2(ts, ts * 3))
	_add_rect(booth_color, Vector2(32 * ts, 18 * ts), Vector2(6 * ts, ts))
	# Booth 2 table
	_add_rect(Color(0.30, 0.20, 0.12), Vector2(33 * ts, 16 * ts), Vector2(4 * ts, ts))

	# --- Neon sign glow accent on back wall ---
	_add_rect(Color(0.8, 0.2, 0.3, 0.15),
		Vector2(15 * ts, wt), Vector2(10 * ts, ts * 4))

	# --- Floor scuff marks / texture ---
	for i in range(5, 35, 6):
		_add_rect(Color(0.20, 0.16, 0.12),
			Vector2(i * ts, 12 * ts), Vector2(ts * 2, 2), -9)


func _setup_ambient() -> void:
	EventBus.ambience_change_requested.emit("bar")


func _add_rect(color: Color, pos: Vector2, rect_size: Vector2, z: int = -5) -> void:
	var r := ColorRect.new()
	r.color = color
	r.size = rect_size
	r.position = pos
	r.z_index = z
	add_child(r)
