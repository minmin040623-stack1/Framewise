const assert = require("assert");
const fs = require("fs");
const path = require("path");
const scorer = require("../js/composition-score.js");

const root = path.resolve(__dirname, "..");
const htmlFiles = ["index.html", "game.html", "result.html", "credits.html"];
const photos = JSON.parse(
    fs.readFileSync(path.join(root, "assets/data/photos.json"), "utf8")
);

htmlFiles.forEach((file) => {
    const html = fs.readFileSync(path.join(root, file), "utf8");
    assert.ok(
        html.includes('<html lang="ko">'),
        `${file} should declare Korean as its document language.`
    );
    assert.ok(
        html.includes("Noto+Sans+KR"),
        `${file} should load the Korean readability font.`
    );
});

photos.forEach((photo) => {
    assert.ok(/[가-힣]/.test(photo.mission), `Sample ${photo.id} mission is not Korean.`);
    assert.ok(/[가-힣]/.test(photo.tip), `Sample ${photo.id} tip is not Korean.`);
    assert.ok(
        /[가-힣]/.test(photo.coachOverlay.guideText),
        `Sample ${photo.id} guide explanation is not Korean.`
    );
    photo.referenceCrops.forEach((reference, index) => {
        assert.ok(
            /[가-힣]/.test(reference.reason),
            `Sample ${photo.id} coach reason ${index + 1} is not Korean.`
        );
    });
});

const firstPhoto = photos[0];
const firstReference = firstPhoto.referenceCrops[0];
const scoreResult = scorer.evaluateComposition(
    firstPhoto,
    {
        x: firstReference.x * 1000,
        y: firstReference.y * 800,
        width: firstReference.width * 1000,
        height: firstReference.height * 800
    },
    1000,
    800
);

assert.ok(
    scoreResult.breakdown.every((item) => /[가-힣]/.test(item.label)),
    "Score breakdown labels should be Korean."
);
assert.ok(
    scoreResult.feedback.every((item) => /[가-힣]/.test(item.text)),
    "Generated feedback should be Korean."
);

console.log("All Korean localization tests passed.");
