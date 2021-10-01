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

uniform vec2 corner1;
uniform vec2 corner2;

uniform vec2 winSize;

uniform float sampleSideLength;

float asymptoteAt1(float x) {
  return -1.0 / (1.0 + x) + 1.0;
}

vec3 doFractalQuery(vec2 z) {
  for (int i = 0; i < 256; i++) {
    z = iteration(z, p);
  }
  vec3 col = vec3(atan(z.y, z.x) / 6.28318531 + 0.5, 1.0, asymptoteAt1(length(z)));
  return hsv2rgb(col);
}

void main() {
  vec2 z = texCoord * (corner2 - corner1) + corner1;
  vec3 col = vec3(0.0);
  if (sampleSideLength > 1.0) {
    vec2 d = (corner2 - corner1) / winSize / (sampleSideLength * 2.0);
    vec2 startD = -d * (sampleSideLength - 1.0);
    vec2 endD = d * (sampleSideLength - 1.0);
    vec2 index;
    for (index.y = startD.y; index.y <= endD.y; index.y += d.y * 2.0) {
      for (index.x = startD.x; index.x <= endD.x; index.x += d.x * 2.0) {
        col += doFractalQuery(z + index);
      }
    }
    col /= float(sampleSideLength * sampleSideLength);
  } else {
    col = doFractalQuery(z);
  }
  // doFractalQuery(z + vec2(-d.x, -d.y)) +
  // doFractalQuery(z + vec2(-d.x, d.y)) +
  // doFractalQuery(z + vec2(d.x, -d.y)) +
  // doFractalQuery(z + vec2(d.x, d.y));
  fragColor = vec4(col, 1.0);
}