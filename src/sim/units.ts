import { Vector3 } from 'three'

export const AU_KM = 149597870.7
export const AU_UNITS = 4000
export const KM_PER_UNIT = AU_KM / AU_UNITS
export const PLANET_EXAG = 80
export const SUN_EXAG = 28
export const GM_SUN = 1.32712440041279419e11
export const SEC_PER_DAY = 86400

export function kmToVisualRadius(radiusKm: number, sun: boolean): number {
  const exag = sun ? SUN_EXAG : PLANET_EXAG
  return (radiusKm * exag) / KM_PER_UNIT
}

export function toVisual(km: Vec3, originKm: Vec3, out: Vector3): Vector3 {
  return out.set(
    (km[0] - originKm[0]) / KM_PER_UNIT,
    (km[1] - originKm[1]) / KM_PER_UNIT,
    (km[2] - originKm[2]) / KM_PER_UNIT,
  )
}

export function visualToKm(v: Vector3, originKm: Vec3, out: Vec3): Vec3 {
  out[0] = v.x * KM_PER_UNIT + originKm[0]
  out[1] = v.y * KM_PER_UNIT + originKm[1]
  out[2] = v.z * KM_PER_UNIT + originKm[2]
  return out
}

export type Vec3 = [number, number, number]

export function v3(a = 0, b = 0, c = 0): Vec3 {
  return [a, b, c]
}

export function mag(v: Vec3): number {
  return Math.hypot(v[0], v[1], v[2])
}

export function addEq(a: Vec3, b: Vec3): void {
  a[0] += b[0]
  a[1] += b[1]
  a[2] += b[2]
}

export function copy(a: Vec3, b: Vec3): void {
  a[0] = b[0]
  a[1] = b[1]
  a[2] = b[2]
}

export function subTo(a: Vec3, b: Vec3, out: Vec3): Vec3 {
  out[0] = a[0] - b[0]
  out[1] = a[1] - b[1]
  out[2] = a[2] - b[2]
  return out
}

export function formatRange(km: number): string {
  if (km >= AU_KM * 0.01) return `${(km / AU_KM).toFixed(3)} AU`
  if (km >= 1000) return `${(km / 1000).toFixed(0)} Mm`
  return `${km.toFixed(0)} km`
}

export function formatSpeed(kmS: number): string {
  const abs = Math.abs(kmS)
  if (abs >= 1e5) return `${(kmS / 299792.458).toFixed(1)} c`
  if (abs >= 100) return `${kmS.toFixed(0)} km/s`
  if (abs >= 1) return `${kmS.toFixed(2)} km/s`
  return `${(kmS * 1000).toFixed(0)} m/s`
}
