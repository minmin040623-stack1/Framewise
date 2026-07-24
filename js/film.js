(function (root, factory) {
    const api = factory();

    if (typeof module === "object" && module.exports) {
        module.exports = api;
    }

    root.FrameWiseFilmLab = api;

    if (typeof document !== "undefined") {
        const start = () => {
            if (document.getElementById("filmFileInput")) {
                api.initFilmLab();
            }
        };

        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", start, { once: true });
        } else {
            start();
        }
    }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
    const MAX_FILE_BYTES = 25 * 1024 * 1024;
    const MAX_SOURCE_PIXELS = 40 * 1000 * 1000;
    const PREVIEW_LONG_EDGE = 1400;
    const ANALYSIS_LONG_EDGE = 192;
    const THUMBNAIL_LONG_EDGE = 360;
    const DESKTOP_EXPORT_PIXELS = 16 * 1000 * 1000;
    const MOBILE_EXPORT_PIXELS = 9 * 1000 * 1000;
    const DESKTOP_EXPORT_EDGE = 4096;
    const MOBILE_EXPORT_EDGE = 3000;
    const ALLOWED_TYPES = new Set([
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp"
    ]);
    const ALLOWED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"]);
    const CATEGORY_LABELS = {
        All: "전체",
        Portrait: "인물",
        Everyday: "일상",
        Vivid: "선명한 색",
        Cinematic: "시네마틱",
        "Black & White": "흑백"
    };

    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    function getCompareState(value) {
        const dividerPercentage = clamp(Number(value) || 0, 0, 100);

        return {
            dividerPercentage,
            originalPercentage: dividerPercentage,
            resultPercentage: 100 - dividerPercentage
        };
    }

    function extensionFromName(name) {
        const match = String(name || "").toLowerCase().match(/\.([a-z0-9]+)$/);
        return match ? match[1] : "";
    }

    function validateFile(file, options = {}) {
        const maxBytes = options.maxBytes ?? MAX_FILE_BYTES;

        if (!file || typeof file.name !== "string") {
            return {
                valid: false,
                code: "missing-file",
                message: "사진 파일을 선택해 주세요."
            };
        }

        if (!Number.isFinite(Number(file.size)) || Number(file.size) <= 0) {
            return {
                valid: false,
                code: "empty-file",
                message: "비어 있는 파일은 열 수 없어요. 다른 사진을 선택해 주세요."
            };
        }

        if (Number(file.size) > maxBytes) {
            return {
                valid: false,
                code: "file-too-large",
                message: "파일이 너무 커요. 25MB 이하의 사진을 선택해 주세요."
            };
        }

        const extension = extensionFromName(file.name);
        const type = String(file.type || "").toLowerCase();

        if (!ALLOWED_EXTENSIONS.has(extension)) {
            return {
                valid: false,
                code: "unsupported-extension",
                message: "JPG, JPEG, PNG, WebP 사진만 사용할 수 있어요."
            };
        }

        if (type && !ALLOWED_TYPES.has(type)) {
            return {
                valid: false,
                code: "unsupported-type",
                message: "지원하지 않는 파일 형식이에요. JPG, PNG 또는 WebP 사진을 선택해 주세요."
            };
        }

        const typeMatchesExtension = !type
            || (type.includes("jpeg") && (extension === "jpg" || extension === "jpeg"))
            || (type === "image/jpg" && (extension === "jpg" || extension === "jpeg"))
            || (type === "image/png" && extension === "png")
            || (type === "image/webp" && extension === "webp");

        if (!typeMatchesExtension) {
            return {
                valid: false,
                code: "type-mismatch",
                message: "파일 이름과 실제 이미지 형식이 맞지 않아요. 원본 사진을 다시 선택해 주세요."
            };
        }

        return { valid: true, code: "ok", message: "" };
    }

    function fitWithin(width, height, options = {}) {
        const safeWidth = Math.max(1, Math.round(Number(width) || 1));
        const safeHeight = Math.max(1, Math.round(Number(height) || 1));
        const maxLongEdge = options.maxLongEdge ?? Infinity;
        const maxPixels = options.maxPixels ?? Infinity;
        const edgeScale = Number.isFinite(maxLongEdge)
            ? Math.min(1, maxLongEdge / Math.max(safeWidth, safeHeight))
            : 1;
        const pixelScale = Number.isFinite(maxPixels)
            ? Math.min(1, Math.sqrt(maxPixels / (safeWidth * safeHeight)))
            : 1;
        const scale = Math.min(edgeScale, pixelScale);

        return {
            width: Math.max(1, Math.round(safeWidth * scale)),
            height: Math.max(1, Math.round(safeHeight * scale)),
            scale
        };
    }

    function slugify(value, fallback = "photo") {
        const slug = String(value || "")
            .normalize("NFKD")
            .replace(/[\u0300-\u036f]/g, "")
            .normalize("NFC")
            .replace(/\.[^.]+$/, "")
            .replace(/[^a-zA-Z0-9가-힣]+/g, "-")
            .replace(/^-+|-+$/g, "")
            .toLowerCase()
            .slice(0, 80);

        return slug || fallback;
    }

    function buildDownloadFilename(originalName, presetId, format = "jpg") {
        const extension = format === "png" ? "png" : "jpg";
        const base = slugify(originalName, "photo");
        const preset = slugify(presetId, "film-inspired");
        return `framewise-${base}-${preset}.${extension}`;
    }

    function createRenderScheduler(callback, options = {}) {
        const requestFrame = options.requestFrame
            || (typeof requestAnimationFrame === "function"
                ? requestAnimationFrame
                : (handler) => setTimeout(handler, 16));
        const cancelFrame = options.cancelFrame
            || (typeof cancelAnimationFrame === "function"
                ? cancelAnimationFrame
                : clearTimeout);
        let frameId = null;
        let latestValue;

        return {
            schedule(value) {
                latestValue = value;

                if (frameId !== null) {
                    return;
                }

                frameId = requestFrame(() => {
                    frameId = null;
                    callback(latestValue);
                });
            },
            cancel() {
                if (frameId !== null) {
                    cancelFrame(frameId);
                    frameId = null;
                }
            },
            get pending() {
                return frameId !== null;
            }
        };
    }

    function formatBytes(bytes) {
        const megabytes = Number(bytes) / (1024 * 1024);
        return megabytes >= 1
            ? `${megabytes.toFixed(megabytes >= 10 ? 0 : 1)}MB`
            : `${Math.max(1, Math.round(Number(bytes) / 1024))}KB`;
    }

    function imageToCanvas(documentRef, image, dimensions) {
        const canvas = documentRef.createElement("canvas");
        canvas.width = dimensions.width;
        canvas.height = dimensions.height;
        const context = canvas.getContext("2d", { alpha: true });

        if (!context) {
            throw new Error("Canvas 2D를 사용할 수 없습니다.");
        }

        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = "high";
        context.drawImage(image, 0, 0, dimensions.width, dimensions.height);
        return canvas;
    }

    function releaseDecodedImage(image) {
        if (!image) return;

        if (typeof image.close === "function") {
            image.close();
            return;
        }

        if ("src" in image) {
            image.src = "";
        }
    }

    function canvasToBlob(canvas, type, quality) {
        return new Promise((resolve, reject) => {
            canvas.toBlob((blob) => {
                if (blob) {
                    resolve(blob);
                } else {
                    reject(new Error("이미지 파일을 만들지 못했습니다."));
                }
            }, type, quality);
        });
    }

    function defaultDecodeImage(file, dependencies) {
        const { ImageCtor, urlApi } = dependencies;

        return new Promise((resolve, reject) => {
            const objectUrl = urlApi.createObjectURL(file);
            const image = new ImageCtor();
            let settled = false;

            const cleanup = () => {
                image.onload = null;
                image.onerror = null;
                urlApi.revokeObjectURL(objectUrl);
            };

            image.onload = () => {
                if (settled) return;
                settled = true;
                cleanup();
                resolve(image);
            };

            image.onerror = () => {
                if (settled) return;
                settled = true;
                cleanup();
                reject(new Error("사진을 읽지 못했어요. 파일이 손상되지 않았는지 확인해 주세요."));
            };

            image.src = objectUrl;
        });
    }

    function initFilmLab(options = {}) {
        const documentRef = options.document
            || (typeof document !== "undefined" ? document : null);
        const windowRef = options.window
            || (typeof window !== "undefined" ? window : null);
        const globalRef = typeof globalThis !== "undefined" ? globalThis : {};
        const presetsApi = options.presetsApi || globalRef.FrameWiseFilmPresets;
        const analysisApi = options.analysisApi || globalRef.FrameWiseImageAnalysis;
        const rendererApi = options.rendererApi || globalRef.FrameWiseFilmRenderer;

        if (!documentRef || !windowRef || !presetsApi || !analysisApi || !rendererApi) {
            throw new Error("Film Lab을 시작하는 데 필요한 모듈을 찾지 못했습니다.");
        }

        const get = (id) => {
            const element = documentRef.getElementById(id);

            if (!element) {
                throw new Error(`Film Lab 요소를 찾지 못했습니다: ${id}`);
            }

            return element;
        };

        const elements = {
            input: get("filmFileInput"),
            dropZone: get("dropZone"),
            workspace: get("filmWorkspace"),
            status: get("workspaceStatus"),
            error: get("fileError"),
            overlay: get("processingOverlay"),
            originalCanvas: get("originalCanvas"),
            resultCanvas: get("resultCanvas"),
            resultClip: get("resultClip"),
            compare: get("compareSlider"),
            compareValue: get("compareValue"),
            fileName: get("fileName"),
            fileDimensions: get("fileDimensions"),
            tasteOptions: get("tasteOptions"),
            tasteStatus: get("tasteStatus"),
            recommendationName: get("recommendationName"),
            recommendationReason: get("recommendationReason"),
            presetFieldset: get("presetFieldset"),
            categoryFilters: get("categoryFilters"),
            presetGrid: get("presetGrid"),
            effect: get("effectStrength"),
            effectValue: get("effectStrengthValue"),
            grain: get("grainStrength"),
            grainValue: get("grainStrengthValue"),
            format: get("formatSelect"),
            reset: get("resetButton"),
            replace: get("replaceButton"),
            download: get("downloadButton")
        };
        elements.comparisonFrame = elements.resultClip.closest(".film-comparison-frame");
        const urlApi = options.urlApi || windowRef.URL;
        const ImageCtor = options.ImageCtor || windowRef.Image;
        const decodeImage = options.decodeImage
            || ((file) => defaultDecodeImage(file, { ImageCtor, urlApi }));
        const requestFrame = options.requestFrame
            || windowRef.requestAnimationFrame.bind(windowRef);
        const cancelFrame = options.cancelFrame
            || windowRef.cancelAnimationFrame.bind(windowRef);
        const presets = presetsApi.presets || [];
        const renderer = options.renderer
            || rendererApi.createRenderer({ document: documentRef });
        let preferenceStorage = options.preferenceStorage || null;

        if (!preferenceStorage) {
            try {
                preferenceStorage = windowRef.localStorage;
            } catch (_error) {
                preferenceStorage = null;
            }
        }

        const storedTaste = (() => {
            try {
                return preferenceStorage?.getItem("framewiseFilmTaste") || "auto";
            } catch (_error) {
                return "auto";
            }
        })();
        const cardElements = new Map();
        let generation = 0;
        let renderRevision = 0;
        let state = "empty";
        let activeCategory = "All";
        let currentTaste = analysisApi.normalizeTasteId
            ? analysisApi.normalizeTasteId(storedTaste)
            : "auto";
        let selectedPresetId = presets[0]?.id || "";
        let recommendation = null;
        let current = null;
        let destroyed = false;

        function showError(message) {
            elements.error.textContent = message || "";
            elements.error.hidden = !message;
        }

        function setState(nextState, message = "") {
            state = nextState;
            const hasPhoto = Boolean(current);
            const isLoading = nextState === "loading";
            const isExporting = nextState === "exporting";
            const controlsDisabled = !hasPhoto || isLoading || isExporting || nextState === "error";

            elements.workspace.hidden = !hasPhoto && (nextState === "empty" || nextState === "error");
            elements.workspace.setAttribute("aria-busy", String(isLoading || isExporting));
            elements.overlay.hidden = !(isLoading || isExporting);
            elements.presetFieldset.disabled = controlsDisabled;
            elements.effect.disabled = controlsDisabled;
            elements.grain.disabled = controlsDisabled;
            elements.compare.disabled = controlsDisabled;
            elements.format.disabled = controlsDisabled;
            elements.reset.disabled = controlsDisabled;
            elements.download.disabled = controlsDisabled;
            elements.replace.disabled = isLoading || isExporting;
            elements.input.disabled = isLoading || isExporting;
            elements.dropZone.setAttribute("aria-disabled", String(isLoading || isExporting));

            if (message) {
                elements.status.textContent = message;
            }

            elements.status.dataset.state = nextState;
        }

        function setCompare(value) {
            const {
                dividerPercentage,
                originalPercentage,
                resultPercentage
            } = getCompareState(value);
            elements.compare.value = String(dividerPercentage);
            elements.comparisonFrame.style.setProperty(
                "--film-compare-position",
                `${dividerPercentage}%`
            );
            elements.compareValue.value = `결과 ${Math.round(resultPercentage)}%`;
            elements.compare.setAttribute(
                "aria-valuetext",
                `원본 ${Math.round(originalPercentage)}%, 결과 ${Math.round(resultPercentage)}%`
            );
        }

        function setEffectValue(value) {
            const percentage = clamp(Number(value) || 0, 0, 100);
            elements.effect.value = String(percentage);
            elements.effectValue.value = `${Math.round(percentage)}%`;
        }

        function setGrainValue(value) {
            const percentage = clamp(Number(value) || 0, 0, 100);
            elements.grain.value = String(percentage);
            elements.grainValue.value = `${Math.round(percentage)}%`;
        }

        function getControls() {
            return {
                intensity: clamp(Number(elements.effect.value) / 100, 0, 1),
                grain: clamp(Number(elements.grain.value) / 100, 0, 1),
                seed: current?.seed ?? 0
            };
        }

        function getResolvedPreset(presetId, controls = getControls()) {
            return presetsApi.resolveParameters(
                presetId,
                controls.intensity,
                controls.grain
            );
        }

        function updateSelectedCard() {
            cardElements.forEach((card, id) => {
                const selected = id === selectedPresetId;
                card.option.classList.toggle("is-selected", selected);
                card.option.dataset.selected = String(selected);
                card.input.checked = selected;
            });
        }

        function selectPreset(presetId, options = {}) {
            const preset = presetsApi.getPreset(presetId);

            if (!preset) {
                return;
            }

            selectedPresetId = preset.id;

            if (options.useDefaultGrain !== false) {
                setGrainValue((preset.grain?.default ?? 0) * 100);
            }

            updateSelectedCard();
        }

        function applyCategory(category) {
            activeCategory = category;

            cardElements.forEach((card) => {
                card.option.hidden = category !== "All"
                    && card.preset.category !== category;
            });

            [...elements.categoryFilters.querySelectorAll("button")].forEach((button) => {
                const active = button.dataset.category === category;
                button.classList.toggle("is-active", active);
                button.setAttribute("aria-pressed", String(active));
            });
        }

        function updateTasteOptions() {
            [...elements.tasteOptions.querySelectorAll("button")].forEach((button) => {
                const active = button.dataset.tasteId === currentTaste;
                button.classList.toggle("is-active", active);
                button.setAttribute("aria-pressed", String(active));
            });

            const profile = analysisApi.getTasteProfile
                ? analysisApi.getTasteProfile(currentTaste)
                : { label: "사진에 맞춰 추천" };
            elements.tasteStatus.textContent = currentTaste === "auto"
                ? "사진의 밝기와 색만 보고 추천해요. 사진과 선택 기록은 저장하지 않아요."
                : `‘${profile.label}’ 취향을 이 브라우저에만 기억해요. 사진은 저장하지 않아요.`;
        }

        function persistTaste() {
            try {
                preferenceStorage?.setItem("framewiseFilmTaste", currentTaste);
            } catch (_error) {
                // A blocked storage API must not stop local image editing.
            }
        }

        function setTaste(tasteId, options = {}) {
            currentTaste = analysisApi.normalizeTasteId
                ? analysisApi.normalizeTasteId(tasteId)
                : "auto";

            if (options.persist !== false) {
                persistTaste();
            }

            updateTasteOptions();

            if (!current?.metrics || options.updateRecommendation === false) {
                return;
            }

            const nextRecommendation = analysisApi.recommendPreset(
                current.metrics,
                currentTaste
            );
            renderRecommendation(nextRecommendation);
            selectPreset(recommendation.presetId || presets[0]?.id);
            setEffectValue((recommendation.intensity ?? 0.76) * 100);
            renderScheduler.schedule();
        }

        function createTasteOptions() {
            const profiles = analysisApi.tasteProfiles || [];

            profiles.forEach((profile) => {
                const button = documentRef.createElement("button");
                button.type = "button";
                button.className = "film-taste-option";
                button.dataset.tasteId = profile.id;
                button.textContent = profile.label;
                button.title = profile.description;
                button.setAttribute("aria-pressed", "false");
                elements.tasteOptions.append(button);
            });

            updateTasteOptions();
        }

        function createCategoryFilters() {
            const sourceCategories = presetsApi.categories?.length
                ? presetsApi.categories
                : [...new Set(presets.map((preset) => preset.category))];
            const categories = ["All", ...sourceCategories.filter(Boolean)];

            categories.forEach((category) => {
                const button = documentRef.createElement("button");
                button.type = "button";
                button.className = "film-category-filter";
                button.dataset.category = category;
                button.textContent = CATEGORY_LABELS[category] || category;
                button.setAttribute("aria-pressed", String(category === "All"));
                button.addEventListener("click", () => applyCategory(category));
                elements.categoryFilters.appendChild(button);
            });
        }

        function createPresetCards() {
            presets.forEach((preset) => {
                const option = documentRef.createElement("label");
                const input = documentRef.createElement("input");
                const canvas = documentRef.createElement("canvas");
                const body = documentRef.createElement("span");
                const heading = documentRef.createElement("span");
                const name = documentRef.createElement("strong");
                const check = documentRef.createElement("span");
                const description = documentRef.createElement("span");
                const recommended = documentRef.createElement("span");

                option.className = "film-preset-card";
                option.dataset.category = preset.category;
                input.className = "film-preset-input";
                input.type = "radio";
                input.name = "filmPreset";
                input.value = preset.id;
                input.id = `film-preset-${preset.id}`;
                input.disabled = true;
                canvas.className = "film-preset-preview";
                canvas.dataset.presetId = preset.id;
                canvas.setAttribute("role", "img");
                canvas.setAttribute("aria-label", `${preset.name} 미리보기`);
                body.className = "film-preset-copy";
                heading.className = "film-preset-heading";
                name.className = "film-preset-name";
                check.className = "film-preset-check";
                check.textContent = "선택";
                description.className = "film-preset-description";
                recommended.className = "film-preset-recommended";
                name.textContent = preset.name;
                description.textContent = preset.description;
                recommended.textContent = `추천: ${preset.recommendedFor}`;

                heading.append(name, check);
                body.append(heading, description, recommended);
                option.append(input, canvas, body);
                elements.presetGrid.appendChild(option);
                cardElements.set(preset.id, { option, input, canvas, preset });
            });
        }

        function clearCanvas(canvas) {
            const context = canvas.getContext("2d");

            if (context) {
                context.clearRect(0, 0, canvas.width, canvas.height);
            }
        }

        function releaseCurrentPreview() {
            if (!current?.previewSource) {
                return;
            }

            current.previewSource.width = 1;
            current.previewSource.height = 1;
        }

        function analyzePreview(previewSource) {
            const dimensions = fitWithin(previewSource.width, previewSource.height, {
                maxLongEdge: ANALYSIS_LONG_EDGE
            });
            const analysisCanvas = documentRef.createElement("canvas");
            analysisCanvas.width = dimensions.width;
            analysisCanvas.height = dimensions.height;
            const context = analysisCanvas.getContext("2d", {
                alpha: true,
                willReadFrequently: true
            });

            if (!context) {
                throw new Error("사진의 색과 밝기를 분석할 수 없습니다.");
            }

            context.drawImage(
                previewSource,
                0,
                0,
                dimensions.width,
                dimensions.height
            );
            const imageData = context.getImageData(
                0,
                0,
                dimensions.width,
                dimensions.height
            );
            const metrics = analysisApi.analyzeImageData(imageData);
            const result = analysisApi.recommendPreset(metrics, currentTaste);
            analysisCanvas.width = 1;
            analysisCanvas.height = 1;
            return { metrics, result };
        }

        function renderRecommendation(result) {
            const presetId = typeof result === "string"
                ? result
                : result?.presetId || result?.id;
            const preset = presetsApi.getPreset(presetId) || presets[0];
            const reason = typeof result === "object" && result?.reason
                ? result.reason
                : "사진의 밝기와 색 분포를 기준으로 가장 가까운 스타일을 골랐어요.";

            recommendation = {
                presetId: preset?.id || "",
                reason,
                intensity: Number.isFinite(result?.intensity)
                    ? clamp(result.intensity, 0, 1)
                    : 0.76,
                tasteId: result?.tasteId || currentTaste,
                preferenceSource: result?.preferenceSource || "photo"
            };
            elements.recommendationName.textContent = preset?.name || "추천 준비 중";
            elements.recommendationReason.textContent = reason;
            cardElements.forEach((card, id) => {
                card.option.classList.toggle("is-recommended", id === preset?.id);
            });
        }

        function configureDisplayCanvases(previewSource) {
            const { width, height } = previewSource;
            elements.originalCanvas.width = width;
            elements.originalCanvas.height = height;
            elements.resultCanvas.width = width;
            elements.resultCanvas.height = height;
            const context = elements.originalCanvas.getContext("2d", { alpha: true });

            if (!context) {
                throw new Error("원본 미리보기를 표시할 수 없습니다.");
            }

            context.clearRect(0, 0, width, height);
            context.drawImage(previewSource, 0, 0);
            elements.workspace.style.setProperty("--film-image-ratio", `${width} / ${height}`);
        }

        async function renderToCanvas(canvas, presetId, controls) {
            const resolved = getResolvedPreset(presetId, controls);
            await Promise.resolve(renderer.renderTo(canvas, resolved, {
                seed: controls.seed
            }));
        }

        async function renderSelectedPreview(expectedGeneration = generation) {
            if (!current || destroyed || expectedGeneration !== generation) {
                return;
            }

            const revision = ++renderRevision;
            const controls = getControls();

            try {
                await renderToCanvas(elements.resultCanvas, selectedPresetId, controls);

                if (revision !== renderRevision || expectedGeneration !== generation) {
                    return;
                }

                showError("");
                elements.status.textContent = `${presetsApi.getPreset(selectedPresetId).name} 조정을 미리보기에 반영했어요.`;
            } catch (error) {
                showError(error.message || "필름 효과를 표시하지 못했습니다.");
            }
        }

        const renderScheduler = createRenderScheduler(
            () => renderSelectedPreview(generation),
            { requestFrame, cancelFrame }
        );

        function nextFrame() {
            return new Promise((resolve) => requestFrame(resolve));
        }

        async function renderThumbnails(expectedGeneration) {
            if (!current || expectedGeneration !== generation) {
                return;
            }

            const dimensions = fitWithin(
                current.previewSource.width,
                current.previewSource.height,
                {
                    maxLongEdge: renderer.mode === "canvas2d"
                        ? 320
                        : THUMBNAIL_LONG_EDGE
                }
            );
            let index = 0;

            for (const preset of presets) {
                if (expectedGeneration !== generation || destroyed) {
                    return;
                }

                const card = cardElements.get(preset.id);
                card.canvas.width = dimensions.width;
                card.canvas.height = dimensions.height;
                await renderToCanvas(card.canvas, preset.id, {
                    intensity: 1,
                    grain: preset.grain?.default ?? 0,
                    seed: current.seed
                });
                index += 1;

                if (index % 2 === 0) {
                    await nextFrame();
                }
            }
        }

        async function handleFile(file) {
            const validation = validateFile(file);

            if (!validation.valid) {
                showError(validation.message);
                setState(current ? "ready" : "error", validation.message);
                return false;
            }

            const requestGeneration = ++generation;
            renderScheduler.cancel();
            renderRevision += 1;
            showError("");
            setState("loading", "사진을 열고 필름 미리보기를 만들고 있어요.");

            try {
                const image = await decodeImage(file);

                if (requestGeneration !== generation || destroyed) {
                    return false;
                }

                const width = Number(image.naturalWidth || image.width);
                const height = Number(image.naturalHeight || image.height);

                if (!width || !height) {
                    releaseDecodedImage(image);
                    throw new Error("사진의 가로세로 크기를 확인하지 못했습니다.");
                }

                if (width * height > MAX_SOURCE_PIXELS) {
                    releaseDecodedImage(image);
                    throw new Error("사진 해상도가 너무 커요. 4천만 화소 이하의 사진을 선택해 주세요.");
                }

                const previewDimensions = fitWithin(width, height, {
                    maxLongEdge: renderer.mode === "canvas2d"
                        ? 1200
                        : PREVIEW_LONG_EDGE
                });
                let previewSource;

                try {
                    previewSource = imageToCanvas(
                        documentRef,
                        image,
                        previewDimensions
                    );
                } finally {
                    releaseDecodedImage(image);
                }
                const previous = current;
                const seed = rendererApi.seedFromFile
                    ? rendererApi.seedFromFile(file)
                    : 0;

                current = {
                    file,
                    width,
                    height,
                    previewSource,
                    previewDimensions,
                    seed,
                    metrics: null
                };

                await Promise.resolve(renderer.setSource(previewSource, {
                    width: previewDimensions.width,
                    height: previewDimensions.height,
                    seed
                }));

                if (previous?.previewSource) {
                    previous.previewSource.width = 1;
                    previous.previewSource.height = 1;
                }

                configureDisplayCanvases(previewSource);
                elements.fileName.textContent = file.name;
                elements.fileDimensions.textContent = [
                    `${width.toLocaleString()} × ${height.toLocaleString()}px`,
                    formatBytes(file.size),
                    `미리보기 ${previewDimensions.width} × ${previewDimensions.height}px`
                ].join(" · ");

                const analysis = analyzePreview(previewSource);
                current.metrics = analysis.metrics;
                renderRecommendation(analysis.result);
                selectPreset(recommendation.presetId || presets[0]?.id);
                setEffectValue((recommendation.intensity ?? 0.76) * 100);
                setCompare(50);

                await renderSelectedPreview(requestGeneration);
                await renderThumbnails(requestGeneration);

                if (requestGeneration !== generation || destroyed) {
                    return false;
                }

                cardElements.forEach((card) => {
                    card.input.disabled = false;
                });
                elements.workspace.hidden = false;
                setState(
                    "ready",
                    `${presets.length}가지 Inspired 필름 스타일을 준비했어요. 마음에 드는 결과를 골라 보세요.`
                );
                return true;
            } catch (error) {
                if (requestGeneration !== generation || destroyed) {
                    return false;
                }

                const message = error.message || "사진을 처리하지 못했습니다.";
                showError(message);
                setState(current ? "ready" : "error", message);
                return false;
            }
        }

        function resetControls() {
            if (!current) {
                return;
            }

            applyCategory("All");
            selectPreset(recommendation?.presetId || presets[0]?.id);
            setEffectValue((recommendation?.intensity ?? 0.76) * 100);
            setCompare(50);
            renderScheduler.schedule();
            elements.status.textContent = "추천 프리셋과 기본 강도로 되돌렸어요.";
        }

        async function downloadCurrent() {
            if (!current || state === "exporting") {
                return;
            }

            const downloadGeneration = generation;
            const preset = presetsApi.getPreset(selectedPresetId);
            const format = elements.format.value === "image/png" ? "png" : "jpg";
            const type = format === "png" ? "image/png" : "image/jpeg";
            const limitedDevice = Number(windowRef.navigator?.deviceMemory || 8) <= 4;
            const canvasFallback = renderer.mode === "canvas2d";
            const limits = {
                maxLongEdge: canvasFallback
                    ? 2400
                    : limitedDevice ? MOBILE_EXPORT_EDGE : DESKTOP_EXPORT_EDGE,
                maxPixels: canvasFallback
                    ? 4 * 1000 * 1000
                    : limitedDevice ? MOBILE_EXPORT_PIXELS : DESKTOP_EXPORT_PIXELS,
                maxTextureSize: renderer.maxTextureSize
            };
            const fitFunction = rendererApi.fitDimensions || fitWithin;
            const outputDimensions = fitFunction(
                current.width,
                current.height,
                limits
            );
            let exportSource = null;
            let exportCanvas = null;

            setState("exporting", "원본 비율을 유지해 다운로드 이미지를 만들고 있어요.");
            showError("");

            try {
                const image = await decodeImage(current.file);

                if (downloadGeneration !== generation || destroyed) {
                    return;
                }

                try {
                    exportSource = imageToCanvas(
                        documentRef,
                        image,
                        outputDimensions
                    );
                } finally {
                    releaseDecodedImage(image);
                }
                exportCanvas = documentRef.createElement("canvas");
                exportCanvas.width = outputDimensions.width;
                exportCanvas.height = outputDimensions.height;
                await Promise.resolve(renderer.setSource(exportSource, {
                    width: outputDimensions.width,
                    height: outputDimensions.height,
                    seed: current.seed
                }));
                await renderToCanvas(
                    exportCanvas,
                    selectedPresetId,
                    getControls()
                );

                let blobCanvas = exportCanvas;

                if (type === "image/jpeg") {
                    const opaqueCanvas = documentRef.createElement("canvas");
                    opaqueCanvas.width = exportCanvas.width;
                    opaqueCanvas.height = exportCanvas.height;
                    const opaqueContext = opaqueCanvas.getContext("2d");
                    opaqueContext.fillStyle = "#FFFFFF";
                    opaqueContext.fillRect(0, 0, opaqueCanvas.width, opaqueCanvas.height);
                    opaqueContext.drawImage(exportCanvas, 0, 0);
                    blobCanvas = opaqueCanvas;
                }

                const blob = await canvasToBlob(
                    blobCanvas,
                    type,
                    type === "image/jpeg" ? 0.92 : undefined
                );
                const objectUrl = urlApi.createObjectURL(blob);
                const link = documentRef.createElement("a");
                link.href = objectUrl;
                link.download = buildDownloadFilename(
                    current.file.name,
                    preset.id,
                    format
                );
                link.hidden = true;
                documentRef.body.appendChild(link);
                link.click();
                link.remove();
                windowRef.setTimeout(() => urlApi.revokeObjectURL(objectUrl), 0);

                const resized = outputDimensions.width !== current.width
                    || outputDimensions.height !== current.height;
                elements.status.textContent = resized
                    ? `기기 메모리를 고려해 ${outputDimensions.width} × ${outputDimensions.height}px로 저장했어요.`
                    : `${outputDimensions.width} × ${outputDimensions.height}px 원본 크기로 저장했어요.`;
            } catch (error) {
                showError(error.message || "이미지를 다운로드하지 못했습니다.");
            } finally {
                if (exportSource) {
                    exportSource.width = 1;
                    exportSource.height = 1;
                }

                if (exportCanvas) {
                    exportCanvas.width = 1;
                    exportCanvas.height = 1;
                }

                if (current && downloadGeneration === generation && !destroyed) {
                    await Promise.resolve(renderer.setSource(current.previewSource, {
                        width: current.previewSource.width,
                        height: current.previewSource.height,
                        seed: current.seed
                    }));
                    setState("ready");
                }
            }
        }

        function handleDroppedFiles(fileList) {
            const files = Array.from(fileList || []);

            if (files.length === 0) {
                return;
            }

            if (files.length > 1) {
                elements.status.textContent = "한 번에 한 장만 처리해요. 첫 번째 사진을 열었습니다.";
            }

            handleFile(files[0]);
        }

        function preventDropDefaults(event) {
            event.preventDefault();
            event.stopPropagation();
        }

        function destroy() {
            if (destroyed) {
                return;
            }

            destroyed = true;
            generation += 1;
            renderRevision += 1;
            renderScheduler.cancel();
            releaseCurrentPreview();
            renderer.dispose();
            clearCanvas(elements.originalCanvas);
            clearCanvas(elements.resultCanvas);
            current = null;
        }

        createTasteOptions();
        createCategoryFilters();
        createPresetCards();
        applyCategory("All");
        setEffectValue(100);
        setGrainValue(0);
        setCompare(50);
        setState("empty", "사진을 올리면 필름 미리보기가 여기에 나타나요.");

        elements.input.addEventListener("change", () => {
            const [file] = elements.input.files || [];

            if (file) {
                handleFile(file);
            }
        });

        ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
            elements.dropZone.addEventListener(eventName, preventDropDefaults);
        });

        ["dragenter", "dragover"].forEach((eventName) => {
            elements.dropZone.addEventListener(eventName, () => {
                if (!elements.input.disabled) {
                    elements.dropZone.classList.add("is-dragover");
                }
            });
        });

        ["dragleave", "drop"].forEach((eventName) => {
            elements.dropZone.addEventListener(eventName, () => {
                elements.dropZone.classList.remove("is-dragover");
            });
        });

        elements.dropZone.addEventListener("drop", (event) => {
            if (!elements.input.disabled) {
                handleDroppedFiles(event.dataTransfer?.files);
            }
        });

        elements.presetGrid.addEventListener("change", (event) => {
            const input = event.target.closest("input[name='filmPreset']");

            if (!input || !current) {
                return;
            }

            selectPreset(input.value);
            renderScheduler.schedule();
        });

        elements.tasteOptions.addEventListener("click", (event) => {
            const button = event.target.closest("button[data-taste-id]");

            if (button) {
                setTaste(button.dataset.tasteId);
            }
        });

        elements.effect.addEventListener("input", () => {
            setEffectValue(elements.effect.value);
            renderScheduler.schedule();
        });

        elements.grain.addEventListener("input", () => {
            setGrainValue(elements.grain.value);
            renderScheduler.schedule();
        });

        elements.compare.addEventListener("input", () => {
            setCompare(elements.compare.value);
        });

        elements.reset.addEventListener("click", resetControls);
        elements.replace.addEventListener("click", () => {
            elements.input.value = "";
            elements.input.click();
        });
        elements.download.addEventListener("click", downloadCurrent);
        windowRef.addEventListener("beforeunload", destroy, { once: true });

        return {
            handleFile,
            resetControls,
            downloadCurrent,
            destroy,
            getState: () => ({
                state,
                selectedPresetId,
                activeCategory,
                tasteId: currentTaste,
                hasPhoto: Boolean(current)
            })
        };
    }

    return {
        MAX_FILE_BYTES,
        MAX_SOURCE_PIXELS,
        validateFile,
        fitWithin,
        getCompareState,
        buildDownloadFilename,
        createRenderScheduler,
        initFilmLab
    };
});
