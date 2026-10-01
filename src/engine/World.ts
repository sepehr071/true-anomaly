import { Quaternion, Vector3 } from 'three'
import type { Catalog } from '../sim/catalog'
import type { BodyState } from '../sim/ephemeris'
import { v3, type Vec3 } from '../sim/units'

export type CameraMode = 'chase' | 'cockpit'

export class Ship {
  posKm: Vec3 = v3()
  velKmS: Vec3 = v3()
  quat = new Quaternion()
  throttle = 0
  boosting = false
  jumping = false
}

export class World {
  catalog!: Catalog
  bodies: BodyState[] = []
  ship = new Ship()
  selectedId = 'earth'
  frameId = 'earth'
  frameLock = true
  paused = true
  cameraMode: CameraMode = 'chase'
  originKm: Vec3 = v3()
  look = new Vector3()
  reducedMotion = false
  simSeconds = 0
  backend: 'webgpu' | 'webgl' = 'webgpu'

  body(id: string): BodyState | undefined {
    return this.bodies.find((b) => b.def.id === id)
  }

  selected(): BodyState | undefined {
    return this.body(this.selectedId)
  }

  frame(): BodyState | undefined {
    return this.body(this.frameId)
  }
}
