extends Control
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
var _weather_label: Label
var _weather_icon: Label
var _clue_counter: Label
var _follow_indicator: Label
var _follow_panel: Panel
var _crime_alert_panel: Panel
var _crime_alert_label: Label
var _crime_active: bool = false
var _minimap_legend_panel: Panel
var _minimap_legend_visible: bool = false
var _conspiracy_bar: ProgressBar
var _conspiracy_label: Label
var _difficulty_badge: Label
var _discovery_counter: Label
var _discoveries_this_loop: int = 0

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
	process_mode = Node.PROCESS_MODE_ALWAYS
	add_to_group("hud")

	_build_location_display()
	_build_loop_clock_display()
	_build_weather_display()
	_build_clue_counter()
	_build_follow_indicator()
	_build_crime_alert()
	_build_interaction_prompt()
	_build_minimap()
	_build_minimap_legend()
	_build_conspiracy_meter()
	_build_discovery_counter()
	_build_notification_panel()
	_setup_notification_timer()

	# Connect EventBus signals
	EventBus.time_tick.connect(_on_time_tick)
	EventBus.conspiracy_progress_changed.connect(_on_conspiracy_changed)
	EventBus.player_entered_location.connect(_on_player_entered_location)
	EventBus.clue_discovered.connect(_on_clue_discovered)
	EventBus.notification_queued.connect(_on_notification_queued)
	EventBus.crime_started.connect(_on_crime_started)
	EventBus.crime_completed.connect(_on_crime_completed)
	EventBus.loop_reset.connect(_on_loop_reset)
	EventBus.loop_ending_soon.connect(_on_loop_ending_soon)
	EventBus.npc_arrived_at_location.connect(_on_npc_arrived_at_location)
	EventBus.minimap_updated.connect(_on_minimap_updated)
	EventBus.dialogue_started.connect(_on_dialogue_started)
	EventBus.dialogue_ended.connect(_on_dialogue_ended)
	EventBus.notebook_opened.connect(_on_notebook_opened)
	EventBus.notebook_closed.connect(_on_notebook_closed)
	EventBus.weather_changed.connect(_on_weather_changed)
	EventBus.conspiracy_milestone_reached.connect(_on_milestone_reached)
	EventBus.player_started_following.connect(_on_player_started_following)
	EventBus.player_stopped_following.connect(_on_player_stopped_following)


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

	# Difficulty badge — right of the location panel
	var diff_colors := [
		Color(0.3, 0.8, 0.3),   # Easy = green
		Color(0.92, 0.87, 0.78), # Normal = white/cream
		Color(0.85, 0.72, 0.20), # Medium = gold
		Color(0.9, 0.5, 0.2),   # Hard = orange
		Color(0.9, 0.2, 0.15),  # Extreme = red
	]
	var diff_bg := Panel.new()
	diff_bg.position = Vector2(168, 4)
	diff_bg.size = Vector2(54, 14)
	var diff_style := StyleBoxFlat.new()
	diff_style.bg_color = COLOR_HUD_BG
	diff_style.set_border_width_all(1)
	diff_style.border_color = diff_colors[clampi(GameState.difficulty, 0, 4)]
	diff_style.set_corner_radius_all(2)
	diff_style.set_content_margin_all(1)
	diff_bg.add_theme_stylebox_override("panel", diff_style)
	add_child(diff_bg)

	_difficulty_badge = Label.new()
	_difficulty_badge.text = Constants.DIFFICULTY_NAMES.get(GameState.difficulty, "Medium")
	_difficulty_badge.position = Vector2(2, 0)
	_difficulty_badge.size = Vector2(50, 12)
	_difficulty_badge.add_theme_font_size_override("font_size", 7)
	_difficulty_badge.add_theme_color_override("font_color", diff_colors[clampi(GameState.difficulty, 0, 4)])
	_difficulty_badge.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	diff_bg.add_child(_difficulty_badge)


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


func _build_weather_display() -> void:
	# Top-center: weather indicator
	var weather_bg := Panel.new()
	weather_bg.position = Vector2(280, 4)
	weather_bg.size = Vector2(70, 18)
	var wbg_style := StyleBoxFlat.new()
	wbg_style.bg_color = COLOR_HUD_BG
	wbg_style.set_border_width_all(1)
	wbg_style.border_color = COLOR_HUD_BORDER
	wbg_style.set_corner_radius_all(2)
	wbg_style.set_content_margin_all(2)
	weather_bg.add_theme_stylebox_override("panel", wbg_style)
	add_child(weather_bg)

	_weather_icon = Label.new()
	_weather_icon.text = "\u2600"
	_weather_icon.position = Vector2(3, -1)
	_weather_icon.size = Vector2(20, 18)
	_weather_icon.add_theme_font_size_override("font_size", 12)
	_weather_icon.add_theme_color_override("font_color", Color(0.9, 0.85, 0.4))
	weather_bg.add_child(_weather_icon)

	_weather_label = Label.new()
	_weather_label.text = "Clear"
	_weather_label.position = Vector2(22, 1)
	_weather_label.size = Vector2(44, 14)
	_weather_label.add_theme_font_size_override("font_size", 7)
	_weather_label.add_theme_color_override("font_color", COLOR_TEXT_DIM)
	weather_bg.add_child(_weather_label)


func _build_clue_counter() -> void:
	var bg := Panel.new()
	bg.position = Vector2(226, 4)
	bg.size = Vector2(50, 18)
	var bg_style := StyleBoxFlat.new()
	bg_style.bg_color = COLOR_HUD_BG
	bg_style.set_border_width_all(1)
	bg_style.border_color = COLOR_HUD_BORDER
	bg_style.set_corner_radius_all(2)
	bg_style.set_content_margin_all(2)
	bg.add_theme_stylebox_override("panel", bg_style)
	add_child(bg)

	_clue_counter = Label.new()
	_clue_counter.text = "%d" % GameState.discovered_clues.size()
	_clue_counter.position = Vector2(4, 1)
	_clue_counter.size = Vector2(42, 14)
	_clue_counter.add_theme_font_size_override("font_size", 8)
	_clue_counter.add_theme_color_override("font_color", Color(0.85, 0.72, 0.20))
	_clue_counter.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	bg.add_child(_clue_counter)


func _build_follow_indicator() -> void:
	_follow_panel = Panel.new()
	_follow_panel.position = Vector2(220, 26)
	_follow_panel.size = Vector2(200, 16)
	_follow_panel.visible = false
	var style := StyleBoxFlat.new()
	style.bg_color = Color(0.06, 0.08, 0.12, 0.85)
	style.set_border_width_all(1)
	style.border_color = Color(0.3, 0.5, 0.8)
	style.set_corner_radius_all(2)
	style.set_content_margin_all(2)
	_follow_panel.add_theme_stylebox_override("panel", style)
	add_child(_follow_panel)

	_follow_indicator = Label.new()
	_follow_indicator.text = ""
	_follow_indicator.position = Vector2(4, 0)
	_follow_indicator.size = Vector2(192, 14)
	_follow_indicator.add_theme_font_size_override("font_size", 7)
	_follow_indicator.add_theme_color_override("font_color", Color(0.5, 0.7, 1.0))
	_follow_indicator.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_follow_panel.add_child(_follow_indicator)


func _build_crime_alert() -> void:
	_crime_alert_panel = Panel.new()
	_crime_alert_panel.position = Vector2(250, 44)
	_crime_alert_panel.size = Vector2(140, 18)
	_crime_alert_panel.visible = false
	var style := StyleBoxFlat.new()
	style.bg_color = Color(0.15, 0.02, 0.02, 0.9)
	style.set_border_width_all(1)
	style.border_color = Color(0.9, 0.2, 0.15)
	style.set_corner_radius_all(2)
	style.set_content_margin_all(2)
	_crime_alert_panel.add_theme_stylebox_override("panel", style)
	add_child(_crime_alert_panel)

	_crime_alert_label = Label.new()
	_crime_alert_label.text = "CRIME ACTIVE"
	_crime_alert_label.position = Vector2(4, 1)
	_crime_alert_label.size = Vector2(132, 14)
	_crime_alert_label.add_theme_font_size_override("font_size", 8)
	_crime_alert_label.add_theme_color_override("font_color", Color(0.9, 0.2, 0.15))
	_crime_alert_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_crime_alert_panel.add_child(_crime_alert_label)


func _build_conspiracy_meter() -> void:
	# Bottom-left: conspiracy progress meter
	var bg := Panel.new()
	bg.position = Vector2(4, 310)
	bg.size = Vector2(120, 26)
	var bg_style := StyleBoxFlat.new()
	bg_style.bg_color = COLOR_HUD_BG
	bg_style.set_border_width_all(1)
	bg_style.border_color = COLOR_HUD_BORDER
	bg_style.set_corner_radius_all(2)
	bg_style.set_content_margin_all(2)
	bg.add_theme_stylebox_override("panel", bg_style)
	add_child(bg)

	_conspiracy_label = Label.new()
	_conspiracy_label.text = "CONSPIRACY"
	_conspiracy_label.position = Vector2(4, 1)
	_conspiracy_label.size = Vector2(112, 10)
	_conspiracy_label.add_theme_font_size_override("font_size", 6)
	_conspiracy_label.add_theme_color_override("font_color", COLOR_TEXT_DIM)
	_conspiracy_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	bg.add_child(_conspiracy_label)

	_conspiracy_bar = ProgressBar.new()
	_conspiracy_bar.position = Vector2(4, 14)
	_conspiracy_bar.size = Vector2(112, 8)
	_conspiracy_bar.min_value = 0.0
	_conspiracy_bar.max_value = 100.0
	_conspiracy_bar.value = GameState.conspiracy_progress
	_conspiracy_bar.show_percentage = false
	var bar_bg := StyleBoxFlat.new()
	bar_bg.bg_color = COLOR_PROGRESS_BG
	bar_bg.set_corner_radius_all(1)
	_conspiracy_bar.add_theme_stylebox_override("background", bar_bg)
	var bar_fill := StyleBoxFlat.new()
	bar_fill.bg_color = Color(0.6, 0.3, 0.7)
	bar_fill.set_corner_radius_all(1)
	_conspiracy_bar.add_theme_stylebox_override("fill", bar_fill)
	bg.add_child(_conspiracy_bar)


func _build_discovery_counter() -> void:
	# Bottom-left above conspiracy: discoveries this loop
	_discovery_counter = Label.new()
	_discovery_counter.text = ""
	_discovery_counter.position = Vector2(4, 295)
	_discovery_counter.size = Vector2(120, 12)
	_discovery_counter.add_theme_font_size_override("font_size", 7)
	_discovery_counter.add_theme_color_override("font_color", Color(0.85, 0.72, 0.20, 0.8))
	_discovery_counter.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	add_child(_discovery_counter)


func _build_minimap_legend() -> void:
	_minimap_legend_panel = Panel.new()
	_minimap_legend_panel.position = Vector2(420, 277)
	_minimap_legend_panel.size = Vector2(108, 79)
	_minimap_legend_panel.visible = false
	var style := StyleBoxFlat.new()
	style.bg_color = COLOR_MINIMAP_BG
	style.set_border_width_all(1)
	style.border_color = COLOR_MINIMAP_BORDER
	style.set_corner_radius_all(2)
	style.set_content_margin_all(3)
	_minimap_legend_panel.add_theme_stylebox_override("panel", style)
	add_child(_minimap_legend_panel)

	var y_off := 2
	var npc_names := {
		"frank_deluca": "Frank", "maria_santos": "Maria",
		"detective_hale": "Hale", "iris_chen": "Iris",
		"victor_crane": "Victor", "penny_marsh": "Penny",
		"dr_eleanor_solomon": "Eleanor", "nina_volkov": "Nina",
		"mayor_aldridge": "Mayor", "tommy_reeves": "Tommy",
	}
	for npc_id in npc_names:
		var dot := ColorRect.new()
		dot.position = Vector2(4, y_off + 1)
		dot.size = Vector2(5, 5)
		dot.color = NPC_DOT_COLORS.get(npc_id, Color.GRAY)
		_minimap_legend_panel.add_child(dot)
		var lbl := Label.new()
		lbl.text = npc_names[npc_id]
		lbl.position = Vector2(12, y_off - 1)
		lbl.size = Vector2(90, 8)
		lbl.add_theme_font_size_override("font_size", 5)
		lbl.add_theme_color_override("font_color", COLOR_TEXT_DIM)
		_minimap_legend_panel.add_child(lbl)
		y_off += 7


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
	var loop_dur: float = float(Constants.get_dp("loop_duration", GameState.difficulty))
	var countdown_start: float = loop_dur - float(Constants.get_dp("countdown_offset", GameState.difficulty))
	if current_time >= countdown_start and not _clock_warning:
		_clock_warning = true
		_clock_label.add_theme_color_override("font_color", COLOR_CLOCK_WARNING)
		# Change progress bar fill to red
		var warning_fill := StyleBoxFlat.new()
		warning_fill.bg_color = COLOR_PROGRESS_WARNING
		warning_fill.set_corner_radius_all(1)
		_progress_bar.add_theme_stylebox_override("fill", warning_fill)

	# Recalculate NPC positions from schedules for minimap
	_update_minimap_npc_positions(current_time)

	# Update player dot position based on current location
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
	_minimap_player_pos = loc_positions.get(_current_location_id, Vector2(0.5, 0.5))

	# Refresh minimap
	_minimap_canvas.queue_redraw()


func _update_minimap_npc_positions(current_time: float) -> void:
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
	var all_ids := [
		Constants.NPC_FRANK, Constants.NPC_MARIA, Constants.NPC_HALE,
		Constants.NPC_IRIS, Constants.NPC_VICTOR, Constants.NPC_PENNY,
		Constants.NPC_ELEANOR, Constants.NPC_NINA, Constants.NPC_MAYOR,
		Constants.NPC_TOMMY
	]
	for npc_id in all_ids:
		var schedule := ScheduleEvaluator.get_schedule_for_npc(npc_id)
		var eval_result := ScheduleEvaluator.evaluate(npc_id, current_time, schedule)
		var npc_loc: int = eval_result.get("location", -1)
		_minimap_npc_positions[npc_id] = loc_positions.get(npc_loc, Vector2(0.5, 0.5))


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
	_clue_counter.text = "%d" % GameState.discovered_clues.size()
	_play_clue_sparkle()
	_discoveries_this_loop += 1
	_discovery_counter.text = "%d new this loop" % _discoveries_this_loop


func _on_notification_queued(text: String, icon: String) -> void:
	_queue_notification(text, icon)


func _on_crime_started(crime_id: String, _crime_type: int) -> void:
	_crime_active = true
	_crime_alert_panel.visible = true
	_queue_notification("Something is happening nearby...", "crime")


func _on_crime_completed(_crime_id: String, _outcome: String = "") -> void:
	_crime_active = false
	_crime_alert_panel.visible = false


func _on_loop_reset(loop_number: int) -> void:
	_loop_label.text = "Loop %d" % loop_number
	_progress_bar.value = 0.0
	_clock_warning = false
	_clock_label.add_theme_color_override("font_color", COLOR_CLOCK_NORMAL)
	_clue_counter.text = "%d" % GameState.discovered_clues.size()
	_follow_panel.visible = false
	_crime_active = false
	_crime_alert_panel.visible = false
	_discoveries_this_loop = 0
	_discovery_counter.text = ""

	# Reset progress bar fill color
	var normal_fill := StyleBoxFlat.new()
	normal_fill.bg_color = COLOR_PROGRESS_FILL
	normal_fill.set_corner_radius_all(1)
	_progress_bar.add_theme_stylebox_override("fill", normal_fill)


func _on_conspiracy_changed(new_value: int) -> void:
	if _conspiracy_bar:
		_conspiracy_bar.value = new_value
		# Change fill color by tier
		var fill := StyleBoxFlat.new()
		fill.set_corner_radius_all(1)
		if new_value >= 75:
			fill.bg_color = Color(0.9, 0.2, 0.15)  # Red
		elif new_value >= 50:
			fill.bg_color = Color(0.8, 0.3, 0.6)  # Hot pink
		elif new_value >= 25:
			fill.bg_color = Color(0.6, 0.3, 0.7)  # Purple
		else:
			fill.bg_color = Color(0.45, 0.38, 0.55)  # Dim purple
		_conspiracy_bar.add_theme_stylebox_override("fill", fill)


func _on_loop_ending_soon(seconds_remaining: float) -> void:
	# Pulse clock label intensity based on remaining time
	if seconds_remaining <= 30.0:
		var pulse := absf(sin(Time.get_ticks_msec() * 0.003 * TAU))
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


func _on_weather_changed(weather_type: int) -> void:
	match weather_type:
		Enums.WeatherType.CLEAR:
			_weather_icon.text = "\u2600"
			_weather_icon.add_theme_color_override("font_color", Color(0.9, 0.85, 0.4))
			_weather_label.text = "Clear"
		Enums.WeatherType.OVERCAST:
			_weather_icon.text = "\u2601"
			_weather_icon.add_theme_color_override("font_color", Color(0.6, 0.6, 0.65))
			_weather_label.text = "Overcast"
		Enums.WeatherType.RAIN:
			_weather_icon.text = "\u2602"
			_weather_icon.add_theme_color_override("font_color", Color(0.4, 0.5, 0.7))
			_weather_label.text = "Rain"
		Enums.WeatherType.FOG:
			_weather_icon.text = "\u2591"
			_weather_icon.add_theme_color_override("font_color", Color(0.7, 0.7, 0.75))
			_weather_label.text = "Fog"


func _on_milestone_reached(milestone_id: String, _tier: int) -> void:
	_flash_milestone(_tier)
	match milestone_id:
		"familiar_faces":
			_queue_notification("Milestone: Familiar Faces", "clue")
		"following_money":
			_queue_notification("Milestone: Following the Money", "clue")
		"the_device":
			_queue_notification("Milestone: The Device", "clue")
		"the_truth":
			_queue_notification("Milestone: The Truth", "clue")


func _on_player_started_following(npc_id: String) -> void:
	var npc_name: String = npc_id.replace("_", " ").capitalize()
	_follow_indicator.text = "Following: %s" % npc_name
	_follow_panel.visible = true


func _on_player_stopped_following() -> void:
	_follow_panel.visible = false


func _process(_delta: float) -> void:
	# Pulse the crime alert when active
	if _crime_active and _crime_alert_panel.visible:
		var pulse := 0.5 + 0.5 * sin(Time.get_ticks_msec() * 0.004)
		_crime_alert_label.modulate.a = 0.5 + pulse * 0.5
		var style: StyleBoxFlat = _crime_alert_panel.get_theme_stylebox("panel") as StyleBoxFlat
		if style:
			style.border_color = Color(0.9, 0.2, 0.15, 0.5 + pulse * 0.5)


func _input(event: InputEvent) -> void:
	# Toggle minimap legend with L key
	if event is InputEventKey and event.pressed and not event.echo:
		if event.keycode == KEY_L:
			_minimap_legend_visible = not _minimap_legend_visible
			_minimap_legend_panel.visible = _minimap_legend_visible


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


func update_interaction_target(interactable_type: String, target_name: String) -> void:
	match interactable_type:
		"npc":
			show_interaction_prompt("Talk to %s" % target_name if not target_name.is_empty() else "Press E to talk")
		"evidence":
			show_interaction_prompt("Inspect %s" % target_name if not target_name.is_empty() else "Press E to inspect")
		"door":
			show_interaction_prompt("Enter %s" % target_name if not target_name.is_empty() else "Press E to enter")
		"object":
			show_interaction_prompt("Examine %s" % target_name if not target_name.is_empty() else "Press E to examine")
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

	# Differentiated notification SFX
	match icon_type:
		"crime":
			EventBus.sfx_requested.emit("crime_alert")
		"clue":
			EventBus.sfx_requested.emit("discovery_jingle")
		_:
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
# Visual Effects
# ---------------------------------------------------------------------------

func _play_clue_sparkle() -> void:
	var sparkle := CPUParticles2D.new()
	sparkle.emitting = true
	sparkle.one_shot = true
	sparkle.amount = 12
	sparkle.lifetime = 0.8
	sparkle.explosiveness = 0.9
	sparkle.direction = Vector2(0, -1)
	sparkle.spread = 180.0
	sparkle.gravity = Vector2(0, 20)
	sparkle.initial_velocity_min = 30.0
	sparkle.initial_velocity_max = 60.0
	sparkle.color = Color(0.85, 0.72, 0.20, 0.9)
	sparkle.scale_amount_min = 0.5
	sparkle.scale_amount_max = 1.5
	# Position near clue counter (top area, around x=205, y=13)
	sparkle.position = Vector2(205, 13)
	add_child(sparkle)
	# Self-cleanup
	var timer := get_tree().create_timer(1.5)
	timer.timeout.connect(sparkle.queue_free)


func _flash_milestone(tier: int) -> void:
	var flash := ColorRect.new()
	flash.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	flash.mouse_filter = Control.MOUSE_FILTER_IGNORE
	match tier:
		0:
			flash.color = Color(0.85, 0.72, 0.20, 0.4)  # Gold
		1:
			flash.color = Color(0.6, 0.3, 0.7, 0.4)  # Purple
		2:
			flash.color = Color(0.9, 0.2, 0.15, 0.4)  # Red
		_:
			flash.color = Color(0.85, 0.72, 0.20, 0.4)  # Gold default
	add_child(flash)
	var tween := create_tween()
	tween.tween_property(flash, "color:a", 0.0, 0.6).set_trans(Tween.TRANS_EXPO).set_ease(Tween.EASE_OUT)
	tween.tween_callback(flash.queue_free)


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
