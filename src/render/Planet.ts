import {
  AdditiveBlending,
  Color,
  DoubleSide,
  Mesh,
  RingGeometry,
  SphereGeometry,
  Texture,
} from 'three'
import { MeshBasicNodeMaterial, MeshStandardNodeMaterial } from 'three/webgpu'
import type { BodyDef } from '../sim/catalog'
import { kmToVisualRadius } from '../sim/units'

export type PlanetView = {
  def: BodyDef
  root: Mesh
  setLod: (close: boolean) => void
}

const closeGeo = new SphereGeometry(1, 64, 48)
const farGeo = new SphereGeometry(1, 32, 24)

export function makePlanet(
  def: BodyDef,
  map: Texture,
  extra: { night?: Texture; clouds?: Texture; ring?: Texture; atmosphere?: Texture } = {},
): PlanetView {
  const radius = kmToVisualRadius(def.radiusKm, def.id === 'sun')
  const mat = new MeshStandardNodeMaterial({ map, roughness: 0.9, metalness: 0.02 })
  const root = new Mesh(closeGeo.clone(), mat)
  root.scale.setScalar(radius)
  root.name = def.id

  if (def.id === 'earth' && extra.night) {
    const nightMat = new MeshBasicNodeMaterial({ map: extra.night, transparent: true, opacity: 0.22, depthWrite: false })
    const night = new Mesh(closeGeo.clone(), nightMat)
    night.scale.setScalar(1.001)
    root.add(night)
  }
  if ((def.id === 'earth' || def.id === 'venus') && extra.clouds) {
    const clouds = new Mesh(
      closeGeo.clone(),
      new MeshStandardNodeMaterial({
        map: extra.clouds,
        transparent: true,
        opacity: def.id === 'venus' ? 0.92 : 0.45,
        roughness: 1,
        metalness: 0,
        depthWrite: false,
      }),
    )
    clouds.scale.setScalar(def.id === 'venus' ? 1.02 : 1.008)
    root.add(clouds)
  }
  if (def.id === 'earth' || def.id === 'venus') {
    const air = new MeshBasicNodeMaterial({
      color: new Color(def.id === 'earth' ? '#6ea4d8' : '#e8d2a0'),
      transparent: true,
      opacity: 0.18,
      blending: AdditiveBlending,
      depthWrite: false,
    })
    const shell = new Mesh(closeGeo.clone(), air)
    shell.scale.setScalar(1.035)
    root.add(shell)
  }
  if (def.ring && extra.ring) {
    const inner = radius * 1.2
    const outer = radius * 2.3
    const ring = new Mesh(
      new RingGeometry(inner / radius, outer / radius, 96),
      new MeshStandardNodeMaterial({
        map: extra.ring,
        transparent: true,
        side: DoubleSide,
        roughness: 0.8,
        metalness: 0.05,
        depthWrite: false,
      }),
    )
    ring.rotation.x = Math.PI / 2
    root.add(ring)
  }

  let close = true
  return {
    def,
    root,
    setLod(next: boolean) {
      if (next === close) return
      close = next
      root.geometry = next ? closeGeo : farGeo
    },
  }
}
