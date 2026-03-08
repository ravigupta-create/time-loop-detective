class_name CrimeTemplate
extends Resource

@export var id: String = ""
@export var crime_type: int = Enums.CrimeType.PICKPOCKETING
@export var tier: int = Enums.CrimeTier.EARLY
@export var severity: int = 1 # 1-5
@export var conspiracy_connected: bool = false
@export var required_roles: Array[Dictionary] = []
# Each role: {role: int (CrimeRole), preferred_npcs: Array[String]}
@export var time_window: Array[float] = [0.0, 600.0] # [earliest_start, latest_start]
@export var location: int = Enums.LocationID.STREET_MARKET
@export var stages: Array[Dictionary] = []
# Each stage: {time_offset: float, action: String, involves_role: int, spawns_evidence: bool}
@export var evidence_templates: Array[Dictionary] = []
# Each: {type: String, description: String, location: int, links_to_role: int}
