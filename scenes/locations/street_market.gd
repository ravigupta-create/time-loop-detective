extends "res://scenes/locations/location_base.gd"
## Street Market - the central hub of the town. Cobblestone square with market
## stalls, a fountain in the middle, and exits in every direction connecting
## to most other locations.


func _init() -> void:
	location_id = Enums.LocationID.STREET_MARKET
	location_name = "Street Market"
	location_width = 40
	location_height = 22


func _setup_spawn_points() -> void:
	var ts := Constants.TILE_SIZE
	# Market stalls
	spawn_points["stall_1"] = Vector2(8 * ts, 6 * ts)
	spawn_points["stall_2"] = Vector2(30 * ts, 6 * ts)
	spawn_points["stall_3"] = Vector2(8 * ts, 16 * ts)
	spawn_points["stall_4"] = Vector2(30 * ts, 16 * ts)
	# Central fountain
	spawn_points["fountain"] = Vector2(20 * ts, 11 * ts)
	# Cardinal entrances
	spawn_points["entrance_north"] = Vector2(20 * ts, 2 * ts)
	spawn_points["entrance_south"] = Vector2(20 * ts, 20 * ts)
	spawn_points["entrance_east"] = Vector2(38 * ts, 11 * ts)
	spawn_points["entrance_west"] = Vector2(2 * ts, 11 * ts)
	# Between stalls
	spawn_points["center_left"] = Vector2(14 * ts, 11 * ts)
	spawn_points["center_right"] = Vector2(26 * ts, 11 * ts)


func _setup_doors() -> void:
	var ts := Constants.TILE_SIZE
	# --- North exits ---
	# To Apartment Complex (north-left)
	add_door("res://scenes/locations/apartment_complex.tscn",
		Vector2(10 * ts, ts), Vector2(32, 16))
	# To City Hall (north-right)
	add_door("res://scenes/locations/city_hall.tscn",
		Vector2(30 * ts, ts), Vector2(32, 16))

	# --- South exits ---
	# To Riverside Park (south-left)
	add_door("res://scenes/locations/riverside_park.tscn",
		Vector2(10 * ts, 21 * ts), Vector2(32, 16))
	# To Police Station (south-right)
	add_door("res://scenes/locations/police_station.tscn",
		Vector2(30 * ts, 21 * ts), Vector2(32, 16))

	# --- East exits ---
	# To Bar Crossroads (east-upper)
	add_door("res://scenes/locations/bar_crossroads.tscn",
		Vector2(39 * ts, 6 * ts), Vector2(16, 32))
	# To Hotel Marlow (east-lower)
	add_door("res://scenes/locations/hotel_marlow.tscn",
		Vector2(39 * ts, 16 * ts), Vector2(16, 32))

	# --- West exit ---
	# To Cafe Rosetta (west)
	add_door("res://scenes/locations/cafe_rosetta.tscn",
		Vector2(ts, 11 * ts), Vector2(16, 32))


func _setup_tilemap() -> void:
	var ts := Constants.TILE_SIZE
	var pw := location_width * ts
	var ph := location_height * ts

	# --- Cobblestone ground ---
	_add_rect(Color(0.52, 0.48, 0.42), Vector2.ZERO, Vector2(pw, ph), -10)

	# --- Cobblestone pattern (checkerboard) ---
	for tx in range(0, location_width, 2):
		for ty in range(0, location_height, 2):
			_add_rect(Color(0.48, 0.44, 0.38),
				Vector2(tx * ts, ty * ts), Vector2(ts, ts), -9)

	# --- Low border walls (just edges, since this is an open square) ---
	var border := Color(0.42, 0.38, 0.32)
	var bt := ts
	_add_rect(border, Vector2.ZERO, Vector2(pw, bt))
	_add_rect(border, Vector2(0, ph - bt), Vector2(pw, bt))
	_add_rect(border, Vector2.ZERO, Vector2(bt, ph))
	_add_rect(border, Vector2(pw - bt, 0), Vector2(bt, ph))

	# --- Central fountain ---
	var fountain_pos := Vector2(17 * ts, 8 * ts)
	var fountain_size := Vector2(ts * 6, ts * 6)
	# Fountain base (stone)
	_add_rect(Color(0.60, 0.58, 0.55), fountain_pos, fountain_size)
	# Water
	_add_rect(Color(0.30, 0.55, 0.70),
		fountain_pos + Vector2(ts, ts),
		fountain_size - Vector2(ts * 2, ts * 2))
	# Fountain center pillar
	_add_rect(Color(0.65, 0.62, 0.58),
		Vector2(19 * ts + 4, 10 * ts + 4), Vector2(ts * 2 - 8, ts * 2 - 8))

	# --- Market stalls ---
	var stall_frame := Color(0.50, 0.38, 0.22)  # wooden frame
	var stall_size := Vector2(ts * 5, ts * 3)

	# Stall 1 (upper-left) - fruit stall
	_add_stall(Vector2(6 * ts, 5 * ts), stall_size, stall_frame,
		Color(0.70, 0.20, 0.15))  # red awning
	# Stall 2 (upper-right) - flower stall
	_add_stall(Vector2(28 * ts, 5 * ts), stall_size, stall_frame,
		Color(0.65, 0.50, 0.70))  # purple awning
	# Stall 3 (lower-left) - fish stall
	_add_stall(Vector2(6 * ts, 15 * ts), stall_size, stall_frame,
		Color(0.20, 0.45, 0.60))  # blue awning
	# Stall 4 (lower-right) - bread stall
	_add_stall(Vector2(28 * ts, 15 * ts), stall_size, stall_frame,
		Color(0.65, 0.50, 0.25))  # golden awning

	# --- Street lamp posts (at the four corners of the fountain) ---
	var lamp_color := Color(0.30, 0.30, 0.32)
	_add_rect(lamp_color, Vector2(16 * ts, 7 * ts), Vector2(ts, ts))
	_add_rect(lamp_color, Vector2(23 * ts, 7 * ts), Vector2(ts, ts))
	_add_rect(lamp_color, Vector2(16 * ts, 14 * ts), Vector2(ts, ts))
	_add_rect(lamp_color, Vector2(23 * ts, 14 * ts), Vector2(ts, ts))

	# --- Benches near fountain ---
	var bench_color := Color(0.45, 0.35, 0.22)
	_add_rect(bench_color, Vector2(15 * ts, 11 * ts), Vector2(ts * 2, ts - 4))
	_add_rect(bench_color, Vector2(23 * ts, 11 * ts), Vector2(ts * 2, ts - 4))

	# --- Road markings (paths leading to exits) ---
	var path_color := Color(0.55, 0.52, 0.46)
	# North-south road
	_add_rect(path_color, Vector2(19 * ts, 0), Vector2(ts * 2, 8 * ts), -8)
	_add_rect(path_color, Vector2(19 * ts, 14 * ts), Vector2(ts * 2, 8 * ts), -8)
	# East-west road
	_add_rect(path_color, Vector2(0, 10 * ts), Vector2(17 * ts, ts * 2), -8)
	_add_rect(path_color, Vector2(23 * ts, 10 * ts), Vector2(17 * ts, ts * 2), -8)


func _setup_ambient() -> void:
	EventBus.ambience_change_requested.emit("market")


func _setup_interactables() -> void:
	var ts := Constants.TILE_SIZE
	# Dropped business card near fountain
	_add_interactable("crane_business_card", "Dropped Business Card",
		"A business card near the fountain: 'Crane Development Group - Victor Crane, CEO. Building tomorrow, today.' On the back, handwritten: 'H - usual amount, usual place.'",
		Enums.ClueCategory.DOCUMENT, 2,
		Vector2(18 * ts, 14 * ts + 4), Color(0.9, 0.9, 0.85, 0.5))
	# Overheard gossip at fish stall (newspaper)
	_add_interactable("market_newspaper", "Discarded Newspaper",
		"A newspaper left at a stall, headline circled in red: 'THIRD PROPERTY OWNER SELLS TO CRANE GROUP UNDER MYSTERIOUS CIRCUMSTANCES.' The article is torn after the first paragraph.",
		Enums.ClueCategory.TESTIMONY, 2,
		Vector2(8 * ts + 4, 16 * ts + 4), Color(0.8, 0.8, 0.7, 0.5))


func _add_stall(pos: Vector2, stall_size: Vector2, frame_color: Color, awning_color: Color) -> void:
	var ts := Constants.TILE_SIZE
	# Counter / table
	_add_rect(frame_color, pos, stall_size)
	# Awning (overhang above)
	_add_rect(awning_color,
		pos - Vector2(ts * 0.5, ts),
		Vector2(stall_size.x + ts, ts))
	# Goods on counter (lighter accent)
	_add_rect(frame_color.lightened(0.3),
		pos + Vector2(4, 4),
		stall_size - Vector2(8, stall_size.y * 0.5))


func _add_rect(color: Color, pos: Vector2, rect_size: Vector2, z: int = -5) -> void:
	var r := ColorRect.new()
	r.color = color
	r.size = rect_size
	r.position = pos
	r.z_index = z
	add_child(r)
