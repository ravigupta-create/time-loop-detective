extends AnimatedSprite2D
## Generates procedural player sprite on ready.

func _ready() -> void:
	sprite_frames = _generate_player_sprite()


func _generate_player_sprite() -> SpriteFrames:
	var frames := SpriteFrames.new()

	# Player colors
	var coat_color := Color(0.25, 0.25, 0.35) # Dark trenchcoat
	var shirt_color := Color(0.85, 0.85, 0.8) # White shirt
	var skin_color := Color(0.92, 0.78, 0.65)
	var hair_color := Color(0.2, 0.15, 0.1) # Dark brown
	var pants_color := Color(0.18, 0.18, 0.22)
	var shoe_color := Color(0.12, 0.1, 0.08)

	# Generate frames for each animation
	for dir in ["down", "up", "left", "right"]:
		# Idle animation (2 frames)
		frames.add_animation("idle_" + dir)
		frames.set_animation_speed("idle_" + dir, 2)
		frames.set_animation_loop("idle_" + dir, true)
		for f in 2:
			var img := _draw_player_frame(dir, f, false, coat_color, shirt_color, skin_color, hair_color, pants_color, shoe_color)
			var tex := ImageTexture.create_from_image(img)
			frames.add_frame("idle_" + dir, tex)

		# Walk animation (4 frames)
		frames.add_animation("walk_" + dir)
		frames.set_animation_speed("walk_" + dir, 8)
		frames.set_animation_loop("walk_" + dir, true)
		for f in 4:
			var img := _draw_player_frame(dir, f, true, coat_color, shirt_color, skin_color, hair_color, pants_color, shoe_color)
			var tex := ImageTexture.create_from_image(img)
			frames.add_frame("walk_" + dir, tex)

	# Default idle
	frames.add_animation("idle")
	frames.set_animation_speed("idle", 2)
	frames.set_animation_loop("idle", true)
	for f in 2:
		var img := _draw_player_frame("down", f, false, coat_color, shirt_color, skin_color, hair_color, pants_color, shoe_color)
		var tex := ImageTexture.create_from_image(img)
		frames.add_frame("idle", tex)

	return frames


func _draw_player_frame(direction: String, frame: int, walking: bool, coat: Color, shirt: Color, skin: Color, hair: Color, pants: Color, shoes: Color) -> Image:
	var w := Constants.NPC_SPRITE_WIDTH
	var h := Constants.NPC_SPRITE_HEIGHT
	var img := Image.create(w, h, false, Image.FORMAT_RGBA8)
	img.fill(Color(0, 0, 0, 0))

	var bob := 0
	if walking:
		bob = 1 if (frame % 2 == 0) else 0

	# Head (4x4 at top center)
	var head_x := w / 2 - 2
	var head_y := 1 + bob
	for x in range(head_x, head_x + 4):
		for y in range(head_y, head_y + 4):
			img.set_pixel(x, y, skin)

	# Hair on top
	match direction:
		"down", "left", "right":
			for x in range(head_x, head_x + 4):
				img.set_pixel(x, head_y, hair)
				img.set_pixel(x, head_y - 1 if head_y > 0 else head_y, hair)
			img.set_pixel(head_x, head_y + 1, hair)
			img.set_pixel(head_x + 3, head_y + 1, hair)
		"up":
			for x in range(head_x, head_x + 4):
				img.set_pixel(x, head_y, hair)
				img.set_pixel(x, head_y + 1, hair)
				if head_y > 0:
					img.set_pixel(x, head_y - 1, hair)

	# Eyes (facing direction)
	if direction != "up":
		var eye_y := head_y + 2
		match direction:
			"down":
				img.set_pixel(head_x + 1, eye_y, Color(0.1, 0.1, 0.2))
				img.set_pixel(head_x + 2, eye_y, Color(0.1, 0.1, 0.2))
			"left":
				img.set_pixel(head_x, eye_y, Color(0.1, 0.1, 0.2))
				img.set_pixel(head_x + 1, eye_y, Color(0.1, 0.1, 0.2))
			"right":
				img.set_pixel(head_x + 2, eye_y, Color(0.1, 0.1, 0.2))
				img.set_pixel(head_x + 3, eye_y, Color(0.1, 0.1, 0.2))

	# Body / Trenchcoat (6x8)
	var body_x := w / 2 - 3
	var body_y := head_y + 4
	for x in range(body_x, body_x + 6):
		for y in range(body_y, body_y + 8):
			if y < body_y + 2:
				img.set_pixel(x, y, shirt) # Collar
			else:
				img.set_pixel(x, y, coat)
	# Coat lapels
	img.set_pixel(body_x, body_y + 2, coat.darkened(0.2))
	img.set_pixel(body_x + 5, body_y + 2, coat.darkened(0.2))

	# Arms
	var arm_swing := 0
	if walking:
		arm_swing = 1 if (frame < 2) else -1
	match direction:
		"down", "up":
			img.set_pixel(body_x - 1, body_y + 2 + arm_swing, coat)
			img.set_pixel(body_x - 1, body_y + 3 + arm_swing, skin)
			img.set_pixel(body_x + 6, body_y + 2 - arm_swing, coat)
			img.set_pixel(body_x + 6, body_y + 3 - arm_swing, skin)
		"left":
			img.set_pixel(body_x - 1, body_y + 2, coat)
			img.set_pixel(body_x - 1, body_y + 3, skin)
		"right":
			img.set_pixel(body_x + 6, body_y + 2, coat)
			img.set_pixel(body_x + 6, body_y + 3, skin)

	# Legs / pants
	var leg_y := body_y + 8
	var leg_offset := 0
	if walking:
		leg_offset = 1 if (frame % 2 == 0) else -1

	# Left leg
	for y in range(leg_y, mini(leg_y + 3, h)):
		img.set_pixel(body_x + 1, y, pants)
		img.set_pixel(body_x + 2, y, pants)
	# Right leg
	for y in range(leg_y, mini(leg_y + 3, h)):
		img.set_pixel(body_x + 3, y, pants)
		img.set_pixel(body_x + 4, y, pants)

	# Shoes
	var shoe_y := mini(leg_y + 3, h - 1)
	if shoe_y < h:
		img.set_pixel(body_x + 1, shoe_y, shoes)
		img.set_pixel(body_x + 2, shoe_y, shoes)
		img.set_pixel(body_x + 3, shoe_y, shoes)
		img.set_pixel(body_x + 4, shoe_y, shoes)

	# Walking leg animation
	if walking and leg_offset != 0:
		if shoe_y + leg_offset >= 0 and shoe_y + leg_offset < h:
			img.set_pixel(body_x + 1, shoe_y, Color(0, 0, 0, 0))
			img.set_pixel(body_x + 2, shoe_y, Color(0, 0, 0, 0))
			var new_shoe_y := clampi(shoe_y + leg_offset, 0, h - 1)
			img.set_pixel(body_x + 1, new_shoe_y, shoes)
			img.set_pixel(body_x + 2, new_shoe_y, shoes)

	return img
