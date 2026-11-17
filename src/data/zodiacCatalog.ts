import type { StarPosition } from '../types/star';
import type { ResolvedZodiacGeometry, ZodiacDefinition, ZodiacElement, ZodiacId } from '../types/zodiac';
import { OBSERVER_EYE_POSITION } from '../utils/skyProjection';

export const ZODIAC_DOME_RADIUS = 228;

export const ZODIAC_ELEMENT_META: Readonly<
  Record<ZodiacElement, { readonly labelVi: string; readonly colorHex: string }>
> = Object.freeze({
  fire: { labelVi: 'Lửa', colorHex: '#ffb36b' },
  earth: { labelVi: 'Đất', colorHex: '#a5e8b7' },
  air: { labelVi: 'Khí', colorHex: '#9ee7ff' },
  water: { labelVi: 'Nước', colorHex: '#c7b8ff' },
});

/**
 * 12 Stylized Game Zodiac Constellations arranged smoothly around the 360-degree sky dome.
 * Carefully positioned to avoid overlapping the 18 V1 personal memory stars (az -28..+28, alt 20..48)
 * and the Moon (az -40, alt 29).
 */
export const ZODIAC_CATALOG: readonly ZodiacDefinition[] = Object.freeze([
  {
    id: 'zodiac-aries',
    nameVi: 'Bạch Dương',
    nameEn: 'Aries',
    symbol: '♈',
    element: 'fire',
    dateRange: '21/03 – 19/04',
    theme: 'Ngọn lửa khởi đầu',
    shortDescription: 'Tia sáng tiên phong thắp lên hành trình đầu tiên giữa màn đêm tĩnh lặng.',
    mythLore:
      'Truyền thuyết kể rằng chòm sao Bạch Dương là tia lửa đầu tiên tách khỏi bóng tối để mở lối cho những kẻ mộng mơ dám bước về phía chân trời chưa từng đặt chân tới.',
    colorHex: '#ffbe76',
    accentHex: '#ff7979',
    skyAzimuthDeg: 44,
    skyAltitudeDeg: 42,
    angularScaleDeg: 10.5,
    stars: [
      { u: -0.85, v: 0.35, brightness: 1.45 },
      { u: -0.25, v: 0.52, brightness: 1.75 },
      { u: 0.45, v: 0.25, brightness: 1.35 },
      { u: 0.85, v: -0.28, brightness: 1.2 },
      { u: 0.58, v: -0.68, brightness: 1.05 },
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
    ],
  },
  {
    id: 'zodiac-taurus',
    nameVi: 'Kim Ngưu',
    nameEn: 'Taurus',
    symbol: '♉',
    element: 'earth',
    dateRange: '20/04 – 20/05',
    theme: 'Sự bền vững',
    shortDescription: 'Đôi sừng ánh sáng vững chãi nâng đỡ những lời hứa đi qua năm tháng.',
    mythLore:
      'Giữa bầu trời luôn đổi thay, Kim Ngưu là điểm tựa bình yên nhất — nơi ánh sao Aldebaran rực ấm như ngọn đèn không bao giờ tắt trước gió núi.',
    colorHex: '#ffd59e',
    accentHex: '#9be7b5',
    skyAzimuthDeg: 74,
    skyAltitudeDeg: 32,
    angularScaleDeg: 11.5,
    stars: [
      { u: -0.92, v: 0.78, brightness: 1.35 },
      { u: -0.35, v: 0.22, brightness: 1.75 },
      { u: 0.0, v: -0.18, brightness: 1.3 },
      { u: 0.42, v: 0.16, brightness: 1.4 },
      { u: 0.94, v: 0.72, brightness: 1.45 },
      { u: 0.04, v: -0.78, brightness: 1.2 },
      { u: -0.48, v: -0.56, brightness: 1.1 },
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [2, 5],
      [1, 6],
    ],
  },
  {
    id: 'zodiac-gemini',
    nameVi: 'Song Tử',
    nameEn: 'Gemini',
    symbol: '♊',
    element: 'air',
    dateRange: '21/05 – 20/06',
    theme: 'Hai vì sao song hành',
    shortDescription: 'Hai dải sáng luôn đi cạnh nhau, phản chiếu tiếng cười và nhịp tim đồng điệu.',
    mythLore:
      'Castor và Pollux đã hứa sẽ không bao giờ để nửa kia phải tỏa sáng một mình. Dù bầu trời xoay vần thế nào, hai ngôi sao vẫn nắm tay nhau qua từng mùa gió.',
    colorHex: '#a5e8ff',
    accentHex: '#ffe3a3',
    skyAzimuthDeg: 106,
    skyAltitudeDeg: 48,
    angularScaleDeg: 11.0,
    stars: [
      { u: -0.52, v: 0.85, brightness: 1.7 },
      { u: 0.46, v: 0.78, brightness: 1.75 },
      { u: -0.45, v: 0.18, brightness: 1.25 },
      { u: 0.38, v: 0.12, brightness: 1.3 },
      { u: -0.58, v: -0.68, brightness: 1.35 },
      { u: 0.48, v: -0.72, brightness: 1.35 },
      { u: -0.88, v: 0.32, brightness: 1.05 },
      { u: 0.86, v: 0.25, brightness: 1.05 },
    ],
    edges: [
      [0, 1],
      [0, 2],
      [1, 3],
      [2, 3],
      [2, 4],
      [3, 5],
      [2, 6],
      [3, 7],
    ],
  },
  {
    id: 'zodiac-cancer',
    nameVi: 'Cự Giải',
    nameEn: 'Cancer',
    symbol: '♋',
    element: 'water',
    dateRange: '21/06 – 22/07',
    theme: 'Mái nhà và ký ức',
    shortDescription: 'Ánh sao dịu dàng chở che những điều nhỏ bé nhưng quý giá nhất trong lòng.',
    mythLore:
      'Dù không phải chòm sao chói lòa nhất, Cự Giải lại ẩn giấu cụm sao Tổ Ong lấp lánh ở chính giữa — tựa như một mái nhà ấm áp giữ trọn ký ức khi đêm xuống.',
    colorHex: '#c8d6ff',
    accentHex: '#ffb8d8',
    skyAzimuthDeg: 136,
    skyAltitudeDeg: 34,
    angularScaleDeg: 10.0,
    stars: [
      { u: 0.0, v: 0.86, brightness: 1.35 },
      { u: 0.04, v: 0.16, brightness: 1.55 },
      { u: -0.1, v: -0.14, brightness: 1.45 },
      { u: -0.74, v: -0.78, brightness: 1.35 },
      { u: 0.76, v: -0.64, brightness: 1.4 },
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [2, 4],
    ],
  },
  {
    id: 'zodiac-leo',
    nameVi: 'Sư Tử',
    nameEn: 'Leo',
    symbol: '♌',
    element: 'fire',
    dateRange: '23/07 – 22/08',
    theme: 'Ánh sáng rực rỡ',
    shortDescription: 'Trái tim hoàng kim tỏa sáng kiêu hãnh giữa trung tâm vũ trụ đêm.',
    mythLore:
      'Ngôi sao Regulus nơi trái tim Sư Tử được gọi là "vì sao của những lời thề chân thành" — rực cháy đủ ấm để xua tan mọi khoảng cách.',
    colorHex: '#ffd670',
    accentHex: '#ff9f68',
    skyAzimuthDeg: 168,
    skyAltitudeDeg: 52,
    angularScaleDeg: 12.0,
    stars: [
      { u: -0.82, v: 0.45, brightness: 1.3 },
      { u: -0.62, v: 0.84, brightness: 1.4 },
      { u: -0.26, v: 0.72, brightness: 1.45 },
      { u: -0.34, v: 0.25, brightness: 1.4 },
      { u: -0.45, v: -0.36, brightness: 1.85 },
      { u: 0.28, v: 0.18, brightness: 1.4 },
      { u: 0.34, v: -0.38, brightness: 1.35 },
      { u: 0.92, v: -0.18, brightness: 1.65 },
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [3, 5],
      [4, 6],
      [5, 7],
      [6, 7],
    ],
  },
  {
    id: 'zodiac-virgo',
    nameVi: 'Xử Nữ',
    nameEn: 'Virgo',
    symbol: '♍',
    element: 'earth',
    dateRange: '23/08 – 22/09',
    theme: 'Sự tinh tế',
    shortDescription: 'Những đường nét thanh tao như nét bút viết lên bầu trời bằng ánh trăng.',
    mythLore:
      'Spica — viên ngọc lam tinh khiết trên tay Xử Nữ — tượng trưng cho sự chăm chút âm thầm trong từng chi tiết nhỏ khiến một câu chuyện trở nên đáng nhớ mãi mãi.',
    colorHex: '#d5f2e3',
    accentHex: '#b5d6ff',
    skyAzimuthDeg: -162,
    skyAltitudeDeg: 35,
    angularScaleDeg: 12.0,
    stars: [
      { u: -0.88, v: 0.48, brightness: 1.3 },
      { u: -0.32, v: 0.42, brightness: 1.45 },
      { u: 0.16, v: 0.78, brightness: 1.3 },
      { u: 0.18, v: 0.08, brightness: 1.45 },
      { u: -0.28, v: -0.32, brightness: 1.35 },
      { u: 0.48, v: -0.58, brightness: 1.85 },
      { u: 0.88, v: 0.24, brightness: 1.25 },
    ],
    edges: [
      [0, 1],
      [1, 2],
      [1, 3],
      [1, 4],
      [3, 4],
      [3, 5],
      [3, 6],
    ],
  },
  {
    id: 'zodiac-libra',
    nameVi: 'Thiên Bình',
    nameEn: 'Libra',
    symbol: '♎',
    element: 'air',
    dateRange: '23/09 – 22/10',
    theme: 'Cân bằng',
    shortDescription: 'Nhịp hòa hợp dịu êm giữa hai thế giới, hai nhịp thở và hai trái tim.',
    mythLore:
      'Chiếc cân ánh sao của Thiên Bình không đo nặng nhẹ, mà giữ cho niềm vui và sự bình yên luôn nghiêng về phía cả hai người.',
    colorHex: '#b4e4ff',
    accentHex: '#e2c2ff',
    skyAzimuthDeg: -130,
    skyAltitudeDeg: 46,
    angularScaleDeg: 10.5,
    stars: [
      { u: 0.0, v: 0.84, brightness: 1.65 },
      { u: -0.78, v: 0.05, brightness: 1.6 },
      { u: 0.78, v: 0.1, brightness: 1.5 },
      { u: -0.48, v: -0.78, brightness: 1.25 },
      { u: 0.56, v: -0.74, brightness: 1.25 },
    ],
    edges: [
      [0, 1],
      [0, 2],
      [1, 2],
      [1, 3],
      [2, 4],
    ],
  },
  {
    id: 'zodiac-scorpio',
    nameVi: 'Bọ Cạp',
    nameEn: 'Scorpio',
    symbol: '♏',
    element: 'water',
    dateRange: '23/10 – 21/11',
    theme: 'Bí ẩn',
    shortDescription: 'Vầng sáng sâu thẳm và mãnh liệt như lời hứa chỉ hai người mới hiểu.',
    mythLore:
      'Trái tim đỏ rực Antares dẫn đầu chiếc đuôi cong uốn lượn qua dải Ngân Hà, đại diện cho cảm xúc sâu sắc và sức hút không thể lý giải.',
    colorHex: '#ff9eb5',
    accentHex: '#c084fc',
    skyAzimuthDeg: -98,
    skyAltitudeDeg: 32,
    angularScaleDeg: 11.8,
    stars: [
      { u: -0.84, v: 0.72, brightness: 1.4 },
      { u: -0.88, v: 0.34, brightness: 1.45 },
      { u: -0.74, v: -0.02, brightness: 1.3 },
      { u: -0.35, v: 0.28, brightness: 1.85 },
      { u: 0.06, v: -0.08, brightness: 1.35 },
      { u: 0.24, v: -0.62, brightness: 1.35 },
      { u: 0.68, v: -0.78, brightness: 1.45 },
      { u: 0.88, v: -0.36, brightness: 1.6 },
    ],
    edges: [
      [0, 3],
      [1, 3],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 6],
      [6, 7],
    ],
  },
  {
    id: 'zodiac-sagittarius',
    nameVi: 'Nhân Mã',
    nameEn: 'Sagittarius',
    symbol: '♐',
    element: 'fire',
    dateRange: '22/11 – 21/12',
    theme: 'Hành trình',
    shortDescription: 'Mũi tên ánh sao vút lên hướng về những chân trời mới đang chờ phía trước.',
    mythLore:
      'Mũi tên của Nhân Mã luôn chỉ thẳng về trung tâm dải Ngân Hà — nhắc rằng chuyến đi đẹp nhất là chuyến đi có một người cùng ngẩng đầu ngắm trời.',
    colorHex: '#ffc88a',
    accentHex: '#ff8fab',
    skyAzimuthDeg: -68,
    skyAltitudeDeg: 49,
    angularScaleDeg: 11.0,
    stars: [
      { u: -0.76, v: -0.32, brightness: 1.4 },
      { u: -0.22, v: 0.62, brightness: 1.55 },
      { u: 0.45, v: 0.38, brightness: 1.45 },
      { u: 0.24, v: -0.48, brightness: 1.5 },
      { u: -0.35, v: -0.58, brightness: 1.4 },
      { u: 0.88, v: 0.78, brightness: 1.65 },
      { u: 0.84, v: -0.08, brightness: 1.3 },
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 0],
      [1, 4],
      [2, 5],
      [2, 6],
    ],
  },
  {
    id: 'zodiac-capricorn',
    nameVi: 'Ma Kết',
    nameEn: 'Capricorn',
    symbol: '♑',
    element: 'earth',
    dateRange: '22/12 – 19/01',
    theme: 'Kiên định',
    shortDescription: 'Ngọn núi ánh sáng lặng lẽ vượt qua mùa đông để đón bình minh chung.',
    mythLore:
      'Hình tam giác thanh thoát của Ma Kết tựa cánh buồm kiên cường trên biển đêm, dành cho những lời hẹn bền bỉ bất chấp thời gian.',
    colorHex: '#b8f2d0',
    accentHex: '#ffe3a8',
    skyAzimuthDeg: -46,
    skyAltitudeDeg: 61,
    angularScaleDeg: 10.0,
    stars: [
      { u: -0.86, v: 0.44, brightness: 1.5 },
      { u: -0.22, v: 0.16, brightness: 1.3 },
      { u: 0.44, v: 0.28, brightness: 1.35 },
      { u: 0.88, v: 0.52, brightness: 1.65 },
      { u: 0.36, v: -0.42, brightness: 1.4 },
      { u: -0.26, v: -0.72, brightness: 1.35 },
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 0],
    ],
  },
  {
    id: 'zodiac-aquarius',
    nameVi: 'Bảo Bình',
    nameEn: 'Aquarius',
    symbol: '♒',
    element: 'air',
    dateRange: '20/01 – 18/02',
    theme: 'Tự do',
    shortDescription: 'Dòng ánh sáng phóng khoáng tuôn chảy như cơn gió đêm mát lành trên mặt hồ.',
    mythLore:
      'Người rót ánh sao Bảo Bình mang bầu trời đầy những ước mơ tự do, nơi hai tâm hồn có thể là chính mình mà vẫn thuộc về nhau.',
    colorHex: '#8ce6ff',
    accentHex: '#a5b4fc',
    skyAzimuthDeg: 2,
    skyAltitudeDeg: 66,
    angularScaleDeg: 11.2,
    stars: [
      { u: -0.82, v: 0.48, brightness: 1.55 },
      { u: -0.28, v: 0.64, brightness: 1.45 },
      { u: 0.24, v: 0.28, brightness: 1.5 },
      { u: 0.78, v: 0.56, brightness: 1.35 },
      { u: -0.52, v: -0.18, brightness: 1.3 },
      { u: 0.08, v: -0.34, brightness: 1.4 },
      { u: 0.66, v: -0.68, brightness: 1.35 },
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [0, 4],
      [4, 5],
      [2, 5],
      [5, 6],
    ],
  },
  {
    id: 'zodiac-pisces',
    nameVi: 'Song Ngư',
    nameEn: 'Pisces',
    symbol: '♓',
    element: 'water',
    dateRange: '19/02 – 20/03',
    theme: 'Hai dòng ánh sáng',
    shortDescription: 'Hai dải ngân hà nhỏ uốn lượn gặp nhau tại một nút sáng không bao giờ rời.',
    mythLore:
      'Hai chú cá ánh sáng bơi về hai phía bầu trời nhưng vẫn nối liền bởi sợi chỉ sao Alrescha — biểu tượng cho duyên phận luôn tìm thấy nhau.',
    colorHex: '#d4b8ff',
    accentHex: '#9ee7ff',
    skyAzimuthDeg: 46,
    skyAltitudeDeg: 64,
    angularScaleDeg: 11.5,
    stars: [
      { u: -0.86, v: 0.66, brightness: 1.35 },
      { u: -0.54, v: 0.42, brightness: 1.3 },
      { u: -0.62, v: 0.06, brightness: 1.25 },
      { u: -0.28, v: -0.28, brightness: 1.35 },
      { u: 0.05, v: -0.76, brightness: 1.65 }, // Alrescha knot
      { u: 0.36, v: -0.22, brightness: 1.35 },
      { u: 0.62, v: 0.28, brightness: 1.4 },
      { u: 0.88, v: 0.48, brightness: 1.45 },
      { u: 0.62, v: 0.68, brightness: 1.3 },
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 0],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 6],
      [6, 7],
      [7, 8],
      [8, 6],
    ],
  },
]);

const zodiacMap = new Map<ZodiacId, ZodiacDefinition>(
  ZODIAC_CATALOG.map((z) => [z.id, z])
);

const resolvedGeometryCache = new Map<ZodiacId, ResolvedZodiacGeometry>();

export function getZodiacById(id: ZodiacId): ZodiacDefinition | undefined {
  return zodiacMap.get(id);
}

export function isValidZodiacId(id: string): id is ZodiacId {
  return zodiacMap.has(id as ZodiacId);
}

/**
 * Projects a Zodiac constellation's local 2D star pattern onto the 360-degree sky dome
 * using an orthonormal tangent basis (East, Up-tangent) at its celestial center.
 * Zero distortion, fully decoupled from V1 memory stars.
 */
export function resolveZodiacGeometry(zodiac: ZodiacDefinition): ResolvedZodiacGeometry {
  const cached = resolvedGeometryCache.get(zodiac.id);
  if (cached) {
    return cached;
  }

  const az = (zodiac.skyAzimuthDeg * Math.PI) / 180;
  const alt = (zodiac.skyAltitudeDeg * Math.PI) / 180;
  const cosAlt = Math.cos(alt);
  const sinAlt = Math.sin(alt);
  const sinAz = Math.sin(az);
  const cosAz = Math.cos(az);

  // Unit radial direction toward constellation center (0 deg = North -Z, +90 = East +X)
  const cx = cosAlt * sinAz;
  const cy = sinAlt;
  const cz = -cosAlt * cosAz;

  // Tangent right vector (East-like perpendicular to radial & world-up)
  const rx = cosAz;
  const ry = 0;
  const rz = sinAz;

  // Tangent up vector = radial x right (Wait: verify right-handed: right x radial? Let's compute directly: d/d(alt)!)
  // Exact derivative wrt altitude: (-sinAlt*sinAz, cosAlt, +sinAlt*cosAz)
  const ux = -sinAlt * sinAz;
  const uy = cosAlt;
  const uz = sinAlt * cosAz;

  const spanRad = (zodiac.angularScaleDeg * Math.PI) / 180;
  const tangentExtent = Math.tan(spanRad);

  const [ex, ey, ez] = OBSERVER_EYE_POSITION;
  const centerWorld: StarPosition = Object.freeze([
    ex + cx * ZODIAC_DOME_RADIUS,
    ey + cy * ZODIAC_DOME_RADIUS,
    ez + cz * ZODIAC_DOME_RADIUS,
  ]);

  const starWorldPositions: StarPosition[] = zodiac.stars.map((node) => {
    const dx = cx + (rx * node.u + ux * node.v) * tangentExtent;
    const dy = cy + (ry * node.u + uy * node.v) * tangentExtent;
    const dz = cz + (rz * node.u + uz * node.v) * tangentExtent;
    const invLen = 1 / (Math.hypot(dx, dy, dz) || 1);

    return Object.freeze([
      ex + dx * invLen * ZODIAC_DOME_RADIUS,
      ey + dy * invLen * ZODIAC_DOME_RADIUS,
      ez + dz * invLen * ZODIAC_DOME_RADIUS,
    ]);
  });

  const resolved: ResolvedZodiacGeometry = Object.freeze({
    centerWorld,
    starWorldPositions: Object.freeze(starWorldPositions),
  });

  resolvedGeometryCache.set(zodiac.id, resolved);
  return resolved;
}
