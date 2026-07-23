(function (root, factory) {
    const api = factory();

    if (typeof module === "object" && module.exports) {
        module.exports = api;
    }

    root.FrameWiseImageAnalysis = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
    "use strict";

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

    /*
     * This is a transparent rule set, not a generative model or a machine
     * learning prediction. Reasons mention only values measured above.
     */
    function recommendPreset(metrics) {
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

    return {
        analyzeImageData,
        recommendPreset
    };
});
