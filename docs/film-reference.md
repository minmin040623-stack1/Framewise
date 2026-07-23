# FrameWise Film Reference

## Purpose and limits

This document records how the Film Lab presets were designed and what can be
verified later. The presets are original FrameWise parameter sets. They are not
manufacturer profiles, official LUTs, paid LUTs, or claims of exact film
reproduction.

Primary comparison reference:

- 블랙스완, [어떤 필름을 쓰면 좋을까](https://www.youtube.com/watch?v=o_B2rvTrqF4&t=51s)
- Runtime checked: 9:28
- Video description and chapter index checked: 2026-07-24

The public page exposed Korean caption tracks, but the caption endpoint returned
an empty body in the development environment. A connected video player was not
available. Film order and chapter times therefore come from the creator's video
description. Visual notes come from YouTube's temporary 320×180 navigation
storyboards and higher-resolution comparison captures supplied by the project
owner. The temporary storyboards were deleted after review. No video frame or
comparison photograph is included in this repository.

YouTube compression, the video edit, negative development, scanner settings,
and display calibration can all change color. The notes below describe relative
differences in this particular comparison, not invariant film color.

## Video order and qualitative analysis

| Film shown in the video | Video timestamp | Observed color | Contrast | Skin rendering | Grain | Highlights | Suggested use |
|---|---:|---|---|---|---|---|---|
| Kodak Portra 400 | 1:43–2:30; 6:24 | Natural peach skin; restrained olive green; relatively neutral reference look | Soft | Peach to neutral and comparatively natural | Fine detail cannot be separated reliably from scan/video compression | Looks gentle; exact roll-off needs controlled source scans | Portraits and soft daylight |
| Fuji C200 / renewed Fujifilm 200 | 1:43–2:30; 6:45 | Clearer green/cyan; some scenes shift grass and skin slightly more yellow/pink than Portra; whites remain neutral to mildly cool | Medium and crisp | Slightly more yellow/pink in the supplied comparisons | 확인 필요 | Bright and clear; exact roll-off 확인 필요 | Landscape, travel, bright everyday scenes |
| CineStill 400D | 2:31–3:08; 7:14 | Brighter warm yellow/peach/pink highlights with subtly cooler shadows | Medium to moderately strong | Warmer and brighter than Portra in the supplied comparison | 확인 필요 | Warm and bright; halation is not demonstrated clearly by these daylight frames | City scenes, backlight, cinematic portraits |
| Lomography Color Negative 100 | 3:09–3:46; 7:37 | Vivid yellow/green and orange sunset color; a slight pink/magenta pull in skin | Clear and punchy | Pink/magenta tendency | 확인 필요 | Looks crisp; exact roll-off 확인 필요 | Sunlight, travel, festivals, saturated color |
| Harman Phoenix 200 | 3:47–4:23; 8:05 | Orange/golden vegetation, warm pink/red skin, deep dark tones | Strong; some frames feel underexposed compared with Portra | Warm pink/red | Strong texture is plausible, but the video alone does not isolate grain precisely | Warm; some bright edges may bloom | Experimental portraiture, strong daylight, performance |
| LomoChrome Purple | 4:24–4:57; 8:29 | Obvious false-color mapping: greens move toward magenta/purple while some blues and skin/denim move toward green | Strong | Intentionally unnatural green/pink shifts | 확인 필요 | Color shifts are visible; roll-off 확인 필요 | Surreal landscape, fashion, experimental work |
| RETO Aqua 400 | 4:58–5:35; 8:48 | Strong cyan/gray-green cast, reduced saturation, darker overall rendering | Low to medium with dark mids | Cool and subdued | Coarse visible grain in the supplied comparison | Subdued and cool | Overcast scenes, sea, quiet vintage snapshots |

The original `B&W 400 Inspired` request is not represented in the video. It is
kept as a separately documented FrameWise look.

## General product references

General traits below help avoid overfitting one edited video. They do not
override what was actually visible in the comparison.

- **Portra 400:** Kodak describes smooth, natural skin-tone reproduction, fine
  grain, wide lighting use, and portrait/fashion/nature/travel suitability.
  [Kodak product page](https://kodakprofessional.com/photographers/film/color/kodak-professional-portra-400-film/516),
  [Kodak technical data](https://www.kodakprofessional.com/sites/default/files/wysiwyg/pro/resources/e4050_portra_400.pdf)
- **Fujicolor C200 / Fujifilm 200:** Fujifilm describes daylight balance, fine
  grain, broad exposure latitude, natural skin color, and sharp rendering.
  [Fujifilm C200 data sheet](https://asset.fujifilm.com/www/us/files/2019-09/cce1e1943550fc3e76c22411066f0100/films_c200_datasheet_01.pdf),
  [Fujifilm 200 specifications](https://www.fujifilm.com/us/en/consumer/films/consumer-film/fujifilm-200/specifications)
- **CineStill 400D:** CineStill describes a daylight-balanced, fine-grain
  negative with a soft palette, natural saturation, warm skin, and wide
  exposure latitude. The company also states that it is designed for still
  photography and is not simply a repackaged motion-picture stock.
  [CineStill 400D product information](https://cinestillfilm.com/collections/cinestill-120/products/400dynamic-120),
  [CineStill 400D background and FAQ](https://cinestillfilm.com/products/a-new-color-film-400dynamic)
- **Lomography Color Negative 100:** Lomography describes vivid color,
  sharpness, smooth fine grain, and strongest use in bright sunlight.
  [Lomography CN100 overview](https://www.lomography.com/magazine/238645-lomopedia-lomography-color-negative-100-iso-35mm)
- **Harman Phoenix 200:** Harman documents high contrast, strong visible grain,
  punchy color, limited antihalation, and possible halation around bright
  sources. Scanner settings can materially change color and contrast.
  [Harman Phoenix 200 technical data](https://www.harmanphoto.co.uk/amfile/file/download/file/1963/product/2157/)
- **LomoChrome Purple:** Lomography states that Purple is a regular C-41 color
  negative designed for infrared-like false-color effects without an infrared
  filter; it is not actual infrared film.
  [LomoChrome Purple FAQ](https://www.lomography.com/magazine/223817-lomochrome-purple-your-questions-answered),
  [LomoChrome Purple film guide](https://cdn.downloads.lomography.com/downloads/lomochrome-purple-film-guide.pdf)
- **RETO Aqua 400:** RETO describes faded, low-contrast color, an icy blue cast
  in daylight, and a grainy texture.
  [RETO Aqua 400 product page](https://retoproject.com/products/reto-aqua-400-film-27exp)
- **B&W 400 reference direction:** ILFORD describes HP5 Plus as an ISO 400,
  medium-contrast, all-purpose black-and-white film. FrameWise does not use its
  profile or name; the source only supports the broad educational direction.
  [ILFORD HP5 Plus](https://www.ilfordphoto.com/hp5-plus-120)

## Parameter interpretation

Parameter conventions in `js/film-presets.js`:

- `temperature`: positive warms red/yellow; negative cools toward blue.
- `tint`: positive moves toward magenta; negative toward green.
- `colorMatrix` and `channelOffset`: cross-channel and RGB-level shifts.
- `selectiveSaturation`: red, green, and blue multipliers.
- `toneCurve`: gamma, toe, shoulder, and black point.
- `shadowTint` / `highlightTint`: normalized RGB and amount.
- `grain.default` / `grain.size`: default strength and cell size.
- `vignette`, `bloom`, `halation`: normalized default strengths.
- All values are interpolated from a neutral state by the effect slider. Grain
  has its own independent slider.

### Portra 400 Inspired

- Video-derived: natural peach skin, softer contrast/highlights, restrained
  olive green.
- General-reference contribution: fine-grain portrait direction and broad
  exposure tolerance.
- Parameters:
  - RGB: matrix `[1.035,-0.010,-0.005, 0.010,0.995,-0.005, 0.005,0.015,0.970]`;
    offset `[0.008,0.002,-0.004]`; selective saturation
    `R 1.04 / G 0.91 / B 0.96`
  - color/tone: exposure `0.045`, contrast `0.91`, saturation `0.92`,
    temperature `0.075`, tint `0.018`, gamma `0.98`, toe `0.045`,
    shoulder `0.18`, black point `0.008`
  - split tone: shadow `[0.20,0.29,0.26] @ 0.025`; highlight
    `[1.00,0.73,0.57] @ 0.065`
  - texture/optics: grain `0.18 / 0.85`, vignette `0.10`, bloom `0.065`,
    halation `0.01`
- Confidence: **medium**.

### Fuji C200 Inspired

- Video-derived: bright crisp rendering, clearer green/cyan, mildly cooler
  whites, and yellow/pink movement in skin relative to Portra in some frames.
- General-reference contribution: fine grain, daylight use, natural skin,
  sharpness, and exposure latitude.
- Parameters:
  - RGB: matrix `[0.985,0,0.010, -0.010,1.035,0.015, -0.005,0.010,1.045]`;
    offset `[-0.006,0.003,0.010]`; selective saturation
    `R 1.00 / G 1.13 / B 1.08`
  - color/tone: exposure `0.07`, contrast `1.025`, saturation `1.08`,
    temperature `-0.055`, tint `-0.018`, gamma `0.965`, toe `0.025`,
    shoulder `0.105`, black point `0.004`
  - split tone: shadow `[0.14,0.42,0.46] @ 0.045`; highlight
    `[0.82,0.94,1.00] @ 0.035`
  - texture/optics: grain `0.16 / 0.78`, vignette `0.075`, bloom `0.04`,
    halation `0.005`
- Confidence: **medium**.

### CineStill 400D Inspired

- Video-derived: brighter warm peach/pink highlights, somewhat stronger
  contrast/saturation, and subtle cool separation in shadows.
- General-reference contribution: daylight balance, warm skin, natural
  saturation, and wide exposure latitude.
- The red halation control is a creative FrameWise interpretation of the
  requested cinematic direction. Strong halation was **not confirmed** in the
  supplied daylight comparison.
- Parameters:
  - RGB: matrix `[1.045,0.005,-0.010, -0.005,1.010,0, -0.010,0.010,1.015]`;
    offset `[0.008,0,-0.004]`; selective saturation
    `R 1.12 / G 1.02 / B 1.035`
  - color/tone: exposure `0.075`, contrast `1.085`, saturation `1.055`,
    temperature `0.035`, tint `0.025`, gamma `0.96`, toe `0.045`,
    shoulder `0.12`, black point `0.012`
  - split tone: shadow `[0.10,0.30,0.44] @ 0.075`; highlight
    `[1.00,0.47,0.25] @ 0.105`
  - texture/optics: grain `0.24 / 0.92`, vignette `0.14`, bloom `0.13`,
    halation `0.32`
- Confidence: **medium** for color/tone; **low** for the halation amount.

### Lomography CN100 Inspired

- Video-derived: vivid yellow/green, strong orange sunset color, punchy
  contrast, and pink/magenta skin tendency.
- General-reference contribution: vivid color, sharpness, and smooth fine-grain
  daylight direction.
- Parameters:
  - RGB: matrix `[1.055,0.015,-0.015, 0,1.045,-0.005, 0.010,-0.010,0.985]`;
    offset `[0.010,0.004,-0.006]`; selective saturation
    `R 1.15 / G 1.12 / B 0.98`
  - color/tone: exposure `0.025`, contrast `1.12`, saturation `1.16`,
    temperature `0.07`, tint `0.045`, gamma `0.97`, toe `0.055`,
    shoulder `0.095`, black point `0.015`
  - split tone: shadow `[0.28,0.23,0.12] @ 0.035`; highlight
    `[1.00,0.56,0.18] @ 0.085`
  - texture/optics: grain `0.23 / 0.90`, vignette `0.12`, bloom `0.075`,
    halation `0.035`
- Confidence: **medium**.

### Harman Phoenix 200 Inspired

- Video-derived: deep blacks, strong contrast, orange/golden vegetation,
  warm pink/red skin, and slightly underexposed character.
- General-reference contribution: strong visible grain, punchy color, limited
  antihalation, possible halation, and scanner dependence.
- Parameters:
  - RGB: matrix `[1.095,0.020,-0.030, 0.015,0.985,-0.015, 0.010,-0.025,0.955]`;
    offset `[0.012,-0.004,-0.012]`; selective saturation
    `R 1.20 / G 0.95 / B 0.88`
  - color/tone: exposure `-0.075`, contrast `1.24`, saturation `1.20`,
    temperature `0.105`, tint `0.055`, gamma `1.055`, toe `0.115`,
    shoulder `0.07`, black point `0.04`
  - split tone: shadow `[0.30,0.17,0.10] @ 0.055`; highlight
    `[1.00,0.43,0.16] @ 0.13`
  - texture/optics: grain `0.44 / 1.22`, vignette `0.18`, bloom `0.085`,
    halation `0.14`
- Confidence: **high** for direction; exact values remain interpretive.

### LomoChrome Purple Inspired

- Video-derived: strong green-to-magenta/purple false color, green movement in
  skin/denim, and strong surreal contrast.
- General-reference contribution: C-41 false-color design inspired by, but not
  equivalent to, infrared film.
- Parameters:
  - RGB: matrix `[0.65,0.55,-0.10, 0.05,0.18,0.50, 0.15,0.62,0.60]`;
    offset `[0.025,-0.008,0.020]`; selective saturation
    `R 1.10 / G 1.34 / B 1.16`
  - color/tone: exposure `-0.01`, contrast `1.19`, saturation `1.30`,
    temperature `-0.015`, tint `0.18`, gamma `1.015`, toe `0.075`,
    shoulder `0.08`, black point `0.024`
  - split tone: shadow `[0.18,0.42,0.36] @ 0.08`; highlight
    `[0.78,0.34,0.92] @ 0.09`
  - texture/optics: grain `0.30 / 1.02`, vignette `0.16`, bloom `0.065`,
    halation `0.025`
- Confidence: **high** for hue direction; lower for exact density/curve.

### RETO Aqua 400 Inspired

- Video-derived: strong aqua/gray-green cast, reduced saturation, darker mids,
  cool skin, and visibly coarse grain.
- General-reference contribution: faded low contrast, icy daylight tone, and
  grainy texture.
- Parameters:
  - RGB: matrix `[0.80,0.075,0.035, -0.025,0.93,0.085, -0.035,0.12,1.035]`;
    offset `[-0.028,0.006,0.028]`; selective saturation
    `R 0.80 / G 0.94 / B 1.06`
  - color/tone: exposure `-0.115`, contrast `0.91`, saturation `0.72`,
    temperature `-0.15`, tint `-0.075`, gamma `1.075`, toe `0.105`,
    shoulder `0.16`, black point `0.022`
  - split tone: shadow `[0.06,0.43,0.48] @ 0.15`; highlight
    `[0.60,0.76,0.70] @ 0.075`
  - texture/optics: grain `0.56 / 1.48`, vignette `0.17`, bloom `0.035`,
    halation `0.008`
- Confidence: **high** for the broad visual direction.

### B&W 400 Inspired

- Video-derived: none; the film is not present in the reference video.
- General-reference contribution: ISO 400, medium-contrast, all-purpose
  black-and-white direction only. This is not an HP5 profile.
- Parameters:
  - RGB: identity matrix and offsets; green-weighted monochrome blend
  - color/tone: exposure `0.005`, contrast `1.15`, saturation `0`,
    gamma `1.015`, toe `0.075`, shoulder `0.10`, black point `0.018`
  - split tone: shadow `[0.12,0.14,0.16] @ 0.018`; highlight
    `[0.92,0.90,0.84] @ 0.02`
  - texture/optics: grain `0.48 / 1.34`, vignette `0.16`, bloom `0.035`,
    halation `0`
- Confidence: **low** as a video-derived preset; **medium** as an independent
  FrameWise black-and-white look.

## Validation checklist

When permission-cleared source scans become available:

1. Use the same negative scanner, profile, exposure, and white-balance workflow.
2. Compare at least three lighting conditions and two skin tones.
3. Re-check black point, highlight shoulder, and grain at 100% view.
4. Separate scanner color from emulsion behavior.
5. Keep every preset name suffixed with `Inspired`.
6. Record each parameter change and update the confidence rating here.
