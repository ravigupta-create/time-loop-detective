shader_type canvas_item;

uniform float scanline_intensity : hint_range(0.0, 1.0) = 0.12;
uniform float scanline_count : hint_range(50.0, 500.0) = 180.0;
uniform float vignette_intensity : hint_range(0.0, 1.0) = 0.25;
uniform float chromatic_aberration : hint_range(0.0, 0.01) = 0.0008;
uniform float flicker : hint_range(0.0, 0.1) = 0.015;

uniform sampler2D screen_texture : hint_screen_texture, filter_linear_mipmap;

void fragment() {
	vec2 uv = SCREEN_UV;

	// Chromatic aberration
	float r = texture(screen_texture, uv + vec2(chromatic_aberration, 0.0)).r;
	float g = texture(screen_texture, uv).g;
	float b = texture(screen_texture, uv - vec2(chromatic_aberration, 0.0)).b;

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

	COLOR = vec4(color, 1.0);
}
