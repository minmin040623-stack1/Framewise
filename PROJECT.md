# FrameWise

> Transparent Photography Composition Training Game

## Project overview

FrameWise is a web-based learning game where a player crops a photograph around
a specific composition goal and receives rule-based feedback.

Current product loop:

1. Choose a timed challenge or untimed practice.
2. Read the photo-specific mission, tip, and measured criteria.
3. Crop the photo with Cropper.js.
4. Review the total score, category weights, individual measurements, guide
   overlays, and three coach crop examples.
5. Retry the same photo or continue to a different random photo.

The random selector excludes the immediately previous photo. An explicit retry
is the only flow that intentionally opens the same photo again.

## Current scope

FrameWise v2 focuses on completing the curated-photo learning experience.

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

Not included:

- user photo uploads
- automatic subject or line detection
- OpenAI Vision or another vision model
- a public leaderboard

## Scoring system

All 13 photos use `composition-v2`. The active criteria depend on the photo:

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
js/
  photo-selection.js
  composition-score.js
  game.js
  result.js
tests/
  composition-score.test.js
  photo-selection.test.js
index.html
game.html
result.html
```

The score and selection modules use small UMD wrappers so they can run in both
the browser and Node-based tests.

## Quality rules

- A mission must match the criteria that actually affect its score.
- Every coach crop must score at least 85 under the same engine.
- Every photo must use the v2 scorer.
- Category weights must total 100%.
- A coach crop must outperform the uncropped image.
- UI language must describe the current rule-based system honestly.
- Missing source or license information must be disclosed.

## Next priorities

1. Verify provenance for project samples without source records.
2. Calibrate score distributions through real player testing.
3. Vendor Cropper.js and fonts for reliable offline use.
4. Add a curriculum that groups photos by composition principle.
5. Consider automatic image analysis only as a separately labeled future
   capability.
