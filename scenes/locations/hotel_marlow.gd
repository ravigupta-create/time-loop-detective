extends "res://scenes/locations/location_base.gd"
## Hotel Marlow - an aging but elegant hotel with a reception desk, a small
## lounge with a piano, an elevator, and several guest room doors.


func _init() -> void:
	location_id = Enums.LocationID.HOTEL_MARLOW
	location_name = "Hotel Marlow"
	location_width = 40
	location_height = 22


func _setup_spawn_points() -> void:
	var ts := Constants.TILE_SIZE
	# Reception desk
	spawn_points["reception_desk"] = Vector2(12 * ts, 18 * ts)
	# Lounge area (lower-left)
	spawn_points["lounge"] = Vector2(8 * ts, 12 * ts)
	# Guest rooms (upper hallway)
	spawn_points["room_101"] = Vector2(6 * ts, 4 * ts)
	spawn_points["room_102"] = Vector2(18 * ts, 4 * ts)
	spawn_points["room_103"] = Vector2(30 * ts, 4 * ts)
	# Elevator (right side)
	spawn_points["elevator"] = Vector2(36 * ts, 11 * ts)
	# Hallway
	spawn_points["hallway_upper"] = Vector2(20 * ts, 8 * ts)
	spawn_points["hallway_lower"] = Vector2(20 * ts, 15 * ts)
	# Entrance
	spawn_points["entrance"] = Vector2(20 * ts, 20 * ts)


func _setup_doors() -> void:
	var ts := Constants.TILE_SIZE
	# Exit to Street Market (front entrance, bottom-center)
	add_door("res://scenes/locations/street_market.tscn",
		Vector2(20 * ts, 21 * ts), Vector2(32, 16))


func _setup_tilemap() -> void:
	var ts := Constants.TILE_SIZE
	var pw := location_width * ts
	var ph := location_height * ts

	# --- Floor - deep red carpet ---
	_add_rect(Color(0.45, 0.15, 0.12), Vector2.ZERO, Vector2(pw, ph), -10)

	# --- Carpet pattern (diamond accents) ---
	for tx in range(2, 38, 4):
		for ty in range(2, 20, 4):
			_add_rect(Color(0.50, 0.18, 0.14),
				Vector2(tx * ts, ty * ts), Vector2(ts * 2, ts * 2), -9)

	# --- Walls - elegant cream with dark wainscoting ---
	var upper_wall := Color(0.85, 0.80, 0.72)
	var wainscot := Color(0.35, 0.25, 0.18)
	var wt := ts * 2
	# Top wall
	_add_rect(upper_wall, Vector2.ZERO, Vector2(pw, wt))
	# Bottom wall
	_add_rect(upper_wall, Vector2(0, ph - wt), Vector2(pw, wt))
	# Left wall
	_add_rect(upper_wall, Vector2.ZERO, Vector2(wt, ph))
	# Right wall
	_add_rect(upper_wall, Vector2(pw - wt, 0), Vector2(wt, ph))
	# Wainscoting (darker strip at bottom of walls)
	_add_rect(wainscot, Vector2(0, ph - ts), Vector2(pw, ts))
	_add_rect(wainscot, Vector2(0, wt - 4), Vector2(pw, 4))

	# --- Upper hallway divider (separates rooms from lobby) ---
	var divider := Color(0.70, 0.62, 0.52)
	_add_rect(divider, Vector2(wt, 7 * ts), Vector2(pw - wt * 2, ts))

	# --- Room doors along upper hallway ---
	var door_color := Color(0.40, 0.25, 0.12)
	var door_size := Vector2(ts * 2, ts)
	# Room 101 door
	_add_rect(door_color, Vector2(5 * ts, 7 * ts), door_size)
	_add_room_number(Vector2(5 * ts, 7 * ts), "101")
	# Room 102 door
	_add_rect(door_color, Vector2(17 * ts, 7 * ts), door_size)
	_add_room_number(Vector2(17 * ts, 7 * ts), "102")
	# Room 103 door
	_add_rect(door_color, Vector2(29 * ts, 7 * ts), door_size)
	_add_room_number(Vector2(29 * ts, 7 * ts), "103")

	# --- Room interiors (above divider) ---
	var room_floor := Color(0.55, 0.48, 0.38)
	# Room 101
	_add_rect(room_floor, Vector2(wt, wt), Vector2(10 * ts, 5 * ts), -8)
	# Room 102
	_add_rect(room_floor, Vector2(14 * ts, wt), Vector2(10 * ts, 5 * ts), -8)
	# Room 103
	_add_rect(room_floor, Vector2(26 * ts, wt), Vector2(12 * ts - wt, 5 * ts), -8)

	# Room divider walls
	_add_rect(divider, Vector2(12 * ts, wt), Vector2(ts, 5 * ts))
	_add_rect(divider, Vector2(25 * ts, wt), Vector2(ts, 5 * ts))

	# --- Beds in rooms ---
	var bed_color := Color(0.80, 0.75, 0.65)
	_add_rect(bed_color, Vector2(3 * ts, 3 * ts), Vector2(ts * 3, ts * 2))
	_add_rect(bed_color, Vector2(16 * ts, 3 * ts), Vector2(ts * 3, ts * 2))
	_add_rect(bed_color, Vector2(28 * ts, 3 * ts), Vector2(ts * 3, ts * 2))

	# --- Nightstands ---
	var stand_color := Color(0.40, 0.30, 0.20)
	_add_rect(stand_color, Vector2(6 * ts, 3 * ts), Vector2(ts, ts))
	_add_rect(stand_color, Vector2(19 * ts, 3 * ts), Vector2(ts, ts))
	_add_rect(stand_color, Vector2(31 * ts, 3 * ts), Vector2(ts, ts))

	# --- Reception desk (bottom-center-left) ---
	_add_rect(Color(0.42, 0.30, 0.18),
		Vector2(9 * ts, 17 * ts), Vector2(ts * 7, ts * 2))
	# Desk top accent
	_add_rect(Color(0.55, 0.42, 0.25),
		Vector2(9 * ts, 17 * ts), Vector2(ts * 7, 3))
	# Bell on counter
	_add_rect(Color(0.72, 0.65, 0.20),
		Vector2(12 * ts, 17 * ts + 4), Vector2(6, 6))

	# --- Elevator (right side) ---
	var elevator_color := Color(0.50, 0.48, 0.45)
	_add_rect(elevator_color,
		Vector2(35 * ts, 9 * ts), Vector2(ts * 3, ts * 4))
	# Elevator doors (two panels)
	_add_rect(Color(0.55, 0.52, 0.50),
		Vector2(35 * ts, 9 * ts), Vector2(ts + 4, ts * 4))
	_add_rect(Color(0.55, 0.52, 0.50),
		Vector2(37 * ts - 4, 9 * ts), Vector2(ts + 4, ts * 4))
	# Elevator call button
	_add_rect(Color(0.70, 0.60, 0.15),
		Vector2(34 * ts, 10 * ts + 4), Vector2(4, 6))

	# --- Lounge area (lower-left) ---
	# Lounge rug
	_add_rect(Color(0.50, 0.20, 0.15),
		Vector2(4 * ts, 10 * ts), Vector2(ts * 10, ts * 6), -8)
	# Sofa
	_add_rect(Color(0.35, 0.20, 0.15),
		Vector2(5 * ts, 10 * ts), Vector2(ts * 4, ts * 2))
	# Armchair
	_add_rect(Color(0.38, 0.22, 0.18),
		Vector2(10 * ts, 12 * ts), Vector2(ts * 2, ts * 2))
	# Coffee table
	_add_rect(Color(0.45, 0.35, 0.22),
		Vector2(7 * ts, 12 * ts), Vector2(ts * 2, ts))

	# --- Piano (lower-right of lounge) ---
	_add_rect(Color(0.12, 0.10, 0.08),
		Vector2(4 * ts, 14 * ts), Vector2(ts * 4, ts * 2))
	# Piano keys hint
	_add_rect(Color(0.90, 0.88, 0.85),
		Vector2(4 * ts, 14 * ts), Vector2(ts * 4, 3))

	# --- Potted plants ---
	var plant_color := Color(0.20, 0.40, 0.18)
	var pot_color := Color(0.55, 0.35, 0.22)
	for px in [3, 37]:
		_add_rect(pot_color, Vector2(px * ts, 8 * ts), Vector2(ts, ts))
		_add_rect(plant_color, Vector2(px * ts - 2, 7 * ts), Vector2(ts + 4, ts))

	# --- Grand entrance carpet runner ---
	_add_rect(Color(0.55, 0.15, 0.10),
		Vector2(18 * ts, 15 * ts), Vector2(ts * 4, 6 * ts), -8)


func _setup_ambient() -> void:
	EventBus.ambience_change_requested.emit("hotel")


func _setup_interactables() -> void:
	var ts := Constants.TILE_SIZE
	# Guest register with suspicious entries
	_add_interactable("guest_register", "Hotel Guest Register",
		"The guest register shows Room 103 booked under 'N. Volkov' with a note: 'Extended stay - paid cash, no ID on file.' Room 101 is booked to 'V. Crane - DO NOT DISTURB.'",
		Enums.ClueCategory.BEHAVIORAL, 2,
		Vector2(11 * ts, 17 * ts + 4), Color(0.7, 0.6, 0.4, 0.5))
	# Key card near elevator
	_add_interactable("spare_keycard", "Unmarked Key Card",
		"An unmarked key card on the floor near the elevator. The magnetic strip is worn from heavy use. A small sticker reads 'B-ACCESS' - basement access?",
		Enums.ClueCategory.PHYSICAL, 2,
		Vector2(35 * ts, 12 * ts), Color(0.5, 0.7, 1.0, 0.5))


func _add_room_number(pos: Vector2, _number: String) -> void:
	# Small brass-colored plate above the door to hint at room numbers
	var plate := ColorRect.new()
	plate.color = Color(0.70, 0.60, 0.25)
	plate.size = Vector2(Constants.TILE_SIZE, 4)
	plate.position = pos - Vector2(0, 5)
	plate.z_index = -4
	add_child(plate)


func _add_rect(color: Color, pos: Vector2, rect_size: Vector2, z: int = -5) -> void:
	var r := ColorRect.new()
	r.color = color
	r.size = rect_size
	r.position = pos
	r.z_index = z
	add_child(r)
