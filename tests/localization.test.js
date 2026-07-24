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
    assert.ok(
        !/(습니다|됩니다)/.test(photo.coachOverlay.guideText),
        `Sample ${photo.id} guide explanation should use the conversational coaching tone.`
    );
    photo.referenceCrops.forEach((reference, index) => {
        assert.ok(
            /[가-힣]/.test(reference.reason),
            `Sample ${photo.id} coach reason ${index + 1} is not Korean.`
        );
        assert.ok(
            !/(습니다|됩니다)/.test(reference.reason),
            `Sample ${photo.id} coach reason ${index + 1} should use the conversational coaching tone.`
        );
    });
});

const home = fs.readFileSync(path.join(root, "index.html"), "utf8");
const game = fs.readFileSync(path.join(root, "game.html"), "utf8");
const result = fs.readFileSync(path.join(root, "result.html"), "utf8");

assert.ok(home.includes("사진을 보는 눈"), "The home headline should read naturally in Korean.");
assert.ok(
    /구도를 연습하거나,\s*<br>\s*필름 색감을 비교해 보세요/.test(home),
    "The tool heading should break after the introductory phrase."
);
assert.ok(
    /외운 규칙보다,\s*<br>\s*다시 써먹을 수 있는 감각\./.test(home),
    "The learning heading should break at a natural Korean phrase boundary."
);
assert.ok(
    !game.includes("사진을 움직이고 파란 테두리를 조절해 원하는 장면만 남겨 보세요."),
    "The crop panel should stay visually concise without a redundant instruction."
);
assert.ok(
    result.includes("내 구도는 어떨까요?"),
    "The result headline should be concise and natural in Korean."
);

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
