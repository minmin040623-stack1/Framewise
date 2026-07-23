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
    1: "쉬움",
    2: "보통",
    3: "어려움"
};

const TIME_BY_DIFFICULTY = {
    1: 45,
    2: 40,
    3: 35
};

const CRITERIA_LABELS = {
    "rule-of-thirds": "피사체가 삼등분 교차점에 얼마나 가까운지",
    centered: "피사체가 화면 중심에 얼마나 잘 맞는지",
    "look-room": "피사체가 바라보는 쪽에 여백이 충분한지",
    "horizon-position": "수평선이 화면 안에서 어디에 놓였는지",
    "crop-area-range": "원본에서 어느 정도를 남겼는지",
    "subject-prominence": "피사체가 화면에서 얼마나 눈에 띄는지",
    "layer-proportions": "전경·중경·배경이 고르게 살아 있는지",
    "frame-preservation": "피사체를 둘러싼 프레임을 잘 살렸는지",
    "curve-preservation": "해안선의 흐름이 끊기지 않았는지",
    "leading-line": "시선을 이끄는 선이 충분히 남았는지"
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
        item.textContent = "중요한 피사체가 잘리지 않았는지";
        criteriaList.appendChild(item);
    }
}

function configureMode(photo) {
    sessionStorage.setItem("framewiseMode", gameMode);

    if (gameMode === "practice") {
        modeBadge.textContent = "천천히 연습";
        timerValue.textContent = "∞";
        timerSuffix.textContent = "";
        timer.classList.add("practice-timer");
        modeSwitch.textContent = "시간 안에 도전해 보기";
        modeSwitch.href = `game.html?mode=timed&photo=${photo.id}`;
        return;
    }

    modeBadge.textContent = "시간 안에 도전";
    timerSuffix.textContent = "초";
    modeSwitch.textContent = "시간 제한 없이 풀기";
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
        image.onerror = () => reject(new Error("사진을 불러오지 못했어요. 잠시 뒤 다시 시도해 주세요."));
        image.alt = photo.title
            ? `${photo.title} 크롭 연습 사진`
            : `${photo.mission} 크롭 연습 사진`;
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
            reject(new Error("크롭 도구를 불러오지 못했어요. 페이지를 새로고침해 주세요."));
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
                setStatus("크롭할 준비가 됐어요", "ready");
                startTimer(photo);
                resolve();
            }
        });
    });
}

async function loadPhoto() {
    try {
        setControlsEnabled(false);
        setStatus("사진 준비 중…", "loading");

        const response = await fetch("assets/data/photos.json");

        if (!response.ok) {
            throw new Error(`사진 목록을 불러오지 못했어요. (${response.status})`);
        }

        const photos = await response.json();
        const lastPhotoId = sessionStorage.getItem("framewiseLastPhotoId");

        currentPhoto = window.FrameWisePhotoSelection.choosePhoto(photos, {
            requestedId: requestedPhotoId,
            lastPhotoId
        });

        if (!currentPhoto) {
            throw new Error("지금 연습할 수 있는 사진이 없어요.");
        }

        sessionStorage.setItem("framewiseLastPhotoId", currentPhoto.id);
        missionText.textContent = currentPhoto.mission;
        tipText.textContent = currentPhoto.tip;
        difficultyText.textContent = `난이도: ${DIFFICULTY_LABELS[currentPhoto.difficulty] || "사용자 지정"}`;
        renderCriteria(currentPhoto);
        configureMode(currentPhoto);

        await loadImage(currentPhoto);
        fitImageWrapperToPhoto();
        await initializeCropper(currentPhoto);
    } catch (error) {
        console.error(error);
        setStatus(error.message || "연습 화면을 준비하지 못했어요.", "error");
        missionText.textContent = "사진을 준비하지 못했어요";
        tipText.textContent = "홈으로 돌아갔다가 다시 시작해 주세요.";
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
    setStatus("결과를 살펴보는 중…", "loading");

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
        setStatus("자른 사진을 저장하지 못했어요. 한 번 더 눌러 주세요.", "error");
    }
}

zoomOutBtn.addEventListener("click", () => cropper?.zoom(-0.1));
zoomInBtn.addEventListener("click", () => cropper?.zoom(0.1));
resetCropBtn.addEventListener("click", () => cropper?.reset());
submitBtn.addEventListener("click", submitCrop);
window.addEventListener("resize", fitImageWrapperToPhoto);

loadPhoto();
