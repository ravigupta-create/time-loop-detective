shader_type canvas_item;

uniform float rain_intensity : hint_range(0.0, 1.0) = 0.5;
uniform float speed : hint_range(0.1, 5.0) = 2.0;
uniform float drop_length : hint_range(0.01, 0.1) = 0.03;
uniform vec4 rain_color : source_color = vec4(0.7, 0.75, 0.85, 0.3);

float hash(vec2 p) {
	return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

void fragment() {
	vec4 tex = texture(TEXTURE, UV);
	vec2 uv = UV;

	// Create rain drops
	float rain = 0.0;
	for (int i = 0; i < 3; i++) {
		float layer = float(i);
		vec2 drop_uv = uv * vec2(20.0 + layer * 5.0, 1.0);
		drop_uv.y += TIME * speed * (1.0 + layer * 0.3);

		float drop_id = floor(drop_uv.x);
		float drop_phase = hash(vec2(drop_id, layer));

		float drop_y = fract(drop_uv.y + drop_phase);
		float drop_x = fract(drop_uv.x) - 0.5;

		float drop = smoothstep(drop_length, 0.0, drop_y) * smoothstep(0.02, 0.0, abs(drop_x));
		rain += drop * (0.5 + layer * 0.2);
	}

	rain *= rain_intensity;
	vec3 color = mix(tex.rgb, rain_color.rgb, rain * rain_color.a);

	// Slight darkening for rainy atmosphere
	color *= mix(1.0, 0.85, rain_intensity);

	COLOR = vec4(color, tex.a);
}
