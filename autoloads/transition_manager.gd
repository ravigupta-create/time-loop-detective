extends Node
## Screen fades, location transitions, loop reset dramatic animation.

var _canvas_layer: CanvasLayer
var _color_rect: ColorRect
var _tween: Tween
var is_transitioning: bool = false


func _ready() -> void:
	_canvas_layer = CanvasLayer.new()
	_canvas_layer.layer = 100
	add_child(_canvas_layer)

	_color_rect = ColorRect.new()
	_color_rect.color = Color(0, 0, 0, 0)
	_color_rect.anchors_preset = Control.PRESET_FULL_RECT
	_color_rect.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_canvas_layer.add_child(_color_rect)


func fade_to_black(duration: float = 0.5) -> void:
	if _tween:
		_tween.kill()
	is_transitioning = true
	_color_rect.mouse_filter = Control.MOUSE_FILTER_STOP
	_tween = create_tween()
	_tween.tween_property(_color_rect, "color:a", 1.0, duration)
	await _tween.finished


func fade_from_black(duration: float = 0.5) -> void:
	if _tween:
		_tween.kill()
	_tween = create_tween()
	_tween.tween_property(_color_rect, "color:a", 0.0, duration)
	_tween.tween_callback(func():
		is_transitioning = false
		_color_rect.mouse_filter = Control.MOUSE_FILTER_IGNORE
	)
	await _tween.finished


func transition_to_location(location_scene_path: String) -> void:
	is_transitioning = true
	EventBus.transition_started.emit("location")
	EventBus.sfx_requested.emit("door")
	await fade_to_black(0.3)
	EventBus.transition_midpoint.emit()

	# Load and switch scene
	var game_world := get_tree().current_scene
	if game_world and game_world.has_method("change_location"):
		game_world.change_location(location_scene_path)

	await fade_from_black(0.3)
	EventBus.transition_completed.emit()


func play_loop_reset() -> void:
	is_transitioning = true
	EventBus.transition_started.emit("loop_reset")
	AudioManager.stop_all()
	EventBus.sfx_requested.emit("loop_warning")

	# VHS rewind effect - flash and distort
	if _tween:
		_tween.kill()
	_tween = create_tween()

	# Rapid white flashes
	_color_rect.color = Color.WHITE
	for i in 5:
		_tween.tween_property(_color_rect, "color:a", 0.8, 0.08)
		_tween.tween_property(_color_rect, "color:a", 0.0, 0.08)

	# Hold on white
	_tween.tween_property(_color_rect, "color:a", 1.0, 0.3)
	_tween.tween_interval(0.5)

	# Fade to black then back
	_tween.tween_property(_color_rect, "color", Color(0, 0, 0, 1), 0.3)
	_tween.tween_callback(func():
		EventBus.transition_midpoint.emit()
	)
	_tween.tween_interval(0.8)
	_tween.tween_callback(func():
		_color_rect.color = Color(0, 0, 0, 1)
		TimeManager.start_loop()
	)
	_tween.tween_property(_color_rect, "color:a", 0.0, 1.0)
	_tween.tween_callback(func():
		is_transitioning = false
		_color_rect.mouse_filter = Control.MOUSE_FILTER_IGNORE
		EventBus.transition_completed.emit()
	)
