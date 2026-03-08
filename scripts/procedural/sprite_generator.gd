class_name SpriteGenerator
## Static utility for procedurally generating 16x24 pixel character sprites.
## Each character is built from a seed + job + gender, composing 5 layers:
##   1. Body base (skin tone derived from seed)
##   2. Clothing  (job-based palette)
##   3. Hair      (8 styles, 12 colours, selected from seed)
##   4. Face      (simple eyes + mouth)
##   5. Accessories (job-specific details)
##
## Generated SpriteFrames are cached in a static Dictionary keyed by seed so
## repeated requests for the same character are instantaneous.

const W := Constants.NPC_SPRITE_WIDTH   # 16
const H := Constants.NPC_SPRITE_HEIGHT  # 24

## Cache: seed -> SpriteFrames
static var _cache: Dictionary = {}


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

## Generates (or returns cached) SpriteFrames for a character.
## [param seed_val] deterministic seed controlling skin, hair, accessories.
## [param job]      one of the recognised job strings (see Palette.get_job_palette).
## [param gender]   "male" or "female" -- affects body/hair defaults.
static func generate_character(seed_val: int, job: String, gender: String) -> SpriteFrames:
	if seed_val in _cache:
		return _cache[seed_val]

	var rng := RandomNumberGenerator.new()
	rng.seed = seed_val

	# Resolve palette elements from seed
	var skin_tones := Palette.get_skin_tones()
	var skin_color: Color = skin_tones[rng.randi() % skin_tones.size()]

	var hair_colors := Palette.get_hair_colors()
	var hair_color: Color = hair_colors[rng.randi() % hair_colors.size()]
	var hair_style: int = rng.randi() % 8  # 0-7

	var job_palette := Palette.get_job_palette(job)
	var cloth_primary: Color   = job_palette[0]
	var cloth_secondary: Color = job_palette[1]
	var cloth_accent: Color    = job_palette[2]

	# Eye color (small variation)
	var eye_colors: Array[Color] = [
		Color(0.2, 0.15, 0.1),   # dark brown
		Color(0.3, 0.5, 0.3),    # green
		Color(0.25, 0.35, 0.6),  # blue
		Color(0.45, 0.3, 0.15),  # hazel
	]
	var eye_color: Color = eye_colors[rng.randi() % eye_colors.size()]

	# Build a context dict so every draw helper can share state
	var ctx := {
		"skin": skin_color,
		"hair_color": hair_color,
		"hair_style": hair_style,
		"cloth_primary": cloth_primary,
		"cloth_secondary": cloth_secondary,
		"cloth_accent": cloth_accent,
		"eye_color": eye_color,
		"job": job,
		"gender": gender,
		"rng": rng,
	}

	var sf := SpriteFrames.new()
	# Remove the default animation that Godot creates
	if sf.has_animation(&"default"):
		sf.remove_animation(&"default")

	# -- idle (2 frames) --
	sf.add_animation(&"idle")
	sf.set_animation_speed(&"idle", 2.0)
	sf.set_animation_loop(&"idle", true)
	for f in range(2):
		var img := _create_frame(ctx, "idle", f)
		sf.add_frame(&"idle", ImageTexture.create_from_image(img))

	# -- walk_down / walk_up / walk_left / walk_right (4 frames each) --
	for dir_name in ["walk_down", "walk_up", "walk_left", "walk_right"]:
		var anim_name := StringName(dir_name)
		sf.add_animation(anim_name)
		sf.set_animation_speed(anim_name, 6.0)
		sf.set_animation_loop(anim_name, true)
		for f in range(4):
			var img := _create_frame(ctx, dir_name, f)
			sf.add_frame(anim_name, ImageTexture.create_from_image(img))

	# -- talk (2 frames) --
	sf.add_animation(&"talk")
	sf.set_animation_speed(&"talk", 3.0)
	sf.set_animation_loop(&"talk", true)
	for f in range(2):
		var img := _create_frame(ctx, "talk", f)
		sf.add_frame(&"talk", ImageTexture.create_from_image(img))

	_cache[seed_val] = sf
	return sf


## Clears the sprite cache (e.g. on loop reset if you want to regenerate).
static func clear_cache() -> void:
	_cache.clear()


# ---------------------------------------------------------------------------
# Frame composition
# ---------------------------------------------------------------------------

## Builds a single W x H Image for the given animation + frame index.
static func _create_frame(ctx: Dictionary, anim: String, frame_idx: int) -> Image:
	var img := Image.create(W, H, false, Image.FORMAT_RGBA8)
	# All pixels start fully transparent
	img.fill(Color(0, 0, 0, 0))

	# Determine facing
	var facing := "down"
	match anim:
		"idle":
			facing = "down"
		"walk_down":
			facing = "down"
		"walk_up":
			facing = "up"
		"walk_left":
			facing = "left"
		"walk_right":
			facing = "right"
		"talk":
			facing = "down"

	# Walk bob offset -- slight vertical bounce for walk anims
	var y_offset := 0
	if anim.begins_with("walk"):
		# frames 0,2 are neutral; 1,3 bob down/up by 1px
		y_offset = -1 if (frame_idx % 2 == 1) else 0

	# Layer 1: Body base
	_draw_body(img, ctx, facing, frame_idx, y_offset)
	# Layer 2: Clothing
	_draw_clothing(img, ctx, facing, frame_idx, y_offset)
	# Layer 3: Hair
	_draw_hair(img, ctx, facing, y_offset)
	# Layer 4: Face
	if facing != "up":
		_draw_face(img, ctx, facing, anim, frame_idx, y_offset)
	# Layer 5: Accessories
	_draw_accessories(img, ctx, facing, y_offset)

	return img


# ---------------------------------------------------------------------------
# Layer 1 -- Body
# ---------------------------------------------------------------------------

static func _draw_body(img: Image, ctx: Dictionary, facing: String, frame_idx: int, y_off: int) -> void:
	var skin: Color = ctx["skin"]
	var skin_shadow := skin.darkened(0.15)

	# Head (rows 1-6, centered) -- 6x6 oval-ish
	_fill_rect_img(img, 5, 1 + y_off, 6, 6, skin)
	# Round the corners of the head
	_safe_set(img, 5, 1 + y_off, Color(0, 0, 0, 0))
	_safe_set(img, 10, 1 + y_off, Color(0, 0, 0, 0))
	_safe_set(img, 5, 6 + y_off, Color(0, 0, 0, 0))
	_safe_set(img, 10, 6 + y_off, Color(0, 0, 0, 0))

	# Neck (row 7)
	_fill_rect_img(img, 7, 7 + y_off, 2, 1, skin)

	# Torso (rows 8-15)
	_fill_rect_img(img, 4, 8 + y_off, 8, 8, skin_shadow)

	# Arms (rows 8-14)
	_fill_rect_img(img, 2, 8 + y_off, 2, 7, skin)   # left arm
	_fill_rect_img(img, 12, 8 + y_off, 2, 7, skin)   # right arm

	# Legs (rows 16-22)
	var leg_spread := 0
	if facing == "down" or facing == "up":
		# Walk animation: alternate leg positions
		if frame_idx == 1:
			leg_spread = 1
		elif frame_idx == 3:
			leg_spread = -1
	elif facing == "left":
		leg_spread = -1 if (frame_idx % 2 == 1) else 0
	elif facing == "right":
		leg_spread = 1 if (frame_idx % 2 == 1) else 0

	var left_leg_x := 5 + mini(leg_spread, 0)
	var right_leg_x := 9 + maxi(leg_spread, 0)

	_fill_rect_img(img, left_leg_x, 16 + y_off, 3, 7, skin_shadow)  # left leg
	_fill_rect_img(img, right_leg_x, 16 + y_off, 3, 7, skin_shadow) # right leg

	# Feet (row 22-23)
	var shoe_color := Color(0.2, 0.15, 0.1)
	_fill_rect_img(img, left_leg_x, 22 + y_off, 3, 2, shoe_color)
	_fill_rect_img(img, right_leg_x, 22 + y_off, 3, 2, shoe_color)


# ---------------------------------------------------------------------------
# Layer 2 -- Clothing
# ---------------------------------------------------------------------------

static func _draw_clothing(img: Image, ctx: Dictionary, facing: String, frame_idx: int, y_off: int) -> void:
	var primary: Color = ctx["cloth_primary"]
	var secondary: Color = ctx["cloth_secondary"]
	var accent: Color = ctx["cloth_accent"]
	var job: String = ctx["job"]

	# Base shirt/torso overlay (rows 8-15)
	_fill_rect_img(img, 4, 8 + y_off, 8, 8, primary)
	# Sleeves
	_fill_rect_img(img, 2, 8 + y_off, 2, 5, primary.darkened(0.1))
	_fill_rect_img(img, 12, 8 + y_off, 2, 5, primary.darkened(0.1))

	# Collar / neckline
	_safe_set(img, 7, 8 + y_off, secondary)
	_safe_set(img, 8, 8 + y_off, secondary)

	# Pants (rows 16-21)
	var pants_color := primary.darkened(0.3)
	var leg_spread := 0
	if frame_idx == 1:
		leg_spread = 1
	elif frame_idx == 3:
		leg_spread = -1
	var left_leg_x := 5 + mini(leg_spread, 0)
	var right_leg_x := 9 + maxi(leg_spread, 0)
	_fill_rect_img(img, left_leg_x, 16 + y_off, 3, 6, pants_color)
	_fill_rect_img(img, right_leg_x, 16 + y_off, 3, 6, pants_color)

	# Job-specific clothing details
	match job:
		"bartender":
			# Dark vest - accent stripe down the front
			_fill_rect_img(img, 6, 9 + y_off, 1, 6, accent)
			_fill_rect_img(img, 9, 9 + y_off, 1, 6, accent)
		"cafe_owner":
			# Apron (lighter rectangle over torso/legs)
			_fill_rect_img(img, 5, 10 + y_off, 6, 8, secondary)
			# Apron strings
			_safe_set(img, 5, 10 + y_off, accent)
			_safe_set(img, 10, 10 + y_off, accent)
		"detective":
			# Trenchcoat extends over torso + upper legs
			_fill_rect_img(img, 3, 8 + y_off, 10, 10, primary)
			# Coat lapels
			_safe_set(img, 5, 8 + y_off, secondary)
			_safe_set(img, 10, 8 + y_off, secondary)
			_safe_set(img, 5, 9 + y_off, secondary)
			_safe_set(img, 10, 9 + y_off, secondary)
			# Belt
			_fill_rect_img(img, 4, 14 + y_off, 8, 1, accent)
		"journalist":
			# Casual - open collar
			_safe_set(img, 6, 8 + y_off, accent)
			_safe_set(img, 9, 8 + y_off, accent)
			# Notepad in pocket
			_fill_rect_img(img, 5, 11 + y_off, 2, 2, Color(0.95, 0.92, 0.8))
		"businessman":
			# Suit jacket with tie
			_fill_rect_img(img, 7, 8 + y_off, 2, 7, secondary)  # shirt front
			# Tie
			for ty in range(8, 14):
				_safe_set(img, 8, ty + y_off, accent)
		"pickpocket":
			# Hoodie - hood outline around head
			_safe_set(img, 4, 3 + y_off, primary.darkened(0.1))
			_safe_set(img, 11, 3 + y_off, primary.darkened(0.1))
			_safe_set(img, 4, 4 + y_off, primary.darkened(0.1))
			_safe_set(img, 11, 4 + y_off, primary.darkened(0.1))
			_safe_set(img, 4, 5 + y_off, primary.darkened(0.1))
			_safe_set(img, 11, 5 + y_off, primary.darkened(0.1))
			# Kangaroo pocket
			_fill_rect_img(img, 6, 12 + y_off, 4, 2, secondary)
		"doctor":
			# White coat extending below torso
			_fill_rect_img(img, 3, 8 + y_off, 10, 10, primary)
			# Stethoscope hint (single accent pixel near neck)
			_safe_set(img, 6, 8 + y_off, accent)
			_safe_set(img, 6, 9 + y_off, accent)
			_safe_set(img, 7, 9 + y_off, accent)
		"mysterious":
			# Dark cloak covering most of the body
			_fill_rect_img(img, 2, 4 + y_off, 12, 14, primary)
			# Cloak clasp
			_safe_set(img, 8, 7 + y_off, accent)
		"mayor":
			# Formal suit with sash
			_fill_rect_img(img, 7, 8 + y_off, 2, 7, secondary)  # shirt front
			# Diagonal sash
			for i in range(6):
				_safe_set(img, 5 + i, 9 + i + y_off, accent)
		"delivery":
			# Uniform with cap visor (handled in accessories)
			# Utility belt
			_fill_rect_img(img, 4, 15 + y_off, 8, 1, accent)
			# Logo patch
			_fill_rect_img(img, 5, 10 + y_off, 2, 2, secondary)


# ---------------------------------------------------------------------------
# Layer 3 -- Hair
# ---------------------------------------------------------------------------

static func _draw_hair(img: Image, ctx: Dictionary, facing: String, y_off: int) -> void:
	var hc: Color = ctx["hair_color"]
	var style: int = ctx["hair_style"]
	var gender: String = ctx["gender"]

	# hair_style mapping:
	#  0 = short    1 = long    2 = ponytail  3 = bald
	#  4 = buzz     5 = mohawk  6 = curly     7 = bob

	match style:
		0:  # short -- covers top of head
			_fill_rect_img(img, 5, 0 + y_off, 6, 3, hc)
			# Side burns
			_safe_set(img, 5, 3 + y_off, hc)
			_safe_set(img, 10, 3 + y_off, hc)
		1:  # long -- flows down past shoulders
			_fill_rect_img(img, 5, 0 + y_off, 6, 3, hc)
			# Sides flowing down
			_fill_rect_img(img, 4, 1 + y_off, 1, 8, hc)
			_fill_rect_img(img, 11, 1 + y_off, 1, 8, hc)
			# Back (visible from front as side wisps)
			_safe_set(img, 4, 9 + y_off, hc.darkened(0.1))
			_safe_set(img, 11, 9 + y_off, hc.darkened(0.1))
		2:  # ponytail -- short on top + tail hanging back
			_fill_rect_img(img, 5, 0 + y_off, 6, 3, hc)
			# Ponytail goes out the back (show on left/right side)
			if facing == "left" or facing == "right":
				_fill_rect_img(img, 4, 3 + y_off, 1, 5, hc)
			else:
				# From front/back, show a small tuft
				_safe_set(img, 8, 0 + y_off, hc.lightened(0.1))
				# Tail behind
				_fill_rect_img(img, 7, 0 + y_off, 2, 1, hc)
				_safe_set(img, 8, -1 + y_off, hc) if (y_off + 0) > 0 else null
		3:  # bald -- no hair drawn, just a subtle scalp highlight
			_safe_set(img, 7, 1 + y_off, ctx["skin"].lightened(0.1))
			_safe_set(img, 8, 1 + y_off, ctx["skin"].lightened(0.1))
		4:  # buzz -- very thin hair cap
			_fill_rect_img(img, 5, 1 + y_off, 6, 2, hc.darkened(0.2))
			_safe_set(img, 6, 1 + y_off, hc)
			_safe_set(img, 9, 1 + y_off, hc)
		5:  # mohawk -- strip down the centre, tall
			_fill_rect_img(img, 7, -1 + y_off, 2, 3, hc)
			_fill_rect_img(img, 7, 1 + y_off, 2, 2, hc.lightened(0.15))
		6:  # curly -- rounder, extends slightly wider
			_fill_rect_img(img, 4, 0 + y_off, 8, 3, hc)
			# Curly bumps
			_safe_set(img, 4, 3 + y_off, hc)
			_safe_set(img, 11, 3 + y_off, hc)
			_safe_set(img, 5, 0 + y_off, hc.lightened(0.1))
			_safe_set(img, 8, 0 + y_off, hc.lightened(0.1))
			_safe_set(img, 4, 1 + y_off, hc.darkened(0.1))
			_safe_set(img, 11, 1 + y_off, hc.darkened(0.1))
		7:  # bob -- chin-length, rounded
			_fill_rect_img(img, 5, 0 + y_off, 6, 3, hc)
			_fill_rect_img(img, 4, 1 + y_off, 1, 6, hc)
			_fill_rect_img(img, 11, 1 + y_off, 1, 6, hc)
			# Slight inward curve at bottom
			_safe_set(img, 5, 6 + y_off, hc.darkened(0.1))
			_safe_set(img, 10, 6 + y_off, hc.darkened(0.1))


# ---------------------------------------------------------------------------
# Layer 4 -- Face
# ---------------------------------------------------------------------------

static func _draw_face(img: Image, ctx: Dictionary, facing: String, anim: String, frame_idx: int, y_off: int) -> void:
	var eye_c: Color = ctx["eye_color"]
	var skin: Color = ctx["skin"]

	if facing == "down" or facing == "left" or facing == "right":
		# Eyes at row 3-4 of head (absolute row 3-4)
		var left_eye_x := 6
		var right_eye_x := 9

		if facing == "left":
			left_eye_x = 5
			right_eye_x = 7
		elif facing == "right":
			left_eye_x = 8
			right_eye_x = 10

		# Eye whites
		_safe_set(img, left_eye_x, 3 + y_off, Color(0.95, 0.95, 0.95))
		_safe_set(img, right_eye_x, 3 + y_off, Color(0.95, 0.95, 0.95))
		# Pupils
		_safe_set(img, left_eye_x, 4 + y_off, eye_c)
		_safe_set(img, right_eye_x, 4 + y_off, eye_c)

		# Mouth -- row 5-6
		var mouth_x := 7
		if facing == "left":
			mouth_x = 6
		elif facing == "right":
			mouth_x = 9

		var mouth_color := skin.darkened(0.25)
		if anim == "talk" and frame_idx == 1:
			# Open mouth
			_safe_set(img, mouth_x, 5 + y_off, Color(0.3, 0.1, 0.1))
			_safe_set(img, mouth_x + 1, 5 + y_off, Color(0.3, 0.1, 0.1))
		else:
			# Closed mouth (thin line)
			_safe_set(img, mouth_x, 5 + y_off, mouth_color)
			_safe_set(img, mouth_x + 1, 5 + y_off, mouth_color)


# ---------------------------------------------------------------------------
# Layer 5 -- Accessories
# ---------------------------------------------------------------------------

static func _draw_accessories(img: Image, ctx: Dictionary, facing: String, y_off: int) -> void:
	var job: String = ctx["job"]
	var accent: Color = ctx["cloth_accent"]

	match job:
		"detective":
			# Hat brim (row 0-1, slightly wider than head)
			_fill_rect_img(img, 4, 0 + y_off, 8, 1, Color(0.35, 0.30, 0.25))
			# Hat crown
			_fill_rect_img(img, 5, -1 + y_off, 6, 1, Color(0.38, 0.33, 0.27))
		"delivery":
			# Cap
			_fill_rect_img(img, 5, 0 + y_off, 6, 2, accent)
			# Visor
			if facing == "down" or facing == "left" or facing == "right":
				_fill_rect_img(img, 4, 2 + y_off, 3, 1, accent.darkened(0.2))
		"doctor":
			# Head mirror / small circle on forehead
			_safe_set(img, 8, 1 + y_off, Color(0.85, 0.9, 0.95))
		"mysterious":
			# Hood over head
			_fill_rect_img(img, 4, 0 + y_off, 8, 4, ctx["cloth_primary"])
			# Eye slits visible
			if facing != "up":
				_safe_set(img, 6, 3 + y_off, ctx["eye_color"])
				_safe_set(img, 9, 3 + y_off, ctx["eye_color"])
		"mayor":
			# Top hat
			_fill_rect_img(img, 5, -1 + y_off, 6, 1, Color(0.1, 0.1, 0.15))
			_fill_rect_img(img, 4, 0 + y_off, 8, 1, Color(0.1, 0.1, 0.15))
			# Hat band
			_fill_rect_img(img, 5, 0 + y_off, 6, 1, accent)
		"journalist":
			# Press badge on chest
			_fill_rect_img(img, 10, 9 + y_off, 2, 2, Color(0.9, 0.85, 0.6))
			_safe_set(img, 10, 9 + y_off, accent)
		"businessman":
			# Briefcase in hand (shows on the side)
			if facing == "down" or facing == "left":
				_fill_rect_img(img, 1, 13 + y_off, 2, 3, Color(0.35, 0.2, 0.1))
				_safe_set(img, 1, 13 + y_off, Color(0.7, 0.6, 0.2))  # clasp
		"pickpocket":
			# Hood pulled up (overlaps hair)
			_fill_rect_img(img, 4, 0 + y_off, 8, 3, ctx["cloth_primary"].lightened(0.05))


# ---------------------------------------------------------------------------
# Drawing utilities
# ---------------------------------------------------------------------------

## Sets a single pixel, silently clamping out-of-bounds coordinates.
static func _safe_set(img: Image, x: int, y: int, color: Color) -> void:
	if x >= 0 and x < W and y >= 0 and y < H:
		img.set_pixel(x, y, color)


## Fills a rectangular region, clipping to the image bounds.
static func _fill_rect_img(img: Image, rx: int, ry: int, rw: int, rh: int, color: Color) -> void:
	for y in range(maxi(ry, 0), mini(ry + rh, H)):
		for x in range(maxi(rx, 0), mini(rx + rw, W)):
			img.set_pixel(x, y, color)
