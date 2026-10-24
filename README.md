# Lid2

A parametric 3D model built with a **build → screenshot → compare → repeat** loop, so an AI agent
(or you) can iterate on code-CAD by looking at rendered screenshots next to reference photos.

```bash
npm install
npm run loop     # build STL → render 6 views → compare.png
```

- `src/model.js`: the model (JSCAD), with dimensions in `params`
- `reference/`: photos and measurements of the real object
- `renders/`: generated screenshots and `compare.png`
- `out/model.stl`: printable output

See `CLAUDE.md` for the full workflow.
