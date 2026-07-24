# FrameWise

> Transparent Photography Composition Trainer and Client-side Film Lab

## Project overview

FrameWise is a browser-based photography learning project with two independent
tools:

1. **Composition Challenge** — crop a curated photograph around a specific
   composition goal and receive rule-based feedback.
2. **AI Film Lab** — upload a personal photograph, compare original FrameWise
   "Inspired" film looks, adjust effect and grain strength, and download the
   result. Despite the page name, the current Film Lab does not use a
   generative AI or machine-learning model.

Composition Challenge loop:

1. Choose a timed challenge or untimed practice.
2. Read the photo-specific mission, tip, and measured criteria.
3. Crop the photo with Cropper.js.
4. Review the total score, category weights, individual measurements, guide
   overlays, and three coach crop examples.
5. Retry the same photo or continue to a different random photo.

The random selector excludes the immediately previous photo. An explicit retry
is the only flow that intentionally opens the same photo again.

Film Lab loop:

1. Select or drop one JPG, PNG, or WebP image.
2. Choose an intended mood or keep photo-only automatic recommendation.
3. Analyze a small preview for average brightness, color, contrast, and texture.
4. Review one transparent rule-based recommendation and twelve preset previews.
5. Choose a style and adjust effect, grain, and before/after comparison.
6. Export a JPG or PNG while preserving the source aspect ratio.

## Current scope

FrameWise currently preserves the curated-photo composition experience while
adding a separate client-only film comparison workflow.

Included:

- 13 local practice photos
- timed and untimed modes
- difficulty-based time limits
- manual photo annotations
- photo-specific composition scoring
- multiple coach crops with reasons
- visible score weights and measurements
- guide overlays on player and coach crops
- practice history, average, and personal best
- retry and non-repeating next challenge
- source and license display when recorded
- personal photo upload inside Film Lab
- twelve independently designed "Inspired" film presets
- WebGL rendering with a Canvas2D fallback
- deterministic color, tone, grain, vignette, bloom, and halation effects
- rule-based film recommendation from lightweight pixel statistics
- explicit mood preferences that override photo-only recommendation
- local retention of only the selected mood ID, never the uploaded photograph
- before/after slider and JPG/PNG download

Not included:

- user photo uploads in Composition Challenge
- automatic subject or line detection
- OpenAI Vision or another vision model
- generative image editing
- manufacturer LUTs, official film profiles, or paid LUTs
- server upload or storage of Film Lab photos
- a public leaderboard

## Scoring system

All 13 photos use `composition-v3`. The active criteria depend on the photo:

- rule of thirds
- centered composition
- look room
- horizon placement
- crop-area range
- subject prominence
- foreground/middle-ground/background layers
- frame preservation
- curve preservation
- leading-line preservation
- subject preservation
- coach crop similarity

The system uses normalized 0–1 coordinates and manually reviewed annotations.
It does not claim to find subjects automatically.

Each photo's active category weights total 100%. Coach crop similarity is a 10%
supporting signal; the assigned composition goal carries most of the score.

## Data model

`assets/data/photos.json` stores:

- mission, tip, and difficulty
- source and license metadata where available
- target composition evaluators
- normalized annotations
- category weights
- three normalized coach crops and their reasons

Photos without recorded provenance are labeled as pending verification in the
result UI. They should not be treated as cleared for public distribution until
their origin and license are documented.

## Film Lab processing

Film Lab processing is deterministic and runs inside the browser:

- previews are limited to a 1400 px long edge;
- preset cards use smaller 360 px previews;
- one shared WebGL context applies channel transforms, tone curves, selective
  saturation, temperature/tint, shadow/highlight tint, deterministic
  luminance-aware grain, vignette, bloom, and halation;
- browsers without WebGL use a Canvas2D implementation rather than CSS filters;
- export rendering happens only when the download button is pressed and is
  bounded by device texture and memory limits;
- object URLs and renderer resources are released after use.

The recommendation is a visible ruleset over brightness, dark/highlight share,
saturation, warmth, green/cyan share, contrast, and local texture. It does not
detect a person and must not claim that it does.

One uploaded photograph is not enough evidence to infer stable personal taste.
Film Lab asks for an explicit desired mood and combines it with the measured
photo statistics. The mood choice is saved locally so the next visit can start
from the same preference; the photograph and its statistics are not stored.
Suggested effect strength starts conservatively between 62% and 82%.

All preset names include `Inspired`. They are original parameter sets, not
claims of accurate manufacturer color reproduction. Video observations,
official product references, confidence notes, and parameter rationale are
tracked in `docs/film-reference.md`.

## Technical structure

```text
assets/
  data/photos.json
  images/sample1.jpg ... sample13.jpg
css/
  reset.css
  common.css
  home.css
  game.css
  result.css
  credits.css
  film.css
js/
  photo-selection.js
  composition-score.js
  game.js
  result.js
  film-presets.js
  image-analysis.js
  film-renderer.js
  film.js
tests/
  composition-score.test.js
  photo-selection.test.js
  result-runtime.test.js
  credits.test.js
  localization.test.js
  film-presets.test.js
  image-analysis.test.js
  film-renderer.test.js
  film-utils.test.js
  film-page.test.js
docs/
  film-reference.md
index.html
game.html
result.html
credits.html
film.html
```

Reusable score, selection, preset, analysis, renderer, and Film Lab utility
modules use small UMD wrappers so they can run in both the browser and
Node-based tests.

## Quality rules

- A mission must match the criteria that actually affect its score.
- Every coach crop must score at least 85 under the same engine.
- Every photo must use the v3 scorer.
- Category weights must total 100%.
- A coach crop must outperform the uncropped image.
- UI language must describe the current rule-based system honestly.
- Missing source or license information must be disclosed.
- Every Film Lab preset name must include `Inspired`.
- Preset metadata must separate video observations from general film traits.
- Film Lab must not upload, retain, or silently transmit a user's photograph.
- A recommendation reason may mention only metrics the current analyzer
  actually measures.
- Explicit user taste must take priority over a photo-only heuristic.
- Preference storage may contain only the selected mood ID.

## Next priorities

1. Verify provenance for project samples without source records.
2. Calibrate score distributions through real player testing.
3. Vendor Cropper.js and fonts for reliable offline use.
4. Calibrate Film Lab parameters with permission-cleared reference photographs
   and multiple scanners/displays.
5. Add a curriculum that groups photos by composition principle.
6. Consider an optional ONNX Runtime Web image analyzer only as a separately
   labeled future capability.
