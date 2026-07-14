// ==========================================
// FrameWise Game v1.0
// ==========================================

const image = document.getElementById("targetImage");

let currentPhoto = null;

async function loadPhoto() {

    const response = await fetch("assets/data/photos.json");
    const photos = await response.json();

    const randomIndex = Math.floor(Math.random() * photos.length);

    currentPhoto = photos[randomIndex];

    // 사진 표시
    image.src = "assets/images/" + currentPhoto.image;

    // Mission 표시
    document.getElementById("missionText").textContent =
        currentPhoto.mission;

    // Difficulty 표시
    const difficultyMap = {
        1: "Easy",
        2: "Medium",
        3: "Hard"
    };

    document.getElementById("difficultyText").textContent =
        difficultyMap[currentPhoto.difficulty];

    // Status 표시
    document.getElementById("statusText").textContent =
        "Ready!";
}

// ---------- 랜덤 사진 선택 ----------



// ---------- 전역 변수 ----------

let cropper;
let timeLeft = 30;

const timer = document.getElementById("time");
const submitBtn = document.getElementById("submitBtn");
const statusText = document.getElementById("statusText");

// ---------- 이미지 로드 후 Cropper 생성 ----------

image.onload = () => {

    cropper = new Cropper(image, {

        viewMode: 1,

        dragMode: "move",

        autoCropArea: 0.5,

        responsive: true,

        movable: true,

        zoomable: true,

        scalable: false,

        rotatable: false,

        cropBoxMovable: true,

        cropBoxResizable: true,

        background: false

    });

};
loadPhoto();
// ---------- 타이머 ----------

const timerInterval = setInterval(() => {

    timeLeft--;

    timer.textContent = timeLeft;

    if (timeLeft <= 0) {

        clearInterval(timerInterval);

        submitCrop();

    }

},1000);

// ---------- 제출 ----------

submitBtn.addEventListener("click", submitCrop);

function submitCrop(){

    clearInterval(timerInterval);

    submitBtn.disabled = true;

    const cropData = cropper.getData();

    // 나중에 결과 페이지에서 사용할 수 있도록 저장
    localStorage.setItem(
        "cropData",
        JSON.stringify(cropData)
    );

    // 임시 점수 (다음 버전에서 알고리즘으로 교체)
    const score =
calculateScore(cropData,image);

    localStorage.setItem("score", score);

    localStorage.setItem(
    "photoInfo",
    JSON.stringify(currentPhoto)
);
    // 로딩 화면 표시
    const overlay = document.getElementById("loadingOverlay");

    overlay.classList.remove("hidden");

    // 2초 후 결과 페이지 이동
    setTimeout(() => {

        window.location.href = "result.html";

    }, 2000);

}
function calculateScore(cropData, image){

    const imgWidth = image.naturalWidth;
    const imgHeight = image.naturalHeight;

    const centerX = cropData.x + cropData.width / 2;
    const centerY = cropData.y + cropData.height / 2;

    // 이미지 중심
    const imageCenterX = imgWidth / 2;
    const imageCenterY = imgHeight / 2;

    // 중심과의 거리
    const distance = Math.sqrt(
        Math.pow(centerX - imageCenterX,2) +
        Math.pow(centerY - imageCenterY,2)
    );

    const maxDistance = Math.sqrt(
        imageCenterX**2 +
        imageCenterY**2
    );

    let centerScore =
        30 * (1 - distance/maxDistance);

    centerScore = Math.max(0,centerScore);

    //--------------------------------------------------

    const cropArea =
        cropData.width * cropData.height;

    const imageArea =
        imgWidth * imgHeight;

    const areaRatio =
        cropArea / imageArea;

    let sizeScore = 25;

    if(areaRatio<0.15){

        sizeScore=10;

    }else if(areaRatio>0.75){

        sizeScore=12;

    }

    //--------------------------------------------------

    const ratio =
        cropData.width/cropData.height;

    let ratioScore =
        25-Math.abs(ratio-1.5)*10;

    ratioScore=Math.max(5,ratioScore);

    //--------------------------------------------------

    let edgeScore=20;

    if(cropData.x<30) edgeScore-=5;
    if(cropData.y<30) edgeScore-=5;

    if(cropData.x+cropData.width>imgWidth-30)
        edgeScore-=5;

    if(cropData.y+cropData.height>imgHeight-30)
        edgeScore-=5;

    //--------------------------------------------------

    const total =
        Math.round(
            centerScore+
            sizeScore+
            ratioScore+
            edgeScore
        );

    return Math.min(100,total);

}