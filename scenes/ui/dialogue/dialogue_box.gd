extends Control
## Typewriter-style dialogue box with branching choices, lie detection,
## and evidence presentation. Built entirely programmatically.

# --- State ---
var is_active: bool = false
var current_npc_id: String = ""
var current_dialogue: Dictionary = {}  # Full dialogue tree
var current_line_index: int = 0
var typewriter_speed: float = 0.03

var _typewriter_timer: Timer
var _current_text: String = ""
var _visible_chars: int = 0
var _is_typing: bool = false
var _awaiting_choice: bool = false
var _current_lines: Array = []  # Array of dialogue line dicts
var _present_evidence_mode: bool = false

# --- UI References ---
var _background: ColorRect
var _dialogue_panel: Panel
var _portrait_rect: ColorRect
var _portrait_label: Label
var _speaker_label: Label
var _text_label: RichTextLabel
var _choice_container: VBoxContainer
var _continue_indicator: Label
var _evidence_panel: Panel

# Style colors
const COLOR_BG_OVERLAY: Color = Color(0.0, 0.0, 0.0, 0.3)
const COLOR_PANEL_BG: Color = Color(0.1, 0.08, 0.06, 0.95)
const COLOR_PANEL_BORDER: Color = Color(0.45, 0.38, 0.28)
const COLOR_TEXT: Color = Color(0.92, 0.87, 0.78)
const COLOR_SPEAKER: Color = Color(0.85, 0.72, 0.20)
const COLOR_CHOICE_NORMAL: Color = Color(0.18, 0.16, 0.12)
const COLOR_CHOICE_HOVER: Color = Color(0.25, 0.22, 0.16)
const COLOR_CHOICE_LOCKED: Color = Color(0.12, 0.10, 0.08)
const COLOR_LOCKED_TEXT: Color = Color(0.45, 0.42, 0.38)
const COLOR_RED: Color = Color(0.75, 0.15, 0.12)
const COLOR_EVIDENCE_HIGHLIGHT: Color = Color(0.85, 0.72, 0.20, 0.3)
const COLOR_LIE_DETECTED: Color = Color(0.9, 0.2, 0.15)

# NPC display names (mirrors notebook, kept local for independence)
const NPC_NAMES: Dictionary = {
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

const NPC_PORTRAIT_COLORS: Dictionary = {
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
	visible = false
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_STOP
	process_mode = Node.PROCESS_MODE_ALWAYS

	_build_ui()
	_setup_typewriter_timer()

	# Handle mid-dialogue loop reset
	EventBus.loop_reset.connect(_on_loop_reset)


func _build_ui() -> void:
	# Semi-transparent background overlay
	_background = ColorRect.new()
	_background.color = COLOR_BG_OVERLAY
	_background.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	_background.mouse_filter = Control.MOUSE_FILTER_STOP
	add_child(_background)

	# Main dialogue panel - bottom of screen
	_dialogue_panel = Panel.new()
	_dialogue_panel.position = Vector2(16, 240)
	_dialogue_panel.size = Vector2(608, 110)
	var panel_style := StyleBoxFlat.new()
	panel_style.bg_color = COLOR_PANEL_BG
	panel_style.set_border_width_all(2)
	panel_style.border_color = COLOR_PANEL_BORDER
	panel_style.set_corner_radius_all(3)
	panel_style.set_content_margin_all(6)
	_dialogue_panel.add_theme_stylebox_override("panel", panel_style)
	add_child(_dialogue_panel)

	# Portrait (colored rectangle placeholder)
	_portrait_rect = ColorRect.new()
	_portrait_rect.position = Vector2(6, 6)
	_portrait_rect.size = Vector2(56, 64)
	_portrait_rect.color = Color.GRAY
	_dialogue_panel.add_child(_portrait_rect)

	# Portrait initial letter label
	_portrait_label = Label.new()
	_portrait_label.position = Vector2(6, 6)
	_portrait_label.size = Vector2(56, 64)
	_portrait_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_portrait_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	_portrait_label.add_theme_font_size_override("font_size", 20)
	_portrait_label.add_theme_color_override("font_color", Color.WHITE)
	_dialogue_panel.add_child(_portrait_label)

	# Speaker name
	_speaker_label = Label.new()
	_speaker_label.position = Vector2(70, 6)
	_speaker_label.size = Vector2(300, 14)
	_speaker_label.add_theme_font_size_override("font_size", 9)
	_speaker_label.add_theme_color_override("font_color", COLOR_SPEAKER)
	_dialogue_panel.add_child(_speaker_label)

	# Dialogue text (RichTextLabel for typewriter effect)
	_text_label = RichTextLabel.new()
	_text_label.position = Vector2(70, 22)
	_text_label.size = Vector2(528, 44)
	_text_label.bbcode_enabled = true
	_text_label.scroll_active = false
	_text_label.add_theme_font_size_override("normal_font_size", 8)
	_text_label.add_theme_color_override("default_color", COLOR_TEXT)
	# Start with no visible characters for typewriter
	_text_label.visible_characters = 0
	_dialogue_panel.add_child(_text_label)

	# Choice container (hidden by default)
	_choice_container = VBoxContainer.new()
	_choice_container.position = Vector2(70, 68)
	_choice_container.size = Vector2(528, 40)
	_choice_container.add_theme_constant_override("separation", 2)
	_choice_container.visible = false
	_dialogue_panel.add_child(_choice_container)

	# Continue indicator
	_continue_indicator = Label.new()
	_continue_indicator.text = ">>>"
	_continue_indicator.position = Vector2(572, 90)
	_continue_indicator.size = Vector2(30, 12)
	_continue_indicator.add_theme_font_size_override("font_size", 8)
	_continue_indicator.add_theme_color_override("font_color", COLOR_SPEAKER)
	_continue_indicator.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	_continue_indicator.visible = false
	_dialogue_panel.add_child(_continue_indicator)

	# Evidence presentation panel (hidden by default)
	_evidence_panel = Panel.new()
	_evidence_panel.position = Vector2(16, 80)
	_evidence_panel.size = Vector2(608, 150)
	_evidence_panel.visible = false
	var ev_style := StyleBoxFlat.new()
	ev_style.bg_color = Color(0.08, 0.06, 0.04, 0.95)
	ev_style.set_border_width_all(2)
	ev_style.border_color = COLOR_SPEAKER
	ev_style.set_corner_radius_all(3)
	ev_style.set_content_margin_all(6)
	_evidence_panel.add_theme_stylebox_override("panel", ev_style)
	add_child(_evidence_panel)


func _setup_typewriter_timer() -> void:
	_typewriter_timer = Timer.new()
	_typewriter_timer.wait_time = typewriter_speed
	_typewriter_timer.one_shot = false
	_typewriter_timer.timeout.connect(_on_typewriter_tick)
	add_child(_typewriter_timer)


func _input(event: InputEvent) -> void:
	if not is_active:
		return

	if _present_evidence_mode:
		# Evidence panel handles its own input
		return

	if event.is_action_pressed("interact"):
		advance()
		get_viewport().set_input_as_handled()


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

func start_dialogue(npc_id: String, dialogue_tree: Dictionary) -> void:
	current_npc_id = npc_id
	current_dialogue = dialogue_tree
	current_line_index = 0
	is_active = true
	_awaiting_choice = false
	_present_evidence_mode = false

	# Resolve lines from the tree
	_current_lines = dialogue_tree.get("lines", [])

	# Guard against empty dialogue
	if _current_lines.is_empty():
		_current_lines = [{"text": "...", "speaker": npc_id, "truthful": true}]

	# Update portrait
	_portrait_rect.color = NPC_PORTRAIT_COLORS.get(npc_id, Color.GRAY)
	var display_name: String = NPC_NAMES.get(npc_id, npc_id)
	_portrait_label.text = display_name.left(1).to_upper()
	_speaker_label.text = display_name

	visible = true
	_choice_container.visible = false
	_continue_indicator.visible = false

	# Pause game world
	get_tree().paused = true

	EventBus.dialogue_started.emit(npc_id)
	EventBus.npc_interaction_started.emit(npc_id)

	# Show first line
	_show_current_line()


func advance() -> void:
	if _awaiting_choice:
		return  # Must pick a choice

	if _is_typing:
		# Skip typewriter - reveal all text
		_typewriter_timer.stop()
		_is_typing = false
		_text_label.visible_characters = -1  # Show all
		_continue_indicator.visible = true
		_check_for_choices()
		return

	# Advance to next line
	current_line_index += 1
	if current_line_index >= _current_lines.size():
		_end_dialogue()
		return

	_show_current_line()


func show_choices(choices: Array) -> void:
	_awaiting_choice = true
	_choice_container.visible = true
	_continue_indicator.visible = false

	# Clear previous choices
	for child in _choice_container.get_children():
		child.queue_free()

	# Add "Ask About..." option if player has clues
	if not GameState.discovered_clues.is_empty():
		var ask_btn := Button.new()
		ask_btn.text = "[Ask About...]"
		ask_btn.custom_minimum_size = Vector2(520, 14)
		ask_btn.add_theme_font_size_override("font_size", 7)
		ask_btn.add_theme_color_override("font_color", COLOR_SPEAKER)
		var ask_style := StyleBoxFlat.new()
		ask_style.bg_color = COLOR_CHOICE_NORMAL
		ask_style.set_corner_radius_all(1)
		ask_style.set_content_margin_all(2)
		ask_btn.add_theme_stylebox_override("normal", ask_style)
		var ask_hover := StyleBoxFlat.new()
		ask_hover.bg_color = COLOR_CHOICE_HOVER
		ask_hover.set_corner_radius_all(1)
		ask_hover.set_content_margin_all(2)
		ask_btn.add_theme_stylebox_override("hover", ask_hover)
		ask_btn.pressed.connect(_show_ask_about_panel)
		_choice_container.add_child(ask_btn)

	# Render dialogue choices
	for choice in choices:
		var choice_id: String = choice.get("id", "")
		var choice_text: String = choice.get("text", "")
		var required_clues: Array = choice.get("required_clues", [])

		# Check if locked
		var is_locked := false
		for req_clue in required_clues:
			if req_clue not in GameState.discovered_clues:
				is_locked = true
				break

		var btn := Button.new()
		btn.custom_minimum_size = Vector2(520, 14)
		btn.add_theme_font_size_override("font_size", 7)
		btn.alignment = HORIZONTAL_ALIGNMENT_LEFT

		if is_locked:
			btn.text = "[LOCKED] %s" % choice_text
			btn.add_theme_color_override("font_color", COLOR_LOCKED_TEXT)
			btn.disabled = true
			var lock_style := StyleBoxFlat.new()
			lock_style.bg_color = COLOR_CHOICE_LOCKED
			lock_style.set_corner_radius_all(1)
			lock_style.set_content_margin_all(2)
			btn.add_theme_stylebox_override("normal", lock_style)
			btn.add_theme_stylebox_override("disabled", lock_style)
		else:
			btn.text = "\u25B8 %s" % choice_text
			btn.add_theme_color_override("font_color", COLOR_TEXT)
			var choice_style := StyleBoxFlat.new()
			choice_style.bg_color = COLOR_CHOICE_NORMAL
			choice_style.set_corner_radius_all(2)
			choice_style.content_margin_left = 6
			choice_style.content_margin_right = 4
			choice_style.content_margin_top = 3
			choice_style.content_margin_bottom = 3
			choice_style.border_width_left = 3
			choice_style.border_color = Color(0.4, 0.35, 0.25)
			btn.add_theme_stylebox_override("normal", choice_style)
			var hover_style := StyleBoxFlat.new()
			hover_style.bg_color = COLOR_CHOICE_HOVER
			hover_style.set_corner_radius_all(2)
			hover_style.content_margin_left = 6
			hover_style.content_margin_right = 4
			hover_style.content_margin_top = 3
			hover_style.content_margin_bottom = 3
			hover_style.border_width_left = 3
			hover_style.border_color = Color(0.85, 0.72, 0.20)
			btn.add_theme_stylebox_override("hover", hover_style)
			btn.pressed.connect(_on_choice_selected.bind(choice_id))

		_choice_container.add_child(btn)

	# Check if any NPC lies can be confronted at this point
	_check_present_evidence_option()


func _on_choice_selected(choice_id: String) -> void:
	_awaiting_choice = false
	_choice_container.visible = false

	# Record the choice
	EventBus.dialogue_choice_made.emit(current_npc_id, choice_id)

	# Find the choice data
	var choice_data: Dictionary = {}
	var current_line: Dictionary = _current_lines[current_line_index] if current_line_index < _current_lines.size() else {}
	var line_choices: Array = current_line.get("choices", [])
	for c in line_choices:
		if c.get("id", "") == choice_id:
			choice_data = c
			break

	# Process choice effects
	var revealed_clues: Array = choice_data.get("reveals_clues", [])
	for clue_data in revealed_clues:
		if clue_data is Dictionary:
			GameState.add_clue(clue_data.get("id", ""), clue_data)
		elif clue_data is String:
			GameState.add_clue(clue_data, {"id": clue_data, "title": clue_data, "description": "", "category": Enums.ClueCategory.TESTIMONY, "importance": 1})

	# Navigate to the leads_to branch or advance
	var leads_to: String = choice_data.get("leads_to", "")
	if not leads_to.is_empty() and leads_to in current_dialogue:
		_current_lines = current_dialogue[leads_to].get("lines", [])
		current_line_index = 0
		_show_current_line()
	else:
		# Just advance to next line
		current_line_index += 1
		if current_line_index >= _current_lines.size():
			_end_dialogue()
		else:
			_show_current_line()


# ---------------------------------------------------------------------------
# Typewriter Effect
# ---------------------------------------------------------------------------

func _show_current_line() -> void:
	if current_line_index >= _current_lines.size():
		_end_dialogue()
		return

	var line: Dictionary = _current_lines[current_line_index]
	_current_text = line.get("text", "")
	var speaker: String = line.get("speaker", current_npc_id)

	# Update speaker display
	var display_name: String = NPC_NAMES.get(speaker, speaker)
	if speaker == "player":
		display_name = "You"
		_portrait_rect.color = Color.WHITE
		_portrait_label.text = "?"
	else:
		_portrait_rect.color = NPC_PORTRAIT_COLORS.get(speaker, Color.GRAY)
		_portrait_label.text = display_name.left(1).to_upper()
	_speaker_label.text = display_name

	# Check truthfulness - if lying and we know it, tint the speaker name
	var is_truthful: bool = line.get("truthful", true)
	if not is_truthful and _player_has_contradicting_evidence(line):
		_speaker_label.add_theme_color_override("font_color", COLOR_LIE_DETECTED)
	else:
		_speaker_label.add_theme_color_override("font_color", COLOR_SPEAKER)

	# Set text and start typewriter
	_text_label.text = _current_text
	_text_label.visible_characters = 0
	_visible_chars = 0
	_is_typing = true
	_continue_indicator.visible = false
	_choice_container.visible = false

	_typewriter_timer.wait_time = typewriter_speed
	_typewriter_timer.start()

	# Record this dialogue
	var dialogue_id: String = line.get("id", "line_%d" % current_line_index)
	GameState.record_npc_dialogue(current_npc_id, dialogue_id)


func _on_typewriter_tick() -> void:
	_visible_chars += 1
	_text_label.visible_characters = _visible_chars

	# Play subtle typewriter click every 8 characters
	if _visible_chars % 8 == 0:
		EventBus.sfx_requested.emit("typewriter")

	if _visible_chars >= _current_text.length():
		_typewriter_timer.stop()
		_is_typing = false
		_text_label.visible_characters = -1
		_continue_indicator.visible = true
		_check_for_choices()


func _check_for_choices() -> void:
	if current_line_index >= _current_lines.size():
		return
	var line: Dictionary = _current_lines[current_line_index]
	var choices: Array = line.get("choices", [])
	if not choices.is_empty():
		show_choices(choices)


# ---------------------------------------------------------------------------
# Lie Detection & Evidence Presentation
# ---------------------------------------------------------------------------

func _player_has_contradicting_evidence(line: Dictionary) -> bool:
	var about_event: String = line.get("about_event", "")
	if about_event.is_empty():
		return false

	# Check if we have contradicting clues for this NPC
	if current_npc_id in GameState.npc_lies_detected:
		return not GameState.npc_lies_detected[current_npc_id].is_empty()

	# Check auto-detected contradictions
	for clue_id in GameState.discovered_clues:
		var clue: Dictionary = GameState.discovered_clues[clue_id]
		if clue.get("category") == Enums.ClueCategory.CONTRADICTION:
			var related: Array = clue.get("related_npcs", [])
			if current_npc_id in related:
				return true
	return false


func _check_present_evidence_option() -> void:
	if current_line_index >= _current_lines.size():
		return

	var line: Dictionary = _current_lines[current_line_index]
	var is_truthful: bool = line.get("truthful", true)

	if not is_truthful and _player_has_contradicting_evidence(line):
		var present_btn := Button.new()
		present_btn.text = "!! Present Evidence !!"
		present_btn.custom_minimum_size = Vector2(520, 16)
		present_btn.add_theme_font_size_override("font_size", 8)
		present_btn.add_theme_color_override("font_color", COLOR_LIE_DETECTED)
		var pe_style := StyleBoxFlat.new()
		pe_style.bg_color = Color(0.3, 0.08, 0.06)
		pe_style.set_border_width_all(1)
		pe_style.border_color = COLOR_LIE_DETECTED
		pe_style.set_corner_radius_all(1)
		pe_style.set_content_margin_all(2)
		present_btn.add_theme_stylebox_override("normal", pe_style)
		var pe_hover := StyleBoxFlat.new()
		pe_hover.bg_color = Color(0.4, 0.1, 0.08)
		pe_hover.set_border_width_all(1)
		pe_hover.border_color = COLOR_LIE_DETECTED
		pe_hover.set_corner_radius_all(1)
		pe_hover.set_content_margin_all(2)
		present_btn.add_theme_stylebox_override("hover", pe_hover)
		present_btn.pressed.connect(_open_present_evidence)
		_choice_container.add_child(present_btn)


func _open_present_evidence() -> void:
	_present_evidence_mode = true
	_evidence_panel.visible = true

	# Clear and rebuild evidence panel
	for child in _evidence_panel.get_children():
		child.queue_free()

	var header := Label.new()
	header.text = "Select evidence to present to %s:" % NPC_NAMES.get(current_npc_id, current_npc_id)
	header.add_theme_font_size_override("font_size", 8)
	header.add_theme_color_override("font_color", COLOR_SPEAKER)
	header.position = Vector2(6, 6)
	header.size = Vector2(590, 14)
	_evidence_panel.add_child(header)

	var close_btn := Button.new()
	close_btn.text = "X"
	close_btn.position = Vector2(584, 4)
	close_btn.size = Vector2(16, 14)
	close_btn.add_theme_font_size_override("font_size", 7)
	close_btn.add_theme_color_override("font_color", COLOR_RED)
	var cls_style := StyleBoxFlat.new()
	cls_style.bg_color = COLOR_CHOICE_NORMAL
	cls_style.set_corner_radius_all(1)
	close_btn.add_theme_stylebox_override("normal", cls_style)
	close_btn.pressed.connect(_close_present_evidence)
	_evidence_panel.add_child(close_btn)

	var scroll := ScrollContainer.new()
	scroll.position = Vector2(6, 24)
	scroll.size = Vector2(596, 118)
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	_evidence_panel.add_child(scroll)

	var vbox := VBoxContainer.new()
	vbox.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	vbox.add_theme_constant_override("separation", 2)
	scroll.add_child(vbox)

	# Show contradicting clues first, then all clues
	var contradicting_clues: Array = []
	if current_npc_id in GameState.npc_lies_detected:
		contradicting_clues = GameState.npc_lies_detected[current_npc_id]

	for clue_id in GameState.discovered_clues:
		var clue: Dictionary = GameState.discovered_clues[clue_id]
		var is_contradicting := clue_id in contradicting_clues or \
			(clue.get("category") == Enums.ClueCategory.CONTRADICTION and \
			 current_npc_id in clue.get("related_npcs", []))

		var clue_btn := Button.new()
		clue_btn.custom_minimum_size = Vector2(580, 22)
		clue_btn.add_theme_font_size_override("font_size", 8)
		clue_btn.alignment = HORIZONTAL_ALIGNMENT_LEFT

		if is_contradicting:
			clue_btn.text = "!! %s" % clue.get("title", clue_id)
			clue_btn.add_theme_color_override("font_color", COLOR_LIE_DETECTED)
			var highlight_style := StyleBoxFlat.new()
			highlight_style.bg_color = Color(0.3, 0.08, 0.06)
			highlight_style.set_border_width_all(1)
			highlight_style.border_color = COLOR_LIE_DETECTED
			highlight_style.set_corner_radius_all(1)
			highlight_style.set_content_margin_all(2)
			clue_btn.add_theme_stylebox_override("normal", highlight_style)
		else:
			clue_btn.text = "  %s" % clue.get("title", clue_id)
			clue_btn.add_theme_color_override("font_color", COLOR_TEXT)
			var normal_style := StyleBoxFlat.new()
			normal_style.bg_color = COLOR_CHOICE_NORMAL
			normal_style.set_corner_radius_all(1)
			normal_style.set_content_margin_all(2)
			clue_btn.add_theme_stylebox_override("normal", normal_style)

		var hover_style := StyleBoxFlat.new()
		hover_style.bg_color = COLOR_CHOICE_HOVER
		hover_style.set_corner_radius_all(1)
		hover_style.set_content_margin_all(2)
		clue_btn.add_theme_stylebox_override("hover", hover_style)

		clue_btn.pressed.connect(_present_evidence_to_npc.bind(clue_id))
		vbox.add_child(clue_btn)


func _present_evidence_to_npc(clue_id: String) -> void:
	_close_present_evidence()
	_awaiting_choice = false

	# Check if this is the right evidence
	var clue: Dictionary = GameState.discovered_clues.get(clue_id, {})
	var is_effective: bool = false

	# Check if this clue contradicts what the NPC said
	if current_npc_id in GameState.npc_lies_detected:
		if clue_id in GameState.npc_lies_detected[current_npc_id]:
			is_effective = true
	if clue.get("category") == Enums.ClueCategory.CONTRADICTION:
		if current_npc_id in clue.get("related_npcs", []):
			is_effective = true

	if is_effective:
		# NPC is caught lying - show confrontation response
		_current_lines = [{
			"text": "I... you have proof? Fine. Let me tell you what really happened.",
			"speaker": current_npc_id,
			"truthful": true,
			"id": "confrontation_success_%s" % clue_id
		}]
		# Reveal the truth branch if it exists
		var truth_branch: String = current_dialogue.get("truth_branch", "")
		if not truth_branch.is_empty() and truth_branch in current_dialogue:
			var truth_lines: Array = current_dialogue[truth_branch].get("lines", [])
			for tl in truth_lines:
				_current_lines.append(tl)

		# Increase trust through confrontation
		if current_npc_id in GameState.known_npcs:
			GameState.known_npcs[current_npc_id]["trust"] += 1

		EventBus.sfx_requested.emit("clue_discovered")
	else:
		# Wrong evidence - NPC deflects
		_current_lines = [{
			"text": "I don't see what that has to do with anything.",
			"speaker": current_npc_id,
			"truthful": true,
			"id": "confrontation_failed_%s" % clue_id
		}]

	current_line_index = 0
	_show_current_line()


func _close_present_evidence() -> void:
	_present_evidence_mode = false
	_evidence_panel.visible = false


func _show_ask_about_panel() -> void:
	# Show clue list to "ask about"
	_present_evidence_mode = true
	_evidence_panel.visible = true

	for child in _evidence_panel.get_children():
		child.queue_free()

	var header := Label.new()
	header.text = "Select a clue to ask %s about:" % NPC_NAMES.get(current_npc_id, current_npc_id)
	header.add_theme_font_size_override("font_size", 8)
	header.add_theme_color_override("font_color", COLOR_SPEAKER)
	header.position = Vector2(6, 6)
	header.size = Vector2(590, 14)
	_evidence_panel.add_child(header)

	var close_btn := Button.new()
	close_btn.text = "X"
	close_btn.position = Vector2(584, 4)
	close_btn.size = Vector2(16, 14)
	close_btn.add_theme_font_size_override("font_size", 7)
	close_btn.add_theme_color_override("font_color", COLOR_RED)
	var cls_style := StyleBoxFlat.new()
	cls_style.bg_color = COLOR_CHOICE_NORMAL
	cls_style.set_corner_radius_all(1)
	close_btn.add_theme_stylebox_override("normal", cls_style)
	close_btn.pressed.connect(_close_present_evidence)
	_evidence_panel.add_child(close_btn)

	var scroll := ScrollContainer.new()
	scroll.position = Vector2(6, 24)
	scroll.size = Vector2(596, 118)
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	_evidence_panel.add_child(scroll)

	var vbox := VBoxContainer.new()
	vbox.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	vbox.add_theme_constant_override("separation", 2)
	scroll.add_child(vbox)

	for clue_id in GameState.discovered_clues:
		var clue: Dictionary = GameState.discovered_clues[clue_id]
		var btn := Button.new()
		btn.text = clue.get("title", clue_id)
		btn.custom_minimum_size = Vector2(580, 22)
		btn.add_theme_font_size_override("font_size", 8)
		btn.add_theme_color_override("font_color", COLOR_TEXT)
		btn.alignment = HORIZONTAL_ALIGNMENT_LEFT
		var btn_style := StyleBoxFlat.new()
		btn_style.bg_color = COLOR_CHOICE_NORMAL
		btn_style.set_corner_radius_all(1)
		btn_style.set_content_margin_all(2)
		btn.add_theme_stylebox_override("normal", btn_style)
		var hover_style := StyleBoxFlat.new()
		hover_style.bg_color = COLOR_CHOICE_HOVER
		hover_style.set_corner_radius_all(1)
		hover_style.set_content_margin_all(2)
		btn.add_theme_stylebox_override("hover", hover_style)
		btn.pressed.connect(_ask_npc_about_clue.bind(clue_id))
		vbox.add_child(btn)


func _ask_npc_about_clue(clue_id: String) -> void:
	_close_present_evidence()
	_awaiting_choice = false

	var clue: Dictionary = GameState.discovered_clues.get(clue_id, {})
	var clue_title: String = clue.get("title", clue_id)

	# Check if the dialogue tree has a response for this clue
	var response_key := "ask_about_%s" % clue_id
	if response_key in current_dialogue:
		_current_lines = current_dialogue[response_key].get("lines", [])
	else:
		# Generic response
		_current_lines = [{
			"text": "Hmm, %s? I don't know much about that." % clue_title,
			"speaker": current_npc_id,
			"truthful": true,
			"id": "ask_generic_%s" % clue_id
		}]

	# Record that we showed this clue to the NPC
	GameState.add_npc_knowledge(current_npc_id, "Asked about: %s" % clue_title)

	current_line_index = 0
	_show_current_line()


# ---------------------------------------------------------------------------
# End Dialogue
# ---------------------------------------------------------------------------

func _end_dialogue() -> void:
	var stored_npc_id := current_npc_id
	is_active = false
	visible = false
	_evidence_panel.visible = false
	_present_evidence_mode = false
	current_npc_id = ""
	current_dialogue = {}
	_current_lines = []
	current_line_index = 0

	get_tree().paused = false

	EventBus.dialogue_ended.emit(stored_npc_id)
	EventBus.npc_interaction_ended.emit(stored_npc_id)


func _on_loop_reset(_loop_number: int) -> void:
	if is_active:
		_end_dialogue()
