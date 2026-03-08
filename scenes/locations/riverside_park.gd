extends "res://scenes/locations/location_base.gd"
## Riverside Park - an open green space with a river running along the right
## side, benches, scattered trees, and a winding path.


func _init() -> void:
	location_id = Enums.LocationID.RIVERSIDE_PARK
	location_name = "Riverside Park"
	location_width = 40
	location_height = 22


func _setup_spawn_points() -> void:
	var ts := Constants.TILE_SIZE
	# Benches
	spawn_points["bench_1"] = Vector2(8 * ts, 8 * ts)
	spawn_points["bench_2"] = Vector2(16 * ts, 14 * ts)
	spawn_points["bench_3"] = Vector2(8 * ts, 18 * ts)
	# Path waypoints
	spawn_points["path_start"] = Vector2(4 * ts, 20 * ts)
	spawn_points["path_end"] = Vector2(28 * ts, 3 * ts)
	# River bank
	spawn_points["riverbank"] = Vector2(30 * ts, 11 * ts)
	# Tree area
	spawn_points["tree_area"] = Vector2(12 * ts, 5 * ts)
	# Open grass
	spawn_points["grass_center"] = Vector2(18 * ts, 10 * ts)
	spawn_points["entrance"] = Vector2(4 * ts, 11 * ts)


func _setup_doors() -> void:
	var ts := Constants.TILE_SIZE
	# Exit to Cafe Rosetta (left side)
	add_door("res://scenes/locations/cafe_rosetta.tscn",
		Vector2(ts, 11 * ts), Vector2(16, 32))
	# Exit to Docks (bottom-right)
	add_door("res://scenes/locations/docks.tscn",
		Vector2(34 * ts, 21 * ts), Vector2(32, 16))
	# Exit to Street Market (top-left)
	add_door("res://scenes/locations/street_market.tscn",
		Vector2(ts, 3 * ts), Vector2(16, 32))


func _setup_tilemap() -> void:
	var ts := Constants.TILE_SIZE
	var pw := location_width * ts
	var ph := location_height * ts

	# --- Grass base ---
	_add_rect(Color(0.30, 0.55, 0.25), Vector2.ZERO, Vector2(pw, ph), -10)

	# --- River (right side, about 8 tiles wide) ---
	var river_x := 32 * ts
	_add_rect(Color(0.20, 0.40, 0.60),
		Vector2(river_x, 0), Vector2(pw - river_x, ph), -9)
	# River bank (muddy strip)
	_add_rect(Color(0.40, 0.35, 0.22),
		Vector2(river_x - ts, 0), Vector2(ts, ph), -8)
	# Water shimmer highlights
	for i in range(0, 22, 3):
		_add_rect(Color(0.30, 0.55, 0.75, 0.4),
			Vector2(river_x + ts * 2, i * ts), Vector2(ts * 3, 3), -8)

	# --- Winding path (cobblestone) ---
	var path_color := Color(0.55, 0.50, 0.40)
	var path_width := ts * 2
	# Approximate a winding path with segments
	_add_rect(path_color, Vector2(3 * ts, 19 * ts), Vector2(ts * 8, path_width))
	_add_rect(path_color, Vector2(10 * ts, 14 * ts), Vector2(path_width, ts * 7))
	_add_rect(path_color, Vector2(10 * ts, 14 * ts), Vector2(ts * 10, path_width))
	_add_rect(path_color, Vector2(18 * ts, 8 * ts), Vector2(path_width, ts * 8))
	_add_rect(path_color, Vector2(18 * ts, 8 * ts), Vector2(ts * 8, path_width))
	_add_rect(path_color, Vector2(24 * ts, 3 * ts), Vector2(path_width, ts * 7))
	_add_rect(path_color, Vector2(24 * ts, 3 * ts), Vector2(ts * 6, path_width))

	# --- Benches ---
	var bench_color := Color(0.45, 0.32, 0.18)
	_add_rect(bench_color, Vector2(7 * ts, 8 * ts), Vector2(ts * 3, ts))
	_add_rect(bench_color, Vector2(15 * ts, 14 * ts), Vector2(ts * 3, ts))
	_add_rect(bench_color, Vector2(7 * ts, 18 * ts), Vector2(ts * 3, ts))

	# --- Trees (dark green canopy circles approximated as squares) ---
	var trunk_color := Color(0.35, 0.25, 0.15)
	var canopy_color := Color(0.18, 0.42, 0.18)
	var tree_positions := [
		Vector2(6 * ts, 4 * ts),
		Vector2(13 * ts, 4 * ts),
		Vector2(10 * ts, 7 * ts),
		Vector2(4 * ts, 13 * ts),
		Vector2(24 * ts, 12 * ts),
		Vector2(28 * ts, 7 * ts),
	]
	for tpos in tree_positions:
		# Trunk
		_add_rect(trunk_color, tpos + Vector2(ts * 0.5, ts), Vector2(ts, ts * 2))
		# Canopy
		_add_rect(canopy_color, tpos - Vector2(ts * 0.5, ts * 0.5),
			Vector2(ts * 3, ts * 2))

	# --- Flower patches ---
	_add_rect(Color(0.75, 0.25, 0.30), Vector2(14 * ts, 12 * ts), Vector2(ts, ts))
	_add_rect(Color(0.80, 0.70, 0.20), Vector2(22 * ts, 16 * ts), Vector2(ts, ts))
	_add_rect(Color(0.60, 0.30, 0.65), Vector2(6 * ts, 16 * ts), Vector2(ts, ts))

	# --- Low fence along river bank ---
	for i in range(0, 22, 2):
		_add_rect(Color(0.50, 0.40, 0.25),
			Vector2(river_x - ts * 2, i * ts), Vector2(4, ts))


func _setup_ambient() -> void:
	EventBus.ambience_change_requested.emit("park")


func _add_rect(color: Color, pos: Vector2, rect_size: Vector2, z: int = -5) -> void:
	var r := ColorRect.new()
	r.color = color
	r.size = rect_size
	r.position = pos
	r.z_index = z
	add_child(r)
