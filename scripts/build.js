// Build src/model.js -> out/model.stl
const fs = require('fs')
const path = require('path')
const { serialize } = require('@jscad/stl-serializer')
const { measureBoundingBox } = require('@jscad/modeling').measurements

const modelPath = path.resolve(__dirname, '../src/model.js')
delete require.cache[modelPath]
const { main } = require(modelPath)

const t = Date.now()
const geom = main()
const geoms = Array.isArray(geom) ? geom : [geom]
const data = serialize({ binary: true }, ...geoms)
fs.mkdirSync(path.resolve(__dirname, '../out'), { recursive: true })
const out = path.resolve(__dirname, '../out/model.stl')
fs.writeFileSync(out, Buffer.concat(data.map((d) => Buffer.from(d))))

const [[x0, y0, z0], [x1, y1, z1]] = measureBoundingBox(geoms[0])
const f = (n) => n.toFixed(2)
console.log(`built ${out} in ${Date.now() - t}ms`)
console.log(`bbox (mm): X ${f(x1 - x0)}  Y ${f(y1 - y0)}  Z ${f(z1 - z0)}`)
