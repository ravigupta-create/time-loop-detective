class_name WeatherSystem
extends Node
## Per-loop weather system. Weather is randomly selected on each loop reset
## and affects NPC schedules, crime probability, and visuals.

## Static reference for ScheduleEvaluator to access without scene tree lookup.
static var instance: WeatherSystem = null

var current_weather: int = Enums.WeatherType.CLEAR
var _rng := RandomNumberGenerator.new()


func _ready() -> void:
	instance = self
	_rng.randomize()
	EventBus.loop_reset.connect(_on_loop_reset)
	EventBus.game_started.connect(_on_game_started)


func _on_game_started() -> void:
	_roll_weather()


func _on_loop_reset(_loop_number: int) -> void:
	_roll_weather()


func _roll_weather() -> void:
	var roll := _rng.randf()
	var threshold_clear := Constants.WEATHER_CLEAR_WEIGHT
	var threshold_overcast := threshold_clear + Constants.WEATHER_OVERCAST_WEIGHT
	var threshold_rain := threshold_overcast + Constants.WEATHER_RAIN_WEIGHT

	if roll < threshold_clear:
		current_weather = Enums.WeatherType.CLEAR
	elif roll < threshold_overcast:
		current_weather = Enums.WeatherType.OVERCAST
	elif roll < threshold_rain:
		current_weather = Enums.WeatherType.RAIN
	else:
		current_weather = Enums.WeatherType.FOG

	EventBus.weather_changed.emit(current_weather)
	print("[WeatherSystem] Weather set to %s" % get_weather_name())


func get_weather_name() -> String:
	match current_weather:
		Enums.WeatherType.CLEAR:
			return "Clear"
		Enums.WeatherType.OVERCAST:
			return "Overcast"
		Enums.WeatherType.RAIN:
			return "Rain"
		Enums.WeatherType.FOG:
			return "Fog"
	return "Unknown"


func get_weather_icon() -> String:
	match current_weather:
		Enums.WeatherType.CLEAR:
			return "SUN"
		Enums.WeatherType.OVERCAST:
			return "CLD"
		Enums.WeatherType.RAIN:
			return "RAN"
		Enums.WeatherType.FOG:
			return "FOG"
	return "?"


func is_outdoor_unfriendly() -> bool:
	return current_weather == Enums.WeatherType.RAIN or current_weather == Enums.WeatherType.FOG


func get_witness_modifier() -> float:
	## Returns a multiplier for witness chance. Rain/fog = fewer witnesses.
	match current_weather:
		Enums.WeatherType.CLEAR:
			return 1.0
		Enums.WeatherType.OVERCAST:
			return 0.9
		Enums.WeatherType.RAIN:
			return 0.6
		Enums.WeatherType.FOG:
			return 0.5
	return 1.0


func get_crime_modifier() -> float:
	## Returns a multiplier for crime success chance. Bad weather = easier crimes.
	match current_weather:
		Enums.WeatherType.CLEAR:
			return 1.0
		Enums.WeatherType.OVERCAST:
			return 1.1
		Enums.WeatherType.RAIN:
			return 1.3
		Enums.WeatherType.FOG:
			return 1.4
	return 1.0


func get_overlay_color() -> Color:
	match current_weather:
		Enums.WeatherType.CLEAR:
			return Color(1, 1, 1, 0)
		Enums.WeatherType.OVERCAST:
			return Color(0.5, 0.5, 0.55, 0.15)
		Enums.WeatherType.RAIN:
			return Color(0.3, 0.35, 0.45, 0.25)
		Enums.WeatherType.FOG:
			return Color(0.7, 0.7, 0.75, 0.35)
	return Color(1, 1, 1, 0)


## Returns true if the given location is an outdoor location affected by weather.
func is_outdoor_location(location_id: int) -> bool:
	match location_id:
		Enums.LocationID.RIVERSIDE_PARK:
			return true
		Enums.LocationID.STREET_MARKET:
			return true
		Enums.LocationID.DOCKS:
			return true
		Enums.LocationID.BACK_ALLEY:
			return true
	return false
