import { BackSide, Mesh, SphereGeometry, SRGBColorSpace, Texture } from 'three'
import { MeshBasicNodeMaterial } from 'three/webgpu'

export function makeStarfield(map: Texture): Mesh {
  map.colorSpace = SRGBColorSpace
  const mat = new MeshBasicNodeMaterial({ map, depthWrite: false, depthTest: false })
  const mesh = new Mesh(new SphereGeometry(80000, 32, 16), mat)
  mesh.geometry.scale(-1, 1, 1)
  mesh.frustumCulled = false
  mesh.renderOrder = -10
  return mesh
}
