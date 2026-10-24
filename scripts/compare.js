// Build renders/compare.png: reference photos (reference/*) in the top row, renders/* below,
// so one image shows how close the model is to the real thing.
const fs = require('fs')
const path = require('path')
const { chromium } = require('playwright')

const root = path.resolve(__dirname, '..')
const imgs = (dir) => fs.existsSync(dir)
  ? fs.readdirSync(dir).filter((f) => /\.(png|jpe?g|webp)$/i.test(f) && f !== 'compare.png').sort().map((f) => path.join(dir, f))
  : []
const uri = (f) => `data:image/${path.extname(f).slice(1).replace('jpg', 'jpeg')};base64,${fs.readFileSync(f).toString('base64')}`
const row = (title, files) => `<h2>${title}</h2><div class="row">${files.length
  ? files.map((f) => `<figure><img src="${uri(f)}"><figcaption>${path.basename(f)}</figcaption></figure>`).join('')
  : '<p>(none)</p>'}</div>`

;(async () => {
  const html = `<!doctype html><style>
    body{margin:0;padding:16px;font:14px system-ui;background:#fff;width:fit-content}
    h2{margin:8px 0}.row{display:flex;gap:12px;margin-bottom:16px}
    figure{margin:0;text-align:center}img{height:320px;border:1px solid #ccc;object-fit:contain;background:#f4f4f4}
  </style>${row('Reference', imgs(path.join(root, 'reference')))}${row('Model', imgs(path.join(root, 'renders')))}`
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 400, height: 400 } })
  await page.setContent(html)
  const out = path.join(root, 'renders/compare.png')
  await page.screenshot({ path: out, fullPage: true })
  await browser.close()
  console.log(`wrote ${path.relative(root, out)}`)
})().catch((e) => { console.error(e); process.exit(1) })
