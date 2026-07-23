const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const projectRoot = path.resolve(__dirname, "..");
const resultScript = fs.readFileSync(
    path.join(projectRoot, "js", "result.js"),
    "utf8"
);

let drawImageCalls = 0;
let redirectTarget = null;

function createContext() {
    return {
        save() {},
        restore() {},
        clearRect() {},
        drawImage() {
            drawImageCalls += 1;
        },
        beginPath() {},
        moveTo() {},
        lineTo() {},
        arc() {},
        fill() {},
        fillRect() {},
        stroke() {},
        setLineDash() {},
        lineWidth: 1,
        lineCap: "round",
        lineJoin: "round",
        strokeStyle: "",
        fillStyle: "",
        shadowColor: "",
        shadowBlur: 0
    };
}

function createElement(id = "") {
    const listeners = {};
    const attributes = {};
    const element = {
        id,
        textContent: "",
        className: "",
        hidden: false,
        children: [],
        style: {},
        naturalWidth: id === "croppedPreview" ? 500 : 0,
        naturalHeight: id === "croppedPreview" ? 400 : 0,
        width: 300,
        height: 150,
        append(...items) {
            this.children.push(...items);
        },
        appendChild(item) {
            this.children.push(item);
            return item;
        },
        addEventListener(type, handler) {
            listeners[type] = handler;
        },
        click() {
            if (listeners.click) {
                listeners.click();
            }
        },
        setAttribute(name, value) {
            attributes[name] = String(value);
        },
        getAttribute(name) {
            return attributes[name];
        },
        getContext() {
            return createContext();
        },
        replaceChildren(...items) {
            this.children = items;
        }
    };

    Object.defineProperty(element, "src", {
        get() {
            return this._src || "";
        },
        set(value) {
            this._src = value;
            if (listeners.load) {
                listeners.load();
            }
        }
    });

    return element;
}

const ids = [
    "croppedPreview",
    "gradeText",
    "gradeSummary",
    "scoreValue",
    "resultMission",
    "attemptCount",
    "averageScore",
    "bestScore",
    "scoreBreakdownSection",
    "scoreBreakdown",
    "scoreMethod",
    "feedbackList",
    "criteriaDetails",
    "sourceCredit",
    "retryBtn",
    "nextBtn",
    "referenceCanvas",
    "referenceReason",
    "referenceCounter",
    "referenceControls",
    "previousReferenceBtn",
    "nextReferenceBtn",
    "guideToggle",
    "guideNote",
    "guideLabel",
    "guideExplanation"
];
const elements = Object.fromEntries(ids.map((id) => [id, createElement(id)]));

const photoInfo = {
    id: 9,
    image: "sample9.jpg",
    mission: "삼등분할 구도와 여백",
    coachOverlay: {
        type: "rule-of-thirds",
        label: "삼등분할 구도",
        targetAnchor: "top-right",
        guideText: "흰 선이 화면을 가로세로 3등분해요."
    },
    targetCompositions: [{ type: "rule-of-thirds" }],
    annotations: { source: "manual", subjects: [] },
    referenceCrops: [
        {
            x: 0.1,
            y: 0.2,
            width: 0.7,
            height: 0.6,
            reason: "추천 예시의 이유를 보여 줘요."
        }
    ]
};
const scoreAnalysis = {
    annotationBasis: "manual",
    normalizedCrop: { x: 0.1, y: 0.2, width: 0.7, height: 0.6 },
    breakdown: [
        {
            key: "targetComposition",
            label: "목표 구도 일치도",
            score: 92,
            weight: 90
        },
        {
            key: "referenceSimilarity",
            label: "추천 예시와 비슷한 정도",
            score: 100,
            weight: 10
        }
    ],
    criteria: [
        {
            label: "삼등분할 구도",
            score: 92,
            message: "피사체가 목표 삼등분 교차점 가까이에 있습니다."
        }
    ],
    feedback: [
        {
            tone: "good",
            text: "피사체 배치가 목표 구도와 잘 맞습니다."
        }
    ]
};
const storage = new Map([
    ["croppedImage", "data:image/jpeg;base64,test"],
    ["photoInfo", JSON.stringify(photoInfo)],
    ["scoreAnalysis", JSON.stringify(scoreAnalysis)],
    ["score", "92"],
    ["framewiseHistory", JSON.stringify([{ score: 92 }])],
    ["framewiseGameMode", "practice"]
]);

class ImageStub {
    constructor() {
        this.naturalWidth = 1000;
        this.naturalHeight = 800;
        this.onload = null;
        this.onerror = null;
    }

    set src(value) {
        this._src = value;
        if (this.onload) {
            this.onload();
        }
    }

    get src() {
        return this._src;
    }
}

const sandbox = {
    console,
    Image: ImageStub,
    localStorage: {
        getItem(key) {
            return storage.get(key) ?? null;
        }
    },
    document: {
        getElementById(id) {
            return elements[id];
        },
        createElement() {
            return createElement();
        },
        createTextNode(text) {
            return { textContent: text };
        }
    },
    window: {
        location: {
            href: "",
            replace(target) {
                redirectTarget = target;
            }
        }
    }
};

vm.runInNewContext(resultScript, sandbox, { filename: "js/result.js" });

assert.equal(redirectTarget, null);
assert.equal(elements.scoreValue.textContent, 92);
assert.equal(elements.referenceReason.textContent, "추천 예시의 이유를 보여 줘요.");
assert.equal(elements.guideLabel.textContent, "삼등분할 구도");
assert.equal(
    elements.guideExplanation.textContent,
    "흰 선이 화면을 가로세로 3등분해요."
);
assert.equal(elements.guideToggle.getAttribute("aria-pressed"), undefined);
assert.ok(drawImageCalls > 0, "Coach crop canvas never called drawImage");

elements.guideToggle.click();
assert.equal(elements.guideToggle.getAttribute("aria-pressed"), "false");
assert.equal(elements.guideToggle.textContent, "가이드 다시 보기");
assert.equal(elements.guideNote.hidden, true);

elements.guideToggle.click();
assert.equal(elements.guideToggle.getAttribute("aria-pressed"), "true");
assert.equal(elements.guideToggle.textContent, "가이드 숨기기");
assert.equal(elements.guideNote.hidden, false);

console.log("result runtime test passed");
