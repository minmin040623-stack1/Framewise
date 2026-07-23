(function (root, factory) {
    const api = factory();

    if (typeof module === "object" && module.exports) {
        module.exports = api;
    }

    root.FrameWiseFilmRenderer = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
    "use strict";

    const PREVIEW_MAX_LONG_EDGE = 1400;
    const THUMBNAIL_MAX_LONG_EDGE = 360;
    const EXPORT_MAX_PIXELS = 16_000_000;
    const DEFAULT_CANVAS_TEXTURE_LIMIT = 16384;
    const IDENTITY_MATRIX = Object.freeze([
        1, 0, 0,
        0, 1, 0,
        0, 0, 1
    ]);

    const VERTEX_SHADER = `
        attribute vec2 a_position;
        varying vec2 v_uv;

        void main() {
            v_uv = a_position * 0.5 + 0.5;
            gl_Position = vec4(a_position, 0.0, 1.0);
        }
    `;

    const FRAGMENT_SHADER = `
        precision mediump float;

        varying vec2 v_uv;

        uniform sampler2D u_source;
        uniform vec2 u_outputSize;
        uniform mat3 u_colorMatrix;
        uniform vec3 u_channelOffset;
        uniform float u_exposure;
        uniform float u_contrast;
        uniform float u_saturation;
        uniform float u_temperature;
        uniform float u_tint;
        uniform vec4 u_selectiveSaturation;
        uniform float u_gamma;
        uniform float u_toe;
        uniform float u_shoulder;
        uniform float u_blackPoint;
        uniform vec3 u_shadowTint;
        uniform float u_shadowTintAmount;
        uniform vec3 u_highlightTint;
        uniform float u_highlightTintAmount;
        uniform float u_monochrome;
        uniform float u_grainAmount;
        uniform float u_grainSize;
        uniform float u_seed;
        uniform float u_vignette;
        uniform float u_bloom;
        uniform float u_halation;
        uniform vec3 u_halationTint;
        uniform float u_highlightThreshold;
        uniform float u_glowRadius;

        float luminance(vec3 color) {
            return dot(color, vec3(0.2126, 0.7152, 0.0722));
        }

        float hash21(vec2 value) {
            vec3 p3 = fract(vec3(value.xyx) * 0.1031 + u_seed * 0.000013);
            p3 += dot(p3, p3.yzx + 33.33);
            return fract((p3.x + p3.y) * p3.z);
        }

        float toneCurve(float value) {
            float denominator = max(1.0 - u_blackPoint, 0.001);
            float curved = max((value - u_blackPoint) / denominator, 0.0);
            curved = pow(curved, max(u_gamma, 0.05));

            float smoothValue = smoothstep(0.0, 1.0, clamp(curved, 0.0, 1.0));
            curved = mix(curved, smoothValue, clamp(u_toe, 0.0, 1.0));

            float shoulderInput = max(curved - 0.45, 0.0);
            curved /= 1.0 + max(u_shoulder, 0.0) * shoulderInput * 2.0;
            return curved;
        }

        vec3 brightSample(vec2 coordinate) {
            vec3 sampleColor = texture2D(u_source, clamp(coordinate, 0.0, 1.0)).rgb;
            float brightness = smoothstep(
                u_highlightThreshold,
                min(1.0, u_highlightThreshold + 0.24),
                luminance(sampleColor)
            );
            return sampleColor * brightness;
        }

        void main() {
            vec4 sourceSample = texture2D(u_source, v_uv);
            vec3 original = sourceSample.rgb;
            vec3 color = u_colorMatrix * original + u_channelOffset;

            color *= exp2(u_exposure);
            color += vec3(
                u_temperature * 0.08 + u_tint * 0.025,
                -u_tint * 0.04,
                -u_temperature * 0.08 + u_tint * 0.025
            );
            color = (color - 0.5) * u_contrast + 0.5;

            float baseLuma = luminance(color);
            color = vec3(baseLuma) + (color - vec3(baseLuma)) * u_saturation;

            float redMask = smoothstep(0.0, 0.35, color.r - max(color.g, color.b));
            float greenMask = smoothstep(0.0, 0.35, color.g - max(color.r, color.b));
            float blueMask = smoothstep(0.0, 0.35, color.b - max(color.r, color.g));
            float cyanMask = smoothstep(0.0, 0.35, min(color.g, color.b) - color.r);
            float selectiveAmount = dot(
                vec4(redMask, greenMask, blueMask, cyanMask),
                u_selectiveSaturation
            );
            baseLuma = luminance(color);
            color = vec3(baseLuma)
                + (color - vec3(baseLuma)) * max(0.0, 1.0 + selectiveAmount);

            color = vec3(
                toneCurve(color.r),
                toneCurve(color.g),
                toneCurve(color.b)
            );

            float gradedLuma = luminance(color);
            float shadowWeight = 1.0 - smoothstep(0.08, 0.58, gradedLuma);
            float highlightWeight = smoothstep(0.45, 0.96, gradedLuma);
            color += (u_shadowTint - vec3(0.5))
                * u_shadowTintAmount * shadowWeight;
            color += (u_highlightTint - vec3(0.5))
                * u_highlightTintAmount * highlightWeight;

            float monochromeLuma = dot(color, vec3(0.24, 0.68, 0.08));
            color = mix(color, vec3(monochromeLuma), u_monochrome);

            if (u_bloom > 0.0001 || u_halation > 0.0001) {
                vec2 stepSize = vec2(1.0) / max(u_outputSize, vec2(1.0));
                stepSize *= max(u_glowRadius, 0.5);

                vec3 glow = brightSample(v_uv) * 0.20;
                glow += brightSample(v_uv + vec2(stepSize.x, 0.0)) * 0.10;
                glow += brightSample(v_uv - vec2(stepSize.x, 0.0)) * 0.10;
                glow += brightSample(v_uv + vec2(0.0, stepSize.y)) * 0.10;
                glow += brightSample(v_uv - vec2(0.0, stepSize.y)) * 0.10;
                glow += brightSample(v_uv + stepSize) * 0.10;
                glow += brightSample(v_uv - stepSize) * 0.10;
                glow += brightSample(v_uv + vec2(stepSize.x, -stepSize.y)) * 0.10;
                glow += brightSample(v_uv + vec2(-stepSize.x, stepSize.y)) * 0.10;

                float centerHighlight = smoothstep(
                    u_highlightThreshold,
                    min(1.0, u_highlightThreshold + 0.24),
                    luminance(original)
                );
                float haloRing = max(luminance(glow) - centerHighlight * 0.42, 0.0);

                color += glow * u_bloom * 0.32;
                color += u_halationTint * haloRing * u_halation * 0.90;
            }

            vec2 centered = (v_uv - 0.5) * 2.0;
            float edgeDistance = length(centered);
            float vignetteMask = smoothstep(0.48, 1.32, edgeDistance);
            color *= 1.0 - vignetteMask * u_vignette;

            if (u_grainAmount > 0.0001) {
                vec2 grainCell = floor(
                    v_uv * u_outputSize / max(u_grainSize, 0.75)
                );
                float grain = hash21(grainCell) - 0.5;
                float grainResponse = mix(
                    1.15,
                    0.35,
                    smoothstep(0.22, 0.93, luminance(color))
                );
                color += grain * u_grainAmount * grainResponse;
            }

            gl_FragColor = vec4(clamp(color, 0.0, 1.0), sourceSample.a);
        }
    `;

    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    function finiteNumber(value, fallback) {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : fallback;
    }

    function positiveLimit(value, fallback) {
        const parsed = Number(value);
        return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
    }

    function fitDimensions(width, height, options = {}) {
        const sourceWidth = Number(width);
        const sourceHeight = Number(height);

        if (!Number.isFinite(sourceWidth) || !Number.isFinite(sourceHeight)
            || sourceWidth <= 0 || sourceHeight <= 0) {
            throw new TypeError("Image dimensions must be finite positive numbers.");
        }

        const maxLongEdge = positiveLimit(options.maxLongEdge, Infinity);
        const maxPixels = positiveLimit(options.maxPixels, Infinity);
        const maxTextureSize = positiveLimit(options.maxTextureSize, Infinity);
        const longEdge = Math.max(sourceWidth, sourceHeight);
        const pixelCount = sourceWidth * sourceHeight;
        const scale = Math.min(
            1,
            maxLongEdge / longEdge,
            Math.sqrt(maxPixels / pixelCount),
            maxTextureSize / sourceWidth,
            maxTextureSize / sourceHeight
        );
        const fittedWidth = Math.max(1, Math.floor(sourceWidth * scale));
        const fittedHeight = Math.max(1, Math.floor(sourceHeight * scale));

        return {
            width: fittedWidth,
            height: fittedHeight,
            scale,
            resized: scale < 0.999999
        };
    }

    function fnv1a(value) {
        let hash = 0x811c9dc5;

        for (let index = 0; index < value.length; index += 1) {
            hash ^= value.charCodeAt(index);
            hash = Math.imul(hash, 0x01000193);
        }

        return hash >>> 0;
    }

    function seedFromFile(file) {
        const identity = [
            file?.name || "",
            finiteNumber(file?.size, 0),
            file?.type || "",
            finiteNumber(file?.lastModified, 0)
        ].join("|");

        return fnv1a(identity);
    }

    function normalizeUnit(value, fallback) {
        const parsed = finiteNumber(value, fallback);

        if (!Number.isFinite(parsed)) {
            return fallback;
        }

        return clamp(Math.abs(parsed) > 1 ? parsed / 100 : parsed, 0, 1);
    }

    function vector(value, length, fallback) {
        if (!Array.isArray(value) && !ArrayBuffer.isView(value)) {
            return [...fallback];
        }

        const result = [];

        for (let index = 0; index < length; index += 1) {
            result.push(finiteNumber(value[index], fallback[index]));
        }

        return result;
    }

    function firstDefined(...values) {
        return values.find((value) => value !== undefined && value !== null);
    }

    function firstFinite(fallback, ...values) {
        for (const value of values) {
            const parsed = Number(value);

            if (Number.isFinite(parsed)) {
                return parsed;
            }
        }

        return fallback;
    }

    function tintData(value, explicitAmount, fallbackColor) {
        if (Array.isArray(value) || ArrayBuffer.isView(value)) {
            return {
                color: vector(value, 3, fallbackColor),
                amount: firstFinite(0, explicitAmount)
            };
        }

        if (value && typeof value === "object") {
            return {
                color: vector(
                    firstDefined(value.color, value.rgb),
                    3,
                    fallbackColor
                ),
                amount: firstFinite(0, explicitAmount, value.amount, value.strength)
            };
        }

        return {
            color: [...fallbackColor],
            amount: firstFinite(0, explicitAmount)
        };
    }

    function selectiveData(value) {
        if (Array.isArray(value) || ArrayBuffer.isView(value)) {
            const result = vector(value, 4, [0, 0, 0, 0]);
            const multiplierStyle = result.length >= 3
                && result.slice(0, 3).every((item) => item >= 0.5 && item <= 1.5);

            return multiplierStyle
                ? result.map((item) => item - 1)
                : result;
        }

        if (value && typeof value === "object") {
            const result = [
                firstFinite(0, value.red, value.warm),
                firstFinite(0, value.green),
                firstFinite(0, value.blue),
                firstFinite(0, value.cyan, value.teal)
            ];
            const provided = [
                firstDefined(value.red, value.warm),
                value.green,
                value.blue,
                firstDefined(value.cyan, value.teal)
            ];
            const providedNumbers = provided
                .map(Number)
                .filter(Number.isFinite);
            const multiplierStyle = providedNumbers.length >= 3
                && providedNumbers.every((item) => item >= 0.5 && item <= 1.5);

            return multiplierStyle
                ? result.map((item, index) => (
                    provided[index] === undefined ? 0 : item - 1
                ))
                : result;
        }

        return [0, 0, 0, 0];
    }

    function effectData(value, fallback = 0) {
        if (value && typeof value === "object") {
            return {
                amount: firstFinite(
                    fallback,
                    value.default,
                    value.amount,
                    value.strength
                ),
                radius: firstFinite(2, value.radius, value.size),
                threshold: firstFinite(0.72, value.threshold),
                tint: vector(
                    firstDefined(value.tint, value.color),
                    3,
                    [1, 0.25, 0.06]
                )
            };
        }

        return {
            amount: firstFinite(fallback, value),
            radius: 2,
            threshold: 0.72,
            tint: [1, 0.25, 0.06]
        };
    }

    function rowMajorMatrix(value) {
        return vector(value, 9, IDENTITY_MATRIX);
    }

    function mixValue(neutral, target, intensity) {
        return neutral + (target - neutral) * intensity;
    }

    function scaledEffect(value, intensity) {
        const result = value * intensity;
        return Object.is(result, -0) ? 0 : result;
    }

    function resolveParameters(presetOrResolved = {}, controls = {}) {
        const wrapped = presetOrResolved?.resolved
            && typeof presetOrResolved.resolved === "object"
            ? presetOrResolved.resolved
            : presetOrResolved;
        const preset = wrapped || {};
        const parameters = preset.parameters || preset.color || preset;
        const curve = parameters.toneCurve
            || parameters.curve
            || preset.toneCurve
            || preset.curve
            || {};
        const intensity = normalizeUnit(
            firstDefined(controls.intensity, controls.effectIntensity),
            1
        );
        const rawMatrix = rowMajorMatrix(
            firstDefined(parameters.colorMatrix, preset.colorMatrix)
        );
        const channelOffset = vector(
            firstDefined(
                parameters.channelOffset,
                parameters.colorOffset,
                preset.channelOffset
            ),
            3,
            [0, 0, 0]
        );
        const selectiveSaturation = selectiveData(firstDefined(
            parameters.selectiveSaturation,
            preset.selectiveSaturation
        ));
        const shadowTint = tintData(
            firstDefined(parameters.shadowTint, preset.shadowTint),
            firstDefined(
                parameters.shadowTintAmount,
                preset.shadowTintAmount
            ),
            [0.5, 0.5, 0.5]
        );
        const highlightTint = tintData(
            firstDefined(parameters.highlightTint, preset.highlightTint),
            firstDefined(
                parameters.highlightTintAmount,
                preset.highlightTintAmount
            ),
            [0.5, 0.5, 0.5]
        );
        const grainConfig = effectData(
            firstDefined(preset.grain, parameters.grain),
            0
        );
        const vignetteConfig = effectData(
            firstDefined(preset.vignette, parameters.vignette),
            0
        );
        const bloomConfig = effectData(
            firstDefined(preset.bloom, parameters.bloom),
            0
        );
        const halationConfig = effectData(
            firstDefined(preset.halation, parameters.halation),
            0
        );
        const requestedGrain = firstDefined(controls.grain, controls.grainAmount);
        const grain = requestedGrain === undefined
            ? normalizeUnit(grainConfig.amount, 0)
            : normalizeUnit(requestedGrain, 0);
        const requestedVignette = firstDefined(controls.vignette);
        const requestedBloom = firstDefined(controls.bloom);
        const requestedHalation = firstDefined(controls.halation);
        const resolvedMatrix = rawMatrix.map((value, index) => (
            mixValue(IDENTITY_MATRIX[index], value, intensity)
        ));

        return {
            colorMatrix: resolvedMatrix,
            channelOffset: channelOffset.map((value) => (
                scaledEffect(value, intensity)
            )),
            exposure: scaledEffect(firstFinite(
                0,
                parameters.exposure,
                preset.exposure
            ), intensity),
            contrast: mixValue(
                1,
                firstFinite(1, parameters.contrast, preset.contrast),
                intensity
            ),
            saturation: mixValue(
                1,
                firstFinite(1, parameters.saturation, preset.saturation),
                intensity
            ),
            temperature: scaledEffect(firstFinite(
                0,
                parameters.temperature,
                preset.temperature
            ), intensity),
            tint: scaledEffect(
                firstFinite(0, parameters.tint, preset.tint),
                intensity
            ),
            selectiveSaturation: selectiveSaturation.map(
                (value) => scaledEffect(value, intensity)
            ),
            gamma: mixValue(
                1,
                firstFinite(1, curve.gamma, parameters.gamma, preset.gamma),
                intensity
            ),
            toe: scaledEffect(firstFinite(
                0,
                curve.toe,
                parameters.toe,
                preset.toe
            ), intensity),
            shoulder: scaledEffect(firstFinite(
                0,
                curve.shoulder,
                parameters.shoulder,
                preset.shoulder
            ), intensity),
            blackPoint: scaledEffect(firstFinite(
                0,
                curve.blackPoint,
                parameters.blackPoint,
                preset.blackPoint
            ), intensity),
            shadowTint: shadowTint.color,
            shadowTintAmount: scaledEffect(shadowTint.amount, intensity),
            highlightTint: highlightTint.color,
            highlightTintAmount: scaledEffect(highlightTint.amount, intensity),
            monochrome: scaledEffect(normalizeUnit(
                firstDefined(parameters.monochrome, preset.monochrome),
                0
            ), intensity),
            grainAmount: grain * 0.12,
            grainSize: clamp(firstFinite(1, grainConfig.radius), 0.75, 4),
            vignette: normalizeUnit(
                requestedVignette === undefined
                    ? vignetteConfig.amount
                    : requestedVignette,
                0
            ) * intensity,
            bloom: normalizeUnit(
                requestedBloom === undefined
                    ? bloomConfig.amount
                    : requestedBloom,
                0
            ) * intensity,
            halation: normalizeUnit(
                requestedHalation === undefined
                    ? halationConfig.amount
                    : requestedHalation,
                0
            ) * intensity,
            halationTint: halationConfig.tint,
            highlightThreshold: clamp(
                firstFinite(
                    0.72,
                    halationConfig.threshold,
                    bloomConfig.threshold
                ),
                0.4,
                0.96
            ),
            glowRadius: clamp(
                Math.max(bloomConfig.radius, halationConfig.radius),
                0.5,
                12
            ),
            intensity
        };
    }

    function getSourceDimensions(source, options = {}) {
        const width = firstFinite(
            0,
            options.width,
            source?.naturalWidth,
            source?.videoWidth,
            source?.displayWidth,
            source?.width
        );
        const height = firstFinite(
            0,
            options.height,
            source?.naturalHeight,
            source?.videoHeight,
            source?.displayHeight,
            source?.height
        );

        if (width <= 0 || height <= 0) {
            throw new TypeError("The image source must expose a valid width and height.");
        }

        return { width, height };
    }

    function defaultCanvasFactory() {
        if (typeof document === "undefined" || !document.createElement) {
            throw new Error("A canvas or canvasFactory is required outside a browser.");
        }

        return document.createElement("canvas");
    }

    function compileShader(gl, type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            const message = gl.getShaderInfoLog(shader) || "Unknown shader compile error.";
            gl.deleteShader(shader);
            throw new Error(message);
        }

        return shader;
    }

    function createProgram(gl) {
        const vertexShader = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
        const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
        const program = gl.createProgram();

        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            const message = gl.getProgramInfoLog(program) || "Unknown shader link error.";
            gl.deleteProgram(program);
            throw new Error(message);
        }

        return program;
    }

    function rowToColumnMajor(matrix) {
        return new Float32Array([
            matrix[0], matrix[3], matrix[6],
            matrix[1], matrix[4], matrix[7],
            matrix[2], matrix[5], matrix[8]
        ]);
    }

    function targetFromBatchItem(item) {
        return item?.targetCanvas || item?.canvas || item?.target || null;
    }

    function canvasToBlob(canvas, type, quality) {
        if (typeof canvas.convertToBlob === "function") {
            return canvas.convertToBlob({ type, quality });
        }

        if (typeof canvas.toBlob !== "function") {
            return Promise.reject(new Error("This canvas cannot create downloadable images."));
        }

        return new Promise((resolve, reject) => {
            canvas.toBlob((blob) => {
                if (blob) {
                    resolve(blob);
                } else {
                    reject(new Error("The browser could not encode the rendered image."));
                }
            }, type, quality);
        });
    }

    class BaseRenderer {
        constructor(canvas, options = {}) {
            this.canvas = canvas;
            this.canvasFactory = options.canvasFactory || defaultCanvasFactory;
            this.source = null;
            this.sourceWidth = 0;
            this.sourceHeight = 0;
            this.seed = 0;
            this.disposed = false;
        }

        assertActive() {
            if (this.disposed) {
                throw new Error("The film renderer has already been disposed.");
            }
        }

        rememberSource(source, options = {}) {
            this.assertActive();
            const dimensions = getSourceDimensions(source, options);
            this.source = source;
            this.sourceWidth = dimensions.width;
            this.sourceHeight = dimensions.height;
            this.seed = finiteNumber(options.seed, 0) >>> 0;
            return dimensions;
        }

        renderBatch(items) {
            if (!Array.isArray(items)) {
                throw new TypeError("renderBatch expects an array.");
            }

            return items.map((item) => {
                const target = targetFromBatchItem(item);

                if (!target) {
                    throw new TypeError("Each batch item needs a target canvas.");
                }

                if (item.width) target.width = item.width;
                if (item.height) target.height = item.height;

                return this.renderTo(
                    target,
                    item.preset || item.parameters || item.resolved || {},
                    item.controls || {}
                );
            });
        }

        async exportBlob(preset, controls = {}, options = {}) {
            this.assertActive();
            const previous = this.source
                ? {
                    source: this.source,
                    width: this.sourceWidth,
                    height: this.sourceHeight,
                    seed: this.seed
                }
                : null;
            const temporary = options.source
                ? (
                    options.source.image
                        ? options.source
                        : { source: options.source }
                )
                : null;

            try {
                if (temporary) {
                    const temporarySource = temporary.image || temporary.source;
                    this.setSource(temporarySource, {
                        width: temporary.width,
                        height: temporary.height,
                        seed: firstFinite(this.seed, temporary.seed, options.seed)
                    });
                }

                if (!this.source) {
                    throw new Error("Set an image source before exporting.");
                }

                const requestedWidth = positiveLimit(options.width, this.sourceWidth);
                const requestedHeight = positiveLimit(options.height, this.sourceHeight);
                const dimensions = fitDimensions(requestedWidth, requestedHeight, {
                    maxLongEdge: positiveLimit(options.maxLongEdge, Infinity),
                    maxPixels: positiveLimit(options.maxPixels, EXPORT_MAX_PIXELS),
                    maxTextureSize: positiveLimit(
                        options.maxTextureSize,
                        this.maxTextureSize || DEFAULT_CANVAS_TEXTURE_LIMIT
                    )
                });
                const output = this.canvasFactory();
                output.width = dimensions.width;
                output.height = dimensions.height;

                this.renderTo(output, preset, controls);

                const type = options.type === "image/png"
                    ? "image/png"
                    : "image/jpeg";
                const quality = clamp(finiteNumber(options.quality, 0.92), 0, 1);

                if (type === "image/jpeg") {
                    const context = output.getContext("2d");

                    if (!context) {
                        throw new Error("A 2D canvas is required to prepare a JPEG.");
                    }

                    context.save();
                    context.globalCompositeOperation = "destination-over";
                    context.fillStyle = options.background || "#ffffff";
                    context.fillRect(0, 0, output.width, output.height);
                    context.restore();
                }

                return await canvasToBlob(output, type, quality);
            } finally {
                if (temporary) {
                    if (previous) {
                        this.setSource(previous.source, previous);
                    } else {
                        this.clearSource();
                    }
                }
            }
        }
    }

    class WebGLFilmRenderer extends BaseRenderer {
        constructor(canvas, gl, options = {}) {
            super(canvas, options);
            this.mode = "webgl";
            this.gl = gl;
            this.program = null;
            this.positionBuffer = null;
            this.sourceTexture = null;
            this.uniforms = {};
            this.contextLost = false;
            this.maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
            this.handleContextLost = (event) => {
                event.preventDefault();
                this.contextLost = true;
            };
            this.handleContextRestored = () => {
                this.contextLost = false;
                this.initializeResources();

                if (this.source) {
                    this.uploadSource();
                }
            };

            if (canvas.addEventListener) {
                canvas.addEventListener("webglcontextlost", this.handleContextLost);
                canvas.addEventListener("webglcontextrestored", this.handleContextRestored);
            }

            this.initializeResources();
        }

        initializeResources() {
            const gl = this.gl;
            this.program = createProgram(gl);
            this.positionBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
            gl.bufferData(
                gl.ARRAY_BUFFER,
                new Float32Array([
                    -1, -1,
                    1, -1,
                    -1, 1,
                    1, 1
                ]),
                gl.STATIC_DRAW
            );

            const names = [
                "u_source",
                "u_outputSize",
                "u_colorMatrix",
                "u_channelOffset",
                "u_exposure",
                "u_contrast",
                "u_saturation",
                "u_temperature",
                "u_tint",
                "u_selectiveSaturation",
                "u_gamma",
                "u_toe",
                "u_shoulder",
                "u_blackPoint",
                "u_shadowTint",
                "u_shadowTintAmount",
                "u_highlightTint",
                "u_highlightTintAmount",
                "u_monochrome",
                "u_grainAmount",
                "u_grainSize",
                "u_seed",
                "u_vignette",
                "u_bloom",
                "u_halation",
                "u_halationTint",
                "u_highlightThreshold",
                "u_glowRadius"
            ];

            this.uniforms = Object.fromEntries(names.map((name) => (
                [name, gl.getUniformLocation(this.program, name)]
            )));
        }

        uploadSource() {
            const gl = this.gl;
            const texture = gl.createTexture();

            try {
                gl.bindTexture(gl.TEXTURE_2D, texture);
                gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
                gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                gl.texImage2D(
                    gl.TEXTURE_2D,
                    0,
                    gl.RGBA,
                    gl.RGBA,
                    gl.UNSIGNED_BYTE,
                    this.source
                );
            } catch (error) {
                gl.deleteTexture(texture);
                throw error;
            }

            if (this.sourceTexture) {
                gl.deleteTexture(this.sourceTexture);
            }

            this.sourceTexture = texture;
        }

        setSource(source, options = {}) {
            this.assertActive();
            const dimensions = getSourceDimensions(source, options);

            if (dimensions.width > this.maxTextureSize
                || dimensions.height > this.maxTextureSize) {
                throw new RangeError(
                    `The image exceeds this device's ${this.maxTextureSize}px texture limit.`
                );
            }

            const previous = {
                source: this.source,
                width: this.sourceWidth,
                height: this.sourceHeight,
                seed: this.seed
            };
            this.source = source;
            this.sourceWidth = dimensions.width;
            this.sourceHeight = dimensions.height;
            this.seed = finiteNumber(options.seed, 0) >>> 0;

            if (!this.contextLost) {
                try {
                    this.uploadSource();
                } catch (error) {
                    this.source = previous.source;
                    this.sourceWidth = previous.width;
                    this.sourceHeight = previous.height;
                    this.seed = previous.seed;
                    throw error;
                }
            }

            return this;
        }

        setUniforms(parameters, width, height) {
            const gl = this.gl;
            const uniform = this.uniforms;
            gl.uniform1i(uniform.u_source, 0);
            gl.uniform2f(uniform.u_outputSize, width, height);
            gl.uniformMatrix3fv(
                uniform.u_colorMatrix,
                false,
                rowToColumnMajor(parameters.colorMatrix)
            );
            gl.uniform3fv(uniform.u_channelOffset, parameters.channelOffset);
            gl.uniform1f(uniform.u_exposure, parameters.exposure);
            gl.uniform1f(uniform.u_contrast, parameters.contrast);
            gl.uniform1f(uniform.u_saturation, parameters.saturation);
            gl.uniform1f(uniform.u_temperature, parameters.temperature);
            gl.uniform1f(uniform.u_tint, parameters.tint);
            gl.uniform4fv(
                uniform.u_selectiveSaturation,
                parameters.selectiveSaturation
            );
            gl.uniform1f(uniform.u_gamma, parameters.gamma);
            gl.uniform1f(uniform.u_toe, parameters.toe);
            gl.uniform1f(uniform.u_shoulder, parameters.shoulder);
            gl.uniform1f(uniform.u_blackPoint, parameters.blackPoint);
            gl.uniform3fv(uniform.u_shadowTint, parameters.shadowTint);
            gl.uniform1f(
                uniform.u_shadowTintAmount,
                parameters.shadowTintAmount
            );
            gl.uniform3fv(uniform.u_highlightTint, parameters.highlightTint);
            gl.uniform1f(
                uniform.u_highlightTintAmount,
                parameters.highlightTintAmount
            );
            gl.uniform1f(uniform.u_monochrome, parameters.monochrome);
            gl.uniform1f(uniform.u_grainAmount, parameters.grainAmount);
            gl.uniform1f(uniform.u_grainSize, parameters.grainSize);
            gl.uniform1f(uniform.u_seed, this.seed % 65521);
            gl.uniform1f(uniform.u_vignette, parameters.vignette);
            gl.uniform1f(uniform.u_bloom, parameters.bloom);
            gl.uniform1f(uniform.u_halation, parameters.halation);
            gl.uniform3fv(uniform.u_halationTint, parameters.halationTint);
            gl.uniform1f(
                uniform.u_highlightThreshold,
                parameters.highlightThreshold
            );
            gl.uniform1f(uniform.u_glowRadius, parameters.glowRadius);
        }

        renderTo(targetCanvas, preset, controls = {}) {
            this.assertActive();

            if (!this.sourceTexture || !this.source) {
                throw new Error("Set an image source before rendering.");
            }

            if (this.contextLost) {
                throw new Error("The WebGL context is temporarily unavailable.");
            }

            const requestedWidth = positiveLimit(
                controls.width,
                targetCanvas?.width || this.sourceWidth
            );
            const requestedHeight = positiveLimit(
                controls.height,
                targetCanvas?.height || this.sourceHeight
            );
            const width = Math.max(1, Math.floor(requestedWidth));
            const height = Math.max(1, Math.floor(requestedHeight));

            if (width > this.maxTextureSize || height > this.maxTextureSize) {
                throw new RangeError("The requested output exceeds the WebGL texture limit.");
            }

            this.canvas.width = width;
            this.canvas.height = height;

            const gl = this.gl;
            const parameters = resolveParameters(preset, controls);
            gl.viewport(0, 0, width, height);
            gl.disable(gl.BLEND);
            gl.useProgram(this.program);
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.sourceTexture);
            gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);

            const positionLocation = gl.getAttribLocation(
                this.program,
                "a_position"
            );
            gl.enableVertexAttribArray(positionLocation);
            gl.vertexAttribPointer(
                positionLocation,
                2,
                gl.FLOAT,
                false,
                0,
                0
            );

            this.setUniforms(parameters, width, height);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
            gl.flush();

            if (targetCanvas !== this.canvas) {
                targetCanvas.width = width;
                targetCanvas.height = height;
                const targetContext = targetCanvas.getContext("2d");

                if (!targetContext) {
                    throw new Error("The output canvas needs a 2D context.");
                }

                targetContext.clearRect(0, 0, width, height);
                targetContext.drawImage(this.canvas, 0, 0, width, height);
            }

            return targetCanvas;
        }

        clearSource() {
            if (this.sourceTexture && !this.contextLost) {
                this.gl.deleteTexture(this.sourceTexture);
            }

            this.sourceTexture = null;
            this.source = null;
            this.sourceWidth = 0;
            this.sourceHeight = 0;
            this.seed = 0;
        }

        dispose() {
            if (this.disposed) return;

            this.clearSource();

            if (!this.contextLost) {
                if (this.positionBuffer) {
                    this.gl.deleteBuffer(this.positionBuffer);
                }
                if (this.program) {
                    this.gl.deleteProgram(this.program);
                }
            }

            if (this.canvas.removeEventListener) {
                this.canvas.removeEventListener(
                    "webglcontextlost",
                    this.handleContextLost
                );
                this.canvas.removeEventListener(
                    "webglcontextrestored",
                    this.handleContextRestored
                );
            }

            this.positionBuffer = null;
            this.program = null;
            this.disposed = true;
        }
    }

    function hashPixel(x, y, seed) {
        let value = Math.imul(x + 1, 374761393);
        value = (value + Math.imul(y + 1, 668265263)) | 0;
        value ^= seed | 0;
        value = Math.imul(value ^ (value >>> 13), 1274126177);
        value ^= value >>> 16;
        return (value >>> 0) / 4294967295;
    }

    function toneChannel(value, parameters) {
        const denominator = Math.max(1 - parameters.blackPoint, 0.001);
        let curved = Math.max((value - parameters.blackPoint) / denominator, 0);
        curved = curved ** Math.max(parameters.gamma, 0.05);

        const clamped = clamp(curved, 0, 1);
        const smooth = clamped * clamped * (3 - 2 * clamped);
        curved = mixValue(curved, smooth, clamp(parameters.toe, 0, 1));
        curved /= 1
            + Math.max(parameters.shoulder, 0)
            * Math.max(curved - 0.45, 0)
            * 2;
        return curved;
    }

    function applyPixelGrade(red, green, blue, x, y, width, height, parameters, seed) {
        const matrix = parameters.colorMatrix;
        let r = matrix[0] * red
            + matrix[1] * green
            + matrix[2] * blue
            + parameters.channelOffset[0];
        let g = matrix[3] * red
            + matrix[4] * green
            + matrix[5] * blue
            + parameters.channelOffset[1];
        let b = matrix[6] * red
            + matrix[7] * green
            + matrix[8] * blue
            + parameters.channelOffset[2];
        const exposure = 2 ** parameters.exposure;
        r *= exposure;
        g *= exposure;
        b *= exposure;

        r += parameters.temperature * 0.08 + parameters.tint * 0.025;
        g -= parameters.tint * 0.04;
        b += -parameters.temperature * 0.08 + parameters.tint * 0.025;

        r = (r - 0.5) * parameters.contrast + 0.5;
        g = (g - 0.5) * parameters.contrast + 0.5;
        b = (b - 0.5) * parameters.contrast + 0.5;

        let luma = r * 0.2126 + g * 0.7152 + b * 0.0722;
        r = luma + (r - luma) * parameters.saturation;
        g = luma + (g - luma) * parameters.saturation;
        b = luma + (b - luma) * parameters.saturation;

        const redMask = clamp((r - Math.max(g, b)) / 0.35, 0, 1);
        const greenMask = clamp((g - Math.max(r, b)) / 0.35, 0, 1);
        const blueMask = clamp((b - Math.max(r, g)) / 0.35, 0, 1);
        const cyanMask = clamp((Math.min(g, b) - r) / 0.35, 0, 1);
        const selective = Math.max(0, 1
            + redMask * parameters.selectiveSaturation[0]
            + greenMask * parameters.selectiveSaturation[1]
            + blueMask * parameters.selectiveSaturation[2]
            + cyanMask * parameters.selectiveSaturation[3]);
        luma = r * 0.2126 + g * 0.7152 + b * 0.0722;
        r = luma + (r - luma) * selective;
        g = luma + (g - luma) * selective;
        b = luma + (b - luma) * selective;

        r = toneChannel(r, parameters);
        g = toneChannel(g, parameters);
        b = toneChannel(b, parameters);

        luma = r * 0.2126 + g * 0.7152 + b * 0.0722;
        const shadowWeight = 1 - clamp((luma - 0.08) / 0.5, 0, 1);
        const highlightWeight = clamp((luma - 0.45) / 0.51, 0, 1);
        r += (parameters.shadowTint[0] - 0.5)
            * parameters.shadowTintAmount * shadowWeight;
        g += (parameters.shadowTint[1] - 0.5)
            * parameters.shadowTintAmount * shadowWeight;
        b += (parameters.shadowTint[2] - 0.5)
            * parameters.shadowTintAmount * shadowWeight;
        r += (parameters.highlightTint[0] - 0.5)
            * parameters.highlightTintAmount * highlightWeight;
        g += (parameters.highlightTint[1] - 0.5)
            * parameters.highlightTintAmount * highlightWeight;
        b += (parameters.highlightTint[2] - 0.5)
            * parameters.highlightTintAmount * highlightWeight;

        const mono = r * 0.24 + g * 0.68 + b * 0.08;
        r = mixValue(r, mono, parameters.monochrome);
        g = mixValue(g, mono, parameters.monochrome);
        b = mixValue(b, mono, parameters.monochrome);

        const centeredX = ((x + 0.5) / width - 0.5) * 2;
        const centeredY = ((y + 0.5) / height - 0.5) * 2;
        const edgeDistance = Math.hypot(centeredX, centeredY);
        const vignetteMask = clamp((edgeDistance - 0.48) / 0.84, 0, 1);
        const vignette = 1 - vignetteMask * parameters.vignette;
        r *= vignette;
        g *= vignette;
        b *= vignette;

        if (parameters.grainAmount > 0) {
            const grainX = Math.floor(x / parameters.grainSize);
            const grainY = Math.floor(y / parameters.grainSize);
            const noise = hashPixel(grainX, grainY, seed) - 0.5;
            luma = r * 0.2126 + g * 0.7152 + b * 0.0722;
            const grainResponse = mixValue(
                1.15,
                0.35,
                clamp((luma - 0.22) / 0.71, 0, 1)
            );
            const grain = noise * parameters.grainAmount * grainResponse;
            r += grain;
            g += grain;
            b += grain;
        }

        return [
            clamp(r, 0, 1),
            clamp(g, 0, 1),
            clamp(b, 0, 1)
        ];
    }

    class CanvasFilmRenderer extends BaseRenderer {
        constructor(canvas, context, options = {}) {
            super(canvas, options);
            this.mode = "canvas2d";
            this.context = context;
            this.maxTextureSize = positiveLimit(
                options.maxTextureSize,
                DEFAULT_CANVAS_TEXTURE_LIMIT
            );
        }

        setSource(source, options = {}) {
            this.rememberSource(source, options);
            return this;
        }

        applyGlow(parameters, width, height) {
            if (parameters.bloom <= 0 && parameters.halation <= 0) {
                return;
            }

            const glowCanvas = this.canvasFactory();
            glowCanvas.width = Math.max(1, Math.floor(width / 4));
            glowCanvas.height = Math.max(1, Math.floor(height / 4));
            const glowContext = glowCanvas.getContext("2d", {
                willReadFrequently: true
            });

            if (!glowContext) return;

            glowContext.drawImage(
                this.canvas,
                0,
                0,
                glowCanvas.width,
                glowCanvas.height
            );
            const imageData = glowContext.getImageData(
                0,
                0,
                glowCanvas.width,
                glowCanvas.height
            );
            const pixels = imageData.data;

            for (let index = 0; index < pixels.length; index += 4) {
                const luma = (
                    pixels[index] * 0.2126
                    + pixels[index + 1] * 0.7152
                    + pixels[index + 2] * 0.0722
                ) / 255;
                const mask = clamp(
                    (luma - parameters.highlightThreshold) / 0.24,
                    0,
                    1
                );
                pixels[index] *= mask;
                pixels[index + 1] *= mask;
                pixels[index + 2] *= mask;
                pixels[index + 3] *= mask;
            }

            glowContext.putImageData(imageData, 0, 0);
            const destination = this.context;
            destination.save();
            destination.globalCompositeOperation = "screen";
            destination.filter = `blur(${Math.max(1, parameters.glowRadius)}px)`;

            if (parameters.bloom > 0) {
                destination.globalAlpha = parameters.bloom * 0.32;
                destination.drawImage(glowCanvas, 0, 0, width, height);
            }

            if (parameters.halation > 0) {
                const tintCanvas = this.canvasFactory();
                tintCanvas.width = glowCanvas.width;
                tintCanvas.height = glowCanvas.height;
                const tintContext = tintCanvas.getContext("2d");

                if (tintContext) {
                    const tint = parameters.halationTint.map((value) => (
                        Math.round(clamp(value, 0, 1) * 255)
                    ));
                    tintContext.fillStyle = `rgb(${tint.join(",")})`;
                    tintContext.fillRect(
                        0,
                        0,
                        tintCanvas.width,
                        tintCanvas.height
                    );
                    tintContext.globalCompositeOperation = "destination-in";
                    tintContext.drawImage(glowCanvas, 0, 0);
                    destination.globalAlpha = parameters.halation * 0.55;
                    destination.filter = `blur(${Math.max(
                        2,
                        parameters.glowRadius * 1.8
                    )}px)`;
                    destination.drawImage(tintCanvas, 0, 0, width, height);
                }
            }

            destination.restore();
        }

        renderTo(targetCanvas, preset, controls = {}) {
            this.assertActive();

            if (!this.source) {
                throw new Error("Set an image source before rendering.");
            }

            const requestedWidth = positiveLimit(
                controls.width,
                targetCanvas?.width || this.sourceWidth
            );
            const requestedHeight = positiveLimit(
                controls.height,
                targetCanvas?.height || this.sourceHeight
            );
            const width = Math.max(1, Math.floor(requestedWidth));
            const height = Math.max(1, Math.floor(requestedHeight));
            const parameters = resolveParameters(preset, controls);

            this.canvas.width = width;
            this.canvas.height = height;
            this.context = this.canvas.getContext("2d", {
                willReadFrequently: true
            });

            if (!this.context) {
                throw new Error("The fallback renderer needs a 2D canvas.");
            }

            this.context.imageSmoothingEnabled = true;

            if ("imageSmoothingQuality" in this.context) {
                this.context.imageSmoothingQuality = "high";
            }

            this.context.clearRect(0, 0, width, height);
            this.context.drawImage(this.source, 0, 0, width, height);

            const imageData = this.context.getImageData(0, 0, width, height);
            const pixels = imageData.data;

            for (let index = 0; index < pixels.length; index += 4) {
                const pixelIndex = index / 4;
                const x = pixelIndex % width;
                const y = Math.floor(pixelIndex / width);
                const color = applyPixelGrade(
                    pixels[index] / 255,
                    pixels[index + 1] / 255,
                    pixels[index + 2] / 255,
                    x,
                    y,
                    width,
                    height,
                    parameters,
                    this.seed
                );
                pixels[index] = Math.round(color[0] * 255);
                pixels[index + 1] = Math.round(color[1] * 255);
                pixels[index + 2] = Math.round(color[2] * 255);
            }

            this.context.putImageData(imageData, 0, 0);
            this.applyGlow(parameters, width, height);

            if (targetCanvas !== this.canvas) {
                targetCanvas.width = width;
                targetCanvas.height = height;
                const targetContext = targetCanvas.getContext("2d");

                if (!targetContext) {
                    throw new Error("The output canvas needs a 2D context.");
                }

                targetContext.clearRect(0, 0, width, height);
                targetContext.drawImage(this.canvas, 0, 0, width, height);
            }

            return targetCanvas;
        }

        clearSource() {
            this.source = null;
            this.sourceWidth = 0;
            this.sourceHeight = 0;
            this.seed = 0;

            if (this.context && this.canvas.width && this.canvas.height) {
                this.context.clearRect(
                    0,
                    0,
                    this.canvas.width,
                    this.canvas.height
                );
            }
        }

        dispose() {
            if (this.disposed) return;
            this.clearSource();
            this.context = null;
            this.disposed = true;
        }
    }

    function createRenderer(options = {}) {
        const canvasFactory = options.canvasFactory || defaultCanvasFactory;
        const canvas = options.canvas || canvasFactory();

        if (!canvas || typeof canvas.getContext !== "function") {
            throw new TypeError("createRenderer needs a canvas-like object.");
        }

        if (!options.forceCanvas2D) {
            const attributes = {
                alpha: true,
                antialias: false,
                depth: false,
                stencil: false,
                premultipliedAlpha: false,
                preserveDrawingBuffer: true,
                powerPreference: "high-performance"
            };
            let gl = null;

            try {
                gl = canvas.getContext("webgl", attributes)
                    || canvas.getContext("experimental-webgl", attributes);

                if (gl) {
                    return new WebGLFilmRenderer(canvas, gl, {
                        ...options,
                        canvasFactory
                    });
                }
            } catch {
                gl = null;
            }
        }

        let fallbackCanvas = canvas;
        let context = null;

        try {
            context = fallbackCanvas.getContext("2d", {
                willReadFrequently: true
            });
        } catch {
            context = null;
        }

        if (!context) {
            fallbackCanvas = canvasFactory();
            context = fallbackCanvas.getContext("2d", {
                willReadFrequently: true
            });
        }

        if (!context) {
            throw new Error("Neither WebGL nor Canvas2D is available.");
        }

        return new CanvasFilmRenderer(fallbackCanvas, context, {
            ...options,
            canvasFactory
        });
    }

    return {
        createRenderer,
        fitDimensions,
        seedFromFile,
        resolveParameters,
        constants: {
            PREVIEW_MAX_LONG_EDGE,
            THUMBNAIL_MAX_LONG_EDGE,
            EXPORT_MAX_PIXELS
        }
    };
});
