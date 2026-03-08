shader_type canvas_item;

uniform float scanline_intensity : hint_range(0.0, 1.0) = 0.15;
uniform float scanline_count : hint_range(50.0, 500.0) = 180.0;
uniform float vignette_intensity : hint_range(0.0, 1.0) = 0.3;
uniform float chromatic_aberration : hint_range(0.0, 0.01) = 0.001;
uniform float flicker : hint_range(0.0, 0.1) = 0.02;

void fragment() {
	vec2 uv = UV;

	// Chromatic aberration
	float r = texture(TEXTURE, uv + vec2(chromatic_aberration, 0.0)).r;
	float g = texture(TEXTURE, uv).g;
	float b = texture(TEXTURE, uv - vec2(chromatic_aberration, 0.0)).b;
	float a = texture(TEXTURE, uv).a;

	vec3 color = vec3(r, g, b);

	// Scanlines
	float scanline = sin(uv.y * scanline_count * 3.14159) * 0.5 + 0.5;
	color *= 1.0 - scanline_intensity * (1.0 - scanline);

	// Vignette
	vec2 center = uv - 0.5;
	float vignette = 1.0 - dot(center, center) * vignette_intensity * 2.0;
	color *= vignette;

	// Subtle flicker
	color *= 1.0 - flicker * sin(TIME * 60.0);

	COLOR = vec4(color, a);
}
