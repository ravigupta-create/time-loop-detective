extends Node
## Music/ambience/SFX management with crossfade between locations.

var _music_player: AudioStreamPlayer
var _ambience_player: AudioStreamPlayer
var _sfx_players: Array[AudioStreamPlayer] = []
var _crossfade_tween: Tween
var _duck_tween: Tween

var music_volume: float = 0.8
var sfx_volume: float = 1.0
var ambience_volume: float = 0.6
var _conspiracy_intensity: float = 0.0

const MAX_SFX_PLAYERS: int = 8


func _ready() -> void:
	_music_player = AudioStreamPlayer.new()
	_music_player.bus = "Music"
	add_child(_music_player)

	_ambience_player = AudioStreamPlayer.new()
	_ambience_player.bus = "Music"
	add_child(_ambience_player)

	for i in MAX_SFX_PLAYERS:
		var player := AudioStreamPlayer.new()
		player.bus = "Master"
		add_child(player)
		_sfx_players.append(player)

	EventBus.sfx_requested.connect(play_sfx)
	EventBus.music_change_requested.connect(play_music)
	EventBus.ambience_change_requested.connect(play_ambience)
	EventBus.loop_ending_soon.connect(_on_loop_ending)
	EventBus.conspiracy_progress_changed.connect(_on_conspiracy_progress_changed)
	EventBus.notebook_opened.connect(_duck_audio)
	EventBus.notebook_closed.connect(_unduck_audio)
	EventBus.game_paused.connect(_duck_audio)
	EventBus.game_resumed.connect(_unduck_audio)


func play_music(track_name: String) -> void:
	# Crossfade to new track
	if _crossfade_tween:
		_crossfade_tween.kill()
	_crossfade_tween = create_tween()
	_crossfade_tween.tween_property(_music_player, "volume_db", -40.0, 1.0)
	_crossfade_tween.tween_callback(_start_new_music.bind(track_name))
	_crossfade_tween.tween_property(_music_player, "volume_db", linear_to_db(music_volume), 1.0)


func _start_new_music(track_name: String) -> void:
	var stream := _generate_music_stream(track_name)
	if stream:
		_music_player.stream = stream
		_music_player.play()


func play_ambience(ambience_name: String) -> void:
	var stream := _generate_ambience_stream(ambience_name)
	if stream:
		_ambience_player.stream = stream
		_ambience_player.volume_db = linear_to_db(ambience_volume)
		_ambience_player.play()


func play_sfx(sfx_name: String) -> void:
	var player := _get_available_sfx_player()
	if player:
		var stream := _generate_sfx(sfx_name)
		if stream:
			player.stream = stream
			player.volume_db = linear_to_db(sfx_volume)
			player.play()


func _get_available_sfx_player() -> AudioStreamPlayer:
	for player in _sfx_players:
		if not player.playing:
			return player
	return _sfx_players[0] # Steal oldest


func _on_loop_ending(seconds_remaining: float) -> void:
	# Intensify clock ticking as time runs out
	if seconds_remaining <= 30.0:
		var urgency := 1.0 - (seconds_remaining / 30.0)
		_music_player.pitch_scale = 1.0 + urgency * 0.15


func _generate_music_stream(track_name: String) -> AudioStream:
	# Procedural looping pad — location-specific chord progressions
	var generator := AudioStreamWAV.new()
	generator.format = AudioStreamWAV.FORMAT_8_BITS
	generator.mix_rate = 22050
	generator.stereo = false
	generator.loop_mode = AudioStreamWAV.LOOP_FORWARD
	var duration := 5.0 # 5 second loop
	var sample_count := int(22050.0 * duration)
	var samples := PackedByteArray()

	# Choose chord frequencies based on location
	var root := 220.0  # A3 default
	var third := 261.6
	var fifth := 329.6
	match track_name:
		"bar_crossroads":
			root = 220.0; third = 261.6; fifth = 330.0  # Am
		"cafe_rosetta":
			root = 261.6; third = 329.6; fifth = 392.0  # C major
		"back_alley":
			root = 196.0; third = 233.1; fifth = 293.7  # G minor
		"riverside_park":
			root = 293.7; third = 370.0; fifth = 440.0  # D major
		"docks":
			root = 174.6; third = 207.7; fifth = 261.6  # F minor
		"police_station":
			root = 246.9; third = 293.7; fifth = 370.0  # B minor
		"city_hall":
			root = 261.6; third = 329.6; fifth = 392.0  # C major
		"hotel_marlow":
			root = 233.1; third = 277.2; fifth = 349.2  # Bb minor
		"street_market":
			root = 329.6; third = 415.3; fifth = 493.9  # E major
		"apartment_complex":
			root = 220.0; third = 277.2; fifth = 330.0  # Am

	var ci := _conspiracy_intensity
	for i in sample_count:
		var t := float(i) / 22050.0
		var env := 0.25 * (1.0 + sin(t * 0.4 * TAU)) * 0.5  # Slow swell
		# Core pad (reduced levels to make room)
		var pad := sin(t * root * TAU) * 0.3
		pad += sin(t * third * TAU) * 0.18
		pad += sin(t * fifth * TAU) * 0.14
		# Sub-bass
		pad += sin(t * root * 0.5 * TAU) * 0.12
		# Overtone shimmer (scales with conspiracy intensity)
		var shimmer_amp := 0.04 + ci * 0.06
		pad += sin(t * root * 3.0 * TAU) * shimmer_amp * (0.5 + 0.5 * sin(t * 0.7 * TAU))
		# Subtle vibrato
		pad += sin(t * root * 1.005 * TAU) * 0.06
		# Rhythmic pulse at ~100 BPM (scales with conspiracy)
		var pulse_rate := 1.67 + ci * 0.5
		var pulse_env := sin(t * pulse_rate * TAU)
		pulse_env = pulse_env * pulse_env  # Squared for sharper pulse
		pad *= 1.0 + pulse_env * (0.15 + ci * 0.25)
		var val := pad * env
		samples.append(int(clampf(val, -1.0, 1.0) * 127.0 + 128.0))

	generator.data = samples
	generator.loop_end = sample_count
	return generator


func _generate_ambience_stream(ambience_name: String) -> AudioStream:
	# Location-specific ambient textures
	var generator := AudioStreamWAV.new()
	generator.format = AudioStreamWAV.FORMAT_8_BITS
	generator.mix_rate = 22050
	generator.stereo = false
	generator.loop_mode = AudioStreamWAV.LOOP_FORWARD
	var duration := 4.0
	var sample_count := int(22050.0 * duration)
	var samples := PackedByteArray()
	var rng := RandomNumberGenerator.new()
	rng.seed = ambience_name.hash()

	match ambience_name:
		"cafe_rosetta":
			# Cafe murmur: filtered noise + occasional clink
			for i in sample_count:
				var t := float(i) / 22050.0
				var murmur := (rng.randf() * 2.0 - 1.0) * 0.08
				murmur += sin(t * 180.0 * TAU) * 0.02 * sin(t * 0.5 * TAU)
				# Occasional clink
				var clink_phase := fmod(t, 1.8)
				if clink_phase < 0.01:
					murmur += sin(clink_phase * 3000.0 * TAU) * 0.15
				samples.append(int(clampf(murmur, -1.0, 1.0) * 127.0 + 128.0))
		"riverside_park":
			# Water lapping + birds
			for i in sample_count:
				var t := float(i) / 22050.0
				var water := sin(t * 2.5 * TAU) * (rng.randf() * 0.06 + 0.02)
				water += (rng.randf() * 2.0 - 1.0) * 0.03 * sin(t * 1.2 * TAU)
				# Bird chirp
				var chirp_t := fmod(t, 2.5)
				if chirp_t > 1.8 and chirp_t < 1.85:
					water += sin((chirp_t - 1.8) * 4000.0 * TAU) * 0.1 * (1.85 - chirp_t) * 20.0
				samples.append(int(clampf(water, -1.0, 1.0) * 127.0 + 128.0))
		"back_alley":
			# Wind + dripping
			for i in sample_count:
				var t := float(i) / 22050.0
				var wind := (rng.randf() * 2.0 - 1.0) * 0.05 * (0.5 + 0.5 * sin(t * 0.3 * TAU))
				# Drip
				var drip_t := fmod(t, 1.4)
				if drip_t < 0.005:
					wind += sin(drip_t * 2500.0 * TAU) * 0.2 * (0.005 - drip_t) * 200.0
				samples.append(int(clampf(wind, -1.0, 1.0) * 127.0 + 128.0))
		"street_market":
			# Crowd buzz + vendor calls
			for i in sample_count:
				var t := float(i) / 22050.0
				var crowd := (rng.randf() * 2.0 - 1.0) * 0.1
				crowd += sin(t * 220.0 * TAU) * 0.02 * sin(t * 0.8 * TAU)
				crowd *= 0.5 + 0.5 * sin(t * 0.2 * TAU)
				samples.append(int(clampf(crowd, -1.0, 1.0) * 127.0 + 128.0))
		"docks":
			# Deep water + creaking
			for i in sample_count:
				var t := float(i) / 22050.0
				var water := sin(t * 1.0 * TAU) * (rng.randf() * 0.05 + 0.03)
				water += (rng.randf() * 2.0 - 1.0) * 0.04
				# Creak
				var creak_t := fmod(t, 3.0)
				if creak_t > 2.0 and creak_t < 2.1:
					water += sin((creak_t - 2.0) * 400.0 * TAU) * 0.08
				samples.append(int(clampf(water, -1.0, 1.0) * 127.0 + 128.0))
		_:
			# Default quiet hum
			for i in sample_count:
				var t := float(i) / 22050.0
				var hum := (rng.randf() * 2.0 - 1.0) * 0.03
				hum += sin(t * 60.0 * TAU) * 0.02
				samples.append(int(clampf(hum, -1.0, 1.0) * 127.0 + 128.0))

	generator.data = samples
	generator.loop_end = sample_count
	return generator


func _generate_sfx(sfx_name: String) -> AudioStream:
	# Generate simple procedural sound effects
	var generator := AudioStreamWAV.new()
	generator.format = AudioStreamWAV.FORMAT_8_BITS
	generator.mix_rate = 22050
	generator.stereo = false

	var samples := PackedByteArray()
	var length := 4410 # 0.2 seconds

	match sfx_name:
		"clue_discovered":
			# Rising chime
			for i in length:
				var t := float(i) / 22050.0
				var freq := 440.0 + t * 880.0
				var val := sin(t * freq * TAU) * (1.0 - t * 5.0)
				samples.append(int(val * 127.0 + 128.0))
		"interact":
			# Short click
			length = 1100
			for i in length:
				var t := float(i) / 22050.0
				var val := sin(t * 1000.0 * TAU) * (1.0 - t * 10.0)
				samples.append(int(val * 100.0 + 128.0))
		"loop_warning":
			# Ominous low pulse
			length = 11025
			for i in length:
				var t := float(i) / 22050.0
				var val := sin(t * 110.0 * TAU) * sin(t * 3.0 * TAU) * 0.8
				samples.append(int(val * 127.0 + 128.0))
		"typewriter":
			# Softer click than "interact"
			length = 880
			for i in length:
				var t := float(i) / 22050.0
				var val := sin(t * 800.0 * TAU) * (1.0 - t * 12.0) * 0.4
				val += (randf() * 2.0 - 1.0) * (1.0 - t * 14.0) * 0.15
				samples.append(int(clampf(val, -1.0, 1.0) * 80.0 + 128.0))
		"discovery_jingle":
			# Rising 3-note arpeggio
			length = 8820  # 0.4 seconds
			for i in length:
				var t := float(i) / 22050.0
				var freq := 440.0
				if t < 0.13:
					freq = 523.3  # C5
				elif t < 0.26:
					freq = 659.3  # E5
				else:
					freq = 784.0  # G5
				var note_t := fmod(t, 0.13)
				var env := (1.0 - note_t * 5.0) if note_t < 0.12 else 0.0
				env = maxf(env, 0.0)
				var val := sin(t * freq * TAU) * env * 0.6
				val += sin(t * freq * 2.0 * TAU) * env * 0.15
				samples.append(int(clampf(val, -1.0, 1.0) * 127.0 + 128.0))
		"crime_alert":
			# Descending alarm — two quick tones
			length = 6615  # 0.3 seconds
			for i in length:
				var t := float(i) / 22050.0
				var freq := 880.0 if t < 0.15 else 660.0
				var env := 0.7 * (1.0 - fmod(t, 0.15) * 4.0)
				env = maxf(env, 0.0)
				var val := sin(t * freq * TAU) * env
				val += sin(t * freq * 1.5 * TAU) * env * 0.3
				samples.append(int(clampf(val, -1.0, 1.0) * 127.0 + 128.0))
		"footstep":
			length = 1100
			for i in length:
				var t := float(i) / 22050.0
				var val := (randf() * 2.0 - 1.0) * (1.0 - t * 10.0) * 0.3
				samples.append(int(val * 127.0 + 128.0))
		"notebook_open":
			length = 2200
			for i in length:
				var t := float(i) / 22050.0
				var val := sin(t * 600.0 * TAU) * (1.0 - t * 5.0) * 0.5
				samples.append(int(val * 127.0 + 128.0))
		"door":
			length = 4410
			for i in length:
				var t := float(i) / 22050.0
				var val := sin(t * 200.0 * TAU) * exp(-t * 8.0) * 0.6
				val += (randf() * 2.0 - 1.0) * exp(-t * 15.0) * 0.3
				samples.append(int(clampf(val, -1.0, 1.0) * 127.0 + 128.0))
		"vhs_warble":
			# Tape warble: low-freq wobble + noise bursts + high whine
			length = 22050  # 1 second
			for i in length:
				var t := float(i) / 22050.0
				var wobble := sin(t * 40.0 * TAU + sin(t * 5.0 * TAU) * 3.0) * 0.3
				var noise := (randf() * 2.0 - 1.0) * 0.15 * exp(-fmod(t, 0.2) * 10.0)
				var whine := sin(t * 2000.0 * TAU) * 0.05 * (0.5 + 0.5 * sin(t * 8.0 * TAU))
				var env := 1.0 - t  # Fade out
				var val := (wobble + noise + whine) * env
				samples.append(int(clampf(val, -1.0, 1.0) * 127.0 + 128.0))
		"victory":
			# Rising major chord arpeggio: C5 -> E5 -> G5 -> C6
			length = 22050  # 1 second
			var freqs := [523.3, 659.3, 784.0, 1046.5]
			for i in length:
				var t := float(i) / 22050.0
				var note_idx := mini(int(t * 4.0), 3)
				var freq: float = freqs[note_idx]
				var note_t := fmod(t, 0.25)
				var env := (1.0 - note_t * 2.5)
				env = maxf(env, 0.0)
				# Sustain last note longer
				if note_idx == 3:
					env = maxf(1.0 - (t - 0.75) * 1.5, 0.0)
				var val := sin(t * freq * TAU) * env * 0.5
				val += sin(t * freq * 2.0 * TAU) * env * 0.15
				val += sin(t * freq * 3.0 * TAU) * env * 0.05
				samples.append(int(clampf(val, -1.0, 1.0) * 127.0 + 128.0))
		_:
			# Default blip
			for i in length:
				var t := float(i) / 22050.0
				var val := sin(t * 440.0 * TAU) * (1.0 - t * 5.0)
				samples.append(int(val * 80.0 + 128.0))

	generator.data = samples
	return generator


func _on_conspiracy_progress_changed(new_value: int) -> void:
	_conspiracy_intensity = clampf(float(new_value) / 100.0, 0.0, 1.0)


func _duck_audio() -> void:
	if _duck_tween:
		_duck_tween.kill()
	_duck_tween = create_tween().set_parallel(true)
	_duck_tween.tween_property(_music_player, "volume_db", linear_to_db(music_volume * 0.3), 0.3)
	_duck_tween.tween_property(_ambience_player, "volume_db", linear_to_db(ambience_volume * 0.3), 0.3)


func _unduck_audio() -> void:
	if _duck_tween:
		_duck_tween.kill()
	_duck_tween = create_tween().set_parallel(true)
	_duck_tween.tween_property(_music_player, "volume_db", linear_to_db(music_volume), 0.5)
	_duck_tween.tween_property(_ambience_player, "volume_db", linear_to_db(ambience_volume), 0.5)


func stop_all() -> void:
	_music_player.stop()
	_ambience_player.stop()
	for p in _sfx_players:
		p.stop()
	_music_player.pitch_scale = 1.0
