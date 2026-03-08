extends "res://scenes/locations/location_base.gd"
## Back Alley - a narrow, dark passage between buildings. Dumpsters, stacked
## crates, a fire escape, and generally shady atmosphere.


func _init() -> void:
	location_id = Enums.LocationID.BACK_ALLEY
	location_name = "Back Alley"
	location_width = 40
	location_height = 22


func _setup_spawn_points() -> void:
	var ts := Constants.TILE_SIZE
	# Dumpster area
	spawn_points["dumpster_1"] = Vector2(8 * ts, 6 * ts)
	spawn_points["dumpster_2"] = Vector2(8 * ts, 16 * ts)
	# Crate area (mid section)
	spawn_points["crate_area"] = Vector2(20 * ts, 10 * ts)
	# Fire escape (upper-right, under the ladder)
	spawn_points["fire_escape"] = Vector2(35 * ts, 4 * ts)
	# Dead-end at the far side
	spawn_points["alley_end"] = Vector2(36 * ts, 18 * ts)
	# Corner (where the alley bends)
	spawn_points["corner"] = Vector2(20 * ts, 18 * ts)
	# Entrance from bar side
	spawn_points["entrance_bar"] = Vector2(4 * ts, 4 * ts)
	# Mid-alley shadows
	spawn_points["shadows"] = Vector2(14 * ts, 12 * ts)


func _setup_doors() -> void:
	var ts := Constants.TILE_SIZE
	# Exit to Bar Crossroads (left side, upper)
	add_door("res://scenes/locations/bar_crossroads.tscn",
		Vector2(ts, 4 * ts), Vector2(16, 32))
	# Exit to City Hall (top, right area)
	add_door("res://scenes/locations/city_hall.tscn",
		Vector2(30 * ts, ts), Vector2(32, 16))
	# Exit to Docks (right side, lower)
	add_door("res://scenes/locations/docks.tscn",
		Vector2(39 * ts, 16 * ts), Vector2(16, 32))


func _setup_tilemap() -> void:
	var ts := Constants.TILE_SIZE
	var pw := location_width * ts
	var ph := location_height * ts

	# --- Ground - cracked asphalt ---
	_add_rect(Color(0.22, 0.22, 0.24), Vector2.ZERO, Vector2(pw, ph), -10)

	# --- Walls - tall brick on both sides (alley is narrow feeling) ---
	var brick := Color(0.35, 0.20, 0.18)
	var wt := ts * 3  # thicker walls to make it feel narrow
	_add_rect(brick, Vector2.ZERO, Vector2(pw, wt))
	_add_rect(brick, Vector2(0, ph - wt), Vector2(pw, wt))
	_add_rect(brick, Vector2.ZERO, Vector2(wt, ph))
	_add_rect(brick, Vector2(pw - wt, 0), Vector2(wt, ph))

	# --- Brick pattern on walls ---
	var brick_accent := Color(0.40, 0.24, 0.20)
	for i in range(0, 40, 4):
		_add_rect(brick_accent, Vector2(i * ts, 0), Vector2(ts * 2, wt - 4))
	for i in range(2, 40, 4):
		_add_rect(brick_accent, Vector2(i * ts, ph - wt + 4), Vector2(ts * 2, wt - 4))

	# --- Puddles (dark reflective spots) ---
	_add_rect(Color(0.15, 0.18, 0.25, 0.6),
		Vector2(12 * ts, 8 * ts), Vector2(ts * 3, ts * 2), -9)
	_add_rect(Color(0.15, 0.18, 0.25, 0.6),
		Vector2(26 * ts, 14 * ts), Vector2(ts * 2, ts), -9)

	# --- Dumpsters (dark green metal) ---
	var dumpster_color := Color(0.18, 0.30, 0.18)
	_add_rect(dumpster_color, Vector2(6 * ts, 5 * ts), Vector2(ts * 3, ts * 2))
	_add_rect(dumpster_color, Vector2(6 * ts, 15 * ts), Vector2(ts * 3, ts * 2))
	# Dumpster lids
	_add_rect(Color(0.22, 0.35, 0.22),
		Vector2(6 * ts, 5 * ts), Vector2(ts * 3, 3))
	_add_rect(Color(0.22, 0.35, 0.22),
		Vector2(6 * ts, 15 * ts), Vector2(ts * 3, 3))

	# --- Crates (stacked wooden boxes) ---
	var crate_color := Color(0.45, 0.35, 0.22)
	_add_rect(crate_color, Vector2(18 * ts, 9 * ts), Vector2(ts * 2, ts * 2))
	_add_rect(crate_color, Vector2(20 * ts, 10 * ts), Vector2(ts * 2, ts * 2))
	_add_rect(Color(0.50, 0.40, 0.25),
		Vector2(19 * ts, 8 * ts), Vector2(ts * 2, ts * 2))  # crate on top

	# --- Fire escape (ladder on right wall) ---
	var ladder_color := Color(0.40, 0.38, 0.36)
	_add_rect(ladder_color, Vector2(35 * ts, wt), Vector2(ts, 8 * ts))  # vertical rail
	_add_rect(ladder_color, Vector2(36 * ts, wt), Vector2(ts, 8 * ts))  # vertical rail
	# Rungs
	for ry in range(3, 10):
		_add_rect(ladder_color, Vector2(35 * ts, ry * ts), Vector2(ts * 2, 2))

	# --- Fire escape landing ---
	_add_rect(Color(0.38, 0.36, 0.34),
		Vector2(33 * ts, wt), Vector2(ts * 5, ts))

	# --- Trash / debris ---
	_add_rect(Color(0.30, 0.28, 0.22), Vector2(15 * ts, 17 * ts), Vector2(ts, ts))
	_add_rect(Color(0.25, 0.22, 0.18), Vector2(28 * ts, 8 * ts), Vector2(ts, ts))
	_add_rect(Color(0.35, 0.30, 0.20), Vector2(24 * ts, 17 * ts), Vector2(ts * 2, ts))

	# --- Overhead shadow (makes alley feel darker) ---
	_add_rect(Color(0.0, 0.0, 0.05, 0.25),
		Vector2(wt, wt), Vector2(pw - wt * 2, ph - wt * 2), 1)

	# --- Dim light pool under fire escape ---
	_add_rect(Color(0.60, 0.55, 0.30, 0.1),
		Vector2(32 * ts, 4 * ts), Vector2(ts * 4, ts * 3), 2)


func _setup_ambient() -> void:
	EventBus.ambience_change_requested.emit("alley")


func _add_rect(color: Color, pos: Vector2, rect_size: Vector2, z: int = -5) -> void:
	var r := ColorRect.new()
	r.color = color
	r.size = rect_size
	r.position = pos
	r.z_index = z
	add_child(r)
