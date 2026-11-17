export const atmosphereVertexShader = /* glsl */ `
  varying vec3 vWorldDir;

  void main() {
    vWorldDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const atmosphereFragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uCloudStrength;

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
    float amp = 0.5;
    for (int i = 0; i < 4; i++) {
      v += amp * noise(p);
      p = p * 2.02 + vec2(13.7, 9.2);
      amp *= 0.5;
    }
    return v;
  }

  void main() {
    vec3 dir = normalize(vWorldDir);
    float h = clamp(dir.y, -0.2, 1.0);

    // Cinematic Midnight Navy -> Deep Indigo -> Romantic Lavender-Violet Horizon
    vec3 zenithColor = vec3(0.008, 0.015, 0.048);     // #02040c
    vec3 midSkyColor = vec3(0.024, 0.046, 0.135);     // #060c22
    vec3 lowerSkyColor = vec3(0.075, 0.105, 0.255);   // #131b41
    vec3 horizonGlow = vec3(0.165, 0.145, 0.340);     // Soft indigo-lavender airglow
    vec3 valleyTint = vec3(0.240, 0.155, 0.315);      // Subtle rose-purple romantic rim
    vec3 belowGroundColor = vec3(0.014, 0.022, 0.058);

    vec3 col = mix(lowerSkyColor, midSkyColor, smoothstep(0.04, 0.32, h));
    col = mix(col, zenithColor, smoothstep(0.28, 0.88, h));

    // Luminous atmospheric band right above the horizon for mountain silhouette separation
    float horizonBand = exp(-max(h, 0.0) * 11.5) * smoothstep(-0.08, 0.015, h);
    // Concentrate a soft moonlit / twilight airglow gently toward the northern valley (-Z)
    float northBias = pow(max(dot(normalize(vec2(dir.x, dir.z)), vec2(0.0, -1.0)), 0.0), 2.2);
    vec3 glowMix = mix(horizonGlow, valleyTint, northBias * 0.55);
    col += glowMix * horizonBand * 0.72;

    // Very subtle high-altitude nocturnal cloud wisps near the lower sky
    if (uCloudStrength > 0.01 && h > 0.01 && h < 0.48) {
      vec2 cloudUv = dir.xz / (h + 0.22) * 0.85 + vec2(uTime * 0.0045, -uTime * 0.0025);
      float c = fbm(cloudUv * 2.1);
      float cloudMask = smoothstep(0.52, 0.82, c);
      float altFade = smoothstep(0.02, 0.12, h) * smoothstep(0.46, 0.16, h);
      vec3 cloudCol = mix(vec3(0.11, 0.14, 0.28), vec3(0.22, 0.17, 0.34), northBias);
      col = mix(col, cloudCol, cloudMask * altFade * 0.32 * uCloudStrength);
    }

    // Smooth dark fade below horizon
    col = mix(belowGroundColor, col, smoothstep(-0.06, 0.02, h));

    gl_FragColor = vec4(col, 1.0);
  }
`;
