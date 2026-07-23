function safeParseStorage(key, fallback = null) {
    try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : fallback;
    } catch {
        return fallback;
    }
}

const croppedImage = localStorage.getItem("croppedImage");
const photoInfo = safeParseStorage("photoInfo");
const scoreAnalysis = safeParseStorage("scoreAnalysis");
const score = Number(localStorage.getItem("score"));

function initializeResult() {
    const croppedPreview = document.getElementById("croppedPreview");
    const grade = document.getElementById("gradeText");
    const gradeSummary = document.getElementById("gradeSummary");

    document.getElementById("scoreValue").textContent = Math.round(score);
    document.getElementById("resultMission").textContent = photoInfo.mission;

    if (score >= 92) {
        grade.textContent = "Excellent control";
        gradeSummary.textContent = "Your crop closely matches this photo's composition goals.";
    } else if (score >= 82) {
        grade.textContent = "Strong composition";
        gradeSummary.textContent = "The main structure works, with a small adjustment left to explore.";
    } else if (score >= 70) {
        grade.textContent = "Good direction";
        gradeSummary.textContent = "The idea is visible. Use the evidence below to refine the crop.";
    } else {
        grade.textContent = "Keep exploring";
        gradeSummary.textContent = "Try the suggested adjustment, then retry this same photo.";
    }

    renderHistory();
    renderScoreDetails();
    renderSourceCredit();
    configureNavigation();

    croppedPreview.src = croppedImage;
    initializeReferencePreview();
}

function renderHistory() {
    const history = safeParseStorage("framewiseHistory", []);
    const validHistory = Array.isArray(history)
        ? history.filter((item) => Number.isFinite(Number(item.score)))
        : [];
    const scores = validHistory.map((item) => Number(item.score));
    const average = scores.length
        ? Math.round(scores.reduce((sum, item) => sum + item, 0) / scores.length)
        : null;
    const best = scores.length ? Math.max(...scores) : null;

    document.getElementById("attemptCount").textContent = validHistory.length;
    document.getElementById("averageScore").textContent = average === null ? "--" : average;
    document.getElementById("bestScore").textContent = best === null ? "--" : best;
}

function renderScoreDetails() {
    const scoreBreakdownSection = document.getElementById("scoreBreakdownSection");
    const scoreBreakdown = document.getElementById("scoreBreakdown");
    const scoreMethod = document.getElementById("scoreMethod");
    const feedbackList = document.getElementById("feedbackList");
    const criteriaDetails = document.getElementById("criteriaDetails");
    const breakdown = scoreAnalysis.breakdown || [];
    const criteria = scoreAnalysis.criteria || [];
    const feedback = scoreAnalysis.feedback || [];

    if (breakdown.length === 0) {
        scoreBreakdownSection.hidden = true;
    } else {
        breakdown.forEach((item) => {
            const row = document.createElement("div");
            const labelWrap = document.createElement("div");
            const label = document.createElement("strong");
            const weight = document.createElement("span");
            const meter = document.createElement("div");
            const fill = document.createElement("div");
            const value = document.createElement("strong");
            const roundedScore = Math.round(item.score);

            row.className = "breakdown-row";
            labelWrap.className = "breakdown-label";
            meter.className = "breakdown-meter";
            fill.className = "breakdown-fill";
            value.className = "breakdown-value";

            label.textContent = item.label;
            weight.textContent = `${item.weight}% of total`;
            value.textContent = `${roundedScore} / 100`;
            fill.style.width = `${Math.max(0, Math.min(100, item.score))}%`;

            meter.setAttribute("role", "progressbar");
            meter.setAttribute("aria-label", item.label);
            meter.setAttribute("aria-valuemin", "0");
            meter.setAttribute("aria-valuemax", "100");
            meter.setAttribute("aria-valuenow", String(roundedScore));

            labelWrap.append(label, weight);
            meter.appendChild(fill);
            row.append(labelWrap, meter, value);
            scoreBreakdown.appendChild(row);
        });
    }

    scoreMethod.textContent = scoreAnalysis.annotationBasis === "manual"
        ? "Manual guides · rule-based"
        : "Rule-based composition review";

    criteria.forEach((item) => {
        const card = document.createElement("article");
        const heading = document.createElement("div");
        const label = document.createElement("strong");
        const value = document.createElement("span");
        const message = document.createElement("p");

        card.className = "criterion-card";
        heading.className = "criterion-heading";
        label.textContent = item.label;
        value.textContent = `${Math.round(item.score)} / 100`;
        message.textContent = item.message;

        heading.append(label, value);
        card.append(heading, message);
        criteriaDetails.appendChild(card);
    });

    const messages = feedback.length > 0
        ? feedback
        : [{ tone: "normal", text: "Detailed feedback is not available for this photo." }];

    messages.forEach((item) => {
        const message = document.createElement("div");
        const icon = item.tone === "good" ? "✓" : item.tone === "bad" ? "→" : "i";
        const iconElement = document.createElement("span");
        const textElement = document.createElement("p");

        message.className = `feedback ${item.tone || "normal"}`;
        iconElement.className = "feedback-icon";
        iconElement.textContent = icon;
        iconElement.setAttribute("aria-hidden", "true");
        textElement.textContent = item.text;
        message.append(iconElement, textElement);
        feedbackList.appendChild(message);
    });
}

function renderSourceCredit() {
    const sourceCredit = document.getElementById("sourceCredit");

    if (!photoInfo.sourceUrl) {
        sourceCredit.textContent = "Project sample · source and license record pending verification.";
        return;
    }

    const prefix = document.createTextNode("Photo: ");
    const sourceLink = document.createElement("a");
    const creator = document.createTextNode(
        ` by ${photoInfo.creator || "source creator"} · `
    );

    sourceLink.href = photoInfo.sourceUrl;
    sourceLink.target = "_blank";
    sourceLink.rel = "noreferrer";
    sourceLink.textContent = photoInfo.title || "View original";

    sourceCredit.append(prefix, sourceLink, creator);

    if (photoInfo.licenseUrl) {
        const licenseLink = document.createElement("a");
        licenseLink.href = photoInfo.licenseUrl;
        licenseLink.target = "_blank";
        licenseLink.rel = "noreferrer";
        licenseLink.textContent = photoInfo.license || "View license";
        sourceCredit.appendChild(licenseLink);
    } else {
        sourceCredit.append(
            document.createTextNode(photoInfo.license || "License on source page")
        );
    }
}

function configureNavigation() {
    const mode = localStorage.getItem("framewiseGameMode") === "practice"
        ? "practice"
        : "timed";

    document.getElementById("retryBtn").addEventListener("click", () => {
        window.location.href = `game.html?mode=${mode}&photo=${photoInfo.id}`;
    });

    document.getElementById("nextBtn").addEventListener("click", () => {
        window.location.href = `game.html?mode=${mode}`;
    });
}

const referenceCanvas = document.getElementById("referenceCanvas");
const referenceContext = referenceCanvas.getContext("2d");
const referenceReason = document.getElementById("referenceReason");
const referenceCounter = document.getElementById("referenceCounter");
const referenceControls = document.getElementById("referenceControls");
const previousReferenceBtn = document.getElementById("previousReferenceBtn");
const nextReferenceBtn = document.getElementById("nextReferenceBtn");
const guideToggle = document.getElementById("guideToggle");
const guideNote = document.getElementById("guideNote");
const guideLabel = document.getElementById("guideLabel");
const guideExplanation = document.getElementById("guideExplanation");

const referenceCrops = photoInfo?.referenceCrops || [];
const coachOverlay = photoInfo?.coachOverlay || null;
let referenceIndex = 0;
let referenceImage = null;
let guidesVisible = true;

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function toCanvasPoint(point, crop, width, height) {
    return {
        x: ((point.x - crop.x) / Math.max(crop.width, 0.000001)) * width,
        y: ((point.y - crop.y) / Math.max(crop.height, 0.000001)) * height
    };
}

function findSubject(subjectId) {
    return (photoInfo.annotations?.subjects || [])
        .find((subject) => subject.id === subjectId);
}

function findPath(collectionName, pathId) {
    return (photoInfo.annotations?.[collectionName] || [])
        .find((path) => path.id === pathId);
}

function drawArrowHead(context, from, to, size) {
    const angle = Math.atan2(to.y - from.y, to.x - from.x);

    context.beginPath();
    context.moveTo(to.x, to.y);
    context.lineTo(
        to.x - size * Math.cos(angle - Math.PI / 6),
        to.y - size * Math.sin(angle - Math.PI / 6)
    );
    context.moveTo(to.x, to.y);
    context.lineTo(
        to.x - size * Math.cos(angle + Math.PI / 6),
        to.y - size * Math.sin(angle + Math.PI / 6)
    );
    context.stroke();
}

function drawRuleOfThirds(context, width, height, targetAnchor) {
    context.strokeStyle = "rgba(255, 255, 255, 0.88)";
    context.setLineDash([10, 8]);

    [1 / 3, 2 / 3].forEach((ratio) => {
        context.beginPath();
        context.moveTo(width * ratio, 0);
        context.lineTo(width * ratio, height);
        context.stroke();

        context.beginPath();
        context.moveTo(0, height * ratio);
        context.lineTo(width, height * ratio);
        context.stroke();
    });

    const anchors = {
        "top-left": { x: width / 3, y: height / 3 },
        "top-right": { x: width * 2 / 3, y: height / 3 },
        "bottom-left": { x: width / 3, y: height * 2 / 3 },
        "bottom-right": { x: width * 2 / 3, y: height * 2 / 3 }
    };
    const target = anchors[targetAnchor];

    if (target) {
        context.setLineDash([]);
        context.strokeStyle = "#FBBF24";
        context.fillStyle = "rgba(251, 191, 36, 0.24)";
        context.beginPath();
        context.arc(target.x, target.y, Math.max(8, width / 80), 0, Math.PI * 2);
        context.fill();
        context.stroke();
    }
}

function drawCenteredGuide(context, width, height) {
    context.strokeStyle = "rgba(255, 255, 255, 0.9)";
    context.setLineDash([10, 8]);
    context.beginPath();
    context.moveTo(width / 2, 0);
    context.lineTo(width / 2, height);
    context.moveTo(0, height / 2);
    context.lineTo(width, height / 2);
    context.stroke();

    context.setLineDash([]);
    context.fillStyle = "#FBBF24";
    context.beginPath();
    context.arc(width / 2, height / 2, Math.max(5, width / 130), 0, Math.PI * 2);
    context.fill();
}

function drawSymmetryGuide(context, width, height, axis) {
    context.strokeStyle = "#FBBF24";
    context.setLineDash([12, 8]);
    context.beginPath();

    if (axis === "horizontal") {
        context.moveTo(0, height / 2);
        context.lineTo(width, height / 2);
    } else {
        context.moveTo(width / 2, 0);
        context.lineTo(width / 2, height);
    }

    context.stroke();
}

function drawLookRoomGuide(context, width, height, crop, subjectId) {
    const subject = findSubject(subjectId);

    if (!subject?.bbox || !subject.lookDirection) {
        return;
    }

    const bbox = subject.bbox;
    const direction = subject.lookDirection;
    let startSource = {
        x: bbox.x + bbox.width / 2,
        y: bbox.y + bbox.height * 0.35
    };
    let endSource = { ...startSource };

    if (direction === "left") {
        startSource.x = bbox.x;
        endSource.x = crop.x + crop.width * 0.08;
    } else if (direction === "right") {
        startSource.x = bbox.x + bbox.width;
        endSource.x = crop.x + crop.width * 0.92;
    } else if (direction === "up") {
        startSource.y = bbox.y;
        endSource.y = crop.y + crop.height * 0.08;
    } else if (direction === "down") {
        startSource.y = bbox.y + bbox.height;
        endSource.y = crop.y + crop.height * 0.92;
    } else {
        return;
    }

    const start = toCanvasPoint(startSource, crop, width, height);
    const end = toCanvasPoint(endSource, crop, width, height);
    const safeStart = {
        x: clamp(start.x, width * 0.06, width * 0.94),
        y: clamp(start.y, height * 0.08, height * 0.92)
    };
    const safeEnd = {
        x: clamp(end.x, width * 0.06, width * 0.94),
        y: clamp(end.y, height * 0.08, height * 0.92)
    };

    context.strokeStyle = "#67E8F9";
    context.setLineDash([]);
    context.beginPath();
    context.moveTo(safeStart.x, safeStart.y);
    context.lineTo(safeEnd.x, safeEnd.y);
    context.stroke();
    drawArrowHead(context, safeStart, safeEnd, Math.max(14, width / 45));
}

function drawLayerGuide(context, width, height, crop) {
    const layers = photoInfo.annotations?.layers || [];
    const colors = [
        "rgba(96, 165, 250, 0.13)",
        "rgba(167, 139, 250, 0.13)",
        "rgba(52, 211, 153, 0.13)",
        "rgba(251, 191, 36, 0.13)"
    ];

    layers.forEach((layer, index) => {
        const visibleTop = Math.max(layer.y, crop.y);
        const visibleBottom = Math.min(layer.y + layer.height, crop.y + crop.height);

        if (visibleBottom <= visibleTop) {
            return;
        }

        const top = ((visibleTop - crop.y) / crop.height) * height;
        const bottom = ((visibleBottom - crop.y) / crop.height) * height;
        context.fillStyle = colors[index % colors.length];
        context.fillRect(0, top, width, bottom - top);

        if (visibleBottom < crop.y + crop.height - 0.001) {
            context.strokeStyle = "rgba(255, 255, 255, 0.82)";
            context.setLineDash([10, 8]);
            context.beginPath();
            context.moveTo(0, bottom);
            context.lineTo(width, bottom);
            context.stroke();
        }
    });
}

function drawPathGuide(context, width, height, crop, collectionName, pathId, color, withArrow) {
    const path = findPath(collectionName, pathId);

    if (!path?.points?.length) {
        return;
    }

    const points = path.points.map((point) => toCanvasPoint(point, crop, width, height));
    const visiblePoints = points.filter((point) => (
        point.x >= 0 && point.x <= width && point.y >= 0 && point.y <= height
    ));

    if (visiblePoints.length < 2) {
        return;
    }

    context.strokeStyle = color;
    context.setLineDash([]);
    context.beginPath();
    context.moveTo(visiblePoints[0].x, visiblePoints[0].y);
    visiblePoints.slice(1).forEach((point) => context.lineTo(point.x, point.y));
    context.stroke();

    if (withArrow) {
        const last = visiblePoints[visiblePoints.length - 1];
        const beforeLast = visiblePoints[visiblePoints.length - 2];
        drawArrowHead(context, beforeLast, last, Math.max(14, width / 45));
    }
}

function drawCoachGuide(context, width, height, crop) {
    if (!coachOverlay) {
        return;
    }

    context.save();
    context.lineWidth = Math.max(3, width / 350);
    context.lineCap = "round";
    context.lineJoin = "round";
    context.shadowColor = "rgba(0, 0, 0, 0.55)";
    context.shadowBlur = 6;

    switch (coachOverlay.type) {
        case "rule-of-thirds":
            drawRuleOfThirds(context, width, height, coachOverlay.targetAnchor);
            break;
        case "centered":
            drawCenteredGuide(context, width, height);
            break;
        case "symmetry":
            drawSymmetryGuide(context, width, height, coachOverlay.axis);
            break;
        case "look-room":
            drawLookRoomGuide(context, width, height, crop, coachOverlay.subjectId);
            break;
        case "layers":
            drawLayerGuide(context, width, height, crop);
            break;
        case "curve":
            drawPathGuide(
                context,
                width,
                height,
                crop,
                "curves",
                coachOverlay.pathId,
                "#F472B6",
                false
            );
            break;
        case "leading-line":
            drawPathGuide(
                context,
                width,
                height,
                crop,
                "lines",
                coachOverlay.pathId,
                "#A78BFA",
                true
            );
            break;
        default:
            break;
    }

    context.restore();
}

function renderReferenceCrop() {
    if (!referenceImage || referenceCrops.length === 0) {
        return;
    }

    const ref = referenceCrops[referenceIndex];
    const imageWidth = referenceImage.naturalWidth;
    const imageHeight = referenceImage.naturalHeight;
    const sourceX = clamp(ref.x, 0, 1) * imageWidth;
    const sourceY = clamp(ref.y, 0, 1) * imageHeight;
    const sourceWidth = Math.min(
        clamp(ref.width, 0.01, 1) * imageWidth,
        imageWidth - sourceX
    );
    const sourceHeight = Math.min(
        clamp(ref.height, 0.01, 1) * imageHeight,
        imageHeight - sourceY
    );
    const previewWidth = 900;
    const previewHeight = Math.max(1, Math.round(previewWidth * sourceHeight / sourceWidth));

    referenceCanvas.width = previewWidth;
    referenceCanvas.height = previewHeight;
    referenceContext.clearRect(0, 0, previewWidth, previewHeight);
    referenceContext.drawImage(
        referenceImage,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        previewWidth,
        previewHeight
    );

    if (guidesVisible && coachOverlay) {
        drawCoachGuide(referenceContext, previewWidth, previewHeight, ref);
    }

    referenceCounter.textContent = `${referenceIndex + 1} / ${referenceCrops.length}`;
    referenceReason.textContent = ref.reason;
    guideLabel.textContent = coachOverlay?.label || "";
    guideExplanation.textContent = coachOverlay?.guideText || "";
    guideNote.hidden = !guidesVisible || !coachOverlay;
}

function initializeReferencePreview() {
    if (referenceCrops.length === 0) {
        referenceReason.textContent = "No coach example is available for this photo yet.";
        referenceCounter.textContent = "0 / 0";
        referenceControls.hidden = true;
        referenceCanvas.hidden = true;
        guideToggle.hidden = true;
        guideNote.hidden = true;
        return;
    }

    if (!coachOverlay) {
        guideToggle.hidden = true;
        guideNote.hidden = true;
    }

    referenceImage = new Image();
    referenceImage.onload = renderReferenceCrop;
    referenceImage.onerror = () => {
        referenceReason.textContent = "The coach example could not be loaded.";
        referenceControls.hidden = true;
        referenceCanvas.hidden = true;
        guideNote.hidden = true;
    };
    referenceImage.src = `assets/images/${photoInfo.image}`;

    previousReferenceBtn.addEventListener("click", () => {
        referenceIndex = (referenceIndex - 1 + referenceCrops.length) % referenceCrops.length;
        renderReferenceCrop();
    });

    nextReferenceBtn.addEventListener("click", () => {
        referenceIndex = (referenceIndex + 1) % referenceCrops.length;
        renderReferenceCrop();
    });

    if (referenceCrops.length === 1) {
        referenceControls.hidden = true;
    }
}

guideToggle.addEventListener("click", () => {
    guidesVisible = !guidesVisible;
    guideToggle.setAttribute("aria-pressed", String(guidesVisible));
    guideToggle.textContent = guidesVisible
        ? "Hide coach guide"
        : "Show coach guide";
    renderReferenceCrop();
});

if (!croppedImage || !photoInfo || !scoreAnalysis || !Number.isFinite(score)) {
    window.location.replace("game.html");
} else {
    initializeResult();
}
