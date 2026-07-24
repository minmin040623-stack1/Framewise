(function (root, factory) {
    const api = factory();

    if (typeof module === "object" && module.exports) {
        module.exports = api;
    }

    root.FrameWiseFilmPresets = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
    "use strict";

    const categories = Object.freeze([
        "Portrait",
        "Everyday",
        "Vivid",
        "Cinematic",
        "Black & White"
    ]);

    const IDENTITY_MATRIX = Object.freeze([
        1, 0, 0,
        0, 1, 0,
        0, 0, 1
    ]);

    function deepFreeze(value) {
        if (!value || typeof value !== "object" || Object.isFrozen(value)) {
            return value;
        }

        Object.values(value).forEach(deepFreeze);
        return Object.freeze(value);
    }

    /*
     * These are original FrameWise looks designed from broad visual traits and
     * side-by-side observations. They are not manufacturer profiles or copied
     * LUTs. The "Inspired" suffix is intentionally part of every display name.
     */
    const presets = deepFreeze([
        {
            id: "portra-400-inspired",
            name: "Portra 400 Inspired",
            category: "Portrait",
            description: "자연스러운 복숭아빛 피부와 부드러운 대비, 차분한 올리브색을 살린 따뜻한 톤",
            recommendedFor: "인물, 가족 사진, 부드러운 자연광",
            videoReference: {
                featured: true,
                timestamps: ["1:43–2:30", "6:24"],
                observations: [
                    "비교 기준에서 피부가 자연스러운 복숭아빛으로 보임",
                    "대비와 하이라이트가 비교적 부드러움",
                    "녹색이 차분한 올리브색에 가까움",
                    "입자와 세부 하이라이트 표현은 영상만으로 확인하기 어려움"
                ],
                confidence: "medium"
            },
            parameters: {
                colorMatrix: [
                    1.035, -0.010, -0.005,
                    0.010, 0.995, -0.005,
                    0.005, 0.015, 0.970
                ],
                channelOffset: [0.008, 0.002, -0.004],
                exposure: 0.045,
                contrast: 0.91,
                saturation: 0.92,
                temperature: 0.075,
                tint: 0.018,
                toneCurve: {
                    gamma: 0.98,
                    toe: 0.045,
                    shoulder: 0.18,
                    blackPoint: 0.008
                },
                shadowTint: {
                    color: [0.20, 0.29, 0.26],
                    amount: 0.025
                },
                highlightTint: {
                    color: [1.00, 0.73, 0.57],
                    amount: 0.065
                },
                selectiveSaturation: {
                    red: 1.04,
                    green: 0.91,
                    blue: 0.96
                },
                monochrome: false
            },
            grain: { default: 0.18, size: 0.85 },
            vignette: { default: 0.10 },
            bloom: { default: 0.065 },
            halation: { default: 0.01, color: [1.00, 0.28, 0.10] },
            recommendationEligible: true
        },
        {
            id: "fuji-c200-inspired",
            name: "Fuji C200 Inspired",
            category: "Everyday",
            description: "맑은 밝기와 또렷한 녹색·청록, 중립에 가까운 시원한 하이라이트를 더한 일상 톤",
            recommendedFor: "풍경, 여행, 밝은 낮의 일상 사진",
            videoReference: {
                featured: true,
                timestamps: ["1:43–2:30", "6:45"],
                observations: [
                    "피부가 비교 기준보다 조금 더 노랑과 분홍을 띰",
                    "하늘과 흰색은 중립에서 살짝 차갑게 보임",
                    "녹색과 청록이 비교적 선명함",
                    "전반적으로 밝고 또렷하며 입자는 영상에서 확인하기 어려움"
                ],
                confidence: "medium"
            },
            parameters: {
                colorMatrix: [
                    0.985, 0.000, 0.010,
                    -0.010, 1.035, 0.015,
                    -0.005, 0.010, 1.045
                ],
                channelOffset: [-0.006, 0.003, 0.010],
                exposure: 0.07,
                contrast: 1.025,
                saturation: 1.08,
                temperature: -0.055,
                tint: -0.018,
                toneCurve: {
                    gamma: 0.965,
                    toe: 0.025,
                    shoulder: 0.105,
                    blackPoint: 0.004
                },
                shadowTint: {
                    color: [0.14, 0.42, 0.46],
                    amount: 0.045
                },
                highlightTint: {
                    color: [0.82, 0.94, 1.00],
                    amount: 0.035
                },
                selectiveSaturation: {
                    red: 1.00,
                    green: 1.13,
                    blue: 1.08
                },
                monochrome: false
            },
            grain: { default: 0.16, size: 0.78 },
            vignette: { default: 0.075 },
            bloom: { default: 0.04 },
            halation: { default: 0.005, color: [1.00, 0.24, 0.08] },
            recommendationEligible: true
        },
        {
            id: "cinestill-400d-inspired",
            name: "CineStill 400D Inspired",
            category: "Cinematic",
            description: "밝고 따뜻한 복숭아빛 하이라이트와 미세하게 시원한 그림자, 붉은 빛 번짐을 조합한 영화적 톤",
            recommendedFor: "도시, 야간 조명, 역광, 영화적인 인물 사진",
            videoReference: {
                featured: true,
                timestamps: ["2:31–3:08", "7:14"],
                observations: [
                    "피부와 흰옷의 하이라이트가 따뜻한 노랑·복숭아·분홍으로 보임",
                    "비교 기준보다 밝고 대비와 채도가 조금 더 강함",
                    "그림자에는 미세하게 시원한 기운이 남음",
                    "할레이션과 입자 크기는 비교 영상만으로 뚜렷하게 확인하기 어려움"
                ],
                confidence: "medium"
            },
            parameters: {
                colorMatrix: [
                    1.045, 0.005, -0.010,
                    -0.005, 1.010, 0.000,
                    -0.010, 0.010, 1.015
                ],
                channelOffset: [0.008, 0.000, -0.004],
                exposure: 0.075,
                contrast: 1.085,
                saturation: 1.055,
                temperature: 0.035,
                tint: 0.025,
                toneCurve: {
                    gamma: 0.96,
                    toe: 0.045,
                    shoulder: 0.12,
                    blackPoint: 0.012
                },
                shadowTint: {
                    color: [0.10, 0.30, 0.44],
                    amount: 0.075
                },
                highlightTint: {
                    color: [1.00, 0.47, 0.25],
                    amount: 0.105
                },
                selectiveSaturation: {
                    red: 1.12,
                    green: 1.02,
                    blue: 1.035
                },
                monochrome: false
            },
            grain: { default: 0.24, size: 0.92 },
            vignette: { default: 0.14 },
            bloom: { default: 0.13 },
            halation: { default: 0.32, color: [1.00, 0.13, 0.035] },
            recommendationEligible: true
        },
        {
            id: "lomography-cn100-inspired",
            name: "Lomography CN100 Inspired",
            category: "Vivid",
            description: "노랑·녹색과 석양의 주황을 선명하게 살리고 피부에는 분홍 기운을 더한 생동감 있는 톤",
            recommendedFor: "여행, 축제, 석양, 색이 풍부한 스냅",
            videoReference: {
                featured: true,
                timestamps: ["3:09–3:46", "7:37"],
                observations: [
                    "노랑과 녹색, 석양의 주황이 선명하게 보임",
                    "대비가 분명하고 피부에는 분홍·자홍 기운이 더해짐",
                    "입자와 하이라이트 롤오프는 영상만으로 확인하기 어려움"
                ],
                confidence: "medium"
            },
            parameters: {
                colorMatrix: [
                    1.055, 0.015, -0.015,
                    0.000, 1.045, -0.005,
                    0.010, -0.010, 0.985
                ],
                channelOffset: [0.010, 0.004, -0.006],
                exposure: 0.025,
                contrast: 1.12,
                saturation: 1.16,
                temperature: 0.07,
                tint: 0.045,
                toneCurve: {
                    gamma: 0.97,
                    toe: 0.055,
                    shoulder: 0.095,
                    blackPoint: 0.015
                },
                shadowTint: {
                    color: [0.28, 0.23, 0.12],
                    amount: 0.035
                },
                highlightTint: {
                    color: [1.00, 0.56, 0.18],
                    amount: 0.085
                },
                selectiveSaturation: {
                    red: 1.15,
                    green: 1.12,
                    blue: 0.98
                },
                monochrome: false
            },
            grain: { default: 0.23, size: 0.90 },
            vignette: { default: 0.12 },
            bloom: { default: 0.075 },
            halation: { default: 0.035, color: [1.00, 0.24, 0.06] },
            recommendationEligible: false
        },
        {
            id: "harman-phoenix200-inspired",
            name: "Harman Phoenix 200 Inspired",
            category: "Cinematic",
            description: "깊은 검정과 강한 대비 위에 주황·황금빛 녹색과 따뜻한 분홍 피부를 얹은 거친 톤",
            recommendedFor: "강한 햇빛, 공연, 빈티지한 거리와 실험적인 인물 사진",
            videoReference: {
                featured: true,
                timestamps: ["3:47–4:23", "8:05"],
                observations: [
                    "검정이 깊고 대비가 강해 일부 장면은 살짝 노출 부족처럼 보임",
                    "잔디와 녹색이 주황·황금빛으로 이동함",
                    "피부는 따뜻한 분홍과 붉은 기운을 띠고 하이라이트도 따뜻함",
                    "영상에서 색과 대비는 분명하지만 입자 세부는 제한적으로 보임"
                ],
                confidence: "high"
            },
            parameters: {
                colorMatrix: [
                    1.095, 0.020, -0.030,
                    0.015, 0.985, -0.015,
                    0.010, -0.025, 0.955
                ],
                channelOffset: [0.012, -0.004, -0.012],
                exposure: -0.075,
                contrast: 1.24,
                saturation: 1.20,
                temperature: 0.105,
                tint: 0.055,
                toneCurve: {
                    gamma: 1.055,
                    toe: 0.115,
                    shoulder: 0.07,
                    blackPoint: 0.04
                },
                shadowTint: {
                    color: [0.30, 0.17, 0.10],
                    amount: 0.055
                },
                highlightTint: {
                    color: [1.00, 0.43, 0.16],
                    amount: 0.13
                },
                selectiveSaturation: {
                    red: 1.20,
                    green: 0.95,
                    blue: 0.88
                },
                monochrome: false
            },
            grain: { default: 0.44, size: 1.22 },
            vignette: { default: 0.18 },
            bloom: { default: 0.085 },
            halation: { default: 0.14, color: [1.00, 0.17, 0.045] },
            recommendationEligible: false
        },
        {
            id: "lomochrome-purple-inspired",
            name: "LomoChrome Purple Inspired",
            category: "Vivid",
            description: "녹색을 자홍·보라로, 파랑을 청록·녹색으로 틀어 초현실적인 색 대비를 만드는 실험적 톤",
            recommendedFor: "초록이 많은 풍경, 패션, 실험적인 색 표현",
            videoReference: {
                featured: true,
                timestamps: ["4:24–4:57", "8:29"],
                observations: [
                    "녹색이 자홍과 보라로 크게 이동함",
                    "피부와 데님도 초현실적인 녹색 계열로 달라짐",
                    "색 이동과 강한 대비가 분명함",
                    "입자와 하이라이트 롤오프는 영상만으로 확인하기 어려움"
                ],
                confidence: "high"
            },
            parameters: {
                colorMatrix: [
                    0.65, 0.55, -0.10,
                    0.05, 0.18, 0.50,
                    0.15, 0.62, 0.60
                ],
                channelOffset: [0.025, -0.008, 0.020],
                exposure: -0.01,
                contrast: 1.19,
                saturation: 1.30,
                temperature: -0.015,
                tint: 0.18,
                toneCurve: {
                    gamma: 1.015,
                    toe: 0.075,
                    shoulder: 0.08,
                    blackPoint: 0.024
                },
                shadowTint: {
                    color: [0.18, 0.42, 0.36],
                    amount: 0.08
                },
                highlightTint: {
                    color: [0.78, 0.34, 0.92],
                    amount: 0.09
                },
                selectiveSaturation: {
                    red: 1.10,
                    green: 1.34,
                    blue: 1.16
                },
                monochrome: false
            },
            grain: { default: 0.30, size: 1.02 },
            vignette: { default: 0.16 },
            bloom: { default: 0.065 },
            halation: { default: 0.025, color: [0.95, 0.18, 0.52] },
            recommendationEligible: false
        },
        {
            id: "reto-aqua400-inspired",
            name: "RETO Aqua 400 Inspired",
            category: "Everyday",
            description: "짙은 청록과 회녹색, 낮은 채도와 어두운 톤, 굵은 입자를 조합한 차분한 수중빛 톤",
            recommendedFor: "흐린 날, 바다, 고요한 거리, 차분한 분위기의 스냅",
            videoReference: {
                featured: true,
                timestamps: ["4:58–5:35", "8:48"],
                observations: [
                    "강한 청록과 회녹색 기운이 나타남",
                    "채도가 낮고 전체 톤이 비교적 어두움",
                    "피부도 차갑고 차분하게 표현됨",
                    "비교 화면에서 굵은 입자가 분명하게 보임"
                ],
                confidence: "high"
            },
            parameters: {
                colorMatrix: [
                    0.80, 0.075, 0.035,
                    -0.025, 0.93, 0.085,
                    -0.035, 0.12, 1.035
                ],
                channelOffset: [-0.028, 0.006, 0.028],
                exposure: -0.115,
                contrast: 0.91,
                saturation: 0.72,
                temperature: -0.15,
                tint: -0.075,
                toneCurve: {
                    gamma: 1.075,
                    toe: 0.105,
                    shoulder: 0.16,
                    blackPoint: 0.022
                },
                shadowTint: {
                    color: [0.06, 0.43, 0.48],
                    amount: 0.15
                },
                highlightTint: {
                    color: [0.60, 0.76, 0.70],
                    amount: 0.075
                },
                selectiveSaturation: {
                    red: 0.80,
                    green: 0.94,
                    blue: 1.06
                },
                monochrome: false
            },
            grain: { default: 0.56, size: 1.48 },
            vignette: { default: 0.17 },
            bloom: { default: 0.035 },
            halation: { default: 0.008, color: [1.00, 0.20, 0.06] },
            recommendationEligible: false
        },
        {
            id: "golden-day-inspired",
            name: "Golden Day Inspired",
            category: "Everyday",
            description: "따뜻한 노랑과 주황, 산뜻한 채도와 부드러운 밝기를 더한 편안한 일상 톤",
            recommendedFor: "가족 사진, 여행, 맑은 오후, 일상의 따뜻한 순간",
            videoReference: {
                featured: false,
                timestamps: [],
                observations: ["사용자 제공 비교 영상이 아닌 Kodak GOLD 200 공식 특성에서 방향을 참고함"],
                confidence: "medium"
            },
            researchReference: {
                inspirations: ["KODAK GOLD 200"],
                observations: [
                    "공식 자료의 일상 사진 용도, 선명한 채도, 고운 입자와 넓은 노출 관용도",
                    "FrameWise에서는 따뜻한 일상색과 부드러운 하이라이트로 재해석"
                ]
            },
            parameters: {
                colorMatrix: [
                    1.045, 0.012, -0.012,
                    0.008, 1.015, -0.006,
                    0.002, 0.014, 0.965
                ],
                channelOffset: [0.010, 0.004, -0.006],
                exposure: 0.045,
                contrast: 1.025,
                saturation: 1.08,
                temperature: 0.105,
                tint: 0.012,
                toneCurve: {
                    gamma: 0.985,
                    toe: 0.035,
                    shoulder: 0.15,
                    blackPoint: 0.009
                },
                shadowTint: {
                    color: [0.34, 0.27, 0.18],
                    amount: 0.028
                },
                highlightTint: {
                    color: [1.00, 0.76, 0.46],
                    amount: 0.075
                },
                selectiveSaturation: {
                    red: 1.10,
                    green: 1.02,
                    blue: 0.92
                },
                monochrome: false
            },
            grain: { default: 0.22, size: 0.90 },
            vignette: { default: 0.09 },
            bloom: { default: 0.055 },
            halation: { default: 0.012, color: [1.00, 0.30, 0.08] },
            recommendationEligible: true
        },
        {
            id: "vivid-landscape-inspired",
            name: "Vivid Landscape Inspired",
            category: "Vivid",
            description: "빨강과 녹색을 또렷하게 올리고 미세한 입자와 깊은 대비로 풍경을 강조한 선명한 톤",
            recommendedFor: "풍경, 꽃, 단풍, 바다, 색이 중요한 여행 사진",
            videoReference: {
                featured: false,
                timestamps: [],
                observations: ["사용자 제공 비교 영상이 아닌 EKTAR 100과 Velvia 공식 특성에서 방향을 참고함"],
                confidence: "medium"
            },
            researchReference: {
                inspirations: ["KODAK EKTAR 100", "FUJICHROME Velvia 100"],
                observations: [
                    "EKTAR의 높은 채도·선명도·미세 입자",
                    "Velvia의 매우 높은 채도와 빨강·녹색 강조",
                    "두 공식 방향을 결합한 FrameWise의 독자적인 풍경용 색감"
                ]
            },
            parameters: {
                colorMatrix: [
                    1.070, -0.012, -0.008,
                    -0.006, 1.070, -0.010,
                    -0.004, -0.006, 1.035
                ],
                channelOffset: [0.002, 0.002, -0.002],
                exposure: 0.005,
                contrast: 1.14,
                saturation: 1.24,
                temperature: 0.015,
                tint: 0.008,
                toneCurve: {
                    gamma: 1.01,
                    toe: 0.065,
                    shoulder: 0.095,
                    blackPoint: 0.018
                },
                shadowTint: {
                    color: [0.10, 0.18, 0.22],
                    amount: 0.025
                },
                highlightTint: {
                    color: [1.00, 0.91, 0.78],
                    amount: 0.025
                },
                selectiveSaturation: {
                    red: 1.20,
                    green: 1.22,
                    blue: 1.08
                },
                monochrome: false
            },
            grain: { default: 0.12, size: 0.72 },
            vignette: { default: 0.11 },
            bloom: { default: 0.025 },
            halation: { default: 0.006, color: [1.00, 0.22, 0.05] },
            recommendationEligible: true
        },
        {
            id: "tungsten-night-inspired",
            name: "Tungsten Night Inspired",
            category: "Cinematic",
            description: "차가운 밤 그림자와 따뜻한 조명, 붉은 빛 번짐을 대비시킨 저조도 영화 톤",
            recommendedFor: "야간 거리, 네온사인, 실내 조명, 공연과 도시 사진",
            videoReference: {
                featured: false,
                timestamps: [],
                observations: ["사용자 제공 비교 영상이 아닌 CineStill 800T 공식 저조도·텅스텐 특성에서 방향을 참고함"],
                confidence: "medium"
            },
            researchReference: {
                inspirations: ["CineStill 800T"],
                observations: [
                    "공식 자료의 텅스텐 균형, 저조도 용도와 약한 할레이션",
                    "상표 제품을 복제하지 않고 차가운 그림자와 따뜻한 광원 분리로 재해석"
                ]
            },
            parameters: {
                colorMatrix: [
                    0.970, 0.006, 0.020,
                    -0.006, 1.000, 0.018,
                    -0.016, 0.010, 1.085
                ],
                channelOffset: [-0.012, -0.002, 0.020],
                exposure: 0.025,
                contrast: 1.12,
                saturation: 1.04,
                temperature: -0.13,
                tint: 0.020,
                toneCurve: {
                    gamma: 1.025,
                    toe: 0.080,
                    shoulder: 0.13,
                    blackPoint: 0.020
                },
                shadowTint: {
                    color: [0.08, 0.20, 0.42],
                    amount: 0.13
                },
                highlightTint: {
                    color: [1.00, 0.50, 0.24],
                    amount: 0.10
                },
                selectiveSaturation: {
                    red: 1.12,
                    green: 0.94,
                    blue: 1.14
                },
                monochrome: false
            },
            grain: { default: 0.34, size: 1.08 },
            vignette: { default: 0.18 },
            bloom: { default: 0.11 },
            halation: { default: 0.30, color: [1.00, 0.16, 0.035] },
            recommendationEligible: true
        },
        {
            id: "fine-grain-mono-inspired",
            name: "Fine Grain Mono Inspired",
            category: "Black & White",
            description: "섬세한 입자와 넓은 중간 계조로 피부와 질감을 차분하게 보여 주는 깨끗한 흑백 톤",
            recommendedFor: "인물, 정물, 건축, 고운 명암과 세부 묘사가 중요한 사진",
            videoReference: {
                featured: false,
                timestamps: [],
                observations: ["사용자 제공 비교 영상에 없는 고운 입자 흑백 방향"],
                confidence: "low-medium"
            },
            researchReference: {
                inspirations: ["ILFORD DELTA 400 PROFESSIONAL"],
                observations: [
                    "공식 비교 자료의 현대적인 미세 입자와 선명한 흑백 방향",
                    "기존 B&W 400 Inspired보다 입자를 줄이고 중간 계조를 넓게 설계"
                ]
            },
            parameters: {
                colorMatrix: [
                    1, 0, 0,
                    0, 1, 0,
                    0, 0, 1
                ],
                channelOffset: [0, 0, 0],
                exposure: 0.015,
                contrast: 1.07,
                saturation: 0,
                temperature: 0,
                tint: 0,
                toneCurve: {
                    gamma: 0.995,
                    toe: 0.040,
                    shoulder: 0.14,
                    blackPoint: 0.010
                },
                shadowTint: {
                    color: [0.14, 0.16, 0.19],
                    amount: 0.012
                },
                highlightTint: {
                    color: [0.94, 0.92, 0.87],
                    amount: 0.015
                },
                selectiveSaturation: {
                    red: 1,
                    green: 1,
                    blue: 1
                },
                monochrome: true
            },
            grain: { default: 0.20, size: 0.76 },
            vignette: { default: 0.10 },
            bloom: { default: 0.025 },
            halation: { default: 0, color: [1.00, 0.20, 0.06] },
            recommendationEligible: true
        },
        {
            id: "bw-400-inspired",
            name: "B&W 400 Inspired",
            category: "Black & White",
            description: "색을 덜어 내고 선명한 중간 대비와 비교적 굵은 입자로 형태와 질감을 강조한 흑백 톤",
            recommendedFor: "인물, 거리, 건축, 질감과 빛이 중요한 사진",
            videoReference: {
                featured: false,
                timestamps: [],
                observations: ["비교 영상에 등장하지 않아 영상만으로 관찰할 수 없음"],
                confidence: "low"
            },
            parameters: {
                colorMatrix: [
                    1, 0, 0,
                    0, 1, 0,
                    0, 0, 1
                ],
                channelOffset: [0, 0, 0],
                exposure: 0.005,
                contrast: 1.15,
                saturation: 0,
                temperature: 0,
                tint: 0,
                toneCurve: {
                    gamma: 1.015,
                    toe: 0.075,
                    shoulder: 0.10,
                    blackPoint: 0.018
                },
                shadowTint: {
                    color: [0.12, 0.14, 0.16],
                    amount: 0.018
                },
                highlightTint: {
                    color: [0.92, 0.90, 0.84],
                    amount: 0.02
                },
                selectiveSaturation: {
                    red: 1,
                    green: 1,
                    blue: 1
                },
                monochrome: true
            },
            grain: { default: 0.48, size: 1.34 },
            vignette: { default: 0.16 },
            bloom: { default: 0.035 },
            halation: { default: 0, color: [1.00, 0.20, 0.06] },
            recommendationEligible: true
        }
    ]);

    const presetsById = new Map(presets.map((preset) => [preset.id, preset]));

    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    function toFiniteNumber(value, fallback) {
        const number = Number(value);
        return Number.isFinite(number) ? number : fallback;
    }

    function lerp(from, to, amount) {
        return from + (to - from) * amount;
    }

    function lerpArray(from, to, amount) {
        return to.map((value, index) => lerp(from[index], value, amount));
    }

    function scaleFromZero(value, amount) {
        return amount === 0 ? 0 : value * amount;
    }

    function getPreset(id) {
        return presetsById.get(String(id || "")) || null;
    }

    /*
     * `intensity` controls the colour/tone look. Grain is deliberately a
     * separate argument, so reducing the look does not silently change the
     * user's grain slider. The returned object contains renderer-ready values.
     */
    function resolveParameters(presetOrId, intensity = 1, grainIntensity) {
        const preset = typeof presetOrId === "string"
            ? getPreset(presetOrId)
            : presetOrId;

        if (!preset || !preset.parameters) {
            return null;
        }

        const amount = clamp(toFiniteNumber(intensity, 1), 0, 1);
        const grainAmount = clamp(
            toFiniteNumber(grainIntensity, preset.grain.default),
            0,
            1
        );
        const target = preset.parameters;

        return {
            id: preset.id,
            intensity: amount,
            colorMatrix: lerpArray(IDENTITY_MATRIX, target.colorMatrix, amount),
            channelOffset: target.channelOffset.map((value) => scaleFromZero(value, amount)),
            exposure: scaleFromZero(target.exposure, amount),
            contrast: lerp(1, target.contrast, amount),
            saturation: lerp(1, target.saturation, amount),
            temperature: scaleFromZero(target.temperature, amount),
            tint: scaleFromZero(target.tint, amount),
            toneCurve: {
                gamma: lerp(1, target.toneCurve.gamma, amount),
                toe: scaleFromZero(target.toneCurve.toe, amount),
                shoulder: scaleFromZero(target.toneCurve.shoulder, amount),
                blackPoint: scaleFromZero(target.toneCurve.blackPoint, amount)
            },
            shadowTint: {
                color: target.shadowTint.color.slice(),
                amount: scaleFromZero(target.shadowTint.amount, amount)
            },
            highlightTint: {
                color: target.highlightTint.color.slice(),
                amount: scaleFromZero(target.highlightTint.amount, amount)
            },
            selectiveSaturation: {
                red: lerp(1, target.selectiveSaturation.red, amount),
                green: lerp(1, target.selectiveSaturation.green, amount),
                blue: lerp(1, target.selectiveSaturation.blue, amount)
            },
            monochrome: target.monochrome ? amount : 0,
            grain: {
                amount: grainAmount,
                size: preset.grain.size
            },
            vignette: {
                amount: scaleFromZero(preset.vignette.default, amount)
            },
            bloom: {
                amount: scaleFromZero(preset.bloom.default, amount)
            },
            halation: {
                amount: scaleFromZero(preset.halation.default, amount),
                color: preset.halation.color.slice()
            }
        };
    }

    return {
        presets,
        categories,
        getPreset,
        resolveParameters
    };
});
