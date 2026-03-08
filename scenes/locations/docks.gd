extends "res://scenes/locations/location_base.gd"
## The Docks - a waterfront area with wooden plank walkways, shipping crates,
## a crane silhouette, boat slips, and a warehouse entrance.


func _init() -> void:
	location_id = Enums.LocationID.DOCKS
	location_name = "The Docks"
	location_width = 40
	location_height = 22


func _setup_spawn_points() -> void:
	var ts := Constants.TILE_SIZE
	# Pier end (far right, over water)
	spawn_points["pier_end"] = Vector2(36 * ts, 11 * ts)
	# Crane area (upper-center)
	spawn_points["crane_area"] = Vector2(22 * ts, 4 * ts)
	# Crate stacks (mid-left)
	spawn_points["crate_stack"] = Vector2(10 * ts, 8 * ts)
	# Warehouse entrance (left wall)
	spawn_points["warehouse_entrance"] = Vector2(4 * ts, 14 * ts)
	# Boat slip (bottom-right)
	spawn_points["boat_slip"] = Vector2(32 * ts, 18 * ts)
	# General walkway
	spawn_points["walkway_center"] = Vector2(20 * ts, 11 * ts)
	spawn_points["walkway_south"] = Vector2(20 * ts, 18 * ts)
	# Entrance
	spawn_points["entrance"] = Vector2(4 * ts, 20 * ts)


func _setup_doors() -> void:
	var ts := Constants.TILE_SIZE
	# Exit to Riverside Park (top-left)
	add_door("res://scenes/locations/riverside_park.tscn",
		Vector2(ts, 4 * ts), Vector2(16, 32))
	# Exit to Back Alley (left side, mid)
	add_door("res://scenes/locations/back_alley.tscn",
		Vector2(ts, 14 * ts), Vector2(16, 32))
	# Exit to Police Station (bottom-left)
	add_door("res://scenes/locations/police_station.tscn",
		Vector2(4 * ts, 21 * ts), Vector2(32, 16))


func _setup_tilemap() -> void:
	var ts := Constants.TILE_SIZE
	var pw := location_width * ts
	var ph := location_height * ts

	# --- Water base (entire area, docks are built over water) ---
	_add_rect(Color(0.15, 0.30, 0.45), Vector2.ZERO, Vector2(pw, ph), -10)

	# --- Wooden plank dock (main walkable area, left 2/3) ---
	var plank_color := Color(0.45, 0.38, 0.28)
	_add_rect(plank_color, Vector2.ZERO, Vector2(30 * ts, ph), -9)

	# --- Plank lines (horizontal wood grain) ---
	var plank_accent := Color(0.40, 0.33, 0.22)
	for py in range(0, location_height, 2):
		_add_rect(plank_accent,
			Vector2(0, py * ts), Vector2(30 * ts, 2), -8)

	# --- Pier extending into water (right side) ---
	_add_rect(plank_color,
		Vector2(28 * ts, 8 * ts), Vector2(12 * ts, ts * 6), -9)
	# Pier railing posts
	var post_color := Color(0.35, 0.28, 0.18)
	for px in [29, 32, 35, 38]:
		_add_rect(post_color, Vector2(px * ts, 8 * ts), Vector2(ts, ts))
		_add_rect(post_color, Vector2(px * ts, 13 * ts), Vector2(ts, ts))

	# --- Water visible in gaps ---
	_add_rect(Color(0.18, 0.35, 0.50),
		Vector2(30 * ts, 0), Vector2(10 * ts, 8 * ts), -9)
	_add_rect(Color(0.18, 0.35, 0.50),
		Vector2(30 * ts, 14 * ts), Vector2(10 * ts, 8 * ts), -9)

	# --- Water wave highlights ---
	for wy in range(0, 22, 3):
		_add_rect(Color(0.25, 0.45, 0.60, 0.4),
			Vector2(32 * ts, wy * ts), Vector2(ts * 5, 2), -7)

	# --- Shipping crates (stacked) ---
	var crate_colors := [
		Color(0.50, 0.35, 0.20),
		Color(0.42, 0.30, 0.18),
		Color(0.55, 0.40, 0.22),
	]
	# Stack 1
	_add_rect(crate_colors[0], Vector2(8 * ts, 6 * ts), Vector2(ts * 3, ts * 3))
	_add_rect(crate_colors[1], Vector2(9 * ts, 5 * ts), Vector2(ts * 2, ts * 2))
	# Stack 2
	_add_rect(crate_colors[2], Vector2(14 * ts, 4 * ts), Vector2(ts * 2, ts * 2))
	_add_rect(crate_colors[0], Vector2(12 * ts, 5 * ts), Vector2(ts * 2, ts * 2))
	# Stack 3 (near warehouse)
	_add_rect(crate_colors[1], Vector2(5 * ts, 10 * ts), Vector2(ts * 4, ts * 3))

	# --- Crane structure (upper area, just structural lines) ---
	var crane_color := Color(0.50, 0.48, 0.45)
	# Crane base
	_add_rect(crane_color, Vector2(21 * ts, 3 * ts), Vector2(ts * 3, ts))
	# Crane vertical arm
	_add_rect(crane_color, Vector2(22 * ts, ts), Vector2(ts, ts * 3))
	# Crane horizontal arm
	_add_rect(crane_color, Vector2(18 * ts, ts), Vector2(ts * 8, 3))

	# --- Boat outline in boat slip (bottom-right) ---
	var boat_color := Color(0.55, 0.20, 0.15)
	_add_rect(boat_color, Vector2(30 * ts, 16 * ts), Vector2(ts * 6, ts * 3))
	# Boat cabin
	_add_rect(Color(0.70, 0.65, 0.55),
		Vector2(31 * ts, 17 * ts), Vector2(ts * 2, ts))

	# --- Warehouse entrance (left wall, large opening) ---
	var warehouse_wall := Color(0.38, 0.35, 0.32)
	_add_rect(warehouse_wall, Vector2(0, 12 * ts), Vector2(ts * 2, ts))
	_add_rect(warehouse_wall, Vector2(0, 17 * ts), Vector2(ts * 2, ts))
	# Warehouse interior darkness
	_add_rect(Color(0.10, 0.10, 0.12),
		Vector2(0, 13 * ts), Vector2(ts * 2, ts * 4))

	# --- Rope coils ---
	_add_rect(Color(0.55, 0.48, 0.30),
		Vector2(18 * ts, 10 * ts), Vector2(ts, ts))
	_add_rect(Color(0.55, 0.48, 0.30),
		Vector2(26 * ts, 15 * ts), Vector2(ts, ts))

	# --- Bollards (mooring posts) ---
	var bollard_color := Color(0.38, 0.36, 0.34)
	_add_rect(bollard_color, Vector2(28 * ts, 10 * ts), Vector2(ts, ts))
	_add_rect(bollard_color, Vector2(28 * ts, 17 * ts), Vector2(ts, ts))


func _setup_ambient() -> void:
	EventBus.ambience_change_requested.emit("docks")


func _setup_interactables() -> void:
	var ts := Constants.TILE_SIZE
	# Shipping manifest on crate
	_add_interactable("shipping_manifest", "Shipping Manifest",
		"A manifest nailed to a crate: 'CONTENTS: Laboratory Equipment. RECIPIENT: City Hall Basement. SENDER: [REDACTED]. HANDLE WITH EXTREME CARE.'",
		Enums.ClueCategory.CONSPIRACY, 3,
		Vector2(10 * ts + 4, 7 * ts), Color(0.9, 0.85, 0.6, 0.5))
	# Scuff marks and blood
	_add_interactable("dock_scuff_marks", "Scuff Marks",
		"Deep scuff marks on the dock planks, as if something heavy was dragged. Dark stains that could be blood trail toward the water's edge.",
		Enums.ClueCategory.PHYSICAL, 2,
		Vector2(24 * ts, 12 * ts), Color(0.5, 0.2, 0.2, 0.4))


func _add_rect(color: Color, pos: Vector2, rect_size: Vector2, z: int = -5) -> void:
	var r := ColorRect.new()
	r.color = color
	r.size = rect_size
	r.position = pos
	r.z_index = z
	add_child(r)
