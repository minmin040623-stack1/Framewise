(function (root, factory) {
    const api = factory();

    if (typeof module === "object" && module.exports) {
        module.exports = api;
    }

    root.FrameWisePhotoSelection = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
    function toPhotoId(value) {
        const parsed = Number(value);
        return Number.isInteger(parsed) ? parsed : null;
    }

    function choosePhoto(photos, options = {}) {
        if (!Array.isArray(photos) || photos.length === 0) {
            return null;
        }

        const requestedId = toPhotoId(options.requestedId);
        const requestedPhoto = requestedId === null
            ? null
            : photos.find((photo) => photo.id === requestedId);

        if (requestedPhoto) {
            return requestedPhoto;
        }

        const lastPhotoId = toPhotoId(options.lastPhotoId);
        const candidates = photos.length > 1 && lastPhotoId !== null
            ? photos.filter((photo) => photo.id !== lastPhotoId)
            : photos;
        const random = typeof options.random === "function"
            ? options.random
            : Math.random;
        const randomValue = Math.min(Math.max(random(), 0), 0.999999999);
        const randomIndex = Math.floor(randomValue * candidates.length);

        return candidates[randomIndex];
    }

    return {
        choosePhoto,
        toPhotoId
    };
});
