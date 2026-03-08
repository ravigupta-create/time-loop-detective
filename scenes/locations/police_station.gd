extends "res://scenes/locations/location_base.gd"
## Police Station - desks, Detective Hale's office, an evidence room,
## holding cells, and a small break room.


func _init() -> void:
	location_id = Enums.LocationID.POLICE_STATION
	location_name = "Police Station"
	location_width = 40
	location_height = 22


func _setup_spawn_points() -> void:
	var ts := Constants.TILE_SIZE
	# Front desk / reception
	spawn_points["front_desk"] = Vector2(20 * ts, 18 * ts)
	# Detective Hale's office (top-right corner)
	spawn_points["hale_office"] = Vector2(33 * ts, 4 * ts)
	# Evidence room (bottom-left, restricted area)
	spawn_points["evidence_room"] = Vector2(6 * ts, 16 * ts)
	# Holding cells (bottom-right)
	spawn_points["holding_cell"] = Vector2(34 * ts, 16 * ts)
	# Break room (mid-left)
	spawn_points["break_room"] = Vector2(6 * ts, 8 * ts)
	# Open office / desks area (center)
	spawn_points["desk_1"] = Vector2(14 * ts, 8 * ts)
	spawn_points["desk_2"] = Vector2(22 * ts, 8 * ts)
	spawn_points["desk_3"] = Vector2(14 * ts, 12 * ts)
	# Entrance
	spawn_points["entrance"] = Vector2(20 * ts, 20 * ts)


func _setup_doors() -> void:
	var ts := Constants.TILE_SIZE
	# Exit to Street Market (front entrance, bottom)
	add_door("res://scenes/locations/street_market.tscn",
		Vector2(20 * ts, 21 * ts), Vector2(32, 16))
	# Exit to Docks (side door, right)
	add_door("res://scenes/locations/docks.tscn",
		Vector2(39 * ts, 11 * ts), Vector2(16, 32))


func _setup_tilemap() -> void:
	var ts := Constants.TILE_SIZE
	var pw := location_width * ts
	var ph := location_height * ts

	# --- Floor - institutional gray linoleum ---
	_add_rect(Color(0.62, 0.62, 0.60), Vector2.ZERO, Vector2(pw, ph), -10)

	# --- Walls - beige institutional ---
	var wc := Color(0.72, 0.68, 0.60)
	var wt := ts * 2
	_add_rect(wc, Vector2.ZERO, Vector2(pw, wt))
	_add_rect(wc, Vector2(0, ph - wt), Vector2(pw, wt))
	_add_rect(wc, Vector2.ZERO, Vector2(wt, ph))
	_add_rect(wc, Vector2(pw - wt, 0), Vector2(wt, ph))

	# --- Hale's office (top-right, enclosed) ---
	var room_wall := Color(0.65, 0.60, 0.52)
	_add_rect(room_wall, Vector2(28 * ts, wt), Vector2(ts, 8 * ts))        # left wall
	_add_rect(room_wall, Vector2(28 * ts, 9 * ts), Vector2(10 * ts, ts))   # bottom wall
	# Hale's desk
	_add_rect(Color(0.38, 0.30, 0.20),
		Vector2(31 * ts, 4 * ts), Vector2(ts * 4, ts * 2))
	# Hale's chair
	_add_rect(Color(0.25, 0.25, 0.28),
		Vector2(32 * ts, 6 * ts), Vector2(ts * 2, ts))
	# Nameplate accent on desk
	_add_rect(Color(0.70, 0.60, 0.20),
		Vector2(32 * ts, 4 * ts), Vector2(ts * 2, 3))

	# --- Open office desks (center area) ---
	var desk_color := Color(0.50, 0.45, 0.38)
	_add_rect(desk_color, Vector2(12 * ts, 7 * ts), Vector2(ts * 5, ts * 2))
	_add_rect(desk_color, Vector2(20 * ts, 7 * ts), Vector2(ts * 5, ts * 2))
	_add_rect(desk_color, Vector2(12 * ts, 11 * ts), Vector2(ts * 5, ts * 2))
	# Desk chairs
	var chair_color := Color(0.28, 0.28, 0.30)
	_add_rect(chair_color, Vector2(14 * ts, 9 * ts), Vector2(ts, ts))
	_add_rect(chair_color, Vector2(22 * ts, 9 * ts), Vector2(ts, ts))
	_add_rect(chair_color, Vector2(14 * ts, 13 * ts), Vector2(ts, ts))

	# --- Evidence room (bottom-left, enclosed) ---
	_add_rect(room_wall, Vector2(wt, 14 * ts), Vector2(10 * ts, ts))    # top wall
	_add_rect(room_wall, Vector2(11 * ts, 14 * ts), Vector2(ts, 6 * ts))  # right wall
	# Evidence shelves
	var shelf_color := Color(0.55, 0.52, 0.48)
	for sy in range(15, 19):
		_add_rect(shelf_color, Vector2(3 * ts, sy * ts), Vector2(ts * 6, ts - 3))
	# Evidence box accent
	_add_rect(Color(0.60, 0.55, 0.30),
		Vector2(4 * ts, 15 * ts + 2), Vector2(ts * 2, ts - 5))

	# --- Holding cells (bottom-right) ---
	var bars_color := Color(0.45, 0.45, 0.48)
	_add_rect(room_wall, Vector2(28 * ts, 14 * ts), Vector2(10 * ts, ts))   # top wall
	_add_rect(room_wall, Vector2(28 * ts, 14 * ts), Vector2(ts, 6 * ts))    # left wall
	# Cell divider
	_add_rect(bars_color, Vector2(33 * ts, 14 * ts), Vector2(3, 6 * ts))
	# Cell bars (vertical lines)
	for bx in range(29, 38, 2):
		_add_rect(bars_color, Vector2(bx * ts, 14 * ts), Vector2(2, ts))
	# Cell bench
	_add_rect(Color(0.42, 0.40, 0.38),
		Vector2(30 * ts, 17 * ts), Vector2(ts * 2, ts))
	_add_rect(Color(0.42, 0.40, 0.38),
		Vector2(35 * ts, 17 * ts), Vector2(ts * 2, ts))

	# --- Break room (mid-left, enclosed) ---
	_add_rect(room_wall, Vector2(wt, 6 * ts), Vector2(10 * ts, ts))      # top wall
	_add_rect(room_wall, Vector2(11 * ts, 6 * ts), Vector2(ts, 7 * ts))  # right wall
	_add_rect(room_wall, Vector2(wt, 12 * ts), Vector2(10 * ts, ts))     # bottom wall
	# Coffee machine
	_add_rect(Color(0.20, 0.18, 0.16),
		Vector2(3 * ts, 7 * ts), Vector2(ts, ts * 2))
	# Small table
	_add_rect(Color(0.55, 0.50, 0.42),
		Vector2(6 * ts, 8 * ts), Vector2(ts * 3, ts * 2))

	# --- Front reception counter (bottom-center) ---
	_add_rect(Color(0.45, 0.40, 0.32),
		Vector2(15 * ts, 17 * ts), Vector2(ts * 10, ts * 2))

	# --- Bulletin board on north wall ---
	_add_rect(Color(0.55, 0.45, 0.30),
		Vector2(14 * ts, wt), Vector2(ts * 4, ts))

	# --- Floor stripe (police blue accent) ---
	_add_rect(Color(0.15, 0.25, 0.50),
		Vector2(wt, 20 * ts), Vector2(pw - wt * 2, 3), -9)


func _setup_ambient() -> void:
	EventBus.ambience_change_requested.emit("police")


func _setup_interactables() -> void:
	var ts := Constants.TILE_SIZE
	# Evidence log with discrepancies
	_add_interactable("evidence_log_gap", "Evidence Room Log",
		"The evidence room sign-in log has pages torn out. Remaining entries show Hale accessed Room 7 twelve times last month - far more than any other officer.",
		Enums.ClueCategory.BEHAVIORAL, 3,
		Vector2(5 * ts, 15 * ts), Color(0.6, 0.8, 0.9, 0.5))
	# Hidden compartment in Hale's desk
	_add_interactable("hale_desk_compartment", "Hidden Desk Compartment",
		"A false bottom in Hale's desk drawer. Inside: a list of names with dollar amounts and the note 'Monthly - DO NOT FILE.'",
		Enums.ClueCategory.FINANCIAL, 3,
		Vector2(33 * ts, 5 * ts), Color(0.5, 0.4, 0.3, 0.5))


func _add_rect(color: Color, pos: Vector2, rect_size: Vector2, z: int = -5) -> void:
	var r := ColorRect.new()
	r.color = color
	r.size = rect_size
	r.position = pos
	r.z_index = z
	add_child(r)
