extends Node
## Music/ambience/SFX management with crossfade between locations.

var _music_player: AudioStreamPlayer
var _ambience_player: AudioStreamPlayer
var _sfx_players: Array[AudioStreamPlayer] = []
var _crossfade_tween: Tween

var music_volume: float = 0.8
var sfx_volume: float = 1.0
var ambience_volume: float = 0.6

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


func _generate_music_stream(_track_name: String) -> AudioStream:
	# Generate a simple procedural music stream
	# In a full implementation, this would load .ogg files or use AudioStreamGenerator
	return null


func _generate_ambience_stream(_ambience_name: String) -> AudioStream:
	return null


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
		_:
			# Default blip
			for i in length:
				var t := float(i) / 22050.0
				var val := sin(t * 440.0 * TAU) * (1.0 - t * 5.0)
				samples.append(int(val * 80.0 + 128.0))

	generator.data = samples
	return generator


func stop_all() -> void:
	_music_player.stop()
	_ambience_player.stop()
	for p in _sfx_players:
		p.stop()
	_music_player.pitch_scale = 1.0
