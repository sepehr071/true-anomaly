import { Quaternion, Vector3 } from 'three'
import type { Input } from '../engine/Input'
import type { World } from '../engine/World'
import { AU_KM, kmToVisualRadius, KM_PER_UNIT } from '../sim/units'

const MAX_UNITS = 90
const BOOST = 6
const MAX_KMS = MAX_UNITS * KM_PER_UNIT
const DAMP = 3.4
const SENS = 0.003
const YAW = 2.2
const PITCH = 1.8
const ROLL = 2.6

const fwd = new Vector3()
const up = new Vector3()
const target = new Vector3()
const acc = new Vector3()
const qYaw = new Quaternion()
const qPitch = new Quaternion()
const qRoll = new Quaternion()
const axisX = new Vector3(1, 0, 0)
const axisY = new Vector3(0, 1, 0)
const axisZ = new Vector3(0, 0, 1)

export function controlShip(world: World, input: Input, dt: number): void {
  const ship = world.ship
  if (input.tap('KeyX')) {
    ship.velKmS[0] = 0
    ship.velKmS[1] = 0
    ship.velKmS[2] = 0
    ship.throttle = 0
    ship.jumping = false
  }

  const mouse = input.consumeMouse()
  let yaw = -mouse.x * SENS
  let pitch = mouse.y * SENS
  let roll = 0
  if (input.hold('KeyA') || input.hold('ArrowLeft')) yaw += YAW * dt
  if (input.hold('KeyD') || input.hold('ArrowRight')) yaw -= YAW * dt
  if (input.hold('ArrowUp')) pitch -= PITCH * dt
  if (input.hold('ArrowDown')) pitch += PITCH * dt
  if (input.hold('KeyQ')) roll += ROLL * dt
  if (input.hold('KeyE')) roll -= ROLL * dt

  qYaw.setFromAxisAngle(axisY, yaw)
  qPitch.setFromAxisAngle(axisX, pitch)
  qRoll.setFromAxisAngle(axisZ, roll)
  ship.quat.multiply(qYaw).multiply(qPitch).multiply(qRoll).normalize()

  fwd.set(0, 0, -1).applyQuaternion(ship.quat)
  up.set(0, 1, 0).applyQuaternion(ship.quat)

  const jumping = ship.jumping
  ship.boosting = jumping || input.hold('ShiftLeft') || input.hold('ShiftRight') || input.hold('Space')
  const thrust = jumping || input.hold('KeyW') ? 1 : 0
  const reverse = !jumping && input.hold('KeyS') ? 1 : 0
  ship.throttle = thrust

  const max = MAX_KMS * (ship.boosting ? BOOST : 1)
  target.set(0, 0, 0)
  target.addScaledVector(fwd, (thrust - reverse * 0.6) * max)
  if (input.hold('KeyR')) target.addScaledVector(up, max * 0.45)
  if (input.hold('KeyF') || input.hold('ControlLeft')) target.addScaledVector(up, -max * 0.45)

  acc.set(ship.velKmS[0], ship.velKmS[1], ship.velKmS[2])
  acc.lerp(target, 1 - Math.exp(-DAMP * dt))
  const cap = max * 1.05
  if (acc.length() > cap) acc.setLength(cap)
  ship.velKmS[0] = acc.x
  ship.velKmS[1] = acc.y
  ship.velKmS[2] = acc.z
  ship.posKm[0] += ship.velKmS[0] * dt
  ship.posKm[1] += ship.velKmS[1] * dt
  ship.posKm[2] += ship.velKmS[2] * dt
}

export function spawnAtEarth(world: World): void {
  const earth = world.body('earth')
  if (!earth) return
  const sun = world.body('sun')
  const dx = earth.posKm[0] - (sun?.posKm[0] ?? 0)
  const dy = earth.posKm[1] - (sun?.posKm[1] ?? 0)
  const dz = earth.posKm[2] - (sun?.posKm[2] ?? 0)
  const r = Math.hypot(dx, dy, dz) || 1
  const visKm = kmToVisualRadius(earth.def.radiusKm, false) * KM_PER_UNIT
  const offset = Math.max(visKm * 2.6, 0.012 * AU_KM)
  world.ship.posKm[0] = earth.posKm[0] - (dx / r) * offset
  world.ship.posKm[1] = earth.posKm[1] - (dy / r) * offset
  world.ship.posKm[2] = earth.posKm[2] - (dz / r) * offset
  const look = new Vector3(dx, dy, dz).normalize()
  const q = new Quaternion()
  q.setFromUnitVectors(new Vector3(0, 0, -1), look)
  world.ship.quat.copy(q)
  world.selectedId = 'earth'
  world.frameId = 'earth'
}
