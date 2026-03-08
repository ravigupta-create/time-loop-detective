class_name Constants

# Difficulty
enum Difficulty { EASY, MEDIUM, HARD, EXTREME }
const DIFFICULTY_NAMES := {0: "Easy", 1: "Medium", 2: "Hard", 3: "Extreme"}
const DIFFICULTY_PARAMS := {
	"loop_duration":     [720.0, 600.0, 480.0, 360.0],
	"countdown_offset":  [120.0, 60.0, 45.0, 30.0],
	"min_crimes":        [1, 2, 3, 4],
	"max_crimes":        [2, 3, 4, 5],
	"conspiracy_mult":   [8, 5, 3, 2],
	"tier_1":            [15, 25, 35, 45],
	"tier_2":            [35, 50, 65, 75],
	"tier_3":            [55, 75, 85, 92],
	"tier_4":            [70, 90, 95, 100],
	"crime_jitter":      [15.0, 30.0, 60.0, 90.0],
	"max_evidence":      [99, 99, 2, 2],
	"auto_lie_detect":   [true, true, false, false],
	"adapt_shift":       [30.0, 60.0, 90.0, 120.0],
}

static func get_dp(key: String, diff: int) -> Variant:
	return DIFFICULTY_PARAMS[key][clampi(diff, 0, 3)]

# Time
const LOOP_DURATION: float = 600.0 # 10 minutes in seconds (default/fallback)
const TIME_TICK_INTERVAL: float = 1.0
const FINAL_COUNTDOWN_START: float = 540.0 # Last 60 seconds (default/fallback)

# Player
const PLAYER_SPEED: float = 120.0
const INTERACTION_RADIUS: float = 48.0
const CAMERA_SMOOTHING: float = 0.08
const FOLLOW_DISTANCE: float = 64.0

# Display
const NATIVE_WIDTH: int = 640
const NATIVE_HEIGHT: int = 360

# NPC
const NPC_SPEED: float = 80.0
const NPC_SPRITE_WIDTH: int = 16
const NPC_SPRITE_HEIGHT: int = 24
const NPC_COUNT: int = 10

# Crimes
const MIN_CRIMES_PER_LOOP: int = 2
const MAX_CRIMES_PER_LOOP: int = 3

# Conspiracy
const CONSPIRACY_MAX: int = 100
const CONSPIRACY_TIER_1: int = 25
const CONSPIRACY_TIER_2: int = 50
const CONSPIRACY_TIER_3: int = 75
const CONSPIRACY_TIER_4: int = 90

# Save
const SAVE_PATH: String = "user://detective_save.json"
const SAVE_BACKUP_PATH: String = "user://detective_save_backup.json"

# Weather
const WEATHER_CLEAR_WEIGHT: float = 0.50
const WEATHER_OVERCAST_WEIGHT: float = 0.20
const WEATHER_RAIN_WEIGHT: float = 0.20
const WEATHER_FOG_WEIGHT: float = 0.10

# NPC Interaction
const NPC_INTERACTION_DURATION: float = 20.0
const NPC_INTERACTION_COOLDOWN: float = 60.0

# Locations
const LOCATION_NAMES: Dictionary = {
	Enums.LocationID.APARTMENT_COMPLEX: "Apartment Complex",
	Enums.LocationID.CAFE_ROSETTA: "Cafe Rosetta",
	Enums.LocationID.BAR_CROSSROADS: "Bar Crossroads",
	Enums.LocationID.RIVERSIDE_PARK: "Riverside Park",
	Enums.LocationID.CITY_HALL: "City Hall",
	Enums.LocationID.BACK_ALLEY: "Back Alley",
	Enums.LocationID.POLICE_STATION: "Police Station",
	Enums.LocationID.DOCKS: "The Docks",
	Enums.LocationID.STREET_MARKET: "Street Market",
	Enums.LocationID.HOTEL_MARLOW: "Hotel Marlow"
}

# NPC IDs
const NPC_FRANK: String = "frank_deluca"
const NPC_MARIA: String = "maria_santos"
const NPC_HALE: String = "detective_hale"
const NPC_IRIS: String = "iris_chen"
const NPC_VICTOR: String = "victor_crane"
const NPC_PENNY: String = "penny_marsh"
const NPC_ELEANOR: String = "dr_eleanor_solomon"
const NPC_NINA: String = "nina_volkov"
const NPC_MAYOR: String = "mayor_aldridge"
const NPC_TOMMY: String = "tommy_reeves"

# Time of day thresholds (in loop seconds)
const DAWN_START: float = 0.0
const MORNING_START: float = 75.0
const MIDDAY_START: float = 150.0
const AFTERNOON_START: float = 225.0
const GOLDEN_HOUR_START: float = 375.0
const SUNSET_START: float = 450.0
const EVENING_START: float = 500.0
const NIGHT_START: float = 540.0

# Colors for time of day
const TIME_COLORS: Dictionary = {
	"dawn": Color(1.0, 0.85, 0.7, 1.0),
	"morning": Color(1.0, 0.95, 0.9, 1.0),
	"midday": Color(1.0, 1.0, 1.0, 1.0),
	"afternoon": Color(1.0, 0.98, 0.95, 1.0),
	"golden_hour": Color(1.0, 0.88, 0.65, 1.0),
	"sunset": Color(0.95, 0.7, 0.5, 1.0),
	"evening": Color(0.6, 0.55, 0.7, 1.0),
	"night": Color(0.35, 0.35, 0.55, 1.0)
}

# Tile size
const TILE_SIZE: int = 16
