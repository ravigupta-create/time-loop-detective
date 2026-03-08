extends Control
## Main menu: title screen with New Game, Continue, Settings, Quit.
## Animated dot-particle background. Built entirely programmatically.

# --- UI References ---
var _bg_canvas: _BackgroundCanvas
var _title_label: Label
var _subtitle_label: Label
var _button_container: VBoxContainer
var _difficulty_container: VBoxContainer
var _settings_panel: Panel
var _continue_button: Button

# Settings state
var _settings_visible: bool = false
var _master_volume: float = 1.0
var _music_volume: float = 0.8
var _sfx_volume: float = 1.0
var _text_speed: float = 0.03
var _minimap_enabled: bool = true

# Animated background particles
var _particles: Array[Dictionary] = []  # [{pos, vel, alpha, size}]
const PARTICLE_COUNT: int = 40

# Colors
const COLOR_BG: Color = Color(0.04, 0.03, 0.02)
const COLOR_TITLE: Color = Color(0.92, 0.87, 0.78)
const COLOR_TITLE_GLOW: Color = Color(0.85, 0.72, 0.20)
const COLOR_SUBTITLE: Color = Color(0.6, 0.55, 0.48)
const COLOR_BUTTON_NORMAL: Color = Color(0.12, 0.10, 0.08)
const COLOR_BUTTON_HOVER: Color = Color(0.2, 0.17, 0.12)
const COLOR_BUTTON_TEXT: Color = Color(0.92, 0.87, 0.78)
const COLOR_BUTTON_DISABLED: Color = Color(0.08, 0.07, 0.06)
const COLOR_BUTTON_DISABLED_TEXT: Color = Color(0.35, 0.32, 0.28)
const COLOR_ACCENT: Color = Color(0.85, 0.72, 0.20)
const COLOR_PANEL: Color = Color(0.08, 0.06, 0.04, 0.95)
const COLOR_PANEL_BORDER: Color = Color(0.35, 0.3, 0.22)
const COLOR_SLIDER_BG: Color = Color(0.15, 0.12, 0.08)
const COLOR_SLIDER_FILL: Color = Color(0.45, 0.38, 0.22)


var _clock_canvas: _ClockDraw
var _version_label: Label

func _ready() -> void:
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_STOP

	_init_particles()
	_build_background()
	_build_title()
	_build_clock_visual()
	_build_buttons()
	_build_settings_panel()
	_build_version_label()
	_play_intro_animation()


func _process(_delta: float) -> void:
	# Animate particles
	_update_particles(_delta)
	if _bg_canvas:
		_bg_canvas.queue_redraw()
	if _clock_canvas:
		_clock_canvas.queue_redraw()


# ---------------------------------------------------------------------------
# Particle System
# ---------------------------------------------------------------------------

func _init_particles() -> void:
	for i in PARTICLE_COUNT:
		_particles.append({
			"pos": Vector2(randf() * Constants.NATIVE_WIDTH, randf() * Constants.NATIVE_HEIGHT),
			"vel": Vector2(randf_range(-8.0, 8.0), randf_range(-4.0, -12.0)),
			"alpha": randf_range(0.1, 0.5),
			"size": randf_range(1.0, 3.0),
			"phase": randf() * TAU,  # For oscillation
		})


func _update_particles(delta: float) -> void:
	for p in _particles:
		p["pos"] += p["vel"] * delta
		# Gentle horizontal oscillation
		p["phase"] += delta * 1.5
		p["pos"].x += sin(p["phase"]) * 0.3

		# Wrap around screen
		if p["pos"].y < -10:
			p["pos"].y = Constants.NATIVE_HEIGHT + 10
			p["pos"].x = randf() * Constants.NATIVE_WIDTH
		if p["pos"].x < -10:
			p["pos"].x = Constants.NATIVE_WIDTH + 10
		elif p["pos"].x > Constants.NATIVE_WIDTH + 10:
			p["pos"].x = -10

		# Subtle alpha pulse
		p["alpha"] = 0.15 + 0.25 * absf(sin(p["phase"] * 0.8))


# ---------------------------------------------------------------------------
# Build UI
# ---------------------------------------------------------------------------

func _build_background() -> void:
	# Solid dark background
	var bg := ColorRect.new()
	bg.color = COLOR_BG
	bg.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(bg)

	# Custom draw canvas for particles
	_bg_canvas = _BackgroundCanvas.new()
	_bg_canvas.menu_ref = self
	_bg_canvas.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	_bg_canvas.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(_bg_canvas)


func _build_title() -> void:
	# Title: "TIME LOOP DETECTIVE"
	_title_label = Label.new()
	_title_label.text = "TIME LOOP DETECTIVE"
	_title_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_title_label.position = Vector2(0, 60)
	_title_label.size = Vector2(Constants.NATIVE_WIDTH, 40)
	_title_label.add_theme_font_size_override("font_size", 24)
	_title_label.add_theme_color_override("font_color", COLOR_TITLE)
	add_child(_title_label)

	# Subtitle
	_subtitle_label = Label.new()
	_subtitle_label.text = "Every loop reveals more truth."
	_subtitle_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_subtitle_label.position = Vector2(0, 100)
	_subtitle_label.size = Vector2(Constants.NATIVE_WIDTH, 16)
	_subtitle_label.add_theme_font_size_override("font_size", 8)
	_subtitle_label.add_theme_color_override("font_color", COLOR_SUBTITLE)
	add_child(_subtitle_label)

	# Decorative line under title
	var line := ColorRect.new()
	line.color = COLOR_ACCENT
	line.position = Vector2(240, 96)
	line.size = Vector2(160, 1)
	add_child(line)


func _build_buttons() -> void:
	_button_container = VBoxContainer.new()
	_button_container.position = Vector2(240, 248)
	_button_container.size = Vector2(160, 100)
	_button_container.add_theme_constant_override("separation", 6)
	add_child(_button_container)

	# New Game
	var new_game_btn := _create_menu_button("New Game")
	new_game_btn.pressed.connect(_on_new_game)
	_button_container.add_child(new_game_btn)

	# Continue
	_continue_button = _create_menu_button("Continue")
	var has_save := SaveManager.has_save()
	_continue_button.disabled = not has_save
	if not has_save:
		_continue_button.add_theme_color_override("font_color", COLOR_BUTTON_DISABLED_TEXT)
		var dis_style := StyleBoxFlat.new()
		dis_style.bg_color = COLOR_BUTTON_DISABLED
		dis_style.set_border_width_all(1)
		dis_style.border_color = Color(0.15, 0.13, 0.10)
		dis_style.set_corner_radius_all(2)
		dis_style.set_content_margin_all(4)
		_continue_button.add_theme_stylebox_override("disabled", dis_style)
	_continue_button.pressed.connect(_on_continue)
	_button_container.add_child(_continue_button)

	# Settings
	var settings_btn := _create_menu_button("Settings")
	settings_btn.pressed.connect(_on_settings)
	_button_container.add_child(settings_btn)

	# Quit
	var quit_btn := _create_menu_button("Quit")
	quit_btn.pressed.connect(_on_quit)
	_button_container.add_child(quit_btn)


func _create_menu_button(text: String) -> Button:
	var btn := Button.new()
	btn.text = text
	btn.custom_minimum_size = Vector2(160, 24)
	btn.add_theme_font_size_override("font_size", 10)
	btn.add_theme_color_override("font_color", COLOR_BUTTON_TEXT)
	btn.add_theme_color_override("font_hover_color", COLOR_ACCENT)

	var style_normal := StyleBoxFlat.new()
	style_normal.bg_color = COLOR_BUTTON_NORMAL
	style_normal.set_border_width_all(1)
	style_normal.border_color = COLOR_PANEL_BORDER
	style_normal.set_corner_radius_all(2)
	style_normal.set_content_margin_all(4)
	btn.add_theme_stylebox_override("normal", style_normal)

	var style_hover := StyleBoxFlat.new()
	style_hover.bg_color = COLOR_BUTTON_HOVER
	style_hover.set_border_width_all(1)
	style_hover.border_color = COLOR_ACCENT
	style_hover.set_corner_radius_all(2)
	style_hover.set_content_margin_all(4)
	btn.add_theme_stylebox_override("hover", style_hover)

	var style_pressed := StyleBoxFlat.new()
	style_pressed.bg_color = COLOR_BUTTON_HOVER.darkened(0.15)
	style_pressed.set_border_width_all(1)
	style_pressed.border_color = COLOR_ACCENT
	style_pressed.set_corner_radius_all(2)
	style_pressed.set_content_margin_all(4)
	btn.add_theme_stylebox_override("pressed", style_pressed)

	return btn


func _build_settings_panel() -> void:
	_settings_panel = Panel.new()
	_settings_panel.position = Vector2(140, 60)
	_settings_panel.size = Vector2(360, 240)
	_settings_panel.visible = false
	_settings_panel.z_index = 5
	var panel_style := StyleBoxFlat.new()
	panel_style.bg_color = COLOR_PANEL
	panel_style.set_border_width_all(2)
	panel_style.border_color = COLOR_PANEL_BORDER
	panel_style.set_corner_radius_all(3)
	panel_style.set_content_margin_all(8)
	_settings_panel.add_theme_stylebox_override("panel", panel_style)
	add_child(_settings_panel)

	# Settings title
	var settings_title := Label.new()
	settings_title.text = "Settings"
	settings_title.add_theme_font_size_override("font_size", 12)
	settings_title.add_theme_color_override("font_color", COLOR_TITLE)
	settings_title.position = Vector2(8, 8)
	settings_title.size = Vector2(340, 18)
	settings_title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_settings_panel.add_child(settings_title)

	var y_offset: float = 36.0

	# Master Volume
	y_offset = _add_slider_setting("Master Volume", y_offset, _master_volume, _on_master_volume_changed)

	# Music Volume
	y_offset = _add_slider_setting("Music Volume", y_offset, _music_volume, _on_music_volume_changed)

	# SFX Volume
	y_offset = _add_slider_setting("SFX Volume", y_offset, _sfx_volume, _on_sfx_volume_changed)

	# Text Speed
	y_offset = _add_slider_setting("Text Speed", y_offset, 1.0 - (_text_speed / 0.1), _on_text_speed_changed)

	# Minimap toggle
	y_offset += 8.0
	var minimap_hbox := HBoxContainer.new()
	minimap_hbox.position = Vector2(16, y_offset)
	minimap_hbox.size = Vector2(320, 18)
	minimap_hbox.add_theme_constant_override("separation", 8)
	_settings_panel.add_child(minimap_hbox)

	var minimap_label := Label.new()
	minimap_label.text = "Show Minimap"
	minimap_label.add_theme_font_size_override("font_size", 8)
	minimap_label.add_theme_color_override("font_color", COLOR_BUTTON_TEXT)
	minimap_label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	minimap_hbox.add_child(minimap_label)

	var minimap_check := CheckBox.new()
	minimap_check.button_pressed = _minimap_enabled
	minimap_check.add_theme_font_size_override("font_size", 8)
	minimap_check.toggled.connect(_on_minimap_toggled)
	minimap_hbox.add_child(minimap_check)

	y_offset += 28.0

	# Close button
	var close_btn := _create_menu_button("Close")
	close_btn.position = Vector2(100, y_offset)
	close_btn.size = Vector2(160, 24)
	close_btn.pressed.connect(_on_settings_close)
	_settings_panel.add_child(close_btn)


func _add_slider_setting(label_text: String, y_pos: float, initial_value: float, callback: Callable) -> float:
	var hbox := HBoxContainer.new()
	hbox.position = Vector2(16, y_pos)
	hbox.size = Vector2(320, 20)
	hbox.add_theme_constant_override("separation", 8)
	_settings_panel.add_child(hbox)

	var label := Label.new()
	label.text = label_text
	label.add_theme_font_size_override("font_size", 8)
	label.add_theme_color_override("font_color", COLOR_BUTTON_TEXT)
	label.custom_minimum_size = Vector2(90, 16)
	hbox.add_child(label)

	var slider := HSlider.new()
	slider.min_value = 0.0
	slider.max_value = 1.0
	slider.step = 0.05
	slider.value = initial_value
	slider.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	slider.custom_minimum_size = Vector2(160, 16)

	# Style the slider
	var slider_bg := StyleBoxFlat.new()
	slider_bg.bg_color = COLOR_SLIDER_BG
	slider_bg.set_corner_radius_all(2)
	slider_bg.content_margin_top = 6
	slider_bg.content_margin_bottom = 6
	slider.add_theme_stylebox_override("slider", slider_bg)

	var grabber_style := StyleBoxFlat.new()
	grabber_style.bg_color = COLOR_SLIDER_FILL
	grabber_style.set_corner_radius_all(2)
	slider.add_theme_stylebox_override("grabber_area", grabber_style)

	slider.value_changed.connect(callback)
	hbox.add_child(slider)

	var value_label := Label.new()
	value_label.text = "%d%%" % int(initial_value * 100)
	value_label.add_theme_font_size_override("font_size", 7)
	value_label.add_theme_color_override("font_color", COLOR_SUBTITLE)
	value_label.custom_minimum_size = Vector2(30, 16)
	value_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	value_label.set_meta("slider_value_label", true)
	slider.set_meta("value_label", value_label)
	slider.value_changed.connect(func(val: float):
		value_label.text = "%d%%" % int(val * 100)
	)
	hbox.add_child(value_label)

	return y_pos + 30.0


# ---------------------------------------------------------------------------
# Button Handlers
# ---------------------------------------------------------------------------

func _on_new_game() -> void:
	EventBus.sfx_requested.emit("interact")
	_show_difficulty_select()


func _show_difficulty_select() -> void:
	_button_container.visible = false
	if _clock_canvas:
		_clock_canvas.visible = false

	if _difficulty_container:
		_difficulty_container.queue_free()

	_difficulty_container = VBoxContainer.new()
	_difficulty_container.position = Vector2(170, 140)
	_difficulty_container.size = Vector2(300, 200)
	_difficulty_container.add_theme_constant_override("separation", 5)
	add_child(_difficulty_container)

	var title_lbl := Label.new()
	title_lbl.text = "SELECT DIFFICULTY"
	title_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title_lbl.add_theme_font_size_override("font_size", 12)
	title_lbl.add_theme_color_override("font_color", COLOR_TITLE)
	_difficulty_container.add_child(title_lbl)

	var spacer := Control.new()
	spacer.custom_minimum_size = Vector2(0, 4)
	_difficulty_container.add_child(spacer)

	var descriptions := [
		"Easy — Longer loops, more clues, auto lie detection",
		"Medium — The intended experience (Recommended)",
		"Hard — Shorter loops, more crimes, no lie hints",
		"Extreme — Minimal time, maximum chaos"
	]
	var colors := [
		Color(0.3, 0.8, 0.3),   # Green
		Color(0.85, 0.72, 0.20), # Gold
		Color(0.9, 0.5, 0.2),   # Orange
		Color(0.9, 0.2, 0.15),  # Red
	]

	for i in 4:
		var btn := _create_menu_button(descriptions[i])
		btn.add_theme_color_override("font_color", colors[i])
		btn.add_theme_color_override("font_hover_color", colors[i].lightened(0.3))
		btn.custom_minimum_size = Vector2(300, 28)
		btn.pressed.connect(_on_difficulty_chosen.bind(i))
		_difficulty_container.add_child(btn)

	var back_spacer := Control.new()
	back_spacer.custom_minimum_size = Vector2(0, 4)
	_difficulty_container.add_child(back_spacer)

	var back_btn := _create_menu_button("Back")
	back_btn.custom_minimum_size = Vector2(300, 24)
	back_btn.pressed.connect(_on_difficulty_back)
	_difficulty_container.add_child(back_btn)

	# Fade in
	_difficulty_container.modulate.a = 0.0
	var tween := create_tween()
	tween.tween_property(_difficulty_container, "modulate:a", 1.0, 0.25)


func _on_difficulty_chosen(level: int) -> void:
	EventBus.sfx_requested.emit("interact")
	GameState.difficulty = level
	if _difficulty_container:
		_difficulty_container.queue_free()
		_difficulty_container = null
	EventBus.game_started.emit()


func _on_difficulty_back() -> void:
	EventBus.sfx_requested.emit("interact")
	if _difficulty_container:
		_difficulty_container.queue_free()
		_difficulty_container = null
	_button_container.visible = true
	if _clock_canvas:
		_clock_canvas.visible = true


func _on_continue() -> void:
	if SaveManager.load_game():
		EventBus.sfx_requested.emit("interact")
		EventBus.game_loaded.emit()


func _on_settings() -> void:
	_settings_visible = not _settings_visible
	_settings_panel.visible = _settings_visible
	EventBus.sfx_requested.emit("interact")


func _on_settings_close() -> void:
	_settings_visible = false
	_settings_panel.visible = false
	EventBus.sfx_requested.emit("interact")


func _on_quit() -> void:
	get_tree().quit()


# ---------------------------------------------------------------------------
# Settings Callbacks
# ---------------------------------------------------------------------------

func _on_master_volume_changed(value: float) -> void:
	_master_volume = value
	AudioServer.set_bus_volume_db(AudioServer.get_bus_index("Master"), linear_to_db(value))


func _on_music_volume_changed(value: float) -> void:
	_music_volume = value
	AudioManager.music_volume = value


func _on_sfx_volume_changed(value: float) -> void:
	_sfx_volume = value
	AudioManager.sfx_volume = value


func _on_text_speed_changed(value: float) -> void:
	# Slider 0 = slow (0.1s), 1 = fast (0.01s)
	_text_speed = lerpf(0.1, 0.01, value)


func _on_minimap_toggled(enabled: bool) -> void:
	_minimap_enabled = enabled


# ---------------------------------------------------------------------------
# Clock Visual & Intro Animation
# ---------------------------------------------------------------------------

func _build_clock_visual() -> void:
	_clock_canvas = _ClockDraw.new()
	_clock_canvas.position = Vector2(286, 170)
	_clock_canvas.size = Vector2(68, 68)
	_clock_canvas.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_clock_canvas.modulate.a = 0.0
	add_child(_clock_canvas)
	move_child(_clock_canvas, _button_container.get_index())


func _build_version_label() -> void:
	_version_label = Label.new()
	_version_label.text = "v1.0  |  100% Procedural  |  Free Forever"
	_version_label.position = Vector2(0, 345)
	_version_label.size = Vector2(640, 12)
	_version_label.add_theme_font_size_override("font_size", 6)
	_version_label.add_theme_color_override("font_color", Color(0.35, 0.32, 0.28))
	_version_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	add_child(_version_label)


func _play_intro_animation() -> void:
	# Start everything invisible
	_title_label.modulate.a = 0.0
	_subtitle_label.modulate.a = 0.0
	_button_container.modulate.a = 0.0
	_version_label.modulate.a = 0.0

	# Find the decorative line
	var line: ColorRect = null
	for child in get_children():
		if child is ColorRect and child.size == Vector2(160, 1):
			line = child
			break
	if line:
		line.modulate.a = 0.0

	var tween := create_tween()
	# Title fades in
	tween.tween_property(_title_label, "modulate:a", 1.0, 0.8).set_delay(0.3)
	# Line sweeps in
	if line:
		tween.tween_property(line, "modulate:a", 1.0, 0.4).set_delay(0.1)
	# Subtitle
	tween.tween_property(_subtitle_label, "modulate:a", 1.0, 0.6).set_delay(0.1)
	# Clock
	tween.tween_property(_clock_canvas, "modulate:a", 0.35, 0.8).set_delay(0.1)
	# Buttons slide up from below
	_button_container.position.y += 20
	tween.tween_property(_button_container, "modulate:a", 1.0, 0.5).set_delay(0.1)
	tween.parallel().tween_property(_button_container, "position:y", 248.0, 0.5).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	# Version
	tween.tween_property(_version_label, "modulate:a", 1.0, 0.5).set_delay(0.2)


# ---------------------------------------------------------------------------
# Animated Background
# ---------------------------------------------------------------------------

class _BackgroundCanvas extends Control:
	var menu_ref: Control = null

	func _draw() -> void:
		if not menu_ref:
			return
		for p in menu_ref._particles:
			var pos: Vector2 = p["pos"]
			var alpha: float = p["alpha"]
			var sz: float = p["size"]
			var color := Color(0.85, 0.72, 0.20, alpha * 0.6)
			draw_circle(pos, sz, color)

		# Subtle connecting lines between nearby particles
		for i in menu_ref._particles.size():
			for j in range(i + 1, menu_ref._particles.size()):
				var dist := menu_ref._particles[i]["pos"].distance_to(menu_ref._particles[j]["pos"])
				if dist < 60.0:
					var line_alpha := (1.0 - dist / 60.0) * 0.15
					draw_line(
						menu_ref._particles[i]["pos"],
						menu_ref._particles[j]["pos"],
						Color(0.85, 0.72, 0.20, line_alpha),
						1.0
					)


class _ClockDraw extends Control:
	## Animated clock face for the main menu — ticking hands, gold accents.
	func _draw() -> void:
		var center := size / 2.0
		var radius := minf(size.x, size.y) * 0.45
		var gold := Color(0.85, 0.72, 0.20)
		var gold_dim := Color(0.85, 0.72, 0.20, 0.3)
		var t := Time.get_ticks_msec() / 1000.0

		# Outer ring
		draw_arc(center, radius, 0, TAU, 48, gold, 1.5)
		# Inner ring
		draw_arc(center, radius * 0.9, 0, TAU, 48, gold_dim, 0.5)

		# Hour marks
		for i in 12:
			var angle := float(i) / 12.0 * TAU - PI / 2.0
			var from := center + Vector2(cos(angle), sin(angle)) * radius * 0.78
			var to := center + Vector2(cos(angle), sin(angle)) * radius * 0.9
			var w := 1.5 if i % 3 == 0 else 0.8
			draw_line(from, to, gold, w)

		# Minute hand (spins slowly)
		var min_angle := fmod(t * 0.1, TAU) - PI / 2.0
		var min_end := center + Vector2(cos(min_angle), sin(min_angle)) * radius * 0.7
		draw_line(center, min_end, gold, 1.0)

		# Second hand (ticks every second)
		var sec_angle := fmod(t, 60.0) / 60.0 * TAU - PI / 2.0
		var sec_end := center + Vector2(cos(sec_angle), sin(sec_angle)) * radius * 0.8
		draw_line(center, sec_end, Color(0.9, 0.2, 0.15, 0.8), 0.5)

		# Center dot
		draw_circle(center, 2.0, gold)

		# Pulsing glow ring
		var pulse := 0.5 + 0.5 * sin(t * 2.0)
		draw_arc(center, radius + 2.0 + pulse * 3.0, 0, TAU, 32,
			Color(0.85, 0.72, 0.20, 0.1 * (1.0 - pulse)), 1.0)
