import { elementsToRv, solveKepler } from './kepler'
import { AU_KM, GM_SUN, mag, v3 } from './units'

const M = 0.1
const e = 0.0167
const E = solveKepler(M, e)
if (Math.abs(E - e * Math.sin(E) - M) > 1e-10) throw new Error('kepler residual')

const r = v3()
const v = v3()
elementsToRv({ a: 1, e: 0.0167, i: 0, om: 0, w: 102.9, M: 0 }, GM_SUN, r, v)
const au = mag(r) / AU_KM
if (au < 0.98 || au > 1.02) throw new Error(`earth |r| ${au} AU`)

const energy = (mag(v) ** 2) / 2 - GM_SUN / mag(r)
const a = -GM_SUN / (2 * energy) / AU_KM
if (Math.abs(a - 1) > 0.02) throw new Error(`vis-viva a ${a}`)

console.log('kepler.check ok', { au, a, residual: E - e * Math.sin(E) - M })
