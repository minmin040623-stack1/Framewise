const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const filmHtml = fs.readFileSync(path.join(root, "film.html"), "utf8");
const filmCss = fs.readFileSync(path.join(root, "css/film.css"), "utf8");
const homeHtml = fs.readFileSync(path.join(root, "index.html"), "utf8");

function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getOpeningTagById(html, id) {
    const pattern = new RegExp(
        `<[^>]+\\bid=(["'])${escapeRegExp(id)}\\1[^>]*>`,
        "i"
    );
    const match = html.match(pattern);

    assert.ok(match, `#${id} should exist in film.html.`);
    return match[0];
}

function assertAttribute(tag, attribute, expected, message) {
    const pattern = expected
        ? new RegExp(`\\b${attribute}=(["'])${escapeRegExp(expected)}\\1`, "i")
        : new RegExp(`\\b${attribute}(?:\\s|=|>)`, "i");

    assert.ok(pattern.test(tag), message);
}

function assertOrdered(source, values, message) {
    let previousIndex = -1;

    values.forEach((value) => {
        const index = source.indexOf(value);
        assert.ok(index >= 0, `${message}: missing ${value}.`);
        assert.ok(index > previousIndex, `${message}: ${value} is out of order.`);
        previousIndex = index;
    });
}

assert.ok(
    /<html\b[^>]*\blang=(["'])ko\1/i.test(filmHtml),
    "film.html should declare Korean as its document language."
);

assertOrdered(
    filmHtml,
    [
        'href="css/reset.css"',
        'href="css/common.css"',
        'href="css/film.css"'
    ],
    "Film Lab stylesheets should load from shared foundations to page styles"
);

assertOrdered(
    filmHtml,
    [
        'src="js/film-presets.js"',
        'src="js/image-analysis.js"',
        'src="js/film-renderer.js"',
        'src="js/film.js"'
    ],
    "Film Lab scripts should load in dependency order"
);

const requiredIds = [
    "filmFileInput",
    "dropZone",
    "filmWorkspace",
    "workspaceStatus",
    "fileError",
    "processingOverlay",
    "originalCanvas",
    "resultCanvas",
    "resultClip",
    "compareSlider",
    "compareValue",
    "fileName",
    "fileDimensions",
    "recommendationName",
    "recommendationReason",
    "presetFieldset",
    "categoryFilters",
    "presetGrid",
    "effectStrength",
    "effectStrengthValue",
    "grainStrength",
    "grainStrengthValue",
    "formatSelect",
    "resetButton",
    "replaceButton",
    "downloadButton"
];

requiredIds.forEach((id) => {
    const matches = filmHtml.match(
        new RegExp(`\\bid=(["'])${escapeRegExp(id)}\\1`, "gi")
    ) || [];

    assert.strictEqual(matches.length, 1, `#${id} should appear exactly once.`);
});

const fileInputTag = getOpeningTagById(filmHtml, "filmFileInput");
assertAttribute(
    fileInputTag,
    "type",
    "file",
    "#filmFileInput should be a file input."
);

const acceptMatch = fileInputTag.match(/\baccept=(["'])(.*?)\1/i);
assert.ok(acceptMatch, "#filmFileInput should declare accepted file types.");
["jpg", "jpeg", "png", "webp"].forEach((extension) => {
    assert.ok(
        acceptMatch[2].toLowerCase().includes(extension),
        `#filmFileInput should accept ${extension.toUpperCase()} images.`
    );
});

assert.ok(
    new RegExp(
        `<label\\b[^>]*\\bid=(["'])dropZone\\1[^>]*\\bfor=(["'])filmFileInput\\2`,
        "i"
    ).test(filmHtml),
    "The drop zone should be a label associated with #filmFileInput."
);

const workspaceStatusTag = getOpeningTagById(filmHtml, "workspaceStatus");
assertAttribute(
    workspaceStatusTag,
    "role",
    "status",
    "#workspaceStatus should expose status semantics."
);
assertAttribute(
    workspaceStatusTag,
    "aria-live",
    "polite",
    "#workspaceStatus should announce updates politely."
);

const fileErrorTag = getOpeningTagById(filmHtml, "fileError");
assertAttribute(
    fileErrorTag,
    "role",
    "alert",
    "#fileError should announce upload errors."
);

[
    "compareSlider",
    "presetFieldset",
    "effectStrength",
    "grainStrength",
    "formatSelect",
    "resetButton",
    "replaceButton",
    "downloadButton"
].forEach((id) => {
    assertAttribute(
        getOpeningTagById(filmHtml, id),
        "disabled",
        null,
        `#${id} should be disabled before a photo is ready.`
    );
});

["compareSlider", "effectStrength", "grainStrength"].forEach((id) => {
    assert.ok(
        new RegExp(`<label\\b[^>]*\\bfor=(["'])${escapeRegExp(id)}\\1`, "i").test(
            filmHtml
        ),
        `#${id} should have a visible label.`
    );
});

assert.ok(
    /<fieldset\b[^>]*\bid=(["'])presetFieldset\1[\s\S]*?<legend>[^<]+<\/legend>/i.test(
        filmHtml
    ),
    "The preset picker should use a fieldset and legend."
);

[
    "규칙 기반 추천",
    "AI 모델 아님",
    "브라우저 안에서",
    "Inspired",
    "공식 프로필",
    "유료 LUT"
].forEach((copy) => {
    assert.ok(
        filmHtml.includes(copy),
        `film.html should disclose “${copy}” to explain processing and preset origins.`
    );
});

[
    'href="game.html?mode=timed"',
    'href="game.html?mode=practice"',
    'href="film.html"'
].forEach((href) => {
    assert.ok(homeHtml.includes(href), `index.html should keep the ${href} route.`);
});

assert.ok(
    /@media\s*\(\s*max-width\s*:\s*1050px\s*\)/i.test(filmCss),
    "film.css should include the 1050px layout breakpoint."
);
assert.ok(
    /@media\s*\(\s*max-width\s*:\s*720px\s*\)/i.test(filmCss),
    "film.css should include the 720px mobile breakpoint."
);
assert.ok(
    /\.film-preset-grid\s*\{[^}]*\boverflow-x\s*:\s*auto\b[^}]*\}/is.test(filmCss),
    "Film preset cards should support horizontal overflow."
);
assert.ok(
    /\.film-result-clip\s*\{[^}]*clip-path\s*:\s*inset\(0 0 0 calc\(100% - var\(--film-compare-position\)\)\)/is.test(
        filmCss
    ),
    "The processed result should be revealed from the right side of the comparison."
);
assert.ok(
    /\.film-compare-label-original\s*\{[^}]*left\s*:\s*14px/is.test(filmCss) &&
        /\.film-compare-label-result\s*\{[^}]*right\s*:\s*14px/is.test(filmCss),
    "Comparison labels should keep the original on the left and the result on the right."
);
assert.ok(
    /:(?:focus-visible|focus-within)\b/i.test(filmCss),
    "film.css should provide a visible keyboard focus state."
);
assert.ok(
    /@media\s*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)/i.test(filmCss),
    "film.css should respect reduced-motion preferences."
);

console.log("All Film Lab page structure tests passed.");
