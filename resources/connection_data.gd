class_name ConnectionData
extends Resource

@export var id: String = ""
@export var clue_a: String = ""
@export var clue_b: String = ""
@export var connection_type: int = Enums.ConnectionType.SAME_PERSON
@export var description: String = ""
@export var valid: bool = false # Whether this is a real connection
