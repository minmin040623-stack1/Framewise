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
    "rule-of-thirds": "삼등분할 격자 위 피사체 위치",
    centered: "피사체와 화면 중심의 정렬",
    "look-room": "피사체가 바라보는 방향의 여백",
    "horizon-position": "수평선의 위치",
    "crop-area-range": "원본에서 남기는 화면의 비율",
    "subject-prominence": "크롭 안에서 피사체가 차지하는 크기",
    "layer-proportions": "전경·중경·배경의 비율",
    "frame-preservation": "자연스러운 외부 프레임 보존",
    "curve-preservation": "해안선 곡선 보존",
    "leading-line": "리딩 라인 보존"
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
        item.textContent = "주요 피사체가 잘리지 않고 보존되는 정도";
        criteriaList.appendChild(item);
    }
}

function configureMode(photo) {
    sessionStorage.setItem("framewiseMode", gameMode);

    if (gameMode === "practice") {
        modeBadge.textContent = "시간 제한 없는 연습";
        timerValue.textContent = "∞";
        timerSuffix.textContent = "";
        timer.classList.add("practice-timer");
        modeSwitch.textContent = "시간 제한 도전으로 바꾸기";
        modeSwitch.href = `game.html?mode=timed&photo=${photo.id}`;
        return;
    }

    modeBadge.textContent = "시간 제한 도전";
    timerSuffix.textContent = "초";
    modeSwitch.textContent = "시간 제한 없이 연습하기";
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
        image.onerror = () => reject(new Error("선택한 사진을 불러오지 못했습니다."));
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
            reject(new Error("크롭 도구를 불러오지 못했습니다."));
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
                setStatus("크롭 준비 완료", "ready");
                startTimer(photo);
                resolve();
            }
        });
    });
}

async function loadPhoto() {
    try {
        setControlsEnabled(false);
        setStatus("사진 불러오는 중…", "loading");

        const response = await fetch("assets/data/photos.json");

        if (!response.ok) {
            throw new Error(`사진 데이터 요청에 실패했습니다. (${response.status})`);
        }

        const photos = await response.json();
        const lastPhotoId = sessionStorage.getItem("framewiseLastPhotoId");

        currentPhoto = window.FrameWisePhotoSelection.choosePhoto(photos, {
            requestedId: requestedPhotoId,
            lastPhotoId
        });

        if (!currentPhoto) {
            throw new Error("연습에 사용할 수 있는 사진이 없습니다.");
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
        setStatus(error.message || "도전을 불러오지 못했습니다.", "error");
        missionText.textContent = "도전을 시작할 수 없습니다";
        tipText.textContent = "홈으로 돌아간 뒤 다시 시도해 주세요.";
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
    setStatus("피드백 만드는 중…", "loading");

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
        setStatus("크롭을 저장하지 못했습니다. 다시 시도해 주세요.", "error");
    }
}

zoomOutBtn.addEventListener("click", () => cropper?.zoom(-0.1));
zoomInBtn.addEventListener("click", () => cropper?.zoom(0.1));
resetCropBtn.addEventListener("click", () => cropper?.reset());
submitBtn.addEventListener("click", submitCrop);
window.addEventListener("resize", fitImageWrapperToPhoto);

loadPhoto();
