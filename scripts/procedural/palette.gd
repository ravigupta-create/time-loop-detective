class_name Palette
## Static color palette utilities for time-of-day modulation, NPC clothing,
## skin tones, and hair colors.


# ---------------------------------------------------------------------------
# Time-of-day modulation
# ---------------------------------------------------------------------------

## Maps Enums.TimeOfDay enum values to their string keys in Constants.TIME_COLORS.
static var _tod_keys: Dictionary = {
	Enums.TimeOfDay.DAWN:        "dawn",
	Enums.TimeOfDay.MORNING:     "morning",
	Enums.TimeOfDay.MIDDAY:      "midday",
	Enums.TimeOfDay.AFTERNOON:   "afternoon",
	Enums.TimeOfDay.GOLDEN_HOUR: "golden_hour",
	Enums.TimeOfDay.SUNSET:      "sunset",
	Enums.TimeOfDay.EVENING:     "evening",
	Enums.TimeOfDay.NIGHT:       "night",
}


## Returns the CanvasModulate tint color for a given TimeOfDay enum value.
static func get_time_color(time_of_day: int) -> Color:
	var key: String = _tod_keys.get(time_of_day, "midday")
	return Constants.TIME_COLORS.get(key, Color.WHITE)


## Linearly interpolates between two TimeOfDay colors.
## [param weight] 0.0 = from color, 1.0 = to color.
static func lerp_time_color(from_tod: int, to_tod: int, weight: float) -> Color:
	var from_color := get_time_color(from_tod)
	var to_color := get_time_color(to_tod)
	return from_color.lerp(to_color, clampf(weight, 0.0, 1.0))


# ---------------------------------------------------------------------------
# Skin tones  (6 diverse values)
# ---------------------------------------------------------------------------

static var _skin_tones: Array[Color] = [
	Color(0.96, 0.87, 0.77),   # light / fair
	Color(0.89, 0.75, 0.60),   # light-medium / peach
	Color(0.78, 0.61, 0.44),   # medium / olive
	Color(0.62, 0.44, 0.30),   # medium-dark / tan
	Color(0.45, 0.30, 0.20),   # dark / brown
	Color(0.33, 0.21, 0.14),   # deep dark / espresso
]


static func get_skin_tones() -> Array[Color]:
	return _skin_tones.duplicate()


# ---------------------------------------------------------------------------
# Hair colors  (12 colors)
# ---------------------------------------------------------------------------

static var _hair_colors: Array[Color] = [
	Color(0.10, 0.08, 0.06),   # jet black
	Color(0.20, 0.14, 0.10),   # dark brown
	Color(0.35, 0.22, 0.14),   # medium brown
	Color(0.52, 0.35, 0.20),   # light brown
	Color(0.70, 0.55, 0.30),   # dark blonde
	Color(0.88, 0.75, 0.45),   # light blonde
	Color(0.95, 0.90, 0.65),   # platinum blonde
	Color(0.60, 0.18, 0.12),   # auburn / red
	Color(0.80, 0.30, 0.10),   # ginger
	Color(0.55, 0.55, 0.55),   # gray
	Color(0.85, 0.85, 0.85),   # silver / white
	Color(0.25, 0.10, 0.30),   # dark purple-black
]


static func get_hair_colors() -> Array[Color]:
	return _hair_colors.duplicate()


# ---------------------------------------------------------------------------
# Job clothing palettes  [primary, secondary, accent]
# ---------------------------------------------------------------------------

static var _job_palettes: Dictionary = {
	"bartender":    [Color(0.18, 0.18, 0.22), Color(0.85, 0.85, 0.80), Color(0.55, 0.10, 0.10)],
	"cafe_owner":   [Color(0.82, 0.72, 0.55), Color(0.95, 0.92, 0.88), Color(0.55, 0.30, 0.15)],
	"detective":    [Color(0.40, 0.35, 0.28), Color(0.30, 0.28, 0.24), Color(0.70, 0.65, 0.55)],
	"journalist":   [Color(0.50, 0.55, 0.60), Color(0.35, 0.40, 0.50), Color(0.80, 0.25, 0.20)],
	"businessman":  [Color(0.15, 0.15, 0.22), Color(0.90, 0.90, 0.92), Color(0.55, 0.12, 0.12)],
	"pickpocket":   [Color(0.30, 0.32, 0.35), Color(0.22, 0.22, 0.25), Color(0.60, 0.60, 0.55)],
	"doctor":       [Color(0.92, 0.92, 0.95), Color(0.80, 0.82, 0.85), Color(0.20, 0.55, 0.35)],
	"mysterious":   [Color(0.12, 0.10, 0.15), Color(0.18, 0.15, 0.22), Color(0.45, 0.20, 0.50)],
	"mayor":        [Color(0.14, 0.14, 0.25), Color(0.90, 0.88, 0.82), Color(0.72, 0.60, 0.15)],
	"delivery":     [Color(0.35, 0.45, 0.55), Color(0.25, 0.32, 0.42), Color(0.85, 0.55, 0.15)],
}

# Fallback palette used when job string is not recognised.
static var _default_palette: Array = [Color(0.4, 0.4, 0.4), Color(0.6, 0.6, 0.6), Color(0.8, 0.8, 0.8)]


static func get_job_palette(job: String) -> Array[Color]:
	var raw: Array = _job_palettes.get(job, _default_palette)
	var result: Array[Color] = []
	for c in raw:
		result.append(c as Color)
	return result
