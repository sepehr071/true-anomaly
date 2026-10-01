// Captures the README screenshots from a running dev server.
// Needs Playwright (not a project dependency) and desktop Chrome with WebGPU:
//   npm run dev -- --port 4280 --host 127.0.0.1
//   NODE_PATH=<dir with playwright>/node_modules node scripts/capture-screenshots.cjs [http://127.0.0.1:4280/]
// Chrome runs headed because headless Chrome loses the WebGPU device.
// Each shot places the ship through window.engine instead of flying there by hand.
const { chromium } = require('playwright')
const path = require('path')

const url = process.argv[2] || 'http://127.0.0.1:4280/'
const out = path.join(__dirname, '..', 'docs', 'images')

// body: target id; dist: distance in visual radii; from: [sunward, side, north] mix for the
// viewing direction; aim: [side, north] offset of the aim point in visual radii; cam: chase|cockpit
// (all shots use chase: in cockpit mode the camera sits inside the hull mesh)
const shots = [
  { name: 'hero', body: 'jupiter', dist: 1.9, from: [0.9, 0.3, 0.45], aim: [0.95, -0.35], cam: 'chase' },
  { name: 'jupiter-flyby', body: 'jupiter', dist: 2.5, from: [0.9, 0.6, 0.1], aim: [1.1, 0.15], cam: 'chase' },
  { name: 'mars-approach', body: 'mars', dist: 3.4, from: [1, -0.4, 0.2], aim: [-1.2, 0.1], cam: 'chase' },
  { name: 'sun-approach', body: 'sun', dist: 3.4, from: [0, 1, 0.3], aim: [-2.6, 1.4], cam: 'chase' },
]

function place(s) {
  const w = window.engine.world
  const V = w.look.constructor
  const cam = window.engine.camera
  const b = w.body(s.body)
  const exag = s.body === 'sun' ? 28 : 80
  const visKm = b.def.radiusKm * exag
  const p = new V(...b.posKm)
  const sunward = p.lengthSq() > 0 ? p.clone().negate().normalize() : new V(1, 0, 0)
  const north = new V(0, 0, 1)
  const side = new V().crossVectors(north, sunward).normalize()
  const dir = sunward.clone().multiplyScalar(s.from[0]).addScaledVector(side, s.from[1]).addScaledVector(north, s.from[2]).normalize()
  const pos = p.clone().addScaledVector(dir, visKm * s.dist)
  const aim = p.clone().addScaledVector(side, visKm * s.aim[0]).addScaledVector(north, visKm * s.aim[1])
  const m = cam.matrix.clone()
  m.lookAt(pos, aim, north)
  w.ship.quat.setFromRotationMatrix(m)
  w.ship.posKm[0] = pos.x
  w.ship.posKm[1] = pos.y
  w.ship.posKm[2] = pos.z
  w.ship.velKmS.fill(0)
  w.ship.throttle = 0
  w.selectedId = s.body
  w.frameId = s.body === 'sun' ? 'earth' : s.body
  w.frameLock = s.body !== 'sun'
  w.cameraMode = s.cam
  w.paused = false
}

;(async () => {
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: false,
    args: ['--enable-unsafe-webgpu', '--enable-features=Vulkan'],
  })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 })
  await page.goto(url, { waitUntil: 'domcontentloaded' })
  await page.waitForFunction(() => document.getElementById('hud').classList.contains('ready'), null, { timeout: 60000 })
  await page.waitForTimeout(3000)
  await page.screenshot({ path: path.join(out, 'start-screen.png') })
  for (const s of shots) {
    await page.evaluate(place, s)
    await page.waitForTimeout(2500)
    await page.screenshot({ path: path.join(out, `${s.name}.png`) })
    console.log('saved', s.name)
  }
  await page.close()

  // narrow layout check: HUD collapses to a two-column readout
  const phone = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
  await phone.goto(url, { waitUntil: 'domcontentloaded' })
  await phone.waitForFunction(() => document.getElementById('hud').classList.contains('ready'), null, { timeout: 60000 })
  await phone.evaluate(place, shots.find((s) => s.name === 'jupiter-flyby'))
  await phone.waitForTimeout(3000)
  await phone.screenshot({ path: path.join(out, 'mobile-jupiter.png') })
  console.log('saved mobile-jupiter')
  await browser.close()
})()
