class_name NPCDialogue
extends Resource

@export var lines: Array[Dictionary] = []
# Each line: {
#   text: String,
#   speaker: String (npc_id or "player"),
#   conditions: Array[String] (clue_ids required to see this line),
#   choices: Array[Dictionary] ({text, id, required_clues, leads_to, reveals_clue}),
#   clue_reveal: String (clue_id revealed by this line),
#   truthful: bool (default true),
#   emotion: String ("neutral", "angry", "sad", "scared", "happy")
# }
