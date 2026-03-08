class_name ScheduleEvaluator
## Static utility that determines what an NPC should be doing at any given time
## within the 600-second loop.  Each schedule entry is a Dictionary:
##   {start_time, end_time, location, position, activity, state, interruptible}


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

## Returns what an NPC should be doing right now.
## Result: {"location": LocationID, "position": Vector2, "activity": String, "state": NPCState}
static func evaluate(npc_id: String, current_time: float, schedule: Array[Dictionary]) -> Dictionary:
	# Walk the schedule in order; return the entry whose window contains current_time.
	for entry in schedule:
		if current_time >= entry["start_time"] and current_time < entry["end_time"]:
			var result := {
				"location": entry["location"] as int,
				"position": entry["position"] as Vector2,
				"activity": entry["activity"] as String,
				"state":    entry["state"] as int,
			}
			# Apply weather overrides for outdoor locations in bad weather
			result = _apply_weather_override(npc_id, result)
			return result

	# Fallback -- should not happen if schedules cover 0-600
	if schedule.size() > 0:
		var last: Dictionary = schedule[schedule.size() - 1]
		return {
			"location": last["location"] as int,
			"position": last["position"] as Vector2,
			"activity": last["activity"] as String,
			"state":    last["state"] as int,
		}

	return {
		"location": Enums.LocationID.APARTMENT_COMPLEX,
		"position": Vector2.ZERO,
		"activity": "idle",
		"state":    Enums.NPCState.IDLE,
	}


## Weather-conditional schedule overrides: NPCs avoid outdoor locations in rain/fog.
static func _apply_weather_override(npc_id: String, result: Dictionary) -> Dictionary:
	if not WeatherSystem.instance:
		return result

	if not WeatherSystem.instance.is_outdoor_unfriendly():
		return result

	var loc_id: int = result["location"]
	var is_outdoor := loc_id == Enums.LocationID.RIVERSIDE_PARK or \
					  loc_id == Enums.LocationID.STREET_MARKET or \
					  loc_id == Enums.LocationID.DOCKS or \
					  loc_id == Enums.LocationID.BACK_ALLEY

	if not is_outdoor:
		return result

	# Some NPCs stay outdoors regardless (Penny lives outdoors, Tommy has deliveries)
	if npc_id == Constants.NPC_PENNY or npc_id == Constants.NPC_TOMMY:
		return result

	# Redirect to indoor location based on NPC
	var override := result.duplicate()
	match npc_id:
		Constants.NPC_MARIA:
			override["location"] = Enums.LocationID.CAFE_ROSETTA
			override["position"] = Vector2(140, 90)
			override["activity"] = "Staying inside due to weather"
		Constants.NPC_IRIS:
			override["location"] = Enums.LocationID.HOTEL_MARLOW
			override["position"] = Vector2(100, 80)
			override["activity"] = "Sheltering from weather at hotel"
		Constants.NPC_NINA:
			override["location"] = Enums.LocationID.CAFE_ROSETTA
			override["position"] = Vector2(120, 100)
			override["activity"] = "Sheltering at cafe"
		Constants.NPC_HALE:
			override["location"] = Enums.LocationID.POLICE_STATION
			override["position"] = Vector2(120, 80)
			override["activity"] = "Staying at station due to weather"
		Constants.NPC_ELEANOR:
			override["location"] = Enums.LocationID.POLICE_STATION
			override["position"] = Vector2(200, 140)
			override["activity"] = "Working late at morgue"
		_:
			override["location"] = Enums.LocationID.APARTMENT_COMPLEX
			override["position"] = Vector2(160, 120)
			override["activity"] = "Sheltering from weather"
	override["state"] = Enums.NPCState.IDLE
	return override


## Returns the full day schedule for an NPC.
static func get_schedule_for_npc(npc_id: String) -> Array[Dictionary]:
	match npc_id:
		Constants.NPC_FRANK:   return _schedule_frank()
		Constants.NPC_MARIA:   return _schedule_maria()
		Constants.NPC_HALE:    return _schedule_hale()
		Constants.NPC_IRIS:    return _schedule_iris()
		Constants.NPC_VICTOR:  return _schedule_victor()
		Constants.NPC_PENNY:   return _schedule_penny()
		Constants.NPC_ELEANOR: return _schedule_eleanor()
		Constants.NPC_NINA:    return _schedule_nina()
		Constants.NPC_MAYOR:   return _schedule_mayor()
		Constants.NPC_TOMMY:   return _schedule_tommy()
	return []


## Checks whether an NPC is interruptible at the given time.
static func is_interruptible(npc_id: String, current_time: float) -> bool:
	var schedule := get_schedule_for_npc(npc_id)
	for entry in schedule:
		if current_time >= entry["start_time"] and current_time < entry["end_time"]:
			return entry["interruptible"] as bool
	return true


# ---------------------------------------------------------------------------
# Schedules  (all times in loop-seconds, 0-600)
# ---------------------------------------------------------------------------

# ---- Frank DeLuca -- Bartender ----
static func _schedule_frank() -> Array[Dictionary]:
	return [
		{
			"start_time": 0.0, "end_time": 75.0,
			"location": Enums.LocationID.APARTMENT_COMPLEX,
			"position": Vector2(80, 120),
			"activity": "Sleeping at apartment",
			"state": Enums.NPCState.SLEEPING,
			"interruptible": false,
		},
		{
			"start_time": 75.0, "end_time": 100.0,
			"location": Enums.LocationID.APARTMENT_COMPLEX,
			"position": Vector2(200, 160),
			"activity": "Walking to bar",
			"state": Enums.NPCState.WALKING,
			"interruptible": true,
		},
		{
			"start_time": 100.0, "end_time": 500.0,
			"location": Enums.LocationID.BAR_CROSSROADS,
			"position": Vector2(160, 80),
			"activity": "Working at bar",
			"state": Enums.NPCState.WORKING,
			"interruptible": true,
		},
		{
			"start_time": 500.0, "end_time": 540.0,
			"location": Enums.LocationID.BAR_CROSSROADS,
			"position": Vector2(200, 100),
			"activity": "Closing up bar",
			"state": Enums.NPCState.WORKING,
			"interruptible": true,
		},
		{
			"start_time": 540.0, "end_time": 600.0,
			"location": Enums.LocationID.APARTMENT_COMPLEX,
			"position": Vector2(80, 120),
			"activity": "Walking home",
			"state": Enums.NPCState.WALKING,
			"interruptible": true,
		},
	]


# ---- Maria Santos -- Cafe Owner ----
static func _schedule_maria() -> Array[Dictionary]:
	return [
		{
			"start_time": 0.0, "end_time": 60.0,
			"location": Enums.LocationID.APARTMENT_COMPLEX,
			"position": Vector2(120, 80),
			"activity": "Sleeping at apartment",
			"state": Enums.NPCState.SLEEPING,
			"interruptible": false,
		},
		{
			"start_time": 60.0, "end_time": 90.0,
			"location": Enums.LocationID.CAFE_ROSETTA,
			"position": Vector2(100, 60),
			"activity": "Opening cafe",
			"state": Enums.NPCState.WORKING,
			"interruptible": true,
		},
		{
			"start_time": 90.0, "end_time": 450.0,
			"location": Enums.LocationID.CAFE_ROSETTA,
			"position": Vector2(140, 90),
			"activity": "Working at cafe",
			"state": Enums.NPCState.WORKING,
			"interruptible": true,
		},
		{
			"start_time": 450.0, "end_time": 500.0,
			"location": Enums.LocationID.RIVERSIDE_PARK,
			"position": Vector2(180, 140),
			"activity": "Taking a break at the park",
			"state": Enums.NPCState.IDLE,
			"interruptible": true,
		},
		{
			"start_time": 500.0, "end_time": 560.0,
			"location": Enums.LocationID.CAFE_ROSETTA,
			"position": Vector2(100, 60),
			"activity": "Closing cafe",
			"state": Enums.NPCState.WORKING,
			"interruptible": true,
		},
		{
			"start_time": 560.0, "end_time": 600.0,
			"location": Enums.LocationID.APARTMENT_COMPLEX,
			"position": Vector2(120, 80),
			"activity": "Walking home",
			"state": Enums.NPCState.WALKING,
			"interruptible": true,
		},
	]


# ---- Detective Hale -- Corrupt Cop ----
static func _schedule_hale() -> Array[Dictionary]:
	return [
		{
			"start_time": 0.0, "end_time": 80.0,
			"location": Enums.LocationID.APARTMENT_COMPLEX,
			"position": Vector2(160, 100),
			"activity": "Sleeping at apartment",
			"state": Enums.NPCState.SLEEPING,
			"interruptible": false,
		},
		{
			"start_time": 80.0, "end_time": 110.0,
			"location": Enums.LocationID.APARTMENT_COMPLEX,
			"position": Vector2(240, 140),
			"activity": "Walking to station",
			"state": Enums.NPCState.WALKING,
			"interruptible": true,
		},
		{
			"start_time": 110.0, "end_time": 350.0,
			"location": Enums.LocationID.POLICE_STATION,
			"position": Vector2(120, 80),
			"activity": "Working at station",
			"state": Enums.NPCState.WORKING,
			"interruptible": true,
		},
		{
			"start_time": 350.0, "end_time": 450.0,
			"location": Enums.LocationID.STREET_MARKET,
			"position": Vector2(200, 120),
			"activity": "Patrolling streets",
			"state": Enums.NPCState.WALKING,
			"interruptible": true,
		},
		{
			"start_time": 450.0, "end_time": 540.0,
			"location": Enums.LocationID.BACK_ALLEY,
			"position": Vector2(80, 100),
			"activity": "Secret meeting",
			"state": Enums.NPCState.SOCIALIZING,
			"interruptible": false,
		},
		{
			"start_time": 540.0, "end_time": 600.0,
			"location": Enums.LocationID.POLICE_STATION,
			"position": Vector2(120, 80),
			"activity": "Returning to station",
			"state": Enums.NPCState.WALKING,
			"interruptible": true,
		},
	]


# ---- Iris Chen -- Journalist ----
static func _schedule_iris() -> Array[Dictionary]:
	return [
		{
			"start_time": 0.0, "end_time": 90.0,
			"location": Enums.LocationID.HOTEL_MARLOW,
			"position": Vector2(100, 80),
			"activity": "Sleeping at hotel",
			"state": Enums.NPCState.SLEEPING,
			"interruptible": false,
		},
		{
			"start_time": 90.0, "end_time": 130.0,
			"location": Enums.LocationID.CAFE_ROSETTA,
			"position": Vector2(180, 100),
			"activity": "Breakfast at cafe",
			"state": Enums.NPCState.SOCIALIZING,
			"interruptible": true,
		},
		{
			"start_time": 130.0, "end_time": 250.0,
			"location": Enums.LocationID.STREET_MARKET,
			"position": Vector2(140, 100),
			"activity": "Investigating at market",
			"state": Enums.NPCState.WALKING,
			"interruptible": true,
		},
		{
			"start_time": 250.0, "end_time": 350.0,
			"location": Enums.LocationID.POLICE_STATION,
			"position": Vector2(180, 120),
			"activity": "Visiting police station",
			"state": Enums.NPCState.WALKING,
			"interruptible": true,
		},
		{
			"start_time": 350.0, "end_time": 450.0,
			"location": Enums.LocationID.RIVERSIDE_PARK,
			"position": Vector2(120, 160),
			"activity": "Research at park",
			"state": Enums.NPCState.WORKING,
			"interruptible": true,
		},
		{
			"start_time": 450.0, "end_time": 550.0,
			"location": Enums.LocationID.BACK_ALLEY,
			"position": Vector2(60, 80),
			"activity": "Following leads",
			"state": Enums.NPCState.WALKING,
			"interruptible": true,
		},
		{
			"start_time": 550.0, "end_time": 600.0,
			"location": Enums.LocationID.HOTEL_MARLOW,
			"position": Vector2(100, 80),
			"activity": "Returning to hotel",
			"state": Enums.NPCState.WALKING,
			"interruptible": true,
		},
	]


# ---- Victor Crane -- Businessman ----
static func _schedule_victor() -> Array[Dictionary]:
	return [
		{
			"start_time": 0.0, "end_time": 100.0,
			"location": Enums.LocationID.HOTEL_MARLOW,
			"position": Vector2(140, 60),
			"activity": "Sleeping at hotel",
			"state": Enums.NPCState.SLEEPING,
			"interruptible": false,
		},
		{
			"start_time": 100.0, "end_time": 200.0,
			"location": Enums.LocationID.HOTEL_MARLOW,
			"position": Vector2(180, 120),
			"activity": "Hotel lobby meetings",
			"state": Enums.NPCState.SOCIALIZING,
			"interruptible": true,
		},
		{
			"start_time": 200.0, "end_time": 350.0,
			"location": Enums.LocationID.CITY_HALL,
			"position": Vector2(120, 100),
			"activity": "Meeting at City Hall",
			"state": Enums.NPCState.SOCIALIZING,
			"interruptible": false,
		},
		{
			"start_time": 350.0, "end_time": 450.0,
			"location": Enums.LocationID.DOCKS,
			"position": Vector2(160, 140),
			"activity": "Inspecting the docks",
			"state": Enums.NPCState.WALKING,
			"interruptible": true,
		},
		{
			"start_time": 450.0, "end_time": 530.0,
			"location": Enums.LocationID.BACK_ALLEY,
			"position": Vector2(100, 80),
			"activity": "Back alley dealings",
			"state": Enums.NPCState.SOCIALIZING,
			"interruptible": false,
		},
		{
			"start_time": 530.0, "end_time": 600.0,
			"location": Enums.LocationID.HOTEL_MARLOW,
			"position": Vector2(140, 60),
			"activity": "Returning to hotel",
			"state": Enums.NPCState.WALKING,
			"interruptible": true,
		},
	]


# ---- Penny Marsh -- Pickpocket ----
static func _schedule_penny() -> Array[Dictionary]:
	return [
		{
			"start_time": 0.0, "end_time": 100.0,
			"location": Enums.LocationID.BACK_ALLEY,
			"position": Vector2(40, 60),
			"activity": "Sleeping in alley",
			"state": Enums.NPCState.SLEEPING,
			"interruptible": false,
		},
		{
			"start_time": 100.0, "end_time": 280.0,
			"location": Enums.LocationID.STREET_MARKET,
			"position": Vector2(100, 80),
			"activity": "Pickpocketing at market",
			"state": Enums.NPCState.WALKING,
			"interruptible": true,
		},
		{
			"start_time": 280.0, "end_time": 330.0,
			"location": Enums.LocationID.CAFE_ROSETTA,
			"position": Vector2(200, 120),
			"activity": "Lunch at cafe",
			"state": Enums.NPCState.IDLE,
			"interruptible": true,
		},
		{
			"start_time": 330.0, "end_time": 420.0,
			"location": Enums.LocationID.DOCKS,
			"position": Vector2(80, 100),
			"activity": "Scouting the docks",
			"state": Enums.NPCState.WALKING,
			"interruptible": true,
		},
		{
			"start_time": 420.0, "end_time": 520.0,
			"location": Enums.LocationID.BAR_CROSSROADS,
			"position": Vector2(200, 120),
			"activity": "Evening at bar",
			"state": Enums.NPCState.SOCIALIZING,
			"interruptible": true,
		},
		{
			"start_time": 520.0, "end_time": 600.0,
			"location": Enums.LocationID.STREET_MARKET,
			"position": Vector2(160, 100),
			"activity": "Wandering streets",
			"state": Enums.NPCState.WALKING,
			"interruptible": true,
		},
	]


# ---- Dr. Eleanor Solomon -- Doctor ----
static func _schedule_eleanor() -> Array[Dictionary]:
	return [
		{
			"start_time": 0.0, "end_time": 80.0,
			"location": Enums.LocationID.APARTMENT_COMPLEX,
			"position": Vector2(200, 80),
			"activity": "Sleeping at apartment",
			"state": Enums.NPCState.SLEEPING,
			"interruptible": false,
		},
		{
			"start_time": 80.0, "end_time": 110.0,
			"location": Enums.LocationID.APARTMENT_COMPLEX,
			"position": Vector2(280, 120),
			"activity": "Walking to station",
			"state": Enums.NPCState.WALKING,
			"interruptible": true,
		},
		{
			"start_time": 110.0, "end_time": 350.0,
			"location": Enums.LocationID.POLICE_STATION,
			"position": Vector2(200, 140),
			"activity": "Working at morgue",
			"state": Enums.NPCState.WORKING,
			"interruptible": true,
		},
		{
			"start_time": 350.0, "end_time": 400.0,
			"location": Enums.LocationID.CAFE_ROSETTA,
			"position": Vector2(160, 80),
			"activity": "Cafe break",
			"state": Enums.NPCState.IDLE,
			"interruptible": true,
		},
		{
			"start_time": 400.0, "end_time": 500.0,
			"location": Enums.LocationID.POLICE_STATION,
			"position": Vector2(200, 140),
			"activity": "Returning to work",
			"state": Enums.NPCState.WORKING,
			"interruptible": true,
		},
		{
			"start_time": 500.0, "end_time": 540.0,
			"location": Enums.LocationID.POLICE_STATION,
			"position": Vector2(240, 160),
			"activity": "Walking home",
			"state": Enums.NPCState.WALKING,
			"interruptible": true,
		},
		{
			"start_time": 540.0, "end_time": 600.0,
			"location": Enums.LocationID.APARTMENT_COMPLEX,
			"position": Vector2(200, 80),
			"activity": "Home for the evening",
			"state": Enums.NPCState.IDLE,
			"interruptible": true,
		},
	]


# ---- Nina Volkov -- Mysterious Newcomer ----
static func _schedule_nina() -> Array[Dictionary]:
	return [
		{
			"start_time": 0.0, "end_time": 110.0,
			"location": Enums.LocationID.HOTEL_MARLOW,
			"position": Vector2(60, 80),
			"activity": "Sleeping at hotel",
			"state": Enums.NPCState.SLEEPING,
			"interruptible": false,
		},
		{
			"start_time": 110.0, "end_time": 200.0,
			"location": Enums.LocationID.CITY_HALL,
			"position": Vector2(200, 160),
			"activity": "Investigating city hall exterior",
			"state": Enums.NPCState.WALKING,
			"interruptible": true,
		},
		{
			"start_time": 200.0, "end_time": 280.0,
			"location": Enums.LocationID.CAFE_ROSETTA,
			"position": Vector2(120, 100),
			"activity": "Talking to Maria at cafe",
			"state": Enums.NPCState.SOCIALIZING,
			"interruptible": true,
		},
		{
			"start_time": 280.0, "end_time": 400.0,
			"location": Enums.LocationID.RIVERSIDE_PARK,
			"position": Vector2(200, 100),
			"activity": "Taking readings at park",
			"state": Enums.NPCState.WORKING,
			"interruptible": true,
		},
		{
			"start_time": 400.0, "end_time": 480.0,
			"location": Enums.LocationID.DOCKS,
			"position": Vector2(120, 80),
			"activity": "Investigating docks",
			"state": Enums.NPCState.WALKING,
			"interruptible": true,
		},
		{
			"start_time": 480.0, "end_time": 540.0,
			"location": Enums.LocationID.BACK_ALLEY,
			"position": Vector2(120, 60),
			"activity": "Investigating back alley",
			"state": Enums.NPCState.WALKING,
			"interruptible": true,
		},
		{
			"start_time": 540.0, "end_time": 600.0,
			"location": Enums.LocationID.HOTEL_MARLOW,
			"position": Vector2(60, 80),
			"activity": "Returning to hotel",
			"state": Enums.NPCState.WALKING,
			"interruptible": true,
		},
	]


# ---- Mayor Aldridge -- Corrupt Mayor ----
static func _schedule_mayor() -> Array[Dictionary]:
	return [
		{
			"start_time": 0.0, "end_time": 100.0,
			"location": Enums.LocationID.APARTMENT_COMPLEX,
			"position": Vector2(240, 60),
			"activity": "Sleeping at apartment",
			"state": Enums.NPCState.SLEEPING,
			"interruptible": false,
		},
		{
			"start_time": 100.0, "end_time": 350.0,
			"location": Enums.LocationID.CITY_HALL,
			"position": Vector2(100, 80),
			"activity": "Working in office",
			"state": Enums.NPCState.WORKING,
			"interruptible": true,
		},
		{
			"start_time": 350.0, "end_time": 400.0,
			"location": Enums.LocationID.CITY_HALL,
			"position": Vector2(160, 120),
			"activity": "Private lunch",
			"state": Enums.NPCState.IDLE,
			"interruptible": false,
		},
		{
			"start_time": 400.0, "end_time": 480.0,
			"location": Enums.LocationID.CITY_HALL,
			"position": Vector2(100, 80),
			"activity": "Afternoon meetings",
			"state": Enums.NPCState.SOCIALIZING,
			"interruptible": true,
		},
		{
			"start_time": 480.0, "end_time": 530.0,
			"location": Enums.LocationID.CITY_HALL,
			"position": Vector2(80, 200),
			"activity": "Checking basement",
			"state": Enums.NPCState.WALKING,
			"interruptible": false,
		},
		{
			"start_time": 530.0, "end_time": 580.0,
			"location": Enums.LocationID.CITY_HALL,
			"position": Vector2(100, 80),
			"activity": "Final office work",
			"state": Enums.NPCState.WORKING,
			"interruptible": true,
		},
		{
			"start_time": 580.0, "end_time": 600.0,
			"location": Enums.LocationID.CITY_HALL,
			"position": Vector2(200, 160),
			"activity": "Leaving City Hall",
			"state": Enums.NPCState.WALKING,
			"interruptible": true,
		},
	]


# ---- Tommy Reeves -- Delivery Boy ----
static func _schedule_tommy() -> Array[Dictionary]:
	return [
		{
			"start_time": 0.0, "end_time": 70.0,
			"location": Enums.LocationID.APARTMENT_COMPLEX,
			"position": Vector2(60, 140),
			"activity": "Sleeping at apartment",
			"state": Enums.NPCState.SLEEPING,
			"interruptible": false,
		},
		{
			"start_time": 70.0, "end_time": 150.0,
			"location": Enums.LocationID.STREET_MARKET,
			"position": Vector2(120, 60),
			"activity": "Deliveries at market",
			"state": Enums.NPCState.WALKING,
			"interruptible": true,
		},
		{
			"start_time": 150.0, "end_time": 200.0,
			"location": Enums.LocationID.CAFE_ROSETTA,
			"position": Vector2(80, 60),
			"activity": "Delivery to cafe",
			"state": Enums.NPCState.WALKING,
			"interruptible": true,
		},
		{
			"start_time": 200.0, "end_time": 260.0,
			"location": Enums.LocationID.BAR_CROSSROADS,
			"position": Vector2(120, 60),
			"activity": "Delivery to bar",
			"state": Enums.NPCState.WALKING,
			"interruptible": true,
		},
		{
			"start_time": 260.0, "end_time": 350.0,
			"location": Enums.LocationID.DOCKS,
			"position": Vector2(200, 100),
			"activity": "Delivery to docks",
			"state": Enums.NPCState.WALKING,
			"interruptible": true,
		},
		{
			"start_time": 350.0, "end_time": 420.0,
			"location": Enums.LocationID.HOTEL_MARLOW,
			"position": Vector2(160, 100),
			"activity": "Delivery to hotel",
			"state": Enums.NPCState.WALKING,
			"interruptible": true,
		},
		{
			"start_time": 420.0, "end_time": 520.0,
			"location": Enums.LocationID.BAR_CROSSROADS,
			"position": Vector2(240, 140),
			"activity": "Hanging out at bar",
			"state": Enums.NPCState.SOCIALIZING,
			"interruptible": true,
		},
		{
			"start_time": 520.0, "end_time": 570.0,
			"location": Enums.LocationID.APARTMENT_COMPLEX,
			"position": Vector2(60, 140),
			"activity": "Walking home",
			"state": Enums.NPCState.WALKING,
			"interruptible": true,
		},
		{
			"start_time": 570.0, "end_time": 600.0,
			"location": Enums.LocationID.APARTMENT_COMPLEX,
			"position": Vector2(60, 140),
			"activity": "Home for the night",
			"state": Enums.NPCState.IDLE,
			"interruptible": true,
		},
	]
