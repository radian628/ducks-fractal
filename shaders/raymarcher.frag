#version 300 es

precision highp float;

vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

vec2 iteration(vec2 z, vec2 p) {
  vec2 temp = vec2(z.x, abs(z.y)) + p;
  return vec2(log(length(temp)), atan(temp.y, temp.x));
}

in mediump vec2 texCoord;

out vec4 fragColor;

uniform vec2 p;

uniform float aspect;

float asymptoteAt1(float x) {
  return -1.0 / (1.0 + x) + 1.0;
}

void main() {
  vec2 z = texCoord * 3.0 - 1.5;
  z.y *= aspect;
  //vec2 pOffset = texture2D(tex, 1.0 - texCoord).rg * 0.02;
//vec2 p = vec2(0.5, -0.5);
//float iter = 0.0;
for (int i = 0; i < 64; i++) {
  z = iteration(z, p);
  //if (length(z) < 0.5) iter = float(i);
}
vec3 col = vec3(atan(z.y, z.x) / 6.28318531 + 0.5, 1.0, asymptoteAt1(length(z)));
  fragColor = vec4(hsv2rgb(col), 1.0);
}