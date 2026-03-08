extends "res://scenes/locations/location_base.gd"
## Player start location. A small apartment building with multiple rooms,
## hallway, and exits leading to the street.


func _init() -> void:
	location_id = Enums.LocationID.APARTMENT_COMPLEX
	location_name = "Apartment Complex"
	location_width = 40
	location_height = 22


func _setup_spawn_points() -> void:
	var ts := Constants.TILE_SIZE
	# Player always starts in their own apartment
	spawn_points["player_start"] = Vector2(5 * ts, 4 * ts)
	# Individual apartment rooms (bed positions)
	spawn_points["apartment_a_bed"] = Vector2(5 * ts, 3 * ts)
	spawn_points["apartment_b_bed"] = Vector2(15 * ts, 3 * ts)
	spawn_points["apartment_c_bed"] = Vector2(25 * ts, 3 * ts)
	spawn_points["apartment_d_bed"] = Vector2(35 * ts, 3 * ts)
	# Hallway positions
	spawn_points["hallway_left"] = Vector2(10 * ts, 11 * ts)
	spawn_points["hallway_center"] = Vector2(20 * ts, 11 * ts)
	spawn_points["hallway_right"] = Vector2(30 * ts, 11 * ts)
	# Lobby / ground floor
	spawn_points["lobby"] = Vector2(20 * ts, 18 * ts)
	spawn_points["mailboxes"] = Vector2(12 * ts, 18 * ts)
	spawn_points["stairwell"] = Vector2(20 * ts, 14 * ts)


func _setup_doors() -> void:
	var ts := Constants.TILE_SIZE
	# Exit to Street Market (main entrance, bottom-center)
	add_door("res://scenes/locations/street_market.tscn",
		Vector2(20 * ts, 21 * ts), Vector2(32, 16))
	# Exit to Cafe Rosetta (side door, right side)
	add_door("res://scenes/locations/cafe_rosetta.tscn",
		Vector2(39 * ts, 11 * ts), Vector2(16, 32))


func _setup_tilemap() -> void:
	var ts := Constants.TILE_SIZE
	var pw := location_width * ts   # 640
	var ph := location_height * ts  # 352

	# --- Floor ---
	var floor_rect := ColorRect.new()
	floor_rect.color = Color(0.55, 0.50, 0.42)  # worn wooden floor
	floor_rect.size = Vector2(pw, ph)
	floor_rect.position = Vector2.ZERO
	floor_rect.z_index = -10
	add_child(floor_rect)

	# --- Outer walls ---
	var wall_color := Color(0.35, 0.32, 0.28)
	var wall_thickness := ts * 2
	# Top wall
	_add_rect(wall_color, Vector2.ZERO, Vector2(pw, wall_thickness))
	# Bottom wall
	_add_rect(wall_color, Vector2(0, ph - wall_thickness), Vector2(pw, wall_thickness))
	# Left wall
	_add_rect(wall_color, Vector2.ZERO, Vector2(wall_thickness, ph))
	# Right wall
	_add_rect(wall_color, Vector2(pw - wall_thickness, 0), Vector2(wall_thickness, ph))

	# --- Hallway divider (separates upper apartments from lower lobby) ---
	var hallway_y := 9 * ts
	_add_rect(Color(0.40, 0.36, 0.30), Vector2(wall_thickness, hallway_y),
		Vector2(pw - wall_thickness * 2, ts))

	# --- Apartment divider walls (upper floor) ---
	for i in range(1, 4):
		var ax := i * 10 * ts
		_add_rect(wall_color, Vector2(ax, wall_thickness), Vector2(ts, hallway_y - wall_thickness))

	# --- Lobby floor accent (lighter tile) ---
	_add_rect(Color(0.65, 0.62, 0.55),
		Vector2(wall_thickness, 15 * ts),
		Vector2(pw - wall_thickness * 2, 5 * ts))

	# --- Beds inside apartments ---
	var bed_color := Color(0.30, 0.25, 0.50)  # dark blue bedding
	for i in 4:
		var bx := (i * 10 + 3) * ts
		_add_rect(bed_color, Vector2(bx, 3 * ts), Vector2(ts * 2, ts * 3))

	# --- Stairwell indicator ---
	_add_rect(Color(0.30, 0.30, 0.30), Vector2(19 * ts, 13 * ts), Vector2(ts * 3, ts * 2))

	# --- Mailbox row ---
	_add_rect(Color(0.45, 0.40, 0.30), Vector2(10 * ts, 17 * ts), Vector2(ts * 5, ts))

	# --- Door mats at exits ---
	_add_rect(Color(0.50, 0.35, 0.20),
		Vector2(19 * ts, 20 * ts), Vector2(ts * 3, ts))


func _setup_ambient() -> void:
	EventBus.ambience_change_requested.emit("apartment")


func _setup_interactables() -> void:
	var ts := Constants.TILE_SIZE
	# Threatening letter in mailbox
	_add_interactable("threatening_letter", "Threatening Letter",
		"An unsigned letter stuffed in a mailbox: 'Stop asking questions or you'll end up like the others.'",
		Enums.ClueCategory.PHYSICAL, 2,
		Vector2(12 * ts, 18 * ts + 8), Color(0.9, 0.85, 0.5, 0.5))
	# Notice board with construction plans
	_add_interactable("construction_notice", "Construction Notice",
		"A posted notice: 'CRANE DEVELOPMENT GROUP - Compulsory purchase order pending for this block.'",
		Enums.ClueCategory.FINANCIAL, 1,
		Vector2(20 * ts, 14 * ts - 4), Color(0.9, 0.9, 0.8, 0.5))


# ---- Helpers ----

func _add_rect(color: Color, pos: Vector2, rect_size: Vector2) -> void:
	var r := ColorRect.new()
	r.color = color
	r.size = rect_size
	r.position = pos
	r.z_index = -5
	add_child(r)
