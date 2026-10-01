import { AU_KM, GM_SUN, SEC_PER_DAY, type Vec3 } from './units'

export type Elements = {
  a: number
  e: number
  i: number
  om: number
  w: number
  M: number
}

function rad(d: number): number {
  return (d * Math.PI) / 180
}

export function solveKepler(M: number, e: number): number {
  let E = e < 0.8 ? M : Math.PI
  for (let n = 0; n < 12; n++) {
    const f = E - e * Math.sin(E) - M
    const df = 1 - e * Math.cos(E)
    const d = f / df
    E -= d
    if (Math.abs(d) < 1e-12) break
  }
  return E
}

export function elementsToRv(el: Elements, mu: number, outR: Vec3, outV: Vec3): void {
  if (el.a <= 1e-12) {
    outR[0] = 0
    outR[1] = 0
    outR[2] = 0
    outV[0] = 0
    outV[1] = 0
    outV[2] = 0
    return
  }
  const a = el.a * AU_KM
  const e = el.e
  const i = rad(el.i)
  const om = rad(el.om)
  const w = rad(el.w)
  const M = rad(el.M)
  const E = solveKepler(M, e)
  const cosE = Math.cos(E)
  const sinE = Math.sin(E)
  const se = Math.sqrt(Math.max(0, 1 - e * e))
  const xP = a * (cosE - e)
  const yP = a * se * sinE
  const n = Math.sqrt(mu / (a * a * a))
  const rMag = a * (1 - e * cosE)
  const vxP = (-a * n * sinE) / (rMag / a)
  const vyP = (a * n * se * cosE) / (rMag / a)
  const cw = Math.cos(w)
  const sw = Math.sin(w)
  const co = Math.cos(om)
  const so = Math.sin(om)
  const ci = Math.cos(i)
  const si = Math.sin(i)
  const r11 = cw * co - sw * so * ci
  const r12 = -sw * co - cw * so * ci
  const r21 = cw * so + sw * co * ci
  const r22 = -sw * so + cw * co * ci
  const r31 = sw * si
  const r32 = cw * si
  outR[0] = r11 * xP + r12 * yP
  outR[1] = r21 * xP + r22 * yP
  outR[2] = r31 * xP + r32 * yP
  outV[0] = r11 * vxP + r12 * vyP
  outV[1] = r21 * vxP + r22 * vyP
  outV[2] = r31 * vxP + r32 * vyP
}

export function propagate(el: Elements, dtSec: number, mu = GM_SUN): Elements {
  if (el.a <= 1e-12) return el
  const a = el.a * AU_KM
  const n = Math.sqrt(mu / (a * a * a))
  const dM = (n * dtSec * 180) / Math.PI
  let M = (el.M + dM) % 360
  if (M < 0) M += 360
  return { ...el, M }
}

export function periodSec(aAu: number, mu = GM_SUN): number {
  if (aAu <= 1e-12) return 1e15
  const a = aAu * AU_KM
  return 2 * Math.PI * Math.sqrt((a * a * a) / mu)
}

export { SEC_PER_DAY }
