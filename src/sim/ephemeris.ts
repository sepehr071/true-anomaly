import { elementsToRv, propagate, type Elements } from './kepler'
import { type Catalog, muFor, type BodyDef } from './catalog'
import { copy, type Vec3, v3 } from './units'

export type BodyState = {
  def: BodyDef
  posKm: Vec3
  velKmS: Vec3
  prevPosKm: Vec3
}

const scratchR = v3()
const scratchV = v3()

export function jdToSeconds(jd: number, epochJd: number): number {
  return (jd - epochJd) * 86400
}

export function nowJd(epochJd: number, simSeconds: number): number {
  return epochJd + simSeconds / 86400
}

export function bodyAt(def: BodyDef, simSeconds: number, catalog: Catalog, outR: Vec3, outV: Vec3): void {
  const mu = muFor(def, catalog)
  const el: Elements = propagate(def.elements, simSeconds, mu)
  elementsToRv(el, mu, outR, outV)
}

export function createStates(catalog: Catalog): BodyState[] {
  return catalog.bodies.map((def) => ({
    def,
    posKm: v3(),
    velKmS: v3(),
    prevPosKm: v3(),
  }))
}

export function stepEphemeris(states: BodyState[], catalog: Catalog, simSeconds: number): void {
  const byId = new Map(states.map((s) => [s.def.id, s]))
  for (const s of states) {
    copy(s.prevPosKm, s.posKm)
    if (!s.def.parent) {
      s.posKm[0] = 0
      s.posKm[1] = 0
      s.posKm[2] = 0
      s.velKmS[0] = 0
      s.velKmS[1] = 0
      s.velKmS[2] = 0
      continue
    }
    bodyAt(s.def, simSeconds, catalog, scratchR, scratchV)
    copy(s.posKm, scratchR)
    copy(s.velKmS, scratchV)
  }
  for (const s of states) {
    if (s.def.parent && s.def.parent !== 'sun') {
      const p = byId.get(s.def.parent)
      if (p) {
        s.posKm[0] += p.posKm[0]
        s.posKm[1] += p.posKm[1]
        s.posKm[2] += p.posKm[2]
        s.velKmS[0] += p.velKmS[0]
        s.velKmS[1] += p.velKmS[1]
        s.velKmS[2] += p.velKmS[2]
      }
    }
  }
}
