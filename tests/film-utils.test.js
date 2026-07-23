const assert = require("node:assert/strict");
const film = require("../js/film.js");

function fakeFile(name, type, size = 1024) {
    return { name, type, size };
}

[
    fakeFile("portrait.JPG", "image/jpeg"),
    fakeFile("portrait.jpeg", "image/jpeg"),
    fakeFile("graphic.PNG", "image/png"),
    fakeFile("photo.WebP", "image/webp")
].forEach((file) => {
    assert.equal(
        film.validateFile(file).valid,
        true,
        `${file.name} should be supported`
    );
});

assert.equal(
    film.validateFile(fakeFile("animation.gif", "image/gif")).code,
    "unsupported-extension"
);
assert.equal(
    film.validateFile(fakeFile("vector.svg", "image/svg+xml")).code,
    "unsupported-extension"
);
assert.equal(
    film.validateFile(fakeFile("fake.jpg", "image/png")).code,
    "type-mismatch"
);
assert.equal(
    film.validateFile(fakeFile("empty.jpg", "image/jpeg", 0)).code,
    "empty-file"
);
assert.equal(
    film.validateFile(
        fakeFile("huge.jpg", "image/jpeg", film.MAX_FILE_BYTES + 1)
    ).code,
    "file-too-large"
);

assert.deepEqual(
    film.fitWithin(4000, 2000, { maxLongEdge: 1600 }),
    { width: 1600, height: 800, scale: 0.4 }
);
assert.deepEqual(
    film.fitWithin(800, 600, { maxLongEdge: 1600 }),
    { width: 800, height: 600, scale: 1 }
);

const pixelLimited = film.fitWithin(6000, 4000, {
    maxLongEdge: 6000,
    maxPixels: 6_000_000
});
assert.ok(pixelLimited.width * pixelLimited.height <= 6_010_000);
assert.ok(Math.abs(pixelLimited.width / pixelLimited.height - 1.5) < 0.01);

assert.equal(
    film.buildDownloadFilename(
        "My Photo.JPG",
        "portra-400-inspired",
        "jpg"
    ),
    "framewise-my-photo-portra-400-inspired.jpg"
);
assert.equal(
    film.buildDownloadFilename(
        "서울 야경.png",
        "cinestill-400d-inspired",
        "png"
    ),
    "framewise-서울-야경-cinestill-400d-inspired.png"
);
assert.equal(
    film.buildDownloadFilename("", "", "webp"),
    "framewise-photo-film-inspired.jpg"
);

let queuedCallback = null;
let cancelledFrame = null;
let callbackCount = 0;
let lastValue = null;
const scheduler = film.createRenderScheduler((value) => {
    callbackCount += 1;
    lastValue = value;
}, {
    requestFrame(callback) {
        queuedCallback = callback;
        return 17;
    },
    cancelFrame(frameId) {
        cancelledFrame = frameId;
    }
});

scheduler.schedule(1);
scheduler.schedule(2);
scheduler.schedule(5);
assert.equal(scheduler.pending, true);
queuedCallback();
assert.equal(callbackCount, 1);
assert.equal(lastValue, 5);
assert.equal(scheduler.pending, false);

scheduler.schedule(9);
scheduler.cancel();
assert.equal(cancelledFrame, 17);
assert.equal(scheduler.pending, false);

console.log("film utility tests passed");
