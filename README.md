# FrameWise

FrameWise is a browser-based photography composition trainer. Players crop a
photo around a specific composition goal, then receive a transparent,
rule-based score with measured evidence and several coach crop examples.

FrameWise does not currently use an image-recognition model. Subject boxes,
guide points, layers, curves, and leading lines in `photos.json` are manually
reviewed annotations.

## Run locally

The app must be served over HTTP because it loads photo metadata with `fetch`.

```powershell
py -m http.server 8000
```

Then open `http://localhost:8000`.

On systems where Python is exposed as `python`, use
`python -m http.server 8000` instead.

Cropper.js and the Inter font are currently loaded from public CDNs, so the
crop interface requires an internet connection unless those dependencies are
vendored locally.

## Tests

With Node.js installed:

```powershell
npm test
```

The tests verify:

- all 13 photo assets exist;
- every photo uses the composition-v2 scoring path;
- weights total 100%;
- every coach crop is valid and scores at least 85;
- coach crops beat the uncropped image;
- curve and leading-line missions use their matching evaluators;
- random selection excludes the immediately previous photo;
- an explicit retry can reopen the same photo.

## Main files

- `assets/data/photos.json`: photo missions, annotations, weights, and coach crops
- `js/composition-score.js`: pure scoring functions
- `js/photo-selection.js`: tested random/retry selection
- `js/game.js`: challenge lifecycle, timer, crop submission, and history
- `js/result.js`: score evidence, guide overlays, sources, and navigation

## Scoring principles

- A photo is graded only against the composition goals assigned to that photo.
- Subject detection is not automatic; annotations are manual.
- Coach crop similarity is a 10% supporting signal, not the main answer.
- Multiple coach crops are supported, and every included example must pass the
  same scoring checks as a player crop.
- Scores across different photos should be treated as practice feedback, not
  as a scientifically calibrated aesthetic ranking.

## Practice modes

- Timed challenge: Easy 45s, Medium 40s, Hard 35s
- Untimed practice
- Retry the current photo
- Next challenge without repeating the immediately previous random photo
