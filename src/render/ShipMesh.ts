import { Color, Group, Mesh, CylinderGeometry, SphereGeometry, ConeGeometry, BoxGeometry } from 'three'
import { MeshStandardNodeMaterial, MeshBasicNodeMaterial } from 'three/webgpu'

export function makeShipMesh(): { root: Group; glow: Mesh[] } {
  const root = new Group()
  const gold = new MeshStandardNodeMaterial({ color: new Color('#c4a882'), roughness: 0.35, metalness: 0.7 })
  const carbon = new MeshStandardNodeMaterial({ color: new Color('#2a2724'), roughness: 0.8, metalness: 0.15 })
  const bus = new MeshStandardNodeMaterial({ color: new Color('#8a847a'), roughness: 0.45, metalness: 0.4 })

  const shield = new Mesh(new CylinderGeometry(0.62, 0.62, 0.08, 48), carbon)
  shield.rotation.x = Math.PI / 2
  shield.position.z = -1.05
  root.add(shield)
  // rim sits inside the shield's thickness so only its edge shows; a flush cap read as a bright disc
  const rim = new Mesh(new CylinderGeometry(0.64, 0.64, 0.02, 48), gold)
  rim.rotation.x = Math.PI / 2
  rim.position.z = -1.05
  root.add(rim)

  const body = new Mesh(new BoxGeometry(0.42, 0.36, 1.55), bus)
  body.position.z = -0.15
  root.add(body)

  const dish = new Mesh(new SphereGeometry(0.28, 16, 12, 0, Math.PI), gold)
  dish.position.set(0, 0.38, 0.15)
  dish.rotation.x = Math.PI / 2
  root.add(dish)

  for (const s of [-1, 1]) {
    const paddle = new Mesh(new BoxGeometry(1.4, 0.04, 0.45), gold)
    paddle.position.set(s * 1.05, 0, 0.05)
    root.add(paddle)
  }

  const glow: Mesh[] = []
  const glowMat = new MeshBasicNodeMaterial({ color: new Color('#7ec8ff') })
  glowMat.toneMapped = false
  for (const s of [-0.12, 0.12]) {
    const nozzle = new Mesh(new ConeGeometry(0.09, 0.28, 10), carbon)
    nozzle.position.set(s, -0.05, 0.78)
    nozzle.rotation.x = Math.PI
    root.add(nozzle)
    const flame = new Mesh(new ConeGeometry(0.07, 0.35, 8), glowMat)
    flame.position.set(s, -0.05, 1.05)
    flame.rotation.x = Math.PI
    root.add(flame)
    glow.push(flame)
  }

  root.scale.setScalar(0.55)
  return { root, glow }
}
