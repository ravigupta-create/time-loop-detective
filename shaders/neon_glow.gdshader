shader_type canvas_item;

uniform vec4 glow_color : source_color = vec4(1.0, 0.2, 0.4, 1.0);
uniform float glow_intensity : hint_range(0.0, 3.0) = 1.5;
uniform float pulse_speed : hint_range(0.0, 5.0) = 1.0;
uniform float glow_radius : hint_range(0.0, 0.1) = 0.02;

void fragment() {
	vec4 tex = texture(TEXTURE, UV);

	// Sample neighbors for glow
	float glow = 0.0;
	for (int x = -2; x <= 2; x++) {
		for (int y = -2; y <= 2; y++) {
			vec2 offset = vec2(float(x), float(y)) * glow_radius;
			float sample_a = texture(TEXTURE, UV + offset).a;
			glow += sample_a;
		}
	}
	glow /= 25.0;

	// Pulsing effect
	float pulse = 0.8 + 0.2 * sin(TIME * pulse_speed);

	// Apply glow around non-transparent pixels
	vec3 color = tex.rgb;
	if (tex.a > 0.1) {
		color = mix(color, glow_color.rgb, 0.3 * pulse);
	}

	// Add glow halo
	float halo = glow * glow_intensity * pulse * (1.0 - tex.a);
	color += glow_color.rgb * halo;

	float alpha = max(tex.a, halo * 0.5);
	COLOR = vec4(color, alpha);
}
