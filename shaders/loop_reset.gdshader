shader_type canvas_item;

uniform float progress : hint_range(0.0, 1.0) = 0.0;
uniform float distortion_strength : hint_range(0.0, 0.2) = 0.1;
uniform float chromatic_split : hint_range(0.0, 0.05) = 0.02;

void fragment() {
	vec2 uv = UV;

	// VHS-style horizontal distortion
	float distort = sin(uv.y * 50.0 + TIME * 20.0) * distortion_strength * progress;
	distort += sin(uv.y * 130.0 - TIME * 35.0) * distortion_strength * 0.5 * progress;
	uv.x += distort;

	// Vertical roll
	uv.y = fract(uv.y + progress * 0.3);

	// Chromatic aberration increases with progress
	float ca = chromatic_split * progress;
	float r = texture(TEXTURE, uv + vec2(ca, 0.0)).r;
	float g = texture(TEXTURE, uv).g;
	float b = texture(TEXTURE, uv - vec2(ca, 0.0)).b;

	vec3 color = vec3(r, g, b);

	// Static noise
	float noise = fract(sin(dot(uv + TIME, vec2(12.9898, 78.233))) * 43758.5453);
	color = mix(color, vec3(noise), progress * 0.4);

	// Horizontal tear lines
	float tear = step(0.98, fract(uv.y * 8.0 + TIME * 5.0)) * progress;
	color = mix(color, vec3(1.0), tear);

	// Fade to white at end
	color = mix(color, vec3(1.0), smoothstep(0.7, 1.0, progress));

	COLOR = vec4(color, 1.0);
}
