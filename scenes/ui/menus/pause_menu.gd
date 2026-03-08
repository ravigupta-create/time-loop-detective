extends Control
## Pause menu - triggered by Escape, provides Resume/Save/Settings/Main Menu.

var _overlay: ColorRect
var _panel: Panel
var _button_container: VBoxContainer
var _is_open: bool = false

const COLOR_OVERLAY := Color(0, 0, 0, 0.6)
const COLOR_PANEL := Color(0.08, 0.06, 0.1, 0.95)
const COLOR_BORDER := Color(0.3, 0.25, 0.4)
const COLOR_TITLE := Color(0.9, 0.2, 0.3)
const COLOR_BTN := Color(0.12, 0.1, 0.15)
const COLOR_BTN_HOVER := Color(0.2, 0.15, 0.25)
const COLOR_BTN_TEXT := Color(0.85, 0.8, 0.9)


func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	visible = false
	mouse_filter = MOUSE_FILTER_STOP

	_overlay = ColorRect.new()
	_overlay.color = COLOR_OVERLAY
	_overlay.set_anchors_preset(PRESET_FULL_RECT)
	add_child(_overlay)

	_panel = Panel.new()
	_panel.position = Vector2(220, 80)
	_panel.size = Vector2(200, 200)
	var style := StyleBoxFlat.new()
	style.bg_color = COLOR_PANEL
	style.set_border_width_all(1)
	style.border_color = COLOR_BORDER
	style.set_corner_radius_all(4)
	style.set_content_margin_all(8)
	_panel.add_theme_stylebox_override("panel", style)
	add_child(_panel)

	var title := Label.new()
	title.text = "PAUSED"
	title.add_theme_font_size_override("font_size", 14)
	title.add_theme_color_override("font_color", COLOR_TITLE)
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.position = Vector2(0, 10)
	title.size = Vector2(200, 24)
	_panel.add_child(title)

	var info := Label.new()
	info.text = "Loop %d" % GameState.current_loop
	info.add_theme_font_size_override("font_size", 8)
	info.add_theme_color_override("font_color", Color(0.6, 0.55, 0.7))
	info.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	info.position = Vector2(0, 32)
	info.size = Vector2(200, 14)
	_panel.add_child(info)

	_button_container = VBoxContainer.new()
	_button_container.position = Vector2(30, 52)
	_button_container.size = Vector2(140, 140)
	_button_container.add_theme_constant_override("separation", 5)
	_panel.add_child(_button_container)

	_add_button("Resume", _on_resume)
	_add_button("Notebook", _on_notebook)
	_add_button("Save Game", _on_save)
	_add_button("Main Menu", _on_main_menu)


func _input(event: InputEvent) -> void:
	if event.is_action_pressed("pause"):
		if _is_open:
			_close()
		else:
			_open()
		get_viewport().set_input_as_handled()


func _open() -> void:
	_is_open = true
	visible = true
	get_tree().paused = true
	EventBus.game_paused.emit()


func _close() -> void:
	_is_open = false
	visible = false
	get_tree().paused = false
	EventBus.game_resumed.emit()


func _add_button(text: String, callback: Callable) -> Button:
	var btn := Button.new()
	btn.text = text
	btn.custom_minimum_size = Vector2(140, 20)
	btn.add_theme_font_size_override("font_size", 9)
	btn.add_theme_color_override("font_color", COLOR_BTN_TEXT)
	var style := StyleBoxFlat.new()
	style.bg_color = COLOR_BTN
	style.set_border_width_all(1)
	style.border_color = COLOR_BORDER
	style.set_corner_radius_all(2)
	style.set_content_margin_all(3)
	btn.add_theme_stylebox_override("normal", style)
	var hover := StyleBoxFlat.new()
	hover.bg_color = COLOR_BTN_HOVER
	hover.set_border_width_all(1)
	hover.border_color = COLOR_TITLE
	hover.set_corner_radius_all(2)
	hover.set_content_margin_all(3)
	btn.add_theme_stylebox_override("hover", hover)
	btn.pressed.connect(callback)
	_button_container.add_child(btn)
	return btn


func _on_resume() -> void:
	_close()


func _on_notebook() -> void:
	_close()
	EventBus.notebook_opened.emit()


func _on_save() -> void:
	SaveManager.save_game()
	EventBus.notification_queued.emit("Game saved!", "info")


func _on_main_menu() -> void:
	_close()
	get_tree().paused = false
	get_tree().change_scene_to_file("res://scenes/main.tscn")
