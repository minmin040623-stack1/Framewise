const assert = require("node:assert/strict");
const {
    analyzeImageData,
    recommendPreset
} = require("../js/image-analysis.js");

function solidImage(width, height, rgba) {
    const data = new Uint8ClampedArray(width * height * 4);

    for (let index = 0; index < width * height; index += 1) {
        data.set(rgba, index * 4);
    }

    return { data, width, height };
}

function imageFromPixels(width, height, pixels) {
    return {
        data: new Uint8ClampedArray(pixels.flat()),
        width,
        height
    };
}

function assertMetricsInRange(metrics) {
    [
        "brightness",
        "dark",
        "highlight",
        "saturation",
        "warmth",
        "greenCyan",
        "contrast",
        "texture"
    ].forEach((key) => {
        assert.ok(Number.isFinite(metrics[key]), `${key} should be finite`);
        assert.ok(metrics[key] >= 0 && metrics[key] <= 1, `${key} should be normalized`);
    });
}

const warmMetrics = analyzeImageData(solidImage(4, 4, [205, 145, 112, 255]));
const greenMetrics = analyzeImageData(solidImage(4, 4, [50, 205, 175, 255]));
const darkLightPixels = Array.from(
    { length: 16 },
    (_, index) => index === 15 ? [255, 238, 205, 255] : [12, 18, 24, 255]
);
const nightMetrics = analyzeImageData(imageFromPixels(4, 4, darkLightPixels));
const checkerPixels = [];

for (let y = 0; y < 4; y += 1) {
    for (let x = 0; x < 4; x += 1) {
        const level = (x + y) % 2 === 0 ? 18 : 238;
        checkerPixels.push([level, level, level, 255]);
    }
}

const textureMetrics = analyzeImageData(imageFromPixels(4, 4, checkerPixels));

[warmMetrics, greenMetrics, nightMetrics, textureMetrics].forEach(assertMetricsInRange);
assert.ok(warmMetrics.warmth > 0.57);
assert.ok(greenMetrics.greenCyan > 0.16);
assert.ok(nightMetrics.dark > 0.85);
assert.ok(nightMetrics.highlight > 0.03);
assert.ok(textureMetrics.texture > 0.30);
assert.ok(textureMetrics.contrast > 0.32);
assert.equal(
    recommendPreset(warmMetrics).presetId,
    "portra-400-inspired"
);
assert.equal(
    recommendPreset(greenMetrics).presetId,
    "fuji-c200-inspired"
);
assert.equal(
    recommendPreset(nightMetrics).presetId,
    "cinestill-400d-inspired"
);
assert.equal(
    recommendPreset(textureMetrics).presetId,
    "bw-400-inspired"
);

const transparentIgnored = analyzeImageData(imageFromPixels(2, 1, [
    [255, 0, 0, 0],
    [128, 128, 128, 255]
]));
assert.ok(Math.abs(transparentIgnored.brightness - 0.502) < 0.01);
assert.equal(transparentIgnored.saturation, 0);
assert.equal(transparentIgnored.warmth, 0.5);

assert.deepEqual(
    analyzeImageData({ data: new Uint8ClampedArray(0), width: 0, height: 0 }),
    {
        brightness: 0,
        dark: 0,
        highlight: 0,
        saturation: 0,
        warmth: 0.5,
        greenCyan: 0,
        contrast: 0,
        texture: 0
    }
);
assert.deepEqual(
    analyzeImageData(solidImage(2, 2, [255, 0, 0, 0])),
    {
        brightness: 0,
        dark: 0,
        highlight: 0,
        saturation: 0,
        warmth: 0.5,
        greenCyan: 0,
        contrast: 0,
        texture: 0
    }
);

const recommendations = [
    recommendPreset(warmMetrics),
    recommendPreset(greenMetrics),
    recommendPreset(nightMetrics),
    recommendPreset(textureMetrics)
];

recommendations.forEach((recommendation) => {
    assert.ok(recommendation.reason.includes("Inspired"));
    assert.doesNotMatch(
        recommendation.reason,
        /생성형\s*AI|머신러닝|인공지능/,
        "A rule-based recommendation must not claim to use a model"
    );
    assert.match(recommendation.reason, /\d+%/);
});

assert.deepEqual(
    recommendPreset(nightMetrics),
    recommendPreset(nightMetrics),
    "Recommendations should be deterministic"
);

console.log("image analysis tests passed");
