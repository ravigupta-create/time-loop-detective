extends Area2D
## Evidence pickup that can be inspected by the player.

func collect() -> void:
	var evidence_id: String = get_meta("evidence_id", "")
	if not evidence_id.is_empty():
		CrimeEngine.mark_evidence_discovered(evidence_id)
		EventBus.sfx_requested.emit("clue_discovered")
		EventBus.notification_queued.emit("Evidence found!", "evidence")
	queue_free()


func get_destination() -> String:
	return ""
