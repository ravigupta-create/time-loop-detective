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

	if not is_loaded:
		EventBus.game_started.emit()


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
