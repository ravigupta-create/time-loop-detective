extends Control
## 5-tab detective notebook UI: Clues, Profiles, Timeline, Board, Theories.
## Built entirely programmatically - no .tscn dependency.

# --- State ---
var current_tab: int = 0
var is_open: bool = false

# Board tab - dragging
var _board_dragging: bool = false
var _board_drag_target: Control = null
var _board_drag_offset: Vector2 = Vector2.ZERO
var _board_connecting: bool = false
var _board_connect_from: String = ""
var _board_connect_start_pos: Vector2 = Vector2.ZERO

# Profiles tab - selected NPC
var _selected_npc_id: String = ""

# Timeline tab
var _show_past_loops: bool = false

# --- UI References ---
var _background: ColorRect
var _notebook_panel: Panel
var _tab_bar: HBoxContainer
var _tab_buttons: Array[Button] = []
var _tab_container: Control
var _tab_pages: Array[Control] = []
var _close_button: Button

# Tab names
const TAB_NAMES: Array[String] = ["Clues", "Profiles", "Timeline", "Board", "Theories"]

# Style colors
const COLOR_BG: Color = Color(0.08, 0.06, 0.04, 0.85)
const COLOR_PAPER: Color = Color(0.92, 0.87, 0.78)
const COLOR_PAPER_DARK: Color = Color(0.82, 0.75, 0.65)
const COLOR_INK: Color = Color(0.15, 0.12, 0.10)
const COLOR_RED_ACCENT: Color = Color(0.75, 0.15, 0.12)
const COLOR_RED_DIM: Color = Color(0.55, 0.20, 0.18)
const COLOR_GOLD: Color = Color(0.85, 0.72, 0.20)
const COLOR_TAB_ACTIVE: Color = Color(0.92, 0.87, 0.78)
const COLOR_TAB_INACTIVE: Color = Color(0.65, 0.58, 0.48)
const COLOR_LOCKED: Color = Color(0.55, 0.52, 0.48)

# Category colors for clue filters
const CATEGORY_COLORS: Dictionary = {
	Enums.ClueCategory.TESTIMONY: Color(0.3, 0.5, 0.7),
	Enums.ClueCategory.PHYSICAL_EVIDENCE: Color(0.7, 0.4, 0.2),
	Enums.ClueCategory.OBSERVATION: Color(0.3, 0.65, 0.35),
	Enums.ClueCategory.DOCUMENT: Color(0.6, 0.55, 0.3),
	Enums.ClueCategory.DEDUCTION: Color(0.6, 0.3, 0.6),
	Enums.ClueCategory.CONTRADICTION: Color(0.75, 0.15, 0.12),
}

# NPC portrait colors (deterministic per NPC)
const NPC_COLORS: Dictionary = {
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

const NPC_DISPLAY_NAMES: Dictionary = {
	"frank_deluca": "Frank DeLuca",
	"maria_santos": "Maria Santos",
	"detective_hale": "Detective Hale",
	"iris_chen": "Iris Chen",
	"victor_crane": "Victor Crane",
	"penny_marsh": "Penny Marsh",
	"dr_eleanor_solomon": "Dr. Eleanor Solomon",
	"nina_volkov": "Nina Volkov",
	"mayor_aldridge": "Mayor Aldridge",
	"tommy_reeves": "Tommy Reeves",
}


func _ready() -> void:
	visible = false
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_STOP

	_build_background()
	_build_notebook_panel()
	_build_tab_bar()
	_build_tab_pages()
	_build_close_button()

	_switch_tab(0)

	# Connect signals
	EventBus.clue_discovered.connect(_on_clue_discovered)
	EventBus.clue_connection_made.connect(_on_connection_made)
	EventBus.theory_created.connect(_on_theory_created)


func _input(event: InputEvent) -> void:
	if event.is_action_pressed("notebook"):
		if is_open:
			close_notebook()
		else:
			open_notebook()
		get_viewport().set_input_as_handled()


func open_notebook() -> void:
	is_open = true
	visible = true
	get_tree().paused = true
	process_mode = Node.PROCESS_MODE_ALWAYS
	_refresh_current_tab()
	EventBus.notebook_opened.emit()
	EventBus.sfx_requested.emit("notebook_open")


func close_notebook() -> void:
	is_open = false
	visible = false
	get_tree().paused = false
	EventBus.notebook_closed.emit()


# ---------------------------------------------------------------------------
# Building the UI
# ---------------------------------------------------------------------------

func _build_background() -> void:
	_background = ColorRect.new()
	_background.color = COLOR_BG
	_background.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	_background.mouse_filter = Control.MOUSE_FILTER_STOP
	add_child(_background)


func _build_notebook_panel() -> void:
	_notebook_panel = Panel.new()
	var style := StyleBoxFlat.new()
	style.bg_color = COLOR_PAPER
	style.border_color = COLOR_PAPER_DARK
	style.set_border_width_all(2)
	style.set_corner_radius_all(2)
	style.set_content_margin_all(4)
	_notebook_panel.add_theme_stylebox_override("panel", style)

	# Centered, takes most of the screen (580x320 in a 640x360 viewport)
	_notebook_panel.position = Vector2(30, 12)
	_notebook_panel.size = Vector2(580, 336)
	add_child(_notebook_panel)


func _build_tab_bar() -> void:
	_tab_bar = HBoxContainer.new()
	_tab_bar.position = Vector2(4, 4)
	_tab_bar.size = Vector2(572, 20)
	_tab_bar.add_theme_constant_override("separation", 2)
	_notebook_panel.add_child(_tab_bar)

	for i in TAB_NAMES.size():
		var btn := Button.new()
		btn.text = TAB_NAMES[i]
		btn.custom_minimum_size = Vector2(110, 18)
		btn.size_flags_horizontal = Control.SIZE_EXPAND_FILL

		var style_normal := StyleBoxFlat.new()
		style_normal.bg_color = COLOR_TAB_INACTIVE
		style_normal.set_corner_radius_all(1)
		style_normal.corner_radius_bottom_left = 0
		style_normal.corner_radius_bottom_right = 0
		style_normal.set_content_margin_all(1)
		btn.add_theme_stylebox_override("normal", style_normal)

		var style_hover := StyleBoxFlat.new()
		style_hover.bg_color = COLOR_TAB_INACTIVE.lightened(0.15)
		style_hover.set_corner_radius_all(1)
		style_hover.corner_radius_bottom_left = 0
		style_hover.corner_radius_bottom_right = 0
		style_hover.set_content_margin_all(1)
		btn.add_theme_stylebox_override("hover", style_hover)

		var style_pressed := StyleBoxFlat.new()
		style_pressed.bg_color = COLOR_TAB_ACTIVE
		style_pressed.set_corner_radius_all(1)
		style_pressed.corner_radius_bottom_left = 0
		style_pressed.corner_radius_bottom_right = 0
		style_pressed.set_content_margin_all(1)
		btn.add_theme_stylebox_override("pressed", style_pressed)

		btn.add_theme_font_size_override("font_size", 8)
		btn.add_theme_color_override("font_color", COLOR_INK)
		btn.add_theme_color_override("font_hover_color", COLOR_INK)
		btn.add_theme_color_override("font_pressed_color", COLOR_INK)
		btn.pressed.connect(_switch_tab.bind(i))
		_tab_bar.add_child(btn)
		_tab_buttons.append(btn)


func _build_tab_pages() -> void:
	_tab_container = Control.new()
	_tab_container.position = Vector2(4, 26)
	_tab_container.size = Vector2(572, 306)
	_tab_container.clip_contents = true
	_notebook_panel.add_child(_tab_container)

	# Create one Control per tab
	for i in TAB_NAMES.size():
		var page := Control.new()
		page.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
		page.visible = false
		_tab_container.add_child(page)
		_tab_pages.append(page)


func _build_close_button() -> void:
	_close_button = Button.new()
	_close_button.text = "X"
	_close_button.position = Vector2(554, 4)
	_close_button.size = Vector2(18, 18)
	_close_button.add_theme_font_size_override("font_size", 8)
	_close_button.add_theme_color_override("font_color", COLOR_RED_ACCENT)
	var style := StyleBoxFlat.new()
	style.bg_color = COLOR_PAPER_DARK
	style.set_corner_radius_all(1)
	_close_button.add_theme_stylebox_override("normal", style)
	_close_button.pressed.connect(close_notebook)
	_notebook_panel.add_child(_close_button)


# ---------------------------------------------------------------------------
# Tab switching
# ---------------------------------------------------------------------------

func _switch_tab(tab_index: int) -> void:
	current_tab = tab_index
	for i in _tab_pages.size():
		_tab_pages[i].visible = (i == tab_index)
	# Update tab button styles
	for i in _tab_buttons.size():
		var btn := _tab_buttons[i]
		if i == tab_index:
			var style := StyleBoxFlat.new()
			style.bg_color = COLOR_TAB_ACTIVE
			style.set_corner_radius_all(1)
			style.corner_radius_bottom_left = 0
			style.corner_radius_bottom_right = 0
			style.set_content_margin_all(1)
			btn.add_theme_stylebox_override("normal", style)
		else:
			var style := StyleBoxFlat.new()
			style.bg_color = COLOR_TAB_INACTIVE
			style.set_corner_radius_all(1)
			style.corner_radius_bottom_left = 0
			style.corner_radius_bottom_right = 0
			style.set_content_margin_all(1)
			btn.add_theme_stylebox_override("normal", style)

	_refresh_current_tab()
	EventBus.sfx_requested.emit("interact")


func _refresh_current_tab() -> void:
	match current_tab:
		0: _build_clues_tab()
		1: _build_profiles_tab()
		2: _build_timeline_tab()
		3: _build_board_tab()
		4: _build_theories_tab()


# ---------------------------------------------------------------------------
# Tab 0 - Clues
# ---------------------------------------------------------------------------

var _clue_filter: int = -1  # -1 = all

func _build_clues_tab() -> void:
	var page := _tab_pages[0]
	_clear_children(page)

	# Filter bar
	var filter_bar := HBoxContainer.new()
	filter_bar.position = Vector2(0, 0)
	filter_bar.size = Vector2(572, 18)
	filter_bar.add_theme_constant_override("separation", 2)
	page.add_child(filter_bar)

	var all_btn := Button.new()
	all_btn.text = "All"
	all_btn.custom_minimum_size = Vector2(40, 16)
	all_btn.add_theme_font_size_override("font_size", 7)
	all_btn.add_theme_color_override("font_color", COLOR_INK)
	var all_style := StyleBoxFlat.new()
	all_style.bg_color = COLOR_PAPER_DARK if _clue_filter != -1 else COLOR_RED_ACCENT
	all_style.set_corner_radius_all(1)
	all_btn.add_theme_stylebox_override("normal", all_style)
	all_btn.pressed.connect(_set_clue_filter.bind(-1))
	filter_bar.add_child(all_btn)

	var category_names := {
		Enums.ClueCategory.TESTIMONY: "Testimony",
		Enums.ClueCategory.PHYSICAL_EVIDENCE: "Physical",
		Enums.ClueCategory.OBSERVATION: "Observed",
		Enums.ClueCategory.DOCUMENT: "Documents",
		Enums.ClueCategory.DEDUCTION: "Deductions",
		Enums.ClueCategory.CONTRADICTION: "Contradictions",
	}
	for cat_id in category_names:
		var cat_btn := Button.new()
		cat_btn.text = category_names[cat_id]
		cat_btn.custom_minimum_size = Vector2(68, 16)
		cat_btn.add_theme_font_size_override("font_size", 7)
		cat_btn.add_theme_color_override("font_color", COLOR_INK)
		var cat_style := StyleBoxFlat.new()
		cat_style.bg_color = CATEGORY_COLORS.get(cat_id, COLOR_PAPER_DARK) if _clue_filter == cat_id else COLOR_PAPER_DARK
		cat_style.set_corner_radius_all(1)
		cat_btn.add_theme_stylebox_override("normal", cat_style)
		cat_btn.pressed.connect(_set_clue_filter.bind(cat_id))
		filter_bar.add_child(cat_btn)

	# Clue count label
	var count_label := Label.new()
	var total := GameState.discovered_clues.size()
	count_label.text = "%d clue%s" % [total, "" if total == 1 else "s"]
	count_label.add_theme_font_size_override("font_size", 7)
	count_label.add_theme_color_override("font_color", COLOR_LOCKED)
	count_label.position = Vector2(490, 0)
	count_label.size = Vector2(80, 16)
	count_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	page.add_child(count_label)

	# Scrollable clue list
	var scroll := ScrollContainer.new()
	scroll.position = Vector2(0, 22)
	scroll.size = Vector2(572, 280)
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	page.add_child(scroll)

	var vbox := VBoxContainer.new()
	vbox.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	vbox.add_theme_constant_override("separation", 3)
	scroll.add_child(vbox)

	# Populate clues
	var clues: Dictionary = GameState.discovered_clues
	if clues.is_empty():
		var empty_label := Label.new()
		empty_label.text = "No clues discovered yet. Explore and investigate!"
		empty_label.add_theme_font_size_override("font_size", 8)
		empty_label.add_theme_color_override("font_color", COLOR_LOCKED)
		empty_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		vbox.add_child(empty_label)
	else:
		for clue_id in clues:
			var clue: Dictionary = clues[clue_id]
			var cat: int = clue.get("category", Enums.ClueCategory.OBSERVATION)

			# Apply filter
			if _clue_filter != -1 and cat != _clue_filter:
				continue

			var row := _create_clue_row(clue_id, clue)
			vbox.add_child(row)


func _create_clue_row(clue_id: String, clue: Dictionary) -> PanelContainer:
	var panel := PanelContainer.new()
	panel.custom_minimum_size = Vector2(560, 36)
	var panel_style := StyleBoxFlat.new()
	panel_style.bg_color = COLOR_PAPER.darkened(0.05)
	panel_style.set_border_width_all(1)
	panel_style.border_color = COLOR_PAPER_DARK
	panel_style.set_corner_radius_all(1)
	panel_style.set_content_margin_all(3)
	panel.add_theme_stylebox_override("panel", panel_style)

	var hbox := HBoxContainer.new()
	hbox.add_theme_constant_override("separation", 4)
	panel.add_child(hbox)

	# Category icon (colored square)
	var cat: int = clue.get("category", Enums.ClueCategory.OBSERVATION)
	var icon := ColorRect.new()
	icon.custom_minimum_size = Vector2(12, 12)
	icon.color = CATEGORY_COLORS.get(cat, COLOR_PAPER_DARK)
	hbox.add_child(icon)

	# Title and description
	var text_vbox := VBoxContainer.new()
	text_vbox.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	text_vbox.add_theme_constant_override("separation", 1)
	hbox.add_child(text_vbox)

	var title_label := Label.new()
	title_label.text = clue.get("title", clue_id)
	title_label.add_theme_font_size_override("font_size", 8)
	title_label.add_theme_color_override("font_color", COLOR_INK)
	text_vbox.add_child(title_label)

	var desc_label := Label.new()
	desc_label.text = clue.get("description", "")
	desc_label.add_theme_font_size_override("font_size", 7)
	desc_label.add_theme_color_override("font_color", COLOR_LOCKED)
	desc_label.autowrap_mode = TextServer.AUTOWRAP_WORD
	text_vbox.add_child(desc_label)

	# Importance stars
	var importance: int = clue.get("importance", 1)
	var stars_label := Label.new()
	var star_text := ""
	for i in 5:
		star_text += "*" if i < importance else "."
	stars_label.text = star_text
	stars_label.add_theme_font_size_override("font_size", 8)
	stars_label.add_theme_color_override("font_color", COLOR_GOLD)
	stars_label.custom_minimum_size = Vector2(36, 12)
	stars_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	hbox.add_child(stars_label)

	# Loop discovered
	var loop_label := Label.new()
	loop_label.text = "L%d" % clue.get("loop_discovered", 1)
	loop_label.add_theme_font_size_override("font_size", 7)
	loop_label.add_theme_color_override("font_color", COLOR_RED_DIM)
	loop_label.custom_minimum_size = Vector2(20, 12)
	loop_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	hbox.add_child(loop_label)

	return panel


func _set_clue_filter(category: int) -> void:
	_clue_filter = category
	_build_clues_tab()


# ---------------------------------------------------------------------------
# Tab 1 - Profiles
# ---------------------------------------------------------------------------

func _build_profiles_tab() -> void:
	var page := _tab_pages[1]
	_clear_children(page)

	# Left side: NPC grid
	var grid_scroll := ScrollContainer.new()
	grid_scroll.position = Vector2(0, 0)
	grid_scroll.size = Vector2(180, 300)
	grid_scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	page.add_child(grid_scroll)

	var grid := GridContainer.new()
	grid.columns = 3
	grid.add_theme_constant_override("h_separation", 4)
	grid.add_theme_constant_override("v_separation", 4)
	grid_scroll.add_child(grid)

	var all_npc_ids := [
		Constants.NPC_FRANK, Constants.NPC_MARIA, Constants.NPC_HALE,
		Constants.NPC_IRIS, Constants.NPC_VICTOR, Constants.NPC_PENNY,
		Constants.NPC_ELEANOR, Constants.NPC_NINA, Constants.NPC_MAYOR,
		Constants.NPC_TOMMY
	]

	for npc_id in all_npc_ids:
		var is_known := npc_id in GameState.known_npcs
		var portrait_btn := Button.new()
		portrait_btn.custom_minimum_size = Vector2(52, 60)

		# Portrait: colored rectangle
		var portrait_style := StyleBoxFlat.new()
		if is_known:
			portrait_style.bg_color = NPC_COLORS.get(npc_id, Color.GRAY)
		else:
			portrait_style.bg_color = Color(0.3, 0.3, 0.3, 0.5)
		portrait_style.set_border_width_all(1)
		portrait_style.border_color = COLOR_GOLD if npc_id == _selected_npc_id else COLOR_PAPER_DARK
		portrait_style.set_corner_radius_all(1)
		portrait_btn.add_theme_stylebox_override("normal", portrait_style)

		# Hover style
		var hover_style := portrait_style.duplicate()
		hover_style.border_color = COLOR_RED_ACCENT
		portrait_btn.add_theme_stylebox_override("hover", hover_style)

		var display_name: String = NPC_DISPLAY_NAMES.get(npc_id, npc_id)
		var short_name: String = display_name.split(" ")[0] if is_known else "???"
		portrait_btn.text = short_name
		portrait_btn.add_theme_font_size_override("font_size", 7)
		portrait_btn.add_theme_color_override("font_color", Color.WHITE if is_known else COLOR_LOCKED)

		if is_known:
			portrait_btn.pressed.connect(_select_npc_profile.bind(npc_id))
		grid.add_child(portrait_btn)

	# Right side: Dossier panel
	var dossier := Panel.new()
	dossier.position = Vector2(188, 0)
	dossier.size = Vector2(384, 300)
	var dossier_style := StyleBoxFlat.new()
	dossier_style.bg_color = COLOR_PAPER.darkened(0.05)
	dossier_style.set_border_width_all(1)
	dossier_style.border_color = COLOR_PAPER_DARK
	dossier_style.set_corner_radius_all(1)
	dossier_style.set_content_margin_all(6)
	dossier.add_theme_stylebox_override("panel", dossier_style)
	page.add_child(dossier)

	if _selected_npc_id.is_empty() or _selected_npc_id not in GameState.known_npcs:
		var hint := Label.new()
		hint.text = "Select a known NPC to view their dossier."
		hint.add_theme_font_size_override("font_size", 8)
		hint.add_theme_color_override("font_color", COLOR_LOCKED)
		hint.position = Vector2(8, 8)
		hint.size = Vector2(368, 20)
		hint.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		dossier.add_child(hint)
	else:
		_populate_dossier(dossier, _selected_npc_id)


func _populate_dossier(parent: Panel, npc_id: String) -> void:
	var npc_data: Dictionary = GameState.known_npcs[npc_id]
	var y_offset: float = 6.0

	# Name header
	var name_label := Label.new()
	name_label.text = NPC_DISPLAY_NAMES.get(npc_id, npc_id)
	name_label.add_theme_font_size_override("font_size", 10)
	name_label.add_theme_color_override("font_color", COLOR_INK)
	name_label.position = Vector2(8, y_offset)
	name_label.size = Vector2(368, 14)
	parent.add_child(name_label)
	y_offset += 18.0

	# Job
	var job_text: String = npc_data.get("job", "Unknown")
	if not job_text.is_empty():
		var job_label := Label.new()
		job_label.text = "Occupation: %s" % job_text
		job_label.add_theme_font_size_override("font_size", 8)
		job_label.add_theme_color_override("font_color", COLOR_LOCKED)
		job_label.position = Vector2(8, y_offset)
		job_label.size = Vector2(368, 12)
		parent.add_child(job_label)
		y_offset += 14.0

	# Trust level
	var trust: int = npc_data.get("trust", 0)
	var trust_label := Label.new()
	trust_label.text = "Trust: %d" % trust
	trust_label.add_theme_font_size_override("font_size", 8)
	trust_label.add_theme_color_override("font_color", COLOR_RED_DIM if trust < 0 else Color(0.2, 0.55, 0.3))
	trust_label.position = Vector2(8, y_offset)
	trust_label.size = Vector2(368, 12)
	parent.add_child(trust_label)
	y_offset += 16.0

	# Separator
	var sep := ColorRect.new()
	sep.color = COLOR_PAPER_DARK
	sep.position = Vector2(8, y_offset)
	sep.size = Vector2(360, 1)
	parent.add_child(sep)
	y_offset += 4.0

	# Known facts
	var facts_header := Label.new()
	facts_header.text = "Known Facts:"
	facts_header.add_theme_font_size_override("font_size", 8)
	facts_header.add_theme_color_override("font_color", COLOR_INK)
	facts_header.position = Vector2(8, y_offset)
	facts_header.size = Vector2(368, 12)
	parent.add_child(facts_header)
	y_offset += 14.0

	var known_facts: Array = npc_data.get("known_facts", [])
	if known_facts.is_empty():
		var no_facts := Label.new()
		no_facts.text = "  No facts recorded."
		no_facts.add_theme_font_size_override("font_size", 7)
		no_facts.add_theme_color_override("font_color", COLOR_LOCKED)
		no_facts.position = Vector2(8, y_offset)
		no_facts.size = Vector2(368, 10)
		parent.add_child(no_facts)
		y_offset += 12.0
	else:
		for fact in known_facts:
			var fact_label := Label.new()
			fact_label.text = "- %s" % str(fact)
			fact_label.add_theme_font_size_override("font_size", 7)
			fact_label.add_theme_color_override("font_color", COLOR_INK)
			fact_label.autowrap_mode = TextServer.AUTOWRAP_WORD
			fact_label.position = Vector2(12, y_offset)
			fact_label.size = Vector2(360, 12)
			parent.add_child(fact_label)
			y_offset += 12.0

	y_offset += 4.0

	# Observed schedule
	var schedule_header := Label.new()
	schedule_header.text = "Observed Schedule:"
	schedule_header.add_theme_font_size_override("font_size", 8)
	schedule_header.add_theme_color_override("font_color", COLOR_INK)
	schedule_header.position = Vector2(8, y_offset)
	schedule_header.size = Vector2(368, 12)
	parent.add_child(schedule_header)
	y_offset += 14.0

	var schedules: Array = npc_data.get("observed_schedules", [])
	if schedules.is_empty():
		var no_sched := Label.new()
		no_sched.text = "  No schedule observations yet."
		no_sched.add_theme_font_size_override("font_size", 7)
		no_sched.add_theme_color_override("font_color", COLOR_LOCKED)
		no_sched.position = Vector2(8, y_offset)
		no_sched.size = Vector2(368, 10)
		parent.add_child(no_sched)
	else:
		for entry in schedules:
			var entry_label := Label.new()
			var loc_name: String = Constants.LOCATION_NAMES.get(entry.get("location", 0), "???")
			entry_label.text = "  %s - %s" % [entry.get("time_display", "??:??"), loc_name]
			entry_label.add_theme_font_size_override("font_size", 7)
			entry_label.add_theme_color_override("font_color", COLOR_INK)
			entry_label.position = Vector2(8, y_offset)
			entry_label.size = Vector2(368, 10)
			parent.add_child(entry_label)
			y_offset += 12.0

	# Detected lies
	if npc_id in GameState.npc_lies_detected and not GameState.npc_lies_detected[npc_id].is_empty():
		y_offset += 6.0
		var lies_header := Label.new()
		lies_header.text = "!! Lies Detected:"
		lies_header.add_theme_font_size_override("font_size", 8)
		lies_header.add_theme_color_override("font_color", COLOR_RED_ACCENT)
		lies_header.position = Vector2(8, y_offset)
		lies_header.size = Vector2(368, 12)
		parent.add_child(lies_header)
		y_offset += 14.0

		for lie_clue_id in GameState.npc_lies_detected[npc_id]:
			var lie_label := Label.new()
			if lie_clue_id in GameState.discovered_clues:
				lie_label.text = "  - %s" % GameState.discovered_clues[lie_clue_id].get("title", lie_clue_id)
			else:
				lie_label.text = "  - %s" % lie_clue_id
			lie_label.add_theme_font_size_override("font_size", 7)
			lie_label.add_theme_color_override("font_color", COLOR_RED_DIM)
			lie_label.position = Vector2(8, y_offset)
			lie_label.size = Vector2(368, 10)
			parent.add_child(lie_label)
			y_offset += 12.0


func _select_npc_profile(npc_id: String) -> void:
	_selected_npc_id = npc_id
	_build_profiles_tab()


# ---------------------------------------------------------------------------
# Tab 2 - Timeline
# ---------------------------------------------------------------------------

func _build_timeline_tab() -> void:
	var page := _tab_pages[2]
	_clear_children(page)

	# Toggle for past loops
	var toggle_btn := Button.new()
	toggle_btn.text = "Past Loops: %s" % ("ON" if _show_past_loops else "OFF")
	toggle_btn.position = Vector2(0, 0)
	toggle_btn.size = Vector2(100, 16)
	toggle_btn.add_theme_font_size_override("font_size", 7)
	toggle_btn.add_theme_color_override("font_color", COLOR_INK)
	var toggle_style := StyleBoxFlat.new()
	toggle_style.bg_color = COLOR_PAPER_DARK
	toggle_style.set_corner_radius_all(1)
	toggle_btn.add_theme_stylebox_override("normal", toggle_style)
	toggle_btn.pressed.connect(_toggle_past_loops)
	page.add_child(toggle_btn)

	# Current loop label
	var loop_label := Label.new()
	loop_label.text = "Loop %d" % GameState.current_loop
	loop_label.add_theme_font_size_override("font_size", 8)
	loop_label.add_theme_color_override("font_color", COLOR_INK)
	loop_label.position = Vector2(110, 0)
	loop_label.size = Vector2(80, 16)
	page.add_child(loop_label)

	# Timeline area
	var timeline_panel := Panel.new()
	timeline_panel.position = Vector2(0, 22)
	timeline_panel.size = Vector2(572, 274)
	var tp_style := StyleBoxFlat.new()
	tp_style.bg_color = COLOR_PAPER.darkened(0.08)
	tp_style.set_border_width_all(1)
	tp_style.border_color = COLOR_PAPER_DARK
	tp_style.set_corner_radius_all(1)
	timeline_panel.add_theme_stylebox_override("panel", tp_style)
	page.add_child(timeline_panel)

	# Time axis labels along the top
	var time_labels_y: float = 4.0
	var timeline_width: float = 540.0
	var timeline_x_offset: float = 16.0
	for i in range(0, 11):
		var time_sec: float = i * 60.0
		var x_pos: float = timeline_x_offset + (time_sec / float(Constants.get_dp("loop_duration", GameState.difficulty))) * timeline_width
		var game_hours := 6.0 + (time_sec / float(Constants.get_dp("loop_duration", GameState.difficulty))) * 18.0
		var hours := int(game_hours)
		var period := "AM" if hours < 12 else "PM"
		var display_hours := hours % 12
		if display_hours == 0:
			display_hours = 12
		var time_label := Label.new()
		time_label.text = "%d%s" % [display_hours, period]
		time_label.add_theme_font_size_override("font_size", 6)
		time_label.add_theme_color_override("font_color", COLOR_LOCKED)
		time_label.position = Vector2(x_pos - 10, time_labels_y)
		time_label.size = Vector2(30, 10)
		time_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		timeline_panel.add_child(time_label)

		# Tick mark
		var tick := ColorRect.new()
		tick.color = COLOR_PAPER_DARK
		tick.position = Vector2(x_pos, time_labels_y + 11)
		tick.size = Vector2(1, 6)
		timeline_panel.add_child(tick)

	# Horizontal axis line
	var axis_line := ColorRect.new()
	axis_line.color = COLOR_PAPER_DARK
	axis_line.position = Vector2(timeline_x_offset, time_labels_y + 17)
	axis_line.size = Vector2(timeline_width, 1)
	timeline_panel.add_child(axis_line)

	# NPC rows - one per known NPC
	var npc_row_y: float = time_labels_y + 24.0
	var row_height: float = 22.0
	var npc_ids := _get_timeline_npc_ids()

	for npc_id in npc_ids:
		# NPC label
		var npc_label := Label.new()
		var short_name: String = NPC_DISPLAY_NAMES.get(npc_id, npc_id).split(" ")[0]
		npc_label.text = short_name
		npc_label.add_theme_font_size_override("font_size", 7)
		npc_label.add_theme_color_override("font_color", NPC_COLORS.get(npc_id, Color.WHITE))
		npc_label.position = Vector2(0, npc_row_y + 2)
		npc_label.size = Vector2(50, 10)
		npc_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_LEFT
		npc_label.clip_text = true
		timeline_panel.add_child(npc_label)

		# Row line
		var row_line := ColorRect.new()
		row_line.color = COLOR_PAPER_DARK.lerp(COLOR_PAPER, 0.5)
		row_line.position = Vector2(timeline_x_offset, npc_row_y + row_height - 1)
		row_line.size = Vector2(timeline_width, 1)
		timeline_panel.add_child(row_line)

		# Plot entries for this NPC
		var entries := _get_entries_for_npc(npc_id)
		for entry in entries:
			var entry_time: float = entry.get("time", 0.0)
			var entry_loop: int = entry.get("loop", GameState.current_loop)
			var x_pos: float = timeline_x_offset + (entry_time / float(Constants.get_dp("loop_duration", GameState.difficulty))) * timeline_width

			var dot := ColorRect.new()
			if entry_loop == GameState.current_loop:
				dot.color = NPC_COLORS.get(npc_id, Color.WHITE)
				dot.size = Vector2(5, 5)
			else:
				dot.color = NPC_COLORS.get(npc_id, Color.WHITE).lerp(COLOR_PAPER, 0.6)
				dot.size = Vector2(3, 3)
			dot.position = Vector2(x_pos - dot.size.x / 2.0, npc_row_y + (row_height - dot.size.y) / 2.0)
			dot.tooltip_text = "%s @ %s - %s (Loop %d)" % [
				NPC_DISPLAY_NAMES.get(npc_id, npc_id),
				_format_time(entry_time),
				Constants.LOCATION_NAMES.get(entry.get("location", 0), "???"),
				entry_loop
			]
			timeline_panel.add_child(dot)

		npc_row_y += row_height

	# Current time indicator
	var current_x: float = timeline_x_offset + (TimeManager.current_time / float(Constants.get_dp("loop_duration", GameState.difficulty))) * timeline_width
	var time_indicator := ColorRect.new()
	time_indicator.color = COLOR_RED_ACCENT
	time_indicator.position = Vector2(current_x, time_labels_y + 11)
	time_indicator.size = Vector2(2, npc_row_y - time_labels_y - 6)
	timeline_panel.add_child(time_indicator)


func _get_timeline_npc_ids() -> Array[String]:
	var ids: Array[String] = []
	var seen: Dictionary = {}
	for entry in GameState.timeline_entries:
		var npc_id: String = entry.get("npc_id", "")
		if not npc_id.is_empty() and npc_id not in seen:
			seen[npc_id] = true
			ids.append(npc_id)
	return ids


func _get_entries_for_npc(npc_id: String) -> Array[Dictionary]:
	var result: Array[Dictionary] = []
	for entry in GameState.timeline_entries:
		if entry.get("npc_id", "") != npc_id:
			continue
		if not _show_past_loops and entry.get("loop", 0) != GameState.current_loop:
			continue
		result.append(entry)
	return result


func _toggle_past_loops() -> void:
	_show_past_loops = not _show_past_loops
	_build_timeline_tab()


func _format_time(seconds: float) -> String:
	var game_hours := 6.0 + (seconds / float(Constants.get_dp("loop_duration", GameState.difficulty))) * 18.0
	var hours := int(game_hours)
	var minutes := int((game_hours - hours) * 60.0)
	var period := "AM" if hours < 12 else "PM"
	var display_hours := hours % 12
	if display_hours == 0:
		display_hours = 12
	return "%d:%02d %s" % [display_hours, minutes, period]


# ---------------------------------------------------------------------------
# Tab 3 - Board (Conspiracy Board)
# ---------------------------------------------------------------------------

# Stores board card positions: clue_id -> Vector2
var _board_positions: Dictionary = {}

func _build_board_tab() -> void:
	var page := _tab_pages[3]
	_clear_children(page)

	# The board is a draw-capable control for connection lines
	var board := _BoardCanvas.new()
	board.notebook_ref = self
	board.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	board.clip_contents = true
	page.add_child(board)

	# Instructions label
	var instructions := Label.new()
	instructions.text = "Drag clues to arrange. Right-click a clue to start connecting, then right-click another."
	instructions.add_theme_font_size_override("font_size", 6)
	instructions.add_theme_color_override("font_color", COLOR_LOCKED)
	instructions.position = Vector2(0, 288)
	instructions.size = Vector2(572, 10)
	instructions.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	board.add_child(instructions)

	# Place clue cards
	var clues: Dictionary = GameState.discovered_clues
	var idx: int = 0
	for clue_id in clues:
		var clue: Dictionary = clues[clue_id]

		# Determine position
		if clue_id not in _board_positions:
			# Auto-layout: grid-like
			var col := idx % 6
			var row := idx / 6
			_board_positions[clue_id] = Vector2(8 + col * 94, 8 + row * 58)

		var card := _create_board_card(clue_id, clue)
		card.position = _board_positions[clue_id]
		board.add_child(card)
		idx += 1


func _create_board_card(clue_id: String, clue: Dictionary) -> PanelContainer:
	var card := PanelContainer.new()
	card.custom_minimum_size = Vector2(88, 50)
	card.size = Vector2(88, 50)
	card.set_meta("clue_id", clue_id)

	var is_conspiracy := _is_conspiracy_connected(clue_id)
	var card_style := StyleBoxFlat.new()
	card_style.bg_color = COLOR_PAPER.darkened(0.03)
	card_style.set_border_width_all(1)
	card_style.border_color = COLOR_GOLD if is_conspiracy else COLOR_PAPER_DARK
	if is_conspiracy:
		card_style.set_border_width_all(2)
		# Gold glow effect via shadow
		card_style.shadow_color = Color(COLOR_GOLD.r, COLOR_GOLD.g, COLOR_GOLD.b, 0.4)
		card_style.shadow_size = 3
	card_style.set_corner_radius_all(1)
	card_style.set_content_margin_all(2)
	card.add_theme_stylebox_override("panel", card_style)

	var vbox := VBoxContainer.new()
	vbox.add_theme_constant_override("separation", 1)
	card.add_child(vbox)

	# Category icon + title
	var header := HBoxContainer.new()
	header.add_theme_constant_override("separation", 2)
	vbox.add_child(header)

	var cat: int = clue.get("category", Enums.ClueCategory.OBSERVATION)
	var cat_icon := ColorRect.new()
	cat_icon.custom_minimum_size = Vector2(6, 6)
	cat_icon.color = CATEGORY_COLORS.get(cat, COLOR_PAPER_DARK)
	header.add_child(cat_icon)

	var title := Label.new()
	title.text = clue.get("title", clue_id)
	title.add_theme_font_size_override("font_size", 6)
	title.add_theme_color_override("font_color", COLOR_INK)
	title.clip_text = true
	title.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	header.add_child(title)

	# Description (truncated)
	var desc := Label.new()
	var desc_text: String = clue.get("description", "")
	desc.text = desc_text.left(50) + ("..." if desc_text.length() > 50 else "")
	desc.add_theme_font_size_override("font_size", 5)
	desc.add_theme_color_override("font_color", COLOR_LOCKED)
	desc.autowrap_mode = TextServer.AUTOWRAP_WORD
	vbox.add_child(desc)

	# Drag handling
	card.gui_input.connect(_on_board_card_input.bind(card, clue_id))
	card.mouse_filter = Control.MOUSE_FILTER_STOP

	return card


func _is_conspiracy_connected(clue_id: String) -> bool:
	for conn in GameState.clue_connections:
		if (conn["clue_a"] == clue_id or conn["clue_b"] == clue_id) and \
		   (conn["type"] == Enums.ConnectionType.CONSPIRACY or \
		    conn["type"] == Enums.ConnectionType.FINANCIAL):
			return true
	return false


func _on_board_card_input(event: InputEvent, card: PanelContainer, clue_id: String) -> void:
	if event is InputEventMouseButton:
		var mb := event as InputEventMouseButton
		if mb.button_index == MOUSE_BUTTON_LEFT:
			if mb.pressed:
				_board_dragging = true
				_board_drag_target = card
				_board_drag_offset = card.position - mb.global_position
			else:
				_board_dragging = false
				_board_drag_target = null
		elif mb.button_index == MOUSE_BUTTON_RIGHT and mb.pressed:
			if not _board_connecting:
				_board_connecting = true
				_board_connect_from = clue_id
				_board_connect_start_pos = card.position + card.size / 2.0
			else:
				# Complete the connection
				if _board_connect_from != clue_id:
					GameState.add_connection(_board_connect_from, clue_id, Enums.ConnectionType.SAME_PERSON)
				_board_connecting = false
				_board_connect_from = ""
				_build_board_tab()

	elif event is InputEventMouseMotion and _board_dragging and _board_drag_target == card:
		var mm := event as InputEventMouseMotion
		card.position = mm.global_position + _board_drag_offset
		_board_positions[clue_id] = card.position
		# Redraw connections
		var board_canvas := card.get_parent()
		if board_canvas:
			board_canvas.queue_redraw()


# Inner class for drawing connection lines
class _BoardCanvas extends Control:
	var notebook_ref: Control = null

	func _draw() -> void:
		if not notebook_ref:
			return
		# Draw connection lines between clue cards
		for conn in GameState.clue_connections:
			var clue_a: String = conn["clue_a"]
			var clue_b: String = conn["clue_b"]
			if clue_a not in notebook_ref._board_positions or clue_b not in notebook_ref._board_positions:
				continue
			var pos_a: Vector2 = notebook_ref._board_positions[clue_a] + Vector2(44, 25)
			var pos_b: Vector2 = notebook_ref._board_positions[clue_b] + Vector2(44, 25)

			var conn_type: int = conn.get("type", 0)
			var line_color: Color
			var line_width: float = 1.0
			match conn_type:
				Enums.ConnectionType.CONSPIRACY, Enums.ConnectionType.FINANCIAL:
					line_color = COLOR_GOLD
					line_width = 2.0
				Enums.ConnectionType.CONTRADICTION:
					line_color = COLOR_RED_ACCENT
					line_width = 1.5
				Enums.ConnectionType.ALIBI_BREAK:
					line_color = Color(0.8, 0.4, 0.1)
				_:
					line_color = COLOR_PAPER_DARK.darkened(0.2)

			draw_line(pos_a, pos_b, line_color, line_width, true)

			# Draw small diamond at midpoint for conspiracy connections
			if conn_type == Enums.ConnectionType.CONSPIRACY or conn_type == Enums.ConnectionType.FINANCIAL:
				var mid := (pos_a + pos_b) / 2.0
				var diamond := PackedVector2Array([
					mid + Vector2(0, -4),
					mid + Vector2(4, 0),
					mid + Vector2(0, 4),
					mid + Vector2(-4, 0),
				])
				draw_colored_polygon(diamond, COLOR_GOLD)

		# Draw in-progress connection line
		if notebook_ref._board_connecting:
			var start := notebook_ref._board_connect_start_pos
			var mouse_pos := get_local_mouse_position()
			draw_dashed_line(start, mouse_pos, COLOR_RED_ACCENT, 1.0, 4.0)


# ---------------------------------------------------------------------------
# Tab 4 - Theories
# ---------------------------------------------------------------------------

var _theory_input_visible: bool = false

func _build_theories_tab() -> void:
	var page := _tab_pages[4]
	_clear_children(page)

	# Header with "New Theory" button
	var header := HBoxContainer.new()
	header.position = Vector2(0, 0)
	header.size = Vector2(572, 20)
	header.add_theme_constant_override("separation", 4)
	page.add_child(header)

	var title_label := Label.new()
	title_label.text = "Theories (%d)" % GameState.theories.size()
	title_label.add_theme_font_size_override("font_size", 9)
	title_label.add_theme_color_override("font_color", COLOR_INK)
	title_label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	header.add_child(title_label)

	var new_btn := Button.new()
	new_btn.text = "+ New Theory"
	new_btn.custom_minimum_size = Vector2(80, 18)
	new_btn.add_theme_font_size_override("font_size", 7)
	new_btn.add_theme_color_override("font_color", COLOR_INK)
	var new_btn_style := StyleBoxFlat.new()
	new_btn_style.bg_color = COLOR_PAPER_DARK
	new_btn_style.set_corner_radius_all(1)
	new_btn.add_theme_stylebox_override("normal", new_btn_style)
	new_btn.pressed.connect(_toggle_theory_input)
	header.add_child(new_btn)

	# New theory input (conditionally visible)
	if _theory_input_visible:
		var input_panel := Panel.new()
		input_panel.position = Vector2(0, 24)
		input_panel.size = Vector2(572, 40)
		var ip_style := StyleBoxFlat.new()
		ip_style.bg_color = COLOR_PAPER.darkened(0.1)
		ip_style.set_border_width_all(1)
		ip_style.border_color = COLOR_RED_ACCENT
		ip_style.set_corner_radius_all(1)
		ip_style.set_content_margin_all(4)
		input_panel.add_theme_stylebox_override("panel", ip_style)
		page.add_child(input_panel)

		var input_hbox := HBoxContainer.new()
		input_hbox.position = Vector2(4, 4)
		input_hbox.size = Vector2(564, 30)
		input_hbox.add_theme_constant_override("separation", 4)
		input_panel.add_child(input_hbox)

		var line_edit := LineEdit.new()
		line_edit.placeholder_text = "Describe your theory..."
		line_edit.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		line_edit.add_theme_font_size_override("font_size", 8)
		line_edit.add_theme_color_override("font_color", COLOR_INK)
		line_edit.set_meta("is_theory_input", true)
		input_hbox.add_child(line_edit)

		var submit_btn := Button.new()
		submit_btn.text = "Add"
		submit_btn.custom_minimum_size = Vector2(40, 18)
		submit_btn.add_theme_font_size_override("font_size", 7)
		submit_btn.add_theme_color_override("font_color", COLOR_INK)
		var sub_style := StyleBoxFlat.new()
		sub_style.bg_color = Color(0.3, 0.55, 0.3)
		sub_style.set_corner_radius_all(1)
		submit_btn.add_theme_stylebox_override("normal", sub_style)
		submit_btn.pressed.connect(_submit_theory.bind(line_edit))
		input_hbox.add_child(submit_btn)

	# Theory list
	var list_y: float = 28.0 if not _theory_input_visible else 70.0
	var scroll := ScrollContainer.new()
	scroll.position = Vector2(0, list_y)
	scroll.size = Vector2(572, 300.0 - list_y)
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	page.add_child(scroll)

	var vbox := VBoxContainer.new()
	vbox.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	vbox.add_theme_constant_override("separation", 4)
	scroll.add_child(vbox)

	if GameState.theories.is_empty():
		var empty_label := Label.new()
		empty_label.text = "No theories created yet. Formulate theories to connect the clues!"
		empty_label.add_theme_font_size_override("font_size", 8)
		empty_label.add_theme_color_override("font_color", COLOR_LOCKED)
		empty_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		vbox.add_child(empty_label)
	else:
		for i in GameState.theories.size():
			var theory: Dictionary = GameState.theories[i]
			var theory_panel := _create_theory_row(theory, i)
			vbox.add_child(theory_panel)


func _create_theory_row(theory: Dictionary, index: int) -> PanelContainer:
	var panel := PanelContainer.new()
	panel.custom_minimum_size = Vector2(560, 50)
	var is_verified: bool = theory.get("verified", false)
	var panel_style := StyleBoxFlat.new()
	panel_style.bg_color = Color(0.85, 0.9, 0.82) if is_verified else COLOR_PAPER.darkened(0.05)
	panel_style.set_border_width_all(1)
	panel_style.border_color = Color(0.3, 0.6, 0.3) if is_verified else COLOR_PAPER_DARK
	panel_style.set_corner_radius_all(1)
	panel_style.set_content_margin_all(4)
	panel.add_theme_stylebox_override("panel", panel_style)

	var outer_vbox := VBoxContainer.new()
	outer_vbox.add_theme_constant_override("separation", 2)
	panel.add_child(outer_vbox)

	# Top row: status + description
	var top_hbox := HBoxContainer.new()
	top_hbox.add_theme_constant_override("separation", 4)
	outer_vbox.add_child(top_hbox)

	# Status indicator
	var status := Label.new()
	status.text = "[VERIFIED]" if is_verified else "[UNVERIFIED]"
	status.add_theme_font_size_override("font_size", 7)
	status.add_theme_color_override("font_color", Color(0.2, 0.6, 0.2) if is_verified else COLOR_RED_DIM)
	status.custom_minimum_size = Vector2(65, 10)
	top_hbox.add_child(status)

	var desc := Label.new()
	desc.text = theory.get("description", "")
	desc.add_theme_font_size_override("font_size", 8)
	desc.add_theme_color_override("font_color", COLOR_INK)
	desc.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	desc.autowrap_mode = TextServer.AUTOWRAP_WORD
	top_hbox.add_child(desc)

	if not is_verified:
		var verify_btn := Button.new()
		verify_btn.text = "Verify"
		verify_btn.custom_minimum_size = Vector2(44, 14)
		verify_btn.add_theme_font_size_override("font_size", 6)
		verify_btn.add_theme_color_override("font_color", COLOR_INK)
		var v_style := StyleBoxFlat.new()
		v_style.bg_color = COLOR_GOLD.darkened(0.2)
		v_style.set_corner_radius_all(1)
		verify_btn.add_theme_stylebox_override("normal", v_style)
		verify_btn.pressed.connect(_try_verify_theory.bind(index))
		top_hbox.add_child(verify_btn)

	# Assigned clues
	var clues_array: Array = theory.get("clues", [])
	var clue_hbox := HBoxContainer.new()
	clue_hbox.add_theme_constant_override("separation", 2)
	outer_vbox.add_child(clue_hbox)

	var clue_label := Label.new()
	clue_label.text = "Evidence (%d):" % clues_array.size()
	clue_label.add_theme_font_size_override("font_size", 7)
	clue_label.add_theme_color_override("font_color", COLOR_LOCKED)
	clue_label.custom_minimum_size = Vector2(60, 10)
	clue_hbox.add_child(clue_label)

	for clue_id in clues_array:
		var chip := Label.new()
		if clue_id in GameState.discovered_clues:
			chip.text = GameState.discovered_clues[clue_id].get("title", clue_id).left(16)
		else:
			chip.text = clue_id.left(16)
		chip.add_theme_font_size_override("font_size", 6)
		chip.add_theme_color_override("font_color", COLOR_INK)
		# Chip background via a PanelContainer would be ideal but Labels with tooltip suffice
		chip.tooltip_text = clue_id
		clue_hbox.add_child(chip)

	# Assign clue button
	var assign_btn := Button.new()
	assign_btn.text = "+ Clue"
	assign_btn.custom_minimum_size = Vector2(40, 14)
	assign_btn.add_theme_font_size_override("font_size", 6)
	assign_btn.add_theme_color_override("font_color", COLOR_INK)
	var assign_style := StyleBoxFlat.new()
	assign_style.bg_color = COLOR_PAPER_DARK
	assign_style.set_corner_radius_all(1)
	assign_btn.add_theme_stylebox_override("normal", assign_style)
	assign_btn.pressed.connect(_show_assign_clue_picker.bind(index))
	clue_hbox.add_child(assign_btn)

	return panel


func _toggle_theory_input() -> void:
	_theory_input_visible = not _theory_input_visible
	_build_theories_tab()


func _submit_theory(line_edit: LineEdit) -> void:
	var text := line_edit.text.strip_edges()
	if text.is_empty():
		return
	var theory_id := "theory_%d" % GameState.theories.size()
	GameState.theories.append({
		"id": theory_id,
		"description": text,
		"clues": [],
		"verified": false
	})
	EventBus.theory_created.emit(theory_id)
	_theory_input_visible = false
	_build_theories_tab()


func _try_verify_theory(theory_index: int) -> void:
	if theory_index >= GameState.theories.size():
		return
	var theory: Dictionary = GameState.theories[theory_index]
	var clue_count: int = theory.get("clues", []).size()
	# Require at least 3 clues to verify a theory
	if clue_count >= 3:
		theory["verified"] = true
		GameState.advance_conspiracy(2)
		EventBus.sfx_requested.emit("clue_discovered")
	_build_theories_tab()


func _show_assign_clue_picker(theory_index: int) -> void:
	# Build a popup-like overlay with available clues to assign
	if theory_index >= GameState.theories.size():
		return
	var theory: Dictionary = GameState.theories[theory_index]
	var assigned: Array = theory.get("clues", [])

	# Create overlay
	var overlay := Panel.new()
	overlay.position = Vector2(100, 40)
	overlay.size = Vector2(380, 220)
	overlay.z_index = 10
	var ov_style := StyleBoxFlat.new()
	ov_style.bg_color = COLOR_PAPER
	ov_style.set_border_width_all(2)
	ov_style.border_color = COLOR_RED_ACCENT
	ov_style.set_corner_radius_all(2)
	ov_style.set_content_margin_all(4)
	overlay.add_theme_stylebox_override("panel", ov_style)
	_tab_pages[4].add_child(overlay)

	var ov_title := Label.new()
	ov_title.text = "Select a clue to assign:"
	ov_title.add_theme_font_size_override("font_size", 8)
	ov_title.add_theme_color_override("font_color", COLOR_INK)
	ov_title.position = Vector2(4, 4)
	ov_title.size = Vector2(340, 14)
	overlay.add_child(ov_title)

	var close_ov := Button.new()
	close_ov.text = "X"
	close_ov.position = Vector2(356, 4)
	close_ov.size = Vector2(16, 14)
	close_ov.add_theme_font_size_override("font_size", 7)
	close_ov.add_theme_color_override("font_color", COLOR_RED_ACCENT)
	var cls_style := StyleBoxFlat.new()
	cls_style.bg_color = COLOR_PAPER_DARK
	cls_style.set_corner_radius_all(1)
	close_ov.add_theme_stylebox_override("normal", cls_style)
	close_ov.pressed.connect(overlay.queue_free)
	overlay.add_child(close_ov)

	var ov_scroll := ScrollContainer.new()
	ov_scroll.position = Vector2(4, 22)
	ov_scroll.size = Vector2(370, 190)
	ov_scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	overlay.add_child(ov_scroll)

	var ov_vbox := VBoxContainer.new()
	ov_vbox.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	ov_vbox.add_theme_constant_override("separation", 2)
	ov_scroll.add_child(ov_vbox)

	for clue_id in GameState.discovered_clues:
		if clue_id in assigned:
			continue
		var clue: Dictionary = GameState.discovered_clues[clue_id]
		var clue_btn := Button.new()
		clue_btn.text = clue.get("title", clue_id)
		clue_btn.custom_minimum_size = Vector2(360, 18)
		clue_btn.add_theme_font_size_override("font_size", 7)
		clue_btn.add_theme_color_override("font_color", COLOR_INK)
		clue_btn.alignment = HORIZONTAL_ALIGNMENT_LEFT
		var cb_style := StyleBoxFlat.new()
		cb_style.bg_color = COLOR_PAPER.darkened(0.05)
		cb_style.set_corner_radius_all(1)
		clue_btn.add_theme_stylebox_override("normal", cb_style)
		clue_btn.pressed.connect(_assign_clue_to_theory.bind(theory_index, clue_id, overlay))
		ov_vbox.add_child(clue_btn)


func _assign_clue_to_theory(theory_index: int, clue_id: String, overlay: Panel) -> void:
	if theory_index >= GameState.theories.size():
		return
	var theory: Dictionary = GameState.theories[theory_index]
	if "clues" not in theory:
		theory["clues"] = []
	if clue_id not in theory["clues"]:
		theory["clues"].append(clue_id)
	overlay.queue_free()
	_build_theories_tab()


# ---------------------------------------------------------------------------
# Signal handlers
# ---------------------------------------------------------------------------

func _on_clue_discovered(_clue_id: String) -> void:
	if is_open:
		_refresh_current_tab()


func _on_connection_made(_connection_id: String) -> void:
	if is_open:
		_refresh_current_tab()


func _on_theory_created(_theory_id: String) -> void:
	if is_open and current_tab == 4:
		_build_theories_tab()


# ---------------------------------------------------------------------------
# Utility
# ---------------------------------------------------------------------------

func _clear_children(node: Node) -> void:
	for child in node.get_children():
		child.queue_free()
