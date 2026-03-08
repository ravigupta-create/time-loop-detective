class_name EvidenceData
extends Resource

@export var id: String = ""
@export var evidence_type: String = "" # blood_stain, weapon, document, etc.
@export var description: String = ""
@export var location: int = Enums.LocationID.STREET_MARKET
@export var links_to_npc: String = ""
@export var crime_id: String = ""
@export var spawned: bool = false
@export var discovered: bool = false
