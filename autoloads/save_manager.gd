extends Node
## JSON serialization to user://detective_save.json with checksum validation.

const SAVE_VERSION: int = 1


func _ready() -> void:
	EventBus.loop_reset.connect(_on_loop_reset)


func _on_loop_reset(_loop_number: int) -> void:
	save_game()


func save_game() -> void:
	var data := {
		"version": SAVE_VERSION,
		"timestamp": Time.get_unix_time_from_system(),
		"game_state": GameState.get_save_data()
	}
	var json_string := JSON.stringify(data, "\t")
	var checksum := json_string.md5_text()
	data["checksum"] = checksum

	var file := FileAccess.open(Constants.SAVE_PATH, FileAccess.WRITE)
	if file:
		file.store_string(JSON.stringify(data, "\t"))
		file.close()
		EventBus.game_saved.emit()
		print("[SaveManager] Game saved - Loop %d" % GameState.current_loop)


func load_game() -> bool:
	if not FileAccess.file_exists(Constants.SAVE_PATH):
		print("[SaveManager] No save file found")
		return false

	var file := FileAccess.open(Constants.SAVE_PATH, FileAccess.READ)
	if not file:
		print("[SaveManager] Failed to open save file")
		return false

	var json_string := file.get_as_text()
	file.close()

	var json := JSON.new()
	var error := json.parse(json_string)
	if error != OK:
		print("[SaveManager] Failed to parse save file: ", json.get_error_message())
		return false

	var data: Dictionary = json.data
	if not _validate_save(data):
		print("[SaveManager] Save file validation failed")
		return false

	GameState.load_save_data(data.get("game_state", {}))
	EventBus.game_loaded.emit()
	print("[SaveManager] Game loaded - Loop %d" % GameState.current_loop)
	return true


func _validate_save(data: Dictionary) -> bool:
	if data.get("version", 0) != SAVE_VERSION:
		return false
	var stored_checksum: String = data.get("checksum", "")
	if stored_checksum.is_empty():
		return false
	# Rebuild without checksum to verify
	var verify_data := data.duplicate(true)
	verify_data.erase("checksum")
	var verify_string := JSON.stringify(verify_data, "\t")
	return verify_string.md5_text() == stored_checksum


func delete_save() -> void:
	if FileAccess.file_exists(Constants.SAVE_PATH):
		DirAccess.remove_absolute(Constants.SAVE_PATH)
		print("[SaveManager] Save file deleted")


func has_save() -> bool:
	return FileAccess.file_exists(Constants.SAVE_PATH)
