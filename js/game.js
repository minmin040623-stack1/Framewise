const image = document.getElementById("targetImage");
const imageWrapper = document.querySelector(".image-wrapper");
const timer = document.getElementById("timer");
const timerValue = document.getElementById("time");
const timerSuffix = document.getElementById("timerSuffix");
const submitBtn = document.getElementById("submitBtn");
const statusText = document.getElementById("statusText");
const missionText = document.getElementById("missionText");
const tipText = document.getElementById("tipText");
const difficultyText = document.getElementById("difficultyText");
const criteriaList = document.getElementById("criteriaList");
const modeBadge = document.getElementById("modeBadge");
const modeSwitch = document.getElementById("modeSwitch");
const zoomOutBtn = document.getElementById("zoomOutBtn");
const zoomInBtn = document.getElementById("zoomInBtn");
const resetCropBtn = document.getElementById("resetCropBtn");
const overlay = document.getElementById("loadingOverlay");

const DIFFICULTY_LABELS = {
    1: "Easy",
    2: "Medium",
    3: "Hard"
};

const TIME_BY_DIFFICULTY = {
    1: 45,
    2: 40,
    3: 35
};

const CRITERIA_LABELS = {
    "rule-of-thirds": "Subject placement on the thirds grid",
    centered: "Alignment with the frame center",
    "look-room": "Space in the subject's viewing direction",
    "horizon-position": "Horizon placement",
    "crop-area-range": "How much of the original frame remains",
    "subject-prominence": "Subject size inside the crop",
    "layer-proportions": "Foreground, middle ground, and background proportions",
    "frame-preservation": "Preservation of the natural frame",
    "curve-preservation": "Preservation of the shoreline curve",
    "leading-line": "Preservation of the leading line"
};

const params = new URLSearchParams(window.location.search);
const requestedPhotoId = params.get("photo");
const storedMode = sessionStorage.getItem("framewiseMode");
const gameMode = params.get("mode") === "practice" || (!params.get("mode") && storedMode === "practice")
    ? "practice"
    : "timed";

let currentPhoto = null;
let cropper = null;
let timerInterval = null;
let timeLeft = null;
let hasSubmitted = false;

function setStatus(message, state = "normal") {
    statusText.textContent = message;
    statusText.dataset.state = state;
}

function setControlsEnabled(enabled) {
    submitBtn.disabled = !enabled;
    zoomOutBtn.disabled = !enabled;
    zoomInBtn.disabled = !enabled;
    resetCropBtn.disabled = !enabled;
}

function safeParse(value, fallback) {
    try {
        return value ? JSON.parse(value) : fallback;
    } catch {
        return fallback;
    }
}

function renderCriteria(photo) {
    criteriaList.replaceChildren();

    (photo.targetCompositions || []).forEach((criterion) => {
        const item = document.createElement("li");
        item.textContent = CRITERIA_LABELS[criterion.type] || criterion.label || criterion.type;
        criteriaList.appendChild(item);
    });

    const preservationWeight = photo.evaluation?.weights?.subjectPreservation || 0;

    if (preservationWeight > 0) {
        const item = document.createElement("li");
        item.textContent = "Preservation of the main subject";
        criteriaList.appendChild(item);
    }
}

function configureMode(photo) {
    sessionStorage.setItem("framewiseMode", gameMode);

    if (gameMode === "practice") {
        modeBadge.textContent = "Untimed practice";
        timerValue.textContent = "∞";
        timerSuffix.textContent = "";
        timer.classList.add("practice-timer");
        modeSwitch.textContent = "Switch to timed challenge";
        modeSwitch.href = `game.html?mode=timed&photo=${photo.id}`;
        return;
    }

    modeBadge.textContent = "Timed challenge";
    timerSuffix.textContent = "s";
    modeSwitch.textContent = "Switch to untimed practice";
    modeSwitch.href = `game.html?mode=practice&photo=${photo.id}`;
}

function startTimer(photo) {
    if (gameMode === "practice") {
        return;
    }

    timeLeft = TIME_BY_DIFFICULTY[photo.difficulty] || 40;
    timerValue.textContent = timeLeft;

    timerInterval = window.setInterval(() => {
        timeLeft -= 1;
        timerValue.textContent = timeLeft;

        if (timeLeft <= 10) {
            timer.classList.add("timer-warning");
        }

        if (timeLeft <= 0) {
            window.clearInterval(timerInterval);
            submitCrop();
        }
    }, 1000);
}

function loadImage(photo) {
    return new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = () => reject(new Error("The selected image could not be loaded."));
        image.alt = photo.title
            ? `${photo.title} — crop practice image`
            : `${photo.mission} crop practice image`;
        image.src = `assets/images/${photo.image}`;
    });
}

function fitImageWrapperToPhoto() {
    if (!image.naturalWidth || !image.naturalHeight) {
        return;
    }

    const imageRatio = image.naturalWidth / image.naturalHeight;
    const isMobile = window.innerWidth <= 720;
    const preferredHeight = isMobile
        ? Math.min(520, Math.max(320, window.innerHeight * 0.58))
        : Math.min(650, Math.max(430, window.innerHeight * 0.65));

    imageWrapper.style.setProperty(
        "--image-ratio",
        `${image.naturalWidth} / ${image.naturalHeight}`
    );
    imageWrapper.style.setProperty(
        "--image-max-width",
        `${Math.round(preferredHeight * imageRatio)}px`
    );
}

function initializeCropper(photo) {
    return new Promise((resolve, reject) => {
        if (typeof window.Cropper !== "function") {
            reject(new Error("The crop tool could not be loaded."));
            return;
        }

        cropper = new Cropper(image, {
            viewMode: 1,
            dragMode: "move",
            autoCropArea: 0.58,
            responsive: true,
            movable: true,
            zoomable: true,
            scalable: false,
            rotatable: false,
            cropBoxMovable: true,
            cropBoxResizable: true,
            background: false,
            guides: true,
            center: true,
            ready() {
                setControlsEnabled(true);
                setStatus("Ready to crop", "ready");
                startTimer(photo);
                resolve();
            }
        });
    });
}

async function loadPhoto() {
    try {
        setControlsEnabled(false);
        setStatus("Loading image…", "loading");

        const response = await fetch("assets/data/photos.json");

        if (!response.ok) {
            throw new Error(`Photo data request failed (${response.status}).`);
        }

        const photos = await response.json();
        const lastPhotoId = sessionStorage.getItem("framewiseLastPhotoId");

        currentPhoto = window.FrameWisePhotoSelection.choosePhoto(photos, {
            requestedId: requestedPhotoId,
            lastPhotoId
        });

        if (!currentPhoto) {
            throw new Error("No practice photos are available.");
        }

        sessionStorage.setItem("framewiseLastPhotoId", currentPhoto.id);
        missionText.textContent = currentPhoto.mission;
        tipText.textContent = currentPhoto.tip;
        difficultyText.textContent = `Difficulty: ${DIFFICULTY_LABELS[currentPhoto.difficulty] || "Custom"}`;
        renderCriteria(currentPhoto);
        configureMode(currentPhoto);

        await loadImage(currentPhoto);
        fitImageWrapperToPhoto();
        await initializeCropper(currentPhoto);
    } catch (error) {
        console.error(error);
        setStatus(error.message || "The challenge could not be loaded.", "error");
        missionText.textContent = "Challenge unavailable";
        tipText.textContent = "Return home and try again.";
        setControlsEnabled(false);
    }
}

function saveAttempt(score) {
    const history = safeParse(localStorage.getItem("framewiseHistory"), []);
    const nextHistory = Array.isArray(history) ? history.slice(-49) : [];

    nextHistory.push({
        photoId: currentPhoto.id,
        mission: currentPhoto.mission,
        score,
        completedAt: new Date().toISOString()
    });

    localStorage.setItem("framewiseHistory", JSON.stringify(nextHistory));
}

function submitCrop() {
    if (hasSubmitted || !cropper || !currentPhoto) {
        return;
    }

    hasSubmitted = true;
    window.clearInterval(timerInterval);
    setControlsEnabled(false);
    setStatus("Building feedback…", "loading");

    try {
        const cropData = cropper.getData();
        const croppedCanvas = cropper.getCroppedCanvas({
            width: 500,
            maxHeight: 900,
            imageSmoothingEnabled: true,
            imageSmoothingQuality: "high"
        });
        const croppedImage = croppedCanvas.toDataURL("image/jpeg", 0.9);
        const scoreAnalysis = window.FrameWiseScore.evaluateComposition(
            currentPhoto,
            cropData,
            image.naturalWidth,
            image.naturalHeight
        );

        localStorage.setItem("cropData", JSON.stringify(cropData));
        localStorage.setItem("croppedImage", croppedImage);
        localStorage.setItem("score", String(scoreAnalysis.score));
        localStorage.setItem("scoreAnalysis", JSON.stringify(scoreAnalysis));
        localStorage.setItem("photoInfo", JSON.stringify(currentPhoto));
        localStorage.setItem("framewiseGameMode", gameMode);
        saveAttempt(scoreAnalysis.score);

        overlay.classList.remove("hidden");
        overlay.setAttribute("aria-hidden", "false");

        window.setTimeout(() => {
            window.location.href = "result.html";
        }, 650);
    } catch (error) {
        console.error(error);
        hasSubmitted = false;
        setControlsEnabled(true);
        setStatus("Could not save this crop. Please try again.", "error");
    }
}

zoomOutBtn.addEventListener("click", () => cropper?.zoom(-0.1));
zoomInBtn.addEventListener("click", () => cropper?.zoom(0.1));
resetCropBtn.addEventListener("click", () => cropper?.reset());
submitBtn.addEventListener("click", submitCrop);
window.addEventListener("resize", fitImageWrapperToPhoto);

loadPhoto();
