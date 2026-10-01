import {
  AdditiveBlending,
  Color,
  Mesh,
  PointLight,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  Texture,
} from 'three'
import { MeshBasicNodeMaterial } from 'three/webgpu'
import { cameraPosition, float, normalWorld, positionWorld, vec3 } from 'three/tsl'

export function makeSun(photosphere: Texture, aia: Texture | null, radius: number): Mesh {
  const geo = new SphereGeometry(radius, 64, 48)
  const mat = new MeshBasicNodeMaterial({ map: photosphere })
  mat.toneMapped = false
  const mesh = new Mesh(geo, mat)
  mesh.frustumCulled = false

  const rim = new MeshBasicNodeMaterial()
  rim.transparent = true
  rim.depthWrite = false
  rim.blending = AdditiveBlending
  rim.toneMapped = false
  const view = cameraPosition.sub(positionWorld).normalize()
  const falloff = float(1).sub(normalWorld.dot(view).abs()).clamp(0, 1).pow(2.4)
  rim.colorNode = vec3(1.55, 0.78, 0.22).mul(falloff.mul(float(2.6)))
  const corona = new Mesh(new SphereGeometry(radius * 1.12, 48, 32), rim)
  corona.renderOrder = 2
  mesh.add(corona)

  if (aia) {
    const sprite = new Sprite(
      new SpriteMaterial({
        map: aia,
        blending: AdditiveBlending,
        depthWrite: false,
        transparent: true,
        color: new Color('#f4c070'),
        opacity: 0.55,
        toneMapped: false,
      }),
    )
    sprite.scale.setScalar(radius * 2.35)
    sprite.renderOrder = 1
    mesh.add(sprite)
  }

  const light = new PointLight(0xffd8a0, 2.2, 0, 0)
  light.intensity = 2.4
  mesh.add(light)
  return mesh
}
