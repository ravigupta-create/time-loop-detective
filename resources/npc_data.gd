class_name NPCData
extends Resource

@export var id: String = ""
@export var npc_name: String = ""
@export var job: String = ""
@export var personality_traits: Array[int] = [] # Enums.PersonalityTrait
@export var secrets: Array[String] = []
@export var sprite_seed: int = 0
@export var relationships: Array[Resource] = [] # NPCRelationship
@export var dialogue_trees: Dictionary = {}
@export var default_location: int = Enums.LocationID.APARTMENT_COMPLEX
