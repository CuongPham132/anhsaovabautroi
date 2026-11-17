export const moonVertexShader = /* glsl */ `
  varying vec3 vLocalNormal;
  varying vec3 vWorldNormal;
  varying vec3 vViewDir;

  void main() {
    vLocalNormal = normalize(normal);
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    vViewDir = normalize(cameraPosition - worldPos.xyz);
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

export const moonFragmentShader = /* glsl */ `
  uniform vec3 uSunDir;

  varying vec3 vLocalNormal;
  varying vec3 vWorldNormal;
  varying vec3 vViewDir;

  float hash31(vec3 p) {
    p = fract(p * 0.1031);
    p += dot(p, p.yzx + 33.33);
    return fract((p.x + p.y) * p.z);
  }

  float noise3(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);

    float n000 = hash31(i + vec3(0.0, 0.0, 0.0));
    float n100 = hash31(i + vec3(1.0, 0.0, 0.0));
    float n010 = hash31(i + vec3(0.0, 1.0, 0.0));
    float n110 = hash31(i + vec3(1.0, 1.0, 0.0));
    float n001 = hash31(i + vec3(0.0, 0.0, 1.0));
    float n101 = hash31(i + vec3(1.0, 0.0, 1.0));
    float n011 = hash31(i + vec3(0.0, 1.0, 1.0));
    float n111 = hash31(i + vec3(1.0, 1.0, 1.0));

    float nx00 = mix(n000, n100, f.x);
    float nx10 = mix(n010, n110, f.x);
    float nx01 = mix(n001, n101, f.x);
    float nx11 = mix(n011, n111, f.x);

    float nxy0 = mix(nx00, nx10, f.y);
    float nxy1 = mix(nx01, nx11, f.y);
    return mix(nxy0, nxy1, f.z);
  }

  float fbm3(vec3 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
      v += a * noise3(p);
      p = p * 2.05 + vec3(11.3, 7.1, 5.7);
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec3 n = normalize(vLocalNormal);

    // Procedural lunar maria (dark basaltic plains) & bright crater highlands
    float maria = fbm3(n * 2.6 + vec3(1.2, -0.4, 2.1));
    float craters = fbm3(n * 9.5 + vec3(-2.4, 3.1, 0.8));
    float mariaMask = smoothstep(0.42, 0.62, maria);

    vec3 highlandCol = vec3(0.98, 0.94, 0.84); // Warm ivory-silver moonstone
    vec3 mariaCol = vec3(0.58, 0.60, 0.67);    // Cool lunar sea slate
    vec3 albedo = mix(highlandCol, mariaCol, mariaMask * 0.58);
    albedo *= 0.90 + 0.16 * craters;

    // Realistic waxing gibbous lunar phase lighting + gentle indigo earthshine
    vec3 sunDir = normalize(uSunDir);
    float ndotl = dot(normalize(vWorldNormal), sunDir);
    float lit = smoothstep(-0.14, 0.22, ndotl);

    // Limb darkening + subtle atmospheric rim bloom
    float ndotv = clamp(dot(normalize(vWorldNormal), normalize(vViewDir)), 0.0, 1.0);
    float rim = pow(1.0 - ndotv, 2.5);

    vec3 earthshine = vec3(0.08, 0.11, 0.23) * (0.65 + 0.35 * albedo);
    vec3 sunlit = albedo * (1.28 + rim * 0.28);

    vec3 color = mix(earthshine, sunlit, lit);
    color += vec3(0.95, 0.88, 0.72) * rim * lit * 0.32;

    gl_FragColor = vec4(color, 1.0);
  }
`;

export const moonHaloVertexShader = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const moonHaloFragmentShader = /* glsl */ `
  varying vec2 vUv;

  void main() {
    float dist = length(vUv - vec2(0.5)) * 2.0;
    if (dist > 1.0) {
      discard;
    }

    float innerGlow = exp(-dist * 4.8);
    float outerCorona = exp(-dist * 2.2) * (1.0 - smoothstep(0.55, 1.0, dist));

    vec3 warmCore = vec3(1.0, 0.93, 0.76);
    vec3 coolMist = vec3(0.52, 0.62, 0.96);

    vec3 col = mix(coolMist, warmCore, innerGlow);
    float alpha = clamp(innerGlow * 0.42 + outerCorona * 0.22, 0.0, 0.65);

    gl_FragColor = vec4(col, alpha);
  }
`;
