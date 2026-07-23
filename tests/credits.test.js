const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const photos = JSON.parse(
    fs.readFileSync(path.join(root, "assets/data/photos.json"), "utf8")
);
const credits = fs.readFileSync(path.join(root, "credits.html"), "utf8");

const originalPhotos = photos.filter((photo) => photo.rightsType === "original");
const creativeCommonsPhotos = photos.filter(
    (photo) => photo.rightsType === "creative-commons"
);

assert.strictEqual(photos.length, 13, "All game photos should have a rights record.");
assert.strictEqual(originalPhotos.length, 6, "Six confirmed original photos should be recorded.");
assert.strictEqual(
    creativeCommonsPhotos.length,
    7,
    "Seven Creative Commons photos should be recorded."
);

photos.forEach((photo) => {
    assert.ok(photo.rightsType, `Sample ${photo.id} is missing rightsType.`);

    if (photo.rightsType === "original") {
        assert.ok(photo.creator, `Sample ${photo.id} is missing its creator label.`);
        assert.ok(photo.rightsNote, `Sample ${photo.id} is missing its usage note.`);
        return;
    }

    assert.ok(photo.sourceUrl, `Sample ${photo.id} is missing its source URL.`);
    assert.ok(photo.licenseUrl, `Sample ${photo.id} is missing its license URL.`);
    assert.ok(photo.modifications, `Sample ${photo.id} is missing a modification notice.`);
    assert.ok(
        credits.includes(photo.sourceUrl),
        `Sample ${photo.id} source is missing from credits.html.`
    );
});

["index.html", "game.html", "result.html"].forEach((file) => {
    const html = fs.readFileSync(path.join(root, file), "utf8");
    assert.ok(html.includes('href="credits.html"'), `${file} should link to image credits.`);
});

assert.ok(
    credits.includes("sample2-outpaint-v1.png"),
    "The experimental outpainting asset should be credited."
);
assert.ok(
    credits.includes("외부에서 가져온 사진의 저작권은 각 사진의 원저작자에게 있습니다"),
    "The program notice should distinguish third-party photo rights."
);

console.log("All image credit tests passed.");
