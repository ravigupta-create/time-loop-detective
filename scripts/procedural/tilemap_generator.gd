class_name TileMapGenerator
## Static utility for procedurally generating tilemap data for each game location.
## Returns tile-coordinate arrays for floors, walls, and furniture that can be
## consumed by a TileMap node at runtime.


# ---------------------------------------------------------------------------
# Tile indices -- thin abstraction so callers / renderers can map these to
# actual TileSet atlas coords later.
# ---------------------------------------------------------------------------

enum Tile {
	EMPTY = 0,
	# Floors
	WOOD_FLOOR,
	DARK_WOOD_FLOOR,
	TILE_FLOOR,
	CARPET,
	MARBLE_FLOOR,
	GRASS,
	PATH,
	COBBLESTONE,
	CONCRETE,
	WOOD_PLANK,
	WATER,
	# Walls
	WALL,
	WALL_WINDOW,
	DOOR,
	COLUMN,
	# Furniture / objects
	TABLE,
	CHAIR,
	STOOL,
	COUNTER,
	BAR_COUNTER,
	DESK,
	FILING_CABINET,
	BED,
	SHELF,
	CRATE,
	DUMPSTER,
	BENCH,
	TREE,
	FIRE_ESCAPE,
	STAIRS_DOWN,
	RECEPTION_DESK,
	ELEVATOR,
	MARKET_STALL,
	AWNING,
	BOAT,
	STAGE,
	CELL_BARS,
	EVIDENCE_LOCKER,
	RIVER_EDGE,
}


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

## Generates tilemap data for [param location_id] at the given grid dimensions.
## Returns a Dictionary with keys:
##   "floor"     : Array of { "pos": Vector2i, "tile": Tile }
##   "walls"     : Array of { "pos": Vector2i, "tile": Tile }
##   "furniture" : Array of { "pos": Vector2i, "tile": Tile }
##   "walkable"  : Array[Vector2i]  -- positions the player / NPCs can walk on
##   "tile_grid" : a flat 2-D lookup  Array[Array]  [y][x] = Tile value
static func generate_location_tiles(location_id: int, width: int, height: int) -> Dictionary:
	var floor_data: Array = []
	var wall_data: Array = []
	var furniture_data: Array = []
	# Initialise grid to EMPTY
	var grid: Array = []
	for y in range(height):
		var row: Array = []
		row.resize(width)
		for x in range(width):
			row[x] = Tile.EMPTY
		grid.append(row)

	match location_id:
		Enums.LocationID.CAFE_ROSETTA:
			_generate_cafe(grid, floor_data, wall_data, furniture_data, width, height)
		Enums.LocationID.BAR_CROSSROADS:
			_generate_bar(grid, floor_data, wall_data, furniture_data, width, height)
		Enums.LocationID.RIVERSIDE_PARK:
			_generate_park(grid, floor_data, wall_data, furniture_data, width, height)
		Enums.LocationID.APARTMENT_COMPLEX:
			_generate_apartment(grid, floor_data, wall_data, furniture_data, width, height)
		Enums.LocationID.CITY_HALL:
			_generate_city_hall(grid, floor_data, wall_data, furniture_data, width, height)
		Enums.LocationID.BACK_ALLEY:
			_generate_alley(grid, floor_data, wall_data, furniture_data, width, height)
		Enums.LocationID.POLICE_STATION:
			_generate_police_station(grid, floor_data, wall_data, furniture_data, width, height)
		Enums.LocationID.DOCKS:
			_generate_docks(grid, floor_data, wall_data, furniture_data, width, height)
		Enums.LocationID.STREET_MARKET:
			_generate_market(grid, floor_data, wall_data, furniture_data, width, height)
		Enums.LocationID.HOTEL_MARLOW:
			_generate_hotel(grid, floor_data, wall_data, furniture_data, width, height)

	# Build walkable list from the grid (anything that is a floor-type tile)
	var walkable: Array[Vector2i] = []
	for y in range(height):
		for x in range(width):
			if _is_walkable_tile(grid[y][x]):
				walkable.append(Vector2i(x, y))

	return {
		"floor": floor_data,
		"walls": wall_data,
		"furniture": furniture_data,
		"walkable": walkable,
		"tile_grid": grid,
	}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

static func _is_walkable_tile(tile: int) -> bool:
	match tile:
		Tile.WOOD_FLOOR, Tile.DARK_WOOD_FLOOR, Tile.TILE_FLOOR, \
		Tile.CARPET, Tile.MARBLE_FLOOR, Tile.GRASS, Tile.PATH, \
		Tile.COBBLESTONE, Tile.CONCRETE, Tile.WOOD_PLANK:
			return true
	return false


static func _set_tile(grid: Array, data: Array, x: int, y: int, tile: int, w: int, h: int) -> void:
	if x < 0 or x >= w or y < 0 or y >= h:
		return
	grid[y][x] = tile
	data.append({"pos": Vector2i(x, y), "tile": tile})


static func _fill_rect(grid: Array, data: Array, rx: int, ry: int, rw: int, rh: int, tile: int, gw: int, gh: int) -> void:
	for y in range(ry, mini(ry + rh, gh)):
		for x in range(rx, mini(rx + rw, gw)):
			_set_tile(grid, data, x, y, tile, gw, gh)


static func _add_walls_border(grid: Array, wall_data: Array, w: int, h: int, door_positions: Array = []) -> void:
	# Top & bottom walls
	for x in range(w):
		if Vector2i(x, 0) not in door_positions:
			_set_tile(grid, wall_data, x, 0, Tile.WALL, w, h)
		if Vector2i(x, h - 1) not in door_positions:
			_set_tile(grid, wall_data, x, h - 1, Tile.WALL, w, h)
	# Left & right walls
	for y in range(1, h - 1):
		if Vector2i(0, y) not in door_positions:
			_set_tile(grid, wall_data, 0, y, Tile.WALL, w, h)
		if Vector2i(w - 1, y) not in door_positions:
			_set_tile(grid, wall_data, w - 1, y, Tile.WALL, w, h)
	# Place doors
	for dp in door_positions:
		_set_tile(grid, wall_data, dp.x, dp.y, Tile.DOOR, w, h)


# ---------------------------------------------------------------------------
# Location generators
# ---------------------------------------------------------------------------

static func _generate_cafe(grid: Array, fd: Array, wd: Array, furn: Array, w: int, h: int) -> void:
	# Wooden floor
	_fill_rect(grid, fd, 0, 0, w, h, Tile.WOOD_FLOOR, w, h)
	# Walls with a door at bottom-centre
	var door_pos := [Vector2i(w / 2, h - 1)]
	_add_walls_border(grid, wd, w, h, door_pos)
	# Counter along back wall (row 1, inner columns)
	for x in range(2, w - 2):
		_set_tile(grid, furn, x, 1, Tile.COUNTER, w, h)
	# 4 tables with chairs (2x2 grid, spaced evenly)
	var table_positions: Array[Vector2i] = [
		Vector2i(w / 4, h / 3),
		Vector2i(3 * w / 4, h / 3),
		Vector2i(w / 4, 2 * h / 3),
		Vector2i(3 * w / 4, 2 * h / 3),
	]
	for tp in table_positions:
		_set_tile(grid, furn, tp.x, tp.y, Tile.TABLE, w, h)
		# Chairs around each table
		_set_tile(grid, furn, tp.x - 1, tp.y, Tile.CHAIR, w, h)
		_set_tile(grid, furn, tp.x + 1, tp.y, Tile.CHAIR, w, h)
		_set_tile(grid, furn, tp.x, tp.y - 1, Tile.CHAIR, w, h)
		_set_tile(grid, furn, tp.x, tp.y + 1, Tile.CHAIR, w, h)


static func _generate_bar(grid: Array, fd: Array, wd: Array, furn: Array, w: int, h: int) -> void:
	_fill_rect(grid, fd, 0, 0, w, h, Tile.DARK_WOOD_FLOOR, w, h)
	var door_pos := [Vector2i(w / 2, h - 1)]
	_add_walls_border(grid, wd, w, h, door_pos)
	# Long bar counter on left side
	for y in range(2, h - 3):
		_set_tile(grid, furn, 2, y, Tile.BAR_COUNTER, w, h)
		_set_tile(grid, furn, 3, y, Tile.STOOL, w, h)
	# Small stage area top-right corner
	_fill_rect(grid, furn, w - 5, 1, 4, 3, Tile.STAGE, w, h)
	# A few scattered tables
	_set_tile(grid, furn, w / 2, h / 2, Tile.TABLE, w, h)
	_set_tile(grid, furn, w / 2 + 1, h / 2, Tile.CHAIR, w, h)
	_set_tile(grid, furn, w / 2 - 1, h / 2, Tile.CHAIR, w, h)
	_set_tile(grid, furn, w / 2 + 3, h / 2 + 2, Tile.TABLE, w, h)
	_set_tile(grid, furn, w / 2 + 4, h / 2 + 2, Tile.CHAIR, w, h)


static func _generate_park(grid: Array, fd: Array, wd: Array, furn: Array, w: int, h: int) -> void:
	# Grass base
	_fill_rect(grid, fd, 0, 0, w, h, Tile.GRASS, w, h)
	# Horizontal path through the centre
	_fill_rect(grid, fd, 0, h / 2, w, 2, Tile.PATH, w, h)
	# Vertical path crossing
	_fill_rect(grid, fd, w / 2, 0, 2, h, Tile.PATH, w, h)
	# River along the right edge (3 tiles wide)
	var river_x := w - 4
	_fill_rect(grid, fd, river_x, 0, 1, h, Tile.RIVER_EDGE, w, h)
	_fill_rect(grid, fd, river_x + 1, 0, 3, h, Tile.WATER, w, h)
	# Trees (darker green clusters) -- scattered in grass quadrants
	var tree_spots: Array[Vector2i] = [
		Vector2i(3, 3), Vector2i(4, 3), Vector2i(3, 4),
		Vector2i(w / 4, h / 4),
		Vector2i(w / 4 + 1, h / 4),
		Vector2i(3, h - 5), Vector2i(4, h - 5),
		Vector2i(w / 3, h - 4),
	]
	for ts in tree_spots:
		_set_tile(grid, furn, ts.x, ts.y, Tile.TREE, w, h)
	# Benches along the path
	_set_tile(grid, furn, w / 4, h / 2 - 1, Tile.BENCH, w, h)
	_set_tile(grid, furn, 3 * w / 4 - 4, h / 2 - 1, Tile.BENCH, w, h)


static func _generate_apartment(grid: Array, fd: Array, wd: Array, furn: Array, w: int, h: int) -> void:
	# Carpet floor base
	_fill_rect(grid, fd, 0, 0, w, h, Tile.CARPET, w, h)
	# Hallway through the middle (tile floor)
	_fill_rect(grid, fd, w / 2 - 1, 0, 3, h, Tile.TILE_FLOOR, w, h)
	# Outer walls
	_add_walls_border(grid, wd, w, h, [Vector2i(w / 2, h - 1)])
	# Units: 2 on each side, separated by internal walls
	var unit_h := (h - 2) / 2
	# Left units
	for unit_idx in range(2):
		var uy := 1 + unit_idx * unit_h
		# Internal wall separating units
		if unit_idx > 0:
			for x in range(1, w / 2 - 1):
				_set_tile(grid, wd, x, uy, Tile.WALL, w, h)
		# Door into hallway
		_set_tile(grid, wd, w / 2 - 1, uy + unit_h / 2, Tile.DOOR, w, h)
		# Bed
		_set_tile(grid, furn, 2, uy + 1, Tile.BED, w, h)
		_set_tile(grid, furn, 3, uy + 1, Tile.BED, w, h)
		# Desk
		_set_tile(grid, furn, 2, uy + unit_h - 2, Tile.DESK, w, h)
	# Right units
	for unit_idx in range(2):
		var uy := 1 + unit_idx * unit_h
		if unit_idx > 0:
			for x in range(w / 2 + 2, w - 1):
				_set_tile(grid, wd, x, uy, Tile.WALL, w, h)
		_set_tile(grid, wd, w / 2 + 1, uy + unit_h / 2, Tile.DOOR, w, h)
		_set_tile(grid, furn, w - 4, uy + 1, Tile.BED, w, h)
		_set_tile(grid, furn, w - 3, uy + 1, Tile.BED, w, h)
		_set_tile(grid, furn, w - 4, uy + unit_h - 2, Tile.DESK, w, h)


static func _generate_city_hall(grid: Array, fd: Array, wd: Array, furn: Array, w: int, h: int) -> void:
	_fill_rect(grid, fd, 0, 0, w, h, Tile.MARBLE_FLOOR, w, h)
	_add_walls_border(grid, wd, w, h, [Vector2i(w / 2, h - 1)])
	# Columns  (two rows, evenly spaced)
	var col_spacing := maxi(w / 5, 3)
	for x in range(col_spacing, w - 1, col_spacing):
		_set_tile(grid, wd, x, 3, Tile.COLUMN, w, h)
		_set_tile(grid, wd, x, h - 4, Tile.COLUMN, w, h)
	# Large desk (mayor's) centred, upper portion
	_fill_rect(grid, furn, w / 2 - 2, 2, 5, 2, Tile.DESK, w, h)
	# Filing cabinets along left wall
	for y in range(2, h / 2):
		_set_tile(grid, furn, 1, y, Tile.FILING_CABINET, w, h)
	# Shelves along right wall
	for y in range(2, h / 2):
		_set_tile(grid, furn, w - 2, y, Tile.SHELF, w, h)
	# Basement stairs (bottom-left corner)
	_set_tile(grid, furn, 2, h - 3, Tile.STAIRS_DOWN, w, h)
	_set_tile(grid, furn, 3, h - 3, Tile.STAIRS_DOWN, w, h)


static func _generate_alley(grid: Array, fd: Array, wd: Array, furn: Array, w: int, h: int) -> void:
	_fill_rect(grid, fd, 0, 0, w, h, Tile.CONCRETE, w, h)
	# Walls on left and right only (open top/bottom as alley entrances)
	for y in range(h):
		_set_tile(grid, wd, 0, y, Tile.WALL, w, h)
		_set_tile(grid, wd, w - 1, y, Tile.WALL, w, h)
	# Dumpsters
	_set_tile(grid, furn, 2, 2, Tile.DUMPSTER, w, h)
	_set_tile(grid, furn, 2, h - 3, Tile.DUMPSTER, w, h)
	# Crates scattered
	_set_tile(grid, furn, w - 3, 3, Tile.CRATE, w, h)
	_set_tile(grid, furn, w - 3, 4, Tile.CRATE, w, h)
	_set_tile(grid, furn, w - 4, 4, Tile.CRATE, w, h)
	_set_tile(grid, furn, w - 3, h / 2, Tile.CRATE, w, h)
	# Fire escape on left wall
	_set_tile(grid, furn, 1, h / 3, Tile.FIRE_ESCAPE, w, h)
	_set_tile(grid, furn, 1, h / 3 + 1, Tile.FIRE_ESCAPE, w, h)
	_set_tile(grid, furn, 1, h / 3 + 2, Tile.FIRE_ESCAPE, w, h)


static func _generate_police_station(grid: Array, fd: Array, wd: Array, furn: Array, w: int, h: int) -> void:
	_fill_rect(grid, fd, 0, 0, w, h, Tile.TILE_FLOOR, w, h)
	_add_walls_border(grid, wd, w, h, [Vector2i(w / 2, h - 1)])
	# Reception desk near entrance
	_fill_rect(grid, furn, w / 2 - 2, h - 4, 5, 1, Tile.COUNTER, w, h)
	# Desks in main area (3 desks)
	var desk_y := h / 2
	for i in range(3):
		var dx := 3 + i * (w / 4)
		_set_tile(grid, furn, dx, desk_y, Tile.DESK, w, h)
		_set_tile(grid, furn, dx + 1, desk_y, Tile.DESK, w, h)
		_set_tile(grid, furn, dx, desk_y + 1, Tile.CHAIR, w, h)
	# Evidence room (top-right, walled off)
	var ev_x := w - w / 3
	for y in range(1, h / 3):
		_set_tile(grid, wd, ev_x, y, Tile.WALL, w, h)
	_set_tile(grid, wd, ev_x, h / 3 - 1, Tile.DOOR, w, h)
	# Evidence lockers inside
	for x in range(ev_x + 1, w - 1):
		_set_tile(grid, furn, x, 1, Tile.EVIDENCE_LOCKER, w, h)
	# Cells (top-left, two cells)
	var cell_w := w / 5
	for cell_idx in range(2):
		var cx := 1
		var cy := 1 + cell_idx * 3
		for xx in range(cx, cx + cell_w):
			_set_tile(grid, furn, xx, cy + 2, Tile.CELL_BARS, w, h)
		_set_tile(grid, furn, cx + cell_w / 2, cy + 2, Tile.DOOR, w, h)


static func _generate_docks(grid: Array, fd: Array, wd: Array, furn: Array, w: int, h: int) -> void:
	# Wooden planks for the dock area (left portion)
	_fill_rect(grid, fd, 0, 0, 2 * w / 3, h, Tile.WOOD_PLANK, w, h)
	# Water (right third)
	_fill_rect(grid, fd, 2 * w / 3, 0, w / 3, h, Tile.WATER, w, h)
	# Water edge (transition column)
	for y in range(h):
		_set_tile(grid, fd, 2 * w / 3, y, Tile.RIVER_EDGE, w, h)
	# Crates
	_set_tile(grid, furn, 2, 2, Tile.CRATE, w, h)
	_set_tile(grid, furn, 3, 2, Tile.CRATE, w, h)
	_set_tile(grid, furn, 2, 3, Tile.CRATE, w, h)
	_set_tile(grid, furn, 5, h / 2, Tile.CRATE, w, h)
	_set_tile(grid, furn, 6, h / 2, Tile.CRATE, w, h)
	_set_tile(grid, furn, 5, h / 2 + 1, Tile.CRATE, w, h)
	# Boat outline in the water
	var boat_y := h / 3
	for bx in range(2 * w / 3 + 2, w - 1):
		_set_tile(grid, furn, bx, boat_y, Tile.BOAT, w, h)
		_set_tile(grid, furn, bx, boat_y + 2, Tile.BOAT, w, h)
	_set_tile(grid, furn, 2 * w / 3 + 2, boat_y + 1, Tile.BOAT, w, h)
	_set_tile(grid, furn, w - 2, boat_y + 1, Tile.BOAT, w, h)


static func _generate_market(grid: Array, fd: Array, wd: Array, furn: Array, w: int, h: int) -> void:
	# Cobblestone
	_fill_rect(grid, fd, 0, 0, w, h, Tile.COBBLESTONE, w, h)
	# Market stalls along the top and bottom thirds
	var stall_count := maxi(w / 6, 2)
	for i in range(stall_count):
		var sx := 2 + i * (w / stall_count)
		# Top row of stalls
		_set_tile(grid, furn, sx, 1, Tile.AWNING, w, h)
		_set_tile(grid, furn, sx + 1, 1, Tile.AWNING, w, h)
		_set_tile(grid, furn, sx, 2, Tile.MARKET_STALL, w, h)
		_set_tile(grid, furn, sx + 1, 2, Tile.MARKET_STALL, w, h)
		# Bottom row of stalls
		_set_tile(grid, furn, sx, h - 3, Tile.MARKET_STALL, w, h)
		_set_tile(grid, furn, sx + 1, h - 3, Tile.MARKET_STALL, w, h)
		_set_tile(grid, furn, sx, h - 4, Tile.AWNING, w, h)
		_set_tile(grid, furn, sx + 1, h - 4, Tile.AWNING, w, h)
	# Crates near stalls
	_set_tile(grid, furn, 1, 3, Tile.CRATE, w, h)
	_set_tile(grid, furn, w - 2, 3, Tile.CRATE, w, h)
	_set_tile(grid, furn, 1, h - 4, Tile.CRATE, w, h)


static func _generate_hotel(grid: Array, fd: Array, wd: Array, furn: Array, w: int, h: int) -> void:
	_fill_rect(grid, fd, 0, 0, w, h, Tile.CARPET, w, h)
	_add_walls_border(grid, wd, w, h, [Vector2i(w / 2, h - 1)])
	# Lobby tile floor in lower portion
	_fill_rect(grid, fd, 1, 2 * h / 3, w - 2, h / 3 - 1, Tile.TILE_FLOOR, w, h)
	# Reception desk
	_fill_rect(grid, furn, w / 2 - 2, 2 * h / 3 + 1, 5, 1, Tile.RECEPTION_DESK, w, h)
	# Elevator
	_set_tile(grid, furn, w - 3, 2 * h / 3, Tile.ELEVATOR, w, h)
	# Room doors along the top hallway
	var hallway_y := h / 3
	# Hallway corridor
	_fill_rect(grid, fd, 1, hallway_y, w - 2, 2, Tile.CARPET, w, h)
	# Rooms above the hallway
	var room_width := maxi(w / 5, 3)
	var room_count := maxi((w - 2) / (room_width + 1), 2)
	for i in range(room_count):
		var rx := 2 + i * (room_width + 1)
		# Door
		_set_tile(grid, wd, rx + room_width / 2, hallway_y, Tile.DOOR, w, h)
		# Internal walls between rooms
		if i > 0:
			for ry in range(1, hallway_y):
				_set_tile(grid, wd, rx - 1, ry, Tile.WALL, w, h)
		# Bed inside room
		_set_tile(grid, furn, rx + 1, hallway_y - 2, Tile.BED, w, h)
		_set_tile(grid, furn, rx + 2, hallway_y - 2, Tile.BED, w, h)
