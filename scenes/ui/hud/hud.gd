extends CanvasLayer
## In-game HUD: location name, loop clock, interaction prompt, minimap,
## and slide-in notification system. Built entirely programmatically.

# --- UI References ---
var _location_label: Label
var _loop_label: Label
var _clock_label: Label
var _progress_bar: ProgressBar
var _interaction_prompt: Label
var _minimap_container: Control
var _minimap_canvas: _MinimapDraw
var _notification_panel: Panel
var _notification_label: Label
var _notification_icon: ColorRect

# --- Notification Queue ---
var _notification_queue: Array[Dictionary] = []  # [{text, icon}]
var _notification_active: bool = false
var _notification_timer: Timer
var _notification_tween: Tween

# --- State ---
var _current_location_id: int = Enums.LocationID.APARTMENT_COMPLEX
var _interaction_text: String = ""
var _minimap_npc_positions: Dictionary = {}  # npc_id -> Vector2 (normalized 0-1)
var _minimap_player_pos: Vector2 = Vector2(0.5, 0.5)
var _clock_warning: bool = false

# Style colors
const COLOR_HUD_BG: Color = Color(0.06, 0.04, 0.02, 0.75)
const COLOR_HUD_BORDER: Color = Color(0.3, 0.25, 0.18)
const COLOR_TEXT: Color = Color(0.92, 0.87, 0.78)
const COLOR_TEXT_DIM: Color = Color(0.6, 0.55, 0.48)
const COLOR_CLOCK_NORMAL: Color = Color(0.92, 0.87, 0.78)
const COLOR_CLOCK_WARNING: Color = Color(0.9, 0.2, 0.15)
const COLOR_PROGRESS_BG: Color = Color(0.15, 0.12, 0.08)
const COLOR_PROGRESS_FILL: Color = Color(0.45, 0.38, 0.22)
const COLOR_PROGRESS_WARNING: Color = Color(0.8, 0.2, 0.15)
const COLOR_PROMPT: Color = Color(0.85, 0.82, 0.72)
const COLOR_NOTIFICATION_BG: Color = Color(0.1, 0.08, 0.04, 0.92)
const COLOR_NOTIFICATION_BORDER: Color = Color(0.85, 0.72, 0.20)
const COLOR_MINIMAP_BG: Color = Color(0.08, 0.06, 0.04, 0.8)
const COLOR_MINIMAP_BORDER: Color = Color(0.35, 0.3, 0.22)
const COLOR_PLAYER_DOT: Color = Color.WHITE

# NPC dot colors (same as notebook for consistency)
const NPC_DOT_COLORS: Dictionary = {
	"frank_deluca": Color(0.18, 0.18, 0.22),
	"maria_santos": Color(0.82, 0.72, 0.55),
	"detective_hale": Color(0.40, 0.35, 0.28),
	"iris_chen": Color(0.50, 0.55, 0.60),
	"victor_crane": Color(0.15, 0.15, 0.22),
	"penny_marsh": Color(0.30, 0.32, 0.35),
	"dr_eleanor_solomon": Color(0.92, 0.92, 0.95),
	"nina_volkov": Color(0.12, 0.10, 0.15),
	"mayor_aldridge": Color(0.14, 0.14, 0.25),
	"tommy_reeves": Color(0.35, 0.45, 0.55),
}


func _ready() -> void:
	layer = 10
	process_mode = Node.PROCESS_MODE_ALWAYS

	_build_location_display()
	_build_loop_clock_display()
	_build_interaction_prompt()
	_build_minimap()
	_build_notification_panel()
	_setup_notification_timer()

	# Connect EventBus signals
	EventBus.time_tick.connect(_on_time_tick)
	EventBus.player_entered_location.connect(_on_player_entered_location)
	EventBus.clue_discovered.connect(_on_clue_discovered)
	EventBus.notification_queued.connect(_on_notification_queued)
	EventBus.crime_started.connect(_on_crime_started)
	EventBus.loop_reset.connect(_on_loop_reset)
	EventBus.loop_ending_soon.connect(_on_loop_ending_soon)
	EventBus.npc_arrived_at_location.connect(_on_npc_arrived_at_location)
	EventBus.minimap_updated.connect(_on_minimap_updated)
	EventBus.dialogue_started.connect(_on_dialogue_started)
	EventBus.dialogue_ended.connect(_on_dialogue_ended)
	EventBus.notebook_opened.connect(_on_notebook_opened)
	EventBus.notebook_closed.connect(_on_notebook_closed)


# ---------------------------------------------------------------------------
# Build UI Elements
# ---------------------------------------------------------------------------

func _build_location_display() -> void:
	# Top-left: location name with subtle background
	var bg := Panel.new()
	bg.position = Vector2(4, 4)
	bg.size = Vector2(160, 18)
	var bg_style := StyleBoxFlat.new()
	bg_style.bg_color = COLOR_HUD_BG
	bg_style.set_border_width_all(1)
	bg_style.border_color = COLOR_HUD_BORDER
	bg_style.set_corner_radius_all(2)
	bg_style.set_content_margin_all(2)
	bg.add_theme_stylebox_override("panel", bg_style)
	add_child(bg)

	_location_label = Label.new()
	_location_label.text = Constants.LOCATION_NAMES.get(_current_location_id, "Unknown")
	_location_label.position = Vector2(4, 1)
	_location_label.size = Vector2(152, 14)
	_location_label.add_theme_font_size_override("font_size", 8)
	_location_label.add_theme_color_override("font_color", COLOR_TEXT)
	_location_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_location_label.clip_text = true
	bg.add_child(_location_label)


func _build_loop_clock_display() -> void:
	# Top-right: HBoxContainer with loop number, clock, progress bar
	var container := Panel.new()
	container.position = Vector2(440, 4)
	container.size = Vector2(196, 30)
	var bg_style := StyleBoxFlat.new()
	bg_style.bg_color = COLOR_HUD_BG
	bg_style.set_border_width_all(1)
	bg_style.border_color = COLOR_HUD_BORDER
	bg_style.set_corner_radius_all(2)
	bg_style.set_content_margin_all(2)
	container.add_theme_stylebox_override("panel", bg_style)
	add_child(container)

	var hbox := HBoxContainer.new()
	hbox.position = Vector2(4, 2)
	hbox.size = Vector2(188, 12)
	hbox.add_theme_constant_override("separation", 6)
	container.add_child(hbox)

	# Loop number
	_loop_label = Label.new()
	_loop_label.text = "Loop %d" % GameState.current_loop
	_loop_label.add_theme_font_size_override("font_size", 8)
	_loop_label.add_theme_color_override("font_color", COLOR_TEXT)
	_loop_label.custom_minimum_size = Vector2(50, 12)
	hbox.add_child(_loop_label)

	# Clock
	_clock_label = Label.new()
	_clock_label.text = TimeManager.get_formatted_time()
	_clock_label.add_theme_font_size_override("font_size", 8)
	_clock_label.add_theme_color_override("font_color", COLOR_CLOCK_NORMAL)
	_clock_label.custom_minimum_size = Vector2(60, 12)
	_clock_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	hbox.add_child(_clock_label)

	# Progress bar (loop progress)
	_progress_bar = ProgressBar.new()
	_progress_bar.position = Vector2(4, 18)
	_progress_bar.size = Vector2(188, 8)
	_progress_bar.min_value = 0.0
	_progress_bar.max_value = 1.0
	_progress_bar.value = 0.0
	_progress_bar.show_percentage = false

	# Style the progress bar
	var bar_bg := StyleBoxFlat.new()
	bar_bg.bg_color = COLOR_PROGRESS_BG
	bar_bg.set_corner_radius_all(1)
	_progress_bar.add_theme_stylebox_override("background", bar_bg)

	var bar_fill := StyleBoxFlat.new()
	bar_fill.bg_color = COLOR_PROGRESS_FILL
	bar_fill.set_corner_radius_all(1)
	_progress_bar.add_theme_stylebox_override("fill", bar_fill)

	container.add_child(_progress_bar)


func _build_interaction_prompt() -> void:
	# Bottom-center: interaction prompt
	var prompt_panel := Panel.new()
	prompt_panel.position = Vector2(220, 332)
	prompt_panel.size = Vector2(200, 20)
	prompt_panel.visible = false
	var prompt_style := StyleBoxFlat.new()
	prompt_style.bg_color = COLOR_HUD_BG
	prompt_style.set_border_width_all(1)
	prompt_style.border_color = COLOR_HUD_BORDER
	prompt_style.set_corner_radius_all(2)
	prompt_style.set_content_margin_all(2)
	prompt_panel.add_theme_stylebox_override("panel", prompt_style)
	add_child(prompt_panel)

	_interaction_prompt = Label.new()
	_interaction_prompt.text = ""
	_interaction_prompt.position = Vector2(2, 2)
	_interaction_prompt.size = Vector2(196, 14)
	_interaction_prompt.add_theme_font_size_override("font_size", 8)
	_interaction_prompt.add_theme_color_override("font_color", COLOR_PROMPT)
	_interaction_prompt.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	prompt_panel.add_child(_interaction_prompt)

	# Store reference to the panel for showing/hiding
	_interaction_prompt.set_meta("prompt_panel", prompt_panel)


func _build_minimap() -> void:
	# Bottom-right: minimap (100x75)
	_minimap_container = Panel.new()
	_minimap_container.position = Vector2(532, 277)
	_minimap_container.size = Vector2(104, 79)
	var mm_style := StyleBoxFlat.new()
	mm_style.bg_color = COLOR_MINIMAP_BG
	mm_style.set_border_width_all(1)
	mm_style.border_color = COLOR_MINIMAP_BORDER
	mm_style.set_corner_radius_all(2)
	mm_style.set_content_margin_all(2)
	_minimap_container.add_theme_stylebox_override("panel", mm_style)
	add_child(_minimap_container)

	# Minimap draw canvas
	_minimap_canvas = _MinimapDraw.new()
	_minimap_canvas.hud_ref = self
	_minimap_canvas.position = Vector2(2, 2)
	_minimap_canvas.size = Vector2(100, 75)
	_minimap_canvas.clip_contents = true
	_minimap_container.add_child(_minimap_canvas)

	# Minimap label
	var mm_label := Label.new()
	mm_label.text = "MAP"
	mm_label.add_theme_font_size_override("font_size", 5)
	mm_label.add_theme_color_override("font_color", COLOR_TEXT_DIM)
	mm_label.position = Vector2(2, 0)
	mm_label.size = Vector2(30, 8)
	_minimap_canvas.add_child(mm_label)


func _build_notification_panel() -> void:
	# Left-center: slide-in notification panel
	_notification_panel = Panel.new()
	_notification_panel.position = Vector2(-200, 140)  # Off-screen left
	_notification_panel.size = Vector2(190, 40)
	_notification_panel.visible = false
	var notif_style := StyleBoxFlat.new()
	notif_style.bg_color = COLOR_NOTIFICATION_BG
	notif_style.set_border_width_all(1)
	notif_style.border_color = COLOR_NOTIFICATION_BORDER
	notif_style.set_corner_radius_all(2)
	notif_style.set_content_margin_all(4)
	_notification_panel.add_theme_stylebox_override("panel", notif_style)
	add_child(_notification_panel)

	# Notification icon (small colored square)
	_notification_icon = ColorRect.new()
	_notification_icon.position = Vector2(4, 8)
	_notification_icon.size = Vector2(12, 12)
	_notification_icon.color = COLOR_NOTIFICATION_BORDER
	_notification_panel.add_child(_notification_icon)

	# Notification text
	_notification_label = Label.new()
	_notification_label.text = ""
	_notification_label.position = Vector2(20, 4)
	_notification_label.size = Vector2(164, 30)
	_notification_label.add_theme_font_size_override("font_size", 7)
	_notification_label.add_theme_color_override("font_color", COLOR_TEXT)
	_notification_label.autowrap_mode = TextServer.AUTOWRAP_WORD
	_notification_panel.add_child(_notification_label)


func _setup_notification_timer() -> void:
	_notification_timer = Timer.new()
	_notification_timer.wait_time = 3.0
	_notification_timer.one_shot = true
	_notification_timer.timeout.connect(_dismiss_notification)
	add_child(_notification_timer)


# ---------------------------------------------------------------------------
# Signal Handlers
# ---------------------------------------------------------------------------

func _on_time_tick(current_time: float) -> void:
	# Update clock display
	_clock_label.text = TimeManager.get_formatted_time()

	# Update progress bar
	_progress_bar.value = TimeManager.get_progress()

	# Check warning state
	if current_time >= Constants.FINAL_COUNTDOWN_START and not _clock_warning:
		_clock_warning = true
		_clock_label.add_theme_color_override("font_color", COLOR_CLOCK_WARNING)
		# Change progress bar fill to red
		var warning_fill := StyleBoxFlat.new()
		warning_fill.bg_color = COLOR_PROGRESS_WARNING
		warning_fill.set_corner_radius_all(1)
		_progress_bar.add_theme_stylebox_override("fill", warning_fill)

	# Refresh minimap periodically
	_minimap_canvas.queue_redraw()


func _on_player_entered_location(location_id: int) -> void:
	_current_location_id = location_id
	_location_label.text = Constants.LOCATION_NAMES.get(location_id, "Unknown")

	# Flash location label
	var tween := create_tween()
	tween.tween_property(_location_label, "modulate", Color(1.5, 1.3, 1.0), 0.15)
	tween.tween_property(_location_label, "modulate", Color.WHITE, 0.3)


func _on_clue_discovered(clue_id: String) -> void:
	var clue: Dictionary = GameState.discovered_clues.get(clue_id, {})
	var clue_title: String = clue.get("title", clue_id)
	_queue_notification("Clue found: %s" % clue_title, "clue")


func _on_notification_queued(text: String, icon: String) -> void:
	_queue_notification(text, icon)


func _on_crime_started(crime_id: String, _crime_type: int) -> void:
	_queue_notification("Something is happening nearby...", "crime")


func _on_loop_reset(loop_number: int) -> void:
	_loop_label.text = "Loop %d" % loop_number
	_progress_bar.value = 0.0
	_clock_warning = false
	_clock_label.add_theme_color_override("font_color", COLOR_CLOCK_NORMAL)

	# Reset progress bar fill color
	var normal_fill := StyleBoxFlat.new()
	normal_fill.bg_color = COLOR_PROGRESS_FILL
	normal_fill.set_corner_radius_all(1)
	_progress_bar.add_theme_stylebox_override("fill", normal_fill)


func _on_loop_ending_soon(seconds_remaining: float) -> void:
	# Pulse clock label intensity based on remaining time
	if seconds_remaining <= 30.0:
		var pulse := absf(sin(TimeManager.current_time * 4.0))
		var warning_color := COLOR_CLOCK_WARNING.lerp(Color.WHITE, pulse * 0.4)
		_clock_label.add_theme_color_override("font_color", warning_color)


func _on_npc_arrived_at_location(npc_id: String, location_id: int) -> void:
	# Update minimap NPC position based on location
	# Map locations to normalized minimap coordinates
	var loc_positions: Dictionary = {
		Enums.LocationID.APARTMENT_COMPLEX: Vector2(0.15, 0.2),
		Enums.LocationID.CAFE_ROSETTA: Vector2(0.35, 0.15),
		Enums.LocationID.BAR_CROSSROADS: Vector2(0.55, 0.25),
		Enums.LocationID.RIVERSIDE_PARK: Vector2(0.8, 0.12),
		Enums.LocationID.CITY_HALL: Vector2(0.5, 0.5),
		Enums.LocationID.BACK_ALLEY: Vector2(0.3, 0.6),
		Enums.LocationID.POLICE_STATION: Vector2(0.65, 0.55),
		Enums.LocationID.DOCKS: Vector2(0.9, 0.75),
		Enums.LocationID.STREET_MARKET: Vector2(0.4, 0.8),
		Enums.LocationID.HOTEL_MARLOW: Vector2(0.15, 0.85),
	}
	_minimap_npc_positions[npc_id] = loc_positions.get(location_id, Vector2(0.5, 0.5))
	_minimap_canvas.queue_redraw()

	# Record timeline entry
	GameState.record_timeline_entry(npc_id, location_id, "arrived")


func _on_minimap_updated() -> void:
	_minimap_canvas.queue_redraw()


func _on_dialogue_started(_npc_id: String) -> void:
	# Hide interaction prompt during dialogue
	hide_interaction_prompt()


func _on_dialogue_ended(_npc_id: String) -> void:
	pass


func _on_notebook_opened() -> void:
	# Dim the HUD slightly when notebook is open
	modulate = Color(0.5, 0.5, 0.5)


func _on_notebook_closed() -> void:
	modulate = Color.WHITE


# ---------------------------------------------------------------------------
# Interaction Prompt
# ---------------------------------------------------------------------------

func show_interaction_prompt(text: String) -> void:
	_interaction_text = text
	_interaction_prompt.text = text
	var panel: Panel = _interaction_prompt.get_meta("prompt_panel")
	if panel:
		panel.visible = true


func hide_interaction_prompt() -> void:
	_interaction_text = ""
	var panel: Panel = _interaction_prompt.get_meta("prompt_panel")
	if panel:
		panel.visible = false


func update_interaction_target(interactable_type: String, _target_name: String) -> void:
	match interactable_type:
		"npc":
			show_interaction_prompt("Press E to talk")
		"evidence":
			show_interaction_prompt("Press E to inspect")
		"door":
			show_interaction_prompt("Press E to enter")
		"object":
			show_interaction_prompt("Press E to examine")
		"":
			hide_interaction_prompt()
		_:
			show_interaction_prompt("Press E to interact")


# ---------------------------------------------------------------------------
# Notification System
# ---------------------------------------------------------------------------

func _queue_notification(text: String, icon: String) -> void:
	_notification_queue.append({"text": text, "icon": icon})
	if not _notification_active:
		_show_next_notification()


func _show_next_notification() -> void:
	if _notification_queue.is_empty():
		_notification_active = false
		return

	_notification_active = true
	var notif: Dictionary = _notification_queue.pop_front()
	_notification_label.text = notif.get("text", "")

	# Color the icon based on type
	var icon_type: String = notif.get("icon", "default")
	match icon_type:
		"clue":
			_notification_icon.color = Color(0.85, 0.72, 0.20)  # Gold
		"crime":
			_notification_icon.color = Color(0.9, 0.2, 0.15)  # Red
		"info":
			_notification_icon.color = Color(0.3, 0.6, 0.8)  # Blue
		_:
			_notification_icon.color = COLOR_NOTIFICATION_BORDER

	# Slide in from left
	_notification_panel.visible = true
	_notification_panel.position.x = -200.0

	if _notification_tween:
		_notification_tween.kill()
	_notification_tween = create_tween()
	_notification_tween.tween_property(_notification_panel, "position:x", 8.0, 0.3).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	_notification_tween.tween_callback(_notification_timer.start)

	EventBus.sfx_requested.emit("clue_discovered")


func _dismiss_notification() -> void:
	if _notification_tween:
		_notification_tween.kill()
	_notification_tween = create_tween()
	_notification_tween.tween_property(_notification_panel, "position:x", -200.0, 0.3).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_IN)
	_notification_tween.tween_callback(func():
		_notification_panel.visible = false
		_show_next_notification()
	)


# ---------------------------------------------------------------------------
# Minimap - inner draw class
# ---------------------------------------------------------------------------

func update_player_minimap_position(normalized_pos: Vector2) -> void:
	_minimap_player_pos = normalized_pos
	_minimap_canvas.queue_redraw()


class _MinimapDraw extends Control:
	var hud_ref: Node = null

	func _draw() -> void:
		if not hud_ref:
			return

		# Draw location markers as small dots
		var loc_positions: Dictionary = {
			Enums.LocationID.APARTMENT_COMPLEX: Vector2(0.15, 0.2),
			Enums.LocationID.CAFE_ROSETTA: Vector2(0.35, 0.15),
			Enums.LocationID.BAR_CROSSROADS: Vector2(0.55, 0.25),
			Enums.LocationID.RIVERSIDE_PARK: Vector2(0.8, 0.12),
			Enums.LocationID.CITY_HALL: Vector2(0.5, 0.5),
			Enums.LocationID.BACK_ALLEY: Vector2(0.3, 0.6),
			Enums.LocationID.POLICE_STATION: Vector2(0.65, 0.55),
			Enums.LocationID.DOCKS: Vector2(0.9, 0.75),
			Enums.LocationID.STREET_MARKET: Vector2(0.4, 0.8),
			Enums.LocationID.HOTEL_MARLOW: Vector2(0.15, 0.85),
		}

		# Draw connections between locations (simplified road map)
		var connections := [
			[Enums.LocationID.APARTMENT_COMPLEX, Enums.LocationID.CAFE_ROSETTA],
			[Enums.LocationID.CAFE_ROSETTA, Enums.LocationID.BAR_CROSSROADS],
			[Enums.LocationID.BAR_CROSSROADS, Enums.LocationID.RIVERSIDE_PARK],
			[Enums.LocationID.CAFE_ROSETTA, Enums.LocationID.CITY_HALL],
			[Enums.LocationID.CITY_HALL, Enums.LocationID.POLICE_STATION],
			[Enums.LocationID.CITY_HALL, Enums.LocationID.BACK_ALLEY],
			[Enums.LocationID.POLICE_STATION, Enums.LocationID.DOCKS],
			[Enums.LocationID.BACK_ALLEY, Enums.LocationID.STREET_MARKET],
			[Enums.LocationID.STREET_MARKET, Enums.LocationID.HOTEL_MARLOW],
			[Enums.LocationID.APARTMENT_COMPLEX, Enums.LocationID.HOTEL_MARLOW],
		]

		var map_size := size
		for conn in connections:
			var from_pos: Vector2 = loc_positions.get(conn[0], Vector2.ZERO) * map_size
			var to_pos: Vector2 = loc_positions.get(conn[1], Vector2.ZERO) * map_size
			draw_line(from_pos, to_pos, Color(0.25, 0.22, 0.18, 0.6), 1.0)

		# Draw location dots
		for loc_id in loc_positions:
			var pos: Vector2 = loc_positions[loc_id] * map_size
			var is_current: bool = (loc_id == hud_ref._current_location_id)
			var dot_color := Color(0.6, 0.55, 0.45) if not is_current else Color(0.85, 0.75, 0.55)
			var dot_radius := 3.0 if is_current else 2.0
			draw_circle(pos, dot_radius, dot_color)

		# Draw NPC dots
		for npc_id in hud_ref._minimap_npc_positions:
			var npc_pos: Vector2 = hud_ref._minimap_npc_positions[npc_id] * map_size
			var npc_color: Color = NPC_DOT_COLORS.get(npc_id, Color.GRAY)
			draw_circle(npc_pos, 2.0, npc_color)

		# Draw player dot (white, slightly larger)
		var player_pos: Vector2 = hud_ref._minimap_player_pos * map_size
		draw_circle(player_pos, 3.0, COLOR_PLAYER_DOT)
		# Pulsing ring around player
		var pulse := absf(sin(Time.get_ticks_msec() * 0.004))
		draw_arc(player_pos, 4.0 + pulse * 2.0, 0, TAU, 16, Color(1, 1, 1, 0.3 * (1.0 - pulse)), 1.0)
