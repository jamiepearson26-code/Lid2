// Render out/model.stl to PNGs from several camera angles using three.js in headless Chromium.
// Usage: node scripts/render.js [views...]   (default: all views)
const fs = require('fs')
const path = require('path')
const { chromium } = require('playwright')

const root = path.resolve(__dirname, '..')
const VIEWS = {
  iso: [1, -1, 0.8],
  front: [0, -1, 0],
  side: [1, 0, 0],
  top: [0, 0, 1],
  bottom: [0, 0, -1],
  'iso-under': [1, -1, -0.8],
}
const SIZE = 800

const html = `<!doctype html><html><body style="margin:0;background:#fff">
<script type="importmap">{"imports":{"three":"/three/build/three.module.js","three/addons/":"/three/examples/jsm/"}}</script>
<script type="module">
import * as THREE from 'three'
import { STLLoader } from 'three/addons/loaders/STLLoader.js'
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true })
renderer.setSize(${SIZE}, ${SIZE})
document.body.appendChild(renderer.domElement)
const scene = new THREE.Scene()
scene.background = new THREE.Color(0xf4f4f4)
scene.add(new THREE.HemisphereLight(0xffffff, 0x666666, 1.6))
const key = new THREE.DirectionalLight(0xffffff, 1.8)
scene.add(key)
const buf = await (await fetch('/model.stl')).arrayBuffer()
const geo = new STLLoader().parse(buf)
geo.computeVertexNormals()
geo.computeBoundingBox()
const box = geo.boundingBox, center = new THREE.Vector3(), size = new THREE.Vector3()
box.getCenter(center); box.getSize(size)
const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0x4a90d9, roughness: 0.55, metalness: 0.05 }))
scene.add(mesh)
scene.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo, 30), new THREE.LineBasicMaterial({ color: 0x1b3a5c })))
const radius = size.length() / 2
const grid = new THREE.GridHelper(Math.ceil(radius * 2.5 / 10) * 10, Math.ceil(radius * 2.5 / 10), 0xbbbbbb, 0xdddddd)
grid.rotation.x = Math.PI / 2; grid.position.z = box.min.z
scene.add(grid)
const cam = new THREE.OrthographicCamera(-radius * 1.15, radius * 1.15, radius * 1.15, -radius * 1.15, 0.1, radius * 20)
window.renderView = (dir) => {
  const d = new THREE.Vector3(...dir).normalize()
  cam.up.set(0, 0, 1)
  if (Math.abs(d.z) > 0.99) cam.up.set(0, 1, 0)
  cam.position.copy(center).addScaledVector(d, radius * 5)
  cam.lookAt(center); cam.updateProjectionMatrix()
  key.position.copy(cam.position).add(new THREE.Vector3(radius, radius, radius * 2))
  grid.visible = d.z > -0.2
  renderer.render(scene, cam)
  return renderer.domElement.toDataURL('image/png')
}
window.modelSize = [size.x, size.y, size.z]
window.ready = true
</script></body></html>`

;(async () => {
  const stl = path.join(root, 'out/model.stl')
  if (!fs.existsSync(stl)) throw new Error('out/model.stl missing — run `npm run build` first')
  const want = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(VIEWS)
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
  const page = await browser.newPage({ viewport: { width: SIZE, height: SIZE } })
  page.on('pageerror', (e) => console.error('page error:', e.message))
  await page.route('http://model.local/**', (route) => {
    const p = new URL(route.request().url()).pathname
    if (p === '/') return route.fulfill({ contentType: 'text/html', body: html })
    if (p === '/model.stl') return route.fulfill({ contentType: 'application/octet-stream', body: fs.readFileSync(stl) })
    if (p.startsWith('/three/')) {
      const f = path.join(root, 'node_modules', p.slice(1))
      return route.fulfill({ contentType: 'text/javascript', body: fs.readFileSync(f) })
    }
    route.fulfill({ status: 404 })
  })
  await page.goto('http://model.local/')
  await page.waitForFunction('window.ready === true', null, { timeout: 30000 })
  fs.mkdirSync(path.join(root, 'renders'), { recursive: true })
  for (const name of want) {
    if (!VIEWS[name]) { console.warn(`unknown view ${name}`); continue }
    const url = await page.evaluate((d) => window.renderView(d), VIEWS[name])
    const file = path.join(root, 'renders', `${name}.png`)
    fs.writeFileSync(file, Buffer.from(url.split(',')[1], 'base64'))
    console.log(`rendered ${path.relative(root, file)}`)
  }
  await browser.close()
})().catch((e) => { console.error(e); process.exit(1) })
