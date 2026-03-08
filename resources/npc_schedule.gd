class_name NPCSchedule
extends Resource

@export var entries: Array[Dictionary] = []
# Each entry: {start_time: float, end_time: float, location: int, position: Vector2, activity: String, state: int, interruptible: bool}
@export var conditional_overrides: Array[Dictionary] = []
# Each override: {condition: String, entries: Array[Dictionary]}
