const assert = require("node:assert/strict");
const selector = require("../js/photo-selection.js");

const photos = [
    { id: 1, image: "one.jpg" },
    { id: 2, image: "two.jpg" },
    { id: 3, image: "three.jpg" }
];

assert.equal(
    selector.choosePhoto(photos, {
        lastPhotoId: 1,
        random: () => 0
    }).id,
    2
);

assert.notEqual(
    selector.choosePhoto(photos, {
        lastPhotoId: 2,
        random: () => 0.999
    }).id,
    2
);

assert.equal(
    selector.choosePhoto(photos, {
        requestedId: 2,
        lastPhotoId: 2,
        random: () => 0
    }).id,
    2,
    "An explicit retry is allowed to reopen the same photo"
);

assert.equal(
    selector.choosePhoto([{ id: 7 }], {
        lastPhotoId: 7,
        random: () => 0
    }).id,
    7
);

assert.equal(selector.choosePhoto([], { lastPhotoId: 1 }), null);
assert.equal(selector.toPhotoId("3"), 3);
assert.equal(selector.toPhotoId("not-a-number"), null);

console.log("photo-selection tests passed");
