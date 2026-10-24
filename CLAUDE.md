# Lid2 — parametric 3D model

Code-CAD project: the model is JavaScript ([JSCAD](https://openjscad.xyz/)) in `src/model.js`,
exported to STL for printing. Units are millimetres, Z is up.

## The loop: build → screenshot → compare → repeat

Never judge the model only from code. After every geometry change:

1. `npm run loop`, which runs:
   - `build`: `src/model.js` → `out/model.stl`, and prints the bounding box in mm
   - `render`: three.js in headless Chromium → `renders/{iso,front,side,top,bottom,iso-under}.png`
   - `compare`: `renders/compare.png`, with the reference photos (`reference/`) above the renders
2. **Look** at `renders/compare.png` (and any single view you need up close) with the Read tool.
3. List concrete differences from the reference: proportions, missing features,
   wrong positions, wrong counts. Check the printed bbox against the measured dimensions.
4. Fix the biggest difference first, change `params` or the geometry, and repeat until it matches.

Render a subset to go faster: `node scripts/render.js iso top`.

## Conventions
- Put every dimension in the `params` object at the top of `src/model.js` with a comment. No magic numbers.
- Real measurements (calipers) beat guesses from photos. Record them in `reference/NOTES.md`.
- Fits need clearance: about 0.2–0.4 mm for FDM slip fits.
- `out/` is gitignored. Commit `renders/` so the progress shows in history.
