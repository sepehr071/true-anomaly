import { mkdir, writeFile, access } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dataDir = join(root, 'public', 'data')
const texDir = join(root, 'public', 'textures')

const AU_KM = 149597870.7
const GM_SUN = 1.32712440041279419e11 // km^3 / s^2

const PHYS = {
  sun: { name: 'Sun', horizonsId: '10', radiusKm: 695700, flattening: 0, rotationDays: 25.38, obliquityDeg: 7.25, gm: GM_SUN, parent: null, ring: false },
  mercury: { name: 'Mercury', horizonsId: '199', radiusKm: 2440.53, flattening: 0, rotationDays: 58.6462, obliquityDeg: 0.034, gm: 22031.868551, parent: 'sun', ring: false },
  venus: { name: 'Venus', horizonsId: '299', radiusKm: 6051.8, flattening: 0, rotationDays: -243.018, obliquityDeg: 177.36, gm: 324858.592, parent: 'sun', ring: false },
  earth: { name: 'Earth', horizonsId: '399', radiusKm: 6378.1366, flattening: 0.003353, rotationDays: 0.99726968, obliquityDeg: 23.439, gm: 398600.435507, parent: 'sun', ring: false },
  moon: { name: 'Moon', horizonsId: '301', radiusKm: 1737.4, flattening: 0.0012, rotationDays: 27.321661, obliquityDeg: 6.68, gm: 4902.800118, parent: 'earth', ring: false },
  mars: { name: 'Mars', horizonsId: '499', radiusKm: 3396.19, flattening: 0.00589, rotationDays: 1.02595676, obliquityDeg: 25.19, gm: 42828.375816, parent: 'sun', ring: false },
  jupiter: { name: 'Jupiter', horizonsId: '599', radiusKm: 71492, flattening: 0.06487, rotationDays: 0.41354, obliquityDeg: 3.13, gm: 126712764.1, parent: 'sun', ring: false },
  saturn: { name: 'Saturn', horizonsId: '699', radiusKm: 60268, flattening: 0.09796, rotationDays: 0.44401, obliquityDeg: 26.73, gm: 37940584.8418, parent: 'sun', ring: true },
  uranus: { name: 'Uranus', horizonsId: '799', radiusKm: 25559, flattening: 0.02293, rotationDays: -0.71833, obliquityDeg: 97.77, gm: 5794556.4, parent: 'sun', ring: false },
  neptune: { name: 'Neptune', horizonsId: '899', radiusKm: 24764, flattening: 0.01708, rotationDays: 0.67125, obliquityDeg: 28.32, gm: 6836527.10058, parent: 'sun', ring: false },
  pluto: { name: 'Pluto', horizonsId: '999', radiusKm: 1188.3, flattening: 0, rotationDays: -6.3872, obliquityDeg: 122.53, gm: 975.5, parent: 'sun', ring: false },
}

const FALLBACK_EL = {
  sun: { a: 0, e: 0, i: 0, om: 0, w: 0, M: 0 },
  mercury: { a: 0.387098, e: 0.20563, i: 7.0049, om: 48.331, w: 29.124, M: 174.796 },
  venus: { a: 0.723332, e: 0.006772, i: 3.3947, om: 76.68, w: 54.884, M: 50.115 },
  earth: { a: 1.000001, e: 0.016708, i: 0.00005, om: -11.2606, w: 114.2078, M: 358.617 },
  moon: { a: 0.0025696, e: 0.0549, i: 5.145, om: 125.08, w: 318.15, M: 135.27 },
  mars: { a: 1.523679, e: 0.0934, i: 1.85, om: 49.558, w: 286.502, M: 19.373 },
  jupiter: { a: 5.2026, e: 0.0485, i: 1.303, om: 100.464, w: 273.867, M: 20.02 },
  saturn: { a: 9.5549, e: 0.0555, i: 2.485, om: 113.665, w: 339.392, M: 317.02 },
  uranus: { a: 19.2184, e: 0.0464, i: 0.773, om: 74.006, w: 96.998, M: 142.238 },
  neptune: { a: 30.1104, e: 0.0095, i: 1.77, om: 131.784, w: 276.336, M: 256.228 },
  pluto: { a: 39.482, e: 0.2488, i: 17.16, om: 110.3, w: 113.8, M: 14.53 },
}

const TEXTURES = [
  ['2k_sun.jpg', 'sun.jpg'],
  ['2k_mercury.jpg', 'mercury.jpg'],
  ['2k_venus_surface.jpg', 'venus_surface.jpg'],
  ['2k_venus_atmosphere.jpg', 'venus_atmosphere.jpg'],
  ['2k_earth_daymap.jpg', 'earth_day.jpg'],
  ['2k_earth_nightmap.jpg', 'earth_night.jpg'],
  ['2k_earth_clouds.jpg', 'earth_clouds.jpg'],
  ['2k_moon.jpg', 'moon.jpg'],
  ['2k_mars.jpg', 'mars.jpg'],
  ['2k_jupiter.jpg', 'jupiter.jpg'],
  ['2k_saturn.jpg', 'saturn.jpg'],
  ['2k_saturn_ring_alpha.png', 'saturn_ring_alpha.png'],
  ['2k_uranus.jpg', 'uranus.jpg'],
  ['2k_neptune.jpg', 'neptune.jpg'],
  ['2k_stars_milky_way.jpg', 'stars_milky_way.jpg'],
]

function mag(v) {
  return Math.hypot(v[0], v[1], v[2])
}
function dot(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
}
function cross(a, b) {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
}
function sub(a, b) {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
}
function scale(a, s) {
  return [a[0] * s, a[1] * s, a[2] * s]
}
function deg(rad) {
  let d = (rad * 180) / Math.PI
  d %= 360
  if (d < 0) d += 360
  return d
}

function rvToKepler(rKm, vKmS, mu) {
  const rmag = mag(rKm)
  const vmag = mag(vKmS)
  const h = cross(rKm, vKmS)
  const hmag = mag(h)
  if (hmag < 1e-12 || rmag < 1e-12) {
    return { a: rmag / AU_KM, e: 0, i: 0, om: 0, w: 0, M: 0 }
  }
  const n = [-h[1], h[0], 0]
  const nmag = mag(n)
  const vr = dot(rKm, vKmS)
  const evec = scale(sub(scale(rKm, vmag * vmag - mu / rmag), scale(vKmS, vr)), 1 / mu)
  const e = mag(evec)
  const energy = (vmag * vmag) / 2 - mu / rmag
  const a = Math.abs(energy) > 1e-18 ? -mu / (2 * energy) : rmag
  const i = Math.acos(Math.min(1, Math.max(-1, h[2] / hmag)))
  let om = 0
  if (nmag > 1e-12) {
    om = Math.acos(Math.min(1, Math.max(-1, n[0] / nmag)))
    if (n[1] < 0) om = 2 * Math.PI - om
  }
  let w = 0
  if (e > 1e-8 && nmag > 1e-12) {
    w = Math.acos(Math.min(1, Math.max(-1, dot(n, evec) / (nmag * e))))
    if (evec[2] < 0) w = 2 * Math.PI - w
  } else if (e > 1e-8) {
    w = Math.atan2(evec[1], evec[0])
  }
  let nu = 0
  if (e > 1e-8) {
    nu = Math.acos(Math.min(1, Math.max(-1, dot(evec, rKm) / (e * rmag))))
    if (vr < 0) nu = 2 * Math.PI - nu
  } else if (nmag > 1e-12) {
    nu = Math.acos(Math.min(1, Math.max(-1, dot(n, rKm) / (nmag * rmag))))
    if (rKm[2] < 0) nu = 2 * Math.PI - nu
  }
  const se = Math.sqrt(Math.max(0, 1 - e * e))
  const E = 2 * Math.atan2(Math.sqrt(Math.max(0, 1 - e)) * Math.sin(nu / 2), Math.sqrt(1 + e) * Math.cos(nu / 2) + 1e-18)
  const M = E - e * Math.sin(E)
  return { a: a / AU_KM, e, i: deg(i), om: deg(om), w: deg(w), M: deg(M) }
}

function parseVectorBlock(text) {
  const soe = text.indexOf('$$SOE')
  const eoe = text.indexOf('$$EOE')
  if (soe < 0 || eoe < 0) throw new Error('no SOE block')
  const block = text.slice(soe, eoe)
  const num = (k) => {
    const m = block.match(new RegExp(`${k}\\s*=\\s*([+-]?[0-9.]+[Ee][+-]?[0-9]+|[+-]?[0-9.]+)`))
    if (!m) throw new Error(`missing ${k}: ${block.slice(0, 240)}`)
    return Number(m[1])
  }
  return {
    r: [num('X'), num('Y'), num('Z')],
    v: [num('VX'), num('VY'), num('VZ')],
  }
}

async function horizons(command, center, start, stop) {
  const q = new URLSearchParams({
    format: 'json',
    COMMAND: `'${command}'`,
    OBJ_DATA: 'NO',
    MAKE_EPHEM: 'YES',
    EPHEM_TYPE: 'VECTORS',
    CENTER: `'${center}'`,
    START_TIME: `'${start}'`,
    STOP_TIME: `'${stop}'`,
    STEP_SIZE: `'1 d'`,
    VEC_TABLE: '2',
    REF_PLANE: 'ECLIPTIC',
    OUT_UNITS: 'KM-S',
    VEC_LABELS: 'YES',
    CSV_FORMAT: 'NO',
  })
  const url = `https://ssd.jpl.nasa.gov/api/horizons.api?${q}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`horizons ${command} ${res.status}`)
  const json = await res.json()
  const text = json.result || json
  if (typeof text !== 'string') throw new Error('unexpected horizons json')
  return parseVectorBlock(text)
}

function isoDay(d) {
  return d.toISOString().slice(0, 10)
}

function julianDay(d) {
  return d.getTime() / 86400000 + 2440587.5
}

async function exists(p) {
  try {
    await access(p)
    return true
  } catch {
    return false
  }
}

async function download(url, dest) {
  if (await exists(dest)) {
    console.log('skip', dest)
    return
  }
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${url} ${res.status}`)
  const buf = Buffer.from(await res.arrayBuffer())
  await writeFile(dest, buf)
  console.log('got', dest, buf.length)
}

async function main() {
  await mkdir(dataDir, { recursive: true })
  await mkdir(texDir, { recursive: true })

  const start = new Date()
  start.setUTCHours(0, 0, 0, 0)
  const stop = new Date(start.getTime() + 86400000)
  const startStr = isoDay(start)
  const stopStr = isoDay(stop)
  const epochJd = julianDay(start)

  const bodies = []
  for (const [id, phys] of Object.entries(PHYS)) {
    let elements = FALLBACK_EL[id]
    let source = 'fallback-j2000-mean'
    if (id !== 'sun') {
      try {
        const center = phys.parent === 'earth' ? '@399' : '@sun'
        const mu = phys.parent === 'earth' ? PHYS.earth.gm : GM_SUN
        const { r, v } = await horizons(phys.horizonsId, center, startStr, stopStr)
        elements = rvToKepler(r, v, mu)
        source = `horizons-vectors ${startStr}`
        console.log('horizons', id, elements)
        await new Promise((r) => setTimeout(r, 250))
      } catch (err) {
        console.warn('horizons fail', id, err.message)
      }
    }
    bodies.push({ id, ...phys, texture: id, elements, source })
  }

  const catalog = {
    epochJd,
    epochIso: `${startStr}T00:00:00Z`,
    auKm: AU_KM,
    gmSun: GM_SUN,
    bodies,
  }
  await writeFile(join(dataDir, 'bodies.json'), JSON.stringify(catalog, null, 2))
  console.log('wrote bodies.json')

  const sources = [
    '# True Anomaly data sources',
    '',
    'Ephemeris: NASA/JPL Horizons API https://ssd.jpl.nasa.gov/api/horizons.api',
    'Physical parameters: https://ssd.jpl.nasa.gov/planets/phys_par.html',
    'Astrodynamic constants: https://ssd.jpl.nasa.gov/astro_par.html',
    'Planet/sun textures: Solar System Scope (NASA-based, CC BY 4.0) https://www.solarsystemscope.com/textures/',
    'Live solar disk: NASA SDO AIA 171 + HMI Intensitygram https://sdo.gsfc.nasa.gov/',
    '',
  ]
  await writeFile(join(dataDir, 'SOURCES.md'), sources.join('\n'))

  for (const [remote, local] of TEXTURES) {
    const url = `https://www.solarsystemscope.com/textures/download/${remote}`
    try {
      await download(url, join(texDir, local))
    } catch (err) {
      console.warn('texture fail', remote, err.message)
    }
  }
  try {
    await download('https://sdo.gsfc.nasa.gov/assets/img/latest/latest_1024_0171.jpg', join(texDir, 'sdo_aia171.jpg'))
  } catch (err) {
    console.warn('sdo aia fail', err.message)
  }
  try {
    await download('https://sdo.gsfc.nasa.gov/assets/img/latest/latest_1024_HMII.jpg', join(texDir, 'sdo_hmii.jpg'))
  } catch (err) {
    console.warn('sdo hmi fail', err.message)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
