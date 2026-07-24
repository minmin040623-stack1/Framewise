const assert = require("node:assert/strict");
const rendererApi = require("../js/film-renderer.js");
const presetApi = require("../js/film-presets.js");

const preview = rendererApi.fitDimensions(4000, 3000, {
    maxLongEdge: 1400,
    maxPixels: 16_000_000,
    maxTextureSize: 8192
});

assert.deepEqual(
    { width: preview.width, height: preview.height },
    { width: 1400, height: 1050 }
);
assert.equal(preview.resized, true);

const pixelLimited = rendererApi.fitDimensions(8000, 6000, {
    maxLongEdge: Infinity,
    maxPixels: 16_000_000,
    maxTextureSize: 8192
});

assert.ok(pixelLimited.width * pixelLimited.height <= 16_000_000);
assert.ok(
    Math.abs(pixelLimited.width / pixelLimited.height - 4 / 3) < 0.001,
    "Pixel limiting should preserve the source aspect ratio."
);

const textureLimited = rendererApi.fitDimensions(6000, 3000, {
    maxLongEdge: Infinity,
    maxPixels: Infinity,
    maxTextureSize: 4096
});

assert.deepEqual(
    { width: textureLimited.width, height: textureLimited.height },
    { width: 4096, height: 2048 }
);

assert.throws(
    () => rendererApi.fitDimensions(0, 100),
    /dimensions/
);

const fileMetadata = {
    name: "framewise-photo.jpg",
    size: 1234567,
    type: "image/jpeg",
    lastModified: 1712345678000
};
const originalRandom = Math.random;

Math.random = () => {
    throw new Error("seedFromFile must not use Math.random.");
};

try {
    const firstSeed = rendererApi.seedFromFile(fileMetadata);
    const secondSeed = rendererApi.seedFromFile({ ...fileMetadata });
    const changedSeed = rendererApi.seedFromFile({
        ...fileMetadata,
        name: "another-photo.jpg"
    });

    assert.equal(firstSeed, secondSeed);
    assert.notEqual(firstSeed, changedSeed);
    assert.ok(Number.isInteger(firstSeed));
    assert.ok(firstSeed >= 0 && firstSeed <= 0xffffffff);
} finally {
    Math.random = originalRandom;
}

const styledPreset = {
    parameters: {
        colorMatrix: [
            1.05, 0, 0,
            0, 0.98, 0,
            0, 0, 0.92
        ],
        channelOffset: [0.01, 0, -0.01],
        exposure: 0.2,
        contrast: 1.12,
        saturation: 0.9,
        temperature: 0.08,
        tint: -0.02,
        selectiveSaturation: {
            red: 0.1,
            green: -0.05,
            cyan: 0.08
        },
        toneCurve: {
            gamma: 0.95,
            toe: 0.12,
            shoulder: 0.18,
            blackPoint: 0.01
        },
        shadowTint: {
            color: [0.4, 0.48, 0.6],
            amount: 0.08
        },
        highlightTint: {
            color: [0.65, 0.56, 0.45],
            amount: 0.1
        }
    },
    grain: { default: 0.3, size: 1.8 },
    vignette: { default: 0.15 },
    bloom: { default: 0.12, radius: 3, threshold: 0.7 },
    halation: {
        default: 0.25,
        radius: 5,
        threshold: 0.74,
        tint: [1, 0.2, 0.04]
    }
};
const neutral = rendererApi.resolveParameters(styledPreset, {
    intensity: 0,
    grain: 0
});

assert.deepEqual(neutral.colorMatrix, [
    1, 0, 0,
    0, 1, 0,
    0, 0, 1
]);
assert.deepEqual(neutral.channelOffset, [0, 0, 0]);
assert.equal(neutral.exposure, 0);
assert.equal(neutral.contrast, 1);
assert.equal(neutral.saturation, 1);
assert.equal(neutral.gamma, 1);
assert.equal(neutral.toe, 0);
assert.equal(neutral.shoulder, 0);
assert.equal(neutral.monochrome, 0);
assert.equal(neutral.grainAmount, 0);
assert.equal(neutral.vignette, 0);
assert.equal(neutral.bloom, 0);
assert.equal(neutral.halation, 0);

const fullStyle = rendererApi.resolveParameters(styledPreset, {
    intensity: 100,
    grain: 50
});

assert.equal(fullStyle.contrast, 1.12);
assert.equal(fullStyle.saturation, 0.9);
assert.equal(fullStyle.grainAmount, 0.06);
assert.equal(fullStyle.glowRadius, 5);
assert.deepEqual(fullStyle.halationTint, [1, 0.2, 0.04]);

const multiplierSelective = rendererApi.resolveParameters({
    selectiveSaturation: {
        red: 1.04,
        green: 0.91,
        blue: 1.08
    }
});

assert.ok(
    Math.abs(multiplierSelective.selectiveSaturation[0] - 0.04) < 0.000001
);
assert.ok(
    Math.abs(multiplierSelective.selectiveSaturation[1] + 0.09) < 0.000001
);
assert.ok(
    Math.abs(multiplierSelective.selectiveSaturation[2] - 0.08) < 0.000001
);

function makeCanvas() {
    const context = {
        clearRect() {}
    };

    return {
        width: 1,
        height: 1,
        getContext(type) {
            return type === "2d" ? context : null;
        }
    };
}

const fallback = rendererApi.createRenderer({
    canvas: makeCanvas(),
    canvasFactory: makeCanvas,
    forceCanvas2D: true
});

assert.equal(fallback.mode, "canvas2d");
[
    "setSource",
    "renderTo",
    "renderBatch",
    "exportBlob",
    "clearSource",
    "dispose"
].forEach((method) => {
    assert.equal(typeof fallback[method], "function", `${method} is missing.`);
});

fallback.setSource({ width: 4, height: 3 }, {
    seed: 123
});
assert.equal(fallback.sourceWidth, 4);
assert.equal(fallback.sourceHeight, 3);
fallback.clearSource();
assert.equal(fallback.source, null);
fallback.dispose();
assert.equal(fallback.disposed, true);

assert.equal(rendererApi.constants.PREVIEW_MAX_LONG_EDGE, 1400);
assert.equal(rendererApi.constants.THUMBNAIL_MAX_LONG_EDGE, 360);
assert.equal(rendererApi.constants.EXPORT_MAX_PIXELS, 16_000_000);

presetApi.presets.forEach((preset) => {
    const resolved = rendererApi.resolveParameters(
        presetApi.resolveParameters(preset, 0.76, preset.grain.default),
        { intensity: 1, grain: preset.grain.default }
    );

    [
        ...resolved.colorMatrix,
        ...resolved.channelOffset,
        resolved.exposure,
        resolved.contrast,
        resolved.saturation,
        resolved.temperature,
        resolved.tint,
        resolved.grainAmount,
        resolved.grainSize,
        resolved.vignette,
        resolved.bloom,
        resolved.halation
    ].forEach((value) => {
        assert.ok(Number.isFinite(value), `${preset.id} produced a non-finite render value.`);
    });
});

console.log("Film renderer tests passed.");
