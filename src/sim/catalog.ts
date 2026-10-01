import type { Elements } from './kepler'
import { GM_SUN } from './units'

export type BodyDef = {
  id: string
  name: string
  horizonsId: string
  radiusKm: number
  flattening: number
  rotationDays: number
  obliquityDeg: number
  gm: number
  parent: string | null
  ring: boolean
  texture: string
  elements: Elements
  source: string
}

export type Catalog = {
  epochJd: number
  epochIso: string
  auKm: number
  gmSun: number
  bodies: BodyDef[]
}

export async function loadCatalog(): Promise<Catalog> {
  const res = await fetch('./data/bodies.json')
  if (!res.ok) throw new Error('missing public/data/bodies.json — run npm run bake')
  const cat = (await res.json()) as Catalog
  if (!cat.bodies?.length) throw new Error('empty catalog')
  cat.gmSun = cat.gmSun || GM_SUN
  return cat
}

export function muFor(def: BodyDef, catalog: Catalog): number {
  if (!def.parent || def.parent === 'sun') return catalog.gmSun
  const parent = catalog.bodies.find((b) => b.id === def.parent)
  return parent?.gm ?? catalog.gmSun
}
