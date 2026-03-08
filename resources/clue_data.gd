class_name ClueData
extends Resource

@export var id: String = ""
@export var title: String = ""
@export var description: String = ""
@export var category: int = Enums.ClueCategory.TESTIMONY
@export var related_npcs: Array[String] = []
@export var related_crimes: Array[String] = []
@export var importance: int = 1 # 1-5
@export var source_npc: String = "" # Who provided this info
@export var about_event: String = "" # What event this is about
@export var claim: String = "" # What this clue claims (for contradiction detection)
@export var connections: Array[String] = [] # connection_ids
