const croppedImage =
localStorage.getItem("croppedImage");

if(croppedImage){

    document
        .getElementById("croppedPreview")
        .src = croppedImage;

}
const photoInfo =
JSON.parse(localStorage.getItem("photoInfo"));

console.log(photoInfo);
const score = localStorage.getItem("score") || 90;

document.getElementById("scoreValue").textContent = score;

const grade = document.getElementById("gradeText");

if(score >= 95){

    grade.textContent = "Outstanding!";

}
else if(score >= 90){

    grade.textContent = "Excellent!";

}
else if(score >= 80){

    grade.textContent = "Great Job!";

}
else{

    grade.textContent = "Keep Practicing!";

}

document.getElementById("nextBtn").addEventListener("click", ()=>{

    window.location.href = "game.html";

});