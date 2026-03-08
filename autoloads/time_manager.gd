extends Node
## 10-minute clock (0-600s), loop counter, reset orchestration.

var current_time: float = 0.0
var loop_number: int = 1
var is_running: bool = false
var time_scale: float = 1.0

var _tick_accumulator: float = 0.0
var _current_time_of_day: int = Enums.TimeOfDay.DAWN


func _ready() -> void:
	EventBus.game_started.connect(_on_game_started)
	EventBus.game_paused.connect(_on_game_paused)
	EventBus.game_resumed.connect(_on_game_resumed)


func _process(delta: float) -> void:
	if not is_running:
		return

	current_time += delta * time_scale
	GameState.total_play_time += delta

	# Tick every second
	_tick_accumulator += delta * time_scale
	if _tick_accumulator >= Constants.TIME_TICK_INTERVAL:
		_tick_accumulator -= Constants.TIME_TICK_INTERVAL
		EventBus.time_tick.emit(current_time)
		_check_time_of_day()

	# Countdown warning
	if current_time >= Constants.FINAL_COUNTDOWN_START:
		EventBus.loop_ending_soon.emit(Constants.LOOP_DURATION - current_time)

	# Loop reset
	if current_time >= Constants.LOOP_DURATION:
		_trigger_loop_reset()


func _on_game_started() -> void:
	is_running = true


func _on_game_paused() -> void:
	is_running = false


func _on_game_resumed() -> void:
	is_running = true


func start_loop() -> void:
	current_time = 0.0
	_tick_accumulator = 0.0
	_current_time_of_day = Enums.TimeOfDay.DAWN
	is_running = true


func _trigger_loop_reset() -> void:
	is_running = false
	loop_number += 1
	GameState.current_loop = loop_number
	EventBus.loop_reset.emit(loop_number)
	# TransitionManager handles the visual reset, then calls start_loop
	TransitionManager.play_loop_reset()


func get_time_of_day() -> int:
	if current_time < Constants.MORNING_START:
		return Enums.TimeOfDay.DAWN
	elif current_time < Constants.MIDDAY_START:
		return Enums.TimeOfDay.MORNING
	elif current_time < Constants.AFTERNOON_START:
		return Enums.TimeOfDay.MIDDAY
	elif current_time < Constants.GOLDEN_HOUR_START:
		return Enums.TimeOfDay.AFTERNOON
	elif current_time < Constants.SUNSET_START:
		return Enums.TimeOfDay.GOLDEN_HOUR
	elif current_time < Constants.EVENING_START:
		return Enums.TimeOfDay.SUNSET
	elif current_time < Constants.NIGHT_START:
		return Enums.TimeOfDay.EVENING
	else:
		return Enums.TimeOfDay.NIGHT


func get_formatted_time() -> String:
	# Map 0-600s to 6:00 AM - 11:59 PM (18 game hours)
	var game_hours := 6.0 + (current_time / Constants.LOOP_DURATION) * 18.0
	var hours := int(game_hours)
	var minutes := int((game_hours - hours) * 60.0)
	var period := "AM" if hours < 12 else "PM"
	var display_hours := hours % 12
	if display_hours == 0:
		display_hours = 12
	return "%d:%02d %s" % [display_hours, minutes, period]


func get_progress() -> float:
	return current_time / Constants.LOOP_DURATION


func _check_time_of_day() -> void:
	var new_tod := get_time_of_day()
	if new_tod != _current_time_of_day:
		_current_time_of_day = new_tod
		EventBus.time_of_day_changed.emit(new_tod)
