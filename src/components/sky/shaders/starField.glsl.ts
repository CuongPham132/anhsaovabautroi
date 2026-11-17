export const starFieldVertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uPixelRatio;

  attribute float aSize;
  attribute vec3 aColor;
  attribute float aPhase;
  attribute float aSpeed;

  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vColor = aColor;

    // Atmospheric extinction fade near the horizon so stars never appear below ground
    float altitude = normalize(position).y;
    float horizonFade = smoothstep(-0.01, 0.14, altitude);

    // Organic twinkle rhythm per star using unique phase & speed
    float twinkle = sin(uTime * aSpeed + aPhase);
    float pulse = 0.76 + 0.24 * twinkle;

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // Crisp astronomical pinpoint sizing calibrated for outer sky dome (r ~ 245..280)
    float dist = -mvPosition.z;
    gl_PointSize = (aSize * pulse * uPixelRatio * 230.0) / max(dist, 1.0);
    gl_PointSize = clamp(gl_PointSize, 1.0, 9.5) * step(0.001, horizonFade);

    vAlpha = clamp(0.58 + 0.42 * twinkle, 0.22, 1.0) * horizonFade;
  }
`;

export const starFieldFragmentShader = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    if (vAlpha <= 0.005) {
      discard;
    }

    // Soft circular radial falloff (no texture needed)
    vec2 coord = gl_PointCoord - vec2(0.5);
    float distSq = dot(coord, coord);

    if (distSq > 0.25) {
      discard;
    }

    // Sharp pinpoint star core + delicate starlight halo
    float dist = sqrt(distSq);
    float core = smoothstep(0.45, 0.04, dist);
    float halo = exp(-dist * 8.5);
    float intensity = core * 0.85 + halo * 0.35;

    // HDR boost for selective bloom compatibility (toneMapped = false)
    vec3 hdrColor = vColor * (1.12 + core * 0.65);
    gl_FragColor = vec4(hdrColor, vAlpha * intensity);
  }
`;
