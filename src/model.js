// Parametric model. Edit params + geometry, then `npm run loop`.
// Units are millimetres. Z is up.
const { cylinder, cuboid, roundedCylinder } = require('@jscad/modeling').primitives
const { subtract, union } = require('@jscad/modeling').booleans
const { translate } = require('@jscad/modeling').transforms

const params = {
  outerDiameter: 80, // across the top of the lid
  topThickness: 2.5,
  skirtHeight: 12, // how far the lid drops over the container rim
  wallThickness: 2,
  clearance: 0.3, // gap between skirt and container for a slip fit
  gripCount: 24, // ribs around the outside of the skirt
  gripDepth: 0.8,
  segments: 128,
}

function main(p = params) {
  const r = p.outerDiameter / 2
  const totalH = p.topThickness + p.skirtHeight

  const shell = translate([0, 0, totalH / 2],
    roundedCylinder({ radius: r, height: totalH, roundRadius: 1.2, segments: p.segments }))
  const cavity = translate([0, 0, p.skirtHeight / 2 - 0.01],
    cylinder({ radius: r - p.wallThickness - p.clearance, height: p.skirtHeight + 0.02, segments: p.segments }))

  const ribs = []
  for (let i = 0; i < p.gripCount; i++) {
    const a = (i / p.gripCount) * Math.PI * 2
    ribs.push(translate([Math.cos(a) * r, Math.sin(a) * r, totalH / 2],
      cuboid({ size: [p.gripDepth * 2, p.gripDepth * 2, totalH - 3] })))
  }

  return subtract(shell, cavity, ...ribs)
}

module.exports = { main, params }
