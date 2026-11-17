export const waterVertexShader = /* glsl */ `
  varying vec3 vWorldPos;

  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPosition.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

export const waterFragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uQuality; // 0.0 = simple, 1.0 = medium, 2.0 = high
  uniform vec3 uFogColor;
  uniform float uFogDensity;

  varying vec3 vWorldPos;

  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float waveNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash21(i);
    float b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0));
    float d = hash21(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  vec3 sampleNightSkyReflection(vec3 reflDir) {
    float h = clamp(reflDir.y, 0.0, 1.0);
    vec3 zenith = vec3(0.010, 0.018, 0.055);
    vec3 mid = vec3(0.032, 0.055, 0.155);
    vec3 horizon = vec3(0.170, 0.150, 0.345);
    vec3 valleyGlow = vec3(0.285, 0.185, 0.360);

    vec3 sky = mix(horizon, mid, smoothstep(0.0, 0.28, h));
    sky = mix(sky, zenith, smoothstep(0.24, 0.85, h));

    float northAlign = pow(max(dot(normalize(vec2(reflDir.x, reflDir.z)), vec2(0.0, -1.0)), 0.0), 2.5);
    sky += valleyGlow * exp(-h * 8.5) * northAlign * 0.65;

    // Soft Milky Way diagonal reflection shimmer across the lake
    float bandAxis = abs(reflDir.x * 0.68 - reflDir.y * 0.55 + reflDir.z * 0.18);
    float milkyBand = exp(-bandAxis * 6.5) * smoothstep(0.03, 0.35, h);
    vec3 milkyTint = mix(vec3(0.14, 0.11, 0.30), vec3(0.28, 0.16, 0.32), northAlign);
    sky += milkyTint * milkyBand * 0.42;

    return sky;
  }

  void main() {
    vec3 viewVec = cameraPosition - vWorldPos;
    float dist = length(viewVec);
    vec3 V = viewVec / max(dist, 0.0001);

    // Distance fade on high-frequency ripples to prevent distant shimmering artifacts
    float rippleDamp = 1.0 / (1.0 + dist * 0.025);

    vec3 N = vec3(0.0, 1.0, 0.0);

    if (uQuality >= 0.5) {
      vec2 uv1 = vWorldPos.xz * 0.16 + vec2(uTime * 0.08, -uTime * 0.05);
      vec2 uv2 = vWorldPos.xz * 0.34 + vec2(-uTime * 0.06, uTime * 0.09);

      float w1 = waveNoise(uv1);
      float w2 = waveNoise(uv2);
      float eps = 0.25;
      float w1x = waveNoise(uv1 + vec2(eps, 0.0));
      float w1z = waveNoise(uv1 + vec2(0.0, eps));
      float w2x = waveNoise(uv2 + vec2(eps, 0.0));
      float w2z = waveNoise(uv2 + vec2(0.0, eps));

      float dx = ((w1x - w1) * 0.55 + (w2x - w2) * 0.35) * rippleDamp;
      float dz = ((w1z - w1) * 0.55 + (w2z - w2) * 0.35) * rippleDamp;

      if (uQuality >= 1.5) {
        vec2 uv3 = vWorldPos.xz * 0.78 + vec2(uTime * 0.14, uTime * 0.11);
        float w3 = waveNoise(uv3);
        float w3x = waveNoise(uv3 + vec2(0.18, 0.0));
        float w3z = waveNoise(uv3 + vec2(0.0, 0.18));
        dx += (w3x - w3) * 0.22 * rippleDamp;
        dz += (w3z - w3) * 0.22 * rippleDamp;
      }

      N = normalize(vec3(-dx * 0.36, 1.0, -dz * 0.36));
    }

    vec3 R = reflect(-V, N);
    R.y = max(R.y, 0.005);

    vec3 reflColor = sampleNightSkyReflection(R);
    vec3 deepWaterColor = vec3(0.012, 0.022, 0.058);

    // Schlick Fresnel approximation for calm nocturnal lake reflectivity
    float ndotv = clamp(dot(N, V), 0.0, 1.0);
    float fresnel = 0.08 + 0.86 * pow(1.0 - ndotv, 3.6);
    vec3 color = mix(deepWaterColor, reflColor, fresnel);

    // Soft shimmering moonlight path aligned with the Moon above the Observatory valley (-37 deg)
    vec3 lightDir = normalize(vec3(-0.53, 0.38, -0.76));
    vec3 H = normalize(lightDir + V);
    float specWide = pow(max(dot(N, H), 0.0), 36.0);
    float specSharp = pow(max(dot(N, H), 0.0), 190.0);
    vec3 shimmerColor = vec3(0.78, 0.80, 0.98);
    vec3 moonSilverGold = vec3(1.0, 0.93, 0.78);
    color += shimmerColor * specWide * 0.28;
    color += moonSilverGold * specSharp * 0.62 * rippleDamp;

    // Subtle reflected starlight sparkles on medium/high tiers
    if (uQuality >= 0.5) {
      vec2 glintCell = floor((vWorldPos.xz + N.xz * 8.0) * 0.45);
      float rnd = hash21(glintCell);
      if (rnd > 0.978) {
        float twinkle = 0.5 + 0.5 * sin(uTime * (2.2 + rnd * 3.0) + rnd * 60.0);
        float glintDistFade = smoothstep(130.0, 12.0, dist);
        color += mix(vec3(0.85, 0.92, 1.0), moonSilverGold, fract(rnd * 17.0))
          * twinkle * glintDistFade * 0.38;
      }
    }

    // Exponential squared fog matching scene fogExp2 so distant lake merges seamlessly into night mist
    float fogFactor = 1.0 - exp(-uFogDensity * uFogDensity * dist * dist);
    color = mix(color, uFogColor, clamp(fogFactor, 0.0, 0.92));

    gl_FragColor = vec4(color, 1.0);
  }
`;
