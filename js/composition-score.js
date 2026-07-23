(function (root, factory) {
    const api = factory();

    if (typeof module === "object" && module.exports) {
        module.exports = api;
    }

    root.FrameWiseScore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
    const EPSILON = 0.000001;

    const CATEGORY_LABELS = {
        targetComposition: "이번 구도 목표",
        subjectPreservation: "피사체가 잘리지 않았는지",
        alignment: "수평과 정렬",
        spaceAndBalance: "여백과 화면 균형",
        referenceSimilarity: "추천 예시와 비슷한 정도"
    };

    const THIRD_POINTS = {
        "top-left": { x: 1 / 3, y: 1 / 3 },
        "top-right": { x: 2 / 3, y: 1 / 3 },
        "bottom-left": { x: 1 / 3, y: 2 / 3 },
        "bottom-right": { x: 2 / 3, y: 2 / 3 }
    };

    const THIRD_POINT_LABELS = {
        "top-left": "왼쪽 위",
        "top-right": "오른쪽 위",
        "bottom-left": "왼쪽 아래",
        "bottom-right": "오른쪽 아래"
    };

    const DIRECTION_LABELS = {
        left: "왼쪽",
        right: "오른쪽",
        up: "위쪽",
        down: "아래쪽"
    };

    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    function round(value, digits = 0) {
        const scale = 10 ** digits;
        return Math.round(value * scale) / scale;
    }

    function normalizeCrop(cropData, imageWidth, imageHeight) {
        if (!cropData || imageWidth <= 0 || imageHeight <= 0) {
            return { x: 0, y: 0, width: 1, height: 1 };
        }

        const x = clamp(cropData.x / imageWidth, 0, 1);
        const y = clamp(cropData.y / imageHeight, 0, 1);

        return {
            x,
            y,
            width: clamp(cropData.width / imageWidth, 0, 1 - x),
            height: clamp(cropData.height / imageHeight, 0, 1 - y)
        };
    }

    function intersectionArea(a, b) {
        const left = Math.max(a.x, b.x);
        const top = Math.max(a.y, b.y);
        const right = Math.min(a.x + a.width, b.x + b.width);
        const bottom = Math.min(a.y + a.height, b.y + b.height);

        return Math.max(0, right - left) * Math.max(0, bottom - top);
    }

    function rectArea(rect) {
        return Math.max(0, rect.width) * Math.max(0, rect.height);
    }

    function rectIoU(a, b) {
        const intersection = intersectionArea(a, b);
        const union = rectArea(a) + rectArea(b) - intersection;
        return union > EPSILON ? intersection / union : 0;
    }

    function scoreDistance(distance, excellentDistance, maxDistance) {
        if (distance <= excellentDistance) {
            return 100;
        }

        if (distance >= maxDistance) {
            return 0;
        }

        return 100 * (1 - (distance - excellentDistance) / (maxDistance - excellentDistance));
    }

    function scoreRange(value, min, max, softness) {
        if (value >= min && value <= max) {
            return 100;
        }

        if (value < min) {
            return 100 * clamp((value - (min - softness)) / softness, 0, 1);
        }

        return 100 * clamp(((max + softness) - value) / softness, 0, 1);
    }

    function getSubject(photo, subjectId) {
        const subjects = photo.annotations?.subjects || [];

        if (subjectId) {
            return subjects.find((subject) => subject.id === subjectId) || null;
        }

        return subjects.find((subject) => subject.role === "primary") || subjects[0] || null;
    }

    function toLocalPoint(point, crop) {
        return {
            x: (point.x - crop.x) / Math.max(crop.width, EPSILON),
            y: (point.y - crop.y) / Math.max(crop.height, EPSILON)
        };
    }

    function isPointInsideCrop(point, crop) {
        return point.x >= crop.x
            && point.x <= crop.x + crop.width
            && point.y >= crop.y
            && point.y <= crop.y + crop.height;
    }

    function evaluateRuleOfThirds(target, photo, crop) {
        const subject = getSubject(photo, target.subjectId);

        if (!subject?.anchor) {
            return null;
        }

        const local = toLocalPoint(subject.anchor, crop);
        const anchors = target.target?.anchors || Object.keys(THIRD_POINTS);
        let nearestDistance = Infinity;
        let nearestName = anchors[0];

        anchors.forEach((name) => {
            const point = THIRD_POINTS[name];

            if (!point) {
                return;
            }

            const distance = Math.hypot(local.x - point.x, local.y - point.y);

            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestName = name;
            }
        });

        const excellentDistance = target.target?.excellentDistance ?? 0.06;
        const maxDistance = target.target?.maxDistance ?? 0.24;
        const score = scoreDistance(nearestDistance, excellentDistance, maxDistance);
        const nearestLabel = THIRD_POINT_LABELS[nearestName] || nearestName;

        return {
            id: "rule-of-thirds",
            label: "삼등분할 구도",
            category: target.category || "targetComposition",
            score,
            weight: target.weight ?? 1,
            message: score >= 80
                ? `피사체가 ${nearestLabel} 교차점에 잘 놓였어요. 교차점과의 거리: ${round(nearestDistance * 100, 1)}%.`
                : `피사체를 ${nearestLabel} 교차점 쪽으로 조금 더 옮겨 보세요. 현재 거리: ${round(nearestDistance * 100, 1)}%.`
        };
    }

    function evaluateCentered(target, photo, crop) {
        const subject = getSubject(photo, target.subjectId);

        if (!subject?.anchor) {
            return null;
        }

        const local = toLocalPoint(subject.anchor, crop);
        const axes = target.target?.axes || ["x", "y"];
        let distance;

        if (axes.length === 1 && axes[0] === "x") {
            distance = Math.abs(local.x - 0.5);
        } else if (axes.length === 1 && axes[0] === "y") {
            distance = Math.abs(local.y - 0.5);
        } else {
            distance = Math.hypot(local.x - 0.5, local.y - 0.5);
        }

        const score = scoreDistance(
            distance,
            target.target?.excellentDistance ?? 0.04,
            target.target?.maxDistance ?? 0.22
        );
        const axisLabel = axes.length === 1
            ? axes[0] === "x" ? "세로 중심선" : "가로 중심선"
            : "화면 중심";

        return {
            id: "centered",
            label: "중앙 구도",
            category: target.category || "targetComposition",
            score,
            weight: target.weight ?? 1,
            message: score >= 80
                ? `피사체가 ${axisLabel}에 거의 맞았어요. 중심에서 벗어난 정도: ${round(distance * 100, 1)}%.`
                : `피사체가 ${axisLabel}에 가까워지도록 자르는 위치를 옮겨 보세요. 현재 차이: ${round(distance * 100, 1)}%.`
        };
    }

    function evaluateLookRoom(target, photo, crop) {
        const subject = getSubject(photo, target.subjectId);

        if (!subject?.bbox || !subject.lookDirection) {
            return null;
        }

        const box = subject.bbox;
        const cropRight = crop.x + crop.width;
        const cropBottom = crop.y + crop.height;
        let frontSpace = 0;
        let backSpace = 0;

        if (subject.lookDirection === "left") {
            frontSpace = box.x - crop.x;
            backSpace = cropRight - (box.x + box.width);
        } else if (subject.lookDirection === "right") {
            frontSpace = cropRight - (box.x + box.width);
            backSpace = box.x - crop.x;
        } else if (subject.lookDirection === "up") {
            frontSpace = box.y - crop.y;
            backSpace = cropBottom - (box.y + box.height);
        } else if (subject.lookDirection === "down") {
            frontSpace = cropBottom - (box.y + box.height);
            backSpace = box.y - crop.y;
        }

        frontSpace = Math.max(0, frontSpace);
        backSpace = Math.max(0, backSpace);

        const ratio = frontSpace / Math.max(backSpace, EPSILON);
        const minimumRatio = target.target?.minFrontBackRatio ?? 1.2;
        const score = 100 * clamp(ratio / minimumRatio, 0, 1);
        const directionLabel = DIRECTION_LABELS[subject.lookDirection] || "시선";

        return {
            id: "look-room",
            label: "시선 여백",
            category: target.category || "spaceAndBalance",
            score,
            weight: target.weight ?? 1,
            message: score >= 80
                ? `피사체가 바라보는 쪽에 뒤쪽보다 ${round(ratio, 1)}배 넓은 공간을 남겼어요.`
                : `${directionLabel} 여백을 조금 더 남겨 보세요. 지금은 앞쪽 여백이 뒤쪽의 ${round(ratio, 1)}배예요.`
        };
    }

    function evaluateHorizonPosition(target, photo, crop) {
        const horizon = photo.annotations?.horizon;

        if (!horizon || horizon.y < crop.y || horizon.y > crop.y + crop.height) {
            return {
                id: "horizon-position",
                label: "수평선 위치",
                category: target.category || "alignment",
                score: 0,
                weight: target.weight ?? 1,
                message: "수평선이 크롭 밖으로 잘렸어요. 화면 안에 다시 들어오게 조정해 보세요."
            };
        }

        const localY = (horizon.y - crop.y) / Math.max(crop.height, EPSILON);
        const targetLines = target.target?.lines || [1 / 3, 2 / 3];
        const distance = Math.min(...targetLines.map((line) => Math.abs(localY - line)));
        const score = scoreDistance(
            distance,
            target.target?.excellentDistance ?? 0.04,
            target.target?.maxDistance ?? 0.20
        );

        return {
            id: "horizon-position",
            label: "수평선 위치",
            category: target.category || "alignment",
            score,
            weight: target.weight ?? 1,
            message: score >= 80
                ? `수평선이 화면 위에서 ${round(localY * 100, 1)}% 지점에 놓여 목표 분할선과 잘 맞아요.`
                : `수평선을 삼등분선 쪽으로 조금 더 옮겨 보세요. 현재 위치: 위에서 ${round(localY * 100, 1)}%.`
        };
    }

    function evaluateCropAreaRange(target, photo, crop) {
        const ratio = rectArea(crop);
        const min = target.target?.min ?? 0.2;
        const max = target.target?.max ?? 0.7;
        const softness = target.target?.softness ?? 0.15;
        const score = scoreRange(ratio, min, max, softness);

        return {
            id: "crop-area-range",
            label: target.label || "남긴 범위",
            category: target.category || "spaceAndBalance",
            score,
            weight: target.weight ?? 1,
            message: score >= 80
                ? `원본의 ${round(ratio * 100, 1)}%를 남겼어요. 이 사진에 알맞게 잘라 냈어요.`
                : `지금은 원본의 ${round(ratio * 100, 1)}%가 남아 있어요. ${round(min * 100)}~${round(max * 100)}% 정도가 남도록 조절해 보세요.`
        };
    }

    function evaluateSubjectProminence(target, photo, crop) {
        const subject = getSubject(photo, target.subjectId);

        if (!subject?.bbox) {
            return null;
        }

        const visibleArea = intersectionArea(subject.bbox, crop);
        const prominence = visibleArea / Math.max(rectArea(crop), EPSILON);
        const min = target.target?.min ?? 0.2;
        const max = target.target?.max ?? 0.6;
        const score = scoreRange(prominence, min, max, target.target?.softness ?? 0.12);

        return {
            id: "subject-prominence",
            label: "피사체 크기",
            category: target.category || "spaceAndBalance",
            score,
            weight: target.weight ?? 1,
            message: score >= 80
                ? `주요 피사체가 화면의 ${round(prominence * 100, 1)}%를 차지해 눈에 잘 들어와요.`
                : `주요 피사체가 화면의 ${round(prominence * 100, 1)}%를 차지해요. ${round(min * 100)}~${round(max * 100)}% 정도로 보이게 크기를 조절해 보세요.`
        };
    }

    function evaluateLayerProportions(target, photo, crop) {
        const layers = photo.annotations?.layers || [];
        const ranges = target.target?.ranges || {};
        const measured = [];

        layers.forEach((layer) => {
            const range = ranges[layer.id];

            if (!range) {
                return;
            }

            const layerRect = {
                x: layer.x ?? 0,
                y: layer.y,
                width: layer.width ?? 1,
                height: layer.height
            };
            const share = intersectionArea(layerRect, crop) / Math.max(rectArea(crop), EPSILON);
            measured.push({
                id: layer.id,
                label: layer.label || layer.id,
                share,
                score: scoreRange(
                    share,
                    range.min,
                    range.max,
                    range.softness ?? target.target?.softness ?? 0.10
                )
            });
        });

        if (measured.length === 0) {
            return null;
        }

        const score = measured.reduce((sum, item) => sum + item.score, 0) / measured.length;
        const shares = measured
            .map((item) => `${item.label} ${round(item.share * 100)}%`)
            .join(", ");
        const weakestLayer = [...measured].sort((a, b) => a.score - b.score)[0];
        const weakestRange = ranges[weakestLayer.id];

        return {
            id: "layer-proportions",
            label: target.label || "전경·중경·배경",
            category: target.category || "spaceAndBalance",
            score,
            weight: target.weight ?? 1,
            message: score >= 80
                ? `각 층이 고르게 살아 있어 사진의 깊이가 잘 느껴져요. 현재 비율: ${shares}.`
                : `${weakestLayer.label}이 화면의 ${round(weakestLayer.share * 100)}%를 차지해요. ${round(weakestRange.min * 100)}~${round(weakestRange.max * 100)}% 정도로 맞춰 보세요. 전체 비율: ${shares}.`
        };
    }

    function evaluateFramePreservation(target, photo, crop) {
        const frame = (photo.annotations?.frames || [])
            .find((item) => item.id === target.frameId);

        if (!frame?.bbox) {
            return null;
        }

        const visibleRatio = intersectionArea(frame.bbox, crop)
            / Math.max(rectArea(frame.bbox), EPSILON);
        const minimum = target.target?.minVisibleRatio ?? 0.80;
        const score = 100 * clamp(visibleRatio / minimum, 0, 1);

        return {
            id: "frame-preservation",
            label: target.label || "프레임 속 프레임 보존",
            category: target.category || "targetComposition",
            score,
            weight: target.weight ?? 1,
            message: score >= 80
                ? `피사체를 둘러싼 건축 프레임을 ${round(visibleRatio * 100)}% 남겨 형태가 또렷해요.`
                : `주변 건축 프레임이 조금 더 보이게 넓혀 보세요. 지금은 ${round(visibleRatio * 100)}%가 남아 있어요.`
        };
    }

    function evaluateAnnotatedPath(target, photo, crop, collectionName, defaultLabel) {
        const path = (photo.annotations?.[collectionName] || [])
            .find((item) => item.id === target.pathId);
        const points = path?.points || [];

        if (points.length < 2) {
            return null;
        }

        const visiblePoints = points.filter((point) => isPointInsideCrop(point, crop));
        const visibleRatio = visiblePoints.length / points.length;
        const localPoints = visiblePoints.map((point) => toLocalPoint(point, crop));
        let span = 0;

        if (localPoints.length >= 2) {
            const xs = localPoints.map((point) => point.x);
            const ys = localPoints.map((point) => point.y);
            span = Math.hypot(
                Math.max(...xs) - Math.min(...xs),
                Math.max(...ys) - Math.min(...ys)
            );
        }

        const minimumVisible = target.target?.minVisibleRatio ?? 0.75;
        const minimumSpan = target.target?.minSpan ?? 0.30;
        const visibilityScore = 100 * clamp(visibleRatio / minimumVisible, 0, 1);
        const spanScore = 100 * clamp(span / minimumSpan, 0, 1);
        const score = visibilityScore * 0.65 + spanScore * 0.35;

        return {
            id: target.type,
            label: target.label || defaultLabel,
            category: target.category || "targetComposition",
            score,
            weight: target.weight ?? 1,
            message: score >= 80
                ? `${defaultLabel}을 ${round(visibleRatio * 100)}% 남겨 시선의 흐름이 자연스러워요.`
                : `${defaultLabel}이 화면 안에서 더 길게 이어지도록 넓혀 보세요. 지금은 가이드의 ${round(visibleRatio * 100)}%가 남아 있어요.`
        };
    }

    function evaluateCurvePreservation(target, photo, crop) {
        return evaluateAnnotatedPath(
            target,
            photo,
            crop,
            "curves",
            "해안선 곡선"
        );
    }

    function evaluateLeadingLine(target, photo, crop) {
        return evaluateAnnotatedPath(
            target,
            photo,
            crop,
            "lines",
            "리딩 라인"
        );
    }

    function evaluateTarget(target, photo, crop) {
        const evaluators = {
            "rule-of-thirds": evaluateRuleOfThirds,
            centered: evaluateCentered,
            "look-room": evaluateLookRoom,
            "horizon-position": evaluateHorizonPosition,
            "crop-area-range": evaluateCropAreaRange,
            "subject-prominence": evaluateSubjectProminence,
            "layer-proportions": evaluateLayerProportions,
            "frame-preservation": evaluateFramePreservation,
            "curve-preservation": evaluateCurvePreservation,
            "leading-line": evaluateLeadingLine
        };
        const evaluator = evaluators[target.type];

        return evaluator ? evaluator(target, photo, crop) : null;
    }

    function evaluateSubjectPreservation(photo, crop) {
        const subjects = (photo.annotations?.subjects || []).filter((subject) => subject.bbox);

        if (subjects.length === 0) {
            return null;
        }

        let weightedVisible = 0;
        let totalWeight = 0;

        subjects.forEach((subject) => {
            const weight = subject.importance ?? (subject.role === "primary" ? 1 : 0.5);
            const visibleRatio = intersectionArea(subject.bbox, crop) / Math.max(rectArea(subject.bbox), EPSILON);
            weightedVisible += visibleRatio * weight;
            totalWeight += weight;
        });

        const ratio = weightedVisible / Math.max(totalWeight, EPSILON);
        const score = 100 * clamp((ratio - 0.60) / 0.35, 0, 1);

        return {
            id: "subject-preservation",
            label: CATEGORY_LABELS.subjectPreservation,
            category: "subjectPreservation",
            score,
            weight: 1,
            message: ratio >= 0.95
                ? `중요한 피사체를 ${round(ratio * 100, 1)}% 남겨 거의 잘리지 않았어요.`
                : `피사체가 ${round(ratio * 100, 1)}%만 남았어요. 몸이나 중요한 형태가 잘리지 않게 자르는 범위를 넓혀 보세요.`
        };
    }

    function evaluateReferenceSimilarity(photo, crop) {
        const references = photo.referenceCrops || [];

        if (references.length === 0) {
            return null;
        }

        let bestIoU = 0;
        let bestIndex = 0;

        references.forEach((reference, index) => {
            const similarity = rectIoU(crop, reference);

            if (similarity > bestIoU) {
                bestIoU = similarity;
                bestIndex = index;
            }
        });

        return {
            id: "reference-similarity",
            label: CATEGORY_LABELS.referenceSimilarity,
            category: "referenceSimilarity",
            score: bestIoU * 100,
            weight: 1,
            message: `추천 예시 ${bestIndex + 1}번과 겹치는 영역은 ${round(bestIoU * 100, 1)}%예요. 정답 여부가 아니라 두 사각형이 얼마나 비슷한지를 보여 주는 값이에요.`
        };
    }

    function weightedAverage(items) {
        const totalWeight = items.reduce((sum, item) => sum + (item.weight ?? 1), 0);

        if (totalWeight <= EPSILON) {
            return null;
        }

        return items.reduce((sum, item) => sum + item.score * (item.weight ?? 1), 0) / totalWeight;
    }

    function calculateLegacyScore(cropData, imageWidth, imageHeight) {
        const centerX = cropData.x + cropData.width / 2;
        const centerY = cropData.y + cropData.height / 2;
        const imageCenterX = imageWidth / 2;
        const imageCenterY = imageHeight / 2;
        const distance = Math.hypot(centerX - imageCenterX, centerY - imageCenterY);
        const maxDistance = Math.hypot(imageCenterX, imageCenterY);
        const centerScore = Math.max(0, 30 * (1 - distance / maxDistance));
        const areaRatio = cropData.width * cropData.height / (imageWidth * imageHeight);
        const sizeScore = areaRatio < 0.15 ? 10 : areaRatio > 0.75 ? 12 : 25;
        const ratio = cropData.width / cropData.height;
        const ratioScore = Math.max(5, 25 - Math.abs(ratio - 1.5) * 10);
        let edgeScore = 20;

        if (cropData.x < 30) edgeScore -= 5;
        if (cropData.y < 30) edgeScore -= 5;
        if (cropData.x + cropData.width > imageWidth - 30) edgeScore -= 5;
        if (cropData.y + cropData.height > imageHeight - 30) edgeScore -= 5;

        return Math.min(100, Math.round(centerScore + sizeScore + ratioScore + edgeScore));
    }

    function evaluateComposition(photo, cropData, imageWidth, imageHeight) {
        const hasPilotMetadata = Array.isArray(photo?.targetCompositions) && photo.targetCompositions.length > 0;

        if (!hasPilotMetadata) {
            const score = calculateLegacyScore(cropData, imageWidth, imageHeight);

            return {
                version: "legacy-v1",
                annotationBasis: "none",
                score,
                breakdown: [],
                feedback: [{
                    tone: "normal",
                    text: "이 사진은 아직 전용 구도 기준이 없어 자른 위치와 크기를 중심으로 점수를 계산했어요."
                }]
            };
        }

        const crop = normalizeCrop(cropData, imageWidth, imageHeight);
        const criteria = photo.targetCompositions
            .map((target) => evaluateTarget(target, photo, crop))
            .filter(Boolean);
        const preservation = evaluateSubjectPreservation(photo, crop);
        const reference = evaluateReferenceSimilarity(photo, crop);

        if (preservation) criteria.push(preservation);
        if (reference) criteria.push(reference);

        const groups = {};

        criteria.forEach((criterion) => {
            if (!groups[criterion.category]) {
                groups[criterion.category] = [];
            }

            groups[criterion.category].push(criterion);
        });

        const configuredWeights = photo.evaluation?.weights || {};
        const breakdown = Object.entries(groups)
            .map(([key, items]) => ({
                key,
                label: CATEGORY_LABELS[key] || key,
                score: round(weightedAverage(items), 0),
                weight: configuredWeights[key] ?? 1
            }))
            .filter((item) => item.weight > 0);

        const activeWeight = breakdown.reduce((sum, item) => sum + item.weight, 0);
        const total = breakdown.reduce((sum, item) => sum + item.score * item.weight, 0);
        const score = activeWeight > 0 ? Math.round(total / activeWeight) : 0;
        const educationalCriteria = criteria.filter((criterion) => (
            criterion.id !== "reference-similarity"
            && (configuredWeights[criterion.category] ?? 1) > 0
        ));
        const sortedCriteria = [...educationalCriteria].sort((a, b) => b.score - a.score);
        const strongest = sortedCriteria[0];
        const weakest = [...educationalCriteria].sort((a, b) => a.score - b.score)[0];
        const feedback = [];

        if (strongest) {
            feedback.push({
                tone: strongest.score >= 75 ? "good" : "normal",
                text: strongest.message
            });
        }

        if (weakest && weakest.id !== strongest?.id) {
            feedback.push({
                tone: weakest.score >= 75 ? "good" : weakest.score >= 45 ? "normal" : "bad",
                text: weakest.message
            });
        }

        feedback.push({
            tone: "normal",
            text: "AI가 피사체를 자동으로 찾은 점수가 아니에요. 사람이 사진마다 표시한 위치와 구도 규칙을 바탕으로 계산했어요."
        });

        return {
            version: "composition-v2",
            annotationBasis: photo.annotations?.source || "manual",
            score: clamp(score, 0, 100),
            normalizedCrop: crop,
            breakdown,
            criteria: criteria.map((criterion) => ({
                ...criterion,
                score: round(criterion.score, 0)
            })),
            feedback
        };
    }

    return {
        normalizeCrop,
        rectIoU,
        evaluateComposition,
        calculateLegacyScore
    };
});
