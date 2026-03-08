extends Node
## Root scene - manages game states (main menu, gameplay, etc.)

var game_world: Node2D = null
var main_menu: Control = null
var hud: CanvasLayer = null
var notebook: Control = null
var dialogue_box: Control = null
var pause_menu: Control = null

const GAME_WORLD_SCENE := preload("res://scenes/game_world.tscn")

var _is_game_running: bool = false
var _tutorial_layer: CanvasLayer = null
var _victory_layer: CanvasLayer = null


func _ready() -> void:
	# Create main menu
	_show_main_menu()

	EventBus.game_started.connect(_on_game_started)
	EventBus.game_loaded.connect(_on_game_loaded)


func _show_main_menu() -> void:
	_cleanup_game()

	main_menu = Control.new()
	main_menu.name = "MainMenu"
	main_menu.set_script(load("res://scenes/ui/menus/main_menu.gd"))
	main_menu.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(main_menu)


func _on_game_started() -> void:
	_start_game(false)


func _on_game_loaded() -> void:
	_start_game(true)


func _start_game(is_loaded: bool) -> void:
	# Remove main menu
	if main_menu:
		main_menu.queue_free()
		main_menu = null

	# Create game world
	game_world = GAME_WORLD_SCENE.instantiate()
	add_child(game_world)

	# Create HUD
	hud = CanvasLayer.new()
	hud.name = "HUDLayer"
	hud.layer = 10
	var hud_control := Control.new()
	hud_control.name = "HUD"
	hud_control.set_script(load("res://scenes/ui/hud/hud.gd"))
	hud_control.set_anchors_preset(Control.PRESET_FULL_RECT)
	hud.add_child(hud_control)
	add_child(hud)

	# Create Notebook (hidden by default)
	notebook = Control.new()
	notebook.name = "Notebook"
	notebook.set_script(load("res://scenes/ui/notebook/notebook.gd"))
	notebook.set_anchors_preset(Control.PRESET_FULL_RECT)
	notebook.visible = false
	var notebook_layer := CanvasLayer.new()
	notebook_layer.name = "NotebookLayer"
	notebook_layer.layer = 20
	notebook_layer.add_child(notebook)
	add_child(notebook_layer)

	# Create Dialogue Box (hidden by default)
	dialogue_box = Control.new()
	dialogue_box.name = "DialogueBox"
	dialogue_box.add_to_group("dialogue_box")
	dialogue_box.set_script(load("res://scenes/ui/dialogue/dialogue_box.gd"))
	dialogue_box.set_anchors_preset(Control.PRESET_FULL_RECT)
	dialogue_box.visible = false
	var dialogue_layer := CanvasLayer.new()
	dialogue_layer.name = "DialogueLayer"
	dialogue_layer.layer = 15
	dialogue_layer.add_child(dialogue_box)
	add_child(dialogue_layer)

	# Create Pause Menu (hidden by default)
	pause_menu = Control.new()
	pause_menu.name = "PauseMenu"
	pause_menu.set_script(load("res://scenes/ui/menus/pause_menu.gd"))
	pause_menu.set_anchors_preset(Control.PRESET_FULL_RECT)
	pause_menu.visible = false
	var pause_layer := CanvasLayer.new()
	pause_layer.name = "PauseLayer"
	pause_layer.layer = 50
	pause_layer.add_child(pause_menu)
	add_child(pause_layer)

	_is_game_running = true
	EventBus.endgame_victory.connect(_show_victory_screen)

	if not is_loaded:
		_show_tutorial()


func _cleanup_game() -> void:
	_is_game_running = false
	if game_world:
		game_world.queue_free()
		game_world = null
	if hud:
		hud.queue_free()
		hud = null
	if notebook:
		notebook.get_parent().queue_free()
		notebook = null
	if dialogue_box:
		dialogue_box.get_parent().queue_free()
		dialogue_box = null
	if pause_menu:
		pause_menu.get_parent().queue_free()
		pause_menu = null
	if _tutorial_layer:
		_tutorial_layer.queue_free()
		_tutorial_layer = null
	if _victory_layer:
		_victory_layer.queue_free()
		_victory_layer = null


# ---------------------------------------------------------------------------
# Tutorial Overlay
# ---------------------------------------------------------------------------

func _show_tutorial() -> void:
	get_tree().paused = true

	_tutorial_layer = CanvasLayer.new()
	_tutorial_layer.layer = 60
	_tutorial_layer.process_mode = Node.PROCESS_MODE_ALWAYS
	add_child(_tutorial_layer)

	# Semi-transparent overlay
	var overlay := ColorRect.new()
	overlay.set_anchors_preset(Control.PRESET_FULL_RECT)
	overlay.color = Color(0, 0, 0, 0.7)
	_tutorial_layer.add_child(overlay)

	# Centered panel
	var panel := Panel.new()
	panel.size = Vector2(440, 300)
	panel.position = Vector2(100, 30)
	var style := StyleBoxFlat.new()
	style.bg_color = Color(0.06, 0.04, 0.02, 0.95)
	style.set_border_width_all(2)
	style.border_color = Color(0.85, 0.72, 0.20)
	style.set_corner_radius_all(4)
	style.set_content_margin_all(12)
	panel.add_theme_stylebox_override("panel", style)
	_tutorial_layer.add_child(panel)

	# Title
	var title := Label.new()
	title.text = "TIME LOOP DETECTIVE"
	title.position = Vector2(12, 8)
	title.size = Vector2(416, 24)
	title.add_theme_font_size_override("font_size", 16)
	title.add_theme_color_override("font_color", Color(0.85, 0.72, 0.20))
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	panel.add_child(title)

	# Premise
	var premise := Label.new()
	premise.text = "You are trapped in a 10-minute time loop.\nObserve NPCs, gather clues, and uncover the conspiracy\nbefore the loop resets. Knowledge persists between loops."
	premise.position = Vector2(12, 40)
	premise.size = Vector2(416, 48)
	premise.add_theme_font_size_override("font_size", 8)
	premise.add_theme_color_override("font_color", Color(0.92, 0.87, 0.78))
	premise.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	panel.add_child(premise)

	# Controls table
	var controls := [
		["WASD", "Move around"],
		["E", "Interact / Talk"],
		["F", "Follow / Unfollow NPC"],
		["Tab", "Open Detective Notebook"],
		["L", "Toggle Minimap Legend"],
		["Esc", "Pause Menu"],
	]
	var y_off := 100
	for entry in controls:
		var key_label := Label.new()
		key_label.text = entry[0]
		key_label.position = Vector2(80, y_off)
		key_label.size = Vector2(80, 16)
		key_label.add_theme_font_size_override("font_size", 9)
		key_label.add_theme_color_override("font_color", Color(0.85, 0.72, 0.20))
		key_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
		panel.add_child(key_label)

		var desc_label := Label.new()
		desc_label.text = entry[1]
		desc_label.position = Vector2(180, y_off)
		desc_label.size = Vector2(200, 16)
		desc_label.add_theme_font_size_override("font_size", 9)
		desc_label.add_theme_color_override("font_color", Color(0.92, 0.87, 0.78))
		panel.add_child(desc_label)
		y_off += 22

	# Pulsing "Press any key" prompt
	var prompt := Label.new()
	prompt.text = "Press any key to begin..."
	prompt.position = Vector2(12, 260)
	prompt.size = Vector2(416, 20)
	prompt.add_theme_font_size_override("font_size", 10)
	prompt.add_theme_color_override("font_color", Color(0.85, 0.72, 0.20))
	prompt.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	panel.add_child(prompt)

	# Pulse animation
	var tween := create_tween().set_loops()
	tween.set_process_mode(Tween.TWEEN_PROCESS_IDLE)
	tween.tween_property(prompt, "modulate:a", 0.3, 0.8)
	tween.tween_property(prompt, "modulate:a", 1.0, 0.8)


func _unhandled_input(event: InputEvent) -> void:
	if _tutorial_layer and event is InputEventKey and event.pressed:
		_tutorial_layer.queue_free()
		_tutorial_layer = null
		get_tree().paused = false
		EventBus.game_started.emit()
		get_viewport().set_input_as_handled()


# ---------------------------------------------------------------------------
# Victory Screen
# ---------------------------------------------------------------------------

func _show_victory_screen() -> void:
	get_tree().paused = true
	AudioManager.stop_all()
	EventBus.sfx_requested.emit("victory")

	_victory_layer = CanvasLayer.new()
	_victory_layer.layer = 55
	_victory_layer.process_mode = Node.PROCESS_MODE_ALWAYS
	add_child(_victory_layer)

	# Dark background — fade in
	var bg := ColorRect.new()
	bg.set_anchors_preset(Control.PRESET_FULL_RECT)
	bg.color = Color(0, 0, 0, 0)
	_victory_layer.add_child(bg)

	var tween := create_tween()
	tween.set_process_mode(Tween.TWEEN_PROCESS_IDLE)
	tween.tween_property(bg, "color:a", 0.85, 1.5)

	# Title: "THE LOOP IS BROKEN"
	var title := Label.new()
	title.text = "THE LOOP IS BROKEN"
	title.set_anchors_preset(Control.PRESET_CENTER_TOP)
	title.position = Vector2(120, 60)
	title.size = Vector2(400, 30)
	title.add_theme_font_size_override("font_size", 20)
	title.add_theme_color_override("font_color", Color(0.85, 0.72, 0.20))
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.modulate.a = 0.0
	_victory_layer.add_child(title)
	tween.tween_property(title, "modulate:a", 1.0, 1.0).set_delay(1.0)

	# Subtitle
	var subtitle := Label.new()
	subtitle.text = "The conspiracy is exposed. The city is free."
	subtitle.position = Vector2(120, 100)
	subtitle.size = Vector2(400, 20)
	subtitle.add_theme_font_size_override("font_size", 10)
	subtitle.add_theme_color_override("font_color", Color(0.92, 0.87, 0.78))
	subtitle.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	subtitle.modulate.a = 0.0
	_victory_layer.add_child(subtitle)
	tween.tween_property(subtitle, "modulate:a", 1.0, 1.0).set_delay(2.0)

	# Stats
	var stats := Label.new()
	var loops: int = GameState.current_loop
	var clues: int = GameState.discovered_clues.size()
	var crimes: int = GameState.witnessed_crimes.size()
	stats.text = "Loops: %d  |  Clues: %d  |  Crimes Witnessed: %d" % [loops, clues, crimes]
	stats.position = Vector2(100, 130)
	stats.size = Vector2(440, 16)
	stats.add_theme_font_size_override("font_size", 9)
	stats.add_theme_color_override("font_color", Color(0.7, 0.65, 0.55))
	stats.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	stats.modulate.a = 0.0
	_victory_layer.add_child(stats)
	tween.tween_property(stats, "modulate:a", 1.0, 1.0).set_delay(3.0)

	# Scrolling credits
	var credits_text := """CAST

Frank DeLuca - Bar Owner
Maria Santos - Cafe Owner
Detective Hale - Police Detective
Iris Chen - Journalist
Victor Crane - Businessman
Penny Marsh - City Clerk
Dr. Eleanor Solomon - Researcher
Nina Volkov - Informant
Mayor Aldridge - City Mayor
Tommy Reeves - Dock Worker


Built with Godot Engine
100% Procedural - No External Assets
All Audio Generated at Runtime


Thank you for playing."""

	var credits := Label.new()
	credits.text = credits_text
	credits.position = Vector2(140, 380)
	credits.size = Vector2(360, 600)
	credits.add_theme_font_size_override("font_size", 9)
	credits.add_theme_color_override("font_color", Color(0.85, 0.80, 0.70))
	credits.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	credits.modulate.a = 0.0
	_victory_layer.add_child(credits)
	tween.tween_property(credits, "modulate:a", 1.0, 0.5).set_delay(4.0)
	tween.tween_property(credits, "position:y", -300.0, 12.0).set_delay(4.5).set_trans(Tween.TRANS_LINEAR)

	# "Return to Main Menu" button
	var menu_btn := Button.new()
	menu_btn.text = "Return to Main Menu"
	menu_btn.position = Vector2(230, 320)
	menu_btn.size = Vector2(180, 30)
	menu_btn.add_theme_font_size_override("font_size", 10)
	menu_btn.modulate.a = 0.0
	_victory_layer.add_child(menu_btn)
	tween.tween_property(menu_btn, "modulate:a", 1.0, 1.0).set_delay(14.0)

	menu_btn.pressed.connect(func():
		get_tree().paused = false
		get_tree().change_scene_to_file("res://scenes/main.tscn")
	)
