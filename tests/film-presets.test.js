const assert = require("node:assert/strict");
const {
    presets,
    categories,
    getPreset,
    resolveParameters
} = require("../js/film-presets.js");

const expectedIds = [
    "portra-400-inspired",
    "fuji-c200-inspired",
    "cinestill-400d-inspired",
    "lomography-cn100-inspired",
    "harman-phoenix200-inspired",
    "lomochrome-purple-inspired",
    "reto-aqua400-inspired",
    "bw-400-inspired"
];
const expectedCategories = new Set([
    "Portrait",
    "Everyday",
    "Vivid",
    "Cinematic",
    "Black & White"
]);
const allowedConfidence = new Set(["low", "low-medium", "medium", "high"]);

assert.deepEqual(presets.map((preset) => preset.id), expectedIds);
assert.equal(new Set(presets.map((preset) => preset.id)).size, presets.length);
assert.deepEqual(new Set(categories), expectedCategories);
assert.ok(Object.isFrozen(presets));

presets.forEach((preset) => {
    assert.match(preset.name, /Inspired$/);
    assert.ok(expectedCategories.has(preset.category));
    assert.ok(preset.description);
    assert.ok(preset.recommendedFor);
    assert.equal(typeof preset.videoReference.featured, "boolean");
    assert.ok(Array.isArray(preset.videoReference.timestamps));
    assert.ok(Array.isArray(preset.videoReference.observations));
    assert.ok(preset.videoReference.observations.length > 0);
    assert.ok(allowedConfidence.has(preset.videoReference.confidence));

    assert.equal(preset.parameters.colorMatrix.length, 9);
    assert.equal(preset.parameters.channelOffset.length, 3);
    assert.equal(preset.parameters.shadowTint.color.length, 3);
    assert.equal(preset.parameters.highlightTint.color.length, 3);
    assert.equal(preset.halation.color.length, 3);

    [
        ...preset.parameters.colorMatrix,
        ...preset.parameters.channelOffset,
        preset.parameters.exposure,
        preset.parameters.contrast,
        preset.parameters.saturation,
        preset.parameters.temperature,
        preset.parameters.tint,
        preset.parameters.toneCurve.gamma,
        preset.parameters.toneCurve.toe,
        preset.parameters.toneCurve.shoulder,
        preset.parameters.toneCurve.blackPoint,
        preset.parameters.shadowTint.amount,
        preset.parameters.highlightTint.amount,
        preset.parameters.selectiveSaturation.red,
        preset.parameters.selectiveSaturation.green,
        preset.parameters.selectiveSaturation.blue,
        preset.grain.default,
        preset.grain.size,
        preset.vignette.default,
        preset.bloom.default,
        preset.halation.default,
        ...preset.halation.color
    ].forEach((value) => assert.ok(Number.isFinite(value)));

    assert.ok(preset.grain.default >= 0 && preset.grain.default <= 1);
    assert.ok(preset.vignette.default >= 0 && preset.vignette.default <= 1);
    assert.ok(preset.bloom.default >= 0 && preset.bloom.default <= 1);
    assert.ok(preset.halation.default >= 0 && preset.halation.default <= 1);
    assert.equal(typeof preset.parameters.monochrome, "boolean");
    assert.equal(typeof preset.recommendationEligible, "boolean");
    assert.ok(Object.isFrozen(preset));
});

assert.deepEqual(
    presets.filter((preset) => preset.recommendationEligible).map((preset) => preset.id),
    [
        "portra-400-inspired",
        "fuji-c200-inspired",
        "cinestill-400d-inspired",
        "bw-400-inspired"
    ]
);
assert.ok(getPreset("cinestill-400d-inspired").halation.default > 0);
assert.equal(getPreset("bw-400-inspired").parameters.monochrome, true);
assert.ok(
    getPreset("reto-aqua400-inspired").grain.default
        > getPreset("portra-400-inspired").grain.default
);
assert.equal(getPreset("missing-preset"), null);

const beforeResolve = JSON.stringify(presets);
const neutral = resolveParameters("portra-400-inspired", 0, 0.73);

assert.deepEqual(neutral.colorMatrix, [
    1, 0, 0,
    0, 1, 0,
    0, 0, 1
]);
assert.deepEqual(neutral.channelOffset, [0, 0, 0]);
assert.equal(neutral.exposure, 0);
assert.equal(neutral.contrast, 1);
assert.equal(neutral.saturation, 1);
assert.equal(neutral.temperature, 0);
assert.equal(neutral.tint, 0);
assert.deepEqual(neutral.toneCurve, {
    gamma: 1,
    toe: 0,
    shoulder: 0,
    blackPoint: 0
});
assert.equal(neutral.shadowTint.amount, 0);
assert.equal(neutral.highlightTint.amount, 0);
assert.equal(neutral.monochrome, 0);
assert.equal(neutral.grain.amount, 0.73, "Grain must remain independent of look intensity");
assert.equal(neutral.vignette.amount, 0);
assert.equal(neutral.bloom.amount, 0);
assert.equal(neutral.halation.amount, 0);

const portra = getPreset("portra-400-inspired");
const full = resolveParameters(portra, 1);

assert.deepEqual(full.colorMatrix, portra.parameters.colorMatrix);
assert.deepEqual(full.channelOffset, portra.parameters.channelOffset);
assert.equal(full.contrast, portra.parameters.contrast);
assert.equal(full.grain.amount, portra.grain.default);
assert.equal(full.vignette.amount, portra.vignette.default);
assert.equal(full.bloom.amount, portra.bloom.default);
assert.equal(full.halation.amount, portra.halation.default);

const monochromeHalf = resolveParameters("bw-400-inspired", 0.5, -1);
assert.equal(monochromeHalf.monochrome, 0.5);
assert.equal(monochromeHalf.saturation, 0.5);
assert.equal(monochromeHalf.grain.amount, 0);
assert.equal(resolveParameters("fuji-c200-inspired", 9, 2).intensity, 1);
assert.equal(resolveParameters("fuji-c200-inspired", 9, 2).grain.amount, 1);
assert.equal(resolveParameters("does-not-exist"), null);
assert.equal(JSON.stringify(presets), beforeResolve, "Resolving parameters mutated preset data");

console.log("film preset tests passed");
