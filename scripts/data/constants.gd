class_name Constants

# Time
const LOOP_DURATION: float = 600.0 # 10 minutes in seconds
const TIME_TICK_INTERVAL: float = 1.0
const FINAL_COUNTDOWN_START: float = 540.0 # Last 60 seconds

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
