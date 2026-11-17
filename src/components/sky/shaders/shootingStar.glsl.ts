export const shootingStarVertexShader = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const shootingStarFragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;

  varying vec2 vUv;

  void main() {
    // vUv.x = 0 (tail end) -> 1 (bright meteor head)
    // vUv.y = 0..1 across width (0.5 = center axis)
    float along = clamp(vUv.x, 0.0, 1.0);
    float across = abs(vUv.y - 0.5) * 2.0;

    // Taper width smoothly from bright head down to a needle-fine stardust tail
    float widthProfile = mix(0.18, 1.0, pow(along, 1.4));
    float core = exp(-pow(across / max(widthProfile, 0.05), 2.0) * 6.5);

    // Longitudinal brightness: soft fade-out tail + incandescent bright tip
    float tailFade = pow(along, 2.15) * smoothstep(1.0, 0.94, along);
    float headFlare = exp(-pow((along - 0.93) * 14.0, 2.0)) * exp(-across * across * 9.0);

    float intensity = tailFade * core + headFlare * 1.45;
    if (intensity * uOpacity <= 0.004) {
      discard;
    }

    // White-hot core transitioning into colored celestial plasma tail (HDR for Bloom)
    vec3 whiteHot = vec3(1.0, 0.99, 0.96);
    vec3 color = mix(uColor * 1.35, whiteHot * 2.2, clamp(headFlare * 1.15 + along * 0.35, 0.0, 1.0));

    gl_FragColor = vec4(color, clamp(intensity * uOpacity, 0.0, 1.0));
  }
`;
