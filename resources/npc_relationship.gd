class_name NPCRelationship
extends Resource

@export var target_npc_id: String = ""
@export var relationship_type: int = Enums.RelationshipType.UNKNOWN
@export var trust_level: int = 0 # -5 to 5
