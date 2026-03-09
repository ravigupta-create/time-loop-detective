extends Node
## JSON serialization to user://detective_save.json with checksum validation
## and backup save system.

const SAVE_VERSION: int = 1


func _ready() -> void:
	EventBus.loop_reset.connect(_on_loop_reset)


func _on_loop_reset(_loop_number: int) -> void:
	save_game()


func save_game() -> void:
	# Create backup of existing save before overwriting
	_backup_save()

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
	# Try primary save first
	if _try_load(Constants.SAVE_PATH):
		return true

	# Fall back to backup if primary is corrupted
	print("[SaveManager] Primary save failed, trying backup...")
	if _try_load(Constants.SAVE_BACKUP_PATH):
		print("[SaveManager] Loaded from backup save")
		return true

	print("[SaveManager] No valid save found")
	return false


func _try_load(path: String) -> bool:
	if not FileAccess.file_exists(path):
		return false

	var file := FileAccess.open(path, FileAccess.READ)
	if not file:
		return false

	var json_string := file.get_as_text()
	file.close()

	var json := JSON.new()
	var error := json.parse(json_string)
	if error != OK:
		print("[SaveManager] Failed to parse %s: %s" % [path, json.get_error_message()])
		return false

	var raw_data: Variant = json.data
	if not raw_data is Dictionary:
		print("[SaveManager] Save data is not a Dictionary")
		return false
	var data: Dictionary = raw_data as Dictionary
	if not _validate_save(data):
		print("[SaveManager] Validation failed for %s" % path)
		return false

	GameState.load_save_data(data.get("game_state", {}))
	EventBus.game_loaded.emit()
	print("[SaveManager] Game loaded from %s - Loop %d" % [path, GameState.current_loop])
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


func _backup_save() -> void:
	if not FileAccess.file_exists(Constants.SAVE_PATH):
		return
	var source := FileAccess.open(Constants.SAVE_PATH, FileAccess.READ)
	if not source:
		return
	var content := source.get_as_text()
	source.close()

	var backup := FileAccess.open(Constants.SAVE_BACKUP_PATH, FileAccess.WRITE)
	if backup:
		backup.store_string(content)
		backup.close()


func delete_save() -> void:
	if FileAccess.file_exists(Constants.SAVE_PATH):
		DirAccess.remove_absolute(Constants.SAVE_PATH)
	if FileAccess.file_exists(Constants.SAVE_BACKUP_PATH):
		DirAccess.remove_absolute(Constants.SAVE_BACKUP_PATH)
	print("[SaveManager] Save files deleted")


func has_save() -> bool:
	return FileAccess.file_exists(Constants.SAVE_PATH) or FileAccess.file_exists(Constants.SAVE_BACKUP_PATH)
