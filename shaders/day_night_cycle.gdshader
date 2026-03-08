shader_type canvas_item;

uniform vec4 tint_color : source_color = vec4(1.0, 1.0, 1.0, 1.0);
uniform float intensity : hint_range(0.0, 1.0) = 0.0;

void fragment() {
	vec4 tex = texture(TEXTURE, UV);
	vec3 tinted = mix(tex.rgb, tex.rgb * tint_color.rgb, intensity);
	COLOR = vec4(tinted, tex.a);
}
