extends Node
## Central signal relay for cross-system communication.

# Time signals
signal time_tick(current_time: float)
signal loop_reset(loop_number: int)
signal loop_ending_soon(seconds_remaining: float)
signal time_of_day_changed(time_of_day: int)

# Player signals
signal player_entered_location(location_id: int)
signal player_exited_location(location_id: int)
signal player_interacted(target: Node)
signal player_started_following(npc_id: String)
signal player_stopped_following()

# NPC signals
signal npc_arrived_at_location(npc_id: String, location_id: int)
signal npc_state_changed(npc_id: String, old_state: int, new_state: int)
signal npc_interaction_started(npc_id: String)
signal npc_interaction_ended(npc_id: String)
signal npc_witnessed_event(npc_id: String, event_type: String)

# Crime signals
signal crime_started(crime_id: String, crime_type: int)
signal crime_stage_advanced(crime_id: String, stage: int)
signal crime_completed(crime_id: String, outcome: String)
signal crime_intervened(crime_id: String, intervention_type: int)
signal evidence_spawned(evidence_id: String, location_id: int)

# Clue signals
signal clue_discovered(clue_id: String)
signal clue_connection_made(connection_id: String)
signal conspiracy_progress_changed(new_value: int)
signal theory_created(theory_id: String)

# Dialogue signals
signal dialogue_started(npc_id: String)
signal dialogue_ended(npc_id: String)
signal dialogue_choice_made(npc_id: String, choice_id: String)

# UI signals
signal notebook_opened()
signal notebook_closed()
signal notification_queued(text: String, icon: String)
signal minimap_updated()

# Audio signals
signal music_change_requested(track: String)
signal ambience_change_requested(ambience: String)
signal sfx_requested(sfx_name: String)

# Transition signals
signal transition_started(transition_type: String)
signal transition_midpoint()
signal transition_completed()

# Weather signals
signal weather_changed(weather_type: int)

# NPC interaction signals
signal npc_npc_interaction_started(npc_a: String, npc_b: String, interaction_type: String)
signal npc_npc_interaction_ended(npc_a: String, npc_b: String)

# Endgame signals
signal endgame_step_completed(step_id: String)
signal endgame_started()
signal endgame_victory()
signal conspiracy_milestone_reached(milestone_id: String, tier: int)

# Game flow
signal game_started()
signal game_paused()
signal game_resumed()
signal game_saved()
signal game_loaded()
