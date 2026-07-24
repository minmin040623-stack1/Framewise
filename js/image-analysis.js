(function (root, factory) {
    const api = factory();

    if (typeof module === "object" && module.exports) {
        module.exports = api;
    }

    root.FrameWiseImageAnalysis = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
    "use strict";

    const tasteProfiles = Object.freeze([
        {
            id: "auto",
            label: "사진에 맞춰 추천",
            description: "밝기와 색 분포를 보고 자동으로 골라요."
        },
        {
            id: "warm-soft",
            label: "따뜻하고 부드럽게",
            description: "피부와 일상 장면을 편안한 온기로 보여 줘요."
        },
        {
            id: "fresh-clean",
            label: "맑고 자연스럽게",
            description: "원래 색을 크게 해치지 않고 밝고 깨끗하게 정리해요."
        },
        {
            id: "vivid",
            label: "선명하고 생생하게",
            description: "풍경과 사물의 빨강·녹색·파랑을 또렷하게 살려요."
        },
        {
            id: "cinematic",
            label: "영화처럼 깊게",
            description: "차가운 그림자와 따뜻한 빛의 대비를 강조해요."
        },
        {
            id: "muted",
            label: "차분한 빈티지",
            description: "채도와 밝기를 낮춰 오래된 사진처럼 담담하게 만들어요."
        },
        {
            id: "monochrome",
            label: "흑백으로 집중",
            description: "색보다 빛, 표정과 질감에 시선이 가게 해요."
        }
    ]);
    const tasteProfileIds = new Set(tasteProfiles.map((profile) => profile.id));

    const MAX_SAMPLES = 50000;

    function clamp(value, min = 0, max = 1) {
        return Math.min(Math.max(value, min), max);
    }

    function roundMetric(value) {
        return Math.round(clamp(value) * 10000) / 10000;
    }

    function emptyMetrics() {
        return {
            brightness: 0,
            dark: 0,
            highlight: 0,
            saturation: 0,
            warmth: 0.5,
            greenCyan: 0,
            contrast: 0,
            texture: 0
        };
    }

    function analyzeImageData(imageData) {
        const data = imageData?.data;
        const width = Math.floor(Number(imageData?.width));
        const height = Math.floor(Number(imageData?.height));

        if (
            !data
            || !Number.isFinite(width)
            || !Number.isFinite(height)
            || width <= 0
            || height <= 0
            || data.length < width * height * 4
        ) {
            return emptyMetrics();
        }

        const pixelCount = width * height;
        const stride = Math.max(1, Math.ceil(Math.sqrt(pixelCount / MAX_SAMPLES)));
        const previousRow = new Map();
        let validSamples = 0;
        let luminanceSum = 0;
        let luminanceSquareSum = 0;
        let saturationSum = 0;
        let warmthSum = 0;
        let greenCyanSum = 0;
        let darkCount = 0;
        let highlightCount = 0;
        let textureSum = 0;
        let textureComparisons = 0;

        for (let y = 0; y < height; y += stride) {
            let leftLuminance = null;

            for (let x = 0; x < width; x += stride) {
                const offset = (y * width + x) * 4;
                const alpha = data[offset + 3] / 255;

                if (alpha <= 0.01) {
                    leftLuminance = null;
                    previousRow.delete(x);
                    continue;
                }

                const red = data[offset] / 255;
                const green = data[offset + 1] / 255;
                const blue = data[offset + 2] / 255;
                const maximum = Math.max(red, green, blue);
                const minimum = Math.min(red, green, blue);
                const saturation = maximum > 0
                    ? (maximum - minimum) / maximum
                    : 0;
                const luminance = 0.2126 * red + 0.7152 * green + 0.0722 * blue;
                const warmth = clamp(0.5 + (red - blue) * 0.5);
                const greenCyan = clamp(
                    Math.max(0, green - red) * 1.25
                    + Math.max(0, blue - red) * 0.45
                    + Math.max(0, green - blue) * 0.20
                );

                validSamples += 1;
                luminanceSum += luminance;
                luminanceSquareSum += luminance * luminance;
                saturationSum += saturation;
                warmthSum += warmth;
                greenCyanSum += greenCyan;

                if (luminance < 0.28) {
                    darkCount += 1;
                }

                if (luminance > 0.78) {
                    highlightCount += 1;
                }

                if (leftLuminance !== null) {
                    textureSum += Math.abs(luminance - leftLuminance);
                    textureComparisons += 1;
                }

                if (previousRow.has(x)) {
                    textureSum += Math.abs(luminance - previousRow.get(x));
                    textureComparisons += 1;
                }

                leftLuminance = luminance;
                previousRow.set(x, luminance);
            }
        }

        if (validSamples === 0) {
            return emptyMetrics();
        }

        const brightness = luminanceSum / validSamples;
        const variance = Math.max(
            0,
            luminanceSquareSum / validSamples - brightness * brightness
        );
        const contrast = Math.sqrt(variance) * 2.5;
        const texture = textureComparisons > 0
            ? (textureSum / textureComparisons) * 2
            : 0;

        return {
            brightness: roundMetric(brightness),
            dark: roundMetric(darkCount / validSamples),
            highlight: roundMetric(highlightCount / validSamples),
            saturation: roundMetric(saturationSum / validSamples),
            warmth: roundMetric(warmthSum / validSamples),
            greenCyan: roundMetric(greenCyanSum / validSamples),
            contrast: roundMetric(contrast),
            texture: roundMetric(texture)
        };
    }

    function metric(metrics, key, fallback = 0) {
        const value = Number(metrics?.[key]);
        return Number.isFinite(value) ? clamp(value) : fallback;
    }

    function percent(value) {
        return Math.round(clamp(value) * 100);
    }

    function normalizeTasteId(value) {
        const id = String(value || "auto");
        return tasteProfileIds.has(id) ? id : "auto";
    }

    function getTasteProfile(value) {
        const id = normalizeTasteId(value);
        return tasteProfiles.find((profile) => profile.id === id) || tasteProfiles[0];
    }

    /*
     * This is a transparent rule set, not a generative model or a machine
     * learning prediction. Reasons mention only values measured above.
     */
    function recommendAutomatic(metrics) {
        const brightness = metric(metrics, "brightness");
        const dark = metric(metrics, "dark");
        const highlight = metric(metrics, "highlight");
        const saturation = metric(metrics, "saturation");
        const warmth = metric(metrics, "warmth", 0.5);
        const greenCyan = metric(metrics, "greenCyan");
        const contrast = metric(metrics, "contrast");
        const texture = metric(metrics, "texture");

        if (saturation <= 0.14 && texture >= 0.30 && contrast >= 0.32) {
            return {
                presetId: "bw-400-inspired",
                reason: `채도가 ${percent(saturation)}%로 낮고 명암 대비 ${percent(contrast)}%, 질감 변화 ${percent(texture)}%가 보여 B&W 400 Inspired를 추천해요.`
            };
        }

        if (dark >= 0.46 && highlight >= 0.035) {
            return {
                presetId: "cinestill-400d-inspired",
                reason: `어두운 영역이 ${percent(dark)}%이고 밝은 하이라이트가 ${percent(highlight)}% 함께 보여 CineStill 400D Inspired를 추천해요.`
            };
        }

        if (brightness >= 0.50 && greenCyan >= 0.16) {
            return {
                presetId: "fuji-c200-inspired",
                reason: `평균 밝기가 ${percent(brightness)}%이고 녹색·청록 성분이 ${percent(greenCyan)}% 보여 Fuji C200 Inspired를 추천해요.`
            };
        }

        if (warmth >= 0.57 && saturation >= 0.16) {
            return {
                presetId: "portra-400-inspired",
                reason: `따뜻한 색 지수가 ${percent(warmth)}%이고 평균 채도가 ${percent(saturation)}%라 Portra 400 Inspired를 추천해요.`
            };
        }

        if (saturation <= 0.18 && (contrast >= 0.38 || texture >= 0.22)) {
            return {
                presetId: "bw-400-inspired",
                reason: `평균 채도가 ${percent(saturation)}%로 낮고 대비가 ${percent(contrast)}%, 질감 변화가 ${percent(texture)}%라 B&W 400 Inspired를 추천해요.`
            };
        }

        if (greenCyan >= 0.11 || brightness >= 0.64) {
            return {
                presetId: "fuji-c200-inspired",
                reason: `평균 밝기가 ${percent(brightness)}%이고 녹색·청록 성분이 ${percent(greenCyan)}% 보여 Fuji C200 Inspired를 추천해요.`
            };
        }

        return {
            presetId: "portra-400-inspired",
            reason: `따뜻한 색 지수가 ${percent(warmth)}%, 평균 채도가 ${percent(saturation)}%로 측정되어 부드러운 Portra 400 Inspired를 추천해요.`
        };
    }

    function recommendForTaste(metrics, tasteId) {
        const brightness = metric(metrics, "brightness");
        const dark = metric(metrics, "dark");
        const highlight = metric(metrics, "highlight");
        const saturation = metric(metrics, "saturation");
        const warmth = metric(metrics, "warmth", 0.5);
        const contrast = metric(metrics, "contrast");
        const texture = metric(metrics, "texture");

        if (tasteId === "warm-soft") {
            const presetId = warmth >= 0.55 || saturation >= 0.26
                ? "golden-day-inspired"
                : "portra-400-inspired";
            return {
                presetId,
                intensity: 0.74,
                reason: `‘따뜻하고 부드럽게’를 골랐어요. 사진의 따뜻한 색 지수는 ${percent(warmth)}%, 채도는 ${percent(saturation)}%라 온기를 더하되 하이라이트는 부드럽게 남기는 스타일을 추천해요.`
            };
        }

        if (tasteId === "fresh-clean") {
            return {
                presetId: "fuji-c200-inspired",
                intensity: 0.68,
                reason: `‘맑고 자연스럽게’를 골랐어요. 현재 밝기 ${percent(brightness)}%, 채도 ${percent(saturation)}%를 크게 바꾸지 않고 녹색과 하늘을 깨끗하게 정리하는 스타일을 추천해요.`
            };
        }

        if (tasteId === "vivid") {
            return {
                presetId: "vivid-landscape-inspired",
                intensity: saturation >= 0.34 ? 0.66 : 0.78,
                reason: `‘선명하고 생생하게’를 골랐어요. 원본 채도가 ${percent(saturation)}%라 색이 이미 강하면 효과를 줄이고, 부족하면 빨강과 녹색을 더 살리도록 추천 강도를 조절해요.`
            };
        }

        if (tasteId === "cinematic") {
            const nightLike = dark >= 0.30 || highlight >= 0.035;
            return {
                presetId: nightLike
                    ? "tungsten-night-inspired"
                    : "cinestill-400d-inspired",
                intensity: nightLike ? 0.76 : 0.72,
                reason: `‘영화처럼 깊게’를 골랐어요. 어두운 영역 ${percent(dark)}%, 밝은 광원 ${percent(highlight)}%를 기준으로 그림자와 하이라이트의 색을 나눠 보여 주는 스타일을 추천해요.`
            };
        }

        if (tasteId === "muted") {
            return {
                presetId: "reto-aqua400-inspired",
                intensity: 0.62,
                reason: `‘차분한 빈티지’를 골랐어요. 원본 채도 ${percent(saturation)}%, 대비 ${percent(contrast)}%에서 색을 과하게 누르지 않도록 낮은 효과 강도로 시작해요.`
            };
        }

        const fineGrain = texture < 0.30 || contrast < 0.34;
        return {
            presetId: fineGrain
                ? "fine-grain-mono-inspired"
                : "bw-400-inspired",
            intensity: 0.82,
            reason: `‘흑백으로 집중’을 골랐어요. 질감 변화 ${percent(texture)}%, 대비 ${percent(contrast)}%를 보고 ${fineGrain ? "고운 입자와 넓은 중간 계조" : "굵은 입자와 또렷한 중간 대비"}가 어울리는 흑백을 추천해요.`
        };
    }

    function recommendPreset(metrics, tasteId = "auto") {
        const normalizedTasteId = normalizeTasteId(tasteId);
        const recommendation = normalizedTasteId === "auto"
            ? recommendAutomatic(metrics)
            : recommendForTaste(metrics, normalizedTasteId);

        return {
            ...recommendation,
            tasteId: normalizedTasteId,
            preferenceSource: normalizedTasteId === "auto" ? "photo" : "explicit",
            intensity: Number.isFinite(recommendation.intensity)
                ? recommendation.intensity
                : 0.76
        };
    }

    return {
        tasteProfiles,
        analyzeImageData,
        recommendPreset,
        normalizeTasteId,
        getTasteProfile
    };
});
