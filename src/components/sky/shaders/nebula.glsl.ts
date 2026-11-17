export const nebulaVertexShader = /* glsl */ `
  varying vec3 vWorldDir;

  void main() {
    vWorldDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const nebulaFragmentShader = /* glsl */ `
  uniform float uTime;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec3 uCoreColor;
  uniform float uOpacity;
  uniform float uLayerDetail;

  varying vec3 vWorldDir;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    mat2 rot = mat2(0.80, 0.60, -0.60, 0.80);
    for (int i = 0; i < 4; ++i) {
      v += a * noise(p);
      p = rot * p * 2.02 + vec2(17.3, 9.1);
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec3 dir = normalize(vWorldDir);

    // Fade cleanly above the horizon so the Milky Way never bleeds below ground/lake
    float horizonFade = smoothstep(0.01, 0.18, dir.y);
    if (horizonFade <= 0.001) {
      discard;
    }

    // Tilted galactic coordinate frame arching gracefully across the 360-degree night sky
    vec3 galNormal = normalize(vec3(0.56, 0.42, 0.71));
    vec3 galU = normalize(cross(vec3(0.0, 1.0, 0.0), galNormal));
    vec3 galV = cross(galNormal, galU);

    float galLat = dot(dir, galNormal);
    float galLon = atan(dot(dir, galV), dot(dir, galU));

    // Primary galactic ribbon mask
    float bandWidth = exp(-galLat * galLat * 14.0);
    float coreWidth = exp(-galLat * galLat * 48.0);

    vec2 uv = vec2(galLon * 1.45, galLat * 4.2);
    float drift = uTime * 0.004;

    float n1 = fbm(uv * 1.35 + vec2(drift, -drift * 0.5));
    float n2 = fbm(uv * 2.6 - vec2(drift * 0.6, drift * 0.3) + n1 * 0.85);

    // Subtle dark cosmic dust rift along the Milky Way centerline
    float dustRift = smoothstep(0.32, 0.68, fbm(uv * 3.8 + vec2(4.2, -2.1)));
    float riftCarve = 1.0 - dustRift * coreWidth * 0.52 * uLayerDetail;

    vec3 nebulaCol = mix(uColorA, uColorB, n1);
    nebulaCol = mix(nebulaCol, uCoreColor, coreWidth * n2 * 0.75);

    float intensity = (bandWidth * (0.35 + 0.65 * n2) + coreWidth * 0.45 * n1) * riftCarve;
    float alpha = clamp(intensity * uOpacity * horizonFade, 0.0, 0.72);

    gl_FragColor = vec4(nebulaCol * 1.25, alpha);
  }
`;
