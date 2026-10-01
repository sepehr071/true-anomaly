import { AmbientLight, BufferGeometry, DirectionalLight, Float32BufferAttribute, Line, Vector3 } from 'three'
import { LineBasicNodeMaterial } from 'three/webgpu'
import type { Scene } from 'three'
import type { Catalog } from '../sim/catalog'
import { muFor } from '../sim/catalog'
import { elementsToRv, periodSec, propagate } from '../sim/kepler'
import { kmToVisualRadius, toVisual, type Vec3, v3 } from '../sim/units'
import { makePlanet, type PlanetView } from './Planet'
import { makeSun } from './Sun'
import { makeStarfield } from './Starfield'
import { makeShipMesh } from './ShipMesh'
import { fallbackHex, loadTexture } from './textures'
import type { World } from '../engine/World'

const scratch = new Vector3()
const r = v3()
const vel = v3()

export type SceneBits = {
  planets: Map<string, PlanetView>
  orbits: Map<string, Line>
  ship: ReturnType<typeof makeShipMesh>
  stars: ReturnType<typeof makeStarfield>
  sunLight: DirectionalLight
}

export async function buildScene(scene: Scene, catalog: Catalog): Promise<SceneBits> {
  scene.add(new AmbientLight(0x2a241c, 0.18))
  const sunLight = new DirectionalLight(0xffe1b0, 2.4)
  sunLight.position.set(1, 0, 0)
  scene.add(sunLight)

  const starsTex = await loadTexture('./textures/stars_milky_way.jpg', fallbackHex('stars'))
  const stars = makeStarfield(starsTex)
  scene.add(stars)

  const sunDef = catalog.bodies.find((b) => b.id === 'sun')
  const sunR = sunDef ? kmToVisualRadius(sunDef.radiusKm, true) : 500
  const [photo, aia] = await Promise.all([
    loadTexture('./textures/sun.jpg', fallbackHex('sun')),
    loadTexture('./textures/sdo_aia171.jpg', fallbackHex('sun')),
  ])
  const sun = makeSun(photo, aia, sunR)
  sun.name = 'sun'
  scene.add(sun)

  const planets = new Map<string, PlanetView>()
  if (sunDef) planets.set('sun', { def: sunDef, root: sun, setLod: () => undefined })

  for (const def of catalog.bodies) {
    if (def.id === 'sun') continue
    const file =
      def.id === 'venus' ? 'venus_surface.jpg' : def.id === 'earth' ? 'earth_day.jpg' : `${def.id}.jpg`
    const map = await loadTexture(`./textures/${file}`, fallbackHex(def.id))
    const extra =
      def.id === 'earth'
        ? {
            night: await loadTexture('./textures/earth_night.jpg', 0x041018),
            clouds: await loadTexture('./textures/earth_clouds.jpg', 0xffffff),
          }
        : def.id === 'venus'
          ? { clouds: await loadTexture('./textures/venus_atmosphere.jpg', 0xc4a56a) }
          : def.id === 'saturn'
            ? { ring: await loadTexture('./textures/saturn_ring_alpha.png', 0xc8b490) }
            : {}
    const view = makePlanet(def, map, extra)
    scene.add(view.root)
    planets.set(def.id, view)
  }

  const orbits = new Map<string, Line>()
  const orbitMat = new LineBasicNodeMaterial({ color: 0x8a7038, transparent: true, opacity: 0.35 })
  for (const def of catalog.bodies) {
    if (!def.parent) continue
    const geo = new BufferGeometry()
    geo.setAttribute('position', new Float32BufferAttribute(new Float32Array(65 * 3), 3))
    const line = new Line(geo, orbitMat)
    line.frustumCulled = false
    scene.add(line)
    orbits.set(def.id, line)
  }

  const ship = makeShipMesh()
  scene.add(ship.root)
  return { planets, orbits, ship, stars, sunLight }
}

export function syncScene(world: World, bits: SceneBits, origin: Vec3): void {
  const byId = new Map(world.bodies.map((b) => [b.def.id, b]))
  for (const b of world.bodies) {
    const view = bits.planets.get(b.def.id)
    if (!view) continue
    toVisual(b.posKm, origin, scratch)
    view.root.position.copy(scratch)
    const days = b.def.rotationDays || 1
    view.root.rotation.x = (b.def.obliquityDeg * Math.PI) / 180
    view.root.rotation.y = (world.simSeconds / (days * 86400)) * Math.PI * 2
    view.setLod(scratch.length() < 400)
  }

  toVisual(world.ship.posKm, origin, scratch)
  bits.ship.root.position.copy(scratch)
  bits.ship.root.quaternion.copy(world.ship.quat)
  const glowScale = 0.25 + world.ship.throttle * (world.ship.boosting ? 1.8 : 1)
  for (const g of bits.ship.glow) g.scale.setScalar(Math.max(0.05, glowScale))
  bits.stars.position.copy(scratch)
  const sun = bits.planets.get('sun')
  if (sun) bits.sunLight.position.copy(sun.root.position).normalize().multiplyScalar(200)

  for (const [id, line] of bits.orbits) {
    const def = world.catalog.bodies.find((d) => d.id === id)
    if (!def) continue
    const attr = line.geometry.getAttribute('position')
    const mu = muFor(def, world.catalog)
    const period = periodSec(def.elements.a, mu)
    const parent = def.parent && def.parent !== 'sun' ? byId.get(def.parent) : undefined
    for (let i = 0; i <= 64; i++) {
      const t = (i / 64) * period
      const el = propagate(def.elements, t, mu)
      elementsToRv(el, mu, r, vel)
      if (parent) {
        r[0] += parent.posKm[0]
        r[1] += parent.posKm[1]
        r[2] += parent.posKm[2]
      }
      toVisual(r, origin, scratch)
      attr.setXYZ(i, scratch.x, scratch.y, scratch.z)
    }
    attr.needsUpdate = true
  }
}
