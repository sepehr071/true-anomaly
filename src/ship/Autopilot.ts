import { Quaternion, Vector3 } from 'three'
import type { World } from '../engine/World'
import { AU_KM, mag, subTo, v3 } from '../sim/units'

const delta = v3()
const to = new Vector3()
const fwd = new Vector3(0, 0, -1)
const q = new Quaternion()

export function stepAutopilot(world: World): void {
  const frame = world.frame()
  if (world.frameLock && frame) {
    delta[0] = frame.posKm[0] - frame.prevPosKm[0]
    delta[1] = frame.posKm[1] - frame.prevPosKm[1]
    delta[2] = frame.posKm[2] - frame.prevPosKm[2]
    world.ship.posKm[0] += delta[0]
    world.ship.posKm[1] += delta[1]
    world.ship.posKm[2] += delta[2]
  }

  const tgt = world.selected()
  if (!tgt || !world.ship.jumping) return
  subTo(tgt.posKm, world.ship.posKm, delta)
  const range = mag(delta)
  if (range < 0.01 * AU_KM) {
    world.ship.jumping = false
    world.ship.throttle = 0
    return
  }
  to.set(delta[0], delta[1], delta[2]).normalize()
  q.setFromUnitVectors(fwd, to)
  world.ship.quat.slerp(q, 0.08)
  world.ship.throttle = 1
  world.ship.boosting = true
}

export function maybeAutoLock(world: World): void {
  if (!world.frameLock) return
  let best = world.frameId
  let bestD = Infinity
  for (const b of world.bodies) {
    if (b.def.id === 'sun') continue
    subTo(b.posKm, world.ship.posKm, delta)
    const d = mag(delta)
    if (d < bestD) {
      bestD = d
      best = b.def.id
    }
  }
  if (bestD < 0.05 * AU_KM) world.frameId = best
}
