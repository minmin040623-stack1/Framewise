const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const scorer = require("../js/composition-score.js");

const projectRoot = path.resolve(__dirname, "..");
const photos = JSON.parse(
    fs.readFileSync(path.join(projectRoot, "assets", "data", "photos.json"), "utf8")
);
assert.equal(photos.length, 13);

photos.forEach((photo) => {
    assert.ok(
        fs.existsSync(path.join(projectRoot, "assets", "images", photo.image)),
        `Missing image asset: ${photo.image}`
    );
});

const imageSizes = {
    1: { width: 3024, height: 2005 },
    2: { width: 1024, height: 744 },
    3: { width: 4000, height: 3000 },
    4: { width: 4000, height: 3000 },
    5: { width: 4000, height: 2252 },
    6: { width: 3000, height: 4000 },
    7: { width: 4000, height: 2252 },
    8: { width: 530, height: 800 },
    9: { width: 800, height: 600 },
    10: { width: 530, height: 800 },
    11: { width: 800, height: 600 },
    12: { width: 1024, height: 680 },
    13: { width: 1024, height: 768 }
};

function evaluateReference(photoId, referenceIndex = 0) {
    const photo = photos.find((item) => item.id === photoId);
    const reference = photo.referenceCrops[referenceIndex];
    const size = imageSizes[photoId];

    return scorer.evaluateComposition(
        photo,
        {
            x: reference.x * size.width,
            y: reference.y * size.height,
            width: reference.width * size.width,
            height: reference.height * size.height
        },
        size.width,
        size.height
    );
}

function evaluateFullImage(photoId) {
    const photo = photos.find((item) => item.id === photoId);
    const size = imageSizes[photoId];

    return scorer.evaluateComposition(
        photo,
        { x: 0, y: 0, width: size.width, height: size.height },
        size.width,
        size.height
    );
}

assert.deepEqual(
    scorer.normalizeCrop(
        { x: 100, y: 50, width: 400, height: 300 },
        1000,
        500
    ),
    { x: 0.1, y: 0.1, width: 0.4, height: 0.6 }
);

assert.equal(
    scorer.rectIoU(
        { x: 0.1, y: 0.1, width: 0.5, height: 0.5 },
        { x: 0.1, y: 0.1, width: 0.5, height: 0.5 }
    ),
    1
);

const allPhotoIds = photos.map((photo) => photo.id);
const supportedTargets = new Set([
    "rule-of-thirds",
    "centered",
    "look-room",
    "horizon-position",
    "crop-area-range",
    "subject-prominence",
    "layer-proportions",
    "frame-preservation",
    "curve-preservation",
    "leading-line"
]);
const supportedCoachOverlays = new Set([
    "rule-of-thirds",
    "centered",
    "symmetry",
    "look-room",
    "layers",
    "curve",
    "leading-line"
]);

allPhotoIds.forEach((photoId) => {
    const result = evaluateReference(photoId);

    assert.equal(result.version, "composition-v2");
    assert.ok(result.score >= 90, `sample${photoId} reference score was ${result.score}`);
    assert.ok(result.breakdown.length >= 2);
    assert.ok(result.feedback.length >= 2);
});

allPhotoIds.forEach((photoId) => {
    const recommended = evaluateReference(photoId);
    const fullImage = evaluateFullImage(photoId);

    assert.ok(
        recommended.score > fullImage.score,
        `sample${photoId} should reward the recommended crop over the full image`
    );
});

photos.forEach((photo) => {
    assert.ok(photo.targetCompositions.length > 0, `sample${photo.id} has no target composition`);
    assert.ok(photo.coachOverlay, `sample${photo.id} has no coach overlay`);
    assert.ok(
        supportedCoachOverlays.has(photo.coachOverlay.type),
        `Unsupported coach overlay: ${photo.coachOverlay.type}`
    );
    assert.ok(photo.coachOverlay.label, `sample${photo.id} coach overlay has no label`);
    assert.ok(photo.coachOverlay.guideText, `sample${photo.id} coach overlay has no explanation`);

    if (photo.coachOverlay.type === "rule-of-thirds") {
        assert.ok(
            ["top-left", "top-right", "bottom-left", "bottom-right"]
                .includes(photo.coachOverlay.targetAnchor),
            `sample${photo.id} has an invalid thirds anchor`
        );
    }

    if (photo.coachOverlay.type === "look-room") {
        const subject = (photo.annotations.subjects || [])
            .find((item) => item.id === photo.coachOverlay.subjectId);
        assert.ok(subject?.bbox, `sample${photo.id} look-room subject has no bounding box`);
        assert.ok(subject?.lookDirection, `sample${photo.id} look-room subject has no direction`);
    }

    if (photo.coachOverlay.type === "layers") {
        assert.ok(
            (photo.annotations.layers || []).length >= 3,
            `sample${photo.id} needs at least three annotated layers`
        );
    }

    if (photo.coachOverlay.type === "curve") {
        assert.ok(
            (photo.annotations.curves || [])
                .some((item) => item.id === photo.coachOverlay.pathId),
            `sample${photo.id} coach curve was not found`
        );
    }

    if (photo.coachOverlay.type === "leading-line") {
        assert.ok(
            (photo.annotations.lines || [])
                .some((item) => item.id === photo.coachOverlay.pathId),
            `sample${photo.id} coach line was not found`
        );
    }

    photo.targetCompositions.forEach((target) => {
        assert.ok(supportedTargets.has(target.type), `Unsupported target type: ${target.type}`);
    });

    const activeWeight = Object.values(photo.evaluation.weights)
        .filter((weight) => weight > 0)
        .reduce((sum, weight) => sum + weight, 0);
    assert.equal(activeWeight, 100, `sample${photo.id} weights sum to ${activeWeight}`);

    photo.referenceCrops.forEach((reference, referenceIndex) => {
        assert.ok(reference.x >= 0 && reference.y >= 0);
        assert.ok(reference.width > 0 && reference.height > 0);
        assert.ok(reference.x + reference.width <= 1.000001);
        assert.ok(reference.y + reference.height <= 1.000001);

        const result = evaluateReference(photo.id, referenceIndex);
        assert.ok(
            result.score >= 85,
            `sample${photo.id} coach example ${referenceIndex + 1} scored ${result.score}`
        );
    });
});

const curveResult = evaluateReference(11);
const leadingLineResult = evaluateReference(12);

assert.ok(curveResult.criteria.some((criterion) => criterion.id === "curve-preservation"));
assert.ok(leadingLineResult.criteria.some((criterion) => criterion.id === "leading-line"));

console.log("composition-score tests passed");
